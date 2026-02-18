import React, { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import {
  FormControl,
  Button,
  FormHelperText,
  MenuItem,
  Select,
  InputLabel,
  Box,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { addHours } from 'date-fns'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/search-form'
import * as UserService from '@/services/UserService'
import * as LocationService from '@/services/LocationService'
import DateTimePicker from '@/components/DateTimePicker'
import LocationSelectList from '@/components/LocationSelectList'
import { schema, FormFields, LocationField } from '@/models/SearchForm'

import '@/assets/css/search-form.css'

interface SearchFormProps {
  location?: string
  dressType?: string
  dressSize?: string
  dressStyle?: string
  from?: Date
  to?: Date
  onCancel?: () => void
  onFormSubmit?: (data: any) => void
}

const SearchForm = ({
  location: __location,
  dressType: __dressType,
  dressSize: __dressSize,
  dressStyle: __dressStyle,
  from: __from,
  to: __to,
  onCancel,
  onFormSubmit
}: SearchFormProps) => {
  const navigate = useNavigate()

  let _minDate = new Date()
  _minDate = addHours(_minDate, env.MIN_RENTAL_START_HOURS)

  const [minDate, setMinDate] = useState(_minDate)
  const [locationId, setLocationId] = useState('')
  const [locationObject, setLocationObject] = useState<bookcarsTypes.Location | undefined>(undefined)
  const navTimeoutRef = useRef<number | null>(null)

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current)
      }
    }
  }, [])

  // Calculate default dates
  const getDefaultFromDate = () => {
    const _from = new Date()
    if (env.MIN_RENTAL_START_HOURS < 72) {
      _from.setDate(_from.getDate() + 3)
    } else {
      _from.setDate(_from.getDate() + Math.ceil(env.MIN_RENTAL_START_HOURS / 24) + 1)
    }
    _from.setHours(10)
    _from.setMinutes(0)
    _from.setSeconds(0)
    _from.setMilliseconds(0)
    return _from
  }

  const getDefaultToDate = () => {
    const _from = getDefaultFromDate()
    const _to = new Date(_from)
    if (env.MIN_RENTAL_HOURS < 72) {
      _to.setDate(_to.getDate() + 3)
    } else {
      _to.setDate(_to.getDate() + Math.ceil(env.MIN_RENTAL_HOURS / 24) + 1)
    }
    _to.setHours(10)
    _to.setMinutes(0)
    _to.setSeconds(0)
    _to.setMilliseconds(0)
    return _to
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {
      dressType: __dressType || '',
      dressSize: __dressSize || '',
      dressStyle: __dressStyle || '',
      from: __from || getDefaultFromDate(),
      to: __to || getDefaultToDate(),
    }
  })

  const { keyword, from, to, location, dressType, dressSize, dressStyle } = useWatch({ control })

  useEffect(() => {
    // Set minimum date for date picker validation
    let __minDate = new Date()
    __minDate = addHours(__minDate, env.MIN_RENTAL_HOURS)
    setMinDate(__minDate)
    
    // Default dates are now set in form defaultValues, no need to setValue here
    // unless props provide specific values
    if (__from) {
      setValue('from', __from)
    }
    if (__to) {
      setValue('to', __to)
    }
  }, [setValue, __from, __to])

  useEffect(() => {
    const init = async () => {
      if (__location) {
        const locationData = await LocationService.getLocation(__location) as LocationField
        setValue('location', locationData)
        setLocationId(__location)
        setLocationObject(locationData)
      }
    }
    init()
  }, [__location, setValue])

  const handleLocationChange = async (values: bookcarsTypes.Option[]) => {
    const _locationId = (values.length > 0 && values[0]._id) || ''
    setLocationId(_locationId)

    if (_locationId) {
      const locationData = await LocationService.getLocation(_locationId) as LocationField
      setLocationObject(locationData)
      setValue('location', locationData)
    } else {
      setLocationObject(undefined)
      setValue('location', undefined as any)
    }
  }

  useEffect(() => {
    const minRentalStartDuration = env.MIN_RENTAL_START_HOURS * 60 * 60 * 1000
    const minRentalDuration = env.MIN_RENTAL_HOURS * 60 * 60 * 1000

    if (from) {
      let __minDate = new Date(from)
      __minDate = addHours(__minDate, env.MIN_RENTAL_HOURS)
      setMinDate(__minDate)

      const minRentalStartTime = from.getTime() - Date.now()

      if (minRentalStartTime < minRentalStartDuration) {
        setError('from', { message: strings.MIN_RENTAL_START_HOURS_ERROR })
      } else {
        clearErrors('from')
      }
    }

    if (from && to) {
      const rentalDuration = to.getTime() - from.getTime()

      if (from.getTime() > to.getTime()) {
        const _to = new Date(from)
        if (env.MIN_RENTAL_HOURS < 24) {
          _to.setDate(_to.getDate() + 1)
        } else {
          _to.setDate(_to.getDate() + Math.ceil(env.MIN_RENTAL_HOURS / 24) + 1)
        }
        setValue('to', _to)
      } else if (rentalDuration < minRentalDuration) {
        setError('to', { message: strings.MIN_RENTAL_HOURS_ERROR })
      } else {
        clearErrors('to')
      }
    }
  }, [from, to, setValue, setError, clearErrors])

  // Dress type options
  const dressTypes = [
    { value: '', label: strings.ALL_DRESS_TYPES },
    { value: 'Wedding', label: strings.WEDDING_DRESS },
    { value: 'Evening', label: strings.EVENING_DRESS },
    { value: 'Cocktail', label: strings.COCKTAIL_DRESS },
    { value: 'Formal', label: strings.FORMAL_DRESS },
    { value: 'Casual', label: strings.CASUAL_DRESS },
  ]

  // Dress size options
  const dressSizes = [
    { value: '', label: strings.ALL_SIZES },
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
  ]

  // Dress style options
  const dressStyles = [
    { value: '', label: strings.ALL_STYLES },
    { value: 'A-Line', label: strings.A_LINE },
    { value: 'Mermaid', label: strings.MERMAID },
    { value: 'Ball Gown', label: strings.BALL_GOWN },
    { value: 'Sheath', label: strings.SHEATH },
    { value: 'Empire', label: strings.EMPIRE },
  ]

  const onSubmit = (data: FormFields) => {
    // Ensure we always have dates for the search
    const searchData = {
      ...data,
      from: data.from || getDefaultFromDate(),
      to: data.to || getDefaultToDate(),
    }

    // Call the onFormSubmit prop if provided
    if (onFormSubmit) {
      onFormSubmit(searchData)
    }

    // Only navigate to search page if we're not already there
    const currentPath = window.location.pathname
    if (currentPath !== '/search') {
      // Navigate to search page with complete data including default dates
      navTimeoutRef.current = setTimeout(navigate, 0, '/search', {
        state: {
          keyword: searchData.keyword,
          from: searchData.from,
          to: searchData.to,
          locationId: locationId,
          dressType: searchData.dressType,
          dressSize: searchData.dressSize,
          dressStyle: searchData.dressStyle,
          priceRange: searchData.priceRange,
        },
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="home-search-form search-form" data-testid="search-form">
      <Box className="search-form-container" data-testid="search-container">
        {/* Prominent Search Input Field */}
        <Box className="search-row keyword-row">
          <TextField
            {...register('keyword')}
            fullWidth
            variant="outlined"
            size="medium"
            placeholder={strings.SEARCH_PLACEHOLDER || 'Search for dresses by name, style, or code...'}
            value={keyword || ''}
            onChange={(e) => setValue('keyword', e.target.value)}
            data-testid="search-input"
            type="search"
            className="search-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                </InputAdornment>
              ),
              endAdornment: keyword && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setValue('keyword', '')}
                    edge="end"
                    size="large"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                fontSize: '1.1rem',
                padding: '12px 14px',
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'background.paper',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
              },
            }}
          />
        </Box>

        <Box className="search-row primary-row">
          <FormControl className="location-field" data-testid="location-field">
            <LocationSelectList
              label={commonStrings.LOCATION}
              hidePopupIcon
              init
              data-testid="location-dropdown"
              required
              variant="outlined"
              value={locationObject}
              onChange={handleLocationChange}
            />
          </FormControl>

          <Box className="date-fields">
            <FormControl className="date-field from-field">
              <DateTimePicker
                {...register('from')}
                label={strings.RENTAL_START_DATE}
                value={from || undefined}
                minDate={_minDate}
                variant="outlined"
                required
                onChange={(date) => {
                  if (date) {
                    setValue('from', date, { shouldValidate: true })
                  } else {
                    setValue('from', null)
                    setMinDate(_minDate)
                  }
                }}
                language={UserService.getLanguage()}
              />
              <FormHelperText error={!!errors.from}>{errors.from?.message}</FormHelperText>
            </FormControl>

            <FormControl className="date-field to-field">
              <DateTimePicker
                {...register('to')}
                label={strings.RENTAL_END_DATE}
                value={to || undefined}
                minDate={minDate}
                variant="outlined"
                required
                onChange={(date) => {
                  if (date) {
                    setValue('to', date, { shouldValidate: true })
                  } else {
                    setValue('to', null)
                  }
                }}
                language={UserService.getLanguage()}
              />
              <FormHelperText error={!!errors.to}>{errors.to?.message}</FormHelperText>
            </FormControl>
          </Box>
        </Box>

        <Box className="search-row filters-row">
          <FormControl className="filter-field dress-type-field">
            <InputLabel>{strings.DRESS_TYPE}</InputLabel>
            <Select
              {...register('dressType')}
              value={dressType || ''}
              label={strings.DRESS_TYPE}
              onChange={(e) => setValue('dressType', e.target.value)}
            >
              {dressTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl className="filter-field dress-size-field">
            <InputLabel>{strings.DRESS_SIZE}</InputLabel>
            <Select
              {...register('dressSize')}
              value={dressSize || ''}
              label={strings.DRESS_SIZE}
              onChange={(e) => setValue('dressSize', e.target.value)}
            >
              {dressSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl className="filter-field dress-style-field">
            <InputLabel>{strings.DRESS_STYLE}</InputLabel>
            <Select
              {...register('dressStyle')}
              value={dressStyle || ''}
              label={strings.DRESS_STYLE}
              onChange={(e) => setValue('dressStyle', e.target.value)}
            >
              {dressStyles.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  {style.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box className="search-actions">
        <Button type="submit" variant="contained" className="btn-search">
          {strings.SEARCH_DRESSES}
        </Button>

        {onCancel && (
          <Button
            variant="outlined"
            color="inherit"
            className="btn-cancel"
            onClick={() => {
              onCancel()
            }}
          >
            {commonStrings.CANCEL}
          </Button>
        )}
      </Box>
    </form>
  )
}

export default SearchForm
