import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { LocalStagingDB } from '@/lib/db/local-staging';
import { filterHash } from '@/lib/hash';
import { getBuildId, fetchSearchPage, withSession } from '@/lib/allabolag';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting enrichment job...');
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Source job ID:', jobId);
    
    // Create enrichment job
    const enrichmentJobId = uuidv4();
    const hash = filterHash({ type: 'enrich_company_ids', timestamp: Date.now() });
    
    console.log('Enrichment job ID:', enrichmentJobId);
    
    // Use the same local database as the source job
    const localDb = new LocalStagingDB(jobId);
    
    // Create enrichment job in local database
    const now = new Date().toISOString();
    localDb.insertJob({
      id: enrichmentJobId,
      jobType: 'enrich_company_id',
      filterHash: hash,
      params: { sourceJobId: jobId },
      status: 'running',
      stage: 'stage2_enrichment',
      createdAt: now,
      updatedAt: now
    });
    
    console.log('Enrichment job created in local database');
    
    // Start processing in background
    processEnrichmentJob(enrichmentJobId, jobId, localDb).catch(async (error) => {
      console.error('Enrichment job failed:', error);
      localDb.updateJob(enrichmentJobId, { 
        status: 'error', 
        lastError: error.message
      });
    });
    
    return NextResponse.json({ jobId: enrichmentJobId });
  } catch (error) {
    console.error('Error starting enrichment job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start enrichment job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processEnrichmentJob(enrichmentJobId: string, sourceJobId: string, localDb: LocalStagingDB) {
  return withSession(async (session) => {
    const buildId = await getBuildId(session);
    const batchSize = 10; // Smaller batch size for API calls
    let processedCount = 0;
    
    console.log(`Starting enrichment job ${enrichmentJobId} with buildId: ${buildId}`);
    
    while (true) {
      // Get batch of companies from local database
      const companies = localDb.getCompaniesToProcess(sourceJobId, 'pending');
      
      if (companies.length === 0) {
        console.log('No more companies to enrich');
        break;
      }
      
      const companiesToEnrich = companies.slice(0, batchSize);
      console.log(`Processing batch of ${companiesToEnrich.length} companies for company ID resolution`);
      
      // Process each company to resolve its actual company ID
      for (const company of companiesToEnrich) {
        try {
          console.log(`Resolving company ID for ${company.company_name} (${company.orgnr})`);
          
          // Search Allabolag.se directly for the company ID
          try {
            console.log(`Searching Allabolag.se for company ID: ${company.company_name} (${company.orgnr})`);
            
            // Search for the company using its name to get the real company ID
            const searchResults = await fetchSearchPage(buildId, company.company_name, session);
          
          // Extract companies from the correct path in the search results
          const companies = searchResults?.pageProps?.hydrationData?.searchStore?.companies?.companies || 
                           searchResults?.pageProps?.companies || [];
          
          console.log(`Found ${companies.length} companies in search results for ${company.company_name}`);
          
          // Find the company that matches our orgnr
          const matchingCompany = companies.find(c => 
            c.orgnr === company.orgnr || c.organisationNumber === company.orgnr
          );
          
          if (matchingCompany) {
            // Extract company ID from the search results
            const realCompanyId = matchingCompany.companyId || matchingCompany.listingId;
            
            console.log(`Matching company found:`, {
              name: matchingCompany.name,
              orgnr: matchingCompany.orgnr,
              companyId: matchingCompany.companyId,
              listingId: matchingCompany.listingId
            });
            
            if (realCompanyId) {
              console.log(`Found company ID: ${realCompanyId} for ${company.company_name} (${company.orgnr})`);
              
              // Insert the resolved company ID
              const companyIdRecord = {
                orgnr: company.orgnr,
                companyId: realCompanyId,
                source: 'allabolag_search',
                confidenceScore: '1.0',
                scrapedAt: new Date().toISOString(),
                jobId: sourceJobId,
                status: 'pending',
                updatedAt: new Date().toISOString()
              };
              
              localDb.insertCompanyIds([companyIdRecord]);
              localDb.updateCompanyStatus(sourceJobId, company.orgnr, 'id_resolved');
            } else {
              console.log(`Found company but could not extract company ID for ${company.company_name} (${company.orgnr})`);
              console.log('Company data:', JSON.stringify(matchingCompany, null, 2));
              localDb.updateCompanyStatus(sourceJobId, company.orgnr, 'id_not_found');
            }
          } else {
            console.log(`No matching company found for ${company.company_name} (${company.orgnr})`);
            localDb.updateCompanyStatus(sourceJobId, company.orgnr, 'id_not_found');
          }
        } catch (searchError) {
          console.log(`Error searching Allabolag.se for ${company.company_name} (${company.orgnr}):`, searchError.message);
          localDb.updateCompanyStatus(sourceJobId, company.orgnr, 'id_not_found');
        }
        
        processedCount++;
        
        // Update job progress
        localDb.updateJob(enrichmentJobId, {
          processedCount: processedCount
        });
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error resolving company ID for ${company.company_name} (${company.orgnr}):`, error);
        localDb.updateCompanyStatus(sourceJobId, company.orgnr, 'error', error.message);
        processedCount++;
      }
    }
  }
  
  // Mark enrichment job as done
  localDb.updateJob(enrichmentJobId, { 
    status: 'done'
  });
  
  // Update the original segmentation job to show Stage 2 is complete
  localDb.updateJob(sourceJobId, {
    stage: 'stage2_enrichment',
    status: 'done'
  });
  
    console.log(`Enrichment job ${enrichmentJobId} completed, processed ${processedCount} companies`);
  });
}




