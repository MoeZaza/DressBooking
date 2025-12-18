import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Fab, Tooltip } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext'
import { strings } from '@/lang/countries'
import { strings as commonStrings } from '@/lang/common'
import Search from '@/components/Search'
import CountryList from '@/components/CountryList'
import InfoBox from '@/components/InfoBox'

import '@/assets/css/countries.css'

const Countries = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleCountryListLoad: bookcarsTypes.DataEvent<bookcarsTypes.Country> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleCountryDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="countries">

        <div className="col-1">
          <div className="col-1-container">
            <Search className="search" onSubmit={handleSearch} />

            {rowCount > 0
              && (
                <InfoBox
                  value={`${rowCount} ${rowCount > 1 ? strings.COUNTRIES : strings.COUNTRY}`}
                  className="country-count"
                />
              )}
          </div>
        </div>
        <div className="col-2">
          <CountryList
            keyword={keyword}
            onLoad={handleCountryListLoad}
            onDelete={handleCountryDelete}
          />
        </div>

        {/* Floating Action Button for Creating New Country */}
        <Tooltip title="Create New Country">
          <Fab
            color="primary"
            aria-label="add country"
            onClick={() => navigate('/create-country')}
            id="new-country-fab-btn"
            className="cl-new-country"
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

export default Countries
