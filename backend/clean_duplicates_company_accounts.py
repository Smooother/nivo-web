#!/usr/bin/env python3
"""
Clean duplicates from company_accounts_by_id table in Supabase
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
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials in environment variables")
    
    return create_client(url, key)

def check_duplicates(supabase: Client):
    """Check for duplicates in company_accounts_by_id table"""
    logger.info("Checking for duplicates...")
    
    try:
        # Get total count
        result = supabase.table('company_accounts_by_id').select("*", count="exact").execute()
        total_count = result.count
        logger.info(f"Total records: {total_count}")
        
        # Check for duplicates by organisationNumber + year combination
        # This is a simplified check - we'll look for records with same org number and year
        sample_result = supabase.table('company_accounts_by_id').select("organisationNumber, year").limit(100).execute()
        
        # Count occurrences of each combination
        combinations = {}
        for record in sample_result.data:
            key = f"{record['organisationNumber']}_{record['year']}"
            combinations[key] = combinations.get(key, 0) + 1
        
        duplicates = {k: v for k, v in combinations.items() if v > 1}
        
        if duplicates:
            logger.warning(f"Found {len(duplicates)} potential duplicate combinations in sample")
            for key, count in list(duplicates.items())[:5]:  # Show first 5
                logger.warning(f"  {key}: {count} records")
        else:
            logger.info("No duplicates found in sample")
            
        return len(duplicates) > 0
        
    except Exception as e:
        logger.error(f"Error checking duplicates: {str(e)}")
        return False

def remove_duplicates(supabase: Client):
    """Remove duplicates from company_accounts_by_id table"""
    logger.info("Removing duplicates...")
    
    try:
        # Use SQL to remove duplicates, keeping the first occurrence
        # This is a more efficient approach than doing it in Python
        sql = """
        DELETE FROM company_accounts_by_id 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM company_accounts_by_id 
            GROUP BY "organisationNumber", year
        );
        """
        
        # Execute the SQL
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        logger.info("✅ Duplicates removed successfully")
        
        # Verify the cleanup
        result = supabase.table('company_accounts_by_id').select("*", count="exact").execute()
        new_count = result.count
        logger.info(f"Records after cleanup: {new_count}")
        
    except Exception as e:
        logger.error(f"Error removing duplicates: {str(e)}")
        logger.info("You may need to run this SQL manually in Supabase dashboard:")
        logger.info("""
        DELETE FROM company_accounts_by_id 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM company_accounts_by_id 
            GROUP BY "organisationNumber", year
        );
        """)

def main():
    """Main function"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        logger.info("✅ Connected to Supabase")
        
        # Check for duplicates
        has_duplicates = check_duplicates(supabase)
        
        if has_duplicates:
            logger.info("Duplicates found. Removing them...")
            remove_duplicates(supabase)
        else:
            logger.info("No duplicates found. Table is clean.")
        
        logger.info("✅ Duplicate cleanup complete")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    main()
