import pandas as pd
from sqlalchemy import create_engine

DB_FILE = "allabolag.db"
TABLE_INPUT = "company_accounts_by_id"
TABLE_OUTPUT = "company_kpis_by_id"

engine = create_engine(f"sqlite:///{DB_FILE}")

# Load all financials
df = pd.read_sql(f"SELECT * FROM {TABLE_INPUT}", engine)

# Convert numeric columns
df["year"] = pd.to_numeric(df["year"], errors="coerce")
df["SDI"] = pd.to_numeric(df["SDI"], errors="coerce")
df["RG"] = pd.to_numeric(df["RG"], errors="coerce")
df["DR"] = pd.to_numeric(df["DR"], errors="coerce")
df["resultat_e_finansnetto"] = pd.to_numeric(df["resultat_e_finansnetto"], errors="coerce")
df["EKA"] = pd.to_numeric(df["EKA"], errors="coerce")
df["avk_eget_kapital"] = pd.to_numeric(df["avk_eget_kapital"], errors="coerce")

# Sort for growth calculation
df = df.sort_values(["companyId", "year"])

# Calculate KPIs
def calc_growth(x, col):
    return x[col].pct_change()

df["ebit_margin"] = df["RG"] / df["SDI"]
df["net_margin"] = df["DR"] / df["SDI"]
df["pbt_margin"] = df["resultat_e_finansnetto"] / df["SDI"]
df["revenue_growth"] = df.groupby("companyId").apply(lambda x: calc_growth(x, "SDI")).reset_index(level=0, drop=True)
df["ebit_growth"] = df.groupby("companyId").apply(lambda x: calc_growth(x, "RG")).reset_index(level=0, drop=True)
df["profit_growth"] = df.groupby("companyId").apply(lambda x: calc_growth(x, "DR")).reset_index(level=0, drop=True)
df["equity_ratio"] = df["EKA"]
df["return_on_equity"] = df["avk_eget_kapital"]

# Select columns to save
cols = [
    "companyId", "organisationNumber", "name", "year",
    "ebit_margin", "net_margin", "pbt_margin", "revenue_growth", "ebit_growth", "profit_growth", "equity_ratio", "return_on_equity"
]
kpis = df[cols]

with engine.begin() as conn:
    kpis.to_sql(TABLE_OUTPUT, conn, if_exists="replace", index=False)

print(f"Saved {len(kpis)} rows to '{TABLE_OUTPUT}'.")