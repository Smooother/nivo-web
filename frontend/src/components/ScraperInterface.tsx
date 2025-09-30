import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { ExternalLink, Database, Play, Settings } from 'lucide-react'
import ScraperStatusDashboard from './ScraperStatusDashboard'

const ScraperInterface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  const handleOpenScraper = () => {
    setIsLoading(true)
    // Open local scraper in new tab
    window.open('http://localhost:3000', '_blank')
    setTimeout(() => setIsLoading(false), 1000)
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
          <Button 
            onClick={() => setShowStatus(!showStatus)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showStatus ? 'Hide Status' : 'Show Status'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Real-time Scraping
            </CardTitle>
            <CardDescription>
              Advanced scraping engine with live progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Live job monitoring</li>
              <li>• Progress indicators</li>
              <li>• Error handling</li>
              <li>• Queue management</li>
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
              <Database className="h-5 w-5 text-purple-600" />
              Data Integration
            </CardTitle>
            <CardDescription>
              Seamless integration with Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic data sync</li>
              <li>• Real-time updates</li>
              <li>• Data validation</li>
              <li>• Conflict resolution</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scraper Features</CardTitle>
          <CardDescription>
            The new scraper interface includes modern tab-based UI with advanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Interface Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Modern tab-based navigation</li>
                <li>• Real-time job tracking</li>
                <li>• Advanced filtering options</li>
                <li>• Progress indicators</li>
                <li>• Error handling and logging</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue and profit filtering</li>
                <li>• Industry code targeting</li>
                <li>• Company size classification</li>
                <li>• Geographic targeting</li>
                <li>• Automatic data enrichment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {showStatus && (
        <div className="mt-6">
          <ScraperStatusDashboard />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Access the Scraper</h4>
            <p className="text-blue-700 text-sm mt-1">
              Click the "Open Scraper" button above to access the local scraper interface. 
              Use "Show Status" to monitor scraping jobs and review company data in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScraperInterface
