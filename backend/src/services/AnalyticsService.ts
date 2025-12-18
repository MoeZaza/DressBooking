import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get dashboard analytics data
 */
export const getDashboardAnalytics = async (): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.get('/api/analytics/dashboard', { headers })
  return response.data
}

/**
 * Get monthly analytics data
 */
export const getMonthlyAnalytics = async (year?: number, months?: number): Promise<any> => {
  const headers = await UserService.authHeader()
  const params = new URLSearchParams()
  
  if (year) {
    params.append('year', year.toString())
  }
  if (months) {
    params.append('months', months.toString())
  }
  
  const response = await axiosInstance.get(`/api/analytics/monthly?${params.toString()}`, { headers })
  return response.data
}

/**
 * Get dress performance analytics
 */
export const getDressAnalytics = async (): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.get('/api/analytics/dress-performance', { headers })
  return response.data
}

/**
 * Get financial summary
 */
export const getFinancialSummary = async (startDate?: string, endDate?: string): Promise<any> => {
  const headers = await UserService.authHeader()
  const params = new URLSearchParams()
  
  if (startDate) {
    params.append('startDate', startDate)
  }
  if (endDate) {
    params.append('endDate', endDate)
  }
  
  const response = await axiosInstance.get(`/api/accounting/financial-summary?${params.toString()}`, { headers })
  return response.data
}

/**
 * Get monthly financial report
 */
export const getMonthlyReport = async (year?: number): Promise<any> => {
  const headers = await UserService.authHeader()
  const params = new URLSearchParams()
  
  if (year) {
    params.append('year', year.toString())
  }
  
  const response = await axiosInstance.get(`/api/accounting/monthly-report?${params.toString()}`, { headers })
  return response.data
}

/**
 * Create expense
 */
export const createExpense = async (expense: {
  category: string
  description: string
  amount: number
  currency?: string
  date?: string
  dress?: string
  receiptUrl?: string
  notes?: string
  isRecurring?: boolean
  recurringFrequency?: string
  tags?: string[]
}): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.post('/api/accounting/create-expense', expense, { headers })
  return response.data
}

/**
 * Get expenses
 */
export const getExpenses = async (params?: string | {
  page?: number
  size?: number
  category?: string
  startDate?: string
  endDate?: string
  dress?: string
}): Promise<any> => {
  const headers = await UserService.authHeader()

  // Handle both string params and object params
  let queryString = ''
  if (typeof params === 'string') {
    queryString = params
  } else if (params) {
    const queryParams = new URLSearchParams()
    if (params.page) {
      queryParams.append('page', params.page.toString())
    }
    if (params.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params.category) {
      queryParams.append('category', params.category)
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate)
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate)
    }
    if (params.dress) {
      queryParams.append('dress', params.dress)
    }
    queryString = queryParams.toString()
  }

  const url = queryString ? `/api/accounting/expenses?${queryString}` : '/api/accounting/expenses'
  const response = await axiosInstance.get(url, { headers })
  return response.data
}

/**
 * Get single expense by ID
 */
export const getExpenseById = async (id: string): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.get(`/api/accounting/expenses/${id}`, { headers })
  return response.data
}

/**
 * Update expense
 */
export const updateExpense = async (id: string, data: any): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.put(`/api/accounting/expenses/${id}`, data, { headers })
  return response.data
}

/**
 * Delete expense
 */
export const deleteExpense = async (id: string): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.delete(`/api/accounting/expenses/${id}`, { headers })
  return response.data
}

/**
 * Get revenues
 */
export const getRevenues = async (params?: {
  page?: number
  size?: number
  type?: string
  startDate?: string
  endDate?: string
  dress?: string
}): Promise<any> => {
  const headers = await UserService.authHeader()
  const queryParams = new URLSearchParams()
  
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.size) {
    queryParams.append('size', params.size.toString())
  }
  if (params?.type) {
    queryParams.append('type', params.type)
  }
  if (params?.startDate) {
    queryParams.append('startDate', params.startDate)
  }
  if (params?.endDate) {
    queryParams.append('endDate', params.endDate)
  }
  if (params?.dress) {
    queryParams.append('dress', params.dress)
  }
  
  const response = await axiosInstance.get(`/api/accounting/revenues?${queryParams.toString()}`, { headers })
  return response.data
}

/**
 * Get inventory analytics
 */
export const getInventoryAnalytics = async (startDate?: string, endDate?: string): Promise<any> => {
  const headers = await UserService.authHeader()
  const params = new URLSearchParams()

  if (startDate) {
    params.append('startDate', startDate)
  }
  if (endDate) {
    params.append('endDate', endDate)
  }

  const response = await axiosInstance.get(`/api/accounting/inventory-analytics?${params.toString()}`, { headers })
  return response.data
}

/**
 * Update inventory item
 */
export const updateInventoryItem = async (dressId: string, inventoryData: any): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.put(`/api/accounting/inventory/${dressId}`, inventoryData, { headers })
  return response.data
}

/**
 * Add maintenance record
 */
export const addMaintenanceRecord = async (dressId: string, maintenanceData: any): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.post(`/api/accounting/inventory/${dressId}/maintenance`, maintenanceData, { headers })
  return response.data
}

/**
 * Get profit and loss statement
 */
export const getProfitLossStatement = async (startDate?: string, endDate?: string): Promise<any> => {
  const headers = await UserService.authHeader()
  const params = new URLSearchParams()

  if (startDate) {
    params.append('startDate', startDate)
  }
  if (endDate) {
    params.append('endDate', endDate)
  }

  const response = await axiosInstance.get(`/api/accounting/profit-loss?${params.toString()}`, { headers })
  return response.data
}
