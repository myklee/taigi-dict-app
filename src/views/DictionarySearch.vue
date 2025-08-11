<template>
  <div id="dictionary-search">
    <!-- Enhanced Search Header -->
    <header class="search-header" role="banner">
      <div class="search-container">
        <!-- Main Search Input -->
        <div class="search-input-wrapper">
          <label for="main-search-input" class="visually-hidden">
            Search dictionary for English, Chinese, or Taiwanese words
          </label>
          <div class="search-input-container">
            <input
              id="main-search-input"
              type="text"
              v-model="searchQuery"
              @keyup.enter="searchWords"
              placeholder="Search English, Chinese, Taiwanese · 中文或英文搜尋"
              class="search-input"
              autocapitalize="off"
              autocomplete="off"
              :disabled="loading"
              :aria-describedby="searchExecuted ? 'search-results-summary' : 'search-instructions'"
              aria-label="Search dictionary for English, Chinese, or Taiwanese words"
            />
            <button
              v-if="searchQuery.length > 0"
              class="clear-search-button"
              @click="clearSearch"
              :disabled="loading"
              aria-label="Clear search input"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div 
              v-if="loading" 
              class="search-loading-indicator"
              role="status"
              aria-label="Searching dictionary"
            >
              <div class="loading-spinner" aria-hidden="true"></div>
            </div>
          </div>
          <div id="search-instructions" class="visually-hidden">
            Enter a word in English, Chinese, or Taiwanese to search across multiple dictionary sources
          </div>
        </div>

        <!-- Search Options -->
        <div class="search-options" role="group" aria-label="Search options">
          <div class="search-options-left">
            <div class="exact-search-container">
              <input
                type="checkbox"
                id="exact-search"
                v-model="exactSearch"
                @change="searchWords"
                :disabled="loading"
                class="exact-search-checkbox"
                aria-describedby="exact-search-description"
              />
              <label for="exact-search" class="exact-search-label">
                Strict search
              </label>
              <div id="exact-search-description" class="visually-hidden">
                When enabled, searches for exact word matches only. When disabled, searches for partial matches.
              </div>
            </div>
          </div>
          
          <div class="search-options-right">
            <button 
              type="button"
              class="search-button" 
              @click="searchWords"
              :disabled="loading || !searchQuery.trim()"
              :aria-label="loading ? 'Searching dictionary...' : `Search dictionary for ${searchQuery || 'entered term'}`"
            >
              <span v-if="!loading">Search</span>
              <span v-else class="search-button-loading">
                <div class="button-spinner" aria-hidden="true"></div>
                Searching...
              </span>
            </button>
          </div>
        </div>

        <!-- Search Status -->
        <div 
          v-if="searchExecuted && !loading" 
          class="search-status"
          role="status"
          aria-live="polite"
        >
          <div 
            id="search-results-summary"
            class="search-results-summary"
            :aria-label="`Search results for ${searchQuery}: ${totalResultsCount} ${totalResultsCount === 1 ? 'result' : 'results'} found`"
          >
            <span class="search-query-display" aria-hidden="true">"{{ searchQuery }}"</span>
            <span class="search-results-count" aria-hidden="true">
              {{ totalResultsCount }} {{ totalResultsCount === 1 ? 'result' : 'results' }} found
            </span>
          </div>
        </div>
      </div>
    </header>


    <!-- Random Word (shown when no search executed) -->
    <RandomWord v-if="dictionaryStore.showRandomWord && !searchExecuted" />

    <!-- Search Results Container -->
    <main 
      class="search-results-container" 
      role="main"
      :aria-label="searchExecuted ? `Search results for ${searchQuery}` : 'Dictionary search'"
      tabindex="-1"
    >
      <!-- Skip to results link for keyboard users -->
      <a href="#search-results" class="skip-link visually-hidden-focusable">
        Skip to search results
      </a>
      
      <!-- Loading State -->
      <div 
        v-if="loading" 
        class="search-loading-state"
        role="status"
        aria-live="polite"
        aria-label="Loading search results from all dictionaries"
      >
        <div class="loading-section" aria-label="Loading Ministry of Education Dictionary results">
          <div class="loading-section-header">
            <LoadingSkeleton variant="title" width="60%" />
            <LoadingSkeleton variant="text" width="20%" />
          </div>
          <div class="loading-cards" role="list" aria-label="Loading placeholders">
            <LoadingSkeleton 
              v-for="i in 3" 
              :key="`moe-${i}`" 
              variant="card" 
              height="180px"
              class="loading-card"
              role="listitem"
              :aria-label="`Loading MOE result ${i} of 3`"
            />
          </div>
        </div>
        
        <div class="loading-section" aria-label="Loading Mary Knoll Dictionary results">
          <div class="loading-section-header">
            <LoadingSkeleton variant="title" width="40%" />
          </div>
          <div class="loading-cards" role="list" aria-label="Loading placeholders">
            <LoadingSkeleton 
              v-for="i in 2" 
              :key="`mknoll-${i}`" 
              variant="card" 
              height="150px"
              class="loading-card"
              role="listitem"
              :aria-label="`Loading Mary Knoll result ${i} of 2`"
            />
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchExecuted" id="search-results">
        <!-- Empty State -->
        <div
          v-if="!hasAnyResults"
          role="status"
          aria-live="polite"
          aria-label="No search results found"
        >
          <EmptyState
            title="No results found"
            :description="`No dictionary entries found for '${searchQuery}'. Try a different search term or check your spelling.`"
            size="large"
            primary-action="Try Different Search"
            secondary-action="Browse Random Words"
            @primary-action="clearSearch"
            @secondary-action="showRandomWord"
          >
            <template #icon>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 6v10"/>
                <path d="M6 11h10"/>
              </svg>
            </template>
          </EmptyState>
        </div>

        <!-- Results Sections -->
        <div 
          v-else 
          class="search-results-sections"
          role="region"
          :aria-label="`Search results for ${searchQuery} from multiple dictionaries`"
        >

          <!-- MOE Search Results -->
          <MoeSearchResults 
            :results="dictionaryStore.searchResults"
            :searchExecuted="searchExecuted"
            :primaryLanguage="detectedLanguage.language"
            :searchQuery="searchQuery"
            :loading="moeLoading"
            :error="moeError"
            @readChinese="readChinese"
            @readEnglish="readEnglish"
            @openEditDialog="openEditDialog"
            @addDefinition="openAddDefinitionDialog"
            @retry="retryMoeSearch"
            @vote-submitted="handleCommunityVoteSubmitted"
            @vote-updated="handleCommunityVoteUpdated"
            @voting-error="handleCommunityVotingError"
            @login-required="handleLoginRequired"
          />

          <!-- Mary Knoll Results -->
          <MknollSearchResults 
            :results="dictionaryStore.mknollResults"
            :primaryLanguage="detectedLanguage.language"
            :searchQuery="searchQuery"
            :loading="mknollLoading"
            :error="mknollError"
            @openEditDialog="openEditDialogMknoll"
            @addDefinition="openAddDefinitionDialog"
            @retry="retryMknollSearch"
            @vote-submitted="handleCommunityVoteSubmitted"
            @vote-updated="handleCommunityVoteUpdated"
            @voting-error="handleCommunityVotingError"
            @login-required="handleLoginRequired"
          />

          <!-- CEDICT Results and Cross-reference -->
          <CedictSearchResults 
            :results="dictionaryStore.cedictResults"
            :crossRefResults="dictionaryStore.crossRefResults"
            :primaryLanguage="detectedLanguage.language"
            :searchQuery="searchQuery"
            :loading="cedictLoading"
            :error="cedictError"
            :crossRefLoading="crossRefLoading"
            :crossRefError="crossRefError"
            @readChinese="readChinese"
            @addDefinition="openAddDefinitionDialog"
            @retry="retryCedictSearch"
            @retry-crossref="retryCrossRefSearch"
          />

         
        </div>
      </div>

      <!-- Welcome State (no search executed) -->
      <div v-else class="welcome-state">
        <EmptyState
          title="Search the Dictionary"
          description="Enter a word in English, Chinese, or Taiwanese to find definitions and pronunciations from multiple dictionary sources."
          size="large"
          primary-action="Browse Random Words"
          @primary-action="showRandomWord"
        >
          <template #icon>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <path d="M8 7h8"/>
              <path d="M8 11h8"/>
              <path d="M8 15h5"/>
            </svg>
          </template>
        </EmptyState>
      </div>
    </main>

    <EditWord
      :visible="showDialog"
      :word="selectedWord"
      @close="closeDialog()"
    />
    <EditWordMknoll
      :visible="showDialogMknoll"
      :word="selectedWordMknoll"
      @close="closeDialogMknoll()"
    />
    <CommunityDefinitionForm
      :visible="showAddDefinitionDialog"
      :word="selectedWordForDefinition"
      @close="closeAddDefinitionDialog"
      @submit="handleDefinitionSubmit"
    />
    
    <!-- Favorites Login Prompt -->
    <FavoritesLoginPrompt />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDictionaryStore } from "@/stores/dictionaryStore";
import { supabase } from "@/supabase";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import { detectSearchLanguage } from "@/utils";
import LoadingSkeleton from "@/components/utility/LoadingSkeleton.vue";
import EmptyState from "@/components/utility/EmptyState.vue";
import EditWord from "./EditWord.vue";
import EditWordMknoll from "./EditWordMknoll.vue";
import RandomWord from "./RandomWord.vue";
import MoeSearchResults from "@/components/search/MoeSearchResults.vue";
import MknollSearchResults from "@/components/search/MknollSearchResults.vue";
import CedictSearchResults from "@/components/search/CedictSearchResults.vue";

import CommunityDefinitionForm from "@/components/CommunityDefinitionForm.vue";
import FavoritesLoginPrompt from "@/components/FavoritesLoginPrompt.vue";

import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCommunityStore } from "@/stores/communityStore";

const route = useRoute();
const router = useRouter();
const dictionaryStore = useDictionaryStore();
const favoritesStore = useFavoritesStore();
const communityStore = useCommunityStore();
const searchQuery = ref("");
const exactSearch = ref(false);
const loading = ref(false);
const searchExecuted = ref(false);
const detectedLanguage = ref({ language: 'unknown', confidence: 0 });
const showDialog = ref(false);
const showDialogMknoll = ref(false);
const showAddDefinitionDialog = ref(false);
const selectedWord = ref(null);
const selectedWordMknoll = ref(null);
const selectedWordForDefinition = ref(null);



// Individual search loading and error states
const moeLoading = ref(false);
const moeError = ref(null);
const mknollLoading = ref(false);
const mknollError = ref(null);
const cedictLoading = ref(false);
const cedictError = ref(null);
const crossRefLoading = ref(false);
const crossRefError = ref(null);

// Computed properties
const totalResultsCount = computed(() => {
  const moeCount = dictionaryStore.searchResults?.length || 0;
  const mknollCount = dictionaryStore.mknollResults?.length || 0;
  const cedictCount = dictionaryStore.cedictResults?.length || 0;
  const crossRefCount = dictionaryStore.crossRefResults?.length || 0;
  
  return moeCount + mknollCount + cedictCount + crossRefCount;
});

const hasAnyResults = computed(() => {
  return totalResultsCount.value > 0;
});

const closeDialog = () => {
  showDialog.value = false;
  document.body.style.overflow = "scroll";
};

const closeDialogMknoll = () => {
  showDialogMknoll.value = false;
  document.body.style.overflow = "scroll";
};

const openEditDialog = (word) => {
  selectedWord.value = word;
  showDialog.value = true;
  document.body.style.overflow = "hidden";
};

const openEditDialogMknoll = (word) => {
  selectedWordMknoll.value = word;
  showDialogMknoll.value = true;
  document.body.style.overflow = "hidden";
};

const openAddDefinitionDialog = (word) => {
  selectedWordForDefinition.value = word;
  showAddDefinitionDialog.value = true;
  document.body.style.overflow = "hidden";
};

const closeAddDefinitionDialog = () => {
  showAddDefinitionDialog.value = false;
  selectedWordForDefinition.value = null;
  document.body.style.overflow = "scroll";
};

const handleDefinitionSubmit = async (definitionData) => {
  try {
    // The form will handle the submission, so we just need to close the dialog
    // and potentially refresh the community results
    closeAddDefinitionDialog();
    
    // Refresh search results to show the new definition
    if (searchQuery.value.trim()) {
      await searchWords();
    }
  } catch (error) {
    console.error('Error handling definition submission:', error);
  }
};

const clearSearch = () => {
  searchQuery.value = "";
  searchWords();
};

const searchWords = async () => {
  if (!searchQuery.value.trim()) {
    searchExecuted.value = false;
    detectedLanguage.value = { language: 'unknown', confidence: 0 };
    // Clear results when search is empty
    await dictionaryStore.setSearchResults([]);
    await dictionaryStore.setMknollResults([]);
    await dictionaryStore.setCedictResults([]);
    await dictionaryStore.setCrossRefCedict([]);
    // Clear error states
    clearAllErrors();
    return;
  }

  loading.value = true;
  searchExecuted.value = true;

  // Clear previous errors
  clearAllErrors();

  // Detect search language
  detectedLanguage.value = detectSearchLanguage(searchQuery.value);

  // Update URL with current search state (without debounce for immediate search)
  updateRouteWithSearchState(searchQuery.value, exactSearch.value);

  try {
    // Add to search history
    await dictionaryStore.addToHistory(searchQuery.value);

    // Determine search pattern based on exactSearch setting
    const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;

    // Execute searches in parallel with individual error handling
    const searchPromises = [
      searchMoeResults(searchPattern),
      searchMknollResults(searchPattern),
      searchCedictResults(searchPattern),
      searchCrossRefResults(searchPattern)
    ];

    await Promise.allSettled(searchPromises);

  } catch (error) {
    console.error("Search error:", error);
  } finally {
    loading.value = false;
  }
};

// Individual search functions with error handling
const searchMoeResults = async (searchPattern) => {
  moeLoading.value = true;
  moeError.value = null;
  
  try {
    const moeSearchQuery = supabase
      .from("words")
      .select(`
        *,
        definitions (
          defid,
          wordid,
          partofspeech,
          def_chinese,
          def_english
        )
      `)
      .or(`chinese.ilike.${searchPattern},english.ilike.${searchPattern},romaji.ilike.${searchPattern}`);

    const { data: moeResults, error } = await moeSearchQuery.limit(50);
    
    if (error) throw error;
    
    // Fetch community definitions for each MOE result
    const resultsWithCommunity = await Promise.all(
      (moeResults || []).map(async (word) => {
        try {
          const communityDefs = await fetchCommunityDefinitionsForWord(word.id.toString());
          return {
            ...word,
            communityDefinitions: communityDefs
          };
        } catch (error) {
          console.error(`Error fetching community definitions for MOE word ${word.id}:`, error);
          return {
            ...word,
            communityDefinitions: []
          };
        }
      })
    );
    
    await dictionaryStore.setSearchResults(resultsWithCommunity);
  } catch (error) {
    console.error("MOE search error:", error);
    moeError.value = error.message || "Failed to search MOE dictionary";
    await dictionaryStore.setSearchResults([]);
  } finally {
    moeLoading.value = false;
  }
};

const searchMknollResults = async (searchPattern) => {
  mknollLoading.value = true;
  mknollError.value = null;
  
  try {
    const mknollSearchQuery = supabase
      .from("maryknoll")
      .select("*")
      .or(`taiwanese.ilike.${searchPattern},chinese.ilike.${searchPattern},english_mknoll.ilike.${searchPattern}`);

    const { data: mknollResults, error } = await mknollSearchQuery.limit(20);
    
    if (error) throw error;
    
    // Fetch community definitions for each Mary Knoll result
    // Use a combination of the word fields as the word_id for community definitions
    const resultsWithCommunity = await Promise.all(
      (mknollResults || []).map(async (word) => {
        // Try to match community definitions using chinese, taiwanese, or english fields
        const searchTerms = [word.chinese, word.taiwanese, word.english_mknoll]
          .filter(Boolean)
          .join(' ');
        
        let communityDefs = [];
        if (searchTerms && searchTerms.trim()) {
          try {
            // Limit search term length and clean it
            const cleanSearchTerm = searchTerms.trim().substring(0, 100);
            
            console.log('Searching community definitions with term:', cleanSearchTerm);
            
            const result = await communityStore.searchDefinitions({
              searchTerm: cleanSearchTerm,
              status: ['approved'],
              sortBy: 'score',
              sortOrder: 'desc',
              limit: 3,
              offset: 0
            });
            communityDefs = result.success ? result.data : [];
          } catch (error) {
            console.error('Error fetching community definitions for Mary Knoll word:', error);
            console.error('Search terms were:', searchTerms);
            communityDefs = [];
          }
        }
        
        return {
          ...word,
          communityDefinitions: communityDefs
        };
      })
    );
    
    await dictionaryStore.setMknollResults(resultsWithCommunity);
  } catch (error) {
    console.error("Mary Knoll search error:", error);
    mknollError.value = error.message || "Failed to search Mary Knoll dictionary";
    await dictionaryStore.setMknollResults([]);
  } finally {
    mknollLoading.value = false;
  }
};

const searchCedictResults = async (searchPattern) => {
  cedictLoading.value = true;
  cedictError.value = null;
  
  try {
    const cedictSearchQuery = supabase
      .from("cedict")
      .select("*")
      .or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern},english_cedict.ilike.${searchPattern}`);

    const { data: cedictResults, error } = await cedictSearchQuery.limit(20);
    
    if (error) throw error;
    
    await dictionaryStore.setCedictResults(cedictResults || []);
  } catch (error) {
    console.error("CEDICT search error:", error);
    cedictError.value = error.message || "Failed to search CEDICT dictionary";
    await dictionaryStore.setCedictResults([]);
  } finally {
    cedictLoading.value = false;
  }
};

const searchCrossRefResults = async (searchPattern) => {
  crossRefLoading.value = true;
  crossRefError.value = null;
  
  try {
    const crossRefQuery = supabase
      .from("cedict")
      .select("*")
      .or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern}`)
      .limit(10);

    const { data: crossRefData, error } = await crossRefQuery;
    
    if (error) throw error;
    
    await dictionaryStore.setCrossRefCedict(crossRefData || []);
  } catch (error) {
    console.error("Cross-reference search error:", error);
    crossRefError.value = error.message || "Failed to load cross-references";
    await dictionaryStore.setCrossRefCedict([]);
  } finally {
    crossRefLoading.value = false;
  }
};

// Helper function to fetch community definitions for a specific word
const fetchCommunityDefinitionsForWord = async (wordId) => {
  try {
    const result = await communityStore.fetchDefinitionsForWord(wordId, {
      status: ['approved'], // Only show approved definitions in search results
      sortBy: 'vote_score',
      sortOrder: 'desc',
      limit: 5 // Limit to top 5 community definitions per word
    });
    
    return result.success ? result.data : [];
  } catch (error) {
    console.error(`Failed to fetch community definitions for word ${wordId}:`, error);
    return [];
  }
};

const clearAllErrors = () => {
  moeError.value = null;
  mknollError.value = null;
  cedictError.value = null;
  crossRefError.value = null;
};

// Retry functions
const retryMoeSearch = async () => {
  if (!searchQuery.value.trim()) return;
  const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;
  await searchMoeResults(searchPattern);
};

const retryMknollSearch = async () => {
  if (!searchQuery.value.trim()) return;
  const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;
  await searchMknollResults(searchPattern);
};

const retryCedictSearch = async () => {
  if (!searchQuery.value.trim()) return;
  const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;
  await searchCedictResults(searchPattern);
};

const retryCrossRefSearch = async () => {
  if (!searchQuery.value.trim()) return;
  const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;
  await searchCrossRefResults(searchPattern);
};



const handleCommunityVoteSubmitted = (voteData) => {
  console.log('Community vote submitted:', voteData);
  // The vote update will be handled by real-time subscriptions
};

const handleCommunityVoteUpdated = (voteData) => {
  console.log('Community vote updated:', voteData);
  // Update local community results if needed
  const definition = communityResults.value.find(def => def.id === voteData.definitionId);
  if (definition) {
    definition.voteScore = voteData.voteScore;
    definition.upvotes = voteData.upvotes;
    definition.downvotes = voteData.downvotes;
    definition.userVote = voteData.userVote;
  }
};

const handleCommunityVotingError = (error) => {
  console.error('Community voting error:', error);
  // Could show a toast notification here
};

const handleLoginRequired = () => {
  console.log('Login required for community features');
  // Could trigger login modal here
};

const readChinese = async (text) => {
  speakChinese(text);
};

const readEnglish = async (text) => {
  speakEnglish(text);
};

const showRandomWord = () => {
  dictionaryStore.showRandomWord = true;
  // Clear search to show random word
  searchQuery.value = "";
  searchExecuted.value = false;
};


// Load data on mount
onMounted(async () => {
  await dictionaryStore.loadFromIndexedDB();
  await dictionaryStore.loadSearchHistoryFromSupabase();
  await favoritesStore.loadFromIndexedDB();
  await favoritesStore.loadFromSupabase();
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (updateRouteTimeout) {
    clearTimeout(updateRouteTimeout);
  }
});

// Initialize search query and options from route
onMounted(() => {
  // Initialize from route params
  if (route.params.query) {
    searchQuery.value = route.params.query;
  }
  
  // Initialize from query parameters
  if (route.query.q) {
    searchQuery.value = route.query.q;
  }
  
  if (route.query.exact !== undefined) {
    exactSearch.value = route.query.exact === 'true';
  }
  
  // Perform search if there's a query
  if (searchQuery.value.trim()) {
    searchWords();
  }
});

// Watch for route changes (both params and query)
watch(() => [route.params.query, route.query.q, route.query.exact], ([newParamQuery, newQueryQ, newExact]) => {
  const newQuery = newParamQuery || newQueryQ || '';
  const newExactSearch = newExact === 'true';
  
  let shouldSearch = false;
  
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery;
    shouldSearch = true;
  }
  
  if (newExactSearch !== exactSearch.value) {
    exactSearch.value = newExactSearch;
    shouldSearch = true;
  }
  
  if (shouldSearch && newQuery.trim()) {
    searchWords();
  }
});

// Watch for search query changes and update route
watch([searchQuery, exactSearch], ([newQuery, newExact]) => {
  // Debounce URL updates to avoid too many navigation calls
  clearTimeout(updateRouteTimeout);
  updateRouteTimeout = setTimeout(() => {
    updateRouteWithSearchState(newQuery, newExact);
  }, 300);
});

let updateRouteTimeout = null;

const updateRouteWithSearchState = (query, exact) => {
  if (!query.trim()) {
    searchExecuted.value = false;
    // Navigate to dictionary route without query
    if (route.name === 'search' || route.query.q) {
      router.push({ name: 'dictionary' });
    }
  } else {
    // Build query parameters
    const queryParams = { q: query };
    if (exact) {
      queryParams.exact = 'true';
    }
    
    // Update route with search query and options
    const currentQuery = route.query.q || route.params.query || '';
    const currentExact = route.query.exact === 'true';
    
    if (currentQuery !== query || currentExact !== exact) {
      router.push({ 
        name: 'search', 
        params: { query }, // Keep param for backward compatibility
        query: queryParams 
      });
    }
  }
};
</script>

<style scoped>
/* Enhanced Search Header */
.search-header {
  background: linear-gradient(135deg, var(--raisinBlack) 0%, var(--gunmetal) 100%);
  border-bottom: 1px solid var(--slateGray);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
}

/* Mobile-first responsive container */
@media (max-width: 767px) {
  .search-container {
    padding: var(--space-3) var(--space-4);
  }
}

@media (min-width: 768px) {
  .search-container {
    padding: var(--space-6) var(--space-6);
  }
}

@media (min-width: 1024px) {
  .search-container {
    padding: var(--space-8) var(--space-8);
  }
}

/* Search Input */
.search-input-wrapper {
  margin-bottom: var(--space-4);
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--black);
  border: 2px solid var(--gunmetal);
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  overflow: hidden;
}

.search-input-container:focus-within {
  border-color: var(--slateGray);
  box-shadow: 0 0 0 3px rgba(110, 131, 160, 0.1);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: var(--space-4) var(--space-4);
  font-size: var(--font-size-lg);
  color: var(--white);
  outline: none;
  min-height: var(--touch-target-comfortable);
}

.search-input::placeholder {
  color: var(--frenchGray);
  opacity: 0.8;
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-search-button {
  position: absolute;
  right: var(--space-3);
  background: transparent;
  border: none;
  color: var(--frenchGray);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}

.clear-search-button:hover:not(:disabled) {
  color: var(--white);
  background: var(--gunmetal);
}

.clear-search-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search-loading-indicator {
  position: absolute;
  right: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gunmetal);
  border-top: 2px solid var(--slateGray);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Search Options */
.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-options-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.search-options-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Mobile-optimized search options */
@media (max-width: 767px) {
  .search-options {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .search-options-left {
    justify-content: center;
    gap: var(--space-3);
  }
  
  .search-options-right {
    justify-content: center;
    gap: var(--space-4);
  }
  
  .search-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .search-options {
    gap: var(--space-6);
  }
  
  .search-options-left {
    gap: var(--space-6);
  }
}

.exact-search-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.exact-search-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--slateGray);
  cursor: pointer;
}

.exact-search-checkbox:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.exact-search-label {
  color: var(--frenchGray);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.search-button {
  background: var(--slateGray);
  color: var(--white);
  border: 1px solid var(--slateGray);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  min-height: var(--touch-target-min);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search-button:hover:not(:disabled) {
  background: var(--frenchGray);
  border-color: var(--frenchGray);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.search-button-loading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Search Status */
.search-status {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gunmetal);
}

.search-results-summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.search-query-display {
  color: var(--white);
  font-weight: 600;
  font-size: var(--font-size-base);
}

.search-results-count {
  color: var(--frenchGray);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* Search Results Container */
.search-results-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  min-height: 400px;
}

/* Mobile-first responsive results container */
@media (max-width: 767px) {
  .search-results-container {
    padding: var(--space-4) var(--space-3);
    min-height: 300px;
  }
}

@media (min-width: 768px) {
  .search-results-container {
    padding: var(--space-8) var(--space-6);
  }
}

@media (min-width: 1024px) {
  .search-results-container {
    padding: var(--space-10) var(--space-8);
  }
}

/* Loading States */
.search-loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.loading-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.loading-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.loading-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.loading-card {
  border-radius: var(--radius-lg);
}

/* Search Results Sections */
.search-results-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Mobile-optimized results sections */
@media (max-width: 767px) {
  .search-results-sections {
    gap: var(--space-8);
  }
  
  /* Add collapsible sections for mobile */
  .search-results-sections > * {
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
}

@media (min-width: 768px) {
  .search-results-sections {
    gap: var(--space-10);
  }
}

/* Mobile section headers with collapsible functionality */
@media (max-width: 767px) {
  .mobile-section-toggle {
    background: var(--surface-background-hover);
    border: none;
    width: 100%;
    padding: var(--space-4);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: var(--transition-colors);
    min-height: var(--touch-target-comfortable);
  }
  
  .mobile-section-toggle:hover {
    background: var(--gunmetal);
  }
  
  .mobile-section-toggle:active {
    background: var(--slateGray);
  }
  
  .mobile-section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    text-align: left;
  }
  
  .mobile-section-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    background: var(--surface-background);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    margin-left: var(--space-2);
  }
  
  .mobile-section-icon {
    transition: transform var(--transition-normal);
    color: var(--color-secondary);
    margin-left: auto;
  }
  
  .mobile-section-icon.expanded {
    transform: rotate(180deg);
  }
  
  .mobile-section-content {
    background: var(--surface-background);
    border-top: 1px solid var(--surface-border);
  }
  
  .mobile-section-content.collapsed {
    display: none;
  }
}

/* Welcome State */
.welcome-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .search-container {
    padding: var(--space-3);
  }

  .search-input {
    font-size: var(--font-size-base);
    padding: var(--space-3);
  }

  .search-input::placeholder {
    font-size: var(--font-size-sm);
  }

  .search-options {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .search-options-left,
  .search-options-right {
    justify-content: center;
  }

  .search-button {
    width: 100%;
    justify-content: center;
    padding: var(--space-4) var(--space-6);
  }

  .search-results-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .search-results-container {
    padding: var(--space-4) var(--space-3);
  }

  .loading-cards {
    gap: var(--space-3);
  }
}

@media (max-width: 480px) {
  .search-container {
    padding: var(--space-2);
  }

  .search-input-wrapper {
    margin-bottom: var(--space-3);
  }

  .search-input {
    padding: var(--space-3) var(--space-3);
    font-size: var(--font-size-sm);
  }

  .exact-search-label {
    font-size: var(--font-size-xs);
  }

  .search-button {
    font-size: var(--font-size-sm);
    padding: var(--space-3) var(--space-4);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .search-input-container {
    border-width: 3px;
  }

  .search-button {
    border-width: 2px;
    font-weight: 700;
  }

  .exact-search-label {
    font-weight: 600;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .button-spinner {
    animation: none;
  }

  .search-input-container,
  .search-button,
  .clear-search-button {
    transition: none;
  }
}

/* Focus Styles for Accessibility */
.search-input:focus,
.exact-search-checkbox:focus,
.search-button:focus,
.clear-search-button:focus {
  outline: 2px solid var(--slateGray);
  outline-offset: 2px;
}

/* Print Styles */
@media print {
  .search-header {
    position: static;
    background: none;
    border-bottom: 2px solid #000;
  }

  .search-loading-state,
  .loading-spinner,
  .button-spinner {
    display: none;
  }
}
</style> 