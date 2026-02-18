import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Avatar as MuiAvatar,
  Chip,

  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Badge as RoleIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { fr as dfnsFR, enUS as dfnsENUS, ar as dfnsAR } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import Avatar from '@/components/Avatar'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import { useUserContext, UserContextType } from '@/context/UserContext'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'

import '@/assets/css/profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const { user } = useUserContext() as UserContextType

  const [visible, setVisible] = useState(false)
  const [profileUser, setProfileUser] = useState<bookcarsTypes.User>()
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalDresses: 0,
    activeBookings: 0,
  })

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
      setProfileUser(user)
      loadUserStats()
      setVisible(true)
    }
  }, [user])

  const loadUserStats = async () => {
    // Create new AbortController for this fetch
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (user) {
        // Load user statistics based on role
        if (user.type === bookcarsTypes.UserType.Supplier || user.type === bookcarsTypes.UserType.Admin) {
          // Load supplier/admin stats from API
          const response = await fetch('/api/analytics/dashboard', {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (isMountedRef.current) {
              setStats({
                totalBookings: data.totalBookings || 0,
                totalRevenue: data.totalRevenue || 0,
                totalDresses: data.totalDresses || 0,
                activeBookings: data.activeBookings || 0,
              })
            }
          } else {
            // Fallback to zero stats on error
            if (isMountedRef.current) {
              setStats({
                totalBookings: 0,
                totalRevenue: 0,
                totalDresses: 0,
                activeBookings: 0,
              })
            }
          }
        } else {
          // Load customer stats (their bookings)
          const response = await fetch('/api/bookings/user-stats', {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (isMountedRef.current) {
              setStats({
                totalBookings: data.totalBookings || 0,
                totalRevenue: data.totalSpent || 0,
                totalDresses: 0,
                activeBookings: data.activeBookings || 0,
              })
            }
          } else {
            if (isMountedRef.current) {
              setStats({
                totalBookings: 0,
                totalRevenue: 0,
                totalDresses: 0,
                activeBookings: 0,
              })
            }
          }
        }
      }
    } catch (err) {
      // Don't show error if request was aborted (component unmounted)
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        return
      }

      console.error('Error loading user stats:', err)
      // Set default stats on error
      setStats({
        totalBookings: 0,
        totalRevenue: 0,
        totalDresses: 0,
        activeBookings: 0,
      })
    }
  }

  const getDateLocale = () => {
    switch (language) {
      case 'fr':
        return dfnsFR
      case 'ar':
        return dfnsAR
      default:
        return dfnsENUS
    }
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP', { locale: getDateLocale() })
  }

  const onLoad = () => {
    setVisible(true)
  }

  if (!user) {
    return null
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && profileUser && (
        <div className="profile">

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Profile Information Card */}
            <Box sx={{ flex: { xs: '1', md: '0 0 33%' } }}>
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}>
                    <Avatar
                      record={profileUser}
                      type={profileUser.type}
                      size="large"
                      readonly
                    />
                  </Box>
                  
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {profileUser.fullName}
                  </Typography>
                  
                  <Chip
                    icon={<RoleIcon />}
                    label={helper.getUserType(profileUser.type as bookcarsTypes.UserType)}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {profileUser.bio || 'No bio available'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={profileUser.email}
                        secondary="Email"
                      />
                    </ListItem>
                    
                    {profileUser.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={profileUser.phone}
                          secondary="Phone"
                        />
                      </ListItem>
                    )}
                    
                    {profileUser.location && (
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={profileUser.location}
                          secondary="Location"
                        />
                      </ListItem>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={formatDate(new Date())}
                        secondary="Member Since"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>

            {/* Statistics Cards */}
            <Box sx={{ flex: { xs: '1', md: '0 0 67%' } }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 22%' } }}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {stats.totalBookings}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Bookings
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 22%' } }}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        ${stats.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {profileUser.type !== bookcarsTypes.UserType.User && (
                  <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 22%' } }}>
                    <Card elevation={2}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main" fontWeight="bold">
                          {stats.totalDresses}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Dresses
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 22%' } }}>
                  <Card elevation={2}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {stats.activeBookings}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Bookings
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Quick Actions */}
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => navigate('/settings')}
                      >
                        Account Settings
                      </Button>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => navigate('/bookings')}
                      >
                        View Bookings
                      </Button>
                    </Box>
                    {profileUser.type !== bookcarsTypes.UserType.User && (
                      <>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => navigate('/dresses')}
                          >
                            Manage Dresses
                          </Button>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => navigate('/analytics-dashboard')}
                          >
                            View Analytics
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </div>
      )}
    </Layout>
  )
}

export default Profile
