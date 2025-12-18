import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Typography,
  Fab,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/dresses'
import { useLanguage } from '@/context/LanguageContext'
import * as helper from '@/common/helper'
import * as SupplierService from '@/services/SupplierService'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import DressList from '@/components/DressList'
import DressTypeFilter from '@/components/DressTypeFilter'
import DressSizeFilter from '@/components/DressSizeFilter'
import DressStyleFilter from '@/components/DressStyleFilter'
import DepositFilter from '@/components/DepositFilter'
import AvailabilityFilter from '@/components/AvailabilityFilter'
import RentalsCountFilter from '@/components/RentalsCountFilter'
import SearchBox from '@/components/SearchBox'

import '../assets/css/dresses.css'

const Dresses = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [dressType, setDressType] = useState('')
  const [dressSize, setDressSize] = useState('')
  const [dressStyle, setDressStyle] = useState('')
  const [deposit, setDeposit] = useState('')
  const [availability, setAvailability] = useState('')
  const [rentalsCount, setRentalsCount] = useState('')
  const [keyword, setKeyword] = useState('')
  const [reload, setReload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rowCount, setRowCount] = useState(0)

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = UserService.getCurrentUser()
        if (currentUser) {
          const _admin = helper.admin(currentUser)
          setUser(currentUser)
          setAdmin(_admin)

          const _allSuppliers = await SupplierService.getAllSuppliers()
          const _suppliers = _admin ? _allSuppliers.map((supplier) => supplier._id) : [currentUser._id]
          setAllSuppliers(_allSuppliers)
          setSuppliers(_suppliers.filter(s => s !== undefined) as string[])
        }
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleDressTypeFilterChange = (value: string) => {
    setDressType(value)
    setReload(true)
  }

  const handleDressSizeFilterChange = (value: string) => {
    setDressSize(value)
    setReload(true)
  }

  const handleDressStyleFilterChange = (value: string) => {
    setDressStyle(value)
    setReload(true)
  }

  const handleDepositFilterChange = (value: number) => {
    setDeposit(value.toString())
    setReload(true)
  }

  const handleAvailabilityFilterChange = (values: bookcarsTypes.Availablity[]) => {
    setAvailability(values.join(','))
    setReload(true)
  }

  const handleRentalsCountFilterChange = (value: string) => {
    setRentalsCount(value)
    setReload(true)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
    setReload(true)
  }

  const handleDressListLoad = (data?: bookcarsTypes.Data<bookcarsTypes.Dress>) => {
    if (data && data.rowCount !== undefined) {
      setRowCount(data.rowCount)
    }
  }

  const handleDressDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  return (
    <Layout>
      {!user ? (
        <div className="loading-container" style={{ padding: '20px', textAlign: 'center', minHeight: '200px' }}>
          <Typography variant="h6">Loading user data...</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please wait while we verify your authentication.
          </Typography>
        </div>
      ) : (
        <div className="dresses">

          <div className="col-1">
            <div className="col-1-container">
              <SearchBox
                className="dress-search"
                onSubmit={handleSearch}
              />

              <div className="dress-filters">
                <DressTypeFilter
                  className="dress-filter"
                  onChange={handleDressTypeFilterChange}
                />
                <DressSizeFilter
                  className="dress-filter"
                  onChange={handleDressSizeFilterChange}
                />
                <DressStyleFilter
                  className="dress-filter"
                  onChange={handleDressStyleFilterChange}
                />
                <DepositFilter
                  className="dress-filter"
                  onChange={handleDepositFilterChange}
                />
                <RentalsCountFilter
                  className="dress-filter"
                  onChange={handleRentalsCountFilterChange}
                />
                {admin && (
                  <AvailabilityFilter
                    className="dress-filter"
                    onChange={handleAvailabilityFilterChange}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="col-2">
            <div className="col-2-container">
              <DressList
                user={user}
                suppliers={suppliers}
                dressType={dressType ? [dressType] : []}
                dressSize={dressSize ? [dressSize] : []}
                dressStyle={dressStyle ? [dressStyle] : []}
                deposit={deposit ? Number(deposit) : undefined}
                availability={availability ? availability.split(',') : []}
                rentalsCount={rentalsCount}
                keyword={keyword}
                loading={loading}
                onLoad={handleDressListLoad}
                onDelete={handleDressDelete}
              />
            </div>
          </div>

          {/* Floating Action Button for Creating New Dress */}
          {admin && (
            <Tooltip title="Create New Dress">
              <Fab
                color="primary"
                aria-label="add dress"
                onClick={() => navigate('/create-dress')}
                id="new-dress-fab-btn"
                className="cl-new-dress"
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

export default Dresses
