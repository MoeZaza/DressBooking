import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UPDATE_COUNTRY: 'Modification du pays',
    COUNTRY_UPDATED: 'Pays modifié avec succès.',
  },
  en: {
    UPDATE_COUNTRY: 'Country update',
    COUNTRY_UPDATED: 'Country updated successfully.',
  },
  es: {
    UPDATE_COUNTRY: 'Actualización del país',
    COUNTRY_UPDATED: 'País actualizado correctamente.',
  },
  ar: {
    UPDATE_COUNTRY: 'تحديث البلد',
    COUNTRY_UPDATED: 'تم تحديث البلد بنجاح.',
  },
})

langHelper.setLanguage(strings)
export { strings }
