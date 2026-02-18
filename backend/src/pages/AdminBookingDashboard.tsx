import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  List as ListIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
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
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import AdminBookingCalendar from '@/components/AdminBookingCalendar'
import BookingList from '@/components/BookingList'

import * as AdminBookingService from '@/services/AdminBookingService'
import * as helper from '@/common/helper'
import { strings as commonStrings } from '@/lang/common'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`booking-tabpanel-${index}`}
    aria-labelledby={`booking-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const AdminBookingDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (admin) {
      loadAnalytics()
    }
  }, [admin, refreshTrigger])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await AdminBookingService.getBookingAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      
      if (!_admin) {
        // Redirect non-admin users
        window.location.href = '/bookings'
      }
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }



  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleExport = async () => {
    try {
      const blob = await AdminBookingService.exportBookings({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      helper.info('Bookings exported successfully!')
    } catch (err: any) {
      console.error('Error exporting bookings:', err)
      helper.error('Failed to export bookings')
    }
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  // Chart data preparation
  const prepareMonthlyTrendsData = () => {
    if (!analytics?.monthlyTrends) return []

    return analytics.monthlyTrends.map((trend: any) => ({
      month: `${trend.month}/${trend.year}`,
      bookings: trend.bookings,
      revenue: trend.revenue,
      avgValue: trend.bookings > 0 ? trend.revenue / trend.bookings : 0,
    }))
  }

  const prepareCategoryData = () => {
    if (!analytics?.categoryBreakdown) return []

    return analytics.categoryBreakdown.map((category: any) => ({
      name: category.category,
      revenue: category.revenue,
      bookings: category.bookings,
    }))
  }

  const prepareStatusData = () => {
    if (!analytics?.statusBreakdown) return []

    return analytics.statusBreakdown.map((status: any) => ({
      name: status.status,
      value: status.count,
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

  if (!user || !admin) {
    return (
      <Layout onLoad={onLoad} strict>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {commonStrings.BOOKING_MANAGEMENT_DASHBOARD}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={commonStrings.REFRESH_DATA}>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={commonStrings.EXPORT_BOOKINGS}>
              <IconButton onClick={handleExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-booking')}
            >
              {commonStrings.CREATE_NEW_BOOKING}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Analytics Overview */}
        {analytics && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 3  }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {commonStrings.TOTAL_REVENUE}
                  </Typography>
                  <Typography variant="h5">
                    ${analytics.totalRevenue?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {commonStrings.TOTAL_BOOKINGS}
                  </Typography>
                  <Typography variant="h5">
                    {analytics.totalBookings || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {commonStrings.AVG_BOOKING_VALUE}
                  </Typography>
                  <Typography variant="h5">
                    ${analytics.averageBookingValue?.toFixed(2) || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {commonStrings.AVAILABLE_DRESSES}
                  </Typography>
                  <Typography variant="h5">
                    {analytics.availableDresses || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="booking management tabs">
            <Tab icon={<DashboardIcon />} label={commonStrings.OVERVIEW} />
            <Tab icon={<CalendarIcon />} label={commonStrings.CALENDAR} />
            <Tab icon={<ListIcon />} label={commonStrings.LIST_VIEW} />
            <Tab icon={<AnalyticsIcon />} label={commonStrings.ANALYTICS} />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          {/* Overview Tab */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {commonStrings.RECENT_BOOKINGS}
                  </Typography>
                  <BookingList
                    containerClassName="recent-bookings"
                    language={user.language}
                    loggedUser={user}
                    suppliers={[]}
                    statuses={['pending', 'deposit', 'paid']}
                    loading={loading}
                    hideDates={false}
                    checkboxSelection={false}

                    key={refreshTrigger}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {commonStrings.QUICK_STATS}
                  </Typography>
                  {analytics?.categoryBreakdown && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Top Categories
                      </Typography>
                      {analytics.categoryBreakdown.slice(0, 3).map((category: any) => (
                        <Box key={category.category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{category.category}</Typography>
                          <Chip label={formatCurrency(category.revenue)} size="small" />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Mini Revenue Chart */}
                  {analytics?.monthlyTrends && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {commonStrings.REVENUE_TREND}
                      </Typography>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={prepareMonthlyTrendsData().slice(-6)}>
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={false}
                          />
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {/* Calendar Tab */}
          <AdminBookingCalendar />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {/* List View Tab */}
          <BookingList
            containerClassName="admin-bookings"
            language={user.language}
            loggedUser={user}
            suppliers={[]}
            statuses={helper.getBookingStatuses().map(status => status.value)}
            loading={loading}
            hideDates={false}
            checkboxSelection={true}
            key={refreshTrigger}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          {/* Analytics Tab */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {/* Monthly Booking Trends */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {commonStrings.MONTHLY_BOOKING_TRENDS}
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={prepareMonthlyTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? commonStrings.REVENUE : name === 'bookings' ? commonStrings.BOOKINGS : commonStrings.AVERAGE_BOOKING_VALUE
                        ]}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                        name={commonStrings.REVENUE}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="bookings"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        name={commonStrings.BOOKINGS}
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
                    {commonStrings.BOOKING_STATUS_DISTRIBUTION}
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={prepareStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareStatusData().map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Category Performance */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {commonStrings.CATEGORY_PERFORMANCE}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareCategoryData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? commonStrings.REVENUE : commonStrings.BOOKINGS
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name={commonStrings.REVENUE} />
                      <Bar yAxisId="right" dataKey="bookings" fill="#82ca9d" name={commonStrings.BOOKINGS} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Average Booking Value Trend */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Booking Value Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prepareMonthlyTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line
                        type="monotone"
                        dataKey="avgValue"
                        stroke="#ff7300"
                        strokeWidth={3}
                        name="Avg Booking Value"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Revenue vs Bookings Correlation */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue vs Bookings Correlation
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareMonthlyTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? commonStrings.REVENUE : commonStrings.BOOKINGS
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name={commonStrings.REVENUE} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="bookings"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        name={commonStrings.BOOKINGS}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>


      </Box>
    </Layout>
  )
}

export default AdminBookingDashboard
