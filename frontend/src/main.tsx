import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { frFR as corefrFR, enUS as coreenUS, esES as coreesES } from '@mui/material/locale'
import { frFR, enUS, esES } from '@mui/x-date-pickers/locales'
import { frFR as dataGridfrFR, enUS as dataGridenUS, esES as dataGridesES } from '@mui/x-data-grid/locales'
import { disableDevTools } from ':disable-react-devtools'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import * as IpInfoService from '@/services/IpInfoService'
import env from '@/config/env.config'
import App from '@/App'
import { initializeAccessibility } from './utils/accessibility'
import './styles/accessibility.css'

import { strings as activateStrings } from '@/lang/activate'
import { strings as bookingStrings } from '@/lang/booking'
import { strings as bookingFilterStrings } from '@/lang/booking-filter'
import { strings as bookingListStrings } from '@/lang/booking-list'
import { strings as bookingsStrings } from '@/lang/bookings'
import { strings as dressesStrings } from '@/lang/dresses'
import { strings as changePasswordStrings } from '@/lang/change-password'
import { strings as checkoutStrings } from '@/lang/checkout'
import { strings as commonStrings } from '@/lang/common'
import { strings as contactFormStrings } from '@/lang/contact-form'
import { strings as footerStrings } from '@/lang/footer'
import { strings as headerStrings } from '@/lang/header'
import { strings as homeStrings } from '@/lang/home'
import { strings as locationCarrouselStrings } from '@/lang/location-carrousel'
import { strings as mapStrings } from '@/lang/map'
import { strings as masterStrings } from '@/lang/master'
import { strings as noMatchStrings } from '@/lang/no-match'
import { strings as notificationsStrings } from '@/lang/notifications'
import { strings as resetPasswordStrings } from '@/lang/reset-password'
import { strings as searchSrings } from '@/lang/search'
import { strings as searchFormStrings } from '@/lang/search-form'
import { strings as settingsStrings } from '@/lang/settings'
import { strings as signInStrings } from '@/lang/sign-in'
import { strings as signUpStrings } from '@/lang/sign-up'
import { strings as tosStrings } from '@/lang/tos'
import { strings as newsletterFormStrings } from '@/lang/newsletter-form'
import { strings as privacyStrings } from '@/lang/privacy'
import { strings as faqListStrings } from '@/lang/faq-list'
import { strings as checkoutStatusStrings } from '@/lang/checkout-status'

import '@/assets/css/common.css'
import '@/assets/css/responsive-utilities.css'
import '@/assets/css/index.css'

if (env.isProduction) {
  disableDevTools()
}

let language = env.DEFAULT_LANGUAGE
const user = JSON.parse(localStorage.getItem('bc-fe-user') ?? 'null')
let lang = UserService.getQueryLanguage()

if (lang) {
  if (!env.LANGUAGES.includes(lang)) {
    lang = localStorage.getItem('bc-fe-language')

    if (lang && !env.LANGUAGES.includes(lang)) {
      lang = env.DEFAULT_LANGUAGE
    }
  }

  try {
    if (user) {
      language = user.language
      if (lang && lang.length === 2 && user.language !== lang) {
        const data = {
          id: user._id,
          language: lang,
        }

        const status = await UserService.validateAccessToken()

        if (status === 200) {
          const _status = await UserService.updateLanguage(data)
          if (_status !== 200) {
            helper.error(null, commonStrings.CHANGE_LANGUAGE_ERROR)
          }
        }

        language = lang
      }
    } else if (lang) {
      language = lang
    }
    UserService.setLanguage(language)
    commonStrings.setLanguage(language)
  } catch (err) {
    helper.error(err, commonStrings.CHANGE_LANGUAGE_ERROR)
  }
}

// Define updateLang function outside conditional blocks
const updateLang = (_lang: string) => {
    UserService.setLanguage(_lang)

    // Set document direction based on language
    const rtl = _lang === 'ar'
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')

    activateStrings.setLanguage(_lang)
    bookingStrings.setLanguage(_lang)
    bookingFilterStrings.setLanguage(_lang)
    bookingListStrings.setLanguage(_lang)
    bookingsStrings.setLanguage(_lang)
    dressesStrings.setLanguage(_lang)
    changePasswordStrings.setLanguage(_lang)
    checkoutStrings.setLanguage(_lang)
    commonStrings.setLanguage(_lang)
    contactFormStrings.setLanguage(_lang)
    footerStrings.setLanguage(_lang)
    headerStrings.setLanguage(_lang)
    homeStrings.setLanguage(_lang)
    locationCarrouselStrings.setLanguage(_lang)
    mapStrings.setLanguage(_lang)
    masterStrings.setLanguage(_lang)
    noMatchStrings.setLanguage(_lang)
    notificationsStrings.setLanguage(_lang)
    resetPasswordStrings.setLanguage(_lang)
    searchSrings.setLanguage(_lang)
    searchFormStrings.setLanguage(_lang)
    settingsStrings.setLanguage(_lang)
    signInStrings.setLanguage(_lang)
    signUpStrings.setLanguage(_lang)
    tosStrings.setLanguage(_lang)
    newsletterFormStrings.setLanguage(_lang)
    privacyStrings.setLanguage(_lang)
    faqListStrings.setLanguage(_lang)
    checkoutStatusStrings.setLanguage(_lang)
  }

// Handle language setting from IP if needed
if (env.SET_LANGUAGE_FROM_IP) {
  let storedLang

  if (user && user.language) {
    storedLang = user.language
  } else {
    const slang = localStorage.getItem('bc-fe-language')
    if (slang && slang.length === 2) {
      storedLang = slang
    }
  }

  if (!storedLang) {
    const country = await IpInfoService.getCountryCode()

    if (['FR', 'MA'].includes(country)) {
      updateLang('fr')
    } else if (['US', 'GB', 'AU'].includes(country)) {
      updateLang('en')
    } else {
      updateLang(env.DEFAULT_LANGUAGE)
    }
  }
}

// Initialize language
language = UserService.getLanguage()
const isFr = language === 'fr'
const isEs = language === 'es'
const isAr = language === 'ar'

// Initialize language and UI
const initializeLanguage = async () => {
  // Initialize all language strings with the current language
  updateLang(language)

  // Set document direction based on language
  const rtl = isAr
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
  document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', language)
}

// Call the initialization function
initializeLanguage()

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#1a1a1a',
        // contrastText: '#003B95',
        // dark: '#003B95',
      },
    },
    typography: {
      fontFamily: [
        isAr ? '"Noto Sans Arabic"' : 'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      // Responsive typography
      h1: {
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
      },
      h2: {
        fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
      },
      h3: {
        fontSize: 'clamp(1.125rem, 3vw, 1.75rem)',
      },
      h4: {
        fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
      },
      h5: {
        fontSize: 'clamp(0.875rem, 2vw, 1.25rem)',
      },
      h6: {
        fontSize: 'clamp(0.75rem, 1.5vw, 1.125rem)',
      },
      body1: {
        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      },
      body2: {
        fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 480,
        md: 768,
        lg: 960,
        xl: 1200,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#FAFAFA',
          },
          // Improve touch targets on mobile
          '@media (max-width: 767px)': {
            '*': {
              WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            // Touch-friendly sizing
            minHeight: '44px',
            '@media (max-width: 767px)': {
              minHeight: '48px',
              fontSize: '16px', // Prevent zoom on iOS
            },
            '@media (min-width: 768px)': {
              minHeight: '36px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: '44px',
              '@media (max-width: 767px)': {
                minHeight: '48px',
                fontSize: '16px', // Prevent zoom on iOS
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            minHeight: '44px',
            '@media (max-width: 767px)': {
              minHeight: '48px',
              fontSize: '16px', // Prevent zoom on iOS
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .Mui-disabled': {
              color: '#333 !important',
            },
            // Responsive form controls
            '@media (max-width: 767px)': {
              width: '100%',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            // Responsive dialog sizing
            '@media (max-width: 479px)': {
              margin: '16px',
              width: 'calc(100% - 32px)',
              maxWidth: 'none',
            },
            '@media (min-width: 480px) and (max-width: 767px)': {
              margin: '24px',
              width: 'calc(100% - 48px)',
              maxWidth: '500px',
            },
            '@media (min-width: 768px)': {
              margin: '32px',
              maxWidth: '600px',
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiAutocomplete-inputRoot': {
              paddingRight: '20px !important',
              minHeight: '44px',
              '@media (max-width: 767px)': {
                minHeight: '48px',
                fontSize: '16px', // Prevent zoom on iOS
              },
            },
          },
          listbox: {
            '& .Mui-focused': {
              backgroundColor: '#eee !important',
            },
            // Touch-friendly option sizing
            '& .MuiAutocomplete-option': {
              minHeight: '44px',
              '@media (max-width: 767px)': {
                minHeight: '48px',
              },
            },
          },
          option: {
            // Selected
            '&[aria-selected="true"]': {
              backgroundColor: '#F7B644 !important',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            // Responsive app bar height
            minHeight: '56px',
            '@media (min-width: 768px)': {
              minHeight: '60px',
            },
            '@media (min-width: 960px)': {
              minHeight: '64px',
            },
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            // Responsive toolbar height
            minHeight: '56px !important',
            '@media (min-width: 768px)': {
              minHeight: '60px !important',
            },
            '@media (min-width: 960px)': {
              minHeight: '64px !important',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            // Touch-friendly icon buttons
            '@media (max-width: 767px)': {
              padding: '12px',
            },
          },
        },
      },
    },
  },
  isFr ? frFR : isEs ? esES : enUS,
  isFr ? dataGridfrFR : isEs ? dataGridesES : dataGridenUS,
  isFr ? corefrFR : isEs ? coreesES : coreenUS,
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="dark"
      />
    </CssBaseline>
  </ThemeProvider>,
)
