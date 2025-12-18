import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NO_MATCH: 'Rien à voir ici !',
  },
  en: {
    NO_MATCH: 'Nothing to see here!',
  },
  es: {
    NO_MATCH: '¡No hay nada que ver aquí!',
  },
  ar: {
    NO_MATCH: 'لا يوجد شيء هنا!',
  },
})

langHelper.setLanguage(strings)
export { strings }
