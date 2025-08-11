# Design Document

## Overview

The search performance optimization design addresses hanging issues in the dictionary search by implementing timeout controls, progressive result loading, intelligent caching, and improved error handling. The solution maintains the existing parallel search architecture while adding resilience mechanisms to prevent infinite loading states and improve user experience.

## Architecture

### Current Architecture Issues

- All searches wait for completion before showing any results
- Community definition fetching blocks main results display
- No timeout mechanisms for individual search operations
- Cache failures can cause search failures
- No cancellation mechanism for in-progress searches

### Proposed Architecture

```
Search Request
├── Search Controller (with timeout & cancellation)
├── Parallel Dictionary Sources
│   ├── MOE Dictionary (with timeout)
│   ├── Mary Knoll Dictionary (with timeout)
│   ├── CEDICT Dictionary (with timeout)
│   └── Cross-reference (with timeout)
├── Progressive Result Streaming
├── Community Definition Service (async, non-blocking)
└── Cache Layer (with fallback)
```

## Components and Interfaces

### 1. Search Controller

**Purpose:** Orchestrates search operations with timeout and cancellation support

**Interface:**

```javascript
class SearchController {
  constructor(timeoutMs = 10000) {
    this.timeoutMs = timeoutMs;
    this.abortController = null;
    this.searchId = null;
  }

  async executeSearch(query, options) {
    // Cancel previous search if running
    // Create new AbortController
    // Execute parallel searches with timeout
    // Handle progressive results
    // Return search results or timeout
  }

  cancelSearch() {
    // Abort current search operations
  }
}
```

### 2. Dictionary Source Wrapper

**Purpose:** Wraps individual dictionary searches with timeout and error handling

**Interface:**

```javascript
class DictionarySource {
  constructor(name, searchFunction, timeoutMs = 5000) {
    this.name = name;
    this.searchFunction = searchFunction;
    this.timeoutMs = timeoutMs;
  }

  async search(pattern, signal) {
    // Execute search with timeout and abort signal
    // Return results or timeout error
  }
}
```

### 3. Progressive Result Manager

**Purpose:** Manages streaming of results as they become available

**Interface:**

```javascript
class ProgressiveResultManager {
  constructor(resultCallback) {
    this.resultCallback = resultCallback;
    this.results = new Map();
    this.completedSources = new Set();
  }

  addResult(sourceName, data) {
    // Add result from specific source
    // Trigger callback with updated results
  }

  addError(sourceName, error) {
    // Record error for specific source
    // Continue with other sources
  }
}
```

### 4. Community Definition Service

**Purpose:** Handles community definitions asynchronously without blocking main results

**Interface:**

```javascript
class CommunityDefinitionService {
  constructor(communityStore, cacheManager) {
    this.communityStore = communityStore;
    this.cacheManager = cacheManager;
    this.requestQueue = new Map();
  }

  async fetchForWords(words, timeoutMs = 3000) {
    // Fetch community definitions with timeout
    // Use sanitized search terms
    // Cache results appropriately
    // Return results or empty array on timeout/error
  }
}
```

### 5. Cache Manager

**Purpose:** Handles caching with fallback mechanisms

**Interface:**

```javascript
class CacheManager {
  constructor(storage, ttl = 300000) {
    // 5 minutes default
    this.storage = storage;
    this.ttl = ttl;
    this.memoryCache = new Map();
  }

  async get(key) {
    // Try memory cache first
    // Fall back to storage
    // Return null if not found or expired
  }

  async set(key, value) {
    // Set in memory cache
    // Try to set in storage (don't fail if storage fails)
  }
}
```

## Data Models

### Search Result Structure

```javascript
{
  searchId: string,
  query: string,
  timestamp: Date,
  status: 'loading' | 'partial' | 'complete' | 'timeout' | 'error',
  sources: {
    moe: {
      status: 'loading' | 'success' | 'error' | 'timeout',
      data: Array,
      error: string | null,
      loadTime: number
    },
    mknoll: { /* same structure */ },
    cedict: { /* same structure */ },
    crossRef: { /* same structure */ }
  },
  communityDefinitions: {
    status: 'loading' | 'success' | 'error' | 'timeout',
    data: Map, // keyed by word ID
    error: string | null
  },
  totalResults: number,
  loadTime: number
}
```

### Cache Entry Structure

```javascript
{
  key: string,
  data: any,
  timestamp: number,
  ttl: number,
  source: 'search' | 'community' | 'definitions'
}
```

## Error Handling

### Timeout Handling

1. **Individual Source Timeouts:** Each dictionary source has a 5-second timeout
2. **Overall Search Timeout:** Complete search operation times out after 10 seconds
3. **Community Definition Timeout:** Community definitions timeout after 3 seconds
4. **Progressive Display:** Show available results even if some sources timeout

### Error Recovery

1. **Partial Results:** Display results from successful sources when others fail
2. **Retry Mechanisms:** Provide retry buttons for failed sources
3. **Graceful Degradation:** Continue search without community definitions if they fail
4. **Cache Fallback:** Use cached results if fresh search fails

### Error Messages

```javascript
const ERROR_MESSAGES = {
  TIMEOUT: "Search timed out. Showing available results.",
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  SOURCE_UNAVAILABLE: "Dictionary source temporarily unavailable.",
  COMMUNITY_ERROR: "Community definitions unavailable. Main results shown.",
  CACHE_ERROR: "Cache error occurred. Search continuing without cache.",
};
```

## Testing Strategy

### Unit Tests

1. **SearchController Tests**

   - Timeout handling
   - Cancellation functionality
   - Progressive result management
   - Error handling scenarios

2. **Dictionary Source Tests**

   - Individual source timeout behavior
   - Error propagation
   - AbortSignal handling

3. **Cache Manager Tests**
   - Cache hit/miss scenarios
   - TTL expiration
   - Storage failure handling
   - Memory cache fallback

### Integration Tests

1. **End-to-End Search Flow**

   - Complete search with all sources
   - Partial failure scenarios
   - Timeout scenarios
   - Cache integration

2. **Performance Tests**
   - Search completion times
   - Memory usage during searches
   - Cache effectiveness
   - Concurrent search handling

### Error Scenario Tests

1. **Network Failure Simulation**

   - Individual source failures
   - Complete network outage
   - Intermittent connectivity

2. **Timeout Simulation**
   - Slow database responses
   - Community service delays
   - Cache storage delays

## Implementation Phases

### Phase 1: Core Timeout and Cancellation

- Implement SearchController with timeout
- Add AbortController support to existing searches
- Implement search cancellation on new queries

### Phase 2: Progressive Results

- Implement ProgressiveResultManager
- Update UI to show results as they arrive
- Add individual source loading states

### Phase 3: Community Definition Optimization

- Implement CommunityDefinitionService
- Add search term sanitization improvements
- Make community definitions non-blocking

### Phase 4: Enhanced Caching

- Implement CacheManager with fallback
- Add memory cache layer
- Improve cache key strategies

### Phase 5: Error Handling and UX

- Implement comprehensive error messages
- Add retry mechanisms
- Improve loading state indicators
