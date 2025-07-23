<template>
  <li class="cedict-item cedict-crossref-item" @click="navigateToWordDetail" style="cursor: pointer;" title="Click to view full word details">
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
        <div class="chinese-content">
          <p class="cedict-traditional">{{ lang.content }}</p>
          <IconPlayAudio @click.stop="$emit('readChinese', lang.content)" />
          <div class="pinyin-zhuyin cedict-pinyin-zhuyin">
            <Pinyinzhuyin :han="lang.content" />
          </div>
        </div>
      </template>
      
      <!-- English content -->
      <template v-else-if="lang.type === 'english'">
        <div class="cedict-english">{{ lang.content }}</div>
      </template>
    </div>
    
    <div class="word-actions" @click.stop>
      <IconHeart
        :isFavorited="favoritesStore.isFavorited(word.id)"
        @click="favoritesStore.toggleFavorite(word)"
        title="Add to favorites"
      />
      <IconAdd
        class="add-definition"
        title="Add community definition"
        @click="$emit('addDefinition', word)"
      />
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
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
</script>

<style scoped>
.cedict-crossref-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}

.language-item {
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chinese-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cedict-traditional {
  margin: 0;
}

.cedict-pinyin-zhuyin {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

.cedict-english {
  display: flex;
  align-items: center;
}

/* Base styling for language types */
.crossref-chinese {
  font-size: 1.1rem;
  font-weight: 400;
}

.crossref-english {
  font-size: 0.9rem;
  color: var(--frenchGray);
}

/* Primary language styling - larger and more prominent */
.primary-language.crossref-chinese {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.primary-language.crossref-english {
  font-size: 1rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.25rem;
}

/* Secondary language styling - smaller and less prominent */
.secondary-language {
  opacity: 0.8;
}

.secondary-language.crossref-chinese {
  font-size: 1rem;
}

.secondary-language.crossref-english {
  font-size: 0.85rem;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-left: auto;
}
</style>