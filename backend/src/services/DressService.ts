import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Create a Dress.
 *
 * @param {bookcarsTypes.CreateDressPayload} data
 * @returns {Promise<bookcarsTypes.Dress>}
 */
export const create = (data: bookcarsTypes.CreateDressPayload): Promise<bookcarsTypes.Dress> =>
  axiosInstance
    .post(
      '/api/create-dress',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Dress.
 *
 * @param {bookcarsTypes.UpdateDressPayload} data
 * @returns {Promise<number>}
 */
export const update = (data: bookcarsTypes.UpdateDressPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-dress',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Delete a Dress.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const deleteDress = (id: string): Promise<number> =>
  axiosInstance
    .delete(
      `/api/delete-dress/${id}`,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get a Dress by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.Dress>}
 */
export const getDress = (id: string): Promise<bookcarsTypes.Dress> =>
  axiosInstance
    .get(
      `/api/dress/${id}/${UserService.getLanguage()}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Dresses.
 *
 * @param {string} keyword
 * @param {bookcarsTypes.GetDressesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Dress>>}
 */
export const getDresses = (keyword: string, data: bookcarsTypes.GetDressesPayload, page: number, size: number): Promise<bookcarsTypes.Result<bookcarsTypes.Dress>> =>
  axiosInstance
    .post(
      `/api/dresses/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Check if a Dress is related to a booking.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const check = (id: string): Promise<number> =>
  axiosInstance
    .get(
      `/api/check-dress/${id}`,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Create a Dress image.
 *
 * @param {Blob} file
 * @returns {Promise<string>}
 */
export const createImage = (file: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)

  return axiosInstance
    .post(
      '/api/create-dress-image',
      formData,
      { withCredentials: true }
    )
    .then((res) => res.data)
}

/**
 * Update a Dress image.
 *
 * @param {string} id
 * @param {Blob} file
 * @returns {Promise<number>}
 */
export const updateImage = (id: string, file: Blob): Promise<number> => {
  const formData = new FormData()
  formData.append('image', file)

  return axiosInstance
    .put(
      `/api/update-dress-image/${id}`,
      formData,
      { withCredentials: true }
    )
    .then((res) => res.status)
}

/**
 * Delete a Dress image.
 *
 * @param {string} id
 * @param {string} imageFilename - Optional specific image filename to delete
 * @returns {Promise<number>}
 */
export const deleteImage = (id: string, imageFilename?: string): Promise<number> =>
  axiosInstance
    .post(
      `/api/delete-dress-image/${id}`,
      { imageFilename },
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Upload multiple images for a dress.
 *
 * @param {FormData} data
 * @returns {Promise<{filenames: string[]}>}
 */
export const uploadMultipleImages = (data: FormData): Promise<{filenames: string[]}> =>
  axiosInstance
    .post('/api/upload-multiple-dress-images', data, { withCredentials: true })
    .then((res) => res.data)

/**
 * Add multiple images to a dress.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageFilenames - Array of image filenames
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const addImages = (id: string, imageFilenames: string[]): Promise<{message: string, images: string[]}> =>
  axiosInstance
    .post(`/api/add-dress-images/${id}`, { imageFilenames }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Reorder dress images.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageOrder - Array of image filenames in desired order
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const reorderImages = (id: string, imageOrder: string[]): Promise<{message: string, images: string[]}> =>
  axiosInstance
    .post(`/api/reorder-dress-images/${id}`, { imageOrder }, { withCredentials: true })
    .then((res) => res.data)

/**
 * Delete a temporary dress image.
 *
 * @param {string} image - Image filename
 * @returns {Promise<number>}
 */
export const deleteTempImage = (image: string): Promise<number> =>
  axiosInstance
    .post(`/api/delete-temp-dress-image/${image}`, {}, { withCredentials: true })
    .then((res) => res.status)



/**
 * Get dress code information (admin/owner only).
 *
 * @param {string} id - Dress ID
 * @returns {Promise<any>}
 */
export const getDressCode = (id: string): Promise<any> =>
  axiosInstance
    .get(
      `/api/dress-codes/${id}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update dress code (admin/owner only).
 *
 * @param {string} id - Dress ID
 * @param {string} dressCode - New dress code
 * @returns {Promise<any>}
 */
export const updateDressCode = (id: string, dressCode: string): Promise<any> =>
  axiosInstance
    .put(
      `/api/dress-codes/${id}`,
      { dressCode },
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Generate a new dress code for a dress (admin/owner only).
 *
 * @param {string} id - Dress ID
 * @returns {Promise<any>}
 */
export const generateDressCode = (id: string): Promise<any> =>
  axiosInstance
    .post(
      `/api/dress-codes/${id}/generate`,
      null,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Validate dress code uniqueness.
 *
 * @param {string} dressCode - Dress code to validate
 * @param {string} excludeDressId - Dress ID to exclude from validation
 * @returns {Promise<any>}
 */
export const validateDressCode = (dressCode: string, excludeDressId?: string): Promise<any> => {
  const params = excludeDressId ? `?exclude=${excludeDressId}` : ''
  return axiosInstance
    .get(
      `/api/validate-dress-code/${dressCode}${params}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
}

/**
 * Get all dress codes for a supplier (admin/owner only).
 *
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<any>}
 */
export const getSupplierDressCodes = (supplierId: string): Promise<any> =>
  axiosInstance
    .get(
      `/api/supplier-dress-codes/${supplierId}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
