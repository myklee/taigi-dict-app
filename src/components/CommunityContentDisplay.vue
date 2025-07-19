<template>
  <div class="community-content-display">
    <!-- Filters Component -->
    <CommunityContentFilters
      :filters="currentFilters"
      :status-counts="statusCounts"
      :popular-tags="popularTags"
      :results-count="filteredDefinitions.length"
      :hide-threshold="hideThreshold"
      @filters-changed="handleFiltersChanged"
      @filters-cleared="handleFiltersCleared"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Loading community content...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 8v4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 16h.01"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <h3 class="error-title">Failed to load community content</h3>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="fetchDefinitions">
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredDefinitions.length === 0" class="empty-container">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <h3 class="empty-title">
        {{ hasActiveFilters ? 'No matching definitions found' : 'No community definitions yet' }}
      </h3>
      <p class="empty-message">
        {{ hasActiveFilters 
          ? 'Try adjusting your filters to see more results.' 
          : 'Be the first to contribute a community definition for this word!' 
        }}
      </p>
      <button 
        v-if="hasActiveFilters"
        class="clear-filters-button"
        @click="handleFiltersCleared"
      >
        Clear Filters
      </button>
    </div>

    <!-- Community Definitions List -->
    <div v-else class="definitions-list">
      <!-- Hidden Content Notice -->
      <div v-if="hiddenCount > 0" class="hidden-notice">
        <p class="hidden-text">
          {{ hiddenCount }} {{ hiddenCount === 1 ? 'definition' : 'definitions' }} 
          hidden due to low scores.
        </p>
        <button 
          class="show-hidden-button"
          @click="showHiddenContent = !showHiddenContent"
        >
          {{ showHiddenContent ? 'Hide' : 'Show' }} Hidden Content
        </button>
      </div>

      <!-- Definition Cards -->
      <div class="definitions-grid">
        <CommunityDefinitionCard
          v-for="definition in visibleDefinitions"
          :key="definition.id"
          :definition="definition"
          :hide-threshold="hideThreshold"
          @vote-submitted="handleVoteSubmitted"
          @vote-updated="handleVoteUpdated"
          @login-required="$emit('login-required')"
          @voting-error="handleVotingError"
        />
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-container">
        <button 
          class="load-more-button"
          @click="loadMore"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore" class="loading-spinner"></span>
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import CommunityContentFilters from '@/components/CommunityContentFilters.vue';
import CommunityDefinitionCard from '@/components/cards/CommunityDefinitionCard.vue';

const props = defineProps({
  wordId: {
    type: String,
    default: null
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  },
  hideThreshold: {
    type: Number,
    default: -5
  },
  pageSize: {
    type: Number,
    default: 20
  }
});

const emit = defineEmits([
  'login-required',
  'definitions-loaded',
  'vote-updated',
  'error'
]);

// Store instances
const communityStore = useCommunityStore();
const authStore = useAuthStore();

// Local state
const loading = ref(false);
const loadingMore = ref(false);
const error = ref(null);
const showHiddenContent = ref(false);
const currentPage = ref(0);
const hasMore = ref(true);

// Filter state
const currentFilters = ref({
  sortBy: 'score',
  sortOrder: 'desc',
  status: ['approved'],
  minScore: null,
  maxScore: null,
  tags: [],
  hideLowScored: true,
  ...props.initialFilters
});

// Definitions data
const allDefinitions = ref([]);
const popularTags = ref([]);
const statusCounts = ref({
  approved: 0,
  pending: 0,
  rejected: 0,
  hidden: 0
});

// Real-time subscription cleanup
let unsubscribeRealtime = null;

// Computed properties
const filteredDefinitions = computed(() => {
  let filtered = [...allDefinitions.value];

  // Apply status filter
  if (currentFilters.value.status.length > 0) {
    filtered = filtered.filter(def => 
      currentFilters.value.status.includes(def.status)
    );
  }

  // Apply score range filters
  if (currentFilters.value.minScore !== null) {
    filtered = filtered.filter(def => 
      def.voteScore >= currentFilters.value.minScore
    );
  }

  if (currentFilters.value.maxScore !== null) {
    filtered = filtered.filter(def => 
      def.voteScore <= currentFilters.value.maxScore
    );
  }

  // Apply tags filter
  if (currentFilters.value.tags.length > 0) {
    filtered = filtered.filter(def => 
      currentFilters.value.tags.some(tag => 
        def.tags.some(defTag => 
          defTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (currentFilters.value.sortBy) {
      case 'score':
        comparison = b.voteScore - a.voteScore;
        break;
      case 'date':
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
        break;
      case 'votes':
        const aTotalVotes = (a.upvotes || 0) + (a.downvotes || 0);
        const bTotalVotes = (b.upvotes || 0) + (b.downvotes || 0);
        comparison = bTotalVotes - aTotalVotes;
        break;
      default:
        comparison = b.voteScore - a.voteScore;
    }

    return currentFilters.value.sortOrder === 'asc' ? -comparison : comparison;
  });

  return filtered;
});

const visibleDefinitions = computed(() => {
  if (!currentFilters.value.hideLowScored && !showHiddenContent.value) {
    return filteredDefinitions.value;
  }

  const visible = filteredDefinitions.value.filter(def => {
    if (currentFilters.value.hideLowScored && def.voteScore <= props.hideThreshold) {
      return showHiddenContent.value;
    }
    return true;
  });

  return visible;
});

const hiddenCount = computed(() => {
  if (!currentFilters.value.hideLowScored) return 0;
  
  return filteredDefinitions.value.filter(def => 
    def.voteScore <= props.hideThreshold
  ).length;
});

const hasActiveFilters = computed(() => {
  const defaults = {
    sortBy: 'score',
    sortOrder: 'desc',
    status: ['approved'],
    minScore: null,
    maxScore: null,
    tags: [],
    hideLowScored: true
  };

  return (
    currentFilters.value.sortBy !== defaults.sortBy ||
    currentFilters.value.sortOrder !== defaults.sortOrder ||
    JSON.stringify(currentFilters.value.status) !== JSON.stringify(defaults.status) ||
    currentFilters.value.minScore !== defaults.minScore ||
    currentFilters.value.maxScore !== defaults.maxScore ||
    currentFilters.value.tags.length > 0 ||
    currentFilters.value.hideLowScored !== defaults.hideLowScored
  );
});

// Methods
async function fetchDefinitions(reset = false) {
  try {
    if (reset) {
      currentPage.value = 0;
      allDefinitions.value = [];
    }

    loading.value = reset;
    loadingMore.value = !reset;
    error.value = null;

    const searchFilters = {
      ...currentFilters.value,
      wordId: props.wordId,
      limit: props.pageSize,
      offset: currentPage.value * props.pageSize
    };

    const result = props.wordId 
      ? await communityStore.fetchDefinitionsForWord(props.wordId, searchFilters)
      : await communityStore.searchDefinitions(searchFilters);

    if (result.success) {
      if (reset) {
        allDefinitions.value = result.data;
      } else {
        allDefinitions.value.push(...result.data);
      }

      hasMore.value = result.data.length === props.pageSize;
      currentPage.value++;

      // Update status counts and popular tags
      await updateMetadata();

      emit('definitions-loaded', {
        definitions: result.data,
        total: allDefinitions.value.length,
        hasMore: hasMore.value
      });
    } else {
      throw new Error(result.error?.message || 'Failed to fetch definitions');
    }
  } catch (err) {
    console.error('Failed to fetch definitions:', err);
    error.value = err.message;
    emit('error', err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

async function updateMetadata() {
  try {
    // Calculate status counts
    const counts = { approved: 0, pending: 0, rejected: 0, hidden: 0 };
    allDefinitions.value.forEach(def => {
      counts[def.status] = (counts[def.status] || 0) + 1;
    });
    statusCounts.value = counts;

    // Extract popular tags
    const tagFrequency = {};
    allDefinitions.value.forEach(def => {
      def.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    popularTags.value = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  } catch (err) {
    console.error('Failed to update metadata:', err);
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  await fetchDefinitions(false);
}

function handleFiltersChanged(newFilters) {
  currentFilters.value = { ...newFilters };
  fetchDefinitions(true);
}

function handleFiltersCleared() {
  currentFilters.value = {
    sortBy: 'score',
    sortOrder: 'desc',
    status: ['approved'],
    minScore: null,
    maxScore: null,
    tags: [],
    hideLowScored: true
  };
  fetchDefinitions(true);
}

function handleVoteSubmitted(voteData) {
  // Update local definition with optimistic update
  const definition = allDefinitions.value.find(def => def.id === voteData.definitionId);
  if (definition) {
    // The vote update will be handled by the real-time subscription
    // but we can emit the event for parent components
    emit('vote-updated', voteData);
  }
}

function handleVoteUpdated(voteData) {
  // Update local definition with real-time data
  const definition = allDefinitions.value.find(def => def.id === voteData.definitionId);
  if (definition) {
    definition.voteScore = voteData.voteScore;
    definition.upvotes = voteData.upvotes;
    definition.downvotes = voteData.downvotes;
    definition.userVote = voteData.userVote;
  }
  
  emit('vote-updated', voteData);
}

function handleVotingError(error) {
  console.error('Voting error:', error);
  emit('error', new Error(`Voting failed: ${error}`));
}

// Real-time updates handler
function handleRealtimeUpdate(payload) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  switch (eventType) {
    case 'INSERT':
      // Add new definition if it matches current filters
      if (shouldIncludeDefinition(newRecord)) {
        allDefinitions.value.unshift(transformDefinition(newRecord));
        updateMetadata();
      }
      break;
      
    case 'UPDATE':
      // Update existing definition
      const index = allDefinitions.value.findIndex(def => def.id === newRecord.id);
      if (index !== -1) {
        allDefinitions.value[index] = {
          ...allDefinitions.value[index],
          ...transformDefinition(newRecord)
        };
      }
      break;
      
    case 'DELETE':
      // Remove deleted definition
      const deleteIndex = allDefinitions.value.findIndex(def => def.id === oldRecord.id);
      if (deleteIndex !== -1) {
        allDefinitions.value.splice(deleteIndex, 1);
        updateMetadata();
      }
      break;
  }
}

function shouldIncludeDefinition(definition) {
  // Check if definition matches current word filter
  if (props.wordId && definition.word_id !== props.wordId) {
    return false;
  }
  
  // Check if definition matches current status filter
  if (!currentFilters.value.status.includes(definition.status)) {
    return false;
  }
  
  return true;
}

function transformDefinition(rawDefinition) {
  return {
    ...rawDefinition,
    createdAt: new Date(rawDefinition.created_at),
    updatedAt: new Date(rawDefinition.updated_at),
    voteScore: rawDefinition.vote_score || 0,
    authorReputation: rawDefinition.author_reputation || 0
  };
}

// Watch for word changes
watch(() => props.wordId, () => {
  fetchDefinitions(true);
});

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    // Refresh to include user-specific data like votes
    fetchDefinitions(true);
  }
});

// Lifecycle hooks
onMounted(async () => {
  await fetchDefinitions(true);
  
  // Set up real-time subscription
  unsubscribeRealtime = communityStore.onDefinitionUpdate(handleRealtimeUpdate);
});

onUnmounted(() => {
  // Clean up real-time subscription
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
  }
});
</script>

<style scoped>
.community-content-display {
  width: 100%;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--slateGray);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--frenchGray);
  font-size: 0.875rem;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.error-icon {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.error-title {
  color: var(--white);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--frenchGray);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  border: 1px solid #3498db;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #2980b9;
  border-color: #2980b9;
}

/* Empty State */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  color: var(--frenchGray);
  margin-bottom: 1rem;
}

.empty-title {
  color: var(--white);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.empty-message {
  color: var(--frenchGray);
  margin-bottom: 1.5rem;
  line-height: 1.5;
  max-width: 400px;
}

.clear-filters-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid #3498db;
  border-radius: 0.5rem;
  color: #3498db;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-button:hover {
  background: rgba(52, 152, 219, 0.1);
}

/* Definitions List */
.definitions-list {
  width: 100%;
}

/* Hidden Content Notice */
.hidden-notice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.hidden-text {
  color: #e74c3c;
  font-size: 0.875rem;
  margin: 0;
}

.show-hidden-button {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid #e74c3c;
  border-radius: 0.375rem;
  color: #e74c3c;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-hidden-button:hover {
  background: rgba(231, 76, 60, 0.1);
}

/* Definitions Grid */
.definitions-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.load-more-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.5rem;
  color: var(--white);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-button:hover:not(:disabled) {
  background: var(--frenchGray);
  border-color: var(--white);
}

.load-more-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--slateGray);
  border-top: 2px solid var(--white);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .hidden-notice {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .show-hidden-button {
    align-self: center;
  }

  .empty-container,
  .error-container,
  .loading-container {
    padding: 2rem 1rem;
  }
}

/* Focus styles for accessibility */
.retry-button:focus-visible,
.clear-filters-button:focus-visible,
.show-hidden-button:focus-visible,
.load-more-button:focus-visible {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .loading-spinner {
    animation: none;
  }
}
</style>