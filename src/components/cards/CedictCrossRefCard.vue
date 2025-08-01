<template>
  <article 
    class="cedict-crossref-card"
    role="article"
    :aria-labelledby="`cedict-crossref-title-${word.id}`"
  >
    <!-- Card Header with Primary Content -->
    <header class="card-header">
      <div 
        class="primary-content" 
        @click="navigateToWordDetail" 
        role="button"
        tabindex="0"
        :aria-label="`View details for ${getPrimaryLanguageContent()}`"
        @keydown.enter="navigateToWordDetail"
        @keydown.space.prevent="navigateToWordDetail"
      >
        <h3 :id="`cedict-crossref-title-${word.id}`" class="visually-hidden">
          CEDICT cross-reference for {{ getPrimaryLanguageContent() }}
        </h3>
        
        <!-- Primary Language Display -->
        <div 
          v-for="(lang, index) in displayOrder" 
          :key="lang.type"
          :class="[
            'language-item',
            `crossref-${lang.type}`,
            { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
          ]"
        >
          <!-- Chinese content -->
          <template v-if="lang.type === 'chinese'">
            <div class="word-content">
              <TouchTarget 
                size="default"
                rounded
                :aria-label="`Play Chinese pronunciation for ${lang.content}`"
                @click.stop="$emit('readChinese', lang.content)"
              >
                <IconPlayAudio />
              </TouchTarget>
              <span class="word-text">{{ lang.content }}</span>
              <div class="pronunciation-section">
                <Pinyinzhuyin :han="lang.content" />
              </div>
            </div>
          </template>
          
          <!-- English content -->
          <template v-else-if="lang.type === 'english'">
            <div class="word-content">
              <span class="word-text">{{ lang.content }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="card-actions" @click.stop role="toolbar" aria-label="Word actions">
        <TouchTarget
          size="small"
          rounded
          :class="{ 'is-favorited': favoritesStore.isFavorited(word.id) }"
          @click="favoritesStore.toggleFavorite(word)"
          :aria-label="favoritesStore.isFavorited(word.id) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <IconHeart :isFavorited="favoritesStore.isFavorited(word.id)" />
        </TouchTarget>
        <TouchTarget
          size="small"
          rounded
          @click="$emit('addDefinition', word)"
          aria-label="Add community definition"
        >
          <IconAdd />
        </TouchTarget>
      </div>
    </header>

    <!-- Dictionary Source Indicator -->
    <div class="source-indicator">
      <span class="source-label">CEDICT Cross-Reference</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import TouchTarget from "@/components/utility/TouchTarget.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import IconHeart from "@/components/icons/IconHeart.vue";
import IconAdd from "@/components/icons/IconAdd.vue";
import { useFavoritesStore } from "@/stores/favoritesStore";

const router = useRouter();
const favoritesStore = useFavoritesStore();

const props = defineProps({
  word: {
    type: Object,
    required: true
  },
  primaryLanguage: {
    type: String,
    default: 'unknown'
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['readChinese', 'addDefinition']);

// Computed property to determine display order based on detected language
const displayOrder = computed(() => {
  const languages = [];
  
  // Get the Chinese content (prefer traditional, fall back to chinese field)
  const chineseContent = props.word.traditional || props.word.chinese;
  
  // Create language entries with their data
  const languageEntries = {
    chinese: {
      type: 'chinese',
      content: chineseContent,
      label: 'Chinese',
      isPrimary: props.primaryLanguage === 'chinese'
    },
    english: {
      type: 'english',
      content: props.word.english_cedict,
      label: 'English',
      isPrimary: props.primaryLanguage === 'english'
    }
  };
  
  // Filter out null/empty entries and add to languages array
  Object.values(languageEntries).forEach(entry => {
    if (entry.content != null && entry.content !== '') {
      languages.push(entry);
    }
  });
  
  // Sort: primary language first, then others
  return languages.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    
    // Default order: chinese, english
    const defaultOrder = { chinese: 0, english: 1 };
    return defaultOrder[a.type] - defaultOrder[b.type];
  });
});

const navigateToWordDetail = () => {
  if (props.word.id) {
    router.push({ name: 'cedict-word-detail', params: { id: props.word.id.toString() } });
  }
};

const getPrimaryLanguageContent = () => {
  const primaryLang = displayOrder.value.find(lang => lang.isPrimary);
  return primaryLang ? primaryLang.content : props.word.traditional || props.word.chinese || props.word.english_cedict;
};
</script>

<style scoped>
.cedict-crossref-card {
  background: var(--surface-background);
  border: 1px solid var(--surface-border);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  margin-bottom: var(--space-4);
  box-shadow: var(--card-shadow);
  transition: var(--transition-normal);
  position: relative;
  cursor: pointer;
  /* Subtle visual distinction for CEDICT cross-reference entries */
  border-left: 3px solid var(--color-accent);
}

.cedict-crossref-card:hover {
  border-color: var(--surface-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-1px);
  border-left-color: var(--color-primary);
}

.cedict-crossref-card:focus-within {
  border-color: var(--surface-border-hover);
  box-shadow: var(--card-shadow-hover);
}

/* Card Header Layout */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  gap: var(--space-3);
}

.primary-content {
  flex: 1;
  min-width: 0; /* Prevent flex item overflow */
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  outline: none;
  border-radius: var(--radius-md);
  transition: var(--transition-colors);
}

.primary-content:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* Language Item Styling */
.language-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: var(--transition-normal);
}

.word-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.word-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* Typography Hierarchy - Primary Languages */
.primary-language .word-text {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
}

.primary-language.crossref-chinese .word-text {
  font-size: var(--font-size-2xl);
  font-family: "Noto Sans CJK TC", "Noto Sans", sans-serif;
}

.primary-language.crossref-english .word-text {
  font-size: var(--font-size-xl);
  font-family: "Helvetica Neue", "Noto Sans", sans-serif;
}

/* Typography Hierarchy - Secondary Languages */
.secondary-language .word-text {
  color: var(--color-secondary);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-snug);
}

.secondary-language.crossref-chinese .word-text {
  font-size: var(--font-size-lg);
}

.secondary-language.crossref-english .word-text {
  font-size: var(--font-size-base);
}

.pronunciation-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pronunciation-section .touch-target {
  flex-shrink: 0;
  color: var(--color-secondary);
}

.pronunciation-section .touch-target:hover {
  color: var(--color-primary);
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: -2px;
  flex-shrink: 0;
  align-items: flex-start;
}

.card-actions .touch-target {
  background: transparent !important;
  border: none;
  color: var(--color-secondary);
  width: 32px;
  height: 32px;
}

.card-actions .touch-target:hover {
  background: transparent !important;
  color: var(--color-primary);
}

.card-actions .touch-target svg {
  transition: transform 0.2s ease;
}

.card-actions .touch-target:hover svg {
  transform: scale(1.2);
}

.card-actions .touch-target.is-favorited {
  color: var(--color-error);
}

/* Source Indicator */
.source-indicator {
  border-top: 1px solid var(--surface-border);
  padding-top: var(--space-2);
  margin-top: var(--space-1);
}

.source-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 767px) {
  .cedict-crossref-card {
    padding: var(--card-padding-sm);
    margin-bottom: var(--space-3);
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }
  
  .card-actions {
    position: static;
    justify-content: flex-end;
    background: transparent;
    border-radius: 0;
    padding: 0;
    border: none;
    gap: -2px; /* Negative gap for overlapping buttons */
    margin-top: var(--space-3);
  }
  
  .card-actions .touch-target {
    width: 32px;
    height: 32px;
    min-height: 32px;
    min-width: 32px;
    background: transparent !important;
    border: none;
  }
  
  .primary-content {
    flex: 1;
  }
  
  /* Adjust font sizes for mobile */
  .primary-language.crossref-chinese .word-text {
    font-size: var(--font-size-xl);
  }
  
  .primary-language.crossref-english .word-text {
    font-size: var(--font-size-lg);
  }
  
  .word-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  /* Override default behavior to keep audio and text on same line */
  .word-content {
    display: block;
  }
  
  .word-content > .touch-target,
  .word-content > .word-text {
    display: inline-block;
    vertical-align: middle;
  }
  
  .word-content > .word-text {
    margin-left: var(--space-2);
  }
  
  .word-content > .pronunciation-section {
    display: block;
    margin-top: var(--space-2);
  }
  
}

@media (min-width: 768px) {
  .cedict-crossref-card {
    padding: var(--card-padding-lg);
  }
  
  .card-header {
    gap: var(--space-4);
  }
  
  .primary-content {
    gap: var(--space-4);
  }
}

/* Touch Feedback for Mobile */
@media (hover: none) and (pointer: coarse) {
  .cedict-crossref-card:active {
    transform: scale(0.98);
    transition: transform 100ms ease;
  }
  
  /* Maintain negative gap for overlapping buttons */
  .card-actions {
    gap: -2px;
  }
  
  .pronunciation-section {
    gap: var(--space-3);
  }
  
  .word-content {
    gap: var(--space-3);
  }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .cedict-crossref-card {
    border-width: 2px;
    border-left-width: 4px;
  }
  
  .primary-language .word-text {
    font-weight: var(--font-weight-semibold);
  }
  
  .source-indicator {
    border-top-width: 2px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .cedict-crossref-card,
  .primary-content,
  .language-item {
    transition: none;
  }
  
  .cedict-crossref-card:hover {
    transform: none;
  }
}

/* Focus Management */
.cedict-crossref-card:focus-within .card-actions {
  opacity: 1;
}

/* Mobile-specific touch optimizations */
@media (max-width: 767px) {
  /* Ensure minimum touch target sizes */
  .touch-target {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
  }
  
  /* Add more padding around interactive elements */
  .primary-content {
    padding: var(--space-2);
    margin: calc(var(--space-2) * -1);
    border-radius: var(--radius-lg);
  }
  
  /* Optimize card spacing for thumb navigation */
  .cedict-crossref-card {
    margin-bottom: var(--space-6);
  }
  
  /* Prevent accidental taps by increasing spacing */
  .language-item + .language-item {
    margin-top: var(--space-4);
  }
}

/* Thumb-friendly navigation zones */
@media (max-width: 767px) and (orientation: portrait) {
  .card-actions {
    /* Actions are now in natural flow at bottom of card */
    justify-content: flex-end;
  }
}

/* Landscape mobile optimizations */
@media (max-width: 767px) and (orientation: landscape) {
  .cedict-crossref-card {
    padding: var(--space-3) var(--space-4);
  }
  
  .card-header {
    align-items: center;
  }
  
  .primary-content {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-4);
  }
}
</style>