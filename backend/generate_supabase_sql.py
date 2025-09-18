#!/usr/bin/env python3
"""
Generate SQL for Supabase Table Creation
Creates SQL statements to manually create tables in Supabase dashboard
"""

import sqlite3
import os

def get_table_schemas():
    """Get schema information from SQLite database"""
    conn = sqlite3.connect("allabolag.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    
    schemas = {}
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        schemas[table] = columns
    
    conn.close()
    return schemas

def sqlite_to_postgres_type(sqlite_type):
    """Convert SQLite types to PostgreSQL types"""
    sqlite_type = sqlite_type.upper()
    
    if sqlite_type in ['INTEGER', 'INT']:
        return "BIGINT"
    elif sqlite_type in ['REAL', 'FLOAT', 'DOUBLE']:
        return "DOUBLE PRECISION"
    elif sqlite_type in ['TEXT', 'VARCHAR', 'CHAR']:
        return "TEXT"
    elif sqlite_type in ['DATETIME', 'TIMESTAMP']:
        return "TIMESTAMP"
    elif sqlite_type in ['BOOLEAN', 'BOOL']:
        return "BOOLEAN"
    else:
        return "TEXT"

def generate_create_table_sql(table_name, columns):
    """Generate CREATE TABLE SQL for PostgreSQL"""
    column_defs = []
    
    for col in columns:
        col_name = col[1]
        col_type = col[2]
        nullable = "NULL" if not col[3] else "NOT NULL"
        default = col[4]
        
        pg_type = sqlite_to_postgres_type(col_type)
        
        # Handle default values
        default_clause = ""
        if default is not None:
            if isinstance(default, str):
                default_clause = f" DEFAULT '{default}'"
            else:
                default_clause = f" DEFAULT {default}"
        
        column_defs.append(f'  "{col_name}" {pg_type} {nullable}{default_clause}')
    
    sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n' + ',\n'.join(column_defs) + '\n);'
    return sql

def main():
    print("🔧 Generating SQL for Supabase Table Creation")
    print("="*60)
    
    # Get schemas
    schemas = get_table_schemas()
    
    # Generate SQL for each table
    all_sql = []
    
    # Priority tables (most important ones first)
    priority_tables = [
        'companies',
        'company_accounts_by_id', 
        'company_kpis_by_id',
        'segmentation_companies_raw',
        'filtered_companies_v20250528_095611'
    ]
    
    # Add priority tables first
    for table_name in priority_tables:
        if table_name in schemas:
            sql = generate_create_table_sql(table_name, schemas[table_name])
            all_sql.append(f"-- Table: {table_name}")
            all_sql.append(sql)
            all_sql.append("")
    
    # Add remaining tables
    for table_name, columns in schemas.items():
        if table_name not in priority_tables:
            sql = generate_create_table_sql(table_name, columns)
            all_sql.append(f"-- Table: {table_name}")
            all_sql.append(sql)
            all_sql.append("")
    
    # Write to file
    with open("supabase_create_tables.sql", "w") as f:
        f.write("-- Supabase Table Creation SQL\n")
        f.write("-- Run this in your Supabase SQL Editor\n")
        f.write("-- https://supabase.com/dashboard/project/clysgodrmowieximfaab/sql\n\n")
        f.write("\n".join(all_sql))
    
    print(f"✅ Generated SQL for {len(schemas)} tables")
    print("📄 Saved to: supabase_create_tables.sql")
    print()
    print("📋 Next steps:")
    print("1. Go to your Supabase dashboard:")
    print("   https://supabase.com/dashboard/project/clysgodrmowieximfaab/sql")
    print("2. Copy and paste the contents of supabase_create_tables.sql")
    print("3. Click 'Run' to create all tables")
    print("4. Then run the data migration script")

if __name__ == "__main__":
    main()
