import React, { useState, useEffect, useRef } from 'react'
import {

  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Select,
  MenuItem,


  Box,
  Typography,
  Chip,
  Alert,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  TextField
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '../components/Layout'

import * as UserService from '../services/UserService'
import * as DressService from '../services/DressService'
import * as LocationService from '../services/LocationService'
import * as helper from '../common/helper'
import { strings as commonStrings } from '../lang/common'
import { strings } from '../lang/create-booking'
import { useLanguage } from '../context/LanguageContext'

import SupplierSelectList from '../components/SupplierSelectList'
import DressSelectList from '../components/DressSelectList'
import LocationSelectList from '../components/LocationSelectList'


import '../assets/css/create-booking.css'

const CreateBooking: React.FC = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [visible, setVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    // Customer selection
    customer: null as any,
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    createNewCustomer: false,

    // Dress and dates
    dress: null as any,
    selectedSize: '',
    supplier: '',
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    location: null as any,

    // Pricing and payment
    price: 0,
    paidAmount: 0,
    paymentStatus: 'pending' as string,
    status: 'pending' as bookcarsTypes.BookingStatus,

    // Additional details
    fittingRequired: false,
    fittingDate: null as Date | null,
    alterationNotes: '',
    accessoriesIncluded: [] as string[],
    notes: '',
  })

  const [customers, setCustomers] = useState<any[]>([])
  const [locations, setLocations] = useState<bookcarsTypes.Location[]>([])
  const [dresses, setDresses] = useState<bookcarsTypes.Dress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDressDetails, setSelectedDressDetails] = useState<any>(null)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [dressSearchTerm, setDressSearchTerm] = useState('')
  const [dressAvailability, setDressAvailability] = useState<boolean>(true)

  // Ref for timeout cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const steps = [
    strings.CUSTOMER_INFORMATION || 'Customer',
    strings.DRESS_AND_DATES || 'Dress & Dates',
    strings.PAYMENT_AND_DETAILS || 'Payment & Details'
  ]

  useEffect(() => {
    if (visible) {
      loadInitialData()
    }
  }, [visible])

  useEffect(() => {
    // Auto-assign supplier for non-admin users
    if (user && !helper.admin(user)) {
      const supplierId = user._id || ''
      setFormData(prev => ({ ...prev, supplier: supplierId }))
      // Load dresses and locations for the auto-assigned supplier
      if (supplierId) {
        loadDressesForSupplier(supplierId)
        loadLocationsForSupplier(supplierId)
      }
    }
  }, [user])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Load customers
      const customersPayload: bookcarsTypes.GetUsersBody = {
        user: user?._id || '',
        types: [bookcarsTypes.UserType.User]
      }
      const customersData = await UserService.getUsers(customersPayload, '', 1, 100)
      // Handle both response formats: [{resultData: [...]}] and {docs: [...]}
      const customersList = Array.isArray(customersData)
        ? (customersData[0]?.resultData || [])
        : ((customersData as any)?.docs || [])
      setCustomers(customersList)

      // Load locations
      const locationsData = await LocationService.getLocations('', 1, 100)

      // Handle different response formats for locations
      let locationsArray: bookcarsTypes.Location[] = []
      if (Array.isArray(locationsData) && locationsData.length > 0) {
        // Format: [{resultData: [...]}]
        locationsArray = locationsData[0]?.resultData || []
      } else if ((locationsData as any)?.docs) {
        // Format: {docs: [...]}
        locationsArray = (locationsData as any).docs
      }

      setLocations(locationsArray)

      // Load all available dresses initially with proper payload
      try {
        const dressesPayload: bookcarsTypes.GetDressesPayload = {
          availability: [bookcarsTypes.Availablity.Available]
        }
        const dressesData = await DressService.getDresses('', dressesPayload, 1, 100)

        // Handle different response formats
        let dressesArray: bookcarsTypes.Dress[] = []
        if (Array.isArray(dressesData) && dressesData.length > 0) {
          if (dressesData[0]?.resultData) {
            // Format: [{resultData: [...]}]
            dressesArray = dressesData[0].resultData
          } else if ((dressesData as any).docs) {
            // Format: {docs: [...]}
            dressesArray = (dressesData as any).docs
          } else {
            // Direct array format
            dressesArray = dressesData as unknown as bookcarsTypes.Dress[]
          }
        } else if ((dressesData as any)?.docs) {
          dressesArray = (dressesData as any).docs
        }

        setDresses(dressesArray)
      } catch (error) {
        console.error('Error loading dresses:', error)
        setDresses([])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierChange = (values: bookcarsTypes.Option[]) => {
    const supplierId = values.length > 0 ? values[0]._id : ''
    setFormData(prev => ({ ...prev, supplier: supplierId, dress: null, location: null }))
    // Load dresses and locations for the selected supplier
    if (supplierId) {
      loadDressesForSupplier(supplierId)
      loadLocationsForSupplier(supplierId)
    } else {
      // If no supplier selected, show all dresses and locations
      loadInitialData()
    }
  }

  const loadDressesForSupplier = async (supplierId: string) => {
    try {
      const filters: bookcarsTypes.GetDressesPayload = supplierId
        ? { suppliers: [supplierId], availability: [bookcarsTypes.Availablity.Available] }
        : { availability: [bookcarsTypes.Availablity.Available] }
      const dressesData = await DressService.getDresses('', filters, 1, 100)

      // Handle different response formats
      let dressesArray: bookcarsTypes.Dress[] = []
      if (Array.isArray(dressesData) && dressesData.length > 0) {
        if (dressesData[0]?.resultData) {
          // Format: [{resultData: [...]}]
          dressesArray = dressesData[0].resultData
        } else if ((dressesData as any).docs) {
          // Format: {docs: [...]}
          dressesArray = (dressesData as any).docs
        } else {
          // Direct array format
          dressesArray = dressesData as unknown as bookcarsTypes.Dress[]
        }
      } else if ((dressesData as any)?.docs) {
        dressesArray = (dressesData as any).docs
      }

      setDresses(dressesArray)
    } catch (err) {
      console.error('Error loading dresses:', err)
      setDresses([])
    }
  }

  const loadLocationsForSupplier = async (supplierId: string) => {
    try {
      // Load all locations and filter by supplier
      const locationsData = await LocationService.getLocations('', 1, 1000)

      // Handle different response formats for locations
      let locationsArray: bookcarsTypes.Location[] = []
      if (Array.isArray(locationsData) && locationsData.length > 0) {
        if (locationsData[0]?.resultData) {
          // Format: [{resultData: [...]}]
          locationsArray = locationsData[0].resultData
        } else if ((locationsData as any)?.docs) {
          // Format: {docs: [...]}
          locationsArray = (locationsData as any).docs
        }
      } else if ((locationsData as any)?.docs) {
        locationsArray = (locationsData as any).docs
      }

      // Filter locations by supplier
      const supplierLocations = locationsArray.filter((location: any) =>
        location.supplier && (location.supplier._id === supplierId || location.supplier === supplierId)
      )

      setLocations(supplierLocations)
    } catch (err) {
      console.error('Error loading locations for supplier:', err)
      setLocations([])
    }
  }

  const checkDressAvailability = async (_dressId: string, _from: Date, _to: Date) => {
    try {
      // This would typically call a backend API to check availability
      // For now, we'll simulate availability checking
      const isAvailable = true // Placeholder - would be actual API call
      setDressAvailability(isAvailable)
      return isAvailable
    } catch (err) {
      console.error('Error checking dress availability:', err)
      setDressAvailability(false)
      return false
    }
  }

  const handleNext = () => {
    // Validation for each step
    if (activeStep === 0) {
      if (!formData.createNewCustomer && !formData.customer) {
        setError('Please select a customer or choose to create a new one')
        return
      }
      if (formData.createNewCustomer && (!formData.customerName || !formData.customerEmail)) {
        setError('Customer name and email are required')
        return
      }
    }

    if (activeStep === 1) {
      if (!formData.dress) {
        setError('Please select a dress')
        return
      }
      if (!formData.location) {
        setError('Please select a location')
        return
      }
      if (formData.from >= formData.to) {
        setError('End date must be after start date')
        return
      }
    }

    setError('')
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      let customerId = formData.customer?._id

      // Create new customer if needed
      if (formData.createNewCustomer) {
        // Use selected booking location or first available location
        const customerLocation = formData.location?._id || (locations.length > 0 ? locations[0]._id : '')

        const newCustomer: bookcarsTypes.CreateUserPayload = {
          fullName: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          location: customerLocation,
          bio: '',
          type: 'user',
          verified: true,
          language: language || 'en',
        }

        const createdCustomer = await UserService.create(newCustomer)
        if (!createdCustomer || !createdCustomer._id) {
          throw new Error('Failed to create customer')
        }

        customerId = createdCustomer._id
      }

      const bookingData = {
        supplier: formData.supplier,
        dress: formData.dress._id,
        customer: customerId,
        location: formData.location._id,
        from: formData.from,
        to: formData.to,
        status: formData.status,
        price: formData.price,
        paidAmount: formData.paidAmount,
        remainingAmount: Math.max(0, formData.price - formData.paidAmount),
        paymentStatus: formData.paymentStatus,
        fittingRequired: formData.fittingRequired,
        fittingDate: formData.fittingDate,
        alterationNotes: formData.alterationNotes,
        accessoriesIncluded: formData.accessoriesIncluded,
        notes: formData.notes,
      }

      const response = await fetch('/api/admin-create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        await response.json()
        setSuccess('Booking created successfully!')
        timeoutRef.current = setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        throw new Error('Failed to create booking')
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      setError('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const availableAccessories = [
    'Veil', 'Shoes', 'Jewelry', 'Handbag', 'Gloves',
    'Hair Accessories', 'Undergarments', 'Wrap/Shawl'
  ]

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.createNewCustomer}
                  onChange={(e) => setFormData(prev => ({ ...prev, createNewCustomer: e.target.checked }))}
                />
              }
              label={strings.CREATE_NEW_CUSTOMER || "Create New Customer"}
              sx={{ mb: 2 }}
            />

            {formData.createNewCustomer ? (
              <Box>
                <TextField
                  fullWidth
                  label={strings.CUSTOMER_NAME || "Customer Name"}
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label={strings.CUSTOMER_EMAIL || "Customer Email"}
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label={strings.CUSTOMER_PHONE || "Customer Phone"}
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  margin="normal"
                />
              </Box>
            ) : (
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.fullName || ''}
                value={formData.customer}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, customer: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label={strings.SELECT_CUSTOMER || "Select Customer"} margin="normal" required />
                )}
              />
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Dress & Booking Details</Typography>

            {helper.admin(user) && (
              <FormControl fullWidth margin="dense">
                <SupplierSelectList
                  label={commonStrings.SUPPLIER}
                  required
                  onChange={handleSupplierChange}
                />
              </FormControl>
            )}

            <FormControl fullWidth margin="dense">
              <DressSelectList
                label={strings.DRESS}
                required
                supplier={formData.supplier}
                value={formData.dress?._id || ''}
                onChange={(values) => {
                  const selectedDress = values.length > 0 ? values[0] : null;
                  if (selectedDress) {
                    // Find full dress object from dresses state or make API call
                    const fullDress = dresses.find(d => d._id === selectedDress._id) || {
                      _id: selectedDress._id,
                      name: selectedDress.name,
                      price: 0 // Default values
                    };
                    setFormData(prev => ({ ...prev, dress: fullDress }))
                    setSelectedDressDetails(fullDress)
                    if (fullDress && fullDress.price) {
                      // Calculate price based on dress and rental duration
                      const days = Math.ceil((formData.to.getTime() - formData.from.getTime()) / (1000 * 60 * 60 * 24))
                      const calculatedPrice = (fullDress.price || 0) * days
                      setFormData(prev => ({ ...prev, price: calculatedPrice }))
                    }
                  } else {
                    setFormData(prev => ({ ...prev, dress: null }))
                    setSelectedDressDetails(null)
                    setFormData(prev => ({ ...prev, price: 0 }))
                  }
                }}
              />
            </FormControl>

            {/* Additional dress details display */}
            {selectedDressDetails && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {strings.DRESS_DETAILS || 'Dress Details'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDressDetails.type && `Type: ${selectedDressDetails.type}`}
                  {selectedDressDetails.size && ` | Size: ${selectedDressDetails.size}`}
                  {selectedDressDetails.color && ` | Color: ${selectedDressDetails.color}`}
                  {selectedDressDetails.price && ` | Price: ${selectedDressDetails.price} ₪/day`}
                </Typography>
              </Box>
            )}

            <FormControl fullWidth margin="dense">
              <LocationSelectList
                label={strings.LOCATION}
                required
                supplier={formData.supplier}
                value={formData.location ? [{ _id: formData.location._id, name: formData.location.name }] : []}
                onChange={(values) => {
                  const selectedLocation = values.length > 0 ? values[0] : null;
                  setFormData(prev => ({ ...prev, location: selectedLocation }));
                }}
              />
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <DateTimePicker
                  label={strings.START_DATE || "From Date"}
                  value={formData.from}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, from: newValue || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                />
                <DateTimePicker
                  label={strings.END_DATE || "To Date"}
                  value={formData.to}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, to: newValue || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Payment & Additional Details</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Total Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Paid Amount"
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                margin="normal"
              />
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>{commonStrings.PAYMENT_STATUS}</InputLabel>
              <Select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
              >
                <MenuItem value="pending">{commonStrings.BOOKING_STATUS_PENDING}</MenuItem>
                <MenuItem value="paid">{commonStrings.BOOKING_STATUS_PAID}</MenuItem>
                <MenuItem value="partial">{commonStrings.PARTIAL}</MenuItem>
                <MenuItem value="refunded">{commonStrings.REFUNDED}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>{commonStrings.BOOKING_STATUS}</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as bookcarsTypes.BookingStatus }))}
              >
                <MenuItem value="pending">{commonStrings.BOOKING_STATUS_PENDING}</MenuItem>
                <MenuItem value="confirmed">{commonStrings.CONFIRMED}</MenuItem>
                <MenuItem value="cancelled">{commonStrings.BOOKING_STATUS_CANCELLED}</MenuItem>
                <MenuItem value="completed">{commonStrings.COMPLETED}</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.fittingRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, fittingRequired: e.target.checked }))}
                />
              }
              label={commonStrings.FITTING_REQUIRED}
              sx={{ mb: 2 }}
            />

            {formData.fittingRequired && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label={commonStrings.FITTING_DATE}
                  value={formData.fittingDate}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, fittingDate: newValue }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                />
              </LocalizationProvider>
            )}

            <TextField
              fullWidth
              label="Alteration Notes"
              multiline
              rows={3}
              value={formData.alterationNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, alterationNotes: e.target.value }))}
              margin="normal"
            />

            <Autocomplete
              multiple
              options={availableAccessories}
              value={formData.accessoriesIncluded}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, accessoriesIncluded: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index })
                  return (
                    <Chip key={key || index} variant="outlined" label={option} {...chipProps} />
                  )
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Accessories Included" margin="normal" />
              )}
            />

            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              margin="normal"
            />
          </Box>
        )

      default:
        return null
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setUser(user)
      setVisible(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="create-booking">

        <Paper className="booking-form booking-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>

          <Box sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                Back
              </Button>

              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Booking'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

        </Paper>
      </div>
    </Layout>
  )
}

export default CreateBooking
