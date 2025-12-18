import mongoose from 'mongoose'
import Booking from '../models/Booking'
import Dress from '../models/Dress'
import User from '../models/User'
import Revenue from '../models/Revenue'
import Expense from '../models/Expense'
// Models will be imported when needed
import * as logger from '../common/logger'
import * as env from '../config/env.config'

/**
 * BookDress Data Validation and Cleanup Script
 * Ensures data integrity and removes orphaned records in the dress rental system
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

interface ValidationResult {
  collection: string
  totalRecords: number
  validRecords: number
  invalidRecords: number
  orphanedRecords: number
  fixedRecords: number
  deletedRecords: number
  issues: string[]
}

/**
 * Validate and clean booking data
 */
const validateBookings = async (fix: boolean = false): Promise<ValidationResult> => {
  const result: ValidationResult = {
    collection: 'bookings',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    orphanedRecords: 0,
    fixedRecords: 0,
    deletedRecords: 0,
    issues: []
  }

  try {
    const bookings = await Booking.find({})
    result.totalRecords = bookings.length

    for (const booking of bookings) {
      let isValid = true
      let isOrphaned = false

      // Check if customer exists
      if (booking.customer) {
        const customer = await User.findById(booking.customer)
        if (!customer) {
          isOrphaned = true
          result.issues.push(`Booking ${booking._id} has non-existent customer ${booking.customer}`)
        }
      }

      // Check if dress exists
      if (booking.dress) {
        const dress = await Dress.findById(booking.dress)
        if (!dress) {
          isOrphaned = true
          result.issues.push(`Booking ${booking._id} has non-existent dress ${booking.dress}`)
        }
      }

      // Check if supplier exists
      if (booking.supplier) {
        const supplier = await User.findById(booking.supplier)
        if (!supplier) {
          isOrphaned = true
          result.issues.push(`Booking ${booking._id} has non-existent supplier ${booking.supplier}`)
        }
      }

      // Validate dates
      if (booking.from && booking.to && booking.from >= booking.to) {
        isValid = false
        result.issues.push(`Booking ${booking._id} has invalid date range`)
        
        if (fix) {
          // Fix by setting end date to one day after start date
          booking.to = new Date(booking.from.getTime() + 24 * 60 * 60 * 1000)
          await booking.save()
          result.fixedRecords++
        }
      }

      // Validate price
      if (booking.price && booking.price < 0) {
        isValid = false
        result.issues.push(`Booking ${booking._id} has negative price`)
        
        if (fix) {
          booking.price = Math.abs(booking.price)
          await booking.save()
          result.fixedRecords++
        }
      }

      if (isOrphaned) {
        result.orphanedRecords++
        if (fix) {
          await Booking.findByIdAndDelete(booking._id)
          result.deletedRecords++
        }
      } else if (isValid) {
        result.validRecords++
      } else {
        result.invalidRecords++
      }
    }
  } catch (error) {
    logger.error('Error validating bookings:', error)
    result.issues.push(`Error validating bookings: ${error}`)
  }

  return result
}

/**
 * Validate and clean dress data
 */
const validateDresses = async (fix: boolean = false): Promise<ValidationResult> => {
  const result: ValidationResult = {
    collection: 'dresses',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    orphanedRecords: 0,
    fixedRecords: 0,
    deletedRecords: 0,
    issues: []
  }

  try {
    const dresses = await Dress.find({})
    result.totalRecords = dresses.length

    for (const dress of dresses) {
      let isValid = true
      let isOrphaned = false

      // Check if supplier exists
      if (dress.supplier) {
        const supplier = await User.findById(dress.supplier)
        if (!supplier) {
          isOrphaned = true
          result.issues.push(`Dress ${dress._id} has non-existent supplier ${dress.supplier}`)
        }
      }

      // Validate price
      if (dress.price && dress.price < 0) {
        isValid = false
        result.issues.push(`Dress ${dress._id} has negative price`)
        
        if (fix) {
          dress.price = Math.abs(dress.price)
          await dress.save()
          result.fixedRecords++
        }
      }

      // Validate required fields
      if (!dress.name || dress.name.trim() === '') {
        isValid = false
        result.issues.push(`Dress ${dress._id} has empty name`)
        
        if (fix) {
          dress.name = `Dress ${dress._id}`
          await dress.save()
          result.fixedRecords++
        }
      }

      if (isOrphaned) {
        result.orphanedRecords++
        if (fix) {
          await Dress.findByIdAndDelete(dress._id)
          result.deletedRecords++
        }
      } else if (isValid) {
        result.validRecords++
      } else {
        result.invalidRecords++
      }
    }
  } catch (error) {
    logger.error('Error validating dresses:', error)
    result.issues.push(`Error validating dresses: ${error}`)
  }

  return result
}

/**
 * Validate and clean revenue data
 */
const validateRevenues = async (fix: boolean = false): Promise<ValidationResult> => {
  const result: ValidationResult = {
    collection: 'revenues',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    orphanedRecords: 0,
    fixedRecords: 0,
    deletedRecords: 0,
    issues: []
  }

  try {
    const revenues = await Revenue.find({})
    result.totalRecords = revenues.length

    for (const revenue of revenues) {
      let isValid = true
      let isOrphaned = false

      // Check if supplier exists
      if (revenue.supplier) {
        const supplier = await User.findById(revenue.supplier)
        if (!supplier) {
          isOrphaned = true
          result.issues.push(`Revenue ${revenue._id} has non-existent supplier ${revenue.supplier}`)
        }
      }

      // Check if booking exists (if referenced)
      if (revenue.booking) {
        const booking = await Booking.findById(revenue.booking)
        if (!booking) {
          isOrphaned = true
          result.issues.push(`Revenue ${revenue._id} has non-existent booking ${revenue.booking}`)
        }
      }

      // Validate amount
      if (revenue.amount && revenue.amount < 0) {
        isValid = false
        result.issues.push(`Revenue ${revenue._id} has negative amount`)
        
        if (fix) {
          revenue.amount = Math.abs(revenue.amount)
          await revenue.save()
          result.fixedRecords++
        }
      }

      if (isOrphaned) {
        result.orphanedRecords++
        if (fix) {
          await Revenue.findByIdAndDelete(revenue._id)
          result.deletedRecords++
        }
      } else if (isValid) {
        result.validRecords++
      } else {
        result.invalidRecords++
      }
    }
  } catch (error) {
    logger.error('Error validating revenues:', error)
    result.issues.push(`Error validating revenues: ${error}`)
  }

  return result
}

/**
 * Validate and clean expense data
 */
const validateExpenses = async (fix: boolean = false): Promise<ValidationResult> => {
  const result: ValidationResult = {
    collection: 'expenses',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    orphanedRecords: 0,
    fixedRecords: 0,
    deletedRecords: 0,
    issues: []
  }

  try {
    const expenses = await Expense.find({})
    result.totalRecords = expenses.length

    for (const expense of expenses) {
      let isValid = true
      let isOrphaned = false

      // Check if supplier exists
      if (expense.supplier) {
        const supplier = await User.findById(expense.supplier)
        if (!supplier) {
          isOrphaned = true
          result.issues.push(`Expense ${expense._id} has non-existent supplier ${expense.supplier}`)
        }
      }

      // Validate amount
      if (expense.amount && expense.amount < 0) {
        isValid = false
        result.issues.push(`Expense ${expense._id} has negative amount`)
        
        if (fix) {
          expense.amount = Math.abs(expense.amount)
          await expense.save()
          result.fixedRecords++
        }
      }

      if (isOrphaned) {
        result.orphanedRecords++
        if (fix) {
          await Expense.findByIdAndDelete(expense._id)
          result.deletedRecords++
        }
      } else if (isValid) {
        result.validRecords++
      } else {
        result.invalidRecords++
      }
    }
  } catch (error) {
    logger.error('Error validating expenses:', error)
    result.issues.push(`Error validating expenses: ${error}`)
  }

  return result
}

/**
 * Run comprehensive data validation
 */
const runValidation = async (fix: boolean = false) => {
  logger.info(`Starting data validation${fix ? ' with fixes' : ' (read-only)'}`)

  const results = []

  // Validate each collection
  results.push(await validateBookings(fix))
  results.push(await validateDresses(fix))
  results.push(await validateRevenues(fix))
  results.push(await validateExpenses(fix))

  // Print summary
  logger.info('\n=== VALIDATION SUMMARY ===')
  
  let totalRecords = 0
  let totalValid = 0
  let totalInvalid = 0
  let totalOrphaned = 0
  let totalFixed = 0
  let totalDeleted = 0

  for (const result of results) {
    logger.info(`\n${result.collection.toUpperCase()}:`)
    logger.info(`  Total: ${result.totalRecords}`)
    logger.info(`  Valid: ${result.validRecords}`)
    logger.info(`  Invalid: ${result.invalidRecords}`)
    logger.info(`  Orphaned: ${result.orphanedRecords}`)
    if (fix) {
      logger.info(`  Fixed: ${result.fixedRecords}`)
      logger.info(`  Deleted: ${result.deletedRecords}`)
    }

    if (result.issues.length > 0) {
      logger.info('  Issues:')
      result.issues.forEach(issue => logger.info(`    - ${issue}`))
    }

    totalRecords += result.totalRecords
    totalValid += result.validRecords
    totalInvalid += result.invalidRecords
    totalOrphaned += result.orphanedRecords
    totalFixed += result.fixedRecords
    totalDeleted += result.deletedRecords
  }

  logger.info('\nOVERALL SUMMARY:')
  logger.info(`  Total Records: ${totalRecords}`)
  logger.info(`  Valid: ${totalValid}`)
  logger.info(`  Invalid: ${totalInvalid}`)
  logger.info(`  Orphaned: ${totalOrphaned}`)
  if (fix) {
    logger.info(`  Fixed: ${totalFixed}`)
    logger.info(`  Deleted: ${totalDeleted}`)
  }

  return results
}

// CLI interface
const main = async () => {
  try {
    await connectToDatabase()

    const args = process.argv.slice(2)
    const command = args[0]
    const fix = args.includes('--fix')

    switch (command) {
      case 'validate':
        await runValidation(fix)
        break

      case 'help':
      default:
        console.log(`
BookDress Data Validation and Cleanup Tool

Usage:
  npm run db:validate
    - Run validation in read-only mode (no changes)

  npm run db:validate:fix
    - Run validation and fix issues where possible

  npm run db:validate help
    - Show this help message

Examples:
  npm run db:validate
  npm run db:validate:fix
        `)
        break
    }

    logger.info('Data validation completed')
    process.exit(0)
  } catch (error) {
    logger.error('Data validation failed:', error)
    process.exit(1)
  }
}

// Export functions for use in other modules
export {
  validateBookings,
  validateDresses,
  validateRevenues,
  validateExpenses,
  runValidation
}

// Run if called directly
if (require.main === module) {
  main()
}
