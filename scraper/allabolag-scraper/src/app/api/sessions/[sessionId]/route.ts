import { NextRequest, NextResponse } from 'next/server';
import { LocalStagingDB } from '@/lib/db/local-staging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log(`Fetching session details for: ${sessionId}`);
    
    const localDb = new LocalStagingDB(sessionId);
    
    // Get job info
    const job = localDb.getJob(sessionId);
    if (!job) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      );
    }
    
    // Get statistics
    const jobStats = localDb.getJobStats(sessionId);
    
    // Get companies data
    const companies = localDb.getCompaniesToProcess(sessionId, 'pending');
    const allCompanies = localDb.getCompaniesToProcess(sessionId, 'completed');
    
    // Get financial data count
    const financialsCount = jobStats.financials;
    
    // Determine stage status
    const stages = {
      stage1: {
        status: jobStats.companies > 0 ? 'completed' : 'pending' as const,
        companies: jobStats.companies,
        completedAt: jobStats.companies > 0 ? job.updated_at : undefined
      },
      stage2: {
        status: jobStats.companyIds > 0 ? 'completed' : (jobStats.companies > 0 ? 'pending' : 'pending') as const,
        companyIds: jobStats.companyIds,
        completedAt: jobStats.companyIds > 0 ? job.updated_at : undefined
      },
      stage3: {
        status: jobStats.financials > 0 ? 'completed' : (jobStats.companyIds > 0 ? 'pending' : 'pending') as const,
        financials: jobStats.financials,
        completedAt: jobStats.financials > 0 ? job.updated_at : undefined
      }
    };
    
    // Determine overall status
    let status: 'active' | 'completed' | 'error' = 'active';
    if (jobStats.financials > 0) {
      status = 'completed';
    } else if (jobStats.companies > 0 || jobStats.companyIds > 0) {
      status = 'active';
    }
    
    const sessionDetails = {
      sessionId,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      status,
      stages,
      totalCompanies: jobStats.companies,
      totalCompanyIds: jobStats.companyIds,
      totalFinancials: jobStats.financials,
      filters: job.filters ? JSON.parse(job.filters) : undefined,
      companies: allCompanies.map(company => ({
        orgnr: company.orgnr,
        companyName: company.companyName,
        companyId: company.companyId,
        revenueSek: company.revenueSek,
        profitSek: company.profitSek,
        status: company.status,
        scrapedAt: company.scrapedAt
      })),
      progress: {
        stage1Progress: jobStats.companies > 0 ? 100 : 0,
        stage2Progress: jobStats.companyIds > 0 ? 100 : (jobStats.companies > 0 ? 0 : 0),
        stage3Progress: jobStats.financials > 0 ? 100 : (jobStats.companyIds > 0 ? 0 : 0),
        overallProgress: Math.round(((jobStats.companies > 0 ? 1 : 0) + (jobStats.companyIds > 0 ? 1 : 0) + (jobStats.financials > 0 ? 1 : 0)) / 3 * 100)
      }
    };
    
    localDb.close();
    
    return NextResponse.json({
      success: true,
      session: sessionDetails
    });
    
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch session details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
