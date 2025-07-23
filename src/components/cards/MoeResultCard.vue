<template>
  <li class="entry moe-result-item">
    <!-- Dynamic language display based on search language -->
    <div class="language-entries" @click="navigateToWordDetail" style="cursor: pointer;" title="Click to view full word details">
      <div 
        v-for="(lang, index) in displayOrder" 
        :key="lang.type"
        :class="[
          'word-item',
          `moe-word-${lang.type}`,
          lang.type === 'taiwanese' ? 'alphabetic' : lang.type === 'chinese' ? 'logographic' : 'alphabetic',
          { 'primary-language': lang.isPrimary, 'secondary-language': !lang.isPrimary }
        ]"
      >
        <!-- Taiwanese content -->
        <template v-if="lang.type === 'taiwanese'">
          <p>{{ lang.content }}</p>
          <audio
            v-if="word.audio_url"
            ref="audio"
            :src="`${word.audio_url}`"
            controls
            @click.stop
          ></audio>
          <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" @click.stop />
        </template>
        
        <!-- Chinese content -->
        <template v-else-if="lang.type === 'chinese'">
          <span>{{ lang.content }}</span>
          <Pinyinzhuyin :han="lang.content" />
          <IconPlayAudio @click.stop @click="$emit('readChinese', lang.content)" />
        </template>
        
        <!-- English content -->
        <template v-else-if="lang.type === 'english'">
          <span>{{ lang.content }}</span>
          <IconPlayAudio @click.stop @click="$emit('readEnglish', lang.content)" />
        </template>
      </div>
    </div>

    <!-- Definitions -->
    <ul>
      <li v-for="def in word.definitions" :key="def.id">
        <ul>
          <li class="alphabetic">{{ def.def_english }}</li>
          <li class="logographic">{{ def.def_chinese }}</li>
        </ul>
      </li>
    </ul>
    
    <!-- Actions -->
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
      <IconEdit
        class="edit-word"
        title="Edit entry"
        @click="$emit('openEditDialog', word)"
      />
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
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
</script>

<style scoped>
.moe-result-item {
  padding: 0rem 0 2rem 0;
  background-color: var(--black);
  border-radius: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  position: relative;
  .pinyin-zhuyin {
    font-size: 1rem;
  }
}

.language-entries {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-item {
  display: flex;
  align-items: center;
  gap: 0.66rem;
  transition: all 0.3s ease;
}

/* Base sizes for each language type */
.moe-word-taiwanese {
  font-size: 2rem;
  gap: 1rem;
}

.moe-word-chinese {
  font-size: 1.25rem;
  line-height: 100%;
}

.moe-word-english {
  font-size: 1rem;
}

/* Primary language styling - larger and more prominent */
.primary-language.moe-word-taiwanese {
  font-size: 3rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.primary-language.moe-word-chinese {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.primary-language.moe-word-english {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Secondary language styling - smaller and less prominent */
.secondary-language {
  opacity: 0.85;
  font-size: 0.9em;
}

.secondary-language.moe-word-taiwanese {
  font-size: 1.5rem;
}

.secondary-language.moe-word-chinese {
  font-size: 1.1rem;
}

.secondary-language.moe-word-english {
  font-size: 0.9rem;
}

.word-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>