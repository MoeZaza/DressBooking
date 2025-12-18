import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_LOCATION: 'Choisir ce lieu',
  },
  en: {
    SELECT_LOCATION: 'Select Location',
  },
  es: {
    SELECT_LOCATION: 'Seleccionar ubicación',
  },
  ar: {
    SELECT_LOCATION: 'اختر هذا الموقع',
  },
})

langHelper.setLanguage(strings)
export { strings }
