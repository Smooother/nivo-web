#!/usr/bin/env python3
"""
Simple Company Data Status Report
"""

import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = "https://clysgodrmowieximfaab.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseXNnb2RybW93aWV4aW1mYWFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3NDk0OSwiZXhwIjoyMDczNzUwOTQ5fQ.F55Dp1gO5rnLkVva9_K8KUR-npmL-I2ZzsvRj3x29Xc"
    
    return create_client(url, key)

def get_table_counts(supabase: Client):
    """Get row counts for all company-related tables"""
    tables = [
        'all_companies_raw',
        'company_accounts_by_id', 
        'company_kpis_by_id',
        'filtered_companies_basic_filters_20250618_104425',
        'high_potential_candidates',
        'digitizable_ecommerce_and_product_companies',
        'enhanced_segmentation',
        'ai_company_analysis'
    ]
    
    counts = {}
    for table in tables:
        try:
            response = supabase.table(table).select("*", count="exact").limit(1).execute()
            counts[table] = response.count
            print(f"✅ {table:<50} {response.count:>10,} records")
        except Exception as e:
            counts[table] = f"Error: {str(e)}"
            print(f"❌ {table:<50} {str(e)}")
    
    return counts

def get_sample_data(supabase: Client):
    """Get sample data from main companies table"""
    try:
        print("\n📊 SAMPLE DATA FROM ALL_COMPANIES_RAW:")
        print("-" * 60)
        
        response = supabase.table('all_companies_raw').select('name,city,segment,revenue,profit,employees').limit(5).execute()
        
        for i, company in enumerate(response.data, 1):
            print(f"{i}. {company.get('name', 'N/A')}")
            print(f"   City: {company.get('city', 'N/A')}")
            print(f"   Segment: {company.get('segment', 'N/A')}")
            print(f"   Revenue: {company.get('revenue', 'N/A'):,} SEK" if company.get('revenue') else "   Revenue: N/A")
            print(f"   Profit: {company.get('profit', 'N/A'):,} SEK" if company.get('profit') else "   Profit: N/A")
            print(f"   Employees: {company.get('employees', 'N/A')}")
            print()
            
    except Exception as e:
        print(f"❌ Error getting sample data: {e}")

def get_revenue_stats(supabase: Client):
    """Get revenue statistics"""
    try:
        print("💰 REVENUE STATISTICS:")
        print("-" * 30)
        
        # Get all revenue data
        response = supabase.table('all_companies_raw').select('revenue').execute()
        revenues = [r['revenue'] for r in response.data if r['revenue'] is not None]
        
        if revenues:
            revenues.sort()
            total_companies = len(response.data)
            companies_with_revenue = len(revenues)
            
            print(f"Total companies: {total_companies:,}")
            print(f"Companies with revenue data: {companies_with_revenue:,}")
            print(f"Data completeness: {companies_with_revenue/total_companies*100:.1f}%")
            print(f"Average revenue: {sum(revenues)/len(revenues):,.0f} SEK")
            print(f"Median revenue: {revenues[len(revenues)//2]:,.0f} SEK")
            print(f"Highest revenue: {max(revenues):,.0f} SEK")
            print(f"Lowest revenue: {min(revenues):,.0f} SEK")
        else:
            print("No revenue data found")
            
    except Exception as e:
        print(f"❌ Error getting revenue stats: {e}")

def main():
    """Generate simple company data report"""
    print("🏢 Nivo Company Data Status Report")
    print("=" * 50)
    print()
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    
    # Get table counts
    print("📊 TABLE RECORD COUNTS:")
    print("-" * 30)
    counts = get_table_counts(supabase)
    
    # Get sample data
    get_sample_data(supabase)
    
    # Get revenue stats
    get_revenue_stats(supabase)
    
    print("✅ Report completed!")

if __name__ == "__main__":
    main()

