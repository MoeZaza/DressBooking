import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as UserService from '@/services/UserService'
import * as langHelper from '@/common/langHelper'

// Import all language strings
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import { strings as homeStrings } from '@/lang/home'
import { strings as searchStrings } from '@/lang/search'
import { strings as dressesStrings } from '@/lang/dresses'
import { strings as bookingStrings } from '@/lang/booking'
import { strings as bookingsStrings } from '@/lang/bookings'
import { strings as bookingListStrings } from '@/lang/booking-list'
import { strings as checkoutStrings } from '@/lang/checkout'
import { strings as settingsStrings } from '@/lang/settings'
import { strings as signInStrings } from '@/lang/sign-in'
import { strings as signUpStrings } from '@/lang/sign-up'
import { strings as notificationsStrings } from '@/lang/notifications'
import { strings as contactFormStrings } from '@/lang/contact-form'
import { strings as footerStrings } from '@/lang/footer'
import { strings as faqStrings } from '@/lang/faq-list'
import { strings as searchFormStrings } from '@/lang/search-form'

interface LanguageContextType {
  language: string
  isRTL: boolean
  setLanguage: (lang: string) => void
  refreshStrings: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => langHelper.getLanguage())
  const [isRTL, setIsRTL] = useState<boolean>(() => langHelper.getLanguage() === 'ar')

  const initializeAllStrings = (lang: string) => {
    // Initialize all language strings
    commonStrings.setLanguage(lang)
    headerStrings.setLanguage(lang)
    homeStrings.setLanguage(lang)
    searchStrings.setLanguage(lang)
    dressesStrings.setLanguage(lang)
    bookingStrings.setLanguage(lang)
    bookingsStrings.setLanguage(lang)
    bookingListStrings.setLanguage(lang)
    checkoutStrings.setLanguage(lang)
    settingsStrings.setLanguage(lang)
    signInStrings.setLanguage(lang)
    signUpStrings.setLanguage(lang)
    notificationsStrings.setLanguage(lang)
    contactFormStrings.setLanguage(lang)
    footerStrings.setLanguage(lang)
    faqStrings.setLanguage(lang)
    searchFormStrings.setLanguage(lang)
  }

  const updateDocumentDirection = (lang: string) => {
    const rtl = lang === 'ar'
    setIsRTL(rtl)

    // Update document direction
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)

    // Update body class for CSS styling
    if (rtl) {
      document.body.classList.add('rtl')
      document.body.classList.remove('ltr')
    } else {
      document.body.classList.add('ltr')
      document.body.classList.remove('rtl')
    }
  }

  const setLanguage = (lang: string) => {
    // Update UserService language
    UserService.setLanguage(lang)

    // Update state
    setLanguageState(lang)

    // Initialize all strings with new language
    initializeAllStrings(lang)

    // Update document direction
    updateDocumentDirection(lang)
  }

  const refreshStrings = () => {
    initializeAllStrings(language)
  }

  // Initialize on mount and when language changes
  useEffect(() => {
    initializeAllStrings(language)
    updateDocumentDirection(language)
  }, [language])

  // Listen for storage changes (language changes from other tabs or components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bc-fe-language') {
        const newLang = e.newValue
        if (newLang && newLang !== language) {
          setLanguage(newLang)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [language])

  const value: LanguageContextType = {
    language,
    isRTL,
    setLanguage,
    refreshStrings
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
