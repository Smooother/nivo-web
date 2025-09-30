'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  jobType: string;
  status: 'running' | 'done' | 'error';
  lastPage: number;
  processedCount: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface SegmentationParams {
  revenueFrom: number;
  revenueTo: number;
  profitFrom: number;
  profitTo: number;
  companyType: 'AB';
}

export default function Home() {
  const [params, setParams] = useState<SegmentationParams>({
    revenueFrom: 15,
    revenueTo: 150,
    profitFrom: 1,
    profitTo: 50,
    companyType: 'AB',
  });
  
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [enrichmentJob, setEnrichmentJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Poll enrichment job status
  useEffect(() => {
    if (!enrichmentJob || enrichmentJob.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/segment/status?jobId=${enrichmentJob.id}`);
        if (response.ok) {
          const job = await response.json();
          setEnrichmentJob(job);
        }
      } catch (err) {
        console.error('Error polling enrichment job status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [enrichmentJob]);

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

      const { jobId } = await response.json();
      
      // Fetch initial enrichment job status
      const statusResponse = await fetch(`/api/segment/status?jobId=${jobId}`);
      if (statusResponse.ok) {
        const job = await statusResponse.json();
        setEnrichmentJob(job);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Allabolag Scraper
          </h1>
          
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
                    value={params.revenueFrom}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      revenueFrom: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revenue To (Millions SEK)
                  </label>
                  <input
                    type="number"
                    value={params.revenueTo}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      revenueTo: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit From (Millions SEK)
                  </label>
                  <input
                    type="number"
                    value={params.profitFrom}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      profitFrom: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit To (Millions SEK)
                  </label>
                  <input
                    type="number"
                    value={params.profitTo}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      profitTo: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Current Job Status */}
            {currentJob && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Segmentation Job Status
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status:</span>
                    <span className={`font-medium ${
                      currentJob.status === 'running' ? 'text-yellow-600' :
                      currentJob.status === 'done' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {currentJob.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-700">Last Page:</span>
                    <span className="text-blue-900">{currentJob.lastPage}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-700">Processed Count:</span>
                    <span className="text-blue-900">{formatNumber(currentJob.processedCount)}</span>
                  </div>
                  
                  {currentJob.error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
                      <p className="text-red-800 text-sm">{currentJob.error}</p>
                    </div>
                  )}
                </div>
                
                {currentJob.status === 'done' && (
                  <div className="mt-6">
                    <button
                      onClick={handleEnrichCompanyIds}
                      disabled={loading || (enrichmentJob?.status === 'running')}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Starting...' : 'Enrich Company IDs'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enrichment Job Status */}
            {enrichmentJob && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Enrichment Job Status
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className={`font-medium ${
                      enrichmentJob.status === 'running' ? 'text-yellow-600' :
                      enrichmentJob.status === 'done' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {enrichmentJob.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-green-700">Processed Count:</span>
                    <span className="text-green-900">{formatNumber(enrichmentJob.processedCount)}</span>
                  </div>
                  
                  {enrichmentJob.error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
                      <p className="text-red-800 text-sm">{enrichmentJob.error}</p>
                    </div>
                  )}
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
        </div>
      </div>
    </div>
  );
}