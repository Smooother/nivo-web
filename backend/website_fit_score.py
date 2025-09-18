import os
import openai
import requests
from bs4 import BeautifulSoup
import pandas as pd
from sqlalchemy import create_engine
import time

# Set up OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
assert openai.api_key, "Set your OpenAI API key as the OPENAI_API_KEY environment variable."

DB_PATH = "allabolag.db"
TABLE_IN = "digitizable_ecommerce_and_product_companies"
TABLE_OUT = "website_fit_scores_product_companies"

def load_companies_with_websites():
    engine = create_engine(f"sqlite:///{DB_PATH}")
    df = pd.read_sql(f"SELECT * FROM {TABLE_IN} WHERE homepage IS NOT NULL AND homepage != ''", engine)
    return df.reset_index(drop=True)

def scrape_website_text(url, timeout=10):
    try:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "html.parser")
        texts = soup.stripped_strings
        page_text = "\n".join(texts)
        return page_text[:6000]
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ""

def ai_fit_score(company, site_text):
    prompt = f"""
You are an investment analyst specializing in Swedish SMEs.
Based on the website text below, rate this business from 1 to 5 for fit with these criteria:
- Family or founder owned
- Not part of a large group
- Stable, established business with room to scale or digitize
- Not in excluded industries
- Any signs of openness to new owners/partners

Give a score (1=poor fit, 5=perfect fit) and a short 1-2 sentence justification.

Company: {company['name']} ({company['OrgNr']})
Website: {company['homepage']}

WEBSITE CONTENT:
---
{site_text}
---
"""
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI error for {company['homepage']}: {e}")
        return "ERROR: AI failed"

def main():
    companies = load_companies_with_websites()
    print(f"Loaded {len(companies)} companies from table '{TABLE_IN}'")
    results = []
    engine = create_engine(f"sqlite:///{DB_PATH}")

    for idx, company in companies.iterrows():
        print(f"\n{idx+1}/{len(companies)}: Processing {company['name']} ({company['OrgNr']}) - {company['homepage']}")
        text = scrape_website_text(company['homepage'])
        if not text or len(text) < 200:
            print("Website text too short or failed to load.")
            fit_info = "ERROR: Website could not be scraped"
        else:
            fit_info = ai_fit_score(company, text)
            print("AI Fit Score & Reason:\n", fit_info)
        results.append({
            "OrgNr": company["OrgNr"],
            "name": company["name"],
            "homepage": company["homepage"],
            "fit_score_reason": fit_info
        })
        # Save batch to DB every 5 results
        if (len(results) % 5 == 0) or (idx == len(companies)-1):
            df_results = pd.DataFrame(results)
            df_results.to_sql(TABLE_OUT, engine, if_exists="append", index=False)
            results = []  # Clear buffer to save memory
            print("Partial results saved.")

        time.sleep(3)  # Be nice to OpenAI & websites

    print("\nDone! All fit scores saved to table:", TABLE_OUT)

if __name__ == "__main__":
    main()