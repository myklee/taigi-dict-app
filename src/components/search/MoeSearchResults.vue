<template>
  <section v-if="results.length || loading" class="moe-search-section">
    <header class="section-header moe-header">
      <div class="section-title-container">
        <div class="section-icon moe-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <circle cx="12" cy="8" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="16" r="1"/>
          </svg>
        </div>
        <div class="section-title-text">
          <h3 class="section-title">Ministry of Education Dictionary</h3>
          <p class="section-subtitle">教育部臺灣台語常用詞辭典</p>
        </div>
      </div>

      <div v-if="searchExecuted" class="results-count">
        <span class="count-number">{{ results.length }}</span>
        <span class="count-text">result{{ results.length !== 1 ? 's' : '' }}</span>
      </div>
    </header>
    
    <div class="results-container moe-results-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="results-list">
          <div v-for="i in 3" :key="`skeleton-${i}`" class="skeleton-card-container">
            <LoadingSkeleton variant="card" height="180px" class="result-skeleton" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <EmptyState
          title="Failed to load MOE results"
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
        <MoeResultCard
          v-for="word in results"
          :key="word.id"
          :word="word"
          :primaryLanguage="primaryLanguage"
          :searchQuery="searchQuery"
          @readChinese="$emit('readChinese', $event)"
          @readEnglish="$emit('readEnglish', $event)"
          @openEditDialog="$emit('openEditDialog', $event)"
          @addDefinition="$emit('addDefinition', $event)"
        />
      </ul>
    </div>
  </section>
</template>

<script setup>
import MoeResultCard from "@/components/cards/MoeResultCard.vue";
import LoadingSkeleton from "@/components/utility/LoadingSkeleton.vue";
import EmptyState from "@/components/utility/EmptyState.vue";

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  searchExecuted: {
    type: Boolean,
    default: false
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
  }
});

const emit = defineEmits(['readChinese', 'readEnglish', 'openEditDialog', 'addDefinition', 'retry']);
</script>

<style scoped>
.moe-search-section {
  background: var(--black);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gunmetal);
  margin-bottom: var(--space-6);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* Section Header */
.section-header {
  background: linear-gradient(135deg, #2c5530 0%, #1e3a21 100%);
  border-bottom: 2px solid #4a7c59;
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.moe-header {
  background: linear-gradient(135deg, #2c5530 0%, #1e3a21 100%);
  border-bottom-color: #4a7c59;
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

.moe-icon {
  color: #90ee90;
  background: rgba(144, 238, 144, 0.15);
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

.moe-results-container {
  background: linear-gradient(180deg, rgba(44, 85, 48, 0.05) 0%, transparent 100%);
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
  .moe-search-section {
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
  .moe-search-section {
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