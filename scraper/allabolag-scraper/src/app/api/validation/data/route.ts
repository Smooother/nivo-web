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

    const localDb = new LocalStagingDB(jobId);
    
    // Get validation data from local database
    const validationData = await localDb.getValidationData();
    
    return NextResponse.json(validationData);
    
  } catch (error) {
    console.error('Error fetching validation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation data' },
      { status: 500 }
    );
  }
}
