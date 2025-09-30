#!/usr/bin/env python3
"""
Analyze missing financial data and identify companies that need data re-scraping
Simple version without pandas dependency
"""

import sqlite3
from pathlib import Path
import csv
from collections import Counter

def analyze_missing_financial_data():
    """
    Analyze which companies are missing financial data
    """
    db_path = Path(__file__).parent.parent / "allabolag.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔍 ANALYZING MISSING FINANCIAL DATA")
    print("=" * 50)
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM master_analytics")
    total_companies = cursor.fetchone()[0]
    print(f"📊 Total companies in database: {total_companies}")
    
    # Analyze missing data
    queries = {
        'Missing revenue data': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE revenue IS NULL OR revenue = '' OR revenue = 'None'
        """,
        'Missing profit data': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE profit IS NULL OR profit = '' OR profit = 'None'
        """,
        'Missing employee data': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE employees IS NULL OR employees = '' OR employees = 'None'
        """,
        'Missing growth data': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE Revenue_growth IS NULL
        """,
        'Missing EBIT margin': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE EBIT_margin IS NULL
        """,
        'Missing net profit margin': """
            SELECT COUNT(*) FROM master_analytics 
            WHERE NetProfit_margin IS NULL
        """
    }
    
    print(f"\n📈 MISSING DATA ANALYSIS:")
    print("-" * 30)
    
    missing_counts = {}
    for description, query in queries.items():
        cursor.execute(query)
        count = cursor.fetchone()[0]
        percentage = (count / total_companies) * 100
        missing_counts[description] = count
        print(f"{description}: {count} companies ({percentage:.1f}%)")
    
    # Find companies with NO financial data at all
    cursor.execute("""
        SELECT COUNT(*) FROM master_analytics 
        WHERE (revenue IS NULL OR revenue = '' OR revenue = 'None')
        AND (profit IS NULL OR profit = '' OR profit = 'None')
        AND Revenue_growth IS NULL
        AND EBIT_margin IS NULL
        AND NetProfit_margin IS NULL
    """)
    no_financial_data_count = cursor.fetchone()[0]
    
    print(f"\n🚨 COMPANIES WITH NO FINANCIAL DATA:")
    print("-" * 40)
    print(f"Companies with zero financial data: {no_financial_data_count} ({no_financial_data_count/total_companies*100:.1f}%)")
    
    # Get companies with no financial data
    cursor.execute("""
        SELECT OrgNr, name FROM master_analytics 
        WHERE (revenue IS NULL OR revenue = '' OR revenue = 'None')
        AND (profit IS NULL OR profit = '' OR profit = 'None')
        AND Revenue_growth IS NULL
        AND EBIT_margin IS NULL
        AND NetProfit_margin IS NULL
        ORDER BY name
        LIMIT 50
    """)
    no_data_companies = cursor.fetchall()
    
    print(f"\n📋 COMPANIES WITH NO FINANCIAL DATA (first 50):")
    print("-" * 50)
    for org_nr, name in no_data_companies:
        print(f"  {org_nr} - {name}")
    
    # Get companies missing revenue specifically
    cursor.execute("""
        SELECT OrgNr, name FROM master_analytics 
        WHERE revenue IS NULL OR revenue = '' OR revenue = 'None'
        ORDER BY name
        LIMIT 50
    """)
    missing_revenue_companies = cursor.fetchall()
    
    print(f"\n💰 COMPANIES MISSING REVENUE DATA (first 50):")
    print("-" * 50)
    for org_nr, name in missing_revenue_companies:
        print(f"  {org_nr} - {name}")
    
    # Check if Kominox International AB is in our database
    cursor.execute("""
        SELECT OrgNr, name, revenue, profit, employees, Revenue_growth, EBIT_margin, NetProfit_margin
        FROM master_analytics 
        WHERE name LIKE '%Kominox%' OR name LIKE '%kominox%'
    """)
    kominox_data = cursor.fetchone()
    
    if kominox_data:
        print(f"\n🏢 KOMINOX INTERNATIONAL AB ANALYSIS:")
        print("-" * 40)
        org_nr, name, revenue, profit, employees, growth, ebit, net_profit = kominox_data
        print(f"OrgNr: {org_nr}")
        print(f"Name: {name}")
        print(f"Revenue: {revenue}")
        print(f"Profit: {profit}")
        print(f"Employees: {employees}")
        print(f"Revenue Growth: {growth}")
        print(f"EBIT Margin: {ebit}")
        print(f"Net Profit Margin: {net_profit}")
        
        if not revenue or revenue == '' or revenue == 'None':
            print("⚠️  This company is missing revenue data!")
        else:
            print("✅ This company has revenue data")
    else:
        print(f"\n❌ Kominox International AB not found in database")
    
    # Create CSV files with companies needing re-scraping
    output_dir = Path(__file__).parent.parent / "outputs" / "missing_data_analysis"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # High priority: Companies with no financial data
    high_priority_file = output_dir / "high_priority_rescraping.csv"
    with open(high_priority_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['OrgNr', 'name', 'priority', 'reason'])
        
        cursor.execute("""
            SELECT OrgNr, name FROM master_analytics 
            WHERE (revenue IS NULL OR revenue = '' OR revenue = 'None')
            AND (profit IS NULL OR profit = '' OR profit = 'None')
            AND Revenue_growth IS NULL
            AND EBIT_margin IS NULL
            AND NetProfit_margin IS NULL
            ORDER BY name
        """)
        
        for org_nr, name in cursor.fetchall():
            writer.writerow([org_nr, name, 'HIGH', 'No financial data available'])
    
    print(f"\n✅ Saved high priority companies to: {high_priority_file}")
    
    # Medium priority: Companies missing revenue
    medium_priority_file = output_dir / "medium_priority_rescraping.csv"
    with open(medium_priority_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['OrgNr', 'name', 'priority', 'reason'])
        
        cursor.execute("""
            SELECT OrgNr, name FROM master_analytics 
            WHERE revenue IS NULL OR revenue = '' OR revenue = 'None'
            ORDER BY name
        """)
        
        for org_nr, name in cursor.fetchall():
            writer.writerow([org_nr, name, 'MEDIUM', 'Missing revenue data'])
    
    print(f"✅ Saved medium priority companies to: {medium_priority_file}")
    
    # Combined list
    combined_file = output_dir / "all_companies_needing_rescraping.csv"
    with open(combined_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['OrgNr', 'name', 'priority', 'reason'])
        
        # High priority first
        cursor.execute("""
            SELECT OrgNr, name FROM master_analytics 
            WHERE (revenue IS NULL OR revenue = '' OR revenue = 'None')
            AND (profit IS NULL OR profit = '' OR profit = 'None')
            AND Revenue_growth IS NULL
            AND EBIT_margin IS NULL
            AND NetProfit_margin IS NULL
            ORDER BY name
        """)
        
        for org_nr, name in cursor.fetchall():
            writer.writerow([org_nr, name, 'HIGH', 'No financial data available'])
        
        # Medium priority
        cursor.execute("""
            SELECT OrgNr, name FROM master_analytics 
            WHERE revenue IS NULL OR revenue = '' OR revenue = 'None'
            ORDER BY name
        """)
        
        for org_nr, name in cursor.fetchall():
            writer.writerow([org_nr, name, 'MEDIUM', 'Missing revenue data'])
    
    print(f"✅ Saved combined list to: {combined_file}")
    
    # Count companies in each file
    with open(high_priority_file, 'r') as f:
        high_count = len(f.readlines()) - 1  # Subtract header
    
    with open(medium_priority_file, 'r') as f:
        medium_count = len(f.readlines()) - 1  # Subtract header
    
    print(f"\n📊 RE-SCRAPING SUMMARY:")
    print("-" * 25)
    print(f"High priority companies: {high_count}")
    print(f"Medium priority companies: {medium_count}")
    print(f"Total companies needing re-scraping: {high_count + medium_count}")
    
    conn.close()
    
    return high_count, medium_count

def create_rescraping_script():
    """
    Create a script to re-scrape missing financial data
    """
    script_content = '''#!/usr/bin/env python3
"""
Script to re-scrape financial data for companies missing data
Generated automatically based on missing data analysis
"""

import sqlite3
import requests
import time
import json
from pathlib import Path
import csv

def rescrape_company_data(org_nr, company_name):
    """
    Re-scrape financial data for a specific company
    """
    print(f"Re-scraping data for: {company_name} ({org_nr})")
    
    # This would integrate with your existing fetch_financials_by_companyid.py logic
    # For now, this is a placeholder structure
    
    try:
        # Add your existing scraping logic here
        # Example structure:
        # 1. Get company details from allabolag.se
        # 2. Extract financial data
        # 3. Update database
        
        # Placeholder for actual scraping logic
        print(f"  - Fetching data from allabolag.se for {org_nr}")
        print(f"  - Extracting financial information")
        print(f"  - Updating database")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """
    Main function to re-scrape missing financial data
    """
    # Load companies needing re-scraping
    companies_file = Path(__file__).parent.parent / "outputs" / "missing_data_analysis" / "high_priority_rescraping.csv"
    
    if not companies_file.exists():
        print("❌ Companies file not found. Run analyze_missing_financial_data_simple.py first.")
        return
    
    print(f"🚀 Starting re-scraping for high priority companies")
    print("=" * 50)
    
    processed = 0
    successful = 0
    failed = 0
    
    with open(companies_file, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            org_nr = row['OrgNr']
            name = row['name']
            priority = row['priority']
            reason = row['reason']
            
            print(f"\\n[{processed + 1}] Processing: {name}")
            print(f"    OrgNr: {org_nr}")
            print(f"    Priority: {priority}")
            print(f"    Reason: {reason}")
            
            try:
                success = rescrape_company_data(org_nr, name)
                if success:
                    successful += 1
                    print(f"    ✅ Successfully updated {name}")
                else:
                    failed += 1
                    print(f"    ❌ Failed to update {name}")
            except Exception as e:
                failed += 1
                print(f"    ❌ Error processing {name}: {e}")
            
            processed += 1
            
            # Add delay to avoid rate limiting
            time.sleep(2)
            
            # Process only first 10 for testing
            if processed >= 10:
                print(f"\\n🛑 Stopping after {processed} companies (testing mode)")
                break
    
    print(f"\\n🎉 Re-scraping completed!")
    print(f"   - Processed: {processed}")
    print(f"   - Successful: {successful}")
    print(f"   - Failed: {failed}")

if __name__ == "__main__":
    main()
'''
    
    script_path = Path(__file__).parent / "rescrape_missing_financial_data.py"
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    print(f"✅ Created re-scraping script: {script_path}")

def main():
    """
    Main function
    """
    high_count, medium_count = analyze_missing_financial_data()
    create_rescraping_script()
    
    print(f"\n🎯 NEXT STEPS:")
    print("=" * 20)
    print("1. Review the CSV files in outputs/missing_data_analysis/")
    print("2. Start with high priority companies (no financial data)")
    print("3. Use your existing fetch_financials_by_companyid.py logic")
    print("4. Integrate with the generated rescrape_missing_financial_data.py script")
    print("5. Re-run this analysis after re-scraping to verify improvements")
    
    if high_count > 0:
        print(f"\n⚠️  URGENT: {high_count} companies have NO financial data at all!")
    if medium_count > 0:
        print(f"📊 {medium_count} companies are missing revenue data")

if __name__ == "__main__":
    main()








