import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get business summary
 */
export const getBusinessSummary = async (): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.get('/api/business-intelligence/business-summary', { headers })
  return response.data
}

/**
 * Get customer insights
 */
export const getCustomerInsights = async (params?: {
  page?: number
  size?: number
  sortBy?: string
  sortOrder?: string
}): Promise<any> => {
  const headers = await UserService.authHeader()
  const queryParams = new URLSearchParams()
  
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.size) {
    queryParams.append('size', params.size.toString())
  }
  if (params?.sortBy) {
    queryParams.append('sortBy', params.sortBy)
  }
  if (params?.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder)
  }
  
  const response = await axiosInstance.get(`/api/business-intelligence/customer-insights?${queryParams.toString()}`, { headers })
  return response.data
}

/**
 * Get maintenance records
 */
export const getMaintenanceRecords = async (params?: {
  page?: number
  size?: number
  status?: string
  type?: string
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
  if (params?.status) {
    queryParams.append('status', params.status)
  }
  if (params?.type) {
    queryParams.append('type', params.type)
  }
  if (params?.dress) {
    queryParams.append('dress', params.dress)
  }
  
  const response = await axiosInstance.get(`/api/business-intelligence/maintenance-records?${queryParams.toString()}`, { headers })
  return response.data
}

/**
 * Create maintenance record
 */
export const createMaintenance = async (maintenance: {
  dress: string
  type: string
  description: string
  cost: number
  scheduledDate: string
  priority?: string
  serviceProvider?: string
  notes?: string
  isRecurring?: boolean
  recurringInterval?: number
}): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.post('/api/business-intelligence/create-maintenance', maintenance, { headers })
  return response.data
}

/**
 * Update maintenance status
 */
export const updateMaintenanceStatus = async (id: string, update: {
  status: string
  completedDate?: string
  afterImages?: string[]
  notes?: string
}): Promise<any> => {
  const headers = await UserService.authHeader()
  const response = await axiosInstance.put(`/api/business-intelligence/maintenance/${id}/status`, update, { headers })
  return response.data
}
