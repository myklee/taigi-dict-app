<template>
  <!-- Direct CEDICT results -->
  <section v-if="results.length">
    <header class="cedict-search-results-header search-results-header">
      <h4 class="cedict-title">
        CC-CEDICT (Creative Commons Chinese English Dictionary)
      </h4>
    </header>
    <ul class="cedict-results">
      <CedictResultCard
        v-for="(word, index) in results"
        :key="index"
        :word="word"
        @addDefinition="$emit('addDefinition', $event)"
      />
    </ul>
  </section>

  <!-- Cross-reference CEDICT results -->
  <section v-if="crossRefResults.length > 0">
    <header class="search-results-header">
      <h4 class="section-header cedict-header">CC-CEDICT Cross reference</h4>
    </header>
    <ul class="cedict-crossref">
      <CedictCrossRefCard
        v-for="(wordcedict, index) in crossRefResults"
        :key="index"
        :word="wordcedict"
        @readChinese="$emit('readChinese', $event)"
        @addDefinition="$emit('addDefinition', $event)"
      />
    </ul>
  </section>
</template>

<script setup>
import CedictResultCard from "@/components/cards/CedictResultCard.vue";
import CedictCrossRefCard from "@/components/cards/CedictCrossRefCard.vue";

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  crossRefResults: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['readChinese', 'addDefinition']);
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

.cedict-results,
.cedict-crossref {
  padding: 1vw 5vw;
}
</style>