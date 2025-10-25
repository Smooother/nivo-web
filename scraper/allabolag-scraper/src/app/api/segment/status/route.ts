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
    
    console.log('Fetching job status for:', jobId);
    
    // Use the local database to get job status
    const localDb = new LocalStagingDB(jobId);
    let job = localDb.getJob(jobId);
    
    // If job not found, it might be an enrichment job stored in the source job's database
    if (!job) {
      // Try to find the job in other databases by checking if it's an enrichment job
      // For now, we'll return an error, but this could be enhanced to search across databases
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get job statistics
    const stats = localDb.getJobStats(jobId);
    
    return NextResponse.json({
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
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}