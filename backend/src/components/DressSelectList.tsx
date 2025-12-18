import React, { useState, useEffect } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  FormHelperText,
  ListItemText,
  TextField,
  Box,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as DressService from '@/services/DressService'

interface DressSelectListProps {
  value?: string
  label?: string
  required?: boolean
  multiple?: boolean
  variant?: 'standard' | 'outlined' | 'filled'
  supplier?: string
  onChange?: (values: bookcarsTypes.Option[]) => void
}

const DressSelectList: React.FC<DressSelectListProps> = ({
  value: dressValue,
  label,
  required,
  multiple,
  variant,
  supplier,
  onChange
}) => {
  const [value, setValue] = useState<string | string[]>(multiple ? [] : '')
  const [dresses, setDresses] = useState<bookcarsTypes.Dress[]>([])
  const [filteredDresses, setFilteredDresses] = useState<bookcarsTypes.Dress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchDresses = async () => {
      try {
        setLoading(true)
        const payload: bookcarsTypes.GetDressesPayload = {
          suppliers: supplier ? [supplier] : [],
          availability: [bookcarsTypes.Availablity.Available]
        }
        
        const data = await DressService.getDresses('', payload, 1, 1000)

        if (data && data.length > 0 && data[0] && data[0].resultData) {
          // Handle Result<Dress> format
          setDresses(data[0].resultData)
          setFilteredDresses(data[0].resultData)
        } else {
          // Handle pagination response structure (fallback)
          const paginatedData = data as any
          if (paginatedData && paginatedData.docs) {
            setDresses(paginatedData.docs)
            setFilteredDresses(paginatedData.docs)
          } else {
            setDresses([])
            setFilteredDresses([])
          }
        }
      } catch (err) {
        console.error('Error fetching dresses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDresses()
  }, [supplier])

  useEffect(() => {
    if (dressValue !== undefined) {
      setValue(dressValue)
    }
  }, [dressValue])

  // Filter dresses based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDresses(dresses)
    } else {
      const filtered = dresses.filter(dress =>
        (dress.dressCode && dress.dressCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dress.name && dress.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredDresses(filtered)
    }
  }, [searchTerm, dresses])

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const selectedValue = event.target.value
    setValue(selectedValue)

    if (onChange) {
      if (multiple) {
        const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue]
        const selectedOptions = selectedValues
          .map(val => filteredDresses.find(dress => dress._id === val))
          .filter(Boolean)
          .map(dress => ({
            _id: dress!._id!,
            name: dress!.name
          }))
        onChange(selectedOptions)
      } else {
        const selectedDress = filteredDresses.find(dress => dress._id === selectedValue)
        if (selectedDress) {
          onChange([{
            _id: selectedDress._id!,
            name: selectedDress.name
          }])
        } else {
          onChange([])
        }
      }
    }
  }

  return (
    <Box>
      {/* Search Field */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search by dress code or name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setSearchTerm('')}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />

      {/* Dress Select */}
      <FormControl fullWidth margin="dense" variant={variant || 'standard'}>
        <InputLabel className={required ? 'required' : ''}>{label}</InputLabel>
        <Select
          value={value || (multiple ? [] : '')}
          onChange={handleChange}
          multiple={multiple}
          required={required}
          disabled={loading}
          displayEmpty
          renderValue={(selected) => {
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
              return <em style={{ color: '#999' }}>{label || 'Select dress'}</em>
            }
            if (multiple) {
              const selectedArray = Array.isArray(selected) ? selected : []
              return selectedArray
                .map(val => dresses.find(dress => dress._id === val)?.name)
                .filter(Boolean)
                .join(', ')
            } else {
              const selectedDress = dresses.find(dress => dress._id === selected)
              return selectedDress?.name || ''
            }
          }}
        >
          {!required && !multiple && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {filteredDresses.map((dress) => (
            <MenuItem key={dress._id} value={dress._id}>
              <ListItemText
                primary={dress.dressCode ? `${dress.dressCode}${dress.name ? ` - ${dress.name}` : ''}` : (dress.name || 'Unnamed Dress')}
                secondary={`${dress.type} - ${dress.size} - ${dress.color}`}
              />
            </MenuItem>
          ))}
        </Select>
        {loading && <FormHelperText>Loading dresses...</FormHelperText>}
        {!loading && filteredDresses.length === 0 && searchTerm && (
          <FormHelperText>No dresses found matching &quot;{searchTerm}&quot;</FormHelperText>
        )}
      </FormControl>
    </Box>
  )
}

export default DressSelectList
