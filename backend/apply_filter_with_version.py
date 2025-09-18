import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime

# Connect to database
engine = create_engine('sqlite:///allabolag.db')

# Read the data
companies_df = pd.read_sql('SELECT * FROM digitizable_ecommerce_and_product_companies', engine)
ratings_df = pd.read_sql('SELECT OrgNr, fit_score_reason FROM website_fit_scores_product_companies', engine)

# Convert numeric columns
for col in ['revenue', 'profit', 'employees']:
    companies_df[col] = pd.to_numeric(companies_df[col], errors='coerce')

# Calculate revenue per employee (in millions SEK)
companies_df['revenue_per_employee'] = (companies_df['revenue'] / 1000) / companies_df['employees']

# Merge with ratings to get AI comments
merged_df = pd.merge(companies_df, ratings_df, on='OrgNr', how='left')

# Service business keywords (expanded)
service_keywords = [
    # Original service keywords
    'restaurant', 'café', 'cafe', 'hotel', 'hotell',
    'consulting', 'consultancy', 'konsult',
    'cleaning', 'städ', 'städning',
    'security', 'säkerhet', 'vakt',
    'catering', 'matlagning',
    'salon', 'salong', 'hairdresser', 'frisör',
    'gym', 'fitness', 'träning',
    'photography', 'foto', 'fotografi',
    'studio', 'ateljé',
    'service', 'reparation', 'repair',
    'installation', 'underhåll', 'maintenance',
    'butik', 'shop', 'retail', 'detaljhandel',
    
    # Mechanical/metal service keywords
    'rostfri', 'rostfria', 'plåt', 'plåtslageri', 'slageri',
    'mekanisk', 'mekaniska', 'verkstad', 'verkstäder',
    'svets', 'svetsning', 'svetsare', 'svetsar',
    'bearbetning', 'bearbetning', 'maskin',
    'service', 'servicing', 'reparation',
    'montering', 'montage', 'installation',
    'underhåll', 'maintenance', 'service'
]

# Function to check if business is service-oriented
def is_service_business(row):
    comment = row.get('fit_score_reason', '')
    sector = row.get('segment_name', '')
    name = row.get('name', '')
    text = f"{comment} {sector} {name}".lower()
    return any(keyword in text for keyword in service_keywords)

# Apply filters
mask_service = merged_df.apply(is_service_business, axis=1)
mask_low_rev_emp = merged_df['revenue_per_employee'] < 2
mask_filter = mask_service | mask_low_rev_emp

filtered_out = merged_df[mask_filter]
filtered_in = merged_df[~mask_filter]

# Print statistics
print(f"Total companies: {len(merged_df)}")
print(f"Filtered out (service OR rev/employee <2M): {len(filtered_out)}")
print(f"Remaining after filter: {len(filtered_in)}")

print("\nTop 10 sectors among remaining companies:")
print(filtered_in['segment_name'].value_counts().head(10))

# Generate timestamp for versioning
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
new_table_name = f'digitizable_ecommerce_and_product_companies_v{timestamp}'

# Save filtered results to new versioned table
filtered_in.drop(['revenue_per_employee', 'fit_score_reason'], axis=1).to_sql(
    new_table_name,
    engine,
    if_exists='replace',
    index=False
)

print(f"\nSaved filtered results to table: {new_table_name}")

# List all versioned tables
print("\nCurrent versioned tables:")
versioned_tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'digitizable_ecommerce_and_product_companies_v%'", engine)
print(versioned_tables) 