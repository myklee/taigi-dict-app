<template>
  <article 
    class="mknoll-result-card"
    role="article"
    :aria-labelledby="`mknoll-word-title-${word.id}`"
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
        <h3 :id="`mknoll-word-title-${word.id}`" class="visually-hidden">
          Mary Knoll dictionary entry for {{ getPrimaryLanguageContent() }}
        </h3>
        
        <!-- Primary Language Display -->
        <div 
          v-for="(lang, index) in displayOrder" 
          :key="lang.type"
          :class="[
            'language-item',
            `mknoll-${lang.type}`,
            lang.type === 'taiwanese' ? 'alphabetic' : lang.type === 'chinese' ? 'logographic' : 'alphabetic',
            { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
          ]"
        >
          <!-- Taiwanese content -->
          <template v-if="lang.type === 'taiwanese'">
            <div class="word-content">
              <span class="word-text">{{ lang.content }}</span>
            </div>
          </template>
          
          <!-- Chinese content -->
          <template v-else-if="lang.type === 'chinese'">
            <div class="word-content">
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
              <div class="audio-controls" @click.stop>
                <audio
                  v-if="word.audio_url"
                  ref="audio"
                  :src="`${word.audio_url}`"
                  controls
                  class="native-audio"
                  :aria-label="`Audio pronunciation for ${lang.content}`"
                ></audio>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="card-actions" @click.stop role="toolbar" aria-label="Word actions">
        <TouchTarget
          size="comfortable"
          rounded
          :class="{ 'is-favorited': favoritesStore.isFavorited(word.id) }"
          @click="favoritesStore.toggleFavorite(word)"
          :aria-label="favoritesStore.isFavorited(word.id) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <IconHeart :isFavorited="favoritesStore.isFavorited(word.id)" />
        </TouchTarget>
        <TouchTarget
          size="comfortable"
          rounded
          @click="$emit('addDefinition', word)"
          aria-label="Add community definition"
        >
          <IconAdd />
        </TouchTarget>
        <TouchTarget
          size="comfortable"
          rounded
          @click="$emit('openEditDialog', word)"
          aria-label="Edit entry"
        >
          <IconEdit />
        </TouchTarget>
      </div>
    </header>

    <!-- Dictionary Source Indicator -->
    <div class="source-indicator">
      <span class="source-label">Mary Knoll Dictionary</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import TouchTarget from "@/components/utility/TouchTarget.vue";
import IconEdit from "@/components/icons/IconEdit.vue";
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

const emit = defineEmits(['openEditDialog', 'addDefinition']);

// Computed property to determine display order based on detected language
const displayOrder = computed(() => {
  const languages = [];
  
  // Create language entries with their data
  const languageEntries = {
    taiwanese: {
      type: 'taiwanese',
      content: props.word.taiwanese,
      label: 'Taiwanese',
      isPrimary: props.primaryLanguage === 'taiwanese'
    },
    chinese: {
      type: 'chinese',
      content: props.word.chinese,
      label: 'Chinese',
      isPrimary: props.primaryLanguage === 'chinese'
    },
    english: {
      type: 'english',
      content: props.word.english_mknoll,
      label: 'English',
      isPrimary: props.primaryLanguage === 'english'
    }
  };
  
  // Filter out null/empty entries
  Object.values(languageEntries).forEach(entry => {
    if (entry.content != null && entry.content !== '') {
      languages.push(entry);
    }
  });
  
  // Sort: primary language first, then others
  return languages.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    
    // Default order: taiwanese, chinese, english
    const defaultOrder = { taiwanese: 0, chinese: 1, english: 2 };
    return defaultOrder[a.type] - defaultOrder[b.type];
  });
});

const navigateToWordDetail = () => {
  if (props.word.id) {
    router.push({ name: 'mknoll-word-detail', params: { id: props.word.id.toString() } });
  }
};

const getPrimaryLanguageContent = () => {
  const primaryLang = displayOrder.value.find(lang => lang.isPrimary);
  return primaryLang ? primaryLang.content : props.word.chinese || props.word.taiwanese || props.word.english_mknoll;
};
</script>

<style scoped>
.mknoll-result-card {
  background: var(--surface-background);
  border: 1px solid var(--surface-border);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  margin-bottom: var(--space-4);
  box-shadow: var(--card-shadow);
  transition: var(--transition-normal);
  position: relative;
  cursor: pointer;
  /* Subtle visual distinction for Mary Knoll entries */
  border-left: 3px solid var(--color-accent);
}

.mknoll-result-card:hover {
  border-color: var(--surface-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-1px);
  border-left-color: var(--color-primary);
}

.mknoll-result-card:focus-within {
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

.primary-language.mknoll-taiwanese .word-text {
  font-size: var(--font-size-3xl);
  font-family: "Noto Sans", sans-serif;
}

.primary-language.mknoll-chinese .word-text {
  font-size: var(--font-size-2xl);
  font-family: "Noto Sans CJK TC", "Noto Sans", sans-serif;
}

.primary-language.mknoll-english .word-text {
  font-size: var(--font-size-xl);
  font-family: "Helvetica Neue", "Noto Sans", sans-serif;
}

/* Typography Hierarchy - Secondary Languages */
.secondary-language .word-text {
  color: var(--color-secondary);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-snug);
}

.secondary-language.mknoll-taiwanese .word-text {
  font-size: var(--font-size-lg);
}

.secondary-language.mknoll-chinese .word-text {
  font-size: var(--font-size-base);
}

.secondary-language.mknoll-english .word-text {
  font-size: var(--font-size-sm);
}

/* Audio Controls */
.audio-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.native-audio {
  max-width: 200px;
  height: 32px;
}

.pronunciation-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
  align-items: flex-start;
}

.card-actions .touch-target {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: 1px solid var(--surface-border);
  color: var(--color-secondary);
}

.card-actions .touch-target:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: var(--surface-border-hover);
  color: var(--color-primary);
}

.card-actions .touch-target.is-favorited {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-error);
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
  .mknoll-result-card {
    padding: var(--card-padding-sm);
    margin-bottom: var(--space-3);
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }
  
  .card-actions {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    background: rgba(0, 0, 0, 0.8);
    border-radius: var(--radius-md);
    padding: var(--space-1);
    border: 1px solid var(--surface-border);
    gap: var(--space-2); /* Increase gap for better touch targets on mobile */
  }
  
  .card-actions .touch-target {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
  }
  
  .primary-content {
    padding-right: var(--space-12); /* Space for actions */
  }
  
  /* Adjust font sizes for mobile */
  .primary-language.mknoll-taiwanese .word-text {
    font-size: var(--font-size-2xl);
  }
  
  .primary-language.mknoll-chinese .word-text {
    font-size: var(--font-size-xl);
  }
  
  .primary-language.mknoll-english .word-text {
    font-size: var(--font-size-lg);
  }
  
  .word-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .pronunciation-section {
    width: 100%;
    justify-content: space-between;
  }
}

@media (min-width: 768px) {
  .mknoll-result-card {
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
  .mknoll-result-card:active {
    transform: scale(0.98);
    transition: transform 100ms ease;
  }
  
  /* Ensure proper spacing between touch targets */
  .card-actions {
    gap: var(--space-3);
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
  .mknoll-result-card {
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
  .mknoll-result-card,
  .primary-content,
  .language-item,
  .icon-button {
    transition: none;
  }
  
  .mknoll-result-card:hover {
    transform: none;
  }
}

/* Focus Management */
.mknoll-result-card:focus-within .card-actions {
  opacity: 1;
}

/* Pinyin/Zhuyin specific styling */
.pinyin-zhuyin {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-tight);
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
  .mknoll-result-card {
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
    /* Position actions in thumb-friendly zone */
    top: var(--space-3);
    right: var(--space-3);
  }
}

/* Landscape mobile optimizations */
@media (max-width: 767px) and (orientation: landscape) {
  .mknoll-result-card {
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