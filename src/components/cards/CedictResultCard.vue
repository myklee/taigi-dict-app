<template>
  <article 
    class="cedict-result-card"
    role="article"
    :aria-labelledby="`cedict-word-title-${word.id}`"
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
        <h3 :id="`cedict-word-title-${word.id}`" class="visually-hidden">
          CEDICT entry for {{ getPrimaryLanguageContent() }}
        </h3>
        
        <!-- Primary Language Display -->
        <div 
          v-for="(lang, index) in displayOrder" 
          :key="lang.type"
          :class="[
            'language-item',
            `cedict-${lang.type}`,
            { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
          ]"
        >
          <!-- Chinese content -->
          <template v-if="lang.type === 'chinese'">
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
      </div>
    </header>

    <!-- Dictionary Source Indicator -->
    <div class="source-indicator">
      <span class="source-label">CEDICT Dictionary</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
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

const emit = defineEmits(['addDefinition']);

// Computed property to determine display order based on detected language
const displayOrder = computed(() => {
  const languages = [];
  
  // Create language entries with their data
  const languageEntries = {
    chinese: {
      type: 'chinese',
      content: props.word.traditional,
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
</script>

<style scoped>
.cedict-result-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}

.word-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.language-item {
  transition: all 0.3s ease;
}

.word-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-definition {
  display: flex;
  align-items: center;
}

/* Base styling for language types */
.cedict-chinese {
  font-size: 1.1rem;
  font-weight: 400;
}

.cedict-english {
  font-size: 0.9rem;
  color: var(--frenchGray);
}

/* Primary language styling - larger and more prominent */
.primary-language.cedict-chinese {
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.primary-language.cedict-english {
  font-size: 1.1rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.25rem;
}

/* Secondary language styling - smaller and less prominent */
.secondary-language {
  opacity: 0.8;
}

.secondary-language.cedict-chinese {
  font-size: 1rem;
}

.secondary-language.cedict-english {
  font-size: 0.85rem;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>