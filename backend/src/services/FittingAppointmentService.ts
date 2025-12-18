import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Create a fitting appointment.
 *
 * @param {bookcarsTypes.CreateFittingAppointmentPayload} data
 * @returns {Promise<bookcarsTypes.FittingAppointment>}
 */
export const createAppointment = (data: bookcarsTypes.CreateFittingAppointmentPayload): Promise<bookcarsTypes.FittingAppointment> =>
  axiosInstance
    .post(
      '/api/fitting-appointments',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get available time slots for a supplier on a specific date.
 *
 * @param {string} supplier
 * @param {string} date
 * @returns {Promise<bookcarsTypes.AvailableTimeSlots>}
 */
export const getAvailableTimeSlots = (supplier: string, date: string): Promise<bookcarsTypes.AvailableTimeSlots> =>
  axiosInstance
    .get(
      `/api/fitting-appointments/available-slots/${supplier}/${date}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get appointments for a supplier (admin/owner view).
 *
 * @param {string} supplier
 * @param {string} [status]
 * @param {string} [date]
 * @returns {Promise<bookcarsTypes.FittingAppointment[]>}
 */
export const getSupplierAppointments = (supplier: string, status?: string, date?: string): Promise<bookcarsTypes.FittingAppointment[]> => {
  let url = `/api/fitting-appointments/supplier/${supplier}`
  const params = new URLSearchParams()
  
  if (status) {
    params.append('status', status)
  }
  
  if (date) {
    params.append('date', date)
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  return axiosInstance
    .get(url, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Update appointment status and notes.
 *
 * @param {string} id
 * @param {bookcarsTypes.UpdateFittingAppointmentPayload} data
 * @returns {Promise<bookcarsTypes.FittingAppointment>}
 */
export const updateAppointment = (id: string, data: bookcarsTypes.UpdateFittingAppointmentPayload): Promise<bookcarsTypes.FittingAppointment> =>
  axiosInstance
    .put(
      `/api/fitting-appointments/${id}`,
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get customer's appointments.
 *
 * @returns {Promise<bookcarsTypes.FittingAppointment[]>}
 */
export const getCustomerAppointments = (): Promise<bookcarsTypes.FittingAppointment[]> =>
  axiosInstance
    .get('/api/fitting-appointments/customer', { withCredentials: true })
    .then((res) => res.data)

/**
 * Delete appointment.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteAppointment = (id: string): Promise<void> =>
  axiosInstance
    .delete(`/api/fitting-appointments/${id}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get appointment analytics.
 *
 * @param {string} supplier
 * @returns {Promise<any>}
 */
export const getAppointmentAnalytics = (supplier: string): Promise<any> =>
  axiosInstance
    .get(`/api/fitting-appointments/analytics/${supplier}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Export appointments to CSV.
 *
 * @param {string} supplier
 * @param {any} filters
 * @returns {Promise<Blob>}
 */
export const exportAppointments = (supplier: string, filters?: any): Promise<Blob> => {
  const params = new URLSearchParams()
  if (filters?.startDate) {
    params.append('startDate', filters.startDate)
  }
  if (filters?.endDate) {
    params.append('endDate', filters.endDate)
  }
  if (filters?.status) {
    params.append('status', filters.status)
  }

  const url = params.toString()
    ? `/api/fitting-appointments/export/${supplier}?${params.toString()}`
    : `/api/fitting-appointments/export/${supplier}`

  return axiosInstance
    .get(url, { responseType: 'blob', withCredentials: true })
    .then((res) => res.data)
}
