import requests
import pandas as pd
from sqlalchemy import create_engine
import concurrent.futures
import time
import json
from sqlalchemy import text

DB_FILE = "allabolag.db"
TABLE_COMPANIES = "segmentation_companies_raw"
TABLE_OUTPUT = "company_accounts_by_id"
CONCURRENCY = 10
BUILD_ID = "TErsib-B2eQfZjo2ZZyYp"
URL_BASE = f"https://www.allabolag.se/_next/data/{BUILD_ID}/company/{{companyId}}.json"

engine = create_engine(f"sqlite:///{DB_FILE}")

# Get all companies with a resolved companyId that are not yet in the output table
companies = pd.read_sql(
    f"""SELECT organisationNumber, companyId, name
    FROM {TABLE_COMPANIES}
    WHERE organisationNumber = '5562281286' AND companyId IS NOT NULL
    """,
    engine
)

RETRY_STATUS_CODES = {429, 500, 502, 503, 504}

def fetch_financials(row, max_retries=5):
    orgnr, companyId, name = row.organisationNumber, row.companyId, row.name
    url = URL_BASE.format(companyId=companyId)
    tries = 0
    while tries < max_retries:
        try:
            resp = requests.get(url, timeout=20)
            if resp.status_code in RETRY_STATUS_CODES:
                raise requests.HTTPError(f"Server error: {resp.status_code}")
            resp.raise_for_status()
            j = resp.json()
            company = j.get("pageProps", {}).get("company", {})
            accounts = company.get("companyAccounts", [])
            results = []
            for acc in accounts:
                base = {
                    "companyId": companyId,
                    "organisationNumber": orgnr,
                    "name": name,
                    "year": acc.get("year"),
                    "period": acc.get("period"),
                    "periodStart": acc.get("periodStart"),
                    "periodEnd": acc.get("periodEnd"),
                    "length": acc.get("length"),
                    "currency": acc.get("currency"),
                    "remark": acc.get("remark"),
                    "referenceUrl": acc.get("referenceUrl"),
                    "accIncompleteCode": acc.get("accIncompleteCode"),
                    "accIncompleteDesc": acc.get("accIncompleteDesc"),
                }
                for item in acc.get("accounts", []):
                    code = item.get("code")
                    amount = item.get("amount")
                    base[code] = amount
                results.append(base)
            return results
        except Exception as e:
            tries += 1
            wait = min(60, 2 ** tries)
            print(f"Error for {orgnr} ({companyId}, {name}): {e} (try {tries}/{max_retries}), waiting {wait}s...")
            time.sleep(wait)
    print(f"Failed to fetch after {max_retries} tries: {orgnr} ({companyId}, {name})")
    return []

def save_financials(financials):
    if not financials:
        return
    df = pd.DataFrame(financials)
    with engine.begin() as conn:
        df.to_sql(TABLE_OUTPUT, conn, if_exists="append", index=False)
    print(f"Saved {len(df)} rows to '{TABLE_OUTPUT}'.")

def main():
    print(f"Loaded {len(companies)} companies with resolved companyId to process.")
    batch = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {executor.submit(fetch_financials, row): row for _, row in companies.iterrows()}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            if result:
                batch.extend(result)
            if i % 10 == 0 or i == len(futures):
                if batch:
                    save_financials(batch)
                    batch = []
                print(f"Processed {i} companies")
    print("All done.")

if __name__ == "__main__":
    main() 