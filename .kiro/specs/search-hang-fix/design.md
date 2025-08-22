# Design Document

## Overview

The search hang fix implements a lightweight timeout and cancellation system directly within the existing DictionarySearch.vue component. This approach minimizes code changes while providing immediate relief from hanging search issues.

## Architecture

The solution uses JavaScript's built-in `AbortController` and `Promise.race()` to implement timeout and cancellation without requiring new classes or major refactoring.

### Core Components

1. **Search Timeout Wrapper** - Wraps each search operation with a timeout
2. **Search Cancellation** - Uses AbortController to cancel ongoing searches
3. **Error Handling** - Gracefully handles timeout and cancellation scenarios

## Components and Interfaces

### Search Timeout Implementation

```javascript
// Timeout wrapper for individual search operations
function withSearchTimeout(searchPromise, timeoutMs = 10000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Search timed out")), timeoutMs);
  });

  return Promise.race([searchPromise, timeoutPromise]);
}
```

### Search Cancellation

```javascript
// AbortController for cancelling searches
let currentSearchController = null;

function cancelCurrentSearch() {
  if (currentSearchController) {
    currentSearchController.abort();
  }
}
```

### Integration Points

- **DictionarySearch.vue**: Modified `searchWords()` function to use timeout and cancellation
- **Individual Search Functions**: `searchMoeResults()`, `searchMknollResults()`, etc. updated to handle AbortSignal
- **Error Handling**: Updated to distinguish between timeout, cancellation, and other errors

## Data Models

No new data models required. Existing search result structures remain unchanged.

## Error Handling

### Timeout Errors

- Display user-friendly "Search timed out" message
- Reset loading states
- Allow immediate new search

### Cancellation Errors

- Silent handling (no error message shown)
- Clean up previous search state
- Proceed with new search

### Network Errors

- Existing error handling remains unchanged
- Timeout wrapper doesn't interfere with network error reporting

## Testing Strategy

### Unit Tests

- Test timeout functionality with mock delays
- Test cancellation behavior
- Test error handling for different scenarios

### Integration Tests

- Test search timeout in real search scenarios
- Test search cancellation when starting new searches
- Test UI responsiveness during searches

### Manual Testing

- Verify searches timeout after 10 seconds
- Verify new searches cancel previous ones
- Verify loading states work correctly
