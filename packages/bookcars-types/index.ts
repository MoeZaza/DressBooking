export enum UserType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
}

export enum AppType {
  Backend = 'backend',
  Frontend = 'frontend',
}

export enum DressType {
  Traditional = 'traditional',
  Modern = 'modern',
  Designer = 'designer',
  Vintage = 'vintage',
  Casual = 'casual',
  Wedding = 'wedding',
  Evening = 'evening',
  Cocktail = 'cocktail',
  Prom = 'prom',
  Formal = 'formal',
  Business = 'business',
  Maternity = 'maternity',
  PlusSize = 'plus-size',
  Bridal = 'bridal',
  Bridesmaid = 'bridesmaid',
  MotherOfBride = 'mother-of-bride',
  Graduation = 'graduation',
  Anniversary = 'anniversary',
  DateNight = 'date-night',
  Gala = 'gala',
  RedCarpet = 'red-carpet',
  Cultural = 'cultural',
  Religious = 'religious',
  Other = 'other',
  Unknown = 'unknown',
}

export enum DressRange {
  Mini = 'mini',
  Midi = 'midi',
  Maxi = 'maxi',
  Bridal = 'bridal',
  Evening = 'evening',
  Cocktail = 'cocktail',
  Casual = 'casual',
}

export enum DressAccessories {
  Veil = 'veil',
  Jewelry = 'jewelry',
  Shoes = 'shoes',
  Headpiece = 'headpiece',
}

export enum DressSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl',
  ExtraSmall = 'extraSmall',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  ExtraLarge = 'extraLarge',
  DoubleExtraLarge = 'doubleExtraLarge',
  Custom = 'custom',
}

export enum DressMaterial {
  Silk = 'silk',
  Cotton = 'cotton',
  Lace = 'lace',
  Satin = 'satin',
  Chiffon = 'chiffon',
  Tulle = 'tulle',
  Organza = 'organza',
  Velvet = 'velvet',
  Polyester = 'polyester',
  Crepe = 'crepe',
  Taffeta = 'taffeta',
  Georgette = 'georgette',
  Brocade = 'brocade',
  Sequin = 'sequin',
  Beaded = 'beaded',
  Embroidered = 'embroidered',
  Mesh = 'mesh',
  Jersey = 'jersey',
  Mikado = 'mikado',
  Charmeuse = 'charmeuse',
}

export enum DressStyle {
  Traditional = 'traditional',
  Modern = 'modern',
  Designer = 'designer',
  Vintage = 'vintage',
  Casual = 'casual',
  Elegant = 'elegant',
  Romantic = 'romantic',
  Bohemian = 'bohemian',
  Minimalist = 'minimalist',
  Glamorous = 'glamorous',
  Classic = 'classic',
  Contemporary = 'contemporary',
  Artistic = 'artistic',
  Luxury = 'luxury',
  Trendy = 'trendy',
  Timeless = 'timeless',
  Sophisticated = 'sophisticated',
  Chic = 'chic',
  Edgy = 'edgy',
  Feminine = 'feminine',
}

export enum RentalTerm {
  Limited = 'limited',
  Unlimited = 'unlimited',
}


export enum BookingStatus {
  Void = 'void',
  Pending = 'pending',
  Deposit = 'deposit',
  Paid = 'paid',
  Reserved = 'reserved',
  Cancelled = 'cancelled',
}



export enum Availablity {
  Available = 'available',
  Unavailable = 'unavailable',
}

export enum RecordType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
  Dress = 'dress',
  Location = 'location',
  Country = 'country',
}

export enum PaymentGateway {
  PayPal = 'payPal',
  Stripe = 'stripe',
  Visa = 'visa',
}

export interface Booking {
  _id?: string
  supplier: string | User
  dress?: string | Dress
  customer?: string | User
  location: string | Location
  from: Date
  to: Date
  status: BookingStatus
  cancellation?: boolean
  amendments?: boolean
  cancelRequest?: boolean
  price?: number
  paidAmount?: number
  remainingAmount?: number
  paymentStatus?: PaymentStatus
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  isDeposit?: boolean
  paypalOrderId?: string
  fittingRequired?: boolean
  fittingDate?: Date
  fittingNotes?: string
  alterationNotes?: string
  accessoriesIncluded?: string[]
  rentalCounted?: boolean
}

export interface CheckoutPayload {
  customer?: User
  booking?: Booking
  payLater: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  payPal?: boolean
  visa?: boolean
}

export interface Filter {
  from?: Date
  dateBetween?: Date
  to?: Date
  keyword?: string
  location?: string
}

export interface GetBookingsPayload {
  suppliers: string[]
  statuses: string[]
  user?: string
  dress?: string
  filter?: Filter
}

export interface UpsertBookingPayload {
  booking: Booking
}

export interface LocationName {
  language: string
  name: string
}

export interface CountryName {
  language: string
  name: string
}

export interface UpsertLocationPayload {
  country: string
  longitude?: number
  latitude?: number
  names: LocationName[]
  image?: string | null
  supplier?: string
}

export interface UpdateSupplierPayload {
  _id: string
  fullName: string
  phone: string
  location: string
  bio: string
  payLater: boolean
  priceChangeRate?: number
  supplierDressLimit?: number
  notifyAdminOnNewDress?: boolean
  blacklisted?: boolean
}



export interface CreateDressPayload {
  loggedUser: string
  name: string
  supplier: string
  locations: string[]

  // price fields
  price: number
  discountedPrice?: number

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: string
  size: string
  style: string
  customizable?: boolean
  images?: string[]
  color: string
  length: number
  material: string
  rentals?: number
  cancellation: number
  amendments: number
  range: string
  accessories: string[]
  rating?: number
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

export interface UpdateDressPayload extends CreateDressPayload {
  _id: string
}



export interface DressSpecs {
  customizable?: boolean,
  designerMade?: boolean,
  customSize?: boolean,
  premium?: boolean,
  longDress?: boolean,
  embroidered?: boolean,
}

export interface GetDressesPayload {
  suppliers?: string[]
  dressSpecs?: DressSpecs
  dressType?: string[]
  size?: string[]
  dressSize?: string[]
  material?: string[]
  deposit?: number
  availability?: string[]
  location?: string
  ranges?: string[]
  accessories?: string[]
  rating?: number
  color?: string
  includeAlreadyBookedDresses?: boolean
  includeComingSoonDresses?: boolean
}

export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  phone?: string
  language: string
  active?: boolean
  verified?: boolean
  blacklisted?: boolean
  type?: string
  avatar?: string
  birthDate?: number | Date
}

export type Contract = { language: string, file: string | null }

export interface CreateUserPayload {
  email?: string
  phone: string
  location: string
  locations?: string[]
  bio: string
  fullName: string
  type?: string
  avatar?: string
  birthDate?: number | Date
  language?: string
  password?: string
  verified?: boolean
  blacklisted?: boolean
  payLater?: boolean
  supplier?: string
  contracts?: Contract[]
  priceChangeRate?: number
  supplierDressLimit?: number
  notifyAdminOnNewDress?: boolean
}

export interface UpdateUserPayload extends CreateUserPayload {
  _id: string
  enableEmailNotifications?: boolean
}

export interface ChangePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface ActivatePayload {
  userId: string
  token: string
  password: string
}

export interface ValidateEmailPayload {
  email: string
  appType?: AppType
}

export enum SocialSignInType {
  Facebook = 'facebook',
  Apple = 'apple',
  Google = 'google'
}

export interface SignInPayload {
  email?: string
  password?: string
  stayConnected?: boolean
  mobile?: boolean
  fullName?: string
  avatar?: string
  accessToken?: string
  socialSignInType?: SocialSignInType
}

export interface ResendLinkPayload {
  email?: string
}

export interface UpdateEmailNotificationsPayload {
  _id: string
  enableEmailNotifications: boolean
}

export interface UpdateLanguagePayload {
  id: string
  language: string
}

export interface ValidateSupplierPayload {
  fullName: string
}

export interface ValidateLocationPayload {
  language: string
  name: string
}

export interface ValidateCountryPayload {
  language: string
  name: string
}

export interface UpdateStatusPayload {
  ids: string[]
  status: string
}

export interface User {
  _id?: string
  supplier?: User | string
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
  avatar?: string
  bio?: string
  location?: string
  locations?: Option[]
  type?: string
  blacklisted?: boolean
  payLater?: boolean
  accessToken?: string
  checked?: boolean
  customerId?: string
  dressCount?: number
  contracts?: Contract[]
  priceChangeRate?: number
  supplierDressLimit?: number
  notifyAdminOnNewDress?: boolean
}

export interface Option {
  _id: string
  name?: string
  image?: string
}

export interface LocationValue {
  _id?: string
  language: string
  value?: string
}



export interface Location {
  _id: string
  country?: Country
  longitude?: number
  latitude?: number
  name?: string
  values?: LocationValue[]
  image?: string
  supplier?: User
}

export interface Country {
  _id: string
  name?: string
  values?: LocationValue[]
  supplier?: User
}

export interface CountryInfo extends Country {
  locations?: Location[]
}

export interface UpsertCountryPayload {
  names: CountryName[]
  supplier?: string
}






export interface Dress {
  _id: string
  name: string
  supplier: User
  locations: Location[]

  // price fields
  price: number
  discountedPrice?: number
  bookingCount?: number
  totalRevenue?: number

  deposit: number
  available: boolean
  fullyBooked?: boolean
  comingSoon?: boolean
  type: DressType
  size: DressSize
  style: DressStyle
  customizable?: boolean
  images?: string[]
  color: string
  length: number
  material: DressMaterial
  cancellation: number
  amendments: number
  range: string
  accessories: DressAccessories[] | undefined
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
  lastMaintenance?: Date
  [propKey: string]: any
}

export interface Data<T> {
  rows: T[]
  rowCount: number
}



export interface GetBookingDressesPayload {
  supplier: string
  location: string
}

export interface Notification {
  _id: string
  user: string
  message: string
  booking?: string
  dress?: string
  isRead?: boolean
  checked?: boolean
  createdAt?: Date
  type?: string
  category?: string
  title?: string
  priority?: string
}

export interface NotificationCounter {
  _id: string
  user: string
  count: number
}

export interface ResultData<T> {
  pageInfo: { totalRecords: number }
  resultData: T[]
}

export type Result<T> = [ResultData<T>] | [] | undefined | null

export interface GetUsersBody {
  user: string
  types: UserType[]
}

export interface CreatePaymentPayload {
  amount: number
  /**
   * Three-letter ISO currency code, in lowercase.
   * Must be a supported currency: https://docs.stripe.com/currencies
   *
   * @type {string}
   */
  currency: string
  /**
   * The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser's locale is used.
   *
   * @type {string}
   */
  locale: string
  receiptEmail: string
  customerName: string
  name: string
  description?: string
}

export interface CreatePayPalOrderPayload {
  bookingId: string
  amount: number
  currency: string
  name: string
  description: string
}

export interface PaymentResult {
  sessionId?: string
  paymentIntentId?: string
  customerId: string
  clientSecret: string | null
}

export interface SendEmailPayload {
  from: string
  to: string
  subject: string
  message: string
  isContactForm: boolean
}

export interface Response<T> {
  status: number
  data: T
}

export interface BankDetails {
  _id: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

export interface UpsertBankDetailsPayload {
  _id?: string
  accountHolder: string
  bankName: string
  iban: string
  swiftBic: string
  showBankDetailsPage: boolean
}

//
// React types
//
export type DataEvent<T> = (data?: Data<T>) => void

export interface StatusFilterItem {
  label: string
  value: BookingStatus
  checked?: boolean
}

export interface DressFilter {
  location: Location
  from: Date
  to: Date
}



export type DressFilterSubmitEvent = (filter: DressFilter) => void



export interface DressOptions {
  cancellation?: boolean
  amendments?: boolean
  accessories?: boolean
}

// Fitting Appointment Types
export enum FittingAppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no-show',
}

export interface FittingAppointment {
  _id?: string
  customer: string | User
  dress: string | Dress
  supplier: string | User
  location: string | Location
  appointmentDate: Date
  timeSlot: string
  status: FittingAppointmentStatus
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
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateFittingAppointmentPayload {
  dress: string
  supplier: string
  location: string
  appointmentDate: Date
  timeSlot: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes?: string
}

export interface UpdateFittingAppointmentPayload {
  status?: FittingAppointmentStatus
  fittingNotes?: string
  measurements?: {
    bust?: number
    waist?: number
    hips?: number
    height?: number
    shoulderWidth?: number
    armLength?: number
  }
  alterationsNeeded?: string
}

export interface AvailableTimeSlots {
  availableSlots: string[]
  bookedSlots: string[]
}

// Payment Types
export enum PaymentStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially-paid',
  FullyPaid = 'fully-paid',
  Refunded = 'refunded',
  Failed = 'failed',
}

export interface Payment {
  _id?: string
  booking: string | Booking
  amount: number
  remainingAmount: number
  totalAmount: number
  status: PaymentStatus
  paymentMethod: PaymentGateway
  transactionId?: string
  paymentDate: Date
  notes?: string
}

export interface CreatePaymentBookingPayload {
  booking: string
  amount: number
  paymentMethod: PaymentGateway
  transactionId?: string
  notes?: string
}

// Review Types
export interface Review {
  _id?: string
  booking: string | Booking
  dress: string | Dress
  customer: string | User
  rating: number
  comment?: string
  photos?: string[]
  verified: boolean
  helpful: number
  helpfulVotes?: string[]
  reportedBy?: string[]
  isReported: boolean
  isApproved: boolean
  moderatorNotes?: string
  createdAt?: Date
  updatedAt?: Date
  reviewAge?: number
  helpfulPercentage?: number
}

export interface CreateReviewPayload {
  bookingId: string
  rating: number
  comment?: string
  photos?: string[]
}

export interface GetReviewsPayload {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  minRating?: number
  verified?: boolean
}

export interface ReviewResult {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  statistics: {
    averageRating: number
    totalReviews: number
    ratingDistribution: {
      [key: number]: number
    }
  }
}

export interface ReviewStatistics {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
