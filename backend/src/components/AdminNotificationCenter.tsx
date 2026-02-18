import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Notifications,
  NotificationsActive,
  MarkEmailRead,
  Delete,
  Refresh,
  Settings,
  BookOnline,
  Payment,
  RateReview,
  Warning,
  Info,
  CheckCircle,
  Error,
  Close
} from '@mui/icons-material'
import { format } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'
import * as AdminNotificationService from '@/services/AdminNotificationService'
import * as helper from '@/common/helper'
import { strings as commonStrings } from '@/lang/common'

interface AdminNotificationCenterProps {
  user?: bookcarsTypes.User
  className?: string
}

const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({ user, className }) => {
  const [notifications, setNotifications] = useState<bookcarsTypes.Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const result = await AdminNotificationService.getAdminNotifications(user._id, {
        page: 1,
        limit: 20,
        type: filterType === 'all' ? undefined : filterType
      })
      
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?._id, filterType])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchNotifications, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchNotifications])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await AdminNotificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      helper.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?._id) return

    try {
      await AdminNotificationService.markAllAsRead(user._id)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      handleMenuClose()
    } catch (err) {
      helper.error(err)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await AdminNotificationService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      if (!notifications.find(n => n._id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const getNotificationIcon = (type: string, category: string) => {
    const iconProps = { fontSize: 'small' as const }
    
    switch (type) {
      case 'booking':
        return <BookOnline {...iconProps} />
      case 'payment':
        return <Payment {...iconProps} />
      case 'review':
        return <RateReview {...iconProps} />
      default:
        switch (category) {
          case 'success':
            return <CheckCircle {...iconProps} color="success" />
          case 'warning':
            return <Warning {...iconProps} color="warning" />
          case 'error':
            return <Error {...iconProps} color="error" />
          default:
            return <Info {...iconProps} color="info" />
        }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      default: return 'default'
    }
  }

  return (
    <Box className={className}>
      {/* Notification Bell */}
      <Tooltip title={commonStrings.ADMIN_NOTIFICATIONS}>
        <IconButton onClick={handleMenuOpen} color="inherit">
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Admin Notifications ({unreadCount} unread)
            </Typography>
            <Box>
              <Tooltip title={commonStrings.REFRESH}>
                <IconButton size="small" onClick={fetchNotifications} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title={commonStrings.OPTIONS}>
                <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Filter */}
          <FormControl size="small" sx={{ mt: 1, minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterType}
              label="Filter"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="booking">Bookings</MenuItem>
              <MenuItem value="payment">Payments</MenuItem>
              <MenuItem value="review">Reviews</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Actions */}
        {unreadCount > 0 && (
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              fullWidth
            >
              Mark All as Read
            </Button>
          </Box>
        )}

        {/* Notifications List */}
        <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {getNotificationIcon(notification.type || 'system', notification.category || 'info')}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          {notification.title || notification.message}
                        </Typography>
                        <Chip
                          label={notification.priority || 'medium'}
                          size="small"
                          color={getPriorityColor(notification.priority || 'medium') as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {notification.title && (
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {notification.createdAt && format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {!notification.isRead && (
                      <Tooltip title={commonStrings.MARK_AS_READ}>
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification._id!)}
                        >
                          <MarkEmailRead fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={commonStrings.DELETE}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteNotification(notification._id!)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>

        {/* View All Button */}
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button fullWidth onClick={() => window.open('/admin/notifications', '_blank')}>
            {commonStrings.VIEW_ALL_NOTIFICATIONS}
          </Button>
        </Box>
      </Menu>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {commonStrings.NOTIFICATION_SETTINGS}
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setSettingsOpen(false)}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto-refresh notifications"
            />
            
            {autoRefresh && (
              <FormControl fullWidth>
                <InputLabel>Refresh Interval</InputLabel>
                <Select
                  value={refreshInterval}
                  label="Refresh Interval"
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  <MenuItem value={10000}>10 seconds</MenuItem>
                  <MenuItem value={30000}>30 seconds</MenuItem>
                  <MenuItem value={60000}>1 minute</MenuItem>
                  <MenuItem value={300000}>5 minutes</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminNotificationCenter
