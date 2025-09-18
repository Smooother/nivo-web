import pandas as pd
from sqlalchemy import create_engine

# Connect to database
engine = create_engine('sqlite:///allabolag.db')

# Read the filtered companies table
filtered_table = "filtered_companies_v20250528_095611"
df = pd.read_sql(f"SELECT * FROM {filtered_table}", engine)

# Convert numeric columns
for col in ['revenue', 'profit', 'employees']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Calculate revenue per employee in millions SEK
df['revenue_per_employee'] = (df['revenue'] / 1000) / df['employees']

# Filter companies that have a fit score reason
filtered_df = df[df['fit_score_reason'].notna()].copy()

# --- NEW: Filter for positive net profit (DR) for the years 2023, 2022, and 2021 ---
# Load company_accounts
accounts = pd.read_sql('SELECT OrgNr, year, DR FROM company_accounts', engine)
accounts['year'] = pd.to_numeric(accounts['year'], errors='coerce')
accounts['DR'] = pd.to_numeric(accounts['DR'], errors='coerce')

# Define the years to check
years_to_check = [2023, 2022, 2021]

# For each company, check if all 3 years have DR > 0
def has_positive_profit(orgnr):
    recs = accounts[(accounts['OrgNr'] == orgnr) & (accounts['year'].isin(years_to_check))]
    if len(recs) < 3:
        return False  # Require all 3 years
    return (recs['DR'] > 0).all()

filtered_df['positive_profit_3y'] = filtered_df['OrgNr'].apply(has_positive_profit)
final_df = filtered_df[filtered_df['positive_profit_3y']].copy()

# Print statistics
print(f"\nTotal companies before filtering: {len(df)}")
print(f"Companies with fit score reason: {len(filtered_df)}")
print(f"Companies with positive profit all last 3 years: {len(final_df)}")

# Print top sectors in remaining companies
print("\nTop sectors in remaining companies:")
print(final_df['segment_name'].value_counts().head(10))

# Print revenue per employee statistics
print("\nRevenue per employee statistics (MSEK):")
print(final_df['revenue_per_employee'].describe())

# Print sample of remaining companies
print("\nSample of remaining companies:")
print(final_df[['name', 'segment_name', 'revenue_per_employee', 'fit_score_reason']].head(10))

# Ask for confirmation before creating new table
print("\nDo you want to create a new table with these filtered results? (y/n)")
response = input().lower()

if response == 'y':
    # Create new table with timestamp
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_table_name = f'filtered_companies_v{timestamp}'
    
    # Save to database
    final_df.drop(columns=['positive_profit_3y'], inplace=True)
    final_df.to_sql(new_table_name, engine, if_exists='replace', index=False)
    print(f"\nCreated new table: {new_table_name}")
    print(f"Total companies in new table: {len(final_df)}") 