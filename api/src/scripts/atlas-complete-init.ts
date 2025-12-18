import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Dress from '../models/Dress'
import AccessorySettings from '../models/AccessorySettings'

/**
 * Complete MongoDB Atlas initialization script
 * This script ensures all indexes and default data are properly created
 */

const connectToAtlas = async (): Promise<boolean> => {
  try {
    logger.info('🔌 Connecting to MongoDB Atlas...')
    
    const options = {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
    }

    mongoose.set('bufferCommands', false)
    await mongoose.connect(env.DB_URI, options)
    
    logger.info('✅ Successfully connected to MongoDB Atlas')
    return true
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB Atlas:', error)
    return false
  }
}

const createAllIndexes = async (): Promise<boolean> => {
  try {
    logger.info('📊 Creating all database indexes...')

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true })
    await User.collection.createIndex({ type: 1 })
    await User.collection.createIndex({ verified: 1 })
    await User.collection.createIndex({ active: 1 })
    logger.info('✅ User indexes created')

    // Dress indexes - only create indexes not already defined in schema
    // Note: supplier, available, type, size, material, occasionTags, season, price, locations
    // are already covered by compound indexes in the Dress schema
    await Dress.collection.createIndex({ style: 1 })
    await Dress.collection.createIndex({ dressCode: 1 }, { unique: true, sparse: true })
    logger.info('✅ Dress indexes created')

    // Location indexes
    await Location.collection.createIndex({ supplier: 1 })
    await Location.collection.createIndex({ country: 1 })
    await Location.collection.createIndex({ values: 1 })
    logger.info('✅ Location indexes created')

    // Country indexes
    await Country.collection.createIndex({ values: 1 })
    await Country.collection.createIndex({ supplier: 1 })
    logger.info('✅ Country indexes created')

    // AccessorySettings indexes
    await AccessorySettings.collection.createIndex({ supplier: 1 }, { unique: true })
    await AccessorySettings.collection.createIndex({ isActive: 1 })
    logger.info('✅ AccessorySettings indexes created')

    logger.info('🎉 All database indexes created successfully')
    return true
  } catch (error) {
    logger.error('❌ Error creating indexes:', error)
    return false
  }
}

const createAdminUsers = async (): Promise<boolean> => {
  try {
    logger.info('👤 Creating admin users...')

    // Create the simple admin user (already exists)
    const existingSimpleAdmin = await User.findOne({ email: 'admin@bookdress.local' })
    if (!existingSimpleAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const simpleAdmin = new User({
        email: 'admin@bookdress.local',
        fullName: 'BookDress Admin',
        password: hashedPassword,
        type: 'admin',
        verified: true,
        blacklisted: false,
        language: 'ar',
        enableEmailNotifications: true,
        enableSmsNotifications: true,
        enablePushNotifications: true,
        avatar: '',
        bio: 'System Administrator',
        location: '',
        phone: '',
        birthDate: new Date('1990-01-01'),
      })
      await simpleAdmin.save()
      logger.info('✅ Simple admin user created (admin@bookdress.local)')
    }

    // Create the comprehensive admin user from the script
    const existingMainAdmin = await User.findOne({ email: 'admin@bookdress.ps' })
    if (!existingMainAdmin) {
      const hashedPassword = await bcrypt.hash('Admin2024!', 10)
      const mainAdmin = new User({
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
      await mainAdmin.save()
      logger.info('✅ Main admin user created (admin@bookdress.ps)')
    }

    return true
  } catch (error) {
    logger.error('❌ Error creating admin users:', error)
    return false
  }
}

const createDefaultSupplier = async () => {
  const existingSupplier = await User.findOne({ email: 'info@sofiaboutique.ps' })
  if (existingSupplier) {
    logger.info('✅ Default supplier already exists')
    return existingSupplier
  }

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
  logger.info('✅ Default supplier created')
  return supplier
}

const createPalestineCountry = async (supplierId: string) => {
  const existingCountry = await Country.findOne({ supplier: supplierId })
  if (existingCountry) {
    logger.info('✅ Palestine country already exists')
    return existingCountry
  }

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
  logger.info('✅ Palestine country created')
  return country
}

const createJeninLocation = async (countryId: string, supplierId: string) => {
  const existingLocation = await Location.findOne({ supplier: supplierId })
  if (existingLocation) {
    logger.info('✅ Jenin location already exists')
    return existingLocation
  }

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
    }),
    new LocationValue({
      language: 'ar',
      value: 'مدينة جنين'
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
  logger.info('✅ Jenin location created')
  return location
}

const createSampleDresses = async (supplierId: string, locationId: string) => {
  const existingDresses = await Dress.find({ supplier: supplierId })
  if (existingDresses.length > 0) {
    logger.info('✅ Sample dresses already exist')
    return
  }

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
  logger.info(`✅ Created ${sampleDresses.length} sample dresses`)
}

const createAccessorySettings = async (supplierId: string) => {
  const existingSettings = await AccessorySettings.findOne({ supplier: supplierId })
  if (existingSettings) {
    logger.info('✅ Accessory settings already exist')
    return
  }

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
  logger.info('✅ Created default accessory settings')
}

const updateUsersLanguage = async (): Promise<boolean> => {
  try {
    const result = await User.updateMany(
      { language: { $in: ['en', 'fr', 'es', null, undefined] } },
      { $set: { language: 'ar' } }
    )

    logger.info(`✅ Updated ${result.modifiedCount} users to use Arabic language`)
    return true
  } catch (error) {
    logger.error('❌ Error updating users language:', error)
    return false
  }
}

const createAllDefaultData = async (): Promise<boolean> => {
  try {
    logger.info('🏗️  Creating all default data...')

    // Create default supplier
    const supplier = await createDefaultSupplier()

    // Create Palestine country
    const country = await createPalestineCountry(supplier._id!.toString())

    // Create Jenin City location
    const location = await createJeninLocation(country._id!.toString(), supplier._id!.toString())

    // Create sample dresses
    await createSampleDresses(supplier._id!.toString(), location._id!.toString())

    // Create accessory settings
    await createAccessorySettings(supplier._id!.toString())

    // Update user languages
    await updateUsersLanguage()

    logger.info('🎉 All default data created successfully')
    return true
  } catch (error) {
    logger.error('❌ Error creating default data:', error)
    return false
  }
}

const checkCollections = async () => {
  try {
    const db = mongoose.connection.db
    if (!db) {
      logger.error('Database connection not available')
      return
    }

    const collections = await db.listCollections().toArray()
    logger.info(`📊 Database collections found: ${collections.length}`)

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments()
      logger.info(`   - ${collection.name}: ${count} documents`)
    }
  } catch (error) {
    logger.error('❌ Error checking collections:', error)
  }
}

const main = async () => {
  try {
    logger.info('🚀 Starting complete MongoDB Atlas initialization...')

    // Connect to Atlas
    if (!(await connectToAtlas())) {
      process.exit(1)
    }

    // Check current state
    await checkCollections()

    // Create all indexes
    if (!(await createAllIndexes())) {
      logger.error('❌ Failed to create indexes')
      process.exit(1)
    }

    // Create admin users
    if (!(await createAdminUsers())) {
      logger.error('❌ Failed to create admin users')
      process.exit(1)
    }

    // Create all default data
    if (!(await createAllDefaultData())) {
      logger.error('❌ Failed to create default data')
      process.exit(1)
    }

    // Check final state
    logger.info('📊 Final database state:')
    await checkCollections()

    logger.info('')
    logger.info('🎉 MongoDB Atlas initialization completed successfully!')
    logger.info('')
    logger.info('🔐 Admin Login Credentials:')
    logger.info('   📧 Email:    admin@bookdress.local')
    logger.info('   🔑 Password: admin123')
    logger.info('   📧 Email:    admin@bookdress.ps')
    logger.info('   🔑 Password: Admin2024!')
    logger.info('')
    logger.info('🏪 Supplier Login Credentials:')
    logger.info('   📧 Email:    info@sofiaboutique.ps')
    logger.info('   🔑 Password: supplier123')
    logger.info('')

    // Close connection
    await mongoose.disconnect()
    logger.info('🔌 Disconnected from MongoDB Atlas')

    process.exit(0)
  } catch (error) {
    logger.error('❌ Script execution failed:', error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('\n🛑 Script interrupted')
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect()
  }
  process.exit(0)
})

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
