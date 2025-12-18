import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'

/**
 * Simplified MongoDB Atlas initialization script
 * This script is optimized for MongoDB Atlas with better timeout handling
 */

const connectToAtlas = async (): Promise<boolean> => {
  try {
    logger.info('Connecting to MongoDB Atlas...')
    
    const options = {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000, // 60 seconds
      connectTimeoutMS: 60000, // 60 seconds
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    }

    // Disable buffering globally
    mongoose.set('bufferCommands', false)

    await mongoose.connect(env.DB_URI, options)
    logger.info('✅ Successfully connected to MongoDB Atlas')
    return true
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB Atlas:', error)
    return false
  }
}

const createAdminUser = async (): Promise<boolean> => {
  try {
    logger.info('Creating admin user...')
    
    const adminEmail = 'admin@bookdress.local'
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      logger.info('✅ Admin user already exists')
      return true
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = new User({
      email: adminEmail,
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

    await adminUser.save()
    logger.info('✅ Admin user created successfully')
    return true
  } catch (error) {
    logger.error('❌ Failed to create admin user:', error)
    return false
  }
}

const createDefaultCountry = async (): Promise<boolean> => {
  try {
    logger.info('Creating default country...')
    
    const existingCountry = await Country.findOne({ code: 'PS' })
    if (existingCountry) {
      logger.info('✅ Default country already exists')
      return true
    }

    const country = new Country({
      code: 'PS',
      name: 'Palestine',
    })

    await country.save()
    logger.info('✅ Default country created successfully')
    return true
  } catch (error) {
    logger.error('❌ Failed to create default country:', error)
    return false
  }
}

const createDefaultLocation = async (): Promise<boolean> => {
  try {
    logger.info('Creating default location...')
    
    const existingLocation = await Location.findOne({ name: 'Palestine' })
    if (existingLocation) {
      logger.info('✅ Default location already exists')
      return true
    }

    const location = new Location({
      name: 'Palestine',
      country: 'PS',
    })

    await location.save()

    // Create location values for different languages
    const locationValues = [
      {
        language: 'en',
        value: 'Palestine',
        location: location._id,
      },
      {
        language: 'ar',
        value: 'فلسطين',
        location: location._id,
      },
    ]

    for (const locationValue of locationValues) {
      const existing = await LocationValue.findOne({
        language: locationValue.language,
        location: locationValue.location,
      })
      
      if (!existing) {
        await new LocationValue(locationValue).save()
      }
    }

    logger.info('✅ Default location created successfully')
    return true
  } catch (error) {
    logger.error('❌ Failed to create default location:', error)
    return false
  }
}

const initializeDatabase = async (): Promise<boolean> => {
  try {
    logger.info('🚀 Starting MongoDB Atlas database initialization...')
    
    let success = true

    // Create admin user
    if (!(await createAdminUser())) {
      success = false
    }

    // Create default country
    if (!(await createDefaultCountry())) {
      success = false
    }

    // Create default location
    if (!(await createDefaultLocation())) {
      success = false
    }

    if (success) {
      logger.info('🎉 Database initialization completed successfully!')
      logger.info('')
      logger.info('📱 You can now access the application:')
      logger.info('   👗 Customer App:     http://localhost:3000')
      logger.info('   👑 Admin Dashboard:  http://localhost:3001')
      logger.info('   🔧 API Server:       http://localhost:4002')
      logger.info('')
      logger.info('🔐 Admin Login Credentials:')
      logger.info('   Email:    admin@bookdress.local')
      logger.info('   Password: admin123')
      logger.info('')
    } else {
      logger.error('❌ Some initialization tasks failed')
    }

    return success
  } catch (error) {
    logger.error('❌ Database initialization failed:', error)
    return false
  }
}

const main = async () => {
  try {
    // Connect to MongoDB Atlas
    if (!(await connectToAtlas())) {
      process.exit(1)
    }

    // Initialize database
    const success = await initializeDatabase()

    // Close connection
    await mongoose.disconnect()
    logger.info('🔌 Disconnected from MongoDB Atlas')

    process.exit(success ? 0 : 1)
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

export { initializeDatabase, connectToAtlas }
