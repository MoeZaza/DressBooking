import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import Dress from '../models/Dress'
import User from '../models/User'
import * as helper from '../common/helper'
import { AuthenticatedRequest } from '../middlewares/roleAuth'

/**
 * Generate a unique dress code
 */
const generateDressCode = async (): Promise<string> => {
  let code: string
  let exists = true
  let attempts = 0
  const maxAttempts = 100

  while (exists && attempts < maxAttempts) {
    // Generate code format: DR-YYYY-NNNN (e.g., DR-2024-0001)
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    code = `DR-${year}-${randomNum}-${Date.now().toString(36)}` // Add timestamp for uniqueness

    // Check if code already exists
    const existingDress = await Dress.findOne({ dressCode: code })
    exists = !!existingDress
    attempts++
  }

  if (exists) {
    throw new Error('Failed to generate unique dress code after maximum attempts')
  }

  return code!
}
import * as env from '../config/env.config'
import * as bookcarsTypes from ':bookcars-types'
import * as rentalCountService from '../services/rentalCountService'
import Booking from '../models/Booking'
import * as logger from '../common/logger'
import i18n from '../lang/i18n'

/**
 * Get inventory statistics for dashboard.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getInventoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.query

    // Build supplier filter
    const supplierFilter = supplierId ? { supplier: new mongoose.Types.ObjectId(supplierId as string) } : {}

    // Get dress statistics
    const dressStats = await Dress.aggregate([
      { $match: supplierFilter },
      {
        $group: {
          _id: null,
          totalDresses: { $sum: 1 },
          availableDresses: { $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] } },
          bookedDresses: { $sum: { $cond: [{ $eq: ['$available', false] }, 1, 0] } },
          totalRevenue: { $sum: { $multiply: ['$rentals', '$price'] } },
          averageRating: { $avg: '$rating' }, // Calculate from actual dress ratings
          categoryBreakdown: {
            $push: {
              category: '$type',
              revenue: { $multiply: ['$rentals', '$price'] },
              count: 1
            }
          },
          sizeDistribution: {
            $push: {
              size: '$size',
              available: '$available',
              rentals: '$rentals'
            }
          }
        }
      }
    ])

    // Get top performing dresses
    const topPerformers = await Dress.find(supplierFilter)
      .sort({ rentals: -1 })
      .limit(5)
      .select('name rentals price')

    // Get upcoming bookings for maintenance alerts
    const upcomingBookings = await Booking.find({
      ...supplierFilter,
      from: { $gte: new Date() },
      status: { $in: ['paid', 'deposit', 'confirmed'] }
    })
      .populate('dress', 'name')
      .populate('customer', 'fullName')
      .sort({ from: 1 })
      .limit(10)

    // Process category breakdown
    const categoryMap = new Map()
    if (dressStats[0]?.categoryBreakdown) {
      dressStats[0].categoryBreakdown.forEach((item: any) => {
        const existing = categoryMap.get(item.category) || { category: item.category, count: 0, revenue: 0 }
        existing.count += 1
        existing.revenue += item.revenue
        categoryMap.set(item.category, existing)
      })
    }

    // Process size distribution
    const sizeMap = new Map()
    if (dressStats[0]?.sizeDistribution) {
      dressStats[0].sizeDistribution.forEach((item: any) => {
        const existing = sizeMap.get(item.size) || { size: item.size, count: 0, utilization: 0 }
        existing.count += 1
        existing.utilization += item.rentals
        sizeMap.set(item.size, existing)
      })
    }

    // Calculate utilization percentages
    const sizeDistribution = Array.from(sizeMap.values()).map(item => ({
      ...item,
      utilization: item.count > 0 ? Math.min(100, Math.round((item.utilization / item.count) * 10)) : 0
    }))

    // Generate maintenance alerts based on booking history and dress condition
    const maintenanceAlerts = []

    // Find dresses that need maintenance based on usage
    const highUsageDresses = await Dress.find({
      ...supplierFilter,
      rentals: { $gte: 10 } // Dresses rented 10+ times need maintenance check
    }).select('_id name rentals lastMaintenance')

    for (const dress of highUsageDresses) {
      const lastMaintenance = dress.lastMaintenance || new Date(0)
      const daysSinceLastMaintenance = Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastMaintenance > 90) { // 3 months since last maintenance
        maintenanceAlerts.push({
          dressId: dress._id.toString(),
          dressName: dress.name,
          issue: `Maintenance overdue (${daysSinceLastMaintenance} days since last check)`,
          priority: daysSinceLastMaintenance > 180 ? 'high' as const : 'medium' as const
        })
      } else if (dress.rentals % 5 === 0) { // Every 5 rentals
        maintenanceAlerts.push({
          dressId: dress._id.toString(),
          dressName: dress.name,
          issue: `Scheduled maintenance check (${dress.rentals} rentals)`,
          priority: 'low' as const
        })
      }
    }

    const stats = {
      totalDresses: dressStats[0]?.totalDresses || 0,
      availableDresses: dressStats[0]?.availableDresses || 0,
      bookedDresses: dressStats[0]?.bookedDresses || 0,
      totalRevenue: dressStats[0]?.totalRevenue || 0,
      averageRating: dressStats[0]?.averageRating || 0,
      topPerformers: topPerformers.map((dress: any) => ({
        _id: dress._id,
        name: dress.name,
        bookingCount: dress.rentals,
        revenue: dress.rentals * dress.price,
        rating: dress.rating || 4.5
      })),
      categoryBreakdown: Array.from(categoryMap.values()),
      sizeDistribution,
      maintenanceAlerts,
      upcomingBookings: upcomingBookings.map(booking => ({
        dressId: (booking.dress as any)._id,
        dressName: (booking.dress as any).name,
        customerName: (booking.customer as any).fullName,
        date: booking.from,
        status: booking.status
      }))
    }

    res.json(stats)
  } catch (err) {
    logger.error(`[dress.getInventoryStats] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Bulk update dresses.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const bulkUpdateDresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dressIds, updates } = req.body

    if (!dressIds || !Array.isArray(dressIds) || dressIds.length === 0) {
      res.status(400).send('Dress IDs are required')
      return
    }

    if (!updates || typeof updates !== 'object') {
      res.status(400).send('Updates object is required')
      return
    }

    // Validate dress IDs
    const validIds = dressIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== dressIds.length) {
      res.status(400).send('Invalid dress IDs provided')
      return
    }

    // Perform bulk update
    const result = await Dress.updateMany(
      { _id: { $in: validIds } },
      { $set: updates }
    )

    if (result.modifiedCount === 0) {
      res.status(404).send('No dresses were updated')
      return
    }

    res.json({
      message: `Successfully updated ${result.modifiedCount} dresses`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    })
  } catch (err) {
    logger.error(`[dress.bulkUpdateDresses] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get all dresses.
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getDresses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const keyword = req.query.s as string
    const userType = req.user?.type
    const userId = req.user?.id

    // Ensure only admin and suppliers can access dress management
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Dress management requires admin or supplier privileges' })
      return
    }

    const options = {
      page,
      limit: size,
      sort: { name: 1 },
      lean: true, // Add lean for better performance
      populate: [
        {
          path: 'supplier',
          select: '_id fullName avatar',
          options: { lean: true }
        },
        {
          path: 'locations',
          select: '_id name',
          options: { lean: true }
        },
      ],
    }

    let query: any = {}

    // Add supplier filter for non-admin users
    if (userType !== bookcarsTypes.UserType.Admin) {
      query.supplier = userId
    }

    if (keyword) {
      const keywordQuery = {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { 'supplier.fullName': { $regex: keyword, $options: 'i' } },
        ],
      }

      if (Object.keys(query).length > 0) {
        query = { $and: [query, keywordQuery] }
      } else {
        query = keywordQuery
      }
    }

    const result = await Dress.paginate(query, options)

    // Convert relative image paths to full HTTP URLs for all dresses
    // And convert ObjectId fields to strings for proper serialization
    if (result.docs && Array.isArray(result.docs)) {
      result.docs.forEach((dress: any) => {
        // Convert _id to string
        if (dress._id) {
          dress._id = dress._id.toString()
        }

        // Convert supplier._id to string
        if (dress.supplier && dress.supplier._id) {
          dress.supplier._id = dress.supplier._id.toString()
        }

        // Convert locations array _ids to strings
        if (dress.locations && Array.isArray(dress.locations)) {
          dress.locations = dress.locations.map((loc: any) => ({
            _id: loc._id.toString(),
            name: loc.name
          }))
        }

        if (dress.images && Array.isArray(dress.images)) {
          dress.images = dress.images.map((img: string) => helper.getCdnUrl(img, 'dresses'))
        }

        // Convert supplier avatar to full URL if exists
        if (dress.supplier && dress.supplier.avatar) {
          dress.supplier.avatar = helper.getCdnUrl(dress.supplier.avatar, 'users')
        }
      })
    }

    // Transform response to match the expected format for frontend components
    const response = [{
      resultData: result.docs || [],
      pageInfo: [{ totalRecords: result.totalDocs || 0 }]
    }]

    res.json(response)
  } catch (err: any) {
    console.error(`[dressController.getDresses] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Get dress by ID.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getDress = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const dress = await Dress.findById(id)
      .populate('supplier', '_id fullName avatar')
      .populate('locations', '_id name')

    if (!dress) {
      res.sendStatus(204)
      return
    }

    // Convert ObjectId fields to strings for proper serialization
    const dressObj = dress.toObject()
    if (dressObj._id) {
      dressObj._id = dressObj._id.toString()
    }
    if (dressObj.supplier && dressObj.supplier._id) {
      dressObj.supplier._id = dressObj.supplier._id.toString()
    }
    if (dressObj.locations && Array.isArray(dressObj.locations)) {
      dressObj.locations = dressObj.locations.map((loc: any) => ({
        _id: loc._id.toString(),
        name: loc.name
      }))
    }

    // Convert relative image paths to full HTTP URLs
    if (dressObj.images && Array.isArray(dressObj.images)) {
      dressObj.images = dressObj.images.map((img: string) => helper.getCdnUrl(img, 'dresses'))
    }

    // Convert supplier avatar to full URL if exists
    if (dressObj.supplier && dressObj.supplier.avatar) {
      dressObj.supplier.avatar = helper.getCdnUrl(dressObj.supplier.avatar, 'users')
    }

    res.json(dressObj)
  } catch (err: any) {
    console.error(`[dressController.getDress] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Create a new dress.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      supplier,
      locations,
      price,
      discountedPrice,
      deposit,
      available,
      fullyBooked,
      comingSoon,
      type,
      size,
      style,
      color,
      length,
      material,
      cancellation,
      amendments,
      range,
      accessories,
      rating,
      rentals,
      designerName,
      dressCode,
      fittingRequired,
      alterationNotes,
      careInstructions,
      occasionTags,
      season,
      neckline,
      sleeves,
      silhouette
    } = req.body

    // Validate that the supplier exists
    if (supplier) {
      const supplierDoc = await User.findById(supplier)
      if (!supplierDoc) {
        res.status(400).json({ error: 'Supplier not found' })
        return
      }
      if (supplierDoc.type !== 'supplier' && supplierDoc.type !== 'admin') {
        res.status(400).json({ error: 'User is not a supplier or admin' })
        return
      }
    }

    // Generate dress code if not provided
    const generatedDressCode = dressCode || await generateDressCode()

    const dress = new Dress({
      name,
      supplier,
      locations,
      price,
      discountedPrice,
      deposit,
      available,
      fullyBooked,
      comingSoon,
      type,
      size,
      style,
      color,
      length,
      material,
      cancellation,
      amendments,
      range,
      accessories,
      rating,
      rentals,
      designerName,
      dressCode: generatedDressCode,
      fittingRequired,
      alterationNotes,
      careInstructions,
      occasionTags,
      season,
      neckline,
      sleeves,
      silhouette
    })

    await dress.save()
    res.json(dress)
  } catch (err: unknown) {
    console.error(`[dressController.create] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Update a dress.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { _id } = req.body
    const id = _id || req.params.id
    const {
      name,
      supplier,
      locations,
      price,
      discountedPrice,
      deposit,
      available,
      fullyBooked,
      comingSoon,
      type,
      size,
      color,
      length,
      material,
      cancellation,
      amendments,
      range,
      accessories,
      rating,
      rentals,
      designerName,
      dressCode,
      fittingRequired,
      alterationNotes,
      careInstructions,
      occasionTags,
      season,
      neckline,
      sleeves,
      silhouette
    } = req.body

    const dress = await Dress.findByIdAndUpdate(
      id,
      {
        name,
        supplier,
        locations,
        price,
        discountedPrice,
        deposit,
        available,
        fullyBooked,
        comingSoon,
        type,
        size,

        color,
        length,
        material,
        cancellation,
        amendments,
        range,
        accessories,
        rating,
        rentals,
        designerName,
        dressCode,
        fittingRequired,
        alterationNotes,
        careInstructions,
        occasionTags,
        season,
        neckline,
        sleeves,
        silhouette
      },
      { new: true }
    )

    if (!dress) {
      res.sendStatus(204)
      return
    }

    res.json(dress)
  } catch (err: unknown) {
    console.error(`[dressController.update] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Delete a dress.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteDress = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const dress = await Dress.findByIdAndDelete(id)

    if (!dress) {
      res.sendStatus(204)
      return
    }

    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`[dressController.deleteDress] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Check if a dress exists.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const checkDress = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const dress = await Dress.findById(id)

    if (!dress) {
      res.sendStatus(204)
      return
    }

    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`[dressController.checkDress] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Create a dress image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const createImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.sendStatus(400)
      return
    }

    const filename = helper.generateUniqueFilename(req.file.originalname)
    const tempPath = path.join(env.CDN_TEMP_DRESSES, filename)

    await fs.promises.writeFile(tempPath, req.file.buffer)

    res.json(filename)
  } catch (err: unknown) {
    console.error(`[dressController.createImage] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Update a dress image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.sendStatus(400)
      return
    }

    const id = req.params.id
    const dress = await Dress.findById(id)

    if (!dress) {
      res.sendStatus(204)
      return
    }

    const filename = helper.generateUniqueFilename(req.file.originalname)
    const tempPath = path.join(env.CDN_TEMP_DRESSES, filename)

    await fs.promises.writeFile(tempPath, req.file.buffer)

    res.json(filename)
  } catch (err: unknown) {
    console.error(`[dressController.updateImage] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Delete a dress image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const { imageFilename } = req.body
    const dress = await Dress.findById(id)

    if (!dress || !dress.images || dress.images.length === 0) {
      res.sendStatus(204)
      return
    }

    // If imageFilename is provided, delete specific image
    if (imageFilename) {
      const imageIndex = dress.images.indexOf(imageFilename)
      if (imageIndex === -1) {
        res.status(404).json({ error: 'Image not found' })
        return
      }

      const imagePath = path.join(env.CDN_DRESSES, imageFilename)
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath)
      }

      dress.images.splice(imageIndex, 1)
      await dress.save()
    } else {
      // Delete all images if no specific filename provided (backward compatibility)
      for (const image of dress.images) {
        const imagePath = path.join(env.CDN_DRESSES, image)
        if (fs.existsSync(imagePath)) {
          await fs.promises.unlink(imagePath)
        }
      }
      dress.images = []
      await dress.save()
    }

    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`[dressController.deleteImage] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Delete a temporary dress image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const deleteTempImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const image = req.params.image
    const imagePath = path.join(env.CDN_TEMP_DRESSES, image)

    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath)
    }

    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`[dressController.deleteTempImage] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Add multiple images to a dress.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const addImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const { imageFilenames } = req.body

    if (!imageFilenames || !Array.isArray(imageFilenames)) {
      res.status(400).json({ error: 'Image filenames array is required' })
      return
    }

    const dress = await Dress.findById(id)
    if (!dress) {
      res.sendStatus(204)
      return
    }

    // Initialize images array if it doesn't exist
    if (!dress.images) {
      dress.images = []
    }

    // Move images from temp to permanent storage and add to dress
    for (const filename of imageFilenames) {
      const tempPath = path.join(env.CDN_TEMP_DRESSES, filename)
      const destPath = path.join(env.CDN_DRESSES, filename)

      if (fs.existsSync(tempPath)) {
        await fs.promises.copyFile(tempPath, destPath)
        await fs.promises.unlink(tempPath)
        dress.images.push(filename)
      }
    }

    await dress.save()
    res.json({ message: 'Images added successfully', images: dress.images })
  } catch (err: unknown) {
    console.error(`[dressController.addImages] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Reorder dress images.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const reorderImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const { imageOrder } = req.body

    if (!imageOrder || !Array.isArray(imageOrder)) {
      res.status(400).json({ error: 'Image order array is required' })
      return
    }

    const dress = await Dress.findById(id)
    if (!dress) {
      res.sendStatus(204)
      return
    }

    // Validate that all images in the order exist in the dress
    if (!dress.images || dress.images.length === 0) {
      res.status(400).json({ error: 'Dress has no images to reorder' })
      return
    }

    const validImages = imageOrder.filter(img => dress.images.includes(img))
    if (validImages.length !== dress.images.length) {
      res.status(400).json({ error: 'Invalid image order: some images are missing or invalid' })
      return
    }

    dress.images = validImages
    await dress.save()

    res.json({ message: 'Images reordered successfully', images: dress.images })
  } catch (err: unknown) {
    console.error(`[dressController.reorderImages] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Upload multiple images for a dress.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const uploadMultipleImages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' })
      return
    }

    const filenames: string[] = []

    for (const file of req.files) {
      const filename = helper.generateUniqueFilename(file.originalname)
      const tempPath = path.join(env.CDN_TEMP_DRESSES, filename)

      await fs.promises.writeFile(tempPath, file.buffer)
      filenames.push(filename)
    }

    res.json({ filenames })
  } catch (err: unknown) {
    console.error(`[dressController.uploadMultipleImages] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get booking dresses.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getBookingDresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as bookcarsTypes.GetBookingDressesPayload

    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)

    const query = {
      supplier: new mongoose.Types.ObjectId(payload.supplier),
      locations: new mongoose.Types.ObjectId(payload.location),
    }

    const options = {
      page,
      limit: size,
      sort: { name: 1 },
      populate: [
        {
          path: 'supplier',
          select: '_id fullName avatar',
        },
        {
          path: 'locations',
          select: '_id name',
        },
      ],
    }

    const result = await Dress.paginate(query, options)

    // Transform response to match the expected format for frontend components
    const response = [{
      resultData: result.docs || [],
      pageInfo: [{ totalRecords: result.totalDocs || 0 }]
    }]

    res.json(response)
  } catch (err: unknown) {
    console.error(`[dressController.getBookingDresses] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get dress booking analytics for owners.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getDressAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    const dress = await Dress.findById(id).select('name bookingCount totalRevenue rentals rating')

    if (!dress) {
      res.sendStatus(204)
      return
    }

    const analytics = {
      dressId: dress._id,
      dressName: dress.name,
      bookingCount: dress.bookingCount || 0,
      totalRevenue: dress.totalRevenue || 0,
      rentals: dress.rentals || 0,
      rating: dress.rating || 0,
    }

    res.json(analytics)
  } catch (err: unknown) {
    console.error(`[dressController.getDressAnalytics] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get dress booking history for admin/owner.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getDressBookingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const history = await rentalCountService.getDressBookingHistory(id)
    res.json(history)
  } catch (err: unknown) {
    console.error(`[dressController.getDressBookingHistory] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get supplier analytics.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getSupplierAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplier } = req.params
    const analytics = await rentalCountService.getSupplierAnalytics(supplier)
    res.json(analytics)
  } catch (err: unknown) {
    console.error(`[dressController.getSupplierAnalytics] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get frontend dresses.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getFrontendDresses = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as bookcarsTypes.GetDressesPayload
  const page = Number.parseInt(req.params.page, 10)
  const size = Number.parseInt(req.params.size, 10)
  let query: any = { available: true }

  try {
    if (payload.suppliers && payload.suppliers.length > 0) {
      // Convert supplier IDs to ObjectIds for proper filtering
      try {
        const supplierObjectIds = payload.suppliers.map(id => new mongoose.Types.ObjectId(id))
        if (supplierObjectIds.length === 1) {
          query.supplier = supplierObjectIds[0]
        } else {
          query.supplier = { $in: supplierObjectIds }
        }
      } catch (error) {
        console.error('Error converting supplier IDs to ObjectIds:', error)
        // Fallback to string comparison (less efficient but should work)
        if (payload.suppliers.length === 1) {
          query.supplier = payload.suppliers[0]
        } else {
          query.supplier = { $in: payload.suppliers }
        }
      }
    }

    if (payload.location) {
      try {
        // Use $in operator since locations is an array field
        query.locations = { $in: [new mongoose.Types.ObjectId(payload.location)] }
      } catch {
        console.error(`Invalid location ID: ${payload.location}`)
      }
    }

    if (payload.dressType && payload.dressType.length > 0) {
      query.type = { $in: payload.dressType }
    }

    if (payload.dressSize && payload.dressSize.length > 0) {
      query.size = { $in: payload.dressSize }
    }

    if (payload.color) {
      query.color = payload.color
    }

    if (payload.deposit) {
      query.deposit = { $lte: payload.deposit }
    }

    if (payload.availability && payload.availability.length > 0) {
      if (payload.availability.includes('available')) {
        query.available = true
      }
      if (payload.availability.includes('unavailable')) {
        query.available = false
      }
    }

    if (payload.material && payload.material.length > 0) {
      query.material = { $in: payload.material }
    }

    if (payload.ranges && payload.ranges.length > 0) {
      query.range = { $in: payload.ranges }
    }

    if (payload.accessories && payload.accessories.length > 0) {
      query.accessories = { $in: payload.accessories }
    }

    if (payload.rating) {
      query.rating = { $gte: payload.rating }
    }

    if (!payload.includeAlreadyBookedDresses) {
      query.fullyBooked = false
    }

    if (!payload.includeComingSoonDresses) {
      query.comingSoon = false
    }


    // Use native Mongoose query for supplier filtering to avoid paginate plugin issues
    if (payload.suppliers && payload.suppliers.length > 0) {
      const skip = (page - 1) * size
      const dresses = await Dress.find(query)
        .populate('supplier', '_id fullName avatar')
        .populate('locations', '_id name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec()

      const totalDocs = await Dress.countDocuments(query)

      const result = [{
        resultData: dresses,
        pageInfo: [{ totalRecords: totalDocs }]
      }]

      res.json(result)
    } else {
      // Use aggregation to ensure proper population
      const skip = (page - 1) * size

      const aggregationPipeline = [
        { $match: query },
        { $sort: { name: 1 } },
        { $skip: skip },
        { $limit: size },
        {
          $lookup: {
            from: 'User',
            localField: 'supplier',
            foreignField: '_id',
            as: 'supplierInfo'
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'locations',
            foreignField: '_id',
            as: 'locationInfo'
          }
        },
        {
          $addFields: {
            supplier: {
              $cond: {
                if: { $gt: [{ $size: '$supplierInfo' }, 0] },
                then: {
                  _id: { $arrayElemAt: ['$supplierInfo._id', 0] },
                  fullName: { $arrayElemAt: ['$supplierInfo.fullName', 0] },
                  avatar: { $arrayElemAt: ['$supplierInfo.avatar', 0] }
                },
                else: null
              }
            },
            locations: {
              $map: {
                input: '$locationInfo',
                as: 'loc',
                in: {
                  _id: '$$loc._id',
                  name: '$$loc.name'
                }
              }
            }
          }
        },
        {
          $project: {
            supplierInfo: 0,
            locationInfo: 0
          }
        }
      ]

      const dresses = await Dress.aggregate(aggregationPipeline)
      const totalDocs = await Dress.countDocuments(query)

      const result = [{
        resultData: dresses,
        pageInfo: [{ totalRecords: totalDocs }]
      }]

      res.json(result)
    }
  } catch (err: unknown) {
    console.error(`[dressController.getFrontendDresses] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Update dress code (owner-only).
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateDressCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { dressCode } = req.body

    if (!dressCode || typeof dressCode !== 'string') {
      res.status(400).json({ error: 'Valid dress code is required' })
      return
    }

    // Check if dress code already exists
    const existingDress = await Dress.findOne({ dressCode, _id: { $ne: id } })
    if (existingDress) {
      res.status(400).json({ error: 'Dress code already exists' })
      return
    }

    const dress = await Dress.findByIdAndUpdate(
      id,
      { dressCode },
      { new: true }
    ).select('_id name dressCode')

    if (!dress) {
      res.status(404).json({ error: 'Dress not found' })
      return
    }

    res.json({
      message: 'Dress code updated successfully',
      dress: {
        _id: dress._id,
        name: dress.name,
        dressCode: dress.dressCode
      }
    })
  } catch (err: unknown) {
    console.error(`[dressController.updateDressCode] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get dress code (owner-only).
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getDressCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const dress = await Dress.findById(id).select('_id name dressCode supplier')

    if (!dress) {
      res.status(404).json({ error: 'Dress not found' })
      return
    }

    res.json({
      _id: dress._id,
      name: dress.name,
      dressCode: dress.dressCode,
      supplier: dress.supplier
    })
  } catch (err: unknown) {
    console.error(`[dressController.getDressCode] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Generate a new dress code for a dress (owner-only).
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const generateNewDressCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const dress = await Dress.findById(id).select('_id name dressCode supplier')

    if (!dress) {
      res.status(404).json({ error: 'Dress not found' })
      return
    }

    // Generate new dress code
    const newDressCode = await generateDressCode()

    // Update dress with new code
    const updatedDress = await Dress.findByIdAndUpdate(
      id,
      { dressCode: newDressCode },
      { new: true }
    ).select('_id name dressCode supplier')

    res.json({
      _id: updatedDress!._id,
      name: updatedDress!.name,
      dressCode: updatedDress!.dressCode,
      supplier: updatedDress!.supplier
    })
  } catch (err: unknown) {
    console.error(`[dressController.generateNewDressCode] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Validate dress code uniqueness.
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const validateDressCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dressCode } = req.params
    const { exclude } = req.query

    if (!dressCode || typeof dressCode !== 'string') {
      res.status(400).json({ error: 'Dress code is required' })
      return
    }

    const query: any = { dressCode }
    if (exclude && typeof exclude === 'string') {
      query._id = { $ne: new mongoose.Types.ObjectId(exclude) }
    }

    const existingDress = await Dress.findOne(query).select('_id name dressCode')

    res.json({
      isUnique: !existingDress,
      existingDress: existingDress ? {
        _id: existingDress._id,
        name: existingDress.name,
        dressCode: existingDress.dressCode
      } : null
    })
  } catch (err: unknown) {
    console.error(`[dressController.validateDressCode] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get all dress codes for a supplier (owner-only).
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getSupplierDressCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params

    // Verify supplier access
    if (req.user?.type !== 'admin' && req.user?.id !== supplierId) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    const dresses = await Dress.find({ supplier: supplierId })
      .select('_id name dressCode price available')
      .sort({ name: 1 })

    const dressCodes = dresses.map((dress: any) => ({
      _id: dress._id,
      name: dress.name,
      dressCode: dress.dressCode,
      price: dress.price,
      available: dress.available
    }))

    res.json(dressCodes)
  } catch (err: unknown) {
    console.error(`[dressController.getSupplierDressCodes] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
