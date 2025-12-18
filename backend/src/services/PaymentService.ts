import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Create a payment record.
 *
 * @param {bookcarsTypes.CreatePaymentBookingPayload} data
 * @returns {Promise<bookcarsTypes.Payment>}
 */
export const createPayment = (data: bookcarsTypes.CreatePaymentBookingPayload): Promise<bookcarsTypes.Payment> =>
  axiosInstance
    .post('/api/payments', data)
    .then((res) => res.data)

/**
 * Get payments for a booking.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Payment[]>}
 */
export const getBookingPayments = (bookingId: string): Promise<bookcarsTypes.Payment[]> =>
  axiosInstance
    .get(`/api/payments/booking/${bookingId}`)
    .then((res) => res.data)

/**
 * Get all payments for a supplier.
 *
 * @param {string} supplierId
 * @param {string} [status]
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<bookcarsTypes.Payment[]>}
 */
export const getSupplierPayments = (
  supplierId: string,
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<bookcarsTypes.Payment[]> => {
  let url = `/api/payments/supplier/${supplierId}`
  const params = new URLSearchParams()
  
  if (status) {
    params.append('status', status)
  }
  
  if (startDate) {
    params.append('startDate', startDate)
  }
  
  if (endDate) {
    params.append('endDate', endDate)
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  return axiosInstance
    .get(url)
    .then((res) => res.data)
}

/**
 * Update payment status.
 *
 * @param {string} id
 * @param {string} status
 * @param {string} [notes]
 * @returns {Promise<bookcarsTypes.Payment>}
 */
export const updatePaymentStatus = (id: string, status: string, notes?: string): Promise<bookcarsTypes.Payment> =>
  axiosInstance
    .put(`/api/payments/${id}/status`, { status, notes })
    .then((res) => res.data)

/**
 * Get payment analytics for a supplier.
 *
 * @param {string} supplierId
 * @param {number} [period] - Number of days to look back (default: 30)
 * @returns {Promise<any>}
 */
export const getPaymentAnalytics = (supplierId: string, period?: number): Promise<any> => {
  let url = `/api/payments/analytics/${supplierId}`
  
  if (period) {
    url += `?period=${period}`
  }
  
  return axiosInstance
    .get(url)
    .then((res) => res.data)
}

/**
 * Process a refund.
 *
 * @param {string} id
 * @param {number} refundAmount
 * @param {string} reason
 * @returns {Promise<bookcarsTypes.Payment>}
 */
export const processRefund = (id: string, refundAmount: number, reason: string): Promise<bookcarsTypes.Payment> =>
  axiosInstance
    .post(`/api/payments/${id}/refund`, { refundAmount, reason })
    .then((res) => res.data)
