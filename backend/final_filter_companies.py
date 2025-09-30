import pandas as pd
import sqlite3
from datetime import datetime
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create output directory if it doesn't exist
os.makedirs('outputs/reports', exist_ok=True)

def get_latest_kpis(conn):
    # Get latest year per OrgNr from company_kpis
    kpis = pd.read_sql('SELECT * FROM company_kpis', conn)
    if kpis.empty:
        return kpis
    idx = kpis.groupby('OrgNr')['year'].idxmax()
    latest_kpis = kpis.loc[idx].reset_index(drop=True)
    return latest_kpis

def get_latest_accounts(conn):
    # Get latest year per OrgNr from company_accounts
    accounts = pd.read_sql('SELECT * FROM company_accounts', conn)
    if accounts.empty:
        return accounts
    idx = accounts.groupby('OrgNr')['year'].idxmax()
    latest_accounts = accounts.loc[idx].reset_index(drop=True)
    return latest_accounts

def main():
    conn = sqlite3.connect('allabolag.db')
    logger.info('Loading data...')
    kpis = get_latest_kpis(conn)
    accounts = get_latest_accounts(conn)
    enriched = pd.read_sql('SELECT * FROM companies_enriched', conn)

    if kpis.empty or accounts.empty or enriched.empty:
        logger.warning('One or more tables are empty. Exiting.')
        return

    # Merge on OrgNr and year (latest year per company)
    merged = pd.merge(kpis, accounts, on=['OrgNr', 'year'], suffixes=('_kpi', '_acc'))
    merged = pd.merge(merged, enriched, on='OrgNr', how='left')

    logger.info(f"Merged dataset: {len(merged)} companies")

    # Apply sensible filters
    filtered = merged[
        (merged['SDI'] >= 15000) & (merged['SDI'] <= 150000) &  # Revenue
        (merged['DR'] > 0) &                                    # EBIT positive
        (merged['ORS'] > 0) &                                   # Net profit positive
        (merged['Revenue_growth'] > 0.10) &                     # Revenue growth > 10%
        (merged['EBIT_margin'] > 0.05) &                        # EBIT margin > 5%
        (merged['NetProfit_margin'] > 0.03) &                   # Net profit margin > 3%
        (merged['employees'] >= 1)                              # At least 1 employee
    ]

    logger.info(f"Filtered down to {len(filtered)} companies after applying criteria.")

    # Prepare report
    report = filtered[[
        'OrgNr', 'name', 'segment_name', 'SDI', 'DR', 'ORS', 'employees',
        'Revenue_growth', 'EBIT_margin', 'NetProfit_margin',
        'homepage', 'email', 'year'
    ]].copy()
    report.rename(columns={
        'SDI': 'Revenue_SEK',
        'DR': 'EBIT_SEK',
        'ORS': 'NetProfit_SEK',
        'employees': 'Employees',
        'Revenue_growth': 'RevenueGrowth',
        'EBIT_margin': 'EBITMargin',
        'NetProfit_margin': 'NetProfitMargin',
        'segment_name': 'Segment',
        'name': 'CompanyName',
        'homepage': 'Homepage',
        'email': 'Email',
        'year': 'Year'
    }, inplace=True)

    # Format
    for col in ['Revenue_SEK', 'EBIT_SEK', 'NetProfit_SEK']:
        report[col] = report[col].apply(lambda x: f"{x:,.0f} SEK")
    for col in ['RevenueGrowth', 'EBITMargin', 'NetProfitMargin']:
        report[col] = report[col].apply(lambda x: f"{x:.1%}")

    # Save
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    outname = f'outputs/reports/final_filtered_companies_{timestamp}.xlsx'
    report.to_excel(outname, index=False)
    logger.info(f"Saved final filtered report to {outname}")
    print(f"\nTop 5 segments in final filtered list:\n{report['Segment'].value_counts().head()}")
    print(f"\nTotal companies in final filtered list: {len(report)}")

if __name__ == '__main__':
    main() 