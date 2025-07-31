<template>
  <div 
    class="loading-skeleton"
    :class="[
      `skeleton-${variant}`,
      { 'skeleton-animated': animated }
    ]"
    :style="customStyles"
    :aria-label="ariaLabel"
    role="status"
    aria-live="polite"
  >
    <span class="visually-hidden">{{ loadingText }}</span>
  </div>
</template>

<script>
export default {
  name: 'LoadingSkeleton',
  props: {
    variant: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'title', 'paragraph', 'card', 'circle', 'rectangle'].includes(value)
    },
    width: {
      type: [String, Number],
      default: null
    },
    height: {
      type: [String, Number],
      default: null
    },
    lines: {
      type: Number,
      default: 1
    },
    animated: {
      type: Boolean,
      default: true
    },
    ariaLabel: {
      type: String,
      default: 'Loading content'
    },
    loadingText: {
      type: String,
      default: 'Loading...'
    }
  },
  computed: {
    customStyles() {
      const styles = {};
      
      if (this.width) {
        styles.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
      }
      
      if (this.height) {
        styles.height = typeof this.height === 'number' ? `${this.height}px` : this.height;
      }
      
      return styles;
    }
  }
}
</script>

<style scoped>
.loading-skeleton {
  background: var(--gunmetal);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.skeleton-animated {
  background: linear-gradient(
    90deg,
    var(--gunmetal) 25%,
    var(--slateGray) 50%,
    var(--gunmetal) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite ease-in-out;
}

@keyframes skeleton-loading {
  0% { 
    background-position: 200% 0; 
  }
  100% { 
    background-position: -200% 0; 
  }
}

/* Variant styles */
.skeleton-text {
  height: 1em;
  width: 100%;
  margin-bottom: var(--space-2);
}

.skeleton-text:last-child {
  margin-bottom: 0;
}

.skeleton-title {
  height: 1.5em;
  width: 75%;
  margin-bottom: var(--space-3);
}

.skeleton-paragraph {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-paragraph::before,
.skeleton-paragraph::after {
  content: '';
  height: 1em;
  background: inherit;
  border-radius: inherit;
  animation: inherit;
  background-size: inherit;
}

.skeleton-paragraph::before {
  width: 100%;
}

.skeleton-paragraph::after {
  width: 60%;
}

.skeleton-card {
  height: 200px;
  width: 100%;
  border-radius: var(--card-border-radius);
}

.skeleton-circle {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  border-radius: var(--radius-full);
}

.skeleton-rectangle {
  height: 120px;
  width: 100%;
}

/* Multiple lines support */
.skeleton-text[data-lines="2"]::after {
  content: '';
  display: block;
  height: 1em;
  width: 80%;
  background: inherit;
  border-radius: inherit;
  animation: inherit;
  background-size: inherit;
  margin-top: var(--space-2);
}

.skeleton-text[data-lines="3"]::after {
  content: '';
  display: block;
  height: 1em;
  width: 80%;
  background: inherit;
  border-radius: inherit;
  animation: inherit;
  background-size: inherit;
  margin-top: var(--space-2);
}

.skeleton-text[data-lines="3"]::before {
  content: '';
  display: block;
  height: 1em;
  width: 90%;
  background: inherit;
  border-radius: inherit;
  animation: inherit;
  background-size: inherit;
  margin-top: var(--space-2);
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .skeleton-card {
    height: 150px;
  }
  
  .skeleton-title {
    width: 85%;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skeleton-animated {
    animation: none;
    background: var(--gunmetal);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .loading-skeleton {
    border: 1px solid var(--surface-border);
  }
}
</style>