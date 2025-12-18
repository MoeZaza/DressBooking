import { Schema, model, Model } from 'mongoose'
import * as env from '../config/env.config'

const accessorySettingsSchema = new Schema<env.AccessorySettings>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accessoryPrices: {
      veil: {
        type: Number,
        default: 50,
        min: 0,
      },
      jewelry: {
        type: Number,
        default: 30,
        min: 0,
      },
      shoes: {
        type: Number,
        default: 25,
        min: 0,
      },
      headpiece: {
        type: Number,
        default: 40,
        min: 0,
      },
      handbag: {
        type: Number,
        default: 20,
        min: 0,
      },
      gloves: {
        type: Number,
        default: 15,
        min: 0,
      },
      hairAccessories: {
        type: Number,
        default: 25,
        min: 0,
      },
      undergarments: {
        type: Number,
        default: 35,
        min: 0,
      },
      wrapShawl: {
        type: Number,
        default: 30,
        min: 0,
      },
    },
    defaultAccessoryFee: {
      type: Number,
      default: 50,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ILS',
      enum: ['USD', 'EUR', 'ILS', 'GBP'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'AccessorySettings',
  }
)

// Ensure one settings document per supplier
accessorySettingsSchema.index({ supplier: 1 }, { unique: true })

// Instance methods
accessorySettingsSchema.methods.getAccessoryPrice = function(accessoryType: string): number {
  const normalizedType = accessoryType.toLowerCase().replace(/[^a-z]/g, '')
  
  // Map accessory types to schema fields
  const typeMapping: { [key: string]: string } = {
    'veil': 'veil',
    'jewelry': 'jewelry',
    'shoes': 'shoes',
    'headpiece': 'headpiece',
    'handbag': 'handbag',
    'gloves': 'gloves',
    'hairaccessories': 'hairAccessories',
    'undergarments': 'undergarments',
    'wrapshawl': 'wrapShawl',
    'wrap': 'wrapShawl',
    'shawl': 'wrapShawl',
  }
  
  const mappedType = typeMapping[normalizedType]
  if (mappedType && this.accessoryPrices[mappedType] !== undefined) {
    return this.accessoryPrices[mappedType]
  }
  
  return this.defaultAccessoryFee
}

accessorySettingsSchema.methods.calculateAccessoriesTotal = function(accessories: string[]): number {
  if (!accessories || accessories.length === 0) {
    return 0
  }
  
  return accessories.reduce((total, accessory) => {
    return total + this.getAccessoryPrice(accessory)
  }, 0)
}

// Static methods
accessorySettingsSchema.statics.getForSupplier = async function(supplierId: string) {
  let settings = await this.findOne({ supplier: supplierId })

  if (!settings) {
    // Create default settings for supplier
    settings = new this({
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
    })
    await settings.save()
  }

  return settings
}

accessorySettingsSchema.statics.updateForSupplier = async function(
  supplierId: string,
  updates: Partial<env.AccessorySettings>,
  updatedBy: string
) {
  return this.findOneAndUpdate(
    { supplier: supplierId },
    {
      ...updates,
      lastUpdatedBy: updatedBy,
      updatedAt: new Date()
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  )
}

// Define interface for static methods
interface AccessorySettingsModel extends Model<env.AccessorySettings> {
  getForSupplier(supplierId: string): Promise<env.AccessorySettings>
  updateForSupplier(supplierId: string, updates: Partial<env.AccessorySettings>, updatedBy: string): Promise<env.AccessorySettings>
}

export default model<env.AccessorySettings, AccessorySettingsModel>('AccessorySettings', accessorySettingsSchema)
