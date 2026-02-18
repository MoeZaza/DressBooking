import React, { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Checkbox,
  Link,
  FormControlLabel,
  RadioGroup,
  Radio,
  CircularProgress,
 } from '@mui/material'

import { format } from 'date-fns'
import { fr, enUS, ar } from 'date-fns/locale'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { PayPalButtons } from '@paypal/react-paypal-js'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import validator from 'validator'
import { createSchema, FormFields } from '@/models/CheckoutForm'

import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as BookingService from '@/services/BookingService'
import { strings as commonStrings } from '@/lang/common'

import { strings } from '@/lang/checkout'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import * as DressService from '@/services/DressService'
import * as LocationService from '@/services/LocationService'
import * as PaymentService from '@/services/PaymentService'
import * as StripeService from '@/services/StripeService'
import * as PayPalService from '@/services/PayPalService'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import Map from '@/components/Map'

import Progress from '@/components/Progress'
import CheckoutStatus from '@/components/CheckoutStatus'
import NoMatch from './NoMatch'
import CheckoutOptions from '@/components/CheckoutOptions'
import Footer from '@/components/Footer'
import ViewOnMapButton from '@/components/ViewOnMapButton'
import MapDialog from '@/components/MapDialog'
import Backdrop from '@/components/SimpleBackdrop'
import Unauthorized from '@/components/Unauthorized'
import { DressIcon, CustomerIcon, PaymentOptionsIcon, ChecklistIcon } from '@/components/Icons'

import '@/assets/css/checkout.css'

//
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
//
const stripePromise = env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe ? loadStripe(env.STRIPE_PUBLISHABLE_KEY) : null

const Checkout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [user, setUser] = useState<bookcarsTypes.User>()
  const [dress, setDress] = useState<bookcarsTypes.Dress>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()

  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [visible, setVisible] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [noMatch, setNoMatch] = useState(false)
  const [emailRegistered, setEmailRegistered] = useState(false)
  const [emailInfo, setEmailInfo] = useState(true)
  const [phoneInfo, setPhoneInfo] = useState(true)
  const [price, setPrice] = useState(0)
  const [depositPrice, setDepositPrice] = useState(0)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [recaptchaError, setRecaptchaError] = useState(false)

  const [paymentFailed, setPaymentFailed] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string>()
  const [sessionId, setSessionId] = useState<string>()
  // const [distance, setDistance] = useState('')

  const [openMapDialog, setOpenMapDialog] = useState(false)
  const [payPalLoaded, setPayPalLoaded] = useState(false)
  const [payPalInit, setPayPalInit] = useState(false)
  const [payPalProcessing, setPayPalProcessing] = useState(false)

  const birthDateRef = useRef<HTMLInputElement | null>(null)


  const _fr = language === 'fr'
  const _ar = language === 'ar'
  const _locale = _fr ? fr : _ar ? ar : enUS
  const _format = _fr ? 'eee d LLL yyyy kk:mm' : _ar ? 'eee d LLL yyyy kk:mm' : 'eee, d LLL yyyy, p'
  const bookingDetailHeight = env.SUPPLIER_IMAGE_HEIGHT + 10
  const days = bookcarsHelper.days(from, to)
  const daysLabel = from && to && `${helper.getDaysShort(days)} (${bookcarsHelper.capitalize(format(from, _format, { locale: _locale }))} - ${bookcarsHelper.capitalize(format(to, _format, { locale: _locale }))})`

  const schema = createSchema(dress)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    clearErrors,
    setFocus,
    trigger,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    shouldUnregister: false,
    defaultValues: {}
  })

  const {
    payLater,
    payDeposit,
  } = useWatch({ control })

  const validateEmail = (email: string) => {
    return validator.isEmail(email)
  }

  const validatePhone = (phone: string) => {
    return validator.isMobilePhone(phone)
  }

  const onSubmit = async (data: FormFields) => {
    try {
      if (!dress || !pickupLocation || !from || !to) {
        helper.error()
        return
      }

      let recaptchaToken = ''
      if (reCaptchaLoaded) {
        recaptchaToken = await generateReCaptchaToken()
        if (!(await helper.verifyReCaptcha(recaptchaToken))) {
          recaptchaToken = ''
        }
      }

      if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
        setRecaptchaError(true)
        return
      }

      if (!authenticated) {
        // check email
        const status = await UserService.validateEmail({ email: data.email! })
        if (status === 200) {
          setEmailRegistered(false)
          setEmailInfo(true)
        } else {
          setEmailRegistered(true)
          setEmailInfo(false)
          return
        }
      }

      setLoading(true)
      setPaymentFailed(false)

      let customer: bookcarsTypes.User | undefined

      if (!authenticated) {
        customer = {
          email: data.email,
          phone: data.phone,
          fullName: data.fullName!,
          birthDate: data.birthDate,
          language: UserService.getLanguage()
        }
      }

      const basePrice = await bookcarsHelper.convertPrice(price, PaymentService.getCurrency(), env.BASE_CURRENCY)

      const booking: bookcarsTypes.Booking = {
        supplier: dress.supplier._id as string,
        dress: dress._id,
        customer: authenticated ? user?._id : undefined,
        location: pickupLocation._id,
        from,
        to,
        status: bookcarsTypes.BookingStatus.Pending,
        cancellation: data.cancellation,
        amendments: data.amendments,
        price: basePrice
      }

      //
      // Stripe Payment Gateway
      //
      let _customerId: string | undefined
      let _sessionId: string | undefined
      if (!payLater) {
        if (env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe) {
          const name = bookcarsHelper.truncateString(`${env.WEBSITE_NAME} - ${dress.name}`, StripeService.ORDER_NAME_MAX_LENGTH)
          const _description = `${env.WEBSITE_NAME} - ${dress.name} - ${daysLabel} - ${pickupLocation.name}`
          const description = bookcarsHelper.truncateString(_description, StripeService.ORDER_DESCRIPTION_MAX_LENGTH)

          const payload: bookcarsTypes.CreatePaymentPayload = {
            amount: payDeposit ? depositPrice : price,
            currency: PaymentService.getCurrency(),
            locale: language,
            receiptEmail: (!authenticated ? customer?.email : user?.email) as string,
            name,
            description,
            customerName: (!authenticated ? customer?.fullName : user?.fullName) as string,
          }
          const res = await StripeService.createCheckoutSession(payload)
          setClientSecret(res.clientSecret)
          _sessionId = res.sessionId
          _customerId = res.customerId
        } else {
          setPayPalLoaded(true)
        }
      }

      booking.isDeposit = payDeposit

      const payload: bookcarsTypes.CheckoutPayload = {
        customer: customer,
        booking,
        payLater: !!data.payLater,
        sessionId: _sessionId,
        customerId: _customerId,
        payPal: env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal,
      }

      const { status, bookingId: _bookingId } = await BookingService.checkout(payload)
      setLoading(false)

      if (status === 200) {
        if (payLater) {
          setVisible(false)
          setSuccess(true)
        }
        setBookingId(_bookingId)
        setSessionId(_sessionId)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onError = () => {
    const firstErrorField = Object.keys(errors)[0] as keyof FormFields
    if (firstErrorField) {
      if (firstErrorField === 'birthDate' && birthDateRef.current) {
        birthDateRef.current.focus()
      }
      setFocus(firstErrorField)
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
    setAuthenticated(_user !== undefined)
    setLanguage(UserService.getLanguage())

    const { state } = location
    if (!state) {
      setNoMatch(true)
      return
    }

    const { dressId } = state
    const { pickupLocationId } = state
    const { from: _from } = state
    const { to: _to } = state

    if (!dressId || !pickupLocationId || !_from || !_to) {
      setNoMatch(true)
      return
    }

    let _dress
    let _location

    try {
      const _dressResponse = await DressService.getDress(dressId)
      _dress = _dressResponse?.data
      if (!_dress) {
        setNoMatch(true)
        return
      }

      _location = await LocationService.getLocation(pickupLocationId)

      if (!_location) {
        setNoMatch(true)
        return
      }

      const priceChangeRate = _dress.supplier.priceChangeRate || 0
      const _price = await PaymentService.convertPrice(bookcarsHelper.calculateTotalPrice(_dress, priceChangeRate))
      let _depositPrice = _dress.deposit > 0 ? await PaymentService.convertPrice(_dress.deposit) : 0
      _depositPrice += _depositPrice * (priceChangeRate / 100)

      const included = (val: number) => val === 0

      setDress(_dress)
      setPrice(_price)
      setDepositPrice(_depositPrice)
      setPickupLocation(_location)

      setFrom(_from)
      setTo(_to)
      setValue('cancellation', included(_dress.cancellation))
      setValue('amendments', included(_dress.amendments))
      setVisible(true)
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <>
      <Layout onLoad={onLoad} strict={false}>
        {!user?.blacklisted && visible && dress && from && to && pickupLocation && (
          <>
            <div className="checkout">
              <Paper className="checkout-form" elevation={10}>
                <h1 className="checkout-form-title">{strings.BOOKING_HEADING}</h1>
                <form onSubmit={handleSubmit(onSubmit, onError)}>
                  <div>
                    {(pickupLocation.latitude && pickupLocation.longitude) && (
                        <Map
                          position={[pickupLocation.latitude, pickupLocation.longitude]}
                          initialZoom={10}
                          locations={[pickupLocation]}
                          className="map"
                        >
                          <ViewOnMapButton onClick={() => setOpenMapDialog(true)} />
                        </Map>
                      )}

                    {/* Dress display - simplified for checkout page */}
                    <div className="dress-display">
                      <h3>{dress.name}</h3>
                      {dress.images && dress.images.length > 0 && (
                        <img
                          src={bookcarsHelper.joinURL(env.CDN_DRESSES, dress.images[0])}
                          alt={dress.name}
                          style={{ maxWidth: '300px', height: 'auto' }}
                        />
                      )}
                      {!env.HIDE_SUPPLIERS && dress.supplier && (
                        <div className="dress-supplier">
                          {dress.supplier.avatar && <img src={bookcarsHelper.joinURL(env.CDN_USERS, dress.supplier.avatar)} alt={dress.supplier.fullName} style={{ height: env.SUPPLIER_IMAGE_HEIGHT }} />}
                          <span className="dress-supplier-name">{dress.supplier.fullName}</span>
                        </div>
                      )}
                    </div>

                    <CheckoutOptions
                      dress={dress}
                      from={from}
                      to={to}
                      language={language}
                      clientSecret={clientSecret}
                      payPalLoaded={payPalLoaded}
                      onPriceChange={(value: number) => setPrice(value)}
                      onCancellationChange={(value: boolean) => setValue('cancellation', value)}
                      onAmendmentsChange={(value: boolean) => setValue('amendments', value)}
                    />

                    <div className="checkout-details-container">
                      <div className="checkout-info">
                        <DressIcon />
                        <span>{strings.BOOKING_DETAILS}</span>
                      </div>
                      <div className="checkout-details">
                        <div className="checkout-detail" style={{ height: bookingDetailHeight }}>
                          <span className="checkout-detail-title">{strings.DAYS}</span>
                          <div className="checkout-detail-value">
                            {daysLabel}
                          </div>
                        </div>
                        <div className="checkout-detail" style={{ height: bookingDetailHeight }}>
                          <span className="checkout-detail-title">{commonStrings.LOCATION}</span>
                          <div className="checkout-detail-value">{pickupLocation.name}</div>
                        </div>
                        <div className="checkout-detail" style={{ height: bookingDetailHeight }}>
                          <span className="checkout-detail-title">{strings.DRESS}</span>
                          <div className="checkout-detail-value">{dress.name}</div>
                        </div>
                        {!env.HIDE_SUPPLIERS && dress.supplier && (
                          <div className="checkout-detail" style={{ height: bookingDetailHeight }}>
                            <span className="checkout-detail-title">{commonStrings.SUPPLIER}</span>
                            <div className="checkout-detail-value">
                              <div className="dress-supplier">
                                {dress.supplier.avatar && <img src={bookcarsHelper.joinURL(env.CDN_USERS, dress.supplier.avatar)} alt={dress.supplier.fullName} style={{ height: env.SUPPLIER_IMAGE_HEIGHT }} />}
                                <span className="dress-supplier-name">{dress.supplier.fullName}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="checkout-detail" style={{ height: bookingDetailHeight }}>
                          <span className="checkout-detail-title">{strings.COST}</span>
                          <div className="checkout-detail-value booking-price">{bookcarsHelper.formatPrice(price, commonStrings.CURRENCY, language)}</div>
                        </div>
                      </div>
                    </div>

                    {!authenticated && (
                      <div className="customer-details">
                        <div className="checkout-info">
                          <CustomerIcon />
                          <span>{strings.CUSTOMER_DETAILS}</span>
                        </div>
                        <div className="customer-details-form">
                          <FormControl fullWidth margin="dense">
                            <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                            <OutlinedInput
                              {...register('fullName')}
                              type="text"
                              label={commonStrings.FULL_NAME}
                              required
                              error={!!errors.fullName}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormControl fullWidth margin="dense">
                            <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                            <OutlinedInput
                              {...register('email', {
                                onBlur: async (e) => {
                                  const email = e.target.value

                                  if (validateEmail(email)) {
                                    const status = await UserService.validateEmail({ email })
                                    if (status === 200) {
                                      setEmailRegistered(false)
                                      setEmailInfo(true)
                                    } else {
                                      setEmailRegistered(true)
                                      setEmailInfo(false)
                                    }
                                  } else {
                                    setEmailRegistered(false)
                                    setEmailInfo(false)
                                  }
                                }
                              })}
                              type="text"
                              label={commonStrings.EMAIL}
                              error={!!errors.email || emailRegistered}
                              required
                              autoComplete="off"
                              onChange={() => clearErrors('email')}
                            />
                            <FormHelperText error={!!errors.email || emailRegistered}>
                              {(errors.email && errors.email.message) || ''}
                              {(emailRegistered && (
                                <span>
                                  <span>{commonStrings.EMAIL_ALREADY_REGISTERED}</span>
                                  <span> </span>
                                  <a href={`/sign-in?c=${dress._id}&p=${pickupLocation._id}&f=${from.getTime()}&t=${to.getTime()}&from=checkout`}>{strings.SIGN_IN}</a>
                                </span>
                              ))
                                || ''}
                              {(emailInfo && !errors.email && strings.EMAIL_INFO) || ''}
                            </FormHelperText>
                          </FormControl>
                          <FormControl fullWidth margin="dense">
                            <InputLabel className="required">{commonStrings.PHONE}</InputLabel>
                            <OutlinedInput
                              {...register('phone', {
                                onBlur: (e) => {
                                  const phone = e.target.value

                                  setPhoneInfo(validatePhone(phone))
                                }
                              })}
                              type="text"
                              label={commonStrings.PHONE}
                              error={!!errors.phone}
                              required
                              autoComplete="off"
                              onChange={() => clearErrors('phone')}
                            />
                            <FormHelperText error={!!errors.phone}>
                              {(errors.phone && errors.phone.message) || ''}
                              {(phoneInfo && strings.PHONE_INFO) || ''}
                            </FormHelperText>
                          </FormControl>
                          <FormControl fullWidth margin="dense">
                            <DatePicker
                              {...register('birthDate')}
                              ref={birthDateRef}
                              label={commonStrings.BIRTH_DATE}
                              variant="outlined"
                              required
                              onChange={(_birthDate) => {
                                clearErrors('birthDate')
                                if (_birthDate) {
                                  setValue('birthDate', _birthDate, { shouldValidate: true })
                                } else {
                                  setValue('birthDate', undefined, { shouldValidate: true })
                                }
                              }}
                              language={language}
                            />
                            <FormHelperText error={!!errors.birthDate}>
                              {(errors.birthDate && errors.birthDate.message) || ''}
                            </FormHelperText>
                          </FormControl>

                          <div className="checkout-tos">
                            <table>
                              <tbody>
                                <tr>
                                  <td aria-label="tos">
                                    <Checkbox
                                      {...register('tos')}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          clearErrors('tos')
                                        }
                                      }}
                                      color="primary"
                                    />
                                  </td>
                                  <td>
                                    <Link href="/tos" target="_blank" rel="noreferrer">
                                      {commonStrings.TOS}
                                    </Link>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={2}>
                                    <FormHelperText error={!!errors.tos}>{errors.tos?.message || ''}</FormHelperText>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <SocialLogin reloadPage />
                        </div>
                      </div>
                    )}

                    {dress.supplier.payLater && (
                      <div className="payment-options-container">
                        <div className="checkout-info">
                          <PaymentOptionsIcon />
                          <span>{strings.PAYMENT_OPTIONS}</span>
                        </div>
                        <div className="payment-options">
                          <FormControl>
                            <RadioGroup
                              defaultValue="payOnline"
                              onChange={(e) => {
                                setValue('payLater', e.target.value === 'payLater')
                                setValue('payDeposit', e.target.value === 'payDeposit')
                              }}
                            >
                              <FormControlLabel
                                value="payLater"
                                control={<Radio />}
                                disabled={!!clientSecret || payPalLoaded}
                                className={clientSecret || payPalLoaded ? 'payment-radio-disabled' : ''}
                                label={(
                                  <span className="payment-button">
                                    <span>{strings.PAY_LATER}</span>
                                    <span className="payment-info">{`(${strings.PAY_LATER_INFO})`}</span>
                                  </span>
                                )}
                              />
                              {
                                dress.deposit > 0 && (
                                  <FormControlLabel
                                    value="payDeposit"
                                    control={<Radio />}
                                    disabled={!!clientSecret || payPalLoaded}
                                    className={clientSecret || payPalLoaded ? 'payment-radio-disabled' : ''}
                                    label={(
                                      <span className="payment-button">
                                        <span>{strings.PAY_DEPOSIT}</span>
                                        <span className="payment-info">{`(${strings.PAY_ONLINE_INFO})`}</span>
                                      </span>
                                    )}
                                  />
                                )
                              }
                              <FormControlLabel
                                value="payOnline"
                                control={<Radio />}
                                disabled={!!clientSecret || payPalLoaded}
                                className={clientSecret || payPalLoaded ? 'payment-radio-disabled' : ''}
                                label={(
                                  <span className="payment-button">
                                    <span>{strings.PAY_ONLINE}</span>
                                    <span className="payment-info">{`(${strings.PAY_ONLINE_INFO})`}</span>
                                  </span>
                                )}
                              />
                            </RadioGroup>
                          </FormControl>
                        </div>
                      </div>
                    )}

                    <div className="payment-info">
                      <div className="payment-info-title">
                        {
                          payDeposit ? strings.DEPOSIT : `${strings.PRICE_FOR} ${days} ${days > 1 ? strings.DAYS : strings.DAY}`
                        }
                      </div>
                      <div className="payment-info-price">
                        {
                          bookcarsHelper.formatPrice(payDeposit ? depositPrice : price, commonStrings.CURRENCY, language)
                        }
                      </div>
                    </div>

                    {(!dress.supplier.payLater || !payLater) && env.PAYMENT_GATEWAY && (
                      env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe
                        ? (
                          clientSecret && (
                            <div className="payment-options-container">
                              <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={{ clientSecret }}
                              >
                                <EmbeddedCheckout />
                              </EmbeddedCheckoutProvider>
                            </div>
                          )
                        )
                        : payPalLoaded ? (
                          <div className="payment-options-container">
                            <PayPalButtons
                              createOrder={async () => {
                                const name = bookcarsHelper.truncateString(dress.name, PayPalService.ORDER_NAME_MAX_LENGTH)
                                const _description = `${dress.name} - ${daysLabel} - ${pickupLocation.name}`
                                const description = bookcarsHelper.truncateString(_description, PayPalService.ORDER_DESCRIPTION_MAX_LENGTH)
                                const amount = payDeposit ? depositPrice : price
                                const orderId = await PayPalService.createOrder(bookingId!, amount, PaymentService.getCurrency(), name, description)
                                return orderId
                              }}
                              onApprove={async (data, actions) => {
                                try {
                                  setPayPalProcessing(true)
                                  await actions.order?.capture()
                                  const { orderID } = data
                                  const status = await PayPalService.checkOrder(bookingId!, orderID)

                                  if (status === 200) {
                                    setVisible(false)
                                    setSuccess(true)
                                  } else {
                                    setPaymentFailed(true)
                                  }
                                } catch (err) {
                                  helper.error(err)
                                } finally {
                                  setPayPalProcessing(false)
                                }
                              }}
                              onInit={() => {
                                setPayPalInit(true)
                              }}
                              onCancel={() => {
                                setPayPalProcessing(false)
                              }}
                              onError={() => {
                                setPayPalProcessing(false)
                              }}
                            />
                          </div>
                        ) : null
                    )}

                    {/* Show message when payment is disabled */}
                    {!env.PAYMENT_GATEWAY && (
                      <div className="payment-disabled-message">
                        <p style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
                          {strings.PAYMENT_DISABLED}
                        </p>
                      </div>
                    )}
                    <div className="checkout-buttons">
                      {(
                        (env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.Stripe && !clientSecret)
                        || (env.PAYMENT_GATEWAY === bookcarsTypes.PaymentGateway.PayPal && !payPalInit)
                        || !env.PAYMENT_GATEWAY
                        || payLater) && (
                          <Button
                            type="submit"
                            variant="contained"
                            className="btn-checkout btn-margin-bottom"
                            aria-label="Checkout"
                            disabled={loading || (payPalLoaded && !payPalInit)}
                          >
                            {
                              (loading || (payPalLoaded && !payPalInit))
                                ? <CircularProgress color="inherit" size={24} />
                                : strings.BOOK
                            }
                          </Button>
                        )}
                      <Button
                        variant="outlined"
                        color="primary"
                        className="btn-cancel btn-margin-bottom"
                        aria-label="Cancel"
                        onClick={async () => {
                          try {
                            if (bookingId && sessionId) {
                              //
                              // Delete temporary booking on cancel.
                              // Otherwise, temporary bookings are
                              // automatically deleted through a TTL index.
                              //
                              await BookingService.deleteTempBooking(bookingId, sessionId)
                            }
                          } catch (err) {
                            helper.error(err)
                          } finally {
                            navigate('/')
                          }
                        }}
                      >
                        {commonStrings.CANCEL}
                      </Button>
                    </div>
                  </div>
                  <div className="form-error">
                    {paymentFailed && <Error message={strings.PAYMENT_FAILED} />}
                    {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                  </div>
                </form>
              </Paper>
            </div>

            <Footer />
          </>
        )}

        {user?.blacklisted && <Unauthorized />}

        {noMatch && <NoMatch hideHeader />}

        {success && bookingId && (
          <CheckoutStatus
            bookingId={bookingId}
            language={language}
            payLater={payLater}
            status="success"
            className="status"
          />
        )}

        {payPalProcessing && <Backdrop text={strings.CHECKING} />}

        <MapDialog
          location={pickupLocation}
          openMapDialog={openMapDialog}
          onClose={() => setOpenMapDialog(false)}
        />
      </Layout>

      {loadingPage && !noMatch && <Progress />}
    </>
  )
}

export default Checkout
