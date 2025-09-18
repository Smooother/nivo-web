-- Supabase Table Creation SQL
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/clysgodrmowieximfaab/sql

-- Table: companies
CREATE TABLE IF NOT EXISTS "companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "last_updated" TIMESTAMP NULL
);

-- Table: company_accounts_by_id
CREATE TABLE IF NOT EXISTS "company_accounts_by_id" (
  "companyId" TEXT NULL,
  "organisationNumber" TEXT NULL,
  "name" TEXT NULL,
  "year" TEXT NULL,
  "period" TEXT NULL,
  "periodStart" TEXT NULL,
  "periodEnd" TEXT NULL,
  "length" TEXT NULL,
  "currency" TEXT NULL,
  "remark" TEXT NULL,
  "referenceUrl" TEXT NULL,
  "accIncompleteCode" TEXT NULL,
  "accIncompleteDesc" TEXT NULL,
  "ADI" TEXT NULL,
  "ADK" TEXT NULL,
  "ADR" TEXT NULL,
  "AK" TEXT NULL,
  "ANT" TEXT NULL,
  "avk_eget_kapital" TEXT NULL,
  "avk_totalt_kapital" TEXT NULL,
  "RPE" TEXT NULL,
  "CPE" TEXT NULL,
  "DR" TEXT NULL,
  "EK" TEXT NULL,
  "EKA" TEXT NULL,
  "FI" TEXT NULL,
  "FK" TEXT NULL,
  "GG" TEXT NULL,
  "KBP" TEXT NULL,
  "LG" TEXT NULL,
  "loner_ovriga" TEXT NULL,
  "loner_styrelse_vd" TEXT NULL,
  "ORS" TEXT NULL,
  "resultat_e_avskrivningar" TEXT NULL,
  "resultat_e_finansnetto" TEXT NULL,
  "RG" TEXT NULL,
  "SAP" TEXT NULL,
  "SDI" TEXT NULL,
  "SED" TEXT NULL,
  "SI" TEXT NULL,
  "SEK" TEXT NULL,
  "SF" TEXT NULL,
  "SFA" TEXT NULL,
  "SGE" TEXT NULL,
  "SIA" TEXT NULL,
  "SIK" TEXT NULL,
  "SKG" TEXT NULL,
  "SKGKI" TEXT NULL,
  "SKO" TEXT NULL,
  "SLG" TEXT NULL,
  "SOM" TEXT NULL,
  "SUB" TEXT NULL,
  "summa_finansiella_anltillg" TEXT NULL,
  "summa_langfristiga_skulder" TEXT NULL,
  "summa_rorelsekostnader" TEXT NULL,
  "SV" TEXT NULL,
  "SVD" TEXT NULL,
  "UTR" TEXT NULL,
  "FSD" TEXT NULL,
  "KB" TEXT NULL,
  "AWA" TEXT NULL,
  "IAC" TEXT NULL,
  "MIN" TEXT NULL,
  "BE" TEXT NULL,
  "TR" TEXT NULL
);

-- Table: company_kpis_by_id
CREATE TABLE IF NOT EXISTS "company_kpis_by_id" (
  "companyId" TEXT NULL,
  "organisationNumber" TEXT NULL,
  "name" TEXT NULL,
  "year" TEXT NULL,
  "ebit_margin" DOUBLE PRECISION NULL,
  "net_margin" DOUBLE PRECISION NULL,
  "pbt_margin" DOUBLE PRECISION NULL,
  "revenue_growth" DOUBLE PRECISION NULL,
  "ebit_growth" DOUBLE PRECISION NULL,
  "profit_growth" DOUBLE PRECISION NULL,
  "equity_ratio" DOUBLE PRECISION NULL,
  "return_on_equity" DOUBLE PRECISION NULL
);

-- Table: segmentation_companies_raw
CREATE TABLE IF NOT EXISTS "segmentation_companies_raw" (
  "companyId" TEXT NULL,
  "name" TEXT NULL,
  "homePage" TEXT NULL,
  "naceCategories" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "foundationYear" TEXT NULL,
  "exclude" BIGINT NULL DEFAULT '0',
  "organisationNumber" TEXT NULL
);

-- Table: filtered_companies_v20250528_095611
CREATE TABLE IF NOT EXISTS "filtered_companies_v20250528_095611" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" DOUBLE PRECISION NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "revenue_per_employee" DOUBLE PRECISION NULL,
  "fit_score_reason" TEXT NULL
);

-- Table: companies_enriched
CREATE TABLE IF NOT EXISTS "companies_enriched" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "companyId" TEXT NULL
);

-- Table: company_kpis
CREATE TABLE IF NOT EXISTS "company_kpis" (
  "OrgNr" TEXT NULL,
  "year" TEXT NULL,
  "SDI" DOUBLE PRECISION NULL,
  "DR" DOUBLE PRECISION NULL,
  "ORS" DOUBLE PRECISION NULL,
  "Revenue_growth" DOUBLE PRECISION NULL,
  "EBIT_margin" DOUBLE PRECISION NULL,
  "NetProfit_margin" DOUBLE PRECISION NULL
);

-- Table: segmented_companies
CREATE TABLE IF NOT EXISTS "segmented_companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "Bransch" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "homepage" TEXT NULL,
  "year" BIGINT NULL,
  "Revenue" DOUBLE PRECISION NULL,
  "EBIT" DOUBLE PRECISION NULL,
  "Revenue_growth" DOUBLE PRECISION NULL,
  "EBIT_margin" DOUBLE PRECISION NULL,
  "NetProfit_margin" DOUBLE PRECISION NULL,
  "year_rank" TEXT NULL,
  "avg_growth" TEXT NULL,
  "growth_range" TEXT NULL
);

-- Table: enhanced_segmentation
CREATE TABLE IF NOT EXISTS "enhanced_segmentation" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "Bransch" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "homepage" TEXT NULL,
  "year" BIGINT NULL,
  "Revenue" DOUBLE PRECISION NULL,
  "EBIT" DOUBLE PRECISION NULL,
  "Revenue_growth" DOUBLE PRECISION NULL,
  "EBIT_margin" DOUBLE PRECISION NULL,
  "NetProfit_margin" DOUBLE PRECISION NULL,
  "year_rank" TEXT NULL,
  "avg_growth" TEXT NULL,
  "growth_range" TEXT NULL,
  "growth_stage" TEXT NULL,
  "digital_maturity" TEXT NULL,
  "industry_cluster" TEXT NULL
);

-- Table: new_segmented_companies
CREATE TABLE IF NOT EXISTS "new_segmented_companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_candidates
CREATE TABLE IF NOT EXISTS "filtered_candidates" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: ownership_scan_results
CREATE TABLE IF NOT EXISTS "ownership_scan_results" (
  "orgnr" TEXT NULL,
  "company_name" TEXT NULL,
  "website" TEXT NULL,
  "ownership_type" TEXT NULL,
  "about_us_found" BOOLEAN NULL,
  "website_keywords" TEXT NULL,
  "corporate_group_flag" BOOLEAN NULL,
  "flag_for_review" BOOLEAN NULL,
  "notes" TEXT NULL
);

-- Table: website_fit_scores
CREATE TABLE IF NOT EXISTS "website_fit_scores" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "homepage" TEXT NULL,
  "fit_score_reason" TEXT NULL
);

-- Table: high_potential_candidates
CREATE TABLE IF NOT EXISTS "high_potential_candidates" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TIMESTAMP NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" DOUBLE PRECISION NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "company_age" BIGINT NULL
);

-- Table: filtered_ecommerce_companies
CREATE TABLE IF NOT EXISTS "filtered_ecommerce_companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: website_fit_scores_product_companies
CREATE TABLE IF NOT EXISTS "website_fit_scores_product_companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "homepage" TEXT NULL,
  "fit_score_reason" TEXT NULL
);

-- Table: digitizable_ecommerce_and_product_companies_backup
CREATE TABLE IF NOT EXISTS "digitizable_ecommerce_and_product_companies_backup" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: digitizable_ecommerce_and_product_companies
CREATE TABLE IF NOT EXISTS "digitizable_ecommerce_and_product_companies" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: digitizable_ecommerce_and_product_companies_v1
CREATE TABLE IF NOT EXISTS "digitizable_ecommerce_and_product_companies_v1" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: digitizable_ecommerce_and_product_companies_v20250528_092332
CREATE TABLE IF NOT EXISTS "digitizable_ecommerce_and_product_companies_v20250528_092332" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" DOUBLE PRECISION NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_companies_v20250528_102534
CREATE TABLE IF NOT EXISTS "filtered_companies_v20250528_102534" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" DOUBLE PRECISION NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "revenue_per_employee" DOUBLE PRECISION NULL,
  "fit_score_reason" TEXT NULL
);

-- Table: filtered_companies_v20250528_103211
CREATE TABLE IF NOT EXISTS "filtered_companies_v20250528_103211" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" DOUBLE PRECISION NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "revenue_per_employee" DOUBLE PRECISION NULL,
  "fit_score_reason" TEXT NULL
);

-- Table: top_50_analysis_v20250528_110646
CREATE TABLE IF NOT EXISTS "top_50_analysis_v20250528_110646" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "sector" TEXT NULL,
  "revenue_per_employee" DOUBLE PRECISION NULL,
  "ai_score" TEXT NULL,
  "analysis" TEXT NULL
);

-- Table: top_50_ai_analysis
CREATE TABLE IF NOT EXISTS "top_50_ai_analysis" (
  "OrgNr" TEXT NULL,
  "score" TEXT NULL,
  "reason" TEXT NULL,
  "risk_factors" TEXT NULL,
  "raw_ai_output" TEXT NULL
);

-- Table: ai_company_analysis
CREATE TABLE IF NOT EXISTS "ai_company_analysis" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL,
  "revenue_per_employee" TEXT NULL,
  "fit_score_reason_x" TEXT NULL,
  "fit_score_reason_y" TEXT NULL,
  "ai_score" TEXT NULL,
  "ai_reason" TEXT NULL,
  "ai_risk_factors" TEXT NULL
);

-- Table: filtered_companies_basic_filters_20250618_104041
CREATE TABLE IF NOT EXISTS "filtered_companies_basic_filters_20250618_104041" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_companies_basic_filters_20250618_104154
CREATE TABLE IF NOT EXISTS "filtered_companies_basic_filters_20250618_104154" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_companies_basic_filters_20250618_104214
CREATE TABLE IF NOT EXISTS "filtered_companies_basic_filters_20250618_104214" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_companies_basic_filters_20250618_104409
CREATE TABLE IF NOT EXISTS "filtered_companies_basic_filters_20250618_104409" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: filtered_companies_basic_filters_20250618_104425
CREATE TABLE IF NOT EXISTS "filtered_companies_basic_filters_20250618_104425" (
  "OrgNr" TEXT NULL,
  "name" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "incorporation_date" TEXT NULL,
  "email" TEXT NULL,
  "homepage" TEXT NULL,
  "employees" TEXT NULL,
  "segment" TEXT NULL,
  "segment_name" TEXT NULL
);

-- Table: company_accounts
CREATE TABLE IF NOT EXISTS "company_accounts" (
  "OrgNr" TEXT NULL,
  "year" BIGINT NULL,
  "revenue" DOUBLE PRECISION NULL,
  "profit" DOUBLE PRECISION NULL,
  "employees" BIGINT NULL,
  "last_updated" TIMESTAMP NULL
);

-- Table: all_companies_raw
CREATE TABLE IF NOT EXISTS "all_companies_raw" (
  "organisationNumber" TEXT NULL,
  "name" TEXT NULL,
  "companyId" TEXT NULL,
  "companyAccountsLastUpdatedDate" TEXT NULL,
  "segment" TEXT NULL,
  "revenue" TEXT NULL,
  "profit" TEXT NULL,
  "incorporationDate" TEXT NULL,
  "employees" TEXT NULL,
  "homepage" TEXT NULL,
  "email" TEXT NULL,
  "address" TEXT NULL,
  "city" TEXT NULL,
  "county" TEXT NULL,
  "sni" TEXT NULL,
  "data_json" TEXT NULL
);
