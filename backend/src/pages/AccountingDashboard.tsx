import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as AnalyticsService from '@/services/AnalyticsService'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import * as bookcarsTypes from ':bookcars-types'

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
      id={`accounting-tabpanel-${index}`}
      aria-labelledby={`accounting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const AccountingDashboard: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  
  // Data states
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const [monthlyReport, setMonthlyReport] = useState<any>(null)
  const [profitLossStatement, setProfitLossStatement] = useState<any>(null)
  const [inventoryAnalytics, setInventoryAnalytics] = useState<any>(null)
  
  // Date filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date(), // Today
  })
  
  // Report period
  const [reportPeriod, setReportPeriod] = useState('current-year')

  // Check if user is admin or supplier
  const isAdmin = user && helper.admin(user)
  const isSupplier = user && helper.supplier(user)
  const dashboardTitle = isAdmin ? 'Admin Accounting Dashboard' : isSupplier ? 'Supplier Accounting Dashboard' : 'Accounting Dashboard'

  useEffect(() => {
    if (user && (isAdmin || isSupplier)) {
      fetchAllData()
    }
  }, [user, dateRange, isAdmin, isSupplier])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)

      // Verify user has proper access
      if (!helper.admin(_user) && !helper.supplier(_user)) {
        setError('Access denied: Accounting dashboard requires admin or supplier privileges')
      }
    }
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [summary, monthly, profitLoss, inventory] = await Promise.all([
        AnalyticsService.getFinancialSummary(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString()
        ),
        AnalyticsService.getMonthlyReport(dateRange.startDate.getFullYear()),
        AnalyticsService.getProfitLossStatement(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString()
        ),
        AnalyticsService.getInventoryAnalytics(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString()
        ),
      ])
      
      setFinancialSummary(summary)
      setMonthlyReport(monthly)
      setProfitLossStatement(profitLoss)
      setInventoryAnalytics(inventory)
    } catch (err: any) {
      console.error('Error fetching accounting data:', err)
      setError('Failed to fetch accounting data')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period)
    const now = new Date()
    
    switch (period) {
      case 'current-month':
        setDateRange({
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: now,
        })
        break
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        setDateRange({
          startDate: lastMonth,
          endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        })
        break
      case 'current-quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        setDateRange({
          startDate: quarterStart,
          endDate: now,
        })
        break
      case 'current-year':
        setDateRange({
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: now,
        })
        break
      case 'last-year':
        setDateRange({
          startDate: new Date(now.getFullYear() - 1, 0, 1),
          endDate: new Date(now.getFullYear() - 1, 11, 31),
        })
        break
      default:
        break
    }
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'success.main'
    if (value < 0) return 'error.main'
    return 'text.secondary'
  }

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon color="success" />
    if (value < 0) return <TrendingDownIcon color="error" />
    return null
  }

  const calculateProfitMargin = () => {
    if (!financialSummary?.summary) return 0
    const { totalRevenue, totalExpenses } = financialSummary.summary
    if (totalRevenue === 0) return 0
    return ((totalRevenue - totalExpenses) / totalRevenue) * 100
  }

  const calculateROI = () => {
    if (!inventoryAnalytics?.summary) return 0
    return inventoryAnalytics.summary.averageROI || 0
  }

  const prepareMonthlyChartData = () => {
    if (!monthlyReport) return []
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    const data = months.map((month, index) => {
      const revenue = monthlyReport.monthlyRevenue?.find((r: any) => r._id === index + 1)
      const expense = monthlyReport.monthlyExpenses?.find((e: any) => e._id === index + 1)
      
      const revenueAmount = revenue?.total || 0
      const expenseAmount = expense?.total || 0
      
      return {
        month,
        revenue: revenueAmount,
        expenses: expenseAmount,
        profit: revenueAmount - expenseAmount,
      }
    })
    
    return data
  }

  const prepareCategoryExpenseData = () => {
    if (!financialSummary?.expensesByCategory) return []
    
    return financialSummary.expensesByCategory.map((category: any) => ({
      name: category._id,
      value: category.total,
      count: category.count,
    }))
  }

  const prepareRevenueTypeData = () => {
    if (!financialSummary?.revenueByType) return []
    
    return financialSummary.revenueByType.map((type: any) => ({
      name: type._id,
      value: type.total,
      count: type.count,
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csvContent = [headers, ...rows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
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
                {dashboardTitle}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAllData}
                  disabled={loading}
                >
                  {commonStrings.REFRESH}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportToCSV(prepareMonthlyChartData(), 'financial-report')}
                >
                  {strings.EXPORT || 'Export'}
                </Button>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Period Selection */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems:"center" }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.REPORT_PERIOD || 'Report Period'}</InputLabel>
                      <Select
                        value={reportPeriod}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        label={strings.REPORT_PERIOD || 'Report Period'}
                      >
                        <MenuItem value="current-month">{strings.CURRENT_MONTH || 'Current Month'}</MenuItem>
                        <MenuItem value="last-month">{strings.LAST_MONTH || 'Last Month'}</MenuItem>
                        <MenuItem value="current-quarter">{strings.CURRENT_QUARTER || 'Current Quarter'}</MenuItem>
                        <MenuItem value="current-year">{strings.CURRENT_YEAR || 'Current Year'}</MenuItem>
                        <MenuItem value="last-year">{strings.LAST_YEAR || 'Last Year'}</MenuItem>
                        <MenuItem value="custom">{strings.CUSTOM_RANGE || 'Custom Range'}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {reportPeriod === 'custom' && (
                    <>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <DatePicker
                          label={strings.START_DATE || 'Start Date'}
                          value={dateRange.startDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date || new Date() }))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Box>
                      <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                        <DatePicker
                          label={strings.END_DATE || 'End Date'}
                          value={dateRange.endDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date || new Date() }))}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Key Performance Indicators */}
            {financialSummary && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="success" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.TOTAL_REVENUE || 'Total Revenue'}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(financialSummary.summary?.totalRevenue || 0)}
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
                        <ReceiptIcon color="error" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.TOTAL_EXPENSES || 'Total Expenses'}
                          </Typography>
                          <Typography variant="h5">
                            {formatCurrency(financialSummary.summary?.totalExpenses || 0)}
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
                        <AccountBalanceIcon color={financialSummary.summary?.netProfit >= 0 ? 'success' : 'error'} />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.NET_PROFIT || 'Net Profit'}
                          </Typography>
                          <Typography variant="h5" sx={{ color: getGrowthColor(financialSummary.summary?.netProfit || 0) }}>
                            {formatCurrency(financialSummary.summary?.netProfit || 0)}
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
                        <AssessmentIcon color="primary" />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {strings.PROFIT_MARGIN || 'Profit Margin'}
                          </Typography>
                          <Typography variant="h5" sx={{ color: getGrowthColor(calculateProfitMargin()) }}>
                            {formatPercentage(calculateProfitMargin())}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {/* Tabs for Different Views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab
                  label={strings.FINANCIAL_OVERVIEW || 'Financial Overview'}
                  icon={<AssessmentIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={strings.PROFIT_LOSS || 'Profit & Loss'}
                  icon={<BarChartIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={strings.CASH_FLOW || 'Cash Flow'}
                  icon={<TimelineIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={strings.EXPENSE_ANALYSIS || 'Expense Analysis'}
                  icon={<PieChartIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Tab Panel 0: Financial Overview */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {/* Monthly Trends Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.MONTHLY_TRENDS || 'Monthly Financial Trends'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={prepareMonthlyChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
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
                            name="Net Profit"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Revenue vs Expenses Comparison */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.REVENUE_VS_EXPENSES || 'Revenue vs Expenses'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareMonthlyChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
                          <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Financial Ratios */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.FINANCIAL_RATIOS || 'Financial Ratios'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.PROFIT_MARGIN || 'Profit Margin'}</Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: getGrowthColor(calculateProfitMargin()) }}>
                            {formatPercentage(calculateProfitMargin())}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.abs(calculateProfitMargin()), 100)}
                          sx={{ mb: 2, height: 8, borderRadius: 4 }}
                          color={calculateProfitMargin() >= 0 ? 'success' : 'error'}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.ROI || 'Return on Investment'}</Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: getGrowthColor(calculateROI()) }}>
                            {formatPercentage(calculateROI())}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.abs(calculateROI()), 100)}
                          sx={{ mb: 2, height: 8, borderRadius: 4 }}
                          color={calculateROI() >= 0 ? 'success' : 'error'}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.EXPENSE_RATIO || 'Expense Ratio'}</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {financialSummary?.summary?.totalRevenue > 0
                              ? formatPercentage((financialSummary.summary.totalExpenses / financialSummary.summary.totalRevenue) * 100)
                              : '0%'
                            }
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={financialSummary?.summary?.totalRevenue > 0
                            ? Math.min((financialSummary.summary.totalExpenses / financialSummary.summary.totalRevenue) * 100, 100)
                            : 0
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                          color="warning"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </TabPanel>

            {/* Tab Panel 1: Profit & Loss Statement */}
            <TabPanel value={tabValue} index={1}>
              {profitLossStatement && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {strings.PROFIT_LOSS_STATEMENT || 'Profit & Loss Statement'}
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          {`${new Date(profitLossStatement.period?.start).toLocaleDateString()} - ${new Date(profitLossStatement.period?.end).toLocaleDateString()}`}
                        </Typography>

                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>{strings.ITEM || 'Item'}</strong></TableCell>
                                <TableCell align="right"><strong>{strings.AMOUNT || 'Amount'}</strong></TableCell>
                                <TableCell align="right"><strong>{strings.PERCENTAGE || 'Percentage'}</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {/* Revenue Section */}
                              <TableRow>
                                <TableCell colSpan={3}>
                                  <Typography variant="h6" color="success.main">
                                    {strings.REVENUE || 'REVENUE'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.RENTAL_REVENUE || 'Rental Revenue'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.revenue?.rentalRevenue || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.revenue.rentalRevenue / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.SERVICE_REVENUE || 'Service Revenue'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.revenue?.serviceRevenue || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.revenue.serviceRevenue / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.PACKAGE_REVENUE || 'Package Revenue'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.revenue?.packageRevenue || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.revenue.packageRevenue / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>{strings.TOTAL_REVENUE || 'Total Revenue'}</strong></TableCell>
                                <TableCell align="right">
                                  <strong>{formatCurrency(profitLossStatement.revenue?.totalRevenue || 0)}</strong>
                                </TableCell>
                                <TableCell align="right"><strong>100%</strong></TableCell>
                              </TableRow>

                              {/* Expenses Section */}
                              <TableRow>
                                <TableCell colSpan={3} sx={{ pt: 3 }}>
                                  <Typography variant="h6" color="error.main">
                                    {strings.EXPENSES || 'EXPENSES'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.OPERATING_EXPENSES || 'Operating Expenses'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.expenses?.operatingExpenses || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.expenses.operatingExpenses / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.MAINTENANCE_EXPENSES || 'Maintenance Expenses'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.expenses?.maintenanceExpenses || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.expenses.maintenanceExpenses / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.MARKETING_EXPENSES || 'Marketing Expenses'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.expenses?.marketingExpenses || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.expenses.marketingExpenses / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ pl: 4 }}>{strings.ADMIN_EXPENSES || 'Administrative Expenses'}</TableCell>
                                <TableCell align="right">{formatCurrency(profitLossStatement.expenses?.adminExpenses || 0)}</TableCell>
                                <TableCell align="right">
                                  {profitLossStatement.revenue?.totalRevenue > 0
                                    ? formatPercentage((profitLossStatement.expenses.adminExpenses / profitLossStatement.revenue.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>{strings.TOTAL_EXPENSES || 'Total Expenses'}</strong></TableCell>
                                <TableCell align="right">
                                  <strong>{formatCurrency(profitLossStatement.expenses?.totalExpenses || 0)}</strong>
                                </TableCell>
                                <TableCell align="right">
                                  <strong>
                                    {profitLossStatement.revenue?.totalRevenue > 0
                                      ? formatPercentage((profitLossStatement.expenses.totalExpenses / profitLossStatement.revenue.totalRevenue) * 100)
                                      : '0%'
                                    }
                                  </strong>
                                </TableCell>
                              </TableRow>

                              {/* Net Profit */}
                              <TableRow>
                                <TableCell colSpan={3}><Divider sx={{ my: 1 }} /></TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>
                                  <Typography variant="h6" sx={{ color: getGrowthColor(profitLossStatement.grossProfit || 0) }}>
                                    <strong>{strings.NET_PROFIT || 'Net Profit'}</strong>
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="h6" sx={{ color: getGrowthColor(profitLossStatement.grossProfit || 0) }}>
                                    <strong>{formatCurrency(profitLossStatement.grossProfit || 0)}</strong>
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="h6" sx={{ color: getGrowthColor(profitLossStatement.profitMargin || 0) }}>
                                    <strong>{formatPercentage(profitLossStatement.profitMargin || 0)}</strong>
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}
            </TabPanel>

            {/* Tab Panel 2: Cash Flow Analysis */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.CASH_FLOW_ANALYSIS || 'Cash Flow Analysis'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={prepareMonthlyChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4caf50"
                            strokeWidth={3}
                            name="Cash Inflow (Revenue)"
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#f44336"
                            strokeWidth={3}
                            name="Cash Outflow (Expenses)"
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#2196f3"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            name="Net Cash Flow"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Cash Flow Summary */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.CASH_FLOW_SUMMARY || 'Cash Flow Summary'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.TOTAL_INFLOW || 'Total Cash Inflow'}</Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {formatCurrency(financialSummary?.summary?.totalRevenue || 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.TOTAL_OUTFLOW || 'Total Cash Outflow'}</Typography>
                          <Typography variant="body1" fontWeight="bold" color="error.main">
                            {formatCurrency(financialSummary?.summary?.totalExpenses || 0)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">{strings.NET_CASH_FLOW || 'Net Cash Flow'}</Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: getGrowthColor(financialSummary?.summary?.netProfit || 0) }}>
                            {formatCurrency(financialSummary?.summary?.netProfit || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* Cash Flow Ratios */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.CASH_FLOW_RATIOS || 'Cash Flow Ratios'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.OPERATING_CASH_RATIO || 'Operating Cash Ratio'}</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {financialSummary?.summary?.totalExpenses > 0
                              ? formatPercentage((financialSummary.summary.totalRevenue / financialSummary.summary.totalExpenses) * 100)
                              : '∞'
                            }
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.CASH_CONVERSION_CYCLE || 'Cash Conversion Efficiency'}</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatPercentage(calculateProfitMargin())}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1">{strings.LIQUIDITY_RATIO || 'Liquidity Ratio'}</Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: getGrowthColor(financialSummary?.summary?.netProfit || 0) }}>
                            {financialSummary?.summary?.netProfit >= 0 ? 'Positive' : 'Negative'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </TabPanel>

            {/* Tab Panel 3: Expense Analysis */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {/* Expense Distribution Pie Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.EXPENSE_DISTRIBUTION || 'Expense Distribution by Category'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={prepareCategoryExpenseData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareCategoryExpenseData().map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Revenue Distribution Pie Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.REVENUE_DISTRIBUTION || 'Revenue Distribution by Type'}
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
                            fill="#82ca9d"
                            dataKey="value"
                          >
                            {prepareRevenueTypeData().map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Expense Category Breakdown */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.EXPENSE_BREAKDOWN || 'Expense Category Breakdown'}
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{strings.CATEGORY || 'Category'}</TableCell>
                              <TableCell align="right">{strings.AMOUNT || 'Amount'}</TableCell>
                              <TableCell align="right">{strings.COUNT || 'Count'}</TableCell>
                              <TableCell align="right">{strings.PERCENTAGE || '%'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {financialSummary?.expensesByCategory?.map((category: any) => (
                              <TableRow key={category._id}>
                                <TableCell>
                                  <Chip
                                    label={category._id}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(category.total)}
                                </TableCell>
                                <TableCell align="right">
                                  {category.count}
                                </TableCell>
                                <TableCell align="right">
                                  {financialSummary.summary?.totalExpenses > 0
                                    ? formatPercentage((category.total / financialSummary.summary.totalExpenses) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Revenue Type Breakdown */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.REVENUE_BREAKDOWN || 'Revenue Type Breakdown'}
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{strings.TYPE || 'Type'}</TableCell>
                              <TableCell align="right">{strings.AMOUNT || 'Amount'}</TableCell>
                              <TableCell align="right">{strings.COUNT || 'Count'}</TableCell>
                              <TableCell align="right">{strings.PERCENTAGE || '%'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {financialSummary?.revenueByType?.map((type: any) => (
                              <TableRow key={type._id}>
                                <TableCell>
                                  <Chip
                                    label={type._id}
                                    size="small"
                                    color="primary"
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(type.total)}
                                </TableCell>
                                <TableCell align="right">
                                  {type.count}
                                </TableCell>
                                <TableCell align="right">
                                  {financialSummary.summary?.totalRevenue > 0
                                    ? formatPercentage((type.total / financialSummary.summary.totalRevenue) * 100)
                                    : '0%'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Top Performing Dresses */}
                {inventoryAnalytics?.dressPerformance && (
                  <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {strings.TOP_PERFORMING_DRESSES || 'Top Performing Dresses'}
                        </Typography>
                        <TableContainer component={Paper}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>{strings.DRESS_NAME || 'Dress Name'}</TableCell>
                                <TableCell>{strings.TYPE || 'Type'}</TableCell>
                                <TableCell align="right">{strings.TOTAL_REVENUE || 'Total Revenue'}</TableCell>
                                <TableCell align="right">{strings.BOOKINGS || 'Bookings'}</TableCell>
                                <TableCell align="right">{strings.MAINTENANCE_COST || 'Maintenance Cost'}</TableCell>
                                <TableCell align="right">{strings.ROI || 'ROI'}</TableCell>
                                <TableCell align="right">{strings.RATING || 'Rating'}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {inventoryAnalytics.dressPerformance.slice(0, 10).map((dress: any) => (
                                <TableRow key={dress._id}>
                                  <TableCell>{dress.name}</TableCell>
                                  <TableCell>
                                    <Chip label={dress.type} size="small" />
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(dress.totalRevenue || 0)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {dress.bookingCount || 0}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(dress.maintenanceCost || 0)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: getGrowthColor(dress.roi || 0) }}>
                                    {formatPercentage(dress.roi || 0)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {dress.rating ? `${dress.rating.toFixed(1)}/5` : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Container>
      </LocalizationProvider>
    </Layout>
  )
}

export default AccountingDashboard
