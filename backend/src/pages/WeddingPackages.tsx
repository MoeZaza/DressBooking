import React, { useState, useEffect } from 'react'
import {   Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
 } from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Star,
  LocalOffer,
  Event,
  Group,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'

interface WeddingPackage {
  _id: string
  name: string
  description: string
  type: 'bridal' | 'bridesmaid' | 'mother-of-bride' | 'complete-wedding'
  dresses: Array<{
    dressId: string
    dressName: string
    role: string
    included: boolean
  }>
  services: Array<{
    service: string
    included: boolean
    additionalCost?: number
  }>
  pricing: {
    basePrice: number
    discountPercentage: number
    finalPrice: number
    depositRequired: number
  }
  duration: {
    startDate: Date
    endDate: Date
    fittingSchedule: Array<{
      date: Date
      type: string
      duration: number
    }>
  }
  terms: {
    cancellationPolicy: string
    alterationPolicy: string
    damagePolicy: string
  }
  isActive: boolean
  popularity: number
  bookingsCount: number
}

const WeddingPackages: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [packages, setPackages] = useState<WeddingPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPackage, setEditingPackage] = useState<WeddingPackage | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'bridal' as 'bridal' | 'bridesmaid' | 'mother-of-bride' | 'complete-wedding',
    basePrice: 0,
    discountPercentage: 0,
    depositRequired: 0,
    cancellationPolicy: '',
    alterationPolicy: '',
    damagePolicy: '',
    isActive: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      fetchPackages()
    }
  }, [user])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)

      // Fetch real wedding packages from API
      const response = await fetch('/api/wedding-packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const packagesData = await response.json()
        setPackages(packagesData)
      } else {
        // Fallback to mock data if API not implemented yet
        throw new Error('API not available')
      }
    } catch (err: any) {
      console.error('Error fetching packages:', err)

      let errorMessage = 'Failed to load wedding packages'
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setPackages([]) // Set empty array instead of mock data
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = () => {
    setEditingPackage(null)
    setFormData({
      name: '',
      description: '',
      type: 'bridal',
      basePrice: 0,
      discountPercentage: 0,
      depositRequired: 0,
      cancellationPolicy: '',
      alterationPolicy: '',
      damagePolicy: '',
      isActive: true,
    })
    setOpenDialog(true)
  }

  const handleEditPackage = (pkg: WeddingPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description,
      type: pkg.type,
      basePrice: pkg.pricing.basePrice,
      discountPercentage: pkg.pricing.discountPercentage,
      depositRequired: pkg.pricing.depositRequired,
      cancellationPolicy: pkg.terms.cancellationPolicy,
      alterationPolicy: pkg.terms.alterationPolicy,
      damagePolicy: pkg.terms.damagePolicy,
      isActive: pkg.isActive,
    })
    setOpenDialog(true)
  }

  const handleSavePackage = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Package name is required')
      return
    }

    if (!formData.description.trim()) {
      setError('Package description is required')
      return
    }

    if (formData.basePrice <= 0) {
      setError('Base price must be greater than 0')
      return
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      setError('Discount percentage must be between 0 and 100')
      return
    }

    if (formData.depositRequired < 0) {
      setError('Deposit amount cannot be negative')
      return
    }

    if (formData.depositRequired > formData.basePrice) {
      setError('Deposit cannot exceed base price')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Calculate final price
      const finalPrice = formData.basePrice * (1 - formData.discountPercentage / 100)

      const packageData = {
        ...formData,
        pricing: {
          basePrice: formData.basePrice,
          discountPercentage: formData.discountPercentage,
          finalPrice,
          depositRequired: formData.depositRequired,
        },
        terms: {
          cancellationPolicy: formData.cancellationPolicy,
          alterationPolicy: formData.alterationPolicy,
          damagePolicy: formData.damagePolicy,
        },
      }

      if (editingPackage) {
        // Update existing package via API
        const response = await fetch(`/api/wedding-packages/${editingPackage._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(packageData),
        })

        if (response.ok) {
          const updatedPackage = await response.json()
          const updatedPackages = packages.map(pkg =>
            pkg._id === editingPackage._id ? updatedPackage : pkg
          )
          setPackages(updatedPackages)
          setSuccess('Package updated successfully!')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update package')
        }
      } else {
        // Create new package via API
        const response = await fetch('/api/wedding-packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(packageData),
        })

        if (response.ok) {
          const newPackage = await response.json()
          setPackages([...packages, newPackage])
          setSuccess('Package created successfully!')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create package')
        }
      }

      setOpenDialog(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error saving package:', err)

      let errorMessage = 'Failed to save package'
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        setLoading(true)

        const response = await fetch(`/api/wedding-packages/${packageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          setPackages(packages.filter(pkg => pkg._id !== packageId))
          setSuccess('Package deleted successfully!')
          setTimeout(() => setSuccess(''), 3000)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete package')
        }
      } catch (err: any) {
        console.error('Error deleting package:', err)

        let errorMessage = 'Failed to delete package'
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (err.message) {
          errorMessage = err.message
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complete-wedding': return 'primary'
      case 'bridal': return 'secondary'
      case 'bridesmaid': return 'info'
      case 'mother-of-bride': return 'warning'
      default: return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'complete-wedding': return 'Complete Wedding'
      case 'bridal': return 'Bridal'
      case 'bridesmaid': return 'Bridesmaid'
      case 'mother-of-bride': return 'Mother of Bride'
      default: return type
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {strings.WEDDING_PACKAGES || 'Wedding Packages'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePackage}
          >
            {strings.CREATE_PACKAGE || 'Create Package'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Packages Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 3 }}>
          {packages.map((pkg) => (
            <Card key={pkg._id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {pkg.name}
                    </Typography>
                    <Chip 
                      label={getTypeLabel(pkg.type)} 
                      color={getTypeColor(pkg.type) as any}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditPackage(pkg)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeletePackage(pkg._id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {pkg.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" color="primary">
                      ${pkg.pricing.finalPrice}
                    </Typography>
                    {pkg.pricing.discountPercentage > 0 && (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                        ${pkg.pricing.basePrice}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Deposit: ${pkg.pricing.depositRequired}
                    </Typography>
                    {pkg.pricing.discountPercentage > 0 && (
                      <Chip 
                        label={`${pkg.pricing.discountPercentage}% OFF`}
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star color="warning" fontSize="small" />
                    <Typography variant="body2">{pkg.popularity}% popularity</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event fontSize="small" />
                    <Typography variant="body2">{pkg.bookingsCount} bookings</Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Included Services:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {pkg.services.filter(s => s.included).map((service, index) => (
                      <Chip 
                        key={index}
                        label={service.service}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={pkg.isActive ? 'Active' : 'Inactive'}
                    color={pkg.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {pkg.dresses.length} dress(es)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Create/Edit Package Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPackage ? 'Edit Package' : 'Create New Package'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Package Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel>Package Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="bridal">Bridal</MenuItem>
                  <MenuItem value="bridesmaid">Bridesmaid</MenuItem>
                  <MenuItem value="mother-of-bride">Mother of Bride</MenuItem>
                  <MenuItem value="complete-wedding">Complete Wedding</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  label="Base Price"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />

                <TextField
                  label="Discount %"
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                  slotProps={{ htmlInput: { min: 0, max: 100 } }}
                />

                <TextField
                  label="Deposit Required"
                  type="number"
                  value={formData.depositRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositRequired: Number(e.target.value) }))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Box>

              <TextField
                label="Cancellation Policy"
                value={formData.cancellationPolicy}
                onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="Alteration Policy"
                value={formData.alterationPolicy}
                onChange={(e) => setFormData(prev => ({ ...prev, alterationPolicy: e.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="Damage Policy"
                value={formData.damagePolicy}
                onChange={(e) => setFormData(prev => ({ ...prev, damagePolicy: e.target.value }))}
                multiline
                rows={2}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Package Active"
              />

              {formData.basePrice > 0 && (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6">
                    Final Price: ${(formData.basePrice * (1 - formData.discountPercentage / 100)).toFixed(2)}
                  </Typography>
                  {formData.discountPercentage > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Savings: ${(formData.basePrice * formData.discountPercentage / 100).toFixed(2)}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button 
              onClick={handleSavePackage} 
              variant="contained" 
              disabled={loading || !formData.name || !formData.description}
            >
              {loading ? 'Saving...' : (editingPackage ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default WeddingPackages
