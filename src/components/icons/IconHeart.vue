<template>
  <div class="icon-button heart-icon" @click="$emit('click')" :class="{ 'favorited': isFavorited }">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        :fill="isFavorited ? '#e74c3c' : 'none'"
        :stroke="isFavorited ? '#e74c3c' : '#ACABB5'"
        stroke-width="2"
      />
    </svg>
  </div>
</template>

<script setup>
const props = defineProps({
  isFavorited: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);
</script>

<style scoped>
.heart-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.heart-icon.favorited {
  animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>