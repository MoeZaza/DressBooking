import Booking from '../models/Booking'
import Dress from '../models/Dress'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Update rental counts for dresses based on completed bookings.
 * This should be called periodically (e.g., daily via cron job).
 */
export const updateRentalCounts = async (): Promise<void> => {
  try {
    const now = new Date()
    
    // Find all bookings that have started (from date is in the past) 
    // and are not cancelled, and haven't been counted yet
    const completedBookings = await Booking.find({
      from: { $lt: now },
      status: { $ne: bookcarsTypes.BookingStatus.Cancelled },
      rentalCounted: { $ne: true }, // Add this field to track if rental was counted
    }).populate('dress')

    for (const booking of completedBookings) {
      if (booking.dress) {
        // Increment rental count and booking count
        await Dress.findByIdAndUpdate(booking.dress, {
          $inc: { 
            rentals: 1,
            bookingCount: 1,
            totalRevenue: booking.paidAmount || booking.price || 0
          }
        })

        // Mark this booking as counted
        await Booking.findByIdAndUpdate(booking._id, {
          rentalCounted: true
        })
      }
    }

    console.log(`Updated rental counts for ${completedBookings.length} bookings`)
  } catch (error) {
    console.error('Error updating rental counts:', error)
  }
}

/**
 * Get dress booking history for admin/owner.
 * This excludes customer personal details for privacy.
 */
export const getDressBookingHistory = async (dressId: string): Promise<any[]> => {
  try {
    const bookings = await Booking.find({ dress: dressId })
      .populate('location', 'name')
      .select('-customer') // Exclude customer details for privacy
      .sort({ from: -1 })

    // Return sanitized booking data
    return bookings.map(booking => ({
      _id: booking._id,
      from: booking.from,
      to: booking.to,
      status: booking.status,
      price: booking.price,
      paidAmount: booking.paidAmount,
      remainingAmount: booking.remainingAmount,
      paymentStatus: booking.paymentStatus,
      location: booking.location,
      fittingRequired: booking.fittingRequired,
      fittingDate: booking.fittingDate,
      alterationNotes: booking.alterationNotes,
      accessoriesIncluded: booking.accessoriesIncluded,
      createdAt: (booking as any).createdAt,
      updatedAt: (booking as any).updatedAt,
    }))
  } catch (error) {
    console.error('Error getting dress booking history:', error)
    throw error
  }
}

/**
 * Get supplier's overall booking analytics.
 */
export const getSupplierAnalytics = async (supplierId: string): Promise<any> => {
  try {
    // Get all dresses for this supplier
    const dresses = await Dress.find({ supplier: supplierId })
    
    // Calculate total analytics
    const totalDresses = dresses.length
    const totalBookings = dresses.reduce((sum: number, dress: any) => sum + (dress.bookingCount || 0), 0)
    const totalRentals = dresses.reduce((sum: number, dress: any) => sum + (dress.rentals || 0), 0)
    const totalRevenue = dresses.reduce((sum: number, dress: any) => sum + (dress.totalRevenue || 0), 0)
    
    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentBookings = await Booking.find({
      dress: { $in: dresses.map((d: any) => d._id) },
      createdAt: { $gte: thirtyDaysAgo }
    }).countDocuments()

    // Get top performing dresses
    const topDresses = dresses
      .sort((a: any, b: any) => (b.bookingCount || 0) - (a.bookingCount || 0))
      .slice(0, 5)
      .map((dress: any) => ({
        _id: dress._id,
        name: dress.name,
        bookingCount: dress.bookingCount || 0,
        totalRevenue: dress.totalRevenue || 0,
        rating: dress.rating || 0,
      }))

    return {
      totalDresses,
      totalBookings,
      totalRentals,
      totalRevenue,
      recentBookings,
      topDresses,
    }
  } catch (error) {
    console.error('Error getting supplier analytics:', error)
    throw error
  }
}
