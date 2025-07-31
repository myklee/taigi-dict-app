<template>
  <!-- Direct CEDICT results -->
  <section v-if="results.length || loading" class="cedict-search-section">
    <header class="section-header cedict-header">
      <div class="section-title-container">
        <div class="section-icon cedict-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        <div class="section-title-text">
          <h3 class="section-title">CC-CEDICT Dictionary</h3>
          <p class="section-subtitle">Creative Commons Chinese English Dictionary</p>
        </div>
      </div>

      <div class="results-count">
        <span class="count-number">{{ results.length }}</span>
        <span class="count-text">result{{ results.length !== 1 ? 's' : '' }}</span>
      </div>
    </header>
    
    <div class="results-container cedict-results-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="results-list">
          <div v-for="i in 2" :key="`skeleton-${i}`" class="skeleton-card-container">
            <LoadingSkeleton variant="card" height="140px" class="result-skeleton" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <EmptyState
          title="Failed to load CEDICT results"
          :description="error"
          size="medium"
          primary-action="Retry"
          @primary-action="$emit('retry')"
        >
          <template #icon>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </template>
        </EmptyState>
      </div>

      <!-- Results List -->
      <ul v-else class="results-list">
        <CedictResultCard
          v-for="(word, index) in results"
          :key="index"
          :word="word"
          :primaryLanguage="primaryLanguage"
          :searchQuery="searchQuery"
          @addDefinition="$emit('addDefinition', $event)"
        />
      </ul>
    </div>
  </section>

  <!-- Cross-reference CEDICT results -->
  <section v-if="crossRefResults.length > 0 || crossRefLoading" class="cedict-crossref-section">
    <header class="section-header cedict-crossref-header">
      <div class="section-title-container">
        <div class="section-icon cedict-crossref-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <div class="section-title-text">
          <h3 class="section-title">CC-CEDICT Cross Reference</h3>
          <p class="section-subtitle">Related Chinese characters and compounds</p>
        </div>
      </div>

      <div class="results-count">
        <span class="count-number">{{ crossRefResults.length }}</span>
        <span class="count-text">reference{{ crossRefResults.length !== 1 ? 's' : '' }}</span>
      </div>
    </header>
    
    <div class="results-container cedict-crossref-results-container">
      <!-- Loading State -->
      <div v-if="crossRefLoading" class="loading-state">
        <div class="results-list">
          <div v-for="i in 2" :key="`crossref-skeleton-${i}`" class="skeleton-card-container">
            <LoadingSkeleton variant="card" height="120px" class="result-skeleton" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="crossRefError" class="error-state">
        <EmptyState
          title="Failed to load cross-references"
          :description="crossRefError"
          size="medium"
          primary-action="Retry"
          @primary-action="$emit('retry-crossref')"
        >
          <template #icon>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </template>
        </EmptyState>
      </div>

      <!-- Results List -->
      <ul v-else class="results-list">
        <CedictCrossRefCard
          v-for="(wordcedict, index) in crossRefResults"
          :key="index"
          :word="wordcedict"
          :primaryLanguage="primaryLanguage"
          :searchQuery="searchQuery"
          @readChinese="$emit('readChinese', $event)"
          @addDefinition="$emit('addDefinition', $event)"
        />
      </ul>
    </div>
  </section>
</template>

<script setup>
import CedictResultCard from "@/components/cards/CedictResultCard.vue";
import CedictCrossRefCard from "@/components/cards/CedictCrossRefCard.vue";
import LoadingSkeleton from "@/components/utility/LoadingSkeleton.vue";
import EmptyState from "@/components/utility/EmptyState.vue";

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  crossRefResults: {
    type: Array,
    default: () => []
  },
  primaryLanguage: {
    type: String,
    default: 'unknown'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  crossRefLoading: {
    type: Boolean,
    default: false
  },
  crossRefError: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['readChinese', 'addDefinition', 'retry', 'retry-crossref']);
</script>

<style scoped>
.cedict-search-section,
.cedict-crossref-section {
  background: var(--black);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gunmetal);
  margin-bottom: var(--space-6);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* Section Header */
.section-header {
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.cedict-header {
  background: linear-gradient(135deg, #744210 0%, #5a3208 100%);
  border-bottom: 2px solid #b8860b;
}

.cedict-crossref-header {
  background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
  border-bottom: 2px solid #cd853f;
}

.section-title-container {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  min-width: 0;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.cedict-icon {
  color: #daa520;
  background: rgba(218, 165, 32, 0.15);
}

.cedict-crossref-icon {
  color: #cd853f;
  background: rgba(205, 133, 63, 0.15);
}

.section-title-text {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--white);
  margin: 0 0 var(--space-1) 0;
  line-height: 1.2;
}

.section-subtitle {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 500;
  line-height: 1.3;
}

.results-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.count-number {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--white);
  line-height: 1;
}

.count-text {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--space-1);
}

/* Results Container */
.results-container {
  background: var(--black);
  position: relative;
}

.cedict-results-container {
  background: linear-gradient(180deg, rgba(116, 66, 16, 0.05) 0%, transparent 100%);
}

.cedict-crossref-results-container {
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.05) 0%, transparent 100%);
}

.results-list {
  list-style: none;
  margin: 0;
  padding: var(--space-4) var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Loading and Error States */
.loading-state,
.error-state {
  padding: var(--space-4) var(--space-6) var(--space-6);
}

.skeleton-card-container {
  margin-bottom: var(--space-4);
}

.skeleton-card-container:last-child {
  margin-bottom: 0;
}

.result-skeleton {
  border-radius: var(--radius-lg);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .section-title-container {
    gap: var(--space-3);
  }

  .section-icon {
    width: 40px;
    height: 40px;
  }

  .section-title {
    font-size: var(--font-size-lg);
  }

  .section-subtitle {
    font-size: var(--font-size-xs);
  }

  .results-count {
    align-self: stretch;
    flex-direction: row;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }

  .count-number {
    font-size: var(--font-size-xl);
  }

  .count-text {
    font-size: var(--font-size-xs);
    margin-top: 0;
    align-self: center;
  }

  .results-list {
    padding: var(--space-3) var(--space-4) var(--space-4);
    gap: var(--space-3);
  }
}

@media (max-width: 480px) {
  .section-header {
    padding: var(--space-3);
  }

  .section-title-container {
    gap: var(--space-2);
  }

  .section-icon {
    width: 36px;
    height: 36px;
  }

  .section-title {
    font-size: var(--font-size-base);
  }

  .results-list {
    padding: var(--space-2) var(--space-3) var(--space-3);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .cedict-search-section,
  .cedict-crossref-section {
    border-width: 2px;
  }

  .section-header {
    border-bottom-width: 3px;
  }

  .section-title {
    font-weight: 800;
  }

  .results-count {
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

/* Print Styles */
@media print {
  .cedict-search-section,
  .cedict-crossref-section {
    border: 2px solid #000;
    box-shadow: none;
    break-inside: avoid;
  }

  .section-header {
    background: #f0f0f0 !important;
    color: #000 !important;
    border-bottom: 2px solid #000;
  }

  .section-title,
  .section-subtitle {
    color: #000 !important;
  }

  .section-icon {
    background: #e0e0e0 !important;
    color: #000 !important;
  }
}
</style>