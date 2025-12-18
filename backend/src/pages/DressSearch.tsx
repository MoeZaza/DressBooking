import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import DressSearchForm from '@/components/DressSearchForm'


import '@/assets/css/dress-search.css'

const DressSearch: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [visible, setVisible] = useState(false)
  const [selectedDress, setSelectedDress] = useState<bookcarsTypes.Dress | null>(null)

  const handleDressSelect = (dress: bookcarsTypes.Dress) => {
    setSelectedDress(dress)
  }

  const handleViewDress = () => {
    if (selectedDress) {
      navigate(`/dress?d=${selectedDress._id}`)
    }
  }

  const handleEditDress = () => {
    if (selectedDress) {
      navigate(`/update-dress?dr=${selectedDress._id}`)
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setUser(user)
      setVisible(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && (
        <div className="dress-search">
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dresses')}
            >
              Back to Dresses
            </Button>
            <Typography variant="h4" component="h1">
              Dress Search & Analytics
            </Typography>
          </Box>

          <DressSearchForm onDressSelect={handleDressSelect} />

          {selectedDress && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions for &quot;{selectedDress.name}&quot;
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleViewDress}
                >
                  View Details
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleEditDress}
                >
                  Edit Dress
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/create-booking?dress=${selectedDress._id}`)}
                >
                  Create Booking
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              How to Use Dress Search & Analytics
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Search by Dress Code:</strong> Enter a specific dress code to find exact matches
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Search by Name:</strong> Enter part of a dress name to find similar dresses
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Analytics:</strong> View comprehensive analytics including booking history, revenue, cancellations, and fitting appointments
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Booking History:</strong> See detailed booking history with customer information and status
            </Typography>
            <Typography variant="body2">
              • <strong>Performance Metrics:</strong> Track dress performance with rental counts, popular seasons, and revenue data
            </Typography>
          </Box>
        </div>
      )}
    </Layout>
  )
}

export default DressSearch
