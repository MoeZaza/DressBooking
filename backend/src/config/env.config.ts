import * as bookcarsTypes from ':bookcars-types'
import Const from './const'

// Environment validation function
const validateEnv = () => {
  const required = [
    'VITE_BC_API_HOST',
    'VITE_BC_WEBSITE_NAME'
  ]

  const missing = required.filter(key => !import.meta.env[key])

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    console.error('Please check your .env file')
    return false
  }

  return true
}

// Validate environment on load
const isEnvValid = validateEnv()

//
// ISO 639-1 language codes and their labels
// https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
//
const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
  },
  {
    code: 'fr',
    label: 'Français',
  },
  {
    code: 'es',
    label: 'Español',
  },
  {
    code: 'ar',
    label: 'العربية',
  },
]

const env = {
  isMobile: window.innerWidth <= 960,
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),

  WEBSITE_NAME: String(import.meta.env.VITE_BC_WEBSITE_NAME || 'BookDress'),

  APP_TYPE: bookcarsTypes.AppType.Backend,
  API_HOST: String(import.meta.env.VITE_BC_API_HOST || 'http://localhost:4002'),
  LANGUAGES: LANGUAGES.map((l) => l.code),
  _LANGUAGES: LANGUAGES,
  DEFAULT_LANGUAGE: String(import.meta.env.VITE_BC_DEFAULT_LANGUAGE || 'ar'),
  ENV_VALID: isEnvValid,
  PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_BC_PAGE_SIZE), 10) || 30,
  DRESSES_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_BC_DRESSES_PAGE_SIZE), 10) || 15,
  BOOKINGS_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_BC_BOOKINGS_PAGE_SIZE), 10) || 20,
  BOOKINGS_MOBILE_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_BC_BOOKINGS_MOBILE_PAGE_SIZE), 10) || 10,
  CDN_USERS: String(import.meta.env.VITE_BC_CDN_USERS),
  CDN_TEMP_USERS: String(import.meta.env.VITE_BC_CDN_TEMP_USERS),
  CDN_DRESSES: String(import.meta.env.VITE_BC_CDN_DRESSES),
  CDN_TEMP_DRESSES: String(import.meta.env.VITE_BC_CDN_TEMP_DRESSES),
  CDN_LOCATIONS: String(import.meta.env.VITE_BC_CDN_LOCATIONS),
  CDN_TEMP_LOCATIONS: String(import.meta.env.VITE_BC_CDN_TEMP_LOCATIONS),
  CDN_CONTRACTS: String(import.meta.env.VITE_BC_CDN_CONTRACTS),
  CDN_TEMP_CONTRACTS: String(import.meta.env.VITE_BC_CDN_TEMP_CONTRACTS),
  CDN_LICENSES: String(import.meta.env.VITE_BC_CDN_LICENSES),
  CDN_TEMP_LICENSES: String(import.meta.env.VITE_BC_CDN_TEMP_LICENSES),
  PAGE_OFFSET: 200,
  INFINITE_SCROLL_OFFSET: 40,
  SUPPLIER_IMAGE_WIDTH: Number.parseInt(String(import.meta.env.VITE_BC_SUPPLIER_IMAGE_WIDTH), 10) || 60,
  SUPPLIER_IMAGE_HEIGHT: Number.parseInt(String(import.meta.env.VITE_BC_SUPPLIER_IMAGE_HEIGHT), 10) || 30,

  DRESS_IMAGE_WIDTH: Number.parseInt(String(import.meta.env.VITE_BC_DRESS_IMAGE_WIDTH), 10) || 300,
  DRESS_IMAGE_HEIGHT: Number.parseInt(String(import.meta.env.VITE_BC_DRESS_IMAGE_HEIGHT), 10) || 200,
  DRESS_OPTION_IMAGE_HEIGHT: 85,
  SELECTED_DRESS_OPTION_IMAGE_HEIGHT: 30,

  // PAGINATION_MODE: CLASSIC or INFINITE_SCROLL
  // If you choose CLASSIC, you will get a classic pagination with next and previous buttons on desktop and infinite scroll on mobile.
  // If you choose INFINITE_SCROLL, you will get infinite scroll on desktop and mobile.
  // Defaults to CLASSIC
  PAGINATION_MODE:
    (import.meta.env.VITE_BC_PAGINATION_MODE && import.meta.env.VITE_BC_PAGINATION_MODE.toUpperCase()) === Const.PAGINATION_MODE.INFINITE_SCROLL
      ? Const.PAGINATION_MODE.INFINITE_SCROLL
      : Const.PAGINATION_MODE.CLASSIC,
  CURRENCY: import.meta.env.VITE_BC_CURRENCY || '₪',
  DEPOSIT_FILTER_VALUE_1: Number.parseInt(String(import.meta.env.VITE_BC_DEPOSIT_FILTER_VALUE_1), 10),
  DEPOSIT_FILTER_VALUE_2: Number.parseInt(String(import.meta.env.VITE_BC_DEPOSIT_FILTER_VALUE_2), 10),
  DEPOSIT_FILTER_VALUE_3: Number.parseInt(String(import.meta.env.VITE_BC_DEPOSIT_FILTER_VALUE_3), 10),
  CONTACT_EMAIL: String(import.meta.env.VITE_BC_CONTACT_EMAIL),
  RECAPTCHA_ENABLED: (import.meta.env.VITE_BC_RECAPTCHA_ENABLED && import.meta.env.VITE_BC_RECAPTCHA_ENABLED.toLowerCase()) === 'true',
  RECAPTCHA_SITE_KEY: String(import.meta.env.VITE_BC_RECAPTCHA_SITE_KEY),
  PASSWORD_MIN_LENGTH: 6,
}

export default env
