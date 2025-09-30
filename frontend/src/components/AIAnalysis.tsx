import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { 
  Brain, 
  Search, 
  TrendingUp, 
  Building2, 
  Lightbulb,
  Loader2,
  Sparkles
} from 'lucide-react'
import { AIAnalysisService, AIAnalysisRequest, AIAnalysisResult } from '../lib/aiAnalysisService'

interface AIAnalysisProps {
  selectedDataView: string
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ selectedDataView }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const templates = AIAnalysisService.getAnalysisTemplates()

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const request: AIAnalysisRequest = {
        query: query.trim(),
        dataView: selectedDataView
      }

      const analysisResult = await AIAnalysisService.analyzeWithAI(request)
      setResults(analysisResult)
    } catch (error) {
      console.error('Analysis failed:', error)
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
                  disabled={loading || !query.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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
          {results.summary.topSegments.length > 0 && (
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

          {/* Sample Results */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Results</CardTitle>
              <CardDescription>
                Showing first 10 companies from your analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.companies.slice(0, 10).map((company, index) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AIAnalysis
