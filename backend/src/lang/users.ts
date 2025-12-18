import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_USER: 'Nouvel utilisateur',
  },
  en: {
    NEW_USER: 'New user',
  },
  es: {
    NEW_USER: 'Nuevo usuario',
  },
  ar: {
    NEW_USER: 'مستخدم جديد',
  },
})

langHelper.setLanguage(strings)
export { strings }
