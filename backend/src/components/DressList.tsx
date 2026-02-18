import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  Typography
 } from '@mui/material'
import {
  Checkroom as DressTypeIcon,
  Straighten as LengthIcon,
  Palette as ColorIcon,
  Check as CheckIcon,
  Clear as UncheckIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import Const from '@/config/const'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/dresses'
import { useLanguage } from '@/context/LanguageContext'
import * as helper from '@/common/helper'
import * as DressService from '@/services/DressService'
import Pager from '@/components/Pager'
import SimpleBackdrop from '@/components/SimpleBackdrop'
import SupplierBadge from '@/components/SupplierBadge'
import DressCodeManager from '@/components/DressCodeManager'
import { getDefaultDressImage } from '@/utils/avatarUtils'

import RatingIcon from '@/assets/img/rating-icon.png'

import '@/assets/css/dress-list.css'
import '@/assets/css/enhanced-dress-list.css'

interface DressListProps {
  suppliers?: string[]
  keyword?: string
  dressSpecs?: bookcarsTypes.DressSpecs
  dressType?: string[]
  dressSize?: string[]
  dressStyle?: string[]
  deposit?: number
  availability?: string[]
  reload?: boolean
  dresses?: bookcarsTypes.Dress[]
  user?: bookcarsTypes.User
  booking?: bookcarsTypes.Booking
  className?: string
  loading?: boolean
  hideSupplier?: boolean
  hidePrice?: boolean
  language?: string
  range?: string[]
  rentalsCount?: string
  onLoad?: bookcarsTypes.DataEvent<bookcarsTypes.Dress>
  onDelete?: (rowCount: number) => void
}

const DressList = ({
  suppliers: dressSuppliers,
  keyword: dressKeyword,
  dressSpecs: _dressSpecs,
  dressType: _dressType,
  dressSize: _dressSize,
  dressStyle: _dressStyle,
  deposit: dressDeposit,
  availability: dressAvailability,
  reload,
  dresses,
  user: dressUser,
  booking,
  className,
  loading: dressLoading,
  hideSupplier,
  hidePrice,
  language,
  range,
  rentalsCount,
  onLoad,
  onDelete
}: DressListProps) => {
  const navigate = useNavigate()
  const { language: contextLanguage, isRTL } = useLanguage()

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [rows, setRows] = useState<bookcarsTypes.Dress[]>([])
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [dressId, setDressId] = useState('')
  const [dressIndex, setDressIndex] = useState(-1)
  const [openInfoDialog, setOpenInfoDialog] = useState(false)
  const [openDressCodeManager, setOpenDressCodeManager] = useState(false)
  const [selectedDress, setSelectedDress] = useState<bookcarsTypes.Dress | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
      const element = document.querySelector('body')

      if (element) {
        element.onscroll = () => {
          if (fetch
            && !loading
            && window.scrollY > 0
            && window.scrollY + window.innerHeight + env.INFINITE_SCROLL_OFFSET >= document.body.scrollHeight) {
            setLoading(true)
            setPage(page + 1)
          }
        }
      }

      // Cleanup scroll event listener on unmount
      return () => {
        if (element) {
          element.onscroll = null
        }
      }
    }
  }, [fetch, loading, page])

  // Cleanup abort controller and mounted state on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const fetchData = async (
    _page: number,
    suppliers?: string[],
    keyword?: string,
    dressSpecs?: bookcarsTypes.DressSpecs,
    __dressType?: string[],
    __dressSize?: string[],
    __dressStyle?: string[],
    deposit?: number,
    availability?: string[],
    _range?: string[],
    _rentalsCount?: string,
  ) => {
    // Create new AbortController for this fetch
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Abort if component is unmounted before fetch starts
    if (!isMountedRef.current) {
      return
    }

    try {
      setLoading(true)

      // Timeout prevention: Set a maximum timeout for API calls with abort
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 15000)

      const payload: bookcarsTypes.GetDressesPayload = {
        suppliers: suppliers ?? [],
        dressSpecs,
        dressType: __dressType,
        dressSize: __dressSize,
        deposit,
        availability,
        ranges: _range,
      }

      // Fetch data with abort signal
      let data
      try {
        data = await DressService.getDresses(keyword || '', payload, _page, env.DRESSES_PAGE_SIZE)
      } catch (err: any) {
        // If aborted, don't treat as error
        if (err.name === 'AbortError' || controller.signal.aborted) {
          clearTimeout(timeoutId)
          return
        }
        throw err
      }

      clearTimeout(timeoutId)

      // Check if component is still mounted before processing data
      if (!isMountedRef.current) {
        return
      }

      // Handle the API response structure - data might be in 'docs' field, 'resultData' field, or direct array
      let _data
      if (data && Array.isArray(data) && data.length > 0) {
        const firstItem = data[0] as any
        if (firstItem && firstItem.resultData) {
          // Standard format: [{resultData: [...], pageInfo: [...]}]
          _data = firstItem
        } else if (firstItem && firstItem.docs) {
          // Mongoose-paginate-v2 format: [{docs: [...], totalDocs: ...}]
          _data = {
            pageInfo: [{ totalRecords: firstItem.totalDocs || 0 }],
            resultData: firstItem.docs || []
          }
        } else {
          // Direct array format: [...]
          _data = {
            pageInfo: [{ totalRecords: data.length }],
            resultData: data
          }
        }
      } else if (data && typeof data === 'object' && 'docs' in data) {
        // Direct mongoose-paginate-v2 response: {docs: [...], totalDocs: ...}
        const paginatedData = data as any
        _data = {
          pageInfo: [{ totalRecords: paginatedData.totalDocs || 0 }],
          resultData: paginatedData.docs || []
        }
      } else {
        _data = { pageInfo: { totalRecord: 0 }, resultData: [] }
      }

      if (!_data) {
        helper.error()
        return
      }
      const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0

      let _rows: bookcarsTypes.Dress[] = []
      if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
        _rows = _page === 1 ? _data.resultData : [...rows, ..._data.resultData]
      } else {
        _rows = _data.resultData
      }

      setRows(_rows)
      setRowCount((_page - 1) * env.DRESSES_PAGE_SIZE + _rows.length)
      setTotalRecords(_totalRecords)
      setFetch(_data.resultData.length > 0)

      if (((env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) && _page === 1) || (env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile)) {
        window.scrollTo(0, 0)
      }

      if (onLoad) {
        onLoad({ rows: _data.resultData, rowCount: _totalRecords })
      }
    } catch (err: any) {
      // Don't show error if request was aborted (component unmounted)
      if (err.name === 'AbortError' || controller.signal.aborted || !isMountedRef.current) {
        return
      }

      console.error('DressList fetchData error:', err)

      // Handle timeout specifically
      if (err.message && err.message.includes('timeout')) {
        helper.error('Request timed out. Please try again or contact support if the issue persists.')
        // Set empty data to prevent infinite loading
        setRows([])
        setRowCount(0)
        setTotalRecords(0)
        setFetch(false)
      } else {
        helper.error(err)
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false)
        setInit(false)
      }
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    if (dressSuppliers) {
      if (dressSuppliers.length > 0) {
        fetchData(
          page,
          dressSuppliers,
          dressKeyword,
          _dressSpecs,
          _dressType,
          _dressSize,
          _dressStyle,
          dressDeposit || 0,
          dressAvailability,
          range,
          rentalsCount
        )
      } else {
        setRows([])
        setRowCount(0)
        setFetch(false)
        if (onLoad) {
          onLoad({ rows: [], rowCount: 0 })
        }
        setInit(false)
      }
    }
  }, [page, dressSuppliers, dressKeyword, _dressSpecs, _dressType, _dressSize, _dressStyle, dressDeposit, dressAvailability, range, rentalsCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dresses) {
      setRows(dresses)
      setRowCount(dresses.length)
      setFetch(false)
      if (onLoad) {
        onLoad({ rows: dresses, rowCount: dresses.length })
      }
    }
  }, [dresses]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
  }, [
    dressSuppliers,
    dressKeyword,
    _dressSpecs,
    _dressType,
    _dressSize,
    _dressStyle,
    dressDeposit,
    dressAvailability,
    range,
    rentalsCount,
  ])

  useEffect(() => {
    if (reload) {
      setPage(1)
      fetchData(
        1,
        dressSuppliers,
        dressKeyword,
        _dressSpecs,
        _dressType,
        _dressSize,
        _dressStyle,
        dressDeposit,
        dressAvailability,
        range,
        rentalsCount,
      )
    }
  }, [reload, dressSuppliers, dressKeyword, _dressSpecs, _dressType, _dressSize, _dressStyle, dressDeposit, dressAvailability, range, rentalsCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setUser(dressUser)
  }, [dressUser])

  const handleDelete = async (e: React.MouseEvent<HTMLElement>) => {
    try {
      const _dressId = e.currentTarget.getAttribute('data-id') as string
      const _dressIndex = Number(e.currentTarget.getAttribute('data-index') as string)

      const status = await DressService.check(_dressId)

      if (status === 200) {
        setOpenInfoDialog(true)
      } else if (status === 204) {
        setOpenDeleteDialog(true)
        setDressId(_dressId)
        setDressIndex(_dressIndex)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCloseInfo = () => {
    setOpenInfoDialog(false)
  }

  const handleConfirmDelete = async () => {
    try {
      if (dressId !== '' && dressIndex > -1) {
        setOpenDeleteDialog(false)

        const status = await DressService.deleteDress(dressId)

        if (status === 200) {
          const _rowCount = rowCount - 1
          rows.splice(dressIndex, 1)
          setRows(rows)
          setRowCount(_rowCount)
          setTotalRecords(totalRecords - 1)
          setDressId('')
          setDressIndex(-1)
          if (onDelete) {
            onDelete(_rowCount)
          }
          setLoading(false)
        } else {
          helper.error()
          setDressId('')
          setDressIndex(-1)
          setLoading(false)
        }
      } else {
        helper.error()
        setDressId('')
        setDressIndex(-1)
        setOpenDeleteDialog(false)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setDressId('')
  }

  const handleDressCodeEdit = (dress: bookcarsTypes.Dress) => {
    setSelectedDress(dress)
    setOpenDressCodeManager(true)
  }

  const handleDressCodeUpdate = (updatedDress: bookcarsTypes.Dress) => {
    const updatedRows = rows.map(row =>
      row._id === updatedDress._id
        ? { ...row, dressCode: updatedDress.dressCode }
        : row
    )
    setRows(updatedRows)
  }

  const handleCloseDressCodeManager = () => {
    setOpenDressCodeManager(false)
    setSelectedDress(null)
  }

  const getExtraIcon = (option: string, extra: number) => {
    let available = false
    if (booking) {
      if (option === 'cancellation' && booking.cancellation && extra > 0) {
        available = true
      }
      if (option === 'amendments' && booking.amendments && extra > 0) {
        available = true
      }
    }

    return extra === -1
      ? <UncheckIcon className="unavailable" />
      : extra === 0 || available
        ? <CheckIcon className="available" />
        : <InfoIcon className="extra-info" />
  }

  const admin = helper.admin(user)

  return (
    (user && (
      <>
        <section className={`${className ? `${className} ` : ''}dress-list`}>
          {rows.length === 0
            ? !init
            && !loading
            && !dressLoading
            && (
              <Card variant="outlined" className="empty-list">
                <CardContent>
                  <Typography color="textSecondary">{strings.EMPTY_LIST}</Typography>
                </CardContent>
              </Card>
            )
            : rows.map((dress, index) => {
              const edit = admin || dress.supplier._id === user._id
              return (
                <article key={dress._id}>
                  <div className="dress enhanced-dress-card">
                    <div className="dress-image-container">
                      <img
                        src={dress.images && dress.images.length > 0
                          ? bookcarsHelper.joinURL(env.CDN_DRESSES, dress.images[0])
                          : getDefaultDressImage(dress.name, dress.type)
                        }
                        alt={dress.name}
                        className="dress-img enhanced-dress-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getDefaultDressImage(dress.name, dress.type)
                        }}
                      />
                      {dress.images && dress.images.length > 1 && (
                        <div className="image-count-badge">
                          <span>+{dress.images.length - 1}</span>
                        </div>
                      )}
                      <div className="dress-status-badges">
                        {dress.available && <span className="status-badge available">Available</span>}
                        {dress.fullyBooked && <span className="status-badge booked">Fully Booked</span>}
                        {dress.comingSoon && <span className="status-badge coming-soon">Coming Soon</span>}
                      </div>
                    </div>
                    <div className="dress-footer enhanced-dress-footer">
                      <div className="dress-footer-row1">
                        <div className="rating">
                          {dress.rating && dress.rating >= 1 && (
                            <>
                              <span className="value">{dress.rating.toFixed(2)}</span>
                              <img alt="Rating" src={RatingIcon} />
                            </>
                          )}
                          {edit && dress.rentals && dress.rentals > 0 && <span className="rentals">{`(${dress.rentals} ${strings.RENTALS || 'rentals'})`}</span>}
                        </div>
                      </div>
                      {!hideSupplier && (
                        <SupplierBadge supplier={dress.supplier} />
                      )}
                    </div>
                  </div>
                  <div className="dress-info">
                    <div className="dress-info-header">
                      <div className="name">
                        <h2>
                          {dress.dressCode ? `${dress.dressCode}${dress.name ? ` - ${dress.name}` : ''}` : (dress.name || 'Unnamed Dress')}
                        </h2>
                      </div>
                      {!hidePrice && <div className="price">{`${bookcarsHelper.formatPrice(dress.price, commonStrings.CURRENCY, language as string)}`}</div>}
                    </div>
                    <ul className="dress-info-list">
                      {dress.type !== bookcarsTypes.DressType.Unknown && (
                        <li className="dress-type">
                          <Tooltip title={helper.getDressTypeTooltip(dress.type)} placement="top">
                            <div className="dress-info-list-item">
                              <DressTypeIcon />
                              <span className="dress-info-list-text">{helper.getDressTypeShort(dress.type)}</span>
                            </div>
                          </Tooltip>
                        </li>
                      )}
                      <li className="dress-size">
                        <Tooltip title={helper.getDressSizeTooltip(dress.size)} placement="top">
                          <div className="dress-info-list-item">
                            <span className="dress-info-list-text">{helper.getDressSize(dress.size)}</span>
                          </div>
                        </Tooltip>
                      </li>
                      <li className="dress-color">
                        <Tooltip title={strings.COLOR || 'Color'} placement="top">
                          <div className="dress-info-list-item">
                            <ColorIcon />
                            <span className="dress-info-list-text">{dress.color}</span>
                          </div>
                        </Tooltip>
                      </li>
                      <li className="dress-length">
                        <Tooltip title={strings.LENGTH || 'Length'} placement="top">
                          <div className="dress-info-list-item">
                            <LengthIcon />
                            <span className="dress-info-list-text">{`${dress.length} ${strings.CM || 'cm'}`}</span>
                          </div>
                        </Tooltip>
                      </li>
                      {dress.customizable && (
                        <li className="dress-customizable">
                          <Tooltip title={strings.CUSTOMIZABLE_TOOLTIP || 'This dress can be customized'} placement="top">
                            <div className="dress-info-list-item">
                              <CheckIcon className="available" />
                            </div>
                          </Tooltip>
                        </li>
                      )}
                    </ul>
                    <ul className="extras-list">
                      {edit && (
                        <>
                          <li className={dress.available ? 'dress-available' : 'dress-unavailable'}>
                            <Tooltip title={dress.available ? strings.DRESS_AVAILABLE_TOOLTIP || 'This dress is available' : strings.DRESS_UNAVAILABLE_TOOLTIP || 'This dress is unavailable'}>
                              <div className="dress-info-list-item">
                                {dress.available ? <CheckIcon /> : <UncheckIcon />}
                                {dress.available ? <span className="dress-info-list-text">{strings.DRESS_AVAILABLE || 'Available'}</span> : <span className="dress-info-list-text">{strings.DRESS_UNAVAILABLE || 'Unavailable'}</span>}
                              </div>
                            </Tooltip>
                          </li>
                          {dress.fullyBooked && (
                            <li className="dress-unavailable">
                              <div className="dress-info-list-item">
                                <UncheckIcon />
                                <span className="dress-info-list-text">{strings.FULLY_BOOKED || 'Fully Booked'}</span>
                              </div>
                            </li>
                          )}
                          {dress.comingSoon && (
                            <li className="dress-coming-soon">
                              <div className="dress-info-list-item">
                                <CheckIcon />
                                <span className="dress-info-list-text">{strings.COMING_SOON || 'Coming Soon'}</span>
                              </div>
                            </li>
                          )}
                        </>
                      )}
                      {dress.cancellation > -1 && (
                        <li>
                          <Tooltip title={booking ? '' : dress.cancellation > -1 ? strings.CANCELLATION_TOOLTIP || 'The booking can be cancelled' : helper.getCancellation(dress.cancellation, language as string)} placement="left">
                            <div className="dress-info-list-item">
                              {getExtraIcon('cancellation', dress.cancellation)}
                              <span className="dress-info-list-text">{helper.getCancellation(dress.cancellation, language as string)}</span>
                            </div>
                          </Tooltip>
                        </li>
                      )}
                      {dress.amendments > -1 && (
                        <li>
                          <Tooltip title={booking ? '' : dress.amendments > -1 ? strings.AMENDMENTS_TOOLTIP || 'The booking can be modified' : helper.getAmendments(dress.amendments, language as string)} placement="left">
                            <div className="dress-info-list-item">
                              {getExtraIcon('amendments', dress.amendments)}
                              <span className="dress-info-list-text">{helper.getAmendments(dress.amendments, language as string)}</span>
                            </div>
                          </Tooltip>
                        </li>
                      )}
                    </ul>
                    <div className="action">
                      {edit && (
                        <>
                          <Tooltip title={strings.VIEW_DRESS || 'View Dress'}>
                            <IconButton onClick={() => navigate(`/dress?dr=${dress._id}`)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={commonStrings.UPDATE}>
                            <IconButton onClick={() => navigate(`/update-dress?dr=${dress._id}`)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {admin && (
                            <Tooltip title="Manage Dress Code">
                              <IconButton onClick={() => handleDressCodeEdit(dress)}>
                                <QrCodeIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={commonStrings.DELETE}>
                            <IconButton data-id={dress._id} data-index={index} onClick={handleDelete}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          <Dialog disableEscapeKeyDown maxWidth="xs" open={openInfoDialog}>
            <DialogTitle className="dialog-header">{commonStrings.INFO}</DialogTitle>
            <DialogContent>{strings.CANNOT_DELETE_DRESS || 'This dress cannot be deleted because it is linked to bookings'}</DialogContent>
            <DialogActions className="dialog-actions">
              <Button onClick={handleCloseInfo} variant="contained" className="btn-secondary">
                {commonStrings.CLOSE}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog disableEscapeKeyDown maxWidth="xs" open={openDeleteDialog}>
            <DialogTitle className="dialog-header">{commonStrings.CONFIRM_TITLE}</DialogTitle>
            <DialogContent>{strings.DELETE_DRESS || 'Are you sure you want to delete this dress?'}</DialogContent>
            <DialogActions className="dialog-actions">
              <Button onClick={handleCancelDelete} variant="contained" className="btn-secondary">
                {commonStrings.CANCEL}
              </Button>
              <Button onClick={handleConfirmDelete} variant="contained" color="error">
                {commonStrings.DELETE}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dress Code Manager Dialog */}
          {selectedDress && (
            <DressCodeManager
              open={openDressCodeManager}
              onClose={handleCloseDressCodeManager}
              dress={selectedDress}
              onUpdate={handleDressCodeUpdate}
            />
          )}
        </section>
        {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
          <Pager
            page={page}
            pageSize={env.DRESSES_PAGE_SIZE}
            rowCount={rowCount}
            totalRecords={totalRecords}
            onNext={() => setPage(page + 1)}
            onPrevious={() => setPage(page - 1)}
          />
        )}
        {loading && <SimpleBackdrop text={commonStrings.LOADING} />}
      </>
    )) || <></>
  )
}

export default DressList
