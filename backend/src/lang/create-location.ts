import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_LOCATION_HEADING: 'Nouveau lieu',
    LOCATION_NAME: 'Lieu',
    INVALID_LOCATION: 'Ce lieu existe déjà.',
    LOCATION_CREATED: 'Lieu créé avec succès.',
    COUNTRY: 'Pays',
  },
  en: {
    NEW_LOCATION_HEADING: 'New location',
    LOCATION_NAME: 'Location',
    INVALID_LOCATION: 'This location already exists.',
    LOCATION_CREATED: 'Location created successfully.',
    COUNTRY: 'Country',
  },
  es: {
    NEW_LOCATION_HEADING: 'Nuevo lugar',
    LOCATION_NAME: 'Lugar',
    INVALID_LOCATION: 'Este lugar ya existe.',
    LOCATION_CREATED: 'Lugar creado con éxito.',
    COUNTRY: 'País',
  },
  ar: {
    NEW_LOCATION_HEADING: 'موقع جديد',
    LOCATION_NAME: 'الموقع',
    INVALID_LOCATION: 'هذا الموقع موجود بالفعل.',
    LOCATION_CREATED: 'تم إنشاء الموقع بنجاح.',
    COUNTRY: 'البلد',
  },
})

langHelper.setLanguage(strings)
export { strings }
