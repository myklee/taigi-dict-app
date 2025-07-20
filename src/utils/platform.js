/**
 * Platform detection utilities for handling different build environments
 */

/**
 * Check if the app is running on a mobile platform (Capacitor)
 * @returns {boolean}
 */
export const isMobile = () => {
  return import.meta.env.VITE_PLATFORM === 'mobile' || 
         import.meta.env.VITE_IS_CAPACITOR === 'true'
}

/**
 * Check if the app is running on web
 * @returns {boolean}
 */
export const isWeb = () => {
  return import.meta.env.VITE_PLATFORM === 'web' && 
         import.meta.env.VITE_IS_CAPACITOR !== 'true'
}

/**
 * Get the current router mode
 * @returns {'hash' | 'history'}
 */
export const getRouterMode = () => {
  return import.meta.env.VITE_ROUTER_MODE || (isMobile() ? 'hash' : 'history')
}

/**
 * Check if Capacitor is available
 * @returns {boolean}
 */
export const isCapacitorAvailable = () => {
  if (typeof window === 'undefined') return false
  
  return !!(window.Capacitor && 
           window.Capacitor.isNativePlatform && 
           typeof window.Capacitor.isNativePlatform === 'function' &&
           window.Capacitor.isNativePlatform())
}

/**
 * Get platform-specific configuration
 * @returns {object}
 */
export const getPlatformConfig = () => {
  return {
    platform: import.meta.env.VITE_PLATFORM,
    routerMode: getRouterMode(),
    isMobile: isMobile(),
    isWeb: isWeb(),
    isCapacitor: import.meta.env.VITE_IS_CAPACITOR === 'true',
    isCapacitorAvailable: isCapacitorAvailable()
  }
}

/**
 * Handle deep linking for mobile platforms
 * @param {string} url - The URL to handle
 * @returns {string} - The processed URL
 */
export const handleDeepLink = (url) => {
  if (!url) return '/'
  
  // For mobile platforms, ensure URLs work with hash routing
  if (isMobile() && !url.startsWith('#')) {
    // Convert history mode URLs to hash mode URLs
    if (url.startsWith('/')) {
      return `#${url}`
    }
  }
  
  // For web platforms, ensure clean URLs
  if (isWeb() && url.startsWith('#')) {
    return url.substring(1) || '/'
  }
  
  return url
}

/**
 * Get the appropriate base URL for the current platform
 * @returns {string}
 */
export const getBaseUrl = () => {
  if (isMobile()) {
    return ''
  }
  return import.meta.env.BASE_URL || '/'
}

/**
 * Log platform information for debugging
 */
export const logPlatformInfo = () => {
  const config = getPlatformConfig()
  console.log('Platform Configuration:', config)
  
  if (typeof window !== 'undefined') {
    console.log('User Agent:', navigator.userAgent)
    console.log('Location:', window.location.href)
    
    if (window.Capacitor) {
      console.log('Capacitor Info:', {
        platform: window.Capacitor.getPlatform(),
        isNative: window.Capacitor.isNativePlatform()
      })
    }
  }
}