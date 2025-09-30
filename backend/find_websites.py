import sqlite3
import requests
from bs4 import BeautifulSoup
import time
import random
from urllib.parse import quote_plus
import re

def get_companies_without_websites():
    conn = sqlite3.connect('allabolag.db')
    cursor = conn.cursor()
    
    # Get companies without websites from enhanced_segmentation
    cursor.execute("""
        SELECT e.OrgNr, e.name, c.address, c.city 
        FROM enhanced_segmentation e
        JOIN companies c ON e.OrgNr = c.OrgNr
        WHERE e.homepage IS NULL OR e.homepage = ''
    """)
    
    companies = cursor.fetchall()
    conn.close()
    return companies

def search_company_website(company_name, city):
    # Construct search query
    search_query = f"{company_name} {city} site:.se"
    encoded_query = quote_plus(search_query)
    
    # Use a more natural user agent
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        # Search using Google
        url = f"https://www.google.com/search?q={encoded_query}"
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the first result that's not from allabolag.se
        for result in soup.find_all('a'):
            href = result.get('href', '')
            if href.startswith('http') and 'allabolag.se' not in href and '.se' in href:
                # Extract the actual URL from Google's redirect
                match = re.search(r'https?://[^/]+', href)
                if match:
                    return match.group(0)
        
        return None
    except Exception as e:
        print(f"Error searching for {company_name}: {str(e)}")
        return None

def update_company_website(org_nr, website):
    conn = sqlite3.connect('allabolag.db')
    cursor = conn.cursor()
    
    # Update both enhanced_segmentation and companies tables
    cursor.execute("""
        UPDATE enhanced_segmentation 
        SET homepage = ? 
        WHERE OrgNr = ?
    """, (website, org_nr))
    
    cursor.execute("""
        UPDATE companies 
        SET homepage = ? 
        WHERE OrgNr = ?
    """, (website, org_nr))
    
    conn.commit()
    conn.close()

def main():
    companies = get_companies_without_websites()
    print(f"Found {len(companies)} companies without websites")
    
    for i, (org_nr, name, address, city) in enumerate(companies, 1):
        print(f"\nProcessing {i}/{len(companies)}: {name}")
        
        # Try to find website
        website = search_company_website(name, city)
        
        if website:
            print(f"Found website for {name}: {website}")
            update_company_website(org_nr, website)
        else:
            print(f"No website found for {name}")
        
        # Add random delay between requests to avoid being blocked
        time.sleep(random.uniform(2, 4))

if __name__ == "__main__":
    main() 