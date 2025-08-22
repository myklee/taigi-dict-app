import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withSearchTimeout, isTimeoutError, SearchTimeoutError } from '../searchTimeout.js';

describe('searchTimeout utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('SearchTimeoutError', () => {
    it('should create a timeout error with default message', () => {
      const error = new SearchTimeoutError();
      expect(error.message).toBe('Search timed out');
      expect(error.name).toBe('SearchTimeoutError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create a timeout error with custom message', () => {
      const customMessage = 'Custom timeout message';
      const error = new SearchTimeoutError(customMessage);
      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('SearchTimeoutError');
    });
  });

  describe('withSearchTimeout', () => {
    it('should resolve with search results when promise resolves before timeout', async () => {
      const expectedResult = { data: 'search results' };
      const searchPromise = new Promise(resolve => {
        setTimeout(() => resolve(expectedResult), 1000);
      });

      const timeoutPromise = withSearchTimeout(searchPromise, 5000);
      
      // Fast-forward time by 1 second
      vi.advanceTimersByTime(1000);
      
      const result = await timeoutPromise;
      expect(result).toEqual(expectedResult);
    });

    it('should reject with timeout error when promise takes longer than timeout', async () => {
      const searchPromise = new Promise(resolve => {
        setTimeout(() => resolve('result'), 15000);
      });

      const timeoutPromise = withSearchTimeout(searchPromise, 10000);
      
      // Fast-forward time by 10 seconds to trigger timeout
      vi.advanceTimersByTime(10000);
      
      await expect(timeoutPromise).rejects.toThrow(SearchTimeoutError);
      await expect(timeoutPromise).rejects.toThrow('Search timed out. Please try again.');
    });

    it('should use default timeout of 10 seconds when not specified', async () => {
      const searchPromise = new Promise(resolve => {
        setTimeout(() => resolve('result'), 15000);
      });

      const timeoutPromise = withSearchTimeout(searchPromise);
      
      // Fast-forward time by 10 seconds (default timeout)
      vi.advanceTimersByTime(10000);
      
      await expect(timeoutPromise).rejects.toThrow(SearchTimeoutError);
    });

    it('should reject with original error when search promise rejects before timeout', async () => {
      const originalError = new Error('Network error');
      const searchPromise = new Promise((_, reject) => {
        setTimeout(() => reject(originalError), 1000);
      });

      const timeoutPromise = withSearchTimeout(searchPromise, 5000);
      
      // Fast-forward time by 1 second
      vi.advanceTimersByTime(1000);
      
      await expect(timeoutPromise).rejects.toThrow('Network error');
      await expect(timeoutPromise).rejects.not.toThrow(SearchTimeoutError);
    });

    it('should handle custom timeout values', async () => {
      const searchPromise = new Promise(resolve => {
        setTimeout(() => resolve('result'), 10000);
      });

      const timeoutPromise = withSearchTimeout(searchPromise, 2000);
      
      // Fast-forward time by 2 seconds (custom timeout)
      vi.advanceTimersByTime(2000);
      
      await expect(timeoutPromise).rejects.toThrow(SearchTimeoutError);
    });
  });

  describe('isTimeoutError', () => {
    it('should return true for SearchTimeoutError instances', () => {
      const error = new SearchTimeoutError();
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return true for errors with SearchTimeoutError name', () => {
      const error = new Error('Some message');
      error.name = 'SearchTimeoutError';
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return true for errors with timeout message', () => {
      const error = new Error('Search timed out');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Network error');
      expect(isTimeoutError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isTimeoutError(null)).toBe(false);
      expect(isTimeoutError(undefined)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isTimeoutError('string')).toBe(false);
      expect(isTimeoutError({})).toBe(false);
      expect(isTimeoutError(123)).toBe(false);
    });
  });
});