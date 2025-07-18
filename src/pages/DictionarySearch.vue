<template>
  <Loader :loading="loading" />
  <div id="dictionary-search">
    <section class="search-header">
      <div class="search-words">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="searchWords"
          placeholder="Search English, Chinese, Taiwanese · 中文或英文搜尋"
          class="text-field search-words-text-field"
          autocapitalize="off"
        />
        <button
          v-if="searchQuery.length > 0"
          class="clear-search"
          @click="clearSearch"
        >
          <span class="visually-hidden">Clear</span>
        </button>
      </div>
      <div class="search-options">
        <div class="exact-search-container">
          <input
            type="checkbox"
            id="exact-search"
            v-model="exactSearch"
            @change="searchWords"
          />
          <label for="exact-search">Strict search</label>
        </div>
        <div class="search-actions">
          <button class="search-button" @click="searchWords">Search</button>
        </div>
      </div>
    </section>


    <RandomWord v-if="dictionaryStore.showRandomWord" />

    <!-- moe search results -->
    <MoeSearchResults 
      :results="dictionaryStore.searchResults"
      :searchExecuted="searchExecuted"
      @readChinese="readChinese"
      @readEnglish="readEnglish"
      @openEditDialog="openEditDialog"
    />

    <!-- mknoll results -->
    <MknollSearchResults 
      :results="dictionaryStore.mknollResults"
      @openEditDialog="openEditDialogMknoll"
    />

    <!-- cedict results and cross-reference -->
    <CedictSearchResults 
      :results="dictionaryStore.cedictResults"
      :crossRefResults="dictionaryStore.crossRefResults"
      @readChinese="readChinese"
    />

    <!-- community search results -->
    <CommunitySearchResults 
      :results="communityResults"
      :search-query="searchQuery"
      :search-executed="searchExecuted"
      :loading="communityLoading"
      :loading-more="communityLoadingMore"
      :error="communityError"
      :has-more="communityHasMore"
      @vote-submitted="handleCommunityVoteSubmitted"
      @vote-updated="handleCommunityVoteUpdated"
      @voting-error="handleCommunityVotingError"
      @login-required="handleLoginRequired"
      @load-more="loadMoreCommunityResults"
      @retry="searchCommunityDefinitions"
    />

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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useDictionaryStore } from "@/stores/dictionaryStore";
import { supabase } from "@/supabase";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import Loader from "@/components/utility/Loader.vue";
import EditWord from "./EditWord.vue";
import EditWordMknoll from "./EditWordMknoll.vue";
import RandomWord from "./RandomWord.vue";
import MoeSearchResults from "@/components/search/MoeSearchResults.vue";
import MknollSearchResults from "@/components/search/MknollSearchResults.vue";
import CedictSearchResults from "@/components/search/CedictSearchResults.vue";
import CommunitySearchResults from "@/components/search/CommunitySearchResults.vue";

import { useFavoritesStore } from "@/stores/favoritesStore";
import { useCommunityStore } from "@/stores/communityStore";
const dictionaryStore = useDictionaryStore();
const favoritesStore = useFavoritesStore();
const communityStore = useCommunityStore();
const searchQuery = ref("");
const exactSearch = ref(false);
const loading = ref(false);
const searchExecuted = ref(false);
const showDialog = ref(false);
const showDialogMknoll = ref(false);
const selectedWord = ref(null);
const selectedWordMknoll = ref(null);

// Community search state
const communityResults = ref([]);
const communityLoading = ref(false);
const communityLoadingMore = ref(false);
const communityError = ref(null);
const communityHasMore = ref(false);

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

const clearSearch = () => {
  searchQuery.value = "";
  searchWords();
};

const searchWords = async () => {
  if (!searchQuery.value.trim()) {
    searchExecuted.value = false;
    return;
  }

  loading.value = true;
  searchExecuted.value = true;

  try {
    // Add to search history
    await dictionaryStore.addToHistory(searchQuery.value);

    // Determine search pattern based on exactSearch setting
    const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;

    // Build search queries - search all fields
    let moeSearchQuery = supabase
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

    let mknollSearchQuery = supabase
      .from("maryknoll")
      .select("*")
      .or(`taiwanese.ilike.${searchPattern},chinese.ilike.${searchPattern},english_mknoll.ilike.${searchPattern}`);

    let cedictSearchQuery = supabase
      .from("cedict")
      .select("*")
      .or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern},english_cedict.ilike.${searchPattern}`);

    // Execute searches
    const { data: moeResults, error: moeError } = await moeSearchQuery.limit(50);
    if (moeError) throw moeError;

    const { data: mknollResults, error: mknollError } = await mknollSearchQuery.limit(20);
    if (mknollError) throw mknollError;

    const { data: cedictResults, error: cedictError } = await cedictSearchQuery.limit(20);
    if (cedictError) throw cedictError;

    // Cross-reference search
    const { data: crossRefData, error: crossRefError } = await supabase
      .from("cedict")
      .select("*")
      .or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern}`)
      .limit(10);
    
    if (crossRefError) throw crossRefError;
    const crossRefResults = crossRefData || [];

    // Update store
    await dictionaryStore.setSearchResults(moeResults || []);
    await dictionaryStore.setMknollResults(mknollResults || []);
    await dictionaryStore.setCedictResults(cedictResults || []);
    await dictionaryStore.setCrossRefCedict(crossRefResults);

    // Search community definitions
    await searchCommunityDefinitions();

  } catch (error) {
    console.error("Search error:", error);
  } finally {
    loading.value = false;
  }
};

// Community search functionality
const searchCommunityDefinitions = async (loadMore = false) => {
  if (!searchQuery.value.trim()) {
    communityResults.value = [];
    return;
  }

  try {
    if (loadMore) {
      communityLoadingMore.value = true;
    } else {
      communityLoading.value = true;
      communityResults.value = [];
    }
    
    communityError.value = null;

    // Create search filters for community content
    const searchFilters = {
      sortBy: 'score',
      sortOrder: 'desc',
      status: ['approved'], // Only show approved content in search results
      limit: 10,
      offset: loadMore ? communityResults.value.length : 0
    };

    // Search community definitions using the search term
    const result = await communityStore.searchDefinitions({
      ...searchFilters,
      searchTerm: searchQuery.value // Add search term to filters
    });

    if (result.success) {
      if (loadMore) {
        communityResults.value.push(...result.data);
      } else {
        communityResults.value = result.data;
      }
      
      communityHasMore.value = result.data.length === searchFilters.limit;
    } else {
      throw new Error(result.error?.message || 'Failed to search community definitions');
    }
  } catch (error) {
    console.error('Community search error:', error);
    communityError.value = error.message;
  } finally {
    communityLoading.value = false;
    communityLoadingMore.value = false;
  }
};

// Community event handlers
const loadMoreCommunityResults = async () => {
  if (!communityHasMore.value || communityLoadingMore.value) return;
  await searchCommunityDefinitions(true);
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


// Load data on mount
onMounted(async () => {
  await dictionaryStore.loadFromIndexedDB();
  await dictionaryStore.loadSearchHistoryFromSupabase();
  await favoritesStore.loadFromIndexedDB();
  await favoritesStore.loadFromSupabase();
});

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchExecuted.value = false;
  }
});
</script>

<style scoped>
/*

search

*/

.search-header {
  background-color: var(--raisinBlack);
}
.search-words {
  position: relative;
  padding: 0 5vw;
}
.search-words-text-field {
  width: 100%;
  border: none;
  border-bottom: 3px solid;
  padding: 1rem;
  background-color: transparent;
}
.clear-search {
  position: absolute;
  right: calc(5vw);
  background-color: transparent;
  color: var(--frenchGray);
  &:hover {
    color: white;
  }
  &::after {
    display: block;
    content: "+";
    font-size: 2.5rem;
    transform: rotate(45deg);
  }
}
.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  flex-wrap: wrap;
  gap: 1rem;
}
.reset-voice {
  justify-self: end;
}


/*

exact search checkbox

*/

.exact-search-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-right: 1rem;
  padding: 1rem;
  padding-left: 0;
  label {
    white-space: nowrap;
  }
}
.search-history {
  padding: 0 5vw 5vw;
}
.search-history-header {
  display: flex;
  align-items: center;
}



/* 

admin

*/
.admin {
  padding: 5vw;
}

</style> 