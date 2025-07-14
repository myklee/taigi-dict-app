<template>
  <li class="cedict-result-item">
    <div>
      {{ word.traditional }}
      <Pinyinzhuyin :han="word.traditional" />
    </div>
    <div>{{ word.english_cedict }}</div>
  </li>
</template>

<script setup>
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";

const props = defineProps({
  word: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.cedict-result-item {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--gunmetal);
  word-break: break-all;
}
</style>