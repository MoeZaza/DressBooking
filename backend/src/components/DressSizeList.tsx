import React, { useState, useEffect } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent
} from '@mui/material'
import * as bookcarsHelper from ':bookcars-helper'
import * as helper from '@/common/helper'

interface DressSizeListProps {
  value?: string
  label?: string
  required?: boolean
  onChange?: (value: string) => void
  disabled?: boolean
}

const DressSizeList = ({
  value: dressSizeValue,
  label,
  required,
  onChange,
  disabled
}: DressSizeListProps) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (dressSizeValue) {
      setValue(dressSizeValue)
    } else {
      setValue('')
    }
  }, [dressSizeValue])

  const handleChange = (e: SelectChangeEvent<string>) => {
    setValue(e.target.value)
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <FormControl fullWidth variant="standard" required={required} disabled={disabled}>
      <InputLabel shrink>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {bookcarsHelper.getAllDressSizes().map((dressSize) => (
          <MenuItem key={dressSize} value={dressSize}>
            {helper.getDressSize(dressSize)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DressSizeList
