-- Company Data Status Report
-- This script provides a comprehensive overview of all company data in the database

-- 1. Check all tables related to companies
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename LIKE '%compan%' 
   OR tablename LIKE '%allabolag%'
   OR tablename LIKE '%filtered%'
   OR tablename LIKE '%segmentation%'
   OR tablename LIKE '%analysis%'
   OR tablename LIKE '%kpi%'
   OR tablename LIKE '%account%'
ORDER BY tablename;

-- 2. Get row counts for each company-related table
SELECT 
    'all_companies_raw' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM all_companies_raw
UNION ALL
SELECT 
    'company_accounts_by_id' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM company_accounts_by_id
UNION ALL
SELECT 
    'company_kpis_by_id' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM company_kpis_by_id
UNION ALL
SELECT 
    'filtered_companies_basic_filters_20250618_104425' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM filtered_companies_basic_filters_20250618_104425
UNION ALL
SELECT 
    'high_potential_candidates' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM high_potential_candidates
UNION ALL
SELECT 
    'digitizable_ecommerce_and_product_companies' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM digitizable_ecommerce_and_product_companies
UNION ALL
SELECT 
    'enhanced_segmentation' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM enhanced_segmentation
UNION ALL
SELECT 
    'ai_company_analysis' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM ai_company_analysis
ORDER BY row_count DESC;

-- 3. Revenue distribution in main companies table
SELECT 
    CASE 
        WHEN revenue IS NULL THEN 'No Revenue Data'
        WHEN revenue = 0 THEN 'Zero Revenue'
        WHEN revenue < 1000000 THEN '0-1M SEK'
        WHEN revenue < 10000000 THEN '1-10M SEK'
        WHEN revenue < 100000000 THEN '10-100M SEK'
        WHEN revenue < 1000000000 THEN '100M-1B SEK'
        ELSE '1B+ SEK'
    END as revenue_range,
    COUNT(*) as company_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM all_companies_raw
GROUP BY 
    CASE 
        WHEN revenue IS NULL THEN 'No Revenue Data'
        WHEN revenue = 0 THEN 'Zero Revenue'
        WHEN revenue < 1000000 THEN '0-1M SEK'
        WHEN revenue < 10000000 THEN '1-10M SEK'
        WHEN revenue < 100000000 THEN '10-100M SEK'
        WHEN revenue < 1000000000 THEN '100M-1B SEK'
        ELSE '1B+ SEK'
    END
ORDER BY 
    CASE 
        WHEN revenue IS NULL THEN 1
        WHEN revenue = 0 THEN 2
        WHEN revenue < 1000000 THEN 3
        WHEN revenue < 10000000 THEN 4
        WHEN revenue < 100000000 THEN 5
        WHEN revenue < 1000000000 THEN 6
        ELSE 7
    END;

-- 4. Top cities by company count
SELECT 
    city,
    COUNT(*) as company_count,
    ROUND(AVG(revenue), 0) as avg_revenue,
    ROUND(SUM(revenue), 0) as total_revenue
FROM all_companies_raw
WHERE city IS NOT NULL AND city != ''
GROUP BY city
ORDER BY company_count DESC
LIMIT 20;

-- 5. Industry segments analysis
SELECT 
    segment,
    COUNT(*) as company_count,
    ROUND(AVG(revenue), 0) as avg_revenue,
    ROUND(AVG(profit), 0) as avg_profit,
    ROUND(AVG(employees), 0) as avg_employees
FROM all_companies_raw
WHERE segment IS NOT NULL AND segment != ''
GROUP BY segment
ORDER BY company_count DESC
LIMIT 15;

-- 6. Financial data quality check
SELECT 
    'Revenue Data' as metric,
    COUNT(*) as total_companies,
    COUNT(revenue) as with_data,
    COUNT(*) - COUNT(revenue) as missing_data,
    ROUND(COUNT(revenue) * 100.0 / COUNT(*), 2) as completeness_percent
FROM all_companies_raw
UNION ALL
SELECT 
    'Profit Data' as metric,
    COUNT(*) as total_companies,
    COUNT(profit) as with_data,
    COUNT(*) - COUNT(profit) as missing_data,
    ROUND(COUNT(profit) * 100.0 / COUNT(*), 2) as completeness_percent
FROM all_companies_raw
UNION ALL
SELECT 
    'Employee Data' as metric,
    COUNT(*) as total_companies,
    COUNT(employees) as with_data,
    COUNT(*) - COUNT(employees) as missing_data,
    ROUND(COUNT(employees) * 100.0 / COUNT(*), 2) as completeness_percent
FROM all_companies_raw
UNION ALL
SELECT 
    'Email Data' as metric,
    COUNT(*) as total_companies,
    COUNT(email) as with_data,
    COUNT(*) - COUNT(email) as missing_data,
    ROUND(COUNT(email) * 100.0 / COUNT(*), 2) as completeness_percent
FROM all_companies_raw
UNION ALL
SELECT 
    'Homepage Data' as metric,
    COUNT(*) as total_companies,
    COUNT(homepage) as with_data,
    COUNT(*) - COUNT(homepage) as missing_data,
    ROUND(COUNT(homepage) * 100.0 / COUNT(*), 2) as completeness_percent
FROM all_companies_raw;

-- 7. Recent data activity
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_records
FROM all_companies_raw
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 10;

-- 8. Top performing companies by revenue
SELECT 
    name,
    organisation_number,
    city,
    segment,
    revenue,
    profit,
    employees,
    ROUND(profit * 100.0 / revenue, 2) as profit_margin_percent
FROM all_companies_raw
WHERE revenue IS NOT NULL AND revenue > 0
ORDER BY revenue DESC
LIMIT 10;

