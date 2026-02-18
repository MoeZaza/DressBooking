import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Fab, Tooltip } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/locations'
import { strings as commonStrings } from '@/lang/common'
import { useLanguage } from '@/context/LanguageContext'
import Search from '@/components/Search'
import LocationList from '@/components/LocationList'
import InfoBox from '@/components/InfoBox'

import '@/assets/css/locations.css'

const Locations = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleLocationListLoad: bookcarsTypes.DataEvent<bookcarsTypes.Location> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleLocationDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="locations">

        <div className="col-1">
          <div className="col-1-container">
            <Search
              className="search"
              onSubmit={handleSearch}
            />

            {rowCount > 0
              && (
                <InfoBox
                  value={`${rowCount} ${rowCount > 1 ? strings.LOCATIONS : strings.LOCATION}`}
                  className="location-count"
                />
              )}

            {rowCount === 0 && (
              <InfoBox
                value={commonStrings.NO_LOCATIONS_FOUND || 'No locations found. Create your first location to get started.'}
                className="no-locations"
              />
            )}
          </div>
        </div>
        <div className="col-2">
          <LocationList
            keyword={keyword}
            onLoad={handleLocationListLoad}
            onDelete={handleLocationDelete}
          />
        </div>

        {/* Floating Action Button for Creating New Location */}
        <Tooltip title={commonStrings.CREATE_NEW_LOCATION || 'Create New Location'}>
          <Fab
            color="primary"
            aria-label="add location"
            onClick={() => navigate('/create-location')}
            id="new-location-fab-btn"
            className="cl-new-location"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </div>
    </Layout>
  )
}

export default Locations
