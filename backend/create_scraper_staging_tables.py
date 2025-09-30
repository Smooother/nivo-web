#!/usr/bin/env python3
"""
Create temporary staging tables in Supabase for scraper data
This allows for data review and controlled migration to main tables
"""

import os
import logging
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

def create_staging_tables(supabase: Client):
    """Create staging tables for scraper data"""
    
    # SQL to create staging tables
    staging_tables_sql = [
        """
        -- Staging table for raw scraped companies
        CREATE TABLE IF NOT EXISTS scraper_staging_companies (
            orgnr VARCHAR(16) PRIMARY KEY,
            company_name TEXT NOT NULL,
            company_id VARCHAR(32),
            company_id_hint VARCHAR(32),
            homepage TEXT,
            nace_categories JSONB DEFAULT '[]'::jsonb,
            segment_name JSONB DEFAULT '[]'::jsonb,
            revenue_sek INTEGER,
            profit_sek INTEGER,
            foundation_year INTEGER,
            company_accounts_last_year VARCHAR(8),
            scraped_at TIMESTAMP DEFAULT NOW(),
            job_id VARCHAR(36),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'migrated')),
            review_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        """
        -- Staging table for company ID mappings
        CREATE TABLE IF NOT EXISTS scraper_staging_company_ids (
            orgnr VARCHAR(16) PRIMARY KEY,
            company_id VARCHAR(32) NOT NULL,
            source VARCHAR(32) DEFAULT 'scraper' NOT NULL,
            confidence_score DECIMAL(3,2) DEFAULT 1.0,
            scraped_at TIMESTAMP DEFAULT NOW(),
            job_id VARCHAR(36),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'migrated')),
            review_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        """
        -- Staging table for scraping jobs
        CREATE TABLE IF NOT EXISTS scraper_staging_jobs (
            id VARCHAR(36) PRIMARY KEY,
            job_type VARCHAR(32) NOT NULL,
            filter_hash VARCHAR(64) NOT NULL,
            params JSONB NOT NULL,
            status VARCHAR(16) DEFAULT 'running' NOT NULL,
            last_page INTEGER DEFAULT 0 NOT NULL,
            processed_count INTEGER DEFAULT 0 NOT NULL,
            total_companies INTEGER DEFAULT 0,
            error TEXT,
            migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed')),
            migration_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        """
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_status ON scraper_staging_companies(status);
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_job_id ON scraper_staging_companies(job_id);
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_scraped_at ON scraper_staging_companies(scraped_at);
        
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_company_ids_status ON scraper_staging_company_ids(status);
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_company_ids_job_id ON scraper_staging_company_ids(job_id);
        
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_jobs_migration_status ON scraper_staging_jobs(migration_status);
        CREATE INDEX IF NOT EXISTS idx_scraper_staging_jobs_status ON scraper_staging_jobs(status);
        """,
        
        """
        -- Create a view for easy review of pending data
        CREATE OR REPLACE VIEW scraper_pending_review AS
        SELECT 
            c.orgnr,
            c.company_name,
            c.revenue_sek,
            c.profit_sek,
            c.foundation_year,
            c.nace_categories,
            c.segment_name,
            c.homepage,
            c.scraped_at,
            c.job_id,
            c.status,
            c.review_notes,
            j.params as job_params,
            j.job_type,
            j.created_at as job_created_at
        FROM scraper_staging_companies c
        LEFT JOIN scraper_staging_jobs j ON c.job_id = j.id
        WHERE c.status IN ('pending', 'reviewed')
        ORDER BY c.scraped_at DESC;
        """,
        
        """
        -- Create a view for migration statistics
        CREATE OR REPLACE VIEW scraper_migration_stats AS
        SELECT 
            j.id as job_id,
            j.job_type,
            j.created_at as job_created_at,
            j.total_companies,
            COUNT(c.orgnr) as companies_scraped,
            COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_review,
            COUNT(CASE WHEN c.status = 'reviewed' THEN 1 END) as reviewed,
            COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN c.status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN c.status = 'migrated' THEN 1 END) as migrated,
            j.migration_status,
            j.migration_notes
        FROM scraper_staging_jobs j
        LEFT JOIN scraper_staging_companies c ON j.id = c.job_id
        GROUP BY j.id, j.job_type, j.created_at, j.total_companies, j.migration_status, j.migration_notes
        ORDER BY j.created_at DESC;
        """
    ]
    
    logger.info("Creating staging tables in Supabase...")
    
    for i, sql in enumerate(staging_tables_sql, 1):
        try:
            logger.info(f"Executing SQL {i}/{len(staging_tables_sql)}...")
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
            logger.info(f"✅ SQL {i} executed successfully")
        except Exception as e:
            logger.error(f"❌ Error executing SQL {i}: {str(e)}")
            # Try alternative approach using direct SQL execution
            try:
                # This might work depending on Supabase setup
                supabase.postgrest.rpc('exec_sql', {'sql': sql}).execute()
                logger.info(f"✅ SQL {i} executed successfully (alternative method)")
            except Exception as e2:
                logger.error(f"❌ Alternative method also failed: {str(e2)}")
                logger.info(f"SQL to execute manually:\n{sql}")
    
    logger.info("Staging tables creation completed")

def verify_staging_tables(supabase: Client):
    """Verify that staging tables were created successfully"""
    logger.info("Verifying staging tables...")
    
    tables_to_check = [
        'scraper_staging_companies',
        'scraper_staging_company_ids', 
        'scraper_staging_jobs'
    ]
    
    views_to_check = [
        'scraper_pending_review',
        'scraper_migration_stats'
    ]
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select('*').limit(1).execute()
            logger.info(f"✅ Table {table} exists and is accessible")
        except Exception as e:
            logger.error(f"❌ Table {table} not accessible: {str(e)}")
    
    for view in views_to_check:
        try:
            result = supabase.table(view).select('*').limit(1).execute()
            logger.info(f"✅ View {view} exists and is accessible")
        except Exception as e:
            logger.error(f"❌ View {view} not accessible: {str(e)}")

def main():
    """Main function to create staging tables"""
    logger.info("Starting staging tables creation...")
    
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        logger.info("Supabase client initialized")
        
        # Create staging tables
        create_staging_tables(supabase)
        
        # Verify tables were created
        verify_staging_tables(supabase)
        
        logger.info("✅ Staging tables setup completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Staging tables setup failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()



