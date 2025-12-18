/**
 * Utility functions for handling default avatars and images
 */
import React from 'react'

export const getDefaultAvatar = (entityType: 'user' | 'supplier' | 'dress' | 'location', name?: string): string => {
  // Generate a consistent color based on the name
  const getColorFromName = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  // Create SVG avatar with initials and background color
  const createSVGAvatar = (initials: string, backgroundColor: string): string => {
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold"
              text-anchor="middle" dominant-baseline="central" fill="white">
          ${initials}
        </text>
      </svg>
    `
    // Use encodeURIComponent for proper UTF-8 encoding (browser-compatible)
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  // Default images for different entity types
  const defaultImages = {
    user: '/assets/img/default-user.png',
    supplier: '/assets/img/default-supplier.png',
    dress: '/assets/img/default-dress.png',
    location: '/assets/img/default-location.png'
  }

  // If name is provided, create a personalized avatar
  if (name && name.trim()) {
    const initials = getInitials(name.trim())
    const backgroundColor = getColorFromName(name.trim())
    return createSVGAvatar(initials, backgroundColor)
  }

  // Return default image for entity type
  return defaultImages[entityType] || defaultImages.user
}

export const getDefaultDressImage = (dressName?: string, dressType?: string): string => {
  if (dressName) {
    return getDefaultAvatar('dress', dressName)
  }

  // Return type-specific default images
  const typeImages = {
    'Wedding': '/assets/img/default-wedding-dress.png',
    'Evening': '/assets/img/default-evening-dress.png',
    'Cocktail': '/assets/img/default-cocktail-dress.png',
    'Prom': '/assets/img/default-prom-dress.png'
  }

  return typeImages[dressType as keyof typeof typeImages] || '/assets/img/default-dress.png'
}

export const getDefaultLocationImage = (locationName?: string): string => {
  if (locationName) {
    return getDefaultAvatar('location', locationName)
  }
  return '/assets/img/default-location.png'
}

export const getDefaultUserAvatar = (fullName?: string, userType?: string): string => {
  if (fullName) {
    return getDefaultAvatar(userType === 'supplier' ? 'supplier' : 'user', fullName)
  }

  const typeImages = {
    'admin': '/assets/img/default-admin.png',
    'supplier': '/assets/img/default-supplier.png',
    'user': '/assets/img/default-user.png'
  }

  return typeImages[userType as keyof typeof typeImages] || '/assets/img/default-user.png'
}

// Helper function to check if an image URL is valid/accessible
export const isValidImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url || url.trim() === '') {
      resolve(false)
      return
    }

    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

// Function to get the best available image with fallback
export const getBestAvailableImage = async (
  primaryUrl?: string,
  fallbackUrl?: string,
  entityType: 'user' | 'supplier' | 'dress' | 'location' = 'user',
  name?: string
): Promise<string> => {
  // Try primary URL first
  if (primaryUrl && await isValidImageUrl(primaryUrl)) {
    return primaryUrl
  }

  // Try fallback URL
  if (fallbackUrl && await isValidImageUrl(fallbackUrl)) {
    return fallbackUrl
  }

  // Return default avatar
  return getDefaultAvatar(entityType, name)
}

// React hook for using avatars with loading states
export const useAvatar = (
  primaryUrl?: string,
  fallbackUrl?: string,
  entityType: 'user' | 'supplier' | 'dress' | 'location' = 'user',
  name?: string
) => {
  const [avatarUrl, setAvatarUrl] = React.useState<string>(getDefaultAvatar(entityType, name))
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadAvatar = async () => {
      setLoading(true)
      const bestUrl = await getBestAvailableImage(primaryUrl, fallbackUrl, entityType, name)
      setAvatarUrl(bestUrl)
      setLoading(false)
    }

    loadAvatar()
  }, [primaryUrl, fallbackUrl, entityType, name])

  return { avatarUrl, loading }
}

export default {
  getDefaultAvatar,
  getDefaultDressImage,
  getDefaultLocationImage,
  getDefaultUserAvatar,
  isValidImageUrl,
  getBestAvailableImage,
  useAvatar
}
