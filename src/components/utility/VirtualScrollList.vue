<template>
  <div 
    ref="container"
    class="virtual-scroll-container"
    :style="{ height: containerHeight }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-scroll-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-scroll-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot 
            :item="item" 
            :index="startIndex + index"
            :isVisible="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 100
  },
  containerHeight: {
    type: String,
    default: '400px'
  },
  overscan: {
    type: Number,
    default: 5
  },
  keyField: {
    type: String,
    default: 'id'
  }
});

const emit = defineEmits(['scroll', 'visible-range-change']);

const container = ref(null);
const scrollTop = ref(0);
const containerHeightPx = ref(400);

// Calculate visible range
const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  return Math.max(0, start - props.overscan);
});

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeightPx.value / props.itemHeight);
  const end = startIndex.value + visibleCount + props.overscan * 2;
  return Math.min(props.items.length - 1, end);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1);
});

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight;
});

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight;
});

const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop;
  
  emit('scroll', {
    scrollTop: scrollTop.value,
    startIndex: startIndex.value,
    endIndex: endIndex.value
  });
};

const getItemKey = (item, index) => {
  return item[props.keyField] || index;
};

const updateContainerHeight = () => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    containerHeightPx.value = rect.height;
  }
};

// Watch for visible range changes
watch([startIndex, endIndex], ([newStart, newEnd], [oldStart, oldEnd]) => {
  if (newStart !== oldStart || newEnd !== oldEnd) {
    emit('visible-range-change', {
      startIndex: newStart,
      endIndex: newEnd,
      visibleItems: visibleItems.value
    });
  }
});

// Scroll to specific item
const scrollToItem = (index, alignment = 'auto') => {
  if (!container.value) return;
  
  const itemTop = index * props.itemHeight;
  const containerHeight = containerHeightPx.value;
  
  let scrollTo = itemTop;
  
  switch (alignment) {
    case 'start':
      scrollTo = itemTop;
      break;
    case 'center':
      scrollTo = itemTop - (containerHeight - props.itemHeight) / 2;
      break;
    case 'end':
      scrollTo = itemTop - containerHeight + props.itemHeight;
      break;
    case 'auto':
    default:
      const currentScrollTop = scrollTop.value;
      const itemBottom = itemTop + props.itemHeight;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;
      
      if (itemTop < visibleTop) {
        scrollTo = itemTop;
      } else if (itemBottom > visibleBottom) {
        scrollTo = itemBottom - containerHeight;
      } else {
        return; // Item is already visible
      }
      break;
  }
  
  container.value.scrollTop = Math.max(0, scrollTo);
};

// Scroll to top
const scrollToTop = () => {
  if (container.value) {
    container.value.scrollTop = 0;
  }
};

// Scroll to bottom
const scrollToBottom = () => {
  if (container.value) {
    container.value.scrollTop = totalHeight.value;
  }
};

onMounted(() => {
  updateContainerHeight();
  
  // Update container height on resize
  const resizeObserver = new ResizeObserver(() => {
    updateContainerHeight();
  });
  
  if (container.value) {
    resizeObserver.observe(container.value);
  }
  
  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});

defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  startIndex,
  endIndex,
  visibleItems
});
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  /* Optimize scrolling performance */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  will-change: scroll-position;
}

.virtual-scroll-spacer {
  position: relative;
  width: 100%;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* Optimize rendering performance */
  will-change: transform;
  contain: layout style paint;
}

.virtual-scroll-item {
  width: 100%;
  /* Optimize item rendering */
  contain: layout style paint;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .virtual-scroll-container {
    /* Improve touch scrolling on mobile */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

/* Performance optimizations for low-end devices */
@media (max-width: 767px) and (max-resolution: 1.5dppx) {
  .virtual-scroll-content {
    /* Reduce GPU usage on low-end devices */
    transform: translateZ(0);
  }
}

/* High-performance mode for modern devices */
@media (min-resolution: 2dppx) {
  .virtual-scroll-container {
    /* Enable hardware acceleration */
    transform: translateZ(0);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .virtual-scroll-container {
    scroll-behavior: auto;
  }
}
</style>