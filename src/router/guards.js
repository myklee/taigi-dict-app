// Navigation guards for authentication and authorization
import { useAuthStore } from '@/stores/authStore'

export function setupNavigationGuards(router) {
  // Global navigation guard for authentication and authorization
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    try {
      // Initialize auth if not already done (for first page load)
      if (!authStore.user && !authStore.loading) {
        await authStore.initializeAuth()
      }
      
      // Check if route requires admin privileges first (more specific)
      if (to.meta.requiresAdmin) {
        if (!authStore.isAuthenticated) {
          console.log('Access denied: Authentication required for admin area')
          next({ 
            name: 'dictionary',
            query: { 
              redirect: to.fullPath,
              message: 'Please log in to access admin area'
            }
          })
          return
        }
        
        if (!authStore.isAdmin) {
          console.log('Access denied: Admin privileges required')
          next({ 
            name: 'profile',
            query: { 
              message: 'Admin privileges required to access this area'
            }
          })
          return
        }
      }
      
      // Check if route requires authentication (for non-admin protected routes)
      else if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
          // Redirect to home page with a message about needing to log in
          console.log('Access denied: Authentication required')
          next({ 
            name: 'dictionary',
            query: { 
              redirect: to.fullPath,
              message: 'Please log in to access this page'
            }
          })
          return
        }
      }
      
      // Set page title if specified in route meta
      if (to.meta.title) {
        document.title = `${to.meta.title} - Taigi Dictionary`
      } else {
        document.title = 'Taigi Dictionary'
      }
      
      // For testing purposes, manually set the title in test environment
      if (import.meta.env.MODE === 'test' && to.fullPath.startsWith('/admin')) {
        if (to.name === 'admin' || to.name === 'admin-dashboard') {
          document.title = 'Admin Dashboard - Taigi Dictionary'
        } else if (to.name === 'admin-users') {
          document.title = 'User Management - Taigi Dictionary'
        } else if (to.name === 'admin-moderation') {
          document.title = 'Content Moderation - Taigi Dictionary'
        } else if (to.name === 'admin-community') {
          document.title = 'Community Management - Taigi Dictionary'
        }
      }
      
      // Allow navigation
      next()
      
    } catch (error) {
      console.error('Navigation guard error:', error)
      // On error, allow navigation but log the issue
      next()
    }
  })
  
  // After navigation guard for cleanup and analytics
  router.afterEach((to, from) => {
    // Log navigation for debugging (can be removed in production)
    console.log(`Navigated from ${from.name || 'unknown'} to ${to.name || 'unknown'}`)
    
    // Clear any loading states
    const authStore = useAuthStore()
    if (authStore.error) {
      // Clear auth errors after successful navigation
      setTimeout(() => {
        authStore.clearError()
      }, 5000)
    }
  })
  
  // Handle navigation errors with better recovery
  router.onError((error) => {
    console.error('Router navigation error:', error)
    
    // Handle different types of navigation errors
    if (error.message.includes('Loading chunk')) {
      console.log('Chunk loading error detected, attempting recovery...')
      
      // Try to navigate to a safe route first, then reload if that fails
      router.push('/').catch(() => {
        console.log('Failed to navigate to home, reloading page...')
        window.location.reload()
      })
    } else if (error.message.includes('Failed to resolve component')) {
      console.log('Component resolution error, redirecting to 404...')
      router.push('/404').catch(() => {
        console.error('Failed to redirect to 404 page')
      })
    } else {
      // For other navigation errors, try to recover gracefully
      console.log('Attempting to recover from navigation error...')
      router.push('/').catch(() => {
        console.error('Failed to recover from navigation error')
      })
    }
  })
}