#!/usr/bin/env python3
"""
Complete the remaining migration for empty tables
"""

import sqlite3
import pandas as pd
from database_manager import DatabaseManager
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_remaining_tables():
    """Migrate the 2 remaining empty tables"""
    
    # Connect to both databases
    db = DatabaseManager()
    local_conn = sqlite3.connect("allabolag.db")
    
    # Tables to migrate
    tables_to_migrate = ['company_kpis_by_id', 'company_kpis']
    
    for table_name in tables_to_migrate:
        try:
            logger.info(f"🔄 Migrating {table_name}...")
            
            # Read from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", local_conn)
            
            if df.empty:
                logger.info(f"   Table {table_name} is empty in SQLite, skipping")
                continue
            
            logger.info(f"   Found {len(df)} rows in SQLite")
            
            # Clean data
            df = df.where(pd.notnull(df), None)
            df = df.replace([float('inf'), float('-inf')], None)
            
            # Convert to records
            records = df.to_dict('records')
            
            # Insert in batches
            batch_size = 1000
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                db.supabase.table(table_name).insert(batch).execute()
                logger.info(f"   Inserted batch {i//batch_size + 1} ({len(batch)} rows)")
            
            logger.info(f"✅ Successfully migrated {len(records)} rows to {table_name}")
            
        except Exception as e:
            logger.error(f"❌ Error migrating {table_name}: {e}")
    
    local_conn.close()
    
    # Final status check
    logger.info("\n📊 Final Migration Status:")
    db.get_migration_status()

if __name__ == "__main__":
    migrate_remaining_tables()
