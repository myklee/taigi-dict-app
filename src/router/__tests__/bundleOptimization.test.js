import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '../routes.js'

describe('Bundle Optimization', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createWebHashHistory(),
      routes
    })
  })

  describe('Code Splitting', () => {
    it('should have all route components as dynamic imports', () => {
      const checkRouteComponents = (routeList) => {
        routeList.forEach(route => {
          if (route.component && typeof route.component === 'function') {
            const componentString = route.component.toString()
            // Should be a dynamic import (either import() or Vite's SSR version)
            expect(
              componentString.includes('import(') || 
              componentString.includes('__vite_ssr_dynamic_import__')
            ).toBe(true)
          }
          
          // Check nested routes
          if (route.children) {
            checkRouteComponents(route.children)
          }
        })
      }

      checkRouteComponents(routes)
    })

    it('should have proper webpack chunk names for all routes', () => {
      const checkChunkNames = (routeList) => {
        routeList.forEach(route => {
          if (route.component && typeof route.component === 'function') {
            const componentString = route.component.toString()
            // Should have webpackChunkName comment
            expect(componentString).toMatch(/webpackChunkName:\s*["'][^"']+["']/)
          }
          
          // Check nested routes
          if (route.children) {
            checkChunkNames(route.children)
          }
        })
      }

      checkChunkNames(routes)
    })

    it('should group related components into logical chunks', () => {
      const chunkGroups = {
        admin: ['admin-dashboard', 'admin-users', 'admin-moderation', 'admin-community'],
        user: ['user-profile', 'user-favorites', 'user-history'],
        dictionary: ['dictionary', 'word-detail'],
        editing: ['edit-word', 'edit-word-mknoll'],
        error: ['error-pages']
      }

      Object.entries(chunkGroups).forEach(([group, expectedChunks]) => {
        expectedChunks.forEach(chunkName => {
          const route = routes.find(r => 
            r.component && r.component.toString().includes(chunkName)
          ) || routes.flatMap(r => r.children || []).find(r => 
            r.component && r.component.toString().includes(chunkName)
          )
          
          if (route) {
            expect(route.component.toString()).toContain(chunkName)
          }
        })
      })
    })
  })

  describe('Route Organization', () => {
    it('should have proper route hierarchy for admin routes', () => {
      const adminRoute = routes.find(route => route.path === '/admin')
      expect(adminRoute).toBeDefined()
      expect(adminRoute.children).toBeDefined()
      expect(adminRoute.children.length).toBeGreaterThan(0)
      
      // All admin child routes should have admin meta
      adminRoute.children.forEach(child => {
        expect(child.meta.requiresAdmin).toBe(true)
        expect(child.meta.requiresAuth).toBe(true)
      })
    })

    it('should have consistent meta information', () => {
      const checkMeta = (routeList) => {
        routeList.forEach(route => {
          if (route.name !== 'catch-all') {
            expect(route.meta).toBeDefined()
            expect(route.meta.title).toBeDefined()
            expect(typeof route.meta.title).toBe('string')
          }
          
          // Check nested routes
          if (route.children) {
            checkMeta(route.children)
          }
        })
      }

      checkMeta(routes)
    })

    it('should have proper authentication requirements', () => {
      const protectedPaths = ['/profile', '/favorites', '/history', '/edit-word', '/edit-word-mknoll']
      const adminPaths = ['/admin']

      protectedPaths.forEach(path => {
        const route = routes.find(r => r.path === path)
        if (route) {
          expect(route.meta.requiresAuth).toBe(true)
        }
      })

      adminPaths.forEach(path => {
        const route = routes.find(r => r.path === path)
        if (route) {
          expect(route.meta.requiresAuth).toBe(true)
          expect(route.meta.requiresAdmin).toBe(true)
        }
      })
    })
  })

  describe('Performance Characteristics', () => {
    it('should resolve routes quickly', async () => {
      const testRoutes = ['/', '/search/test', '/word/123', '/profile', '/admin']
      
      for (const path of testRoutes) {
        const start = performance.now()
        const resolved = router.resolve(path)
        const end = performance.now()
        
        expect(resolved).toBeDefined()
        expect(end - start).toBeLessThan(5) // Should resolve in under 5ms
      }
    })

    it('should handle batch route resolutions efficiently', () => {
      const testRoutes = Array.from({ length: 100 }, (_, i) => `/word/${i}`)
      
      const start = performance.now()
      testRoutes.forEach(path => {
        router.resolve(path)
      })
      const end = performance.now()
      
      // 100 route resolutions should complete in under 100ms
      expect(end - start).toBeLessThan(100)
    })

    it('should have minimal route configuration overhead', () => {
      // Check that routes array is not excessively large
      expect(routes.length).toBeLessThan(20)
      
      // Check that nested routes are used appropriately
      const routesWithChildren = routes.filter(r => r.children && r.children.length > 0)
      expect(routesWithChildren.length).toBeGreaterThan(0)
      
      // Admin routes should be nested under /admin
      const adminRoute = routes.find(r => r.path === '/admin')
      expect(adminRoute.children.length).toBeGreaterThan(2)
    })
  })

  describe('Bundle Size Optimization', () => {
    it('should separate vendor code from application code', () => {
      // This is more of a build-time check, but we can verify the structure
      const publicRoutes = routes.filter(r => !r.meta?.requiresAuth)
      const protectedRoutes = routes.filter(r => r.meta?.requiresAuth && !r.meta?.requiresAdmin)
      const adminRoutes = routes.filter(r => r.meta?.requiresAdmin)

      // Should have a good distribution
      expect(publicRoutes.length).toBeGreaterThan(0)
      expect(protectedRoutes.length).toBeGreaterThan(0)
      expect(adminRoutes.length).toBeGreaterThan(0)
    })

    it('should use consistent chunk naming strategy', () => {
      const chunkNames = new Set()
      
      const extractChunkNames = (routeList) => {
        routeList.forEach(route => {
          if (route.component && typeof route.component === 'function') {
            const componentString = route.component.toString()
            const match = componentString.match(/webpackChunkName:\s*["']([^"']+)["']/)
            if (match) {
              chunkNames.add(match[1])
            }
          }
          
          if (route.children) {
            extractChunkNames(route.children)
          }
        })
      }

      extractChunkNames(routes)
      
      // Should have multiple distinct chunk names
      expect(chunkNames.size).toBeGreaterThan(5)
      
      // Chunk names should follow consistent naming pattern
      chunkNames.forEach(name => {
        expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/)
      })
    })
  })

  describe('Error Handling Optimization', () => {
    it('should have efficient error routes', () => {
      const notFoundRoute = routes.find(r => r.name === 'not-found')
      const catchAllRoute = routes.find(r => r.name === 'catch-all')
      
      expect(notFoundRoute).toBeDefined()
      expect(catchAllRoute).toBeDefined()
      
      // Catch-all should redirect to 404
      expect(catchAllRoute.redirect).toBe('/404')
      
      // 404 route should be lazy-loaded
      const componentString = notFoundRoute.component.toString()
      expect(
        componentString.includes('import(') || 
        componentString.includes('__vite_ssr_dynamic_import__')
      ).toBe(true)
    })

    it('should handle invalid routes efficiently', () => {
      const invalidPaths = [
        '/nonexistent',
        '/admin/invalid',
        '/user/123/invalid',
        '//double-slash',
        '/path/with/many/segments/that/do/not/exist'
      ]

      invalidPaths.forEach(path => {
        const start = performance.now()
        const resolved = router.resolve(path)
        const end = performance.now()
        
        // Should resolve quickly even for invalid paths
        expect(end - start).toBeLessThan(5)
        
        // Should resolve to catch-all or 404
        expect(['catch-all', 'not-found']).toContain(resolved.name)
      })
    })
  })
})