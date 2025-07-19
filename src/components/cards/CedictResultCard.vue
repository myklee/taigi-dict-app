<template>
  <li class="cedict-result-item">
    <div class="word-content">
      <div class="word-text">
        {{ word.traditional }}
        <Pinyinzhuyin :han="word.traditional" />
      </div>
      <div class="word-definition">{{ word.english_cedict }}</div>
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

const emit = defineEmits(['addDefinition']);
</script>

<style scoped>
.cedict-result-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}

.word-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>