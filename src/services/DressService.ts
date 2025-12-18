import axios from 'axios'
import * as bookcarsTypes from ':bookcars-types'
import env from '../config/env.config'

/**
 * Get dresses.
 *
 * @param {number} page
 * @param {number} size
 * @returns {Promise<bookcarsTypes.Result<bookcarsTypes.Dress>>}
 */
export const getDresses = (page: number, size: number): Promise<bookcarsTypes.Result<bookcarsTypes.Dress>> => (
  axios.get(`${env.API_HOST}/api/dresses/${page}/${size}`)
    .then((res) => res.data)
)

/**
 * Get a Dress by ID.
 *
 * @param {string} id
 * @returns {Promise<bookcarsTypes.Dress>}
 */
export const getDress = (id: string): Promise<bookcarsTypes.Dress> => (
  axios.get(`${env.API_HOST}/api/dress/${id}`)
    .then((res) => res.data)
)

/**
 * Create a Dress.
 *
 * @param {bookcarsTypes.Dress} data
 * @returns {Promise<bookcarsTypes.Dress>}
 */
export const createDress = (data: bookcarsTypes.Dress): Promise<bookcarsTypes.Dress> => (
  axios.post(`${env.API_HOST}/api/dress`, data)
    .then((res) => res.data)
)

/**
 * Update a Dress.
 *
 * @param {string} id
 * @param {bookcarsTypes.Dress} data
 * @returns {Promise<number>}
 */
export const updateDress = (id: string, data: bookcarsTypes.Dress): Promise<number> => (
  axios.put(`${env.API_HOST}/api/dress/${id}`, data)
    .then((res) => res.status)
)

/**
 * Delete a Dress.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const deleteDress = (id: string): Promise<number> => (
  axios.delete(`${env.API_HOST}/api/dress/${id}`)
    .then((res) => res.status)
)

/**
 * Get available dresses.
 *
 * @param {string} from
 * @param {string} to
 * @param {string} locationId
 * @returns {Promise<bookcarsTypes.Dress[]>}
 */
export const getAvailableDresses = (from: string, to: string, locationId: string): Promise<bookcarsTypes.Dress[]> => (
  axios.get(`${env.API_HOST}/api/available-dresses/${from}/${to}/${locationId}`)
    .then((res) => res.data)
)

/**
 * Upload a Dress image.
 *
 * @param {FormData} data
 * @returns {Promise<string>}
 */
export const uploadImage = (data: FormData): Promise<string> => (
  axios.post(`${env.API_HOST}/api/upload-dress-image`, data)
    .then((res) => res.data)
)

/**
 * Delete a Dress image.
 *
 * @param {string} id
 * @param {string} imageFilename - Optional specific image filename to delete
 * @returns {Promise<number>}
 */
export const deleteImage = (id: string, imageFilename?: string): Promise<number> => (
  axios.post(`${env.API_HOST}/api/delete-dress-image/${id}`, { imageFilename })
    .then((res) => res.status)
)

/**
 * Upload multiple images for a dress.
 *
 * @param {FormData} data
 * @returns {Promise<{filenames: string[]}>}
 */
export const uploadMultipleImages = (data: FormData): Promise<{filenames: string[]}> => (
  axios.post(`${env.API_HOST}/api/upload-multiple-dress-images`, data)
    .then((res) => res.data)
)

/**
 * Add multiple images to a dress.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageFilenames - Array of image filenames
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const addImages = (id: string, imageFilenames: string[]): Promise<{message: string, images: string[]}> => (
  axios.post(`${env.API_HOST}/api/add-dress-images/${id}`, { imageFilenames })
    .then((res) => res.data)
)

/**
 * Reorder dress images.
 *
 * @param {string} id - Dress ID
 * @param {string[]} imageOrder - Array of image filenames in desired order
 * @returns {Promise<{message: string, images: string[]}>}
 */
export const reorderImages = (id: string, imageOrder: string[]): Promise<{message: string, images: string[]}> => (
  axios.post(`${env.API_HOST}/api/reorder-dress-images/${id}`, { imageOrder })
    .then((res) => res.data)
)

/**
 * Get Dress types.
 *
 * @returns {Promise<bookcarsTypes.DressType[]>}
 */
export const getDressTypes = (): Promise<bookcarsTypes.DressType[]> => (
  axios.get(`${env.API_HOST}/api/dress-types`)
    .then((res) => res.data)
)

/**
 * Get Dress sizes.
 *
 * @returns {Promise<bookcarsTypes.DressSize[]>}
 */
export const getDressSizes = (): Promise<bookcarsTypes.DressSize[]> => (
  axios.get(`${env.API_HOST}/api/dress-sizes`)
    .then((res) => res.data)
)

/**
 * Get Dress materials.
 *
 * @returns {Promise<bookcarsTypes.DressMaterial[]>}
 */
export const getDressMaterials = (): Promise<bookcarsTypes.DressMaterial[]> => (
  axios.get(`${env.API_HOST}/api/dress-materials`)
    .then((res) => res.data)
)

/**
 * Get Dress ranges.
 *
 * @returns {Promise<bookcarsTypes.DressRange[]>}
 */
export const getDressRanges = (): Promise<bookcarsTypes.DressRange[]> => (
  axios.get(`${env.API_HOST}/api/dress-ranges`)
    .then((res) => res.data)
)

/**
 * Get Dress accessories.
 *
 * @returns {Promise<bookcarsTypes.DressAccessories[]>}
 */
export const getDressAccessories = (): Promise<bookcarsTypes.DressAccessories[]> => (
  axios.get(`${env.API_HOST}/api/dress-accessories`)
    .then((res) => res.data)
)

export default {
  getDresses,
  getDress,
  createDress,
  updateDress,
  deleteDress,
  getAvailableDresses,
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  addImages,
  reorderImages,
  getDressTypes,
  getDressSizes,
  getDressMaterials,
  getDressRanges,
  getDressAccessories,
}
