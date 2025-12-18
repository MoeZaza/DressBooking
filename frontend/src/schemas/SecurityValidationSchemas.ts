import { z } from 'zod'
import validator from 'validator'
import ValidationService from '../services/ValidationService'

const validationService = ValidationService

/**
 * Security-focused validation schemas for all major entities
 */

// Base security validations
const secureString = (maxLength: number = 255, minLength: number = 0) =>
  z.string()
    .min(minLength, `Minimum length is ${minLength}`)
    .max(maxLength, `Maximum length is ${maxLength}`)
    .refine((val) => {
      const result = validationService.validateInput(val, 'string', {
        maxLength,
        minLength,
        sanitizationLevel: 'strict'
      })
      return result.isValid && result.threatLevel !== 'CRITICAL'
    }, 'Contains potentially dangerous content')

const secureEmail = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine((val) => {
    const result = validationService.validateEmail(val)
    return result.isValid
  }, 'Email contains security threats')

const securePhone = z.string()
  .max(20, 'Phone number too long')
  .refine((val) => {
    if (!val) {
      return true
    }
    const result = validationService.validatePhone(val)
    return result.isValid
  }, 'Invalid or unsafe phone number')

const secureUrl = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine((val) => {
    const result = validationService.validateUrl(val)
    return result.isValid
  }, 'URL contains security threats')

const securePassword = (minLength: number = 8) =>
  z.string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .max(128, 'Password too long')
    .refine((val) => {
      const result = validationService.validatePassword(val, minLength)
      return result.isValid
    }, 'Password does not meet security requirements')

// User validation schema
export const UserValidationSchema = z.object({
  fullName: secureString(100, 1),
  email: secureEmail,
  phone: securePhone.optional(),
  birthDate: z.date().optional(),
  location: secureString(100).optional(),
  bio: secureString(500).optional(),
  avatar: secureUrl.optional(),
  language: z.enum(['en', 'ar']).optional(),
  currency: z.enum(['USD', 'EUR', 'ILS', 'NIS']).optional(),
  verified: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  type: z.enum(['user', 'supplier', 'admin']).optional()
})

// Supplier validation schema
export const SupplierValidationSchema = z.object({
  fullName: secureString(100, 1),
  email: secureEmail,
  phone: securePhone.optional(),
  location: secureString(100).optional(),
  bio: secureString(1000).optional(),
  avatar: secureUrl.optional(),
  payLater: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  priceChangeRate: z.string()
    .refine((val) => !val || /^-?\d+(\.\d+)?$/.test(val), 'Invalid price change rate')
    .optional(),
  supplierDressLimit: z.string()
    .refine((val) => !val || /^\d+$/.test(val), 'Invalid dress limit')
    .optional(),
  notifyAdminOnNewDress: z.boolean().optional(),
  bankDetails: z.object({
    accountHolder: secureString(100).optional(),
    accountNumber: secureString(50).optional(),
    bankName: secureString(100).optional(),
    routingNumber: secureString(20).optional(),
    iban: secureString(34).optional(),
    swiftCode: secureString(11).optional()
  }).optional()
})

// Location validation schema
export const LocationValidationSchema = z.object({
  name: secureString(100, 1),
  country: secureString(100, 1),
  city: secureString(100, 1),
  address: secureString(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  zipCode: secureString(20).optional(),
  phone: securePhone.optional(),
  email: secureEmail.optional()
})

// Dress validation schema
export const DressValidationSchema = z.object({
  name: secureString(200, 1), // Required field
  type: z.enum(['wedding', 'evening', 'cocktail', 'casual', 'formal', 'party']),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'custom']),
  style: z.enum(['modern', 'classic', 'vintage', 'bohemian', 'minimalist']),
  color: secureString(50, 1),
  price: z.number().min(0).max(100000),
  deposit: z.number().min(0).max(100000),
  description: secureString(2000).optional(),
  designerName: secureString(100).optional(),
  dressCode: secureString(50, 1), // Required field
  alterationNotes: secureString(1000).optional(),
  careInstructions: secureString(1000).optional(),
  occasionTags: z.array(secureString(50)).max(10).optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter', 'all-season']).optional(),
  neckline: secureString(50).optional(),
  sleeves: secureString(50).optional(),
  silhouette: secureString(50).optional(),
  available: z.boolean().optional(),
  fittingRequired: z.boolean().optional(),
  images: z.array(secureUrl).max(20).optional(),
  supplier: z.string().optional(),
  locations: z.array(z.string()).optional(),
  rentals: z.number().min(0).optional()
})

// Booking validation schema
export const BookingValidationSchema = z.object({
  from: z.date(),
  to: z.date(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  dress: z.string().min(1, 'Dress is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  location: z.string().min(1, 'Location is required'),
  renter: z.string().optional(),
  
  // Customer details for guest bookings
  fullName: secureString(100).optional(),
  email: secureEmail.optional(),
  phone: securePhone.optional(),
  birthDate: z.date().optional(),
  
  // Booking options
  cancellation: z.boolean().optional(),
  amendments: z.boolean().optional(),
  accessories: z.boolean().optional(),
  
  // Payment details
  price: z.number().min(0),
  deposit: z.number().min(0).optional(),
  payLater: z.boolean().optional(),
  payDeposit: z.boolean().optional(),
  
  // Additional info
  additionalDriver: secureString(100).optional(),
  notes: secureString(1000).optional()
}).refine((data) => {
  return data.from < data.to
}, {
  message: 'End date must be after start date',
  path: ['to']
})

// Fitting appointment validation schema
export const FittingAppointmentValidationSchema = z.object({
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  duration: z.number().min(15).max(240), // 15 minutes to 4 hours
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  dress: z.string().min(1, 'Dress is required'),
  customer: z.string().min(1, 'Customer is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  location: z.string().min(1, 'Location is required'),
  
  // Customer details for guest appointments
  fullName: secureString(100).optional(),
  email: secureEmail.optional(),
  phone: securePhone.optional(),
  
  notes: secureString(1000).optional(),
  alterationNotes: secureString(1000).optional(),
  measurements: z.record(z.string(), z.number()).optional()
})

// Payment validation schema
export const PaymentValidationSchema = z.object({
  amount: z.number().min(0.01).max(100000),
  currency: z.enum(['USD', 'EUR', 'ILS', 'NIS']),
  method: z.enum(['visa', 'mastercard', 'paypal', 'stripe', 'cash', 'bank_transfer']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  booking: z.string().min(1, 'Booking is required'),
  
  // Card details (for card payments)
  cardNumber: z.string()
    .regex(/^\d{13,19}$/, 'Invalid card number')
    .refine((val) => validator.isCreditCard(val), 'Invalid credit card')
    .optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(new Date().getFullYear()).optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional(),
  cardHolderName: secureString(100).optional(),
  
  // Billing address
  billingAddress: z.object({
    street: secureString(200),
    city: secureString(100),
    state: secureString(100).optional(),
    zipCode: secureString(20),
    country: secureString(100)
  }).optional(),
  
  description: secureString(500).optional(),
  reference: secureString(100).optional()
})

// Review validation schema
export const ReviewValidationSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: secureString(2000).optional(),
  booking: z.string().min(1, 'Booking is required'),
  dress: z.string().min(1, 'Dress is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  reviewer: z.string().min(1, 'Reviewer is required'),
  
  // Review aspects
  qualityRating: z.number().min(1).max(5).optional(),
  serviceRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  
  // Moderation
  approved: z.boolean().optional(),
  moderatorNotes: secureString(1000).optional()
})

// Notification validation schema
export const NotificationValidationSchema = z.object({
  user: z.string().min(1, 'User is required'),
  message: secureString(1000, 1),
  type: z.enum(['info', 'warning', 'error', 'success']),
  category: z.enum(['booking', 'payment', 'system', 'promotion', 'reminder']),
  read: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  
  // Related entities
  booking: z.string().optional(),
  dress: z.string().optional(),
  supplier: z.string().optional(),
  
  // Delivery options
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  
  // Scheduling
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional()
})

// Search form validation schema
export const SearchFormValidationSchema = z.object({
  from: z.date().nullable(),
  to: z.date().nullable(),
  location: z.string().optional(),
  dressType: z.enum(['wedding', 'evening', 'cocktail', 'casual', 'formal', 'party']).optional(),
  dressSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'custom']).optional(),
  dressStyle: z.enum(['modern', 'classic', 'vintage', 'bohemian', 'minimalist']).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  keyword: secureString(100).optional()
}).refine((data) => {
  if (data.from && data.to) {
    return data.from < data.to
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['to']
})

// Export all schemas
export const SecurityValidationSchemas = {
  User: UserValidationSchema,
  Supplier: SupplierValidationSchema,
  Location: LocationValidationSchema,
  Dress: DressValidationSchema,
  Booking: BookingValidationSchema,
  FittingAppointment: FittingAppointmentValidationSchema,
  Payment: PaymentValidationSchema,
  Review: ReviewValidationSchema,
  Notification: NotificationValidationSchema,
  SearchForm: SearchFormValidationSchema
}

export default SecurityValidationSchemas
