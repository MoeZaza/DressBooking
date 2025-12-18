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
 } from '@mui/material'
import {
  Build,
  People,
  TrendingUp,
  Warning,
  Star,
  Schedule,
  CheckCircle,
  Cancel,
  Add,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import * as BusinessIntelligenceService from '@/services/BusinessIntelligenceService'

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
      id={`business-tabpanel-${index}`}
      aria-labelledby={`business-tab-${index}`}
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

const BusinessIntelligence: React.FC = () => {
  const { language, isRTL } = useLanguage()
  const [tabValue, setTabValue] = useState(0)
  const [businessSummary, setBusinessSummary] = useState<any>(null)
  const [customerInsights, setCustomerInsights] = useState<any>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false)
  const [newMaintenance, setNewMaintenance] = useState({
    dress: '',
    type: 'cleaning',
    description: '',
    cost: '',
    scheduledDate: new Date(),
    priority: 'medium',
    serviceProvider: '',
    notes: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)

      // Check if user is authenticated first
      const user = JSON.parse(localStorage.getItem('bc-user') || '{}')
      if (!user || !user.accessToken) {
        setError('Please sign in to access business intelligence data')
        setLoading(false)
        return
      }

      const [summary, insights, maintenance] = await Promise.all([
        BusinessIntelligenceService.getBusinessSummary(),
        BusinessIntelligenceService.getCustomerInsights(),
        BusinessIntelligenceService.getMaintenanceRecords()
      ])
      setBusinessSummary(summary)
      setCustomerInsights(insights)
      setMaintenanceRecords(maintenance)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching business intelligence data:', err)
      if (err.response?.status === 401) {
        setError('Authentication required. Please sign in to access this data.')
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view business intelligence data.')
      } else {
        setError('Failed to load business intelligence data. Please try again later.')
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

  const handleCreateMaintenance = async () => {
    try {
      await BusinessIntelligenceService.createMaintenance({
        ...newMaintenance,
        cost: Number(newMaintenance.cost),
        scheduledDate: newMaintenance.scheduledDate.toISOString()
      })
      setOpenMaintenanceDialog(false)
      setNewMaintenance({
        dress: '',
        type: 'cleaning',
        description: '',
        cost: '',
        scheduledDate: new Date(),
        priority: 'medium',
        serviceProvider: '',
        notes: ''
      })
      fetchData()
    } catch (err) {
      console.error('Error creating maintenance record:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'warning'
      case 'scheduled': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Business Intelligence
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Business Intelligence
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const onLoad = () => {}

  return (
    <Layout onLoad={onLoad} strict>
      <Box sx={{ p: 3 }}>

        <Typography variant="h4" gutterBottom>
          Business Intelligence
        </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Customer Insights" />
          <Tab label="Maintenance" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Business Overview */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Customer Metrics</Typography>
                </Box>
                <Typography variant="h4">{businessSummary?.customers?.totalCustomers || 0}</Typography>
                <Typography color="textSecondary">Total Customers</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    VIP Customers: {businessSummary?.customers?.vipCustomers || 0}
                  </Typography>
                  <Typography variant="body2">
                    Avg Loyalty Score: {Math.round(businessSummary?.customers?.averageLoyaltyScore || 0)}
                  </Typography>
                  <Typography variant="body2">
                    High Risk: {businessSummary?.customers?.highRiskCustomers || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Build color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Maintenance</Typography>
                </Box>
                <Typography variant="h4">
                  {businessSummary?.maintenance?.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
                </Typography>
                <Typography color="textSecondary">Total Records</Typography>
                <Box sx={{ mt: 2 }}>
                  {businessSummary?.maintenance?.map((item: any) => (
                    <Typography key={item._id} variant="body2">
                      {item._id}: {item.count} ({formatCurrency(item.totalCost)})
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Dress Utilization</Typography>
                </Box>
                <Typography variant="h4">{businessSummary?.dresses?.totalDresses || 0}</Typography>
                <Typography color="textSecondary">Total Dresses</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Active: {businessSummary?.dresses?.activeDresses || 0}
                  </Typography>
                  <Typography variant="body2">
                    Utilization Rate: {Math.round((businessSummary?.dresses?.averageUtilization || 0) * 100)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Customer Insights */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Insights
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Spent</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Loyalty Score</TableCell>
                    <TableCell>Risk Score</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerInsights?.insights?.map((insight: any) => (
                    <TableRow key={insight._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {insight.customer?.fullName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {insight.customer?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(insight.totalSpent)}</TableCell>
                      <TableCell>{insight.totalBookings}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star color={insight.loyaltyScore > 70 ? 'warning' : 'disabled'} sx={{ mr: 0.5 }} />
                          {insight.loyaltyScore}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={insight.riskScore}
                          color={insight.riskScore > 70 ? 'error' : insight.riskScore > 40 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {insight.isVip && <Chip label="VIP" color="primary" size="small" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Maintenance Records */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenMaintenanceDialog(true)}
          >
            Schedule Maintenance
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Maintenance Records
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dress</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceRecords?.maintenanceRecords?.map((record: any) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.dress?.name || 'N/A'}</TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{formatCurrency(record.cost)}</TableCell>
                      <TableCell>{new Date(record.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.priority}
                          color={getPriorityColor(record.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status)}
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
      </TabPanel>

      {/* Create Maintenance Dialog */}
      <Dialog open={openMaintenanceDialog} onClose={() => setOpenMaintenanceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2,  mt: 1  }}>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                >
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="alteration">Alteration</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="storage">Storage</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Description"
                value={newMaintenance.description}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Cost (₪)"
                type="number"
                value={newMaintenance.cost}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <DatePicker
                label="Scheduled Date"
                value={newMaintenance.scheduledDate}
                onChange={(date) => setNewMaintenance({ ...newMaintenance, scheduledDate: date || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Service Provider"
                value={newMaintenance.serviceProvider}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, serviceProvider: e.target.value })}
              />
            </Box>
            <Box sx={{ flex: "1 1 auto", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Notes"
                value={newMaintenance.notes}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaintenanceDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateMaintenance} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </Layout>
  )
}

export default BusinessIntelligence
