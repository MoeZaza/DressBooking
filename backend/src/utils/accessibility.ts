/**
 * Accessibility utilities for the BookDress backend application
 */

/**
 * Initialize accessibility features
 */
export const initializeAccessibility = (): void => {
  // Add keyboard navigation support
  initializeKeyboardNavigation()
  
  // Add focus management
  initializeFocusManagement()
  
  // Add ARIA live regions
  initializeAriaLiveRegions()
  
  // Add high contrast mode detection
  initializeHighContrastMode()
}

/**
 * Initialize keyboard navigation
 */
const initializeKeyboardNavigation = (): void => {
  document.addEventListener('keydown', (event) => {
    // Handle Escape key to close modals/dropdowns
    if (event.key === 'Escape') {
      const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]')
      openModals.forEach((modal) => {
        const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="إغلاق"]')
        if (closeButton instanceof HTMLElement) {
          closeButton.click()
        }
      })
    }
    
    // Handle Tab key for focus management
    if (event.key === 'Tab') {
      manageFocusTrapping(event)
    }
  })
}

/**
 * Initialize focus management
 */
const initializeFocusManagement = (): void => {
  // Add focus indicators for keyboard navigation
  const style = document.createElement('style')
  style.textContent = `
    *:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
    }
    
    .skip-link:focus {
      top: 6px;
    }
  `
  document.head.appendChild(style)
  
  // Add skip link for keyboard users
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.className = 'skip-link'
  skipLink.textContent = 'Skip to main content'
  skipLink.setAttribute('aria-label', 'Skip to main content')
  document.body.insertBefore(skipLink, document.body.firstChild)
}

/**
 * Manage focus trapping in modals
 */
const manageFocusTrapping = (event: KeyboardEvent): void => {
  const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]')
  if (!activeModal) return
  
  const focusableElements = activeModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  if (focusableElements.length === 0) return
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

/**
 * Initialize ARIA live regions for dynamic content
 */
const initializeAriaLiveRegions = (): void => {
  // Create polite live region for non-urgent updates
  const politeRegion = document.createElement('div')
  politeRegion.setAttribute('aria-live', 'polite')
  politeRegion.setAttribute('aria-atomic', 'true')
  politeRegion.className = 'sr-only'
  politeRegion.id = 'polite-live-region'
  document.body.appendChild(politeRegion)
  
  // Create assertive live region for urgent updates
  const assertiveRegion = document.createElement('div')
  assertiveRegion.setAttribute('aria-live', 'assertive')
  assertiveRegion.setAttribute('aria-atomic', 'true')
  assertiveRegion.className = 'sr-only'
  assertiveRegion.id = 'assertive-live-region'
  document.body.appendChild(assertiveRegion)
}

/**
 * Initialize high contrast mode detection
 */
const initializeHighContrastMode = (): void => {
  // Detect Windows high contrast mode
  const mediaQuery = window.matchMedia('(prefers-contrast: high)')
  
  const handleContrastChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (e.matches) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }
  
  // Initial check
  handleContrastChange(mediaQuery)
  
  // Listen for changes
  mediaQuery.addEventListener('change', handleContrastChange)
}

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const regionId = priority === 'assertive' ? 'assertive-live-region' : 'polite-live-region'
  const region = document.getElementById(regionId)
  
  if (region) {
    region.textContent = message
    
    // Clear the message after a short delay to allow for re-announcement
    setTimeout(() => {
      region.textContent = ''
    }, 1000)
  }
}

/**
 * Set focus to element with proper handling
 */
export const setFocus = (element: HTMLElement | null, options?: FocusOptions): void => {
  if (element) {
    element.focus(options)
    
    // Announce focus change to screen readers if element has accessible name
    const accessibleName = element.getAttribute('aria-label') || 
                           element.getAttribute('aria-labelledby') || 
                           element.textContent?.trim()
    
    if (accessibleName) {
      announceToScreenReader(`Focused on ${accessibleName}`, 'polite')
    }
  }
}

/**
 * Add ARIA attributes to enhance accessibility
 */
export const enhanceElementAccessibility = (element: HTMLElement, options: {
  role?: string
  label?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
}): void => {
  if (options.role) {
    element.setAttribute('role', options.role)
  }
  
  if (options.label) {
    element.setAttribute('aria-label', options.label)
  }
  
  if (options.describedBy) {
    element.setAttribute('aria-describedby', options.describedBy)
  }
  
  if (options.expanded !== undefined) {
    element.setAttribute('aria-expanded', options.expanded.toString())
  }
  
  if (options.selected !== undefined) {
    element.setAttribute('aria-selected', options.selected.toString())
  }
  
  if (options.disabled !== undefined) {
    element.setAttribute('aria-disabled', options.disabled.toString())
    if (options.disabled) {
      element.setAttribute('tabindex', '-1')
    } else {
      element.removeAttribute('tabindex')
    }
  }
}
