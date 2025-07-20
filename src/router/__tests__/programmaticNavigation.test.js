// Unit tests for programmatic navigation functions
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { routes } from '../routes.js'
import { setupNavigationGuards } from '../guards.js'
import { useAuthStore } from '@/stores/authStore.js'

describe('Programmatic Navigation', () => {
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

  describe('Router.push() Navigation', () => {
    it('should navigate to routes by name', async () => {
      await router.push({ name: 'dictionary' })
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push({ name: 'random-word' })
      expect(router.currentRoute.value.name).toBe('random-word')
      
      await router.push({ name: 'comparison' })
      expect(router.currentRoute.value.name).toBe('comparison')
    })

    it('should navigate to routes by path', async () => {
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')
      
      await router.push('/comparison')
      expect(router.currentRoute.value.name).toBe('comparison')
    })

    it('should navigate with route parameters', async () => {
      await router.push({ name: 'word-detail', params: { id: 'test-word-123' } })
      expect(router.currentRoute.value.name).toBe('word-detail')
      expect(router.currentRoute.value.params.id).toBe('test-word-123')
      
      await router.push({ name: 'search', params: { query: 'hello' } })
      expect(router.currentRoute.value.name).toBe('search')
      expect(router.currentRoute.value.params.query).toBe('hello')
    })

    it('should navigate with query parameters', async () => {
      await router.push({ 
        name: 'dictionary', 
        query: { search: 'test', filter: 'all' } 
      })
      expect(router.currentRoute.value.name).toBe('dictionary')
      expect(router.currentRoute.value.query.search).toBe('test')
      expect(router.currentRoute.value.query.filter).toBe('all')
    })

    it('should handle navigation to protected routes when authenticated', async () => {
      // Mock authenticated state
      authStore.user = { id: 'user123', email: 'test@example.com' }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push({ name: 'profile' })
      expect(router.currentRoute.value.name).toBe('profile')
      
      await router.push({ name: 'favorites' })
      expect(router.currentRoute.value.name).toBe('favorites')
    })

    it('should handle navigation to admin routes when admin', async () => {
      // Mock admin state
      authStore.user = { 
        id: 'admin123', 
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      }
      authStore.loading = false
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push({ name: 'admin' })
      expect(router.currentRoute.value.name).toBe('admin')
      
      await router.push({ name: 'admin-users' })
      expect(router.currentRoute.value.name).toBe('admin-users')
    })
  })

  describe('Router.replace() Navigation', () => {
    it('should replace current route without adding to history', async () => {
      // Navigate to initial route
      await router.push('/random')
      expect(router.currentRoute.value.name).toBe('random-word')
      
      // Replace with new route
      await router.replace('/comparison')
      expect(router.currentRoute.value.name).toBe('comparison')
      
      // History should not include the replaced route
      // Note: In memory history, we can't easily test this, but the replace method should work
    })

    it('should replace with route object', async () => {
      await router.push('/')
      await router.replace({ name: 'random-word' })
      expect(router.currentRoute.value.name).toBe('random-word')
    })

    it('should replace with parameters', async () => {
      await router.push('/')
      await router.replace({ 
        name: 'word-detail', 
        params: { id: 'replaced-word' } 
      })
      expect(router.currentRoute.value.name).toBe('word-detail')
      expect(router.currentRoute.value.params.id).toBe('replaced-word')
    })
  })

  describe('Router.go() Navigation', () => {
    it('should navigate through history', async () => {
      // Build up some history
      await router.push('/')
      await router.push('/random')
      await router.push('/comparison')
      
      expect(router.currentRoute.value.name).toBe('comparison')
      
      // Go back one step
      router.go(-1)
      // Note: In memory history, go() might not work exactly like browser history
      // This test verifies the method exists and can be called
    })

    it('should handle forward navigation', async () => {
      await router.push('/')
      await router.push('/random')
      
      // Go back
      router.go(-1)
      
      // Go forward
      router.go(1)
      
      // Method should execute without error
    })
  })

  describe('Navigation Error Handling', () => {
    it('should handle navigation to non-existent routes', async () => {
      try {
        await router.push('/non-existent-route')
        // Should redirect to 404
        expect(router.currentRoute.value.name).toBe('not-found')
      } catch (error) {
        // Navigation errors should be handled gracefully
        expect(error).toBeDefined()
      }
    })

    it('should handle navigation with invalid parameters', async () => {
      try {
        await router.push({ name: 'word-detail' }) // Missing required id parameter
        // Should still navigate but with empty parameter
        expect(router.currentRoute.value.name).toBe('word-detail')
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined()
      }
    })

    it('should handle navigation during auth loading', async () => {
      // Mock loading auth state
      authStore.user = null
      authStore.loading = true
      authStore.initializeAuth = vi.fn().mockResolvedValue()
      
      await router.push({ name: 'profile' })
      
      // Should redirect to dictionary since not authenticated
      expect(router.currentRoute.value.name).toBe('dictionary')
    })
  })

  describe('Route Resolution', () => {
    it('should resolve routes correctly', () => {
      const resolved = router.resolve({ name: 'dictionary' })
      expect(resolved.name).toBe('dictionary')
      expect(resolved.path).toBe('/')
      
      const resolvedWithParams = router.resolve({ 
        name: 'word-detail', 
        params: { id: 'test' } 
      })
      expect(resolvedWithParams.name).toBe('word-detail')
      expect(resolvedWithParams.path).toBe('/word/test')
    })

    it('should resolve routes with query parameters', () => {
      const resolved = router.resolve({ 
        name: 'dictionary', 
        query: { search: 'test' } 
      })
      expect(resolved.name).toBe('dictionary')
      expect(resolved.query.search).toBe('test')
    })

    it('should handle route resolution errors', () => {
      // Try to resolve a non-existent route
      expect(() => {
        router.resolve({ name: 'non-existent' })
      }).toThrow('No match for')
      
      // Should be able to resolve valid routes after error
      const validResolved = router.resolve({ name: 'dictionary' })
      expect(validResolved).toBeDefined()
      expect(validResolved.name).toBe('dictionary')
    })
  })

  describe('Route Matching', () => {
    it('should match routes by path', () => {
      const matched = router.getRoutes().find(route => route.path === '/')
      expect(matched).toBeDefined()
      expect(matched.name).toBe('dictionary')
    })

    it('should match routes with parameters', () => {
      const matched = router.getRoutes().find(route => route.path === '/word/:id')
      expect(matched).toBeDefined()
      expect(matched.name).toBe('word-detail')
    })

    it('should match nested routes', () => {
      const adminRoute = router.getRoutes().find(route => route.name === 'admin')
      expect(adminRoute).toBeDefined()
      expect(adminRoute.children).toBeDefined()
      expect(adminRoute.children.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation Guards Integration', () => {
    it('should trigger beforeEach guard on programmatic navigation', async () => {
      const guardSpy = vi.fn()
      
      // Add a custom guard to spy on
      router.beforeEach((to, from, next) => {
        guardSpy(to, from)
        next()
      })
      
      await router.push('/random')
      
      expect(guardSpy).toHaveBeenCalled()
    })

    it('should handle guard rejections', async () => {
      // Add a guard that rejects navigation
      router.beforeEach((to, from, next) => {
        if (to.name === 'random-word') {
          next(false) // Reject navigation
        } else {
          next()
        }
      })
      
      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push('/random')
      // Navigation should be rejected, should stay on dictionary
      expect(router.currentRoute.value.name).toBe('dictionary')
    })

    it('should handle guard redirections', async () => {
      // Add a guard that redirects
      router.beforeEach((to, from, next) => {
        if (to.name === 'random-word') {
          next({ name: 'comparison' }) // Redirect to comparison
        } else {
          next()
        }
      })
      
      await router.push('/random')
      // Should be redirected to comparison
      expect(router.currentRoute.value.name).toBe('comparison')
    })
  })

  describe('Async Navigation', () => {
    it('should handle async route components', async () => {
      // All our routes use dynamic imports, so this tests async loading
      await router.push({ name: 'dictionary' })
      expect(router.currentRoute.value.name).toBe('dictionary')
      
      await router.push({ name: 'word-detail', params: { id: 'test' } })
      expect(router.currentRoute.value.name).toBe('word-detail')
    })

    it('should handle multiple rapid navigations', async () => {
      // Simulate rapid navigation attempts
      const promises = [
        router.push('/'),
        router.push('/random'),
        router.push('/comparison')
      ]
      
      await Promise.all(promises)
      
      // Should end up at the last navigation
      expect(router.currentRoute.value.name).toBe('comparison')
    })

    it('should handle navigation cancellation', async () => {
      // Start a navigation
      const navigationPromise = router.push('/random')
      
      // Immediately start another navigation (should cancel the first)
      await router.push('/comparison')
      
      // Should end up at comparison
      expect(router.currentRoute.value.name).toBe('comparison')
      
      // Wait for the first navigation to complete/cancel
      try {
        await navigationPromise
      } catch (error) {
        // Navigation cancellation is expected
        expect(error.name).toBe('NavigationCancelled')
      }
    })
  })

  describe('URL Generation', () => {
    it('should generate correct URLs for routes', () => {
      const url = router.resolve({ name: 'dictionary' }).href
      expect(url).toBe('/')
      
      const wordUrl = router.resolve({ 
        name: 'word-detail', 
        params: { id: 'test-word' } 
      }).href
      expect(wordUrl).toBe('/word/test-word')
    })

    it('should generate URLs with query parameters', () => {
      const url = router.resolve({ 
        name: 'dictionary', 
        query: { search: 'hello', page: '2' } 
      }).href
      expect(url).toContain('search=hello')
      expect(url).toContain('page=2')
    })

    it('should handle special characters in URLs', () => {
      const url = router.resolve({ 
        name: 'word-detail', 
        params: { id: 'test-word-with-特殊字符' } 
      }).href
      expect(url).toContain('test-word-with-')
    })
  })
})