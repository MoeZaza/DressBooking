/**
 * OpenAPI Schema Definitions for BookDress API
 * 
 * This file contains comprehensive schema definitions for all data models
 * used in the BookDress dress rental platform.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - fullName
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Unique identifier for the user
 *           example: "507f1f77bcf86cd799439011"
 *         supplier:
 *           type: string
 *           format: objectId
 *           description: Reference to supplier user (for supplier accounts)
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "user@example.com"
 *         phone:
 *           type: string
 *           description: User's phone number
 *           example: "+972501234567"
 *         fullName:
 *           type: string
 *           description: User's full name
 *           example: "Sarah Ahmed"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (write-only)
 *           writeOnly: true
 *         birthDate:
 *           type: string
 *           format: date
 *           description: User's birth date
 *         verified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *           default: false
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was verified
 *         active:
 *           type: boolean
 *           description: Whether the user account is active
 *           default: false
 *         language:
 *           type: string
 *           enum: [ar, en]
 *           description: User's preferred language
 *           default: ar
 *         enableEmailNotifications:
 *           type: boolean
 *           description: Whether email notifications are enabled
 *           default: true
 *         enableSmsNotifications:
 *           type: boolean
 *           description: Whether SMS notifications are enabled
 *           default: true
 *         avatar:
 *           type: string
 *           description: URL to user's avatar image
 *         bio:
 *           type: string
 *           description: User's biography
 *         location:
 *           type: string
 *           description: User's location
 *         type:
 *           type: string
 *           enum: [admin, supplier, user]
 *           description: User account type
 *           default: user
 *         blacklisted:
 *           type: boolean
 *           description: Whether the user is blacklisted
 *           default: false
 *         payLater:
 *           type: boolean
 *           description: Whether the user can pay later
 *           default: true
 *         customerId:
 *           type: string
 *           description: Stripe customer ID
 *         contracts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Contract'
 *         priceChangeRate:
 *           type: number
 *           description: Price change rate for supplier
 *         supplierDressLimit:
 *           type: number
 *           description: Maximum number of dresses for supplier
 *         notifyAdminOnNewDress:
 *           type: boolean
 *           description: Whether to notify admin on new dress
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 * 
 *     UserCreateRequest:
 *       type: object
 *       required:
 *         - email
 *         - fullName
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         fullName:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         phone:
 *           type: string
 *         birthDate:
 *           type: string
 *           format: date
 *         language:
 *           type: string
 *           enum: [ar, en]
 *           default: ar
 *         type:
 *           type: string
 *           enum: [admin, supplier, user]
 *           default: user
 * 
 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         phone:
 *           type: string
 *         birthDate:
 *           type: string
 *           format: date
 *         language:
 *           type: string
 *           enum: [ar, en]
 *         enableEmailNotifications:
 *           type: boolean
 *         enableSmsNotifications:
 *           type: boolean
 *         bio:
 *           type: string
 *         location:
 *           type: string
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         stayConnected:
 *           type: boolean
 *           default: false
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *         blacklisted:
 *           type: boolean
 *           description: Whether the user is blacklisted
 * 
 *     Contract:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         language:
 *           type: string
 *           minLength: 2
 *           maxLength: 2
 *           description: Language code for the contract
 *         file:
 *           type: string
 *           description: Contract file path
 * 
 *     Location:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         name:
 *           type: string
 *           description: Location name
 *         values:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LocationValue'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     LocationValue:
 *       type: object
 *       required:
 *         - language
 *         - value
 *       properties:
 *         language:
 *           type: string
 *           minLength: 2
 *           maxLength: 2
 *         value:
 *           type: string
 * 
 *     Country:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         name:
 *           type: string
 *           description: Country name
 *         code:
 *           type: string
 *           description: Country code (ISO 3166-1 alpha-2)
 *         values:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LocationValue'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         rows:
 *           type: array
 *           items: {}
 *         rowCount:
 *           type: integer
 *           description: Total number of items
 *         pageCount:
 *           type: integer
 *           description: Total number of pages
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error type
 *         message:
 *           type: string
 *           description: Error message
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *
 *     Dress:
 *       type: object
 *       required:
 *         - name
 *         - supplier
 *         - locations
 *         - price
 *         - deposit
 *         - type
 *         - size
 *         - color
 *         - length
 *         - material
 *         - cancellation
 *         - amendments
 *         - range
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         name:
 *           type: string
 *           description: Dress name
 *         supplier:
 *           type: string
 *           format: objectId
 *           description: Reference to supplier user
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *             format: objectId
 *           description: Available locations for this dress
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Dress rental price
 *         discountedPrice:
 *           type: number
 *           minimum: 0
 *           description: Discounted price if applicable
 *         deposit:
 *           type: number
 *           minimum: 0
 *           description: Security deposit amount
 *         available:
 *           type: boolean
 *           description: Whether the dress is available for rental
 *           default: true
 *         fullyBooked:
 *           type: boolean
 *           description: Whether the dress is fully booked
 *           default: false
 *         comingSoon:
 *           type: boolean
 *           description: Whether the dress is coming soon
 *           default: false
 *         type:
 *           type: string
 *           enum: [wedding, evening, cocktail, casual, formal]
 *           description: Type of dress
 *         size:
 *           type: string
 *           enum: [XS, S, M, L, XL, XXL]
 *           description: Dress size
 *         customizable:
 *           type: boolean
 *           description: Whether the dress can be customized
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         color:
 *           type: string
 *           description: Dress color
 *         length:
 *           type: number
 *           description: Dress length in centimeters
 *         material:
 *           type: string
 *           enum: [silk, cotton, lace, satin, chiffon]
 *           description: Dress material
 *         cancellation:
 *           type: number
 *           description: Cancellation fee percentage
 *         amendments:
 *           type: number
 *           description: Amendment fee percentage
 *         range:
 *           type: string
 *           enum: [mini, midi, maxi, bridal, evening, cocktail, casual]
 *           description: Dress range/category
 *         accessories:
 *           type: array
 *           items:
 *             type: string
 *             enum: [veil, jewelry, shoes, headpiece]
 *           description: Available accessories
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Average rating
 *         rentals:
 *           type: number
 *           description: Number of times rented
 *           default: 0
 *         designerName:
 *           type: string
 *           description: Designer name
 *         dressCode:
 *           type: string
 *           description: Unique dress code (owner/admin only)
 *         fittingRequired:
 *           type: boolean
 *           description: Whether fitting is required
 *         alterationNotes:
 *           type: string
 *           description: Alteration notes
 *         careInstructions:
 *           type: string
 *           description: Care instructions
 *         occasionTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Occasion tags
 *         season:
 *           type: string
 *           description: Suitable season
 *         neckline:
 *           type: string
 *           description: Neckline style
 *         sleeves:
 *           type: string
 *           description: Sleeve style
 *         silhouette:
 *           type: string
 *           description: Dress silhouette
 *         lastMaintenance:
 *           type: string
 *           format: date-time
 *           description: Last maintenance date
 *         bookingCount:
 *           type: number
 *           description: Total booking count
 *           default: 0
 *         totalRevenue:
 *           type: number
 *           description: Total revenue generated
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DressCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - supplier
 *         - locations
 *         - price
 *         - deposit
 *         - type
 *         - size
 *         - color
 *         - length
 *         - material
 *         - cancellation
 *         - amendments
 *         - range
 *       properties:
 *         name:
 *           type: string
 *         supplier:
 *           type: string
 *           format: objectId
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *             format: objectId
 *         price:
 *           type: number
 *           minimum: 0
 *         discountedPrice:
 *           type: number
 *           minimum: 0
 *         deposit:
 *           type: number
 *           minimum: 0
 *         available:
 *           type: boolean
 *           default: true
 *         type:
 *           type: string
 *           enum: [wedding, evening, cocktail, casual, formal]
 *         size:
 *           type: string
 *           enum: [XS, S, M, L, XL, XXL]
 *         color:
 *           type: string
 *         length:
 *           type: number
 *         material:
 *           type: string
 *           enum: [silk, cotton, lace, satin, chiffon]
 *         cancellation:
 *           type: number
 *         amendments:
 *           type: number
 *         range:
 *           type: string
 *           enum: [mini, midi, maxi, bridal, evening, cocktail, casual]
 *         accessories:
 *           type: array
 *           items:
 *             type: string
 *             enum: [veil, jewelry, shoes, headpiece]
 *         designerName:
 *           type: string
 *         fittingRequired:
 *           type: boolean
 *         alterationNotes:
 *           type: string
 *         careInstructions:
 *           type: string
 *         occasionTags:
 *           type: array
 *           items:
 *             type: string
 *         season:
 *           type: string
 *         neckline:
 *           type: string
 *         sleeves:
 *           type: string
 *         silhouette:
 *           type: string
 *
 *     Booking:
 *       type: object
 *       required:
 *         - supplier
 *         - dress
 *         - customer
 *         - location
 *         - from
 *         - to
 *         - status
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         supplier:
 *           type: string
 *           format: objectId
 *           description: Reference to supplier user
 *         dress:
 *           type: string
 *           format: objectId
 *           description: Reference to booked dress
 *         customer:
 *           type: string
 *           format: objectId
 *           description: Reference to customer user
 *         location:
 *           type: string
 *           format: objectId
 *           description: Booking location
 *         from:
 *           type: string
 *           format: date-time
 *           description: Rental start date
 *         to:
 *           type: string
 *           format: date-time
 *           description: Rental end date
 *         status:
 *           type: string
 *           enum: [void, pending, deposit, paid, reserved, cancelled]
 *           description: Booking status
 *         cancellation:
 *           type: boolean
 *           description: Whether booking is cancelled
 *           default: false
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: When booking was cancelled
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Total booking price
 *         sessionId:
 *           type: string
 *           description: Payment session ID
 *         paymentIntentId:
 *           type: string
 *           description: Stripe payment intent ID
 *         customerId:
 *           type: string
 *           description: Stripe customer ID
 *         isDeposit:
 *           type: boolean
 *           description: Whether this is a deposit payment
 *           default: false
 *         paypalOrderId:
 *           type: string
 *           description: PayPal order ID
 *         fittingRequired:
 *           type: boolean
 *           description: Whether fitting is required
 *           default: false
 *         fittingDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled fitting date
 *         fittingNotes:
 *           type: string
 *           description: Fitting notes
 *         alterationNotes:
 *           type: string
 *           description: Alteration notes
 *         accessoriesIncluded:
 *           type: array
 *           items:
 *             type: string
 *           description: Included accessories
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     BookingCreateRequest:
 *       type: object
 *       required:
 *         - supplier
 *         - dress
 *         - customer
 *         - location
 *         - from
 *         - to
 *         - price
 *       properties:
 *         supplier:
 *           type: string
 *           format: objectId
 *         dress:
 *           type: string
 *           format: objectId
 *         customer:
 *           type: string
 *           format: objectId
 *         location:
 *           type: string
 *           format: objectId
 *         from:
 *           type: string
 *           format: date-time
 *         to:
 *           type: string
 *           format: date-time
 *         price:
 *           type: number
 *           minimum: 0
 *         fittingRequired:
 *           type: boolean
 *           default: false
 *         fittingDate:
 *           type: string
 *           format: date-time
 *         fittingNotes:
 *           type: string
 *         alterationNotes:
 *           type: string
 *         accessoriesIncluded:
 *           type: array
 *           items:
 *             type: string
 *
 *     FittingAppointment:
 *       type: object
 *       required:
 *         - supplier
 *         - customer
 *         - location
 *         - from
 *         - to
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         supplier:
 *           type: string
 *           format: objectId
 *           description: Reference to supplier user
 *         customer:
 *           type: string
 *           format: objectId
 *           description: Reference to customer user
 *         location:
 *           type: string
 *           format: objectId
 *           description: Appointment location
 *         from:
 *           type: string
 *           format: date-time
 *           description: Appointment start time
 *         to:
 *           type: string
 *           format: date-time
 *           description: Appointment end time
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: Appointment status
 *           default: pending
 *         cancellation:
 *           type: boolean
 *           description: Whether appointment is cancelled
 *           default: false
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: When appointment was cancelled
 *         notes:
 *           type: string
 *           description: Appointment notes
 *         measurements:
 *           type: object
 *           description: Customer measurements
 *         alterationRequests:
 *           type: array
 *           items:
 *             type: string
 *           description: Requested alterations
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Notification:
 *       type: object
 *       required:
 *         - user
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         user:
 *           type: string
 *           format: objectId
 *           description: Reference to user
 *         message:
 *           type: string
 *           description: Notification message
 *         booking:
 *           type: string
 *           format: objectId
 *           description: Related booking (if applicable)
 *         isRead:
 *           type: boolean
 *           description: Whether notification is read
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AccessorySettings:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         veilPrice:
 *           type: number
 *           minimum: 0
 *           description: Price for veil accessory
 *         jewelryPrice:
 *           type: number
 *           minimum: 0
 *           description: Price for jewelry accessory
 *         shoesPrice:
 *           type: number
 *           minimum: 0
 *           description: Price for shoes accessory
 *         headpiecePrice:
 *           type: number
 *           minimum: 0
 *           description: Price for headpiece accessory
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
