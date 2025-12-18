import mongoose, { ConnectOptions, Model } from 'mongoose'
import * as env from '../config/env.config'
import * as logger from './logger'
import Booking, { BOOKING_EXPIRE_AT_INDEX_NAME } from '../models/Booking'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import PushToken from '../models/PushToken'
import Token from '../models/Token'
import User, { USER_EXPIRE_AT_INDEX_NAME } from '../models/User'
import Country from '../models/Country'
import Dress from '../models/Dress'
import AccessorySettings from '../models/AccessorySettings'
import BankDetails from '../models/BankDetails'
import CustomerInsight from '../models/CustomerInsight'
import DressMaintenance from '../models/DressMaintenance'
import Expense from '../models/Expense'
import FittingAppointment from '../models/FittingAppointment'
import InventoryItem from '../models/InventoryItem'
import MonthlyAnalytics from '../models/MonthlyAnalytics'
import Payment from '../models/Payment'
import Revenue from '../models/Revenue'
import Review from '../models/Review'
import WeddingPackage from '../models/WeddingPackage'
import bcrypt from 'bcrypt'
import * as bookcarsTypes from ':bookcars-types'
// import { initializeDefaultData } from '../scripts/init-default-data' // Disabled for Atlas
import databaseSecurityService from '../services/DatabaseSecurityService'

/**
 * Connect to database.
 *
 * @export
 * @async
 * @param {string} uri
 * @param {boolean} ssl
 * @param {boolean} debug
 * @returns {Promise<boolean>}
 */
export const connect = async (uri: string, ssl: boolean, debug: boolean): Promise<boolean> => {
  // Debug: Log the URI being used (masked for security)
  logger.info('Database URI being used:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

  // Log whether we're using environment variable or default Atlas URI
  if (process.env.BC_DB_URI) {
    logger.info('✅ Using BC_DB_URI environment variable')
  } else {
    logger.info('⚠️ BC_DB_URI environment variable not found, using default Atlas URI')
  }

  let options: ConnectOptions = {
    serverSelectionTimeoutMS: 30000, // 30 seconds - reduced for faster failure detection
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds - reduced for faster failure detection
    family: 4, // Use IPv4, skip trying IPv6
    // Optimized connection pool settings for better performance
    maxPoolSize: 25, // Increased pool size for better concurrency
    minPoolSize: 5, // Maintain minimum connections for faster response
    maxIdleTimeMS: 30000, // Reduced idle time
    maxConnecting: 5, // Allow more concurrent connections
    bufferCommands: false, // Disable buffering to prevent timeout issues
    retryWrites: true, // Enable retryable writes for Atlas
    retryReads: true, // Enable retryable reads for Atlas
    // Performance optimizations
    compressors: ['zlib'], // Enable compression for better network performance
    zlibCompressionLevel: 6, // Balanced compression level
    readPreference: 'secondaryPreferred', // Use secondary reads when possible
    readConcern: { level: 'local' }, // Faster reads with local read concern
    writeConcern: { w: 'majority', j: true, wtimeout: 10000 }, // Ensure data durability
  }

  if (ssl) {
    options = {
      ...options,
      tls: true,
      tlsCertificateKeyFile: env.DB_SSL_CERT,
      tlsCAFile: env.DB_SSL_CA,
    }
  }

  mongoose.set('debug', debug)
  mongoose.set('bufferCommands', false) // Disable buffering to prevent timeout issues
  mongoose.Promise = globalThis.Promise

  try {
    // Check if database security is enabled
    const securityEnabled = process.env.BC_ENABLE_DATABASE_SECURITY === 'true'
    // const securityEnabled = false // Temporarily disabled to debug MongoDB query issue

    let connectionUri: string
    if (securityEnabled) {
      // Use secure connection string when security is enabled
      connectionUri = databaseSecurityService.createSecureConnectionString(uri)
      logger.info('Database security enabled - using secure connection string')
    } else {
      // Use original URI when security is disabled
      connectionUri = uri
      logger.info('Database security disabled - using direct connection')
    }

    logger.info('Attempting to connect to MongoDB Atlas...')
    logger.info('Connection URI (masked):', connectionUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

    try {
      await mongoose.connect(connectionUri, options)
      logger.info('✅ Database connected successfully and ready for operations')
    } catch (connectionError: any) {
      logger.error('❌ Failed to connect to MongoDB Atlas:', connectionError.message)

      // Provide helpful error messages based on error type
      if (connectionError.message.includes('ECONNREFUSED')) {
        logger.error('💡 Connection refused - check if MongoDB Atlas is accessible')
      } else if (connectionError.message.includes('authentication failed')) {
        logger.error('💡 Authentication failed - check username/password in connection string')
      } else if (connectionError.message.includes('timeout')) {
        logger.error('💡 Connection timeout - check network connectivity to Atlas')
      }

      throw connectionError
    }

    // Set up connection event handlers for better monitoring
    mongoose.connection.on('connected', () => {
      logger.info('Database connection re-established')
    })

    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database connection lost')
    })

    return true
  } catch (err) {
    logger.error('Cannot connect to the database:', err)
    logger.error('Connection details:', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    })
    return false
  }
}





/**
 * Close database connection.
 *
 * @export
 * @async
 * @param {boolean} force
 * @returns {Promise<void>}
 */
export const close = async (force: boolean = false): Promise<void> => {
  await mongoose.connection.close(force)
}

/**
 * Check if database connection is ready for operations
 *
 * @export
 * @returns {boolean}
 */
export const isConnectionReady = (): boolean => {
  return mongoose.connection.readyState === 1
}

/**
 * Middleware to ensure database connection is ready before processing requests
 * With buffering enabled, this allows operations to be queued until connection is ready
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 */
export const ensureConnection = (req: any, res: any, next: any): void => {
  const readyState = mongoose.connection.readyState

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  // With buffering enabled, we only block if completely disconnected
  if (readyState === 0) {
    logger.error(`Database connection not available for request: ${req.path}, ReadyState: ${readyState}`)
    return res.status(503).json({
      error: 'Database connection not available. Please try again in a moment.',
      code: 'DB_NOT_AVAILABLE'
    })
  }

  // Allow requests when connecting (2), connected (1), or disconnecting (3) since buffering handles queuing
  next()
}

/**
 * Initialize locations.
 * If a new language is added, english values will be added by default with the new language.
 * The new language values must be updated from the backend.
 *
 * @async
 * @returns {*}
 */
export const initializeLocations = async () => {
  try {
    logger.info('Initializing locations...')
    const locations = await Location.find({})
      .populate<{ values: env.LocationValue[] }>({
        path: 'values',
        model: 'LocationValue',
      })

    // Add missing LocationValues in env.LANGUAGES
    for (const location of locations) {
      const enLocationValue = location.values.find((val) => val.language === 'en')

      if (enLocationValue) {
        for (const lang of env.LANGUAGES) {
          if (!location.values.some((val) => val.language === lang)) {
            const langLocationValue = new LocationValue({ language: lang, value: enLocationValue.value })
            await langLocationValue.save()
            const loc = await Location.findById(location.id)
            if (loc) {
              loc.values.push(new mongoose.Types.ObjectId(String(langLocationValue.id)))
              await loc.save()
            }
          }
        }
      } else {
        logger.info('English value not found for location:', location.id)
      }
    }

    // Delete LocationValue not in env.LANGUAGES
    const values = await LocationValue.find({ language: { $nin: env.LANGUAGES } })
    const valuesIds = values.map((v) => v.id)
    for (const val of values) {
      const _locations = await Location.find({ values: val.id })
      for (const _location of _locations) {
        const valueIndex = _location.values.findIndex((v) => v.equals(val.id))
        if (valueIndex !== -1) {
          _location.values.splice(valueIndex, 1)
          await _location.save()
        }
      }
    }
    // Delete the orphaned LocationValue documents
    if (valuesIds.length > 0) {
      await LocationValue.deleteMany({ _id: { $in: valuesIds } })
    }

    logger.info('Locations initialized')
    return true
  } catch (err) {
    logger.error('Error while initializing locations:', err)
    return false
  }
}

/**
 * Initialize countries.
 * If a new language is added, english values will be added by default with the new language.
 * The new language values must be updated from the backend.
 *
 * @async
 * @returns {*}
 */
export const initializeCountries = async () => {
  try {
    logger.info('Initializing countries...')
    const countries = await Country.find({})
      .populate<{ values: env.LocationValue[] }>({
        path: 'values',
        model: 'LocationValue',
      })

    // Add missing LocationValues in env.LANGUAGES
    for (const country of countries) {
      const enLocationValue = country.values.find((val) => val.language === 'en')

      if (enLocationValue) {
        for (const lang of env.LANGUAGES) {
          if (!country.values.some((val) => val.language === lang)) {
            const langLocationValue = new LocationValue({ language: lang, value: enLocationValue.value })
            await langLocationValue.save()
            const cnt = await Country.findById(country.id)
            if (cnt) {
              cnt.values.push(new mongoose.Types.ObjectId(String(langLocationValue.id)))
              await cnt.save()
            }
          }
        }
      } else {
        logger.info('English value not found for country:', country.id)
      }
    }

    // Delete LocationValue nin env.LANGUAGES
    const values = await LocationValue.find({ language: { $nin: env.LANGUAGES } })
    const valuesIds = values.map((v) => v.id)
    for (const val of values) {
      const _countries = await Country.find({ values: val.id })
      for (const _country of _countries) {
        _country.values.splice(_country.values.findIndex((v) => v.equals(val.id)), 1)
        await _country.save()
        await LocationValue.deleteMany({ $and: [{ _id: { $in: _country.values } }, { _id: { $in: valuesIds } }] })
      }
    }

    logger.info('Countries initialized')
    return true
  } catch (err) {
    logger.error('Error while initializing countries:', err)
    return false
  }
}

/**
 * Initialize admin user.
 *
 * @async
 * @returns {*}
 */
export const initializeAdmin = async () => {
  try {
    logger.info('Initializing admin user...')

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      email: 'admin@bookdress.com',
      type: bookcarsTypes.UserType.Admin
    })

    if (existingAdmin) {
      logger.info('Admin user already exists')
      return true
    }

    // Create default admin user
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('admin123', salt)

    const adminUser = new User({
      email: 'admin@bookdress.com',
      fullName: 'BookDress Admin',
      password: passwordHash,
      language: 'en',
      type: bookcarsTypes.UserType.Admin,
      active: true,
      verified: true,
      blacklisted: false,
      enableEmailNotifications: true,
      phone: '0599123456',
      location: 'Jenin, Palestine',
      bio: 'Default admin user for BookDress application'
    })

    await adminUser.save()
    logger.info('Default admin user created successfully')
    logger.info('Email: admin@bookdress.com')
    logger.info('Password: admin123')
    logger.info('Please change the password after first login')

    return true
  } catch (err) {
    logger.error('Error while initializing admin user:', err)
    return false
  }
}

/**
 * Create Token TTL index. (Disabled for Atlas - indexes already exist)
 *
 * @async
 * @returns {Promise<void>}
 */
// const createTokenIndex = async (): Promise<void> => {
//   await Token.collection.createIndex({ expireAt: 1 }, { name: TOKEN_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.TOKEN_EXPIRE_AT, background: true })
// }

/**
 * Create Booking TTL index.
 *
 * @async
 * @returns {Promise<void>}
 */
const createBookingIndex = async (): Promise<void> => {
  await Booking.collection.createIndex({ expireAt: 1 }, { name: BOOKING_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.BOOKING_EXPIRE_AT, background: true })
}

/**
 * Create User TTL index.
 *
 * @async
 * @returns {Promise<void>}
 */
const createUserIndex = async (): Promise<void> => {
  await User.collection.createIndex({ expireAt: 1 }, { name: USER_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.USER_EXPIRE_AT, background: true })
}

const createCollection = async<T>(model: Model<T>) => {
  try {
    // Check if collection exists by trying to get indexes
    await model.collection.indexes()
    logger.info(`Collection ${model.collection.name} already exists, skipping creation`)
  } catch {
    try {
      // Only create collection, skip index creation since DB is already initialized
      await model.createCollection()
      logger.info(`Collection ${model.collection.name} created successfully`)

      // Skip index creation for Atlas - indexes should already exist
      // await model.createIndexes()
    } catch (error) {
      // Log error but don't crash the server
      logger.error(`Error creating collection ${model.collection.name}:`, error)
    }
  }
}

/**
 * Initialize database.
 *
 * @async
 * @returns {Promise<boolean>}
 */
export const initialize = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState) {
      // Core collections
      await createCollection<env.User>(User)
      await createCollection<env.Token>(Token)
      await createCollection<env.PushToken>(PushToken)

      // Location and country collections
      await createCollection<env.Country>(Country)
      await createCollection<env.Location>(Location)
      await createCollection<env.LocationValue>(LocationValue)

      // Dress and booking collections
      await createCollection<env.Dress>(Dress)
      await createCollection<env.Booking>(Booking)
      await createCollection<env.FittingAppointment>(FittingAppointment)

      // Payment and financial collections
      await createCollection<env.Payment>(Payment)
      await createCollection<env.Revenue>(Revenue)
      await createCollection<env.Expense>(Expense)
      await createCollection<env.BankDetails>(BankDetails)

      // Settings and configuration collections
      await createCollection<env.AccessorySettings>(AccessorySettings)
      await createCollection(WeddingPackage)

      // Analytics and insights collections
      await createCollection(MonthlyAnalytics)
      await createCollection<env.CustomerInsight>(CustomerInsight)
      await createCollection(Review)

      // Maintenance and inventory collections
      await createCollection<env.DressMaintenance>(DressMaintenance)
      await createCollection(InventoryItem)

      // Notification collections
      await createCollection<env.Notification>(Notification)
      await createCollection<env.NotificationCounter>(NotificationCounter)
    }

    //
    // Update Booking TTL index if configuration changes
    //
    const bookingIndexes = await Booking.collection.indexes()
    const bookingIndex = bookingIndexes.find((index) => index.name === BOOKING_EXPIRE_AT_INDEX_NAME && index.expireAfterSeconds !== env.BOOKING_EXPIRE_AT)
    if (bookingIndex) {
      try {
        await Booking.collection.dropIndex(bookingIndex.name!)
      } catch (err) {
        logger.error('Failed dropping Booking TTL index', err)
      } finally {
        await createBookingIndex()
        await Booking.createIndexes()
      }
    }

    //
    // Update User TTL index if configuration changes
    //
    const userIndexes = await User.collection.indexes()
    const userIndex = userIndexes.find((index) => index.name === USER_EXPIRE_AT_INDEX_NAME && index.expireAfterSeconds !== env.USER_EXPIRE_AT)
    if (userIndex) {
      try {
        await User.collection.dropIndex(userIndex.name!)
      } catch (err) {
        logger.error('Failed dropping User TTL index', err)
      } finally {
        await createUserIndex()
        await User.createIndexes()
      }
    }

    //
    // Skip Token TTL index update since database is already initialized on Atlas
    //
    logger.info('Skipping Token TTL index update - database already initialized on Atlas')

    //
    // Skip data initialization since database is already initialized on Atlas
    //
    logger.info('Skipping data initialization - database already initialized on Atlas')

    // Only initialize admin if needed (this is safe and won't create indexes)
    const adminInitialized = await initializeAdmin()

    return adminInitialized
  } catch (err) {
    logger.error('An error occured while initializing database:', err)
    return false
  }
}
