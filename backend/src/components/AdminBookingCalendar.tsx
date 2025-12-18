import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert,
 } from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'

import BookingEditDialog from './BookingEditDialog'
import * as AdminBookingService from '@/services/AdminBookingService'
import * as helper from '@/common/helper'

interface AdminBookingCalendarProps {
  supplierId?: string
  onBookingSelect?: (booking: bookcarsTypes.Booking) => void
}

interface CalendarBooking extends bookcarsTypes.Booking {
  color?: string
}

const AdminBookingCalendar: React.FC<AdminBookingCalendarProps> = ({
  supplierId,
  onBookingSelect,
}) => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<bookcarsTypes.Booking | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [error, setError] = useState('')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const loadBookings = useCallback(async () => {
    try {
      setError('')

      const startDate = monthStart.toISOString()
      const endDate = monthEnd.toISOString()

      const data = await AdminBookingService.getBookingCalendarData(startDate, endDate, supplierId)
      
      // Add colors based on status
      const coloredBookings = data.map((booking: any) => ({
        ...booking,
        color: getStatusColor(booking.status)
      }))

      setBookings(coloredBookings)
    } catch (err: any) {
      console.error('Error loading bookings:', err)
      setError('Failed to load bookings')
    }
  }, [monthStart, monthEnd, supplierId])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return '#4caf50' // Green
      case 'deposit':
        return '#ff9800' // Orange
      case 'pending':
        return '#2196f3' // Blue
      case 'reserved':
        return '#9c27b0' // Purple
      case 'cancelled':
        return '#f44336' // Red
      default:
        return '#757575' // Grey
    }
  }

  const getBookingsForDay = (day: Date): CalendarBooking[] => {
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.from)
      const bookingEnd = new Date(booking.to)
      return day >= bookingStart && day <= bookingEnd
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleBookingClick = (booking: CalendarBooking) => {
    setSelectedBooking(booking)
    setViewDialogOpen(true)
    if (onBookingSelect) {
      onBookingSelect(booking)
    }
  }

  const handleEditBooking = () => {
    setViewDialogOpen(false)
    setEditDialogOpen(true)
  }

  const handleBookingUpdated = () => {
    setEditDialogOpen(false)
    setSelectedBooking(null)
    loadBookings()
    helper.info('Booking updated successfully!')
  }



  const renderBookingChip = (booking: CalendarBooking) => (
    <Chip
      key={booking._id}
      label={`${(booking.dress as any)?.name || 'Unknown'} - ${(booking.customer as any)?.fullName || 'Unknown'}`}
      size="small"
      onClick={() => handleBookingClick(booking)}
      sx={{
        backgroundColor: booking.color,
        color: 'white',
        fontSize: '0.7rem',
        height: '20px',
        mb: 0.5,
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8,
        },
      }}
    />
  )

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevMonth}>
            <PrevIcon />
          </IconButton>
          <Typography variant="h5" sx={{ mx: 2 }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <NextIcon />
          </IconButton>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-booking')}
        >
          New Booking
        </Button>
      </Box>

      {/* Calendar Grid */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }} key={day}>
              <Typography variant="subtitle2" align="center" sx={{ fontWeight: 'bold', py: 1 }}>
                {day}
              </Typography>
            </Box>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day) => {
            const dayBookings = getBookingsForDay(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }} key={day.toISOString()}>
                <Card
                  sx={{
                    minHeight: 120,
                    backgroundColor: isToday ? '#e3f2fd' : 'white',
                    border: isToday ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                  onClick={() => {
                    // Could add functionality to create booking for this day
                  }}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                      {format(day, 'd')}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      {dayBookings.slice(0, 3).map((booking) => renderBookingChip(booking))}
                      {dayBookings.length > 3 && (
                        <Typography variant="caption" color="textSecondary">
                          +{dayBookings.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )
          })}
        </Box>
      </Paper>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>Status Legend:</Typography>
        {[
          { status: 'paid', label: 'Paid', color: '#4caf50' },
          { status: 'deposit', label: 'Deposit', color: '#ff9800' },
          { status: 'pending', label: 'Pending', color: '#2196f3' },
          { status: 'reserved', label: 'Reserved', color: '#9c27b0' },
          { status: 'cancelled', label: 'Cancelled', color: '#f44336' },
        ].map(({ status, label, color }) => (
          <Chip
            key={status}
            label={label}
            size="small"
            sx={{ backgroundColor: color, color: 'white' }}
          />
        ))}
      </Box>

      {/* Booking Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Booking Details
          <IconButton
            onClick={handleEditBooking}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <EditIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">Customer:</Typography>
                <Typography>{(selectedBooking.customer as any)?.fullName}</Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">Dress:</Typography>
                <Typography>{(selectedBooking.dress as any)?.name}</Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">From:</Typography>
                <Typography>{format(new Date(selectedBooking.from), 'PPP')}</Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">To:</Typography>
                <Typography>{format(new Date(selectedBooking.to), 'PPP')}</Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">Status:</Typography>
                <Chip
                  label={selectedBooking.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(selectedBooking.status),
                    color: 'white'
                  }}
                />
              </Box>
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Typography variant="subtitle2">Price:</Typography>
                <Typography>${selectedBooking.price}</Typography>
              </Box>
              {selectedBooking.fittingRequired && (
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Typography variant="subtitle2">Fitting Date:</Typography>
                  <Typography>
                    {selectedBooking.fittingDate
                      ? format(new Date(selectedBooking.fittingDate), 'PPP p')
                      : 'Not scheduled'
                    }
                  </Typography>
                </Box>
              )}
              {selectedBooking.alterationNotes && (
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Typography variant="subtitle2">Alteration Notes:</Typography>
                  <Typography>{selectedBooking.alterationNotes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button onClick={handleEditBooking} variant="contained">
            Edit Booking
          </Button>
        </DialogActions>
      </Dialog>



      {/* Edit Booking Dialog */}
      <BookingEditDialog
        open={editDialogOpen}
        booking={selectedBooking}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleBookingUpdated}
      />
    </Box>
  )
}

export default AdminBookingCalendar
