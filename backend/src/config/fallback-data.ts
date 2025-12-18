// Fallback data for dropdowns when API is unavailable
import * as bookcarsTypes from ':bookcars-types'

export const FALLBACK_DRESS_TYPES: bookcarsTypes.DressType[] = [
  bookcarsTypes.DressType.Bridal,
  bookcarsTypes.DressType.Evening,
  bookcarsTypes.DressType.Cocktail,
  bookcarsTypes.DressType.Casual,
  bookcarsTypes.DressType.Formal,
  bookcarsTypes.DressType.Business,
  bookcarsTypes.DressType.Prom,
  bookcarsTypes.DressType.Graduation,
  bookcarsTypes.DressType.Anniversary,
  bookcarsTypes.DressType.DateNight,
  bookcarsTypes.DressType.Gala,
  bookcarsTypes.DressType.RedCarpet,
  bookcarsTypes.DressType.Maternity,
  bookcarsTypes.DressType.PlusSize,
  bookcarsTypes.DressType.Vintage,
  bookcarsTypes.DressType.Modern,
  bookcarsTypes.DressType.Traditional,
  bookcarsTypes.DressType.Designer,
  bookcarsTypes.DressType.Wedding,
  bookcarsTypes.DressType.Bridesmaid,
  bookcarsTypes.DressType.MotherOfBride,
  bookcarsTypes.DressType.Cultural,
  bookcarsTypes.DressType.Religious,
  bookcarsTypes.DressType.Other,
  bookcarsTypes.DressType.Unknown
]

export const FALLBACK_DRESS_MATERIALS: bookcarsTypes.DressMaterial[] = [
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
  bookcarsTypes.DressMaterial.Charmeuse
]

export const FALLBACK_DRESS_SIZES: bookcarsTypes.DressSize[] = [
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
  bookcarsTypes.DressSize.Custom
]

export const FALLBACK_DRESS_STYLES: string[] = [
  'Elegant',
  'Romantic',
  'Bohemian',
  'Minimalist',
  'Glamorous',
  'Classic',
  'Contemporary',
  'Artistic',
  'Luxury',
  'Trendy',
  'Timeless',
  'Sophisticated',
  'Chic',
  'Edgy',
  'Feminine',
  'Boho Chic',
  'Avant-garde',
  'Retro',
  'Gothic',
  'Preppy'
]

export const FALLBACK_COLORS: string[] = [
  'White',
  'Ivory',
  'Cream',
  'Champagne',
  'Blush',
  'Black',
  'Navy',
  'Burgundy',
  'Emerald',
  'Gold',
  'Silver',
  'Rose Gold',
  'Red',
  'Pink',
  'Blue',
  'Purple',
  'Green',
  'Yellow',
  'Orange',
  'Brown',
  'Gray',
  'Beige',
  'Multicolor'
]

export const FALLBACK_NECKLINES: string[] = [
  'V-Neck',
  'Round Neck',
  'Off-Shoulder',
  'Halter',
  'Strapless',
  'One-Shoulder',
  'Boat Neck',
  'Square Neck',
  'Sweetheart',
  'High Neck',
  'Scoop Neck',
  'Cowl Neck'
]

export const FALLBACK_SLEEVES: string[] = [
  'Sleeveless',
  'Short Sleeve',
  'Long Sleeve',
  'Three-Quarter Sleeve',
  'Cap Sleeve',
  'Bell Sleeve',
  'Puff Sleeve',
  'Bishop Sleeve'
]

export const FALLBACK_SILHOUETTES: string[] = [
  'A-Line',
  'Ball Gown',
  'Mermaid',
  'Sheath',
  'Fit & Flare',
  'Empire',
  'Trumpet',
  'Column',
  'Princess',
  'Shift'
]

export const FALLBACK_LENGTHS: string[] = [
  'Mini',
  'Knee Length',
  'Midi',
  'Tea Length',
  'Ankle Length',
  'Floor Length',
  'Chapel Train',
  'Cathedral Train'
]

export const FALLBACK_COUNTRIES = [
  { _id: '1', name: 'Palestine', nameAr: 'فلسطين' },
  { _id: '2', name: 'Jordan', nameAr: 'الأردن' },
]

export const FALLBACK_LOCATIONS = [
  { _id: '1', name: 'Jenin', nameAr: 'جنين' },
  { _id: '2', name: 'Ramallah', nameAr: 'رام الله' },
  { _id: '3', name: 'Nablus', nameAr: 'نابلس' },
  { _id: '4', name: 'Hebron', nameAr: 'الخليل' },
  { _id: '4', name: 'Amman', nameAr: 'عمان' },
]

// Helper function to get fallback data with error handling
export const getFallbackData = (type: string): any[] => {
  try {
    switch (type) {
      case 'dressTypes':
        return FALLBACK_DRESS_TYPES
      case 'dressMaterials':
        return FALLBACK_DRESS_MATERIALS
      case 'dressSizes':
        return FALLBACK_DRESS_SIZES
      case 'dressStyles':
        return FALLBACK_DRESS_STYLES
      case 'colors':
        return FALLBACK_COLORS
      case 'necklines':
        return FALLBACK_NECKLINES
      case 'sleeves':
        return FALLBACK_SLEEVES
      case 'silhouettes':
        return FALLBACK_SILHOUETTES
      case 'lengths':
        return FALLBACK_LENGTHS
      case 'countries':
        return FALLBACK_COUNTRIES
      case 'locations':
        return FALLBACK_LOCATIONS
      default:
        console.warn(`No fallback data available for type: ${type}`)
        return []
    }
  } catch (error) {
    console.error(`Error getting fallback data for ${type}:`, error)
    return []
  }
}

// Helper function to check if data is empty and provide fallback
export const ensureDataAvailable = (data: any[], fallbackType: string): any[] => {
  if (!data || data.length === 0) {
    console.warn(`No data available, using fallback for: ${fallbackType}`)
    return getFallbackData(fallbackType)
  }
  return data
}
