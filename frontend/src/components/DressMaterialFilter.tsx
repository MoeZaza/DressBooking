import React, { useState, useEffect, useRef } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
 } from '@mui/material'
import { strings } from '../lang/dresses'
import { strings as dressMaterialStrings } from '../lang/dress-materials'
import * as langHelper from '../common/langHelper'

interface DressMaterialFilterProps {
  onChange: (value: string) => void
  className?: string
}

interface DropdownOption {
  value: string
  label: string
}

const DressMaterialFilter: React.FC<DressMaterialFilterProps> = ({ onChange, className }) => {
  const [value, setValue] = useState('')
  const [dressMaterials, setDressMaterials] = useState<DropdownOption[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const fetchDressMaterials = async () => {
      // Create new AbortController for this fetch
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const language = langHelper.getLanguage()
        const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/dress-materials?lang=${language}`, {
          signal: controller.signal
        })
        if (response.ok) {
          const materials = await response.json()
          setDressMaterials(materials)
        }
      } catch (error) {
        // Don't show error if request was aborted (component unmounted)
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch dress materials:', error)
        // Fallback to basic materials
        setDressMaterials([
          { value: 'silk', label: dressMaterialStrings.SILK },
          { value: 'cotton', label: dressMaterialStrings.COTTON },
          { value: 'lace', label: dressMaterialStrings.LACE },
          { value: 'satin', label: dressMaterialStrings.SATIN },
          { value: 'chiffon', label: dressMaterialStrings.CHIFFON },
          { value: 'tulle', label: dressMaterialStrings.TULLE },
          { value: 'organza', label: dressMaterialStrings.ORGANZA },
          { value: 'velvet', label: dressMaterialStrings.VELVET }
        ])
      }
    }

    fetchDressMaterials()
  }, [])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value
    setValue(value)
    onChange(value)
  }

  return (
    <FormControl fullWidth className={className}>
      <InputLabel>{strings.MATERIAL}</InputLabel>
      <Select
        value={value}
        label={strings.MATERIAL}
        onChange={handleChange}
      >
        <MenuItem value="">{strings.ALL}</MenuItem>
        {dressMaterials.map((material) => (
          <MenuItem key={material.value} value={material.value}>
            {material.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DressMaterialFilter
