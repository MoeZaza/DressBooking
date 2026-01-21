import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  TrendingUp,
  AttachMoney,
  EventAvailable,
  Inventory,
  People,
  Assessment,
  CalendarToday,
  Payment,
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
  AreaChart,
  Area,
} from 'recharts'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import { useLanguage } from '@/context/LanguageContext'
import AdminNotificationCenter from '@/components/AdminNotificationCenter'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import { errorRecoveryService, fallbackData } from '@/services/ErrorRecoveryService'

interface DashboardStats {
  totalDresses: number
  totalBookings: number
  totalRevenue: number
  activeAppointments: number
  pendingPayments: number
  topPerformingDresses: Array<{
    _id: string
    name: string
    bookingCount: number
    revenue: number
  }>
  recentBookings: Array<{
    _id: string
    customerName: string
    dressName: string
    from: Date
    to: Date
    status: string
    totalAmount: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    bookings: number
  }>
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()

  // Helper function for Arabic number formatting
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0'
    }
    if (language === 'ar') {
      return num.toLocaleString('ar-EG')
    }
    return num.toLocaleString()
  }

  // Helper function for currency formatting
  const formatCurrency = (amount: number) => {
    const formattedNumber = formatNumber(amount)
    const currency = commonStrings.CURRENCY || '₪'

    if (language === 'ar') {
      return `${formattedNumber} ${currency}`
    }
    return `${currency}${formattedNumber}`
  }
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  })
  const [error, setError] = useState('')
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Check if user is admin or supplier
  const isAdmin = user && helper.admin(user)
  const isSupplier = user && helper.supplier(user)
  const dashboardTitle = isAdmin ? (headerStrings.ADMIN_DASHBOARD || 'Admin Dashboard') :
                         isSupplier ? 'Supplier Dashboard' :
                         (headerStrings.DASHBOARD || 'Dashboard')

  useEffect(() => {
    // Clear any stale error state on mount
    const cachedError = localStorage.getItem('dashboard-error')
    if (cachedError) {
      console.log('Clearing stale dashboard error from localStorage')
      localStorage.removeItem('dashboard-error')
    }

    if (user && (isAdmin || isSupplier)) {
      fetchDashboardStats()
    }
  }, [user, dateRange, isAdmin, isSupplier])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      // Verify user has proper access
      if (!helper.admin(_user) && !helper.supplier(_user)) {
        setError('Access denied: Dashboard requires admin or supplier privileges')
      }
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Implement aggressive caching to improve performance
      const now = Date.now()
      const cacheTimeout = 2 * 60 * 1000 // 2 minutes cache for better performance

      if (stats && (now - lastFetch) < cacheTimeout) {
        console.log('Using cached dashboard data')
        return
      }

      // Check localStorage cache first
      const cachedData = localStorage.getItem('dashboard-cache')
      const cacheTimestamp = localStorage.getItem('dashboard-cache-timestamp')

      if (cachedData && cacheTimestamp) {
        const cacheAge = now - parseInt(cacheTimestamp)
        if (cacheAge < cacheTimeout) {
          console.log('Using localStorage cached dashboard data')
          try {
            setStats(JSON.parse(cachedData))
            setLastFetch(parseInt(cacheTimestamp))
            setError('') // Clear error when using valid cache
            setLoading(false)
            return
          } catch (parseErr) {
            console.error('Error parsing cached data:', parseErr)
            // Clear corrupt cache
            localStorage.removeItem('dashboard-cache')
            localStorage.removeItem('dashboard-cache-timestamp')
          }
        }
      }

        setLoading(true)
        setError('')

        // Prepare API headers with authentication
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }

        // Make all API calls in parallel for better performance
        const language = localStorage.getItem('language') || 'en'
        const [analyticsResponse, inventoryResponse, bookingsResponse] = await Promise.allSettled([
          fetch('/api/analytics/dashboard', { headers }),
          fetch('/api/inventory-stats', { headers }),
          fetch(`/api/bookings/1/10/${language}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              suppliers: isAdmin ? [] : [user?._id], // Empty array for admin means all suppliers
              statuses: ['pending', 'deposit', 'paid', 'reserved'],
              filter: {
                keyword: '',
              }
            }),
          })
        ])

      // Handle analytics data
      let analyticsData: any = {}
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.ok) {
        analyticsData = await analyticsResponse.value.json()
      } else {
        console.warn('Analytics data failed to load')
      }

      // Handle inventory data
      let inventoryData: any = {}
      if (inventoryResponse.status === 'fulfilled' && inventoryResponse.value.ok) {
        inventoryData = await inventoryResponse.value.json()
      } else {
        console.warn('Inventory data failed to load')
      }

      // Handle bookings data
      let bookingsData: any = { resultData: [] }
      if (bookingsResponse.status === 'fulfilled' && bookingsResponse.value.ok) {
        bookingsData = await bookingsResponse.value.json()
      } else {
        console.warn('Bookings data failed to load')
      }

      // Transform data to match dashboard interface
      const dashboardStats: DashboardStats = {
        totalDresses: analyticsData.overview?.totalDresses || inventoryData.totalDresses || 0,
        totalBookings: analyticsData.currentMonth?.bookings || 0,
        totalRevenue: analyticsData.currentMonth?.revenue || 0,
        activeAppointments: inventoryData.upcomingBookings?.length || 0,
        pendingPayments: bookingsData.resultData?.filter((booking: any) =>
          booking.paymentStatus === 'pending' || booking.paymentStatus === 'partially-paid'
        ).length || 0,
        topPerformingDresses: analyticsData.topDresses || inventoryData.topPerformers || [],
        recentBookings: analyticsData.recentBookings?.slice(0, 5).map((booking: any) => ({
          _id: booking._id,
          customerName: booking.customer?.fullName || 'Unknown Customer',
          dressName: booking.dress?.name || 'Unknown Dress',
          from: new Date(booking.from || booking.createdAt),
          to: new Date(booking.to || booking.createdAt),
          status: booking.status,
          totalAmount: booking.price || 0,
        })) || [],
        monthlyRevenue: [], // Will be populated from monthly analytics if needed
      }

      // Cache the data in localStorage for better performance
      const timestamp = Date.now()
      localStorage.setItem('dashboard-cache', JSON.stringify(dashboardStats))
      localStorage.setItem('dashboard-cache-timestamp', timestamp.toString())
      // Clear any stale error from localStorage
      localStorage.removeItem('dashboard-error')

      setStats(dashboardStats)
      setLastFetch(timestamp)
      setError('') // Clear error on successful load
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)

      // Try to use fallback data from localStorage
      const cachedData = localStorage.getItem('dashboard-cache')
      if (cachedData) {
        console.log('Using stale cached data as fallback')
        try {
          setStats(JSON.parse(cachedData))
          setError('') // Clear error when using cached data
        } catch (parseErr) {
          console.error('Error parsing cached data:', parseErr)
          // Clear corrupt cache and show error
          localStorage.removeItem('dashboard-cache')
          localStorage.removeItem('dashboard-cache-timestamp')
          setError('Failed to load dashboard data')
          setStats(fallbackData.emptyStats)
        }
      } else {
        setError('Failed to load dashboard data')
        setStats(fallbackData.emptyStats)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }



  // Chart data preparation
  const prepareMonthlyRevenueData = () => {
    if (!stats?.monthlyRevenue) return []

    return stats.monthlyRevenue.map((month) => ({
      month: month.month,
      revenue: month.revenue,
      bookings: month.bookings,
      avgBookingValue: month.bookings > 0 ? month.revenue / month.bookings : 0,
    }))
  }

  const prepareDressPerformanceData = () => {
    if (!stats?.topPerformingDresses) return []

    return stats.topPerformingDresses.slice(0, 8).map((dress) => ({
      name: dress.name.length > 15 ? dress.name.substring(0, 15) + '...' : dress.name,
      bookings: dress.bookingCount,
      revenue: dress.revenue,
    }))
  }

  const prepareBookingStatusData = () => {
    if (!stats?.recentBookings) return []

    const statusCounts = stats.recentBookings.reduce((acc: any, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count as number,
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  if (loading && !stats) {
    return (
      <Layout onLoad={onLoad} strict>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body1">
              Loading dashboard data and analytics...
            </Typography>
          </Box>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <AdminNotificationCenter user={user} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Date Range Selector */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) => date && setDateRange(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          <Button
            variant="outlined"
            onClick={fetchDashboardStats}
            className="refresh-button"
          >
            {strings.REFRESH || 'Refresh'}
          </Button>
        </Box>

        {stats && (
          <>
            {/* Key Metrics Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }} className="dashboard-widgets">
              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Card className="dashboard-widget stat-card">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory color="primary" />
                      <Box>
                        <Typography variant="h4">{formatNumber(stats.totalDresses)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strings.TOTAL_DRESSES || 'Total Dresses'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Card className="dashboard-widget stat-card">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventAvailable color="success" />
                      <Box>
                        <Typography variant="h4">{formatNumber(stats.totalBookings)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strings.TOTAL_BOOKINGS || 'Total Bookings'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                <Card className="dashboard-widget stat-card">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney color="warning" />
                      <Box>
                        <Typography variant="h4">{formatCurrency(stats.totalRevenue)}</Typography>
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
                      <CalendarToday color="info" />
                      <Box>
                        <Typography variant="h4">{formatNumber(stats.activeAppointments)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strings.ACTIVE_APPOINTMENTS || 'Active Appointments'}
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
                      <Payment color="error" />
                      <Box>
                        <Typography variant="h4">{formatNumber(stats.pendingPayments)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {strings.PENDING_PAYMENTS || 'Pending Payments'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Detailed Views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label={strings.TOP_DRESSES || 'Top Dresses'} />
                <Tab label={strings.RECENT_BOOKINGS || 'Recent Bookings'} />
                <Tab label={strings.REVENUE_TRENDS || 'Revenue Trends'} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {/* Top Dresses Bar Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.TOP_PERFORMING_DRESSES || 'Top Performing Dresses'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={prepareDressPerformanceData()} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Top Dresses Table */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.DETAILED_PERFORMANCE || 'Detailed Performance'}
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{strings.DRESS_NAME || 'Dress'}</TableCell>
                              <TableCell align="right">{strings.BOOKINGS || 'Bookings'}</TableCell>
                              <TableCell align="right">{strings.REVENUE || 'Revenue'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stats.topPerformingDresses.slice(0, 10).map((dress) => (
                              <TableRow key={dress._id}>
                                <TableCell>
                                  <Typography variant="body2" noWrap>
                                    {dress.name.length > 20 ? dress.name.substring(0, 20) + '...' : dress.name}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip label={dress.bookingCount} size="small" color="primary" />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(dress.revenue)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Dress Performance Pie Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.REVENUE_DISTRIBUTION || 'Revenue Distribution'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareDressPerformanceData().slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                          >
                            {prepareDressPerformanceData().slice(0, 6).map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Booking Count vs Revenue Scatter */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.BOOKINGS_VS_REVENUE || 'Bookings vs Revenue Analysis'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareDressPerformanceData().slice(0, 6)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === 'revenue' ? formatCurrency(value) : value,
                              name === 'revenue' ? 'Revenue' : 'Bookings'
                            ]}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                          <Bar yAxisId="right" dataKey="bookings" fill="#82ca9d" name="Bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{strings.CUSTOMER || 'Customer'}</TableCell>
                      <TableCell>{strings.DRESS || 'Dress'}</TableCell>
                      <TableCell>{strings.RENTAL_PERIOD || 'Rental Period'}</TableCell>
                      <TableCell>{strings.STATUS}</TableCell>
                      <TableCell align="right">{strings.AMOUNT || 'Amount'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>{booking.customerName}</TableCell>
                        <TableCell>{booking.dressName}</TableCell>
                        <TableCell>
                          {booking.from.toLocaleDateString()} - {booking.to.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status} 
                            color={getStatusColor(booking.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(booking.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {/* Monthly Revenue Trend Chart */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.MONTHLY_REVENUE_TREND || 'Monthly Revenue Trend'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={prepareMonthlyRevenueData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                            name="Revenue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Booking Status Distribution */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.BOOKING_STATUS_DISTRIBUTION || 'Booking Status Distribution'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={prepareBookingStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareBookingStatusData().map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Revenue vs Bookings Correlation */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.REVENUE_BOOKINGS_CORRELATION || 'Revenue vs Bookings'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareMonthlyRevenueData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === 'revenue' ? formatCurrency(value) : value,
                              name === 'revenue' ? 'Revenue' : 'Bookings'
                            ]}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="bookings"
                            stroke="#82ca9d"
                            strokeWidth={3}
                            name="Bookings"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>

                {/* Average Booking Value Trend */}
                <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {strings.AVERAGE_BOOKING_VALUE || 'Average Booking Value'}
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareMonthlyRevenueData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Line
                            type="monotone"
                            dataKey="avgBookingValue"
                            stroke="#ff7300"
                            strokeWidth={3}
                            name="Avg Booking Value"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </TabPanel>
          </>
        )}
      </Container>
    </Layout>
  )
}

export default AdminDashboard
