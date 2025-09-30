# Supabase Import Instructions

Generated: 2025-09-22 23:33:56

## Files to Import

1. **Full Dataset**: `master_analytics_20250922_233356.csv` (8479 companies)
2. **Sample Dataset**: `master_analytics_sample_20250922_233356.csv` (100 companies)

## Import Steps

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Select the `master_analytics` table
4. Click 'Insert' → 'Import data from CSV'
5. Upload the CSV file
6. Map columns and import

### Option 2: SQL Import
1. Go to SQL Editor in Supabase
2. Use the COPY command:
```sql
COPY master_analytics FROM '/Users/jesper/nivo/outputs/supabase_import/master_analytics_20250922_233356.csv' WITH CSV HEADER;
```

## Verification

After import, verify with:
```sql
SELECT COUNT(*) FROM master_analytics;
SELECT * FROM master_analytics WHERE OrgNr = '5561491365'; -- Söderåsens Bioenergi
SELECT * FROM master_analytics WHERE OrgNr = '5560034794'; -- Kominox International
```

## Expected Results

- Total companies: 8479
- Söderåsens Bioenergi should have revenue: 29804, profit: 9023
- Kominox International should have revenue: 17416, profit: 472
