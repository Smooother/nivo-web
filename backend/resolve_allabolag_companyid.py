import requests
import pandas as pd
from sqlalchemy import create_engine, text
import concurrent.futures
import time

DB_FILE = "allabolag.db"
TABLE = "segmentation_companies_raw"
CONCURRENCY = 20
BASE_URL = "https://www.allabolag.se/company/{}"

engine = create_engine(f"sqlite:///{DB_FILE}")

# Get all org numbers
companies = pd.read_sql(f"SELECT rowid, organisationNumber FROM {TABLE} WHERE organisationNumber IS NOT NULL", engine)

# Function to resolve companyId from org number
def resolve_companyid(row):
    rowid, orgnr = row.rowid, row.organisationNumber
    try:
        url = BASE_URL.format(orgnr)
        resp = requests.get(url, allow_redirects=True, timeout=20)
        resp.raise_for_status()
        # The final URL after redirects contains the Allabolag companyId as the last part
        final_url = resp.url
        company_id = final_url.rstrip('/').split('/')[-1]
        # Only update if the company_id is not the same as orgnr (to avoid overwriting with orgnr)
        if company_id and company_id != orgnr:
            return (rowid, company_id)
    except Exception as e:
        print(f"Error resolving companyId for {orgnr}: {e}")
        return (rowid, None)

def main():
    updates = []
    with engine.begin() as conn:
        with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
            futures = [executor.submit(resolve_companyid, row) for row in companies.itertuples()]
            for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
                rowid, company_id = future.result()
                if company_id:
                    try:
                        conn.execute(
                            text(f"UPDATE {TABLE} SET companyId = :companyId WHERE rowid = :rowid"),
                            {"companyId": company_id, "rowid": rowid}
                        )
                    except Exception as e:
                        print(f"DB update error for rowid {rowid}: {e}")
                if i % 10 == 0:
                    print(f"Saved {i} companies...")
    print(f"Processed {len(companies)} companies...")

if __name__ == "__main__":
    main() 