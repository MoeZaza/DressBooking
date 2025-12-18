import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  RestoreFromTrash as ResetIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { strings as commonStrings } from '@/lang/common'
import Layout from '@/components/Layout'
import * as AccessorySettingsService from '@/services/AccessorySettingsService'

interface AccessoryPrices {
  veil: number
  jewelry: number
  shoes: number
  headpiece: number
  handbag: number
  gloves: number
  hairAccessories: number
  undergarments: number
  wrapShawl: number
}

interface AccessorySettingsData {
  _id?: string
  supplier: string
  accessoryPrices: AccessoryPrices
  defaultAccessoryFee: number
  currency: string
  isActive: boolean
}

const AccessorySettings: React.FC = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [settings, setSettings] = useState<AccessorySettingsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<AccessorySettingsData>({
    supplier: '',
    accessoryPrices: {
      veil: 50,
      jewelry: 30,
      shoes: 25,
      headpiece: 40,
      handbag: 20,
      gloves: 15,
      hairAccessories: 25,
      undergarments: 35,
      wrapShawl: 30,
    },
    defaultAccessoryFee: 50,
    currency: 'ILS',
    isActive: true,
  })

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
    }
  }

  const fetchSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const data = await AccessorySettingsService.getAccessorySettings(user._id!)
      setSettings(data)
      setFormData(data)
    } catch (err: any) {
      console.error('Error fetching accessory settings:', err)
      setError('Failed to load accessory settings')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (accessoryType: keyof AccessoryPrices, value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      accessoryPrices: {
        ...prev.accessoryPrices,
        [accessoryType]: numValue,
      },
    }))
  }

  const handleDefaultFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      defaultAccessoryFee: numValue,
    }))
  }

  const handleCurrencyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      currency: value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await AccessorySettingsService.updateAccessorySettings(user._id!, formData)
      setSuccess('Accessory settings saved successfully!')
      await fetchSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save accessory settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await AccessorySettingsService.resetAccessorySettings(user._id!)
      setSuccess('Accessory settings reset to defaults!')
      await fetchSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset accessory settings')
    } finally {
      setSaving(false)
    }
  }

  const accessoryLabels = {
    veil: 'Veil',
    jewelry: 'Jewelry',
    shoes: 'Shoes',
    headpiece: 'Headpiece',
    handbag: 'Handbag',
    gloves: 'Gloves',
    hairAccessories: 'Hair Accessories',
    undergarments: 'Undergarments',
    wrapShawl: 'Wrap/Shawl',
  }

  return (
    <Layout onLoad={onLoad} strict>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h4">
              {strings.ACCESSORY_SETTINGS || 'Accessory Settings'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchSettings} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to Defaults">
              <IconButton onClick={handleReset} disabled={saving} color="warning">
                <ResetIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Accessory Pricing Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure individual prices for different accessory types. These prices will be used when calculating total rental costs.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Individual Accessory Prices */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Individual Accessory Prices
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 2
                }}>
                  {Object.entries(accessoryLabels).map(([key, label]) => (
                    <Box key={key}>
                      <TextField
                        fullWidth
                        label={label}
                        type="number"
                        value={formData.accessoryPrices[key as keyof AccessoryPrices]}
                        onChange={(e) => handlePriceChange(key as keyof AccessoryPrices, e.target.value)}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>{formData.currency}</Typography>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>

              <Divider />

              {/* Default Settings */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                <TextField
                  fullWidth
                  label="Default Accessory Fee"
                  type="number"
                  value={formData.defaultAccessoryFee}
                  onChange={(e) => handleDefaultFeeChange(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{formData.currency}</Typography>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Used for accessories not specifically configured above"
                />

                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    label="Currency"
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    <MenuItem value="ILS">ILS (₪)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={fetchSettings}
                  disabled={loading || saving}
                >
                  {commonStrings.CANCEL}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading || saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  )
}

export default AccessorySettings
