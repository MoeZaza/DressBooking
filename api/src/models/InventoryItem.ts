import { Schema, model, Model } from 'mongoose'

export interface IInventoryItem {
  _id?: string
  dress: string
  supplier: string
  status: 'available' | 'rented' | 'maintenance' | 'damaged' | 'retired'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  acquisitionDate: Date
  acquisitionCost: number
  currentValue: number
  depreciationRate: number
  maintenanceHistory: Array<{
    date: Date
    type: 'cleaning' | 'repair' | 'alteration' | 'inspection'
    description: string
    cost: number
    performedBy: string
    nextMaintenanceDate?: Date
  }>
  rentalHistory: Array<{
    booking: string
    customer: string
    startDate: Date
    endDate: Date
    rentalPrice: number
    condition: string
    notes?: string
  }>
  location: {
    section: string
    rack: string
    position: string
    lastMoved: Date
  }

  qualityMetrics: {
    totalRentals: number
    totalRevenue: number
    averageRentalPrice: number
    customerRating: number
    returnConditionScore: number
    maintenanceCostRatio: number
  }
  alerts: Array<{
    type: 'maintenance_due' | 'low_condition' | 'high_demand'
    message: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    createdAt: Date
    resolved: boolean
    resolvedAt?: Date
  }>
  tags: string[]
  notes: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IInventoryItemModel extends Model<IInventoryItem> {
  getInventorySummary(supplierId?: string): Promise<any[]>
}

const inventoryItemSchema = new Schema<IInventoryItem>({
  dress: {
    type: Schema.Types.ObjectId,
    ref: 'Dress',
    required: [true, 'Dress reference is required'],
    index: true
  } as any,
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supplier reference is required'],
    index: true
  } as any,
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'damaged', 'retired'],
    default: 'available',
    index: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'excellent',
    index: true
  },
  acquisitionDate: {
    type: Date,
    required: [true, 'Acquisition date is required'],
    default: Date.now
  },
  acquisitionCost: {
    type: Number,
    required: [true, 'Acquisition cost is required'],
    min: [0, 'Acquisition cost cannot be negative']
  },
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Current value cannot be negative']
  },
  depreciationRate: {
    type: Number,
    default: 0.1, // 10% per year
    min: [0, 'Depreciation rate cannot be negative'],
    max: [1, 'Depreciation rate cannot exceed 100%']
  },
  maintenanceHistory: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['cleaning', 'repair', 'alteration', 'inspection'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    performedBy: {
      type: String,
      required: true,
      trim: true
    },
    nextMaintenanceDate: Date
  }],
  rentalHistory: [{
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    rentalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    condition: {
      type: String,
      required: true
    },
    notes: String
  }],
  location: {
    section: {
      type: String,
      required: true,
      trim: true
    },
    rack: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    lastMoved: {
      type: Date,
      default: Date.now
    }
  },

  qualityMetrics: {
    totalRentals: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRentalPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    customerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    returnConditionScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    maintenanceCostRatio: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  alerts: [{
    type: {
      type: String,
      enum: ['maintenance_due', 'insurance_expiry', 'low_condition', 'high_demand'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  strict: true,
  collection: 'InventoryItem',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better query performance
inventoryItemSchema.index({ dress: 1, supplier: 1 }, { unique: true })
inventoryItemSchema.index({ status: 1, condition: 1 })
inventoryItemSchema.index({ 'location.section': 1, 'location.rack': 1 })
inventoryItemSchema.index({ 'alerts.type': 1, 'alerts.resolved': 1 })
inventoryItemSchema.index({ 'qualityMetrics.totalRevenue': -1 })
inventoryItemSchema.index({ acquisitionDate: 1 })

// Virtual for age in days
inventoryItemSchema.virtual('ageInDays').get(function() {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - (this as any).acquisitionDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Virtual for depreciated value
inventoryItemSchema.virtual('depreciatedValue').get(function() {
  const ageInYears = (this as any).ageInDays / 365
  const depreciation = (this as any).acquisitionCost * (this as any).depreciationRate * ageInYears
  return Math.max(0, (this as any).acquisitionCost - depreciation)
})

// Virtual for ROI
inventoryItemSchema.virtual('roi').get(function() {
  if ((this as any).acquisitionCost === 0) {
    return 0
  }
  return (((this as any).qualityMetrics.totalRevenue - (this as any).acquisitionCost) / (this as any).acquisitionCost) * 100
})

// Pre-save middleware to update quality metrics
inventoryItemSchema.pre('save', function(next) {
  // Update average rental price
  if ((this as any).qualityMetrics.totalRentals > 0) {
    (this as any).qualityMetrics.averageRentalPrice = (this as any).qualityMetrics.totalRevenue / (this as any).qualityMetrics.totalRentals
  }

  // Update maintenance cost ratio
  const totalMaintenanceCost = (this as any).maintenanceHistory.reduce((sum: number, maintenance: any) => sum + maintenance.cost, 0)
  if ((this as any).qualityMetrics.totalRevenue > 0) {
    (this as any).qualityMetrics.maintenanceCostRatio = (totalMaintenanceCost / (this as any).qualityMetrics.totalRevenue) * 100
  }

  next()
})

// Static method to get inventory summary
inventoryItemSchema.statics.getInventorySummary = async function(supplierId?: string) {
  const matchStage = supplierId ? { supplier: new Schema.Types.ObjectId(supplierId) } : {}
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: '$currentValue' },
        totalRevenue: { $sum: '$qualityMetrics.totalRevenue' },
        averageCondition: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$condition', 'excellent'] }, then: 4 },
            { case: { $eq: ['$condition', 'good'] }, then: 3 },
            { case: { $eq: ['$condition', 'fair'] }, then: 2 },
            { case: { $eq: ['$condition', 'poor'] }, then: 1 }
          ],
          default: 0
        }}},
        statusBreakdown: {
          $push: {
            status: '$status',
            count: 1
          }
        }
      }
    }
  ])
}

export default model<IInventoryItem, IInventoryItemModel>('InventoryItem', inventoryItemSchema)
