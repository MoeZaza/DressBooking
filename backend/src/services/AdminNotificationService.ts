import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Get admin notifications with filtering and pagination.
 *
 * @param {string} userId
 * @param {object} params
 * @returns {Promise<{notifications: bookcarsTypes.Notification[], unreadCount: number}>}
 */
export const getAdminNotifications = async (
  userId: string, 
  params?: {
    page?: number
    limit?: number
    type?: string
    category?: string
    priority?: string
    isRead?: boolean
  }
): Promise<{
  notifications: bookcarsTypes.Notification[]
  unreadCount: number
  total: number
}> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params?.type) {
    queryParams.append('type', params.type)
  }
  if (params?.category) {
    queryParams.append('category', params.category)
  }
  if (params?.priority) {
    queryParams.append('priority', params.priority)
  }
  if (params?.isRead !== undefined) {
    queryParams.append('isRead', params.isRead.toString())
  }

  return axiosInstance
    .get(`/api/admin/notifications/${encodeURIComponent(userId)}?${queryParams.toString()}`, {
      withCredentials: true
    })
    .then((res) => res.data)
}

/**
 * Get admin notification statistics.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getAdminNotificationStats = (userId: string): Promise<{
  totalNotifications: number
  unreadCount: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: Array<{
    date: string
    count: number
  }>
}> =>
  axiosInstance
    .get(`/api/admin/notifications/${encodeURIComponent(userId)}/stats`, {
      withCredentials: true
    })
    .then((res) => res.data)

/**
 * Mark admin notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const markAsRead = (notificationId: string): Promise<void> =>
  axiosInstance
    .put(
      `/api/admin/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
      { withCredentials: true }
    )
    .then(() => {})

/**
 * Mark all admin notifications as read.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const markAllAsRead = (userId: string): Promise<void> =>
  axiosInstance
    .put(
      `/api/admin/notifications/${encodeURIComponent(userId)}/read-all`,
      {},
      { withCredentials: true }
    )
    .then(() => {})

/**
 * Delete admin notification.
 *
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const deleteNotification = (notificationId: string): Promise<void> =>
  axiosInstance
    .delete(`/api/admin/notifications/${encodeURIComponent(notificationId)}`, {
      withCredentials: true
    })
    .then(() => {})

/**
 * Create admin notification.
 *
 * @param {object} data
 * @returns {Promise<bookcarsTypes.Notification>}
 */
export const createAdminNotification = (data: {
  title: string
  message: string
  type: string
  category?: string
  priority?: string
  actionUrl?: string
  actionText?: string
  bookingId?: string
  dressId?: string
}): Promise<bookcarsTypes.Notification> =>
  axiosInstance
    .post('/api/admin/notifications', data, {
      withCredentials: true
    })
    .then((res) => res.data)

/**
 * Get real-time admin notifications (for polling).
 *
 * @param {string} userId
 * @param {Date} since
 * @returns {Promise<bookcarsTypes.Notification[]>}
 */
export const getRealtimeNotifications = (userId: string, since?: Date): Promise<bookcarsTypes.Notification[]> => {
  const queryParams = new URLSearchParams()
  if (since) {
    queryParams.append('since', since.toISOString())
  }

  return axiosInstance
    .get(`/api/admin/notifications/${encodeURIComponent(userId)}/realtime?${queryParams.toString()}`, {
      withCredentials: true
    })
    .then((res) => res.data)
}

/**
 * Update admin notification preferences.
 *
 * @param {string} userId
 * @param {object} preferences
 * @returns {Promise<void>}
 */
export const updateNotificationPreferences = (
  userId: string,
  preferences: {
    emailNotifications?: boolean
    pushNotifications?: boolean
    notificationTypes?: string[]
    quietHours?: {
      enabled: boolean
      start: string
      end: string
    }
  }
): Promise<void> =>
  axiosInstance
    .put(
      `/api/admin/notifications/${encodeURIComponent(userId)}/preferences`,
      preferences,
      { withCredentials: true }
    )
    .then(() => {})

/**
 * Get admin notification preferences.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getNotificationPreferences = (userId: string): Promise<{
  emailNotifications: boolean
  pushNotifications: boolean
  notificationTypes: string[]
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}> =>
  axiosInstance
    .get(`/api/admin/notifications/${encodeURIComponent(userId)}/preferences`, {
      withCredentials: true
    })
    .then((res) => res.data)

/**
 * Test admin notification system.
 *
 * @returns {Promise<void>}
 */
export const testNotificationSystem = (): Promise<void> =>
  axiosInstance
    .post('/api/admin/notifications/test', {}, {
      withCredentials: true
    })
    .then(() => {})
