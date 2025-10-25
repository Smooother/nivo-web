import { NextRequest, NextResponse } from 'next/server';
import { LocalStagingDB } from '@/lib/db/local-staging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId parameter is required' }, { status: 400 });
    }
    
    console.log(`Checking table schema for job ${jobId}`);
    
    const localDb = new LocalStagingDB(jobId);
    
    // Get table schema
    const schema = localDb.db.prepare("PRAGMA table_info(staging_financials)").all();
    
    return NextResponse.json({
      jobId: jobId,
      tableSchema: schema,
      columnCount: schema.length
    });
    
  } catch (error) {
    console.error('Error checking table schema:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
