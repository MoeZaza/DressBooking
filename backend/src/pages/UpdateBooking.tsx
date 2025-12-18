import React, { useState } from 'react'
import {
  Input,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import * as BookingService from '../services/BookingService'
import * as helper from '../common/helper'
import { strings as commonStrings } from '../lang/common'
import { strings } from '../lang/create-booking'
import UserSelectList from '../components/UserSelectList'
import SupplierSelectList from '../components/SupplierSelectList'
import DressSelectList from '../components/DressSelectList'
import LocationSelectList from '../components/LocationSelectList'
import NoMatch from './NoMatch'
import Error from './Error'

import '../assets/css/create-booking.css'

const UpdateBooking: React.FC = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState(false)
  const [booking, setBooking] = useState<bookcarsTypes.Booking>()
  const [supplier, setSupplier] = useState('')
  const [dress, setDress] = useState('')
  const [customer, setCustomer] = useState('')
  const [location, setLocation] = useState('')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [status, setStatus] = useState(bookcarsTypes.BookingStatus.Pending)
  const [cancellation, setCancellation] = useState(false)
  const [amendments, setAmendments] = useState(false)
  const [price, setPrice] = useState('')
  const [formError, setFormError] = useState(false)
  const [updateError, setUpdateError] = useState(false)

  const handleSupplierChange = (values: bookcarsTypes.Option[]) => {
    setSupplier(values.length > 0 ? values[0]._id : '')
  }

  const handleDressChange = (values: bookcarsTypes.Option[]) => {
    setDress(values.length > 0 ? values[0]._id : '')
  }

  const handleCustomerChange = (values: bookcarsTypes.Option[]) => {
    setCustomer(values.length > 0 ? values[0]._id : '')
  }

  const handleLocationChange = (values: bookcarsTypes.Option[]) => {
    setLocation(values.length > 0 ? values[0]._id : '')
  }

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatus(e.target.value as bookcarsTypes.BookingStatus)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!supplier || !dress || !customer || !location || !from || !to || !price) {
        setFormError(true)
        setUpdateError(false)
        return
      }

      setLoading(true)
      setFormError(false)
      setUpdateError(false)

      const data: bookcarsTypes.UpsertBookingPayload = {
        booking: {
          _id: booking!._id,
          supplier,
          dress,
          customer,
          location,
          from,
          to,
          status,
          cancellation,
          amendments,
          price: Number(price)
        }
      }

      const result = await BookingService.update(data)

      if (result === 200) {
        navigate('/')
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setUser(user)

      const params = new URLSearchParams(window.location.search)
      if (params.has('b')) {
        const id = params.get('b')
        if (id && id !== '') {
          try {
            const booking = await BookingService.getBooking(id)
            
            if (booking) {
              setBooking(booking)
              setSupplier(typeof booking.supplier === 'string' ? booking.supplier : booking.supplier._id!)
              setDress(typeof booking.dress === 'string' ? booking.dress : booking.dress!._id!)
              setCustomer(typeof booking.customer === 'string' ? booking.customer : booking.customer!._id!)
              setLocation(typeof booking.location === 'string' ? booking.location : booking.location._id!)
              setFrom(new Date(booking.from))
              setTo(new Date(booking.to))
              setStatus(booking.status)
              setCancellation(booking.cancellation || false)
              setAmendments(booking.amendments || false)
              setPrice(booking.price?.toString() || '')
              setVisible(true)
            } else {
              setNoMatch(true)
            }
          } catch (err) {
            console.error(err)
            setError(true)
          }
        } else {
          setNoMatch(true)
        }
      } else {
        setNoMatch(true)
      }
    }
  }

  if (error) {
    return <Error />
  }

  if (noMatch) {
    return <NoMatch />
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="create-booking">
        <Paper className="booking-form booking-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
          <h1 className="booking-form-title">{commonStrings.UPDATE}</h1>
          <form onSubmit={handleSubmit}>
            {helper.admin(user) && (
              <FormControl fullWidth margin="dense">
                <SupplierSelectList
                  label={commonStrings.SUPPLIER}
                  required
                  value={supplier ? { _id: supplier, name: '' } : undefined}
                  onChange={handleSupplierChange}
                />
              </FormControl>
            )}

            <FormControl fullWidth margin="dense">
              <DressSelectList
                key={supplier} // Force re-render when supplier changes
                label={strings.DRESS}
                required
                supplier={supplier}
                value={dress}
                onChange={handleDressChange}
              />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <UserSelectList
                label={strings.CUSTOMER}
                required
                value={customer ? [{ _id: customer, name: '' }] : []}
                onChange={handleCustomerChange}
              />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <LocationSelectList
                label={strings.LOCATION}
                required
                value={location ? [{ _id: location, name: '' }] : []}
                onChange={handleLocationChange}
              />
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <FormControl fullWidth margin="dense">
                <DateTimePicker
                  label={strings.FROM}
                  value={from}
                  onChange={setFrom}
                  slotProps={{
                    textField: {
                      required: true,
                      variant: 'standard'
                    }
                  }}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DateTimePicker
                  label={strings.TO}
                  value={to}
                  onChange={setTo}
                  slotProps={{
                    textField: {
                      required: true,
                      variant: 'standard'
                    }
                  }}
                />
              </FormControl>
            </LocalizationProvider>

            <FormControl fullWidth margin="dense">
              <InputLabel className="required">{strings.STATUS}</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                variant="standard"
                required
              >
                <MenuItem value={bookcarsTypes.BookingStatus.Pending}>{strings.PENDING}</MenuItem>
                <MenuItem value={bookcarsTypes.BookingStatus.Deposit}>{strings.DEPOSIT}</MenuItem>
                <MenuItem value={bookcarsTypes.BookingStatus.Paid}>{strings.PAID}</MenuItem>
                <MenuItem value={bookcarsTypes.BookingStatus.Reserved}>{strings.RESERVED}</MenuItem>
                <MenuItem value={bookcarsTypes.BookingStatus.Cancelled}>{strings.CANCELLED}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel className="required">{strings.PRICE}</InputLabel>
              <Input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                slotProps={{ input: { min: 0, step: 0.01 } }}
              />
            </FormControl>

            <FormControl fullWidth margin="dense" className="checkbox-fc">
              <FormControlLabel
                control={
                  <Switch
                    checked={cancellation}
                    onChange={(e) => setCancellation(e.target.checked)}
                    color="primary"
                  />
                }
                label={strings.CANCELLATION}
              />
            </FormControl>

            <FormControl fullWidth margin="dense" className="checkbox-fc">
              <FormControlLabel
                control={
                  <Switch
                    checked={amendments}
                    onChange={(e) => setAmendments(e.target.checked)}
                    color="primary"
                  />
                }
                label={strings.AMENDMENTS}
              />
            </FormControl>

            <div className="buttons">
              <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={loading}>
                {commonStrings.UPDATE}
              </Button>
              <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={() => navigate('/')}>
                {commonStrings.CANCEL}
              </Button>
            </div>

            <div className="form-error">
              {formError && <FormHelperText error>{commonStrings.FORM_ERROR}</FormHelperText>}
              {updateError && <FormHelperText error>{commonStrings.GENERIC_ERROR}</FormHelperText>}
            </div>
          </form>
        </Paper>
      </div>
    </Layout>
  )
}

export default UpdateBooking
