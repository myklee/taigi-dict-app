# Vue Router Implementation Design

## Overview

This design outlines the implementation of Vue Router 4 to replace the current manual routing system in the Taigi dictionary application. The solution will provide proper URL management, route parameters, navigation guards, and seamless integration with the existing Vue 3 + Pinia architecture while maintaining compatibility with Capacitor for mobile deployment.

## Architecture

### Router Configuration Structure

The router will be configured using Vue Router 4's composition API approach with the following structure:

```
src/
├── router/
│   ├── index.js          # Main router configuration
│   ├── guards.js         # Navigation guards
│   └── routes.js         # Route definitions
├── views/                # Renamed from pages/ for clarity
│   ├── DictionaryView.vue
│   ├── ProfileView.vue
│   ├── AdminView.vue
│   └── ...
└── components/           # Existing components remain
```

### History Mode Selection

- **Web Build**: `createWebHistory()` for clean URLs
- **Mobile Build**: `createWebHashHistory()` for Capacitor compatibility
- Environment-based selection using Vite environment variables

### Route Structure Design

```javascript
const routes = [
  // Public routes
  { path: '/', name: 'dictionary', component: DictionaryView },
  { path: '/search/:query?', name: 'search', component: DictionaryView, props: true },
  { path: '/word/:id', name: 'word-detail', component: WordDetailView, props: true },
  { path: '/random', name: 'random-word', component: RandomWordView },
  
  // Protected routes (require authentication)
  { 
    path: '/profile', 
    name: 'profile', 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/favorites', 
    name: 'favorites', 
    component: FavoritesView,
    meta: { requiresAuth: true }
  },
  
  // Admin routes (require admin role)
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboard },
      { path: 'users', name: 'admin-users', component: UserManagementPanel },
      { path: 'moderation', name: 'admin-moderation', component: CommunityModerationPanel }
    ]
  }
]
```

## Components and Interfaces

### Router Instance Creation

```javascript
// src/router/index.js
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { routes } from './routes.js'
import { setupNavigationGuards } from './guards.js'

const router = createRouter({
  history: import.meta.env.VITE_PLATFORM === 'mobile' 
    ? createWebHashHistory() 
    : createWebHistory(),
  routes
})

setupNavigationGuards(router)
export default router
```

### Navigation Guards Implementation

```javascript
// src/router/guards.js
import { useAuthStore } from '@/stores/authStore'

export function setupNavigationGuards(router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    
    // Initialize auth if not already done
    if (!authStore.initialized) {
      await authStore.initializeAuth()
    }
    
    // Check authentication requirements
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'dictionary' })
      return
    }
    
    // Check admin requirements
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next({ name: 'profile' })
      return
    }
    
    next()
  })
}
```

### App.vue Refactoring

The main App.vue will be simplified to use `<router-view>` instead of manual component switching:

```vue
<template>
  <header>
    <AuthHeader />
  </header>
  <main>
    <router-view />
  </main>
  <footer>
    <!-- Footer content -->
  </footer>
</template>
```

### Navigation Component Updates

Components like `AuthHeader.vue` will be updated to use `router-link` and programmatic navigation:

```vue
<template>
  <nav>
    <router-link to="/" class="nav-link">Dictionary</router-link>
    <router-link to="/profile" v-if="authStore.isAuthenticated" class="nav-link">Profile</router-link>
    <router-link to="/admin" v-if="authStore.isAdmin" class="nav-link">Admin</router-link>
  </nav>
</template>
```

## Data Models

### Route Parameter Types

```typescript
// src/types/router.ts
export interface WordRouteParams {
  id: string
}

export interface SearchRouteParams {
  query?: string
}

export interface RouteMetaAuth {
  requiresAuth?: boolean
  requiresAdmin?: boolean
}
```

### Navigation State Management

The router will integrate with existing Pinia stores for state management:

```javascript
// Integration with existing stores
const router = useRouter()
const authStore = useAuthStore()
const communityStore = useCommunityStore()

// Navigation with state updates
const navigateToWord = (wordId) => {
  router.push({ name: 'word-detail', params: { id: wordId } })
}
```

## Error Handling

### Route Error Handling

```javascript
// 404 and error routes
const routes = [
  // ... other routes
  { 
    path: '/:pathMatch(.*)*', 
    name: 'not-found', 
    component: NotFoundView 
  }
]

// Navigation error handling
router.onError((error) => {
  console.error('Router error:', error)
  // Handle navigation errors gracefully
})
```

### Fallback Mechanisms

- Graceful degradation for failed route navigation
- Fallback to home page for invalid routes
- Error boundaries for route component failures

## Testing Strategy

### Unit Testing

- Test route configuration and parameter parsing
- Test navigation guards with different authentication states
- Test programmatic navigation functions
- Mock router for component testing

### Integration Testing

- Test complete navigation flows
- Test authentication-protected routes
- Test admin route access control
- Test mobile/web build differences

### End-to-End Testing

- Test browser back/forward functionality
- Test direct URL access and bookmarking
- Test deep linking on mobile devices
- Test route transitions and loading states

### Testing Tools

- Vue Test Utils with Vue Router testing utilities
- Vitest for unit and integration tests
- Cypress or Playwright for E2E testing
- Mock authentication states for testing protected routes

## Migration Strategy

### Phase 1: Router Setup
- Install Vue Router 4
- Create basic router configuration
- Update main.js to use router

### Phase 2: Route Migration
- Convert existing manual routes to Vue Router routes
- Update App.vue to use router-view
- Maintain backward compatibility during transition

### Phase 3: Navigation Updates
- Update all navigation components to use router-link
- Replace manual navigation functions with router methods
- Add route parameters for search and word details

### Phase 4: Guards and Protection
- Implement authentication guards
- Add admin route protection
- Test all protected route scenarios

### Phase 5: Optimization
- Add route-based code splitting
- Implement proper loading states
- Optimize for mobile performance

## Performance Considerations

- Lazy loading of route components using dynamic imports
- Route-based code splitting for better bundle optimization
- Proper cleanup of route watchers and subscriptions
- Minimal impact on existing application performance

## Mobile Compatibility

- Hash-based routing for Capacitor builds
- Deep linking support for mobile apps
- Proper handling of mobile-specific navigation patterns
- Testing on both iOS and Android platforms