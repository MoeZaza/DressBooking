import React, { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { strings } from '../lang/dresses'
import { strings as dressTypeStrings } from '../lang/dress-types'
import * as langHelper from '../common/langHelper'

interface DressTypeFilterProps {
  onChange: (value: string) => void
  className?: string
}

interface DropdownOption {
  value: string
  label: string
}

const DressTypeFilter: React.FC<DressTypeFilterProps> = ({ onChange, className }) => {
  const [value, setValue] = useState('')
  const [dressTypes, setDressTypes] = useState<DropdownOption[]>([])

  useEffect(() => {
    const fetchDressTypes = async () => {
      try {
        const language = langHelper.getLanguage()
        const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/dress-types?lang=${language}`)
        if (response.ok) {
          const types = await response.json()
          setDressTypes(types)
        }
      } catch (error) {
        console.error('Failed to fetch dress types:', error)
        // Fallback to basic types
        setDressTypes([
          { value: 'wedding', label: dressTypeStrings.WEDDING },
          { value: 'evening', label: dressTypeStrings.EVENING },
          { value: 'cocktail', label: dressTypeStrings.COCKTAIL },
          { value: 'prom', label: dressTypeStrings.PROM },
          { value: 'formal', label: dressTypeStrings.FORMAL },
          { value: 'business', label: dressTypeStrings.BUSINESS },
          { value: 'bridal', label: dressTypeStrings.BRIDAL },
          { value: 'bridesmaid', label: dressTypeStrings.BRIDESMAID }
        ])
      }
    }

    fetchDressTypes()
  }, [])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value
    setValue(value)
    onChange(value)
  }

  return (
    <FormControl fullWidth className={className}>
      <InputLabel>{strings.DRESS_TYPE}</InputLabel>
      <Select
        value={value}
        label={strings.DRESS_TYPE}
        onChange={handleChange}
      >
        <MenuItem value="">{strings.ALL}</MenuItem>
        {dressTypes.map((type) => (
          <MenuItem key={type.value} value={type.value}>
            {type.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DressTypeFilter
