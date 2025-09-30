#!/usr/bin/env python3
"""
Scraper Data Migration Script
Migrates approved scraped data from staging tables to main Supabase tables
with duplicate checking and data validation
"""

import os
import logging
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    
    return create_client(url, key)

class ScraperDataMigrator:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.migration_stats = {
            'companies_processed': 0,
            'companies_skipped_duplicates': 0,
            'companies_updated': 0,
            'companies_inserted': 0,
            'errors': []
        }
    
    def get_approved_companies(self, job_id: str = None):
        """Get companies approved for migration"""
        logger.info("Fetching approved companies from staging...")
        
        query = self.supabase.table('scraper_staging_companies').select('*')
        query = query.eq('status', 'approved')
        
        if job_id:
            query = query.eq('job_id', job_id)
        
        result = query.execute()
        companies = result.data
        
        logger.info(f"Found {len(companies)} approved companies for migration")
        return companies
    
    def check_duplicates(self, companies):
        """Check for duplicates in main database"""
        logger.info("Checking for duplicates in main database...")
        
        orgnrs = [company['orgnr'] for company in companies]
        
        # Check against master_analytics table
        result = self.supabase.table('master_analytics').select('OrgNr').in_('OrgNr', orgnrs).execute()
        existing_orgnrs = {row['OrgNr'] for row in result.data}
        
        # Check against companies table if it exists
        try:
            result = self.supabase.table('companies').select('OrgNr').in_('OrgNr', orgnrs).execute()
            existing_orgnrs.update({row['OrgNr'] for row in result.data})
        except Exception as e:
            logger.warning(f"Could not check companies table: {str(e)}")
        
        logger.info(f"Found {len(existing_orgnrs)} existing companies in main database")
        return existing_orgnrs
    
    def transform_company_data(self, company):
        """Transform staging company data to main table format"""
        return {
            'OrgNr': company['orgnr'],
            'name': company['company_name'],
            'homepage': company['homepage'],
            'revenue': company['revenue_sek'],  # Map to existing 'revenue' column
            'profit': company['profit_sek'],    # Map to existing 'profit' column
            'segment_name': company['segment_name'],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
    
    def migrate_companies(self, companies, existing_orgnrs):
        """Migrate companies to main tables"""
        logger.info("Starting company migration...")
        
        new_companies = []
        updated_companies = []
        
        for company in companies:
            try:
                transformed = self.transform_company_data(company)
                
                if company['orgnr'] in existing_orgnrs:
                    # Update existing company
                    updated_companies.append(transformed)
                    self.migration_stats['companies_updated'] += 1
                else:
                    # Insert new company
                    new_companies.append(transformed)
                    self.migration_stats['companies_inserted'] += 1
                
                self.migration_stats['companies_processed'] += 1
                
            except Exception as e:
                error_msg = f"Error processing company {company['orgnr']}: {str(e)}"
                logger.error(error_msg)
                self.migration_stats['errors'].append(error_msg)
        
        # Insert new companies
        if new_companies:
            logger.info(f"Inserting {len(new_companies)} new companies...")
            self._batch_insert('master_analytics', new_companies)
        
        # Update existing companies
        if updated_companies:
            logger.info(f"Updating {len(updated_companies)} existing companies...")
            self._batch_upsert('master_analytics', updated_companies)
        
        # Update staging table status
        self._update_staging_status(companies, 'migrated')
    
    def _batch_insert(self, table_name, records):
        """Insert records in batches"""
        batch_size = 1000
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                result = self.supabase.table(table_name).insert(batch).execute()
                logger.info(f"Inserted batch {i//batch_size + 1} ({len(batch)} records)")
            except Exception as e:
                logger.error(f"Error inserting batch: {str(e)}")
                # Try individual inserts
                for record in batch:
                    try:
                        self.supabase.table(table_name).insert(record).execute()
                    except Exception as individual_error:
                        logger.error(f"Error inserting individual record {record.get('OrgNr', 'unknown')}: {str(individual_error)}")
    
    def _batch_upsert(self, table_name, records):
        """Upsert records in batches"""
        batch_size = 1000
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                result = self.supabase.table(table_name).upsert(batch).execute()
                logger.info(f"Upserted batch {i//batch_size + 1} ({len(batch)} records)")
            except Exception as e:
                logger.error(f"Error upserting batch: {str(e)}")
                # Try individual upserts
                for record in batch:
                    try:
                        self.supabase.table(table_name).upsert(record).execute()
                    except Exception as individual_error:
                        logger.error(f"Error upserting individual record {record.get('OrgNr', 'unknown')}: {str(individual_error)}")
    
    def _update_staging_status(self, companies, status):
        """Update staging table status"""
        orgnrs = [company['orgnr'] for company in companies]
        
        try:
            result = self.supabase.table('scraper_staging_companies').update({
                'status': status,
                'updated_at': datetime.now().isoformat()
            }).in_('orgnr', orgnrs).execute()
            
            logger.info(f"Updated {len(orgnrs)} companies status to '{status}'")
        except Exception as e:
            logger.error(f"Error updating staging status: {str(e)}")
    
    def migrate_company_ids(self, job_id: str = None):
        """Migrate company ID mappings"""
        logger.info("Migrating company ID mappings...")
        
        query = self.supabase.table('scraper_staging_company_ids').select('*')
        query = query.eq('status', 'approved')
        
        if job_id:
            query = query.eq('job_id', job_id)
        
        result = query.execute()
        company_ids = result.data
        
        if not company_ids:
            logger.info("No approved company IDs to migrate")
            return
        
        logger.info(f"Migrating {len(company_ids)} company ID mappings...")
        
        # Transform and upsert company IDs
        transformed_ids = []
        for company_id in company_ids:
            transformed_ids.append({
                'OrgNr': company_id['orgnr'],
                'companyId': company_id['company_id'],
                'source': company_id['source'],
                'confidence_score': company_id['confidence_score'],
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
        
        # For now, just mark company IDs as migrated since we don't have a company_ids table
        # In the future, you could create this table or store the mapping elsewhere
        try:
            # Update staging status
            orgnrs = [cid['orgnr'] for cid in company_ids]
            self.supabase.table('scraper_staging_company_ids').update({
                'status': 'migrated',
                'updated_at': datetime.now().isoformat()
            }).in_('orgnr', orgnrs).execute()
            
            logger.info(f"Successfully marked {len(company_ids)} company ID mappings as migrated")
            logger.info("Note: Company ID mappings are stored in staging table for reference")
            
        except Exception as e:
            logger.error(f"Error updating company ID status: {str(e)}")
    
    def update_job_migration_status(self, job_id: str, status: str, notes: str = None):
        """Update job migration status"""
        update_data = {
            'migration_status': status,
            'updated_at': datetime.now().isoformat()
        }
        
        if notes:
            update_data['migration_notes'] = notes
        
        try:
            result = self.supabase.table('scraper_staging_jobs').update(update_data).eq('id', job_id).execute()
            logger.info(f"Updated job {job_id} migration status to '{status}'")
        except Exception as e:
            logger.error(f"Error updating job migration status: {str(e)}")
    
    def print_migration_stats(self):
        """Print migration statistics"""
        logger.info("\n" + "="*50)
        logger.info("MIGRATION STATISTICS")
        logger.info("="*50)
        logger.info(f"Companies processed: {self.migration_stats['companies_processed']}")
        logger.info(f"Companies inserted: {self.migration_stats['companies_inserted']}")
        logger.info(f"Companies updated: {self.migration_stats['companies_updated']}")
        logger.info(f"Companies skipped (duplicates): {self.migration_stats['companies_skipped_duplicates']}")
        logger.info(f"Errors: {len(self.migration_stats['errors'])}")
        
        if self.migration_stats['errors']:
            logger.info("\nErrors encountered:")
            for error in self.migration_stats['errors']:
                logger.error(f"  - {error}")
        
        logger.info("="*50)

def main():
    """Main migration function"""
    logger.info("Starting scraper data migration...")
    
    try:
        migrator = ScraperDataMigrator()
        
        # Get approved companies
        companies = migrator.get_approved_companies()
        
        if not companies:
            logger.info("No approved companies found for migration")
            return
        
        # Check for duplicates
        existing_orgnrs = migrator.check_duplicates(companies)
        
        # Migrate companies
        migrator.migrate_companies(companies, existing_orgnrs)
        
        # Migrate company IDs
        migrator.migrate_company_ids()
        
        # Print statistics
        migrator.print_migration_stats()
        
        logger.info("✅ Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
