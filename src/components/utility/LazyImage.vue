<template>
  <div 
    ref="container"
    class="lazy-image-container"
    :class="{ 'lazy-image-loaded': isLoaded, 'lazy-image-error': hasError }"
  >
    <img
      v-if="shouldLoad"
      ref="image"
      :src="src"
      :alt="alt"
      :class="imageClass"
      :loading="nativeLoading ? 'lazy' : undefined"
      @load="handleLoad"
      @error="handleError"
      :style="imageStyle"
    />
    
    <!-- Placeholder while loading -->
    <div 
      v-if="!isLoaded && !hasError"
      class="lazy-image-placeholder"
      :style="placeholderStyle"
    >
      <slot name="placeholder">
        <div class="lazy-image-skeleton" />
      </slot>
    </div>
    
    <!-- Error state -->
    <div 
      v-if="hasError"
      class="lazy-image-error-state"
      :style="placeholderStyle"
    >
      <slot name="error">
        <div class="lazy-image-error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <p class="lazy-image-error-text">Failed to load image</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  aspectRatio: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: null
  },
  threshold: {
    type: Number,
    default: 0.1
  },
  rootMargin: {
    type: String,
    default: '50px'
  },
  eager: {
    type: Boolean,
    default: false
  },
  nativeLoading: {
    type: Boolean,
    default: true
  },
  imageClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['load', 'error', 'intersect']);

const container = ref(null);
const image = ref(null);
const isLoaded = ref(false);
const hasError = ref(false);
const isIntersecting = ref(false);
const observer = ref(null);

const shouldLoad = computed(() => {
  return props.eager || isIntersecting.value;
});

const imageStyle = computed(() => {
  const style = {};
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  
  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio;
  }
  
  return style;
});

const placeholderStyle = computed(() => {
  const style = { ...imageStyle.value };
  
  if (!style.width && !style.height && !style.aspectRatio) {
    style.minHeight = '100px';
    style.width = '100%';
  }
  
  return style;
});

const handleLoad = (event) => {
  isLoaded.value = true;
  hasError.value = false;
  emit('load', event);
  
  // Disconnect observer after loading
  if (observer.value) {
    observer.value.disconnect();
  }
};

const handleError = (event) => {
  hasError.value = true;
  isLoaded.value = false;
  emit('error', event);
};

const handleIntersection = (entries) => {
  const entry = entries[0];
  isIntersecting.value = entry.isIntersecting;
  
  if (entry.isIntersecting) {
    emit('intersect', entry);
  }
};

const setupIntersectionObserver = () => {
  if (!container.value || props.eager) return;
  
  // Check if IntersectionObserver is supported
  if (!window.IntersectionObserver) {
    isIntersecting.value = true;
    return;
  }
  
  observer.value = new IntersectionObserver(handleIntersection, {
    threshold: props.threshold,
    rootMargin: props.rootMargin
  });
  
  observer.value.observe(container.value);
};

const preloadImage = () => {
  if (!props.src) return;
  
  const img = new Image();
  img.onload = () => {
    // Image is now cached
  };
  img.onerror = () => {
    // Handle preload error if needed
  };
  img.src = props.src;
};

// Watch for src changes
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    isLoaded.value = false;
    hasError.value = false;
    
    if (shouldLoad.value) {
      preloadImage();
    }
  }
});

onMounted(() => {
  setupIntersectionObserver();
  
  // If eager loading, start preloading immediately
  if (props.eager) {
    preloadImage();
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

defineExpose({
  isLoaded,
  hasError,
  isIntersecting,
  reload: () => {
    hasError.value = false;
    isLoaded.value = false;
    preloadImage();
  }
});
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: var(--surface-background-hover);
  border-radius: var(--radius-md);
}

.lazy-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-normal);
  opacity: 0;
}

.lazy-image-loaded img {
  opacity: 1;
}

.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-background-hover);
}

.lazy-image-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--gunmetal) 25%,
    var(--slateGray) 50%,
    var(--gunmetal) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.lazy-image-error-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-background-hover);
  color: var(--color-text-muted);
  padding: var(--space-4);
  text-align: center;
}

.lazy-image-error-icon {
  margin-bottom: var(--space-2);
  opacity: 0.5;
}

.lazy-image-error-text {
  font-size: var(--font-size-sm);
  margin: 0;
  opacity: 0.7;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .lazy-image-container {
    /* Optimize for mobile performance */
    will-change: auto;
  }
  
  .lazy-image-skeleton {
    /* Reduce animation complexity on mobile */
    animation-duration: 2s;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .lazy-image-container img {
    transition: none;
  }
  
  .lazy-image-skeleton {
    animation: none;
    background: var(--gunmetal);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .lazy-image-placeholder,
  .lazy-image-error-state {
    border: 1px solid var(--color-text);
  }
}

/* Performance optimizations */
.lazy-image-container {
  /* Enable hardware acceleration when needed */
  transform: translateZ(0);
  /* Optimize compositing */
  contain: layout style paint;
}

/* Responsive image sizing */
.lazy-image-responsive {
  width: 100%;
  height: auto;
}

/* Aspect ratio containers */
.lazy-image-16-9 {
  aspect-ratio: 16 / 9;
}

.lazy-image-4-3 {
  aspect-ratio: 4 / 3;
}

.lazy-image-1-1 {
  aspect-ratio: 1 / 1;
}
</style>