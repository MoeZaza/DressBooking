import React, { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { strings } from '../lang/dresses'
import { strings as dressStyleStrings } from '../lang/dress-styles'
import * as langHelper from '../common/langHelper'

interface DressStyleFilterProps {
  onChange: (value: string) => void
  className?: string
}

interface DropdownOption {
  value: string
  label: string
}

const DressStyleFilter: React.FC<DressStyleFilterProps> = ({ onChange, className }) => {
  const [value, setValue] = useState('')
  const [dressStyles, setDressStyles] = useState<DropdownOption[]>([])

  useEffect(() => {
    const fetchDressStyles = async () => {
      try {
        const language = langHelper.getLanguage()
        const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/dress-styles?lang=${language}`)
        if (response.ok) {
          const styles = await response.json()
          setDressStyles(styles)
        }
      } catch (error) {
        console.error('Failed to fetch dress styles:', error)
        // Fallback to basic styles
        setDressStyles([
          { value: 'traditional', label: dressStyleStrings.TRADITIONAL },
          { value: 'modern', label: dressStyleStrings.MODERN },
          { value: 'vintage', label: dressStyleStrings.VINTAGE },
          { value: 'designer', label: dressStyleStrings.DESIGNER },
          { value: 'elegant', label: dressStyleStrings.ELEGANT },
          { value: 'romantic', label: dressStyleStrings.ROMANTIC },
          { value: 'glamorous', label: dressStyleStrings.GLAMOROUS },
          { value: 'classic', label: dressStyleStrings.CLASSIC }
        ])
      }
    }

    fetchDressStyles()
  }, [])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value
    setValue(value)
    onChange(value)
  }

  return (
    <FormControl fullWidth className={className}>
      <InputLabel>{strings.DRESS_STYLE}</InputLabel>
      <Select
        value={value}
        label={strings.DRESS_STYLE}
        onChange={handleChange}
      >
        <MenuItem value="">{strings.ALL}</MenuItem>
        {dressStyles.map((style) => (
          <MenuItem key={style.value} value={style.value}>
            {style.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DressStyleFilter
