import { Schema, model, Model } from 'mongoose'

export interface IMonthlyAnalytics {
  _id?: string
  supplier: string
  year: number
  month: number
  
  // Revenue metrics
  totalRevenue: number
  rentalRevenue: number
  serviceRevenue: number
  packageRevenue: number
  averageBookingValue: number
  
  // Booking metrics
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  pendingBookings: number
  cancellationRate: number
  
  // Dress metrics
  totalDresses: number
  activeDresses: number
  rentedDresses: number
  maintenanceDresses: number
  utilizationRate: number
  
  // Customer metrics
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerRetentionRate: number
  averageCustomerRating: number
  
  // Financial metrics
  totalExpenses: number
  operatingExpenses: number
  maintenanceExpenses: number
  marketingExpenses: number
  administrativeExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  
  // Performance metrics
  topPerformingDresses: Array<{
    dressId: string
    dressName: string
    bookings: number
    revenue: number
  }>
  topCustomers: Array<{
    customerId: string
    customerName: string
    bookings: number
    totalSpent: number
  }>
  
  // Category breakdown
  categoryBreakdown: Array<{
    category: string
    bookings: number
    revenue: number
    averagePrice: number
  }>
  
  // Size distribution
  sizeDistribution: Array<{
    size: string
    bookings: number
    revenue: number
    utilizationRate: number
  }>
  
  // Seasonal trends
  weeklyTrends: Array<{
    week: number
    bookings: number
    revenue: number
  }>
  
  // Quality metrics
  averageDressRating: number
  maintenanceIncidents: number
  customerComplaints: number
  onTimeDeliveryRate: number
  
  // Growth metrics
  revenueGrowth: number // compared to previous month
  bookingGrowth: number // compared to previous month
  customerGrowth: number // compared to previous month
  
  // Alerts and insights
  insights: Array<{
    type: 'trend' | 'alert' | 'opportunity' | 'warning'
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    actionRequired: boolean
  }>
  
  createdAt?: Date
  updatedAt?: Date
}

export interface IMonthlyAnalyticsModel extends Model<IMonthlyAnalytics> {
  getAnalyticsForPeriod(supplierId: string, year: number, month: number): Promise<IMonthlyAnalytics | null>
  getYearToDateAnalytics(supplierId: string, year: number): Promise<IMonthlyAnalytics[]>
  getGrowthComparison(supplierId: string, currentYear: number, currentMonth: number, previousYear: number, previousMonth: number): Promise<any>
}

const monthlyAnalyticsSchema = new Schema<IMonthlyAnalytics>({
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supplier is required'],
    index: true
  } as any,
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2050, 'Year must be 2050 or earlier']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  
  // Revenue metrics
  totalRevenue: { type: Number, default: 0, min: 0 },
  rentalRevenue: { type: Number, default: 0, min: 0 },
  serviceRevenue: { type: Number, default: 0, min: 0 },
  packageRevenue: { type: Number, default: 0, min: 0 },
  averageBookingValue: { type: Number, default: 0, min: 0 },
  
  // Booking metrics
  totalBookings: { type: Number, default: 0, min: 0 },
  confirmedBookings: { type: Number, default: 0, min: 0 },
  cancelledBookings: { type: Number, default: 0, min: 0 },
  pendingBookings: { type: Number, default: 0, min: 0 },
  cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
  
  // Dress metrics
  totalDresses: { type: Number, default: 0, min: 0 },
  activeDresses: { type: Number, default: 0, min: 0 },
  rentedDresses: { type: Number, default: 0, min: 0 },
  maintenanceDresses: { type: Number, default: 0, min: 0 },
  utilizationRate: { type: Number, default: 0, min: 0, max: 100 },
  
  // Customer metrics
  totalCustomers: { type: Number, default: 0, min: 0 },
  newCustomers: { type: Number, default: 0, min: 0 },
  returningCustomers: { type: Number, default: 0, min: 0 },
  customerRetentionRate: { type: Number, default: 0, min: 0, max: 100 },
  averageCustomerRating: { type: Number, default: 0, min: 0, max: 5 },
  
  // Financial metrics
  totalExpenses: { type: Number, default: 0, min: 0 },
  operatingExpenses: { type: Number, default: 0, min: 0 },
  maintenanceExpenses: { type: Number, default: 0, min: 0 },
  marketingExpenses: { type: Number, default: 0, min: 0 },
  administrativeExpenses: { type: Number, default: 0, min: 0 },
  grossProfit: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  
  // Performance metrics
  topPerformingDresses: [{
    dressId: { type: Schema.Types.ObjectId, ref: 'Dress' },
    dressName: String,
    bookings: { type: Number, min: 0 },
    revenue: { type: Number, min: 0 }
  }],
  topCustomers: [{
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    bookings: { type: Number, min: 0 },
    totalSpent: { type: Number, min: 0 }
  }],
  
  // Category breakdown
  categoryBreakdown: [{
    category: String,
    bookings: { type: Number, min: 0 },
    revenue: { type: Number, min: 0 },
    averagePrice: { type: Number, min: 0 }
  }],
  
  // Size distribution
  sizeDistribution: [{
    size: String,
    bookings: { type: Number, min: 0 },
    revenue: { type: Number, min: 0 },
    utilizationRate: { type: Number, min: 0, max: 100 }
  }],
  
  // Seasonal trends
  weeklyTrends: [{
    week: { type: Number, min: 1, max: 53 },
    bookings: { type: Number, min: 0 },
    revenue: { type: Number, min: 0 }
  }],
  
  // Quality metrics
  averageDressRating: { type: Number, default: 0, min: 0, max: 5 },
  maintenanceIncidents: { type: Number, default: 0, min: 0 },
  customerComplaints: { type: Number, default: 0, min: 0 },
  onTimeDeliveryRate: { type: Number, default: 100, min: 0, max: 100 },
  
  // Growth metrics
  revenueGrowth: { type: Number, default: 0 },
  bookingGrowth: { type: Number, default: 0 },
  customerGrowth: { type: Number, default: 0 },
  
  // Alerts and insights
  insights: [{
    type: {
      type: String,
      enum: ['trend', 'alert', 'opportunity', 'warning'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actionRequired: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  strict: true,
  collection: 'MonthlyAnalytics',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Compound index for unique supplier/year/month combination
monthlyAnalyticsSchema.index({ supplier: 1, year: 1, month: 1 }, { unique: true })

// Additional indexes for queries
monthlyAnalyticsSchema.index({ year: 1, month: 1 })
monthlyAnalyticsSchema.index({ totalRevenue: -1 })
monthlyAnalyticsSchema.index({ profitMargin: -1 })
monthlyAnalyticsSchema.index({ createdAt: -1 })

// Virtual for month name
monthlyAnalyticsSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[(this as any).month - 1]
})

// Virtual for period identifier
monthlyAnalyticsSchema.virtual('period').get(function() {
  return `${(this as any).year}-${(this as any).month.toString().padStart(2, '0')}`
})

// Static method to get analytics for a specific period
monthlyAnalyticsSchema.statics.getAnalyticsForPeriod = async function(
  supplierId: string,
  year: number,
  month: number
) {
  return await this.findOne({ supplier: supplierId, year, month })
}

// Static method to get year-to-date analytics
monthlyAnalyticsSchema.statics.getYearToDateAnalytics = async function(
  supplierId: string,
  year: number
) {
  return await this.find({ 
    supplier: supplierId, 
    year 
  }).sort({ month: 1 })
}

// Static method to get growth comparison
monthlyAnalyticsSchema.statics.getGrowthComparison = async function(
  supplierId: string,
  currentYear: number,
  currentMonth: number,
  previousYear: number,
  previousMonth: number
) {
  const [current, previous] = await Promise.all([
    this.findOne({ supplier: supplierId, year: currentYear, month: currentMonth }),
    this.findOne({ supplier: supplierId, year: previousYear, month: previousMonth })
  ])
  
  if (!current || !previous) {
    return null
  }
  
  return {
    current,
    previous,
    growth: {
      revenue: ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100,
      bookings: ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100,
      customers: ((current.totalCustomers - previous.totalCustomers) / previous.totalCustomers) * 100,
      profit: ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100
    }
  }
}

export default model<IMonthlyAnalytics, IMonthlyAnalyticsModel>('MonthlyAnalytics', monthlyAnalyticsSchema)
