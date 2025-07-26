<template>
  <li class="mknoll-result-item" @click="navigateToWordDetail" style="cursor: pointer;" title="Click to view full word details">
    <div class="language-entries">
      <div 
        v-for="(lang, index) in displayOrder" 
        :key="lang.type"
        :class="[
          'language-item',
          `mknoll-${lang.type}`,
          { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
        ]"
      >
        <!-- Taiwanese content -->
        <template v-if="lang.type === 'taiwanese'">
          <div class="word-content">{{ lang.content }}</div>
        </template>
        
        <!-- Chinese content -->
        <template v-else-if="lang.type === 'chinese'">
          <div class="word-content">
            <span>{{ lang.content }}</span>
            <Pinyinzhuyin :han="lang.content" />
          </div>
        </template>
        
        <!-- English content -->
        <template v-else-if="lang.type === 'english'">
          <div class="word-content">
            <span>{{ lang.content }}</span>
            <audio
              v-if="word.audio_url"
              ref="audio"
              :src="`${word.audio_url}`"
              controls
              @click.stop
            ></audio>
          </div>
        </template>
      </div>
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
      <IconEdit title="Edit entry" @click="$emit('openEditDialog', word)" />
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
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
</script>

<style scoped>
.mknoll-result-item {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: start;
  position: relative;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}

.language-entries {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.language-item {
  transition: all 0.3s ease;
}

.word-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Base styling for language types */
.mknoll-taiwanese {
  font-size: 1.2rem;
  font-weight: 400;
}

.mknoll-chinese {
  font-size: 1.1rem;
  font-weight: 400;
}

.mknoll-english {
  font-size: 0.9rem;
  color: var(--frenchGray);
}

/* Primary language styling - larger and more prominent */
.primary-language.mknoll-taiwanese {
  font-size: 1.8rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.primary-language.mknoll-chinese {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.primary-language.mknoll-english {
  font-size: 1.2rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.5rem;
}

/* Secondary language styling - smaller and less prominent */
.secondary-language {
  opacity: 0.85;
}

.secondary-language.mknoll-taiwanese {
  font-size: 1rem;
}

.secondary-language.mknoll-chinese {
  font-size: 0.95rem;
}

.secondary-language.mknoll-english {
  font-size: 0.8rem;
}

.word-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

</style>