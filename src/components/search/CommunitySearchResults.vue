<template>
  <section v-if="shouldShowResults" class="community-search-results">
    <!-- Section Header -->
    <div class="section-header">
      <h2 class="section-title">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="community-icon"
        >
          <path
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            fill="currentColor"
          />
          <path
            d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z"
            fill="currentColor"
          />
          <path
            d="M5 15L5.5 17L7 17.5L5.5 18L5 20L4.5 18L3 17.5L4.5 17L5 15Z"
            fill="currentColor"
          />
        </svg>
        Community Definitions
      </h2>
      <div class="results-count">
        {{ visibleResults.length }} {{ visibleResults.length === 1 ? 'result' : 'results' }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <span class="loading-text">Loading community definitions...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <span class="error-text">Failed to load community definitions</span>
      <button class="retry-button" @click="$emit('retry')">
        Retry
      </button>
    </div>

    <!-- Results List -->
    <div v-else-if="visibleResults.length > 0" class="results-list">
      <!-- High-Quality Results (Score > 5) -->
      <div v-if="highQualityResults.length > 0" class="high-quality-results">
        <CommunityDefinitionCard
          v-for="definition in highQualityResults"
          :key="definition.id"
          :definition="definition"
          :hide-threshold="hideThreshold"
          class="search-result-card"
          @vote-submitted="handleVoteSubmitted"
          @vote-updated="handleVoteUpdated"
          @login-required="$emit('login-required')"
          @voting-error="handleVotingError"
        />
      </div>

      <!-- Medium-Quality Results (Score 0-5) -->
      <div v-if="mediumQualityResults.length > 0" class="medium-quality-results">
        <div v-if="highQualityResults.length > 0" class="quality-separator">
          <span class="separator-text">Other Community Definitions</span>
        </div>
        <CommunityDefinitionCard
          v-for="definition in mediumQualityResults"
          :key="definition.id"
          :definition="definition"
          :hide-threshold="hideThreshold"
          class="search-result-card medium-quality"
          @vote-submitted="handleVoteSubmitted"
          @vote-updated="handleVoteUpdated"
          @login-required="$emit('login-required')"
          @voting-error="handleVotingError"
        />
      </div>

      <!-- Low-Quality Results (Score < 0) -->
      <div v-if="lowQualityResults.length > 0" class="low-quality-results">
        <div class="low-quality-toggle">
          <button 
            class="toggle-low-quality-button"
            @click="showLowQuality = !showLowQuality"
            :aria-expanded="showLowQuality"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="toggle-icon"
              :class="{ 'expanded': showLowQuality }"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>
              {{ showLowQuality ? 'Hide' : 'Show' }} 
              {{ lowQualityResults.length }} low-scored 
              {{ lowQualityResults.length === 1 ? 'definition' : 'definitions' }}
            </span>
          </button>
        </div>

        <div v-show="showLowQuality" class="low-quality-content">
          <CommunityDefinitionCard
            v-for="definition in lowQualityResults"
            :key="definition.id"
            :definition="definition"
            :hide-threshold="hideThreshold"
            class="search-result-card low-quality"
            @vote-submitted="handleVoteSubmitted"
            @vote-updated="handleVoteUpdated"
            @login-required="$emit('login-required')"
            @voting-error="handleVotingError"
          />
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-container">
        <button 
          class="load-more-button"
          @click="$emit('load-more')"
          :disabled="loadingMore"
        >
          <span v-if="loadingMore" class="loading-spinner"></span>
          {{ loadingMore ? 'Loading...' : 'Load More Community Definitions' }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="searchExecuted && !loading" class="empty-state">
      <div class="empty-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          />
        </svg>
      </div>
      <p class="empty-message">
        No community definitions found for "{{ searchQuery }}"
      </p>
      <p class="empty-suggestion">
        Be the first to contribute a community definition!
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CommunityDefinitionCard from '@/components/cards/CommunityDefinitionCard.vue';

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  },
  searchExecuted: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  hideThreshold: {
    type: Number,
    default: -5
  },
  minScoreForDisplay: {
    type: Number,
    default: -10 // Don't show extremely low-scored content
  }
});

const emit = defineEmits([
  'vote-submitted',
  'vote-updated',
  'voting-error',
  'login-required',
  'load-more',
  'retry'
]);

// Local state
const showLowQuality = ref(false);

// Computed properties
const shouldShowResults = computed(() => {
  return props.searchExecuted && (
    props.loading || 
    props.error || 
    props.results.length > 0
  );
});

const visibleResults = computed(() => {
  return props.results.filter(result => 
    result.voteScore >= props.minScoreForDisplay
  );
});

const highQualityResults = computed(() => {
  return visibleResults.value
    .filter(result => result.voteScore > 5)
    .sort((a, b) => b.voteScore - a.voteScore);
});

const mediumQualityResults = computed(() => {
  return visibleResults.value
    .filter(result => result.voteScore >= 0 && result.voteScore <= 5)
    .sort((a, b) => b.voteScore - a.voteScore);
});

const lowQualityResults = computed(() => {
  return visibleResults.value
    .filter(result => result.voteScore < 0 && result.voteScore >= props.minScoreForDisplay)
    .sort((a, b) => b.voteScore - a.voteScore);
});

// Methods
function handleVoteSubmitted(voteData) {
  emit('vote-submitted', voteData);
}

function handleVoteUpdated(voteData) {
  emit('vote-updated', voteData);
}

function handleVotingError(error) {
  emit('voting-error', error);
}

// Watch for search query changes to reset low quality toggle
watch(() => props.searchQuery, () => {
  showLowQuality.value = false;
});
</script>

<style scoped>
.community-search-results {
  background: var(--rw-background);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  overflow: hidden;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--moeItemBg);
  border-bottom: 1px solid var(--slateGray);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--white);
}

.community-icon {
  color: #3498db;
  flex-shrink: 0;
}

.results-count {
  font-size: 0.875rem;
  color: var(--frenchGray);
  font-weight: 500;
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--slateGray);
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--frenchGray);
  font-size: 0.875rem;
}

/* Error State */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 1.25rem;
}

.error-text {
  color: var(--frenchGray);
  font-size: 0.875rem;
}

.retry-button {
  padding: 0.5rem 1rem;
  background: #3498db;
  border: 1px solid #3498db;
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #2980b9;
  border-color: #2980b9;
}

/* Results List */
.results-list {
  padding: 1.5rem;
}

.search-result-card {
  margin-bottom: 1.5rem;
}

.search-result-card:last-child {
  margin-bottom: 0;
}

/* Quality-based styling */
.search-result-card.medium-quality {
  opacity: 0.95;
}

.search-result-card.low-quality {
  opacity: 0.85;
}

/* Quality Separator */
.quality-separator {
  display: flex;
  align-items: center;
  margin: 2rem 0 1.5rem;
}

.quality-separator::before,
.quality-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--gunmetal);
}

.separator-text {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--frenchGray);
  font-weight: 500;
}

/* Low Quality Toggle */
.low-quality-toggle {
  margin: 2rem 0 1rem;
}

.toggle-low-quality-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.5rem;
  color: var(--frenchGray);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.toggle-low-quality-button:hover {
  background: var(--frenchGray);
  color: var(--white);
  border-color: var(--white);
}

.toggle-icon {
  transition: transform 0.2s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.low-quality-content {
  margin-top: 1rem;
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gunmetal);
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  color: var(--frenchGray);
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-message {
  color: var(--white);
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.empty-suggestion {
  color: var(--frenchGray);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    padding: 1rem;
  }

  .section-title {
    font-size: 1.125rem;
  }

  .results-list {
    padding: 1rem;
  }

  .search-result-card {
    margin-bottom: 1rem;
  }

  .quality-separator {
    margin: 1.5rem 0 1rem;
  }

  .separator-text {
    font-size: 0.8125rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .toggle-low-quality-button {
    padding: 0.625rem 0.875rem;
    font-size: 0.8125rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .section-header {
    border-bottom-width: 2px;
  }

  .toggle-low-quality-button,
  .load-more-button,
  .retry-button {
    border-width: 2px;
  }
}

/* Focus styles for accessibility */
.toggle-low-quality-button:focus-visible,
.load-more-button:focus-visible,
.retry-button:focus-visible {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .loading-spinner,
  .toggle-icon {
    animation: none;
    transition: none;
  }
}

/* Print styles */
@media print {
  .loading-container,
  .error-container,
  .load-more-container,
  .low-quality-toggle {
    display: none;
  }

  .search-result-card {
    break-inside: avoid;
  }
}
</style>