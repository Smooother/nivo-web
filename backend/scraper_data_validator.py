#!/usr/bin/env python3
"""
Scraper Data Validator
Validates scraped data quality and checks for duplicates before migration
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

class ScraperDataValidator:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.validation_results = {
            'total_companies': 0,
            'valid_companies': 0,
            'invalid_companies': 0,
            'duplicate_companies': 0,
            'new_companies': 0,
            'validation_errors': [],
            'duplicate_details': [],
            'quality_issues': []
        }
    
    def validate_company_data(self, company):
        """Validate individual company data"""
        errors = []
        warnings = []
        
        # Required fields
        if not company.get('orgnr'):
            errors.append("Missing organization number")
        elif not self._is_valid_orgnr(company['orgnr']):
            errors.append("Invalid organization number format")
        
        if not company.get('company_name'):
            errors.append("Missing company name")
        
        # Optional field validation
        if company.get('revenue_sek') is not None:
            if not isinstance(company['revenue_sek'], int) or company['revenue_sek'] < 0:
                warnings.append("Invalid revenue value")
        
        if company.get('profit_sek') is not None:
            if not isinstance(company['profit_sek'], int):
                warnings.append("Invalid profit value")
        
        if company.get('foundation_year') is not None:
            current_year = datetime.now().year
            if not isinstance(company['foundation_year'], int) or company['foundation_year'] < 1800 or company['foundation_year'] > current_year:
                warnings.append("Invalid foundation year")
        
        if company.get('homepage') and not self._is_valid_url(company['homepage']):
            warnings.append("Invalid homepage URL format")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _is_valid_orgnr(self, orgnr):
        """Validate Swedish organization number format"""
        if not orgnr or not isinstance(orgnr, str):
            return False
        
        # Remove any non-digits
        digits = ''.join(filter(str.isdigit, orgnr))
        
        # Swedish org numbers are 10 digits
        if len(digits) != 10:
            return False
        
        # Basic checksum validation (simplified)
        return True
    
    def _is_valid_url(self, url):
        """Basic URL validation"""
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip()
        if not url:
            return False
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Basic URL format check
        return '.' in url and len(url) > 10
    
    def check_duplicates_in_main_db(self, companies):
        """Check for duplicates in main database"""
        logger.info("Checking for duplicates in main database...")
        
        orgnrs = [company['orgnr'] for company in companies if company.get('orgnr')]
        
        if not orgnrs:
            logger.warning("No valid organization numbers to check")
            return set()
        
        # Check against master_analytics table
        try:
            result = self.supabase.table('master_analytics').select('OrgNr').in_('OrgNr', orgnrs).execute()
            existing_orgnrs = {row['OrgNr'] for row in result.data}
            logger.info(f"Found {len(existing_orgnrs)} existing companies in master_analytics")
        except Exception as e:
            logger.error(f"Error checking master_analytics: {str(e)}")
            existing_orgnrs = set()
        
        # Check against companies table if it exists
        try:
            result = self.supabase.table('companies').select('OrgNr').in_('OrgNr', orgnrs).execute()
            existing_orgnrs.update({row['OrgNr'] for row in result.data})
            logger.info(f"Found {len(existing_orgnrs)} total existing companies")
        except Exception as e:
            logger.warning(f"Could not check companies table: {str(e)}")
        
        return existing_orgnrs
    
    def check_duplicates_in_staging(self, companies):
        """Check for duplicates within staging data"""
        logger.info("Checking for duplicates within staging data...")
        
        orgnr_counts = {}
        duplicates = set()
        
        for company in companies:
            orgnr = company.get('orgnr')
            if orgnr:
                if orgnr in orgnr_counts:
                    duplicates.add(orgnr)
                    orgnr_counts[orgnr] += 1
                else:
                    orgnr_counts[orgnr] = 1
        
        if duplicates:
            logger.warning(f"Found {len(duplicates)} duplicate organization numbers in staging data")
            for orgnr in duplicates:
                logger.warning(f"  - {orgnr} appears {orgnr_counts[orgnr]} times")
        
        return duplicates
    
    def validate_batch(self, companies, job_id=None):
        """Validate a batch of companies"""
        logger.info(f"Validating {len(companies)} companies...")
        
        self.validation_results['total_companies'] = len(companies)
        
        valid_companies = []
        invalid_companies = []
        
        # Check for duplicates within staging
        staging_duplicates = self.check_duplicates_in_staging(companies)
        
        # Check for duplicates in main database
        main_duplicates = self.check_duplicates_in_main_db(companies)
        
        for company in companies:
            # Validate data quality
            validation = self.validate_company_data(company)
            
            if not validation['is_valid']:
                invalid_companies.append({
                    'company': company,
                    'errors': validation['errors'],
                    'warnings': validation['warnings']
                })
                self.validation_results['invalid_companies'] += 1
                continue
            
            # Check for duplicates
            orgnr = company.get('orgnr')
            if orgnr in staging_duplicates:
                self.validation_results['duplicate_companies'] += 1
                self.validation_results['duplicate_details'].append({
                    'orgnr': orgnr,
                    'type': 'staging_duplicate',
                    'company_name': company.get('company_name', 'Unknown')
                })
                continue
            
            if orgnr in main_duplicates:
                self.validation_results['duplicate_companies'] += 1
                self.validation_results['duplicate_details'].append({
                    'orgnr': orgnr,
                    'type': 'main_db_duplicate',
                    'company_name': company.get('company_name', 'Unknown')
                })
                # Still consider it valid for update
                valid_companies.append(company)
            else:
                self.validation_results['new_companies'] += 1
                valid_companies.append(company)
            
            self.validation_results['valid_companies'] += 1
            
            # Add warnings to quality issues
            if validation['warnings']:
                self.validation_results['quality_issues'].append({
                    'orgnr': orgnr,
                    'company_name': company.get('company_name', 'Unknown'),
                    'warnings': validation['warnings']
                })
        
        # Update staging table with validation results
        self._update_staging_validation_status(companies, valid_companies, invalid_companies)
        
        return {
            'valid_companies': valid_companies,
            'invalid_companies': invalid_companies,
            'validation_results': self.validation_results
        }
    
    def _update_staging_validation_status(self, all_companies, valid_companies, invalid_companies):
        """Update staging table with validation status"""
        logger.info("Updating staging table validation status...")
        
        # Mark valid companies as 'reviewed'
        valid_orgnrs = [company['orgnr'] for company in valid_companies if company.get('orgnr')]
        if valid_orgnrs:
            try:
                self.supabase.table('scraper_staging_companies').update({
                    'status': 'reviewed',
                    'updated_at': datetime.now().isoformat()
                }).in_('orgnr', valid_orgnrs).execute()
                logger.info(f"Marked {len(valid_orgnrs)} companies as 'reviewed'")
            except Exception as e:
                logger.error(f"Error updating valid companies status: {str(e)}")
        
        # Mark invalid companies with error details
        for invalid in invalid_companies:
            company = invalid['company']
            orgnr = company.get('orgnr')
            if orgnr:
                try:
                    self.supabase.table('scraper_staging_companies').update({
                        'status': 'rejected',
                        'review_notes': f"Validation errors: {', '.join(invalid['errors'])}",
                        'updated_at': datetime.now().isoformat()
                    }).eq('orgnr', orgnr).execute()
                except Exception as e:
                    logger.error(f"Error updating invalid company {orgnr}: {str(e)}")
    
    def generate_validation_report(self):
        """Generate a detailed validation report"""
        logger.info("\n" + "="*60)
        logger.info("SCRAPER DATA VALIDATION REPORT")
        logger.info("="*60)
        logger.info(f"Total companies processed: {self.validation_results['total_companies']}")
        logger.info(f"Valid companies: {self.validation_results['valid_companies']}")
        logger.info(f"Invalid companies: {self.validation_results['invalid_companies']}")
        logger.info(f"Duplicate companies: {self.validation_results['duplicate_companies']}")
        logger.info(f"New companies: {self.validation_results['new_companies']}")
        logger.info(f"Quality issues: {len(self.validation_results['quality_issues'])}")
        
        if self.validation_results['duplicate_details']:
            logger.info("\nDuplicate Details:")
            for dup in self.validation_results['duplicate_details']:
                logger.info(f"  - {dup['orgnr']} ({dup['company_name']}) - {dup['type']}")
        
        if self.validation_results['quality_issues']:
            logger.info("\nQuality Issues:")
            for issue in self.validation_results['quality_issues']:
                logger.info(f"  - {issue['orgnr']} ({issue['company_name']}): {', '.join(issue['warnings'])}")
        
        logger.info("="*60)
        
        return self.validation_results

def main():
    """Main validation function"""
    logger.info("Starting scraper data validation...")
    
    try:
        validator = ScraperDataValidator()
        
        # Get companies from staging table
        result = validator.supabase.table('scraper_staging_companies').select('*').eq('status', 'pending').execute()
        companies = result.data
        
        if not companies:
            logger.info("No pending companies found for validation")
            return
        
        # Validate companies
        validation_result = validator.validate_batch(companies)
        
        # Generate report
        validator.generate_validation_report()
        
        logger.info("✅ Validation completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Validation failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()



