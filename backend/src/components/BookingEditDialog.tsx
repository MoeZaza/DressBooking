import React, { useState, useEffect } from 'react'
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
 } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/booking-list'
import { strings as commonStrings } from '@/lang/common'
import { strings as dressStrings } from '@/lang/dresses'

interface BookingEditDialogProps {
  open: boolean
  booking: bookcarsTypes.Booking | null
  onClose: () => void
  onSave: (booking: bookcarsTypes.Booking) => void
}

const BookingEditDialog: React.FC<BookingEditDialogProps> = ({
  open,
  booking,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    status: '',
    paidAmount: 0,
    remainingAmount: 0,
    paymentStatus: '',
    fittingRequired: false,
    fittingDate: null as Date | null,
    alterationNotes: '',
    accessoriesIncluded: [] as string[],
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (booking) {
      setFormData({
        status: booking.status || '',
        paidAmount: booking.paidAmount || 0,
        remainingAmount: booking.remainingAmount || ((booking.price || 0) - (booking.paidAmount || 0)),
        paymentStatus: booking.paymentStatus || 'pending',
        fittingRequired: booking.fittingRequired || false,
        fittingDate: booking.fittingDate ? new Date(booking.fittingDate) : null,
        alterationNotes: booking.alterationNotes || '',
        accessoriesIncluded: booking.accessoriesIncluded || [],
        notes: '',
      })
    }
  }, [booking])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-calculate remaining amount when paid amount changes
      if (field === 'paidAmount' && booking) {
        newData.remainingAmount = Math.max(0, (booking.price || 0) - value)
        
        // Auto-update payment status
        if (value === 0) {
          newData.paymentStatus = 'pending'
        } else if (value >= (booking.price || 0)) {
          newData.paymentStatus = 'fully-paid'
        } else {
          newData.paymentStatus = 'partially-paid'
        }
      }
      
      return newData
    })
  }

  const handleAccessoryToggle = (accessory: string) => {
    setFormData(prev => ({
      ...prev,
      accessoriesIncluded: prev.accessoriesIncluded.includes(accessory)
        ? prev.accessoriesIncluded.filter(a => a !== accessory)
        : [...prev.accessoriesIncluded, accessory]
    }))
  }

  const handleSave = async () => {
    if (!booking) return

    // Validation
    if (!formData.status) {
      setError('Status is required')
      return
    }

    if (formData.paidAmount < 0) {
      setError('Paid amount cannot be negative')
      return
    }

    if (formData.paidAmount > (booking.price || 0)) {
      setError('Paid amount cannot exceed total booking price')
      return
    }

    if (formData.fittingRequired && !formData.fittingDate) {
      setError('Fitting date is required when fitting is enabled')
      return
    }

    try {
      setLoading(true)
      setError('')

      const updateData = {
        status: formData.status,
        paidAmount: formData.paidAmount,
        remainingAmount: formData.remainingAmount,
        paymentStatus: formData.paymentStatus,
        fittingRequired: formData.fittingRequired,
        fittingDate: formData.fittingDate,
        alterationNotes: formData.alterationNotes,
        accessoriesIncluded: formData.accessoriesIncluded,
        notes: formData.notes,
      }

      const response = await fetch(`/api/admin-update-booking/${booking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedBooking = await response.json()
        setSuccess('Booking updated successfully!')
        onSave(updatedBooking)
        setTimeout(() => {
          setSuccess('')
          onClose()
        }, 2000)
      } else {
        let errorMessage = 'Failed to update booking'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error updating booking:', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err.message || 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    onClose()
  }

  const availableAccessories = [
    'Veil',
    'Shoes',
    'Jewelry',
    'Handbag',
    'Gloves',
    'Hair Accessories',
    'Undergarments',
    'Wrap/Shawl',
  ]

  const bookingStatuses = [
    { value: 'void', label: 'Void' },
    { value: 'pending', label: 'Pending' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'paid', label: 'Paid' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
  ]

  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'partially-paid', label: 'Partially Paid' },
    { value: 'fully-paid', label: 'Fully Paid' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' },
  ]

  if (!booking) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {strings.EDIT_BOOKING || 'Edit Booking'} - {(booking.dress as any)?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {/* Customer and Dress Info */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {strings.BOOKING_DETAILS || 'Booking Details'}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{strings.CUSTOMER}:</strong> {(booking.customer as any)?.fullName}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{strings.DRESS}:</strong> {(booking.dress as any)?.name}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{commonStrings.FROM}:</strong> {new Date(booking.from).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{commonStrings.TO}:</strong> {new Date(booking.to).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{strings.PRICE}:</strong> ${booking.price}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="body2">
                  <strong>{strings.CURRENT_STATUS}:</strong>
                  <Chip label={booking.status} size="small" sx={{ ml: 1 }} />
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Status and Payment */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <FormControl fullWidth>
                <InputLabel>{strings.STATUS}</InputLabel>
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
                <InputLabel>{dressStrings.PAYMENT_STATUS || 'Payment Status'}</InputLabel>
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

          {/* Payment Amounts */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                label={dressStrings.PAID_AMOUNT || 'Paid Amount'}
                type="number"
                value={formData.paidAmount}
                onChange={(e) => handleInputChange('paidAmount', Number(e.target.value))}
                fullWidth
                slotProps={{ htmlInput: { min: 0, max: booking.price } }}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                label={dressStrings.REMAINING_AMOUNT || 'Remaining Amount'}
                type="number"
                value={formData.remainingAmount}
                onChange={(e) => handleInputChange('remainingAmount', Number(e.target.value))}
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                label="Total Amount"
                value={booking.price}
                fullWidth
                disabled
              />
            </Box>
          </Box>

          {/* Fitting Information */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.fittingRequired}
                  onChange={(e) => handleInputChange('fittingRequired', e.target.checked)}
                />
              }
              label={dressStrings.FITTING_REQUIRED || 'Fitting Required'}
            />
          </Box>

          {formData.fittingRequired && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label={dressStrings.FITTING_DATE || 'Fitting Date'}
                value={formData.fittingDate}
                onChange={(date) => handleInputChange('fittingDate', date)}
                slots={{
                  textField: TextField
                }}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </LocalizationProvider>
          )}

          {/* Alteration Notes */}
          <TextField
            label={dressStrings.ALTERATION_NOTES || 'Alteration Notes'}
            value={formData.alterationNotes}
            onChange={(e) => handleInputChange('alterationNotes', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {/* Accessories */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {dressStrings.ACCESSORIES_INCLUDED || 'Accessories Included'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableAccessories.map((accessory) => (
                <Chip
                  key={accessory}
                  label={accessory}
                  onClick={() => handleAccessoryToggle(accessory)}
                  color={formData.accessoriesIncluded.includes(accessory) ? 'primary' : 'default'}
                  variant={formData.accessoriesIncluded.includes(accessory) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          {/* Admin Notes */}
          <TextField
            label={dressStrings.NOTES || 'Admin Notes'}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Internal notes about this booking update..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {commonStrings.CANCEL}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? (commonStrings.LOADING || 'Saving...') : (commonStrings.SAVE || 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BookingEditDialog
