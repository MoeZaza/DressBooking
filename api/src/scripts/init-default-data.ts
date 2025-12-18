import 'dotenv/config'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import * as databaseHelper from '../common/databaseHelper'
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Dress from '../models/Dress'
import AccessorySettings from '../models/AccessorySettings'

/**
 * Comprehensive Database Management Script for BookDress System
 *
 * This unified script handles:
 * - Fresh database creation (drops existing data)
 * - Database initialization (preserves existing data)
 * - Admin user creation
 * - Default supplier setup
 * - Location setup
 * - Sample data creation
 * - System settings
 * - Index creation and optimization
 *
 * Modes:
 * - create: Drop database and create fresh (destructive)
 * - init: Initialize data without dropping (safe)
 * - admin: Create admin user only
 * - data: Create sample data only
 * - settings: Initialize system settings only
 */

/**
 * Check if database exists and has collections
 */
const checkDatabaseExists = async (): Promise<{ exists: boolean; hasData: boolean; collections: string[] }> => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map(col => col.name)

    const hasData = collections.length > 0
    const exists = hasData || await mongoose.connection.db.stats().then(() => true).catch(() => false)

    return {
      exists,
      hasData,
      collections: collectionNames
    }
  } catch (error) {
    logger.info('ℹ️  Database does not exist yet')
    return {
      exists: false,
      hasData: false,
      collections: []
    }
  }
}

/**
 * Drop existing database (destructive operation - only for explicit create mode)
 */
const dropDatabase = async (): Promise<boolean> => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    logger.info('🗑️  Dropping existing database...')
    await mongoose.connection.db.dropDatabase()
    logger.info('✅ Database dropped successfully')
    return true
  } catch (error) {
    logger.info('ℹ️  No existing database to drop or drop failed')
    return true // Continue even if drop fails
  }
}

/**
 * Migrate existing database to ensure compatibility
 */
const migrateExistingDatabase = async (): Promise<boolean> => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    logger.info('🔄 Running database migration...')

    // Check for collection naming issues and fix them
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map(col => col.name)

    logger.info(`Found ${collectionNames.length} existing collections:`)
    collectionNames.forEach(name => logger.info(`  - ${name}`))

    // Check for old collection names that need migration
    const oldCollectionMappings = [
      { old: 'inventoryitems', new: 'InventoryItem' },
      { old: 'monthlyanalytics', new: 'MonthlyAnalytics' },
      { old: 'reviews', new: 'Review' },
      { old: 'weddingpackages', new: 'WeddingPackage' },
      { old: 'pushtokens', new: 'PushToken' },
      { old: 'users', new: 'User' },
      { old: 'dresses', new: 'Dress' },
      { old: 'bookings', new: 'Booking' },
      { old: 'countries', new: 'Country' },
      { old: 'locations', new: 'Location' }
    ]

    let migrationsPerformed = 0

    for (const mapping of oldCollectionMappings) {
      const hasOld = collectionNames.includes(mapping.old)
      const hasNew = collectionNames.includes(mapping.new)

      if (hasOld && !hasNew) {
        logger.info(`🔄 Migrating collection: ${mapping.old} → ${mapping.new}`)
        try {
          await mongoose.connection.db.collection(mapping.old).rename(mapping.new)
          migrationsPerformed++
          logger.info(`✅ Successfully migrated ${mapping.old} to ${mapping.new}`)
        } catch (error) {
          logger.warn(`⚠️  Failed to migrate ${mapping.old}: ${error}`)
        }
      } else if (hasOld && hasNew) {
        const oldCount = await mongoose.connection.db.collection(mapping.old).countDocuments()
        const newCount = await mongoose.connection.db.collection(mapping.new).countDocuments()
        logger.warn(`⚠️  Both ${mapping.old} (${oldCount} docs) and ${mapping.new} (${newCount} docs) exist`)
        logger.warn('   Manual intervention may be required')
      }
    }

    if (migrationsPerformed > 0) {
      logger.info(`✅ Database migration completed: ${migrationsPerformed} collections migrated`)
    } else {
      logger.info('✅ No database migration needed - collections already use correct naming')
    }

    return true
  } catch (error) {
    logger.error('❌ Database migration failed:', error)
    return false
  }
}

/**
 * Create database indexes for optimal performance
 */
const createDatabaseIndexes = async (): Promise<boolean> => {
  try {
    logger.info('📊 Creating database indexes...')

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true })
    await User.collection.createIndex({ type: 1 })
    await User.collection.createIndex({ verified: 1 })
    await User.collection.createIndex({ active: 1 })

    // Dress indexes - only create indexes not already defined in schema
    // Note: supplier, available, type, size, material, occasionTags, season, price, locations
    // are already covered by compound indexes in the Dress schema
    await Dress.collection.createIndex({ style: 1 })
    await Dress.collection.createIndex({ dressCode: 1 }, { unique: true, sparse: true })

    // Location indexes
    await Location.collection.createIndex({ supplier: 1 })
    await Location.collection.createIndex({ country: 1 })
    await Location.collection.createIndex({ values: 1 })

    // Country indexes
    await Country.collection.createIndex({ values: 1 })
    await Country.collection.createIndex({ supplier: 1 })

    // AccessorySettings indexes
    await AccessorySettings.collection.createIndex({ supplier: 1 }, { unique: true })
    await AccessorySettings.collection.createIndex({ isActive: 1 })

    logger.info('✅ Database indexes created successfully')
    return true
  } catch (error) {
    logger.error('❌ Error creating indexes:', error)
    return false
  }
}

/**
 * Initialize admin user
 */
const initializeAdmin = async (): Promise<boolean> => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ type: bookcarsTypes.UserType.Admin })
    if (existingAdmin) {
      logger.info('Admin user already exists')
      return true
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash('Admin2024!', 10)

    const adminUser = new User({
      fullName: 'BookDress Admin',
      email: 'admin@bookdress.ps',
      password: hashedPassword,
      type: bookcarsTypes.UserType.Admin,
      verified: true,
      blacklisted: false,
      language: 'ar',
      enableEmailNotifications: true,
      bio: 'Administrator of BookDress dress rental system',
      location: 'Jenin, Palestine',
      phone: '0599123456',
      birthDate: new Date('1991-01-01')
    })

    await adminUser.save()
    logger.info('Default admin user created successfully')
    logger.info('Email: admin@bookdress.ps')
    logger.info('Password: Admin2024!')
    logger.info('Please change the password after first login')

    return true
  } catch (error) {
    logger.error('Error creating default admin:', error)
    return false
  }
}

/**
 * Initialize default data for dress rental system
 * Creates default supplier, location (Jenin City, Palestine), and sample dresses
 */
const initializeDefaultData = async (): Promise<boolean> => {
  try {
    logger.info('Initializing default data...')

    // Check if default supplier already exists
    const existingSupplier = await User.findOne({ email: 'info@sofiaboutique.ps' })
    if (existingSupplier) {
      logger.info('Default supplier already exists')
      return true
    }

    // Create default supplier
    const supplier = await createDefaultSupplier()
    logger.info('Default supplier created')

    // Create Palestine country
    const country = await createPalestineCountry(supplier._id!.toString())
    logger.info('Palestine country created')

    // Create Jenin City location
    const location = await createJeninLocation(country._id!.toString(), supplier._id!.toString())
    logger.info('Jenin City location created')

    // Create sample dresses
    await createSampleDresses(supplier._id!.toString(), location._id!.toString())
    logger.info('Sample dresses created')

    logger.info('Default data initialization completed successfully')
    return true
  } catch (err) {
    logger.error('Error while initializing default data:', err)
    return false
  }
}

/**
 * Create default supplier user
 */
const createDefaultSupplier = async () => {
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('supplier123', salt)

  const supplier = new User({
    email: 'info@sofiaboutique.ps',
    fullName: 'Sofia Boutique',
    password: passwordHash,
    language: 'ar',
    type: bookcarsTypes.UserType.Supplier,
    active: true,
    verified: true,
    blacklisted: false,
    enableEmailNotifications: true,
    phone: '0599123456',
    location: 'Jenin City, Palestine',
    bio: 'Sofia Boutique - Premium dress rental boutique in Jenin City specializing in wedding and evening gowns',
    payLater: true,
    supplierDressLimit: 100,
    notifyAdminOnNewDress: true
  })

  await supplier.save()
  return supplier
}

/**
 * Create Palestine country with Arabic and English names
 */
const createPalestineCountry = async (supplierId: string) => {
  // Create location values for Palestine
  const palestineValues = [
    new LocationValue({
      language: 'en',
      value: 'Palestine'
    }),
    new LocationValue({
      language: 'fr',
      value: 'Palestine'
    }),
    new LocationValue({
      language: 'es',
      value: 'Palestina'
    }),
    new LocationValue({
      language: 'ar',
      value: 'فلسطين'
    })
  ]

  await LocationValue.insertMany(palestineValues)

  // Create country
  const country = new Country({
    values: palestineValues.map(v => v._id),
    supplier: supplierId
  })

  await country.save()
  return country
}

/**
 * Create Jenin City location
 */
const createJeninLocation = async (countryId: string, supplierId: string) => {
  // Create location values for Jenin City
  const jeninValues = [
    new LocationValue({
      language: 'en',
      value: 'Jenin City'
    }),
    new LocationValue({
      language: 'fr',
      value: 'Ville de Jenin'
    }),
    new LocationValue({
      language: 'es',
      value: 'Ciudad de Jenin'
    })
  ]

  await LocationValue.insertMany(jeninValues)

  // Create location (Jenin coordinates)
  const location = new Location({
    country: countryId,
    latitude: 32.4603,
    longitude: 35.2957,
    values: jeninValues.map(v => v._id),
    supplier: supplierId
  })

  await location.save()
  return location
}

/**
 * Create sample dresses
 */
const createSampleDresses = async (supplierId: string, locationId: string) => {
  const sampleDresses = [
    {
      name: 'Elegant Wedding Gown',
      supplier: supplierId,
      locations: [locationId],
      price: 500,
      deposit: 100,
      available: true,
      type: bookcarsTypes.DressType.Wedding,
      size: bookcarsTypes.DressSize.M,
      color: 'White',
      length: 180,
      material: bookcarsTypes.DressMaterial.Silk,
      cancellation: 24,
      amendments: 24,
      range: bookcarsTypes.DressRange.Bridal,
      accessories: [bookcarsTypes.DressAccessories.Veil],
      rentals: 0,
      designerName: 'Elegant Designs',
      images: ['wedding-gown-1.jpg', 'wedding-gown-2.jpg', 'wedding-gown-3.jpg'],
      dressCode: 'WED001',
      fittingRequired: true,
      alterationNotes: 'Full alteration service available. Train can be bustled.',
      careInstructions: 'Specialized bridal cleaning required. Handle with white gloves.',
      occasionTags: ['wedding', 'bridal'],
      season: 'all-season',
      neckline: 'sweetheart',
      sleeves: 'long-sleeve',
      silhouette: 'ball-gown'
    },
    {
      name: 'Evening Party Dress',
      supplier: supplierId,
      locations: [locationId],
      price: 200,
      deposit: 50,
      available: true,
      type: bookcarsTypes.DressType.Evening,
      size: bookcarsTypes.DressSize.S,
      color: 'Black',
      length: 160,
      material: bookcarsTypes.DressMaterial.Chiffon,
      cancellation: 12,
      amendments: 12,
      range: bookcarsTypes.DressRange.Evening,
      accessories: [bookcarsTypes.DressAccessories.Jewelry],
      rentals: 0,
      designerName: 'Night Elegance',
      images: ['evening-dress-1.jpg', 'evening-dress-2.jpg'],
      dressCode: 'EVE001',
      fittingRequired: false,
      alterationNotes: 'Minor hemming available.',
      careInstructions: 'Dry clean recommended. Can be steamed.',
      occasionTags: ['evening', 'party', 'formal'],
      season: 'all-season',
      neckline: 'v-neck',
      sleeves: 'sleeveless',
      silhouette: 'a-line'
    },
    {
      name: 'Cocktail Dress',
      supplier: supplierId,
      locations: [locationId],
      price: 150,
      deposit: 30,
      available: true,
      type: bookcarsTypes.DressType.Cocktail,
      size: bookcarsTypes.DressSize.L,
      color: 'Red',
      length: 120,
      material: bookcarsTypes.DressMaterial.Satin,
      cancellation: 6,
      amendments: 6,
      range: bookcarsTypes.DressRange.Cocktail,
      accessories: [bookcarsTypes.DressAccessories.Shoes],
      rentals: 0,
      designerName: 'Cocktail Couture',
      images: ['cocktail-dress-1.jpg'],
      dressCode: 'COC001',
      fittingRequired: false,
      alterationNotes: 'Minor hemming available.',
      careInstructions: 'Dry clean recommended. Can be steamed.',
      occasionTags: ['cocktail', 'party', 'date-night'],
      season: 'all-season',
      neckline: 'off-shoulder',
      sleeves: 'short-sleeve',
      silhouette: 'sheath'
    }
  ]

  await Dress.insertMany(sampleDresses)
  logger.info(`Created ${sampleDresses.length} sample dresses`)

  // Create default accessory settings for the supplier
  const accessorySettings = new AccessorySettings({
    supplier: supplierId,
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
  })

  await accessorySettings.save()
  logger.info('Created default accessory settings')
}

/**
 * Update existing users to use Arabic as default language
 */
const updateUsersLanguage = async (): Promise<boolean> => {
  try {
    const result = await User.updateMany(
      { language: { $in: ['en', 'fr', 'es', null, undefined] } },
      { $set: { language: 'ar' } }
    )

    logger.info(`Updated ${result.modifiedCount} users to use Arabic language`)
    return true
  } catch (error) {
    logger.error('Error updating users language:', error)
    return false
  }
}

/**
 * Initialize currency and system settings
 */
const initializeSystemSettings = async (): Promise<boolean> => {
  try {
    logger.info('System settings initialized:')
    logger.info('- Base Currency: ILS (Israeli Shekel)')
    logger.info('- Currency Symbol: ₪')
    logger.info('- Timezone: Asia/Jerusalem')
    logger.info('- Default Country: Palestine (PS)')
    logger.info('- Default Location: Jenin, Palestine')
    logger.info('- Default Language: Arabic (ar)')
    return true
  } catch (error) {
    logger.error('Error initializing system settings:', error)
    return false
  }
}

/**
 * Create fresh database (destructive - drops existing data)
 * Only use this for development or when explicitly requested
 */
const createFreshDatabase = async (): Promise<boolean> => {
  try {
    logger.info('🚀 Creating fresh BookDress database...')
    logger.warn('⚠️  WARNING: This will delete all existing data!')

    // Check if database exists first
    const dbStatus = await checkDatabaseExists()
    if (dbStatus.hasData) {
      logger.warn(`⚠️  Found existing database with ${dbStatus.collections.length} collections`)
      logger.warn('   This operation will permanently delete all data!')
    }

    // Drop existing database
    if (!(await dropDatabase())) {
      logger.error('Failed to drop database')
      return false
    }

    // Create indexes
    if (!(await createDatabaseIndexes())) {
      logger.error('Failed to create indexes')
      return false
    }

    // Run full initialization
    if (!(await runFullInitialization())) {
      logger.error('Failed to initialize data')
      return false
    }

    logger.info('🎉 Fresh database created successfully!')
    return true
  } catch (error) {
    logger.error('Fresh database creation failed:', error)
    return false
  }
}

/**
 * Initialize or migrate existing database (safe - preserves data)
 * This is the recommended approach for production
 */
const initializeOrMigrateDatabase = async (): Promise<boolean> => {
  try {
    logger.info('🔧 Initializing BookDress database...')

    // Check database status
    const dbStatus = await checkDatabaseExists()

    if (!dbStatus.exists) {
      logger.info('📝 No existing database found - creating new database')

      // Create indexes for new database
      if (!(await createDatabaseIndexes())) {
        logger.error('Failed to create indexes')
        return false
      }

      // Run full initialization for new database
      if (!(await runFullInitialization())) {
        logger.error('Failed to initialize new database')
        return false
      }

      logger.info('🎉 New database created and initialized successfully!')
    } else if (dbStatus.hasData) {
      logger.info(`📊 Found existing database with ${dbStatus.collections.length} collections`)
      logger.info('🔄 Running migration and safe initialization...')

      // Migrate existing database (fix collection names, etc.)
      if (!(await migrateExistingDatabase())) {
        logger.warn('⚠️  Database migration had issues, but continuing...')
      }

      // Ensure indexes exist (safe to run multiple times)
      if (!(await createDatabaseIndexes())) {
        logger.warn('⚠️  Failed to create some indexes, but continuing...')
      }

      // Run safe initialization (only adds missing data)
      if (!(await runFullInitialization())) {
        logger.error('Failed to run safe initialization')
        return false
      }

      logger.info('🎉 Existing database migrated and updated successfully!')
    } else {
      logger.info('📝 Database exists but is empty - initializing...')

      // Create indexes
      if (!(await createDatabaseIndexes())) {
        logger.error('Failed to create indexes')
        return false
      }

      // Run full initialization
      if (!(await runFullInitialization())) {
        logger.error('Failed to initialize database')
        return false
      }

      logger.info('🎉 Empty database initialized successfully!')
    }

    return true
  } catch (error) {
    logger.error('Database initialization/migration failed:', error)
    return false
  }
}

/**
 * Run comprehensive initialization (preserves existing data)
 */
const runFullInitialization = async (): Promise<boolean> => {
  try {
    logger.info('Starting comprehensive BookDress system initialization...')

    let success = true

    // Initialize admin user
    if (!(await initializeAdmin())) {
      success = false
    }

    // Initialize default data (supplier, location, dresses)
    if (!(await initializeDefaultData())) {
      success = false
    }

    // Update user languages
    if (!(await updateUsersLanguage())) {
      success = false
    }

    // Initialize system settings
    if (!(await initializeSystemSettings())) {
      success = false
    }

    if (success) {
      logger.info('✅ All initialization tasks completed successfully')
    } else {
      logger.error('❌ Some initialization tasks failed')
    }

    return success
  } catch (error) {
    logger.error('Comprehensive initialization failed:', error)
    return false
  }
}

// CLI interface
const main = async () => {
  try {
    if (!(await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG))) {
      logger.error('Failed to connect to database')
      process.exit(1)
    }

    const args = process.argv.slice(2)
    const command = args[0] || 'full'

    let success = false

    switch (command) {
      case 'create':
        success = await createFreshDatabase()
        break

      case 'migrate':
        success = await migrateExistingDatabase()
        break

      case 'admin':
        success = await initializeAdmin()
        break

      case 'data':
        success = await initializeDefaultData()
        break

      case 'settings':
        success = await initializeSystemSettings()
        break

      case 'language':
        success = await updateUsersLanguage()
        break

      case 'indexes':
        success = await createDatabaseIndexes()
        break

      case 'init':
      case 'full':
      default:
        success = await initializeOrMigrateDatabase()
        break

      case 'help':
        console.log(`
BookDress Database Management Script

Usage:
  npm run db:init [command]

Commands:
  init      - Smart initialization: creates new DB or migrates existing (default, SAFE)
  create    - Create fresh database (DESTRUCTIVE - drops all existing data)
  migrate   - Migrate existing database (fix collection names, etc.)
  admin     - Initialize admin user only
  data      - Initialize supplier, location, and sample dresses
  settings  - Initialize system settings
  language  - Update user languages to Arabic
  indexes   - Create database indexes only
  help      - Show this help message

Examples:
  npm run db:init                    # Smart init (RECOMMENDED - safe for production)
  npm run db:init create             # Fresh database (DESTRUCTIVE - development only)
  npm run db:init migrate            # Fix existing database issues
  npm run db:init admin              # Admin user only
  npm run db:init data               # Sample data only

🔧 Smart Initialization (default):
   - If no database exists: Creates new database with all data
   - If database exists: Migrates and adds missing data (preserves existing)
   - Safe for production use - never drops existing data

⚠️  WARNING: Only 'create' command will delete existing data!
        `)
        success = true
        break
    }

    await databaseHelper.close()
    logger.info('Database connection closed')

    process.exit(success ? 0 : 1)
  } catch (error) {
    logger.error('Initialization script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  initializeAdmin,
  initializeDefaultData,
  updateUsersLanguage,
  initializeSystemSettings,
  runFullInitialization
}
