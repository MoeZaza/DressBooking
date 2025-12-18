import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_LOCATION: 'Nouveau lieu',
    DELETE_LOCATION: 'Êtes-vous sûr de vouloir supprimer ce lieu ?',
    CANNOT_DELETE_LOCATION: 'Ce lieu ne peut pas être supprimé car il est lié à des robes.',
    EMPTY_LIST: 'Pas de lieux.',
    LOCATION: 'lieu',
    LOCATIONS: 'lieux',
  },
  en: {
    NEW_LOCATION: 'New location',
    DELETE_LOCATION: 'Are you sure you want to delete this location?',
    CANNOT_DELETE_LOCATION: 'This location cannot be deleted because it is related to dresses.',
    EMPTY_LIST: 'No locations.',
    LOCATION: 'location',
    LOCATIONS: 'locations',
  },
  es: {
    NEW_LOCATION: 'Nuevo lugar',
    DELETE_LOCATION: '¿Estás seguro de que quieres eliminar este lugar?',
    CANNOT_DELETE_LOCATION: 'Este lugar no puede ser eliminado porque está relacionado con vestidos.',
    EMPTY_LIST: 'No hay lugares.',
    LOCATION: 'lugar',
    LOCATIONS: 'lugares',
  },
  ar: {
    NEW_LOCATION: 'موقع جديد',
    DELETE_LOCATION: 'هل أنت متأكد من أنك تريد حذف هذا الموقع؟',
    CANNOT_DELETE_LOCATION: 'لا يمكن حذف هذا الموقع لأنه مرتبط بالفساتين.',
    EMPTY_LIST: 'لا توجد مواقع.',
    LOCATION: 'موقع',
    LOCATIONS: 'مواقع',
  },
})

langHelper.setLanguage(strings)
export { strings }
