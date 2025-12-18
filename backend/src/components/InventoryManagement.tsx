import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Receipt,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Warning,
  CheckCircle,
  Refresh,
  Download,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import { strings as headerStrings } from '@/lang/header'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import * as AnalyticsService from '@/services/AnalyticsService'
import * as DressService from '@/services/DressService'

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const InventoryManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const [monthlyReport, setMonthlyReport] = useState<any>(null)
  const [expenses, setExpenses] = useState<any>(null)
  const [revenues, setRevenues] = useState<any>(null)
  const [dresses, setDresses] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: 'maintenance',
    description: '',
    amount: '',
    date: new Date(),
    dress: '',
    receiptUrl: '',
    notes: '',
    isRecurring: false,
    recurringFrequency: '',
    tags: []
  })

  const fetchData = async () => {
    try {
      setLoading(true)

      // Check if user is authenticated first
      const user = JSON.parse(localStorage.getItem('bc-user') || '{}')
      if (!user || !user.accessToken) {
        setError('Please sign in to access inventory management data')
        setLoading(false)
        return
      }

      const [summary, monthly, expenseData, revenueData, dressData] = await Promise.all([
        AnalyticsService.getFinancialSummary(),
        AnalyticsService.getMonthlyReport(),
        AnalyticsService.getExpenses(),
        AnalyticsService.getRevenues(),
        DressService.getDresses('', { size: ['100'] }, 1, 100)
      ])
      setFinancialSummary(summary)
      setMonthlyReport(monthly)
      setExpenses(expenseData)
      setRevenues(revenueData)
      setDresses(dressData)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching inventory data:', err)
      if (err.response?.status === 401) {
        setError('Authentication required. Please sign in to access this data.')
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view inventory data.')
      } else {
        setError('Failed to load inventory data. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCreateExpense = async () => {
    try {
      await AnalyticsService.createExpense({
        ...newExpense,
        amount: Number(newExpense.amount),
        date: newExpense.date.toISOString()
      })
      setOpenExpenseDialog(false)
      setNewExpense({
        category: 'maintenance',
        description: '',
        amount: '',
        date: new Date(),
        dress: '',
        receiptUrl: '',
        notes: '',
        isRecurring: false,
        recurringFrequency: '',
        tags: []
      })
      fetchData()
    } catch (err) {
      console.error('Error creating expense:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const calculateProfitMargin = () => {
    if (!financialSummary?.summary) return 0
    const { totalRevenue, totalExpenses } = financialSummary.summary
    if (totalRevenue === 0) return 0
    return ((totalRevenue - totalExpenses) / totalRevenue) * 100
  }

  const calculateExpenseRatio = () => {
    if (!financialSummary?.summary) return 0
    const { totalRevenue, totalExpenses } = financialSummary.summary
    if (totalRevenue === 0) return 0
    return (totalExpenses / totalRevenue) * 100
  }

  const calculateROI = () => {
    if (!financialSummary?.summary) return 0
    const { totalRevenue, totalExpenses } = financialSummary.summary
    if (totalExpenses === 0) return 0
    return ((totalRevenue - totalExpenses) / totalExpenses) * 100
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />
  }

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main'
  }

  // Prepare chart data
  const monthlyChartData = monthlyReport?.monthlyRevenue?.map((revenue: any) => {
    const expense = monthlyReport.monthlyExpenses.find((e: any) => e._id.month === revenue._id.month)

    return {
      month: `Month ${revenue._id.month}`,
      revenue: revenue.total || 0,
      expenses: expense?.total || 0,
      profit: (revenue.total || 0) - (expense?.total || 0)
    }
  }) || []

  const prepareRevenueTypeData = () => {
    if (!financialSummary?.revenueByType) return []

    return financialSummary.revenueByType.map((type: any) => ({
      name: type._id,
      value: type.total,
      count: type.count,
    }))
  }

  const prepareExpenseCategoryData = () => {
    if (!financialSummary?.expensesByCategory) return []

    return financialSummary.expensesByCategory.map((category: any) => ({
      name: category._id,
      value: category.total,
      count: category.count,
    }))
  }

  const prepareProfitTrendData = () => {
    return monthlyChartData.map((data: any) => ({
      month: data.month,
      profit: data.profit,
      profitMargin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Inventory & Accounting Management
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Inventory & Accounting Management
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const onLoad = () => {}

  return (
    <Layout onLoad={onLoad} strict>
      <Box sx={{ p: 3 }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Inventory & Accounting Management
          </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Financial Overview" />
          <Tab label="Revenue Tracking" />
          <Tab label="Expense Management" />
          <Tab label="Inventory Status" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Financial Overview */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(financialSummary?.summary?.totalRevenue || 0)}
                    </Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Expenses
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(financialSummary?.summary?.totalExpenses || 0)}
                    </Typography>
                  </Box>
                  <Receipt color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Net Profit
                    </Typography>
                    <Typography variant="h4" sx={{ color: getGrowthColor(financialSummary?.summary?.netProfit || 0) }}>
                      {formatCurrency(financialSummary?.summary?.netProfit || 0)}
                    </Typography>
                  </Box>
                  {getGrowthIcon(financialSummary?.summary?.netProfit || 0)}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" sx={{ color: getGrowthColor(calculateProfitMargin()) }}>
                      {formatPercentage(calculateProfitMargin())}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ROI: {formatPercentage(calculateROI())}
                    </Typography>
                  </Box>
                  {getGrowthIcon(calculateProfitMargin())}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Charts Section */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 3  }}>
          {/* Monthly Trends Chart */}
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Financial Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#4caf50"
                      fill="#4caf50"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="2"
                      stroke="#f44336"
                      fill="#f44336"
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#2196f3"
                      strokeWidth={3}
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Revenue Distribution Pie Chart */}
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Type
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={prepareRevenueTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareRevenueTypeData().map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Expense Distribution Pie Chart */}
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expenses by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareExpenseCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareExpenseCategoryData().map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Profit Margin Trend */}
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profit Margin Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareProfitTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        name === 'profit' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                        name === 'profit' ? 'Profit' : 'Profit Margin'
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="profitMargin"
                      stroke="#ff7300"
                      strokeWidth={3}
                      name="Profit Margin %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Enhanced Financial Analysis */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Type
                </Typography>
                {financialSummary?.revenueByType?.map((item: any) => (
                  <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{item._id}</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(item.total)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {financialSummary.summary?.totalRevenue > 0
                          ? formatPercentage((item.total / financialSummary.summary.totalRevenue) * 100)
                          : '0%'
                        }
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expenses by Category
                </Typography>
                {financialSummary?.expensesByCategory?.map((item: any) => (
                  <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{item._id}</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(item.total)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {financialSummary.summary?.totalExpenses > 0
                          ? formatPercentage((item.total / financialSummary.summary.totalExpenses) * 100)
                          : '0%'
                        }
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Health
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Profit Margin</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: getGrowthColor(calculateProfitMargin()) }}>
                      {formatPercentage(calculateProfitMargin())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Expense Ratio</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatPercentage(calculateExpenseRatio())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Return on Investment</Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: getGrowthColor(calculateROI()) }}>
                      {formatPercentage(calculateROI())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Revenue Count</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {financialSummary?.summary?.revenueCount || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Expense Count</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {financialSummary?.summary?.expenseCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Revenue Tracking */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Revenue Records
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Dress</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenues?.revenues?.map((revenue: any) => (
                    <TableRow key={revenue._id}>
                      <TableCell>{new Date(revenue.date).toLocaleDateString()}</TableCell>
                      <TableCell>{revenue.customer?.fullName || 'N/A'}</TableCell>
                      <TableCell>{revenue.dress?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={revenue.type} size="small" />
                      </TableCell>
                      <TableCell>{formatCurrency(revenue.amount)}</TableCell>
                      <TableCell>{revenue.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Expense Management */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenExpenseDialog(true)}
          >
            Add Expense
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Expense Records
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Dress</TableCell>
                    <TableCell>Recurring</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses?.expenses?.map((expense: any) => (
                    <TableRow key={expense._id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={expense.category} size="small" />
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{expense.dress?.name || 'General'}</TableCell>
                      <TableCell>
                        {expense.isRecurring && (
                          <Chip label={expense.recurringFrequency} color="info" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Inventory Status */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {dresses?.dresses?.map((dress: any) => (
            <Box key={dress._id || dress.id} sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{dress.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {dress.type} - {dress.size}
                      </Typography>
                    </Box>
                    {dress.available ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </Box>
                  <Typography variant="body2">
                    Price: {formatCurrency(dress.price)}
                  </Typography>
                  <Typography variant="body2">
                    Rentals: {dress.rentals || 0}
                  </Typography>
                  <Typography variant="body2">
                    Status: {dress.available ? 'Available' : 'Unavailable'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Create Expense Dialog */}
      <Dialog open={openExpenseDialog} onClose={() => setOpenExpenseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mt: 1  }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                  <MenuItem value="storage">Storage</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="utilities">Utilities</MenuItem>
                  <MenuItem value="rent">Rent</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Amount (₪)"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <DatePicker
                label="Date"
                value={newExpense.date}
                onChange={(date) => setNewExpense({ ...newExpense, date: date || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Receipt URL"
                value={newExpense.receiptUrl}
                onChange={(e) => setNewExpense({ ...newExpense, receiptUrl: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Notes"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExpense} variant="contained">
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Layout>
  )
}

export default InventoryManagement
