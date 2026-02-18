import React, { useState, useEffect, useRef } from 'react'
import {   
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
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
  Switch,
  FormControlLabel,
 } from '@mui/material'
import {
  Add,
  TrendingUp,
  Inventory,
  AttachMoney,
  Star,
  CalendarToday,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import Layout from '@/components/Layout'
import DressList from '@/components/DressList'

interface InventoryStats {
  totalDresses: number
  availableDresses: number
  bookedDresses: number
  totalRevenue: number
  averageRating: number
  topPerformers: Array<{
    _id: string
    name: string
    bookingCount: number
    revenue: number
    rating: number
  }>
  categoryBreakdown: Array<{
    category: string
    count: number
    revenue: number
  }>
  sizeDistribution: Array<{
    size: string
    count: number
    utilization: number
  }>
  seasonalTrends: Array<{
    month: string
    bookings: number
    revenue: number
  }>
  maintenanceAlerts: Array<{
    dressId: string
    dressName: string
    issue: string
    priority: 'low' | 'medium' | 'high'
  }>
  upcomingBookings: Array<{
    dressId: string
    dressName: string
    customerName: string
    date: Date
    status: string
  }>
}

const DressInventory: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    availability: '',
    type: '',
    size: '',
    priceRange: '',
    rating: '',
  })
  const [quickActions, setQuickActions] = useState({
    bulkUpdate: false,
    selectedDresses: [] as string[],
  })
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false)
  const [bulkUpdateData, setBulkUpdateData] = useState({
    action: '',
    value: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchInventoryStats()
    }
  }, [user])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const fetchInventoryStats = async () => {
    // Create new AbortController for this fetch
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)

      // Fetch real inventory stats from API
      const response = await fetch('/api/inventory-stats', {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch inventory stats')
      }

      const inventoryData = await response.json()

      // Transform API data to match interface
      const transformedStats: InventoryStats = {
        totalDresses: inventoryData.totalDresses || 0,
        availableDresses: inventoryData.availableDresses || 0,
        bookedDresses: inventoryData.bookedDresses || 0,
        totalRevenue: inventoryData.totalRevenue || 0,
        averageRating: inventoryData.averageRating || 0,
        topPerformers: inventoryData.topPerformers || [],
        categoryBreakdown: inventoryData.categoryBreakdown || [],
        sizeDistribution: inventoryData.sizeDistribution || [],
        seasonalTrends: [], // Will be populated from analytics API
        maintenanceAlerts: inventoryData.maintenanceAlerts || [],
        upcomingBookings: inventoryData.upcomingBookings || [],
      }

      if (isMountedRef.current) {
        setStats(transformedStats)
      }
    } catch (err) {
      // Don't show error if request was aborted (component unmounted)
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        return
      }

      console.error('Error fetching inventory stats:', err)
      if (isMountedRef.current) {
        setError('Failed to load inventory statistics')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleBulkUpdate = async () => {
    try {
      setLoading(true)

      // Implement bulk update logic with real API call
      const updateData = {
        dressIds: quickActions.selectedDresses,
        updates: {
          // Add the fields you want to bulk update
          available: true, // Example: mark all as available
          // Add more fields as needed
        }
      }

      const response = await fetch('/api/bulk-update-dresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        if (isMountedRef.current) {
          setSuccess(`Bulk update applied to ${quickActions.selectedDresses.length} dresses`)
          setBulkUpdateDialog(false)
          setQuickActions({ bulkUpdate: false, selectedDresses: [] })
        }
        fetchInventoryStats()
      } else {
        const errorData = await response.json()
        if (isMountedRef.current) {
          setError(errorData.error || 'Failed to perform bulk update')
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.error || 'Failed to perform bulk update')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }))
  }



  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {strings.DRESS_INVENTORY || 'Dress Inventory'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => window.location.href = '/create-dress'}
          >
            {strings.ADD_DRESS || 'Add Dress'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Inventory Statistics */}
        {stats && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory color="primary" />
                  <Box>
                    <Typography variant="h4">{stats.totalDresses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {strings.TOTAL_DRESSES || 'Total Dresses'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday color="success" />
                  <Box>
                    <Typography variant="h4">{stats.availableDresses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {strings.AVAILABLE || 'Available'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="warning" />
                  <Box>
                    <Typography variant="h4">{stats.bookedDresses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {strings.CURRENTLY_BOOKED || 'Currently Booked'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney color="info" />
                  <Box>
                    <Typography variant="h4">${stats.totalRevenue.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {strings.TOTAL_REVENUE || 'Total Revenue'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="secondary" />
                  <Box>
                    <Typography variant="h4">{stats.averageRating.toFixed(1)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {strings.AVERAGE_RATING || 'Average Rating'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Filters and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {strings.FILTERS_AND_ACTIONS || 'Filters & Actions'}
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{strings.AVAILABILITY || 'Availability'}</InputLabel>
                <Select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <MenuItem value="">{strings.ALL || 'All'}</MenuItem>
                  <MenuItem value="available">{strings.AVAILABLE || 'Available'}</MenuItem>
                  <MenuItem value="booked">{strings.BOOKED || 'Booked'}</MenuItem>
                  <MenuItem value="unavailable">{strings.UNAVAILABLE || 'Unavailable'}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{strings.DRESS_TYPE || 'Type'}</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">{strings.ALL || 'All'}</MenuItem>
                  <MenuItem value="wedding">{strings.WEDDING || 'Wedding'}</MenuItem>
                  <MenuItem value="evening">{strings.EVENING || 'Evening'}</MenuItem>
                  <MenuItem value="cocktail">{strings.COCKTAIL || 'Cocktail'}</MenuItem>
                  <MenuItem value="casual">{strings.CASUAL || 'Casual'}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{strings.SIZE || 'Size'}</InputLabel>
                <Select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <MenuItem value="">{strings.ALL || 'All'}</MenuItem>
                  <MenuItem value="XS">XS</MenuItem>
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                  <MenuItem value="XL">XL</MenuItem>
                  <MenuItem value="XXL">XXL</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{strings.PRICE_RANGE || 'Price Range'}</InputLabel>
                <Select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  <MenuItem value="">{strings.ALL || 'All'}</MenuItem>
                  <MenuItem value="0-100">$0 - $100</MenuItem>
                  <MenuItem value="100-300">$100 - $300</MenuItem>
                  <MenuItem value="300-500">$300 - $500</MenuItem>
                  <MenuItem value="500+">$500+</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{strings.RATING || 'Rating'}</InputLabel>
                <Select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <MenuItem value="">{strings.ALL || 'All'}</MenuItem>
                  <MenuItem value="4+">4+ Stars</MenuItem>
                  <MenuItem value="3+">3+ Stars</MenuItem>
                  <MenuItem value="2+">2+ Stars</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={quickActions.bulkUpdate}
                    onChange={(e) => setQuickActions(prev => ({ ...prev, bulkUpdate: e.target.checked }))}
                  />
                }
                label={strings.BULK_ACTIONS || 'Bulk Actions'}
              />
            </Box>

            {quickActions.bulkUpdate && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">
                  {quickActions.selectedDresses.length} {strings.SELECTED || 'selected'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setBulkUpdateDialog(true)}
                  disabled={quickActions.selectedDresses.length === 0}
                >
                  {strings.BULK_UPDATE || 'Bulk Update'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        {stats && (
          <>
            {/* Category Breakdown */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.CATEGORY_BREAKDOWN || 'Category Breakdown'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  {stats.categoryBreakdown.map((category) => (
                    <Card variant="outlined" key={category.category}>
                      <CardContent>
                        <Typography variant="h6">{category.category}</Typography>
                        <Typography variant="h4" color="primary">
                          {category.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${category.revenue.toLocaleString()} revenue
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Size Distribution & Utilization */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.SIZE_DISTRIBUTION || 'Size Distribution & Utilization'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
                  {stats.sizeDistribution.map((size) => (
                    <Card variant="outlined" key={size.size}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{size.size}</Typography>
                        <Typography variant="h6" color="primary">
                          {size.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {size.utilization}% utilized
                        </Typography>
                        <Box sx={{
                          width: '100%',
                          height: 4,
                          bgcolor: 'grey.300',
                          borderRadius: 2,
                          mt: 1
                        }}>
                          <Box sx={{
                            width: `${size.utilization}%`,
                            height: '100%',
                            bgcolor: size.utilization > 80 ? 'success.main' :
                                    size.utilization > 60 ? 'warning.main' : 'error.main',
                            borderRadius: 2
                          }} />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Maintenance Alerts */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.MAINTENANCE_ALERTS || 'Maintenance Alerts'}
                </Typography>
                {stats.maintenanceAlerts.map((alert, index) => (
                  <Box key={index} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: alert.priority === 'high' ? 'error.light' :
                            alert.priority === 'medium' ? 'warning.light' : 'info.light',
                    borderRadius: 1
                  }}>
                    <Box>
                      <Typography variant="subtitle1">{alert.dressName}</Typography>
                      <Typography variant="body2">{alert.issue}</Typography>
                    </Box>
                    <Chip
                      label={alert.priority.toUpperCase()}
                      color={alert.priority === 'high' ? 'error' :
                            alert.priority === 'medium' ? 'warning' : 'info'}
                      size="small"
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.UPCOMING_BOOKINGS || 'Upcoming Bookings'}
                </Typography>
                {stats.upcomingBookings.map((booking, index) => (
                  <Box key={index} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}>
                    <Box>
                      <Typography variant="subtitle1">{booking.dressName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.customerName} • {booking.date.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={booking.status}
                      color={booking.status === 'confirmed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {strings.TOP_PERFORMERS || 'Top Performers'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                  {stats.topPerformers.map((dress, index) => (
                    <Card variant="outlined" key={dress._id}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" noWrap>
                              #{index + 1} {dress.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dress.bookingCount} bookings • ${dress.revenue.toLocaleString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                              <Star color="warning" fontSize="small" />
                              <Typography variant="body2">{dress.rating}</Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={`#${index + 1}`}
                            color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dress List */}
        <DressList
          suppliers={user ? [user._id!] : []}
          keyword=""
          dressSpecs={undefined}
          dressType={filters.type ? [filters.type] : undefined}
          dressSize={filters.size ? [filters.size] : undefined}
          dressStyle={undefined}
          deposit={undefined}
          availability={filters.availability ? [filters.availability] : undefined}
          reload={false}
          dresses={[]}
          user={user}
          booking={undefined}
          className=""
          loading={loading}
          hideSupplier={true}
          hidePrice={false}
          language="en"
          range={undefined}
          rentalsCount={filters.rating}
          onLoad={() => {}}
          onDelete={() => {}}
        />

        {/* Bulk Update Dialog */}
        <Dialog open={bulkUpdateDialog} onClose={() => setBulkUpdateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{strings.BULK_UPDATE || 'Bulk Update'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>{strings.ACTION || 'Action'}</InputLabel>
                <Select
                  value={bulkUpdateData.action}
                  onChange={(e) => setBulkUpdateData(prev => ({ ...prev, action: e.target.value }))}
                >
                  <MenuItem value="availability">{strings.UPDATE_AVAILABILITY || 'Update Availability'}</MenuItem>
                  <MenuItem value="price">{strings.UPDATE_PRICE || 'Update Price'}</MenuItem>
                  <MenuItem value="discount">{strings.APPLY_DISCOUNT || 'Apply Discount'}</MenuItem>
                  <MenuItem value="category">{strings.CHANGE_CATEGORY || 'Change Category'}</MenuItem>
                </Select>
              </FormControl>

              {bulkUpdateData.action && (
                <TextField
                  label={strings.VALUE || 'Value'}
                  value={bulkUpdateData.value}
                  onChange={(e) => setBulkUpdateData(prev => ({ ...prev, value: e.target.value }))}
                  fullWidth
                  placeholder={
                    bulkUpdateData.action === 'availability' ? 'true/false' :
                    bulkUpdateData.action === 'price' ? 'New price' :
                    bulkUpdateData.action === 'discount' ? 'Discount percentage' :
                    'New category'
                  }
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkUpdateDialog(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button 
              onClick={handleBulkUpdate} 
              variant="contained" 
              disabled={loading || !bulkUpdateData.action || !bulkUpdateData.value}
            >
              {strings.APPLY || 'Apply'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default DressInventory
