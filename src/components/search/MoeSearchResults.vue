<template>
  <section v-if="results.length">
    <header class="moe-search-results-header search-results-header">
      <h4 class="moe-title">
        Ministry of Education Taiwanese Dictionary of Common Words
        教育部臺灣台語常用詞辭典
      </h4>

      <div v-if="searchExecuted" class="results-count">
        {{ results.length }} result<span v-if="results.length != 1">s</span>
        found
      </div>
    </header>
    <ul class="results moe-results">
      <MoeResultCard
        v-for="word in results"
        :key="word.id"
        :word="word"
        @readChinese="$emit('readChinese', $event)"
        @readEnglish="$emit('readEnglish', $event)"
        @openEditDialog="$emit('openEditDialog', $event)"
      />
    </ul>
  </section>
</template>

<script setup>
import MoeResultCard from "@/components/cards/MoeResultCard.vue";

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  searchExecuted: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['readChinese', 'readEnglish', 'openEditDialog']);
</script>

<style scoped>
/*
MOE results header
*/
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1vh 5vw 0 5vw;
}
.moe-search-results-header {
  padding-top: 0;
}
.results {
  margin: 0 5vw;
  border-bottom: 1px solid var(--gunmetal);
}
.results-count {
  padding: 0.5rem 0;
}

.moe-title {
  padding-bottom: 1rem;
}
</style>