<template>
  <component
    :is="tag"
    class="touch-target"
    :class="[
      `touch-target-${size}`,
      {
        'touch-target-rounded': rounded,
        'touch-target-feedback': feedback,
        'touch-target-disabled': disabled
      }
    ]"
    :disabled="disabled"
    :aria-disabled="disabled"
    :tabindex="disabled ? -1 : (focusable ? 0 : undefined)"
    :role="role"
    :aria-label="ariaLabel"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
    @keydown="handleKeydown"
    v-bind="$attrs"
  >
    <span class="touch-target-content">
      <slot></slot>
    </span>
    <span 
      v-if="feedback" 
      class="touch-feedback"
      :class="{ 'touch-feedback-active': isPressed }"
    ></span>
  </component>
</template>

<script>
export default {
  name: 'TouchTarget',
  inheritAttrs: false,
  emits: ['click', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'tap', 'longpress'],
  props: {
    tag: {
      type: String,
      default: 'button'
    },
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['small', 'default', 'comfortable', 'large'].includes(value)
    },
    rounded: {
      type: Boolean,
      default: false
    },
    feedback: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    focusable: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      default: null
    },
    ariaLabel: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      isPressed: false,
      touchStartTime: 0,
      touchPosition: { x: 0, y: 0 },
      rippleElements: [],
      longPressTimer: null,
      hasMoved: false
    }
  },
  methods: {
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      this.$emit('click', event);
    },
    
    handleTouchStart(event) {
      if (this.disabled) return;
      
      this.isPressed = true;
      this.touchStartTime = Date.now();
      this.hasMoved = false;
      
      const touch = event.touches[0];
      const rect = this.$el.getBoundingClientRect();
      this.touchPosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      
      // Create ripple effect
      if (this.feedback) {
        this.createRipple(this.touchPosition.x, this.touchPosition.y);
      }
      
      // Start long press timer
      this.longPressTimer = setTimeout(() => {
        if (this.isPressed && !this.hasMoved) {
          this.$emit('longpress', event);
        }
      }, 500);
      
      this.$emit('touchstart', event);
    },
    
    handleTouchEnd(event) {
      if (this.disabled) return;
      
      this.isPressed = false;
      
      // Clear long press timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      // Check if this was a tap (not a long press or move)
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < 500 && !this.hasMoved) {
        this.$emit('tap', event);
      }
      
      this.$emit('touchend', event);
    },
    
    handleTouchMove(event) {
      if (this.disabled) return;
      
      const touch = event.touches[0];
      const rect = this.$el.getBoundingClientRect();
      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;
      
      // Check if touch has moved significantly
      const moveThreshold = 10; // pixels
      const deltaX = Math.abs(currentX - this.touchPosition.x);
      const deltaY = Math.abs(currentY - this.touchPosition.y);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        this.hasMoved = true;
        this.isPressed = false;
        
        // Clear long press timer if touch moved
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }
      
      this.$emit('touchmove', event);
    },
    
    handleTouchCancel(event) {
      if (this.disabled) return;
      
      this.isPressed = false;
      this.hasMoved = false;
      
      // Clear long press timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      this.$emit('touchcancel', event);
    },
    
    handleKeydown(event) {
      if (this.disabled) return;
      
      // Handle Enter and Space key presses for accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleClick(event);
      }
    },
    
    createRipple(x, y) {
      const ripple = document.createElement('span');
      ripple.className = 'touch-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.$el.appendChild(ripple);
      this.rippleElements.push(ripple);
      
      // Remove ripple after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
        const index = this.rippleElements.indexOf(ripple);
        if (index > -1) {
          this.rippleElements.splice(index, 1);
        }
      }, 600);
    }
  },
  
  beforeUnmount() {
    // Clean up timers and ripples
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.rippleElements.forEach(ripple => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    });
  }
}
</script>

<style scoped>
.touch-target {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-colors);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.touch-target:focus-visible::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--color-primary);
  border-radius: inherit;
  pointer-events: none;
}

.touch-target-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Size variations */
.touch-target-small {
  min-height: var(--space-8);
  min-width: var(--space-8);
  padding: var(--space-1);
}

.touch-target-default {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  padding: var(--space-2);
}

.touch-target-comfortable {
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
  padding: var(--space-3);
}

.touch-target-large {
  min-height: var(--touch-target-large);
  min-width: var(--touch-target-large);
  padding: var(--space-4);
}

/* Rounded variant */
.touch-target-rounded {
  border-radius: var(--radius-full);
}

/* Touch feedback */
.touch-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 100%;
  height: 100%;
  background-color: var(--color-primary);
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

.touch-feedback-active {
  transform: translate(-50%, -50%) scale(1.2);
  opacity: 0.1;
}

/* Enhanced ripple effect for mobile devices */
.touch-ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple-expand 600ms ease-out;
  pointer-events: none;
  z-index: 0;
}

@keyframes ripple-expand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.4;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    transform: translate(-50%, -50%) scale(6);
    opacity: 0;
  }
}

/* Alternative ripple for dark backgrounds */
.touch-target-dark .touch-ripple {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Ripple for light backgrounds */
.touch-target-light .touch-ripple {
  background-color: rgba(0, 0, 0, 0.2);
}

/* Mobile-specific pressed state */
.touch-target-pressed {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}

.touch-target-mobile.touch-target-pressed {
  background-color: var(--surface-background-hover);
}

/* Hover states */
.touch-target:hover:not(.touch-target-disabled) {
  background-color: var(--surface-background-hover);
}

.touch-target:active:not(.touch-target-disabled) {
  transform: scale(0.95);
}

/* Disabled state */
.touch-target-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .touch-target {
    transition: none;
  }
  
  .touch-target:active:not(.touch-target-disabled) {
    transform: none;
  }
  
  .touch-feedback {
    display: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .touch-target:focus-visible::after {
    border-width: 3px;
  }
  
  .touch-target:hover:not(.touch-target-disabled) {
    outline: 1px solid var(--color-primary);
  }
}

/* Mobile-specific optimizations */
@media (max-width: 767px) {
  .touch-target-small {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
    padding: var(--space-2);
  }
  
  .touch-target-default {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
    padding: var(--space-3);
  }
  
  .touch-target-comfortable {
    min-height: var(--touch-target-large);
    min-width: var(--touch-target-large);
    padding: var(--space-4);
  }
  
  /* Prevent accidental taps by ensuring minimum spacing */
  .touch-target + .touch-target {
    margin-left: var(--space-4);
  }
  
  /* Ensure thumb-friendly spacing in containers */
  .touch-target {
    margin: var(--space-2);
  }
  
  /* Enhanced visual feedback for mobile */
  .touch-target:active {
    transform: scale(0.92);
    transition: transform 100ms ease-out;
  }
  
  /* Ensure adequate spacing in flex containers */
  .touch-target-container {
    gap: var(--space-4);
  }
  
  /* Special handling for grouped touch targets */
  .touch-target-group {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-2);
  }
  
  .touch-target-group .touch-target {
    margin: 0;
  }
  
  /* Prevent accidental activation during scrolling */
  .touch-target {
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
}

/* Touch device specific optimizations */
@media (hover: none) and (pointer: coarse) {
  .touch-target {
    /* Enhanced touch feedback for touch devices */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  .touch-target:active {
    transform: scale(0.95);
    transition: transform 100ms ease-out;
  }
  
  /* Ensure comfortable spacing between touch targets */
  .touch-target {
    margin: var(--space-1);
  }
  
  /* Enhanced feedback animation for touch devices */
  .touch-feedback-active {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0.15;
    transition: transform 150ms ease-out, opacity 150ms ease-out;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .touch-target:hover:not(.touch-target-disabled) {
    background-color: var(--surface-background-hover);
  }
}
</style>