import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    DELETE_USER: 'Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?',
    DELETE_USERS: 'Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés et toutes leurs données ?',
    DELETE_SELECTION: 'Supprimer les utilisateurs sélectionnés',
    BLACKLIST: 'Ajouter à la liste noire',
  },
  en: {
    DELETE_USER: 'Are you sure you want to delete this user and all his data?',
    DELETE_USERS: 'Are you sure you want to delete the selected users and all their data?',
    DELETE_SELECTION: 'Delete selectied users',
    BLACKLIST: 'Add to the blacklist',
  },
  es: {
    DELETE_USER: '¿Estás seguro de que quieres eliminar a este usuario y todos sus datos?',
    DELETE_USERS: '¿Estás seguro de que quieres eliminar a los usuarios seleccionados y todos sus datos?',
    DELETE_SELECTION: 'Eliminar los usuarios seleccionados',
    BLACKLIST: 'Añadir a la lista negra',
  },
  ar: {
    DELETE_USER: 'هل أنت متأكد من أنك تريد حذف هذا المستخدم وجميع بياناته؟',
    DELETE_USERS: 'هل أنت متأكد من أنك تريد حذف المستخدمين المحددين وجميع بياناتهم؟',
    DELETE_SELECTION: 'حذف المستخدمين المحددين',
    BLACKLIST: 'إضافة إلى القائمة السوداء',
  },
})

langHelper.setLanguage(strings)
export { strings }
