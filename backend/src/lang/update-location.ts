import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UPDATE_LOCATION: 'Modification du lieu',
    LOCATION_UPDATED: 'Lieu modifié avec succès.',
  },
  en: {
    UPDATE_LOCATION: 'Location update',
    LOCATION_UPDATED: 'Location updated successfully.',
  },
  es: {
    UPDATE_LOCATION: 'Actualización del lugar',
    LOCATION_UPDATED: 'Lugar actualizado correctamente.',
  },
  ar: {
    UPDATE_LOCATION: 'تحديث الموقع',
    LOCATION_UPDATED: 'تم تحديث الموقع بنجاح.',
  },
})

langHelper.setLanguage(strings)
export { strings }
