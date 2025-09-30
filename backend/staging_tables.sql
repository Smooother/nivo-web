-- =====================================================
-- SCRAPER STAGING TABLES FOR SUPABASE
-- =====================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- =====================================================

-- Staging table for raw scraped companies
CREATE TABLE IF NOT EXISTS scraper_staging_companies (
    orgnr VARCHAR(16) PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_id VARCHAR(32),
    company_id_hint VARCHAR(32),
    homepage TEXT,
    nace_categories JSONB DEFAULT '[]'::jsonb,
    segment_name JSONB DEFAULT '[]'::jsonb,
    revenue_sek INTEGER,
    profit_sek INTEGER,
    foundation_year INTEGER,
    company_accounts_last_year VARCHAR(8),
    scraped_at TIMESTAMP DEFAULT NOW(),
    job_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'migrated')),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Staging table for company ID mappings
CREATE TABLE IF NOT EXISTS scraper_staging_company_ids (
    orgnr VARCHAR(16) PRIMARY KEY,
    company_id VARCHAR(32) NOT NULL,
    source VARCHAR(32) DEFAULT 'scraper' NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    scraped_at TIMESTAMP DEFAULT NOW(),
    job_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'migrated')),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Staging table for scraping jobs
CREATE TABLE IF NOT EXISTS scraper_staging_jobs (
    id VARCHAR(36) PRIMARY KEY,
    job_type VARCHAR(32) NOT NULL,
    filter_hash VARCHAR(64) NOT NULL,
    params JSONB NOT NULL,
    status VARCHAR(16) DEFAULT 'running' NOT NULL,
    last_page INTEGER DEFAULT 0 NOT NULL,
    processed_count INTEGER DEFAULT 0 NOT NULL,
    total_companies INTEGER DEFAULT 0,
    error TEXT,
    migration_status VARCHAR(20) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed')),
    migration_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_status ON scraper_staging_companies(status);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_job_id ON scraper_staging_companies(job_id);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_companies_scraped_at ON scraper_staging_companies(scraped_at);

CREATE INDEX IF NOT EXISTS idx_scraper_staging_company_ids_status ON scraper_staging_company_ids(status);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_company_ids_job_id ON scraper_staging_company_ids(job_id);

CREATE INDEX IF NOT EXISTS idx_scraper_staging_jobs_migration_status ON scraper_staging_jobs(migration_status);
CREATE INDEX IF NOT EXISTS idx_scraper_staging_jobs_status ON scraper_staging_jobs(status);

-- Create a view for easy review of pending data
CREATE OR REPLACE VIEW scraper_pending_review AS
SELECT 
    c.orgnr,
    c.company_name,
    c.revenue_sek,
    c.profit_sek,
    c.foundation_year,
    c.nace_categories,
    c.segment_name,
    c.homepage,
    c.scraped_at,
    c.job_id,
    c.status,
    c.review_notes,
    j.params as job_params,
    j.job_type,
    j.created_at as job_created_at
FROM scraper_staging_companies c
LEFT JOIN scraper_staging_jobs j ON c.job_id = j.id
WHERE c.status IN ('pending', 'reviewed')
ORDER BY c.scraped_at DESC;

-- Create a view for migration statistics
CREATE OR REPLACE VIEW scraper_migration_stats AS
SELECT 
    j.id as job_id,
    j.job_type,
    j.created_at as job_created_at,
    j.total_companies,
    COUNT(c.orgnr) as companies_scraped,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_review,
    COUNT(CASE WHEN c.status = 'reviewed' THEN 1 END) as reviewed,
    COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN c.status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN c.status = 'migrated' THEN 1 END) as migrated,
    j.migration_status,
    j.migration_notes
FROM scraper_staging_jobs j
LEFT JOIN scraper_staging_companies c ON j.id = c.job_id
GROUP BY j.id, j.job_type, j.created_at, j.total_companies, j.migration_status, j.migration_notes
ORDER BY j.created_at DESC;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE scraper_staging_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_staging_company_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_staging_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can do everything on scraper_staging_companies" ON scraper_staging_companies
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything on scraper_staging_company_ids" ON scraper_staging_company_ids
    FOR ALL USING (true);

CREATE POLICY "Service role can do everything on scraper_staging_jobs" ON scraper_staging_jobs
    FOR ALL USING (true);

-- Insert some test data to verify everything works
INSERT INTO scraper_staging_jobs (id, job_type, filter_hash, params, status, total_companies) VALUES
('test-job-001', 'segmentation', 'test-hash-001', '{"revenueFrom": 1000000, "revenueTo": 5000000, "profitFrom": 100000, "profitTo": 500000, "companyType": "AB"}', 'completed', 0);

INSERT INTO scraper_staging_companies (orgnr, company_name, company_id, revenue_sek, profit_sek, foundation_year, job_id, status) VALUES
('5561234567', 'Test Company AB', 'test-company-001', 2000000, 200000, 2020, 'test-job-001', 'pending'),
('5567654321', 'Another Test AB', 'test-company-002', 3000000, 300000, 2019, 'test-job-001', 'pending');

INSERT INTO scraper_staging_company_ids (orgnr, company_id, source, job_id, status) VALUES
('5561234567', 'test-company-001', 'scraper', 'test-job-001', 'pending'),
('5567654321', 'test-company-002', 'scraper', 'test-job-001', 'pending');

-- Verify the setup
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as test_companies FROM scraper_staging_companies;
SELECT COUNT(*) as test_jobs FROM scraper_staging_jobs;
SELECT COUNT(*) as test_company_ids FROM scraper_staging_company_ids;
