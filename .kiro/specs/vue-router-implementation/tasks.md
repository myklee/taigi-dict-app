# Implementation Plan

- [x] 1. Install and configure Vue Router 4
  - Install vue-router@4 package via npm
  - Create basic router directory structure in src/router/
  - Set up environment-based history mode configuration for web/mobile builds
  - _Requirements: 1.1, 6.2, 6.3_

- [x] 2. Create core router configuration files
  - [x] 2.1 Create main router configuration file
    - Write src/router/index.js with router instance creation
    - Implement environment-based history mode selection (web vs mobile)
    - Export configured router instance
    - _Requirements: 1.1, 6.2_

  - [x] 2.2 Create route definitions file
    - Write src/router/routes.js with all application routes
    - Define public routes (dictionary, search, word detail, random)
    - Define protected routes (profile, favorites) with auth meta
    - Define admin routes with nested structure and admin meta
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 2.3 Create navigation guards file
    - Write src/router/guards.js with authentication and authorization logic
    - Implement beforeEach guard for auth checking
    - Add admin role verification for admin routes
    - Handle redirect logic for unauthorized access
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Update main application entry point
  - Modify src/main.js to import and use the router
  - Register router with Vue app instance
  - Ensure router is available before app mount
  - _Requirements: 1.1, 4.2_

- [x] 4. Refactor App.vue to use router-view
  - Remove manual routing logic (currentRoute ref, navigate function, popstate handler)
  - Replace dynamic component with router-view
  - Remove manual route initialization code
  - Clean up unused imports and computed properties
  - _Requirements: 4.1, 5.1, 7.1_

- [x] 5. Rename and update page components
  - [x] 5.1 Rename pages directory to views
    - Move src/pages/ to src/views/ for Vue Router convention
    - Update all import statements that reference pages directory
    - _Requirements: 4.1_

  - [x] 5.2 Update view components for router integration
    - Remove navigate prop dependencies from all view components
    - Update components to use useRouter() and useRoute() composables
    - Ensure all view components work with router navigation
    - _Requirements: 5.1, 7.2_

- [x] 6. Update navigation components
  - [x] 6.1 Update AuthHeader component
    - Replace manual navigation with router-link components
    - Add active link styling using router-link-active class
    - Remove navigate prop dependency
    - Use programmatic navigation where needed
    - _Requirements: 5.2, 7.2_

  - [x] 6.2 Update other components with navigation
    - Find and update all components that use the navigate prop
    - Replace with router.push() or router-link as appropriate
    - Test all navigation functionality
    - _Requirements: 5.1, 7.2_

- [x] 7. Implement route parameters and query handling
  - [x] 7.1 Add search query parameter handling
    - Update DictionarySearch component to read/write search query from route
    - Implement route watching for search parameter changes
    - Maintain search state in URL for bookmarking
    - _Requirements: 2.1, 2.4_

  - [x] 7.2 Add word detail route parameters
    - Create or update WordDetail component to accept word ID parameter
    - Implement route parameter validation and error handling
    - Add navigation to word detail from search results
    - _Requirements: 2.2, 2.3_

- [x] 8. Implement authentication route guards
  - [x] 8.1 Test and refine authentication guards
    - Write unit tests for navigation guard logic
    - Test unauthenticated access to protected routes
    - Verify proper redirection behavior
    - _Requirements: 3.1, 3.2_

  - [x] 8.2 Test and refine admin route guards
    - Write unit tests for admin authorization logic
    - Test non-admin access to admin routes
    - Verify admin nested route protection
    - _Requirements: 3.3_

- [x] 9. Add error handling and 404 routes
  - Create NotFound component for invalid routes
  - Add catch-all route for 404 handling
  - Implement router error handling for navigation failures
  - Test invalid route scenarios
  - _Requirements: 1.4, 5.4_

- [x] 10. Update build configuration for mobile compatibility
  - Update Vite configuration to handle different history modes
  - Set up environment variables for platform detection
  - Test router functionality in Capacitor builds
  - Verify deep linking works on mobile platforms
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 11. Write comprehensive tests for router functionality
  - [x] 11.1 Write unit tests for router configuration
    - Test route definitions and parameter parsing
    - Test navigation guard logic with mocked auth states
    - Test programmatic navigation functions
    - _Requirements: 4.3_

  - [x] 11.2 Write integration tests for navigation flows
    - Test complete user navigation scenarios
    - Test authentication-protected route access
    - Test admin route access control
    - Test browser back/forward functionality
    - _Requirements: 1.3, 3.1, 3.2, 3.3_

- [x] 12. Performance optimization and cleanup
  - Implement lazy loading for route components using dynamic imports
  - Remove any unused manual routing code
  - Optimize bundle size with route-based code splitting
  - Test performance impact of router implementation
  - _Requirements: 4.1, 5.1_