import type { CompanyFilter, SupabaseCompany } from './supabaseDataService'
import { supabaseDataService } from './supabaseDataService'

export interface AIAnalysisRequest {
  query: string
  dataView?: string
  filters?: CompanyFilter
}

export interface AIAnalysisResult {
  summary: {
    totalFound: number
    averageRevenue: number | null
    averageGrowth: number | null
    averageMargin: number | null
    topIndustries: { industry: string; count: number }[]
    topCities: { city: string; count: number }[]
  }
  insights: string[]
  recommendations: string[]
  companies: SupabaseCompany[]
  metadata: {
    generatedAt: string
    query: string
    filtersApplied: CompanyFilter
  }
}

interface AnalysisTemplate {
  id: string
  name: string
  description: string
  query: string
}

const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'high-growth-tech',
    name: 'High growth tech companies',
    description: 'Identify tech companies with strong revenue growth and profitability',
    query: 'High growth tech companies with strong profitability'
  },
  {
    id: 'regional-champions',
    name: 'Regional champions',
    description: 'Find companies dominating their local market with solid fundamentals',
    query: 'Regional champions with solid fundamentals'
  },
  {
    id: 'turnaround-candidates',
    name: 'Turnaround candidates',
    description: 'Companies with declining performance but strong potential',
    query: 'Declining companies with turnaround potential'
  },
  {
    id: 'steady-compounders',
    name: 'Steady compounders',
    description: 'Stable companies with consistent growth and profitability',
    query: 'Stable companies with consistent growth and profitability'
  }
]

const calculateAverage = (values: Array<number | null | undefined>) => {
  const numericValues = values.filter((value): value is number => typeof value === 'number')
  if (numericValues.length === 0) {
    return null
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
}

const buildInsights = (companies: SupabaseCompany[], summary: AIAnalysisResult['summary']) => {
  const insights: string[] = []

  if (summary.averageRevenue) {
    insights.push(`Average revenue of the selected companies is ${(summary.averageRevenue / 1_000_000).toFixed(1)}M SEK.`)
  }

  if (summary.averageGrowth) {
    insights.push(`Average revenue growth is ${(summary.averageGrowth * 100).toFixed(1)}%.`)
  }

  if (summary.averageMargin) {
    insights.push(`Average EBIT margin is ${(summary.averageMargin * 100).toFixed(1)}%.`)
  }

  if (summary.topIndustries.length > 0) {
    const topIndustry = summary.topIndustries[0]
    insights.push(`Most common industry: ${topIndustry.industry} (${topIndustry.count} companies).`)
  }

  if (summary.topCities.length > 0) {
    const topCity = summary.topCities[0]
    insights.push(`Most represented city: ${topCity.city} (${topCity.count} companies).`)
  }

  if (companies.some(company => (company.Revenue_growth ?? 0) > 0.25)) {
    insights.push('Several companies show exceptional growth momentum (>25%).')
  }

  if (companies.some(company => (company.EBIT_margin ?? 0) > 0.15)) {
    insights.push('A subset of companies deliver outstanding profitability (>15% EBIT margin).')
  }

  return insights
}

const buildRecommendations = (summary: AIAnalysisResult['summary']) => {
  const recommendations: string[] = []

  if ((summary.averageGrowth ?? 0) > 0.15) {
    recommendations.push('Prioritize due diligence on growth sustainability and scalability risks.')
  }

  if ((summary.averageMargin ?? 0) < 0.05) {
    recommendations.push('Investigate cost structure improvements to enhance profitability.')
  }

  if (summary.topIndustries.length > 1) {
    recommendations.push('Segment follow-up analysis by industry cluster to tailor go-to-market positioning.')
  }

  if (summary.topCities.length > 1) {
    recommendations.push('Consider region-specific outreach strategies to leverage geographic clusters.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Proceed with deeper qualitative research on management, moat, and customer stickiness.')
  }

  return recommendations
}

const deriveFiltersFromQuery = (query: string): CompanyFilter => {
  const normalizedQuery = query.toLowerCase()
  const filters: CompanyFilter = {}

  if (normalizedQuery.includes('stockholm')) {
    filters.city = 'Stockholm'
  }

  if (normalizedQuery.includes('growth')) {
    filters.minRevenueGrowth = 5
  }

  if (normalizedQuery.includes('profit')) {
    filters.minProfit = 0
  }

  return filters
}

export const AIAnalysisService = {
  getAnalysisTemplates(): AnalysisTemplate[] {
    return ANALYSIS_TEMPLATES
  },

  async analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const baseFilters = request.filters || {}
    const derivedFilters = { ...baseFilters, ...deriveFiltersFromQuery(request.query) }

    // Use the textual query as a fallback name search if no explicit name filter is set
    if (!derivedFilters.name && request.query.trim().length > 3) {
      derivedFilters.name = request.query.trim()
    }

    const { companies, total } = await supabaseDataService.getCompanies(1, 100, derivedFilters)

    const summary = {
      totalFound: total,
      averageRevenue: calculateAverage(companies.map(company => company.revenue ?? company.SDI ?? null)),
      averageGrowth: calculateAverage(companies.map(company => company.Revenue_growth ?? null)),
      averageMargin: calculateAverage(companies.map(company => company.EBIT_margin ?? null)),
      topIndustries: (() => {
        const counts = new Map<string, number>()
        companies.forEach(company => {
          const industry = company.segment_name || company.segment || 'Unknown'
          counts.set(industry, (counts.get(industry) || 0) + 1)
        })
        return Array.from(counts.entries())
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      })(),
      topCities: (() => {
        const counts = new Map<string, number>()
        companies.forEach(company => {
          if (company.city) {
            counts.set(company.city, (counts.get(company.city) || 0) + 1)
          }
        })
        return Array.from(counts.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      })()
    }

    const insights = buildInsights(companies, summary)
    const recommendations = buildRecommendations(summary)

    return {
      summary,
      insights,
      recommendations,
      companies: companies.slice(0, 10),
      metadata: {
        generatedAt: new Date().toISOString(),
        query: request.query,
        filtersApplied: derivedFilters
      }
    }
  }
}
