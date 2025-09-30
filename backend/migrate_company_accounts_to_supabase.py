#!/usr/bin/env python3
"""
Migrate company_accounts_by_id data from SQLite to Supabase
This is the source of truth for financial data with actual years
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
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for data migration
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    return create_client(url, key)

def get_company_accounts_data_from_sqlite():
    """Get company_accounts_by_id data from SQLite database"""
    logger.info("Getting company_accounts_by_id data from SQLite...")
    
    # Connect to SQLite
    conn = sqlite3.connect('../allabolag.db')
    
    # Query the company_accounts_by_id data
    query = """
    SELECT 
        companyId, organisationNumber, name, year, period, periodStart, periodEnd, length, currency, remark, referenceUrl, accIncompleteCode, accIncompleteDesc,
        SDI, DR, ORS
    FROM company_accounts_by_id
    ORDER BY organisationNumber, year DESC
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    logger.info(f"Found {len(df)} financial records from company_accounts_by_id")
    return df

def clean_dataframe_for_supabase(df):
    """Clean dataframe for Supabase compatibility"""
    logger.info("Cleaning data for Supabase...")
    
    # Replace NaN with None for proper NULL handling
    df = df.where(pd.notnull(df), None)
    
    # Handle infinity values
    df = df.replace([float('inf'), float('-inf')], None)
    
    # Convert potential infinity in numeric columns
    numeric_columns = ['year', 'length', 'SDI', 'DR', 'ORS']
    
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].replace([float('inf'), float('-inf')], None)
    
    logger.info("Data cleaning complete")
    return df

def import_to_supabase(df, supabase: Client):
    """Import dataframe to Supabase company_accounts_by_id table"""
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
            result = supabase.table('company_accounts_by_id').upsert(batch).execute()
            logger.info(f"Batch {batch_num} inserted successfully")
        except Exception as e:
            logger.error(f"Error inserting batch {batch_num}: {str(e)}")
            # Continue with next batch
            continue
    
    logger.info("✅ Data import complete")

def verify_import(supabase: Client):
    """Verify the import was successful"""
    logger.info("Verifying import...")
    
    try:
        # Get count of records
        result = supabase.table('company_accounts_by_id').select("*", count="exact").execute()
        total_count = result.count
        logger.info(f"Total records in Supabase: {total_count}")
        
        # Get sample data
        sample_result = supabase.table('company_accounts_by_id').select("organisationNumber, name, year, SDI, DR, ORS").limit(5).execute()
        logger.info(f"Sample records: {sample_result.data}")
        
        # Get year distribution
        year_result = supabase.table('company_accounts_by_id').select("year").execute()
        years = [record['year'] for record in year_result.data if record['year']]
        unique_years = sorted(set(years))
        logger.info(f"Years available: {unique_years}")
        
    except Exception as e:
        logger.error(f"Error verifying import: {str(e)}")

def main():
    """Main function"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        logger.info("✅ Connected to Supabase")
        
        # Get company_accounts_by_id data from SQLite
        df = get_company_accounts_data_from_sqlite()
        
        if len(df) == 0:
            logger.warning("No company_accounts_by_id data found in SQLite")
            return
        
        # Clean data for Supabase
        df = clean_dataframe_for_supabase(df)
        
        # Import to Supabase
        import_to_supabase(df, supabase)
        
        # Verify import
        verify_import(supabase)
        
        logger.info("✅ Migration complete!")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    main()
