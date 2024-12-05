<template>
  <transition name="fade" mode="out-in">
    <div v-show="loading">
      <IconCooker />
      <!-- <div v-if="type === 'loading'">
      Loading
      <span class="loading-dot-1">.</span>
      <span class="loading-dot-2">.</span>
      <span class="loading-dot-3">.</span>
    </div> -->

      <!-- <div class="book">
    <div class="page"></div>
    <div class="page2"></div>
  </div> -->
    </div>
  </transition>
</template>
<script setup>
const props = defineProps({
  type: String,
  loading: Boolean,
});

import IconCooker from "../icons/IconCooker.vue";
</script>
<style scoped>
/* Transition classes for 'fade' */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-dot-1,
.loading-dot-2,
.loading-dot-3 {
  animation: loading-dot 1s ease-in infinite;
  font-size: 1.5rem;
}
.loading-dot-2 {
  animation-delay: 0.33s;
}
.loading-dot-3 {
  animation-delay: 0.66s;
}
@keyframes loading-dot {
  from {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* .book {
  --bookwidth: 50px;
  --bookheight: 40px;
  --bookBorder: var(--frenchGray);
  --bookBackground: var(--gunmetal);
  --pageBackground: var(--gunmetal);
  --timeline: 1s;
  --perspective: calc(1 * var(var(--bookwidth)));
  width: var(--bookwidth);
  height: var(--bookheight);
  border: 1px solid var(--bookBorder);
  background-color: var(--bookBackground);
  position: relative;
}

.page,
.page2 {
  position: absolute;
  top: -1px;
  left: -1px;
  width: calc(var(--bookwidth) / 2);
  height: var(--bookheight);
  background-color: var(--pageBackground);
  border: 1px solid var(--bookBorder);
  transform-origin: calc(var(--bookwidth) / 2);
  animation: page-turn var(--timeline) ease-in-out infinite reverse;
}
.page2 {
  animation-delay: calc(var(--timeline) / 2);
}

@keyframes page-turn {
  from {
    transform: perspective(100px) rotate3d(0, 1, 0, 0deg);
    z-index: 100;
  }

  to {
    transform: perspective(100px) rotate3d(0, 1, 0, 180deg);
  }
} */
</style>
