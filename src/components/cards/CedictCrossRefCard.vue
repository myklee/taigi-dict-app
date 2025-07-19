<template>
  <li class="cedict-item cedict-crossref-item">
    <p v-if="word.traditional != null" class="cedict-traditional">
      {{ word.traditional }}
    </p>
    <p class="cedict-traditional" v-if="word.traditional === null">
      {{ word.chinese }}
    </p>

    <IconPlayAudio
      v-if="word.traditional"
      @click="$emit('readChinese', word.traditional)"
    ></IconPlayAudio>
    <IconPlayAudio
      v-if="word.traditional === null && word.chinese != null"
      @click="$emit('readChinese', word.chinese)"
    ></IconPlayAudio>

    <div class="pinyin-zhuyin cedict-pinyin-zhuyin">
      <Pinyinzhuyin :han="word.traditional" />
    </div>
    <div class="cedict-english">
      {{ word.english_cedict }}
    </div>
    <div class="word-actions">
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
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import IconHeart from "@/components/icons/IconHeart.vue";
import IconAdd from "@/components/icons/IconAdd.vue";
import { useFavoritesStore } from "@/stores/favoritesStore";

const favoritesStore = useFavoritesStore();

const props = defineProps({
  word: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['readChinese', 'addDefinition']);
</script>

<style scoped>
.cedict-crossref-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-left: auto;
}

.cedict-pinyin-zhuyin {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}
</style>