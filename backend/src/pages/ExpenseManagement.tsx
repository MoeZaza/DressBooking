import React, { useState, useEffect } from 'react'
import {   
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
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
  CircularProgress,
  Tooltip,
  TablePagination,
  FormControlLabel,
  Switch,
 } from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as AnalyticsService from '@/services/AnalyticsService'
import * as DressService from '@/services/DressService'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import * as bookcarsTypes from ':bookcars-types'

const ExpenseManagement: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [expenses, setExpenses] = useState<any[]>([])
  const [dresses, setDresses] = useState<bookcarsTypes.Dress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalExpenses, setTotalExpenses] = useState(0)
  
  // Dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  
  // Selected expense
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  
  // Form data
  const [expenseData, setExpenseData] = useState({
    category: 'maintenance',
    description: '',
    amount: '',
    date: new Date(),
    dress: '',
    receiptUrl: '',
    notes: '',
    isRecurring: false,
    recurringFrequency: '',
    tags: [] as string[],
  })
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    dress: '',
  })
  
  // Analytics
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    if (user && helper.admin(user)) {
      fetchExpenses()
      fetchDresses()
      fetchAnalytics()
    }
  }, [user, page, rowsPerPage, filters])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      
      if (!helper.admin(_user)) {
        // Redirect non-admin users
        window.location.href = '/'
      }
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        size: rowsPerPage.toString(),
      })
      
      if (filters.category) params.append('category', filters.category)
      if (filters.dress) params.append('dress', filters.dress)
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
      
      const response = await AnalyticsService.getExpenses(params.toString())
      setExpenses(response.expenses || [])
      setTotalExpenses(response.total || 0)
    } catch (err: any) {
      console.error('Error fetching expenses:', err)
      setError('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchDresses = async () => {
    try {
      const payload: bookcarsTypes.GetDressesPayload = {
        availability: [bookcarsTypes.Availablity.Available]
      }
      const response = await DressService.getDresses('', payload, 1, 100)
      if (Array.isArray(response) && response.length > 0 && response[0]) {
        setDresses(response[0].resultData || [])
      } else if ((response as any)?.docs) {
        // Handle mongoose-paginate-v2 format
        setDresses((response as any).docs || [])
      }
    } catch (err) {
      console.error('Error fetching dresses:', err)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await AnalyticsService.getFinancialSummary()
      setAnalytics(response)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }

  const handleCreateExpense = async () => {
    if (!expenseData.category || !expenseData.description || !expenseData.amount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload = {
        ...expenseData,
        amount: Number(expenseData.amount),
        date: expenseData.date.toISOString(),
        dress: expenseData.dress || undefined,
      }
      
      await AnalyticsService.createExpense(payload)
      setSuccess('Expense created successfully')
      setOpenAddDialog(false)
      resetForm()
      fetchExpenses()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExpense = async () => {
    if (!selectedExpense || !expenseData.category || !expenseData.description || !expenseData.amount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload = {
        ...expenseData,
        amount: Number(expenseData.amount),
        date: expenseData.date.toISOString(),
        dress: expenseData.dress || undefined,
      }
      
      await AnalyticsService.updateExpense(selectedExpense._id, payload)
      setSuccess('Expense updated successfully')
      setOpenEditDialog(false)
      resetForm()
      fetchExpenses()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return

    try {
      setLoading(true)
      setError('')
      
      await AnalyticsService.deleteExpense(selectedExpense._id)
      setSuccess('Expense deleted successfully')
      setOpenDeleteDialog(false)
      setSelectedExpense(null)
      fetchExpenses()
      fetchAnalytics()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setExpenseData({
      category: 'maintenance',
      description: '',
      amount: '',
      date: new Date(),
      dress: '',
      receiptUrl: '',
      notes: '',
      isRecurring: false,
      recurringFrequency: '',
      tags: [],
    })
    setSelectedExpense(null)
  }

  const handleEdit = (expense: any) => {
    setSelectedExpense(expense)
    setExpenseData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date),
      dress: expense.dress?._id || '',
      receiptUrl: expense.receiptUrl || '',
      notes: expense.notes || '',
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || '',
      tags: expense.tags || [],
    })
    setOpenEditDialog(true)
  }

  const handleView = (expense: any) => {
    setSelectedExpense(expense)
    setOpenViewDialog(true)
  }

  const handleDelete = (expense: any) => {
    setSelectedExpense(expense)
    setOpenDeleteDialog(true)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' } = {
      maintenance: 'warning',
      cleaning: 'info',
      storage: 'secondary',
      marketing: 'primary',
      utilities: 'error',
      rent: 'error',
      insurance: 'success',
      other: 'secondary',
    }
    return colors[category] || 'secondary'
  }

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Category', 'Description', 'Amount', 'Dress', 'Recurring'].join(','),
      ...expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        `"${expense.description}"`,
        expense.amount,
        expense.dress?.name || 'General',
        expense.isRecurring ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
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
                {strings.EXPENSE_MANAGEMENT || 'Expense Management'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchExpenses}
                  disabled={loading}
                >
                  {commonStrings.REFRESH}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={handleExport}
                  disabled={expenses.length === 0}
                >
                  {strings.EXPORT || 'Export'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  disabled={loading}
                >
                  {strings.ADD_EXPENSE || 'Add Expense'}
                </Button>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {/* Analytics Cards */}
            {analytics && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 3  }}>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="error" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.TOTAL_EXPENSES || 'Total Expenses'}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(analytics.summary?.totalExpenses || 0)}
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
                        <ReceiptIcon color="primary" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.EXPENSE_COUNT || 'Expense Count'}
                          </Typography>
                          <Typography variant="h5">
                            {analytics.summary?.expenseCount || 0}
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
                        <TrendingUpIcon color="success" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.AVERAGE_EXPENSE || 'Average Expense'}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(
                              analytics.summary?.expenseCount > 0 
                                ? (analytics.summary?.totalExpenses || 0) / analytics.summary.expenseCount 
                                : 0
                            )}
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
                        <CategoryIcon color="secondary" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.CATEGORIES || 'Categories'}
                          </Typography>
                          <Typography variant="h5">
                            {analytics.expensesByCategory?.length || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.FILTERS || 'Filters'}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.CATEGORY || 'Category'}</InputLabel>
                      <Select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        label={strings.CATEGORY || 'Category'}
                      >
                        <MenuItem value="">{strings.ALL_CATEGORIES || 'All Categories'}</MenuItem>
                        <MenuItem value="maintenance">{strings.MAINTENANCE || 'Maintenance'}</MenuItem>
                        <MenuItem value="cleaning">{strings.CLEANING || 'Cleaning'}</MenuItem>
                        <MenuItem value="storage">{strings.STORAGE || 'Storage'}</MenuItem>
                        <MenuItem value="marketing">{strings.MARKETING || 'Marketing'}</MenuItem>
                        <MenuItem value="utilities">{strings.UTILITIES || 'Utilities'}</MenuItem>
                        <MenuItem value="rent">{strings.RENT || 'Rent'}</MenuItem>
                        <MenuItem value="insurance">{strings.INSURANCE || 'Insurance'}</MenuItem>
                        <MenuItem value="other">{strings.OTHER || 'Other'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.DRESS || 'Dress'}</InputLabel>
                      <Select
                        value={filters.dress}
                        onChange={(e) => setFilters(prev => ({ ...prev, dress: e.target.value }))}
                        label={strings.DRESS || 'Dress'}
                      >
                        <MenuItem value="">{strings.ALL_DRESSES || 'All Dresses'}</MenuItem>
                        {dresses.map((dress) => (
                          <MenuItem key={dress._id} value={dress._id}>
                            {dress.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.START_DATE || 'Start Date'}
                      value={filters.startDate}
                      onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.END_DATE || 'End Date'}
                      value={filters.endDate}
                      onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({ category: '', startDate: null, endDate: null, dress: '' })}
                  >
                    {strings.CLEAR_FILTERS || 'Clear Filters'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Expenses Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.EXPENSE_RECORDS || 'Expense Records'}
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{strings.DATE || 'Date'}</TableCell>
                            <TableCell>{strings.CATEGORY || 'Category'}</TableCell>
                            <TableCell>{strings.DESCRIPTION || 'Description'}</TableCell>
                            <TableCell>{strings.AMOUNT || 'Amount'}</TableCell>
                            <TableCell>{strings.DRESS || 'Dress'}</TableCell>
                            <TableCell>{strings.RECURRING || 'Recurring'}</TableCell>
                            <TableCell>{strings.ACTIONS || 'Actions'}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {expenses.map((expense) => (
                            <TableRow key={expense._id}>
                              <TableCell>
                                {new Date(expense.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={expense.category}
                                  color={getCategoryColor(expense.category)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {expense.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(expense.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {expense.dress?.name || (
                                  <Typography variant="body2" color="textSecondary" fontStyle="italic">
                                    General
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {expense.isRecurring ? (
                                  <Chip label={expense.recurringFrequency || 'Yes'} color="info" size="small" />
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    No
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title={strings.VIEW || 'View'}>
                                    <IconButton size="small" onClick={() => handleView(expense)}>
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={strings.EDIT || 'Edit'}>
                                    <IconButton size="small" onClick={() => handleEdit(expense)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={strings.DELETE || 'Delete'}>
                                    <IconButton size="small" onClick={() => handleDelete(expense)}>
                                      <DeleteIcon fontSize="small" />
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
                      count={totalExpenses}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Add Expense Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
              <DialogTitle>{strings.ADD_EXPENSE || 'Add Expense'}</DialogTitle>
              <DialogContent>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.CATEGORY || 'Category'}</InputLabel>
                      <Select
                        value={expenseData.category}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, category: e.target.value }))}
                        label={strings.CATEGORY || 'Category'}
                      >
                        <MenuItem value="maintenance">{strings.MAINTENANCE || 'Maintenance'}</MenuItem>
                        <MenuItem value="cleaning">{strings.CLEANING || 'Cleaning'}</MenuItem>
                        <MenuItem value="storage">{strings.STORAGE || 'Storage'}</MenuItem>
                        <MenuItem value="marketing">{strings.MARKETING || 'Marketing'}</MenuItem>
                        <MenuItem value="utilities">{strings.UTILITIES || 'Utilities'}</MenuItem>
                        <MenuItem value="rent">{strings.RENT || 'Rent'}</MenuItem>
                        <MenuItem value="insurance">{strings.INSURANCE || 'Insurance'}</MenuItem>
                        <MenuItem value="other">{strings.OTHER || 'Other'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.AMOUNT || 'Amount (₪)'}
                      type="number"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.DESCRIPTION || 'Description'}
                      value={expenseData.description}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                      multiline
                      rows={3}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.DATE || 'Date'}
                      value={expenseData.date}
                      onChange={(date) => setExpenseData(prev => ({ ...prev, date: date || new Date() }))}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.DRESS || 'Dress (Optional)'}</InputLabel>
                      <Select
                        value={expenseData.dress}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, dress: e.target.value }))}
                        label={strings.DRESS || 'Dress (Optional)'}
                      >
                        <MenuItem value="">{strings.GENERAL || 'General'}</MenuItem>
                        {dresses.map((dress) => (
                          <MenuItem key={dress._id} value={dress._id}>
                            {dress.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.RECEIPT_URL || 'Receipt URL (Optional)'}
                      value={expenseData.receiptUrl}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.NOTES || 'Notes (Optional)'}
                      value={expenseData.notes}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, notes: e.target.value }))}
                      multiline
                      rows={2}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={expenseData.isRecurring}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        />
                      }
                      label={strings.IS_RECURRING || 'Is Recurring'}
                    />
                  </Box>
                  {expenseData.isRecurring && (
                    <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                      <FormControl fullWidth>
                        <InputLabel>{strings.FREQUENCY || 'Frequency'}</InputLabel>
                        <Select
                          value={expenseData.recurringFrequency}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                          label={strings.FREQUENCY || 'Frequency'}
                        >
                          <MenuItem value="monthly">{strings.MONTHLY || 'Monthly'}</MenuItem>
                          <MenuItem value="quarterly">{strings.QUARTERLY || 'Quarterly'}</MenuItem>
                          <MenuItem value="yearly">{strings.YEARLY || 'Yearly'}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenAddDialog(false)}>
                  {commonStrings.CANCEL}
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  variant="contained"
                  disabled={loading || !expenseData.category || !expenseData.description || !expenseData.amount}
                >
                  {strings.CREATE_EXPENSE || 'Create Expense'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Edit Expense Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
              <DialogTitle>{strings.EDIT_EXPENSE || 'Edit Expense'}</DialogTitle>
              <DialogContent>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.CATEGORY || 'Category'}</InputLabel>
                      <Select
                        value={expenseData.category}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, category: e.target.value }))}
                        label={strings.CATEGORY || 'Category'}
                      >
                        <MenuItem value="maintenance">{strings.MAINTENANCE || 'Maintenance'}</MenuItem>
                        <MenuItem value="cleaning">{strings.CLEANING || 'Cleaning'}</MenuItem>
                        <MenuItem value="storage">{strings.STORAGE || 'Storage'}</MenuItem>
                        <MenuItem value="marketing">{strings.MARKETING || 'Marketing'}</MenuItem>
                        <MenuItem value="utilities">{strings.UTILITIES || 'Utilities'}</MenuItem>
                        <MenuItem value="rent">{strings.RENT || 'Rent'}</MenuItem>
                        <MenuItem value="insurance">{strings.INSURANCE || 'Insurance'}</MenuItem>
                        <MenuItem value="other">{strings.OTHER || 'Other'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.AMOUNT || 'Amount (₪)'}
                      type="number"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.DESCRIPTION || 'Description'}
                      value={expenseData.description}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                      multiline
                      rows={3}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <DatePicker
                      label={strings.DATE || 'Date'}
                      value={expenseData.date}
                      onChange={(date) => setExpenseData(prev => ({ ...prev, date: date || new Date() }))}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.DRESS || 'Dress (Optional)'}</InputLabel>
                      <Select
                        value={expenseData.dress}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, dress: e.target.value }))}
                        label={strings.DRESS || 'Dress (Optional)'}
                      >
                        <MenuItem value="">{strings.GENERAL || 'General'}</MenuItem>
                        {dresses.map((dress) => (
                          <MenuItem key={dress._id} value={dress._id}>
                            {dress.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.RECEIPT_URL || 'Receipt URL (Optional)'}
                      value={expenseData.receiptUrl}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <TextField
                      fullWidth
                      label={strings.NOTES || 'Notes (Optional)'}
                      value={expenseData.notes}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, notes: e.target.value }))}
                      multiline
                      rows={2}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={expenseData.isRecurring}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        />
                      }
                      label={strings.IS_RECURRING || 'Is Recurring'}
                    />
                  </Box>
                  {expenseData.isRecurring && (
                    <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                      <FormControl fullWidth>
                        <InputLabel>{strings.FREQUENCY || 'Frequency'}</InputLabel>
                        <Select
                          value={expenseData.recurringFrequency}
                          onChange={(e) => setExpenseData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                          label={strings.FREQUENCY || 'Frequency'}
                        >
                          <MenuItem value="monthly">{strings.MONTHLY || 'Monthly'}</MenuItem>
                          <MenuItem value="quarterly">{strings.QUARTERLY || 'Quarterly'}</MenuItem>
                          <MenuItem value="yearly">{strings.YEARLY || 'Yearly'}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenEditDialog(false)}>
                  {commonStrings.CANCEL}
                </Button>
                <Button
                  onClick={handleUpdateExpense}
                  variant="contained"
                  disabled={loading || !expenseData.category || !expenseData.description || !expenseData.amount}
                >
                  {strings.UPDATE_EXPENSE || 'Update Expense'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* View Expense Dialog */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>{strings.VIEW_EXPENSE || 'View Expense'}</DialogTitle>
              <DialogContent>
                {selectedExpense && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.CATEGORY || 'Category'}
                        </Typography>
                        <Chip
                          label={selectedExpense.category}
                          color={getCategoryColor(selectedExpense.category)}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.AMOUNT || 'Amount'}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                          {formatCurrency(selectedExpense.amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.DESCRIPTION || 'Description'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {selectedExpense.description}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.DATE || 'Date'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {new Date(selectedExpense.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.DRESS || 'Dress'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {selectedExpense.dress?.name || 'General'}
                        </Typography>
                      </Box>
                      {selectedExpense.receiptUrl && (
                        <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {strings.RECEIPT || 'Receipt'}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            href={selectedExpense.receiptUrl}
                            target="_blank"
                            sx={{ mt: 0.5 }}
                            startIcon={<ReceiptIcon />}
                          >
                            {strings.VIEW_RECEIPT || 'View Receipt'}
                          </Button>
                        </Box>
                      )}
                      {selectedExpense.notes && (
                        <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {strings.NOTES || 'Notes'}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {selectedExpense.notes}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.RECURRING || 'Recurring'}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {selectedExpense.isRecurring
                            ? `Yes (${selectedExpense.recurringFrequency || 'Unknown frequency'})`
                            : 'No'
                          }
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {strings.CREATED || 'Created'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {new Date(selectedExpense.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenViewDialog(false)}>
                  {commonStrings.CLOSE}
                </Button>
                <Button
                  onClick={() => {
                    setOpenViewDialog(false)
                    handleEdit(selectedExpense)
                  }}
                  variant="contained"
                  startIcon={<EditIcon />}
                >
                  {strings.EDIT || 'Edit'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Delete Expense Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
              <DialogTitle>{strings.CONFIRM_DELETE || 'Confirm Delete'}</DialogTitle>
              <DialogContent>
                <Typography>
                  {strings.DELETE_EXPENSE_CONFIRM || 'Are you sure you want to delete this expense?'}
                </Typography>
                {selectedExpense && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      <strong>{selectedExpense.description}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedExpense.category} • {formatCurrency(selectedExpense.amount)} • {new Date(selectedExpense.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteDialog(false)}>
                  {commonStrings.CANCEL}
                </Button>
                <Button
                  onClick={handleDeleteExpense}
                  color="error"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
                >
                  {loading ? strings.DELETING || 'Deleting...' : strings.DELETE || 'Delete'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Container>
      </LocalizationProvider>
    </Layout>
  )
}

export default ExpenseManagement
