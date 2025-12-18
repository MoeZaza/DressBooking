import { Request, Response } from 'express'
import mongoose from 'mongoose'
import WeddingPackage from '../models/WeddingPackage'

import i18n from '../lang/i18n'
import * as logger from '../common/logger'

// Initialize default wedding packages if none exist
const initializeDefaultPackages = async () => {
  try {
    const count = await WeddingPackage.countDocuments()
    if (count === 0) {
      const defaultPackages = [
        {
          name: 'Complete Bridal Package',
          description: 'Everything a bride needs for her perfect day',
          type: 'complete-wedding',
          dresses: [
            { dressId: '1', dressName: 'Classic Wedding Dress', role: 'Bride', included: true },
            { dressId: '2', dressName: 'Bridesmaid Dress Set', role: 'Bridesmaids', included: true },
            { dressId: '3', dressName: 'Mother of Bride Dress', role: 'Mother', included: true },
          ],
          services: [
            { service: 'Professional Fitting', included: true },
            { service: 'Alterations', included: true },
            { service: 'Steaming & Pressing', included: true },
            { service: 'Emergency Kit', included: true },
            { service: 'Delivery & Pickup', included: false, additionalCost: 50 },
          ],
          pricing: {
            basePrice: 2500,
            discountPercentage: 15,
            finalPrice: 2125,
            depositRequired: 500,
          },
          duration: {
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-05'),
            fittingSchedule: [
              { date: new Date('2024-01-15'), type: 'Initial Fitting', duration: 90 },
              { date: new Date('2024-01-25'), type: 'Final Fitting', duration: 60 },
            ],
          },
          terms: {
            cancellationPolicy: '50% refund if cancelled 30 days before event',
            alterationPolicy: 'Minor alterations included, major changes additional cost',
            damagePolicy: 'Customer responsible for damages beyond normal wear',
          },
          isActive: true,
          popularity: 95,
          bookingsCount: 24,
        },
        {
          name: 'Bridesmaid Group Package',
          description: 'Coordinated dresses for the entire bridal party',
          type: 'bridesmaid',
          dresses: [
            { dressId: '4', dressName: 'Coordinated Bridesmaid Dresses', role: 'Bridesmaids', included: true },
          ],
          services: [
            { service: 'Group Fitting Session', included: true },
            { service: 'Color Coordination', included: true },
            { service: 'Basic Alterations', included: true },
          ],
          pricing: {
            basePrice: 800,
            discountPercentage: 10,
            finalPrice: 720,
            depositRequired: 150,
          },
          duration: {
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-02-05'),
            fittingSchedule: [
              { date: new Date('2024-01-20'), type: 'Group Fitting', duration: 120 },
            ],
          },
          terms: {
            cancellationPolicy: '30% refund if cancelled 14 days before event',
            alterationPolicy: 'Basic alterations included per dress',
            damagePolicy: 'Individual responsibility for each dress',
          },
          isActive: true,
          popularity: 78,
          bookingsCount: 18,
        }
      ]

      await WeddingPackage.insertMany(defaultPackages)
      logger.info('Default wedding packages initialized')
    }
  } catch (error) {
    logger.error('Error initializing default packages:', error)
  }
}

// Initialize packages on startup
initializeDefaultPackages()

/**
 * Get all wedding packages.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getWeddingPackages = async (req: Request, res: Response) => {
  try {
    const { supplierId, type, isActive } = req.query

    // Build query object
    const query: any = {}

    if (supplierId) {
      query.supplier = supplierId
    }

    if (type) {
      query.type = type
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    // Use MongoDB model instead of mock data
    const packages = await WeddingPackage.find(query)
      .populate('supplier', 'fullName email')
      .sort({ popularity: -1, bookingsCount: -1 })

    res.json(packages)
  } catch (err) {
    logger.error(`[weddingPackage.getWeddingPackages] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get wedding package by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getWeddingPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).send(i18n.t('INVALID_WEDDING_PACKAGE_ID'))
      return
    }

    const weddingPackage = await WeddingPackage.findById(id)
      .populate('supplier', 'fullName email')

    if (!weddingPackage) {
      res.status(404).send(i18n.t('WEDDING_PACKAGE_NOT_FOUND'))
      return
    }

    res.json(weddingPackage)
  } catch (err) {
    logger.error(`[weddingPackage.getWeddingPackage] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create wedding package.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createWeddingPackage = async (req: Request, res: Response) => {
  try {
    const packageData = req.body

    // Create new wedding package using MongoDB model
    const newPackage = new WeddingPackage({
      ...packageData,
      popularity: 0,
      bookingsCount: 0,
      isActive: packageData.isActive !== undefined ? packageData.isActive : true
    })

    const savedPackage = await newPackage.save()

    // Populate supplier information
    await savedPackage.populate('supplier', 'fullName email')

    res.status(201).json(savedPackage)
  } catch (err: any) {
    logger.error(`[weddingPackage.createWeddingPackage] ${i18n.t('DB_ERROR')}`, err)

    if (err.name === 'ValidationError') {
      res.status(400).send(err.message)
    } else {
      res.status(400).send(i18n.t('DB_ERROR') + err)
    }
  }
}

/**
 * Update wedding package.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateWeddingPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).send(i18n.t('INVALID_WEDDING_PACKAGE_ID'))
      return
    }

    const updatedPackage = await WeddingPackage.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('supplier', 'fullName email')

    if (!updatedPackage) {
      res.status(404).send(i18n.t('WEDDING_PACKAGE_NOT_FOUND'))
      return
    }

    res.json(updatedPackage)
  } catch (err: any) {
    logger.error(`[weddingPackage.updateWeddingPackage] ${i18n.t('DB_ERROR')}`, err)

    if (err.name === 'ValidationError') {
      res.status(400).send(err.message)
    } else {
      res.status(400).send(i18n.t('DB_ERROR') + err)
    }
  }
}

/**
 * Delete wedding package.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteWeddingPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).send(i18n.t('INVALID_WEDDING_PACKAGE_ID'))
      return
    }

    const deletedPackage = await WeddingPackage.findByIdAndDelete(id)

    if (!deletedPackage) {
      res.status(404).send(i18n.t('WEDDING_PACKAGE_NOT_FOUND'))
      return
    }

    res.status(200).send(i18n.t('WEDDING_PACKAGE_DELETED'))
  } catch (err: any) {
    logger.error(`[weddingPackage.deleteWeddingPackage] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
