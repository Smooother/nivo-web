import { NextRequest, NextResponse } from 'next/server';
import { LocalStagingDB } from '@/lib/db/local-staging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Fetching job statistics for:', jobId);
    
    // Use the local database to get job statistics
    const localDb = new LocalStagingDB(jobId);
    const job = localDb.getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get detailed statistics
    const stats = localDb.getJobStats(jobId);
    
    // Get companies with different statuses
    const companiesByStatus = {
      pending: localDb.getCompaniesToProcess(jobId, 'pending').length,
      id_resolved: localDb.getCompaniesToProcess(jobId, 'id_resolved').length,
      id_not_found: localDb.getCompaniesToProcess(jobId, 'id_not_found').length,
      error: localDb.getCompaniesToProcess(jobId, 'error').length,
    };
    
    // Get company IDs statistics
    const companyIdsByStatus = {
      pending: localDb.getCompanyIdsToProcess(jobId, 'pending').length,
      financials_fetched: localDb.getCompanyIdsToProcess(jobId, 'financials_fetched').length,
      no_financials: localDb.getCompanyIdsToProcess(jobId, 'no_financials').length,
      error: localDb.getCompanyIdsToProcess(jobId, 'error').length,
    };
    
    // Get financial data statistics
    const financialsToValidate = localDb.getFinancialsToValidate(jobId);
    const validFinancials = localDb.getValidFinancials(jobId, false);
    const financialsWithWarnings = localDb.getValidFinancials(jobId, true);
    
    return NextResponse.json({
      job: {
        id: job.id,
        jobType: job.job_type,
        status: job.status,
        stage: job.stage,
        lastPage: job.last_page,
        processedCount: job.processed_count,
        totalCompanies: job.total_companies,
        errorCount: job.error_count,
        lastError: job.last_error,
        migrationStatus: job.migration_status,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      },
      statistics: {
        companies: {
          total: stats.companies.total,
          withIds: stats.companies.with_ids,
          errors: stats.companies.errors,
          byStatus: companiesByStatus
        },
        companyIds: {
          total: Object.values(companyIdsByStatus).reduce((a, b) => a + b, 0),
          byStatus: companyIdsByStatus
        },
        financials: {
          total: stats.financials.total,
          valid: stats.financials.valid,
          warnings: stats.financials.warnings,
          invalid: stats.financials.invalid,
          pendingValidation: financialsToValidate.length,
          validRecords: validFinancials.length,
          recordsWithWarnings: financialsWithWarnings.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch job statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
