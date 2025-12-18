import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as UserService from '@/services/UserService'
import * as langHelper from '@/common/langHelper'

// Import all language strings
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import { strings as bookingsStrings } from '@/lang/bookings'
import { strings as bookingStrings } from '@/lang/booking'
import { strings as activateStrings } from '@/lang/activate'
import { strings as masterStrings } from '@/lang/master'
import { strings as noMatchStrings } from '@/lang/no-match'
import { strings as signInStrings } from '@/lang/sign-in'
import { strings as settingsStrings } from '@/lang/settings'
import { strings as dressesStrings } from '@/lang/dresses'
import { strings as suppliersStrings } from '@/lang/suppliers'
import { strings as usersStrings } from '@/lang/users'
import { strings as locationsStrings } from '@/lang/locations'
import { strings as createBookingStrings } from '@/lang/create-booking'
import { strings as bookingListStrings } from '@/lang/booking-list'

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
    bookingsStrings.setLanguage(lang)
    bookingStrings.setLanguage(lang)
    activateStrings.setLanguage(lang)
    masterStrings.setLanguage(lang)
    noMatchStrings.setLanguage(lang)
    signInStrings.setLanguage(lang)
    settingsStrings.setLanguage(lang)
    dressesStrings.setLanguage(lang)
    suppliersStrings.setLanguage(lang)
    usersStrings.setLanguage(lang)
    locationsStrings.setLanguage(lang)
    createBookingStrings.setLanguage(lang)
    bookingListStrings.setLanguage(lang)
  }

  const updateDocumentDirection = (lang: string) => {
    const rtl = lang === 'ar'
    setIsRTL(rtl)
    
    // Update document direction
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
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
    
    console.log(`Language changed to: ${lang}, RTL: ${lang === 'ar'}`)
  }

  const refreshStrings = () => {
    initializeAllStrings(language)
  }

  // Initialize on mount and when language changes
  useEffect(() => {
    initializeAllStrings(language)
    updateDocumentDirection(language)
  }, [language])

  // Listen for URL parameter changes
  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const langParam = urlParams.get('lang')
      
      if (langParam && langParam !== language) {
        setLanguage(langParam)
      }
    }

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange)
    
    // Check on mount
    handleLocationChange()
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
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
