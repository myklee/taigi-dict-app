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
  </li>
</template>

<script setup>
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";

const props = defineProps({
  word: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['readChinese']);
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

.cedict-pinyin-zhuyin {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}
</style>