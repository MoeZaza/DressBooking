import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box
 } from '@mui/material'
import { Straighten, CalendarToday } from '@mui/icons-material'
import { Dress as DressType } from ':bookcars-types'
import * as helper from '../common/helper'
import { strings } from '../lang/dresses'
import { useUserContext, UserContextType } from '../context/UserContext'
import SizeChart from './SizeChart'
import FittingAppointment from './FittingAppointment'
import ImageGallery from './ImageGallery'
import env from '../config/env.config'

// Default avatar utility function
const getDefaultDressImage = (dressName?: string, dressType?: string): string => {
  if (dressName) {
    // Generate a consistent color based on the name
    let hash = 0
    for (let i = 0; i < dressName.length; i++) {
      hash = dressName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    const backgroundColor = colors[Math.abs(hash) % colors.length]

    // Get initials
    const initials = dressName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')

    // Create SVG avatar
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
              text-anchor="middle" dominant-baseline="central" fill="white">
          ${initials}
        </text>
      </svg>
    `
    // Use encodeURIComponent for proper UTF-8 encoding instead of btoa
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  // Return type-specific default images
  const typeImages = {
    'Wedding': '/assets/img/default-wedding-dress.png',
    'Evening': '/assets/img/default-evening-dress.png',
    'Cocktail': '/assets/img/default-cocktail-dress.png',
    'Prom': '/assets/img/default-prom-dress.png'
  }

  return typeImages[dressType as keyof typeof typeImages] || '/assets/img/default-dress.png'
}

interface DressProps {
  dress: DressType
  hideSupplier?: boolean
  hidePrice?: boolean
  from?: Date
  to?: Date
  locationId?: string
}

const Dress: React.FC<DressProps> = ({
  dress,
  hideSupplier,
  hidePrice,
  from,
  to,
  locationId
}) => {
  const navigate = useNavigate()
  const { user } = useUserContext() as UserContextType
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [fittingAppointmentOpen, setFittingAppointmentOpen] = useState(false)

  // Check if current user is the supplier/owner of this dress
  const isOwner = user && helper.supplier(user) &&
    typeof dress.supplier === 'object' &&
    dress.supplier._id === user._id

  const handleRent = () => {
    if (from && to && locationId) {
      navigate(`/checkout?dr=${dress._id}&from=${from.getTime()}&to=${to.getTime()}&loc=${locationId}`)
    }
  }

  const handleView = () => {
    navigate(`/dress/${dress._id}`)
  }

  const handleFittingAppointment = () => {
    setFittingAppointmentOpen(true)
  }

  return (
    <Card className="dress-card">
      {dress.images && dress.images.length > 0 ? (
        <ImageGallery
          images={dress.images}
          alt={dress.name}
          maxHeight={200}
          showThumbnails={dress.images.length > 1}
          allowFullscreen={true}
        />
      ) : (
        <CardMedia
          component="img"
          height="200"
          image={getDefaultDressImage(dress.name, dress.type)}
          alt={dress.name}
        />
      )}
      <CardContent>
        <Typography variant="h5" component="div">
          {dress.name}
        </Typography>

        {!hideSupplier && dress.supplier && (
          <Typography variant="body2" color="text.secondary">
            {strings.SUPPLIER}: {typeof dress.supplier === 'object' ? dress.supplier.fullName : ''}
          </Typography>
        )}

        {/* Show dress code only to the owner/supplier */}
        {isOwner && dress.dressCode && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            {strings.DRESS_CODE || 'Dress Code'}: {dress.dressCode}
          </Typography>
        )}

        {/* Show rental count only to the owner/supplier */}
        {isOwner && dress.rentals !== undefined && dress.rentals > 0 && (
          <Typography variant="body2" color="text.secondary">
            {strings.RENTALS_COUNT || 'Rentals'}: {dress.rentals}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={helper.getDressTypeLabel(dress.type)}
            color="primary"
            size="small"
          />
          <Chip
            label={helper.getDressSizeLabel(dress.size)}
            color="secondary"
            size="small"
          />
          <Chip
            label={helper.getDressStyleLabel(dress.style)}
            variant="outlined"
            size="small"
          />
          <Chip
            label={dress.color}
            variant="outlined"
            size="small"
          />
        </Box>

        {!hidePrice && (
          <Typography variant="h6" color="text.primary" sx={{ mt: 2 }}>
            ${dress.price}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleView}
          >
            {strings.VIEW_DETAILS}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Straighten />}
            onClick={() => setSizeChartOpen(true)}
          >
            {strings.SIZE_CHART}
          </Button>
          {dress.fittingRequired && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarToday />}
              onClick={handleFittingAppointment}
            >
              {strings.BOOK_FITTING}
            </Button>
          )}
          {from && to && locationId && dress.available && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleRent}
            >
              {strings.RENT_NOW}
            </Button>
          )}
        </Box>

        {/* Size Chart Dialog */}
        <SizeChart
          open={sizeChartOpen}
          onClose={() => setSizeChartOpen(false)}
        />

        {/* Fitting Appointment Dialog */}
        <FittingAppointment
          open={fittingAppointmentOpen}
          onClose={() => setFittingAppointmentOpen(false)}
          dress={dress}
          supplier={typeof dress.supplier === 'object' ? dress.supplier._id : dress.supplier}
          location={typeof dress.supplier === 'object' ? dress.supplier.location : ''}
        />
      </CardContent>
    </Card>
  )
}

export default Dress
