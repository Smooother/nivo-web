# 🔄 **SCRAPER DATA INTEGRATION GUIDE**

## 📋 **OVERVIEW**

This document outlines the complete data flow for integrating scraped company data from the Allabolag scraper into the main Supabase database. The system now includes proper staging, validation, and controlled migration processes.

## 🏗️ **ARCHITECTURE**

### **Data Flow**
```
Scraper → Staging Tables → Validation → Review → Migration → Main Tables
```

### **Components**
1. **Scraper Application** - Collects data from Allabolag.se
2. **Staging Tables** - Temporary storage in Supabase
3. **Validation System** - Data quality checks and duplicate detection
4. **Review Interface** - Manual approval/rejection of data
5. **Migration System** - Controlled transfer to main tables
6. **API Endpoints** - Management and monitoring

## 📊 **DATABASE SCHEMA**

### **Staging Tables**

#### **`scraper_staging_companies`**
```sql
CREATE TABLE scraper_staging_companies (
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
```

#### **`scraper_staging_company_ids`**
```sql
CREATE TABLE scraper_staging_company_ids (
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
```

#### **`scraper_staging_jobs`**
```sql
CREATE TABLE scraper_staging_jobs (
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
```

### **Views**

#### **`scraper_pending_review`**
- Shows all companies pending review with job details
- Includes filtering and sorting capabilities

#### **`scraper_migration_stats`**
- Provides migration statistics per job
- Shows counts by status and migration progress

## 🔧 **SETUP INSTRUCTIONS**

### **1. Create Staging Tables**
```bash
cd /Users/jesper/nivo/backend
python create_scraper_staging_tables.py
```

### **2. Configure Scraper Database**
Update the scraper's database connection to point to the same Supabase instance:
```env
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?sslmode=require"
```

### **3. Start Integration API**
```bash
cd /Users/jesper/nivo/backend
python scraper_integration_api.py
```

## 📝 **WORKFLOW**

### **Step 1: Data Collection**
1. Run scraper with desired filters
2. Data is collected and stored in staging tables
3. Job progress is tracked in `scraper_staging_jobs`

### **Step 2: Validation**
```bash
python scraper_data_validator.py
```
- Validates data quality
- Checks for duplicates
- Updates status to 'reviewed' or 'rejected'

### **Step 3: Review**
- Use API endpoints to review pending data
- Approve or reject companies individually or in batches
- Add review notes for rejected items

### **Step 4: Migration**
```bash
python scraper_data_migration.py
```
- Migrates approved companies to main tables
- Handles duplicates by updating existing records
- Updates staging status to 'migrated'

## 🚀 **API ENDPOINTS**

### **Data Retrieval**
- `GET /staging/companies` - Get companies from staging
- `GET /staging/jobs` - Get scraping jobs
- `GET /staging/stats` - Get staging statistics
- `GET /pending-review` - Get companies pending review
- `GET /migration-stats` - Get migration statistics

### **Data Management**
- `POST /validate` - Validate scraped companies
- `POST /approve` - Approve/reject companies
- `POST /migrate` - Migrate approved companies
- `DELETE /staging/cleanup` - Clean up old data

### **Example Usage**
```bash
# Validate all pending companies
curl -X POST "http://localhost:8000/validate" \
  -H "Content-Type: application/json" \
  -d '{"auto_approve": false}'

# Approve specific companies
curl -X POST "http://localhost:8000/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "orgnrs": ["5561234567", "5567654321"],
    "action": "approve",
    "notes": "Data quality verified"
  }'

# Migrate approved companies
curl -X POST "http://localhost:8000/migrate" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}'
```

## 🔍 **VALIDATION RULES**

### **Required Fields**
- Organization number (valid Swedish format)
- Company name

### **Optional Field Validation**
- Revenue: Must be positive integer
- Profit: Must be integer
- Foundation year: Must be between 1800 and current year
- Homepage: Must be valid URL format

### **Duplicate Detection**
- Checks against `master_analytics` table
- Checks against `companies` table
- Checks within staging data

## 📈 **MONITORING**

### **Status Tracking**
- **pending**: Newly scraped, awaiting validation
- **reviewed**: Validated, awaiting approval
- **approved**: Ready for migration
- **rejected**: Failed validation or manual rejection
- **migrated**: Successfully migrated to main tables

### **Migration Status**
- **pending**: Not yet migrated
- **in_progress**: Migration in progress
- **completed**: Migration completed successfully
- **failed**: Migration failed

## 🛡️ **SAFETY FEATURES**

### **Data Integrity**
- Duplicate prevention at multiple levels
- Data validation before migration
- Rollback capabilities for failed migrations

### **Error Handling**
- Comprehensive error logging
- Graceful failure handling
- Detailed error reporting

### **Audit Trail**
- Complete status tracking
- Review notes and timestamps
- Migration history

## 🔄 **MAINTENANCE**

### **Regular Tasks**
1. **Clean up old staging data** (monthly)
2. **Monitor migration statistics** (weekly)
3. **Review rejected companies** (as needed)
4. **Update validation rules** (as requirements change)

### **Cleanup Commands**
```bash
# Clean up data older than 30 days
curl -X DELETE "http://localhost:8000/staging/cleanup?days_old=30"
```

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Validation Failures**
- Check organization number format
- Verify required fields are present
- Review data quality warnings

#### **Migration Failures**
- Check database connectivity
- Verify table permissions
- Review error logs for specific issues

#### **Duplicate Detection Issues**
- Ensure main tables are accessible
- Check for data type mismatches
- Verify organization number consistency

### **Debug Commands**
```bash
# Check staging table status
curl "http://localhost:8000/staging/stats"

# Get detailed migration stats
curl "http://localhost:8000/migration-stats"

# Review pending companies
curl "http://localhost:8000/pending-review"
```

## 📚 **FILES CREATED**

1. **`create_scraper_staging_tables.py`** - Creates staging tables and views
2. **`scraper_data_migration.py`** - Handles data migration to main tables
3. **`scraper_data_validator.py`** - Validates scraped data quality
4. **`scraper_integration_api.py`** - FastAPI endpoints for management
5. **`SCRAPER_DATA_INTEGRATION.md`** - This documentation

## 🎯 **NEXT STEPS**

1. **Deploy staging tables** to Supabase
2. **Update scraper configuration** to use staging tables
3. **Test the complete workflow** with sample data
4. **Create frontend interface** for data review
5. **Set up monitoring and alerts** for the migration process

This system provides a robust, safe, and controlled way to integrate scraped data into your main database while maintaining data quality and preventing duplicates.



