import pandas as pd
import requests
import sqlalchemy
import concurrent.futures
from sqlalchemy import create_engine

DB_FILE = "allabolag.db"
TABLE_COMPANIES = "segmentation_companies_raw"
TABLE_FINANCIALS = "company_accounts"
CONCURRENCY = 5

BUILD_ID = "TErsib-B2eQfZjo2ZZyYp"
URL_BASE = f"https://www.allabolag.se/_next/data/{BUILD_ID}/company/{{organisationNumber}}.json"

def get_missing_companies():
    engine = create_engine(f"sqlite:///{DB_FILE}")
    # Get all companies with an organisationNumber and name, only those not excluded
    companies = pd.read_sql(
        f"SELECT organisationNumber, name FROM {TABLE_COMPANIES} WHERE organisationNumber IS NOT NULL AND exclude = 0", engine
    )
    # Get all organisationNumbers already in the financials table
    try:
        have_financials = pd.read_sql(
            f"SELECT DISTINCT organisationNumber FROM {TABLE_FINANCIALS}", engine
        )
        companies = companies[~companies['organisationNumber'].isin(have_financials['organisationNumber'])]
    except Exception as e:
        print(f"(No financials table found yet, will fetch for all companies) {e}")
    return companies

def fetch_company_financials(row):
    organisationNumber, name = row.organisationNumber, row.name
    name_str = str(name) if pd.notnull(name) else ""
    if not name_str.strip():
        print(f"  Skipping {organisationNumber}: empty or invalid company name")
        return []
    url = URL_BASE.format(organisationNumber=organisationNumber)
    params = {
        "organisationNumber": organisationNumber,
        "name": name_str.replace(' ', '-').lower(),
    }
    try:
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        j = resp.json()
        company = j.get("pageProps", {}).get("company", {})
        accounts = company.get("companyAccounts", [])
        financial_rows = []
        for acc in accounts:
            year = int(acc.get("year", 0))
            row_base = {
                "organisationNumber": organisationNumber,
                "name": name_str,
                "year": year,
                "PeriodStart": acc.get("periodStart"),
                "PeriodEnd": acc.get("periodEnd"),
            }
            data = {
                x["code"]: float(x["amount"]) if x["amount"] is not None else None
                for x in acc.get("accounts", [])
            }
            data_row = {**row_base, **data}
            financial_rows.append(data_row)
        print(f"Fetched {len(financial_rows)} years for {organisationNumber} ({name_str})")
        return financial_rows
    except Exception as e:
        print(f"Error for {organisationNumber} ({name_str}): {e}")
        return []

def save_financials(financials):
    if not financials:
        print("No financial data to save.")
        return
    df = pd.DataFrame(financials)
    engine = create_engine(f"sqlite:///{DB_FILE}")
    df.to_sql(TABLE_FINANCIALS, engine, if_exists="append", index=False)
    print(f"Saved {len(df)} rows to '{TABLE_FINANCIALS}'.")

def main():
    companies = get_missing_companies()
    print(f"Loaded {len(companies)} companies missing financial data.")

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(fetch_company_financials, row) for _, row in companies.iterrows()]
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            if result:
                save_financials(result)
            if i % 10 == 0:
                print(f"Fetched data for {i} companies")

if __name__ == "__main__":
    main()