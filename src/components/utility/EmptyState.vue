<template>
  <div 
    class="empty-state"
    :class="[
      `empty-state-${size}`,
      { 'empty-state-centered': centered }
    ]"
    role="status"
    :aria-label="ariaLabel"
  >
    <div class="empty-state-content">
      <!-- Icon slot -->
      <div v-if="$slots.icon || icon" class="empty-state-icon">
        <slot name="icon">
          <component :is="icon" v-if="icon" />
          <div v-else class="default-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
        </slot>
      </div>

      <!-- Title -->
      <h3 v-if="title" class="empty-state-title">
        {{ title }}
      </h3>

      <!-- Description -->
      <p v-if="description" class="empty-state-description">
        {{ description }}
      </p>

      <!-- Custom content slot -->
      <div v-if="$slots.default" class="empty-state-custom">
        <slot></slot>
      </div>

      <!-- Action buttons -->
      <div v-if="$slots.actions || primaryAction || secondaryAction" class="empty-state-actions">
        <slot name="actions">
          <button 
            v-if="primaryAction"
            class="button-primary"
            @click="$emit('primary-action')"
            :disabled="primaryActionDisabled"
          >
            {{ primaryAction }}
          </button>
          <button 
            v-if="secondaryAction"
            class="button-secondary"
            @click="$emit('secondary-action')"
            :disabled="secondaryActionDisabled"
          >
            {{ secondaryAction }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  emits: ['primary-action', 'secondary-action'],
  props: {
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: [String, Object],
      default: null
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    centered: {
      type: Boolean,
      default: true
    },
    primaryAction: {
      type: String,
      default: ''
    },
    secondaryAction: {
      type: String,
      default: ''
    },
    primaryActionDisabled: {
      type: Boolean,
      default: false
    },
    secondaryActionDisabled: {
      type: Boolean,
      default: false
    },
    ariaLabel: {
      type: String,
      default: 'No content available'
    }
  }
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  padding: var(--space-8) var(--space-4);
  min-height: 200px;
}

.empty-state-centered {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-state-content {
  max-width: 400px;
  width: 100%;
}

.empty-state-icon {
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
  display: flex;
  justify-content: center;
}

.default-icon {
  opacity: 0.6;
}

.empty-state-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  line-height: var(--line-height-tight);
}

.empty-state-description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-6);
}

.empty-state-custom {
  margin-bottom: var(--space-6);
}

.empty-state-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

/* Size variations */
.empty-state-small {
  padding: var(--space-6) var(--space-3);
  min-height: 150px;
}

.empty-state-small .empty-state-title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-2);
}

.empty-state-small .empty-state-description {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.empty-state-small .empty-state-icon {
  margin-bottom: var(--space-3);
}

.empty-state-small .default-icon svg {
  width: 32px;
  height: 32px;
}

.empty-state-large {
  padding: var(--space-12) var(--space-6);
  min-height: 300px;
}

.empty-state-large .empty-state-title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-4);
}

.empty-state-large .empty-state-description {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-8);
}

.empty-state-large .empty-state-icon {
  margin-bottom: var(--space-6);
}

.empty-state-large .default-icon svg {
  width: 64px;
  height: 64px;
}

/* Button styles */
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-colors);
  min-height: var(--touch-target-min);
}

.button-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-secondary {
  background-color: transparent;
  color: var(--color-secondary);
  border: 1px solid var(--surface-border);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-colors);
  min-height: var(--touch-target-min);
}

.button-secondary:hover:not(:disabled) {
  background-color: var(--surface-background-hover);
  border-color: var(--surface-border-hover);
}

.button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .empty-state {
    padding: var(--space-6) var(--space-3);
  }
  
  .empty-state-large {
    padding: var(--space-8) var(--space-4);
  }
  
  .empty-state-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .empty-state-actions button {
    width: 100%;
    max-width: 200px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .empty-state-title {
    font-weight: var(--font-weight-bold);
  }
  
  .button-secondary {
    border-width: 2px;
  }
}
</style>