import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '../routes.js'

describe('Router Performance', () => {
  let router

  beforeEach(() => {
    router = createRouter({
      history: createWebHashHistory(),
      routes
    })
  })

  it('should have lazy-loaded components for all routes', () => {
    routes.forEach(route => {
      if (route.component && typeof route.component === 'function') {
        const componentString = route.component.toString()
        // Check for either import() or Vite's SSR dynamic import
        expect(
          componentString.includes('import(') || 
          componentString.includes('__vite_ssr_dynamic_import__')
        ).toBe(true)
      }
      
      // Check nested routes
      if (route.children) {
        route.children.forEach(childRoute => {
          if (childRoute.component && typeof childRoute.component === 'function') {
            const componentString = childRoute.component.toString()
            expect(
              componentString.includes('import(') || 
              componentString.includes('__vite_ssr_dynamic_import__')
            ).toBe(true)
          }
        })
      }
    })
  })

  it('should have proper chunk names for code splitting', () => {
    const routesWithComponents = routes.filter(route => route.component)
    
    routesWithComponents.forEach(route => {
      if (typeof route.component === 'function') {
        const componentString = route.component.toString()
        // Check that webpackChunkName is specified
        expect(componentString).toMatch(/webpackChunkName:\s*["'][^"']+["']/)
      }
    })
  })

  it('should resolve routes quickly', async () => {
    const start = performance.now()
    
    const resolved = router.resolve('/')
    expect(resolved.name).toBe('dictionary')
    
    const end = performance.now()
    const duration = end - start
    
    // Route resolution should be very fast (under 10ms)
    expect(duration).toBeLessThan(10)
  })

  it('should handle multiple route resolutions efficiently', async () => {
    const routes = ['/', '/search/test', '/word/123', '/profile', '/admin']
    const start = performance.now()
    
    routes.forEach(path => {
      router.resolve(path)
    })
    
    const end = performance.now()
    const duration = end - start
    
    // Multiple route resolutions should be fast (under 50ms)
    expect(duration).toBeLessThan(50)
  })

  it('should have appropriate route grouping for bundle optimization', () => {
    const adminRoutes = routes.find(route => route.path === '/admin')
    expect(adminRoutes).toBeDefined()
    expect(adminRoutes.children).toBeDefined()
    expect(adminRoutes.children.length).toBeGreaterThan(0)
    
    // Admin routes should be grouped together
    adminRoutes.children.forEach(child => {
      if (child.component && typeof child.component === 'function') {
        const componentString = child.component.toString()
        expect(componentString).toMatch(/webpackChunkName:\s*["']admin-[^"']+["']/)
      }
    })
  })

  it('should have error handling routes', () => {
    const notFoundRoute = routes.find(route => route.name === 'not-found')
    expect(notFoundRoute).toBeDefined()
    
    const catchAllRoute = routes.find(route => route.name === 'catch-all')
    expect(catchAllRoute).toBeDefined()
    expect(catchAllRoute.redirect).toBe('/404')
  })

  it('should have proper meta information for all routes', () => {
    routes.forEach(route => {
      if (route.name !== 'catch-all') {
        expect(route.meta).toBeDefined()
        expect(route.meta.title).toBeDefined()
        expect(typeof route.meta.title).toBe('string')
      }
      
      // Check nested routes
      if (route.children) {
        route.children.forEach(childRoute => {
          expect(childRoute.meta).toBeDefined()
          expect(childRoute.meta.title).toBeDefined()
          expect(typeof childRoute.meta.title).toBe('string')
        })
      }
    })
  })

  it('should have consistent route naming conventions', () => {
    routes.forEach(route => {
      if (route.name && route.name !== 'catch-all') {
        // Route names should be kebab-case
        expect(route.name).toMatch(/^[a-z]+(-[a-z]+)*$/)
      }
      
      // Check nested routes
      if (route.children) {
        route.children.forEach(childRoute => {
          if (childRoute.name) {
            expect(childRoute.name).toMatch(/^[a-z]+(-[a-z]+)*$/)
          }
        })
      }
    })
  })
})