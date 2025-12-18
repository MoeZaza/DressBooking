import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  AttachMoney,
  People,
  Inventory,
  Assessment,
  Warning,
  CheckCircle,
  Info,
  Lightbulb,
  Refresh,
  Download
} from '@mui/icons-material'
import {
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
  ResponsiveContainer,
  Legend
} from 'recharts'
import { usePermissions } from '../hooks/usePermissions'

interface MonthlyAnalytics {
  _id: string
  year: number
  month: number
  monthName: string
  period: string
  
  // Revenue metrics
  totalRevenue: number
  rentalRevenue: number
  serviceRevenue: number
  packageRevenue: number
  averageBookingValue: number
  
  // Booking metrics
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  cancellationRate: number
  
  // Customer metrics
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerRetentionRate: number
  
  // Financial metrics
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  
  // Growth metrics
  revenueGrowth: number
  bookingGrowth: number
  customerGrowth: number
  
  // Performance data
  topPerformingDresses: Array<{
    dressName: string
    bookings: number
    revenue: number
  }>
  categoryBreakdown: Array<{
    category: string
    bookings: number
    revenue: number
    averagePrice: number
  }>
  
  // Insights
  insights: Array<{
    type: 'trend' | 'alert' | 'opportunity' | 'warning'
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    actionRequired: boolean
  }>
}

const MonthlyAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<MonthlyAnalytics[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<MonthlyAnalytics | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { canViewAccounting, canViewAnalytics } = usePermissions()

  useEffect(() => {
    if (!canViewAccounting() || !canViewAnalytics()) {
      setError('You do not have permission to view analytics')
      setLoading(false)
      return
    }

    fetchAnalytics()
  }, [selectedYear])

  useEffect(() => {
    if (analytics.length > 0) {
      const period = analytics.find(a => a.year === selectedYear && a.month === selectedMonth)
      setSelectedPeriod(period || analytics[0])
    }
  }, [analytics, selectedYear, selectedMonth])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/monthly?year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        throw new Error('Failed to fetch analytics')
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      const response = await fetch(`/api/analytics/monthly/${selectedYear}/${selectedMonth}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        await fetchAnalytics()
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (err: any) {
      console.error('Error generating report:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-PS', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100) / 100}%`
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 5) return <TrendingUp color="success" />
    if (growth < -5) return <TrendingDown color="error" />
    return <TrendingFlat color="info" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'success'
    if (growth < -5) return 'error'
    return 'info'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp />
      case 'alert': return <Warning />
      case 'opportunity': return <Lightbulb />
      case 'warning': return <Warning />
      default: return <Info />
    }
  }

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Monthly Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2023, 2022].map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('ar', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Generate Report">
            <IconButton onClick={generateReport} color="primary">
              <Assessment />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchAnalytics} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {selectedPeriod && (
        <>
          {/* Key Metrics Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(selectedPeriod.totalRevenue)}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        {getGrowthIcon(selectedPeriod.revenueGrowth)}
                        <Typography 
                          variant="body2" 
                          color={getGrowthColor(selectedPeriod.revenueGrowth)}
                          sx={{ ml: 0.5 }}
                        >
                          {formatPercentage(selectedPeriod.revenueGrowth)}
                        </Typography>
                      </Box>
                    </Box>
                    <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Bookings
                      </Typography>
                      <Typography variant="h5">
                        {selectedPeriod.totalBookings}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        {getGrowthIcon(selectedPeriod.bookingGrowth)}
                        <Typography 
                          variant="body2" 
                          color={getGrowthColor(selectedPeriod.bookingGrowth)}
                          sx={{ ml: 0.5 }}
                        >
                          {formatPercentage(selectedPeriod.bookingGrowth)}
                        </Typography>
                      </Box>
                    </Box>
                    <Inventory color="info" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Net Profit
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(selectedPeriod.netProfit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Margin: {formatPercentage(selectedPeriod.profitMargin)}
                      </Typography>
                    </Box>
                    <TrendingUp color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Customers
                      </Typography>
                      <Typography variant="h5">
                        {selectedPeriod.totalCustomers}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        New: {selectedPeriod.newCustomers}
                      </Typography>
                    </Box>
                    <People color="secondary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts Row */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mb: 4  }}>
            {/* Revenue Breakdown */}
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Rental', value: selectedPeriod.rentalRevenue },
                          { name: 'Services', value: selectedPeriod.serviceRevenue },
                          { name: 'Packages', value: selectedPeriod.packageRevenue }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
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
                    Category Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedPeriod.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Insights */}
          {selectedPeriod.insights && selectedPeriod.insights.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Business Insights
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {selectedPeriod.insights.map((insight, index) => (
                    <Box sx={{ flex: "1 1 auto", minWidth: "300px" }} key={index}>
                      <Alert 
                        severity={getInsightColor(insight.impact) as any}
                        icon={getInsightIcon(insight.type)}
                        action={
                          insight.actionRequired && (
                            <Button color="inherit" size="small">
                              Action Required
                            </Button>
                          )
                        }
                      >
                        <Typography variant="subtitle2">{insight.title}</Typography>
                        <Typography variant="body2">{insight.description}</Typography>
                      </Alert>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Dresses */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Dresses
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dress Name</TableCell>
                      <TableCell align="right">Bookings</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg. Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPeriod.topPerformingDresses?.slice(0, 10).map((dress, index) => (
                      <TableRow key={index}>
                        <TableCell>{dress.dressName}</TableCell>
                        <TableCell align="right">{dress.bookings}</TableCell>
                        <TableCell align="right">{formatCurrency(dress.revenue)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(dress.bookings > 0 ? dress.revenue / dress.bookings : 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default MonthlyAnalyticsDashboard
