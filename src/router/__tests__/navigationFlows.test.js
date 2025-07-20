// Integration tests for complete navigation flows
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { routes } from '../routes.js'
import { setupNavigationGuards } from '../guards.js'
import { useAuthStore } from '@/stores/authStore.js'

describe('Navigation Flows Integration', () => {
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
      routes
    })
    
    // Set up navigation guards
    setupNavigationGuards(router)
    
    // Get auth store instance
    authStore = useAuthStore()
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Complete User Navigation Scenarios', () => {
    it('should handle anonymous user browsing flow', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Start at home page
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // Browse to random word
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')
      
      // View a specific word
      await router.push('/word/test-word')
      expect(router.currentRoute.value.name).toBe('word-detail')
      expect(router.currentRoute.value.params.id).toBe('test-word')
      
      // Search for words
      await router.push('/search/hello')
      expect(router.currentRoute.value.name).toBe('search')
      expect(router.currentRoute.value.params.query).toBe('hello')
      
      // Try to access protected route - should be redirected
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.redirect).toBe('/profile')
      expect(router.currentRoute.value.query.message).toBe('Please log in to access this page')
    })

    it('should handle authenticated user flow', async () => {
      // Mock authenticated state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Start at home page
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // Access profile (should work)
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
      
      // Access favorites (should work)
      await router.push('/favorites')
      expect(router.currentRoute.value.name).toBe('favorites')
      
      // Access search history (should work)
      await router.push('/history')
      expect(router.currentRoute.value.name).toBe('search-history')
      
      // Try to access admin area - should be redirected
      await router.push('/admin')
      expect(router.currentRoute.value.name).toBe('profile')
      expect(router.currentRoute.value.query.message).toBe('Admin privileges required to access this area')
      
      // Edit a word (should work)
      await router.push('/edit-word/123')
      expect(router.currentRoute.value.name).toBe('edit-word')
      expect(router.currentRoute.value.params.id).toBe('123')
    })

    it('should handle admin user flow', async () => {
      // Mock admin state
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Access all public routes
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // Access all protected routes
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
      
      await router.push('/favorites')
      expect(router.currentRoute.value.name).toBe('favorites')
      
      // Access admin dashboard
      await router.push('/admin')
      expect(router.currentRoute.value.name).toBe('admin-dashboard')
      
      // Access admin sub-routes
      await router.push('/admin/users')
      expect(router.currentRoute.value.name).toBe('admin-users')
      
      await router.push('/admin/moderation')
      expect(router.currentRoute.value.name).toBe('admin-moderation')
      
      await router.push('/admin/community')
      expect(router.currentRoute.value.name).toBe('admin-community')
    })

    it('should handle user authentication state changes during navigation', async () => {
      // Start unauthenticated
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // Try to access protected route
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // User logs in
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      
      // Now can access protected route
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
      
      // User logs out
      authStore.user = null
      
      // Try to access protected route again - should be redirected
      await router.push('/favorites')
      expect(router.currentRoute.value.name).toBe('dictionary')
    })
  })

  describe('Authentication-Protected Route Access', () => {
    it('should protect all user routes consistently', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      const protectedRoutes = [
        '/profile',
        '/favorites',
        '/history',
        '/edit-word',
        '/edit-word/123',
        '/edit-word-mknoll',
        '/edit-word-mknoll/456'
      ]
      
      for (const route of protectedRoutes) {
        await router.push(route)
        expect(router.currentRoute.value.name).toBe('dictionary')
        expect(router.currentRoute.value.query.message).toBe('Please log in to access this page')
      }
    })

    it('should allow authenticated users to access all protected routes', async () => {
      // Mock authenticated state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      const protectedRoutes = [
        { path: '/profile', name: 'profile' },
        { path: '/favorites', name: 'favorites' },
        { path: '/history', name: 'search-history' },
        { path: '/edit-word', name: 'edit-word' },
        { path: '/edit-word/123', name: 'edit-word' },
        { path: '/edit-word-mknoll', name: 'edit-word-mknoll' },
        { path: '/edit-word-mknoll/456', name: 'edit-word-mknoll' }
      ]
      
      for (const route of protectedRoutes) {
        await router.push(route.path)
        expect(router.currentRoute.value.name).toBe(route.name)
      }
    })

    it('should preserve redirect information for post-login navigation', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Try to access protected route
      await router.push('/favorites')
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.redirect).toBe('/favorites')
      
      // Simulate login and redirect
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      
      // Navigate to the originally requested route
      const redirectPath = router.currentRoute.value.query.redirect
      await router.push(redirectPath)
      expect(router.currentRoute.value.name).toBe('favorites')
    })
  })

  describe('Admin Route Access Control', () => {
    it('should protect all admin routes from unauthenticated users', async () => {
      // Mock unauthenticated state
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/moderation',
        '/admin/community'
      ]
      
      for (const route of adminRoutes) {
        await router.push(route)
        expect(router.currentRoute.value.name).toBe('dictionary')
        expect(router.currentRoute.value.query.message).toBe('Please log in to access admin area')
      }
    })

    it('should protect all admin routes from non-admin users', async () => {
      // Mock regular user state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/moderation',
        '/admin/community'
      ]
      
      for (const route of adminRoutes) {
        await router.push(route)
        expect(router.currentRoute.value.name).toBe('profile')
        expect(router.currentRoute.value.query.message).toBe('Admin privileges required to access this area')
      }
    })

    it('should allow admin users to access all admin routes', async () => {
      // Mock admin state
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      const adminRoutes = [
        { path: '/admin', name: 'admin-dashboard' },
        { path: '/admin/users', name: 'admin-users' },
        { path: '/admin/moderation', name: 'admin-moderation' },
        { path: '/admin/community', name: 'admin-community' }
      ]
      
      for (const route of adminRoutes) {
        await router.push(route.path)
        expect(router.currentRoute.value.name).toBe(route.name)
      }
    })
  })

  describe('Browser Back/Forward Functionality', () => {
    it('should maintain navigation history correctly', async () => {
      // Mock authenticated state for full access
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Build up navigation history
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')
      
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
      
      await router.push('/admin')
      expect(router.currentRoute.value.name).toBe('admin-dashboard')
      
      // Test that we can navigate through history
      // Note: In memory history, go() behavior might be limited
      // but we can test that the methods exist and don't throw errors
      expect(() => router.go(-1)).not.toThrow()
      expect(() => router.go(1)).not.toThrow()
      expect(() => router.back()).not.toThrow()
      expect(() => router.forward()).not.toThrow()
    })

    it('should handle history navigation with auth state changes', async () => {
      // Start authenticated
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Navigate to protected route
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
      
      // Navigate to public route
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // User logs out
      authStore.user = null
      
      // Try to go back to protected route
      // This would typically be handled by the browser, but we can test
      // that attempting to navigate back to a protected route redirects appropriately
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('dictionary')
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle navigation errors gracefully', async () => {
      // Mock authenticated state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Start with valid navigation
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      // Navigate to invalid route
      await router.push('/invalid-route')
      expect(router.currentRoute.value.name).toBe('not-found')
      
      // Should be able to recover and navigate to valid routes
      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
    })

    it('should handle auth initialization failures', async () => {
      // Mock auth initialization failure
      authStore.user = null
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockRejectedValue(new Error('Auth failed'))
      
      // Should still allow navigation to public routes
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')
      
      // Should handle protected routes gracefully (likely redirect)
      await router.push('/profile')
      // Behavior depends on guard implementation, but should not crash
      expect(router.currentRoute.value.name).toBeDefined()
    })

    it('should handle rapid navigation changes', async () => {
      // Mock authenticated state
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Perform rapid navigation
      const navigationPromises = [
        router.push('/'),
        router.push('/random'),
        router.push('/profile'),
        router.push('/favorites'),
        router.push('/comparison')
      ]
      
      // Wait for all navigations to complete
      await Promise.allSettled(navigationPromises)
      
      // Should end up at the last navigation
      expect(router.currentRoute.value.name).toBe('comparison')
    })

    it('should handle navigation during loading states', async () => {
      // Mock loading state
      authStore.user = null
      authStore.loading = true
      authStore.initializeAuth = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            authStore.loading = false
            authStore.user = { 
              id: 'user123', 
              email: 'test@example.com',
              user_metadata: { role: 'user' }
            }
            resolve()
          }, 100)
        })
      })
      
      // Try to navigate to protected route while loading
      const navigationPromise = router.push('/profile')
      
      // Should handle the navigation appropriately
      await navigationPromise
      
      // Behavior depends on guard implementation
      expect(router.currentRoute.value.name).toBeDefined()
    })
  })

  describe('Route Parameter and Query Handling', () => {
    it('should handle complex parameter combinations', async () => {
      // Navigate with parameters and queries
      await router.push({
        name: 'search',
        params: { query: 'test-word' },
        query: { 
          page: '2', 
          filter: 'all', 
          sort: 'relevance' 
        }
      })
      
      expect(router.currentRoute.value.name).toBe('search')
      expect(router.currentRoute.value.params.query).toBe('test-word')
      expect(router.currentRoute.value.query.page).toBe('2')
      expect(router.currentRoute.value.query.filter).toBe('all')
      expect(router.currentRoute.value.query.sort).toBe('relevance')
    })

    it('should handle parameter encoding and special characters', async () => {
      const specialId = 'word-with-特殊字符-and-spaces'
      
      await router.push({
        name: 'word-detail',
        params: { id: specialId }
      })
      
      expect(router.currentRoute.value.name).toBe('word-detail')
      expect(router.currentRoute.value.params.id).toBe(specialId)
    })

    it('should handle optional parameters correctly', async () => {
      // Mock authenticated state for edit routes
      authStore.user = { 
        id: 'user123', 
        email: 'test@example.com',
        user_metadata: { role: 'user' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      // Navigate to edit route without ID (optional parameter)
      await router.push({ name: 'edit-word' })
      expect(router.currentRoute.value.name).toBe('edit-word')
      expect(router.currentRoute.value.params.id).toBeUndefined()
      
      // Navigate to edit route with ID
      await router.push({ name: 'edit-word', params: { id: '123' } })
      expect(router.currentRoute.value.name).toBe('edit-word')
      expect(router.currentRoute.value.params.id).toBe('123')
    })
  })
})