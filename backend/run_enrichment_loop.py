import subprocess
import time
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text

def get_missing_count():
    """Get the number of companies still missing financial data"""
    engine = create_engine('sqlite:///allabolag.db')
    try:
        # Get count of companies with companyId
        total = pd.read_sql(
            text("SELECT COUNT(*) as count FROM companies_enriched WHERE companyId IS NOT NULL"),
            engine
        ).iloc[0]['count']
        
        # Get count of companies with financials
        have_financials = pd.read_sql(
            text("SELECT COUNT(DISTINCT OrgNr) as count FROM company_accounts"),
            engine
        ).iloc[0]['count']
        
        return total - have_financials
    except Exception as e:
        print(f"Error checking missing count: {e}")
        return None

def run_enrichment():
    """Run the enrichment script and return success status"""
    try:
        result = subprocess.run(
            ['python', 'enrich_financials.py'],
            capture_output=True,
            text=True
        )
        print(f"\nRun completed with exit code: {result.returncode}")
        print("Output:")
        print(result.stdout)
        if result.stderr:
            print("Errors:")
            print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running enrichment script: {e}")
        return False

def main():
    iteration = 1
    max_iterations = 100  # Safety limit
    min_wait_time = 60  # Minimum seconds between runs
    
    print(f"Starting enrichment loop at {datetime.now()}")
    
    while iteration <= max_iterations:
        print(f"\n=== Iteration {iteration} ===")
        
        # Check how many companies are still missing data
        missing = get_missing_count()
        if missing is None:
            print("Error checking missing count, waiting 5 minutes before retry...")
            time.sleep(300)
            continue
            
        print(f"Companies still missing financial data: {missing}")
        
        if missing == 0:
            print("\nAll companies have financial data! Exiting loop.")
            break
            
        # Run the enrichment script
        success = run_enrichment()
        
        if not success:
            print("\nEnrichment script failed, waiting 5 minutes before retry...")
            time.sleep(300)
            continue
            
        # Wait before next iteration
        print(f"\nWaiting {min_wait_time} seconds before next iteration...")
        time.sleep(min_wait_time)
        
        iteration += 1
    
    if iteration > max_iterations:
        print("\nReached maximum number of iterations. Please check the data manually.")
    
    print(f"\nEnrichment loop completed at {datetime.now()}")

if __name__ == "__main__":
    main() 