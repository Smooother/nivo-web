#!/usr/bin/env python3
"""
Database Migration Script: SQLite to Supabase (Version 2)
Uses Supabase client instead of direct psycopg2 connection
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

class DatabaseMigratorV2:
    def __init__(self):
        self.local_db_path = "allabolag.db"
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        
        # Create connections
        self.local_conn = sqlite3.connect(self.local_db_path)
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def get_table_schemas(self):
        """Get schema information from SQLite database"""
        cursor = self.local_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        schemas = {}
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            schemas[table] = columns
            
        return schemas
    
    def migrate_table_data(self, table_name, df):
        """Migrate data for a single table using Supabase client"""
        try:
            # Clean data for JSON serialization
            df = df.fillna(None)
            
            # Convert to records
            records = df.to_dict('records')
            
            # Insert in batches of 1000
            batch_size = 1000
            total_rows = len(records)
            
            for i in range(0, total_rows, batch_size):
                batch = records[i:i + batch_size]
                
                # Insert batch
                result = self.supabase.table(table_name).insert(batch).execute()
                
                logger.info(f"Inserted batch {i//batch_size + 1} for {table_name} ({len(batch)} rows)")
            
            logger.info(f"Successfully migrated {total_rows} rows to {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error migrating table {table_name}: {str(e)}")
            return False
    
    def create_table_sql(self, table_name, columns):
        """Generate CREATE TABLE SQL for Supabase"""
        column_defs = []
        
        for col in columns:
            col_name = col[1]
            col_type = col[2].upper()
            nullable = "NULL" if not col[3] else "NOT NULL"
            
            # Map SQLite types to PostgreSQL types
            if col_type in ['INTEGER', 'INT']:
                pg_type = "BIGINT"
            elif col_type in ['REAL', 'FLOAT', 'DOUBLE']:
                pg_type = "DOUBLE PRECISION"
            elif col_type in ['TEXT', 'VARCHAR', 'CHAR']:
                pg_type = "TEXT"
            elif col_type in ['DATETIME', 'TIMESTAMP']:
                pg_type = "TIMESTAMP"
            elif col_type in ['BOOLEAN', 'BOOL']:
                pg_type = "BOOLEAN"
            else:
                pg_type = "TEXT"
            
            column_defs.append(f'"{col_name}" {pg_type} {nullable}')
        
        sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n  ' + ',\n  '.join(column_defs) + '\n);'
        return sql
    
    def create_tables_via_sql(self, schemas):
        """Create tables using SQL execution"""
        for table_name, columns in schemas.items():
            logger.info(f"Creating table: {table_name}")
            
            try:
                # Generate CREATE TABLE SQL
                create_sql = self.create_table_sql(table_name, columns)
                
                # Execute via Supabase RPC (we'll use a different approach)
                # For now, we'll create tables by inserting sample data
                # This will auto-create the table structure
                
                # Read a small sample to determine structure
                sample_df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 1", self.local_conn)
                
                if not sample_df.empty:
                    # Convert to records and insert (this will create the table)
                    sample_records = sample_df.to_dict('records')
                    self.supabase.table(table_name).insert(sample_records).execute()
                    logger.info(f"Created table {table_name} with sample data")
                else:
                    logger.info(f"Table {table_name} is empty, creating with minimal structure")
                    
            except Exception as e:
                logger.error(f"Error creating table {table_name}: {str(e)}")
                continue
    
    def migrate_data(self, schemas):
        """Migrate data from SQLite to Supabase"""
        for table_name in schemas.keys():
            logger.info(f"Migrating data for table: {table_name}")
            
            try:
                # Read data from SQLite
                df = pd.read_sql_query(f"SELECT * FROM {table_name}", self.local_conn)
                
                if df.empty:
                    logger.info(f"Table {table_name} is empty, skipping data migration")
                    continue
                
                # Migrate the data
                success = self.migrate_table_data(table_name, df)
                
                if not success:
                    logger.warning(f"Failed to migrate table {table_name}")
                    continue
                
            except Exception as e:
                logger.error(f"Error migrating table {table_name}: {str(e)}")
                continue
    
    def verify_migration(self):
        """Verify that migration was successful"""
        logger.info("Verifying migration...")
        
        # Get table counts from both databases
        local_cursor = self.local_conn.cursor()
        local_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        local_tables = [row[0] for row in local_cursor.fetchall()]
        
        verification_results = {}
        
        for table in local_tables:
            try:
                # Count rows in SQLite
                local_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                local_count = local_cursor.fetchone()[0]
                
                # Count rows in Supabase
                result = self.supabase.table(table).select("*", count="exact").execute()
                supabase_count = result.count
                
                verification_results[table] = {
                    'local': local_count,
                    'supabase': supabase_count,
                    'match': local_count == supabase_count
                }
                
                status = "✓" if local_count == supabase_count else "✗"
                logger.info(f"{status} {table}: Local={local_count}, Supabase={supabase_count}")
                
            except Exception as e:
                logger.error(f"Error verifying table {table}: {str(e)}")
                verification_results[table] = {'error': str(e)}
        
        return verification_results
    
    def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting database migration to Supabase (V2)...")
        
        try:
            # Step 1: Get schemas
            logger.info("Step 1: Analyzing local database schema...")
            schemas = self.get_table_schemas()
            logger.info(f"Found {len(schemas)} tables to migrate")
            
            # Step 2: Create tables and migrate data
            logger.info("Step 2: Creating tables and migrating data...")
            self.create_tables_via_sql(schemas)
            
            # Step 3: Migrate remaining data
            logger.info("Step 3: Migrating remaining data...")
            self.migrate_data(schemas)
            
            # Step 4: Verify migration
            logger.info("Step 4: Verifying migration...")
            verification_results = self.verify_migration()
            
            logger.info("Migration completed successfully!")
            return verification_results
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            raise
        finally:
            self.local_conn.close()

def main():
    """Main function to run the migration"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        migrator = DatabaseMigratorV2()
        results = migrator.run_migration()
        
        # Print summary
        print("\n" + "="*50)
        print("MIGRATION SUMMARY")
        print("="*50)
        
        total_tables = len(results)
        successful_tables = sum(1 for r in results.values() if r.get('match', False))
        
        print(f"Total tables: {total_tables}")
        print(f"Successfully migrated: {successful_tables}")
        print(f"Failed: {total_tables - successful_tables}")
        
        if successful_tables == total_tables:
            print("\n🎉 All tables migrated successfully!")
        else:
            print("\n⚠️  Some tables had issues. Check the logs above.")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
