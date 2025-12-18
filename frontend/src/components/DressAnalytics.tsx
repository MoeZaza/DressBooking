import React, { useState, useEffect } from 'react'
import {   
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
 } from '@mui/material'
import { BarChart, TrendingUp, History } from '@mui/icons-material'
import * as DressService from '../services/DressService'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '../lang/dresses'
import { strings as commonStrings } from '../lang/common'

interface DressAnalyticsProps {
  dress: bookcarsTypes.Dress
  isOwner: boolean
}

interface DressAnalytics {
  dressId: string
  dressName: string
  bookingCount: number
  totalRevenue: number
  rentals: number
  rating: number
}

interface BookingHistory {
  _id: string
  from: Date
  to: Date
  status: string
  price: number
  paidAmount?: number
  remainingAmount?: number
  paymentStatus?: string
  location: any
  fittingRequired?: boolean
  fittingDate?: Date
  alterationNotes?: string
  accessoriesIncluded?: string[]
  createdAt: Date
}

const DressAnalytics: React.FC<DressAnalyticsProps> = ({ dress, isOwner }) => {
  const [analytics, setAnalytics] = useState<DressAnalytics | null>(null)
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOwner && dress._id) {
      fetchAnalytics()
    }
  }, [dress._id, isOwner])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await DressService.getDressAnalytics(dress._id!)
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dress-booking-history/${dress._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setBookingHistory(data)
        setShowHistory(true)
      }
    } catch (error) {
      console.error('Error fetching booking history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'fully-paid':
        return 'success'
      case 'partially-paid':
        return 'warning'
      case 'pending':
        return 'info'
      default:
        return 'default'
    }
  }

  if (!isOwner) {
    return null
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {strings.DRESS_ANALYTICS || 'Dress Analytics'}
      </Typography>
      
      {analytics && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">{analytics.bookingCount}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {strings.TOTAL_BOOKINGS || 'Total Bookings'}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart color="success" />
                <Typography variant="h6">${analytics.totalRevenue}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {strings.TOTAL_REVENUE || 'Total Revenue'}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="info" />
                <Typography variant="h6">{analytics.rentals}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {strings.COMPLETED_RENTALS || 'Completed Rentals'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Button
        variant="outlined"
        startIcon={<History />}
        onClick={fetchBookingHistory}
        disabled={loading}
      >
        {strings.VIEW_BOOKING_HISTORY || 'View Booking History'}
      </Button>

      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {strings.BOOKING_HISTORY || 'Booking History'} - {dress.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{strings.BOOKING_DATE || 'Booking Date'}</TableCell>
                  <TableCell>{strings.RENTAL_PERIOD || 'Rental Period'}</TableCell>
                  <TableCell>{strings.STATUS}</TableCell>
                  <TableCell>{strings.PAYMENT_STATUS || 'Payment Status'}</TableCell>
                  <TableCell>{strings.PRICE}</TableCell>
                  <TableCell>{strings.PAID_AMOUNT || 'Paid Amount'}</TableCell>
                  <TableCell>{strings.REMAINING_AMOUNT || 'Remaining'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingHistory.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.from).toLocaleDateString()} - {new Date(booking.to).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.status} 
                        color={getStatusColor(booking.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.paymentStatus || 'pending'} 
                        color={getPaymentStatusColor(booking.paymentStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${booking.price}</TableCell>
                    <TableCell>${booking.paidAmount || 0}</TableCell>
                    <TableCell>${booking.remainingAmount || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>
            {commonStrings.CLOSE}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DressAnalytics
