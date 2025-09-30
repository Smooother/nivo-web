import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

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
    
    const { data: jobs, error } = await supabase
      .from('scraper_staging_jobs')
      .select('*')
      .eq('id', jobId)
      .limit(1);
    
    if (error) {
      console.error('Error fetching job status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job status' },
        { status: 500 }
      );
    }
    
    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const job = jobs[0];
    
    // Transform the data to match the expected format
    const transformedJob = {
      id: job.id,
      jobType: job.job_type,
      status: job.status,
      lastPage: job.last_page,
      processedCount: job.processed_count,
      totalCompanies: job.total_companies,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
    
    return NextResponse.json(transformedJob);
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}




