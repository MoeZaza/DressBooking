const env = {
  API_HOST: 'http://localhost:4002',
  WEBSITE_NAME: 'BookDress',
  DEFAULT_LANGUAGE: 'ar',
  BASE_CURRENCY: 'ILS',
  PAGE_SIZE: 30,
  DRESSES_PAGE_SIZE: 15,
  BOOKINGS_PAGE_SIZE: 20,
  BOOKINGS_MOBILE_PAGE_SIZE: 10,
  CDN_USERS: '/images/users/',
  CDN_DRESSES: '/images/dresses/',
  CDN_TEMP_DRESSES: '/images/temp/dresses/',
  CDN_LOCATIONS: '/images/locations/',

  SUPPLIER_IMAGE_WIDTH: 60,
  SUPPLIER_IMAGE_HEIGHT: 30,
  DRESS_IMAGE_WIDTH: 300,
  DRESS_IMAGE_HEIGHT: 200,
  RECAPTCHA_ENABLED: false,
  RECAPTCHA_SITE_KEY: '',

  PAGINATION_MODE: 'CLASSIC',
  PAYMENT_GATEWAY: 'stripe',
  STRIPE_PUBLISHABLE_KEY: '',
  PAYPAL_CLIENT_ID: '',
  PAYPAL_DEBUG: false,
  SET_LANGUAGE_FROM_IP: false,
  GOOGLE_ANALYTICS_ENABLED: false,
  GOOGLE_ANALYTICS_ID: '',
  CONTACT_EMAIL: 'contact@example.com',
  DEPOSIT_FILTER_VALUE_1: 500,
  DEPOSIT_FILTER_VALUE_2: 1000,
  DEPOSIT_FILTER_VALUE_3: 2000,
  FB_APP_ID: '',
  APPLE_ID: '',
  GG_APP_ID: '',
  MIN_LOCATIONS: 4,
  HIDE_SUPPLIERS: false,
  MIN_RENTAL_HOURS: 1,
  MIN_RENTAL_START_HOURS: 1,
  MAP_LATITUDE: 32.4617, // Jenin, Palestine
  MAP_LONGITUDE: 35.3031, // Jenin, Palestine
  MAP_ZOOM: 12,
  _LANGUAGES: [
    {
      code: 'en',
      label: 'English',
    },
    {
      code: 'fr',
      label: 'Français',
    },
    {
      code: 'ar',
      label: 'العربية',
    },
  ],
}

export default env
