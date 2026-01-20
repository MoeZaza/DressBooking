import { Schema, model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as logger from '../common/logger'

const dressSchema = new Schema<env.Dress>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
    },
    locations: {
      type: [Schema.Types.ObjectId],
      ref: 'Location',
      validate: (value: any): boolean => Array.isArray(value) && value.length > 0,
    },

    // --------- price fields ---------
    price: {
      type: Number,
      required: [true, "can't be blank"],
    },
    discountedPrice: {
      type: Number,
    },

    // --------- end of price fields ---------

    deposit: {
      type: Number,
      required: [true, "can't be blank"],
    },

    // --------- booking analytics ---------
    bookingCount: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    // --------- end of booking analytics ---------

    available: {
      type: Boolean,
      required: [true, "can't be blank"],
      index: true,
    },
    fullyBooked: {
      type: Boolean,
      default: false,
    },
    comingSoon: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: [
        bookcarsTypes.DressType.Traditional,
        bookcarsTypes.DressType.Modern,
        bookcarsTypes.DressType.Designer,
        bookcarsTypes.DressType.Vintage,
        bookcarsTypes.DressType.Casual,
        bookcarsTypes.DressType.Wedding,
        bookcarsTypes.DressType.Evening,
        bookcarsTypes.DressType.Cocktail,
        bookcarsTypes.DressType.Prom,
        bookcarsTypes.DressType.Formal,
        bookcarsTypes.DressType.Business,
        bookcarsTypes.DressType.Maternity,
        bookcarsTypes.DressType.PlusSize,
        bookcarsTypes.DressType.Bridal,
        bookcarsTypes.DressType.Bridesmaid,
        bookcarsTypes.DressType.MotherOfBride,
        bookcarsTypes.DressType.Graduation,
        bookcarsTypes.DressType.Anniversary,
        bookcarsTypes.DressType.DateNight,
        bookcarsTypes.DressType.Gala,
        bookcarsTypes.DressType.RedCarpet,
        bookcarsTypes.DressType.Cultural,
        bookcarsTypes.DressType.Religious,
        bookcarsTypes.DressType.Other,
        bookcarsTypes.DressType.Unknown,
      ],
      required: [true, "can't be blank"],
    },
    size: {
      type: String,
      enum: [
        bookcarsTypes.DressSize.XS,
        bookcarsTypes.DressSize.S,
        bookcarsTypes.DressSize.M,
        bookcarsTypes.DressSize.L,
        bookcarsTypes.DressSize.XL,
        bookcarsTypes.DressSize.XXL,
        bookcarsTypes.DressSize.ExtraSmall,
        bookcarsTypes.DressSize.Small,
        bookcarsTypes.DressSize.Medium,
        bookcarsTypes.DressSize.Large,
        bookcarsTypes.DressSize.ExtraLarge,
        bookcarsTypes.DressSize.DoubleExtraLarge,
        bookcarsTypes.DressSize.Custom,
      ],
      required: [true, "can't be blank"],
    },
    customizable: {
      type: Boolean,
      default: false,
    },

    images: [{
      type: String,
    }],
    color: {
      type: String,
      required: [true, "can't be blank"],
    },
    length: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer',
      },
    },
    material: {
      type: String,
      enum: [
        bookcarsTypes.DressMaterial.Silk,
        bookcarsTypes.DressMaterial.Cotton,
        bookcarsTypes.DressMaterial.Lace,
        bookcarsTypes.DressMaterial.Satin,
        bookcarsTypes.DressMaterial.Chiffon,
        bookcarsTypes.DressMaterial.Tulle,
        bookcarsTypes.DressMaterial.Organza,
        bookcarsTypes.DressMaterial.Velvet,
        bookcarsTypes.DressMaterial.Polyester,
        bookcarsTypes.DressMaterial.Crepe,
        bookcarsTypes.DressMaterial.Taffeta,
        bookcarsTypes.DressMaterial.Georgette,
        bookcarsTypes.DressMaterial.Brocade,
        bookcarsTypes.DressMaterial.Sequin,
        bookcarsTypes.DressMaterial.Beaded,
        bookcarsTypes.DressMaterial.Embroidered,
        bookcarsTypes.DressMaterial.Mesh,
        bookcarsTypes.DressMaterial.Jersey,
        bookcarsTypes.DressMaterial.Mikado,
        bookcarsTypes.DressMaterial.Charmeuse,
      ],
      required: [true, "can't be blank"],
    },
    style: {
      type: String,
      enum: [
        bookcarsTypes.DressStyle.Traditional,
        bookcarsTypes.DressStyle.Modern,
        bookcarsTypes.DressStyle.Designer,
        bookcarsTypes.DressStyle.Vintage,
        bookcarsTypes.DressStyle.Casual,
        bookcarsTypes.DressStyle.Elegant,
        bookcarsTypes.DressStyle.Romantic,
        bookcarsTypes.DressStyle.Bohemian,
        bookcarsTypes.DressStyle.Minimalist,
        bookcarsTypes.DressStyle.Glamorous,
        bookcarsTypes.DressStyle.Classic,
        bookcarsTypes.DressStyle.Contemporary,
        bookcarsTypes.DressStyle.Artistic,
        bookcarsTypes.DressStyle.Luxury,
        bookcarsTypes.DressStyle.Trendy,
        bookcarsTypes.DressStyle.Timeless,
        bookcarsTypes.DressStyle.Sophisticated,
        bookcarsTypes.DressStyle.Chic,
        bookcarsTypes.DressStyle.Edgy,
        bookcarsTypes.DressStyle.Feminine,
      ],
      required: [true, "can't be blank"],
    },
    cancellation: {
      type: Number,
      required: [true, "can't be blank"],
    },
    amendments: {
      type: Number,
      required: [true, "can't be blank"],
    },
    range: {
      type: String,
      enum: [
        bookcarsTypes.DressRange.Mini,
        bookcarsTypes.DressRange.Midi,
        bookcarsTypes.DressRange.Maxi,
        bookcarsTypes.DressRange.Bridal,
        bookcarsTypes.DressRange.Evening,
        bookcarsTypes.DressRange.Cocktail,
        bookcarsTypes.DressRange.Casual,
      ],
      required: [true, "can't be blank"],
    },
    accessories: [{
      type: String,
      enum: [
        bookcarsTypes.DressAccessories.Veil,
        bookcarsTypes.DressAccessories.Jewelry,
        bookcarsTypes.DressAccessories.Shoes,
        bookcarsTypes.DressAccessories.Headpiece,
      ],
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    rentals: {
      type: Number,
      default: 0,
    },

    designerName: {
      type: String,
    },
    dressCode: {
      type: String,
      required: [true, "can't be blank"],
      unique: true,
      sparse: false,
      index: true,
    },
    fittingRequired: {
      type: Boolean,
      default: false,
    },
    alterationNotes: {
      type: String,
    },
    careInstructions: {
      type: String,
    },
    occasionTags: [{
      type: String,
      enum: [
        'wedding',
        'prom',
        'cocktail',
        'business',
        'casual',
        'formal',
        'party',
        'graduation',
        'anniversary',
        'date-night',
        'gala',
        'red-carpet',
        'other'
      ],
    }],
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all-season'],
      default: 'all-season',
    },
    neckline: {
      type: String,
      enum: [
        'v-neck',
        'round-neck',
        'off-shoulder',
        'halter',
        'strapless',
        'one-shoulder',
        'boat-neck',
        'square-neck',
        'sweetheart',
        'high-neck',
        'other'
      ],
    },
    sleeves: {
      type: String,
      enum: [
        'sleeveless',
        'short-sleeve',
        'long-sleeve',
        'three-quarter',
        'cap-sleeve',
        'bell-sleeve',
        'other'
      ],
    },
    silhouette: {
      type: String,
      enum: [
        'a-line',
        'ball-gown',
        'mermaid',
        'sheath',
        'fit-and-flare',
        'empire',
        'trumpet',
        'column',
        'other'
      ],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Dress',
  },
)

// Add mongoose-paginate-v2 plugin
dressSchema.plugin(mongoosePaginate)

// Add custom indexes
dressSchema.index({ updatedAt: -1, _id: 1 })
// Removed text index on name to fix Arabic language issues
dressSchema.index({ name: 1 }) // Use regular index instead of text index
dressSchema.index({ supplier: 1, type: 1, available: 1, rating: -1, updatedAt: -1, _id: 1 })
dressSchema.index({ available: 1, size: 1, deposit: 1 })
dressSchema.index({ color: 1, length: 1 })
dressSchema.index({ material: 1 })
dressSchema.index({ rentals: 1 })
dressSchema.index({ locations: 1, available: 1, fullyBooked: 1 })
dressSchema.index({ comingSoon: 1 })
dressSchema.index({ range: 1 })
dressSchema.index({ accessories: 1 })
dressSchema.index({ price: 1, _id: 1 })
dressSchema.index({ bookingCount: 1 })
dressSchema.index({ occasionTags: 1 })
dressSchema.index({ season: 1 })
dressSchema.index({ neckline: 1 })
dressSchema.index({ sleeves: 1 })
dressSchema.index({ silhouette: 1 })
dressSchema.index({ lastMaintenance: 1 })

// Dress model with pagination interface
const Dress = model<env.Dress>('Dress', dressSchema) as any

// Create indexes manually and handle potential errors
Dress.syncIndexes().catch((err: any) => {
  logger.error('Error creating Dress indexes:', err)
})

export default Dress
