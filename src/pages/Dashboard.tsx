import React, { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('overview')

  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Companies',
      value: '8,734',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Building2
    },
    {
      title: 'Financial Records',
      value: '35,409',
      change: '+8%',
      changeType: 'positive' as const,
      icon: BarChart3
    },
    {
      title: 'Active Segments',
      value: '24',
      change: '+3%',
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: 'AI Insights',
      value: '377',
      change: '+15%',
      changeType: 'positive' as const,
      icon: Users
    }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Nivo Analytics</h2>
        <p className="text-blue-100">
          Your comprehensive Swedish company intelligence platform is ready for analysis.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                    {stat.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Growth Trends</CardTitle>
            <CardDescription>
              Monthly analysis of company registrations and growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization will be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Segmentation</CardTitle>
            <CardDescription>
              Distribution of companies across different industries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>Segmentation chart will be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderRawData = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Raw Company Data</CardTitle>
          <CardDescription>
            Access and explore the complete dataset of Swedish companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Building2 className="h-6 w-6 mb-2" />
                Companies Table
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Financial Data
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                KPI Metrics
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Raw data exploration tools will be implemented here to allow deep-dive analysis
              of company information, financial records, and performance metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderKPIs = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>
            Comprehensive financial and operational metrics for Swedish companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Financial KPIs</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Revenue Growth Rate</li>
                  <li>• EBIT Margin</li>
                  <li>• Net Profit Margin</li>
                  <li>• Return on Equity</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Operational KPIs</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Employee Count</li>
                  <li>• Revenue per Employee</li>
                  <li>• Company Age</li>
                  <li>• Industry Classification</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Advanced KPI analysis and benchmarking tools will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSegmentation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Segmentation</CardTitle>
          <CardDescription>
            Analyze companies by industry, size, growth stage, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Building2 className="h-6 w-6 mb-2" />
                Industry Analysis
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                Growth Stage
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                Company Size
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Performance Tiers
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Advanced segmentation tools will help identify patterns and opportunities
              in the Swedish business landscape.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderExport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Export filtered data and analysis results in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                Excel Export
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                CSV Export
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Building2 className="h-6 w-6 mb-2" />
                PDF Report
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Export functionality will allow you to download filtered datasets,
              analysis results, and custom reports in your preferred format.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (currentPage) {
      case 'overview':
        return renderOverview()
      case 'raw-data':
        return renderRawData()
      case 'kpis':
        return renderKPIs()
      case 'segmentation':
        return renderSegmentation()
      case 'export':
        return renderExport()
      default:
        return renderOverview()
    }
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderContent()}
    </DashboardLayout>
  )
}

export default Dashboard
