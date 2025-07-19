<template>
  <li class="mknoll-result-item">
    <div>
      <div class="mknoll-taiwanese">
        {{ word.taiwanese }}
      </div>
      <div class="mknoll-chinese">
        {{ word.chinese }}
        <Pinyinzhuyin :han="word.chinese" />
      </div>
    </div>
    <div class="mknoll-english">
      {{ word.english_mknoll }}
      <audio
        v-if="word.audio_url"
        ref="audio"
        :src="`${word.audio_url}`"
        controls
      ></audio>
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
      <IconEdit title="Edit entry" @click="$emit('openEditDialog', word)" />
    </div>
  </li>
</template>

<script setup>
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import IconEdit from "@/components/icons/IconEdit.vue";
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

const emit = defineEmits(['openEditDialog', 'addDefinition']);
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

.word-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>