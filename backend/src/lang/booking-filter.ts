import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    LOCATION: 'Lieu',
  },
  en: {
    LOCATION: 'Location',
  },
  es: {
    LOCATION: 'Ubicación',
  },
  ar: {
    LOCATION: 'الموقع',
  },
})

langHelper.setLanguage(strings)
export { strings }
