import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@mui/material'
import { Tune as FiltersIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings } from '@/lang/search'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import * as LocationService from '@/services/LocationService'
import * as SupplierService from '@/services/SupplierService'
// import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import SearchForm from '@/components/SearchForm'
import SupplierFilter from '@/components/SupplierFilter'
import DepositFilter from '@/components/DepositFilter'
import DressList from '@/components/DressList'
import DressTypeFilter from '@/components/DressTypeFilter'
import DressSizeFilter from '@/components/DressSizeFilter'
import DressStyleFilter from '@/components/DressStyleFilter'
import DressMaterialFilter from '@/components/DressMaterialFilter'
import Map from '@/components/Map'
// import Progress from '@/components/Progress'
import ViewOnMapButton from '@/components/ViewOnMapButton'
import MapDialog from '@/components/MapDialog'

import '@/assets/css/search.css'

const Search = () => {
  const location = useLocation()

  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [keyword, setKeyword] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [allSuppliersIds, setAllSuppliersIds] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [supplierIds, setSupplierIds] = useState<string[]>()
  const [loading, setLoading] = useState(true)
  const [dressType, setDressType] = useState(bookcarsHelper.getAllDressTypes())
  const [dressSize, setDressSize] = useState(bookcarsHelper.getAllDressSizes())
  const [dressStyle, setDressStyle] = useState(bookcarsHelper.getAllDressStyles())
  const [dressMaterial, setDressMaterial] = useState(bookcarsHelper.getAllDressMaterials())
  const [deposit, setDeposit] = useState(-1)
  const [openMapDialog, setOpenMapDialog] = useState(false)
  // const [distance, setDistance] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  // const [loadingPage, setLoadingPage] = useState(true)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const fetchedSuppliers = await SupplierService.getAllSuppliers()
        setAllSuppliers(fetchedSuppliers)
        setAllSuppliersIds(bookcarsHelper.flattenSuppliers(fetchedSuppliers))
      } catch (err) {
        helper.error(err, 'Failed to fetch suppliers')
      }
    }

    fetchSuppliers()
  }, [])

  useEffect(() => {
    const updateSuppliers = async () => {
      if (selectedLocation) {
        const payload: bookcarsTypes.GetDressesPayload = {
          location: selectedLocation._id,
          dressType,
          dressSize,
          material: dressMaterial,
          deposit,
        }
        const _suppliers = await SupplierService.getFrontendSuppliers(payload)
        setSuppliers(_suppliers)
        setSupplierIds(bookcarsHelper.flattenSuppliers(_suppliers))
      } else {
        // If no location is selected, show all suppliers
        setSuppliers(allSuppliers)
        setSupplierIds(allSuppliersIds)
      }
    }

    // Update suppliers whenever search parameters change
    updateSuppliers()
  }, [selectedLocation, dressType, dressSize, dressStyle, dressMaterial, deposit, allSuppliers, allSuppliersIds])

  const handleSupplierFilterChange = (newSuppliers: string[]) => {
    setSupplierIds(newSuppliers)
  }

  const handleDressTypeFilterChange = (value: string) => {
    setDressType(value ? [value as bookcarsTypes.DressType] : bookcarsHelper.getAllDressTypes())
  }

  const handleDressSizeFilterChange = (value: string) => {
    setDressSize(value ? [value as bookcarsTypes.DressSize] : bookcarsHelper.getAllDressSizes())
  }

  const handleDressStyleFilterChange = (value: string) => {
    setDressStyle(value ? [value as bookcarsTypes.DressStyle] : bookcarsHelper.getAllDressStyles())
  }

  const handleDressMaterialFilterChange = (value: string) => {
    setDressMaterial(value ? [value as bookcarsTypes.DressMaterial] : bookcarsHelper.getAllDressMaterials())
  }

  const handleDepositFilterChange = (value: number) => {
    setDeposit(value)
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    const { state } = location
    const searchParams = new URLSearchParams(location.search)

    // Extract search parameters from state (if available) and URL query parameters
    const _keyword = state?.keyword || searchParams.get('keyword')
    const locationId = state?.locationId || searchParams.get('location')
    const _from = state?.from
    const _to = state?.to
    const urlDressType = searchParams.get('type')

    // Check if we have search parameters
    const hasSearchParams = _keyword || locationId || _from || _to || urlDressType

    // Set keyword if provided
    if (_keyword) {
      setKeyword(_keyword)
    }

    // Handle dress type from URL query parameter
    if (urlDressType) {
      // Cast string to DressType enum value
      const dressTypeEnum = urlDressType as bookcarsTypes.DressType
      setDressType([dressTypeEnum])
    }

    let _selectedLocation
    let _suppliers: bookcarsTypes.User[] = []
    let _supplierIds: string[] = []

    try {
      // Only load location if locationId is provided
      if (locationId) {
        _selectedLocation = await LocationService.getLocation(locationId)

        if (!_selectedLocation) {
          setLoading(false)
          setNoMatch(true)
          return
        }

        const payload: bookcarsTypes.GetDressesPayload = {
          location: _selectedLocation._id,
          dressType,
          dressSize,
          material: dressMaterial,
          deposit,
        }
        _suppliers = await SupplierService.getFrontendSuppliers(payload)
        _supplierIds = bookcarsHelper.flattenSuppliers(_suppliers)
      }

      setSelectedLocation(_selectedLocation)
      setFrom(_from)
      setTo(_to)
      setSuppliers(_suppliers)
      setSupplierIds(_supplierIds)

      // const { ranges: _ranges } = state
      // if (_ranges) {
      //   setRanges(_ranges)
      // }

      // if (_pickupLocation.latitude && _pickupLocation.longitude) {
      //   const l = await helper.getLocation()
      //   if (l) {
      //     const d = bookcarsHelper.distance(_pickupLocation.latitude, _pickupLocation.longitude, l[0], l[1], 'K')
      //     setDistance(bookcarsHelper.formatDistance(d, UserService.getLanguage()))
      //   }
      // }

      setLoading(false)
      if (!user || (user && user.verified)) {
        setVisible(true)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <>
      <Layout onLoad={onLoad} strict={false}>
        {visible && !noMatch && (
          <>
            {/* Search Form */}
            <div className="search-form-container">
              <SearchForm
                location={selectedLocation?._id}
                onFormSubmit={(data: bookcarsTypes.SearchFormData) => {
                  // Handle search form submission

                  // Update search state with form data
                  if (data.keyword !== undefined) {
                    setKeyword(data.keyword || '')
                  }

                  if (data.location) {
                    // Ensure we have the full location object for display
                    // If data.location is just an ID string, fetch the full object
                    if (typeof data.location === 'string') {
                      // It's already an ID, fetch the location object
                      LocationService.getLocation(data.location).then(locationObj => {
                        setSelectedLocation(locationObj)
                      }).catch(err => {
                        console.error('Error fetching location:', err)
                        setSelectedLocation(undefined)
                      })
                    } else if (data.location._id) {
                      // It's a location object with _id
                      setSelectedLocation(data.location)
                    } else {
                      // Invalid location data
                      console.error('Invalid location data:', data.location)
                      setSelectedLocation(undefined)
                    }
                  }

                  if (data.dressType !== undefined) {
                    setDressType(data.dressType ? [data.dressType as bookcarsTypes.DressType] : bookcarsHelper.getAllDressTypes())
                  }

                  if (data.dressSize !== undefined) {
                    setDressSize(data.dressSize ? [data.dressSize as bookcarsTypes.DressSize] : bookcarsHelper.getAllDressSizes())
                  }

                  if (data.dressStyle !== undefined) {
                    setDressStyle(data.dressStyle ? [data.dressStyle as bookcarsTypes.DressStyle] : bookcarsHelper.getAllDressStyles())
                  }

                  if (data.from && data.to) {
                    setFrom(data.from)
                    setTo(data.to)
                  }
                }}
              />
            </div>

            <div className="search">
              <div className="col-1">
              {!loading && (
                <>
                  {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
                      <Map
                        position={[selectedLocation.latitude, selectedLocation.longitude]}
                        initialZoom={10}
                        locations={[selectedLocation]}

                        className="map"
                      >
                        <ViewOnMapButton onClick={() => setOpenMapDialog(true)} />
                      </Map>
                    )}

                  {/* Dress filter would go here if needed */}

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<FiltersIcon />}
                    disableElevation
                    fullWidth
                    className="btn btn-filters"
                    onClick={() => setShowFilters((prev) => !prev)}
                  >
                    {showFilters ? strings.HIDE_FILTERS : strings.SHOW_FILTERS}
                  </Button>

                  {
                    showFilters && (
                      <>
                        {!env.HIDE_SUPPLIERS && <SupplierFilter className="filter" suppliers={suppliers} onChange={handleSupplierFilterChange} />}
                        <DressTypeFilter className="filter" onChange={handleDressTypeFilterChange} />
                        <DressSizeFilter className="filter" onChange={handleDressSizeFilterChange} />
                        <DressStyleFilter className="filter" onChange={handleDressStyleFilterChange} />
                        <DressMaterialFilter className="filter" onChange={handleDressMaterialFilterChange} />
                        <DepositFilter className="filter" onChange={handleDepositFilterChange} />
                      </>
                    )
                  }
                </>
              )}
            </div>
            <div className="col-2">
              <DressList
                suppliers={supplierIds}
                keyword={keyword}
                location={selectedLocation?._id}
                dressType={dressType.length === 1 ? dressType[0] : ''}
                dressSize={dressSize.length === 1 ? dressSize[0] : ''}
                dressStyle={dressStyle.length === 1 ? dressStyle[0] : ''}
                dressMaterial={dressMaterial.length === 1 ? dressMaterial[0] : ''}
                deposit={deposit.toString()}
                from={from}
                to={to}
                loading={loading}
              />
            </div>
          </div>
          </>
        )}

        <MapDialog
          location={selectedLocation}
          openMapDialog={openMapDialog}
          onClose={() => setOpenMapDialog(false)}
        />

        {noMatch && <NoMatch hideHeader />}
      </Layout>

      {/* {loadingPage && !noMatch && <Progress />} */}
    </>
  )
}

export default Search
