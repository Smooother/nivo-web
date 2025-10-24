import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating staging tables...');
    
    // Try to create a simple test record to see if tables exist
    const testJob = {
      id: 'test-job-123',
      job_type: 'segmentation',
      filter_hash: 'test-hash',
      params: { test: true },
      status: 'running',
      last_page: 0,
      processed_count: 0,
      total_companies: 0,
      migration_status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('scraper_staging_jobs')
      .insert(testJob)
      .select();
    
    if (error) {
      console.error('Table creation test error:', error);
      return NextResponse.json(
        { 
          error: 'Tables do not exist or cannot be accessed',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    // Clean up test record
    await supabase
      .from('scraper_staging_jobs')
      .delete()
      .eq('id', 'test-job-123');
    
    return NextResponse.json({
      success: true,
      message: 'Tables exist and are accessible',
      data: data
    });
    
  } catch (error) {
    console.error('Table creation error:', error);
    return NextResponse.json(
      { 
        error: 'Table creation test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
