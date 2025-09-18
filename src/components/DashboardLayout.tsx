import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  PieChart, 
  Download, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'raw-data', label: 'Raw Data', icon: Database },
    { id: 'kpis', label: 'KPIs', icon: TrendingUp },
    { id: 'segmentation', label: 'Segmentation', icon: PieChart },
    { id: 'export', label: 'Export', icon: Download },
  ]

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Nivo Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:inset-0
        `}>
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      onPageChange(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout
