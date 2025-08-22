/**
 * Search timeout utilities for handling search operation timeouts
 */

/**
 * Custom error class for search timeouts
 */
export class SearchTimeoutError extends Error {
  constructor(message = 'Search timed out') {
    super(message);
    this.name = 'SearchTimeoutError';
  }
}

/**
 * Wraps a promise with a timeout mechanism
 * @param {Promise} searchPromise - The search promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise} Promise that resolves with search results or rejects with timeout
 */
export function withSearchTimeout(searchPromise, timeoutMs = 10000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new SearchTimeoutError('Search timed out. Please try again.'));
    }, timeoutMs);
  });

  return Promise.race([searchPromise, timeoutPromise]);
}

/**
 * Helper function to detect if an error is a timeout error
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is a timeout error
 */
export function isTimeoutError(error) {
  if (!error) {
    return false;
  }
  
  // Check if it's an instance of SearchTimeoutError
  if (error instanceof SearchTimeoutError) {
    return true;
  }
  
  // Check if it has the SearchTimeoutError name
  if (error.name === 'SearchTimeoutError') {
    return true;
  }
  
  // Check if the message contains timeout text
  if (error.message && typeof error.message === 'string' && error.message.includes('Search timed out')) {
    return true;
  }
  
  return false;
}