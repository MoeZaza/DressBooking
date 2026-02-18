
/**
 * Accessibility Utilities
 * Helper functions for improving accessibility
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Return cleanup function
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }
}

/**
 * Manage focus for modals and dialogs
 */
export class FocusManager {
  private focusableElements: HTMLElement[] = []
  private previousFocus: HTMLElement | null = null
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null

  constructor(private container: HTMLElement) {
    this.updateFocusableElements()
    this.keydownHandler = this.handleKeyDown.bind(this)
  }

  private updateFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ]

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selectors.join(', '))
    ) as HTMLElement[]
  }

  trapFocus() {
    this.previousFocus = document.activeElement as HTMLElement

    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus()
    }

    this.container.addEventListener('keydown', this.keydownHandler as EventListener)
  }

  releaseFocus() {
    this.container.removeEventListener('keydown', this.keydownHandler as EventListener)
    this.keydownHandler = null

    if (this.previousFocus) {
      this.previousFocus.focus()
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {
      return
    }

    const firstElement = this.focusableElements[0]
    const lastElement = this.focusableElements[this.focusableElements.length - 1]

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
}

/**
 * Add keyboard navigation support - with cleanup function
 */
export function addKeyboardNavigation() {
  const keydownHandler = (event: KeyboardEvent) => {
    // Escape key handling
    if (event.key === 'Escape') {
      const modal = document.querySelector('.modal:not(.d-none)')
      if (modal) {
        const closeButton = modal.querySelector('.btn-close, .close')
        if (closeButton) {
          (closeButton as HTMLElement).click()
        }
      }
    }

    // Enter key for buttons
    if (event.key === 'Enter' && event.target instanceof HTMLElement) {
      if (event.target.getAttribute('role') === 'button') {
        event.target.click()
      }
    }

    // Arrow key navigation for menus
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      const menu = (event.target as HTMLElement).closest('[role="menu"]')
      if (menu) {
        event.preventDefault()
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
        const currentIndex = items.indexOf(event.target as HTMLElement)
        let nextIndex
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }
        items[nextIndex].focus()
      }
    }
  }

  document.addEventListener('keydown', keydownHandler)

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', keydownHandler)
  }
}

/**
 * Add mouse event listener - with cleanup function
 */
export function addMouseNavigation() {
  const mousedownHandler = () => {
    document.body.classList.remove('keyboard-nav')
  }

  document.addEventListener('mousedown', mousedownHandler)

  // Return cleanup function
  return () => {
    document.removeEventListener('mousedown', mousedownHandler)
  }
}

/**
 * Improve form accessibility
 */
export function improveFormAccessibility() {
  // Add required indicators
  document.querySelectorAll('input[required], select[required], textarea[required]').forEach(element => {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label && !label.textContent?.includes('*')) {
      label.innerHTML += ' <span class="text-danger" aria-label="required">*</span>'
    }
  })

  // Add error message containers
  document.querySelectorAll('input, select, textarea').forEach(element => {
    if (!element.nextElementSibling?.classList.contains('error-message')) {
      const errorContainer = document.createElement('div')
      errorContainer.className = 'error-message'
      errorContainer.setAttribute('role', 'alert')
      errorContainer.setAttribute('aria-live', 'polite')
      element.parentNode?.insertBefore(errorContainer, element.nextSibling)
    }
  })
}

/**
 * Add ARIA labels and descriptions
 */
export function addARIALabels() {
  // Add labels to buttons without text
  document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
    const icon = button.querySelector('i, svg')
    if (icon && !button.textContent?.trim()) {
      const className = icon.className
      if (className.includes('edit')) {
        button.setAttribute('aria-label', 'Edit')
      } else if (className.includes('delete')) {
        button.setAttribute('aria-label', 'Delete')
      } else if (className.includes('add')) {
        button.setAttribute('aria-label', 'Add')
      } else if (className.includes('search')) {
        button.setAttribute('aria-label', 'Search')
      } else {
        button.setAttribute('aria-label', 'Button')
      }
    }
  })

  // Add descriptions to form fields
  document.querySelectorAll('input[type="password"]').forEach(input => {
    if (!input.getAttribute('aria-describedby')) {
      const description = document.createElement('div')
      description.id = `${input.id || 'password'}-description`
      description.className = 'sr-only'
      description.textContent = 'Password must be at least 8 characters long'
      input.parentNode?.appendChild(description)
      input.setAttribute('aria-describedby', description.id)
    }
  })
}

/**
 * Improve table accessibility
 */
export function improveTableAccessibility() {
  document.querySelectorAll('table').forEach(table => {
    // Add table caption if missing
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption')
      caption.className = 'sr-only'
      caption.textContent = 'Data table'
      table.insertBefore(caption, table.firstChild)
    }

    // Add scope attributes to headers
    table.querySelectorAll('th').forEach(th => {
      if (!th.getAttribute('scope')) {
        th.setAttribute('scope', 'col')
      }
    })
  })
}

/**
 * Add skip links
 */
export function addSkipLinks() {
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.className = 'skip-link'
  skipLink.textContent = 'Skip to main content'
  document.body.insertBefore(skipLink, document.body.firstChild)

  // Return cleanup function
  return () => {
    if (document.body.contains(skipLink)) {
      document.body.removeChild(skipLink)
    }
  }
}

/**
 * Ensure main content has ID
 */
export function ensureMainContentId() {
  const mainContent = document.querySelector('main, .main-content, #main')
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content'
  }
}

/**
 * Initialize all accessibility improvements - returns cleanup functions
 */
export function initializeAccessibility() {
  const keyboardNavCleanup = addKeyboardNavigation()
  const mouseNavCleanup = addMouseNavigation()

  improveFormAccessibility()
  addARIALabels()
  improveTableAccessibility()

  const skipLinkCleanup = addSkipLinks()
  ensureMainContentId()

  // Add keyboard navigation class to body
  const keydownClassHandler = () => {
    document.body.classList.add('keyboard-nav')
  }
  document.addEventListener('keydown', keydownClassHandler)

  // Return combined cleanup function
  return () => {
    keyboardNavCleanup()
    mouseNavCleanup()
    skipLinkCleanup()
    document.removeEventListener('keydown', keydownClassHandler)
    document.body.classList.remove('keyboard-nav')
  }
}

// Keep backward compatibility
export function improveFormAccessibility_original() {
  // Add required indicators
  document.querySelectorAll('input[required], select[required], textarea[required]').forEach(element => {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label && !label.textContent?.includes('*')) {
      label.innerHTML += ' <span class="text-danger" aria-label="required">*</span>'
    }
  })

  // Add error message containers
  document.querySelectorAll('input, select, textarea').forEach(element => {
    if (!element.nextElementSibling?.classList.contains('error-message')) {
      const errorContainer = document.createElement('div')
      errorContainer.className = 'error-message'
      errorContainer.setAttribute('role', 'alert')
      errorContainer.setAttribute('aria-live', 'polite')
      element.parentNode?.insertBefore(errorContainer, element.nextSibling)
    }
  })
}

export function improveTableAccessibility_original() {
  document.querySelectorAll('table').forEach(table => {
    // Add table caption if missing
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption')
      caption.className = 'sr-only'
      caption.textContent = 'Data table'
      table.insertBefore(caption, table.firstChild)
    }

    // Add scope attributes to headers
    table.querySelectorAll('th').forEach(th => {
      if (!th.getAttribute('scope')) {
        th.setAttribute('scope', 'col')
      }
    })
  })
}

export function addARIALabels_original() {
  // Add labels to buttons without text
  document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
    const icon = button.querySelector('i, svg')
    if (icon && !button.textContent?.trim()) {
      const className = icon.className
      if (className.includes('edit')) {
        button.setAttribute('aria-label', 'Edit')
      } else if (className.includes('delete')) {
        button.setAttribute('aria-label', 'Delete')
      } else if (className.includes('add')) {
        button.setAttribute('aria-label', 'Add')
      } else if (className.includes('search')) {
        button.setAttribute('aria-label', 'Search')
      } else {
        button.setAttribute('aria-label', 'Button')
      }
    }
  })

  // Add descriptions to form fields
  document.querySelectorAll('input[type="password"]').forEach(input => {
    if (!input.getAttribute('aria-describedby')) {
      const description = document.createElement('div')
      description.id = `${input.id || 'password'}-description`
      description.className = 'sr-only'
      description.textContent = 'Password must be at least 8 characters long'
      input.parentNode?.appendChild(description)
      input.setAttribute('aria-describedby', description.id)
    }
  })
}

export function initializeAccessibility_original() {
  addKeyboardNavigation()
  improveFormAccessibility()
  addARIALabels()
  improveTableAccessibility()
  addSkipLinks()

  // Add keyboard navigation class to body
  document.addEventListener('keydown', () => {
    document.body.classList.add('keyboard-nav')
  })
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav')
  })

  console.log('Accessibility improvements initialized')
}
