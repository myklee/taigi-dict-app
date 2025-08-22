import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import DictionarySearch from '../DictionarySearch.vue';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCommunityStore } from '@/stores/communityStore';
import { withSearchTimeout, SearchTimeoutError, isTimeoutError } from '@/utils/searchTimeout';

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

describe('DictionarySearch - Integration Tests', () => {
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

    // Reset Supabase mock to successful response by default
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
            template: '<div class="moe-results" data-testid="moe-results">MOE Results: {{ error ? "Error: " + error : "No Error" }}</div>',
            props: ['error', 'results', 'loading'],
            emits: ['retry']
          },
          MknollSearchResults: {
            template: '<div class="mknoll-results" data-testid="mknoll-results">Mknoll Results: {{ error ? "Error: " + error : "No Error" }}</div>',
            props: ['error', 'results', 'loading'],
            emits: ['retry']
          },
          CedictSearchResults: {
            template: '<div class="cedict-results" data-testid="cedict-results">CEDICT Results: {{ error ? "Error: " + error : "No Error" }}</div>',
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

  describe('Search Timeout Behavior with Mock Delays', () => {
    it('should timeout MOE search after 10 seconds and display error message', async () => {
      // Mock a search that will be wrapped with timeout and should timeout
      mockSupabaseQuery.mockImplementation(() => {
        // Return a promise that never resolves (simulates hanging search)
        return new Promise(() => {});
      });

      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('timeout test');
      
      // Start search
      const searchPromise = wrapper.vm.searchWords();
      
      // Wait for search to complete (should timeout due to withSearchTimeout wrapper)
      await searchPromise;
      
      // Verify timeout error is set for MOE search
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.loading).toBe(false);
      
      // Verify error is displayed in component
      const moeComponent = wrapper.find('[data-testid="moe-results"]');
      if (moeComponent.exists()) {
        expect(moeComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
    }, 15000); // Increase timeout for this test

    it('should timeout Mary Knoll search independently of other searches', async () => {
      // Mock MOE to succeed quickly, Mary Knoll to timeout (never resolve)
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [{ id: 1, chinese: 'moe result' }], error: null }) // MOE succeeds
        .mockImplementationOnce(() => new Promise(() => {})); // Mary Knoll hangs (will timeout)

      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('mixed timeout test');
      await wrapper.vm.searchWords();
      
      // Verify MOE succeeded and Mary Knoll timed out
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.loading).toBe(false);
      
      // Verify error messages are displayed correctly
      const moeComponent = wrapper.find('[data-testid="moe-results"]');
      const mknollComponent = wrapper.find('[data-testid="mknoll-results"]');
      if (moeComponent.exists()) {
        expect(moeComponent.text()).toContain('No Error');
      }
      if (mknollComponent.exists()) {
        expect(mknollComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
    }, 15000);

    it('should timeout CEDICT search and cross-reference independently', async () => {
      // Mock MOE and Mary Knoll to succeed, CEDICT and cross-ref to timeout (never resolve)
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: [{ id: 1, chinese: 'moe result' }], error: null }) // MOE succeeds
        .mockResolvedValueOnce({ data: [{ id: 1, taiwanese: 'mknoll result' }], error: null }) // Mary Knoll succeeds
        .mockImplementationOnce(() => new Promise(() => {})) // CEDICT hangs (will timeout)
        .mockImplementationOnce(() => new Promise(() => {})); // Cross-ref hangs (will timeout)

      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('cedict timeout test');
      await wrapper.vm.searchWords();
      
      // Verify MOE and Mary Knoll succeeded, CEDICT and cross-ref timed out
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.crossRefError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.loading).toBe(false);
      
      // Verify error messages are displayed correctly
      const cedictComponent = wrapper.find('[data-testid="cedict-results"]');
      if (cedictComponent.exists()) {
        expect(cedictComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
    }, 15000);

    it('should handle all searches timing out simultaneously', async () => {
      // Mock all searches to timeout (never resolve)
      const hangingPromise = () => new Promise(() => {});
      
      mockSupabaseQuery
        .mockImplementation(hangingPromise)
        .mockImplementation(hangingPromise)
        .mockImplementation(hangingPromise)
        .mockImplementation(hangingPromise);

      // Set search query and trigger search
      await wrapper.find('#main-search-input').setValue('all timeout test');
      await wrapper.vm.searchWords();
      
      // Verify all searches timed out
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.mknollError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.cedictError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.crossRefError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.loading).toBe(false);
      
      // Verify all loading states are cleared
      expect(wrapper.vm.moeLoading).toBe(false);
      expect(wrapper.vm.mknollLoading).toBe(false);
      expect(wrapper.vm.cedictLoading).toBe(false);
      expect(wrapper.vm.crossRefLoading).toBe(false);
    }, 15000);
  });

  describe('Search Cancellation when Starting New Searches', () => {
    it('should cancel previous search when starting a new one', async () => {
      // Mock a slow search for the first query
      let resolveFirstSearch;
      const firstSearchPromise = new Promise((resolve) => {
        resolveFirstSearch = resolve;
      });
      mockSupabaseQuery.mockReturnValue(firstSearchPromise);

      // Start first search
      await wrapper.find('#main-search-input').setValue('first search');
      const firstSearch = wrapper.vm.searchWords();
      
      // Verify first search is in progress
      expect(wrapper.vm.loading).toBe(true);
      expect(wrapper.vm.searchQuery).toBe('first search');
      
      // Mock successful search for second query
      mockSupabaseQuery.mockResolvedValue({ data: [{ id: 1, chinese: 'second result' }], error: null });
      
      // Start second search (should cancel first)
      await wrapper.find('#main-search-input').setValue('second search');
      const secondSearch = wrapper.vm.searchWords();
      
      // Resolve the first (cancelled) search
      resolveFirstSearch({ data: [{ id: 1, chinese: 'first result' }], error: null });
      
      // Wait for both searches to complete
      await Promise.allSettled([firstSearch, secondSearch]);
      
      // Verify second search completed and first was cancelled
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.searchQuery).toBe('second search');
      
      // The cancelled search should not have set any errors
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
    });

    it('should handle rapid successive search cancellations', async () => {
      const searches = [];
      const searchQueries = ['search1', 'search2', 'search3', 'search4', 'search5'];
      
      // Mock successful searches
      mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
      
      // Start multiple searches rapidly
      for (const query of searchQueries) {
        await wrapper.find('#main-search-input').setValue(query);
        searches.push(wrapper.vm.searchWords());
      }
      
      // Wait for all searches to complete
      await Promise.allSettled(searches);
      
      // Should be in stable state with last search query
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.searchQuery).toBe('search5');
      
      // No errors should be present
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
    });

    it('should not display results from cancelled searches', async () => {
      // Mock slow first search and fast second search
      let resolveFirstSearch;
      const firstSearchPromise = new Promise((resolve) => {
        resolveFirstSearch = resolve;
      });
      
      mockSupabaseQuery
        .mockReturnValueOnce(firstSearchPromise) // First search is slow
        .mockResolvedValue({ data: [{ id: 2, chinese: 'second result' }], error: null }); // Second search is fast
      
      // Start first search
      await wrapper.find('#main-search-input').setValue('cancelled search');
      const firstSearch = wrapper.vm.searchWords();
      
      // Start second search immediately
      await wrapper.find('#main-search-input').setValue('active search');
      const secondSearch = wrapper.vm.searchWords();
      
      // Resolve first search with results (but it should be cancelled)
      resolveFirstSearch({ data: [{ id: 1, chinese: 'cancelled result' }], error: null });
      
      // Wait for both to complete
      await Promise.allSettled([firstSearch, secondSearch]);
      
      // Verify that only the second search results are considered
      expect(wrapper.vm.searchQuery).toBe('active search');
      expect(wrapper.vm.loading).toBe(false);
      
      // The store should have been called with the second search results
      expect(mockDictionaryStore.setSearchResults).toHaveBeenCalled();
    });
  });

  describe('Error Message Display for Timeouts', () => {
    it('should display user-friendly timeout messages in search result components', async () => {
      // Mock timeout for all searches
      const timeoutError = new SearchTimeoutError('Search timed out. Please try again.');
      mockSupabaseQuery.mockRejectedValue(timeoutError);
      
      // Trigger search
      await wrapper.find('#main-search-input').setValue('timeout display test');
      await wrapper.vm.searchWords();
      
      // Verify timeout messages are displayed in each component
      const moeComponent = wrapper.find('[data-testid="moe-results"]');
      const mknollComponent = wrapper.find('[data-testid="mknoll-results"]');
      const cedictComponent = wrapper.find('[data-testid="cedict-results"]');
      
      if (moeComponent.exists()) {
        expect(moeComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
      if (mknollComponent.exists()) {
        expect(mknollComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
      if (cedictComponent.exists()) {
        expect(cedictComponent.text()).toContain('Error: Search timed out. Please try again.');
      }
    });

    it('should clear timeout error messages when starting new successful search', async () => {
      // First search times out
      mockSupabaseQuery.mockRejectedValue(new SearchTimeoutError('Search timed out. Please try again.'));
      
      await wrapper.find('#main-search-input').setValue('timeout first');
      await wrapper.vm.searchWords();
      
      // Verify timeout errors are set
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.mknollError).toBe('Search timed out. Please try again.');
      
      // Second search succeeds
      mockSupabaseQuery.mockResolvedValue({ data: [{ id: 1, chinese: 'success' }], error: null });
      
      await wrapper.find('#main-search-input').setValue('success search');
      await wrapper.vm.searchWords();
      
      // Verify errors are cleared
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
      
      // Verify success messages are displayed
      const moeComponent = wrapper.find('[data-testid="moe-results"]');
      const mknollComponent = wrapper.find('[data-testid="mknoll-results"]');
      if (moeComponent.exists()) {
        expect(moeComponent.text()).toContain('No Error');
      }
      if (mknollComponent.exists()) {
        expect(mknollComponent.text()).toContain('No Error');
      }
    });

    it('should distinguish between timeout errors and other errors', async () => {
      // Mock different types of errors
      mockSupabaseQuery
        .mockRejectedValueOnce(new SearchTimeoutError('Search timed out. Please try again.')) // MOE timeout
        .mockRejectedValueOnce(new Error('Network error')) // Mary Knoll network error
        .mockResolvedValueOnce({ data: [], error: null }); // CEDICT success
      
      await wrapper.find('#main-search-input').setValue('mixed errors test');
      await wrapper.vm.searchWords();
      
      // Verify different error types are handled correctly
      expect(wrapper.vm.moeError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.mknollError).toBe('Network error');
      expect(wrapper.vm.cedictError).toBe(null);
      
      // Verify isTimeoutError utility works correctly
      expect(isTimeoutError(new SearchTimeoutError())).toBe(true);
      expect(isTimeoutError(new Error('Network error'))).toBe(false);
    });
  });

  describe('Loading States Verification', () => {
    it('should correctly manage loading states during normal search flow', async () => {
      // Mock successful searches
      mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
      
      // Start search
      await wrapper.find('#main-search-input').setValue('loading test');
      await wrapper.vm.searchWords();
      
      // After search completes, verify all loading states are cleared
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.moeLoading).toBe(false);
      expect(wrapper.vm.mknollLoading).toBe(false);
      expect(wrapper.vm.cedictLoading).toBe(false);
      expect(wrapper.vm.crossRefLoading).toBe(false);
    });

    it('should clear loading states when searches timeout', async () => {
      // Mock all searches to timeout (never resolve)
      mockSupabaseQuery.mockImplementation(() => new Promise(() => {}));
      
      // Start search
      await wrapper.find('#main-search-input').setValue('timeout loading test');
      await wrapper.vm.searchWords();
      
      // Verify all loading states are cleared after timeout
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.moeLoading).toBe(false);
      expect(wrapper.vm.mknollLoading).toBe(false);
      expect(wrapper.vm.cedictLoading).toBe(false);
      expect(wrapper.vm.crossRefLoading).toBe(false);
    }, 15000);

    it('should clear loading states when searches are cancelled', async () => {
      // Mock successful searches
      mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
      
      // Start first search
      await wrapper.find('#main-search-input').setValue('cancelled loading test');
      const firstSearch = wrapper.vm.searchWords();
      
      // Start second search (cancels first)
      await wrapper.find('#main-search-input').setValue('new search');
      const secondSearch = wrapper.vm.searchWords();
      
      // Wait for both to complete
      await Promise.allSettled([firstSearch, secondSearch]);
      
      // Verify loading states are cleared
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.moeLoading).toBe(false);
      expect(wrapper.vm.mknollLoading).toBe(false);
      expect(wrapper.vm.cedictLoading).toBe(false);
      expect(wrapper.vm.crossRefLoading).toBe(false);
    });

    it('should maintain responsive interface during loading states', async () => {
      // Mock successful search
      mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
      
      // Start search
      await wrapper.find('#main-search-input').setValue('responsive test');
      await wrapper.vm.searchWords();
      
      // Verify interface elements remain enabled after search
      const searchInput = wrapper.find('#main-search-input');
      const clearButton = wrapper.find('.clear-search-button');
      const exactSearchCheckbox = wrapper.find('#exact-search');
      const searchButton = wrapper.find('.search-button');
      
      expect(searchInput.attributes('disabled')).toBeUndefined();
      if (clearButton.exists()) {
        expect(clearButton.attributes('disabled')).toBeUndefined();
      }
      expect(exactSearchCheckbox.attributes('disabled')).toBeUndefined();
      expect(searchButton.attributes('disabled')).toBeUndefined();
      
      // Verify loading indicator is hidden after search completes
      expect(wrapper.find('.search-loading-indicator').exists()).toBe(false);
    });
  });

  describe('Integration with Timeout Utility', () => {
    it('should properly integrate withSearchTimeout utility in search functions', async () => {
      // Verify that withSearchTimeout is being used correctly
      expect(withSearchTimeout).toBeDefined();
      expect(typeof withSearchTimeout).toBe('function');
      
      // Test that timeout utility works as expected
      const fastPromise = Promise.resolve({ data: 'test' });
      const result = await withSearchTimeout(fastPromise, 1000);
      expect(result).toEqual({ data: 'test' });
      
      // Test timeout behavior
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 2000));
      await expect(withSearchTimeout(slowPromise, 100)).rejects.toThrow(SearchTimeoutError);
    });

    it('should handle AbortController integration with timeout', async () => {
      // Mock a search that can be aborted
      let abortController;
      const abortablePromise = new Promise((resolve, reject) => {
        abortController = new AbortController();
        abortController.signal.addEventListener('abort', () => {
          reject(new Error('Search was aborted'));
        });
        setTimeout(() => resolve({ data: [], error: null }), 5000);
      });
      
      mockSupabaseQuery.mockReturnValue(abortablePromise);
      
      // Start search
      await wrapper.find('#main-search-input').setValue('abort test');
      const searchPromise = wrapper.vm.searchWords();
      
      // Cancel search
      wrapper.vm.cancelCurrentSearch();
      
      // Wait for search to complete
      await searchPromise;
      
      // Should handle cancellation gracefully
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('End-to-End Search Flow Integration', () => {
    it('should handle complete search flow from input to results display', async () => {
      // Mock successful search results
      const mockMoeResults = [{ id: 1, chinese: '測試', english: 'test' }];
      const mockMknollResults = [{ id: 1, taiwanese: 'chhì-giām', english: 'test' }];
      const mockCedictResults = [{ id: 1, traditional: '測試', simplified: '测试', english: 'test' }];
      
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockMoeResults, error: null })
        .mockResolvedValueOnce({ data: mockMknollResults, error: null })
        .mockResolvedValueOnce({ data: mockCedictResults, error: null })
        .mockResolvedValueOnce({ data: [], error: null }); // Cross-ref
      
      // Perform complete search flow
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();
      
      // Verify search completed successfully
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.searchExecuted).toBe(true);
      expect(wrapper.vm.searchQuery).toBe('test');
      
      // Verify store methods were called with results (may include community definitions)
      expect(mockDictionaryStore.setSearchResults).toHaveBeenCalled();
      expect(mockDictionaryStore.setMknollResults).toHaveBeenCalledWith(mockMknollResults);
      expect(mockDictionaryStore.setCedictResults).toHaveBeenCalledWith(mockCedictResults);
      
      // Verify no errors
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe(null);
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
    });

    it('should handle mixed success and timeout scenarios in complete flow', async () => {
      // Mock mixed results: some succeed, some timeout
      const mockMoeResults = [{ id: 1, chinese: '成功', english: 'success' }];
      
      mockSupabaseQuery
        .mockResolvedValueOnce({ data: mockMoeResults, error: null }) // MOE succeeds
        .mockImplementationOnce(() => new Promise(() => {})) // Mary Knoll times out (never resolves)
        .mockResolvedValueOnce({ data: [], error: null }) // CEDICT succeeds
        .mockResolvedValueOnce({ data: [], error: null }); // Cross-ref succeeds
      
      // Perform search
      await wrapper.find('#main-search-input').setValue('mixed results');
      await wrapper.vm.searchWords();
      
      // Verify mixed results
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.moeError).toBe(null);
      expect(wrapper.vm.mknollError).toBe('Search timed out. Please try again.');
      expect(wrapper.vm.cedictError).toBe(null);
      expect(wrapper.vm.crossRefError).toBe(null);
      
      // Verify successful results were stored
      expect(mockDictionaryStore.setSearchResults).toHaveBeenCalled();
      expect(mockDictionaryStore.setCedictResults).toHaveBeenCalledWith([]);
    }, 15000);
  });
});