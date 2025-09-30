import pandas as pd
from sqlalchemy import create_engine
import numpy as np

engine = create_engine('sqlite:///allabolag.db')
df = pd.read_sql('SELECT * FROM company_accounts_kpi', engine)

print(f"Table has {len(df)} rows.")
print("\nPreview (last 10 rows):")
print(df[['OrgNr', 'year', 'ORS', 'Revenue_growth', 'EBIT_margin', 'NetProfit_margin']].tail(10))

# Check for missing or infinite values in KPIs
for col in ['Revenue_growth', 'EBIT_margin', 'NetProfit_margin']:
    n_missing = df[col].isnull().sum()
    n_infinite = np.isinf(df[col]).sum()
    print(f"\nColumn {col}: {n_missing} missing, {n_infinite} infinite values.")

# Sanity checks
print("\nSanity checks:")
n_neg_revenue = (df['ORS'] < 0).sum()
print(f"Companies with negative revenue: {n_neg_revenue}")

# Unusual margins
unusual_ebit = ((df['EBIT_margin'] < -1) | (df['EBIT_margin'] > 1)).sum()
unusual_net = ((df['NetProfit_margin'] < -1) | (df['NetProfit_margin'] > 1)).sum()
print(f"Rows with EBIT margin outside -100% to +100%: {unusual_ebit}")
print(f"Rows with Net Profit margin outside -100% to +100%: {unusual_net}")
