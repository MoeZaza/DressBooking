import cron from 'node-cron'
import * as rentalCountService from './rentalCountService'

/**
 * Initialize scheduled tasks
 */
export const initializeScheduler = (): void => {
  // Run rental count update daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily rental count update...')
    try {
      await rentalCountService.updateRentalCounts()
      console.log('Daily rental count update completed successfully')
    } catch (error) {
      console.error('Error in daily rental count update:', error)
    }
  })

  // Run rental count update every hour during business hours (9 AM - 9 PM)
  cron.schedule('0 9-21 * * *', async () => {
    console.log('Running hourly rental count update...')
    try {
      await rentalCountService.updateRentalCounts()
      console.log('Hourly rental count update completed successfully')
    } catch (error) {
      console.error('Error in hourly rental count update:', error)
    }
  })

  console.log('Scheduler initialized with rental count update tasks')
}

/**
 * Manually trigger rental count update
 */
export const triggerRentalCountUpdate = async (): Promise<void> => {
  try {
    await rentalCountService.updateRentalCounts()
    console.log('Manual rental count update completed successfully')
  } catch (error) {
    console.error('Error in manual rental count update:', error)
    throw error
  }
}
