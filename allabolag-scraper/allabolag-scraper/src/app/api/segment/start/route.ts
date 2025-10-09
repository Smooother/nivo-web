import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/lib/db';
import { filterHash } from '@/lib/hash';
import { getBuildId, fetchSegmentationPage, normalizeCompany } from '@/lib/allabolag';

const StartSegmentationSchema = z.object({
  revenueFrom: z.number().min(0),
  revenueTo: z.number().min(0),
  profitFrom: z.number().min(0),
  profitTo: z.number().min(0),
  companyType: z.literal("AB").optional().default("AB"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = StartSegmentationSchema.parse(body);
    
    // Convert millions SEK to actual SEK values for the scraper
    const scraperParams = {
      ...params,
      revenueFrom: params.revenueFrom * 1000000,
      revenueTo: params.revenueTo * 1000000,
      profitFrom: params.profitFrom * 1000000,
      profitTo: params.profitTo * 1000000,
    };
    
    // Compute filter hash using original params (for UI consistency)
    const hash = filterHash(params);
    
    // Check if job already exists and is running
    const supabase = getSupabase();
    const { data: existingJobs, error: checkError } = await supabase
      .from('scraper_staging_jobs')
      .select('*')
      .eq('filter_hash', hash)
      .eq('status', 'running')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing jobs:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing jobs' },
        { status: 500 }
      );
    }
    
    if (existingJobs && existingJobs.length > 0) {
      return NextResponse.json({ 
        jobId: existingJobs[0].id,
        message: 'Job already running' 
      });
    }
    
    // Create new job
    const jobId = uuidv4();
    const { error: insertError } = await supabase
      .from('scraper_staging_jobs')
      .insert({
        id: jobId,
        job_type: 'segmentation',
        filter_hash: hash,
        params: JSON.stringify(params),
        status: 'running',
        last_page: 0,
        processed_count: 0,
        total_companies: 0,
        migration_status: 'pending',
      });
    
    if (insertError) {
      console.error('Error creating job:', insertError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }
    
    // Start processing in background (serverless execution)
    processSegmentationJob(jobId, scraperParams).catch(async (error) => {
      console.error('Segmentation job failed:', error);
      await supabase
        .from('scraper_staging_jobs')
        .update({ 
          status: 'error', 
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    });
    
    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Error starting segmentation job:', error);
    return NextResponse.json(
      { error: 'Failed to start segmentation job' },
      { status: 500 }
    );
  }
}

async function processSegmentationJob(jobId: string, params: any) {
  const supabase = getSupabase();
  const buildId = await getBuildId();
  let currentPage = 1;
  let emptyPages = 0;
  let totalCompaniesFound = 0;
  const maxPages = 3000;
  const maxEmptyPages = 3;
  
  console.log(`Starting segmentation job ${jobId} with buildId: ${buildId}`);
  
  while (currentPage <= maxPages) {
    try {
      console.log(`Processing page ${currentPage} for job ${jobId}`);
      
      const response = await fetchSegmentationPage(buildId, {
        ...params,
        page: currentPage,
      });
      
      const companies = response?.pageProps?.companies || [];
      console.log(`Page ${currentPage}: Found ${companies.length} companies`);
      
      if (companies.length === 0) {
        emptyPages++;
        console.log(`Empty page ${currentPage}, count: ${emptyPages}`);
        
        if (emptyPages >= maxEmptyPages) {
          console.log(`Reached ${maxEmptyPages} empty pages, stopping`);
          break;
        }
      } else {
        emptyPages = 0; // Reset counter on non-empty page
        totalCompaniesFound += companies.length; // Accumulate total companies
        
        // Process and upsert companies
        for (const company of companies) {
          const normalized = normalizeCompany(company);
          
          if (!normalized.orgnr) {
            console.warn('Skipping company without orgnr:', company);
            continue;
          }
          
          const { error: upsertError } = await supabase
            .from('scraper_staging_companies')
            .upsert({
              orgnr: normalized.orgnr,
              company_name: normalized.companyName,
              company_id: normalized.companyId,
              company_id_hint: normalized.companyIdHint,
              homepage: normalized.homepage,
              nace_categories: normalized.naceCategories,
              segment_name: normalized.segmentName,
              revenue_sek: normalized.revenueSek,
              profit_sek: normalized.profitSek,
              foundation_year: normalized.foundationYear,
              company_accounts_last_year: normalized.companyAccountsLastYear,
              scraped_at: new Date().toISOString(),
              job_id: jobId,
              status: 'pending',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'orgnr'
            });
          
          if (upsertError) {
            console.error('Error upserting company:', upsertError);
          }
        }
      }
      
      // Update job progress
      await supabase
        .from('scraper_staging_jobs')
        .update({
          last_page: currentPage,
          processed_count: totalCompaniesFound,
          total_companies: totalCompaniesFound,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      
      // Log first two orgnrs for debugging
      if (companies.length > 0) {
        const firstTwoOrgnrs = companies.slice(0, 2).map((c: any) => c.organisationNumber);
        console.log(`Page ${currentPage} first two orgnrs:`, firstTwoOrgnrs);
      }
      
      currentPage++;
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error processing page ${currentPage}:`, error);
      throw error;
    }
  }
  
  // Mark job as done
  await supabase
    .from('scraper_staging_jobs')
    .update({ 
      status: 'done',
      total_companies: totalCompaniesFound,
      processed_count: totalCompaniesFound,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
  
  console.log(`Segmentation job ${jobId} completed with ${totalCompaniesFound} companies found`);
}




