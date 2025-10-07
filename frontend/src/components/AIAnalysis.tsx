import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Brain, 
  Search, 
  TrendingUp, 
  Building2, 
  Lightbulb,
  Loader2,
  Sparkles,
  List
} from 'lucide-react'
import { AIAnalysisService, AIAnalysisRequest, AIAnalysisResult } from '../lib/aiAnalysisService'
import { supabaseDataService, SupabaseCompany } from '../lib/supabaseDataService'

interface SavedCompanyList {
  id: string
  name: string
  companies: SupabaseCompany[]
  createdAt: string
}

interface AIAnalysisProps {
  selectedDataView?: string
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ selectedDataView = "master_analytics" }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [savedLists, setSavedLists] = useState<SavedCompanyList[]>([])
  const [selectedList, setSelectedList] = useState<string>('')
  const [companies, setCompanies] = useState<SupabaseCompany[]>([])
  const [totalCompanies, setTotalCompanies] = useState<number>(0)
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false)

  const templates = AIAnalysisService.getAnalysisTemplates()

  // Load saved lists on mount
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

  // Load companies when list is selected or when "All companies" is chosen
  useEffect(() => {
    if (selectedList && selectedList !== "") {
      const list = savedLists.find(l => l.id === selectedList)
      if (list) {
        setCompanies(list.companies)
        setTotalCompanies(list.companies.length)
      }
    } else {
      // Don't load all companies upfront - load them on-demand
      setCompanies([])
      setTotalCompanies(8438) // We know the total from dashboard
    }
  }, [selectedList, savedLists])

  // Load companies on-demand for analysis
  const loadCompaniesForAnalysis = async (query: string, limit: number = 50) => {
    try {
      setLoadingCompanies(true)
      console.log('Loading companies for analysis...')
      
      // For now, load a sample of companies for analysis
      // In the future, we could parse the query to apply smart filters
      const result = await supabaseDataService.getCompanies(1, limit)
      console.log('Loaded companies for analysis:', result.companies?.length || 0)
      
      setCompanies(result.companies || [])
      return result.companies || []
    } catch (error) {
      console.error('Error loading companies for analysis:', error)
      setCompanies([])
      return []
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      let companiesToAnalyze: SupabaseCompany[] = []
      
      // If a saved list is selected, use those companies
      if (selectedList && selectedList !== "") {
        companiesToAnalyze = companies
      } else {
        // Load companies on-demand for analysis
        console.log('Loading companies on-demand for analysis...')
        companiesToAnalyze = await loadCompaniesForAnalysis(query.trim(), 50)
      }

      if (companiesToAnalyze.length === 0) {
        throw new Error('No companies available for analysis')
      }

      console.log('Analyzing with', companiesToAnalyze.length, 'companies')
      // Use the working backend API instead of the complex AIAnalysisService
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: companiesToAnalyze.slice(0, 5), // Limit to first 5 companies for analysis to avoid connection issues
          analysisType: 'comprehensive',
          query: query.trim()
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Transform the backend response to match the expected format
      const analysisResult: AIAnalysisResult = {
        companies: data.analysis?.companies || [],
        insights: [`Analysis completed for ${companies.length} companies based on: "${query.trim()}"`],
        summary: `Found ${data.analysis?.companies?.length || 0} companies matching your criteria`,
        recommendations: [
          'Review the analysis results below',
          'Consider the financial health scores',
          'Evaluate growth potential and market position'
        ]
      }

      setResults(analysisResult)
    } catch (error) {
      console.error('Analysis failed:', error)
      // Set error result
      setResults({
        companies: [],
        insights: [`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`],
        summary: 'Analysis could not be completed',
        recommendations: ['Please try again with a different query', 'Check your internet connection']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: any) => {
    setQuery(template.query)
    setSelectedTemplate(template.id)
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <CardTitle>AI-Powered Analysis</CardTitle>
          </div>
          <CardDescription>
            Ask questions about your data in natural language and get intelligent insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Saved Lists Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <List className="h-4 w-4 mr-2" />
                Choose data source:
              </label>
              <Select value={selectedList || "all"} onValueChange={(value) => setSelectedList(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All companies (or select a saved list)" />
                </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All companies ({selectedList === "" ? totalCompanies : companies.length})
            {selectedList === "" && " - Loaded on-demand"}
          </SelectItem>
          {savedLists.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              {list.name} ({list.companies.length} companies)
            </SelectItem>
          ))}
        </SelectContent>
              </Select>
            </div>

            {/* Query Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ask a question about your data:</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Find high-growth tech companies in Stockholm with revenue > 10M SEK"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading || loadingCompanies || !query.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : loadingCompanies ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading companies...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Or try a quick analysis:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="h-auto p-3 text-left justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs opacity-70">{template.description}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.totalFound}</p>
                    <p className="text-xs text-gray-600">Companies Found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {results.summary.averageRevenue && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {(results.summary.averageRevenue / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-600">Avg Revenue (SEK)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.summary.averageGrowth && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {(results.summary.averageGrowth * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">Avg Growth</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{results.insights.length}</p>
                    <p className="text-xs text-gray-600">AI Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Segments */}
          {results.summary?.topSegments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {results.summary.topSegments.map((segment, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {segment.segment} ({segment.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-900">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                AI analysis results for your query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.companies && results.companies.length > 0 ? (
                  results.companies.slice(0, 10).map((company, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{company.name || company.companyName}</h4>
                          <p className="text-sm text-gray-600">
                          {company.city || company.address} • {company.segment || company.Bransch || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        {company.revenue && (
                          <p className="text-sm font-medium">
                            {(parseFloat(company.revenue) / 1000000).toFixed(1)}M SEK
                          </p>
                        )}
                        {company.revenue_growth && (
                          <p className="text-xs text-green-600">
                            +{(parseFloat(company.revenue_growth) * 100).toFixed(1)}% growth
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>No companies found matching your criteria.</p>
                    <p className="text-sm mt-1">Try broadening your search parameters or select a different data source.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AIAnalysis
