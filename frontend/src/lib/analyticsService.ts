import type { CompanyFilter, SupabaseCompany } from './supabaseDataService'
import { supabaseDataService } from './supabaseDataService'
import { businessRulesEngine } from './businessRules'

export interface CompanySummary {
  totalCompanies: number
  averageRevenue: number | null
  averageProfit: number | null
  averageRevenueGrowth: number | null
  categories: {
    profitability: Record<string, number>
    growth: Record<string, number>
    companySize: Record<string, number>
  }
}

const calculateAverage = (values: Array<number | null | undefined>): number | null => {
  const numericValues = values.filter((value): value is number => typeof value === 'number')
  if (numericValues.length === 0) {
    return null
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
}

const buildCategoryCounts = (companies: SupabaseCompany[]) => {
  const profitability: Record<string, number> = {}
  const growth: Record<string, number> = {}
  const companySize: Record<string, number> = {}

  companies.forEach(company => {
    const evaluation = businessRulesEngine.evaluateCompany(company)

    profitability[evaluation.profitability] = (profitability[evaluation.profitability] || 0) + 1
    growth[evaluation.growth] = (growth[evaluation.growth] || 0) + 1
    companySize[evaluation.companySize] = (companySize[evaluation.companySize] || 0) + 1
  })

  return { profitability, growth, companySize }
}

export const AnalyticsService = {
  async getCompanies(page: number, pageSize: number, filters: CompanyFilter = {}) {
    return supabaseDataService.getCompanies(page, pageSize, filters)
  },

  async getSummary(filters: CompanyFilter = {}): Promise<CompanySummary> {
    const { companies, total } = await supabaseDataService.getCompanies(1, 500, filters)

    const averageRevenue = calculateAverage(companies.map(company => company.revenue ?? company.SDI ?? null))
    const averageProfit = calculateAverage(companies.map(company => company.profit ?? null))
    const averageRevenueGrowth = calculateAverage(companies.map(company => company.Revenue_growth ?? null))

    const categories = buildCategoryCounts(companies)

    return {
      totalCompanies: total,
      averageRevenue,
      averageProfit,
      averageRevenueGrowth,
      categories
    }
  }
}

export type { CompanyFilter }
