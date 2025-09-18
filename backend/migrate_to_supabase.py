#!/usr/bin/env python3
"""
Database Migration Script: SQLite to Supabase
Migrates all tables and data from local SQLite database to Supabase PostgreSQL
"""

import os
import sqlite3
import pandas as pd
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self):
        self.local_db_path = "allabolag.db"
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase_db_url = os.getenv('SUPABASE_DB_URL')
        
        if not all([self.supabase_url, self.supabase_key, self.supabase_db_url]):
            raise ValueError("Missing required environment variables. Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL")
        
        # Create connections
        self.local_conn = sqlite3.connect(self.local_db_path)
        self.supabase_engine = create_engine(self.supabase_db_url)
        
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
    
    def create_supabase_tables(self, schemas):
        """Create tables in Supabase with appropriate PostgreSQL types"""
        metadata = MetaData()
        
        for table_name, columns in schemas.items():
            logger.info(f"Creating table: {table_name}")
            
            # Map SQLite types to PostgreSQL types
            postgres_columns = []
            for col in columns:
                col_name = col[1]
                col_type = col[2].upper()
                nullable = not col[3]
                default = col[4]
                
                # Type mapping
                if col_type in ['INTEGER', 'INT']:
                    pg_type = Integer
                elif col_type in ['REAL', 'FLOAT', 'DOUBLE']:
                    pg_type = Float
                elif col_type in ['TEXT', 'VARCHAR', 'CHAR']:
                    pg_type = Text
                elif col_type in ['DATETIME', 'TIMESTAMP']:
                    pg_type = DateTime
                elif col_type in ['BOOLEAN', 'BOOL']:
                    pg_type = Boolean
                else:
                    pg_type = Text  # Default fallback
                
                postgres_columns.append(Column(col_name, pg_type, nullable=nullable))
            
            # Create table
            Table(table_name, metadata, *postgres_columns)
        
        # Create all tables
        metadata.create_all(self.supabase_engine)
        logger.info("All tables created in Supabase")
    
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
                
                # Clean data for PostgreSQL
                df = self.clean_dataframe(df)
                
                # Insert data into Supabase
                df.to_sql(table_name, self.supabase_engine, if_exists='append', index=False, method='multi')
                
                logger.info(f"Migrated {len(df)} rows to {table_name}")
                
            except Exception as e:
                logger.error(f"Error migrating table {table_name}: {str(e)}")
                continue
    
    def clean_dataframe(self, df):
        """Clean dataframe for PostgreSQL compatibility"""
        # Handle NaN values
        df = df.fillna(None)
        
        # Convert datetime columns
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to convert to datetime
                try:
                    df[col] = pd.to_datetime(df[col], errors='ignore')
                except:
                    pass
        
        return df
    
    def create_indexes(self):
        """Create useful indexes for better performance"""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_companies_orgnr ON companies(organisationNumber);",
            "CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);",
            "CREATE INDEX IF NOT EXISTS idx_company_accounts_orgnr ON company_accounts(OrgNr);",
            "CREATE INDEX IF NOT EXISTS idx_company_accounts_year ON company_accounts(year);",
            "CREATE INDEX IF NOT EXISTS idx_company_kpis_orgnr ON company_kpis(OrgNr);",
            "CREATE INDEX IF NOT EXISTS idx_company_kpis_year ON company_kpis(year);",
        ]
        
        for index_sql in indexes:
            try:
                with self.supabase_engine.connect() as conn:
                    conn.execute(text(index_sql))
                    conn.commit()
                logger.info(f"Created index: {index_sql.split('idx_')[1].split(' ')[0]}")
            except Exception as e:
                logger.warning(f"Could not create index: {str(e)}")
    
    def setup_row_level_security(self):
        """Set up Row Level Security for user data access"""
        rls_policies = [
            # Enable RLS on main tables
            "ALTER TABLE companies ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE company_kpis ENABLE ROW LEVEL SECURITY;",
            
            # Create policies for authenticated users
            "CREATE POLICY \"Users can view all companies\" ON companies FOR SELECT TO authenticated USING (true);",
            "CREATE POLICY \"Users can view all accounts\" ON company_accounts FOR SELECT TO authenticated USING (true);",
            "CREATE POLICY \"Users can view all kpis\" ON company_kpis FOR SELECT TO authenticated USING (true);",
        ]
        
        for policy_sql in rls_policies:
            try:
                with self.supabase_engine.connect() as conn:
                    conn.execute(text(policy_sql))
                    conn.commit()
                logger.info(f"Applied RLS policy")
            except Exception as e:
                logger.warning(f"Could not apply RLS policy: {str(e)}")
    
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
                with self.supabase_engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    supabase_count = result.fetchone()[0]
                
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
        logger.info("Starting database migration to Supabase...")
        
        try:
            # Step 1: Get schemas
            logger.info("Step 1: Analyzing local database schema...")
            schemas = self.get_table_schemas()
            logger.info(f"Found {len(schemas)} tables to migrate")
            
            # Step 2: Create tables in Supabase
            logger.info("Step 2: Creating tables in Supabase...")
            self.create_supabase_tables(schemas)
            
            # Step 3: Migrate data
            logger.info("Step 3: Migrating data...")
            self.migrate_data(schemas)
            
            # Step 4: Create indexes
            logger.info("Step 4: Creating indexes...")
            self.create_indexes()
            
            # Step 5: Setup RLS
            logger.info("Step 5: Setting up Row Level Security...")
            self.setup_row_level_security()
            
            # Step 6: Verify migration
            logger.info("Step 6: Verifying migration...")
            verification_results = self.verify_migration()
            
            logger.info("Migration completed successfully!")
            return verification_results
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            raise
        finally:
            self.local_conn.close()
            self.supabase_engine.dispose()

def main():
    """Main function to run the migration"""
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        migrator = DatabaseMigrator()
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
