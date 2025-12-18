import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
 } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as bookcarsTypes from ':bookcars-types'
import * as UserService from '@/services/UserService'
import * as DressService from '@/services/DressService'
import * as LocationService from '@/services/LocationService'

interface AdminBookingCreateDialogProps {
  open: boolean
  onClose: () => void
  onSave: (booking: bookcarsTypes.Booking) => void
  supplierId?: string
}

const AdminBookingCreateDialog: React.FC<AdminBookingCreateDialogProps> = ({
  open,
  onClose,
  onSave,
  supplierId,
}) => {
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
    supplier: supplierId || '',
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
  const [dresses, setDresses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const steps = ['Customer', 'Dress & Dates', 'Payment & Details']

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load customers
      const customersData = await UserService.getUsers({ user: '', types: [bookcarsTypes.UserType.User] }, '', 1, 100)
      setCustomers(customersData?.[0]?.resultData?.filter((user: any) => user.type === 'user') || [])

      // Load dresses
      const dressesData = await DressService.getDresses('', { size: ['100'] }, 1, 100)
      const filteredDresses = supplierId
        ? dressesData?.[0]?.resultData?.filter((dress: any) => dress.supplier._id === supplierId) || []
        : dressesData?.[0]?.resultData || []
      setDresses(filteredDresses)

      // Load locations
      const locationsData = await LocationService.getLocations('', 1, 100)
      setLocations(locationsData?.[0]?.resultData || [])

    } catch (err: any) {
      console.error('Error loading data:', err)
      setError('Failed to load required data')
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open, loadInitialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-calculate remaining amount when paid amount changes
      if (field === 'paidAmount') {
        // Auto-update payment status
        if (value === 0) {
          newData.paymentStatus = 'pending'
        } else if (value >= newData.price) {
          newData.paymentStatus = 'fully-paid'
          newData.status = bookcarsTypes.BookingStatus.Paid
        } else {
          newData.paymentStatus = 'partially-paid'
          newData.status = bookcarsTypes.BookingStatus.Deposit
        }
      }
      
      // Update price when dress changes
      if (field === 'dress' && value) {
        newData.price = value.price || 0
        newData.supplier = value.supplier._id || value.supplier
      }
      
      return newData
    })
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
        const newCustomer: bookcarsTypes.CreateUserPayload = {
          fullName: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          location: 'Jenin', // Default location
          bio: '', // Default empty bio
          type: 'user',
          verified: true,
          language: 'ar',
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
        const newBooking = await response.json()
        setSuccess('Booking created successfully!')
        onSave(newBooking)
        setTimeout(() => {
          setSuccess('')
          handleClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create booking')
      }
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    setActiveStep(0)
    setFormData({
      customer: null,
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      createNewCustomer: false,
      dress: null,
      supplier: supplierId || '',
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: null,
      price: 0,
      paidAmount: 0,
      paymentStatus: 'pending',
      status: 'pending' as bookcarsTypes.BookingStatus,
      fittingRequired: false,
      fittingDate: null,
      alterationNotes: '',
      accessoriesIncluded: [],
      notes: '',
    })
    onClose()
  }

  const availableAccessories = [
    'Veil', 'Shoes', 'Jewelry', 'Handbag', 'Gloves', 
    'Hair Accessories', 'Undergarments', 'Wrap/Shawl'
  ]

  const bookingStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'paid', label: 'Paid' },
    { value: 'reserved', label: 'Reserved' },
  ]

  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'partially-paid', label: 'Partially Paid' },
    { value: 'fully-paid', label: 'Fully Paid' },
  ]

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.createNewCustomer}
                  onChange={(e) => handleInputChange('createNewCustomer', e.target.checked)}
                />
              }
              label="Create New Customer"
            />
            
            {formData.createNewCustomer ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <TextField
                    label="Customer Name"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    fullWidth
                    required
                  />
                </Box>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    fullWidth
                    required
                  />
                </Box>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <TextField
                    label="Phone"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    fullWidth
                  />
                </Box>
              </Box>
            ) : (
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                value={formData.customer}
                onChange={(_, value) => handleInputChange('customer', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Customer" required />
                )}
                fullWidth
              />
            )}
          </Box>
        )
      
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={dresses}
              getOptionLabel={(option) => `${option.name} - $${option.price}`}
              value={formData.dress}
              onChange={(_, value) => handleInputChange('dress', value)}
              renderInput={(params) => (
                <TextField {...params} label="Select Dress" required />
              )}
              fullWidth
            />
            
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Autocomplete
                  options={locations}
                  getOptionLabel={(option) => option.name}
                  value={formData.location}
                  onChange={(_, value) => handleInputChange('location', value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Location" required />
                  )}
                  fullWidth
                />
              </Box>

            </Box>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <DateTimePicker
                    label="Start Date"
                    value={formData.from}
                    onChange={(date) => handleInputChange('from', date)}
                    slots={{ textField: TextField }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <DateTimePicker
                    label="End Date"
                    value={formData.to}
                    onChange={(date) => handleInputChange('to', date)}
                    slots={{ textField: TextField }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </Box>
            </LocalizationProvider>
          </Box>
        )
      
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <TextField
                  label="Total Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <TextField
                  label="Paid Amount"
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => handleInputChange('paidAmount', Number(e.target.value))}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0, max: formData.price } }}
                />
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <TextField
                  label="Remaining"
                  value={Math.max(0, formData.price - formData.paidAmount)}
                  fullWidth
                  disabled
                />
              </Box>
            </Box>
            
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    {bookingStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={formData.paymentStatus}
                    onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  >
                    {paymentStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.fittingRequired}
                  onChange={(e) => handleInputChange('fittingRequired', e.target.checked)}
                />
              }
              label="Fitting Required"
            />
            
            {formData.fittingRequired && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Fitting Date"
                  value={formData.fittingDate}
                  onChange={(date) => handleInputChange('fittingDate', date)}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            )}
            
            <TextField
              label="Alteration Notes"
              value={formData.alterationNotes}
              onChange={(e) => handleInputChange('alterationNotes', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Accessories Included
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableAccessories.map((accessory) => (
                  <Chip
                    key={accessory}
                    label={accessory}
                    onClick={() => {
                      const newAccessories = formData.accessoriesIncluded.includes(accessory)
                        ? formData.accessoriesIncluded.filter(a => a !== accessory)
                        : [...formData.accessoriesIncluded, accessory]
                      handleInputChange('accessoriesIncluded', newAccessories)
                    }}
                    color={formData.accessoriesIncluded.includes(accessory) ? 'primary' : 'default'}
                    variant={formData.accessoriesIncluded.includes(accessory) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Booking</DialogTitle>
      <DialogContent>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Booking'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default AdminBookingCreateDialog
