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
      data
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
      `/api/fitting-appointments/available-slots/${supplier}/${date}`
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
    .get(url)
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
      data
    )
    .then((res) => res.data)

/**
 * Get customer's appointments.
 *
 * @returns {Promise<bookcarsTypes.FittingAppointment[]>}
 */
export const getCustomerAppointments = (): Promise<bookcarsTypes.FittingAppointment[]> =>
  axiosInstance
    .get('/api/fitting-appointments/customer')
    .then((res) => res.data)
