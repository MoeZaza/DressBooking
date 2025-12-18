import React, { useState, useRef } from 'react'
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'

interface SearchAndFilterProps {
  onSearch?: (keyword: string) => void
  onFilter?: (filters: SearchFilters) => void
  onClear?: () => void
  showDateFilter?: boolean
  showStatusFilter?: boolean
  showSupplierFilter?: boolean
  showLocationFilter?: boolean
  statusOptions?: { value: string; label: string }[]
  supplierOptions?: { value: string; label: string }[]
  locationOptions?: { value: string; label: string }[]
  className?: string
  placeholder?: string
}

interface SearchFilters {
  keyword?: string
  dateFrom?: Date | null
  dateTo?: Date | null
  status?: string
  supplier?: string
  location?: string
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  onFilter,
  onClear,
  showDateFilter = false,
  showStatusFilter = false,
  showSupplierFilter = false,
  showLocationFilter = false,
  statusOptions = [],
  supplierOptions = [],
  locationOptions = [],
  className = '',
  placeholder,
}) => {
  const { language, isRTL } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    if (onSearch) {
      onSearch(keyword)
    }
    if (onFilter) {
      onFilter({ ...filters, keyword })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleFilterChange = (filterKey: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [filterKey]: value }
    setFilters(newFilters)
    
    if (onFilter) {
      onFilter({ ...newFilters, keyword })
    }
  }

  const handleClear = () => {
    setKeyword('')
    setFilters({})
    if (onClear) {
      onClear()
    }
    if (onSearch) {
      onSearch('')
    }
    if (onFilter) {
      onFilter({})
    }
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length
  }

  return (
    <Box className={`search-and-filter ${className}`}>
      {/* Search Input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          size="small"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || commonStrings.SEARCH_PLACEHOLDER}
          dir={isRTL ? 'rtl' : 'ltr'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {keyword && (
                  <IconButton
                    size="small"
                    onClick={() => setKeyword('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={handleSearch}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {(showDateFilter || showStatusFilter || showSupplierFilter || showLocationFilter) && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterIcon />}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {commonStrings.FILTER || 'Filter'}
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={getActiveFiltersCount()}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Button>
        )}
      </Box>

      {/* Advanced Filters */}
      {showFilters && (
        <Accordion expanded={showFilters} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              {commonStrings.ADVANCED_FILTERS || 'Advanced Filters'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              
              {/* Date Range Filter */}
              {showDateFilter && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: 'flex', gap: 1, minWidth: 300 }}>
                    <DatePicker
                      label={commonStrings.FROM || 'From'}
                      value={filters.dateFrom || null}
                      onChange={(date) => handleFilterChange('dateFrom', date)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker
                      label={commonStrings.TO || 'To'}
                      value={filters.dateTo || null}
                      onChange={(date) => handleFilterChange('dateTo', date)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </LocalizationProvider>
              )}

              {/* Status Filter */}
              {showStatusFilter && statusOptions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{commonStrings.STATUS || 'Status'}</InputLabel>
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label={commonStrings.STATUS || 'Status'}
                  >
                    <MenuItem value="">
                      <em>{commonStrings.ALL || 'All'}</em>
                    </MenuItem>
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Supplier Filter */}
              {showSupplierFilter && supplierOptions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{commonStrings.SUPPLIER || 'Supplier'}</InputLabel>
                  <Select
                    value={filters.supplier || ''}
                    onChange={(e) => handleFilterChange('supplier', e.target.value)}
                    label={commonStrings.SUPPLIER || 'Supplier'}
                  >
                    <MenuItem value="">
                      <em>{commonStrings.ALL || 'All'}</em>
                    </MenuItem>
                    {supplierOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Location Filter */}
              {showLocationFilter && locationOptions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{commonStrings.LOCATION || 'Location'}</InputLabel>
                  <Select
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    label={commonStrings.LOCATION || 'Location'}
                  >
                    <MenuItem value="">
                      <em>{commonStrings.ALL || 'All'}</em>
                    </MenuItem>
                    {locationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Clear Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClear}
                  color="secondary"
                >
                  {commonStrings.CLEAR_FILTERS || 'Clear Filters'}
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}

export default SearchAndFilter
