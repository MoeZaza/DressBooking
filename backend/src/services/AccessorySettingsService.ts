import axiosInstance from './axiosInstance'

/**
 * Get accessory settings for a supplier.
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getAccessorySettings = (supplierId: string): Promise<any> =>
  axiosInstance
    .get(`/api/accessory-settings/${supplierId}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Update accessory settings for a supplier.
 *
 * @param {string} supplierId
 * @param {any} settings
 * @returns {Promise<any>}
 */
export const updateAccessorySettings = (supplierId: string, settings: any): Promise<any> =>
  axiosInstance
    .put(`/api/accessory-settings/${supplierId}`, settings, { withCredentials: true })
    .then((res) => res.data)

/**
 * Get all accessory settings (admin only).
 *
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<any>}
 */
export const getAllAccessorySettings = (page: number = 1, limit: number = 20): Promise<any> =>
  axiosInstance
    .get(`/api/accessory-settings?page=${page}&limit=${limit}`, { withCredentials: true })
    .then((res) => res.data)

/**
 * Calculate accessory total for given accessories and supplier.
 *
 * @param {string} supplierId
 * @param {string[]} accessories
 * @returns {Promise<any>}
 */
export const calculateAccessoryTotal = (supplierId: string, accessories: string[]): Promise<any> =>
  axiosInstance
    .post('/api/accessory-settings/calculate', { supplierId, accessories }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Reset accessory settings to default values.
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const resetAccessorySettings = (supplierId: string): Promise<any> =>
  axiosInstance
    .post(`/api/accessory-settings/${supplierId}/reset`, {}, { withCredentials: true })
    .then((res) => res.data)

/**
 * Delete accessory settings for a supplier.
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const deleteAccessorySettings = (supplierId: string): Promise<any> =>
  axiosInstance
    .delete(`/api/accessory-settings/${supplierId}`, { withCredentials: true })
    .then((res) => res.data)
