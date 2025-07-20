# Router Test Suite

This directory contains comprehensive tests for the Vue Router implementation in the Taigi dictionary application.

## Test Coverage

### 11.1 Unit Tests for Router Configuration

#### Route Definitions and Parameter Parsing
- **routes.test.js**: Tests route structure, meta configuration, parameters, nested routes, component loading, and validation
- **programmaticNavigation.test.js**: Tests router.push(), router.replace(), router.go(), route resolution, and URL generation

#### Navigation Guard Logic with Mocked Auth States
- **guards.test.js**: Tests authentication guards for public, protected, and admin routes
- **adminGuards.test.js**: Tests admin-specific authorization logic and role verification
- **platformConfig.test.js**: Tests platform-specific configuration and error handling

#### Programmatic Navigation Functions
- **programmaticNavigation.test.js**: Tests all programmatic navigation methods including:
  - Navigation by name and path
  - Route parameters and query handling
  - Error handling and recovery
  - Async navigation and cancellation
  - URL generation and special characters

### 11.2 Integration Tests for Navigation Flows

#### Complete User Navigation Scenarios
- **navigationFlows.test.js**: Tests complete user journeys including:
  - Anonymous user browsing flow
  - Authenticated user flow
  - Admin user flow
  - Authentication state changes during navigation

#### Authentication-Protected Route Access
- **navigationFlows.test.js**: Tests protection of all user routes and proper redirection
- **guards.test.js**: Tests redirect preservation for post-login navigation

#### Admin Route Access Control
- **adminGuards.test.js**: Tests admin route protection from unauthenticated and non-admin users
- **navigationFlows.test.js**: Tests admin access control in complete flows

#### Browser Back/Forward Functionality
- **navigationFlows.test.js**: Tests navigation history maintenance and auth state changes
- **errorHandling.test.js**: Tests history navigation with error scenarios

## Test Files Overview

1. **routes.test.js** (22 tests)
   - Route structure validation
   - Meta configuration testing
   - Parameter and nested route testing
   - Component loading verification

2. **guards.test.js** (18 tests)
   - Authentication guard testing
   - Protected route access control
   - Page title management
   - Error handling in guards

3. **adminGuards.test.js** (19 tests)
   - Admin role verification
   - Nested admin route protection
   - Admin authentication edge cases
   - Redirection logic testing

4. **errorHandling.test.js** (18 tests)
   - 404 route handling
   - Catch-all route testing
   - Route resolution errors
   - Navigation error recovery

5. **platformConfig.test.js** (8 tests)
   - Environment variable handling
   - Router history creation
   - Platform utility functions
   - Error scenario handling

6. **programmaticNavigation.test.js** (29 tests)
   - Router.push() navigation
   - Router.replace() navigation
   - Router.go() navigation
   - Route resolution and matching
   - Navigation guard integration
   - Async navigation handling
   - URL generation

7. **navigationFlows.test.js** (19 tests)
   - Complete user navigation scenarios
   - Authentication-protected route access
   - Admin route access control
   - Browser back/forward functionality
   - Error recovery and edge cases
   - Route parameter and query handling

## Requirements Verification

### Requirement 4.3 (Unit Tests)
✅ **Route definitions and parameter parsing**: Comprehensive tests in routes.test.js and programmaticNavigation.test.js
✅ **Navigation guard logic with mocked auth states**: Extensive testing in guards.test.js and adminGuards.test.js
✅ **Programmatic navigation functions**: Complete coverage in programmaticNavigation.test.js

### Requirements 1.3, 3.1, 3.2, 3.3 (Integration Tests)
✅ **Complete user navigation scenarios**: Full user journey testing in navigationFlows.test.js
✅ **Authentication-protected route access**: Comprehensive protection testing across multiple files
✅ **Admin route access control**: Thorough admin authorization testing
✅ **Browser back/forward functionality**: History navigation testing with various scenarios

## Test Statistics
- **Total Test Files**: 7
- **Total Tests**: 133
- **All Tests Passing**: ✅

## Running Tests

```bash
# Run all router tests
npm run test:run -- src/router/__tests__/

# Run specific test file
npm run test:run -- src/router/__tests__/routes.test.js

# Run tests with coverage
npm run test -- --coverage src/router/__tests__/
```

## Test Environment
- **Testing Framework**: Vitest
- **Vue Testing**: @vue/test-utils
- **DOM Environment**: happy-dom
- **State Management**: Pinia (mocked in tests)
- **Router**: Vue Router 4 with memory history for testing