#!/usr/bin/env python3
"""
Company Data Status Report
Generates a comprehensive report of all company data in the database
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd
from datetime import datetime

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL", "https://clysgodrmowieximfaab.supabase.co")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not key:
        print("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables")
        sys.exit(1)
    
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
        except Exception as e:
            counts[table] = f"Error: {str(e)}"
    
    return counts

def get_revenue_distribution(supabase: Client):
    """Get revenue distribution analysis"""
    try:
        response = supabase.table('all_companies_raw').select('revenue').execute()
        data = pd.DataFrame(response.data)
        
        if data.empty:
            return "No data available"
        
        # Define revenue ranges
        def categorize_revenue(revenue):
            if pd.isna(revenue) or revenue is None:
                return 'No Revenue Data'
            elif revenue == 0:
                return 'Zero Revenue'
            elif revenue < 1_000_000:
                return '0-1M SEK'
            elif revenue < 10_000_000:
                return '1-10M SEK'
            elif revenue < 100_000_000:
                return '10-100M SEK'
            elif revenue < 1_000_000_000:
                return '100M-1B SEK'
            else:
                return '1B+ SEK'
        
        data['revenue_range'] = data['revenue'].apply(categorize_revenue)
        distribution = data['revenue_range'].value_counts()
        
        total = len(data)
        percentages = (distribution / total * 100).round(2)
        
        result = pd.DataFrame({
            'Count': distribution,
            'Percentage': percentages
        }).sort_index()
        
        return result
    except Exception as e:
        return f"Error: {str(e)}"

def get_top_cities(supabase: Client, limit=10):
    """Get top cities by company count"""
    try:
        response = supabase.table('all_companies_raw').select('city,revenue').execute()
        data = pd.DataFrame(response.data)
        
        if data.empty:
            return "No data available"
        
        # Filter out null cities
        data = data[data['city'].notna() & (data['city'] != '')]
        
        city_stats = data.groupby('city').agg({
            'city': 'count',
            'revenue': ['mean', 'sum']
        }).round(0)
        
        city_stats.columns = ['company_count', 'avg_revenue', 'total_revenue']
        city_stats = city_stats.sort_values('company_count', ascending=False).head(limit)
        
        return city_stats
    except Exception as e:
        return f"Error: {str(e)}"

def get_segment_analysis(supabase: Client, limit=10):
    """Get industry segment analysis"""
    try:
        response = supabase.table('all_companies_raw').select('segment,revenue,profit,employees').execute()
        data = pd.DataFrame(response.data)
        
        if data.empty:
            return "No data available"
        
        # Filter out null segments
        data = data[data['segment'].notna() & (data['segment'] != '')]
        
        segment_stats = data.groupby('segment').agg({
            'segment': 'count',
            'revenue': 'mean',
            'profit': 'mean', 
            'employees': 'mean'
        }).round(0)
        
        segment_stats.columns = ['company_count', 'avg_revenue', 'avg_profit', 'avg_employees']
        segment_stats = segment_stats.sort_values('company_count', ascending=False).head(limit)
        
        return segment_stats
    except Exception as e:
        return f"Error: {str(e)}"

def get_data_quality_report(supabase: Client):
    """Get data quality and completeness report"""
    try:
        response = supabase.table('all_companies_raw').select('revenue,profit,employees,email,homepage').execute()
        data = pd.DataFrame(response.data)
        
        if data.empty:
            return "No data available"
        
        total = len(data)
        quality_report = {}
        
        for column in ['revenue', 'profit', 'employees', 'email', 'homepage']:
            non_null = data[column].notna().sum()
            completeness = (non_null / total * 100).round(2)
            quality_report[column.title()] = {
                'Total': total,
                'With Data': non_null,
                'Missing': total - non_null,
                'Completeness %': completeness
            }
        
        return pd.DataFrame(quality_report).T
    except Exception as e:
        return f"Error: {str(e)}"

def get_top_companies(supabase: Client, limit=10):
    """Get top companies by revenue"""
    try:
        response = supabase.table('all_companies_raw').select('name,organisation_number,city,segment,revenue,profit,employees').execute()
        data = pd.DataFrame(response.data)
        
        if data.empty:
            return "No data available"
        
        # Filter companies with revenue data
        data = data[data['revenue'].notna() & (data['revenue'] > 0)]
        
        # Calculate profit margin
        data['profit_margin_percent'] = (data['profit'] / data['revenue'] * 100).round(2)
        
        # Sort by revenue and get top companies
        top_companies = data.nlargest(limit, 'revenue')[
            ['name', 'organisation_number', 'city', 'segment', 'revenue', 'profit', 'employees', 'profit_margin_percent']
        ]
        
        return top_companies
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    """Generate comprehensive company data report"""
    print("🏢 Nivo Company Data Status Report")
    print("=" * 50)
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    
    # 1. Table Counts
    print("📊 TABLE COUNTS")
    print("-" * 30)
    counts = get_table_counts(supabase)
    for table, count in counts.items():
        print(f"{table:<50} {count:>10,}")
    print()
    
    # 2. Revenue Distribution
    print("💰 REVENUE DISTRIBUTION")
    print("-" * 30)
    revenue_dist = get_revenue_distribution(supabase)
    if isinstance(revenue_dist, pd.DataFrame):
        for idx, row in revenue_dist.iterrows():
            print(f"{idx:<20} {row['Count']:>8,} ({row['Percentage']:>6.1f}%)")
    else:
        print(revenue_dist)
    print()
    
    # 3. Top Cities
    print("🏙️  TOP CITIES BY COMPANY COUNT")
    print("-" * 30)
    top_cities = get_top_cities(supabase)
    if isinstance(top_cities, pd.DataFrame):
        for city, row in top_cities.iterrows():
            print(f"{city:<25} {row['company_count']:>8,} companies")
    else:
        print(top_cities)
    print()
    
    # 4. Segment Analysis
    print("🏭 TOP INDUSTRY SEGMENTS")
    print("-" * 30)
    segments = get_segment_analysis(supabase)
    if isinstance(segments, pd.DataFrame):
        for segment, row in segments.iterrows():
            print(f"{segment:<30} {row['company_count']:>8,} companies")
    else:
        print(segments)
    print()
    
    # 5. Data Quality
    print("📈 DATA QUALITY REPORT")
    print("-" * 30)
    quality = get_data_quality_report(supabase)
    if isinstance(quality, pd.DataFrame):
        for metric, row in quality.iterrows():
            print(f"{metric:<15} {row['With Data']:>8,}/{row['Total']:>8,} ({row['Completeness %']:>6.1f}%)")
    else:
        print(quality)
    print()
    
    # 6. Top Companies
    print("🏆 TOP 10 COMPANIES BY REVENUE")
    print("-" * 30)
    top_companies = get_top_companies(supabase)
    if isinstance(top_companies, pd.DataFrame):
        for _, company in top_companies.iterrows():
            print(f"{company['name'][:30]:<30} {company['revenue']:>15,.0f} SEK")
    else:
        print(top_companies)
    print()
    
    print("✅ Report completed successfully!")

if __name__ == "__main__":
    main()

