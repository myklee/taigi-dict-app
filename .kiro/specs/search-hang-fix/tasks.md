# Implementation Plan

- [x] 1. Create timeout utility function

  - Create `withSearchTimeout` utility function that wraps promises with timeout
  - Add timeout error detection helper
  - Write unit tests for timeout utility
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Add search cancellation infrastructure

  - Add AbortController management to DictionarySearch.vue
  - Implement `cancelCurrentSearch` function
  - Update search state management to track active searches
  - _Requirements: 2.1, 2.2_

- [x] 3. Update individual search functions with timeout and cancellation

  - Modify `searchMoeResults` to accept and use AbortSignal
  - Modify `searchMknollResults` to accept and use AbortSignal
  - Modify `searchCedictResults` to accept and use AbortSignal
  - Modify `searchCrossRefResults` to accept and use AbortSignal
  - Wrap each search function call with timeout utility
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 4. Update main search orchestration

  - Modify `searchWords` function to cancel previous searches before starting new ones
  - Add timeout error handling with user-friendly messages
  - Ensure loading states are properly reset on timeout/cancellation
  - _Requirements: 1.2, 1.3, 2.2, 3.1, 3.2, 3.3_

- [x] 5. Add error handling and user feedback

  - Add timeout error message display
  - Ensure search interface remains responsive during searches
  - Test that cancelled searches don't display results
  - _Requirements: 1.3, 2.3, 3.1, 3.2, 3.3_

- [x] 6. Write integration tests
  - Test search timeout behavior with mock delays
  - Test search cancellation when starting new searches
  - Test error message display for timeouts
  - Verify loading states work correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
