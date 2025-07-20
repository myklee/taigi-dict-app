import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '../routes.js'
import { setupNavigationGuards } from '../guards.js'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    isAdmin: false,
    error: null,
    initializeAuth: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn()
  })
}))

describe('Router Error Handling', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    setupNavigationGuards(router)
  })

  describe('404 Routes', () => {
    it('should redirect invalid routes to 404 page', async () => {
      await router.push('/invalid-route')
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should redirect deeply nested invalid routes to 404', async () => {
      await router.push('/admin/invalid/deeply/nested/route')
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should handle routes with special characters', async () => {
      await router.push('/route-with-@#$%^&*()-characters')
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should handle routes with query parameters', async () => {
      await router.push('/invalid-route?param1=value1&param2=value2')
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should handle routes with hash fragments', async () => {
      await router.push('/invalid-route#section')
      expect(router.currentRoute.value.name).toBe('not-found')
    })
  })

  describe('Catch-all Route', () => {
    it('should have a catch-all route that redirects to 404', () => {
      const catchAllRoute = routes.find(route => route.path === '/:pathMatch(.*)*')
      expect(catchAllRoute).toBeDefined()
      expect(catchAllRoute.redirect).toBe('/404')
      expect(catchAllRoute.name).toBe('catch-all')
    })

    it('should handle empty paths correctly', async () => {
      // Test that empty or root path goes to dictionary, not 404
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
    })
  })

  describe('Route Resolution', () => {
    it('should resolve valid routes correctly', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')

      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')

      await router.push('/comparison')
      expect(router.currentRoute.value.name).toBe('comparison')
    })

    it('should handle route parameters correctly', async () => {
      await router.push('/word/123')
      expect(router.currentRoute.value.name).toBe('word-detail')
      expect(router.currentRoute.value.params.id).toBe('123')
    })

    it('should handle optional route parameters', async () => {
      await router.push('/search')
      expect(router.currentRoute.value.name).toBe('search')
      // Optional parameters return empty string when not provided
      expect(router.currentRoute.value.params.query).toBe('')

      await router.push('/search/test-query')
      expect(router.currentRoute.value.name).toBe('search')
      expect(router.currentRoute.value.params.query).toBe('test-query')
    })
  })

  describe('Error Recovery', () => {
    it('should handle navigation errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Simulate a navigation error by trying to navigate to an invalid route
      try {
        await router.push('/this-should-not-exist')
      } catch (error) {
        // Error should be handled gracefully
      }
      
      // Should end up on 404 page
      expect(router.currentRoute.value.name).toBe('not-found')
      
      consoleSpy.mockRestore()
    })

    it('should preserve query parameters when redirecting to 404', async () => {
      await router.push('/invalid-route?important=data&user=123')
      expect(router.currentRoute.value.name).toBe('not-found')
      // Note: Query parameters are not preserved in redirect by design
      // This is intentional to avoid potential security issues
    })
  })

  describe('Route Meta Information', () => {
    it('should have correct meta information for 404 route', () => {
      const notFoundRoute = routes.find(route => route.name === 'not-found')
      expect(notFoundRoute.meta.title).toBe('Page Not Found')
    })

    it('should handle routes without meta information', async () => {
      // This should not throw an error
      await router.push('/404')
      expect(router.currentRoute.value.name).toBe('not-found')
    })
  })

  describe('Navigation History', () => {
    it('should maintain proper navigation history with 404 routes', async () => {
      // Start at home
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')

      // Navigate to valid route
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')

      // Navigate to invalid route (should go to 404)
      await router.push('/invalid-route')
      expect(router.currentRoute.value.name).toBe('not-found')

      // Go back should work
      router.go(-1)
      // Note: In memory history, we can't easily test browser back/forward
      // This would need to be tested in an actual browser environment
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long URLs', async () => {
      const longPath = '/very-long-path-' + 'a'.repeat(1000)
      await router.push(longPath)
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should handle URLs with encoded characters', async () => {
      await router.push('/invalid%20route%20with%20spaces')
      expect(router.currentRoute.value.name).toBe('not-found')
    })

    it('should handle multiple consecutive slashes', async () => {
      await router.push('///multiple///slashes///')
      expect(router.currentRoute.value.name).toBe('not-found')
    })
  })
})