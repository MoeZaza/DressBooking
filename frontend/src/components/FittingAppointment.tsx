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
  Alert,
 } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as FittingAppointmentService from '../services/FittingAppointmentService'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '../lang/dresses'
import { strings as commonStrings } from '../lang/common'
import { useUserContext, UserContextType } from '../context/UserContext'

interface FittingAppointmentProps {
  open: boolean
  onClose: () => void
  onBook?: (appointmentData: any) => void
  dress?: bookcarsTypes.Dress
  dressName?: string
  supplier?: string
  location?: string
}

const FittingAppointment: React.FC<FittingAppointmentProps> = ({
  open,
  onClose,
  dress,
  dressName,
  supplier,
  location,
}) => {
  const { user } = useUserContext() as UserContextType
  const [formData, setFormData] = useState({
    appointmentDate: null as Date | null,
    timeSlot: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const timeSlots = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
    '18:00-19:00',
    '19:00-20:00',
  ]

  useEffect(() => {
    if (formData.appointmentDate && supplier) {
      fetchAvailableSlots()
    }
  }, [formData.appointmentDate, supplier])

  // Auto-fill user information when dialog opens
  useEffect(() => {
    if (open && user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.fullName || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || '',
      }))
    }
  }, [open, user])

  const fetchAvailableSlots = async () => {
    if (!formData.appointmentDate) {
      return
    }

    try {
      const dateStr = formData.appointmentDate.toISOString().split('T')[0]
      const result = await FittingAppointmentService.getAvailableTimeSlots(supplier!, dateStr)
      setAvailableSlots(result.availableSlots)
    } catch (err) {
      console.error('Error fetching available slots:', err)
      setError('Failed to fetch available time slots')
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: date,
      timeSlot: '', // Reset time slot when date changes
    }))
  }

  const handleTimeSlotChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      timeSlot: event.target.value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.appointmentDate || !formData.timeSlot || !formData.customerName || !formData.customerPhone || !formData.customerEmail) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!dress?._id && !dressName) {
        setError('Dress information is required')
        setLoading(false)
        return
      }

      const appointmentData: bookcarsTypes.CreateFittingAppointmentPayload = {
        dress: dress?._id || '',
        supplier: supplier || '',
        location: location || '',
        appointmentDate: formData.appointmentDate!,
        timeSlot: formData.timeSlot,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        notes: formData.notes,
      }

      await FittingAppointmentService.createAppointment(appointmentData)
      setSuccess('Fitting appointment booked successfully!')

      // Reset form
      setFormData({
        appointmentDate: null,
        timeSlot: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        notes: '',
      })

      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {strings.BOOK_FITTING_APPOINTMENT || 'Book Fitting Appointment'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {strings.DRESS}: {dress?.name || dressName}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={strings.APPOINTMENT_DATE || 'Appointment Date'}
              value={formData.appointmentDate}
              onChange={handleDateChange}
              minDate={new Date()}
              slots={{
                textField: TextField,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </LocalizationProvider>

          <FormControl fullWidth required>
            <InputLabel>{strings.TIME_SLOT || 'Time Slot'}</InputLabel>
            <Select
              value={formData.timeSlot}
              onChange={handleTimeSlotChange}
              disabled={!formData.appointmentDate || availableSlots.length === 0}
            >
              {availableSlots.map((slot) => (
                <MenuItem key={slot} value={slot}>
                  {slot}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="customerName"
            label={strings.CUSTOMER_NAME || 'Customer Name'}
            value={formData.customerName}
            onChange={handleInputChange}
            fullWidth
            required
          />

          <TextField
            name="customerPhone"
            label={strings.CUSTOMER_PHONE || 'Customer Phone'}
            value={formData.customerPhone}
            onChange={handleInputChange}
            fullWidth
            required
          />

          <TextField
            name="customerEmail"
            label={strings.CUSTOMER_EMAIL || 'Customer Email'}
            type="email"
            value={formData.customerEmail}
            onChange={handleInputChange}
            fullWidth
            required
          />

          <TextField
            name="notes"
            label={strings.NOTES || 'Notes'}
            value={formData.notes}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {commonStrings.CANCEL}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? (strings.BOOKING || 'Booking...') : (strings.BOOK_APPOINTMENT || 'Book Appointment')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FittingAppointment
