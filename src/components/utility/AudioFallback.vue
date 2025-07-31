<template>
  <div class="audio-fallback" :class="{ 'is-compact': compact }">
    <div class="fallback-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        <path d="M15 4.19402V19.806C15.0001 20.0082 14.9444 20.2065 14.8391 20.3792C14.7338 20.5518 14.583 20.6921 14.4031 20.7845C14.2233 20.877 14.0215 20.9182 13.8198 20.9034C13.6182 20.8887 13.4245 20.8187 13.26 20.701L6.68 16H4C3.46957 16 2.96086 15.7893 2.58579 15.4142C2.21071 15.0392 2 14.5304 2 14V10C2 9.46958 2.21071 8.96087 2.58579 8.5858C2.96086 8.21073 3.46957 8.00002 4 8.00002H6.68L13.26 3.30002C13.4244 3.18242 13.618 3.11239 13.8196 3.09761C14.0212 3.08283 14.2229 3.12388 14.4027 3.21625C14.5825 3.30862 14.7333 3.44874 14.8387 3.62123C14.9441 3.79371 14.9999 3.99189 15 4.19402ZM13 5.94402L7.842 9.62602C7.50311 9.86873 7.09684 9.99949 6.68 10H4V14H6.68C7.09662 14 7.50287 14.13 7.842 14.372L13 18.057V5.94402Z" fill="currentColor" opacity="0.3"/>
      </svg>
    </div>
    <span v-if="!compact" class="fallback-text">{{ message }}</span>
  </div>
</template>

<script>
export default {
  name: 'AudioFallback',
  props: {
    message: {
      type: String,
      default: 'Audio not available'
    },
    compact: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.audio-fallback {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2, 8px);
  color: var(--frenchGray, #acabb5);
  opacity: 0.6;
  padding: var(--space-2, 8px);
  border-radius: var(--radius-md, 4px);
  background: rgba(110, 131, 160, 0.05);
}

.audio-fallback.is-compact {
  gap: var(--space-1, 4px);
  padding: var(--space-1, 4px);
}

.fallback-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fallback-text {
  font-size: var(--font-size-xs, 12px);
  font-style: italic;
  white-space: nowrap;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .fallback-text {
    display: none;
  }
}
</style>