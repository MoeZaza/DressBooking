import { Request, Response } from 'express'
import AccessorySettings from '../models/AccessorySettings'
import * as logger from '../common/logger'
import i18n from '../lang/i18n'

/**
 * Get accessory settings for a supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAccessorySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier ID is required' })
      return
    }

    const settings = await AccessorySettings.getForSupplier(supplierId)
    res.json(settings)
  } catch (err: any) {
    logger.error(`[accessorySettings.getAccessorySettings] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to get accessory settings' })
  }
}

/**
 * Update accessory settings for a supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateAccessorySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params
    const { accessoryPrices, defaultAccessoryFee, currency, isActive } = req.body
    const userId = (req as any).user?.id

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier ID is required' })
      return
    }

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' })
      return
    }

    // Validate accessory prices
    if (accessoryPrices) {
      const requiredFields = ['veil', 'jewelry', 'shoes', 'headpiece', 'handbag', 'gloves', 'hairAccessories', 'undergarments', 'wrapShawl']
      for (const field of requiredFields) {
        if (accessoryPrices[field] !== undefined && (typeof accessoryPrices[field] !== 'number' || accessoryPrices[field] < 0)) {
          res.status(400).json({ error: `Invalid price for ${field}. Must be a non-negative number.` })
          return
        }
      }
    }

    if (defaultAccessoryFee !== undefined && (typeof defaultAccessoryFee !== 'number' || defaultAccessoryFee < 0)) {
      res.status(400).json({ error: 'Default accessory fee must be a non-negative number' })
      return
    }

    const updates: any = {}
    if (accessoryPrices) {
      updates.accessoryPrices = accessoryPrices
    }
    if (defaultAccessoryFee !== undefined) {
      updates.defaultAccessoryFee = defaultAccessoryFee
    }
    if (currency) {
      updates.currency = currency
    }
    if (isActive !== undefined) {
      updates.isActive = isActive
    }

    const settings = await AccessorySettings.updateForSupplier(supplierId, updates, userId)
    res.json(settings)
  } catch (err: any) {
    logger.error(`[accessorySettings.updateAccessorySettings] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to update accessory settings' })
  }
}

/**
 * Get all accessory settings (admin only).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAllAccessorySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)

    const settings = await AccessorySettings.find()
      .populate('supplier', 'fullName email')
      .populate('lastUpdatedBy', 'fullName')
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    const total = await AccessorySettings.countDocuments()

    res.json({
      settings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (err: any) {
    logger.error(`[accessorySettings.getAllAccessorySettings] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to get accessory settings' })
  }
}

/**
 * Calculate accessory total for given accessories and supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const calculateAccessoryTotal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId, accessories } = req.body

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier ID is required' })
      return
    }

    if (!Array.isArray(accessories)) {
      res.status(400).json({ error: 'Accessories must be an array' })
      return
    }

    const settings = await AccessorySettings.getForSupplier(supplierId)
    const total = settings.calculateAccessoriesTotal(accessories)

    res.json({
      total,
      accessories: accessories.map(accessory => ({
        name: accessory,
        price: settings.getAccessoryPrice(accessory)
      })),
      currency: settings.currency
    })
  } catch (err: any) {
    logger.error(`[accessorySettings.calculateAccessoryTotal] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to calculate accessory total' })
  }
}

/**
 * Reset accessory settings to default values.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const resetAccessorySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params
    const userId = (req as any).user?.id

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier ID is required' })
      return
    }

    if (!userId) {
      res.status(401).json({ error: 'User authentication required' })
      return
    }

    const defaultSettings = {
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
      isActive: true,
    }

    const settings = await AccessorySettings.updateForSupplier(supplierId, defaultSettings, userId)
    res.json(settings)
  } catch (err: any) {
    logger.error(`[accessorySettings.resetAccessorySettings] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to reset accessory settings' })
  }
}

/**
 * Delete accessory settings for a supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteAccessorySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params

    if (!supplierId) {
      res.status(400).json({ error: 'Supplier ID is required' })
      return
    }

    await AccessorySettings.findOneAndDelete({ supplier: supplierId })
    res.json({ message: 'Accessory settings deleted successfully' })
  } catch (err: any) {
    logger.error(`[accessorySettings.deleteAccessorySettings] ${i18n.t('DB_ERROR')}`, err)
    res.status(500).json({ error: err.message || 'Failed to delete accessory settings' })
  }
}
