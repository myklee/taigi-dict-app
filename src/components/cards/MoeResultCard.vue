<template>
  <article 
    class="moe-result-card"
    role="article"
    :aria-labelledby="`word-title-${word.id}`"
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
        <!-- Audio availability indicator -->
        <AudioAvailabilityIndicator 
          v-if="hasAudio"
          :is-available="hasAudio"
          :compact="true"
          class="audio-indicator"
        />
        <h3 :id="`word-title-${word.id}`" class="visually-hidden">
          Dictionary entry for {{ getPrimaryLanguageContent() }}
        </h3>
        
        <!-- Primary Language Display -->
        <div 
          v-for="(lang, index) in displayOrder" 
          :key="lang.type"
          :class="[
            'language-item',
            `moe-${lang.type}`,
            lang.type === 'taiwanese' ? 'alphabetic' : lang.type === 'chinese' ? 'logographic' : 'alphabetic',
            { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
          ]"
        >
          <!-- Taiwanese content -->
          <template v-if="lang.type === 'taiwanese'">
            <div class="word-content">
              <span class="word-text">{{ lang.content }}</span>
              <div class="audio-controls" @click.stop>
                <audio
                  v-if="word.audio_url"
                  ref="audio"
                  :src="`${word.audio_url}`"
                  controls
                  class="native-audio"
                ></audio>
                <AudioPlayerTaigi 
                  v-if="word.audioid" 
                  :audioID="word.audioid" 
                  class="custom-audio"
                />
              </div>
            </div>
          </template>
          
          <!-- Chinese content -->
          <template v-else-if="lang.type === 'chinese'">
            <div class="word-content">
              <span class="word-text">{{ lang.content }}</span>
              <div class="pronunciation-section">
                <Pinyinzhuyin :han="lang.content" />
                <TouchTarget 
                  size="default"
                  rounded
                  :aria-label="`Play Chinese pronunciation for ${lang.content}`"
                  @click.stop="$emit('readChinese', lang.content)"
                >
                  <IconPlayAudio />
                </TouchTarget>
              </div>
            </div>
          </template>
          
          <!-- English content -->
          <template v-else-if="lang.type === 'english'">
            <div class="word-content">
              <span class="word-text">{{ lang.content }}</span>
              <TouchTarget 
                size="default"
                rounded
                :aria-label="`Play English pronunciation for ${lang.content}`"
                @click.stop="$emit('readEnglish', lang.content)"
              >
                <IconPlayAudio />
              </TouchTarget>
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

    <!-- Definitions Section -->
    <section class="definitions-section" aria-label="Word definitions">
      <div 
        v-for="def in word.definitions" 
        :key="def.id"
        class="definition-item"
        role="listitem"
      >
        <div class="definition-content">
          <p class="definition-english alphabetic">{{ def.def_english }}</p>
          <p class="definition-chinese logographic">{{ def.def_chinese }}</p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import AudioAvailabilityIndicator from "@/components/utility/AudioAvailabilityIndicator.vue";
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import TouchTarget from "@/components/utility/TouchTarget.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
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

const emit = defineEmits(['readChinese', 'readEnglish', 'openEditDialog', 'addDefinition']);

// Computed property to check if audio is available
const hasAudio = computed(() => {
  return !!(props.word.audioid || props.word.audio_url);
});

// Computed property to determine display order based on detected language
const displayOrder = computed(() => {
  const languages = [];
  
  // Create language entries with their data
  const languageEntries = {
    taiwanese: {
      type: 'taiwanese',
      content: props.word.romaji,
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
      content: props.word.english,
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
    router.push({ name: 'moe-word-detail', params: { id: props.word.id.toString() } });
  }
};

const getPrimaryLanguageContent = () => {
  const primaryLang = displayOrder.value.find(lang => lang.isPrimary);
  return primaryLang ? primaryLang.content : props.word.chinese || props.word.romaji || props.word.english;
};
</script>

<style scoped>
.moe-result-card {
  background: var(--surface-background);
  border: 1px solid var(--surface-border);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  margin-bottom: var(--space-4);
  box-shadow: var(--card-shadow);
  transition: var(--transition-normal);
  position: relative;
  cursor: pointer;
}

.moe-result-card:hover {
  border-color: var(--surface-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-1px);
}

.moe-result-card:focus-within {
  border-color: var(--surface-border-hover);
  box-shadow: var(--card-shadow-hover);
}

/* Card Header Layout */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
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

.primary-language.moe-taiwanese .word-text {
  font-size: var(--font-size-4xl);
  font-family: "Noto Sans", sans-serif;
}

.primary-language.moe-chinese .word-text {
  font-size: var(--font-size-3xl);
  font-family: "Noto Sans CJK TC", "Noto Sans", sans-serif;
}

.primary-language.moe-english .word-text {
  font-size: var(--font-size-2xl);
  font-family: "Helvetica Neue", "Noto Sans", sans-serif;
}

/* Typography Hierarchy - Secondary Languages */
.secondary-language .word-text {
  color: var(--color-secondary);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-snug);
}

.secondary-language.moe-taiwanese .word-text {
  font-size: var(--font-size-xl);
}

.secondary-language.moe-chinese .word-text {
  font-size: var(--font-size-lg);
}

.secondary-language.moe-english .word-text {
  font-size: var(--font-size-base);
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

.custom-audio {
  flex-shrink: 0;
}

.pronunciation-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pronunciation-section .touch-target,
.word-content .touch-target {
  flex-shrink: 0;
  color: var(--color-secondary);
}

.pronunciation-section .touch-target:hover,
.word-content .touch-target:hover {
  color: var(--color-primary);
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

/* Definitions Section */
.definitions-section {
  border-top: 1px solid var(--surface-border);
  padding-top: var(--space-3);
  margin-top: var(--space-1);
}

.definition-item {
  margin-bottom: var(--space-3);
}

.definition-item:last-child {
  margin-bottom: 0;
}

.definition-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.definition-english {
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: var(--line-height-relaxed);
  font-family: "Helvetica Neue", sans-serif;
}

.definition-chinese {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  font-family: "Noto Sans CJK TC", "Noto Sans", sans-serif;
}

/* Responsive Design */
@media (max-width: 767px) {
  .moe-result-card {
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
  .primary-language.moe-taiwanese .word-text {
    font-size: var(--font-size-3xl);
  }
  
  .primary-language.moe-chinese .word-text {
    font-size: var(--font-size-2xl);
  }
  
  .primary-language.moe-english .word-text {
    font-size: var(--font-size-xl);
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
  .moe-result-card {
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
  .moe-result-card:active {
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
  .moe-result-card {
    border-width: 2px;
  }
  
  .primary-language .word-text {
    font-weight: var(--font-weight-semibold);
  }
  
  .definitions-section {
    border-top-width: 2px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .moe-result-card,
  .primary-content,
  .language-item,
  .icon-button {
    transition: none;
  }
  
  .moe-result-card:hover {
    transform: none;
  }
}

/* Focus Management */
.moe-result-card:focus-within .card-actions {
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
    padding: var(--space-3);
    margin: calc(var(--space-3) * -1);
    border-radius: var(--radius-lg);
    /* Enhanced touch feedback */
    transition: background-color 150ms ease, transform 100ms ease;
  }
  
  .primary-content:active {
    background-color: var(--surface-background-hover);
    transform: scale(0.98);
  }
  
  /* Optimize card spacing for thumb navigation */
  .moe-result-card {
    margin-bottom: var(--space-8);
    /* Add touch-friendly padding */
    padding: var(--space-4) var(--space-3);
  }
  
  /* Prevent accidental taps by increasing spacing */
  .language-item + .language-item {
    margin-top: var(--space-5);
  }
  
  /* Ensure comfortable spacing between interactive elements */
  .audio-controls {
    gap: var(--space-4);
  }
  
  .pronunciation-section {
    gap: var(--space-4);
  }
  
  /* Enhanced card actions spacing */
  .card-actions {
    gap: var(--space-3);
    padding: var(--space-2);
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
  .moe-result-card {
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