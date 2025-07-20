// Unit tests for route configuration
import { describe, it, expect } from 'vitest'
import { routes } from '../routes.js'

describe('Route Configuration', () => {
  describe('Route Structure', () => {
    it('should have all required public routes', () => {
      const publicRoutes = routes.filter(route => !route.meta?.requiresAuth)
      const publicRouteNames = publicRoutes.map(route => route.name)
      
      expect(publicRouteNames).toContain('dictionary')
      expect(publicRouteNames).toContain('search')
      expect(publicRouteNames).toContain('word-detail')
      expect(publicRouteNames).toContain('random-word')
      expect(publicRouteNames).toContain('comparison')
    })

    it('should have all required protected routes', () => {
      const protectedRoutes = routes.filter(route => 
        route.meta?.requiresAuth && !route.meta?.requiresAdmin
      )
      const protectedRouteNames = protectedRoutes.map(route => route.name)
      
      expect(protectedRouteNames).toContain('profile')
      expect(protectedRouteNames).toContain('favorites')
      expect(protectedRouteNames).toContain('search-history')
      expect(protectedRouteNames).toContain('edit-word')
      expect(protectedRouteNames).toContain('edit-word-mknoll')
    })

    it('should have all required admin routes', () => {
      const adminRoutes = routes.filter(route => route.meta?.requiresAdmin)
      const adminRouteNames = adminRoutes.map(route => route.name)
      
      expect(adminRouteNames).toContain('admin')
    })

    it('should have error handling routes', () => {
      const errorRoutes = routes.filter(route => 
        route.name === 'not-found' || route.path === '/:pathMatch(.*)*'
      )
      
      expect(errorRoutes).toHaveLength(2)
    })
  })

  describe('Route Meta Configuration', () => {
    it('should have correct meta for public routes', () => {
      const dictionaryRoute = routes.find(route => route.name === 'dictionary')
      expect(dictionaryRoute.meta?.requiresAuth).toBeFalsy()
      expect(dictionaryRoute.meta?.requiresAdmin).toBeFalsy()
      expect(dictionaryRoute.meta?.title).toBe('Taigi Dictionary')
    })

    it('should have correct meta for protected routes', () => {
      const profileRoute = routes.find(route => route.name === 'profile')
      expect(profileRoute.meta?.requiresAuth).toBe(true)
      expect(profileRoute.meta?.requiresAdmin).toBeFalsy()
      expect(profileRoute.meta?.title).toBe('User Profile')
    })

    it('should have correct meta for admin routes', () => {
      const adminRoute = routes.find(route => route.name === 'admin')
      expect(adminRoute.meta?.requiresAuth).toBe(true)
      expect(adminRoute.meta?.requiresAdmin).toBe(true)
      expect(adminRoute.meta?.title).toBe('Admin Dashboard')
    })

    it('should have titles for all named routes', () => {
      const namedRoutes = routes.filter(route => 
        route.name && !route.path.includes('pathMatch')
      )
      
      namedRoutes.forEach(route => {
        expect(route.meta?.title).toBeDefined()
        expect(typeof route.meta.title).toBe('string')
        expect(route.meta.title.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Route Parameters', () => {
    it('should have correct parameter configuration for search route', () => {
      const searchRoute = routes.find(route => route.name === 'search')
      expect(searchRoute.path).toBe('/search/:query?')
      expect(searchRoute.props).toBe(true)
    })

    it('should have correct parameter configuration for word detail route', () => {
      const wordDetailRoute = routes.find(route => route.name === 'word-detail')
      expect(wordDetailRoute.path).toBe('/word/:id')
      expect(wordDetailRoute.props).toBe(true)
    })

    it('should have correct parameter configuration for edit routes', () => {
      const editWordRoute = routes.find(route => route.name === 'edit-word')
      expect(editWordRoute.path).toBe('/edit-word/:id?')
      expect(editWordRoute.props).toBe(true)
      
      const editWordMknollRoute = routes.find(route => route.name === 'edit-word-mknoll')
      expect(editWordMknollRoute.path).toBe('/edit-word-mknoll/:id?')
      expect(editWordMknollRoute.props).toBe(true)
    })
  })

  describe('Nested Routes', () => {
    it('should have correct admin nested route structure', () => {
      const adminRoute = routes.find(route => route.name === 'admin')
      expect(adminRoute.children).toBeDefined()
      expect(Array.isArray(adminRoute.children)).toBe(true)
      expect(adminRoute.children.length).toBeGreaterThan(0)
    })

    it('should have all required admin child routes', () => {
      const adminRoute = routes.find(route => route.name === 'admin')
      const childRouteNames = adminRoute.children.map(child => child.name)
      
      expect(childRouteNames).toContain('admin-dashboard')
      expect(childRouteNames).toContain('admin-users')
      expect(childRouteNames).toContain('admin-moderation')
      expect(childRouteNames).toContain('admin-community')
    })

    it('should have correct meta for admin child routes', () => {
      const adminRoute = routes.find(route => route.name === 'admin')
      
      adminRoute.children.forEach(child => {
        expect(child.meta?.requiresAuth).toBe(true)
        expect(child.meta?.requiresAdmin).toBe(true)
        expect(child.meta?.title).toBeDefined()
        expect(typeof child.meta.title).toBe('string')
      })
    })
  })

  describe('Component Loading', () => {
    it('should use dynamic imports for lazy loading', () => {
      const routesWithComponents = routes.filter(route => route.component)
      
      routesWithComponents.forEach(route => {
        // Check if component is a function (dynamic import)
        expect(typeof route.component).toBe('function')
      })
    })

    it('should have valid component paths', () => {
      // This test ensures that the import paths are correctly formatted
      const routesWithComponents = routes.filter(route => route.component)
      
      routesWithComponents.forEach(route => {
        const componentString = route.component.toString()
        // Should contain dynamic import (either import() or __vite_ssr_dynamic_import__)
        expect(componentString).toMatch(/(import\s*\(|__vite_ssr_dynamic_import__)/)
        // Should have path to views or components
        expect(componentString).toMatch(/(\/src\/views|\/src\/components|@\/views|@\/components)/)
      })
    })
  })

  describe('Route Validation', () => {
    it('should have unique route names', () => {
      const routeNames = routes
        .filter(route => route.name)
        .map(route => route.name)
      
      const uniqueNames = [...new Set(routeNames)]
      expect(routeNames.length).toBe(uniqueNames.length)
    })

    it('should have unique route paths', () => {
      const routePaths = routes
        .filter(route => !route.path.includes('pathMatch'))
        .map(route => route.path)
      
      const uniquePaths = [...new Set(routePaths)]
      expect(routePaths.length).toBe(uniquePaths.length)
    })

    it('should have valid path formats', () => {
      routes.forEach(route => {
        // All paths should start with /
        expect(route.path).toMatch(/^\//)
        
        // Should not have trailing slashes (except root)
        if (route.path !== '/') {
          expect(route.path).not.toMatch(/\/$/)
        }
      })
    })

    it('should have consistent meta structure', () => {
      const routesWithMeta = routes.filter(route => route.meta)
      
      routesWithMeta.forEach(route => {
        const meta = route.meta
        
        // If requiresAdmin is true, requiresAuth should also be true
        if (meta.requiresAdmin) {
          expect(meta.requiresAuth).toBe(true)
        }
        
        // Title should be a non-empty string if present
        if (meta.title) {
          expect(typeof meta.title).toBe('string')
          expect(meta.title.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Error Routes', () => {
    it('should have proper 404 route configuration', () => {
      const notFoundRoute = routes.find(route => route.name === 'not-found')
      expect(notFoundRoute).toBeDefined()
      expect(notFoundRoute.path).toBe('/404')
      expect(notFoundRoute.meta?.title).toBe('Page Not Found')
    })

    it('should have catch-all route for unmatched paths', () => {
      const catchAllRoute = routes.find(route => 
        route.path === '/:pathMatch(.*)*'
      )
      expect(catchAllRoute).toBeDefined()
      expect(catchAllRoute.redirect).toBe('/404')
    })
  })
})