#!/usr/bin/env python3
"""
Check which tables are empty in the original SQLite database
"""

import sqlite3
import pandas as pd
from database_manager import DatabaseManager
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_empty_tables():
    """Check which tables are empty in SQLite vs Supabase"""
    
    # Connect to both databases
    local_conn = sqlite3.connect("allabolag.db")
    db = DatabaseManager()
    
    # Get all tables from SQLite
    cursor = local_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    sqlite_tables = [row[0] for row in cursor.fetchall()]
    
    logger.info("📊 Checking table status: SQLite vs Supabase")
    logger.info("=" * 60)
    
    empty_tables = []
    populated_tables = []
    
    for table_name in sqlite_tables:
        try:
            # Check SQLite row count
            sqlite_count = pd.read_sql_query(f"SELECT COUNT(*) as count FROM {table_name}", local_conn).iloc[0]['count']
            
            # Check Supabase row count
            try:
                supabase_info = db.get_table_info(table_name)
                supabase_count = supabase_info['row_count'] if supabase_info else 0
            except:
                supabase_count = 0
            
            status = "✅" if sqlite_count > 0 else "❌"
            migration_status = "✅" if supabase_count > 0 else "⚠️"
            
            if sqlite_count == 0:
                empty_tables.append(table_name)
                logger.info(f"{status} {table_name}: {sqlite_count} rows (SQLite) | {migration_status} {supabase_count} rows (Supabase) - EMPTY, NO MIGRATION NEEDED")
            else:
                populated_tables.append(table_name)
                logger.info(f"{status} {table_name}: {sqlite_count} rows (SQLite) | {migration_status} {supabase_count} rows (Supabase)")
                
        except Exception as e:
            logger.error(f"❌ Error checking {table_name}: {e}")
    
    local_conn.close()
    
    logger.info("\n" + "=" * 60)
    logger.info("📋 SUMMARY:")
    logger.info(f"✅ Populated tables (need migration): {len(populated_tables)}")
    logger.info(f"❌ Empty tables (no migration needed): {len(empty_tables)}")
    
    if empty_tables:
        logger.info(f"\n🗑️  Empty tables that don't need migration:")
        for table in empty_tables:
            logger.info(f"   - {table}")
    
    logger.info(f"\n✅ Populated tables that were migrated:")
    for table in populated_tables:
        logger.info(f"   - {table}")
    
    return populated_tables, empty_tables

if __name__ == "__main__":
    populated, empty = check_empty_tables()
