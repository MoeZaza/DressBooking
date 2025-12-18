import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Stack
} from '@mui/material'
import {
  ThumbUp,
  ThumbUpOutlined,
  MoreVert,
  Report,
  Verified,
  FilterList
} from '@mui/icons-material'
import { format } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'
import * as ReviewService from '@/services/ReviewService'
import * as helper from '@/common/helper'
import { strings } from '@/lang/reviews'
import { strings as commonStrings } from '@/lang/common'

interface ReviewListProps {
  dressId: string
  user?: bookcarsTypes.User
  className?: string
}

const ReviewList: React.FC<ReviewListProps> = ({ dressId, user, className }) => {
  const [reviews, setReviews] = useState<bookcarsTypes.Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statistics, setStatistics] = useState<bookcarsTypes.ReviewStatistics>()
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder] = useState('desc')
  const [minRating, setMinRating] = useState<number | undefined>()
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  
  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedReview, setSelectedReview] = useState<bookcarsTypes.Review | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const result = await ReviewService.getDressReviews(dressId, {
        page,
        limit: 10,
        sortBy,
        sortOrder,
        minRating,
        verified: verifiedOnly || undefined
      })
      
      setReviews(result.reviews)
      setTotalPages(result.pagination.pages)
      setStatistics(result.statistics as bookcarsTypes.ReviewStatistics)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [dressId, page, sortBy, sortOrder, minRating, verifiedOnly])

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      helper.error('Please sign in to mark reviews as helpful')
      return
    }

    try {
      await ReviewService.markReviewHelpful(reviewId)
      fetchReviews() // Refresh to show updated helpful count
    } catch (err) {
      helper.error(err)
    }
  }

  const handleReport = async () => {
    if (!selectedReview || !user) {
      return
    }

    try {
      await ReviewService.reportReview(selectedReview._id!, reportReason)
      setReportDialogOpen(false)
      setReportReason('')
      setSelectedReview(null)
      helper.info('Review reported successfully')
    } catch (err) {
      helper.error(err)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, review: bookcarsTypes.Review) => {
    setAnchorEl(event.currentTarget)
    setSelectedReview(review)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedReview(null)
  }

  const openReportDialog = () => {
    setReportDialogOpen(true)
    handleMenuClose()
  }

  if (loading) {
    return <Box>Loading reviews...</Box>
  }

  return (
    <Box className={className}>
      {/* Statistics */}
      {statistics && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {strings.REVIEW_SUMMARY}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Rating value={statistics.averageRating} readOnly precision={0.1} />
              <Typography variant="h6">
                {statistics.averageRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({statistics.totalReviews} {strings.REVIEWS})
              </Typography>
            </Box>
            
            {/* Rating distribution */}
            <Stack spacing={1}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 20 }}>
                    {rating}★
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        bgcolor: 'primary.main',
                        width: `${statistics.totalReviews > 0
                          ? ((statistics.ratingDistribution as any)[rating] / statistics.totalReviews) * 100
                          : 0}%`
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {(statistics.ratingDistribution as any)[rating]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterList />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{strings.SORT_BY}</InputLabel>
              <Select
                value={sortBy}
                label={strings.SORT_BY}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="createdAt">{strings.NEWEST}</MenuItem>
                <MenuItem value="rating">{strings.RATING}</MenuItem>
                <MenuItem value="helpful">{strings.MOST_HELPFUL}</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{strings.MIN_RATING}</InputLabel>
              <Select
                value={minRating || ''}
                label={strings.MIN_RATING}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
              >
                <MenuItem value="">{strings.ALL}</MenuItem>
                <MenuItem value={5}>5 {strings.STARS}</MenuItem>
                <MenuItem value={4}>4+ {strings.STARS}</MenuItem>
                <MenuItem value={3}>3+ {strings.STARS}</MenuItem>
                <MenuItem value={2}>2+ {strings.STARS}</MenuItem>
                <MenuItem value={1}>1+ {strings.STARS}</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant={verifiedOnly ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Verified />}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
            >
              {strings.VERIFIED_ONLY}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {strings.NO_REVIEWS}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {typeof review.customer === 'object' 
                        ? review.customer.fullName?.charAt(0).toUpperCase()
                        : 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {typeof review.customer === 'object' ? review.customer.fullName : 'Anonymous'}
                        {review.verified && (
                          <Chip
                            icon={<Verified />}
                            label={strings.VERIFIED}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {review.createdAt && format(new Date(review.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {user && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, review)}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>

                {review.comment && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {review.comment}
                  </Typography>
                )}

                {review.photos && review.photos.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={review.helpful > 0 ? <ThumbUp /> : <ThumbUpOutlined />}
                    onClick={() => handleHelpful(review._id!)}
                    disabled={!user}
                  >
                    {strings.HELPFUL} ({review.helpful})
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={openReportDialog}>
          <Report sx={{ mr: 1 }} />
          {strings.REPORT_REVIEW}
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{strings.REPORT_REVIEW}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={strings.REASON}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            {commonStrings.CANCEL}
          </Button>
          <Button onClick={handleReport} variant="contained" disabled={!reportReason.trim()}>
            {strings.SUBMIT_REPORT}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ReviewList
