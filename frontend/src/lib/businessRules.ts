import type { SupabaseCompany } from './supabaseDataService'

export interface ProfitabilityRule {
  min: number
}

export interface GrowthRule {
  min: number
}

export interface CompanySizeRule {
  maxRevenue?: number
  minRevenue?: number
  maxEmployees?: number
  minEmployees?: number
}

export interface EmployeeSizeRule {
  max?: number
  min?: number
}

export interface BusinessRules {
  profitability: {
    high: ProfitabilityRule
    good: ProfitabilityRule
    low: ProfitabilityRule
  }
  growth: {
    high: GrowthRule
    medium: GrowthRule
    low: GrowthRule
    declining: GrowthRule
  }
  companySize: {
    micro: CompanySizeRule
    small: CompanySizeRule
    medium: CompanySizeRule
    large: CompanySizeRule
  }
  employeeSize: {
    micro: EmployeeSizeRule
    small: EmployeeSizeRule
    medium: EmployeeSizeRule
    large: EmployeeSizeRule
    enterprise: EmployeeSizeRule
  }
}

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  profitability: {
    high: { min: 0.15 },
    good: { min: 0.08 },
    low: { min: 0.02 }
  },
  growth: {
    high: { min: 0.2 },
    medium: { min: 0.08 },
    low: { min: 0.02 },
    declining: { min: -0.05 }
  },
  companySize: {
    micro: { maxRevenue: 5_000_000, maxEmployees: 10 },
    small: { maxRevenue: 25_000_000, maxEmployees: 50 },
    medium: { maxRevenue: 100_000_000, maxEmployees: 250 },
    large: { minRevenue: 100_000_001, minEmployees: 251 }
  },
  employeeSize: {
    micro: { max: 10 },
    small: { max: 50 },
    medium: { max: 250 },
    large: { max: 1000 },
    enterprise: { min: 1001 }
  }
}

const STORAGE_KEY = 'nivo-business-rules'

const loadRules = (): BusinessRules => {
  if (typeof window === 'undefined') {
    return DEFAULT_BUSINESS_RULES
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_BUSINESS_RULES
    }
    const parsed = JSON.parse(stored)
    return { ...DEFAULT_BUSINESS_RULES, ...parsed }
  } catch (error) {
    console.warn('[businessRules] Failed to load stored rules, using defaults.', error)
    return DEFAULT_BUSINESS_RULES
  }
}

let currentRules: BusinessRules = loadRules()

const persistRules = (rules: BusinessRules) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (error) {
    console.warn('[businessRules] Failed to persist rules.', error)
  }
}

const getProfitabilityCategory = (margin: number | null | undefined, rules: BusinessRules) => {
  if (typeof margin !== 'number') {
    return 'Unknown'
  }

  if (margin >= rules.profitability.high.min) return 'High Profitability'
  if (margin >= rules.profitability.good.min) return 'Good Profitability'
  if (margin >= rules.profitability.low.min) return 'Low Profitability'
  return 'Loss Making'
}

const getGrowthCategory = (growth: number | null | undefined, rules: BusinessRules) => {
  if (typeof growth !== 'number') {
    return 'Unknown'
  }

  if (growth >= rules.growth.high.min) return 'High Growth'
  if (growth >= rules.growth.medium.min) return 'Medium Growth'
  if (growth >= rules.growth.low.min) return 'Low Growth'
  if (growth >= rules.growth.declining.min) return 'Declining'
  return 'Rapid Decline'
}

const getCompanySizeCategory = (company: SupabaseCompany, rules: BusinessRules) => {
  const revenue = company.revenue ?? company.SDI ?? 0
  const employees = company.employees ?? 0

  if (
    typeof rules.companySize.micro.maxRevenue === 'number' &&
    typeof rules.companySize.micro.maxEmployees === 'number' &&
    revenue <= rules.companySize.micro.maxRevenue &&
    employees <= rules.companySize.micro.maxEmployees
  ) {
    return 'Micro'
  }

  if (
    typeof rules.companySize.small.maxRevenue === 'number' &&
    typeof rules.companySize.small.maxEmployees === 'number' &&
    revenue <= rules.companySize.small.maxRevenue &&
    employees <= rules.companySize.small.maxEmployees
  ) {
    return 'Small'
  }

  if (
    typeof rules.companySize.medium.maxRevenue === 'number' &&
    typeof rules.companySize.medium.maxEmployees === 'number' &&
    revenue <= rules.companySize.medium.maxRevenue &&
    employees <= rules.companySize.medium.maxEmployees
  ) {
    return 'Medium'
  }

  return 'Large'
}

const getEmployeeSizeCategory = (employees: number | null | undefined, rules: BusinessRules) => {
  if (typeof employees !== 'number') {
    return 'Unknown'
  }

  if (employees <= (rules.employeeSize.micro.max ?? Number.NEGATIVE_INFINITY)) return 'Micro'
  if (employees <= (rules.employeeSize.small.max ?? Number.NEGATIVE_INFINITY)) return 'Small'
  if (employees <= (rules.employeeSize.medium.max ?? Number.NEGATIVE_INFINITY)) return 'Medium'
  if (employees <= (rules.employeeSize.large.max ?? Number.POSITIVE_INFINITY)) return 'Large'
  return 'Enterprise'
}

export const businessRulesEngine = {
  getRules(): BusinessRules {
    return currentRules
  },

  updateRules(newRules: BusinessRules) {
    currentRules = { ...currentRules, ...newRules }
    persistRules(currentRules)
  },

  resetRules() {
    currentRules = DEFAULT_BUSINESS_RULES
    persistRules(currentRules)
  },

  evaluateCompany(company: SupabaseCompany) {
    const profitability = getProfitabilityCategory(company.EBIT_margin ?? null, currentRules)
    const growth = getGrowthCategory(company.Revenue_growth ?? null, currentRules)
    const companySize = getCompanySizeCategory(company, currentRules)
    const employeeSize = getEmployeeSizeCategory(company.employees ?? null, currentRules)

    return {
      profitability,
      growth,
      companySize,
      employeeSize
    }
  }
}
