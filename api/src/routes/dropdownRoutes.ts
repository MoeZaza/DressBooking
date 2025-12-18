import express from 'express'

const router = express.Router()

console.log('🔧 Dropdown routes module loaded!')

// Test endpoint to verify routes are loaded
router.get('/api/dropdown-test', (req: any, res: any) => {
  console.log('📞 Dropdown test endpoint called')
  res.json({ message: 'Dropdown routes are working!', timestamp: new Date().toISOString() })
})

// Define all types directly to avoid import issues
const DressType = {
  TRADITIONAL: 'traditional',
  MODERN: 'modern',
  DESIGNER: 'designer',
  VINTAGE: 'vintage',
  CASUAL: 'casual',
  WEDDING: 'wedding',
  EVENING: 'evening',
  COCKTAIL: 'cocktail',
  PROM: 'prom',
  FORMAL: 'formal',
  BUSINESS: 'business',
  MATERNITY: 'maternity',
  PLUS_SIZE: 'plus-size',
  BRIDAL: 'bridal',
  BRIDESMAID: 'bridesmaid',
  MOTHER_OF_BRIDE: 'mother-of-bride',
  GRADUATION: 'graduation',
  ANNIVERSARY: 'anniversary',
  DATE_NIGHT: 'date-night',
  GALA: 'gala',
  RED_CARPET: 'red-carpet',
  CULTURAL: 'cultural'
}

const DressSize = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl',
  XXL: 'xxl',
  XXXL: 'xxxl'
}

const DressMaterial = {
  SILK: 'silk',
  COTTON: 'cotton',
  LACE: 'lace',
  SATIN: 'satin',
  CHIFFON: 'chiffon',
  TULLE: 'tulle',
  ORGANZA: 'organza',
  VELVET: 'velvet',
  POLYESTER: 'polyester',
  CREPE: 'crepe'
}

const DressStyle = {
  A_LINE: 'a-line',
  BALL_GOWN: 'ball-gown',
  MERMAID: 'mermaid',
  SHEATH: 'sheath',
  EMPIRE: 'empire',
  TRUMPET: 'trumpet'
}

const DressRange = {
  MINI: 'mini',
  MIDI: 'midi',
  MAXI: 'maxi',
  FLOOR_LENGTH: 'floor-length'
}

const DressAccessories = {
  VEIL: 'veil',
  SHOES: 'shoes',
  JEWELRY: 'jewelry',
  BAG: 'bag'
}

const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
}

const UserType = {
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer'
}

// Localization mappings for dress types
const DRESS_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: {
    'traditional': 'Traditional',
    'modern': 'Modern',
    'designer': 'Designer',
    'vintage': 'Vintage',
    'casual': 'Casual',
    'wedding': 'Wedding',
    'evening': 'Evening',
    'cocktail': 'Cocktail',
    'prom': 'Prom',
    'formal': 'Formal',
    'business': 'Business',
    'maternity': 'Maternity',
    'plus-size': 'Plus Size',
    'bridal': 'Bridal',
    'bridesmaid': 'Bridesmaid',
    'mother-of-bride': 'Mother of Bride',
    'graduation': 'Graduation',
    'anniversary': 'Anniversary',
    'date-night': 'Date Night',
    'gala': 'Gala',
    'red-carpet': 'Red Carpet',
    'cultural': 'Cultural',
    'religious': 'Religious',
    'other': 'Other',
    'unknown': 'Unknown'
  },
  ar: {
    'traditional': 'تقليدي',
    'modern': 'عصري',
    'designer': 'مصمم',
    'vintage': 'كلاسيكي',
    'casual': 'كاجوال',
    'wedding': 'زفاف',
    'evening': 'سهرة',
    'cocktail': 'كوكتيل',
    'prom': 'حفلة تخرج',
    'formal': 'رسمي',
    'business': 'عمل',
    'maternity': 'حمل',
    'plus-size': 'مقاس كبير',
    'bridal': 'عروس',
    'bridesmaid': 'وصيفة العروس',
    'mother-of-bride': 'أم العروس',
    'graduation': 'تخرج',
    'anniversary': 'ذكرى سنوية',
    'date-night': 'موعد رومانسي',
    'gala': 'حفل راقص',
    'red-carpet': 'السجادة الحمراء',
    'cultural': 'ثقافي',
    'religious': 'ديني',
    'other': 'أخرى',
    'unknown': 'غير معروف'
  }
}

// Localization mappings for dress styles
const DRESS_STYLE_LABELS: Record<string, Record<string, string>> = {
  en: {
    'traditional': 'Traditional',
    'modern': 'Modern',
    'designer': 'Designer',
    'vintage': 'Vintage',
    'casual': 'Casual',
    'elegant': 'Elegant',
    'romantic': 'Romantic',
    'bohemian': 'Bohemian',
    'minimalist': 'Minimalist',
    'glamorous': 'Glamorous',
    'classic': 'Classic',
    'contemporary': 'Contemporary',
    'artistic': 'Artistic',
    'luxury': 'Luxury',
    'trendy': 'Trendy',
    'timeless': 'Timeless',
    'sophisticated': 'Sophisticated',
    'chic': 'Chic',
    'edgy': 'Edgy',
    'feminine': 'Feminine'
  },
  ar: {
    'traditional': 'تقليدي',
    'modern': 'عصري',
    'designer': 'مصمم',
    'vintage': 'كلاسيكي',
    'casual': 'كاجوال',
    'elegant': 'أنيق',
    'romantic': 'رومانسي',
    'bohemian': 'بوهيمي',
    'minimalist': 'بسيط',
    'glamorous': 'ساحر',
    'classic': 'كلاسيكي',
    'contemporary': 'معاصر',
    'artistic': 'فني',
    'luxury': 'فاخر',
    'trendy': 'عصري',
    'timeless': 'خالد',
    'sophisticated': 'راقي',
    'chic': 'أنيق',
    'edgy': 'جريء',
    'feminine': 'أنثوي'
  }
}

// Localization mappings for dress materials
const DRESS_MATERIAL_LABELS: Record<string, Record<string, string>> = {
  en: {
    'silk': 'Silk',
    'cotton': 'Cotton',
    'lace': 'Lace',
    'satin': 'Satin',
    'chiffon': 'Chiffon',
    'tulle': 'Tulle',
    'organza': 'Organza',
    'velvet': 'Velvet',
    'polyester': 'Polyester',
    'crepe': 'Crepe',
    'taffeta': 'Taffeta',
    'georgette': 'Georgette',
    'brocade': 'Brocade',
    'sequin': 'Sequin',
    'beaded': 'Beaded',
    'embroidered': 'Embroidered',
    'mesh': 'Mesh',
    'jersey': 'Jersey',
    'mikado': 'Mikado',
    'charmeuse': 'Charmeuse'
  },
  ar: {
    'silk': 'حرير',
    'cotton': 'قطن',
    'lace': 'دانتيل',
    'satin': 'ساتان',
    'chiffon': 'شيفون',
    'tulle': 'تول',
    'organza': 'أورجانزا',
    'velvet': 'مخمل',
    'polyester': 'بوليستر',
    'crepe': 'كريب',
    'taffeta': 'تافتا',
    'georgette': 'جورجيت',
    'brocade': 'بروكار',
    'sequin': 'ترتر',
    'beaded': 'مطرز بالخرز',
    'embroidered': 'مطرز',
    'mesh': 'شبكي',
    'jersey': 'جيرسي',
    'mikado': 'ميكادو',
    'charmeuse': 'شارموز'
  }
}

/**
 * Get all dress types for dropdown
 */
router.get('/api/dress-types', (req: any, res: any) => {
  try {
    const lang = req.query.lang as string || 'en'
    const labels = DRESS_TYPE_LABELS[lang] || DRESS_TYPE_LABELS.en

    const dressTypes = Object.values(DressType).map(type => ({
      value: type,
      label: labels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
    }))
    res.json(dressTypes)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressTypes]', err)
    res.status(500).json({ error: 'Failed to get dress types' })
  }
})

/**
 * Get all dress sizes for dropdown
 */
router.get('/api/dress-sizes', (req, res) => {
  try {
    const dressSizes = Object.values(DressSize).map(size => ({
      value: size,
      label: size.toUpperCase()
    }))
    res.json(dressSizes)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressSizes]', err)
    res.status(500).json({ error: 'Failed to get dress sizes' })
  }
})

/**
 * Get all dress materials for dropdown
 */
router.get('/api/dress-materials', (req: any, res: any) => {
  try {
    const lang = req.query.lang as string || 'en'
    const labels = DRESS_MATERIAL_LABELS[lang] || DRESS_MATERIAL_LABELS.en

    const dressMaterials = Object.values(DressMaterial).map(material => ({
      value: material,
      label: labels[material] || material.charAt(0).toUpperCase() + material.slice(1)
    }))
    res.json(dressMaterials)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressMaterials]', err)
    res.status(500).json({ error: 'Failed to get dress materials' })
  }
})

/**
 * Get all dress styles for dropdown
 */
router.get('/api/dress-styles', (req: any, res: any) => {
  try {
    const lang = req.query.lang as string || 'en'
    const labels = DRESS_STYLE_LABELS[lang] || DRESS_STYLE_LABELS.en

    const dressStyles = Object.values(DressStyle).map(style => ({
      value: style,
      label: labels[style] || style.charAt(0).toUpperCase() + style.slice(1)
    }))
    res.json(dressStyles)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressStyles]', err)
    res.status(500).json({ error: 'Failed to get dress styles' })
  }
})

/**
 * Get all dress ranges for dropdown
 */
router.get('/api/dress-ranges', (req, res) => {
  try {
    const dressRanges = Object.values(DressRange).map(range => ({
      value: range,
      label: range.charAt(0).toUpperCase() + range.slice(1)
    }))
    res.json(dressRanges)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressRanges]', err)
    res.status(500).json({ error: 'Failed to get dress ranges' })
  }
})

/**
 * Get all dress accessories for dropdown
 */
router.get('/api/dress-accessories', (req, res) => {
  try {
    const dressAccessories = Object.values(DressAccessories).map(accessory => ({
      value: accessory,
      label: accessory.charAt(0).toUpperCase() + accessory.slice(1)
    }))
    res.json(dressAccessories)
  } catch (err: any) {
    console.error('[dropdownRoutes.getDressAccessories]', err)
    res.status(500).json({ error: 'Failed to get dress accessories' })
  }
})

/**
 * Get all booking statuses for dropdown
 */
router.get('/api/booking-statuses', (req, res) => {
  try {
    const bookingStatuses = Object.values(BookingStatus).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
    res.json(bookingStatuses)
  } catch (err: any) {
    console.error('[dropdownRoutes.getBookingStatuses]', err)
    res.status(500).json({ error: 'Failed to get booking statuses' })
  }
})

/**
 * Get all user types for dropdown
 */
router.get('/api/user-types', (req, res) => {
  try {
    const userTypes = Object.values(UserType).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }))
    res.json(userTypes)
  } catch (err: any) {
    console.error('[dropdownRoutes.getUserTypes]', err)
    res.status(500).json({ error: 'Failed to get user types' })
  }
})

/**
 * Get all dropdown values in one request
 */
router.get('/api/all-dropdowns', (req, res) => {
  try {
    const allDropdowns = {
      dressTypes: Object.values(DressType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
      })),
      dressSizes: Object.values(DressSize).map(size => ({
        value: size,
        label: size.toUpperCase()
      })),
      dressMaterials: Object.values(DressMaterial).map(material => ({
        value: material,
        label: material.charAt(0).toUpperCase() + material.slice(1)
      })),
      dressStyles: Object.values(DressStyle).map(style => ({
        value: style,
        label: style.charAt(0).toUpperCase() + style.slice(1)
      })),
      dressRanges: Object.values(DressRange).map(range => ({
        value: range,
        label: range.charAt(0).toUpperCase() + range.slice(1)
      })),
      dressAccessories: Object.values(DressAccessories).map(accessory => ({
        value: accessory,
        label: accessory.charAt(0).toUpperCase() + accessory.slice(1)
      })),
      bookingStatuses: Object.values(BookingStatus).map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      })),
      userTypes: Object.values(UserType).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }))
    }
    res.json(allDropdowns)
  } catch (err: any) {
    console.error('[dropdownRoutes.getAllDropdowns]', err)
    res.status(500).json({ error: 'Failed to get all dropdown values' })
  }
})

/**
 * Get neckline options for dropdown
 */
router.get('/api/neckline-options', (req, res) => {
  try {
    const necklineOptions = [
      'v-neck', 'round-neck', 'off-shoulder', 'halter', 'strapless',
      'one-shoulder', 'boat-neck', 'square-neck', 'sweetheart', 'high-neck', 'other'
    ].map(neckline => ({
      value: neckline,
      label: neckline.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
    res.json(necklineOptions)
  } catch (err: any) {
    console.error('[dropdownRoutes.getNecklineOptions]', err)
    res.status(500).json({ error: 'Failed to get neckline options' })
  }
})

/**
 * Get sleeve options for dropdown
 */
router.get('/api/sleeve-options', (req, res) => {
  try {
    const sleeveOptions = [
      'sleeveless', 'short-sleeve', 'long-sleeve', 'three-quarter',
      'cap-sleeve', 'bell-sleeve', 'other'
    ].map(sleeve => ({
      value: sleeve,
      label: sleeve.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
    res.json(sleeveOptions)
  } catch (err: any) {
    console.error('[dropdownRoutes.getSleeveOptions]', err)
    res.status(500).json({ error: 'Failed to get sleeve options' })
  }
})

/**
 * Get silhouette options for dropdown
 */
router.get('/api/silhouette-options', (req, res) => {
  try {
    const silhouetteOptions = [
      'a-line', 'ball-gown', 'mermaid', 'sheath', 'fit-and-flare',
      'empire', 'trumpet', 'column', 'other'
    ].map(silhouette => ({
      value: silhouette,
      label: silhouette.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
    res.json(silhouetteOptions)
  } catch (err: any) {
    console.error('[dropdownRoutes.getSilhouetteOptions]', err)
    res.status(500).json({ error: 'Failed to get silhouette options' })
  }
})

/**
 * Get season options for dropdown
 */
router.get('/api/season-options', (req, res) => {
  try {
    const seasonOptions = [
      'spring', 'summer', 'fall', 'winter', 'all-season'
    ].map(season => ({
      value: season,
      label: season.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
    res.json(seasonOptions)
  } catch (err: any) {
    console.error('[dropdownRoutes.getSeasonOptions]', err)
    res.status(500).json({ error: 'Failed to get season options' })
  }
})

/**
 * Get occasion tags for dropdown
 */
router.get('/api/occasion-tags', (req, res) => {
  try {
    const occasionTags = [
      'wedding', 'prom', 'cocktail', 'business', 'casual', 'formal',
      'party', 'graduation', 'anniversary', 'date-night', 'gala',
      'red-carpet', 'other'
    ].map(tag => ({
      value: tag,
      label: tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
    res.json(occasionTags)
  } catch (err: any) {
    console.error('[dropdownRoutes.getOccasionTags]', err)
    res.status(500).json({ error: 'Failed to get occasion tags' })
  }
})

export default router
