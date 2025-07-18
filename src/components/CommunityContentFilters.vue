<template>
  <div class="community-content-filters">
    <!-- Filter Header -->
    <div class="filters-header">
      <h3 class="filters-title">Community Content</h3>
      <div class="filters-actions">
        <button 
          class="toggle-filters-button"
          @click="showFilters = !showFilters"
          :aria-expanded="showFilters"
          aria-controls="filters-panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="filter-icon"
          >
            <path
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ showFilters ? 'Hide' : 'Show' }} Filters</span>
        </button>
        
        <button 
          v-if="hasActiveFilters"
          class="clear-filters-button"
          @click="clearAllFilters"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    <div 
      v-show="showFilters" 
      id="filters-panel"
      class="filters-panel"
    >
      <!-- Sort Options -->
      <div class="filter-group">
        <label class="filter-label">Sort by</label>
        <div class="sort-options">
          <select 
            v-model="localFilters.sortBy"
            class="sort-select"
            @change="emitFiltersChange"
          >
            <option value="score">Vote Score</option>
            <option value="date">Date Added</option>
            <option value="votes">Total Votes</option>
          </select>
          
          <button
            class="sort-order-button"
            :class="{ 'ascending': localFilters.sortOrder === 'asc' }"
            @click="toggleSortOrder"
            :aria-label="`Sort ${localFilters.sortOrder === 'asc' ? 'descending' : 'ascending'}`"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="sort-icon"
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="status-options">
          <label 
            v-for="status in statusOptions" 
            :key="status.value"
            class="checkbox-label"
          >
            <input
              type="checkbox"
              :value="status.value"
              v-model="localFilters.status"
              @change="emitFiltersChange"
              class="status-checkbox"
            />
            <span class="checkbox-text">{{ status.label }}</span>
            <span v-if="status.count !== undefined" class="status-count">
              ({{ status.count }})
            </span>
          </label>
        </div>
      </div>

      <!-- Score Range Filter -->
      <div class="filter-group">
        <label class="filter-label">Vote Score Range</label>
        <div class="score-range">
          <div class="score-input-group">
            <label class="score-label">Min:</label>
            <input
              type="number"
              v-model.number="localFilters.minScore"
              @input="emitFiltersChange"
              class="score-input"
              placeholder="Any"
            />
          </div>
          <div class="score-input-group">
            <label class="score-label">Max:</label>
            <input
              type="number"
              v-model.number="localFilters.maxScore"
              @input="emitFiltersChange"
              class="score-input"
              placeholder="Any"
            />
          </div>
        </div>
      </div>

      <!-- Tags Filter -->
      <div class="filter-group">
        <label class="filter-label">Tags</label>
        <div class="tags-input-container">
          <input
            type="text"
            v-model="tagInput"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            placeholder="Add tags (press Enter or comma)"
            class="tags-input"
          />
          <button 
            v-if="tagInput.trim()"
            @click="addTag"
            class="add-tag-button"
            type="button"
          >
            Add
          </button>
        </div>
        
        <div v-if="localFilters.tags.length > 0" class="selected-tags">
          <span 
            v-for="tag in localFilters.tags" 
            :key="tag"
            class="selected-tag"
          >
            {{ tag }}
            <button 
              @click="removeTag(tag)"
              class="remove-tag-button"
              :aria-label="`Remove ${tag} tag`"
            >
              ×
            </button>
          </span>
        </div>

        <!-- Popular Tags -->
        <div v-if="popularTags.length > 0" class="popular-tags">
          <span class="popular-tags-label">Popular:</span>
          <button
            v-for="tag in popularTags"
            :key="tag"
            @click="toggleTag(tag)"
            class="popular-tag-button"
            :class="{ 'active': localFilters.tags.includes(tag) }"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Hide Low-Scored Content Toggle -->
      <div class="filter-group">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="localFilters.hideLowScored"
            @change="emitFiltersChange"
            class="toggle-checkbox"
          />
          <span class="toggle-text">
            Hide content with score below {{ hideThreshold }}
          </span>
        </label>
      </div>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters && !showFilters" class="active-filters-summary">
      <span class="active-filters-text">Active filters:</span>
      <div class="active-filter-tags">
        <span v-if="localFilters.status.length > 0" class="active-filter-tag">
          Status: {{ localFilters.status.join(', ') }}
        </span>
        <span v-if="localFilters.minScore !== null" class="active-filter-tag">
          Min Score: {{ localFilters.minScore }}
        </span>
        <span v-if="localFilters.maxScore !== null" class="active-filter-tag">
          Max Score: {{ localFilters.maxScore }}
        </span>
        <span v-if="localFilters.tags.length > 0" class="active-filter-tag">
          Tags: {{ localFilters.tags.join(', ') }}
        </span>
        <span v-if="localFilters.hideLowScored" class="active-filter-tag">
          Hide Low-Scored
        </span>
      </div>
    </div>

    <!-- Results Count -->
    <div class="results-info">
      <span class="results-count">
        {{ resultsCount }} {{ resultsCount === 1 ? 'definition' : 'definitions' }}
      </span>
      <span v-if="hasActiveFilters" class="filtered-indicator">
        (filtered)
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      sortBy: 'score',
      sortOrder: 'desc',
      status: ['approved'],
      minScore: null,
      maxScore: null,
      tags: [],
      hideLowScored: true
    })
  },
  statusCounts: {
    type: Object,
    default: () => ({})
  },
  popularTags: {
    type: Array,
    default: () => []
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  hideThreshold: {
    type: Number,
    default: -5
  }
});

const emit = defineEmits(['filters-changed', 'filters-cleared']);

// Local state
const showFilters = ref(false);
const tagInput = ref('');
const localFilters = ref({ ...props.filters });

// Status options with labels and counts
const statusOptions = computed(() => [
  { 
    value: 'approved', 
    label: 'Approved', 
    count: props.statusCounts.approved 
  },
  { 
    value: 'pending', 
    label: 'Pending Review', 
    count: props.statusCounts.pending 
  },
  { 
    value: 'rejected', 
    label: 'Rejected', 
    count: props.statusCounts.rejected 
  },
  { 
    value: 'hidden', 
    label: 'Hidden', 
    count: props.statusCounts.hidden 
  }
]);

// Check if any filters are active (different from defaults)
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
    localFilters.value.sortBy !== defaults.sortBy ||
    localFilters.value.sortOrder !== defaults.sortOrder ||
    JSON.stringify(localFilters.value.status) !== JSON.stringify(defaults.status) ||
    localFilters.value.minScore !== defaults.minScore ||
    localFilters.value.maxScore !== defaults.maxScore ||
    localFilters.value.tags.length > 0 ||
    localFilters.value.hideLowScored !== defaults.hideLowScored
  );
});

// Methods
function emitFiltersChange() {
  emit('filters-changed', { ...localFilters.value });
}

function toggleSortOrder() {
  localFilters.value.sortOrder = localFilters.value.sortOrder === 'asc' ? 'desc' : 'asc';
  emitFiltersChange();
}

function addTag() {
  const tag = tagInput.value.trim().toLowerCase();
  if (tag && !localFilters.value.tags.includes(tag)) {
    localFilters.value.tags.push(tag);
    tagInput.value = '';
    emitFiltersChange();
  }
}

function removeTag(tag) {
  const index = localFilters.value.tags.indexOf(tag);
  if (index > -1) {
    localFilters.value.tags.splice(index, 1);
    emitFiltersChange();
  }
}

function toggleTag(tag) {
  if (localFilters.value.tags.includes(tag)) {
    removeTag(tag);
  } else {
    localFilters.value.tags.push(tag);
    emitFiltersChange();
  }
}

function clearAllFilters() {
  localFilters.value = {
    sortBy: 'score',
    sortOrder: 'desc',
    status: ['approved'],
    minScore: null,
    maxScore: null,
    tags: [],
    hideLowScored: true
  };
  tagInput.value = '';
  emit('filters-cleared');
  emitFiltersChange();
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

// Initialize filters on mount
onMounted(() => {
  // Emit initial filters to parent
  emitFiltersChange();
});
</script>

<style scoped>
.community-content-filters {
  background: var(--moeItemBg);
  border: 1px solid var(--slateGray);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

/* Header */
.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--gunmetal);
}

.filters-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--white);
}

.filters-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.toggle-filters-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.375rem;
  color: var(--white);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-filters-button:hover {
  background: var(--frenchGray);
  border-color: var(--white);
}

.filter-icon {
  flex-shrink: 0;
}

.clear-filters-button {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid #e74c3c;
  border-radius: 0.375rem;
  color: #e74c3c;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-button:hover {
  background: rgba(231, 76, 60, 0.1);
}

/* Filters Panel */
.filters-panel {
  padding: 1.25rem;
  border-top: 1px solid var(--gunmetal);
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--white);
  font-size: 0.875rem;
}

/* Sort Options */
.sort-options {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sort-select {
  flex: 1;
  padding: 0.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.375rem;
  color: var(--white);
  font-size: 0.875rem;
}

.sort-select:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

.sort-order-button {
  padding: 0.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.375rem;
  color: var(--white);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-button:hover {
  background: var(--frenchGray);
}

.sort-order-button.ascending .sort-icon {
  transform: rotate(180deg);
}

.sort-icon {
  transition: transform 0.2s ease;
}

/* Status Options */
.status-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.status-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #3498db;
}

.checkbox-text {
  color: var(--white);
}

.status-count {
  color: var(--frenchGray);
  font-size: 0.75rem;
  margin-left: auto;
}

/* Score Range */
.score-range {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-label {
  font-size: 0.875rem;
  color: var(--frenchGray);
  min-width: 2rem;
}

.score-input {
  width: 5rem;
  padding: 0.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.375rem;
  color: var(--white);
  font-size: 0.875rem;
}

.score-input:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Tags */
.tags-input-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tags-input {
  flex: 1;
  padding: 0.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.375rem;
  color: var(--white);
  font-size: 0.875rem;
}

.tags-input:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

.add-tag-button {
  padding: 0.5rem 0.75rem;
  background: #3498db;
  border: 1px solid #3498db;
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-tag-button:hover {
  background: #2980b9;
  border-color: #2980b9;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(52, 152, 219, 0.2);
  border: 1px solid #3498db;
  border-radius: 0.25rem;
  color: #3498db;
  font-size: 0.75rem;
}

.remove-tag-button {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.remove-tag-button:hover {
  color: #e74c3c;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.popular-tags-label {
  font-size: 0.75rem;
  color: var(--frenchGray);
  margin-right: 0.25rem;
}

.popular-tag-button {
  padding: 0.25rem 0.5rem;
  background: var(--slateGray);
  border: 1px solid var(--frenchGray);
  border-radius: 0.25rem;
  color: var(--frenchGray);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.popular-tag-button:hover {
  border-color: #3498db;
  color: #3498db;
}

.popular-tag-button.active {
  background: rgba(52, 152, 219, 0.2);
  border-color: #3498db;
  color: #3498db;
}

/* Toggle */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.toggle-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #3498db;
}

.toggle-text {
  color: var(--white);
}

/* Active Filters Summary */
.active-filters-summary {
  padding: 0.75rem 1.25rem;
  background: rgba(52, 152, 219, 0.1);
  border-top: 1px solid var(--gunmetal);
}

.active-filters-text {
  font-size: 0.875rem;
  color: var(--frenchGray);
  margin-right: 0.5rem;
}

.active-filter-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.active-filter-tag {
  padding: 0.125rem 0.375rem;
  background: rgba(52, 152, 219, 0.2);
  border: 1px solid #3498db;
  border-radius: 0.25rem;
  color: #3498db;
  font-size: 0.75rem;
}

/* Results Info */
.results-info {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--gunmetal);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.results-count {
  font-size: 0.875rem;
  color: var(--white);
  font-weight: 500;
}

.filtered-indicator {
  font-size: 0.75rem;
  color: var(--frenchGray);
  font-style: italic;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .filters-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .filters-actions {
    justify-content: space-between;
  }

  .sort-options {
    flex-direction: column;
    align-items: stretch;
  }

  .score-range {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .score-input-group {
    justify-content: space-between;
  }

  .score-input {
    width: auto;
    flex: 1;
  }

  .popular-tags {
    flex-direction: column;
    align-items: stretch;
  }

  .active-filter-tags {
    flex-direction: column;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toggle-filters-button,
  .clear-filters-button,
  .sort-select,
  .sort-order-button,
  .score-input,
  .tags-input,
  .add-tag-button,
  .popular-tag-button {
    border-width: 2px;
  }
}

/* Focus styles for accessibility */
.toggle-filters-button:focus-visible,
.clear-filters-button:focus-visible,
.sort-order-button:focus-visible,
.add-tag-button:focus-visible,
.remove-tag-button:focus-visible,
.popular-tag-button:focus-visible {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}
</style>