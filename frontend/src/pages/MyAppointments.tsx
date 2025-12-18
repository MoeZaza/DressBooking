import React, { useState, useEffect } from 'react'
import {   
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
 } from '@mui/material'
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns'
import Layout from '../components/Layout'
import * as FittingAppointmentService from '../services/FittingAppointmentService'
import * as helper from '../common/helper'
import { strings } from '../lang/dresses'
import { strings as commonStrings } from '../lang/common'
import * as bookcarsTypes from ':bookcars-types'

const MyAppointments: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [appointments, setAppointments] = useState<bookcarsTypes.FittingAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<bookcarsTypes.FittingAppointment | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await FittingAppointmentService.getCustomerAppointments()
      setAppointments(data || [])
    } catch (err: any) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) {
      return
    }

    try {
      setCancelling(true)
      setError('')
      
      await FittingAppointmentService.updateAppointment(selectedAppointment._id!, {
        status: bookcarsTypes.FittingAppointmentStatus.Cancelled
      })
      
      setSuccess('Appointment cancelled successfully')
      setCancelDialogOpen(false)
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel appointment')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      case 'no-show': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ScheduleIcon />
      case 'confirmed': return <CheckCircleIcon />
      case 'completed': return <CheckCircleIcon />
      case 'cancelled': return <CancelIcon />
      case 'no-show': return <TimeIcon />
      default: return <ScheduleIcon />
    }
  }

  const formatDateDisplay = (date: Date | string) => {
    const appointmentDate = new Date(date)
    if (isToday(appointmentDate)) {
      return 'Today'
    }
    if (isTomorrow(appointmentDate)) {
      return 'Tomorrow'
    }
    if (isYesterday(appointmentDate)) {
      return 'Yesterday'
    }
    return format(appointmentDate, 'EEEE, MMMM d, yyyy')
  }

  const canCancelAppointment = (appointment: bookcarsTypes.FittingAppointment) => {
    const appointmentDate = new Date(appointment.appointmentDate)
    const now = new Date()
    const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return (
      (appointment.status === 'pending' || appointment.status === 'confirmed') &&
      hoursDiff > 24 // Can cancel if more than 24 hours away
    )
  }

  const upcomingAppointments = appointments.filter(apt => 
    !isPast(new Date(apt.appointmentDate)) && apt.status !== 'cancelled'
  )
  
  const pastAppointments = appointments.filter(apt => 
    isPast(new Date(apt.appointmentDate)) || apt.status === 'cancelled'
  )

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {strings.MY_APPOINTMENTS || 'My Fitting Appointments'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAppointments}
            disabled={loading}
          >
            {commonStrings.REFRESH}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Upcoming Appointments */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {strings.UPCOMING_APPOINTMENTS || 'Upcoming Appointments'}
                  </Typography>
                  
                  {upcomingAppointments.length === 0 ? (
                    <Alert severity="info">
                      {strings.NO_UPCOMING_APPOINTMENTS || 'No upcoming appointments'}
                    </Alert>
                  ) : (
                    <List>
                      {upcomingAppointments.map((appointment, index) => (
                        <React.Fragment key={appointment._id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <EventIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {formatDateDisplay(appointment.appointmentDate)}
                                  </Typography>
                                  <Chip
                                    icon={getStatusIcon(appointment.status)}
                                    label={appointment.status.toUpperCase()}
                                    color={getStatusColor(appointment.status) as any}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <TimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {appointment.timeSlot}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {typeof appointment.dress === 'object' ? appointment.dress.name : 'Dress'}
                                  </Typography>
                                  {appointment.notes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {strings.NOTES}: {appointment.notes}
                                    </Typography>
                                  )}
                                  
                                  {canCancelAppointment(appointment) && (
                                    <Box sx={{ mt: 1 }}>
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={() => {
                                          setSelectedAppointment(appointment)
                                          setCancelDialogOpen(true)
                                        }}
                                      >
                                        {strings.CANCEL_APPOINTMENT || 'Cancel'}
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < upcomingAppointments.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Past Appointments */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {strings.PAST_APPOINTMENTS || 'Past Appointments'}
                  </Typography>
                  
                  {pastAppointments.length === 0 ? (
                    <Alert severity="info">
                      {strings.NO_PAST_APPOINTMENTS || 'No past appointments'}
                    </Alert>
                  ) : (
                    <List>
                      {pastAppointments.slice(0, 10).map((appointment, index) => (
                        <React.Fragment key={appointment._id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'grey.400' }}>
                                <EventIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle1">
                                    {formatDateDisplay(appointment.appointmentDate)}
                                  </Typography>
                                  <Chip
                                    icon={getStatusIcon(appointment.status)}
                                    label={appointment.status.toUpperCase()}
                                    color={getStatusColor(appointment.status) as any}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    <TimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {appointment.timeSlot}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {typeof appointment.dress === 'object' ? appointment.dress.name : 'Dress'}
                                  </Typography>
                                  {appointment.fittingNotes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {strings.FITTING_NOTES}: {appointment.fittingNotes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < Math.min(pastAppointments.length, 10) - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Cancel Appointment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>{strings.CANCEL_APPOINTMENT || 'Cancel Appointment'}</DialogTitle>
          <DialogContent>
            <Typography>
              {strings.CANCEL_APPOINTMENT_CONFIRM || 'Are you sure you want to cancel this appointment?'}
            </Typography>
            {selectedAppointment && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  {formatDateDisplay(selectedAppointment.appointmentDate)} at {selectedAppointment.timeSlot}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {typeof selectedAppointment.dress === 'object' ? selectedAppointment.dress.name : 'Dress'}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              {strings.CANCEL_WARNING || 'Please note that cancellations less than 24 hours before the appointment may incur a fee.'}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              {commonStrings.CANCEL}
            </Button>
            <Button onClick={handleCancelAppointment} color="error" variant="contained" disabled={cancelling}>
              {cancelling ? <CircularProgress size={16} /> : strings.CONFIRM_CANCEL || 'Confirm Cancel'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default MyAppointments
