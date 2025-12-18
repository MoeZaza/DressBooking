import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'

import { frFR as corefrFR, enUS as coreenUS, esES as coreesES } from '@mui/material/locale'
import { frFR, enUS, esES } from '@mui/x-date-pickers/locales'
import { frFR as dataGridfrFR, enUS as dataGridenUS, esES as dataGridesES } from '@mui/x-data-grid/locales'
import { disableDevTools } from ':disable-react-devtools'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
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
import env from '@/config/env.config'
import App from '@/App'
import { initializeAccessibility } from './utils/accessibility'
import './styles/accessibility.css'

import '@/assets/css/common.css'
import '@/assets/css/index.css'

if (import.meta.env.VITE_NODE_ENV === 'production') {
  disableDevTools()
}

let language = env.DEFAULT_LANGUAGE
const user = JSON.parse(localStorage.getItem('bc-be-user') ?? 'null')
let lang = UserService.getQueryLanguage()

if (lang) {
  if (!env.LANGUAGES.includes(lang)) {
    lang = localStorage.getItem('bc-be-language')

    if (lang && !env.LANGUAGES.includes(lang)) {
      lang = env.DEFAULT_LANGUAGE
    }
  }

  try {
    if (user) {
      language = user.language
      if (lang && lang.length === 2 && user.language !== lang) {
        // Don't block app initialization with async operations
        // Move this to a useEffect in App component
        language = lang
      }
    } else if (lang) {
      language = lang
    }
    UserService.setLanguage(language)

    // Initialize all language strings
    commonStrings.setLanguage(language)
    headerStrings.setLanguage(language)
    bookingsStrings.setLanguage(language)
    bookingStrings.setLanguage(language)
    activateStrings.setLanguage(language)
    masterStrings.setLanguage(language)
    noMatchStrings.setLanguage(language)
    signInStrings.setLanguage(language)
    settingsStrings.setLanguage(language)
    dressesStrings.setLanguage(language)
    suppliersStrings.setLanguage(language)
    usersStrings.setLanguage(language)
    locationsStrings.setLanguage(language)
    createBookingStrings.setLanguage(language)
  } catch (err) {
    console.error('Language initialization error:', err)
    // Don't block app initialization
  }
}

language = UserService.getLanguage()
const isFr = language === 'fr'
const isEs = language === 'es'
const isAr = language === 'ar'

// Initialize all language strings with the current language
commonStrings.setLanguage(language)
headerStrings.setLanguage(language)
bookingsStrings.setLanguage(language)
bookingStrings.setLanguage(language)
activateStrings.setLanguage(language)
masterStrings.setLanguage(language)
noMatchStrings.setLanguage(language)
signInStrings.setLanguage(language)
settingsStrings.setLanguage(language)
dressesStrings.setLanguage(language)
suppliersStrings.setLanguage(language)
usersStrings.setLanguage(language)
locationsStrings.setLanguage(language)
createBookingStrings.setLanguage(language)

// Set document direction based on language
const rtl = isAr
document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')
document.documentElement.setAttribute('lang', language)

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
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#fafafa',
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
