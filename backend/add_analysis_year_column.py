#!/usr/bin/env python3
"""
Add analysis_year column to Supabase master_analytics table
"""

import os
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

def add_analysis_year_column(supabase: Client):
    """Add analysis_year column to master_analytics table"""
    logger.info("Adding analysis_year column to master_analytics table...")
    
    try:
        # Execute SQL to add the column
        sql = """
        ALTER TABLE master_analytics 
        ADD COLUMN IF NOT EXISTS analysis_year INTEGER;
        """
        
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        logger.info("✅ Successfully added analysis_year column")
        
    except Exception as e:
        logger.error(f"Error adding column: {str(e)}")
        # Try alternative approach using direct SQL
        try:
            logger.info("Trying alternative approach...")
            # This might not work with the Python client, but worth trying
            result = supabase.postgrest.rpc('exec_sql', {'sql': sql}).execute()
            logger.info("✅ Successfully added analysis_year column (alternative method)")
        except Exception as e2:
            logger.error(f"Alternative method also failed: {str(e2)}")
            logger.info("You may need to add the column manually in the Supabase dashboard:")
            logger.info("ALTER TABLE master_analytics ADD COLUMN analysis_year INTEGER;")
            raise

def main():
    """Main function"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        logger.info("✅ Connected to Supabase")
        
        # Add the column
        add_analysis_year_column(supabase)
        
        logger.info("✅ Column addition complete")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        logger.info("\nManual steps required:")
        logger.info("1. Go to Supabase dashboard")
        logger.info("2. Navigate to SQL Editor")
        logger.info("3. Run: ALTER TABLE master_analytics ADD COLUMN analysis_year INTEGER;")
        logger.info("4. Then run the migration script again")

if __name__ == "__main__":
    main()
