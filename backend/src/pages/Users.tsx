import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Box, IconButton, Tooltip, Fab } from '@mui/material'
import { Refresh as RefreshIcon, Download as DownloadIcon, FilterList as FilterIcon, Add as AddIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/users'
import { strings as commonStrings } from '@/lang/common'
import { useLanguage } from '@/context/LanguageContext'
import * as helper from '@/common/helper'
import UserTypeFilter from '@/components/UserTypeFilter'
import Search from '@/components/Search'
import UserList from '@/components/UserList'

import '@/assets/css/users.css'

const Users = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [types, setTypes] = useState<bookcarsTypes.UserType[]>()
  const [keyword, setKeyword] = useState('')

  const handleUserTypeFilterChange = (newTypes: bookcarsTypes.UserType[]) => {
    setTypes(newTypes)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    const _admin = helper.admin(_user)
    const _types = _admin
      ? helper.getUserTypes().map((userType) => userType.value)
      : [bookcarsTypes.UserType.Supplier, bookcarsTypes.UserType.User]

    setUser(_user)
    setAdmin(_admin)
    setTypes(_types)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="users">

          <div className="col-1">
            <div className="div.col-1-container">
              <Search onSubmit={handleSearch} className="search" />

              {admin
                && (
                  <UserTypeFilter
                    className="user-type-filter"
                    onChange={handleUserTypeFilterChange}
                  />
                )}
            </div>
          </div>
          <div className="col-2">
            <UserList
              user={user}
              types={types}
              keyword={keyword}
              checkboxSelection={!env.isMobile && admin}
              hideDesktopColumns={env.isMobile}
            />
          </div>

          {/* Floating Action Button for Creating New User */}
          {admin && (
            <Tooltip title={commonStrings.CREATE_NEW_USER || 'Create New User'}>
              <Fab
                color="primary"
                aria-label="add user"
                onClick={() => navigate('/create-user')}
                id="new-user-fab-btn"
                className="cl-new-user"
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

export default Users
