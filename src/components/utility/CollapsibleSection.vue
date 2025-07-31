<template>
  <div class="collapsible-section" :class="{ 'is-expanded': isExpanded }">
    <button
      class="collapsible-header"
      @click="toggleExpanded"
      :aria-expanded="isExpanded"
      :aria-controls="`collapsible-content-${id}`"
      type="button"
    >
      <div class="collapsible-title-section">
        <h3 class="collapsible-title">{{ title }}</h3>
        <span v-if="count !== undefined" class="collapsible-count">{{ count }}</span>
      </div>
      <div class="collapsible-icon" :class="{ 'expanded': isExpanded }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>
    </button>
    
    <div
      :id="`collapsible-content-${id}`"
      class="collapsible-content"
      :class="{ 'collapsed': !isExpanded }"
      :aria-hidden="!isExpanded"
    >
      <div class="collapsible-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: undefined
  },
  defaultExpanded: {
    type: Boolean,
    default: true
  },
  id: {
    type: String,
    default: () => `collapsible-${Math.random().toString(36).substr(2, 9)}`
  }
});

const isExpanded = ref(props.defaultExpanded);

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

defineExpose({
  isExpanded,
  toggleExpanded
});
</script>

<style scoped>
.collapsible-section {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-4);
  background: var(--surface-background);
  transition: var(--transition-normal);
}

.collapsible-section:hover {
  border-color: var(--surface-border-hover);
}

.collapsible-section.is-expanded {
  box-shadow: var(--shadow-sm);
}

.collapsible-header {
  background: var(--surface-background-hover);
  border: none;
  width: 100%;
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: var(--transition-colors);
  min-height: var(--touch-target-comfortable);
  color: inherit;
  font-family: inherit;
}

.collapsible-header:hover {
  background: var(--gunmetal);
}

.collapsible-header:active {
  background: var(--slateGray);
  transform: scale(0.98);
}

.collapsible-header:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.collapsible-title-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  text-align: left;
}

.collapsible-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0;
}

.collapsible-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background: var(--surface-background);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  min-width: var(--space-6);
  text-align: center;
}

.collapsible-icon {
  transition: transform var(--transition-normal);
  color: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collapsible-icon.expanded {
  transform: rotate(180deg);
}

.collapsible-content {
  background: var(--surface-background);
  border-top: 1px solid var(--surface-border);
  transition: var(--transition-normal);
  overflow: hidden;
}

.collapsible-content.collapsed {
  display: none;
}

.collapsible-inner {
  padding: var(--space-4);
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .collapsible-header {
    padding: var(--space-3) var(--space-4);
  }
  
  .collapsible-title {
    font-size: var(--font-size-base);
  }
  
  .collapsible-count {
    font-size: var(--font-size-xs);
    padding: var(--space-1) var(--space-2);
  }
  
  .collapsible-inner {
    padding: var(--space-3);
  }
  
  /* Enhanced touch feedback */
  .collapsible-header:active {
    transform: scale(0.98);
    transition: transform 100ms ease;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) {
  .collapsible-header {
    padding: var(--space-5) var(--space-6);
  }
  
  .collapsible-title {
    font-size: var(--font-size-xl);
  }
  
  .collapsible-inner {
    padding: var(--space-6);
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .collapsible-inner {
    padding: var(--space-8);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .collapsible-section {
    border-width: 2px;
  }
  
  .collapsible-title {
    font-weight: var(--font-weight-bold);
  }
  
  .collapsible-content {
    border-top-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .collapsible-header,
  .collapsible-icon,
  .collapsible-content {
    transition: none;
  }
  
  .collapsible-header:active {
    transform: none;
  }
}

/* Animation for smooth expand/collapse */
@media (prefers-reduced-motion: no-preference) {
  .collapsible-content {
    transition: max-height var(--transition-normal) ease-out;
  }
  
  .collapsible-content:not(.collapsed) {
    animation: expandContent var(--transition-normal) ease-out;
  }
}

@keyframes expandContent {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>