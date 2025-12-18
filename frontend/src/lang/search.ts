import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SHOW_FILTERS: 'Afficher les filtres',
    HIDE_FILTERS: 'Masquer les filtres',
  },
  en: {
    SHOW_FILTERS: 'Show Filters',
    HIDE_FILTERS: 'Hide Filters',
  },
  es: {
    SHOW_FILTERS: 'Mostrar filtros',
    HIDE_FILTERS: 'Ocultar filtros',
  },
  ar: {
    SHOW_FILTERS: 'إظهار المرشحات',
    HIDE_FILTERS: 'إخفاء المرشحات',
  },
})

langHelper.setLanguage(strings)
export { strings }
