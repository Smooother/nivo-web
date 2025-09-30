import os
import time
import json
import requests
import pandas as pd
from sqlalchemy import create_engine, inspect
from urllib.parse import urlencode
from threading import Thread, Lock
from queue import Queue

DB_PATH = "allabolag.db"
TABLE_NAME = "segmentation_companies_raw"
MAX_WORKERS = 10  # Number of concurrent requests

# ---- Easily adjustable segmentation parameters ----
SEGMENTATION_PARAMS = {
    "profitFrom": 500,
    "profitTo": 87067716,
    "companyType": "AB",
    "revenueFrom": 50000,
    "revenueTo": 150000,
    # Add more params as needed
}

SEGMENTATION_BASE_URL = "https://www.allabolag.se/_next/data/TErsib-B2eQfZjo2ZZyYp/segmentation.json"

# ---- Category filtering (align with mark_excluded_companies.py) ----
EXCLUDE_NACE_KEYWORDS = [
    "Uthyrning och förvaltning", "Fastighetsförvaltning", "Handel med egna fastigheter",
    "Förvaltning av och handel med värdepapper", "Investment- och riskkapitalbolagsverksamhet",
    "Holdingverksamhet", "Personalutbildning", "Gymnasial yrkesutbildning", "Förskoleutbildning",
    "Grundskoleutbildning", "Öppna sociala insatser", "Odling", "Mjölkproduktion", "Skogsförvaltning",
    "Verksamhet i andra intresseorganisationer", "Allmännyttiga anläggningsarbeten",
    "Specialiserad butikshandel", "Apotekshandel", "Butikshandel", "Uthyrning och leasing",
    "Arbetsförmedling", "Callcenterverksamhet", "Magasinering", "Städning", "Lokalvård",
]
EXCEPTION_NACE = "Uthyrning och leasing av bygg- och anläggningsmaskiner"

# ---- DB SETUP ----
engine = create_engine(f"sqlite:///{DB_PATH}")
lock = Lock()

def get_existing_company_ids():
    inspector = inspect(engine)
    if inspector.has_table(TABLE_NAME):
        df = pd.read_sql(f"SELECT companyId FROM {TABLE_NAME}", engine)
        return set(df['companyId'].astype(str))
    return set()

def save_companies(companies):
    if not companies:
        return
    df = pd.DataFrame(companies)
    with lock:
        df.to_sql(TABLE_NAME, engine, if_exists="append", index=False)

def extract_companies_from_json(data):
    companies = []
    for c in data["pageProps"]["companies"]:
        nace_cats = c.get("naceCategories") or []
        # Exclusion logic
        if any(EXCEPTION_NACE in nc for nc in nace_cats):
            pass  # Always keep if exception present
        elif any(any(excl in nc for excl in EXCLUDE_NACE_KEYWORDS) for nc in nace_cats):
            continue  # Exclude if any exclusion keyword matches
        companies.append({
            "companyId": c.get("companyId") or c.get("organisationNumber"),
            "name": c.get("name"),
            "homePage": c.get("homePage"),
            "naceCategories": json.dumps(nace_cats),  # Save as JSON string
            "revenue": c.get("revenue"),
            "profit": c.get("profit"),
            "foundationYear": c.get("foundationYear"),
        })
    return companies

def get_last_processed_page():
    if os.path.exists("segmentation_last_page.txt"):
        with open("segmentation_last_page.txt", "r") as f:
            return int(f.read().strip())
    return 1

def set_last_processed_page(page):
    with open("segmentation_last_page.txt", "w") as f:
        f.write(str(page))

def fetch_page_worker(q, seen_pages, existing_ids):
    while True:
        try:
            page = q.get(timeout=3)
        except:
            return
        params = SEGMENTATION_PARAMS.copy()
        params["page"] = page
        url = SEGMENTATION_BASE_URL + "?" + urlencode(params)
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            data = r.json()
            companies = extract_companies_from_json(data)
            # Deduplicate
            new_companies = [c for c in companies if str(c["companyId"]) not in existing_ids]
            if new_companies:
                save_companies(new_companies)
                print(f"Page {page}: Added {len(new_companies)} new companies.")
                with lock:
                    existing_ids.update(str(c["companyId"]) for c in new_companies)
            else:
                print(f"Page {page}: No new companies to add.")
            set_last_processed_page(page)
            next_page = data["pageProps"].get("pagination", {}).get("next")
            if next_page and next_page not in seen_pages:
                with lock:
                    if next_page not in seen_pages:
                        seen_pages.add(next_page)
                        q.put(next_page)
        except Exception as e:
            print(f"Error on page {page}: {e}")
            print("Sleeping 60s before retrying...")
            time.sleep(60)
            q.put(page)  # retry this page
        finally:
            q.task_done()
        time.sleep(1)

def main():
    existing_ids = get_existing_company_ids()
    start_page = get_last_processed_page()
    print(f"Starting from page {start_page}")
    q = Queue()
    seen_pages = set()
    seen_pages.add(start_page)
    q.put(start_page)
    threads = []
    for _ in range(MAX_WORKERS):
        t = Thread(target=fetch_page_worker, args=(q, seen_pages, existing_ids))
        t.daemon = True
        t.start()
        threads.append(t)
    q.join()  # Wait for all work to finish
    print("All pages processed.")

if __name__ == "__main__":
    main()