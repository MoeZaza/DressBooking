import axiosInstance from './axiosInstance'
import { Dress, GetDressesPayload } from ':bookcars-types'

/**
 * Get all dresses with pagination (public endpoint).
 *
 * @param {number} page - Page number
 * @param {number} size - Page size
 * @returns {Promise<any>}
 */
export const getDresses = (page: number, size: number) => {
  return axiosInstance.post(`/api/frontend-dresses/${page}/${size}`, {})
    .then((res: any) => {
      console.log('getDresses response:', res.data)
      return res.data
    })
    .catch((error: any) => {
      console.error('getDresses error:', error)
      throw error
    })
}

/**
 * Get dresses with filters.
 *
 * @param {GetDressesPayload} payload - Filter payload
 * @param {number} page - Page number
 * @param {number} size - Page size
 * @returns {Promise<any>}
 */
export const getDressesWithFilters = (payload: GetDressesPayload, page: number = 1, size: number = 10) => {
  return axiosInstance.post(`/api/frontend-dresses/${page}/${size}`, payload)
    .then((res: any) => {
      console.log('getDressesWithFilters response:', res.data)
      return res.data
    })
    .catch((error: any) => {
      console.error('getDressesWithFilters error:', error)
      throw error
    })
}

/**
 * Get a dress by ID.
 *
 * @param {string} id - Dress ID
 * @returns {Promise<any>}
 */
export const getDress = (id: string) => {
  return axiosInstance.get(`/api/dress/${id}/en`)
}

/**
 * Create a new dress.
 *
 * @param {Dress} data - Dress data
 * @returns {Promise<any>}
 */
export const createDress = (data: Dress) => {
  return axiosInstance.post('/api/create-dress', data)
}

/**
 * Update a dress.
 *
 * @param {string} id - Dress ID
 * @param {Dress} data - Updated dress data
 * @returns {Promise<any>}
 */
export const updateDress = (id: string, data: Dress) => {
  return axiosInstance.put('/api/update-dress', { ...data, _id: id })
}

/**
 * Delete a dress.
 *
 * @param {string} id - Dress ID
 * @returns {Promise<any>}
 */
export const deleteDress = (id: string) => {
  return axiosInstance.delete(`/api/delete-dress/${id}`)
}

/**
 * Get available dresses for a specific location and date range.
 * 
 * @param {string} from - Start date
 * @param {string} to - End date
 * @param {string} locationId - Location ID
 * @returns {Promise<any>}
 */
export const getAvailableDresses = (from: string, to: string, locationId: string) => {
  return axiosInstance.get(`/api/available-dresses/${from}/${to}/${locationId}`)
}

/**
 * Upload dress image.
 *
 * @param {FormData} data - Form data with image
 * @returns {Promise<any>}
 */
export const uploadDressImage = (data: FormData) => {
  return axiosInstance.post('/api/create-dress-image', data)
}

/**
 * Upload multiple dress images.
 *
 * @param {FormData} data - Form data with multiple images
 * @returns {Promise<{filenames: string[]}>}
 */
export const uploadMultipleDressImages = (data: FormData) => {
  return axiosInstance.post('/api/upload-multiple-dress-images', data)
}

/**
 * Add multiple images to a dress.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageFilenames - Array of image filenames
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const addDressImages = (id: string, imageFilenames: string[]) => {
  return axiosInstance.post(`/api/add-dress-images/${id}`, { imageFilenames })
}

/**
 * Delete a specific dress image.
 *
 * @param {string} id - Dress ID
 * @param {string} imageFilename - Image filename to delete
 * @returns {Promise<any>}
 */
export const deleteDressImage = (id: string, imageFilename?: string) => {
  return axiosInstance.post(`/api/delete-dress-image/${id}`, { imageFilename })
}

/**
 * Reorder dress images.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageOrder - Array of image filenames in desired order
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const reorderDressImages = (id: string, imageOrder: string[]) => {
  return axiosInstance.post(`/api/reorder-dress-images/${id}`, { imageOrder })
}

/**
 * Get dress analytics by ID.
 *
 * @param {string} id - Dress ID
 * @returns {Promise<any>}
 */
export const getDressAnalytics = (id: string) => {
  return axiosInstance.get(`/api/dress-analytics/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  }).then((res: any) => res.data)
}


