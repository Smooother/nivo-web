import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { LocalStagingDB } from '@/lib/db/local-staging';
import { filterHash } from '@/lib/hash';
import { getBuildId, fetchFinancialData, withSession } from '@/lib/allabolag';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting financial data fetching job...');
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Source job ID:', jobId);
    
    // Create financial fetching job
    const financialJobId = uuidv4();
    const hash = filterHash({ type: 'fetch_financials', timestamp: Date.now() });
    
    console.log('Financial job ID:', financialJobId);
    
    // Use the same local database as the source job
    const localDb = new LocalStagingDB(jobId);
    
    // Create financial job in local database
    const now = new Date().toISOString();
    localDb.insertJob({
      id: financialJobId,
      jobType: 'fetch_financials',
      filterHash: hash,
      params: { sourceJobId: jobId },
      status: 'running',
      stage: 'stage3_financials',
      createdAt: now,
      updatedAt: now
    });
    
    console.log('Financial job created in local database');
    
    // Start processing in background
    processFinancialJob(financialJobId, jobId, localDb).catch(async (error) => {
      console.error('Financial job failed:', error);
      localDb.updateJob(financialJobId, { 
        status: 'error', 
        lastError: error.message
      });
    });
    
    return NextResponse.json({ jobId: financialJobId });
  } catch (error) {
    console.error('Error starting financial job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start financial job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processFinancialJob(financialJobId: string, sourceJobId: string, localDb: LocalStagingDB) {
  return withSession(async (session) => {
    const buildId = await getBuildId(session);
    const batchSize = 50;
    const concurrency = 3;
    let processedCount = 0;
    
    console.log(`Starting financial job ${financialJobId} with buildId: ${buildId}`);
  
  while (true) {
    // Get batch of companies with resolved company IDs
    const companyIds = localDb.getCompanyIdsToProcess(sourceJobId, 'pending');
    
    if (companyIds.length === 0) {
      console.log('No more company IDs to process for financial data');
      break;
    }
    
    const companiesToProcess = companyIds.slice(0, batchSize);
    console.log(`Processing batch of ${companiesToProcess.length} companies for financial data`);
    
    // Process in chunks with controlled concurrency
    const chunks = [];
    for (let i = 0; i < companiesToProcess.length; i += concurrency) {
      chunks.push(companiesToProcess.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (companyIdRecord) => {
        try {
          // Get the full company data from the staging_companies table
          const companyData = localDb.getCompanyByOrgnr(sourceJobId, companyIdRecord.orgnr);
          
          if (!companyData) {
            console.log(`No company data found for orgnr ${companyIdRecord.orgnr}`);
            localDb.updateCompanyIdStatus(sourceJobId, companyIdRecord.orgnr, 'no_company_data');
            return;
          }
          
          // Fetch financial data for this company
          const financialData = await fetchCompanyFinancials(buildId, companyData, companyIdRecord.company_id, session);
          
          if (financialData && financialData.length > 0) {
            // Store financial data in local database
            const financialsToInsert = financialData.map(financial => ({
              id: `${companyIdRecord.company_id}_${financial.year}_${financial.period}`,
              companyId: companyIdRecord.company_id,
              orgnr: companyIdRecord.orgnr,
              year: financial.year,
              period: financial.period,
              periodStart: financial.periodStart,
              periodEnd: financial.periodEnd,
              currency: financial.currency || 'SEK',
              sdi: financial.sdi,
              dr: financial.dr,
              ors: financial.ors,
              ek: financial.ek,
              adi: financial.adi,
              adk: financial.adk,
              adr: financial.adr,
              ak: financial.ak,
              ant: financial.ant,
              fi: financial.fi,
              fk: financial.fk,
              gg: financial.gg,
              kbp: financial.kbp,
              lg: financial.lg,
              rg: financial.rg,
              sap: financial.sap,
              sed: financial.sed,
              si: financial.si,
              sek: financial.sek,
              sf: financial.sf,
              sfa: financial.sfa,
              sge: financial.sge,
              sia: financial.sia,
              sik: financial.sik,
              skg: financial.skg,
              skgki: financial.skgki,
              sko: financial.sko,
              slg: financial.slg,
              som: financial.som,
              sub: financial.sub,
              sv: financial.sv,
              svd: financial.svd,
              utr: financial.utr,
              fsd: financial.fsd,
              kb: financial.kb,
              awa: financial.awa,
              iac: financial.iac,
              min: financial.min,
              be: financial.be,
              tr: financial.tr,
              rawData: financial.rawData,
              validationStatus: 'pending',
              scrapedAt: new Date().toISOString(),
              jobId: sourceJobId,
              updatedAt: new Date().toISOString()
            }));
            
            localDb.insertFinancials(financialsToInsert);
            
            // Update company ID status
            localDb.updateCompanyIdStatus(sourceJobId, companyIdRecord.orgnr, 'financials_fetched');
            
            console.log(`Fetched ${financialData.length} financial records for company ${companyIdRecord.company_id}`);
          } else {
            console.log(`No financial data found for company ${companyIdRecord.company_id}`);
            localDb.updateCompanyIdStatus(sourceJobId, companyIdRecord.orgnr, 'no_financials');
          }
          
        } catch (error) {
          console.error(`Error fetching financials for company ${companyIdRecord.company_id}:`, error);
          localDb.updateCompanyIdStatus(sourceJobId, companyIdRecord.orgnr, 'error', error.message);
        }
      });
      
      await Promise.all(promises);
      processedCount += chunk.length;
      
      // Update job progress
      localDb.updateJob(financialJobId, {
        processedCount: processedCount
      });
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Mark financial job as done
  localDb.updateJob(financialJobId, { 
    status: 'done'
  });
  
  // Update the original segmentation job to show Stage 3 is complete
  localDb.updateJob(sourceJobId, {
    stage: 'stage3_financials',
    status: 'done'
  });
  
    console.log(`Financial job ${financialJobId} completed, processed ${processedCount} companies`);
  });
}

async function fetchCompanyFinancials(buildId: string, companyData: any, companyId: string, session: any) {
  try {
    console.log(`Fetching financial data for company ${companyData.company_name} (${companyData.orgnr}) - Company ID: ${companyId}`);
    
    // Add the companyId to the companyData
    const enrichedCompanyData = {
      ...companyData,
      companyId: companyId
    };
    
    // Use the real fetchFinancialData function from allabolag.ts
    const { fetchFinancialData } = await import('@/lib/allabolag');
    const financialData = await fetchFinancialData(buildId, enrichedCompanyData, session);
    
    console.log(`Fetched ${financialData.length} financial records for company ${companyData.company_name} (${companyData.orgnr})`);
    return financialData;
  } catch (error) {
    console.error(`Error fetching financial data for company ${companyData.company_name} (${companyData.orgnr}):`, error);
    return [];
  }
}
