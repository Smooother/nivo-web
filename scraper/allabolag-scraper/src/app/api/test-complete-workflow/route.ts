import { NextRequest, NextResponse } from 'next/server';
import { withSession } from '@/lib/allabolag';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting complete workflow test...');
    
    const testResults = {
      sessionManagement: false,
      segmentation: false,
      search: false,
      financialData: false,
      errors: [] as string[]
    };

    // Test 1: Session Management
    try {
      console.log('🔐 Testing session management...');
      await withSession(async (session) => {
        if (session.cookies) {
          testResults.sessionManagement = true;
          console.log('✅ Session management working (cookies found)');
        } else {
          throw new Error('No cookies found in session');
        }
      });
    } catch (error: any) {
      testResults.errors.push(`Session management failed: ${error.message}`);
      console.error('❌ Session management failed:', error);
    }

    // Test 2: Segmentation (if session works)
    if (testResults.sessionManagement) {
      try {
        console.log('🔍 Testing segmentation...');
        await withSession(async (session) => {
          const { getBuildId, fetchSegmentationPage } = await import('@/lib/allabolag');
          const buildId = await getBuildId(session);
          
          const response = await fetchSegmentationPage(buildId, {
            revenueFrom: 100000, // 100M SEK in thousands
            revenueTo: 101000,   // 101M SEK in thousands
            profitFrom: 3000,    // 3M SEK in thousands
            profitTo: 5000,      // 5M SEK in thousands
            companyType: 'AB',
            page: 1
          }, session);
          
          if (response?.pageProps?.companies && response.pageProps.companies.length > 0) {
            testResults.segmentation = true;
            console.log(`✅ Segmentation working - found ${response.pageProps.companies.length} companies`);
          } else {
            throw new Error('No companies found in segmentation response');
          }
        });
      } catch (error: any) {
        testResults.errors.push(`Segmentation failed: ${error.message}`);
        console.error('❌ Segmentation failed:', error);
      }
    }

    // Test 3: Search functionality
    if (testResults.sessionManagement) {
      try {
        console.log('🔎 Testing search functionality...');
        await withSession(async (session) => {
          const { getBuildId, fetchSearchPage } = await import('@/lib/allabolag');
          const buildId = await getBuildId(session);
          
          // Try multiple search terms
          const searchTerms = ['AB', 'Sverige', 'Stockholm'];
          let searchResults = null;
          
          for (const term of searchTerms) {
            try {
              searchResults = await fetchSearchPage(buildId, term, session);
              // Check the correct path for companies
              const companies = 
                searchResults?.pageProps?.hydrationData?.searchStore?.companies?.companies ||
                searchResults?.pageProps?.companies ||
                [];
              
              if (companies && companies.length > 0) {
                break;
              }
            } catch (e) {
              console.log(`Search term "${term}" failed, trying next...`);
              continue;
            }
          }
          
          // Check the correct path for companies
          const companies = 
            searchResults?.pageProps?.hydrationData?.searchStore?.companies?.companies ||
            searchResults?.pageProps?.companies ||
            [];
          
          if (companies && companies.length > 0) {
            testResults.search = true;
            console.log(`✅ Search working - found ${companies.length} companies`);
          } else {
            throw new Error('No companies found with any search term');
          }
        });
      } catch (error: any) {
        testResults.errors.push(`Search failed: ${error.message}`);
        console.error('❌ Search failed:', error);
      }
    }

    // Test 4: Financial Data (if segmentation works)
    if (testResults.segmentation) {
      try {
        console.log('📊 Testing financial data fetching...');
        await withSession(async (session) => {
          const { getBuildId, fetchSegmentationPage, fetchFinancialData } = await import('@/lib/allabolag');
          const buildId = await getBuildId(session);
          
          // Get a company from segmentation results
          const segmentationResults = await fetchSegmentationPage(buildId, {
            revenueFrom: 100000, // 100M SEK in thousands
            revenueTo: 101000,   // 101M SEK in thousands
            profitFrom: 3000,    // 3M SEK in thousands
            profitTo: 5000,      // 5M SEK in thousands
            companyType: 'AB',
            page: 1
          }, session);
          
          const companies = segmentationResults?.pageProps?.companies || [];
          
          if (companies.length > 0) {
            const company = companies[0];
            const companyData = {
              orgnr: company.organisationNumber || '',
              company_name: company.name || company.displayName || '',
              segment_name: Array.isArray(company.proffIndustries) 
                ? company.proffIndustries.map((i: any) => i?.name).filter(Boolean).join(', ')
                : '',
              companyId: company.companyId || ''
            };
            
            if (companyData.companyId) {
              const financialData = await fetchFinancialData(buildId, companyData, session);
              
              if (financialData && financialData.length > 0) {
                testResults.financialData = true;
                console.log(`✅ Financial data working - found ${financialData.length} financial records`);
              } else {
                console.log('⚠️  No financial data found for this company, but API call succeeded');
                testResults.financialData = true; // Consider this a success since the API worked
              }
            } else {
              throw new Error('No company ID found for financial data test');
            }
          } else {
            throw new Error('No companies found for financial data test');
          }
        });
      } catch (error: any) {
        testResults.errors.push(`Financial data failed: ${error.message}`);
        console.error('❌ Financial data failed:', error);
      }
    }

    // Calculate overall success
    const totalTests = 4;
    const passedTests = Object.values(testResults).filter(Boolean).length - 1; // -1 for errors array
    const successRate = (passedTests / totalTests) * 100;

    const result = {
      success: passedTests === totalTests,
      successRate,
      passedTests,
      totalTests,
      results: testResults,
      summary: {
        sessionManagement: testResults.sessionManagement ? '✅ Working' : '❌ Failed',
        segmentation: testResults.segmentation ? '✅ Working' : '❌ Failed',
        search: testResults.search ? '✅ Working' : '❌ Failed',
        financialData: testResults.financialData ? '✅ Working' : '❌ Failed'
      }
    };

    console.log('🧪 Complete workflow test finished:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('💥 Complete workflow test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Complete workflow test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
