import React, { useState } from 'react'
import {
  Box,
  IconButton,
  Dialog,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  Typography,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Close,
  ZoomIn,
  ZoomOut,
  FullscreenExit,
  Fullscreen
} from '@mui/icons-material'
import * as helper from '../common/helper'
import env from '../config/env.config'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  maxHeight?: number
  showThumbnails?: boolean
  allowFullscreen?: boolean
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt = 'Gallery image',
  maxHeight = 400,
  showThumbnails = true,
  allowFullscreen = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: maxHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1,
          border: '2px dashed',
          borderColor: 'grey.300'
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '48px', opacity: 0.3, mb: 2 }}>
          📷
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No images available
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
          Images will be displayed here when available
        </Typography>
      </Box>
    )
  }

  const currentImage = images[currentIndex]
  const imageUrl = helper.joinURL(env.CDN_DRESSES, currentImage)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleImageClick = () => {
    if (allowFullscreen) {
      setLightboxOpen(true)
      setZoom(1)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Box>
      {/* Main Image Display */}
      <Box sx={{ position: 'relative', mb: showThumbnails ? 2 : 0 }}>
        <Card>
          <CardMedia
            component="img"
            image={imageUrl}
            alt={`${alt} ${currentIndex + 1}`}
            sx={{
              width: '100%',
              height: maxHeight,
              objectFit: 'cover',
              cursor: allowFullscreen ? 'pointer' : 'default'
            }}
            onClick={handleImageClick}
          />
          
          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
              <IconButton
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
                onClick={handlePrevious}
              >
                <ChevronLeft />
              </IconButton>
              
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
                onClick={handleNext}
              >
                <ChevronRight />
              </IconButton>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem'
              }}
            >
              {currentIndex + 1} / {images.length}
            </Box>
          )}
        </Card>
      </Box>

      {/* Thumbnail Navigation */}
      {showThumbnails && images.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {images.map((image, index) => (
            <Box key={index} sx={{ flex: '0 0 auto', width: { xs: 'calc(25% - 6px)', sm: 'calc(16.66% - 6px)', md: 'calc(12.5% - 6px)' } }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: index === currentIndex ? 2 : 0,
                  borderColor: 'primary.main',
                  opacity: index === currentIndex ? 1 : 0.7,
                  '&:hover': {
                    opacity: 1
                  }
                }}
                onClick={() => handleThumbnailClick(index)}
              >
                <CardMedia
                  component="img"
                  image={helper.joinURL(env.CDN_DRESSES, image)}
                  alt={`${alt} thumbnail ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: 60,
                    objectFit: 'cover'
                  }}
                />
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Lightbox Dialog */}
      {allowFullscreen && (
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          maxWidth={false}
          fullScreen={isFullscreen}
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              margin: isFullscreen ? 0 : 2
            }
          }}
        >
          <DialogContent
            sx={{
              p: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: isFullscreen ? '100vh' : '80vh'
            }}
          >
            {/* Close button */}
            <IconButton
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                zIndex: 1
              }}
              onClick={() => setLightboxOpen(false)}
            >
              <Close />
            </IconButton>

            {/* Zoom controls */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                zIndex: 1
              }}
            >
              <Fab
                size="small"
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                onClick={handleZoomIn}
              >
                <ZoomIn />
              </Fab>
              <Fab
                size="small"
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                onClick={handleZoomOut}
              >
                <ZoomOut />
              </Fab>
              <Fab
                size="small"
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </Fab>
            </Box>

            {/* Main lightbox image */}
            <img
              src={imageUrl}
              alt={`${alt} ${currentIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease',
                objectFit: 'contain'
              }}
            />

            {/* Navigation in lightbox */}
            {images.length > 1 && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                  onClick={handlePrevious}
                >
                  <ChevronLeft />
                </IconButton>
                
                <IconButton
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                  onClick={handleNext}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}

export default ImageGallery
