import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
 } from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ImageGallery from '../components/ImageGallery'
import * as DressService from '../services/DressService'
import * as helper from '../common/helper'
import { strings } from '../lang/dresses'
import { strings as commonStrings } from '../lang/common'
import DressAnalytics from '../components/DressAnalytics'
import BookingList from '../components/BookingList'
import FittingAppointment from '../components/FittingAppointment'
import env from '../config/env.config'

const Dress: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [dress, setDress] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [canDelete, setCanDelete] = useState(false)

  // Fitting appointment state
  const [openFittingDialog, setOpenFittingDialog] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('dr')
    
    if (!id) {
      navigate('/dresses')
      return
    }

    const currentUser = helper.getUser()
    setUser(currentUser)

    const fetchDress = async () => {
      try {
        const result = await DressService.getDress(id)
        setDress(result.data)
        
        // Check if the dress can be deleted (no bookings)
        // This would require a backend endpoint to check
        setCanDelete(true)
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dress:', error)
        navigate('/dresses')
      }
    }

    fetchDress()
    
    // Set up booking list filters (only if user is logged in)
    if (currentUser) {
      setSuppliers(currentUser.type === 'admin' ? [] : [currentUser._id || ''])
      setStatuses(helper.getBookingStatuses().map(status => status.value))
    } else {
      // For non-authenticated users, show all suppliers
      setSuppliers([])
      setStatuses(helper.getBookingStatuses().map(status => status.value))
    }
  }, [location.search, navigate])

  const handleEdit = () => {
    navigate(`/update-dress?dr=${dress._id}`)
  }

  const handleDelete = () => {
    setOpenDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await DressService.deleteDress(dress._id)
      setOpenDialog(false)
      navigate('/dresses')
    } catch (error) {
      console.error('Error deleting dress:', error)
      setOpenDialog(false)
    }
  }

  const handleFittingAppointment = () => {
    setOpenFittingDialog(true)
  }

  if (loading) {
    return <Layout><div className="progress-container"><progress /></div></Layout>
  }

  const isAdmin = helper.admin(user)
  const canEdit = isAdmin || (user && dress && dress.supplier && user._id === dress.supplier._id)

  return (
    <Layout>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
              {dress.images && dress.images.length > 0 ? (
                <ImageGallery
                  images={dress.images}
                  alt={dress.name}
                  maxHeight={400}
                  showThumbnails={dress.images.length > 1}
                  allowFullscreen={true}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 400,
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
                  <Typography variant="h1" sx={{ fontSize: '64px', opacity: 0.3, mb: 2 }}>
                    👗
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    No images available for this dress
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h4" gutterBottom>
                  {dress.name}
                </Typography>
                {canEdit && (
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      sx={{ mr: 1 }}
                    >
                      {commonStrings.UPDATE}
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                      >
                        {commonStrings.DELETE}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={dress.available ? <CheckCircleIcon /> : <CancelIcon />}
                  color={dress.available ? 'success' : 'error'}
                  label={dress.available ? strings.AVAILABLE : strings.UNAVAILABLE}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={strings[`${dress.type.toUpperCase()}`] || dress.type}
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={strings[`SIZE_${dress.size}`] || dress.size}
                  color="secondary"
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={strings[`STYLE_${dress.style.toUpperCase()}`] || dress.style}
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              </Box>

              <Typography variant="body1" gutterBottom>
                <strong>{strings.COLOR}:</strong> {dress.color}
              </Typography>
              
              {dress.material && (
                <Typography variant="body1" gutterBottom>
                  <strong>{strings.MATERIAL}:</strong> {strings[dress.material.toUpperCase()] || dress.material}
                </Typography>
              )}
              
              <Typography variant="body1" gutterBottom>
                <strong>{strings.PRICE}:</strong> ${dress.price} / {strings.DAY}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>{strings.DEPOSIT}:</strong> ${dress.deposit}
              </Typography>

              {/* Show rental count only to owner/admin */}
              {canEdit && dress.rentals !== undefined && (
                <Typography variant="body1" gutterBottom>
                  <strong>{strings.RENTALS_COUNT}:</strong> {dress.rentals}
                </Typography>
              )}

              {/* Book Fitting Button for customers */}
              {!canEdit && dress.available && user && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EventIcon />}
                    onClick={handleFittingAppointment}
                    size="large"
                  >
                    {strings.BOOK_FITTING || 'Book Fitting Appointment'}
                  </Button>
                </Box>
              )}
              
              {dress.supplier && (
                <Typography variant="body1" gutterBottom>
                  <strong>{commonStrings.SUPPLIER}:</strong> {typeof dress.supplier === 'object' ? dress.supplier.fullName : dress.supplier}
                </Typography>
              )}
              
              {dress.locations && dress.locations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{strings.LOCATIONS}:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dress.locations.map((location: any) => (
                      <Chip
                        key={location._id}
                        label={location.name}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Show analytics only to dress owner/admin */}
        <DressAnalytics dress={dress} isOwner={canEdit} />

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          {commonStrings.BOOKINGS}
        </Typography>
        
        <BookingList
          user={user}
          suppliers={suppliers}
          statuses={statuses}
          dress={dress._id}
          hideDressColumn
        />

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
        >
          <DialogTitle>{commonStrings.CONFIRM_DELETE}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {strings.DELETE_DRESS}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
              {commonStrings.CANCEL}
            </Button>
            <Button onClick={confirmDelete} color="error" autoFocus>
              {commonStrings.DELETE}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Fitting Appointment Dialog */}
        <FittingAppointment
          open={openFittingDialog}
          onClose={() => setOpenFittingDialog(false)}
          dress={dress}
          supplier={typeof dress?.supplier === 'object' ? dress.supplier._id : dress?.supplier}
          location={typeof dress?.supplier === 'object' ? dress.supplier.location : ''}
        />
      </Container>
    </Layout>
  )
}

export default Dress
