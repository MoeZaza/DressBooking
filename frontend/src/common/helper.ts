import { toast } from 'react-toastify'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'
import * as PaymentService from '@/services/PaymentService'
import * as UserService from '@/services/UserService'

// Re-export joinURL from bookcars-helper for convenience
export const joinURL = bookcarsHelper.joinURL

/**
 * Get language.
 *
 * @param {string} code
 * @returns {*}
 */
export const getLanguage = (code: string) => env._LANGUAGES.find((l) => l.code === code)

/**
 * Toast info message.
 *
 * @param {string} message
 */
export const info = (message: string) => {
  toast.info(message)
}

/**
 * Enhanced error response interface
 */
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    timestamp: string
    requestId?: string
  }
  security?: {
    sanitized: boolean
    timestamp: string
    environment: string
  }
}

/**
 * Check if error is an API error response
 */
const isApiErrorResponse = (err: any): err is { data: ApiErrorResponse } => {
  return err?.data?.error?.code && err?.data?.error?.message
}

/**
 * Get user-friendly error message from API error
 */
const getErrorMessage = (err: unknown): string => {
  // Handle API error responses
  if (isApiErrorResponse(err)) {
    const { error } = err.data

    // Map specific error codes to user-friendly messages
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return commonStrings.VALIDATION_ERROR || error.message
      case 'UNAUTHORIZED':
        return commonStrings.UNAUTHORIZED || 'Please log in to continue'
      case 'FORBIDDEN':
        return commonStrings.FORBIDDEN || 'You do not have permission to perform this action'
      case 'RESOURCE_NOT_FOUND':
        return commonStrings.NOT_FOUND || 'The requested resource was not found'
      case 'DRESS_NOT_AVAILABLE':
        return commonStrings.DRESS_NOT_AVAILABLE || 'This dress is not available for the selected dates'
      case 'BOOKING_CONFLICT':
        return commonStrings.BOOKING_CONFLICT || 'There is a scheduling conflict with your booking'
      case 'PAYMENT_FAILED':
        return commonStrings.PAYMENT_FAILED || 'Payment processing failed. Please try again'
      case 'RATE_LIMIT_EXCEEDED':
        return commonStrings.RATE_LIMIT_EXCEEDED || 'Too many requests. Please wait and try again'
      case 'SUSPICIOUS_ACTIVITY':
        return commonStrings.SECURITY_ERROR || 'Security check failed. Please contact support'
      default:
        return error.message || commonStrings.GENERIC_ERROR
    }
  }

  // Handle Axios errors
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosError = err as any

    if (axiosError.response?.status === 401) {
      return commonStrings.UNAUTHORIZED || 'Please log in to continue'
    }

    if (axiosError.response?.status === 403) {
      return commonStrings.FORBIDDEN || 'You do not have permission to perform this action'
    }

    if (axiosError.response?.status === 404) {
      return commonStrings.NOT_FOUND || 'The requested resource was not found'
    }

    if (axiosError.response?.status >= 500) {
      return commonStrings.SERVER_ERROR || 'Server error. Please try again later'
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
  }

  // Handle network errors
  if (err && typeof err === 'object' && 'message' in err) {
    const error = err as Error
    if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
      return commonStrings.NETWORK_ERROR || 'Network error. Please check your connection'
    }
    return error.message
  }

  // Handle string errors
  if (typeof err === 'string') {
    return err
  }

  return commonStrings.GENERIC_ERROR
}

/**
 * Toast error message with enhanced error handling.
 *
 * @param {?unknown} [err]
 * @param {?string} [message]
 */
export const error = (err?: unknown, message?: string) => {
  // Log error for debugging (only in development)
  if (err && process.env.NODE_ENV === 'development') {
    console.error('Error details:', err)
  }

  const errorMessage = message || getErrorMessage(err)
  toast.error(errorMessage)
}

/**
 * Handle API errors with specific actions
 */
export const handleApiError = (err: unknown, customMessage?: string) => {
  const errorMessage = customMessage || getErrorMessage(err)

  // Handle specific error types
  if (isApiErrorResponse(err)) {
    const { error: apiError } = err.data

    // Handle authentication errors
    if (apiError.code === 'UNAUTHORIZED' || apiError.code === 'TOKEN_EXPIRED') {
      // Redirect to login or refresh token
      window.location.href = '/sign-in'
      return
    }

    // Handle permission errors
    if (apiError.code === 'FORBIDDEN') {
      toast.error(errorMessage)
      return
    }

    // Handle validation errors with specific styling
    if (apiError.code === 'VALIDATION_ERROR') {
      toast.error(errorMessage, {
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }
      })
      return
    }
  }

  // Default error handling
  toast.error(errorMessage)
}

/**
 * Get dress type label.
 *
 * @param {string} type
 * @returns {string}
 */
export const getDressType = (type: string) => {
  switch (type) {
    case bookcarsTypes.DressType.Traditional:
      return strings.TRADITIONAL
    case bookcarsTypes.DressType.Modern:
      return strings.MODERN
    case bookcarsTypes.DressType.Designer:
      return strings.DESIGNER
    case bookcarsTypes.DressType.Vintage:
      return strings.VINTAGE
    case bookcarsTypes.DressType.Casual:
      return strings.CASUAL
    default:
      return strings.UNKNOWN
  }
}

export const getDressTypeLabel = (type: string) => {
  return getDressType(type)
}

/**
 * Get dress size label.
 *
 * @param {string} size
 * @returns {string}
 */
export const getDressSize = (size: string) => {
  switch (size) {
    case bookcarsTypes.DressSize.Small:
      return strings.SIZE_SMALL
    case bookcarsTypes.DressSize.Medium:
      return strings.SIZE_MEDIUM
    case bookcarsTypes.DressSize.Large:
      return strings.SIZE_LARGE
    case bookcarsTypes.DressSize.ExtraLarge:
      return strings.SIZE_EXTRA_LARGE
    default:
      return strings.UNKNOWN
  }
}

export const getDressSizeLabel = (size: string) => {
  return getDressSize(size)
}

/**
 * Get dress material label.
 *
 * @param {string} material
 * @returns {string}
 */
export const getDressMaterial = (material: string) => {
  switch (material) {
    case bookcarsTypes.DressMaterial.Silk:
      return strings.MATERIAL_SILK
    case bookcarsTypes.DressMaterial.Cotton:
      return strings.MATERIAL_COTTON
    case bookcarsTypes.DressMaterial.Lace:
      return strings.MATERIAL_LACE
    case bookcarsTypes.DressMaterial.Satin:
      return strings.MATERIAL_SATIN
    case bookcarsTypes.DressMaterial.Chiffon:
      return strings.MATERIAL_CHIFFON
    default:
      return strings.UNKNOWN
  }
}

export const getDressMaterialLabel = (material: string) => {
  return getDressMaterial(material)
}

/**
 * Get dress style label.
 *
 * @param {string} style
 * @returns {string}
 */
export const getDressStyle = (style: string) => {
  switch (style) {
    case bookcarsTypes.DressStyle.Traditional:
      return strings.STYLE_TRADITIONAL
    case bookcarsTypes.DressStyle.Modern:
      return strings.STYLE_MODERN
    case bookcarsTypes.DressStyle.Designer:
      return strings.STYLE_DESIGNER
    case bookcarsTypes.DressStyle.Vintage:
      return strings.STYLE_VINTAGE
    default:
      return strings.UNKNOWN
  }
}

export const getDressStyleLabel = (style: string) => {
  return getDressStyle(style)
}

/**
 * Get amendments label.
 *
 * @param {number} amendments
 * @param {string} language
 * @returns {string}
 */
export const getAmendments = async (amendments: number, language: string, priceChangeRate: number) => {
  const fr = bookcarsHelper.isFrench(language)

  // Check for null/undefined values
  if (amendments === null || amendments === undefined) {
    return `${strings.AMENDMENTS}${fr ? ' : ' : ': '}${strings.UNAVAILABLE}${fr ? 's' : ''}`
  }

  if (amendments === -1) {
    return `${strings.AMENDMENTS}${fr ? ' : ' : ': '}${strings.UNAVAILABLE}${fr ? 's' : ''}`
  }
  if (amendments === 0) {
    return `${strings.AMENDMENTS}${fr ? ' : ' : ': '}${strings.INCLUDED}${fr ? 'es' : ''}`
  }
  let _amendments = await PaymentService.convertPrice(amendments)
  _amendments += _amendments * (priceChangeRate / 100)
  return `${strings.AMENDMENTS}${fr ? ' : ' : ': '}${bookcarsHelper.formatPrice(_amendments, commonStrings.CURRENCY, language)}`
}

/**
 * Get cancellation label.
 *
 * @param {number} cancellation
 * @param {string} language
 * @returns {string}
 */
export const getCancellation = async (cancellation: number, language: string, priceChangeRate: number) => {
  const fr = bookcarsHelper.isFrench(language)

  // Check for null/undefined values
  if (cancellation === null || cancellation === undefined) {
    return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${strings.UNAVAILABLE}`
  }

  if (cancellation === -1) {
    return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${strings.UNAVAILABLE}`
  }
  if (cancellation === 0) {
    return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${strings.INCLUDED}${fr ? 'e' : ''}`
  }
  let _cancellation = await PaymentService.convertPrice(cancellation)
  _cancellation += _cancellation * (priceChangeRate / 100)
  return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${bookcarsHelper.formatPrice(_cancellation, commonStrings.CURRENCY, language)}`
}

/**
 * Get booking status label.
 *
 * @param {string} status
 * @returns {string}
 */
export const getBookingStatus = (status?: bookcarsTypes.BookingStatus) => {
  switch (status) {
    case bookcarsTypes.BookingStatus.Void:
      return commonStrings.BOOKING_STATUS_VOID

    case bookcarsTypes.BookingStatus.Pending:
      return commonStrings.BOOKING_STATUS_PENDING

    case bookcarsTypes.BookingStatus.Deposit:
      return commonStrings.BOOKING_STATUS_DEPOSIT

    case bookcarsTypes.BookingStatus.Paid:
      return commonStrings.BOOKING_STATUS_PAID

    case bookcarsTypes.BookingStatus.Reserved:
      return commonStrings.BOOKING_STATUS_RESERVED

    case bookcarsTypes.BookingStatus.Cancelled:
      return commonStrings.BOOKING_STATUS_CANCELLED

    default:
      return ''
  }
}

/**
 * Get all booking statuses.
 *
 * @returns {bookcarsTypes.StatusFilterItem[]}
 */
export const getBookingStatuses = (): bookcarsTypes.StatusFilterItem[] => [
  {
    value: bookcarsTypes.BookingStatus.Void,
    label: commonStrings.BOOKING_STATUS_VOID,
  },
  {
    value: bookcarsTypes.BookingStatus.Pending,
    label: commonStrings.BOOKING_STATUS_PENDING,
  },
  {
    value: bookcarsTypes.BookingStatus.Deposit,
    label: commonStrings.BOOKING_STATUS_DEPOSIT,
  },
  {
    value: bookcarsTypes.BookingStatus.Paid,
    label: commonStrings.BOOKING_STATUS_PAID,
  },
  {
    value: bookcarsTypes.BookingStatus.Reserved,
    label: commonStrings.BOOKING_STATUS_RESERVED,
  },
  {
    value: bookcarsTypes.BookingStatus.Cancelled,
    label: commonStrings.BOOKING_STATUS_CANCELLED,
  },
]

/**
 * Get days label
 *
 * @param {number} days
 * @returns {string}
 */
export const getDays = (days: number) =>
  `${strings.PRICE_DAYS_PART_1} ${days} ${strings.PRICE_DAYS_PART_2}${days > 1 ? 's' : ''}`

/**
 * Get short days label.
 *
 * @param {number} days
 * @returns {string}
 */
export const getDaysShort = (days: number) => `${days} ${strings.PRICE_DAYS_PART_2}${days > 1 ? 's' : ''}`

/**
 * Get cancellation option label.
 *
 * @param {number} cancellation
 * @param {string} language
 * @returns {string}
 */
export const getCancellationOption = async (cancellation: number, language: string, priceChangeRate: number) => {
  const fr = bookcarsHelper.isFrench(language)

  // Check for null/undefined values
  if (cancellation === null || cancellation === undefined) {
    return strings.UNAVAILABLE
  }

  if (cancellation === -1) {
    return strings.UNAVAILABLE
  }
  if (cancellation === 0) {
    return `${strings.INCLUDED}${fr ? 'e' : ''}`
  }
  let _cancellation = await PaymentService.convertPrice(cancellation)
  _cancellation += _cancellation * (priceChangeRate / 100)
  return `+ ${bookcarsHelper.formatPrice(_cancellation, commonStrings.CURRENCY, language)}`
}

/**
 * Get amendments option label.
 *
 * @param {number} amendments
 * @param {string} language
 * @param {number} priceChangeRate
 * @returns {string}
 */
export const getAmendmentsOption = async (amendments: number, language: string, priceChangeRate: number) => {
  const fr = bookcarsHelper.isFrench(language)

  // Check for null/undefined values
  if (amendments === null || amendments === undefined) {
    return strings.UNAVAILABLE
  }

  if (amendments === -1) {
    return `${strings.UNAVAILABLE}${fr ? 's' : ''}`
  }
  if (amendments === 0) {
    return `${strings.INCLUDED}${fr ? 'es' : ''}`
  }
  let _amendments = await PaymentService.convertPrice(amendments)
  _amendments += _amendments * (priceChangeRate / 100)
  return `+ ${bookcarsHelper.formatPrice(_amendments, commonStrings.CURRENCY, language)}`
}

/**
 * Check whether a dress option is available or not.
 *
 * @param {(bookcarsTypes.Dress | undefined)} dress
 * @param {string} option
 * @returns {boolean}
 */
export const dressOptionAvailable = (dress: bookcarsTypes.Dress | undefined, option: string) =>
  dress && option in dress && (dress[option] as number) > -1

/**
 * Return [latitude, longitude] of user.
 *
 * @async
 * @returns {Promise<[number, number] | null>}
 */
export const getLocation = async (): Promise<[number, number] | null> => {
  try {
    if (navigator.geolocation) {
      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      const { latitude, longitude } = position.coords
      return [latitude, longitude]
    }
    console.log('Geolocation is not supported by this browser.')
  } catch (err: any) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        console.log('User denied the request for Geolocation:', err.message)
        break
      case err.POSITION_UNAVAILABLE:
        console.log('Location information is unavailable:', err.message)
        break
      case err.TIMEOUT:
        console.log('The request to get user location timed out:', err.message)
        break
      default:
        console.log('An unknown geolocation error occurred:', err.message)
        break
    }
  }

  return null
}

/**
 * Download URI.
 *
 * @param {string} uri
 * @param {string} [name='']
 */
export const downloadURI = (uri: string, name: string = '') => {
  const link = document.createElement('a')
  // If you don't know the name or want to use
  // the webserver default set name = ''
  link.setAttribute('download', name)
  link.setAttribute('target', '_blank')
  link.href = uri
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/**
 * Verify reCAPTCHA token.
 *
 * @async
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const verifyReCaptcha = async (token: string): Promise<boolean> => {
  try {
    const ip = await UserService.getIP()
    const status = await UserService.verifyRecaptcha(token, ip)
    const valid = status === 200
    return valid
  } catch (err) {
    error(err)
    return false
  }
}

/**
 * Check whether a user is an admin or not.
 *
 * @param {?bookcarsTypes.User} [user]
 * @returns {boolean}
 */
export const admin = (user?: bookcarsTypes.User | null): boolean => (user && user.type === bookcarsTypes.RecordType.Admin) || false

/**
 * Check whether a user is a supplier or not.
 *
 * @param {?bookcarsTypes.User} [user]
 * @returns {boolean}
 */
export const supplier = (user?: bookcarsTypes.User | null): boolean => (user && user.type === bookcarsTypes.RecordType.Supplier) || false

/**
 * Get current user from localStorage.
 *
 * @returns {bookcarsTypes.User | null}
 */
export const getUser = (): bookcarsTypes.User | null => {
  const user = localStorage.getItem('bc-user')
  return user ? JSON.parse(user) : null
}

/**
 * Get dress range label.
 *
 * @param {string} range
 * @returns {string}
 */
export const getDressRange = (range: bookcarsTypes.DressRange) => {
  switch (range) {
    case bookcarsTypes.DressRange.Mini:
      return strings.DRESS_RANGE_MINI

    case bookcarsTypes.DressRange.Midi:
      return strings.DRESS_RANGE_MIDI

    case bookcarsTypes.DressRange.Maxi:
      return strings.DRESS_RANGE_MAXI

    case bookcarsTypes.DressRange.Bridal:
      return strings.DRESS_RANGE_BRIDAL

    case bookcarsTypes.DressRange.Evening:
      return strings.DRESS_RANGE_EVENING

    case bookcarsTypes.DressRange.Cocktail:
      return strings.DRESS_RANGE_COCKTAIL

    case bookcarsTypes.DressRange.Casual:
      return strings.DRESS_RANGE_CASUAL

    default:
      return ''
  }
}
