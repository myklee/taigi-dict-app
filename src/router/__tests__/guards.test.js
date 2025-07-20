// Unit tests for router navigation guards
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { setupNavigationGuards } from '../guards.js'
import { useAuthStore } from '@/stores/authStore.js'

// Mock routes for testing
const mockRoutes = [
  {
    path: '/',
    name: 'dictionary',
    component: { template: '<div>Dictionary</div>' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: { template: '<div>Profile</div>' },
    meta: { requiresAuth: true, title: 'User Profile' }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: { template: '<div>Favorites</div>' },
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: { template: '<div>Admin</div>' },
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: { template: '<div>Admin Users</div>' },
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

describe('Navigation Guards', () => {
  let router
  let authStore
  let pinia

  beforeEach(() => {
    // Set up Pinia
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Create router with memory history for testing
    router = createRouter({
      history: createMemoryHistory(),
      routes: mockRoutes
    })
    
    // Set up navigation guards
    setupNavigationGuards(router)
    
    // Get auth store instance
    authStore = useAuthStore()
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
    })

    it('should allow access to public routes with authentication', async () => {
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
    })
  })

  describe('Protected Routes - Authentication Required', () => {
    it('should redirect unauthenticated users to dictionary page', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/profile')
      
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.redirect).toBe('/profile')
      expect(router.currentRoute.value.query.message).toBe('Please log in to access this page')
    })

    it('should allow authenticated users to access protected routes', async () => {
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
    })

    it('should redirect unauthenticated users from favorites page', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/favorites')
      
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.redirect).toBe('/favorites')
      expect(router.currentRoute.value.query.message).toBe('Please log in to access this page')
    })

    it('should initialize auth if not already done', async () => {
      // Mock uninitialized auth state
      authStore.user = null
      authStore.loading = false
      const initializeAuthSpy = vi.fn().mockResolvedValue()
      authStore.initializeAuth = initializeAuthSpy
      
      await router.push('/profile')
      
      expect(initializeAuthSpy).toHaveBeenCalled()
    })

    it('should not initialize auth if already loading', async () => {
      // Mock loading auth state
      authStore.user = null
      authStore.loading = true
      const initializeAuthSpy = vi.fn().mockResolvedValue()
      authStore.initializeAuth = initializeAuthSpy
      
      await router.push('/profile')
      
      expect(initializeAuthSpy).not.toHaveBeenCalled()
    })
  })

  describe('Admin Routes - Admin Role Required', () => {
    it('should redirect unauthenticated users to dictionary page', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/admin')
      
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.redirect).toBe('/admin')
      expect(router.currentRoute.value.query.message).toBe('Please log in to access admin area')
    })

    it('should redirect non-admin users to profile page', async () => {
      // Mock authenticated but non-admin state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/admin')
      
      expect(router.currentRoute.value.name).toBe('profile')
      expect(router.currentRoute.value.query.message).toBe('Admin privileges required to access this area')
    })

    it('should allow admin users to access admin routes', async () => {
      // Mock admin state
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/admin')
      expect(router.currentRoute.value.name).toBe('admin')
    })

    it('should protect nested admin routes', async () => {
      // Mock non-admin state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/admin/users')
      
      expect(router.currentRoute.value.name).toBe('profile')
      expect(router.currentRoute.value.query.message).toBe('Admin privileges required to access this area')
    })

    it('should allow admin users to access nested admin routes', async () => {
      // Mock admin state
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/admin/users')
      expect(router.currentRoute.value.name).toBe('admin-users')
    })
  })

  describe('Error Handling', () => {
    it('should handle auth initialization errors gracefully', async () => {
      // Mock auth initialization error
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockRejectedValue(new Error('Auth error'))
      
      // Should still allow navigation despite error
      await router.push('/profile')
      
      // Should have attempted to initialize auth
      expect(authStore.initializeAuth).toHaveBeenCalled()
    })

    it('should handle missing auth store gracefully', async () => {
      // This test ensures the guard doesn't crash if auth store is unavailable
      // Create a router without proper auth store setup
      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: mockRoutes
      })
      
      // Mock a broken auth store
      vi.doMock('@/stores/authStore.js', () => ({
        useAuthStore: () => {
          throw new Error('Auth store not available')
        }
      }))
      
      // Should not crash when setting up guards
      expect(() => setupNavigationGuards(testRouter)).not.toThrow()
    })
  })

  describe('Page Title Management', () => {
    it('should set page title from route meta', async () => {
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Navigate to a route with title meta
      await router.push('/profile')
      
      expect(document.title).toBe('User Profile - Taigi Dictionary')
    })

    it('should set default title for routes without meta title', async () => {
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Navigate to dictionary route (no title in our mock)
      await router.push('/')
      
      expect(document.title).toBe('Taigi Dictionary')
    })
  })

  describe('After Navigation Cleanup', () => {
    it('should log navigation for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/profile')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Navigated from')
      )
    })

    it('should clear auth errors after successful navigation', async () => {
      // Use fake timers
      vi.useFakeTimers()
      
      // Mock authenticated state with error
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.error = 'Some auth error'
      authStore.clearError = vi.fn()
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/profile')
      
      // Fast-forward time to trigger the timeout
      vi.advanceTimersByTime(5000)
      
      expect(authStore.clearError).toHaveBeenCalled()
      
      // Restore real timers
      vi.useRealTimers()
    })
  })
})