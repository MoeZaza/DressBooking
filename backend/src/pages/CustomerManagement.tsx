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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
 } from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Download as ExportIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import * as bookcarsTypes from ':bookcars-types'

const CustomerManagement: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [customers, setCustomers] = useState<bookcarsTypes.User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCustomers, setTotalCustomers] = useState(0)
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<bookcarsTypes.User | null>(null)
  
  // Form data
  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    birthDate: null as Date | null,
    enableEmailNotifications: true,
    blacklisted: false,
  })

  useEffect(() => {
    if (user && helper.admin(user)) {
      fetchCustomers()
    }
  }, [user, page, rowsPerPage, searchTerm, statusFilter])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      
      if (!helper.admin(_user)) {
        // Redirect non-admin users
        window.location.href = '/'
      }
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError('')
      
      const payload: bookcarsTypes.GetUsersBody = {
        user: user?._id!,
        types: [bookcarsTypes.UserType.User],
      }
      
      const data = await UserService.getUsers(payload, searchTerm, page + 1, rowsPerPage)
      
      if (Array.isArray(data) && data.length > 0 && data[0]) {
        setCustomers(data[0].resultData || [])
        setTotalCustomers(data[0].pageInfo?.totalRecords || 0)
      } else {
        setCustomers([])
        setTotalCustomers(0)
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      setError('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!customerData.fullName || !customerData.email) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload: bookcarsTypes.CreateUserPayload = {
        fullName: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone,
        location: customerData.location,
        bio: customerData.bio,
        type: bookcarsTypes.RecordType.User,
        language: user?.language || 'ar',
        birthDate: customerData.birthDate || undefined,

        blacklisted: customerData.blacklisted,
      }
      
      const createdUser = await UserService.create(payload)

      if (createdUser && createdUser._id) {
        setSuccess('Customer created successfully')
        setAddDialogOpen(false)
        resetForm()
        fetchCustomers()
      } else {
        setError('Failed to create customer')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !customerData.fullName || !customerData.email) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload: bookcarsTypes.UpdateUserPayload = {
        _id: selectedCustomer._id!,
        ...customerData,
        birthDate: customerData.birthDate || undefined,
      }
      
      const status = await UserService.updateUser(payload)
      
      if (status === 200) {
        setSuccess('Customer updated successfully')
        setEditDialogOpen(false)
        resetForm()
        fetchCustomers()
      } else {
        setError('Failed to update customer')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return

    try {
      setLoading(true)
      setError('')
      
      const status = await UserService.deleteUsers([selectedCustomer._id!])
      
      if (status === 200) {
        setSuccess('Customer deleted successfully')
        setDeleteDialogOpen(false)
        setSelectedCustomer(null)
        fetchCustomers()
      } else {
        setError('Failed to delete customer')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete customer')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCustomerData({
      fullName: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      birthDate: null,
      enableEmailNotifications: true,
      blacklisted: false,
    })
    setSelectedCustomer(null)
  }

  const handleEdit = (customer: bookcarsTypes.User) => {
    setSelectedCustomer(customer)
    setCustomerData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      location: customer.location || '',
      bio: customer.bio || '',
      birthDate: customer.birthDate ? new Date(customer.birthDate) : null,
      enableEmailNotifications: customer.enableEmailNotifications !== false,
      blacklisted: customer.blacklisted || false,
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (customer: bookcarsTypes.User) => {
    setSelectedCustomer(customer)
    setDeleteDialogOpen(true)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (customer: bookcarsTypes.User) => {
    if (customer.blacklisted) {
      return 'error'
    }
    if (!customer.verified) {
      return 'warning'
    }
    if (!customer.active) {
      return 'secondary'
    }
    return 'success'
  }

  const getStatusLabel = (customer: bookcarsTypes.User) => {
    if (customer.blacklisted) {
      return 'Blacklisted'
    }
    if (!customer.verified) {
      return 'Unverified'
    }
    if (!customer.active) {
      return 'Inactive'
    }
    return 'Active'
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
  }

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Location', 'Status', 'Created Date'].join(','),
      ...customers.map(customer => [
        `"${customer.fullName}"`,
        customer.email,
        customer.phone || '',
        `"${customer.location || ''}"`,
        getStatusLabel(customer),
        formatDate(new Date())
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="xl">
          <Box sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">
                {strings.CUSTOMER_MANAGEMENT || 'Customer Management'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchCustomers}
                  disabled={loading}
                >
                  {commonStrings.REFRESH}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={handleExport}
                  disabled={customers.length === 0}
                >
                  {strings.EXPORT || 'Export'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  disabled={loading}
                >
                  {strings.ADD_CUSTOMER || 'Add Customer'}
                </Button>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems:"center" }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.SEARCH || 'Search'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.STATUS || 'Status'}</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label={strings.STATUS || 'Status'}
                      >
                        <MenuItem value="all">{strings.ALL_STATUSES || 'All Statuses'}</MenuItem>
                        <MenuItem value="active">{strings.ACTIVE || 'Active'}</MenuItem>
                        <MenuItem value="inactive">{strings.INACTIVE || 'Inactive'}</MenuItem>
                        <MenuItem value="blacklisted">{strings.BLACKLISTED || 'Blacklisted'}</MenuItem>
                        <MenuItem value="unverified">{strings.UNVERIFIED || 'Unverified'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <Typography variant="body2" color="text.secondary">
                      {strings.TOTAL_CUSTOMERS || 'Total'}: {totalCustomers}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{strings.CUSTOMER || 'Customer'}</TableCell>
                        <TableCell>{strings.CONTACT_INFO || 'Contact Info'}</TableCell>
                        <TableCell>{strings.LOCATION || 'Location'}</TableCell>
                        <TableCell>{strings.STATUS || 'Status'}</TableCell>
                        <TableCell>{strings.CREATED_DATE || 'Created'}</TableCell>
                        <TableCell>{strings.ACTIONS || 'Actions'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : customers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              {strings.NO_CUSTOMERS || 'No customers found'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        customers.map((customer) => (
                          <TableRow key={customer._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {customer.avatar ? (
                                    <img src={customer.avatar} alt={customer.fullName} />
                                  ) : (
                                    <PersonIcon />
                                  )}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="medium">
                                    {customer.fullName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {customer._id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <EmailIcon fontSize="small" color="action" />
                                  <Typography variant="body2">{customer.email}</Typography>
                                </Box>
                                {customer.phone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon fontSize="small" color="action" />
                                    <Typography variant="body2">{customer.phone}</Typography>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {customer.location && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocationIcon fontSize="small" color="action" />
                                  <Typography variant="body2">{customer.location}</Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(customer)}
                                color={getStatusColor(customer)}
                                size="small"
                                icon={customer.blacklisted ? <BlockIcon /> : <CheckCircleIcon />}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(new Date())}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title={commonStrings.UPDATE}>
                                  <IconButton size="small" onClick={() => handleEdit(customer)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={commonStrings.DELETE}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(customer)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={totalCustomers}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </CardContent>
            </Card>

            {/* Add Customer Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>{strings.ADD_CUSTOMER || 'Add Customer'}</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mt: 1  }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.FULL_NAME || 'Full Name'}
                      value={customerData.fullName}
                      onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.EMAIL || 'Email'}
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.PHONE || 'Phone'}
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.LOCATION || 'Location'}
                      value={customerData.location}
                      onChange={(e) => setCustomerData({ ...customerData, location: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.BIRTH_DATE || 'Birth Date'}
                      value={customerData.birthDate}
                      onChange={(date) => setCustomerData({ ...customerData, birthDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      The customer will receive an activation email to set their password.
                    </Alert>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.BIO || 'Bio'}
                      multiline
                      rows={3}
                      value={customerData.bio}
                      onChange={(e) => setCustomerData({ ...customerData, bio: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customerData.enableEmailNotifications}
                          onChange={(e) => setCustomerData({ ...customerData, enableEmailNotifications: e.target.checked })}
                        />
                      }
                      label={strings.EMAIL_NOTIFICATIONS || 'Email Notifications'}
                    />
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                  {commonStrings.CANCEL}
                </Button>
                <Button onClick={handleCreateCustomer} variant="contained" disabled={loading}>
                  {strings.CREATE || 'Create'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>{strings.EDIT_CUSTOMER || 'Edit Customer'}</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mt: 1  }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.FULL_NAME || 'Full Name'}
                      value={customerData.fullName}
                      onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.EMAIL || 'Email'}
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.PHONE || 'Phone'}
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.LOCATION || 'Location'}
                      value={customerData.location}
                      onChange={(e) => setCustomerData({ ...customerData, location: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.BIRTH_DATE || 'Birth Date'}
                      value={customerData.birthDate}
                      onChange={(date) => setCustomerData({ ...customerData, birthDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Password changes must be done through the user&apos;s account settings.
                    </Alert>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.BIO || 'Bio'}
                      multiline
                      rows={3}
                      value={customerData.bio}
                      onChange={(e) => setCustomerData({ ...customerData, bio: e.target.value })}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customerData.enableEmailNotifications}
                          onChange={(e) => setCustomerData({ ...customerData, enableEmailNotifications: e.target.checked })}
                        />
                      }
                      label={strings.EMAIL_NOTIFICATIONS || 'Email Notifications'}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customerData.blacklisted}
                          onChange={(e) => setCustomerData({ ...customerData, blacklisted: e.target.checked })}
                        />
                      }
                      label={strings.BLACKLISTED || 'Blacklisted'}
                    />
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setEditDialogOpen(false); resetForm(); }}>
                  {commonStrings.CANCEL}
                </Button>
                <Button onClick={handleUpdateCustomer} variant="contained" disabled={loading}>
                  {commonStrings.UPDATE}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Delete Customer Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
              <DialogTitle>{strings.DELETE_CUSTOMER || 'Delete Customer'}</DialogTitle>
              <DialogContent>
                <Typography>
                  {strings.DELETE_CUSTOMER_CONFIRM || 'Are you sure you want to delete this customer?'}
                </Typography>
                {selectedCustomer && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{selectedCustomer.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedCustomer.email}</Typography>
                  </Box>
                )}
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {strings.DELETE_WARNING || 'This action cannot be undone. All customer data, bookings, and appointments will be permanently deleted.'}
                </Alert>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setDeleteDialogOpen(false); setSelectedCustomer(null); }}>
                  {commonStrings.CANCEL}
                </Button>
                <Button onClick={handleDeleteCustomer} color="error" variant="contained" disabled={loading}>
                  {commonStrings.DELETE}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Container>
      </LocalizationProvider>
    </Layout>
  )
}

export default CustomerManagement
