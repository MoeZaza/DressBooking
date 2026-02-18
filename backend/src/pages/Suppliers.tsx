import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Box, IconButton, Tooltip, Fab } from '@mui/material'
import { Refresh as RefreshIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/suppliers'
import { strings as commonStrings } from '@/lang/common'
import { useLanguage } from '@/context/LanguageContext'
import Search from '@/components/Search'
import SupplierList from '@/components/SupplierList'
import InfoBox from '@/components/InfoBox'
import * as helper from '@/common/helper'

import '@/assets/css/suppliers.css'

const Suppliers = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleSupplierListLoad: bookcarsTypes.DataEvent<bookcarsTypes.User> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleSupplierDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  const admin = helper.admin(user)

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="suppliers">

          <div className="col-1">
            <div className="col-1-container">
              <Search className="search" onSubmit={handleSearch} />

              {rowCount > 0 && (
              <InfoBox
                value={`${rowCount} ${rowCount > 1 ? strings.SUPPLIERS : strings.SUPPLIER}`}
                className="supplier-count"
              />
)}
            </div>
          </div>
          <div className="col-2">
            <SupplierList
              user={user}
              keyword={keyword}
              onLoad={handleSupplierListLoad}
              onDelete={handleSupplierDelete}
            />
          </div>

          {/* Floating Action Button for Creating New Supplier */}
          {admin && (
            <Tooltip title={commonStrings.CREATE_NEW_SUPPLIER || 'Create New Supplier'}>
              <Fab
                color="primary"
                aria-label="add supplier"
                onClick={() => navigate('/create-supplier')}
                id="new-supplier-fab-btn"
                className="cl-new-supplier"
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
          )}
        </div>
      )}
    </Layout>
  )
}

export default Suppliers
