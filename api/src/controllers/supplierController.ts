import path from 'node:path'
import asyncFs from 'node:fs/promises'
import escapeStringRegexp from 'escape-string-regexp'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import * as env from '../config/env.config'
import User from '../models/User'
import NotificationCounter from '../models/NotificationCounter'
import Notification from '../models/Notification'

import Booking from '../models/Booking'
import Dress from '../models/Dress'
import * as helper from '../common/helper'
import * as logger from '../common/logger'

/**
 * Validate Supplier by fullname.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const validate = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.ValidateSupplierPayload } = req
  const { fullName } = body

  try {
    const keyword = escapeStringRegexp(fullName)
    const options = 'i'
    const user = await User.findOne({
      type: bookcarsTypes.UserType.Supplier,
      fullName: { $regex: new RegExp(`^${keyword}$`), $options: options },
    })
    if (user) {
      res.sendStatus(204)
    } else {
      res.sendStatus(200)
    }
  } catch (err) {
    logger.error(`[supplier.validate] ${i18n.t('DB_ERROR')} ${fullName}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.UpdateSupplierPayload } = req
  const { _id } = body

  try {
    if (!helper.isValidObjectId(_id)) {
      throw new Error('body._id is not valid')
    }
    const supplier = await User.findById(_id)

    if (supplier) {
      const {
        fullName,
        phone,
        location,
        bio,
        payLater,


        priceChangeRate,
        supplierDressLimit,
        notifyAdminOnNewDress,
        blacklisted,
      } = body
      supplier.fullName = fullName
      supplier.phone = phone
      supplier.location = location
      supplier.bio = bio
      supplier.payLater = payLater


      supplier.priceChangeRate = priceChangeRate
      supplier.supplierDressLimit = supplierDressLimit
      supplier.notifyAdminOnNewDress = notifyAdminOnNewDress
      supplier.blacklisted = !!blacklisted

      await supplier.save()
      res.json({
        _id,
        fullName: supplier.fullName,
        phone: supplier.phone,
        location: supplier.location,
        bio: supplier.bio,
        avatar: supplier.avatar,
        payLater: supplier.payLater,
        contracts: supplier.contracts,
        priceChangeRate: supplier.priceChangeRate,
        supplierDressLimit: supplier.supplierDressLimit,
        notifyAdminOnNewDress: supplier.notifyAdminOnNewDress,
        blacklisted: supplier.blacklisted,
      })
      return
    }
    logger.error('[supplier.update] Supplier not found:', _id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[supplier.update] ${i18n.t('DB_ERROR')} ${_id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Supplier by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteSupplier = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const supplier = await User.findById(id)
    if (supplier) {
      await User.deleteOne({ _id: id })

      if (supplier.avatar) {
        const avatar = path.join(env.CDN_USERS, supplier.avatar)
        if (await helper.pathExists(avatar)) {
          await asyncFs.unlink(avatar)
        }
      }

      if (supplier.contracts && supplier.contracts.length > 0) {
        for (const contract of supplier.contracts) {
          if (contract.file) {
            const file = path.join(env.CDN_CONTRACTS, contract.file)
            if (await helper.pathExists(file)) {
              await asyncFs.unlink(file)
            }
          }
        }
      }

      await NotificationCounter.deleteMany({ user: id })
      await Notification.deleteMany({ user: id })
      await Booking.deleteMany({ supplier: id })
      const dresses = await Dress.find({ supplier: id })
      await Dress.deleteMany({ supplier: id })
      for (const dress of dresses) {
        if (dress.image) {
          const image = path.join(env.CDN_DRESSES, dress.image)
          if (await helper.pathExists(image)) {
            await asyncFs.unlink(image)
          }
        }
      }
    } else {
      res.sendStatus(204)
      return
    }
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[supplier.delete] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Supplier by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getSupplier = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const user = await User.findById(id).lean()

    if (!user) {
      logger.error('[supplier.getSupplier] Supplier not found:', id)
      res.sendStatus(204)
      return
    }
    const {
      _id,
      email,
      fullName,
      avatar,
      phone,
      location,
      bio,
      payLater,
      contracts,

      priceChangeRate,
      supplierDressLimit,
      notifyAdminOnNewDress,
      blacklisted,
    } = user

    res.json({
      _id,
      email,
      fullName,
      avatar,
      phone,
      location,
      bio,
      payLater,
      contracts,

      priceChangeRate,
      supplierDressLimit,
      notifyAdminOnNewDress,
      blacklisted,
    })
  } catch (err) {
    logger.error(`[supplier.getSupplier] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Suppliers.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    // Optimized query: Use simple find with lean() for better performance
    const matchQuery = {
      type: bookcarsTypes.UserType.Supplier,
      avatar: { $ne: null },
      fullName: { $regex: new RegExp(keyword, options) },
    }

    // Get suppliers with pagination
    const suppliers = await User.find(matchQuery)
      .select('fullName avatar email phone')
      .sort({ fullName: 1, _id: 1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean()

    // Get total count separately for better performance
    const totalRecords = await User.countDocuments(matchQuery)

    // Get dress counts in a separate optimized query
    const supplierIds = suppliers.map(s => s._id)
    const dressCounts = await Dress.aggregate([
      { $match: { supplier: { $in: supplierIds } } },
      { $group: { _id: '$supplier', count: { $sum: 1 } } }
    ])

    // Combine results and convert _id to string for proper serialization
    const suppliersWithCounts = suppliers.map(supplier => ({
      _id: supplier._id.toString(), // Convert ObjectId/Buffer to string
      fullName: supplier.fullName,
      avatar: supplier.avatar,
      dressCount: dressCounts.find((dc: any) => dc._id.equals(supplier._id))?.count || 0
    }))

    const data = [
      {
        resultData: suppliersWithCounts,
        pageInfo: [{ totalRecords }],
      },
    ]

    res.json(data)
  } catch (err) {
    logger.error(`[supplier.getSuppliers] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get all Suppliers.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    let data = await User.aggregate(
      [
        { $match: { type: bookcarsTypes.UserType.Supplier, avatar: { $ne: null } } },
        { $sort: { fullName: 1, _id: 1 } },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    data = data.map((supplier) => {
      const { _id, fullName, avatar } = supplier
      return { _id: _id.toString(), fullName, avatar } // Convert _id to string
    })

    res.json(data)
  } catch (err) {
    logger.error(`[supplier.getAllSuppliers] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Frontend Suppliers.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFrontendSuppliers = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.GetDressesPayload } = req
    const location = new mongoose.Types.ObjectId(body.location)
    const {
      dressType,
      size,

      deposit,
      dressSpecs,
      ranges,


    } = body

    // Ensure dressType and size are arrays for $in operator
    const dressTypeArray = Array.isArray(dressType) ? dressType : (dressType ? [dressType] : [])
    const sizeArray = Array.isArray(size) ? size : (size ? [size] : [])

    const $match: mongoose.FilterQuery<bookcarsTypes.Dress> = {
      $and: [
        { locations: location },
        ...(dressTypeArray.length > 0 ? [{ type: { $in: dressTypeArray } }] : []),
        ...(sizeArray.length > 0 ? [{ size: { $in: sizeArray } }] : []),

        { available: true },
        { fullyBooked: { $in: [false, null] } },
      ],
    }

    if (dressSpecs) {
      if (dressSpecs.premium) {
        $match.$and!.push({ premium: true })
      }
      if (dressSpecs.longDress) {
        $match.$and!.push({ length: { $gt: 150 } })
      }
      if (dressSpecs.embroidered) {
        $match.$and!.push({ embroidered: true })
      }
    }

    if (deposit && deposit > -1) {
      $match.$and!.push({ deposit: { $lte: deposit } })
    }

    if (ranges) {
      $match.$and!.push({ range: { $in: ranges } })
    }

    let $supplierMatch: mongoose.FilterQuery<any> = {}

    const data = await Dress.aggregate(
      [
        { $match },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$supplier' },
            pipeline: [
              {
                $match: {
                  // $expr: { $eq: ['$_id', '$$userId'] },
                  $and: [{ $expr: { $eq: ['$_id', '$$userId'] } }, { blacklisted: false }]
                },
              },
            ],
            as: 'supplier',
          },
        },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: false } },
        {
          $match: $supplierMatch,
        },

        // beginning of supplierDressLimit -----------------------------------
        {
          // Add the "supplierDressLimit" field from the supplier to limit the number of dresses per supplier
          $addFields: {
            maxAllowedDresses: { $ifNull: ['$supplier.supplierDressLimit', Number.MAX_SAFE_INTEGER] }, // Use a fallback if supplierDressLimit is undefined
          },
        },
        {
          // Add a custom stage to limit dresses per supplier
          $group: {
            _id: '$supplier._id', // Group by supplier
            supplierData: { $first: '$supplier' },
            dresses: { $push: '$$ROOT' }, // Push all dresses of the supplier into an array
            maxAllowedDresses: { $first: '$maxAllowedDresses' }, // Retain maxAllowedDresses for each supplier
          },
        },
        {
          // Limit dresses based on maxAllowedDresses for each supplier
          $project: {
            supplier: '$supplierData',
            dresses: {
              $cond: {
                if: { $eq: ['$maxAllowedDresses', 0] }, // If maxAllowedDresses is 0
                then: [], // Return an empty array (no dresses)
                else: { $slice: ['$dresses', 0, { $min: [{ $size: '$dresses' }, '$maxAllowedDresses'] }] }, // Otherwise, limit normally
              },
            },
          },
        },
        {
          // Flatten the grouped result and apply sorting
          $unwind: '$dresses',
        },
        {
          // Ensure unique dresses by grouping by dress ID
          $group: {
            _id: '$dresses._id',
            dress: { $first: '$dresses' },
          },
        },
        {
          $replaceRoot: { newRoot: '$dress' }, // Replace the root document with the unique dress object
        },
        // end of supplierDressLimit -----------------------------------

        {
          $group: {
            _id: '$supplier._id',
            fullName: { $first: '$supplier.fullName' },
            avatar: { $first: '$supplier.avatar' },
            dressCount: { $sum: 1 },
          },
        },
        { $sort: { fullName: 1 } },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )
    res.json(data)
  } catch (err) {
    logger.error(`[supplier.getFrontendSuppliers] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Backend Suppliers.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBackendSuppliers = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.GetDressesPayload } = req
    const {
      dressType,
      size,
      // mileage,
      deposit,
      availability,
      // fuelPolicy,
      dressSpecs,
      ranges,
      // multimedia,
      // rating,
      // seats,
    } = body
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const $match: mongoose.FilterQuery<bookcarsTypes.Dress> = {
      $and: [
        { name: { $regex: new RegExp(keyword, options) } },
      ],
    }

    if (dressSpecs) {
      if (dressSpecs.premium) {
        $match.$and!.push({ premium: true })
      }
      if (dressSpecs.longDress) {
        $match.$and!.push({ length: { $gt: 150 } })
      }
      if (dressSpecs.embroidered) {
        $match.$and!.push({ embroidered: true })
      }
    }

    if (dressType) {
      const dressTypeArray = Array.isArray(dressType) ? dressType : [dressType]
      $match.$and!.push({ type: { $in: dressTypeArray } })
    }

    if (size) {
      const sizeArray = Array.isArray(size) ? size : [size]
      $match.$and!.push({ size: { $in: sizeArray } })
    }

    // if (mileage) {
    //   if (mileage.length === 1 && mileage[0] === bookcarsTypes.RentalTerm.Limited) {
    //     $match.$and!.push({ rentalTerm: { $gt: -1 } })
    //   } else if (mileage.length === 1 && mileage[0] === bookcarsTypes.RentalTerm.Unlimited) {
    //     $match.$and!.push({ rentalTerm: -1 })
    //   } else if (mileage.length === 0) {
    //     res.json([])
    //     return
    //   }
    // }

    if (deposit && deposit > -1) {
      $match.$and!.push({ deposit: { $lte: deposit } })
    }

    if (Array.isArray(availability)) {
      if (availability.length === 1 && availability[0] === bookcarsTypes.Availablity.Available) {
        $match.$and!.push({ available: true })
      } else if (availability.length === 1 && availability[0] === bookcarsTypes.Availablity.Unavailable) {
        $match.$and!.push({ available: false })
      } else if (availability.length === 0) {
        res.json([])
        return
      }
    }

    if (ranges) {
      $match.$and!.push({ range: { $in: ranges } })
    }

    // if (multimedia && multimedia.length > 0) {
    //   for (const multimediaOption of multimedia) {
    //     $match.$and!.push({ multimedia: multimediaOption })
    //   }
    // }

    // if (rating && rating > -1) {
    //   $match.$and!.push({ rating: { $gte: rating } })
    // }

    // if (seats) {
    //   if (seats > -1) {
    //     if (seats === 6) {
    //       $match.$and!.push({ seats: { $gte: 5 } })
    //     } else {
    //       $match.$and!.push({ seats })
    //     }
    //   }
    // }

    const data = await Dress.aggregate(
      [
        { $match },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$supplier' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
            ],
            as: 'supplier',
          },
        },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$supplier._id',
            fullName: { $first: '$supplier.fullName' },
            avatar: { $first: '$supplier.avatar' },
            dressCount: { $sum: 1 },
          },
        },
        { $sort: { fullName: 1 } },
        // Convert _id from ObjectId to string for proper serialization
        {
          $project: {
            _id: { $toString: '$_id' },
            fullName: 1,
            avatar: 1,
            dressCount: 1,
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    res.json(data)
  } catch (err) {
    logger.error(`[supplier.getBackendSuppliers] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Upload a contract to temp folder.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createContract = async (req: Request, res: Response) => {
  const { language } = req.params

  try {
    if (!req.file) {
      throw new Error('req.file not found')
    }
    if (!req.file.originalname.includes('.')) {
      throw new Error('File extension not found')
    }
    if (language.length !== 2) {
      throw new Error('Language not valid')
    }

    const filename = `${nanoid()}_${language}${path.extname(req.file.originalname)}`
    const filepath = path.join(env.CDN_TEMP_CONTRACTS, filename)

    await asyncFs.writeFile(filepath, req.file.buffer)
    res.json(filename)
  } catch (err) {
    logger.error(`[supplier.createContract] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Update a contract.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateContract = async (req: Request, res: Response) => {
  const { id, language } = req.params
  const { file } = req

  try {
    if (!file) {
      throw new Error('req.file not found')
    }
    if (!file.originalname.includes('.')) {
      throw new Error('File extension not found')
    }
    if (!helper.isValidObjectId(id)) {
      throw new Error('Supplier Id not valid')
    }
    if (language.length !== 2) {
      throw new Error('Language not valid')
    }

    const supplier = await User.findOne({ _id: id, type: bookcarsTypes.UserType.Supplier })

    if (supplier) {
      const contract = supplier.contracts?.find((c) => c.language === language)
      if (contract?.file) {
        const contractFile = path.join(env.CDN_CONTRACTS, contract.file)
        if (await helper.pathExists(contractFile)) {
          await asyncFs.unlink(contractFile)
        }
      }

      const filename = `${supplier._id}_${language}${path.extname(file.originalname)}`
      const filepath = path.join(env.CDN_CONTRACTS, filename)

      await asyncFs.writeFile(filepath, file.buffer)
      if (!contract) {
        supplier.contracts?.push({ language, file: filename })
      } else {
        contract.file = filename
      }
      await supplier.save()
      res.json(filename)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[supplier.updateContract] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete a contract.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteContract = async (req: Request, res: Response) => {
  const { id, language } = req.params

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('Supplier Id not valid')
    }
    if (language.length !== 2) {
      throw new Error('Language not valid')
    }
    const supplier = await User.findOne({ _id: id, type: bookcarsTypes.UserType.Supplier })

    if (supplier) {
      const contract = supplier.contracts?.find((c) => c.language === language)
      if (contract?.file) {
        const contractFile = path.join(env.CDN_CONTRACTS, contract.file)
        if (await helper.pathExists(contractFile)) {
          await asyncFs.unlink(contractFile)
        }
        contract.file = null
      }

      await supplier.save()
      res.sendStatus(200)
      return
    }
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[supplier.deleteContract] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete a temp contract.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {*}
 */
export const deleteTempContract = async (req: Request, res: Response) => {
  const { file } = req.params

  try {
    if (!file.includes('.')) {
      throw new Error('Filename not valid')
    }
    const contractFile = path.join(env.CDN_TEMP_CONTRACTS, file)
    if (await helper.pathExists(contractFile)) {
      await asyncFs.unlink(contractFile)
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[supplier.deleteTempContract] ${i18n.t('DB_ERROR')} ${file}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}
