import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface JobStatus {
  id: string;
  jobType: string;
  status: 'running' | 'done' | 'error';
  lastPage: number;
  processedCount: number;
  totalCompanies: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyData {
  orgnr: string;
  company_name: string;
  revenue_sek: number;
  profit_sek: number;
  status: 'pending' | 'approved' | 'rejected';
  scraped_at: string;
}

const ScraperStatusDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch jobs
      const jobsResponse = await fetch('http://localhost:8000/staging/jobs');
      const jobsData = await jobsResponse.json();
      setJobs(jobsData);

      // Fetch companies
      const companiesResponse = await fetch('http://localhost:8000/staging/companies');
      const companiesData = await companiesResponse.json();
      setCompanies(companiesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'done':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE');
  };

  const totalCompanies = companies.length;
  const pendingCompanies = companies.filter(c => c.status === 'pending').length;
  const approvedCompanies = companies.filter(c => c.status === 'approved').length;
  const rejectedCompanies = companies.filter(c => c.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading scraper status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scraper Status Dashboard</h2>
          <p className="text-gray-600">Monitor scraping jobs and review company data</p>
        </div>
        <Button 
          onClick={fetchData} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalCompanies)}</div>
            <p className="text-xs text-muted-foreground">Scraped companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatNumber(pendingCompanies)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(approvedCompanies)}</div>
            <p className="text-xs text-muted-foreground">Ready for migration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatNumber(rejectedCompanies)}</div>
            <p className="text-xs text-muted-foreground">Not suitable</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scraping Jobs</CardTitle>
          <CardDescription>Latest scraping job status and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium">Job {job.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-600">
                      {job.totalCompanies} companies found • Page {job.lastPage} • {formatDate(job.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(job.status)}
                  {job.status === 'done' && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`http://localhost:3000`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Scraper
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Companies</CardTitle>
          <CardDescription>Latest scraped companies awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companies.slice(0, 10).map((company) => (
              <div key={company.orgnr} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{company.company_name}</div>
                  <div className="text-sm text-gray-600">
                    Org: {company.orgnr} • Revenue: {formatNumber(company.revenue_sek)} SEK • Profit: {formatNumber(company.profit_sek)} SEK
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={company.status === 'pending' ? 'secondary' : company.status === 'approved' ? 'default' : 'destructive'}>
                    {company.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your scraping workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button asChild>
              <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Scraper
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                API Documentation
              </a>
            </Button>
            <Button variant="outline" onClick={fetchData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScraperStatusDashboard;



