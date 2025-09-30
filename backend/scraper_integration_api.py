#!/usr/bin/env python3
"""
Scraper Integration API
FastAPI endpoints for managing scraper data integration with main database
"""

import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Scraper Integration API",
    description="API for managing scraper data integration with main database",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    
    return create_client(url, key)

# Pydantic models
class CompanyValidationRequest(BaseModel):
    job_id: Optional[str] = None
    auto_approve: bool = False

class CompanyApprovalRequest(BaseModel):
    orgnrs: List[str]
    action: str  # 'approve' or 'reject'
    notes: Optional[str] = None

class MigrationRequest(BaseModel):
    job_id: Optional[str] = None
    dry_run: bool = False

class ValidationResult(BaseModel):
    total_companies: int
    valid_companies: int
    invalid_companies: int
    duplicate_companies: int
    new_companies: int
    quality_issues: List[Dict[str, Any]]

class MigrationResult(BaseModel):
    companies_processed: int
    companies_inserted: int
    companies_updated: int
    companies_skipped: int
    errors: List[str]

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Scraper Integration API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        supabase = get_supabase_client()
        # Test database connection
        result = supabase.table('scraper_staging_companies').select('count').limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/staging/companies", response_model=List[Dict[str, Any]])
async def get_staging_companies(
    status: Optional[str] = None,
    job_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get companies from staging table"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table('scraper_staging_companies').select('*')
        
        if status:
            query = query.eq('status', status)
        if job_id:
            query = query.eq('job_id', job_id)
        
        query = query.range(offset, offset + limit - 1).order('scraped_at', desc=True)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching staging companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/staging/jobs", response_model=List[Dict[str, Any]])
async def get_staging_jobs():
    """Get scraping jobs from staging table"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('scraper_staging_jobs').select('*').order('created_at', desc=True).execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching staging jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/staging/stats", response_model=Dict[str, Any])
async def get_staging_stats():
    """Get staging statistics"""
    try:
        supabase = get_supabase_client()
        
        # Get company counts by status
        result = supabase.table('scraper_staging_companies').select('status').execute()
        companies = result.data
        
        status_counts = {}
        for company in companies:
            status = company['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Get job counts by migration status
        result = supabase.table('scraper_staging_jobs').select('migration_status').execute()
        jobs = result.data
        
        migration_counts = {}
        for job in jobs:
            status = job['migration_status']
            migration_counts[status] = migration_counts.get(status, 0) + 1
        
        return {
            "company_status_counts": status_counts,
            "migration_status_counts": migration_counts,
            "total_companies": len(companies),
            "total_jobs": len(jobs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching staging stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate", response_model=ValidationResult)
async def validate_companies(request: CompanyValidationRequest):
    """Validate scraped companies"""
    try:
        from scraper_data_validator import ScraperDataValidator
        
        validator = ScraperDataValidator()
        
        # Get companies to validate
        supabase = get_supabase_client()
        query = supabase.table('scraper_staging_companies').select('*').eq('status', 'pending')
        
        if request.job_id:
            query = query.eq('job_id', request.job_id)
        
        result = query.execute()
        companies = result.data
        
        if not companies:
            return ValidationResult(
                total_companies=0,
                valid_companies=0,
                invalid_companies=0,
                duplicate_companies=0,
                new_companies=0,
                quality_issues=[]
            )
        
        # Validate companies
        validation_result = validator.validate_batch(companies)
        
        # Auto-approve if requested
        if request.auto_approve and validation_result['valid_companies']:
            valid_orgnrs = [c['orgnr'] for c in validation_result['valid_companies'] if c.get('orgnr')]
            if valid_orgnrs:
                supabase.table('scraper_staging_companies').update({
                    'status': 'approved',
                    'updated_at': datetime.now().isoformat()
                }).in_('orgnr', valid_orgnrs).execute()
        
        return ValidationResult(**validator.validation_results)
        
    except Exception as e:
        logger.error(f"Error validating companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve")
async def approve_companies(request: CompanyApprovalRequest):
    """Approve or reject companies for migration"""
    try:
        supabase = get_supabase_client()
        
        if request.action not in ['approve', 'reject']:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        # Update company status
        update_data = {
            'status': 'approved' if request.action == 'approve' else 'rejected',
            'updated_at': datetime.now().isoformat()
        }
        
        if request.notes:
            update_data['review_notes'] = request.notes
        
        result = supabase.table('scraper_staging_companies').update(update_data).in_('orgnr', request.orgnrs).execute()
        
        return {
            "message": f"Successfully {request.action}d {len(request.orgnrs)} companies",
            "updated_count": len(result.data)
        }
        
    except Exception as e:
        logger.error(f"Error approving companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/migrate", response_model=MigrationResult)
async def migrate_companies(request: MigrationRequest, background_tasks: BackgroundTasks):
    """Migrate approved companies to main database"""
    try:
        from scraper_data_migration import ScraperDataMigrator
        
        migrator = ScraperDataMigrator()
        
        # Get approved companies
        companies = migrator.get_approved_companies(request.job_id)
        
        if not companies:
            return MigrationResult(
                companies_processed=0,
                companies_inserted=0,
                companies_updated=0,
                companies_skipped=0,
                errors=["No approved companies found for migration"]
            )
        
        if request.dry_run:
            # Just return what would be migrated
            existing_orgnrs = migrator.check_duplicates(companies)
            new_count = len([c for c in companies if c['orgnr'] not in existing_orgnrs])
            update_count = len([c for c in companies if c['orgnr'] in existing_orgnrs])
            
            return MigrationResult(
                companies_processed=len(companies),
                companies_inserted=new_count,
                companies_updated=update_count,
                companies_skipped=0,
                errors=[]
            )
        
        # Perform actual migration
        existing_orgnrs = migrator.check_duplicates(companies)
        migrator.migrate_companies(companies, existing_orgnrs)
        migrator.migrate_company_ids(request.job_id)
        
        # Update job migration status
        if request.job_id:
            migrator.update_job_migration_status(request.job_id, 'completed', 'Migration completed successfully')
        
        return MigrationResult(
            companies_processed=migrator.migration_stats['companies_processed'],
            companies_inserted=migrator.migration_stats['companies_inserted'],
            companies_updated=migrator.migration_stats['companies_updated'],
            companies_skipped=migrator.migration_stats['companies_skipped_duplicates'],
            errors=migrator.migration_stats['errors']
        )
        
    except Exception as e:
        logger.error(f"Error migrating companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pending-review")
async def get_pending_review():
    """Get companies pending review using the view"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('scraper_pending_review').select('*').execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching pending review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/migration-stats")
async def get_migration_stats():
    """Get migration statistics using the view"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('scraper_migration_stats').select('*').execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching migration stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/staging/cleanup")
async def cleanup_staging_data(days_old: int = 30):
    """Clean up old staging data"""
    try:
        supabase = get_supabase_client()
        
        # Calculate cutoff date
        cutoff_date = datetime.now().replace(day=datetime.now().day - days_old)
        
        # Delete old migrated data
        result = supabase.table('scraper_staging_companies').delete().eq('status', 'migrated').lt('updated_at', cutoff_date.isoformat()).execute()
        
        return {
            "message": f"Cleaned up staging data older than {days_old} days",
            "deleted_count": len(result.data)
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up staging data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



