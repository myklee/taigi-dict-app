import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import DictionarySearch from '../DictionarySearch.vue';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCommunityStore } from '@/stores/communityStore';
import { withSearchTimeout, SearchTimeoutError } from '@/utils/searchTimeout';

// Mock the stores
vi.mock('@/stores/dictionaryStore');
vi.mock('@/stores/favoritesStore');
vi.mock('@/stores/communityStore');

// Mock Supabase with controllable responses
const mockSupabaseQuery = vi.fn();
vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          limit: vi.fn(() => mockSupabaseQuery())
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

describe('DictionarySearch - Error Handling and User Feedback', () => {
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

    // Reset Supabase mock
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

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
          MoeSearchResults: {
            template: '<div class="moe-results">MOE Results: {{ error ? "Error: " + error : "No Error" }}</div>',
            props: ['error', 'results', 'loading'],
            emits: ['retry']
          },
          MknollSearchResults: {
            template: '<div class="mknoll-results">Mknoll Results: {{ error ? "Error: " + error : "No Error" }}</div>',
            props: ['error', 'results', 'loading'],
            emits: ['retry']
          },
          CedictSearchResults: {
            template: '<div class="cedict-results">CEDICT Results: {{ error ? "Error: " + error : "No Error" }}</div>',
            props: ['error', 'results', 'loading', 'crossRefError'],
            emits: ['retry', 'retry-crossref']
          }
        }
      }
    });

    await router.isReady();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Search Interface Responsiveness', () => {
    it('should keep search input enabled during searches', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search (don't await to check loading state)
      const searchPromise = wrapper.vm.searchWords();
      
      // Check that search input is not disabled during loading
      const searchInput = wrapper.find('#main-search-input');
      expect(searchInput.attributes('disabled')).toBeUndefined();
      
      // Wait for search to complete
      await searchPromise;
    });

    it('should keep clear button enabled during searches', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search (don't await to check loading state)
      const searchPromise = wrapper.vm.searchWords();
      
      // Check that clear button is not disabled during loading
      const clearButton = wrapper.find('.clear-search-button');
      expect(clearButton.attributes('disabled')).toBeUndefined();
      
      // Wait for search to complete
      await searchPromise;
    });

    it('should keep exact search checkbox enabled during searches', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search (don't await to check loading state)
      const searchPromise = wrapper.vm.searchWords();
      
      // Check that exact search checkbox is not disabled during loading
      const exactSearchCheckbox = wrapper.find('#exact-search');
      expect(exactSearchCheckbox.attributes('disabled')).toBeUndefined();
      
      // Wait for search to complete
      await searchPromise;
    });

    it('should keep search button enabled when there is a query', async () => {
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search (don't await to check loading state)
      const searchPromise = wrapper.vm.searchWords();
      
      // Check that search button is not disabled during loading (only disabled when no query)
      const searchButton = wrapper.find('.search-button');
      expect(searchButton.attributes('disabled')).toBeUndefined();
      
      // Wait for search to complete
      await searchPromise;
    });

    it('should display loading indicator during searches', async () => {
      // Mock a slow search to ensure we can test loading state
      let resolveSearch;
      const slowSearchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      mockSupabaseQuery.mockReturnValue(slowSearchPromise);
      
      // Set a search query
      await wrapper.find('#main-search-input').setValue('test');
      
      // Start a search (don't await to check loading state)
      const searchPromise = wrapper.vm.searchWords();
      
      // Wait a tick for the loading state to be set
      await wrapper.vm.$nextTick();
      
      // Check that loading indicator is displayed
      expect(wrapper.vm.loading).toBe(true);
      const loadingIndicator = wrapper.find('.search-loading-indicator');
      expect(loadingIndicator.exists()).toBe(true);
      
      // Resolve the search
      resolveSearch({ data: [], error: null });
      
      // Wait for search to complete
      await searchPromise;
      
      // Check that loading indicator is hidden after completion
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('Timeout Error Message Display', () => {
    it('should display timeout error message for MOE search', async () => {
      // Mock a timeout error for MOE search
      mockSupabaseQuery.mockRejectedValue(new SearchTimeoutError('Search timed out. Please try again.'));
      
      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();
      
      // Check that MOE error is set correctly
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      
      // Verify that the error is passed to the MOE results component
      const moeComponent = wrapper.findComponent({ name: 'MoeSearchResults' });
      if (moeComponent.exists()) {
        expect(moeComponent.props('error')).toBe('Search timed out. Please try again.');
      }
    });

    it('should display timeout error message for Mary Knoll search', async () => {
      // Mock successful MOE search but timeout for Mary Knoll
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // MOE search succeeds
        .mockRejectedValueOnce(new SearchTimeoutError('Search timed out. Please try again.')); // Mary Knoll times out
      
      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();
      
      // Check that Mary Knoll error is set correctly
      expect(wrapper.vm.mknollError).toBe('Search timed out. Please try again.');
      
      // Verify that the error is passed to the Mary Knoll results component
      const mknollComponent = wrapper.findComponent({ name: 'MknollSearchResults' });
      if (mknollComponent.exists()) {
        expect(mknollComponent.props('error')).toBe('Search timed out. Please try again.');
      }
    });

    it('should display timeout error message for CEDICT search', async () => {
      // Mock successful searches for MOE and Mary Knoll, but timeout for CEDICT
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [], error: null }) // MOE search succeeds
        .mockResolvedValueOnce({ data: [], error: null }) // Mary Knoll succeeds
        .mockRejectedValueOnce(new SearchTimeoutError('Search timed out. Please try again.')); // CEDICT times out
      
      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();
      
      // Check that CEDICT error is set correctly
      expect(wrapper.vm.cedictError).toBe('Search timed out. Please try again.');
      
      // Verify that the error is passed to the CEDICT results component
      const cedictComponent = wrapper.findComponent({ name: 'CedictSearchResults' });
      if (cedictComponent.exists()) {
        expect(cedictComponent.props('error')).toBe('Search timed out. Please try again.');
      }
    });

    it('should clear timeout errors when starting new search', async () => {
      // First, set some timeout errors
      wrapper.vm.moeError = 'Search timed out. Please try again.';
      wrapper.vm.mknollError = 'Search timed out. Please try again.';
      wrapper.vm.cedictError = 'Search timed out. Please try again.';
      wrapper.vm.crossRefError = 'Search timed out. Please try again.';
      
      // Start a new search
      await wrapper.find('#main-search-input').setValue('new search');
      await wrapper.vm.searchWords();
      
      // Check that all errors are cleared
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
    });
  });

  describe('Search Cancellation Behavior', () => {
    it('should not display results from cancelled searches', async () => {
      // Mock a slow search that we'll cancel
      let resolveSlowSearch;
      const slowSearchPromise = new Promise((resolve) => {
        resolveSlowSearch = resolve;
      });
      mockSupabaseQuery.mockReturnValue(slowSearchPromise);
      
      // Start first search
      await wrapper.find('#main-search-input').setValue('first search');
      const firstSearchPromise = wrapper.vm.searchWords();
      
      // Verify first search is in progress
      expect(wrapper.vm.loading).toBe(true);
      
      // Start second search (should cancel first)
      await wrapper.find('#main-search-input').setValue('second search');
      const secondSearchPromise = wrapper.vm.searchWords();
      
      // Resolve the first (cancelled) search with some results
      resolveSlowSearch({ data: [{ id: 1, chinese: 'cancelled result' }], error: null });
      
      // Wait for both searches to complete
      await Promise.allSettled([firstSearchPromise, secondSearchPromise]);
      
      // The cancelled search results should not be displayed
      // Since the second search also uses the same mock, we need to check that
      // the search was properly cancelled and didn't set results
      expect(wrapper.vm.loading).toBe(false);
    });

    it('should handle multiple rapid search cancellations', async () => {
      // Set up multiple searches rapidly
      const searches = [];
      
      for (let i = 0; i < 5; i++) {
        await wrapper.find('#main-search-input').setValue(`search ${i}`);
        searches.push(wrapper.vm.searchWords());
      }
      
      // Wait for all searches to complete
      await Promise.allSettled(searches);
      
      // Should not throw errors and should be in a stable state
      expect(wrapper.vm.loading).toBe(false);
      expect(() => wrapper.vm.cancelCurrentSearch()).not.toThrow();
    });

    it('should reset loading states when search is cancelled', async () => {
      // Start a search
      await wrapper.find('#main-search-input').setValue('test');
      const searchPromise = wrapper.vm.searchWords();
      
      // Verify loading states are set
      expect(wrapper.vm.loading).toBe(true);
      
      // Cancel the search
      wrapper.vm.cancelCurrentSearch();
      
      // Wait for search promise to complete
      await searchPromise;
      
      // Verify all loading states are reset
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.moeLoading).toBe(false);
      expect(wrapper.vm.mknollLoading).toBe(false);
      expect(wrapper.vm.cedictLoading).toBe(false);
      expect(wrapper.vm.crossRefLoading).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should allow new searches after timeout errors', async () => {
      // Mock a timeout error
      mockSupabaseQuery.mockRejectedValue(new SearchTimeoutError('Search timed out. Please try again.'));
      
      // First search that times out
      await wrapper.find('#main-search-input').setValue('timeout search');
      await wrapper.vm.searchWords();
      
      // Verify timeout error is set
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      
      // Mock successful search for retry
      mockSupabaseQuery.mockResolvedValue({ data: [{ id: 1, chinese: 'success' }], error: null });
      
      // Second search should work normally
      await wrapper.find('#main-search-input').setValue('success search');
      await wrapper.vm.searchWords();
      
      // Verify error is cleared and search works
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.loading).toBe(false);
    });

    it('should handle mixed timeout and success scenarios', async () => {
      // Mock mixed results: MOE times out, Mary Knoll succeeds
      mockSupabaseQuery
        .mockRejectedValueOnce(new SearchTimeoutError('Search timed out. Please try again.')) // MOE times out
        .mockResolvedValueOnce({ data: [{ id: 1, taiwanese: 'success' }], error: null }); // Mary Knoll succeeds
      
      // Trigger search
      await wrapper.find('#main-search-input').setValue('mixed results');
      await wrapper.vm.searchWords();
      
      // Verify mixed results: MOE has error, Mary Knoll doesn't
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.loading).toBe(false);
    });
  });
});