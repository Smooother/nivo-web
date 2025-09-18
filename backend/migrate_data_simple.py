#!/usr/bin/env python3
"""
Simple Data Migration Script
Migrates data from SQLite to Supabase after tables are created
"""

import os
import sqlite3
import pandas as pd
from supabase import create_client, Client
import json
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleDataMigrator:
    def __init__(self):
        self.local_db_path = "allabolag.db"
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required environment variables")
        
        # Create connections
        self.local_conn = sqlite3.connect(self.local_db_path)
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def clean_dataframe(self, df):
        """Clean dataframe for JSON serialization"""
        # Handle infinite values first
        df = df.replace([float('inf'), float('-inf')], None)
        
        # Convert datetime columns to strings to avoid JSON serialization issues
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    # Try to convert to datetime first
                    datetime_series = pd.to_datetime(df[col], errors='coerce')
                    # If conversion was successful, convert to string
                    if not datetime_series.isna().all():
                        df[col] = datetime_series.dt.strftime('%Y-%m-%d %H:%M:%S')
                        # Replace NaT with None
                        df[col] = df[col].replace('NaT', None)
                except:
                    pass
        
        # Convert any remaining datetime objects to strings
        for col in df.columns:
            if hasattr(df[col].dtype, 'tz') or 'datetime' in str(df[col].dtype):
                df[col] = df[col].astype(str)
                df[col] = df[col].replace('NaT', None)
        
        # Handle NaN values - replace with None for JSON compatibility
        df = df.where(pd.notnull(df), None)
        
        # Additional cleaning for numeric columns with NaN
        for col in df.columns:
            if df[col].dtype in ['float64', 'float32']:
                df[col] = df[col].replace([float('nan'), float('inf'), float('-inf')], None)
        
        return df
    
    def migrate_table(self, table_name):
        """Migrate a single table"""
        try:
            logger.info(f"Migrating table: {table_name}")
            
            # Read data from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", self.local_conn)
            
            if df.empty:
                logger.info(f"Table {table_name} is empty, skipping")
                return True
            
            # Clean data
            df = self.clean_dataframe(df)
            
            # Convert to records
            records = df.to_dict('records')
            
            # Insert in batches
            batch_size = 1000
            total_rows = len(records)
            
            for i in range(0, total_rows, batch_size):
                batch = records[i:i + batch_size]
                
                try:
                    result = self.supabase.table(table_name).insert(batch).execute()
                    logger.info(f"  Inserted batch {i//batch_size + 1} ({len(batch)} rows)")
                except Exception as e:
                    logger.error(f"  Error inserting batch: {str(e)}")
                    return False
            
            logger.info(f"✅ Successfully migrated {total_rows} rows to {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error migrating table {table_name}: {str(e)}")
            return False
    
    def get_priority_tables(self):
        """Get list of priority tables to migrate first"""
        return [
            'companies',
            'company_accounts_by_id', 
            'company_kpis_by_id',
            'segmentation_companies_raw',
            'filtered_companies_v20250528_095611'
        ]
    
    def get_all_tables(self):
        """Get all tables from SQLite"""
        cursor = self.local_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        return [row[0] for row in cursor.fetchall()]
    
    def run_migration(self):
        """Run the complete migration"""
        logger.info("🚀 Starting data migration to Supabase...")
        
        # Get priority tables first
        priority_tables = self.get_priority_tables()
        all_tables = self.get_all_tables()
        
        # Migrate priority tables first
        logger.info("📋 Migrating priority tables...")
        priority_success = 0
        for table in priority_tables:
            if table in all_tables:
                if self.migrate_table(table):
                    priority_success += 1
        
        logger.info(f"✅ Migrated {priority_success}/{len(priority_tables)} priority tables")
        
        # Migrate remaining tables
        remaining_tables = [t for t in all_tables if t not in priority_tables]
        logger.info(f"📋 Migrating {len(remaining_tables)} remaining tables...")
        
        remaining_success = 0
        for table in remaining_tables:
            if self.migrate_table(table):
                remaining_success += 1
        
        logger.info(f"✅ Migrated {remaining_success}/{len(remaining_tables)} remaining tables")
        
        # Summary
        total_success = priority_success + remaining_success
        total_tables = len(all_tables)
        
        logger.info("="*50)
        logger.info("MIGRATION SUMMARY")
        logger.info("="*50)
        logger.info(f"Total tables: {total_tables}")
        logger.info(f"Successfully migrated: {total_success}")
        logger.info(f"Failed: {total_tables - total_success}")
        
        if total_success == total_tables:
            logger.info("🎉 All tables migrated successfully!")
        else:
            logger.info("⚠️  Some tables had issues. Check the logs above.")
        
        return total_success == total_tables

def main():
    """Main function"""
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        migrator = SimpleDataMigrator()
        success = migrator.run_migration()
        return 0 if success else 1
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())
