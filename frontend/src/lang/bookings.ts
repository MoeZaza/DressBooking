import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_BOOKING: 'Nouvelle réservation',
  },
  en: {
    NEW_BOOKING: 'New Booking',
  },
  es: {
    NEW_BOOKING: 'Nueva reserva',
  },
  ar: {
    NEW_BOOKING: 'حجز جديد',
  },
})

langHelper.setLanguage(strings)
export { strings }
