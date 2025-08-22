import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import DictionarySearch from '../DictionarySearch.vue';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCommunityStore } from '@/stores/communityStore';
import { withSearchTimeout, isTimeoutError } from '@/utils/searchTimeout';

// Mock the stores
vi.mock('@/stores/dictionaryStore');
vi.mock('@/stores/favoritesStore');
vi.mock('@/stores/communityStore');

// Mock Supabase
vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

// Mock utils
vi.mock('@/utils', () => ({
  speakChinese: vi.fn(),
  speakEnglish: vi.fn(),
  detectSearchLanguage: vi.fn(() => ({ language: 'english', confidence: 0.8 }))
}));

describe('DictionarySearch - Timeout Integration', () => {
  let wrapper;
  let router;
  let mockDictionaryStore;
  let mockFavoritesStore;
  let mockCommunityStore;

  beforeEach(async () => {
    // Setup router
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'dictionary', component: { template: '<div>Dictionary</div>' } },
        { path: '/search/:query?', name: 'search', component: DictionarySearch }
      ]
    });

    // Setup store mocks
    mockDictionaryStore = {
      searchResults: [],
      mknollResults: [],
      cedictResults: [],
      crossRefResults: [],
      showRandomWord: false,
      setSearchResults: vi.fn(),
      setMknollResults: vi.fn(),
      setCedictResults: vi.fn(),
      setCrossRefCedict: vi.fn(),
      loadFromIndexedDB: vi.fn(),
      loadSearchHistoryFromSupabase: vi.fn(),
      addToHistory: vi.fn()
    };

    mockFavoritesStore = {
      loadFromIndexedDB: vi.fn(),
      loadFromSupabase: vi.fn()
    };

    mockCommunityStore = {
      fetchDefinitionsForWord: vi.fn(() => Promise.resolve({ success: true, data: [] })),
      searchDefinitions: vi.fn(() => Promise.resolve({ success: true, data: [] }))
    };

    useDictionaryStore.mockReturnValue(mockDictionaryStore);
    useFavoritesStore.mockReturnValue(mockFavoritesStore);
    useCommunityStore.mockReturnValue(mockCommunityStore);

    // Mount component
    wrapper = mount(DictionarySearch, {
      global: {
        plugins: [router],
        stubs: {
          RandomWord: true,
          LoadingSkeleton: true,
          EmptyState: true,
          EditWord: true,
          EditWordMknoll: true,
          CommunityDefinitionForm: true,
          FavoritesLoginPrompt: true,
          MoeSearchResults: true,
          MknollSearchResults: true,
          CedictSearchResults: true
        }
      }
    });

    await router.isReady();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Timeout Utility Integration', () => {
    it('should import and use withSearchTimeout utility', () => {
      // Verify that the timeout utility is available
      expect(withSearchTimeout).toBeDefined();
      expect(isTimeoutError).toBeDefined();
      expect(typeof withSearchTimeout).toBe('function');
      expect(typeof isTimeoutError).toBe('function');
    });

    it('should handle timeout errors in search functions', async () => {
      // Mock a slow search that will timeout
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ data: [], error: null }), 15000); // 15 seconds - longer than timeout
      });

      // Test that withSearchTimeout rejects with timeout error
      await expect(withSearchTimeout(slowPromise, 100)).rejects.toThrow('Search timed out');
    });

    it('should detect timeout errors correctly', () => {
      const timeoutError = new Error('Search timed out. Please try again.');
      timeoutError.name = 'SearchTimeoutError';
      
      expect(isTimeoutError(timeoutError)).toBe(true);
      
      const regularError = new Error('Network error');
      expect(isTimeoutError(regularError)).toBe(false);
    });

    it('should allow fast searches to complete normally', async () => {
      const fastPromise = Promise.resolve({ data: [{ id: 1, name: 'test' }], error: null });
      
      const result = await withSearchTimeout(fastPromise, 1000);
      expect(result).toEqual({ data: [{ id: 1, name: 'test' }], error: null });
    });
  });

  describe('Search Function Timeout Integration', () => {
    it('should have search functions that can be wrapped with timeout', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Verify that the component has the necessary search infrastructure
      expect(wrapper.vm.searchQuery).toBe('test');
      expect(typeof wrapper.vm.searchWords).toBe('function');
    });

    it('should handle search cancellation and timeout together', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search
      const searchPromise = wrapper.vm.searchWords();
      
      // Verify loading state is set
      expect(wrapper.vm.loading).toBe(true);
      
      // Cancel the search (this should work without throwing)
      wrapper.vm.cancelCurrentSearch();
      
      // Wait for search to complete
      await searchPromise;
      
      // Verify loading state is cleared
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('Error State Management', () => {
    it('should have error states for each search type', () => {
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
    });

    it('should clear all errors when starting new search', async () => {
      // Set some error states
      wrapper.vm.moeError = 'Previous error';
      wrapper.vm.mknollError = 'Previous error';
      
      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();
      
      // Errors should be cleared
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
    });
  });
});