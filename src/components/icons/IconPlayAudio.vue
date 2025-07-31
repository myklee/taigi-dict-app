<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="audio-icon"
    :class="{ 
      'is-playing': isPlaying,
      'has-indicator': showIndicator 
    }"
  >
    <!-- Main speaker icon -->
    <g class="speaker-base">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15 4.19402V19.806C15.0001 20.0082 14.9444 20.2065 14.8391 20.3792C14.7338 20.5518 14.583 20.6921 14.4031 20.7845C14.2233 20.877 14.0215 20.9182 13.8198 20.9034C13.6182 20.8887 13.4245 20.8187 13.26 20.701L6.68 16H4C3.46957 16 2.96086 15.7893 2.58579 15.4142C2.21071 15.0392 2 14.5304 2 14V10C2 9.46958 2.21071 8.96087 2.58579 8.5858C2.96086 8.21073 3.46957 8.00002 4 8.00002H6.68L13.26 3.30002C13.4244 3.18242 13.618 3.11239 13.8196 3.09761C14.0212 3.08283 14.2229 3.12388 14.4027 3.21625C14.5825 3.30862 14.7333 3.44874 14.8387 3.62123C14.9441 3.79371 14.9999 3.99189 15 4.19402ZM13 5.94402L7.842 9.62602C7.50311 9.86873 7.09684 9.99949 6.68 10H4V14H6.68C7.09662 14 7.50287 14.13 7.842 14.372L13 18.057V5.94402Z"
        fill="currentColor"
      />
    </g>
    
    <!-- Sound waves (animated when playing) -->
    <g class="sound-waves" v-if="showWaves">
      <path
        class="wave wave-1"
        d="M17.667 9.01902C18.0868 9.39387 18.4225 9.85324 18.6522 10.367C18.882 10.8807 19.0005 11.4372 19 12C19.0006 12.5628 18.8822 13.1194 18.6524 13.6331C18.4227 14.1469 18.0869 14.6062 17.667 14.981"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
      <path
        class="wave wave-2"
        d="M18.255 6.86102C18.4319 6.66344 18.68 6.54423 18.9448 6.5296C19.2096 6.51497 19.4694 6.60613 19.667 6.78302C20.4017 7.43897 20.9894 8.24289 21.3915 9.142C21.7935 10.0411 22.0009 11.0151 22 12C22.0009 12.9849 21.7935 13.9589 21.3915 14.858C20.9894 15.7571 20.4017 16.5611 19.667 17.217"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
    </g>
    
    <!-- Availability indicator dot -->
    <circle
      v-if="showIndicator"
      class="availability-indicator"
      cx="20"
      cy="4"
      r="3"
      fill="var(--color-success, #10b981)"
      stroke="var(--black, #0a0a0a)"
      stroke-width="1"
    />
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      type: [String, Number],
      default: 20
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    showWaves: {
      type: Boolean,
      default: true
    },
    showIndicator: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.audio-icon {
  color: currentColor;
  transition: all var(--transition-normal, 250ms ease);
}

.speaker-base {
  transition: transform var(--transition-fast, 150ms ease);
}

.sound-waves {
  opacity: 0.7;
}

.wave {
  opacity: 0.6;
  transition: opacity var(--transition-normal, 250ms ease);
}

.wave-1 {
  animation-delay: 0ms;
}

.wave-2 {
  animation-delay: 200ms;
}

.availability-indicator {
  animation: pulse 2s infinite;
}

/* Playing state animations */
.audio-icon.is-playing .wave {
  opacity: 1;
  animation: sound-wave 1.5s ease-in-out infinite;
}

.audio-icon.is-playing .speaker-base {
  transform: scale(1.05);
}

@keyframes sound-wave {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Hover states */
.audio-icon:hover .sound-waves {
  opacity: 1;
}

.audio-icon:hover .wave {
  opacity: 0.8;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .availability-indicator {
    stroke-width: 2;
  }
  
  .wave {
    stroke-width: 2;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .audio-icon,
  .speaker-base,
  .wave,
  .availability-indicator {
    animation: none !important;
    transition: none !important;
  }
}
</style>
