import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Fab,
  Tooltip
 } from '@mui/material'
import {
  Add as AddIcon,
  Assessment as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/bookings'
import { strings as commonStrings } from '@/lang/common'
import { useLanguage } from '@/context/LanguageContext'

import * as helper from '@/common/helper'
import BookingList from '@/components/BookingList'
import SupplierFilter from '@/components/SupplierFilter'
import StatusFilter from '@/components/StatusFilter'
import BookingFilter from '@/components/BookingFilter'

import * as SupplierService from '@/services/SupplierService'


import '@/assets/css/bookings.css'

const Bookings = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [leftPanel, setLeftPanel] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>()
  const [statuses, setStatuses] = useState(helper.getBookingStatuses().map((status) => status.value))
  const [filter, setFilter] = useState<bookcarsTypes.Filter | null>()
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [offset, setOffset] = useState(0)

  const [analytics, setAnalytics] = useState<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])


  useEffect(() => {
    if (user && user.verified) {
      const col1 = document.querySelector('div.col-1')
      if (col1) {
        setOffset(col1.clientHeight)
      }
    }
  }, [user])

  const handleSupplierFilterChange = (_suppliers: string[]) => {
    setSuppliers(_suppliers)
  }

  const handleStatusFilterChange = (_statuses: bookcarsTypes.BookingStatus[]) => {
    setStatuses(_statuses)
  }

  const handleBookingFilterSubmit = (_filter: bookcarsTypes.Filter | null) => {
    setFilter(_filter)
  }

  const loadAnalytics = async () => {
    if (admin) {
      // Create new AbortController for this fetch
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await fetch('/api/analytics', {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        // Don't show error if request was aborted (component unmounted)
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return
        }
        console.error('Error loading analytics:', error)
      }
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      setLeftPanel(!_admin)
      setLoadingSuppliers(_admin)

      const _allSuppliers = await SupplierService.getAllSuppliers()
      const _suppliers = _admin ? bookcarsHelper.flattenSuppliers(_allSuppliers) : [_user._id ?? '']
      setAllSuppliers(_allSuppliers)
      setSuppliers(_suppliers)
      setLeftPanel(true)
      setLoadingSuppliers(false)

      if (_admin) {
        await loadAnalytics()
      }
    }
  }



  return (
    <Layout onLoad={onLoad} strict>
      {!user ? (
        <div className="loading-container" style={{ padding: '20px', textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {commonStrings.LOADING_USER_DATA || 'Loading user data...'}
          </Typography>
        </div>
      ) : (
        <div className="bookings">

          {/* Admin Analytics Dashboard */}
          {admin && analytics && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {commonStrings.BOOKING_MANAGEMENT_DASHBOARD || 'Booking Management Dashboard'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 auto', minWidth: '300px' }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {commonStrings.TOTAL_REVENUE || 'Total Revenue'}
                          </Typography>
                          <Typography variant="h6">
                            ${analytics.totalRevenue?.toLocaleString() || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ flex: '1 1 auto', minWidth: '300px' }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {commonStrings.TOTAL_BOOKINGS || 'Total Bookings'}
                          </Typography>
                          <Typography variant="h6">
                            {analytics.totalBookings || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ flex: '1 1 auto', minWidth: '300px' }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {commonStrings.AVG_BOOKING_VALUE || 'Avg. Booking Value'}
                          </Typography>
                          <Typography variant="h6">
                            ${analytics.averageBookingValue?.toFixed(2) || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
                <Box sx={{ flex: '1 1 auto', minWidth: '300px' }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AnalyticsIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography color="textSecondary" gutterBottom>
                            {commonStrings.AVAILABLE_DRESSES || 'Available Dresses'}
                          </Typography>
                          <Typography variant="h6">
                            {analytics.availableDresses || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}

          <div className="col-1">
            {/* Always show New Booking button in header */}
            <Button
              variant="contained"
              className="btn-primary cl-new-booking"
              size="small"
              onClick={() => navigate('/create-booking')}
              sx={{ mb: 2 }}
            >
              {strings.NEW_BOOKING}
            </Button>

            {leftPanel && (
              <>


                {admin && (
                  <SupplierFilter
                    suppliers={allSuppliers}
                    onChange={handleSupplierFilterChange}
                    className="cl-supplier-filter"
                  />
                )}
                <StatusFilter
                  onChange={handleStatusFilterChange}
                  className="cl-status-filter"
                />
                <BookingFilter
                  onSubmit={handleBookingFilterSubmit}
                  language={(user && user.language) || env.DEFAULT_LANGUAGE}
                  className="cl-booking-filter"
                  collapse={!env.isMobile}
                />
              </>
            )}
          </div>
          <div className="col-2">
            <BookingList
              containerClassName="bookings"
              offset={offset}
              language={user.language}
              loggedUser={user}
              suppliers={suppliers}
              statuses={statuses}
              filter={filter}
              loading={loadingSuppliers}
              hideDates={env.isMobile}
              checkboxSelection={!env.isMobile}

            />
          </div>

          {/* Floating Action Button for Quick Booking Creation */}
          {admin && (
            <Tooltip title={commonStrings.CREATE_NEW_BOOKING || 'Create New Booking'}>
              <Fab
                color="primary"
                aria-label="add booking"
                onClick={() => navigate('/create-booking')}
                id="new-booking-fab-btn"
                className="cl-new-booking"
                sx={{
                  position: 'fixed',
                  bottom: 16,
                  right: 16,
                  zIndex: 1000,
                }}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          )}
        </div>
      )}
    </Layout>
  )
}

export default Bookings
