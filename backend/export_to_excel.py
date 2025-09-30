import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime

# Connect to database
engine = create_engine('sqlite:///allabolag.db')

# Read the latest filtered companies table
filtered_table = "filtered_companies_v20250528_103211"  # Latest filtered table
df = pd.read_sql(f"SELECT * FROM {filtered_table}", engine)

# Convert numeric columns
for col in ['revenue', 'profit', 'employees']:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Format revenue and profit as millions SEK
df['revenue_msek'] = df['revenue'] / 1000  # Convert to millions
df['profit_msek'] = df['profit'] / 1000   # Convert to millions

# Select and reorder columns
columns_to_export = [
    'OrgNr',
    'name',
    'segment_name',
    'revenue_msek',
    'profit_msek',
    'employees',
    'revenue_per_employee',
    'homepage',
    'email',
    'address',
    'city',
    'incorporation_date',
    'fit_score_reason'
]

# Create a new DataFrame with selected columns
export_df = df[columns_to_export].copy()

# Rename columns for better readability
column_names = {
    'OrgNr': 'Organization Number',
    'name': 'Company Name',
    'segment_name': 'Sector',
    'revenue_msek': 'Revenue (MSEK)',
    'profit_msek': 'Profit (MSEK)',
    'employees': 'Employees',
    'revenue_per_employee': 'Revenue per Employee (MSEK)',
    'homepage': 'Website',
    'email': 'Email',
    'address': 'Address',
    'city': 'City',
    'incorporation_date': 'Incorporation Date',
    'fit_score_reason': 'AI Fit Score & Analysis'
}
export_df = export_df.rename(columns=column_names)

# Generate filename with timestamp
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
filename = f'filtered_companies_{timestamp}.xlsx'

# Create Excel writer with xlsxwriter engine
writer = pd.ExcelWriter(filename, engine='xlsxwriter')

# Write DataFrame to Excel
export_df.to_excel(writer, sheet_name='Companies', index=False)

# Get workbook and worksheet objects
workbook = writer.book
worksheet = writer.sheets['Companies']

# Define formats
header_format = workbook.add_format({
    'bold': True,
    'text_wrap': True,
    'valign': 'top',
    'bg_color': '#D9E1F2',
    'border': 1
})

number_format = workbook.add_format({
    'num_format': '#,##0.00',
    'border': 1
})

text_format = workbook.add_format({
    'border': 1,
    'text_wrap': True
})

# Format headers
for col_num, value in enumerate(export_df.columns.values):
    worksheet.write(0, col_num, value, header_format)

# Format columns
worksheet.set_column('A:A', 15)  # OrgNr
worksheet.set_column('B:B', 40)  # Company Name
worksheet.set_column('C:C', 30)  # Sector
worksheet.set_column('D:E', 15, number_format)  # Revenue and Profit
worksheet.set_column('F:F', 10, number_format)  # Employees
worksheet.set_column('G:G', 20, number_format)  # Revenue per Employee
worksheet.set_column('H:H', 30)  # Website
worksheet.set_column('I:I', 25)  # Email
worksheet.set_column('J:J', 30)  # Address
worksheet.set_column('K:K', 15)  # City
worksheet.set_column('L:L', 15)  # Incorporation Date
worksheet.set_column('M:M', 50, text_format)  # AI Fit Score & Analysis

# Add filters
worksheet.autofilter(0, 0, len(export_df), len(export_df.columns) - 1)

# Save the Excel file
writer.close()

print(f"\nExported {len(export_df)} companies to {filename}")
print("\nColumns included:")
for col in export_df.columns:
    print(f"- {col}")

# Export to Excel
excel_file = "filtered_companies.xlsx"
df.to_excel(excel_file, index=False)
print(f"Exported {len(df)} companies to {excel_file}") 