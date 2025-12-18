import mongoose from 'mongoose'
import { generateMonthlyAnalytics } from '../services/monthlyAnalyticsService'
import User from '../models/User'
import * as bookcarsTypes from ':bookcars-types'
import * as logger from '../common/logger'
import * as env from '../config/env.config'

/**
 * BookDress Monthly Analytics Generation Script
 * Generates monthly analytics for suppliers in the dress rental system
 * Can be run manually or scheduled as a cron job
 */

const connectToDatabase = async () => {
  try {
    await mongoose.connect(env.DB_URI as string, {
      ssl: env.DB_SSL === true,
    })
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

const generateAnalyticsForAllSuppliers = async (year: number, month: number) => {
  try {
    logger.info(`Starting analytics generation for ${year}-${month}`)

    // Get all suppliers
    const suppliers = await User.find({ 
      type: bookcarsTypes.UserType.Supplier,
      verified: true,
      blacklisted: false
    }).select('_id fullName email')

    logger.info(`Found ${suppliers.length} suppliers`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const supplier of suppliers) {
      try {
        logger.info(`Generating analytics for supplier: ${supplier.fullName} (${supplier._id})`)
        
        const analytics = await generateMonthlyAnalytics(
          (supplier._id as any).toString(),
          year,
          month
        )

        results.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName,
          status: 'success',
          analytics: analytics._id
        })

        successCount++
        logger.info(`✓ Analytics generated for ${supplier.fullName}`)
      } catch (error) {
        logger.error(`✗ Failed to generate analytics for ${supplier.fullName}:`, error)
        
        results.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        errorCount++
      }
    }

    logger.info('Analytics generation completed:')
    logger.info(`- Successful: ${successCount}`)
    logger.info(`- Failed: ${errorCount}`)
    logger.info(`- Total: ${suppliers.length}`)

    return {
      year,
      month,
      totalSuppliers: suppliers.length,
      successCount,
      errorCount,
      results
    }
  } catch (error) {
    logger.error('Error in generateAnalyticsForAllSuppliers:', error)
    throw error
  }
}

const generateAnalyticsForSupplier = async (supplierId: string, year: number, month: number) => {
  try {
    logger.info(`Generating analytics for supplier ${supplierId} for ${year}-${month}`)

    const supplier = await User.findById(supplierId)
    if (!supplier) {
      throw new Error(`Supplier with ID ${supplierId} not found`)
    }

    const analytics = await generateMonthlyAnalytics(supplierId, year, month)
    
    logger.info(`✓ Analytics generated successfully for ${supplier.fullName}`)
    return analytics
  } catch (error) {
    logger.error(`✗ Failed to generate analytics for supplier ${supplierId}:`, error)
    throw error
  }
}

const generateAnalyticsForDateRange = async (
  supplierId: string | null,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
) => {
  try {
    const results = []
    let currentYear = startYear
    let currentMonth = startMonth

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      if (supplierId) {
        // Generate for specific supplier
        const analytics = await generateAnalyticsForSupplier(supplierId, currentYear, currentMonth)
        results.push({
          year: currentYear,
          month: currentMonth,
          supplierId,
          analytics: analytics._id
        })
      } else {
        // Generate for all suppliers
        const batchResult = await generateAnalyticsForAllSuppliers(currentYear, currentMonth)
        results.push(batchResult)
      }

      // Move to next month
      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    return results
  } catch (error) {
    logger.error('Error in generateAnalyticsForDateRange:', error)
    throw error
  }
}

// CLI interface
const main = async () => {
  try {
    await connectToDatabase()

    const args = process.argv.slice(2)
    const command = args[0]

    switch (command) {
      case 'current-month': {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        await generateAnalyticsForAllSuppliers(year, month)
        break
      }

      case 'previous-month': {
        const now = new Date()
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        const year = prevMonth.getFullYear()
        const month = prevMonth.getMonth() + 1
        await generateAnalyticsForAllSuppliers(year, month)
        break
      }

      case 'specific-month': {
        const year = parseInt(args[1])
        const month = parseInt(args[2])
        const supplierId = args[3] || null

        if (!year || !month || month < 1 || month > 12) {
          throw new Error('Invalid year or month. Usage: specific-month <year> <month> [supplierId]')
        }

        if (supplierId) {
          await generateAnalyticsForSupplier(supplierId, year, month)
        } else {
          await generateAnalyticsForAllSuppliers(year, month)
        }
        break
      }

      case 'date-range': {
        const startYear = parseInt(args[1])
        const startMonth = parseInt(args[2])
        const endYear = parseInt(args[3])
        const endMonth = parseInt(args[4])
        const supplierId = args[5] || null

        if (!startYear || !startMonth || !endYear || !endMonth) {
          throw new Error('Invalid date range. Usage: date-range <startYear> <startMonth> <endYear> <endMonth> [supplierId]')
        }

        await generateAnalyticsForDateRange(supplierId, startYear, startMonth, endYear, endMonth)
        break
      }

      case 'help':
      default: {
        console.log(`
BookDress Monthly Analytics Generator

Usage:
  npm run analytics:generate current-month
    - Generate analytics for current month for all suppliers

  npm run analytics:generate previous-month
    - Generate analytics for previous month for all suppliers

  npm run analytics:generate specific-month <year> <month> [supplierId]
    - Generate analytics for specific month
    - Example: npm run analytics:generate specific-month 2024 12
    - Example: npm run analytics:generate specific-month 2024 12 supplier123

  npm run analytics:generate date-range <startYear> <startMonth> <endYear> <endMonth> [supplierId]
    - Generate analytics for date range
    - Example: npm run analytics:generate date-range 2024 1 2024 12

  npm run analytics:generate help
    - Show this help message

Examples:
  npm run analytics:generate current-month
  npm run analytics:generate specific-month 2024 11
  npm run analytics:generate date-range 2024 1 2024 12
        `)
        break
      }
    }

    logger.info('Analytics generation script completed')
    process.exit(0)
  } catch (error) {
    logger.error('Analytics generation script failed:', error)
    process.exit(1)
  }
}

// Export functions for use in other modules
export {
  generateAnalyticsForAllSuppliers,
  generateAnalyticsForSupplier,
  generateAnalyticsForDateRange
}

// Run if called directly
if (require.main === module) {
  main()
}
