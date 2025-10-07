import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase, supabaseConfig } from './supabase'
import {
  filterLocalCompanies,
  getLocalCompanyByOrgNr as getLocalCompanyByOrgNrFallback
} from './sampleData'

export interface HistoricalDataPoint {
  year: number
  SDI?: number | null
  Revenue_growth?: number | null
  EBIT_margin?: number | null
  NetProfit_margin?: number | null
}

export interface SupabaseCompany {
  id?: number
  OrgNr?: string
  name: string
  address?: string | null
  city?: string | null
  incorporation_date?: string | null
  homepage?: string | null
  segment?: string | null
  segment_name?: string | null
  industry_name?: string | null
  revenue?: number | null
  profit?: number | null
  employees?: number | null
  SDI?: number | null
  DR?: number | null
  ORS?: number | null
  Revenue_growth?: number | null
  EBIT_margin?: number | null
  NetProfit_margin?: number | null
  analysis_year?: number | null
  year?: number | null
  digital_maturity?: string | null
  company_size_category?: string | null
  employee_size_category?: string | null
  profitability_category?: string | null
  growth_category?: string | null
  fit_score_reason?: string | null
  historicalData?: HistoricalDataPoint[]
}

export interface CompanyFilter {
  name?: string
  industries?: string[]
  city?: string
  minRevenue?: number
  maxRevenue?: number
  minProfit?: number
  maxProfit?: number
  minRevenueGrowth?: number
  maxRevenueGrowth?: number
  minEmployees?: number
  maxEmployees?: number
}

export interface CompanySearchResult {
  companies: SupabaseCompany[]
  total: number
  error?: PostgrestError | null
}

export interface DashboardAnalytics {
  totalCompanies: number
  totalWithFinancials: number
  totalWithKPIs: number
  totalWithDigitalPresence: number
  averageRevenueGrowth: number | null
  averageEBITMargin: number | null
  topIndustries: { industry: string; count: number }[]
  topCities: { city: string; count: number }[]
  lastUpdated: string | null
}

// Query only columns that exist in the actual Supabase table
const COMPANY_FIELDS = `
  "OrgNr",
  name,
  address,
  city,
  incorporation_date,
  email,
  homepage,
  segment,
  segment_name,
  revenue,
  profit,
  employees,
  "SDI",
  "DR",
  "ORS",
  "Revenue_growth",
  "EBIT_margin",
  "NetProfit_margin",
  analysis_year
`

const DEFAULT_PAGE_SIZE = 20
const ANALYTICS_SAMPLE_SIZE = 2500

type CompanyQuery = PostgrestFilterBuilder<any, any, any[], unknown>

const applyFilters = (query: CompanyQuery, filters: CompanyFilter): CompanyQuery => {
  let nextQuery = query

  if (filters.name) {
    nextQuery = nextQuery.ilike('name', `%${filters.name}%`)
  }

  if (filters.industries && filters.industries.length > 0) {
    nextQuery = nextQuery.in('segment', filters.industries)
  }

  if (filters.city) {
    nextQuery = nextQuery.ilike('city', `%${filters.city}%`)
  }

  if (typeof filters.minRevenue === 'number') {
    nextQuery = nextQuery.gte('revenue', filters.minRevenue)
  }

  if (typeof filters.maxRevenue === 'number') {
    nextQuery = nextQuery.lte('revenue', filters.maxRevenue)
  }

  if (typeof filters.minProfit === 'number') {
    nextQuery = nextQuery.gte('profit', filters.minProfit)
  }

  if (typeof filters.maxProfit === 'number') {
    nextQuery = nextQuery.lte('profit', filters.maxProfit)
  }

  if (typeof filters.minRevenueGrowth === 'number') {
    nextQuery = nextQuery.gte('Revenue_growth', filters.minRevenueGrowth / 100)
  }

  if (typeof filters.maxRevenueGrowth === 'number') {
    nextQuery = nextQuery.lte('Revenue_growth', filters.maxRevenueGrowth / 100)
  }

  if (typeof filters.minEmployees === 'number') {
    nextQuery = nextQuery.gte('employees', filters.minEmployees)
  }

  if (typeof filters.maxEmployees === 'number') {
    nextQuery = nextQuery.lte('employees', filters.maxEmployees)
  }

  return nextQuery
}

const mapCompanyRecord = (record: any): SupabaseCompany => ({
  OrgNr: record.OrgNr ?? record.orgnr ?? undefined,
  name: record.name,
  address: record.address ?? null,
  city: record.city ?? null,
  incorporation_date: record.incorporation_date ?? null,
  homepage: record.homepage ?? null,
  segment: record.segment ?? null,
  segment_name: record.segment_name ?? null,
  industry_name: record.segment_name ?? null,
  revenue: typeof record.revenue === 'number' ? record.revenue : record.SDI ?? null,
  profit: typeof record.profit === 'number' ? record.profit : null,
  employees: record.employees ?? null,
  SDI: typeof record.SDI === 'number' ? record.SDI : null,
  DR: typeof record.DR === 'number' ? record.DR : null,
  ORS: typeof record.ORS === 'number' ? record.ORS : null,
  Revenue_growth: typeof record.Revenue_growth === 'number' ? record.Revenue_growth : null,
  EBIT_margin: typeof record.EBIT_margin === 'number' ? record.EBIT_margin : null,
  NetProfit_margin: typeof record.NetProfit_margin === 'number' ? record.NetProfit_margin : null,
  analysis_year: record.analysis_year ?? null,
  year: record.analysis_year ?? null,
  digital_maturity: null,
  company_size_category: null,
  employee_size_category: null,
  profitability_category: null,
  growth_category: null,
  fit_score_reason: null,
  historicalData: Array.isArray(record.historicalData) ? record.historicalData : []
})

const buildDashboardAggregations = (companies: SupabaseCompany[]) => {
  const totalWithFinancials = companies.filter(company => typeof company.SDI === 'number').length
  const totalWithKPIs = companies.filter(
    company => typeof company.EBIT_margin === 'number' || typeof company.Revenue_growth === 'number'
  ).length
  const totalWithDigitalPresence = companies.filter(company => !!company.homepage).length

  const growthValues = companies
    .map(company => company.Revenue_growth)
    .filter((value): value is number => typeof value === 'number')
  const ebitValues = companies
    .map(company => company.EBIT_margin)
    .filter((value): value is number => typeof value === 'number')

  const averageRevenueGrowth = growthValues.length
    ? growthValues.reduce((sum, value) => sum + value, 0) / growthValues.length
    : null
  const averageEBITMargin = ebitValues.length
    ? ebitValues.reduce((sum, value) => sum + value, 0) / ebitValues.length
    : null

  const industryCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()

  companies.forEach(company => {
    const industry = company.segment_name || company.segment || 'Unknown'
    industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1)

    if (company.city) {
      cityCounts.set(company.city, (cityCounts.get(company.city) || 0) + 1)
    }
  })

  const topIndustries = Array.from(industryCounts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topCities = Array.from(cityCounts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalWithFinancials,
    totalWithKPIs,
    totalWithDigitalPresence,
    averageRevenueGrowth,
    averageEBITMargin,
    topIndustries,
    topCities
  }
}

const handleError = (error: PostgrestError | null) => {
  if (error) {
    console.error('[supabaseDataService] Supabase error:', error)
  }
  return error
}

export const supabaseDataService = {
  async getCompanies(
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    filters: CompanyFilter = {}
  ): Promise<CompanySearchResult> {
    if (!supabaseConfig.isConfigured) {
      const filtered = filterLocalCompanies(filters)
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginated = filtered.slice(from, to)

      return {
        companies: paginated,
        total: filtered.length,
        error: null
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query: CompanyQuery = supabase
      .from('master_analytics')
      .select(COMPANY_FIELDS, { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to)

    query = applyFilters(query, filters)

    const { data, error, count } = await query

    if (error) {
      handleError(error)
      return {
        companies: [],
        total: 0,
        error
      }
    }

    const companies = (data ?? []).map(mapCompanyRecord)

    return {
      companies,
      total: typeof count === 'number' ? count : companies.length,
      error: null
    }
  },

  async getDashboardAnalytics(filters: CompanyFilter = {}): Promise<DashboardAnalytics> {
    if (!supabaseConfig.isConfigured) {
      const filtered = filterLocalCompanies(filters)
      const aggregations = buildDashboardAggregations(filtered)
      const lastUpdated = filtered
        .map(company => company.analysis_year)
        .filter((year): year is number => typeof year === 'number')
        .sort((a, b) => b - a)[0]

      return {
        totalCompanies: filtered.length,
        lastUpdated: lastUpdated ? `${lastUpdated}-12-31` : null,
        ...aggregations
      }
    }

    let query: CompanyQuery = supabase
      .from('master_analytics')
      .select(COMPANY_FIELDS, { count: 'exact' })
      .limit(ANALYTICS_SAMPLE_SIZE)

    query = applyFilters(query, filters)

    const { data, error, count } = await query

    if (error) {
      handleError(error)
      return {
        totalCompanies: 0,
        totalWithFinancials: 0,
        totalWithKPIs: 0,
        totalWithDigitalPresence: 0,
        averageRevenueGrowth: null,
        averageEBITMargin: null,
        topIndustries: [],
        topCities: [],
        lastUpdated: null
      }
    }

    const companies = (data ?? []).map(mapCompanyRecord)
    const aggregations = buildDashboardAggregations(companies)

    const lastUpdated = companies
      .map(company => company.analysis_year)
      .filter((year): year is number => typeof year === 'number')
      .sort((a, b) => b - a)[0]

    return {
      totalCompanies: typeof count === 'number' ? count : companies.length,
      lastUpdated: lastUpdated ? `${lastUpdated}-12-31` : null,
      ...aggregations
    }
  },

  async getCompanyByOrgNr(orgNr: string): Promise<SupabaseCompany | null> {
    if (!supabaseConfig.isConfigured) {
      return getLocalCompanyByOrgNrFallback(orgNr)
    }

    const { data, error } = await supabase
      .from('master_analytics')
      .select(COMPANY_FIELDS)
      .eq('OrgNr', orgNr)
      .single()

    if (error) {
      handleError(error)
      return null
    }

    return data ? mapCompanyRecord(data) : null
  }
}
