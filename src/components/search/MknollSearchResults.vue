<template>
  <section class="mknoll" v-if="results.length">
    <header class="mknoll-search-results-header search-results-header">
      <h4 class="mknoll-title">Mary Knoll Dictionary</h4>
    </header>
    <ul class="mknoll-results">
      <MknollResultCard
        v-for="(word, index) in results"
        :key="index"
        :word="word"
        :primaryLanguage="primaryLanguage"
        :searchQuery="searchQuery"
        @openEditDialog="$emit('openEditDialog', $event)"
        @addDefinition="$emit('addDefinition', $event)"
      />
    </ul>
  </section>
</template>

<script setup>
import MknollResultCard from "@/components/cards/MknollResultCard.vue";

const props = defineProps({
  results: {
    type: Array,
    default: () => []
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
</script>

<style scoped>
/*
search results header
*/
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1vh 5vw 0 5vw;
}

.mknoll-results {
  padding: 1vw 5vw;
}
</style>