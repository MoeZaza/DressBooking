import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Create a new booking with admin privileges
 *
 * @param {bookcarsTypes.Booking} bookingData
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const createAdminBooking = (bookingData: any): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .post('/api/admin-create-booking', bookingData, { withCredentials: true })
    .then((res) => res.data)

/**
 * Update booking with admin privileges
 *
 * @param {string} bookingId
 * @param {any} updateData
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const updateAdminBooking = (bookingId: string, updateData: any): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .put(`/api/admin-update-booking/${bookingId}`, updateData, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get booking analytics for admin dashboard
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getBookingAnalytics = (startDate?: string, endDate?: string, supplierId?: string): Promise<any> => {
  const params = new URLSearchParams()
  if (startDate) {
    params.append('startDate', startDate)
  }
  if (endDate) {
    params.append('endDate', endDate)
  }
  if (supplierId) {
    params.append('supplierId', supplierId)
  }

  return axiosInstance
    .get(`/api/analytics?${params.toString()}`, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Get detailed booking information for admin
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const getAdminBookingDetails = (bookingId: string): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .get(`/api/booking/${bookingId}/${UserService.getLanguage()}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Bulk update booking statuses
 *
 * @param {string[]} bookingIds
 * @param {bookcarsTypes.BookingStatus} status
 * @returns {Promise<number>}
 */
export const bulkUpdateBookingStatus = (bookingIds: string[], status: bookcarsTypes.BookingStatus): Promise<number> =>
  axiosInstance
    .post('/api/update-booking-status', { ids: bookingIds, status }, { withCredentials: true })
    .then((res) => res.status)

/**
 * Delete multiple bookings
 *
 * @param {string[]} bookingIds
 * @returns {Promise<number>}
 */
export const deleteBookings = (bookingIds: string[]): Promise<number> =>
  axiosInstance
    .post('/api/delete-bookings', bookingIds, { withCredentials: true })
    .then((res) => res.status)

/**
 * Get booking statistics for dashboard
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getBookingStatistics = (supplierId?: string): Promise<any> => {
  const params = supplierId ? `?supplierId=${supplierId}` : ''
  return axiosInstance
    .get(`/api/booking-statistics${params}`, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Export bookings to CSV
 *
 * @param {any} filters
 * @returns {Promise<Blob>}
 */
export const exportBookings = (filters: any): Promise<Blob> =>
  axiosInstance
    .post('/api/export-bookings', filters, { 
      withCredentials: true,
      responseType: 'blob'
    })
    .then((res) => res.data)

/**
 * Get booking conflicts for a dress and date range
 *
 * @param {string} dressId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<bookcarsTypes.Booking[]>}
 */
export const getBookingConflicts = (dressId: string, startDate: Date, endDate: Date): Promise<bookcarsTypes.Booking[]> =>
  axiosInstance
    .post('/api/booking-conflicts', {
      dressId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get customer booking history
 *
 * @param {string} customerId
 * @returns {Promise<bookcarsTypes.Booking[]>}
 */
export const getCustomerBookingHistory = (customerId: string): Promise<bookcarsTypes.Booking[]> =>
  axiosInstance
    .get(`/api/customer-bookings/${customerId}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Send booking reminder to customer
 *
 * @param {string} bookingId
 * @returns {Promise<number>}
 */
export const sendBookingReminder = (bookingId: string): Promise<number> =>
  axiosInstance
    .post(`/api/send-booking-reminder/${bookingId}`, {}, { withCredentials: true })
    .then((res) => res.status)

/**
 * Generate booking invoice
 *
 * @param {string} bookingId
 * @returns {Promise<Blob>}
 */
export const generateBookingInvoice = (bookingId: string): Promise<Blob> =>
  axiosInstance
    .get(`/api/booking-invoice/${bookingId}`, { 
      withCredentials: true,
      responseType: 'blob'
    })
    .then((res) => res.data)

/**
 * Get booking revenue breakdown
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getBookingRevenueBreakdown = (startDate: string, endDate: string, supplierId?: string): Promise<any> => {
  const params = new URLSearchParams()
  params.append('startDate', startDate)
  params.append('endDate', endDate)
  if (supplierId) {
    params.append('supplierId', supplierId)
  }

  return axiosInstance
    .get(`/api/booking-revenue-breakdown?${params.toString()}`, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Update booking payment information
 *
 * @param {string} bookingId
 * @param {any} paymentData
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const updateBookingPayment = (bookingId: string, paymentData: any): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .put(`/api/booking-payment/${bookingId}`, paymentData, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get booking calendar data for admin view
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} supplierId
 * @returns {Promise<any[]>}
 */
export const getBookingCalendarData = (startDate: string, endDate: string, supplierId?: string): Promise<any[]> => {
  const params = new URLSearchParams()
  params.append('startDate', startDate)
  params.append('endDate', endDate)
  if (supplierId) {
    params.append('supplierId', supplierId)
  }

  return axiosInstance
    .get(`/api/booking-calendar?${params.toString()}`, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Validate booking dates and availability
 *
 * @param {string} dressId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} excludeBookingId
 * @returns {Promise<{available: boolean, conflicts: any[]}>}
 */
export const validateBookingAvailability = (
  dressId: string, 
  startDate: Date, 
  endDate: Date, 
  excludeBookingId?: string
): Promise<{available: boolean, conflicts: any[]}> =>
  axiosInstance
    .post('/api/validate-booking-availability', {
      dressId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      excludeBookingId
    }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get booking trends and insights
 *
 * @param {string} period - 'week', 'month', 'quarter', 'year'
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getBookingTrends = (period: string, supplierId?: string): Promise<any> => {
  const params = new URLSearchParams()
  params.append('period', period)
  if (supplierId) {
    params.append('supplierId', supplierId)
  }

  return axiosInstance
    .get(`/api/booking-trends?${params.toString()}`, { withCredentials: true })
    .then((res) => res.data)
}

/**
 * Create booking from template or previous booking
 *
 * @param {string} templateBookingId
 * @param {any} modifications
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const createBookingFromTemplate = (templateBookingId: string, modifications: any): Promise<bookcarsTypes.Booking> =>
  axiosInstance
    .post('/api/create-booking-from-template', {
      templateBookingId,
      modifications
    }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get booking performance metrics
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getBookingPerformanceMetrics = (supplierId?: string): Promise<any> => {
  const params = supplierId ? `?supplierId=${supplierId}` : ''
  return axiosInstance
    .get(`/api/booking-performance${params}`, { withCredentials: true })
    .then((res) => res.data)
}
