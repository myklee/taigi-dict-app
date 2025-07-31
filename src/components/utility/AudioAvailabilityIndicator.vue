<template>
  <div 
    class="audio-availability-indicator"
    :class="{ 
      'is-available': isAvailable,
      'is-compact': compact 
    }"
    :title="tooltipText"
  >
    <IconPlayAudio 
      :size="compact ? 16 : 20"
      :is-playing="false"
      :show-waves="isAvailable"
      :show-indicator="isAvailable"
    />
    <span v-if="!compact && showLabel" class="availability-label">
      {{ isAvailable ? 'Audio available' : 'No audio' }}
    </span>
  </div>
</template>

<script>
import IconPlayAudio from '../icons/IconPlayAudio.vue';

export default {
  name: 'AudioAvailabilityIndicator',
  components: {
    IconPlayAudio
  },
  props: {
    isAvailable: {
      type: Boolean,
      required: true
    },
    compact: {
      type: Boolean,
      default: false
    },
    showLabel: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    tooltipText() {
      return this.isAvailable 
        ? 'Audio pronunciation available'
        : 'Audio pronunciation not available';
    }
  }
}
</script>

<style scoped>
.audio-availability-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2, 8px);
  color: var(--frenchGray, #acabb5);
  transition: color var(--transition-normal, 250ms ease);
}

.audio-availability-indicator.is-available {
  color: var(--color-success, #10b981);
}

.audio-availability-indicator.is-compact {
  gap: var(--space-1, 4px);
}

.availability-label {
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .availability-label {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .audio-availability-indicator.is-available {
    color: #059669;
    font-weight: 600;
  }
}
</style>