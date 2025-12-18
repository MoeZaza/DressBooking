import React, { useState, useEffect } from 'react'
import {   
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Autocomplete,
 } from '@mui/material'
import {
  CalendarToday,
  AccessTime,
  Person,
  Phone,
  Email,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Schedule,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Straighten as MeasureIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as headerStrings } from '@/lang/header'
import { useLanguage } from '@/context/LanguageContext'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as FittingAppointmentService from '@/services/FittingAppointmentService'

interface FittingAppointment {
  _id: string
  bookingId: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  dressId: string
  dressName: string
  appointmentDate: Date
  timeSlot: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  alterationNotes: string
  fittingNotes: string
  measurements?: {
    bust?: number
    waist?: number
    hips?: number
    height?: number
    shoulderWidth?: number
    armLength?: number
  }
  duration: number
  createdAt: Date
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fitting-tabpanel-${index}`}
      aria-labelledby={`fitting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const FittingAppointments = () => {
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<FittingAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<FittingAppointment | null>(null)
  const [tabValue, setTabValue] = useState(0)

  // Pagination and filtering
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null)

  // Error and success states
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Available dresses for new appointments
  const [availableDresses, setAvailableDresses] = useState<bookcarsTypes.Dress[]>([])

  // New appointment form data
  const [newAppointment, setNewAppointment] = useState({
    dress: '',
    appointmentDate: new Date(),
    timeSlot: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [selectedDate, user])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supplierId = user._id
      const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined
      const data = await FittingAppointmentService.getSupplierAppointments(supplierId!, '', dateStr)

      // Convert to local interface format
      const convertedAppointments: FittingAppointment[] = data.map(apt => ({
        _id: apt._id!,
        bookingId: apt._id!, // Use appointment ID as booking ID for now
        customerId: typeof apt.customer === 'string' ? apt.customer : apt.customer._id!,
        customerName: apt.customerName,
        customerEmail: apt.customerEmail,
        customerPhone: apt.customerPhone,
        dressId: typeof apt.dress === 'string' ? apt.dress : apt.dress._id!,
        dressName: typeof apt.dress === 'object' ? apt.dress.name : 'Unknown Dress',
        appointmentDate: new Date(apt.appointmentDate),
        timeSlot: apt.timeSlot,
        status: apt.status as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
        alterationNotes: apt.alterationsNeeded || '',
        fittingNotes: apt.fittingNotes || '',
        measurements: apt.measurements,
        duration: apt.duration || 60,
        createdAt: apt.createdAt || new Date(),
      }))

      setAppointments(convertedAppointments)
    } catch (err: any) {
      console.error('Error fetching appointments:', err)

      let errorMessage = 'Failed to load appointments'
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setAppointments([]) 
    } finally {
      setLoading(false)
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      case 'no-show': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Schedule />
      case 'completed': return <CheckCircle />
      case 'cancelled': return <Cancel />
      case 'no-show': return <AccessTime />
      default: return <Schedule />
    }
  }

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const handleEditAppointment = (appointment: FittingAppointment) => {
    setSelectedAppointment(appointment)
    setEditDialogOpen(true)
  }

  const handleUpdateStatus = (appointmentId: string, newStatus: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt._id === appointmentId 
          ? { ...apt, status: newStatus as any }
          : apt
      )
    )
  }

  const handleSaveAppointment = () => {
    if (selectedAppointment) {
      setAppointments(prev => 
        prev.map(apt => 
          apt._id === selectedAppointment._id 
            ? selectedAppointment
            : apt
        )
      )
    }
    setEditDialogOpen(false)
    setSelectedAppointment(null)
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const getFilteredAppointments = () => {
    let filtered = appointments

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.dressName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="xl" sx={{ py: 3 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAppointments}
              disabled={loading}
            >
              {strings.REFRESH || 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => {/* Export functionality */}}
            >
              {strings.EXPORT || 'Export'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              {strings.ADD_APPOINTMENT || 'Add Appointment'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label={strings.CALENDAR_VIEW || 'Calendar View'}
              icon={<CalendarToday />}
              iconPosition="start"
            />
            <Tab
              label={strings.LIST_VIEW || 'List View'}
              icon={<List />}
              iconPosition="start"
            />
            <Tab
              label={strings.ANALYTICS || 'Analytics'}
              icon={<AnalyticsIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Panel 0: Calendar View */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {/* Date Selector */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {strings.SELECT_DATE || 'Select Date'}
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={selectedDate}
                      onChange={(newDate) => newDate && setSelectedDate(newDate)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateDisplay(selectedDate)}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Appointments for Selected Date */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {strings.APPOINTMENTS_FOR || 'Appointments for'} {formatDateDisplay(selectedDate)}
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : appointments.length === 0 ? (
                    <Alert severity="info">
                      {strings.NO_APPOINTMENTS || 'No fitting appointments scheduled for this date.'}
                    </Alert>
                  ) : (
                    <List>
                      {appointments.map((appointment, index) => (
                        <React.Fragment key={appointment._id}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="h6">
                                    {appointment.timeSlot}
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
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body1" component="div">
                                    <Person fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {appointment.customerName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <Email fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {appointment.customerEmail}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <Phone fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    {appointment.customerPhone}
                                  </Typography>
                                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                                    {strings.DRESS || 'Dress'}: {appointment.dressName}
                                  </Typography>
                                  {appointment.alterationNotes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {strings.ALTERATIONS || 'Alterations'}: {appointment.alterationNotes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Tooltip title={strings.EDIT || 'Edit'}>
                                <IconButton
                                  onClick={() => handleEditAppointment(appointment)}
                                  size="small"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={strings.MEASUREMENTS || 'Measurements'}>
                                <IconButton
                                  onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setMeasurementDialogOpen(true)
                                  }}
                                  size="small"
                                >
                                  <MeasureIcon />
                                </IconButton>
                              </Tooltip>
                              {appointment.status === 'pending' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                                  >
                                    {strings.CONFIRM || 'Confirm'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                                  >
                                    {strings.CANCEL || 'Cancel'}
                                  </Button>
                                </>
                              )}
                              {appointment.status === 'confirmed' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                                >
                                  {strings.COMPLETE || 'Complete'}
                                </Button>
                              )}
                            </Box>
                          </ListItem>
                          {index < appointments.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab Panel 1: List View */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  label={strings.SEARCH || 'Search'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by customer name, email, or dress..."
                  sx={{ minWidth: 300 }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>{strings.STATUS || 'Status'}</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label={strings.STATUS || 'Status'}
                  >
                    <MenuItem value="all">{strings.ALL_STATUSES || 'All Statuses'}</MenuItem>
                    <MenuItem value="pending">{strings.PENDING || 'Pending'}</MenuItem>
                    <MenuItem value="confirmed">{strings.CONFIRMED || 'Confirmed'}</MenuItem>
                    <MenuItem value="completed">{strings.COMPLETED || 'Completed'}</MenuItem>
                    <MenuItem value="cancelled">{strings.CANCELLED || 'Cancelled'}</MenuItem>
                    <MenuItem value="no-show">{strings.NO_SHOW || 'No Show'}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Appointments Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{strings.DATE || 'Date'}</TableCell>
                      <TableCell>{strings.TIME || 'Time'}</TableCell>
                      <TableCell>{strings.CUSTOMER || 'Customer'}</TableCell>
                      <TableCell>{strings.DRESS || 'Dress'}</TableCell>
                      <TableCell>{strings.STATUS || 'Status'}</TableCell>
                      <TableCell>{strings.DURATION || 'Duration'}</TableCell>
                      <TableCell>{strings.ACTIONS || 'Actions'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredAppointments()
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((appointment) => (
                        <TableRow key={appointment._id}>
                          <TableCell>
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{appointment.timeSlot}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {appointment.customerName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {appointment.customerEmail}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{appointment.dressName}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(appointment.status)}
                              label={appointment.status.toUpperCase()}
                              color={getStatusColor(appointment.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{appointment.duration} min</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title={strings.EDIT || 'Edit'}>
                                <IconButton size="small" onClick={() => handleEditAppointment(appointment)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={strings.MEASUREMENTS || 'Measurements'}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setMeasurementDialogOpen(true)
                                  }}
                                >
                                  <MeasureIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={getFilteredAppointments().length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab Panel 2: Analytics */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.TOTAL_APPOINTMENTS || 'Total Appointments'}
                  </Typography>
                  <Typography variant="h4">
                    {appointments.length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.PENDING_APPOINTMENTS || 'Pending Appointments'}
                  </Typography>
                  <Typography variant="h4">
                    {appointments.filter(apt => apt.status === 'pending').length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.COMPLETED_APPOINTMENTS || 'Completed Appointments'}
                  </Typography>
                  <Typography variant="h4">
                    {appointments.filter(apt => apt.status === 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.COMPLETION_RATE || 'Completion Rate'}
                  </Typography>
                  <Typography variant="h4">
                    {appointments.length > 0
                      ? `${Math.round((appointments.filter(apt => apt.status === 'completed').length / appointments.length) * 100)}%`
                      : '0%'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Edit Appointment Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{strings.EDIT_APPOINTMENT || 'Edit Fitting Appointment'}</DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label={strings.CUSTOMER_NAME || 'Customer Name'}
                  value={selectedAppointment.customerName}
                  disabled
                  fullWidth
                />
                <TextField
                  label={strings.DRESS || 'Dress'}
                  value={selectedAppointment.dressName}
                  disabled
                  fullWidth
                />
                <TextField
                  label={strings.TIME_SLOT || 'Time Slot'}
                  value={selectedAppointment.timeSlot}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    timeSlot: e.target.value
                  })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>{strings.STATUS || 'Status'}</InputLabel>
                  <Select
                    value={selectedAppointment.status}
                    onChange={(e) => setSelectedAppointment({
                      ...selectedAppointment,
                      status: e.target.value as any
                    })}
                    label={strings.STATUS || 'Status'}
                  >
                    <MenuItem value="pending">{strings.PENDING || 'Pending'}</MenuItem>
                    <MenuItem value="confirmed">{strings.CONFIRMED || 'Confirmed'}</MenuItem>
                    <MenuItem value="completed">{strings.COMPLETED || 'Completed'}</MenuItem>
                    <MenuItem value="cancelled">{strings.CANCELLED || 'Cancelled'}</MenuItem>
                    <MenuItem value="no-show">{strings.NO_SHOW || 'No Show'}</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label={strings.ALTERATION_NOTES || 'Alteration Notes'}
                  value={selectedAppointment.alterationNotes}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    alterationNotes: e.target.value
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  label={strings.FITTING_NOTES || 'Fitting Notes'}
                  value={selectedAppointment.fittingNotes}
                  onChange={(e) => setSelectedAppointment({
                    ...selectedAppointment,
                    fittingNotes: e.target.value
                  })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={strings.ADD_FITTING_NOTES || 'Add notes about the fitting session...'}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              {strings.CANCEL || 'Cancel'}
            </Button>
            <Button onClick={handleSaveAppointment} variant="contained">
              {strings.SAVE || 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Measurements Dialog */}
        <Dialog open={measurementDialogOpen} onClose={() => setMeasurementDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{strings.CUSTOMER_MEASUREMENTS || 'Customer Measurements'}</DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedAppointment.customerName}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.BUST || 'Bust (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.bust || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          bust: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.WAIST || 'Waist (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.waist || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          waist: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.HIPS || 'Hips (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.hips || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          hips: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.HEIGHT || 'Height (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.height || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          height: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.SHOULDER_WIDTH || 'Shoulder Width (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.shoulderWidth || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          shoulderWidth: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      label={strings.ARM_LENGTH || 'Arm Length (cm)'}
                      type="number"
                      value={selectedAppointment.measurements?.armLength || ''}
                      onChange={(e) => setSelectedAppointment({
                        ...selectedAppointment,
                        measurements: {
                          ...selectedAppointment.measurements,
                          armLength: Number(e.target.value)
                        }
                      })}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMeasurementDialogOpen(false)}>
              {strings.CANCEL || 'Cancel'}
            </Button>
            <Button onClick={handleSaveAppointment} variant="contained">
              {strings.SAVE_MEASUREMENTS || 'Save Measurements'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default FittingAppointments
