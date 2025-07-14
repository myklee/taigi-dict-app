<template>
  <div class="pinyin-zhuyin">
    <div class="pinyin">{{ pinyinMarks }}</div>
    <div class="zhuyin">{{ fromPinyin(pinyinMarks).join(" ") }}</div>
  </div>
</template>
<script setup>
const props = defineProps({
  han: String,
});

import pinyin from "pinyin"; // For Pinyin
import fromPinyin from "zhuyin";

const pinyinMarks = pinyin(props.han).join(" ");
</script>

<!-- https://github.com/hotoo/pinyin -->
