import React, { useState, useEffect } from 'react'
import {   
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
 } from '@mui/material'
import {
  AttachMoney,
  TrendingUp,
  Receipt,
  Refresh,
  Edit,
  Undo,

  Add as AddIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import { useLanguage } from '@/context/LanguageContext'
import Layout from '@/components/Layout'
import * as PaymentService from '@/services/PaymentService'
import * as BookingService from '@/services/BookingService'

interface PaymentAnalytics {
  totalRevenue: number
  totalPayments: number
  averagePayment: number
  statusBreakdown: Record<string, number>
  methodBreakdown: Record<string, number>
  period: number
}

const PaymentManagement: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [payments, setPayments] = useState<bookcarsTypes.Payment[]>([])
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  })
  const [selectedPayment, setSelectedPayment] = useState<bookcarsTypes.Payment | null>(null)
  const [updateDialog, setUpdateDialog] = useState(false)
  const [refundDialog, setRefundDialog] = useState(false)
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: '',
  })
  const [refundData, setRefundData] = useState({
    amount: 0,
    reason: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add payment dialog state
  const [addPaymentDialog, setAddPaymentDialog] = useState(false)
  const [paymentData, setPaymentData] = useState({
    booking: '',
    amount: 0,
    paymentMethod: 'visa' as bookcarsTypes.PaymentGateway,
    transactionId: '',
    notes: '',
  })
  const [bookings, setBookings] = useState<bookcarsTypes.Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPayments()
      fetchAnalytics()
    }
  }, [user, statusFilter, dateRange])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const fetchPayments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supplierId = user._id!
      const startDate = dateRange.startDate.toISOString().split('T')[0]
      const endDate = dateRange.endDate.toISOString().split('T')[0]
      
      const data = await PaymentService.getSupplierPayments(supplierId, statusFilter, startDate, endDate)
      setPayments(data)
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      const supplierId = user._id!
      const period = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const data = await PaymentService.getPaymentAnalytics(supplierId, period)
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }

  const handleUpdatePayment = (payment: bookcarsTypes.Payment) => {
    setSelectedPayment(payment)
    setUpdateData({
      status: payment.status,
      notes: payment.notes || '',
    })
    setUpdateDialog(true)
  }

  const handleRefundPayment = (payment: bookcarsTypes.Payment) => {
    setSelectedPayment(payment)
    setRefundData({
      amount: payment.amount,
      reason: '',
    })
    setRefundDialog(true)
  }

  const handleSaveUpdate = async () => {
    if (!selectedPayment) return

    try {
      setLoading(true)
      await PaymentService.updatePaymentStatus(selectedPayment._id!, updateData.status, updateData.notes)
      setSuccess('Payment updated successfully')
      setUpdateDialog(false)
      fetchPayments()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update payment')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRefund = async () => {
    if (!selectedPayment) return

    try {
      setLoading(true)
      await PaymentService.processRefund(selectedPayment._id!, refundData.amount, refundData.reason)
      setSuccess('Refund processed successfully')
      setRefundDialog(false)
      fetchPayments()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process refund')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = () => {
    setAddPaymentDialog(true)
    fetchBookings()
  }

  const fetchBookings = async () => {
    if (!user) return

    try {
      setLoadingBookings(true)

      // Create payload for fetching supplier's bookings
      const payload: bookcarsTypes.GetBookingsPayload = {
        suppliers: [user._id!],
        statuses: [
          bookcarsTypes.BookingStatus.Pending,
          bookcarsTypes.BookingStatus.Deposit,
          bookcarsTypes.BookingStatus.Paid,
          bookcarsTypes.BookingStatus.Reserved,
          bookcarsTypes.BookingStatus.Cancelled
        ]
      }

      // Fetch bookings using the proper API
      const result = await BookingService.getBookings(payload, 1, 100)
      const fetchedBookings = result && result.length > 0 ? result[0]?.resultData || [] : []
      setBookings(fetchedBookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to fetch bookings')
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!paymentData.booking || !paymentData.amount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const payload: bookcarsTypes.CreatePaymentBookingPayload = {
        booking: paymentData.booking,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId || `MANUAL-${Date.now()}`,
        notes: paymentData.notes,
      }

      await PaymentService.createPayment(payload)
      setSuccess('Payment created successfully')
      setAddPaymentDialog(false)
      setPaymentData({
        booking: '',
        amount: 0,
        paymentMethod: 'visa' as bookcarsTypes.PaymentGateway,
        transactionId: '',
        notes: '',
      })
      fetchPayments()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully-paid':
        return 'success'
      case 'partially-paid':
        return 'warning'
      case 'pending':
        return 'info'
      case 'refunded':
        return 'error'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'primary'
      case 'payPal':
        return 'secondary'
      case 'visa':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {strings.PAYMENT_MANAGEMENT || 'Payment Management'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPayment}
            disabled={loading}
          >
            {strings.ADD_PAYMENT || 'Add Payment'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Analytics Cards */}
        {analytics && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney color="success" />
                    <Box>
                      <Typography variant="h4">${analytics.totalRevenue.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {strings.TOTAL_REVENUE || 'Total Revenue'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt color="primary" />
                    <Box>
                      <Typography variant="h4">{analytics.totalPayments}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {strings.TOTAL_PAYMENTS || 'Total Payments'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="info" />
                    <Box>
                      <Typography variant="h4">${analytics.averagePayment.toFixed(0)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {strings.AVERAGE_PAYMENT || 'Average Payment'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {strings.PAYMENT_METHODS || 'Payment Methods'}
                  </Typography>
                  {Object.entries(analytics.methodBreakdown).map(([method, amount]) => (
                    <Box key={method} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{method}:</Typography>
                      <Typography variant="body2">${amount.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { size: "small" } }}
            />
          </LocalizationProvider>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel size="small">{strings.STATUS}</InputLabel>
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">{strings.ALL_STATUSES || 'All Statuses'}</MenuItem>
              <MenuItem value="pending">{strings.PENDING || 'Pending'}</MenuItem>
              <MenuItem value="partially-paid">{strings.PARTIALLY_PAID || 'Partially Paid'}</MenuItem>
              <MenuItem value="fully-paid">{strings.FULLY_PAID || 'Fully Paid'}</MenuItem>
              <MenuItem value="refunded">{strings.REFUNDED || 'Refunded'}</MenuItem>
              <MenuItem value="failed">{strings.FAILED || 'Failed'}</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { fetchPayments(); fetchAnalytics(); }}
            disabled={loading}
          >
            {strings.REFRESH || 'Refresh'}
          </Button>
        </Box>

        {/* Payments Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{strings.PAYMENT_DATE || 'Payment Date'}</TableCell>
                <TableCell>{strings.BOOKING || 'Booking'}</TableCell>
                <TableCell align="right">{strings.AMOUNT || 'Amount'}</TableCell>
                <TableCell>{strings.PAYMENT_METHOD || 'Method'}</TableCell>
                <TableCell>{strings.STATUS}</TableCell>
                <TableCell>{strings.TRANSACTION_ID || 'Transaction ID'}</TableCell>
                <TableCell>{strings.ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {typeof payment.booking === 'object' && payment.booking ? (
                      <Box>
                        <Typography variant="body2">
                          {new Date(payment.booking.from).toLocaleDateString()} - {new Date(payment.booking.to).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${payment.booking.price}
                        </Typography>
                      </Box>
                    ) : (
                      payment.booking
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={payment.amount < 0 ? 'error' : 'inherit'}>
                      ${Math.abs(payment.amount).toLocaleString()}
                      {payment.amount < 0 && ' (Refund)'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.paymentMethod} 
                      color={getMethodColor(payment.paymentMethod) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.status} 
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.transactionId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={strings.UPDATE || 'Update'}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdatePayment(payment)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {payment.status !== 'refunded' && payment.amount > 0 && (
                        <Tooltip title={strings.REFUND || 'Refund'}>
                          <IconButton
                            size="small"
                            onClick={() => handleRefundPayment(payment)}
                          >
                            <Undo />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Update Payment Dialog */}
        <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{strings.UPDATE_PAYMENT || 'Update Payment'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>{strings.STATUS}</InputLabel>
                <Select
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="pending">{strings.PENDING || 'Pending'}</MenuItem>
                  <MenuItem value="partially-paid">{strings.PARTIALLY_PAID || 'Partially Paid'}</MenuItem>
                  <MenuItem value="fully-paid">{strings.FULLY_PAID || 'Fully Paid'}</MenuItem>
                  <MenuItem value="failed">{strings.FAILED || 'Failed'}</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={strings.NOTES || 'Notes'}
                value={updateData.notes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialog(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button onClick={handleSaveUpdate} variant="contained" disabled={loading}>
              {strings.SAVE || 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog open={refundDialog} onClose={() => setRefundDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{strings.PROCESS_REFUND || 'Process Refund'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={strings.REFUND_AMOUNT || 'Refund Amount'}
                type="number"
                value={refundData.amount}
                onChange={(e) => setRefundData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                fullWidth
                slotProps={{ htmlInput: { min: 0, max: selectedPayment?.amount || 0 } }}
              />

              <TextField
                label={strings.REFUND_REASON || 'Refund Reason'}
                value={refundData.reason}
                onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRefundDialog(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button 
              onClick={handleProcessRefund} 
              variant="contained" 
              color="error"
              disabled={loading || !refundData.reason}
            >
              {strings.PROCESS_REFUND || 'Process Refund'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Payment Dialog */}
        <Dialog open={addPaymentDialog} onClose={() => setAddPaymentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{strings.ADD_PAYMENT || 'Add Payment'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>{strings.BOOKING || 'Booking'}</InputLabel>
                <Select
                  value={paymentData.booking}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, booking: e.target.value }))}
                  disabled={loadingBookings}
                >
                  {loadingBookings ? (
                    <MenuItem disabled>Loading bookings...</MenuItem>
                  ) : bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <MenuItem key={booking._id} value={booking._id}>
                        {typeof booking.dress === 'object' && booking.dress?.name
                          ? `${booking.dress.name} - ${new Date(booking.from).toLocaleDateString()}`
                          : `Booking ${booking._id}`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No bookings available</MenuItem>
                  )}
                </Select>
              </FormControl>

              <TextField
                label={strings.AMOUNT || 'Amount'}
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                fullWidth
                required
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              />

              <FormControl fullWidth>
                <InputLabel>{strings.PAYMENT_METHOD || 'Payment Method'}</InputLabel>
                <Select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value as bookcarsTypes.PaymentGateway }))}
                >
                  <MenuItem value="visa">Visa</MenuItem>
                  <MenuItem value="stripe">Stripe</MenuItem>
                  <MenuItem value="payPal">PayPal</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={strings.TRANSACTION_ID || 'Transaction ID'}
                value={paymentData.transactionId}
                onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
                fullWidth
                placeholder="Leave empty for auto-generated ID"
              />

              <TextField
                label={strings.NOTES || 'Notes'}
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                placeholder="Additional payment notes..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddPaymentDialog(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button
              onClick={handleCreatePayment}
              variant="contained"
              disabled={loading || !paymentData.booking || !paymentData.amount}
            >
              {strings.CREATE_PAYMENT || 'Create Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default PaymentManagement
