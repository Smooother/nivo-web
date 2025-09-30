# Nivo Database Architecture Analysis

## Current Situation
We have **31 tables** in the SQLite database, which is way too many. Most are derived/versioned tables that should be replaced with views or dynamic queries.

## Core Tables (Keep These)

### 1. **all_companies_raw** (10 rows) - ❌ DELETE
- **Purpose**: Raw company data from Allabolag API
- **Key Fields**: organisationNumber, name, companyId, segment, revenue, profit, employees, etc.
- **Status**: ❌ DELETE - Only 10 rows, clearly incomplete data

### 2. **companies** (4,367 rows) 
- **Purpose**: Processed company data
- **Key Fields**: Likely cleaned/processed version of all_companies_raw
- **Status**: ✅ Core table - KEEP (but merge with all_companies_raw if possible)

### 3. **companies_enriched** (8,436 rows)
- **Purpose**: Companies with additional enriched data
- **Key Fields**: Enhanced company information
- **Status**: ✅ Core table - KEEP

### 4. **company_accounts_by_id** (35,409 rows)
- **Purpose**: Financial account data by company
- **Key Fields**: OrgNr, year, revenue, profit, employees
- **Status**: ✅ Core table - KEEP

### 5. **company_kpis_by_id** (35,409 rows)
- **Purpose**: Calculated KPIs by company
- **Key Fields**: OrgNr, year, SDI, DR, ORS, Revenue_growth, EBIT_margin, NetProfit_margin
- **Status**: ✅ Core table - KEEP

## Derived Tables (DELETE - Replace with Views/Queries)

### Filtered/Versioned Tables (DELETE ALL)
- `filtered_companies_basic_filters_20250618_104041`
- `filtered_companies_basic_filters_20250618_104154` 
- `filtered_companies_basic_filters_20250618_104214`
- `filtered_companies_basic_filters_20250618_104409`
- `filtered_companies_basic_filters_20250618_104425`
- `filtered_companies_v20250528_095611`
- `filtered_companies_v20250528_102534`
- `filtered_companies_v20250528_103211`
- `filtered_candidates`
- `final_filter_companies`

### E-commerce Tables (DELETE - Keep Latest)
- `digitizable_ecommerce_and_product_companies`
- `digitizable_ecommerce_and_product_companies_backup`
- `digitizable_ecommerce_and_product_companies_v1`
- `digitizable_ecommerce_and_product_companies_v20250528_092332`
- `filtered_ecommerce_companies`

### Segmentation Tables (DELETE - Keep Latest)
- `enhanced_segmentation`
- `segmentation_companies_raw`
- `segmented_companies`
- `new_segmented_companies`

### Analysis Tables (DELETE - Keep Latest)
- `ai_company_analysis`
- `top_50_ai_analysis`
- `top_50_analysis_v20250528_110646`

### Website/Score Tables (DELETE - Keep Latest)
- `website_fit_scores`
- `website_fit_scores_product_companies`

### Other Tables (EVALUATE)
- `ownership_scan_results` - Check if still needed
- `company_accounts` (0 rows) - DELETE (empty)
- `company_kpis` (41,015 rows) - Check if different from company_kpis_by_id

## Recommended Architecture

### Core Tables (4 tables)
1. **companies** - Main company registry (4,367 rows)
2. **companies_enriched** - Enhanced company data (8,436 rows)
3. **company_accounts_by_id** - Financial data (35,409 rows)
4. **company_kpis_by_id** - Calculated metrics (35,409 rows)
5. **user_roles** - User management (already in Supabase)

### Views/Queries Instead of Tables
- **Filtered Companies**: Dynamic SQL queries with parameters
- **E-commerce Companies**: WHERE clause on segment/industry
- **High Potential**: Complex scoring query
- **Segmented Data**: JOIN queries with filters

### Benefits
- ✅ No duplicate data storage
- ✅ Always up-to-date results
- ✅ No versioning issues
- ✅ Easier maintenance
- ✅ Better performance (no table bloat)

## Cleanup Plan

### Phase 1: Backup Current Supabase
- Export all data to CSV
- Document current table structures

### Phase 2: Identify Core Data
- Keep only the 5 core tables
- Merge overlapping tables where possible

### Phase 3: Create Views
- Replace derived tables with PostgreSQL views
- Create parameterized queries for filtering

### Phase 4: Update Frontend
- Modify DataService to use views instead of tables
- Update segmentation options to use dynamic queries

### Phase 5: Clean Up
- Drop all derived tables
- Remove old migration scripts
- Update documentation
