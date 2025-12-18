import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import AccessorySettings from '../models/AccessorySettings'

/**
 * Calculate total price for dress rental with dynamic accessory pricing.
 *
 * @param {bookcarsTypes.Dress} dress
 * @param {number} priceChangeRate
 * @param {bookcarsTypes.DressOptions} [options]
 * @param {string} supplierId
 * @returns {Promise<number>}
 */
export const calculateTotalPriceWithDynamicAccessories = async (
  dress: bookcarsTypes.Dress,
  priceChangeRate: number,
  options?: bookcarsTypes.DressOptions,
  supplierId?: string
): Promise<number> => {
  let accessoryTotal = 0

  // Calculate accessory total if accessories are selected
  if (options?.accessories && dress.accessories && dress.accessories.length > 0) {
    const supplierIdToUse = supplierId || (typeof dress.supplier === 'string' ? dress.supplier : dress.supplier._id?.toString())

    try {
      const settings = await AccessorySettings.getForSupplier(supplierIdToUse!)
      accessoryTotal = settings.calculateAccessoriesTotal(dress.accessories)
    } catch (error) {
      console.warn('Failed to get accessory settings, using default fee:', error)
      accessoryTotal = 50 // Fallback to default
    }
  }

  return bookcarsHelper.calculateTotalPriceWithAccessories(dress, priceChangeRate, options, accessoryTotal)
}

/**
 * Calculate accessory total for given accessories and supplier.
 *
 * @param {string[]} accessories
 * @param {string} supplierId
 * @returns {Promise<number>}
 */
export const calculateAccessoryTotal = async (accessories: string[], supplierId: string): Promise<number> => {
  if (!accessories || accessories.length === 0) {
    return 0
  }

  try {
    const settings = await AccessorySettings.getForSupplier(supplierId)
    return settings.calculateAccessoriesTotal(accessories)
  } catch (error) {
    console.warn('Failed to get accessory settings, using default fee:', error)
    return 50 // Fallback to default
  }
}

/**
 * Get accessory price for a specific accessory type and supplier.
 *
 * @param {string} accessoryType
 * @param {string} supplierId
 * @returns {Promise<number>}
 */
export const getAccessoryPrice = async (accessoryType: string, supplierId: string): Promise<number> => {
  try {
    const settings = await AccessorySettings.getForSupplier(supplierId)
    return settings.getAccessoryPrice(accessoryType)
  } catch (error) {
    console.warn('Failed to get accessory settings, using default fee:', error)
    return 50 // Fallback to default
  }
}

/**
 * Get all accessory prices for a supplier.
 *
 * @param {string} supplierId
 * @returns {Promise<any>}
 */
export const getAccessoryPrices = async (supplierId: string): Promise<any> => {
  try {
    const settings = await AccessorySettings.getForSupplier(supplierId)
    return {
      accessoryPrices: settings.accessoryPrices,
      defaultAccessoryFee: settings.defaultAccessoryFee,
      currency: settings.currency,
    }
  } catch (error) {
    console.warn('Failed to get accessory settings, using defaults:', error)
    return {
      accessoryPrices: {
        veil: 50,
        jewelry: 30,
        shoes: 25,
        headpiece: 40,
        handbag: 20,
        gloves: 15,
        hairAccessories: 25,
        undergarments: 35,
        wrapShawl: 30,
      },
      defaultAccessoryFee: 50,
      currency: 'ILS',
    }
  }
}

/**
 * Update booking price calculation to use dynamic accessory pricing.
 *
 * @param {any} booking
 * @returns {Promise<number>}
 */
export const recalculateBookingPrice = async (booking: any): Promise<number> => {
  const dress = booking.dress
  const supplier = booking.supplier
  const priceChangeRate = supplier.priceChangeRate || 0

  const options: bookcarsTypes.DressOptions = {
    cancellation: booking.cancellation,
    amendments: booking.amendments,
    accessories: booking.accessoriesIncluded && booking.accessoriesIncluded.length > 0,
  }

  // If accessories are included, calculate with dynamic pricing
  if (options.accessories && booking.accessoriesIncluded) {
    const accessoryTotal = await calculateAccessoryTotal(booking.accessoriesIncluded, supplier._id || supplier)
    return bookcarsHelper.calculateTotalPriceWithAccessories(dress, priceChangeRate, options, accessoryTotal)
  }

  return bookcarsHelper.calculateTotalPrice(dress, priceChangeRate, options)
}
