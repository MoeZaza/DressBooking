import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    STYLE: 'Style',
    TRADITIONAL: 'Traditionnel',
    MODERN: 'Moderne',
    VINTAGE: 'Vintage',
    DESIGNER: 'Designer',
    CASUAL: 'Décontracté',
  },
  en: {
    STYLE: 'Style',
    TRADITIONAL: 'Traditional',
    MODERN: 'Modern',
    VINTAGE: 'Vintage',
    DESIGNER: 'Designer',
    CASUAL: 'Casual',
  },
  es: {
    STYLE: 'Estilo',
    TRADITIONAL: 'Tradicional',
    MODERN: 'Moderno',
    VINTAGE: 'Vintage',
    DESIGNER: 'Diseñador',
    CASUAL: 'Casual',
  },
  ar: {
    STYLE: 'النمط',
    TRADITIONAL: 'تقليدي',
    MODERN: 'عصري',
    VINTAGE: 'كلاسيكي',
    DESIGNER: 'مصمم',
    CASUAL: 'كاجوال',
  },
})

langHelper.setLanguage(strings)
export { strings }
