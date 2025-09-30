import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db, jobs, rawCompanies, companyIds } from '@/lib/db';
import { filterHash } from '@/lib/hash';
import { getBuildId, fetchSearchPage } from '@/lib/allabolag';
import { eq, isNull, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    // Create enrichment job
    const enrichmentJobId = uuidv4();
    const hash = filterHash({ type: 'enrich_company_ids', timestamp: Date.now() });
    
    await db.insert(jobs).values({
      id: enrichmentJobId,
      jobType: 'enrich_company_id',
      filterHash: hash,
      params: { sourceJobId: jobId },
      status: 'running',
      lastPage: 0,
      processedCount: 0,
    });
    
    // Start processing in background
    processEnrichmentJob(enrichmentJobId, jobId).catch(async (error) => {
      console.error('Enrichment job failed:', error);
      await db
        .update(jobs)
        .set({ 
          status: 'error', 
          error: error.message,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, enrichmentJobId));
    });
    
    return NextResponse.json({ jobId: enrichmentJobId });
  } catch (error) {
    console.error('Error starting enrichment job:', error);
    return NextResponse.json(
      { error: 'Failed to start enrichment job' },
      { status: 500 }
    );
  }
}

async function processEnrichmentJob(enrichmentJobId: string, sourceJobId: string) {
  const buildId = await getBuildId();
  const batchSize = 200;
  const concurrency = 5;
  let processedCount = 0;
  
  console.log(`Starting enrichment job ${enrichmentJobId} with buildId: ${buildId}`);
  
  while (true) {
    // Get batch of companies without companyId
    const companies = await db
      .select()
      .from(rawCompanies)
      .where(and(
        isNull(rawCompanies.companyId),
        isNull(rawCompanies.companyIdHint) // Also skip if we have a hint but no canonical ID
      ))
      .limit(batchSize);
    
    if (companies.length === 0) {
      console.log('No more companies to enrich');
      break;
    }
    
    console.log(`Processing batch of ${companies.length} companies`);
    
    // Process in chunks with controlled concurrency
    const chunks = [];
    for (let i = 0; i < companies.length; i += concurrency) {
      chunks.push(companies.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (company) => {
        try {
          let companyId: string | null = null;
          
          // Try searching by orgnr first
          if (company.orgnr) {
            const searchResponse = await fetchSearchPage(buildId, company.orgnr);
            const searchResults = searchResponse?.pageProps?.companies || [];
            
            if (searchResults.length > 0) {
              const topResult = searchResults[0];
              if (topResult.companyId) {
                companyId = topResult.companyId;
              }
            }
          }
          
          // Fallback to company name search
          if (!companyId && company.companyName) {
            const searchResponse = await fetchSearchPage(buildId, company.companyName);
            const searchResults = searchResponse?.pageProps?.companies || [];
            
            if (searchResults.length > 0) {
              const topResult = searchResults[0];
              if (topResult.companyId) {
                companyId = topResult.companyId;
              }
            }
          }
          
          if (companyId) {
            // Store in company_ids table
            await db
              .insert(companyIds)
              .values({
                orgnr: company.orgnr,
                companyId,
                source: 'scraper',
                confidenceScore: '1.0',
                scrapedAt: new Date(),
                jobId: company.jobId,
                status: 'pending',
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: companyIds.orgnr,
                set: {
                  companyId,
                  source: 'scraper',
                  confidenceScore: '1.0',
                  scrapedAt: new Date(),
                  jobId: company.jobId,
                  status: 'pending',
                  updatedAt: new Date(),
                },
              });
            
            // Update raw_companies with the found companyId
            await db
              .update(rawCompanies)
              .set({
                companyId,
                updatedAt: new Date(),
              })
              .where(eq(rawCompanies.orgnr, company.orgnr));
            
            console.log(`Found companyId ${companyId} for orgnr ${company.orgnr}`);
          } else {
            console.log(`No companyId found for orgnr ${company.orgnr}`);
          }
          
        } catch (error) {
          console.error(`Error enriching company ${company.orgnr}:`, error);
        }
      });
      
      await Promise.all(promises);
      processedCount += chunk.length;
      
      // Update job progress
      await db
        .update(jobs)
        .set({
          processedCount,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, enrichmentJobId));
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Mark job as done
  await db
    .update(jobs)
    .set({ 
      status: 'done',
      updatedAt: new Date()
    })
    .where(eq(jobs.id, enrichmentJobId));
  
  console.log(`Enrichment job ${enrichmentJobId} completed, processed ${processedCount} companies`);
}




