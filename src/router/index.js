import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { routes } from './routes.js'
import { setupNavigationGuards } from './guards.js'
import { initializePerformanceMonitoring } from '@/utils/performance.js'

// Environment-based history mode selection
// Web builds use createWebHistory for clean URLs
// Mobile builds use createWebHashHistory for Capacitor compatibility
const createRouterHistory = () => {
  const platform = import.meta.env.VITE_PLATFORM
  const routerMode = import.meta.env.VITE_ROUTER_MODE
  const isCapacitor = import.meta.env.VITE_IS_CAPACITOR === 'true'
  
  // For mobile/Capacitor builds, always use hash history
  if (platform === 'mobile' || isCapacitor || routerMode === 'hash') {
    return createWebHashHistory()
  }
  
  // For web builds, use history mode with base path if configured
  const base = import.meta.env.BASE_URL || '/'
  return createWebHistory(base)
}

const history = createRouterHistory()

const router = createRouter({
  history,
  routes,
  // Scroll behavior for better UX
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Set up navigation guards for authentication and authorization
setupNavigationGuards(router)

// Initialize performance monitoring
initializePerformanceMonitoring(router)

// Preload critical routes for better performance
const preloadCriticalRoutes = () => {
  // Preload dictionary search (most common route)
  import(/* webpackChunkName: "dictionary" */ '@/views/DictionarySearch.vue')
  
  // Preload word detail (second most common)
  import(/* webpackChunkName: "word-detail" */ '@/views/WordDetail.vue')
}

// Preload on idle or after initial load
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadCriticalRoutes)
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(preloadCriticalRoutes, 2000)
  }
}

// Enhanced error handling for navigation failures
router.onError((error) => {
  console.error('Router navigation error:', error)
  
  // Handle different types of navigation errors
  if (error.name === 'NavigationDuplicated') {
    // Ignore duplicate navigation errors (user clicked same link twice)
    return
  }
  
  if (error.name === 'NavigationAborted') {
    // Navigation was aborted by a navigation guard
    console.warn('Navigation aborted:', error.message)
    return
  }
  
  if (error.name === 'NavigationCancelled') {
    // Navigation was cancelled by a newer navigation
    console.warn('Navigation cancelled:', error.message)
    return
  }
  
  // For other errors, redirect to 404 page
  if (router.currentRoute.value.name !== 'not-found') {
    router.push('/404').catch(() => {
      // If even the 404 redirect fails, log the error
      console.error('Failed to redirect to 404 page:', error)
    })
  }
})

// Handle router resolve errors (invalid routes)
const originalResolve = router.resolve
router.resolve = function(to, currentLocation) {
  try {
    return originalResolve.call(this, to, currentLocation)
  } catch (error) {
    console.error('Route resolution error:', error)
    // Return a resolved route to the 404 page
    return originalResolve.call(this, '/404', currentLocation)
  }
}

export default router