import React, { useEffect, useState } from 'react'
import { DirectionsCar as CarIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS, ar } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as helper from '@/common/helper'
import * as BookingService from '@/services/BookingService'
import * as PaymentService from '@/services/PaymentService'
import { strings } from '@/lang/checkout-status'
import { strings as commonStrings } from '@/lang/common'
import { strings as checkoutStrings } from '@/lang/checkout'
import Toast from '@/components/Toast'

import '@/assets/css/checkout-status.css'

interface CheckoutStatusProps {
  bookingId: string,
  payLater?: boolean,
  language: string,
  status: 'success' | 'error'
  className?: string
}

const CheckoutStatus = (
  {
    bookingId,
    payLater,
    language,
    status,
    className,
  }: CheckoutStatusProps
) => {
  const [booking, setBooking] = useState<bookcarsTypes.Booking>()
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const _booking = await BookingService.getBooking(bookingId)

        if (!_booking) {
          setError(true)
          setLoading(false)
          return
        }

        setBooking(_booking)

        if (_booking.price) {
          setPrice(await PaymentService.convertPrice(_booking.price))
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      init()
    }
  }, [bookingId])

  if (loading) {
    return null
  }

  // Handle error state
  if (error || !booking) {
    return (
      <div className={`checkout-status ${className || ''}`}>
        <Toast
          title={commonStrings.ERROR}
          text={strings.ERROR}
          status="error"
        />
      </div>
    )
  }

  const _fr = language === 'fr'
  const _ar = language === 'ar'
  const _locale = _fr ? fr : _ar ? ar : enUS
  const _format = _fr ? 'eee d LLL yyyy kk:mm' : _ar ? 'eee d LLL yyyy kk:mm' : 'eee, d LLL yyyy, p'
  const days = (booking && bookcarsHelper.days(new Date(booking.from), new Date(booking.to))) || 0
  const success = status === 'success'

  return booking && (
    <div className={`checkout-status ${className || ''}`}>
      <Toast
        title={strings.CONGRATULATIONS}
        text={success
          ? payLater ? strings.SUCCESS_PAY_LATER : strings.SUCCESS
          : strings.ERROR}
        status={status}
      />

      {success && (
        <div className="details">
          <div className="status-details-container">
            <div className="status-info">
              <CarIcon />
              <span>{checkoutStrings.BOOKING_DETAILS}</span>
            </div>
            <div className="status-details">
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.DRESS}</span>
                <div className="status-detail-value">
                  <span>{(booking.dress as bookcarsTypes.Dress).name}</span>
                </div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.DAYS}</span>
                <div className="status-detail-value">
                  {`${helper.getDaysShort(days)} (${bookcarsHelper.capitalize(
                    format(new Date(booking.from), _format, { locale: _locale }),
                  )} - ${bookcarsHelper.capitalize(format(new Date(booking.to), _format, { locale: _locale }))})`}
                </div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{commonStrings.LOCATION}</span>
                <div className="status-detail-value">{(booking.location as bookcarsTypes.Location).name}</div>
              </div>
              <div className="status-detail">
                <span className="status-detail-title">{checkoutStrings.COST}</span>
                <div className="status-detail-value status-price">{bookcarsHelper.formatPrice(price, commonStrings.CURRENCY, language)}</div>
              </div>
            </div>
          </div>

          <div className="side-panel">
            <h1>{strings.STATUS_TITLE}</h1>
            <p>{strings.STATUS_MESSAGE}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutStatus
