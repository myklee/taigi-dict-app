import { describe, it, expect, vi } from 'vitest'
import { createWebHistory, createWebHashHistory } from 'vue-router'

describe('Platform Configuration', () => {
  it('should have environment variables available', () => {
    // Test that environment variables are accessible
    expect(import.meta.env).toBeDefined()
    
    // In test environment, these might not be set, so we check if they exist and are valid when present
    if (import.meta.env.VITE_PLATFORM) {
      expect(['web', 'mobile']).toContain(import.meta.env.VITE_PLATFORM)
    }
    
    if (import.meta.env.VITE_ROUTER_MODE) {
      expect(['hash', 'history']).toContain(import.meta.env.VITE_ROUTER_MODE)
    }
    
    if (import.meta.env.VITE_IS_CAPACITOR) {
      expect(['true', 'false']).toContain(import.meta.env.VITE_IS_CAPACITOR)
    }
  })

  it('should create appropriate router history based on environment', () => {
    // Test router history creation logic
    const createRouterHistory = () => {
      const platform = import.meta.env.VITE_PLATFORM
      const routerMode = import.meta.env.VITE_ROUTER_MODE
      const isCapacitor = import.meta.env.VITE_IS_CAPACITOR === 'true'
      
      if (platform === 'mobile' || isCapacitor || routerMode === 'hash') {
        return createWebHashHistory()
      }
      
      const base = import.meta.env.BASE_URL || '/'
      return createWebHistory(base)
    }

    const history = createRouterHistory()
    expect(history).toBeDefined()
    
    // Check if it's the right type based on current environment
    if (import.meta.env.VITE_PLATFORM === 'mobile') {
      expect(history.base).toBe('')
    }
  })

  it('should handle router error scenarios', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Test error handling function
    const handleRouterError = (error) => {
      console.error('Router navigation error:', error)
      
      if (error.name === 'NavigationDuplicated') {
        return
      }
      
      if (error.name === 'NavigationAborted') {
        console.warn('Navigation aborted:', error.message)
        return
      }
      
      if (error.name === 'NavigationCancelled') {
        console.warn('Navigation cancelled:', error.message)
        return
      }
    }
    
    // Test different error types
    const duplicateError = new Error('Duplicate')
    duplicateError.name = 'NavigationDuplicated'
    handleRouterError(duplicateError)
    
    const abortedError = new Error('Aborted')
    abortedError.name = 'NavigationAborted'
    handleRouterError(abortedError)
    
    expect(consoleSpy).toHaveBeenCalledTimes(2)
    
    consoleSpy.mockRestore()
  })
})

describe('Platform Utilities', () => {
  it('should detect platform correctly', async () => {
    const { isMobile, isWeb, getRouterMode, getPlatformConfig } = await import('../../utils/platform.js')
    
    // Test platform detection functions
    const mobile = isMobile()
    const web = isWeb()
    const routerMode = getRouterMode()
    const config = getPlatformConfig()
    
    expect(typeof mobile).toBe('boolean')
    expect(typeof web).toBe('boolean')
    expect(['hash', 'history']).toContain(routerMode)
    expect(config).toHaveProperty('platform')
    expect(config).toHaveProperty('routerMode')
    expect(config).toHaveProperty('isMobile')
    expect(config).toHaveProperty('isWeb')
  })

  it('should handle deep links appropriately', async () => {
    const { handleDeepLink } = await import('../../utils/platform.js')
    
    // Test various URL formats
    expect(handleDeepLink('')).toBe('/')
    expect(handleDeepLink('/')).toBe('/')
    
    const searchUrl = handleDeepLink('/search')
    expect(typeof searchUrl).toBe('string')
    expect(searchUrl.includes('search')).toBe(true)
    
    const hashUrl = handleDeepLink('#/profile')
    expect(typeof hashUrl).toBe('string')
    expect(hashUrl.includes('profile')).toBe(true)
  })

  it('should get correct base URL', async () => {
    const { getBaseUrl } = await import('../../utils/platform.js')
    
    const baseUrl = getBaseUrl()
    expect(typeof baseUrl).toBe('string')
  })

  it('should detect Capacitor availability', async () => {
    const { isCapacitorAvailable } = await import('../../utils/platform.js')
    
    const available = isCapacitorAvailable()
    expect(typeof available).toBe('boolean')
  })

  it('should log platform info without errors', async () => {
    const { logPlatformInfo } = await import('../../utils/platform.js')
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    expect(() => logPlatformInfo()).not.toThrow()
    
    consoleSpy.mockRestore()
  })
})