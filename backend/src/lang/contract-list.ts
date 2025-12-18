import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: 'Contrats',
  },
  en: {
    TITLE: 'Contracts',
  },
  es: {
    TITLE: 'Contratos',
  },
  ar: {
    TITLE: 'العقود',
  },
})

langHelper.setLanguage(strings)
export { strings }
