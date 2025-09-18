#!/usr/bin/env python3
"""
Interactive Database Cleaner
Clean and fix data issues in Supabase database
"""

from database_manager import DatabaseManager
import pandas as pd
import json

def main():
    db = DatabaseManager()
    
    print("\n🧹 Interactive Database Cleaner")
    print("=" * 50)
    
    # Check current status
    print("\n📊 Current Database Status:")
    db.get_migration_status()
    
    # Let's check for data issues in key tables
    print("\n🔍 Checking for data issues...")
    
    # Check companies table
    print("\n1. Checking 'companies' table...")
    issues = db.find_data_issues('companies')
    
    # Check company_accounts_by_id table
    print("\n2. Checking 'company_accounts_by_id' table...")
    issues = db.find_data_issues('company_accounts_by_id')
    
    # Let's look at some sample data to understand the issues
    print("\n📋 Sample data from companies table:")
    sample_data = db.query_table('companies', limit=3)
    for i, row in enumerate(sample_data):
        print(f"\nRow {i+1}:")
        for key, value in row.items():
            print(f"  {key}: {value}")
    
    # Check for specific date issues
    print("\n🔍 Checking for date format issues...")
    companies_data = db.query_table('companies', limit=100)
    df = pd.DataFrame(companies_data)
    
    if 'incorporation_date' in df.columns:
        date_issues = df[df['incorporation_date'].astype(str).str.contains('1970-01-01')]
        print(f"Found {len(date_issues)} rows with '1970-01-01' dates in incorporation_date")
        
        if len(date_issues) > 0:
            print("Sample problematic dates:")
            print(date_issues[['name', 'incorporation_date']].head())
    
    # Let's check what tables still need migration
    print("\n📋 Tables that might need attention:")
    
    # Check if company_kpis_by_id is empty
    kpis_info = db.get_table_info('company_kpis_by_id')
    if kpis_info and kpis_info['row_count'] == 0:
        print("⚠️  company_kpis_by_id is empty - needs data migration")
    
    # Check for other tables that might have issues
    problem_tables = []
    
    # Let's try to identify tables with date issues
    print("\n🔍 Checking all tables for date issues...")
    
    # Get list of all tables by checking a few common ones
    test_tables = [
        'companies_enriched', 'company_kpis', 'segmented_companies',
        'enhanced_segmentation', 'new_segmented_companies', 'filtered_candidates',
        'ownership_scan_results', 'high_potential_candidates', 'filtered_ecommerce_companies'
    ]
    
    for table in test_tables:
        try:
            info = db.get_table_info(table)
            if info and info['row_count'] > 0:
                print(f"✅ {table}: {info['row_count']} rows")
            elif info and info['row_count'] == 0:
                print(f"⚠️  {table}: Empty table")
            else:
                print(f"❌ {table}: Table not accessible")
        except Exception as e:
            print(f"❌ {table}: Error - {str(e)}")
    
    print("\n🎯 Next Steps:")
    print("1. Fix date format issues in existing tables")
    print("2. Migrate remaining empty tables")
    print("3. Clean and validate all data")
    
    return db

if __name__ == "__main__":
    db = main()
