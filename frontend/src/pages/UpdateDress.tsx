import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  OutlinedInput
 } from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import Layout from '../components/Layout'
import * as DressService from '../services/DressService'
import * as LocationService from '../services/LocationService'
import * as helper from '../common/helper'
import { strings } from '../lang/dresses'
import { strings as commonStrings } from '../lang/common'
import * as bookcarsTypes from ':bookcars-types'
import { DressType, DressSize, DressStyle, DressMaterial, Location } from ':bookcars-types'


const UpdateDress: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dress, setDress] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    style: '',
    color: '',
    material: '',
    price: 0,
    deposit: 0,
    available: true,
    locations: [] as string[],
    cancellation: false,
    amendments: false,
    customizable: false,
    designerName: '',
    dressCode: '',
    fittingRequired: false,
    alterationNotes: '',
    careInstructions: '',
    occasionTags: [] as string[],
    season: 'all-season',
    neckline: '',
    sleeves: '',
    silhouette: ''
  })
  const [locations, setLocations] = useState<Location[]>([])
  const [imageChanged, setImageChanged] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('dr')
    
    if (!id) {
      navigate('/dresses')
      return
    }

    const currentUser = helper.getUser()
    setUser(currentUser)

    const fetchData = async () => {
      try {
        // Fetch dress data
        const dressResult = await DressService.getDress(id)
        const dressData = dressResult.data
        setDress(dressData)
        
        // Fetch locations
        const locationsResult = await LocationService.getLocations('', 1, 1000)
        const locationsData = locationsResult && locationsResult.length > 0 ? locationsResult[0] : { resultData: [] }
        setLocations(locationsData?.resultData || [])
        
        // Set form data
        setFormData({
          name: dressData.name || '',
          type: dressData.type || '',
          size: dressData.size || '',
          style: dressData.style || '',
          color: dressData.color || '',
          material: dressData.material || '',
          price: dressData.price || 0,
          deposit: dressData.deposit || 0,
          available: dressData.available !== undefined ? dressData.available : true,
          locations: dressData.locations ? dressData.locations.map((loc: any) =>
            typeof loc === 'object' ? loc._id : loc) : [],
          cancellation: dressData.cancellation || false,
          amendments: dressData.amendments || false,
          customizable: dressData.customizable || false,
          designerName: dressData.designerName || '',
          dressCode: dressData.dressCode || '',
          fittingRequired: dressData.fittingRequired || false,
          alterationNotes: dressData.alterationNotes || '',
          careInstructions: dressData.careInstructions || '',
          occasionTags: dressData.occasionTags || [],
          season: dressData.season || 'all-season',
          neckline: dressData.neckline || '',
          sleeves: dressData.sleeves || '',
          silhouette: dressData.silhouette || ''
        })
        
        setImage(dressData.image || null)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/dresses')
      }
    }

    fetchData()
  }, [location.search, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name as string]: value
    })

    // Clear validation error when field is edited
    if (name && validationErrors[name as string]) {
      setValidationErrors({
        ...validationErrors,
        [name]: false
      })
    }
  }

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name as string]: value
    })

    // Clear validation error when field is edited
    if (name && validationErrors[name as string]) {
      setValidationErrors({
        ...validationErrors,
        [name]: false
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData({
      ...formData,
      [name]: checked
    })
  }

  const handleLocationChange = (e: any) => {
    setFormData({
      ...formData,
      locations: e.target.value as string[]
    })
  }

  const handleOccasionTagsChange = (event: any) => {
    const value = event.target.value
    setFormData({
      ...formData,
      occasionTags: typeof value === 'string' ? value.split(',') : value
    })
  }

  const handleImageChange = (image: string) => {
    setImage(image)
    setImageChanged(true)
    setImageError(false)
  }

  const validateForm = () => {
    const errors: Record<string, boolean> = {}
    let isValid = true

    // Name is required
    if (!formData.name || formData.name.trim() === '') {
      errors.name = true
      isValid = false
    }

    // Dress code is required
    if (!formData.dressCode || formData.dressCode.trim() === '') {
      errors.dressCode = true
      isValid = false
    }

    if (!formData.type) {
      errors.type = true
      isValid = false
    }
    
    if (!formData.size) {
      errors.size = true
      isValid = false
    }
    
    if (!formData.style) {
      errors.style = true
      isValid = false
    }
    
    if (!formData.color) {
      errors.color = true
      isValid = false
    }
    
    if (formData.price <= 0) {
      errors.price = true
      isValid = false
    }
    
    if (formData.deposit < 0) {
      errors.deposit = true
      isValid = false
    }
    
    if (!image) {
      setImageError(true)
      isValid = false
    }
    
    setValidationErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      const updateData: bookcarsTypes.Dress = {
        ...dress,
        ...formData,
        _id: dress._id,
        image: imageChanged ? image : dress.image,
        price: formData.price,
        supplier: dress.supplier,
        locations: formData.locations.map(id => locations.find(loc => loc._id === id)!).filter(Boolean)
      }

      await DressService.updateDress(dress._id, updateData)
      setSuccess(true)
      setTimeout(() => {
        navigate(`/dress?dr=${dress._id}`)
      }, 1000)
    } catch (error) {
      console.error('Error updating dress:', error)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Layout><div className="progress-container"><CircularProgress /></div></Layout>
  }

  const isAdmin = helper.admin(user)
  const canEdit = isAdmin || (user && dress && dress.supplier && user._id === dress.supplier._id)
  
  if (!canEdit) {
    navigate('/dresses')
    return null
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {strings.UPDATE_DRESS}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 300 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="dress-image-upload"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            handleImageChange(event.target.result as string)
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <label htmlFor="dress-image-upload">
                    <Button variant="outlined" component="span" sx={{ mb: 2 }}>
                      {commonStrings.UPLOAD_IMAGE}
                    </Button>
                  </label>
                  {image && (
                    <Box sx={{ mt: 2 }}>
                      <img
                        src={image}
                        alt="Dress preview"
                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  {imageError && (
                    <Typography color="error" variant="caption" display="block" gutterBottom>
                      {commonStrings.IMAGE_REQUIRED}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <TextField
                      name="name"
                      label={commonStrings.NAME}
                      value={formData.name}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={validationErrors.name}
                      helperText={validationErrors.name ? commonStrings.REQUIRED_FIELD : ''}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth required error={validationErrors.type}>
                      <InputLabel>{strings.DRESS_TYPE}</InputLabel>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleSelectChange}
                        label={strings.DRESS_TYPE}
                      >
                        <MenuItem value={DressType.Wedding}>{strings.WEDDING}</MenuItem>
                        <MenuItem value={DressType.Evening}>{strings.EVENING}</MenuItem>
                        <MenuItem value={DressType.Cocktail}>{strings.COCKTAIL}</MenuItem>
                        <MenuItem value={DressType.Prom}>{strings.PROM}</MenuItem>
                        <MenuItem value={DressType.Other}>{strings.OTHER}</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required error={validationErrors.size}>
                      <InputLabel>{strings.DRESS_SIZE}</InputLabel>
                      <Select
                        name="size"
                        value={formData.size}
                        onChange={handleSelectChange}
                        label={strings.DRESS_SIZE}
                      >
                        <MenuItem value={DressSize.XS}>{strings.SIZE_XS}</MenuItem>
                        <MenuItem value={DressSize.S}>{strings.SIZE_S}</MenuItem>
                        <MenuItem value={DressSize.M}>{strings.SIZE_M}</MenuItem>
                        <MenuItem value={DressSize.L}>{strings.SIZE_L}</MenuItem>
                        <MenuItem value={DressSize.XL}>{strings.SIZE_XL}</MenuItem>
                        <MenuItem value={DressSize.XXL}>{strings.SIZE_XXL}</MenuItem>
                        <MenuItem value={DressSize.Custom}>{strings.SIZE_CUSTOM}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth required error={validationErrors.style}>
                      <InputLabel>{strings.DRESS_STYLE}</InputLabel>
                      <Select
                        name="style"
                        value={formData.style}
                        onChange={handleSelectChange}
                        label={strings.DRESS_STYLE}
                      >
                        <MenuItem value={DressStyle.Traditional}>{strings.STYLE_TRADITIONAL}</MenuItem>
                        <MenuItem value={DressStyle.Modern}>{strings.STYLE_MODERN}</MenuItem>
                        <MenuItem value={DressStyle.Vintage}>{strings.STYLE_VINTAGE}</MenuItem>
                        <MenuItem value={DressStyle.Designer}>{strings.STYLE_DESIGNER}</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>{strings.MATERIAL}</InputLabel>
                      <Select
                        name="material"
                        value={formData.material}
                        onChange={handleSelectChange}
                        label={strings.MATERIAL}
                      >
                        <MenuItem value=""><em>{commonStrings.NONE}</em></MenuItem>
                        <MenuItem value={DressMaterial.Silk}>{strings.SILK}</MenuItem>
                        <MenuItem value={DressMaterial.Cotton}>{strings.COTTON}</MenuItem>
                        <MenuItem value={DressMaterial.Lace}>{strings.LACE}</MenuItem>
                        <MenuItem value={DressMaterial.Satin}>{strings.SATIN}</MenuItem>
                        <MenuItem value={DressMaterial.Chiffon}>{strings.CHIFFON}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      name="color"
                      label={strings.COLOR}
                      value={formData.color}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={validationErrors.color}
                      helperText={validationErrors.color ? commonStrings.REQUIRED_FIELD : ''}
                    />

                    <TextField
                      name="price"
                      label={strings.PRICE}
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={validationErrors.price}
                      helperText={validationErrors.price ? commonStrings.REQUIRED_FIELD : ''}
                      slotProps={{
                        input: {
                          startAdornment: <span>$</span>,
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      name="deposit"
                      label={strings.DEPOSIT}
                      type="number"
                      value={formData.deposit}
                      onChange={handleInputChange}
                      fullWidth
                      error={validationErrors.deposit}
                      helperText={validationErrors.deposit ? commonStrings.REQUIRED_FIELD : ''}
                      slotProps={{
                        input: {
                          startAdornment: <span>$</span>,
                        }
                      }}
                    />


                  </Box>

                  <Box>
                    <FormControl fullWidth>
                      <InputLabel>{strings.LOCATIONS}</InputLabel>
                      <Select
                        multiple
                        name="locations"
                        value={formData.locations}
                        onChange={handleLocationChange}
                        label={strings.LOCATIONS}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => {
                              const locationName = locations.find(loc => loc._id === value)?.name || value
                              return (
                                <Chip key={value} label={locationName} />
                              )
                            })}
                          </Box>
                        )}
                      >
                        {locations.map((location) => (
                          <MenuItem key={location._id} value={location._id}>
                            {location.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      name="designerName"
                      label={strings.DESIGNER_NAME || 'Designer Name'}
                      value={formData.designerName}
                      onChange={handleInputChange}
                      fullWidth
                    />

                    <TextField
                      name="dressCode"
                      label={strings.DRESS_CODE}
                      value={formData.dressCode}
                      onChange={handleInputChange}
                      fullWidth
                      placeholder="Leave empty to auto-generate"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.SEASON}</InputLabel>
                      <Select
                        name="season"
                        value={formData.season}
                        onChange={handleSelectChange}
                        label={strings.SEASON}
                      >
                        <MenuItem value="spring">Spring</MenuItem>
                        <MenuItem value="summer">Summer</MenuItem>
                        <MenuItem value="fall">Fall</MenuItem>
                        <MenuItem value="winter">Winter</MenuItem>
                        <MenuItem value="all-season">All Season</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>{strings.NECKLINE}</InputLabel>
                      <Select
                        name="neckline"
                        value={formData.neckline}
                        onChange={handleSelectChange}
                        label={strings.NECKLINE}
                      >
                        <MenuItem value=""><em>{commonStrings.NONE}</em></MenuItem>
                        <MenuItem value="v-neck">V-Neck</MenuItem>
                        <MenuItem value="round-neck">Round Neck</MenuItem>
                        <MenuItem value="off-shoulder">Off Shoulder</MenuItem>
                        <MenuItem value="halter">Halter</MenuItem>
                        <MenuItem value="strapless">Strapless</MenuItem>
                        <MenuItem value="one-shoulder">One Shoulder</MenuItem>
                        <MenuItem value="boat-neck">Boat Neck</MenuItem>
                        <MenuItem value="square-neck">Square Neck</MenuItem>
                        <MenuItem value="sweetheart">Sweetheart</MenuItem>
                        <MenuItem value="high-neck">High Neck</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>{strings.SLEEVES}</InputLabel>
                      <Select
                        name="sleeves"
                        value={formData.sleeves}
                        onChange={handleSelectChange}
                        label={strings.SLEEVES}
                      >
                        <MenuItem value=""><em>{commonStrings.NONE}</em></MenuItem>
                        <MenuItem value="sleeveless">Sleeveless</MenuItem>
                        <MenuItem value="short-sleeve">Short Sleeve</MenuItem>
                        <MenuItem value="long-sleeve">Long Sleeve</MenuItem>
                        <MenuItem value="three-quarter">Three Quarter</MenuItem>
                        <MenuItem value="cap-sleeve">Cap Sleeve</MenuItem>
                        <MenuItem value="bell-sleeve">Bell Sleeve</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>{strings.SILHOUETTE}</InputLabel>
                      <Select
                        name="silhouette"
                        value={formData.silhouette}
                        onChange={handleSelectChange}
                        label={strings.SILHOUETTE}
                      >
                        <MenuItem value=""><em>{commonStrings.NONE}</em></MenuItem>
                        <MenuItem value="a-line">A-Line</MenuItem>
                        <MenuItem value="ball-gown">Ball Gown</MenuItem>
                        <MenuItem value="mermaid">Mermaid</MenuItem>
                        <MenuItem value="sheath">Sheath</MenuItem>
                        <MenuItem value="fit-and-flare">Fit and Flare</MenuItem>
                        <MenuItem value="empire">Empire</MenuItem>
                        <MenuItem value="trumpet">Trumpet</MenuItem>
                        <MenuItem value="column">Column</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <TextField
                      name="alterationNotes"
                      label={strings.ALTERATION_NOTES}
                      value={formData.alterationNotes}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Notes about possible alterations..."
                    />
                  </Box>

                  <Box>
                    <TextField
                      name="careInstructions"
                      label={strings.CARE_INSTRUCTIONS}
                      value={formData.careInstructions}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Care and maintenance instructions..."
                    />
                  </Box>

                  <Box>
                    <FormControl fullWidth>
                      <InputLabel>{strings.OCCASION_TAGS}</InputLabel>
                      <Select
                        multiple
                        value={formData.occasionTags}
                        onChange={handleOccasionTagsChange}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="wedding">Wedding</MenuItem>
                        <MenuItem value="prom">Prom</MenuItem>
                        <MenuItem value="cocktail">Cocktail</MenuItem>
                        <MenuItem value="business">Business</MenuItem>
                        <MenuItem value="casual">Casual</MenuItem>
                        <MenuItem value="formal">Formal</MenuItem>
                        <MenuItem value="party">Party</MenuItem>
                        <MenuItem value="graduation">Graduation</MenuItem>
                        <MenuItem value="anniversary">Anniversary</MenuItem>
                        <MenuItem value="date-night">Date Night</MenuItem>
                        <MenuItem value="gala">Gala</MenuItem>
                        <MenuItem value="red-carpet">Red Carpet</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="available"
                          checked={formData.available}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label={strings.AVAILABLE}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="fittingRequired"
                          checked={formData.fittingRequired}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label={strings.FITTING_REQUIRED || 'Fitting Required'}
                    />
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="customizable"
                          checked={formData.customizable}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label={strings.CUSTOMIZABLE}
                    />
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="cancellation"
                          checked={formData.cancellation}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label={strings.CANCELLATION}
                    />
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="amendments"
                          checked={formData.amendments}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label={strings.AMENDMENTS}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : commonStrings.SAVE}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
        
        <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
          <Alert onClose={() => setSuccess(false)} severity="success">
            {commonStrings.UPDATED}
          </Alert>
        </Snackbar>
        
        <Snackbar open={error} autoHideDuration={6000} onClose={() => setError(false)}>
          <Alert onClose={() => setError(false)} severity="error">
            {commonStrings.ERROR}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  )
}

export default UpdateDress
