import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { Search, ExpandMore, Analytics } from '@mui/icons-material'
import * as DressService from '../services/DressService'
import * as BookingService from '../services/BookingService'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'

interface DressSearchFormProps {
  onDressSelect?: (dress: bookcarsTypes.Dress) => void
}

interface DressAnalytics {
  totalBookings: number
  totalRevenue: number
  cancelledBookings: number
  fittingAppointments: number
  averageRating: number
  lastBooked?: Date
  popularSeasons: string[]
  bookingHistory: any[]
}

const DressSearchForm: React.FC<DressSearchFormProps> = ({ onDressSelect }) => {
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [selectedDress, setSelectedDress] = useState<bookcarsTypes.Dress | null>(null)
  const [analytics, setAnalytics] = useState<DressAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState<bookcarsTypes.Dress[]>([])

  const handleSearch = async () => {
    if (!searchCode && !searchName) {
      setError('Please enter a dress code or name to search')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSearchResults([])
      setSelectedDress(null)
      setAnalytics(null)

      // Search by dress code first, then by name
      let results: bookcarsTypes.Dress[] = []
      
      if (searchCode) {
        // Search by dress code - use keyword parameter for dress code search
        const payload: bookcarsTypes.GetDressesPayload = {
          suppliers: []
        }
        const response = await DressService.getDresses(searchCode, payload, 1, 10)
        results = response?.[0]?.resultData || []
      } else if (searchName) {
        // Search by name - use keyword parameter for name search
        const payload: bookcarsTypes.GetDressesPayload = {
          suppliers: []
        }
        const response = await DressService.getDresses(searchName, payload, 1, 10)
        results = response?.[0]?.resultData || []
      }

      setSearchResults(results)
      
      if (results.length === 1) {
        // If only one result, automatically select it and load analytics
        await selectDress(results[0])
      } else if (results.length === 0) {
        setError('No dresses found matching your search criteria')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search for dresses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectDress = async (dress: bookcarsTypes.Dress) => {
    setSelectedDress(dress)
    if (onDressSelect) {
      onDressSelect(dress)
    }
    await loadDressAnalytics(dress._id)
  }

  const loadDressAnalytics = async (dressId: string) => {
    try {
      setLoading(true)

      // Get booking history for this dress
      const bookingsPayload: bookcarsTypes.GetBookingsPayload = {
        suppliers: [],
        statuses: [],
        dress: dressId
      }
      const bookingsResponse = await BookingService.getBookings(bookingsPayload, 1, 100)
      const bookings = bookingsResponse?.[0]?.resultData || []
      
      // Calculate analytics
      const totalBookings = bookings.length
      const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length
      const fittingAppointments = bookings.filter((b: any) => b.fittingRequired).length
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0)
      
      // Get last booking date
      const lastBooked = bookings.length > 0 
        ? new Date(Math.max(...bookings.map((b: any) => new Date(b.from).getTime())))
        : undefined
      
      // Calculate popular seasons (simplified)
      const seasonCounts: { [key: string]: number } = {}
      bookings.forEach((booking: any) => {
        const month = new Date(booking.from).getMonth()
        const season = month >= 2 && month <= 4 ? 'Spring' :
                     month >= 5 && month <= 7 ? 'Summer' :
                     month >= 8 && month <= 10 ? 'Fall' : 'Winter'
        seasonCounts[season] = (seasonCounts[season] || 0) + 1
      })
      
      const popularSeasons = Object.entries(seasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([season]) => season)

      const analyticsData: DressAnalytics = {
        totalBookings,
        totalRevenue,
        cancelledBookings,
        fittingAppointments,
        averageRating: 0, // Default rating since getDressAnalytics doesn't exist
        lastBooked,
        popularSeasons,
        bookingHistory: bookings.slice(0, 10) // Last 10 bookings
      }
      
      setAnalytics(analyticsData)
    } catch (err) {
      console.error('Analytics error:', err)
      setError('Failed to load dress analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search />
          Dress Search & Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label={strings.DRESS_CODE}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={strings.ENTER_DRESS_CODE || "Enter dress code (e.g., WD001)"}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <TextField
              fullWidth
              label={commonStrings.NAME}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={strings.ENTER_DRESS_NAME || "Enter dress name"}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ height: '56px' }}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        {searchResults.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length} found)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {searchResults.map((dress) => (
                <Box key={dress._id} sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                  <Card
                    sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
                    onClick={() => selectDress(dress)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                          src={dress.images?.[0] || '/default-dress.png'}
                          alt={dress.name}
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <Box>
                          <Typography variant="h6">{dress.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Code: {dress.dressCode || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price: ${dress.price}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Selected Dress Details */}
        {selectedDress && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics />
              Dress Details & Analytics
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedDress.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      {selectedDress.images?.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${selectedDress.name} ${index + 1}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip label={`${strings.DRESS_CODE}: ${selectedDress.dressCode || commonStrings.NOT_AVAILABLE}`} size="small" />
                      <Chip label={`${strings.DRESS_TYPE}: ${selectedDress.type}`} size="small" />
                      <Chip label={`${strings.DRESS_SIZE}: ${selectedDress.size}`} size="small" />
                      <Chip label={`${strings.PRICE}: ${commonStrings.CURRENCY}${selectedDress.price}`} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {commonStrings.STATUS}: {selectedDress.available ? strings.AVAILABLE : strings.UNAVAILABLE}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Material: {selectedDress.material}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: {selectedDress.color}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
                {analytics && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Analytics & Performance
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="primary.contrastText">
                            {analytics.totalBookings}
                          </Typography>
                          <Typography variant="body2" color="primary.contrastText">
                            Total Bookings
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="success.contrastText">
                            ${analytics.totalRevenue}
                          </Typography>
                          <Typography variant="body2" color="success.contrastText">
                            Total Revenue
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="warning.contrastText">
                            {analytics.cancelledBookings}
                          </Typography>
                          <Typography variant="body2" color="warning.contrastText">
                            Cancelled
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="info.contrastText">
                            {analytics.fittingAppointments}
                          </Typography>
                          <Typography variant="body2" color="info.contrastText">
                            Fittings
                          </Typography>
                        </Box>
                      </Box>
                      
                      {analytics.lastBooked && (
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Last Booked: {analytics.lastBooked.toLocaleDateString()}
                        </Typography>
                      )}
                      
                      {analytics.popularSeasons.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Popular Seasons:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {analytics.popularSeasons.map((season) => (
                              <Chip key={season} label={season} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>

            {/* Booking History */}
            {analytics?.bookingHistory && analytics.bookingHistory.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      Recent Booking History ({analytics.bookingHistory.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {analytics.bookingHistory.map((booking: any, index: number) => (
                        <Card key={index} sx={{ mb: 1 }}>
                          <CardContent sx={{ py: 1 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, alignItems: 'center' }}>
                              <Typography variant="body2">
                                {new Date(booking.from).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={booking.status}
                                size="small"
                                color={booking.status === 'completed' ? 'success' :
                                       booking.status === 'cancelled' ? 'error' : 'default'}
                              />
                              <Typography variant="body2">
                                ${booking.price}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {booking.customer?.fullName || 'N/A'}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default DressSearchForm
