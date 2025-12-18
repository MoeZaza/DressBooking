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
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingBag,
  Cancel,
  People,
  Checkroom,
  Analytics,
  Refresh,
} from '@mui/icons-material'
import {Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell} from 'recharts'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import * as AnalyticsService from '@/services/AnalyticsService'
import * as helper from ':bookcars-helper'

interface DashboardData {
  overview: {
    totalDresses: number
    availableDresses: number
    totalCustomers: number
    repeatCustomers: number
  }
  currentMonth: {
    bookings: number
    cancellations: number
    revenue: number
    expenses: number
    netProfit: number
  }
  growth: {
    revenueGrowth: number
    bookingGrowth: number
    cancellationRate: number
  }
  topDresses: any[]
  recentBookings: any[]
}

interface MonthlyData {
  year: number
  monthlyBookings: any[]
  monthlyRevenue: any[]
  monthlyExpenses: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const AnalyticsDashboard: React.FC = () => {
  const { language, isRTL } = useLanguage()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dashboard, monthly] = await Promise.all([
        AnalyticsService.getDashboardAnalytics(),
        AnalyticsService.getMonthlyAnalytics()
      ])
      setDashboardData(dashboard)
      setMonthlyData(monthly)
      setError(null)
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />
  }

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main'
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography color="error">{error || 'No data available'}</Typography>
      </Box>
    )
  }

  // Prepare chart data
  const monthlyChartData = monthlyData?.monthlyRevenue.map((revenue, _index) => {
    const booking = monthlyData.monthlyBookings.find(b => b._id.month === revenue._id.month)
    const expense = monthlyData.monthlyExpenses.find(e => e._id.month === revenue._id.month)
    
    return {
      month: `Month ${revenue._id.month}`,
      revenue: revenue.total || 0,
      expenses: expense?.total || 0,
      bookings: booking?.total || 0,
      profit: (revenue.total || 0) - (expense?.total || 0)
    }
  }) || []

  const categoryData = dashboardData.topDresses.map((dress, index) => ({
    name: dress.dressInfo.name,
    value: dress.bookingCount,
    color: COLORS[index % COLORS.length]
  }))

  const onLoad = () => {}

  return (
    <Layout onLoad={onLoad} strict>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchDashboardData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overview Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
        <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Dresses
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.overview.totalDresses}
                  </Typography>
                </Box>
                <Checkroom color="primary" sx={{ fontSize: 40 }} />
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
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(dashboardData.currentMonth.revenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getGrowthIcon(dashboardData.growth.revenueGrowth)}
                    <Typography variant="body2" sx={{ color: getGrowthColor(dashboardData.growth.revenueGrowth), ml: 0.5 }}>
                      {formatPercentage(dashboardData.growth.revenueGrowth)}
                    </Typography>
                  </Box>
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
                    Monthly Bookings
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.currentMonth.bookings}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getGrowthIcon(dashboardData.growth.bookingGrowth)}
                    <Typography variant="body2" sx={{ color: getGrowthColor(dashboardData.growth.bookingGrowth), ml: 0.5 }}>
                      {formatPercentage(dashboardData.growth.bookingGrowth)}
                    </Typography>
                  </Box>
                </Box>
                <ShoppingBag color="info" sx={{ fontSize: 40 }} />
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
                  <Typography variant="h4">
                    {formatCurrency(dashboardData.currentMonth.netProfit)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cancellation Rate: {dashboardData.growth.cancellationRate}%
                  </Typography>
                </Box>
                <Analytics color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
        <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Revenue & Expenses
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Dresses
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent Bookings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Bookings
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Dress</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.recentBookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>{booking.customer?.fullName || 'N/A'}</TableCell>
                    <TableCell>{booking.dress?.name || 'N/A'}</TableCell>
                    <TableCell>{helper.formatDatePart(booking.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(booking.price || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={booking.status === 'Paid' ? 'success' : booking.status === 'Cancelled' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
    </Layout>
  )
}

export default AnalyticsDashboard
