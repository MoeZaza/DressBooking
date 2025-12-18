import process from 'node:process'
import { Document, Types } from 'mongoose'
import { CookieOptions } from 'express'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Convert string to boolean.
 *
 * @param {string} input
 * @returns {boolean}
 */
const stringToBoolean = (input: string): boolean => {
  try {
    return Boolean(JSON.parse(input.toLowerCase()))
  } catch {
    return false
  }
}

/**
 * Get environment variable value.
 *
 * @param {string} name
 * @param {?boolean} [required]
 * @param {?string} [defaultValue]
 * @returns {string}
 */
export const __env__ = (name: string, required?: boolean, defaultValue?: string): string => {
  const value = process.env[name]
  if (required && !value) {
    throw new Error(`'${name} not found`)
  }
  if (!value) {
    return defaultValue || ''
  }
  return String(value)
}

/**
 * ISO 639-1 language codes supported
 * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 *
 * @type {string[]}
 */
export const LANGUAGES = [
  'en',
  'fr',
  'ar',
]

/**
 * Website Name.
 *
 * @type {string}
 */
export const WEBSITE_NAME = __env__('BC_WEBSITE_NAME', false, 'BookDress')

/**
 * Server Port. Default is 4002.
 *
 * @type {number}
 */
export const PORT = Number.parseInt(__env__('BC_PORT', false, '4002'), 10)

/**
 * Indicate whether HTTPS is enabled or not.
 *
 * @type {boolean}
 */
export const HTTPS = stringToBoolean(__env__('BC_HTTPS'))

/**
 * Private SSL key filepath.
 *
 * @type {string}
 */
export const PRIVATE_KEY = __env__('BC_PRIVATE_KEY', HTTPS)

/**
 * Private SSL certificate filepath.
 *
 * @type {string}
 */
export const CERTIFICATE = __env__('BC_CERTIFICATE', HTTPS)

/**
 * MongoDB database URI. Default is MongoDB Atlas connection string.
 *
 * @type {string}
 */
export const DB_URI = __env__('BC_DB_URI', false, 'mongodb+srv://user:Mybookmodr100@cluster0.ey9u2ce.mongodb.net/bookdress?retryWrites=true&w=majority&appName=Cluster0')

/**
 * Indicate whether MongoDB SSL is enabled or not.
 *
 * @type {boolean}
 */
export const DB_SSL = stringToBoolean(__env__('BC_DB_SSL', false, 'false'))

/**
 * MongoDB SSL certificate filepath.
 *
 * @type {string}
 */
export const DB_SSL_CERT = __env__('BC_DB_SSL_CERT', DB_SSL)

/**
 * MongoDB SSL CA certificate filepath.
 *
 * @type {string}
 */
export const DB_SSL_CA = __env__('BC_DB_SSL_CA', DB_SSL)

/**
 * Indicate whether MongoDB debug is enabled or not.
 *
 * @type {boolean}
 */
export const DB_DEBUG = stringToBoolean(__env__('BC_DB_DEBUG', false, 'false'))

/**
 * Database encryption key for field-level encryption.
 * TODO: Production - Set to a secure 32+ character random key: 'your-secure-32-character-encryption-key-here'
 *
 * @type {string}
 */
export const DB_ENCRYPTION_KEY = __env__('DB_ENCRYPTION_KEY', false, 'bookdress-dev-encryption-key-32chars')

/**
 * Indicate whether database query sanitization is enabled.
 *
 * @type {boolean}
 */
export const DB_QUERY_SANITIZATION = stringToBoolean(__env__('BC_DB_QUERY_SANITIZATION', false, 'true'))

/**
 * Indicate whether database audit logging is enabled.
 *
 * @type {boolean}
 */
export const DB_AUDIT_LOGGING = stringToBoolean(__env__('BC_DB_AUDIT_LOGGING', false, 'true'))

/**
 * Indicate whether database field encryption is enabled.
 *
 * @type {boolean}
 */
export const DB_FIELD_ENCRYPTION = stringToBoolean(__env__('BC_DB_FIELD_ENCRYPTION', false, 'true'))

/**
 * Maximum query complexity limit for database operations.
 * Development: Higher limit (100) for flexible development and testing.
 * TODO: Production - Consider lowering to '50' for stricter security
 *
 * @type {number}
 */
export const DB_MAX_QUERY_COMPLEXITY = Number.parseInt(__env__('BC_DB_MAX_QUERY_COMPLEXITY', false, '100'), 10)

/**
 * Database query timeout in milliseconds.
 *
 * @type {number}
 */
export const DB_QUERY_TIMEOUT = Number.parseInt(__env__('BC_DB_QUERY_TIMEOUT', false, '30000'), 10)

/**
 * Database connection pool size.
 * Development: 10 connections is sufficient for development.
 * TODO: Production - Consider increasing to '20-50' based on expected load
 *
 * @type {number}
 */
export const DB_CONNECTION_POOL_SIZE = Number.parseInt(__env__('BC_DB_CONNECTION_POOL_SIZE', false, '10'), 10)

/**
 * Cookie secret. It should at least be 32 characters long, but the longer the better.
 *
 * @type {string}
 */
export const COOKIE_SECRET = __env__('BC_COOKIE_SECRET', false, 'bookdress')

/**
 * Authentication cookie domain.
 * Default is localhost.
 *
 * @type {string}
 */
export const AUTH_COOKIE_DOMAIN = __env__('BC_AUTH_COOKIE_DOMAIN', false, 'localhost')

/**
 * Cookie options.
 *
 * On production, authentication cookies are httpOnly, signed, secure and strict sameSite.
 * This will prevent XSS attacks by not allowing access to the cookie via JavaScript.
 * This will prevent CSRF attacks by not allowing the browser to send the cookie along with cross-site requests.
 * This will prevent MITM attacks by only allowing the cookie to be sent over HTTPS.
 * Authentication cookies are protected against XST attacks as well by disabling TRACE HTTP method via allowedMethods middleware.
 *
 * @type {CookieOptions}
 */
export const COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: HTTPS, signed: true, sameSite: 'strict', domain: AUTH_COOKIE_DOMAIN }

/**
 * frontend authentication cookie name.
 *
 * @type {"bc-x-access-token-frontend"}
 */
export const FRONTEND_AUTH_COOKIE_NAME = 'bc-x-access-token-frontend'

/**
 * Backend authentication cookie name.
 *
 * @type {"bc-x-access-token-frontend"}
 */
export const BACKEND_AUTH_COOKIE_NAME = 'bc-x-access-token-backend'

/**
 * Mobile App and unit tests authentication header name.
 *
 * @type {"x-access-token"}
 */
export const X_ACCESS_TOKEN = 'x-access-token'

/**
 * JWT secret. It should at least be 32 characters long, but the longer the better.
 *
 * @type {string}
 */
export const JWT_SECRET = __env__('BC_JWT_SECRET', false, 'bookdress')

/**
 * JWT expiration in seconds. Default is 86400 seconds (1 day).
 *
 * @type {number}
 */
export const JWT_EXPIRE_AT = Number.parseInt(__env__('BC_JWT_EXPIRE_AT', false, '86400'), 10)

/**
 * Validation Token expiration in seconds. Default is 86400 seconds (1 day).
 *
 * @type {number}
 */
export const TOKEN_EXPIRE_AT = Number.parseInt(__env__('BC_TOKEN_EXPIRE_AT', false, '86400'), 10)

/**
 * SMTP host.
 *
 * @type {string}
 */
export const SMTP_HOST = __env__('BC_SMTP_HOST', false, 'localhost')

/**
 * SMTP port.
 *
 * @type {number}
 */
export const SMTP_PORT = Number.parseInt(__env__('BC_SMTP_PORT', false, '587'), 10)

/**
 * SMTP username.
 *
 * @type {string}
 */
export const SMTP_USER = __env__('BC_SMTP_USER', false, 'test@example.com')

/**
 * SMTP password.
 *
 * @type {string}
 */
export const SMTP_PASS = __env__('BC_SMTP_PASS', false, 'password')

/**
 * SMTP from email.
 *
 * @type {string}
 */
export const SMTP_FROM = __env__('BC_SMTP_FROM', false, 'noreply@bookdress.com')

/**
 * Twilio Account SID for SMS notifications.
 *
 * @type {string}
 */
export const TWILIO_ACCOUNT_SID = __env__('BC_TWILIO_ACCOUNT_SID', false)

/**
 * Twilio Auth Token for SMS notifications.
 *
 * @type {string}
 */
export const TWILIO_AUTH_TOKEN = __env__('BC_TWILIO_AUTH_TOKEN', false)

/**
 * Twilio Phone Number for sending SMS.
 *
 * @type {string}
 */
export const TWILIO_PHONE_NUMBER = __env__('BC_TWILIO_PHONE_NUMBER', false)

/**
 * AWS Access Key ID for SNS SMS notifications.
 *
 * @type {string}
 */
export const AWS_ACCESS_KEY_ID = __env__('BC_AWS_ACCESS_KEY_ID', false)

/**
 * AWS Secret Access Key for SNS SMS notifications.
 *
 * @type {string}
 */
export const AWS_SECRET_ACCESS_KEY = __env__('BC_AWS_SECRET_ACCESS_KEY', false)

/**
 * AWS Region for SNS SMS notifications.
 *
 * @type {string}
 */
export const AWS_REGION = __env__('BC_AWS_REGION', false, 'us-east-1')

/**
 * Test phone number for SMS configuration testing.
 *
 * @type {string}
 */
export const TEST_PHONE_NUMBER = __env__('BC_TEST_PHONE_NUMBER', false)

/**
 * CDN root directory.
 *
 * @type {string}
 */
export const CDN_ROOT = __env__('BC_CDN_ROOT', false, '/var/www/cdn')

/**
 * CDN host URL for generating HTTP URLs.
 *
 * @type {string}
 */
export const CDN_HOST = __env__('BC_CDN_HOST', false, 'http://localhost:4002/api/cdn')

/**
 * CDN users directory.
 *
 * @type {string}
 */
export const CDN_USERS = __env__('BC_CDN_USERS', false, '/var/www/cdn/users')

/**
 * Users' temp cdn folder path.
 *
 * @type {string}
 */
export const CDN_TEMP_USERS = __env__('BC_CDN_TEMP_USERS', false, '/var/www/cdn/temp/users')

/**
 * Dresses' cdn folder path.
 *
 * @type {string}
 */
export const CDN_DRESSES = __env__('BC_CDN_DRESSES', false, '/var/www/cdn/dresses')

/**
 * Dresses' temp cdn folder path.
 *
 * @type {string}
 */
export const CDN_TEMP_DRESSES = __env__('BC_CDN_TEMP_DRESSES', false, '/var/www/cdn/temp/dresses')

/**
 * Locations' cdn folder path.
 *
 * @type {string}
 */
export const CDN_LOCATIONS = __env__('BC_CDN_LOCATIONS', false, '/var/www/cdn/locations')

/**
 * Locations' temp cdn folder path.
 *
 * @type {string}
 */
export const CDN_TEMP_LOCATIONS = __env__('BC_CDN_TEMP_LOCATIONS', false, '/var/www/cdn/temp/locations')

/**
 * Contracts' cdn folder path.
 *
 * @type {string}
 */
export const CDN_CONTRACTS = __env__('BC_CDN_CONTRACTS', false, '/var/www/cdn/contracts')

/**
 * Contracts' temp cdn folder path.
 *
 * @type {string}
 */
export const CDN_TEMP_CONTRACTS = __env__('BC_CDN_TEMP_CONTRACTS', false, '/var/www/cdn/temp/contracts')

/**
 * Licenses' cdn folder path.
 *
 * @type {string}
 */
export const CDN_LICENSES = __env__('BC_CDN_LICENSES', false, '/var/www/cdn/licenses')

/**
 * Licenses' temp cdn folder path.
 *
 * @type {string}
 */
export const CDN_TEMP_LICENSES = __env__('BC_CDN_TEMP_LICENSES', false, '/var/www/cdn/temp/licenses')

/**
 * Backend host.
 *
 * @type {string}
 */
export const BACKEND_HOST = __env__('BC_BACKEND_HOST', false, 'http://localhost:4002')

/**
 * Frontend host.
 *
 * @type {string}
 */
export const FRONTEND_HOST = __env__('BC_FRONTEND_HOST', false, 'http://localhost:3000')

/**
 * Default language. Default is ar (Arabic). Available options: en, fr, es, ar.
 *
 * @type {string}
 */
export const DEFAULT_LANGUAGE = __env__('BC_DEFAULT_LANGUAGE', false, 'ar')

/**
 * Expo push access token.
 *
 * @type {string}
 */
export const EXPO_ACCESS_TOKEN = __env__('BC_EXPO_ACCESS_TOKEN', false)

/**
 * Stripe secret key.
 *
 * @type {string}
 */
export const STRIPE_SECRET_KEY = __env__('BC_STRIPE_SECRET_KEY', false, 'STRIPE_SECRET_KEY')

let stripeSessionExpireAt = Number.parseInt(__env__('BC_STRIPE_SESSION_EXPIRE_AT', false, '82800'), 10)
stripeSessionExpireAt = stripeSessionExpireAt < 1800 ? 1800 : stripeSessionExpireAt
stripeSessionExpireAt = stripeSessionExpireAt <= 82800 ? stripeSessionExpireAt : 82800

/**
 * Stripe Checkout Session expiration in seconds. Should be at least 1800 seconds (30min) and max 82800 seconds. Default is 82800 seconds (~23h).
 * If the value is lower than 1800 seconds, it wil be set to 1800 seconds.
 * If the value is greater than 82800 seconds, it wil be set to 82800 seconds.
 *
 * @type {number}
 */
export const STRIPE_SESSION_EXPIRE_AT = stripeSessionExpireAt

/**
 * Indicates whether PayPal is used in sandbox mode or production.
 *
 * @type {boolean}
 */
export const PAYPAL_SANDBOX = stringToBoolean(__env__('BC_PAYPAL_SANDBOX', false, 'true'))

/**
 * PayPal client ID.
 *
 * @type {string}
 */
export const PAYPAL_CLIENT_ID = __env__('BC_PAYPAL_CLIENT_ID', false, 'PAYPAL_CLIENT_ID')

/**
 * PayPal client secret.
 *
 * @type {string}
 */
export const PAYPAL_CLIENT_SECRET = __env__('BC_PAYPAL_CLIENT_SECRET', false, 'PAYPAL_CLIENT_SECRET')

/**
 * Booking expiration in seconds.
 * Bookings created from checkout with Stripe are temporary and are automatically deleted if the payment checkout session expires.
 *
 * @type {number}
 */
export const BOOKING_EXPIRE_AT = STRIPE_SESSION_EXPIRE_AT + (10 * 60)

/**
 * User expiration in seconds.
 * Non verified and active users created from checkout with Stripe are temporary and are automatically deleted if the payment checkout session expires.
 *
 *
 * @type {number}
 */
export const USER_EXPIRE_AT = BOOKING_EXPIRE_AT

/**
 * Admin email.
 *
 * @type {string}
 */
export const ADMIN_EMAIL = __env__('BC_ADMIN_EMAIL', false)

/**
 * Google reCAPTCHA v3 secret key.
 *
 * @type {string}
 */
export const RECAPTCHA_SECRET = __env__('BC_RECAPTCHA_SECRET', false)

/**
 * Timezone for cenverting dates from UTC to local time.
 * Must be a valid TZ idenfidier: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * Default is UTC.
 *
 * @type {string}
 */
export const TIMEZONE = __env__('BC_TIMEZONE', false, 'Asia/Jerusalem')

/**
 * ipinfo.io API key.
 * Required for more tha, 1000 requests/day.
 *
 * @type {string}
 */
export const IPINFO_API_KEY = __env__('BC_IPINFO_API_KEY', false)

/**
 * Default ISO 2 country code ipinfo.io.
 *
 * @type {string}
 */
export const IPINFO_DEFAULT_COUNTRY = __env__('BC_IPINFO_DEFAULT_COUNTRY', false, 'PS')

/**
 * Environment mode (development, staging, production).
 *
 * @type {string}
 */
export const NODE_ENV = __env__('NODE_ENV', false, 'development')

/**
 * Security configuration based on environment.
 *
 * @type {boolean}
 */
export const IS_PRODUCTION = NODE_ENV === 'production'
export const IS_DEVELOPMENT = NODE_ENV === 'development'
export const IS_STAGING = NODE_ENV === 'staging'

/**
 * Disable JWT authentication in development mode.
 * When set to true, authentication middleware will be bypassed.
 * WARNING: Never set this to true in production!
 *
 * @type {boolean}
 */
export const DISABLE_AUTH_IN_DEV = stringToBoolean(__env__('BC_DISABLE_AUTH_IN_DEV', false, IS_DEVELOPMENT ? 'true' : 'false'))

/**
 * Security headers configuration.
 *
 * @type {object}
 */
export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP_REPORT_URI: __env__('BC_CSP_REPORT_URI', false, '/api/security/csp-report'),
  CSP_REPORT_ONLY: stringToBoolean(__env__('BC_CSP_REPORT_ONLY', false, IS_DEVELOPMENT ? 'true' : 'false')),

  // HSTS Configuration
  HSTS_MAX_AGE: Number.parseInt(__env__('BC_HSTS_MAX_AGE', false, '31536000'), 10), // 1 year
  HSTS_INCLUDE_SUBDOMAINS: stringToBoolean(__env__('BC_HSTS_INCLUDE_SUBDOMAINS', false, 'true')),
  HSTS_PRELOAD: stringToBoolean(__env__('BC_HSTS_PRELOAD', false, 'true')),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Number.parseInt(__env__('BC_RATE_LIMIT_WINDOW_MS', false, '900000'), 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Number.parseInt(__env__('BC_RATE_LIMIT_MAX_REQUESTS', false, '100'), 10),
  AUTH_RATE_LIMIT_MAX: Number.parseInt(__env__('BC_AUTH_RATE_LIMIT_MAX', false, '5'), 10),
  PAYMENT_RATE_LIMIT_MAX: Number.parseInt(__env__('BC_PAYMENT_RATE_LIMIT_MAX', false, '10'), 10),

  // Security monitoring
  ENABLE_SECURITY_LOGGING: stringToBoolean(__env__('BC_ENABLE_SECURITY_LOGGING', false, 'true')),
  ENABLE_THREAT_DETECTION: stringToBoolean(__env__('BC_ENABLE_THREAT_DETECTION', false, IS_PRODUCTION ? 'true' : 'false')),
  BLOCK_SUSPICIOUS_REQUESTS: stringToBoolean(__env__('BC_BLOCK_SUSPICIOUS_REQUESTS', false, IS_PRODUCTION ? 'true' : 'false')),

  // IP blocking
  ENABLE_IP_BLOCKING: stringToBoolean(__env__('BC_ENABLE_IP_BLOCKING', false, IS_PRODUCTION ? 'true' : 'false')),
  IP_BLOCK_THRESHOLD: Number.parseInt(__env__('BC_IP_BLOCK_THRESHOLD', false, IS_DEVELOPMENT ? '1000' : '10'), 10),
  IP_BLOCK_DURATION: Number.parseInt(__env__('BC_IP_BLOCK_DURATION', false, '3600'), 10), // 1 hour

  // Admin IP whitelist - empty in development to allow all IPs
  ADMIN_IP_WHITELIST: __env__('BC_ADMIN_IP_WHITELIST', false, IS_DEVELOPMENT ? '' : '').split(',').filter(ip => ip.trim()),

  // Trusted proxies
  TRUSTED_PROXIES: __env__('BC_TRUSTED_PROXIES', false, '').split(',').filter(proxy => proxy.trim()),
}

/**
 * User Document.
 *
 * @export
 * @interface User
 * @typedef {User}
 * @extends {Document}
 */
export interface User extends Document {
  supplier?: Types.ObjectId
  fullName: string
  email: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  active?: boolean
  language: string
  enableEmailNotifications?: boolean
  enableSmsNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  locations?: Types.ObjectId[]
  type?: bookcarsTypes.UserType
  blacklisted?: boolean
  payLater?: boolean
  customerId?: string
  contracts?: bookcarsTypes.Contract[]

  expireAt?: Date
  priceChangeRate?: number
  supplierDressLimit?: number
  notifyAdminOnNewDress?: boolean
}

/**
 * UserInfo.
 *
 * @export
 * @interface UserInfo
 * @typedef {UserInfo}
 */
export interface UserInfo {
  _id?: Types.ObjectId
  supplier?: Types.ObjectId
  fullName: string
  email?: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  active?: boolean
  language?: string
  enableEmailNotifications?: boolean
  enableSmsNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  type?: string
  blacklisted?: boolean
  payLater?: boolean

  priceChangeRate?: number
  supplierDressLimit?: number
  notifyAdminOnNewDress?: boolean
}

/**
 * Expense Document.
 *
 * @export
 * @interface Expense
 * @typedef {Expense}
 * @extends {Document}
 */
export interface Expense extends Document {
  supplier: Types.ObjectId
  category: 'maintenance' | 'cleaning' | 'storage' | 'marketing' | 'utilities' | 'rent' | 'insurance' | 'other'
  description: string
  amount: number
  currency: string
  date: Date
  dress?: Types.ObjectId
  receiptUrl?: string
  notes?: string
  isRecurring: boolean
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly'
  tags: string[]
}

/**
 * Revenue Document.
 *
 * @export
 * @interface Revenue
 * @typedef {Revenue}
 * @extends {Document}
 */
export interface Revenue extends Document {
  supplier: Types.ObjectId
  booking: Types.ObjectId
  dress: Types.ObjectId
  customer: Types.ObjectId
  amount: number
  currency: string
  type: 'rental' | 'deposit' | 'late_fee' | 'damage_fee' | 'cleaning_fee'
  date: Date
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'paypal' | 'stripe'
  transactionId?: string
  notes?: string
  isRefunded: boolean
  refundAmount: number
  refundDate?: Date
}

/**
 * DressMaintenance Document.
 *
 * @export
 * @interface DressMaintenance
 * @typedef {DressMaintenance}
 * @extends {Document}
 */
export interface DressMaintenance extends Document {
  dress: Types.ObjectId
  supplier: Types.ObjectId
  type: 'cleaning' | 'repair' | 'alteration' | 'inspection' | 'storage' | 'other'
  description: string
  cost: number
  currency: string
  scheduledDate: Date
  completedDate?: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  serviceProvider?: string
  notes?: string
  beforeImages: string[]
  afterImages: string[]
  nextMaintenanceDate?: Date
  isRecurring: boolean
  recurringInterval?: number
}

/**
 * AccessorySettings Document.
 *
 * @export
 * @interface AccessorySettings
 * @typedef {AccessorySettings}
 * @extends {Document}
 */
export interface AccessorySettings extends Document {
  supplier: Types.ObjectId
  accessoryPrices: {
    veil: number
    jewelry: number
    shoes: number
    headpiece: number
    handbag: number
    gloves: number
    hairAccessories: number
    undergarments: number
    wrapShawl: number
  }
  defaultAccessoryFee: number
  currency: string
  isActive: boolean
  lastUpdatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date

  // Instance methods
  getAccessoryPrice(accessoryType: string): number
  calculateAccessoriesTotal(accessories: string[]): number
}

/**
 * CustomerInsight Document.
 *
 * @export
 * @interface CustomerInsight
 * @typedef {CustomerInsight}
 * @extends {Document}
 */
export interface CustomerInsight extends Document {
  customer: Types.ObjectId
  supplier: Types.ObjectId
  totalBookings: number
  totalSpent: number
  averageBookingValue: number
  preferredDressTypes: string[]
  preferredSizes: string[]
  preferredColors: string[]
  lastBookingDate?: Date
  firstBookingDate?: Date
  customerLifetimeValue: number
  loyaltyScore: number
  riskScore: number
  cancellationRate: number
  averageRating: number
  notes?: string
  tags: string[]
  isVip: boolean
  communicationPreference: 'email' | 'sms' | 'phone' | 'whatsapp'
  specialRequests: string[]
  seasonalPreferences: {
    spring: string[]
    summer: string[]
    autumn: string[]
    winter: string[]
  }
}

/**
 * Booking Document.
 *
 * @export
 * @interface Booking
 * @typedef {Booking}
 * @extends {Document}
 */
export interface Booking extends Document {
  _id: Types.ObjectId
  supplier: Types.ObjectId
  dress?: Types.ObjectId
  customer: Types.ObjectId
  location: Types.ObjectId
  from: Date
  to: Date
  status: bookcarsTypes.BookingStatus
  cancellation?: boolean
  amendments?: boolean
  cancelRequest?: boolean
  price: number
  paidAmount?: number
  remainingAmount?: number
  paymentStatus?: 'pending' | 'partially-paid' | 'fully-paid' | 'refunded' | 'failed'
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  isDeposit: boolean
  paypalOrderId?: string
  fittingRequired?: boolean
  fittingDate?: Date
  fittingNotes?: string
  alterationNotes?: string
  accessoriesIncluded?: string[]
}

/**
 * Dress Document.
 *
 * @export
 * @interface Dress
 * @typedef {Dress}
 * @extends {Document}
 */
export interface Dress extends Document {
  name: string
  supplier: Types.ObjectId
  locations: Types.ObjectId[]

  price: number
  discountedPrice?: number
  bookingCount?: number
  totalRevenue?: number

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: bookcarsTypes.DressType
  size: bookcarsTypes.DressSize
  style: bookcarsTypes.DressStyle
  customizable: boolean

  images: string[]
  color: string
  length: number
  material: bookcarsTypes.DressMaterial
  cancellation: number
  amendments: number
  range: string
  accessories: string[]
  rating?: number
  rentals: number
  designerName?: string
  dressCode?: string
  fittingRequired?: boolean
  alterationNotes?: string
  careInstructions?: string
  occasionTags?: string[]
  season?: string
  neckline?: string
  sleeves?: string
  silhouette?: string
}

/**
 * DressInfo.
 *
 * @export
 * @interface DressInfo
 * @typedef {DressInfo}
 */
export interface DressInfo {
  _id?: Types.ObjectId
  name: string
  supplier: UserInfo
  locations: Types.ObjectId[]
  price: number
  deposit: number
  available: boolean
  type: bookcarsTypes.DressType
  size: bookcarsTypes.DressSize
  style: bookcarsTypes.DressStyle
  customizable?: boolean

  image?: string
  color: string
  length: number
  material: bookcarsTypes.DressMaterial
  cancellation: number
  amendments: number
  designerName?: string
  dressCode?: string
  fittingRequired?: boolean
  alterationNotes?: string
  careInstructions?: string
  occasionTags?: string[]
  season?: string
  neckline?: string
  sleeves?: string
  silhouette?: string
}

/**
 * FittingAppointment Document.
 *
 * @export
 * @interface FittingAppointment
 * @typedef {FittingAppointment}
 * @extends {Document}
 */
export interface FittingAppointment extends Document {
  customer: Types.ObjectId
  dress: Types.ObjectId
  supplier: Types.ObjectId
  location: Types.ObjectId
  appointmentDate: Date
  timeSlot: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  customerName: string
  customerPhone: string
  customerEmail: string
  notes?: string
  measurements?: {
    bust?: number
    waist?: number
    hips?: number
    height?: number
    shoulderWidth?: number
    armLength?: number
  }
  alterationsNeeded?: string
  fittingNotes?: string
  duration: number
}

/**
 * BookingInfo.
 *
 * @export
 * @interface BookingInfo
 * @typedef {BookingInfo}
 */
export interface BookingInfo {
  _id?: Types.ObjectId
  supplier: UserInfo
  dress?: Dress
  customer: UserInfo
  location: Types.ObjectId
  from: Date
  to: Date
  status: bookcarsTypes.BookingStatus
  cancellation?: boolean
  amendments?: boolean
  cancelRequest?: boolean
  price: number
  fittingRequired?: boolean
  fittingDate?: Date
  fittingNotes?: string
  alterationNotes?: string
  accessoriesIncluded?: string[]
}

/**
 * LocationValue Document.
 *
 * @export
 * @interface LocationValue
 * @typedef {LocationValue}
 * @extends {Document}
 */
export interface LocationValue extends Document {
  language: string
  value: string
}

/**
 * Country Document.
 *
 * @export
 * @interface Country
 * @typedef {Country}
 * @extends {Document}
 */
export interface Country extends Document {
  values: Types.ObjectId[]
  name?: string
  supplier?: Types.ObjectId
}

/**
 *CountryInfo.
 *
 * @export
 * @interface CountryInfo
 * @typedef {CountryInfo}
 */
export interface CountryInfo {
  _id?: Types.ObjectId
  name?: string
  values: LocationValue[]
}

/**
 * Location Document.
 *
 * @export
 * @interface Location
 * @typedef {Location}
 * @extends {Document}
 */
export interface Location extends Document {
  country: Types.ObjectId
  longitude?: number
  latitude?: number
  values: Types.ObjectId[]
  name?: string
  image?: string | null
  supplier?: Types.ObjectId
}

/**
 *LocationInfo.
 *
 * @export
 * @interface LocationInfo
 * @typedef {LocationInfo}
 */
export interface LocationInfo {
  _id?: Types.ObjectId
  longitude: number
  latitude: number
  name?: string
  image?: string | null
  values: LocationValue[]
}

/**
 * Notification Document.
 *
 * @export
 * @interface Notification
 * @typedef {Notification}
 * @extends {Document}
 */
export interface Notification extends Document {
  user: Types.ObjectId
  message: string
  title?: string
  type?: 'booking' | 'payment' | 'fitting' | 'reminder' | 'system' | 'review' | 'promotion'
  category?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  booking?: Types.ObjectId
  dress?: Types.ObjectId
  supplier?: Types.ObjectId
  isRead?: boolean
  emailSent?: boolean
  pushSent?: boolean
  actionUrl?: string
  actionText?: string
  expiresAt?: Date
}

/**
 * NotificationCounter Document.
 *
 * @export
 * @interface NotificationCounter
 * @typedef {NotificationCounter}
 * @extends {Document}
 */
export interface NotificationCounter extends Document {
  user: Types.ObjectId
  count?: number
}

/**
 * PushToken Document.
 *
 * @export
 * @interface PushToken
 * @typedef {PushToken}
 * @extends {Document}
 */
export interface PushToken extends Document {
  user: Types.ObjectId
  token: string
}

/**
 * Token Document.
 *
 * @export
 * @interface Token
 * @typedef {Token}
 * @extends {Document}
 */
export interface Token extends Document {
  user: Types.ObjectId
  token: string
  expireAt?: Date
}

/**
 * Payment Document.
 *
 * @export
 * @interface Payment
 * @typedef {Payment}
 * @extends {Document}
 */
export interface Payment extends Document {
  booking: Types.ObjectId
  amount: number
  remainingAmount: number
  totalAmount: number
  status: 'pending' | 'partially-paid' | 'fully-paid' | 'refunded' | 'failed'
  paymentMethod: 'payPal' | 'stripe' | 'visa'
  transactionId?: string
  paymentDate: Date
  notes?: string
}

/**
 * BankDetails Document.
 *
 * @export
 * @interface BankDetails
 * @typedef {BankDetails}
 * @extends {Document}
 */
export interface BankDetails extends Document {
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}
