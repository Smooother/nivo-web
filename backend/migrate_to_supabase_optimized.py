#!/usr/bin/env python3
"""
Migrate optimized database structure to Supabase
Exports master_analytics from SQLite and imports to Supabase
"""

import sqlite3
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    return create_client(url, key)

def export_master_analytics_from_sqlite():
    """Export master_analytics table from SQLite"""
    logger.info("Exporting master_analytics from SQLite...")
    
    # Connect to SQLite
    conn = sqlite3.connect('../allabolag.db')
    
    # Query the master_analytics table
    query = """
    SELECT 
        OrgNr, name, address, city, incorporation_date, email, homepage, segment, segment_name,
        revenue, profit, employees,
        SDI, DR, ORS, Revenue_growth, EBIT_margin, NetProfit_margin,
        analysis_year, seg_revenue, seg_ebit, year_rank, avg_growth, growth_range, growth_stage, digital_maturity, industry_cluster,
        fit_score_reason,
        company_size_category, employee_size_category, profitability_category, growth_category, digital_maturity_score, overall_potential_score
    FROM master_analytics
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    logger.info(f"Exported {len(df)} companies from master_analytics")
    return df

def clean_dataframe_for_supabase(df):
    """Clean dataframe for Supabase compatibility"""
    logger.info("Cleaning data for Supabase...")
    
    # Replace NaN with None for proper NULL handling
    df = df.where(pd.notnull(df), None)
    
    # Handle infinity values
    df = df.replace([float('inf'), float('-inf')], None)
    
    # Convert potential infinity in numeric columns
    numeric_columns = ['SDI', 'DR', 'ORS', 'Revenue_growth', 'EBIT_margin', 'NetProfit_margin', 
                      'analysis_year', 'seg_revenue', 'seg_ebit', 'year_rank', 'avg_growth',
                      'digital_maturity_score', 'overall_potential_score']
    
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].replace([float('inf'), float('-inf')], None)
    
    logger.info("Data cleaning complete")
    return df

def import_to_supabase(df, supabase: Client):
    """Import dataframe to Supabase master_analytics table"""
    logger.info("Importing to Supabase...")
    
    # Convert dataframe to list of dictionaries
    records = df.to_dict('records')
    
    # Batch insert (Supabase handles up to 1000 records per batch)
    batch_size = 1000
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        logger.info(f"Inserting batch {batch_num}/{total_batches} ({len(batch)} records)")
        
        try:
            result = supabase.table('master_analytics').upsert(batch).execute()
            logger.info(f"Batch {batch_num} inserted successfully")
        except Exception as e:
            logger.error(f"Error inserting batch {batch_num}: {str(e)}")
            # Try individual inserts for this batch
            for record in batch:
                try:
                    supabase.table('master_analytics').upsert(record).execute()
                except Exception as individual_error:
                    logger.error(f"Error inserting record {record.get('OrgNr', 'unknown')}: {str(individual_error)}")
    
    logger.info("Import to Supabase complete")

def verify_supabase_import(supabase: Client):
    """Verify the import was successful"""
    logger.info("Verifying Supabase import...")
    
    try:
        # Count total records
        result = supabase.table('master_analytics').select('OrgNr', count='exact').execute()
        total_count = result.count
        logger.info(f"Total records in Supabase master_analytics: {total_count}")
        
        # Sample some records
        sample = supabase.table('master_analytics').select('name, segment, company_size_category, overall_potential_score').limit(5).execute()
        logger.info("Sample records:")
        for record in sample.data:
            logger.info(f"  {record.get('name', 'N/A')} - {record.get('segment', 'N/A')} - {record.get('company_size_category', 'N/A')} - Score: {record.get('overall_potential_score', 'N/A')}")
        
        return True
        
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return False

def main():
    """Main migration function"""
    logger.info("Starting optimized database migration to Supabase...")
    
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        logger.info("Supabase client initialized")
        
        # Export from SQLite
        df = export_master_analytics_from_sqlite()
        
        # Clean data
        df = clean_dataframe_for_supabase(df)
        
        # Import to Supabase
        import_to_supabase(df, supabase)
        
        # Verify import
        if verify_supabase_import(supabase):
            logger.info("✅ Migration completed successfully!")
        else:
            logger.error("❌ Migration verification failed")
            
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()

