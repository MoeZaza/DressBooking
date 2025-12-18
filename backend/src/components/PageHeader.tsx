import React from 'react'
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
} from '@mui/material'
import { useLanguage } from '@/context/LanguageContext'
import Breadcrumbs from './Breadcrumbs'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  showBreadcrumbs?: boolean
  breadcrumbItems?: Array<{
    label: string
    path: string
    icon?: React.ReactNode
  }>
  icon?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  actions,
  showBreadcrumbs = true,
  breadcrumbItems,
  icon,
}) => {
  const { language, isRTL } = useLanguage()

  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <Breadcrumbs customItems={breadcrumbItems} />
      )}

      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Title Section */}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            {icon}
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              color="text.primary"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {title}
            </Typography>
          </Stack>

          {subtitle && (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 1,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {subtitle}
            </Typography>
          )}

          {description && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: '600px',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* Actions Section */}
        {actions && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              alignItems: { xs: 'stretch', sm: 'center' },
              minWidth: { xs: '100%', sm: 'auto' },
            }}
          >
            {actions}
          </Box>
        )}
      </Box>

      {/* Divider */}
      <Divider sx={{ mb: 2 }} />
    </Box>
  )
}

export default PageHeader
