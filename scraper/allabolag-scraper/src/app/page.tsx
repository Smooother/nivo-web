'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  jobType: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error' | 'done';
  stage: 'stage1_segmentation' | 'stage2_enrichment' | 'stage3_financials' | 'validation' | 'migration';
  lastPage: number;
  processedCount: number;
  totalCompanies?: number;
  errorCount?: number;
  error?: string;
  rateLimitStats?: any;
  createdAt: string;
  updatedAt: string;
}

interface SegmentationParams {
  revenueFrom: number | undefined;
  revenueTo: number | undefined;
  profitFrom: number | undefined;
  profitTo: number | undefined;
  companyType: 'AB';
}

interface ValidationSummary {
  total: number;
  valid: number;
  warnings: number;
  invalid: number;
}

interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: number;
  report: any;
}

interface ValidationData {
  companies: Array<{
    orgnr: string;
    company_name: string;
    company_id: string;
    homepage: string;
    foundation_year: number;
    revenue_sek: number;
    profit_sek: number;
    segment_name: string[];
    nace_categories: string[];
    status: string;
    scraped_at: string;
    financial_years: Array<{
      year: number;
      sdi: number;
      dr: number;
      ors: number;
      ek: number;
      fk: number;
    }>;
    additional_data: {
      employees: string | null;
      description: string | null;
      phone: string | null;
      email: string | null;
      legalName: string | null;
      domicile: any;
      signatory: any;
      directors: any;
    };
  }>;
  summary: {
    total_companies: number;
    companies_with_financials: number;
    year_range: { min: number | null; max: number | null };
  };
}

export default function Home() {
  const [params, setParams] = useState<SegmentationParams>({
    revenueFrom: undefined,
    revenueTo: undefined,
    profitFrom: undefined,
    profitTo: undefined,
    companyType: 'AB',
  });
  
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scraping' | 'validation' | 'migration'>('scraping');
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Poll job status
  useEffect(() => {
    if (!currentJob || currentJob.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/segment/status?jobId=${currentJob.id}`);
        if (response.ok) {
          const job = await response.json();
          setCurrentJob(job);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentJob]);

  const handleStartScraping = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/segment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping job');
      }

      const { jobId } = await response.json();
      
      // Fetch initial job status
      const statusResponse = await fetch(`/api/segment/status?jobId=${jobId}`);
      if (statusResponse.ok) {
        const job = await statusResponse.json();
        setCurrentJob(job);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichCompanyIds = async () => {
    if (!currentJob) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enrich/company-ids?jobId=${currentJob.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start enrichment job');
      }

      const { jobId: enrichmentJobId } = await response.json();
      
      // Update current job to show Stage 2 is running
      setCurrentJob(prev => prev ? {
        ...prev,
        stage: 'stage2_enrichment',
        status: 'running'
      } : null);
      
      // Poll for enrichment completion
      const pollEnrichmentStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/segment/status?jobId=${currentJob.id}`);
          if (statusResponse.ok) {
            const job = await statusResponse.json();
            if (job.status === 'done' && job.stage === 'stage2_enrichment') {
              setCurrentJob(prev => prev ? {
                ...prev,
                stage: 'stage2_enrichment',
                status: 'done'
              } : null);
            } else if (job.status === 'running') {
              // Continue polling
              setTimeout(pollEnrichmentStatus, 2000);
            }
          }
        } catch (err) {
          console.error('Error polling enrichment status:', err);
        }
      };
      
      // Start polling after a short delay
      setTimeout(pollEnrichmentStatus, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchFinancials = async () => {
    if (!currentJob) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financial/fetch?jobId=${currentJob.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start financial data fetch');
      }

      const { jobId: financialJobId } = await response.json();
      
      // Update current job to show Stage 3 is running
      setCurrentJob(prev => prev ? {
        ...prev,
        stage: 'stage3_financials',
        status: 'running'
      } : null);
      
      // Poll for financial fetch completion
      const pollFinancialStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/segment/status?jobId=${currentJob.id}`);
          if (statusResponse.ok) {
            const job = await statusResponse.json();
            if (job.status === 'done' && job.stage === 'stage3_financials') {
              setCurrentJob(prev => prev ? {
                ...prev,
                stage: 'stage3_financials',
                status: 'done'
              } : null);
            } else if (job.status === 'running') {
              // Continue polling
              setTimeout(pollFinancialStatus, 2000);
            }
          }
        } catch (err) {
          console.error('Error polling financial status:', err);
        }
      };
      
      // Start polling after a short delay
      setTimeout(pollFinancialStatus, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateData = async () => {
    if (!currentJob) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/staging/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: currentJob.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate data');
      }

      const result = await response.json();
      setValidationSummary(result.summary);
      setActiveTab('validation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateData = async () => {
    if (!currentJob) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/staging/migrate-from-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobId: currentJob.id,
          includeWarnings: false,
          skipDuplicates: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to migrate data');
      }

      const result = await response.json();
      setMigrationResult(result);
      setActiveTab('migration');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWorkflow = async () => {
    setTesting(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-complete-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to run workflow test');
      }

      const result = await response.json();
      setTestResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  const handleLoadValidationData = async () => {
    if (!currentJob) {
      setError('No current job available');
      return;
    }

    setValidationLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/validation/data?jobId=${currentJob.id}`);
      if (!response.ok) {
        throw new Error('Failed to load validation data');
      }

      const data = await response.json();
      setValidationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setValidationLoading(false);
    }
  };

  const toggleRowExpansion = (orgnr: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orgnr)) {
      newExpanded.delete(orgnr);
    } else {
      newExpanded.add(orgnr);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYearBadges = (years: number[]) => {
    if (years.length === 0) return <span className="text-red-500 text-xs">No data</span>;
    
    const sortedYears = [...years].sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();
    
    return (
      <div className="flex flex-wrap gap-1">
        {sortedYears.map(year => (
          <span
            key={year}
            className={`px-2 py-1 rounded text-xs font-medium ${
              year === currentYear 
                ? 'bg-green-100 text-green-800' 
                : year >= currentYear - 1 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {year}
          </span>
        ))}
      </div>
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'stage1_segmentation': return 'Stage 1: Company Search';
      case 'stage2_enrichment': return 'Stage 2: Company ID Resolution';
      case 'stage3_financials': return 'Stage 3: Financial Data Fetch';
      case 'validation': return 'Data Validation';
      case 'migration': return 'Data Migration';
      default: return stage;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-yellow-600';
      case 'done': return 'text-green-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'paused': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Multi-Source Web Scraper
              </h1>
              <p className="text-gray-600 mt-1">
                Importera företagsdata från Allabolag.se och andra källor
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleTestWorkflow}
                disabled={testing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Workflow
                  </>
                )}
              </button>
              <button
                onClick={() => window.open('http://localhost:8080', '_blank')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Tillbaka till Dashboard
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scraping')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scraping'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scraping
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'validation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Validation
              </button>
              <button
                onClick={() => setActiveTab('migration')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'migration'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Migration
              </button>
            </nav>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Test Results Display */}
          {testResults && (
            <div className={`border rounded-md p-4 mb-6 ${
              testResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center mb-3">
                <svg className={`w-5 h-5 mr-2 ${
                  testResults.success ? 'text-green-600' : 'text-yellow-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className={`text-lg font-semibold ${
                  testResults.success ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  Workflow Test Results
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Success Rate:</span>
                    <span className={`font-medium ${
                      testResults.successRate === 100 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {testResults.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tests Passed:</span>
                    <span className="font-medium text-gray-900">
                      {testResults.passedTests}/{testResults.totalTests}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(testResults.summary).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {testResults.results.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {testResults.results.errors.map((error: string, index: number) => (
                      <li key={index} className="text-red-700 text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Scraping Tab */}
          {activeTab === 'scraping' && (
            <div className="space-y-6">
              {/* Filter Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Segmentation Filters
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revenue From (Millions SEK)
                    </label>
                    <input
                      type="number"
                      value={params.revenueFrom || ''}
                      onChange={(e) => setParams(prev => ({ 
                        ...prev, 
                        revenueFrom: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revenue To (Millions SEK)
                    </label>
                    <input
                      type="number"
                      value={params.revenueTo || ''}
                      onChange={(e) => setParams(prev => ({ 
                        ...prev, 
                        revenueTo: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="150"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profit From (Millions SEK)
                    </label>
                    <input
                      type="number"
                      value={params.profitFrom || ''}
                      onChange={(e) => setParams(prev => ({ 
                        ...prev, 
                        profitFrom: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profit To (Millions SEK)
                    </label>
                    <input
                      type="number"
                      value={params.profitTo || ''}
                      onChange={(e) => setParams(prev => ({ 
                        ...prev, 
                        profitTo: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="50"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Type
                  </label>
                  <select
                    value={params.companyType}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      companyType: e.target.value as 'AB' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="AB">AB (Aktiebolag)</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={handleStartScraping}
                    disabled={loading || (currentJob?.status === 'running')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Starting...' : 'Start Scraping'}
                  </button>
                </div>
              </div>

              {/* Compact Status Indicators */}
              {currentJob && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Job Progress</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentJob.status)}`}>
                      {currentJob.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{currentJob.processedCount}</div>
                      <div className="text-gray-600">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">{currentJob.lastPage}</div>
                      <div className="text-gray-600">Last Page</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{getStageDisplayName(currentJob.stage)}</div>
                      <div className="text-gray-600">Current Stage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{currentJob.errorCount || 0}</div>
                      <div className="text-gray-600">Errors</div>
                    </div>
                  </div>
                  
                  {currentJob.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                        Processing... Please wait
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current Job Status */}
              {currentJob && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Job Status: {getStageDisplayName(currentJob.stage)}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Status:</span>
                        <span className={`font-medium ${getStatusColor(currentJob.status)}`}>
                          {currentJob.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-blue-700">Last Page:</span>
                        <span className="text-blue-900">{currentJob.lastPage}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-blue-700">Processed:</span>
                        <span className="text-blue-900">{formatNumber(currentJob.processedCount)}</span>
                      </div>
                      
                      {currentJob.totalCompanies && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total Companies:</span>
                          <span className="text-blue-900">{formatNumber(currentJob.totalCompanies)}</span>
                        </div>
                      )}
                      
                      {currentJob.errorCount && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Errors:</span>
                          <span className="text-red-600">{currentJob.errorCount}</span>
                        </div>
                      )}
                    </div>
                    
                    {currentJob.rateLimitStats && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-800">Rate Limiting Stats</h4>
                        <div className="text-sm space-y-1">
                          <div>Concurrent: {currentJob.rateLimitStats.concurrent}</div>
                          <div>Delay: {currentJob.rateLimitStats.requestDelay}ms</div>
                          <div>Success Rate: {(currentJob.rateLimitStats.recentSuccessRate * 100).toFixed(1)}%</div>
                          <div>Avg Response: {currentJob.rateLimitStats.averageResponseTime.toFixed(0)}ms</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {currentJob.error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
                      <p className="text-red-800 text-sm">{currentJob.error}</p>
                    </div>
                  )}
                  
                  {/* Stage-specific actions */}
                  <div className="mt-6 space-y-3">
                    {/* Stage 1 Complete - Show Stage 2 Button */}
                    {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' && (
                      <button
                        onClick={handleEnrichCompanyIds}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Starting...' : 'Start Stage 2: Company ID Resolution'}
                      </button>
                    )}
                    
                    {/* Stage 2 Complete - Show Stage 3 Button */}
                    {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' && (
                      <button
                        onClick={handleFetchFinancials}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Starting...' : 'Start Stage 3: Financial Data Fetch'}
                      </button>
                    )}
                    
                    {/* Stage 3 Complete - Show Validation Button */}
                    {currentJob.stage === 'stage3_financials' && currentJob.status === 'done' && (
                      <button
                        onClick={handleValidateData}
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Validating...' : 'Validate Data'}
                      </button>
                    )}
                    
                    {/* Show current stage progress */}
                    {currentJob.status === 'running' && (
                      <div className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-md text-center font-medium">
                        {getStageDisplayName(currentJob.stage)} in progress...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Pipeline Overview */}
              {currentJob && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete Pipeline Status
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Stage 1 */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative ${
                          currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running' && (
                            <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                          )}
                          {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {!(currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done') && 
                           !(currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running') && (
                            <span>1</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">Company Search</div>
                          <div className="text-sm text-gray-600">Find companies matching criteria</div>
                          {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running' && (
                            <div className="text-xs text-blue-600 mt-1">
                              Page {currentJob.lastPage || 0} • {currentJob.processedCount || 0} companies found
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' 
                            ? `${currentJob.totalCompanies || 0} companies found`
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running'
                            ? 'In progress...'
                            : 'Pending'
                          }
                        </div>
                        <div className={`text-xs ${
                          currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' 
                            ? 'text-green-600' 
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running'
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }`}>
                          {currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done' 
                            ? 'Completed' 
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'running'
                            ? 'Running'
                            : 'Not started'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative ${
                          currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running' && (
                            <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                          )}
                          {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {!(currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done') && 
                           !(currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running') && (
                            <span>2</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">Company ID Resolution</div>
                          <div className="text-sm text-gray-600">Resolve company IDs for financial data</div>
                          {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running' && (
                            <div className="text-xs text-blue-600 mt-1">
                              Processing companies • {currentJob.processedCount || 0} resolved
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' 
                            ? 'Company IDs resolved'
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running'
                            ? 'In progress...'
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done'
                            ? 'Ready to start'
                            : 'Pending'
                          }
                        </div>
                        <div className={`text-xs ${
                          currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' 
                            ? 'text-green-600' 
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running'
                            ? 'text-blue-600'
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                          {currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done' 
                            ? 'Completed' 
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'running'
                            ? 'Running'
                            : currentJob.stage === 'stage1_segmentation' && currentJob.status === 'done'
                            ? 'Ready'
                            : 'Not started'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative ${
                          currentJob.stage === 'stage3_financials' && currentJob.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : currentJob.stage === 'stage3_financials' && currentJob.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currentJob.stage === 'stage3_financials' && currentJob.status === 'running' && (
                            <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                          )}
                          {currentJob.stage === 'stage3_financials' && currentJob.status === 'done' && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {!(currentJob.stage === 'stage3_financials' && currentJob.status === 'done') && 
                           !(currentJob.stage === 'stage3_financials' && currentJob.status === 'running') && (
                            <span>3</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">Financial Data Fetch</div>
                          <div className="text-sm text-gray-600">Download detailed financial data</div>
                          {currentJob.stage === 'stage3_financials' && currentJob.status === 'running' && (
                            <div className="text-xs text-blue-600 mt-1">
                              Fetching financials • {currentJob.processedCount || 0} companies processed
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {currentJob.stage === 'stage3_financials' && currentJob.status === 'done' 
                            ? 'Financial data fetched'
                            : currentJob.stage === 'stage3_financials' && currentJob.status === 'running'
                            ? 'In progress...'
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done'
                            ? 'Ready to start'
                            : 'Pending'
                          }
                        </div>
                        <div className={`text-xs ${
                          currentJob.stage === 'stage3_financials' && currentJob.status === 'done' 
                            ? 'text-green-600' 
                            : currentJob.stage === 'stage3_financials' && currentJob.status === 'running'
                            ? 'text-blue-600'
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                          {currentJob.stage === 'stage3_financials' && currentJob.status === 'done' 
                            ? 'Completed' 
                            : currentJob.stage === 'stage3_financials' && currentJob.status === 'running'
                            ? 'Running'
                            : currentJob.stage === 'stage2_enrichment' && currentJob.status === 'done'
                            ? 'Ready'
                            : 'Not started'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Presets */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Presets
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setParams({
                      revenueFrom: 15,
                      revenueTo: 150,
                      profitFrom: 1,
                      profitTo: 50,
                      companyType: 'AB',
                    })}
                    className="p-3 text-left bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Small-Medium Companies</div>
                    <div className="text-sm text-gray-600">15-150M SEK revenue, 1M+ SEK profit</div>
                  </button>
                  
                  <button
                    onClick={() => setParams({
                      revenueFrom: 100,
                      revenueTo: 1000,
                      profitFrom: 10,
                      profitTo: 200,
                      companyType: 'AB',
                    })}
                    className="p-3 text-left bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Medium-Large Companies</div>
                    <div className="text-sm text-gray-600">100-1000M SEK revenue, 10M+ SEK profit</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              {/* Job ID Input */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Validation Data</h3>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter Job ID (e.g., 10536458-d121-4964-b3e5-dd0582bcc4d3)"
                    value={currentJob?.id || ''}
                    onChange={(e) => {
                      // Create a temporary job object for validation
                      if (e.target.value) {
                        setCurrentJob({
                          id: e.target.value,
                          stage: 'stage3_financials',
                          status: 'done',
                          processedCount: 0,
                          totalCompanies: 0,
                          lastPage: 0,
                          errorCount: 0
                        });
                      } else {
                        setCurrentJob(null);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleLoadValidationData}
                    disabled={validationLoading || !currentJob?.id}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {validationLoading ? 'Loading...' : 'Load Data'}
                  </button>
                </div>
              </div>

              {/* Compact Status for Validation Tab */}
              {currentJob && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Current Job Status</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentJob.status)}`}>
                      {currentJob.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{validationData ? validationData.summary.total_companies : currentJob.processedCount}</div>
                      <div className="text-gray-600">Companies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{validationData ? validationData.summary.companies_with_financials : 0}</div>
                      <div className="text-gray-600">With Financials</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{getStageDisplayName(currentJob.stage)}</div>
                      <div className="text-gray-600">Current Stage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{currentJob.errorCount || 0}</div>
                      <div className="text-gray-600">Errors</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Data Display */}
              {validationData && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Data Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{validationData.summary.total_companies}</div>
                        <div className="text-sm text-blue-700">Total Companies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{validationData.summary.companies_with_financials}</div>
                        <div className="text-sm text-green-700">With Financial Data</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {validationData.summary.year_range.min && validationData.summary.year_range.max 
                            ? `${validationData.summary.year_range.min}-${validationData.summary.year_range.max}`
                            : 'N/A'
                          }
                        </div>
                        <div className="text-sm text-purple-700">Year Range</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {validationData.companies.reduce((sum, c) => sum + c.financial_years.length, 0)}
                        </div>
                        <div className="text-sm text-orange-700">Total Records</div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setValidationData(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Refresh
                    </button>
                  </div>

                  {/* Companies Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              OrgNr
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Foundation
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Latest Revenue
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Latest Profit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Financial Years
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {validationData.companies
                            .filter(company => 
                              company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              company.orgnr.includes(searchTerm)
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((company) => {
                              const latestFinancial = company.financial_years[0];
                              const isExpanded = expandedRows.has(company.orgnr);
                              
                              return (
                                <>
                                  <tr key={company.orgnr} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                                        {company.additional_data.employees && (
                                          <div className="text-sm text-gray-500">Employees: {company.additional_data.employees}</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {company.orgnr}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {company.foundation_year || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatCurrency(latestFinancial?.sdi)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatCurrency(latestFinancial?.dr)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {formatYearBadges(company.financial_years.map(f => f.year))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => toggleRowExpansion(company.orgnr)}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        {isExpanded ? 'Hide Details' : 'Show Details'}
                                      </button>
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded Row */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                        <div className="space-y-4">
                                          {/* Additional Company Data */}
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Company Information</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                              <div>
                                                <span className="font-medium">Legal Name:</span>
                                                <div className="text-gray-600">{company.additional_data.legalName || 'N/A'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">Phone:</span>
                                                <div className="text-gray-600">{company.additional_data.phone || 'N/A'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">Email:</span>
                                                <div className="text-gray-600">{company.additional_data.email || 'N/A'}</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">Homepage:</span>
                                                <div className="text-gray-600">
                                                  {company.homepage ? (
                                                    <a href={company.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                      {company.homepage}
                                                    </a>
                                                  ) : 'N/A'}
                                                </div>
                                              </div>
                                            </div>
                                            {company.additional_data.domicile && (
                                              <div className="mt-2 text-sm">
                                                <span className="font-medium">Location:</span>
                                                <div className="text-gray-600">
                                                  {company.additional_data.domicile.municipality}, {company.additional_data.domicile.county}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Financial Data by Year */}
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Financial Data by Year</h4>
                                            <div className="overflow-x-auto">
                                              <table className="min-w-full text-sm">
                                                <thead>
                                                  <tr className="border-b">
                                                    <th className="text-left py-2">Year</th>
                                                    <th className="text-right py-2">Revenue (SDI)</th>
                                                    <th className="text-right py-2">Net Profit (DR)</th>
                                                    <th className="text-right py-2">EBITDA (ORS)</th>
                                                    <th className="text-right py-2">Equity (EK)</th>
                                                    <th className="text-right py-2">Debt (FK)</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {company.financial_years.map((financial) => (
                                                    <tr key={financial.year} className="border-b">
                                                      <td className="py-2 font-medium">{financial.year}</td>
                                                      <td className="py-2 text-right">{formatCurrency(financial.sdi)}</td>
                                                      <td className="py-2 text-right">{formatCurrency(financial.dr)}</td>
                                                      <td className="py-2 text-right">{formatCurrency(financial.ors)}</td>
                                                      <td className="py-2 text-right">{formatCurrency(financial.ek)}</td>
                                                      <td className="py-2 text-right">{formatCurrency(financial.fk)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {validationData.companies.filter(company => 
                      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      company.orgnr.includes(searchTerm)
                    ).length > itemsPerPage && (
                      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage * itemsPerPage >= validationData.companies.length}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing{' '}
                              <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                              {' '}to{' '}
                              <span className="font-medium">
                                {Math.min(currentPage * itemsPerPage, validationData.companies.length)}
                              </span>
                              {' '}of{' '}
                              <span className="font-medium">{validationData.companies.length}</span>
                              {' '}results
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage * itemsPerPage >= validationData.companies.length}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Migration Tab */}
          {activeTab === 'migration' && (
            <div className="space-y-6">
              {/* Compact Status for Migration Tab */}
              {currentJob && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Current Job Status</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentJob.status)}`}>
                      {currentJob.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{currentJob.processedCount}</div>
                      <div className="text-gray-600">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">{currentJob.lastPage}</div>
                      <div className="text-gray-600">Last Page</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{getStageDisplayName(currentJob.stage)}</div>
                      <div className="text-gray-600">Current Stage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{currentJob.errorCount || 0}</div>
                      <div className="text-gray-600">Errors</div>
                    </div>
                  </div>
                </div>
              )}
              {migrationResult ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Migration Results
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{migrationResult.migrated}</div>
                      <div className="text-sm text-green-700">Migrated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{migrationResult.skipped}</div>
                      <div className="text-sm text-yellow-700">Skipped (Duplicates)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{migrationResult.errors}</div>
                      <div className="text-sm text-red-700">Errors</div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Migration Report</h4>
                    <pre className="text-sm text-gray-600 overflow-auto">
                      {JSON.stringify(migrationResult.report, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No migration results available. Run migration first.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}