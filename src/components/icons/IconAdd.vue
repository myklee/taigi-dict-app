<template>
  <div class="icon-button add-icon" @click="$emit('click')">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="icon-add"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script setup>
// Add definition icon component
const emit = defineEmits(['click']);
</script>

<style scoped>
</style>