#!/usr/bin/env python3
"""
Add analysis_year field to Supabase master_analytics table and migrate data from SQLite
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
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for schema changes
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    return create_client(url, key)

def get_analysis_year_data_from_sqlite():
    """Get analysis_year data from SQLite database"""
    logger.info("Getting analysis_year data from SQLite...")
    
    # Connect to SQLite
    conn = sqlite3.connect('../allabolag.db')
    
    # Query the analysis_year data
    query = """
    SELECT OrgNr, analysis_year
    FROM master_analytics
    WHERE analysis_year IS NOT NULL
    """
    
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    logger.info(f"Found {len(df)} companies with analysis_year data")
    return df

def update_supabase_with_analysis_year(df, supabase: Client):
    """Update Supabase records with analysis_year data"""
    logger.info("Updating Supabase with analysis_year data...")
    
    # Convert dataframe to list of dictionaries
    records = df.to_dict('records')
    
    # Batch update (Supabase handles up to 1000 records per batch)
    batch_size = 1000
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        logger.info(f"Updating batch {batch_num}/{total_batches} ({len(batch)} records)")
        
        try:
            # Update each record individually since we're only updating specific fields
            for record in batch:
                result = supabase.table('master_analytics').update({
                    'analysis_year': record['analysis_year']
                }).eq('OrgNr', record['OrgNr']).execute()
            
            logger.info(f"Batch {batch_num} updated successfully")
        except Exception as e:
            logger.error(f"Error updating batch {batch_num}: {str(e)}")

def main():
    """Main function"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        logger.info("✅ Connected to Supabase")
        
        # Get analysis_year data from SQLite
        df = get_analysis_year_data_from_sqlite()
        
        if len(df) == 0:
            logger.warning("No analysis_year data found in SQLite")
            return
        
        # Update Supabase with analysis_year data
        update_supabase_with_analysis_year(df, supabase)
        
        logger.info("✅ Successfully updated Supabase with analysis_year data")
        
        # Verify the update
        logger.info("Verifying update...")
        result = supabase.table('master_analytics').select('OrgNr, analysis_year').not_.is_('analysis_year', 'null').limit(5).execute()
        logger.info(f"Sample records with analysis_year: {result.data}")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    main()
