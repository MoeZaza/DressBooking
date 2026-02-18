import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
 } from '@mui/material'
import {
  RoomService,
  VisibilityOff,
  Checkroom,
  Speed,
  Navigation,
  AttachMoney,
  Public,
  FlashOn,
  CheckBox,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/home'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import * as PaymentService from '@/services/PaymentService'
import Layout from '@/components/Layout'
import SupplierCarrousel from '@/components/SupplierCarrousel'
import SearchForm from '@/components/SearchForm'
import Footer from '@/components/Footer'
import FaqList from '@/components/FaqList'



import '@/assets/css/home.css'

const Home = () => {
  const navigate = useNavigate()

  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [weddingPricePhr, setWeddingPricePhr] = useState(150)
  const [eveningPricePhr, setEveningPricePhr] = useState(100)
  const [cocktailPricePhr, setCocktailPricePhr] = useState(75)

  // Ref for IntersectionObserver cleanup
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const _weddingPricePhr = await PaymentService.convertPrice(weddingPricePhr)
      setWeddingPricePhr(_weddingPricePhr)
      const _eveningPricePhr = await PaymentService.convertPrice(eveningPricePhr)
      setEveningPricePhr(_eveningPricePhr)
      const _cocktailPricePhr = await PaymentService.convertPrice(cocktailPricePhr)
      setCocktailPricePhr(_cocktailPricePhr)
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Remove tab change handler as we're removing location-based tabs

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        video.muted = true
        video.play()
      } else {
        video.pause()
      }
    })
  }

  const onLoad = async () => {
    if (!env.HIDE_SUPPLIERS) {
      let _suppliers = await SupplierService.getAllSuppliers()
      _suppliers = _suppliers.filter((supplier) => supplier.avatar && !/no-image/i.test(supplier.avatar))
      bookcarsHelper.shuffle(_suppliers)
      setSuppliers(_suppliers)
    }

    // Clean up previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer and store in ref for cleanup
    observerRef.current = new IntersectionObserver(handleIntersection)
    const video = document.getElementById('cover') as HTMLVideoElement
    if (video) {
      observerRef.current.observe(video)
    }
  }

  const language = UserService.getLanguage()

  return (
    <Layout onLoad={onLoad} strict={false}>

      <div className="home">
        <div className="home-content">

          <div className="video">
            <video
              id="cover"
              muted={!env.isSafari}
              autoPlay={!env.isSafari}
              loop
              playsInline
              disablePictureInPicture
              onLoadedData={async () => {
                setVideoLoaded(true)
              }}
            >
              <source src="cover.mp4" type="video/mp4" />
              <track kind="captions" />
            </video>
            {!videoLoaded && (
              <div className="video-background" />
            )}
          </div>

          <div className="home-title">{strings.TITLE}</div>
          <div className="home-cover">{strings.COVER}</div>
          {/* <div className="home-subtitle">{strings.SUBTITLE}</div> */}

        </div>

        <div className="search">
          <div className="home-search">
            <SearchForm />
          </div>
        </div>

        <div className="why">

          {/* <h1>{strings.WHY_TITLE}</h1> */}

          <div className="why-boxes">

            <div className="why-box">
              <div className="why-icon-wrapper">
                <RoomService className="why-icon" />
              </div>
              <div className="why-text-wrapper">
                <span className="why-title">{strings.WHY_SERVICE_TITLE}</span>
                <span className="why-text">{strings.WHY_SERVICE}</span>
              </div>
            </div>

            <div className="why-box">
              <div className="why-icon-wrapper">
                <VisibilityOff className="why-icon" />
              </div>
              <div className="why-text-wrapper">
                <span className="why-title">{strings.WHY_CHARGES_TITLE}</span>
                <span className="why-text">{strings.WHY_CHARGES}</span>
              </div>
            </div>

            <div className="why-box">
              <div className="why-icon-wrapper">
                <Checkroom className="why-icon" />
              </div>
              <div className="why-text-wrapper">
                <span className="why-title">{strings.WHY_FLEET_TITLE}</span>
                <span className="why-text">{strings.WHY_FLEET}</span>
              </div>
            </div>

            <div className="why-box">
              <div className="why-icon-wrapper">
                <Speed className="why-icon" />
              </div>
              <div className="why-text-wrapper">
                <span className="why-title">{strings.WHY_MILEAGE_TITLE}</span>
                <span className="why-text">{strings.WHY_MILEAGE}</span>
                <span className="why-text">{strings.WHY_MILEAGE_ASTERISK}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="services">

          <h1>{strings.SERVICES_TITLE}</h1>

          <div className="services-boxes">

            <div className="services-box">
              <div className="services-icon-wrapper">
                <Checkroom className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_FLEET_TITLE}</span>
                <span className="services-text">{strings.SERVICES_FLEET}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <Navigation className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_FLEXIBLE_TITLE}</span>
                <span className="services-text">{strings.SERVICES_FLEXIBLE}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <AttachMoney className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_PRICES_TITLE}</span>
                <span className="services-text">{strings.SERVICES_PRICES}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <Public className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_BOOKING_ONLINE_TITLE}</span>
                <span className="services-text">{strings.SERVICES_BOOKING_ONLINE}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <FlashOn className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICE_INSTANT_BOOKING_TITLE}</span>
                <span className="services-text">{strings.SERVICE_INSTANT_BOOKING}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <RoomService className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_SUPPORT_TITLE}</span>
                <span className="services-text">{strings.SERVICES_SUPPORT}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="home-suppliers" style={suppliers.length < 4 ? { margin: 0 } : undefined}>
          {suppliers.length > 3 && (
            <>
              <h1>{strings.SUPPLIERS_TITLE}</h1>
              <SupplierCarrousel suppliers={suppliers} />
            </>
          )}
        </div>

        {/* Removed destinations section - no longer needed for dress rental */}

        <div className="dress-types">
          <h1>{strings.DRESS_TYPES_TITLE}</h1>
          <p>{strings.DRESS_TYPES_TEXT}</p>
          <div className="boxes">
            <div className="box">
              <div className="box-content">
                <span>{strings.WEDDING_DRESSES}</span>
                <p>{strings.PERFECT_FOR_SPECIAL_DAY}</p>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(weddingPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · {strings.PER_DAY}</span>
                  </li>
                </ul>
              </div>
              <div className="dress-type-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-dress-type"
                  aria-label="Search for wedding dresses"
                  onClick={() => {
                    navigate('/search?type=Wedding')
                  }}
                >
                  {strings.SEARCH_FOR_DRESS}
                </Button>
              </div>
            </div>
            <div className="box">
              <div className="box-content">
                <span>{strings.EVENING_DRESSES}</span>
                <p>{strings.ELEGANT_FOR_OCCASIONS}</p>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(eveningPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · {strings.PER_DAY}</span>
                  </li>
                </ul>
              </div>
              <div className="dress-type-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-dress-type"
                  aria-label="Search for evening dresses"
                  onClick={() => {
                    navigate('/search?type=Evening')
                  }}
                >
                  {strings.SEARCH_FOR_DRESS}
                </Button>
              </div>
            </div>
            <div className="box">
              <div className="box-content">
                <span>{strings.COCKTAIL_DRESSES}</span>
                <p>{strings.PERFECT_FOR_PARTIES}</p>
                <ul>
                  <li>
                    <span className="price">{bookcarsHelper.formatPrice(cocktailPricePhr, commonStrings.CURRENCY, language)}</span>
                    <span className="unit"> · {strings.PER_DAY}</span>
                  </li>
                </ul>
              </div>
              <div className="dress-type-action">
                <Button
                  variant="contained"
                  className="btn-primary btn-dress-type"
                  aria-label="Search for cocktail dresses"
                  onClick={() => {
                    navigate('/search?type=Cocktail')
                  }}
                >
                  {strings.SEARCH_FOR_DRESS}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="faq">
          <FaqList />
        </div>

        {/* Map section removed - not needed for dress rental */}

        <div className="customer-care">
          <div className="customer-care-wrapper">
            <div className="customer-care-text">
              <h1>{strings.CUSTOMER_CARE_TITLE}</h1>
              <h2>{strings.CUSTOMER_CARE_SUBTITLE}</h2>
              <div className="customer-care-content">{strings.CUSTOMER_CARE_TEXT}</div>
              <div className="customer-care-boxes">
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_ASSISTANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_MODIFICATION}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_GUIDANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_SUPPORT}</span>
                </div>
              </div>
              <Button
                variant="contained"
                className="btn-primary btn-home"
                onClick={() => navigate('/contact')}
              >
                {strings.CONTACT_US}
              </Button>
            </div>

            <div className="customer-care-img">
              <img src="/customer-care.png" alt="" />
            </div>
          </div>
        </div>
      </div>

      {/* Location search dialog removed - not needed for dress rental */}



      <Footer />
    </Layout>
  )
}

export default Home
