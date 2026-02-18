import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
 } from '@mui/material'
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as DressService from '../services/DressService'

interface DressCodeManagerProps {
  open: boolean
  onClose: () => void
  dress: bookcarsTypes.Dress
  onUpdate: (updatedDress: bookcarsTypes.Dress) => void
}

const DressCodeManager: React.FC<DressCodeManagerProps> = ({
  open,
  onClose,
  dress,
  onUpdate,
}) => {
  const [dressCode, setDressCode] = useState('')
  const [originalDressCode, setOriginalDressCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validation, setValidation] = useState<{
    isValid: boolean
    isUnique: boolean
    existingDress?: any
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Ref for timeout cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const loadDressCode = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await DressService.getDressCode(dress._id!)
      const currentDressCode = response.data.dressCode || ''
      
      setDressCode(currentDressCode)
      setOriginalDressCode(currentDressCode)
    } catch (err: any) {
      console.error('Error loading dress code:', err)
      setError('Failed to load dress code')
    } finally {
      setLoading(false)
    }
  }, [dress])

  const validateDressCode = useCallback(async () => {
    if (!dressCode.trim()) {
      setValidation({ isValid: false, isUnique: false })
      return
    }

    try {
      setValidating(true)
      const response = await DressService.validateDressCode(dressCode, dress._id!)
      
      setValidation({
        isValid: isValidDressCodeFormat(dressCode),
        isUnique: response.data.isUnique,
        existingDress: response.data.existingDress
      })
    } catch (err: any) {
      console.error('Error validating dress code:', err)
      setValidation({ isValid: false, isUnique: false })
    } finally {
      setValidating(false)
    }
  }, [dressCode, dress])

  useEffect(() => {
    if (open && dress) {
      loadDressCode()
    }
  }, [open, dress, loadDressCode])

  useEffect(() => {
    if (dressCode && dressCode !== originalDressCode) {
      validateDressCode()
    } else {
      setValidation(null)
    }
  }, [dressCode, originalDressCode, validateDressCode])

  const isValidDressCodeFormat = (code: string): boolean => {
    // Validate format: DR-YYYY-NNNN (e.g., DR-2024-0001)
    const regex = /^DR-\d{4}-\d{4}$/
    return regex.test(code)
  }

  const handleSave = async () => {
    if (!validation?.isValid || !validation?.isUnique) {
      setError('Please enter a valid and unique dress code')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      await DressService.updateDressCode(dress._id!, dressCode)
      
      setSuccess('Dress code updated successfully!')
      setOriginalDressCode(dressCode)
      
      // Update the dress object
      const updatedDress = { ...dress, dressCode }
      onUpdate(updatedDress)

      timeoutRef.current = setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error('Error updating dress code:', err)
      setError(err.response?.data?.error || 'Failed to update dress code')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError('')
      
      const response = await DressService.generateDressCode(dress._id!)
      const newDressCode = response.data.dressCode
      
      setDressCode(newDressCode)
      setSuccess('New dress code generated!')

      timeoutRef.current = setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error generating dress code:', err)
      setError('Failed to generate new dress code')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dressCode)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy dress code:', err)
    }
  }

  const handleReset = () => {
    setDressCode(originalDressCode)
    setError('')
    setSuccess('')
    setValidation(null)
  }

  const handleClose = () => {
    setDressCode(originalDressCode)
    setError('')
    setSuccess('')
    setValidation(null)
    onClose()
  }

  const getValidationIcon = () => {
    if (validating) return <CircularProgress size={16} />
    if (!validation) return null
    
    if (validation.isValid && validation.isUnique) {
      return <CheckIcon color="success" fontSize="small" />
    } else {
      return <ErrorIcon color="error" fontSize="small" />
    }
  }

  const getValidationMessage = () => {
    if (!validation || !dressCode.trim()) return null
    
    if (!validation.isValid) {
      return 'Invalid format. Use DR-YYYY-NNNN (e.g., DR-2024-0001)'
    }
    
    if (!validation.isUnique && validation.existingDress) {
      const dressName = validation.existingDress.name || 'Unnamed Dress'
      return `Code already used by "${dressName}"`
    }
    
    if (validation.isValid && validation.isUnique) {
      return 'Valid and unique dress code'
    }
    
    return null
  }

  const isChanged = dressCode !== originalDressCode
  const canSave = isChanged && validation?.isValid && validation?.isUnique && !saving

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Manage Dress Code
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {dress.name}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Current Dress Code
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value.toUpperCase())}
                    placeholder="DR-YYYY-NNNN"
                    variant="outlined"
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getValidationIcon()}
                          {dressCode && (
                            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                              <IconButton size="small" onClick={handleCopy}>
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )
                    }}
                  />
                </Box>
                
                {getValidationMessage() && (
                  <Typography 
                    variant="caption" 
                    color={validation?.isValid && validation?.isUnique ? 'success.main' : 'error.main'}
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {getValidationMessage()}
                  </Typography>
                )}
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Dress codes help you track and identify your dresses. Format: DR-YYYY-NNNN
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleGenerate}
                    disabled={generating}
                    startIcon={generating ? <CircularProgress size={16} /> : <RefreshIcon />}
                  >
                    Generate New
                  </Button>
                  
                  {isChanged && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      startIcon={<CancelIcon />}
                    >
                      Reset
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
            
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Dress Code Guidelines:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Format: DR-YYYY-NNNN (e.g., DR-2024-0001)</li>
                <li>Must be unique across all dresses</li>
                <li>Used for inventory tracking and identification</li>
                <li>Visible only to admin/owner users</li>
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DressCodeManager
