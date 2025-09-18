import requests
import pandas as pd
import time
import json
from datetime import datetime
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, text
import random
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re
import os
from urllib.parse import urlparse

# Create output directories if they don't exist
os.makedirs('outputs/raw', exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('outputs/raw/fetch.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
BASE_URL = "https://www.allabolag.se"
BUILD_ID = "TErsib-B2eQfZjo2ZZyYp"  # This will be updated dynamically
MIN_REVENUE = 15000
MAX_REVENUE = 150000
MIN_PROFIT = 0
MAX_PROFIT = 1000000
COMPANY_TYPE = "aktiebolag"
CATEGORY_FILE = 'outputs/analysis/all_categories.json'
FINANCIAL_CODES_FILE = "allabolag_financial_codes.json"
MAX_WORKERS = 1  # Reduced to avoid concurrent requests
SLEEP_BETWEEN_PAGES = 10.0  # Increased sleep time between pages
MAX_RETRIES = 5
BACKOFF_FACTOR = 2
MIN_SLEEP = 10  # Increased minimum sleep time
MAX_SLEEP = 20  # Increased maximum sleep time
RATE_LIMIT_SLEEP = 600  # 10 minutes in seconds

def get_build_id():
    """Fetch the current BUILD_ID from the website"""
    try:
        session = create_session()
        response = session.get(BASE_URL)
        response.raise_for_status()
        
        # First try to find it in the HTML source
        html_content = response.text
        
        # Try to find it in the _next/data directory
        match = re.search(r'/_next/data/([^/]+)/', html_content)
        if match:
            build_id = match.group(1)
            logger.info(f"Found BUILD_ID in _next/data directory: {build_id}")
            return build_id
            
        # Try to find it in the _next/static directory
        match = re.search(r'_next/static/([^/]+)', html_content)
        if match:
            build_id = match.group(1)
            logger.info(f"Found BUILD_ID in _next/static directory: {build_id}")
            return build_id
            
        # Try to find it in any script tag
        script_matches = re.finditer(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL)
        for script_match in script_matches:
            script_content = script_match.group(1)
            # Look for buildId in the script content
            build_id_match = re.search(r'buildId["\']:\s*["\']([^"\']+)["\']', script_content)
            if build_id_match:
                build_id = build_id_match.group(1)
                logger.info(f"Found BUILD_ID in script tag: {build_id}")
                return build_id
        
        # If we still haven't found it, try to get it from a known company page
        test_company = "5564720208"  # A known company number
        company_url = f"{BASE_URL}/company/{test_company}"
        response = session.get(company_url)
        response.raise_for_status()
        
        # Look for the BUILD_ID in the company page
        match = re.search(r'/_next/data/([^/]+)/', response.text)
        if match:
            build_id = match.group(1)
            logger.info(f"Found BUILD_ID from company page: {build_id}")
            return build_id
        
        logger.error("Could not find BUILD_ID in any of the expected locations")
        return None
    except Exception as e:
        logger.error(f"Error fetching BUILD_ID: {str(e)}")
        return None

# Load financial codes mapping
with open(FINANCIAL_CODES_FILE, "r", encoding="utf-8") as f:
    financial_codes = json.load(f)

# 1. Load all segments/categories from your json file
with open(CATEGORY_FILE, "r", encoding="utf-8") as f:
    categories = json.load(f)

# Create a session with retry logic
def create_session():
    """Create a session with retry strategy"""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Create database tables
def create_tables(engine):
    metadata = MetaData()
    
    # Companies table
    Table('companies', metadata,
        Column('OrgNr', String, primary_key=True),
        Column('name', String),
        Column('address', String),
        Column('city', String),
        Column('postal_code', String),
        Column('category', String),
        Column('category_code', String),
        Column('revenue', Float),
        Column('profit', Float),
        Column('employees', Integer),
        Column('last_updated', DateTime)
    )
    
    # Company accounts table
    Table('company_accounts', metadata,
        Column('OrgNr', String),
        Column('year', Integer),
        Column('revenue', Float),
        Column('profit', Float),
        Column('employees', Integer),
        Column('last_updated', DateTime)
    )
    
    metadata.create_all(engine)

def fetch_company_details(org_nr, session):
    """Fetch detailed company information"""
    # First try to get the company page which will redirect us to the correct URL
    url = f"{BASE_URL}/company/{org_nr}"
    
    try:
        response = session.get(url, allow_redirects=True)
        
        # Check for rate limiting
        if response.status_code == 429:
            retry_after = int(response.headers.get('retry-after', RATE_LIMIT_SLEEP))
            logger.warning(f"Rate limited. Waiting for {retry_after} seconds")
            time.sleep(retry_after)
            return None, []
            
        response.raise_for_status()
        
        # Get the final URL after redirects
        final_url = response.url
        
        # Extract the company ID from the URL
        company_id = final_url.split('/')[-1]
        
        # Now fetch the actual company data using the company ID
        company_url = f"{BASE_URL}/_next/data/{BUILD_ID}/foretag/{company_id}.json"
        response = session.get(company_url)
        
        # Check for rate limiting again
        if response.status_code == 429:
            retry_after = int(response.headers.get('retry-after', RATE_LIMIT_SLEEP))
            logger.warning(f"Rate limited. Waiting for {retry_after} seconds")
            time.sleep(retry_after)
            return None, []
            
        response.raise_for_status()
        data = response.json()
        
        if 'pageProps' not in data or 'company' not in data['pageProps']:
            logger.warning(f"No company data found for {org_nr}")
            return None, []
            
        company = data['pageProps']['company']
        
        # Extract financial data
        financials = []
        if 'yearlyFinancials' in company:
            for year_data in company['yearlyFinancials']:
                year = year_data.get('year')
                if year:
                    financial = {
                        'OrgNr': org_nr,
                        'year': year,
                        'revenue': float(year_data.get('revenue', 0)),
                        'profit': float(year_data.get('profit', 0)),
                        'employees': int(year_data.get('employees', 0)),
                        'last_updated': datetime.now()
                    }
                    financials.append(financial)
        
        return {
            'OrgNr': org_nr,
            'name': company.get('name', ''),
            'address': company.get('address', ''),
            'city': company.get('city', ''),
            'postal_code': company.get('postalCode', ''),
            'category': company.get('category', ''),
            'category_code': company.get('categoryCode', ''),
            'revenue': float(company.get('revenue', 0)),
            'profit': float(company.get('profit', 0)),
            'employees': int(company.get('employees', 0)),
            'last_updated': datetime.now()
        }, financials
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching company {org_nr}: {str(e)}")
        return None, []
    except Exception as e:
        logger.error(f"Unexpected error for company {org_nr}: {str(e)}")
        return None, []

def fetch_companies(session, page, category):
    url = f"https://www.allabolag.se/_next/data/{BUILD_ID}/segmentation.json"
    params = {
        "page": page,
        "pageSize": 100,
        "sort": "relevance",
        "naceIndustryName": category
    }
    
    try:
        response = session.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Extract companies from the new response structure
        companies = data.get('pageProps', {}).get('companies', [])
        if not companies:
            logger.warning(f"No companies found in response for page {page}, category {category}")
            return []
            
        return companies
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching page {page} for category {category}: {str(e)}")
        return []

def fetch_companies_for_category(category_id, category_name, session):
    """Fetch all companies for a given category"""
    logger.info(f"Processing category: {category_name} ({category_id})")
    
    # Add a delay between categories
    time.sleep(SLEEP_BETWEEN_PAGES)
    
    url = f"{BASE_URL}/_next/data/{BUILD_ID}/segmentation.json"
    params = {
        'type': 'aktiebolag',
        'revenue': '15000-150000',
        'profit': '0-1000000',
        'category': category_id
    }
    
    try:
        response = session.get(url, params=params)
        
        # Check for rate limiting
        if response.status_code == 429:
            retry_after = int(response.headers.get('retry-after', RATE_LIMIT_SLEEP))
            logger.warning(f"Rate limited. Waiting for {retry_after} seconds")
            time.sleep(retry_after)
            return
            
        response.raise_for_status()
        data = response.json()
        
        if 'pageProps' not in data or 'companies' not in data['pageProps']:
            logger.warning(f"No companies found for category {category_name}")
            return
            
        companies = data['pageProps']['companies']
        
        for company in companies:
            org_nr = company.get('orgNr')
            if not org_nr or not org_nr.startswith('55'):  # Skip invalid org numbers
                continue
                
            # Add a random delay between company requests
            time.sleep(random.uniform(MIN_SLEEP, MAX_SLEEP))
            
            company_data, financials = fetch_company_details(org_nr, session)
            if company_data:
                save_company_data(company_data, financials)
                
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching category {category_name}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error for category {category_name}: {str(e)}")

def main():
    """Main function to fetch and save company data"""
    global BUILD_ID
    
    # Get current BUILD_ID
    BUILD_ID = get_build_id()
    if not BUILD_ID:
        # Fallback to a known working BUILD_ID
        BUILD_ID = "TErsib-B2eQfZjo2ZZyYp"
        logger.warning(f"Using fallback BUILD_ID: {BUILD_ID}")
    
    logger.info(f"Using BUILD_ID: {BUILD_ID}")
    
    # Create database connection
    engine = create_engine('sqlite:///allabolag.db')
    create_tables(engine)
    
    # Use the already loaded categories variable
    logger.info(f"Found {len(categories)} categories to process")
    
    all_companies = []
    all_financials = []
    
    # Process categories with progress bar
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for category in categories:
            futures.append(executor.submit(fetch_companies_for_category, category['code'], category['name'], create_session()))
        
        for i, future in enumerate(tqdm(futures, total=len(categories), desc="Processing categories")):
            try:
                future.result()
                logger.info(f"{i+1}/{len(categories)}: Segment {categories[i]['name']} ({categories[i]['code']}) finished.")
            except Exception as e:
                logger.error(f"Error processing category {categories[i]['name']}: {str(e)}")
    
    # Convert to DataFrames
    if all_companies:
        df_companies = pd.DataFrame(all_companies)
        df_companies.to_sql("companies", engine, if_exists="replace", index=False)
        logger.info(f"Saved {len(df_companies)} companies to database")
    else:
        logger.warning("No companies found to save")
        
    if all_financials:
        df_financials = pd.DataFrame(all_financials)
        df_financials.to_sql("company_accounts", engine, if_exists="replace", index=False)
        logger.info(f"Saved {len(df_financials)} financial records to database")
    else:
        logger.warning("No financial records found to save")
    
    logger.info("Data fetching and saving completed")

    # Create indexes using SQLAlchemy text()
    with engine.connect() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_orgnr_companies ON companies(OrgNr)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_orgnr_year ON company_accounts(OrgNr, year)"))
        conn.commit()

    print("\nAvailable financial metrics:")
    for code, mapping in financial_codes.items():
        print(f"- {mapping['en']} ({code})")

if __name__ == "__main__":
    main()