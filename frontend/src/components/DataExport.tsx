import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileImage, 
  Database,
  Filter,
  CheckCircle,
  Loader2,
  Mail,
  Calendar,
  BarChart3,
  List,
  AlertCircle
} from 'lucide-react'
import { AnalyticsService, CompanyFilter } from '../lib/analyticsService'
import { SupabaseCompany } from '../lib/supabaseDataService'

interface SavedCompanyList {
  id: string
  name: string
  description?: string
  companies: SupabaseCompany[]
  filters: any
  createdAt: string
  updatedAt: string
}

interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf'
  selectedListId: string
  includeKPIs: boolean
  includeFinancials: boolean
  includeContactInfo: boolean
}

interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: string
  listName: string
  recordCount: number
  createdAt: string
  downloadUrl?: string
}

const DataExport: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    selectedListId: '',
    includeKPIs: true,
    includeFinancials: true,
    includeContactInfo: true
  })
  
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [savedLists, setSavedLists] = useState<SavedCompanyList[]>([])
  const [recordCount, setRecordCount] = useState<number>(0)

  // Load saved lists from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedCompanyLists')
    if (saved) {
      try {
        const lists = JSON.parse(saved)
        setSavedLists(lists)
      } catch (error) {
        console.error('Error loading saved lists:', error)
      }
    }
  }, [])

  // Update record count when selected list changes
  useEffect(() => {
    if (exportOptions.selectedListId) {
      const selectedList = savedLists.find(list => list.id === exportOptions.selectedListId)
      setRecordCount(selectedList ? selectedList.companies.length : 0)
    } else {
      setRecordCount(0)
    }
  }, [exportOptions.selectedListId, savedLists])

  const handleExport = async () => {
    if (!exportOptions.selectedListId) {
      alert('Please select a saved list to export')
      return
    }

    try {
      setIsExporting(true)
      
      const selectedList = savedLists.find(list => list.id === exportOptions.selectedListId)
      if (!selectedList) {
        alert('Selected list not found')
        return
      }
      
      // Create export job
      const jobId = `export_${Date.now()}`
      const newJob: ExportJob = {
        id: jobId,
        status: 'processing',
        format: exportOptions.format,
        listName: selectedList.name,
        recordCount: selectedList.companies.length,
        createdAt: new Date().toISOString()
      }
      
      setExportJobs(prev => [newJob, ...prev])
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update job status
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', downloadUrl: `/exports/${jobId}.${exportOptions.format}` }
          : job
      ))
      
    } catch (error) {
      console.error('Export failed:', error)
      // Find the most recent job to mark as failed
      setExportJobs(prev => {
        const latestJob = prev[0]
        if (latestJob && latestJob.status === 'processing') {
          return prev.map(job => 
            job.id === latestJob.id 
              ? { ...job, status: 'failed' }
              : job
          )
        }
        return prev
      })
    } finally {
      setIsExporting(false)
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Calendar className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <div className="h-4 w-4 bg-red-500 rounded-full" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'processing':
        return <Badge variant="default">Processing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Data Export</h2>
        <p className="text-gray-600">Export data from your saved company lists in various formats</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Export Configuration
                </CardTitle>
                <CardDescription>Configure your data export settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select value={exportOptions.format} onValueChange={(value: any) => 
                    setExportOptions(prev => ({ ...prev, format: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">
                        <div className="flex items-center">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel (.xlsx)
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          CSV (.csv)
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center">
                          <FileImage className="h-4 w-4 mr-2" />
                          PDF Report (.pdf)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Saved List Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Saved List</label>
                  {savedLists.length === 0 ? (
                    <div className="flex items-center p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No saved lists found</p>
                        <p className="text-xs text-yellow-600">Create and save company lists in the search or analytics sections first.</p>
                      </div>
                    </div>
                  ) : (
                    <Select value={exportOptions.selectedListId} onValueChange={(value: string) => 
                      setExportOptions(prev => ({ ...prev, selectedListId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a saved list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            <div className="flex items-center">
                              <List className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium">{list.name}</div>
                                <div className="text-xs text-gray-500">
                                  {list.companies.length} companies • {new Date(list.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Data Options */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Include Data</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeKPIs}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeKPIs: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">KPIs & Calculated Metrics</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeFinancials}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeFinancials: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Financial Data</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeContactInfo}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeContactInfo: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Contact Information</span>
                    </label>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Export Preview & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Export Preview
                </CardTitle>
                <CardDescription>Review your export settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportOptions.selectedListId ? (
                  <>
                    {(() => {
                      const selectedList = savedLists.find(list => list.id === exportOptions.selectedListId)
                      return selectedList ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Selected list:</span>
                            <span className="font-medium">{selectedList.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Records to export:</span>
                            <span className="font-medium">{recordCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Format:</span>
                            <span className="font-medium capitalize">{exportOptions.format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Estimated size:</span>
                            <span className="font-medium">
                              {formatFileSize(recordCount * (exportOptions.includeKPIs ? 2 : 1) * 100)}
                            </span>
                          </div>
                          {selectedList.description && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500">{selectedList.description}</p>
                            </div>
                          )}
                        </div>
                      ) : null
                    })()}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <List className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Select a saved list to see export preview</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting || recordCount === 0 || !exportOptions.selectedListId}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {exportOptions.selectedListId ? 'Start Export' : 'Select a List First'}
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Large exports may take several minutes to process. You'll be notified when ready.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Jobs</CardTitle>
              <CardDescription>Track your export requests and download completed files</CardDescription>
            </CardHeader>
            <CardContent>
              {exportJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No export jobs yet</p>
                  <p className="text-sm">Start an export to see your jobs here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exportJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="font-medium">
                            {job.listName} export ({job.format.toUpperCase()})
                          </div>
                          <div className="text-sm text-gray-600">
                            {job.recordCount.toLocaleString()} records • {new Date(job.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(job.status)}
                        {job.status === 'completed' && job.downloadUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Exports</CardTitle>
              <CardDescription>Set up automated exports on a schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Scheduled exports coming soon</p>
                <p className="text-sm">Set up automated exports to run daily, weekly, or monthly</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DataExport





