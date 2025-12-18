import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  PhotoCamera,
  Delete,
  Close
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as bookcarsTypes from ':bookcars-types'
import * as ReviewService from '@/services/ReviewService'
import * as helper from '@/common/helper'
import { strings } from '@/lang/reviews'
import { strings as commonStrings } from '@/lang/common'

const schema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  comment: z.string().optional(),
  photos: z.array(z.string()).optional()
})

type FormFields = z.infer<typeof schema>

interface ReviewFormProps {
  booking: bookcarsTypes.Booking
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

const ReviewForm: React.FC<ReviewFormProps> = ({ booking, onSuccess, onCancel, className }) => {
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: 0,
      comment: '',
      photos: []
    }
  })

  const rating = watch('rating')

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) {
      return
    }

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setPhotos(prev => [...prev, result])
          setValue('photos', [...photos, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setValue('photos', newPhotos)
  }

  const onSubmit = async (data: FormFields) => {
    try {
      setLoading(true)
      
      const reviewData: bookcarsTypes.CreateReviewPayload = {
        bookingId: booking._id!,
        rating: data.rating,
        comment: data.comment,
        photos: data.photos
      }

      await ReviewService.createReview(reviewData)
      helper.info(strings.REVIEW_CREATED_SUCCESS)
      onSuccess?.()
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRatingLabel = (value: number) => {
    const labels = {
      1: strings.RATING_POOR,
      2: strings.RATING_FAIR,
      3: strings.RATING_GOOD,
      4: strings.RATING_VERY_GOOD,
      5: strings.RATING_EXCELLENT
    }
    return labels[value as keyof typeof labels] || ''
  }

  return (
    <Card className={className}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {strings.WRITE_REVIEW}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {strings.REVIEW_FOR_DRESS}: {typeof booking.dress === 'object' ? booking.dress.name : ''}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Rating */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {strings.RATING} *
            </Typography>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <Box>
                  <Rating
                    {...field}
                    size="large"
                    onChange={(_, value) => field.onChange(value || 0)}
                  />
                  {rating > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {getRatingLabel(rating)}
                    </Typography>
                  )}
                </Box>
              )}
            />
            {errors.rating && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errors.rating.message}
              </Typography>
            )}
          </Box>

          {/* Comment */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label={strings.COMMENT}
                  placeholder={strings.COMMENT_PLACEHOLDER}
                  error={!!errors.comment}
                  helperText={errors.comment?.message}
                />
              )}
            />
          </Box>

          {/* Photos */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {strings.PHOTOS} ({strings.OPTIONAL})
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                multiple
                type="file"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  disabled={photos.length >= 5}
                >
                  {strings.ADD_PHOTOS}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                {strings.MAX_PHOTOS}: 5
              </Typography>
            </Box>

            {photos.length > 0 && (
              <ImageList cols={3} rowHeight={120} sx={{ maxHeight: 250 }}>
                {photos.map((photo, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedPhoto(photo)
                        setPhotoDialogOpen(true)
                      }}
                    />
                    <ImageListItemBar
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                          onClick={() => removePhoto(index)}
                        >
                          <Delete />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>

          {/* Guidelines */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {strings.REVIEW_GUIDELINES}
            </Typography>
          </Alert>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button onClick={onCancel} disabled={loading}>
                {commonStrings.CANCEL}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading || rating === 0}
            >
              {loading ? strings.SUBMITTING : strings.SUBMIT_REVIEW}
            </Button>
          </Box>
        </form>
      </CardContent>

      {/* Photo Preview Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {strings.PHOTO_PREVIEW}
            <IconButton onClick={() => setPhotoDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default ReviewForm
