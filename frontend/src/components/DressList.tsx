import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid'
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ImageList,
  ImageListItem,
  Tooltip,
  Chip
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { strings as commonStrings } from '../lang/common'
import { strings } from '../lang/dresses'
import * as helper from '../common/helper'
import * as DressService from '../services/DressService'
import { Dress } from ':bookcars-types'

// Default avatar utility function
const getDefaultDressImage = (dressName?: string, dressType?: string): string => {
  if (dressName) {
    // Generate a consistent color based on the name
    let hash = 0
    for (let i = 0; i < dressName.length; i++) {
      hash = dressName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    const backgroundColor = colors[Math.abs(hash) % colors.length]

    // Get initials
    const initials = dressName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')

    // Create SVG avatar
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
              text-anchor="middle" dominant-baseline="central" fill="white">
          ${initials}
        </text>
      </svg>
    `
    // Use encodeURIComponent for proper UTF-8 encoding instead of btoa
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  // Return type-specific default images
  const typeImages = {
    'Wedding': '/assets/img/default-wedding-dress.png',
    'Evening': '/assets/img/default-evening-dress.png',
    'Cocktail': '/assets/img/default-cocktail-dress.png',
    'Prom': '/assets/img/default-prom-dress.png'
  }

  return typeImages[dressType as keyof typeof typeImages] || '/assets/img/default-dress.png'
}

interface DressListProps {
  user?: any
  suppliers?: any[]
  keyword?: string
  location?: string
  dressType?: string
  dressSize?: string
  dressStyle?: string
  deposit?: string
  availability?: string
  rentalsCount?: string
  loading?: boolean
  onLoad?: (data: Dress[]) => void
  onDelete?: () => void
}

const DressList: React.FC<DressListProps> = ({
  suppliers,
  keyword,
  location,
  dressType,
  dressSize,
  dressStyle,
  deposit,
  availability,
  rentalsCount,
  loading: externalLoading,
  onLoad
}) => {
  const navigate = useNavigate()
  const [dresses, setDresses] = useState<Dress[]>([])
  const [filteredDresses, setFilteredDresses] = useState<Dress[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDress, setSelectedDress] = useState<Dress | null>(null)
  const [sortModel, setSortModel] = useState([{ field: 'rentals', sort: 'desc' as 'asc' | 'desc' }])

  useEffect(() => {
    console.log('DressList useEffect triggered with location:', location)
    fetchDresses()
  }, [keyword, suppliers, location, dressType, dressSize, dressStyle, deposit, availability, rentalsCount])

  useEffect(() => {
    if (dresses.length > 0) {
      filterDresses()
    }
  }, [dresses, keyword, location, dressType, dressSize, dressStyle, deposit, availability, rentalsCount])

  const fetchDresses = async () => {
    try {
      console.log('DressList: Starting to fetch dresses with props:', {
        suppliers,
        location,
        dressType,
        dressSize,
        dressStyle,
        deposit
      })
      setLoading(true)

      // Build filter payload
      const payload: any = {}

      if (keyword && keyword.trim()) {
        payload.keyword = keyword.trim()
      }

      if (suppliers && suppliers.length > 0) {
        payload.suppliers = suppliers
      }

      if (location) {
        payload.location = location
      }

      if (dressType) {
        payload.dressType = [dressType]
      }

      if (dressSize) {
        payload.dressSize = [dressSize]
      }

      if (dressStyle) {
        payload.material = [dressStyle] // Assuming dressStyle maps to material
      }

      if (deposit) {
        payload.deposit = Number(deposit)
      }

      if (availability) {
        payload.availability = [availability]
      }

      console.log('DressList: Built payload for API call:', payload)
      console.log('DressList: Location parameter type:', typeof location, 'value:', location)
      // Use filtered search if we have any filters, otherwise get all dresses
      let fetchedDresses: Dress[] = []

      if (Object.keys(payload).length > 0) {
        const result = await DressService.getDressesWithFilters(payload, 1, 100)
        console.log('Filtered search result:', result)
        // Handle paginated response structure
        if (result && result.docs && Array.isArray(result.docs)) {
          fetchedDresses = result.docs
        } else if (Array.isArray(result)) {
          fetchedDresses = result
        } else {
          fetchedDresses = []
        }
      } else {
        const result = await DressService.getDresses(1, 100)
        console.log('Basic search result:', result)
        // Handle paginated response structure
        if (result && result.docs && Array.isArray(result.docs)) {
          fetchedDresses = result.docs
        } else if (Array.isArray(result)) {
          fetchedDresses = result
        } else {
          fetchedDresses = []
        }
      }

      console.log('Fetched dresses:', fetchedDresses)
      setDresses(fetchedDresses)
      setFilteredDresses(fetchedDresses)
      if (onLoad) {
        onLoad(fetchedDresses)
      }
    } catch (error) {
      console.error('Error fetching dresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDresses = () => {
    let filtered = [...dresses]

    // Note: Location filtering is handled by the API, not here
    // The API receives the location ID and filters dresses accordingly

    // Filter by dress type
    if (dressType) {
      filtered = filtered.filter(dress => dress.type === dressType)
    }

    // Filter by dress size
    if (dressSize) {
      filtered = filtered.filter(dress => dress.size === dressSize)
    }

    // Filter by dress style
    if (dressStyle) {
      filtered = filtered.filter(dress => dress.style === dressStyle)
    }

    // Filter by deposit
    if (deposit) {
      const depositValue = parseInt(deposit, 10)
      filtered = filtered.filter(dress => dress.deposit <= depositValue)
    }

    // Filter by availability
    if (availability) {
      filtered = filtered.filter(dress => dress.available === (availability === 'available'))
    }

    // Filter by rentals count
    if (rentalsCount) {
      if (rentalsCount === '0') {
        filtered = filtered.filter(dress => !dress.rentals || dress.rentals === 0)
      } else if (rentalsCount === '1-5') {
        filtered = filtered.filter(dress => dress.rentals && dress.rentals >= 1 && dress.rentals <= 5)
      } else if (rentalsCount === '6-10') {
        filtered = filtered.filter(dress => dress.rentals && dress.rentals >= 6 && dress.rentals <= 10)
      } else if (rentalsCount === '11-20') {
        filtered = filtered.filter(dress => dress.rentals && dress.rentals >= 11 && dress.rentals <= 20)
      } else if (rentalsCount === '20+') {
        filtered = filtered.filter(dress => dress.rentals && dress.rentals > 20)
      }
    }

    setFilteredDresses(filtered)
  }

  const handleEdit = (id: string) => {
    navigate(`/dress/${id}`)
  }

  const handleDelete = (dress: Dress) => {
    setSelectedDress(dress)
    setOpenDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedDress) {
      return
    }

    try {
      await DressService.deleteDress(selectedDress._id!)
      setDresses(dresses.filter(d => d._id !== selectedDress._id))
      setOpenDialog(false)
    } catch (error) {
      console.error('Error deleting dress:', error)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'images',
      headerName: commonStrings.IMAGES || 'Images',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const images = params.row.images || []
        const primaryImage = images.length > 0 ? images[0] : getDefaultDressImage(params.row.name, params.row.type)

        return (
          <Tooltip
            title={
              <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
                {images.slice(0, 4).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${params.row.name} ${idx + 1}`}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
                {images.length > 4 && (
                  <Box sx={{
                    width: 60, height: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: 1,
                    fontSize: '0.8rem'
                  }}>
                    +{images.length - 4}
                  </Box>
                )}
              </Box>
            }
            placement="right"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={primaryImage}
                alt={params.row.name}
                sx={{ width: 50, height: 50 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {images.slice(1, 3).map((img: string, idx: number) => (
                  <Avatar
                    key={idx}
                    src={img}
                    alt={`${params.row.name} ${idx + 2}`}
                    sx={{ width: 20, height: 20 }}
                  />
                ))}
              </Box>
              {images.length > 3 && (
                <Chip
                  label={`+${images.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: 18, minWidth: 30 }}
                />
              )}
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'name',
      headerName: strings.NAME,
      width: 250,
      renderCell: (params: GridRenderCellParams) => {
        const dress = params.row
        return dress.dressCode ? `${dress.dressCode}${dress.name ? ` - ${dress.name}` : ''}` : (dress.name || 'Unnamed Dress')
      }
    },
    {
      field: 'dressCode',
      headerName: strings.DRESS_CODE || 'Dress Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          color={params.value ? 'primary' : 'default'}
        />
      )
    },
    {
      field: 'rentals',
      headerName: strings.RENTALS_COUNT || 'Rentals',
      width: 120,
      valueGetter: (params: any) => params.value || 0
    },
    {
      field: 'type',
      headerName: strings.DRESS_TYPE,
      width: 150,
      valueGetter: (params: any) => {
        const type = params.value
        switch (type) {
          case 'Wedding': return strings.WEDDING
          case 'Evening': return strings.EVENING
          case 'Cocktail': return strings.COCKTAIL
          case 'Prom': return strings.PROM
          default: return strings.OTHER
        }
      }
    },
    {
      field: 'size',
      headerName: strings.DRESS_SIZE,
      width: 120,
      valueGetter: (params: any) => {
        const size = params.value
        switch (size) {
          case 'XS': return strings.SIZE_XS || 'XS'
          case 'S': return strings.SIZE_S || 'S'
          case 'M': return strings.SIZE_M || 'M'
          case 'L': return strings.SIZE_L || 'L'
          case 'XL': return strings.SIZE_XL || 'XL'
          case 'XXL': return strings.SIZE_XXL || 'XXL'
          default: return strings.SIZE_CUSTOM || 'Custom'
        }
      }
    },

    {
      field: 'actions',
      headerName: strings.ACTIONS,
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Button
            variant="text"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row._id)}
          >
            <Edit />
          </Button>
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row)}
          >
            <Delete />
          </Button>
        </Box>
      ),
    },
  ]

  return (
    <div style={{ height: 600, width: '100%', minWidth: 800 }}>
      <DataGrid
        rows={filteredDresses}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading || externalLoading}
        initialState={{
          sorting: {
            sortModel: [{ field: 'rentals', sort: 'desc' }],
          },
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        sortingMode="client"
        disableRowSelectionOnClick
      />

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{strings.CONFIRM_DELETE}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {strings.DELETE_DRESS_CONFIRM}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            {strings.CANCEL}
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            {strings.DELETE}
          </Button>
        </DialogActions>
      </Dialog>


    </div>
  )
}

export default DressList
