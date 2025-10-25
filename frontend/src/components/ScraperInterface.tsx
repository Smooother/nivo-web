import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ExternalLink, Database, Play, Settings, Activity, BarChart3, AlertTriangle } from 'lucide-react'
import SessionTrackingDashboard from './SessionTrackingDashboard'
import DataValidationView from './DataValidationView'

const ScraperInterface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const handleOpenScraper = () => {
    setIsLoading(true)
    // Open local scraper in new tab
    window.open('http://localhost:3000', '_blank')
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setActiveTab('validation')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Scraper</h2>
          <p className="text-gray-600 mt-1">
            Access the advanced company data scraper with modern tab-based interface
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOpenScraper}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {isLoading ? 'Opening...' : 'Open Scraper'}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Performance Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Large Session Performance</h4>
            <p className="text-amber-700 text-sm mt-1">
              For sessions with 10k+ companies (2+ hours processing time), we recommend using manual refresh 
              and monitoring progress in stages. Auto-refresh is disabled by default for large datasets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2" disabled={!selectedSessionId}>
            <BarChart3 className="h-4 w-4" />
            Data Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  3-Stage Process
                </CardTitle>
                <CardDescription>
                  Advanced scraping engine with 3-stage data collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Stage 1: Company segmentation</li>
                  <li>• Stage 2: Company ID resolution</li>
                  <li>• Stage 3: Financial data fetching</li>
                  <li>• Real-time progress tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  Advanced Filtering
                </CardTitle>
                <CardDescription>
                  Sophisticated filtering and targeting options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Revenue range filters</li>
                  <li>• Profit margin targeting</li>
                  <li>• Industry classification</li>
                  <li>• Geographic filtering</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Data Validation
                </CardTitle>
                <CardDescription>
                  Comprehensive data validation and quality control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-year financial data</li>
                  <li>• Data completeness checks</li>
                  <li>• Error identification</li>
                  <li>• Quality metrics</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Use the tabs above to monitor sessions and validate scraped data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Session Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• View all scraping sessions</li>
                    <li>• Monitor 3-stage progress</li>
                    <li>• Control stage execution</li>
                    <li>• Performance estimates</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Validation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Review company details</li>
                    <li>• Check financial data quality</li>
                    <li>• Filter and search results</li>
                    <li>• Export validated data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <SessionTrackingDashboard 
            onSessionSelect={handleSessionSelect}
            selectedSessionId={selectedSessionId}
            autoRefresh={false}
          />
        </TabsContent>

        <TabsContent value="validation">
          {selectedSessionId ? (
            <DataValidationView 
              sessionId={selectedSessionId}
              onRefresh={() => {
                // Refresh session data if needed
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Select a session to view data validation</p>
                  <p className="text-sm text-gray-400 mt-1">Go to the Sessions tab to choose a session</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ScraperInterface
