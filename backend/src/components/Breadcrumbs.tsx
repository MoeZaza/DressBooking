import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  Chip,
} from '@mui/material'
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  Checkroom as DressIcon,
  People as UsersIcon,
  CorporateFare as SuppliersIcon,
  LocationOn as LocationsIcon,
  CalendarMonth as SchedulerIcon,
  EventAvailable as FittingIcon,
  Settings as SettingsIcon,
  Assessment as AnalyticsIcon,
  Inventory as InventoryIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountingIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'

interface BreadcrumbItem {
  label: string
  path: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[]
  showHome?: boolean
  maxItems?: number
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  customItems,
  showHome = true,
  maxItems = 8,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  // Route to breadcrumb mapping
  const routeMap: Record<string, BreadcrumbItem> = {
    '/': { label: headerStrings.DASHBOARD || 'Dashboard', path: '/', icon: <DashboardIcon /> },
    '/dashboard': { label: headerStrings.DASHBOARD || 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    '/admin-dashboard': { label: headerStrings.ADMIN_DASHBOARD || 'Admin Dashboard', path: '/admin-dashboard', icon: <DashboardIcon /> },
    '/bookings': { label: headerStrings.BOOKINGS || 'Bookings', path: '/bookings', icon: <DashboardIcon /> },
    '/create-booking': { label: commonStrings.CREATE || 'Create', path: '/create-booking', icon: <DashboardIcon /> },
    '/dresses': { label: headerStrings.DRESSES || 'Dresses', path: '/dresses', icon: <DressIcon /> },
    '/create-dress': { label: commonStrings.CREATE || 'Create', path: '/create-dress', icon: <DressIcon /> },
    '/update-dress': { label: commonStrings.UPDATE || 'Update', path: '/update-dress', icon: <DressIcon /> },
    '/dress': { label: commonStrings.VIEW || 'View', path: '/dress', icon: <DressIcon /> },
    '/users': { label: headerStrings.USERS || 'Users', path: '/users', icon: <UsersIcon /> },
    '/create-user': { label: commonStrings.CREATE || 'Create', path: '/create-user', icon: <UsersIcon /> },
    '/update-user': { label: commonStrings.UPDATE || 'Update', path: '/update-user', icon: <UsersIcon /> },
    '/suppliers': { label: headerStrings.COMPANIES || 'Suppliers', path: '/suppliers', icon: <SuppliersIcon /> },
    '/create-supplier': { label: commonStrings.CREATE || 'Create', path: '/create-supplier', icon: <SuppliersIcon /> },
    '/update-supplier': { label: commonStrings.UPDATE || 'Update', path: '/update-supplier', icon: <SuppliersIcon /> },
    '/supplier': { label: commonStrings.VIEW || 'View', path: '/supplier', icon: <SuppliersIcon /> },
    '/locations': { label: headerStrings.LOCATIONS || 'Locations', path: '/locations', icon: <LocationsIcon /> },
    '/create-location': { label: commonStrings.CREATE || 'Create', path: '/create-location', icon: <LocationsIcon /> },
    '/update-location': { label: commonStrings.UPDATE || 'Update', path: '/update-location', icon: <LocationsIcon /> },
    '/scheduler': { label: headerStrings.SCHEDULER || 'Scheduler', path: '/scheduler', icon: <SchedulerIcon /> },
    '/fitting-appointments': { label: headerStrings.FITTING_APPOINTMENTS || 'Fitting Appointments', path: '/fitting-appointments', icon: <FittingIcon /> },
    '/settings': { label: headerStrings.SETTINGS || 'Settings', path: '/settings', icon: <SettingsIcon /> },
    '/profile': { label: headerStrings.PROFILE || 'Profile', path: '/profile', icon: <UsersIcon /> },
    '/analytics-dashboard': { label: headerStrings.ANALYTICS_DASHBOARD || 'Analytics', path: '/analytics-dashboard', icon: <AnalyticsIcon /> },
    '/inventory-management': { label: headerStrings.INVENTORY_MANAGEMENT || 'Inventory', path: '/inventory-management', icon: <InventoryIcon /> },
    '/payment-management': { label: headerStrings.PAYMENT_MANAGEMENT || 'Payments', path: '/payment-management', icon: <PaymentIcon /> },
    '/accounting-dashboard': { label: headerStrings.ACCOUNTING_DASHBOARD || 'Accounting', path: '/accounting-dashboard', icon: <AccountingIcon /> },
    '/business-intelligence': { label: headerStrings.BUSINESS_INTELLIGENCE || 'Business Intelligence', path: '/business-intelligence', icon: <BusinessIcon /> },
    '/dress-search': { label: headerStrings.DRESS_SEARCH_ANALYTICS || 'Dress Search', path: '/dress-search', icon: <SearchIcon /> },
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems
    }

    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Add home if requested
    if (showHome && location.pathname !== '/') {
      breadcrumbs.push({
        label: commonStrings.HOME || 'Home',
        path: '/',
        icon: <HomeIcon />,
      })
    }

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      
      const routeInfo = routeMap[currentPath]
      if (routeInfo) {
        breadcrumbs.push(routeInfo)
      } else {
        // Fallback for unknown routes
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        breadcrumbs.push({
          label,
          path: currentPath,
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  // Limit breadcrumbs if too many
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        breadcrumbItems[0],
        { label: '...', path: '', icon: null },
        ...breadcrumbItems.slice(-2)
      ]
    : breadcrumbItems

  const handleClick = (path: string) => {
    if (path && path !== location.pathname) {
      navigate(path)
    }
  }

  if (breadcrumbItems.length <= 1) {
    return null // Don't show breadcrumbs for single items
  }

  return (
    <Box 
      sx={{ 
        mb: 2, 
        px: 2, 
        py: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            transform: isRTL ? 'rotate(180deg)' : 'none',
          },
        }}
      >
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isEllipsis = item.label === '...'

          if (isEllipsis) {
            return (
              <Typography key="ellipsis" color="text.secondary">
                ...
              </Typography>
            )
          }

          return isLast ? (
            <Chip
              key={item.path}
              icon={item.icon as React.ReactElement}
              label={item.label}
              size="small"
              color="primary"
              variant="filled"
            />
          ) : (
            <Link
              key={item.path}
              component="button"
              variant="body2"
              onClick={() => handleClick(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
}

export default Breadcrumbs
