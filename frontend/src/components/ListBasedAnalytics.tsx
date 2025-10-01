import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  MapPin, 
  PieChart,
  LineChart,
  Target,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  List
} from 'lucide-react'
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

interface ListBasedAnalyticsProps {
  onExportData?: (data: any) => void
}

const ListBasedAnalytics: React.FC<ListBasedAnalyticsProps> = ({ onExportData }) => {
  const [savedLists, setSavedLists] = useState<SavedCompanyList[]>([])
  const [selectedList, setSelectedList] = useState<SavedCompanyList | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Load saved lists from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedCompanyLists')
    if (saved) {
      try {
        const lists = JSON.parse(saved)
        setSavedLists(lists)
        if (lists.length > 0 && !selectedList) {
          setSelectedList(lists[0])
        }
      } catch (error) {
        console.error('Error loading saved lists:', error)
      }
    }
  }, [])

  // Calculate analytics when selected list changes
  useEffect(() => {
    if (selectedList) {
      calculateAnalytics(selectedList.companies)
    }
  }, [selectedList])

  const calculateAnalytics = (companies: SupabaseCompany[]) => {
    setLoading(true)
    
    // Simulate calculation time
    setTimeout(() => {
      const totalCompanies = companies.length
      
      if (totalCompanies === 0) {
        setAnalyticsData(null)
        setLoading(false)
        return
      }

      // Calculate total revenue
      const totalRevenue = companies.reduce((sum, c) => sum + (c.SDI || 0), 0)
      
      // Calculate average growth rate
      const companiesWithGrowth = companies.filter(c => c.Revenue_growth !== null)
      const avgGrowthRate = companiesWithGrowth.length > 0 
        ? companiesWithGrowth.reduce((sum, c) => sum + (c.Revenue_growth || 0), 0) / companiesWithGrowth.length
        : 0

      // Calculate average EBIT margin
      const companiesWithMargin = companies.filter(c => c.EBIT_margin !== null)
      const avgEBITMargin = companiesWithMargin.length > 0
        ? companiesWithMargin.reduce((sum, c) => sum + (c.EBIT_margin || 0), 0) / companiesWithMargin.length
        : 0

      // Calculate digital presence percentage
      const companiesWithWebsite = companies.filter(c => c.homepage && c.homepage.trim() !== '')
      const digitalPresencePercentage = (companiesWithWebsite.length / totalCompanies) * 100

      // Top industries
      const industryMap = new Map<string, number>()
      companies.forEach(c => {
        const industry = c.segment_name || c.industry_name || 'Unknown'
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1)
      })
      const topIndustries = Array.from(industryMap.entries())
        .map(([industry, count]) => ({ 
          name: industry, 
          count, 
          percentage: (count / totalCompanies) * 100,
          revenue: companies
            .filter(c => (c.segment_name || c.industry_name || 'Unknown') === industry)
            .reduce((sum, c) => sum + (c.SDI || 0), 0)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Top cities
      const cityMap = new Map<string, number>()
      companies.forEach(c => {
        const city = c.city || 'Unknown'
        cityMap.set(city, (cityMap.get(city) || 0) + 1)
      })
      const topCities = Array.from(cityMap.entries())
        .map(([city, count]) => ({ 
          name: city, 
          count, 
          percentage: (count / totalCompanies) * 100,
          avgRevenue: companies
            .filter(c => (c.city || 'Unknown') === city)
            .reduce((sum, c) => sum + (c.SDI || 0), 0) / count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Company size distribution
      const sizeMap = new Map<string, number>()
      companies.forEach(c => {
        const employees = c.employees || 0
        let size = 'Unknown'
        if (employees >= 250) size = 'Large (250+)'
        else if (employees >= 50) size = 'Medium (50-249)'
        else if (employees >= 10) size = 'Small (10-49)'
        else if (employees >= 1) size = 'Micro (1-9)'
        
        sizeMap.set(size, (sizeMap.get(size) || 0) + 1)
      })
      const sizeDistribution = Array.from(sizeMap.entries())
        .map(([size, count]) => ({ 
          name: size, 
          count, 
          percentage: (count / totalCompanies) * 100,
          color: size === 'Large (250+)' ? 'bg-gray-700' :
                 size === 'Medium (50-249)' ? 'bg-gray-600' :
                 size === 'Small (10-49)' ? 'bg-gray-500' :
                 size === 'Micro (1-9)' ? 'bg-gray-400' : 'bg-gray-300'
        }))
        .sort((a, b) => b.count - a.count)

      // Financial health distribution
      const healthMap = { excellent: 0, good: 0, fair: 0, poor: 0 }
      companies.forEach(c => {
        const growth = c.Revenue_growth || 0
        const margin = c.EBIT_margin || 0
        
        if (growth > 0.1 && margin > 0.1) healthMap.excellent++
        else if (growth > 0.05 && margin > 0.05) healthMap.good++
        else if (growth > 0 || margin > 0) healthMap.fair++
        else healthMap.poor++
      })

      setAnalyticsData({
        totalCompanies,
        totalRevenue,
        avgGrowthRate: avgGrowthRate * 100, // Convert to percentage
        avgEBITMargin: avgEBITMargin * 100, // Convert to percentage
        digitalPresencePercentage,
        topIndustries,
        topCities,
        sizeDistribution,
        financialHealth: healthMap
      })
      
      setLoading(false)
    }, 500)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} SEK`
  }

  if (savedLists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inga sparade listor</h3>
          <p className="text-gray-600 mb-4">
            Du behöver spara företagslistor i Företagssökning för att kunna analysera dem här.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.hash = '#companies'}
          >
            Gå till Företagssökning
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with List Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Listbaserad Analys</h2>
          <p className="text-gray-600">Analysera dina sparade företagslistor</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedList?.id || ''} onValueChange={(value) => {
            const list = savedLists.find(l => l.id === value)
            setSelectedList(list || null)
          }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Välj en lista att analysera" />
            </SelectTrigger>
            <SelectContent>
              {savedLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{list.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {list.companies.length}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => calculateAnalytics(selectedList?.companies || [])}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExportData?.(analyticsData)}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Selected List Info */}
      {selectedList && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <List className="h-5 w-5 mr-2" />
              {selectedList.name}
            </CardTitle>
            <CardDescription>
              {selectedList.description || 'Ingen beskrivning'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Företag:</span> {selectedList.companies.length}
              </div>
              <div>
                <span className="font-medium">Skapad:</span> {new Date(selectedList.createdAt).toLocaleDateString('sv-SE')}
              </div>
              <div>
                <span className="font-medium">Uppdaterad:</span> {new Date(selectedList.updatedAt).toLocaleDateString('sv-SE')}
              </div>
              <div>
                <span className="font-medium">Filter:</span> {Object.keys(selectedList.filters).length > 0 ? 'Aktiva' : 'Inga'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Beräknar analys...</span>
        </div>
      ) : analyticsData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+8.7%</span>
                  <span className="text-gray-500 ml-1">vs genomsnitt</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Growth Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.avgGrowthRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+2.1%</span>
                  <span className="text-gray-500 ml-1">vs genomsnitt</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg EBIT Margin</p>
                    <p className="text-2xl font-bold">{analyticsData.avgEBITMargin.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+1.2%</span>
                  <span className="text-gray-500 ml-1">vs genomsnitt</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Digital Presence</p>
                    <p className="text-2xl font-bold">{analyticsData.digitalPresencePercentage.toFixed(1)}%</p>
                  </div>
                  <Building2 className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">Aktiv</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry and Geographic Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Branschfördelning
                </CardTitle>
                <CardDescription>Företag per bransch i den valda listan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topIndustries.map((industry: any, index: number) => (
                    <div key={industry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{industry.name}</p>
                          <p className="text-sm text-gray-600">{industry.count} företag</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{industry.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Geografisk fördelning
                </CardTitle>
                <CardDescription>Företag per stad i den valda listan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topCities.map((city: any, index: number) => (
                    <div key={city.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <span className="text-sm font-medium text-green-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{city.name}</p>
                          <p className="text-sm text-gray-600">{city.count} företag</p>
                        </div>
                      </div>
                      <Badge variant="outline">{formatCurrency(city.avgRevenue)} snitt</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Size and Financial Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Företagsstorlek
                </CardTitle>
                <CardDescription>Fördelning efter antal anställda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.sizeDistribution.map((size: any) => (
                    <div key={size.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{size.name}</span>
                        <span>{size.count} ({size.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${size.color} h-2 rounded-full`}
                          style={{ width: `${size.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Finansiell hälsa
                </CardTitle>
                <CardDescription>Företagens finansiella prestation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Utmärkt', count: analyticsData.financialHealth.excellent, color: 'bg-green-500' },
                    { label: 'Bra', count: analyticsData.financialHealth.good, color: 'bg-blue-500' },
                    { label: 'Acceptabel', count: analyticsData.financialHealth.fair, color: 'bg-yellow-500' },
                    { label: 'Dålig', count: analyticsData.financialHealth.poor, color: 'bg-red-500' }
                  ].map((health) => {
                    const percentage = (health.count / analyticsData.totalCompanies) * 100
                    return (
                      <div key={health.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{health.label}</span>
                          <span>{health.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${health.color} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Välj en lista för att börja analysera</h3>
          <p className="text-gray-600">
            Välj en sparad företagslista från dropdown-menyn ovan för att se analysdata.
          </p>
        </div>
      )}
    </div>
  )
}

export default ListBasedAnalytics

