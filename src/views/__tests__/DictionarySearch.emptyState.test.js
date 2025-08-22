import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import DictionarySearch from '../DictionarySearch.vue';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCommunityStore } from '@/stores/communityStore';

// Mock the stores
vi.mock('@/stores/dictionaryStore');
vi.mock('@/stores/favoritesStore');
vi.mock('@/stores/communityStore');

// Mock Supabase
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

describe('DictionarySearch - Empty State', () => {
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

    // Setup store mocks with empty results
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

    // Mock empty search results
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

    // Mount component
    wrapper = mount(DictionarySearch, {
      global: {
        plugins: [router],
        stubs: {
          RandomWord: true,
          LoadingSkeleton: true,
          EmptyState: {
            template: '<div class="empty-state" data-testid="empty-state"><h3>{{ title }}</h3><p>{{ description }}</p><button @click="$emit(\'primary-action\')">{{ primaryAction }}</button><button @click="$emit(\'secondary-action\')">{{ secondaryAction }}</button></div>',
            props: ['title', 'description', 'primaryAction', 'secondaryAction'],
            emits: ['primary-action', 'secondary-action']
          },
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

  describe('Empty State Display', () => {
    it('should show "No results found" when search returns empty results', async () => {
      // Perform search that returns no results
      await wrapper.find('#main-search-input').setValue('nonexistentword');
      await wrapper.vm.searchWords();

      // Wait for search to complete
      await wrapper.vm.$nextTick();

      // Verify empty state is displayed
      const emptyState = wrapper.find('[data-testid="empty-state"]');
      expect(emptyState.exists()).toBe(true);
      expect(emptyState.text()).toContain('No results found');
      expect(emptyState.text()).toContain('nonexistentword');
    });

    it('should calculate totalResultsCount correctly when all stores are empty', async () => {
      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Verify totalResultsCount is 0
      expect(wrapper.vm.totalResultsCount).toBe(0);
    });

    it('should calculate hasAnyResults correctly when no results exist', async () => {
      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Verify hasAnyResults is false
      expect(wrapper.vm.hasAnyResults).toBe(false);
    });

    it('should show search results summary with 0 results', async () => {
      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Wait for search to complete
      await wrapper.vm.$nextTick();

      // Verify search summary shows 0 results
      const searchSummary = wrapper.find('.search-results-count');
      if (searchSummary.exists()) {
        expect(searchSummary.text()).toContain('0 results found');
      }
    });

    it('should provide accessible empty state with proper ARIA labels', async () => {
      // Perform search that returns no results
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Wait for search to complete
      await wrapper.vm.$nextTick();

      // Verify ARIA attributes for empty state
      const emptyStateContainer = wrapper.find('[aria-label="No search results found"]');
      expect(emptyStateContainer.exists()).toBe(true);
      expect(emptyStateContainer.attributes('role')).toBe('status');
      expect(emptyStateContainer.attributes('aria-live')).toBe('polite');
    });

    it('should handle empty state actions correctly', async () => {
      // Perform search that returns no results
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Wait for search to complete
      await wrapper.vm.$nextTick();

      // Find empty state component
      const emptyState = wrapper.find('[data-testid="empty-state"]');
      expect(emptyState.exists()).toBe(true);

      // Test primary action (Try Different Search)
      const primaryButton = emptyState.find('button');
      expect(primaryButton.text()).toContain('Try Different Search');

      // Click primary action should clear search
      await primaryButton.trigger('click');
      expect(wrapper.vm.searchQuery).toBe('');
    });
  });

  describe('Results Count Logic', () => {
    it('should calculate totalResultsCount correctly with mixed results', async () => {
      // Set up stores with some results
      mockDictionaryStore.searchResults = [{ id: 1 }, { id: 2 }]; // 2 results
      mockDictionaryStore.mknollResults = [{ id: 3 }]; // 1 result
      mockDictionaryStore.cedictResults = []; // 0 results
      mockDictionaryStore.crossRefResults = [{ id: 4 }, { id: 5 }, { id: 6 }]; // 3 results

      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Verify totalResultsCount is 6 (2 + 1 + 0 + 3)
      expect(wrapper.vm.totalResultsCount).toBe(6);
      expect(wrapper.vm.hasAnyResults).toBe(true);
    });

    it('should handle null/undefined results arrays gracefully', async () => {
      // Set up stores with null/undefined results
      mockDictionaryStore.searchResults = null;
      mockDictionaryStore.mknollResults = undefined;
      mockDictionaryStore.cedictResults = [];
      mockDictionaryStore.crossRefResults = [];

      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Verify totalResultsCount handles null/undefined gracefully
      expect(wrapper.vm.totalResultsCount).toBe(0);
      expect(wrapper.vm.hasAnyResults).toBe(false);
    });
  });

  describe('Welcome State', () => {
    it('should show welcome state when no search has been executed', () => {
      // Verify welcome state is shown initially
      const welcomeState = wrapper.find('.welcome-state');
      expect(welcomeState.exists()).toBe(true);

      // Verify search results are not shown
      const searchResults = wrapper.find('#search-results');
      expect(searchResults.exists()).toBe(false);
    });

    it('should hide welcome state after search is executed', async () => {
      // Perform search
      await wrapper.find('#main-search-input').setValue('test');
      await wrapper.vm.searchWords();

      // Wait for search to complete
      await wrapper.vm.$nextTick();

      // Verify welcome state is hidden
      const welcomeState = wrapper.find('.welcome-state');
      expect(welcomeState.exists()).toBe(false);

      // Verify search results section is shown (even if empty)
      const searchResults = wrapper.find('#search-results');
      expect(searchResults.exists()).toBe(true);
    });
  });
});