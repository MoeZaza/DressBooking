import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Build,
  AttachMoney,
  Inventory,
  Assessment
} from '@mui/icons-material'
import {PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line} from 'recharts'
import { usePermissions } from '../hooks/usePermissions'
import { strings } from '../lang/dresses'

interface InventoryAnalytics {
  inventorySummary: {
    totalItems: number
    totalValue: number
    totalRevenue: number
    averageCondition: number
  }
  dressPerformance: Array<{
    _id: string
    name: string
    type: string
    size: string
    color: string
    totalRevenue: number
    roi: number
    condition: string
    status: string
    maintenanceCost: number
    lastRental: string
  }>
  maintenanceAlerts: Array<{
    _id: string
    dress: {
      _id: string
      name: string
      type: string
    }
    alerts: Array<{
      type: string
      message: string
      priority: string
      createdAt: string
    }>
    condition: string
    status: string
  }>
  categoryRevenue: Array<{
    _id: string
    totalRevenue: number
    count: number
    averageRevenue: number
  }>
  monthlyTrends: Array<{
    _id: { year: number; month: number }
    revenue: number
    bookings: number
  }>
  summary: {
    totalDresses: number
    activeAlerts: number
    topPerformer: any
    averageROI: number
  }
}

const InventoryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { canViewAccounting, canViewAnalytics } = usePermissions()

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!canViewAccounting() || !canViewAnalytics()) {
      setError('You do not have permission to view inventory analytics')
      setLoading(false)
      return
    }

    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounting/inventory-analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (isMountedRef.current) {
          setAnalytics(data)
        }
      } else {
        throw new Error('Failed to fetch analytics')
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load analytics')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#4caf50'
      case 'good': return '#8bc34a'
      case 'fair': return '#ff9800'
      case 'poor': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'rented': return 'primary'
      case 'maintenance': return 'warning'
      case 'damaged': return 'error'
      case 'retired': return 'default'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
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

  if (!analytics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No analytics data available
      </Alert>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {strings.INVENTORY_ANALYTICS}
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Inventory color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.TOTAL_DRESSES}
                  </Typography>
                  <Typography variant="h5">
                    {analytics.summary.totalDresses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {strings.TOTAL_REVENUE}
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(analytics.inventorySummary.totalRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average ROI
                  </Typography>
                  <Typography variant="h5">
                    {formatPercentage(analytics.summary.averageROI)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h5">
                    {analytics.summary.activeAlerts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Category Revenue Chart */}
        <Box sx={{ flex: '1 1 500px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryRevenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, totalRevenue }) => `${_id}: ${formatCurrency(totalRevenue)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalRevenue"
                  >
                    {analytics.categoryRevenue.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Monthly Trends Chart */}
        <Box sx={{ flex: '1 1 500px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Revenue Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id.month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Maintenance Alerts */}
      {analytics.maintenanceAlerts.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {strings.MAINTENANCE_ALERTS}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dress</TableCell>
                    <TableCell>Alert Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.maintenanceAlerts.map((item) =>
                    item.alerts.map((alert, index) => (
                      <TableRow key={`${item._id}-${index}`}>
                        <TableCell>{item.dress.name}</TableCell>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.priority}
                            color={getPriorityColor(alert.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.condition}
                            style={{ backgroundColor: getConditionColor(item.condition), color: 'white' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>ROI</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.dressPerformance.slice(0, 10).map((dress) => (
                  <TableRow key={dress._id}>
                    <TableCell>{dress.name}</TableCell>
                    <TableCell>{dress.type}</TableCell>
                    <TableCell>{dress.size}</TableCell>
                    <TableCell>{formatCurrency(dress.totalRevenue || 0)}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {dress.roi > 0 ? (
                          <TrendingUp color="success" sx={{ mr: 1 }} />
                        ) : (
                          <TrendingDown color="error" sx={{ mr: 1 }} />
                        )}
                        {formatPercentage(dress.roi || 0)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dress.condition}
                        style={{ backgroundColor: getConditionColor(dress.condition), color: 'white' }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dress.status}
                        color={getStatusColor(dress.status) as any}
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
  )
}

export default InventoryAnalytics
