import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    const fetchDressMaterials = async () => {
      try {
        const language = langHelper.getLanguage()
        const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/dress-materials?lang=${language}`)
        if (response.ok) {
          const materials = await response.json()
          setDressMaterials(materials)
        }
      } catch (error) {
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
