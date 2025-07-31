/**
 * Memory Management Utilities for Mobile Browsers
 */

// Memory usage tracking
let memoryTracker = {
  components: new Map(),
  eventListeners: new Map(),
  timers: new Set(),
  observers: new Set(),
  imageCache: new Map(),
  maxCacheSize: 50
};

/**
 * Register a component for memory tracking
 */
export function registerComponent(componentId, componentInstance) {
  memoryTracker.components.set(componentId, {
    instance: componentInstance,
    registeredAt: Date.now(),
    memoryUsage: getComponentMemoryEstimate(componentInstance)
  });
}

/**
 * Unregister a component and clean up its resources
 */
export function unregisterComponent(componentId) {
  const component = memoryTracker.components.get(componentId);
  if (component) {
    // Clean up any associated resources
    cleanupComponentResources(componentId);
    memoryTracker.components.delete(componentId);
  }
}

/**
 * Estimate memory usage of a component
 */
function getComponentMemoryEstimate(componentInstance) {
  // This is a rough estimate based on component properties
  let estimate = 0;
  
  try {
    // Count reactive data
    if (componentInstance.$data) {
      estimate += JSON.stringify(componentInstance.$data).length * 2; // Rough estimate
    }
    
    // Count computed properties
    if (componentInstance.$options.computed) {
      estimate += Object.keys(componentInstance.$options.computed).length * 100;
    }
    
    // Count watchers
    if (componentInstance._watchers) {
      estimate += componentInstance._watchers.length * 50;
    }
  } catch (error) {
    // Fallback estimate
    estimate = 1000;
  }
  
  return estimate;
}

/**
 * Clean up resources associated with a component
 */
function cleanupComponentResources(componentId) {
  // Clean up event listeners
  const listeners = memoryTracker.eventListeners.get(componentId);
  if (listeners) {
    listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    memoryTracker.eventListeners.delete(componentId);
  }
  
  // Clean up timers
  const timers = Array.from(memoryTracker.timers).filter(timer => timer.componentId === componentId);
  timers.forEach(timer => {
    clearTimeout(timer.id);
    clearInterval(timer.id);
    memoryTracker.timers.delete(timer);
  });
  
  // Clean up observers
  const observers = Array.from(memoryTracker.observers).filter(observer => observer.componentId === componentId);
  observers.forEach(observer => {
    if (observer.instance && observer.instance.disconnect) {
      observer.instance.disconnect();
    }
    memoryTracker.observers.delete(observer);
  });
}

/**
 * Register an event listener for cleanup tracking
 */
export function registerEventListener(componentId, element, event, handler, options = false) {
  if (!memoryTracker.eventListeners.has(componentId)) {
    memoryTracker.eventListeners.set(componentId, []);
  }
  
  memoryTracker.eventListeners.get(componentId).push({
    element,
    event,
    handler,
    options
  });
  
  element.addEventListener(event, handler, options);
  
  // Return cleanup function
  return () => {
    element.removeEventListener(event, handler, options);
    const listeners = memoryTracker.eventListeners.get(componentId);
    if (listeners) {
      const index = listeners.findIndex(l => 
        l.element === element && l.event === event && l.handler === handler
      );
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  };
}

/**
 * Register a timer for cleanup tracking
 */
export function registerTimer(componentId, type, callback, delay) {
  const timerId = type === 'timeout' ? setTimeout(callback, delay) : setInterval(callback, delay);
  
  memoryTracker.timers.add({
    id: timerId,
    type,
    componentId,
    createdAt: Date.now()
  });
  
  return timerId;
}

/**
 * Register an observer for cleanup tracking
 */
export function registerObserver(componentId, observerInstance, type) {
  memoryTracker.observers.add({
    instance: observerInstance,
    type,
    componentId,
    createdAt: Date.now()
  });
  
  return observerInstance;
}

/**
 * Manage image cache to prevent memory leaks
 */
export function cacheImage(src, imageElement) {
  // Remove oldest images if cache is full
  if (memoryTracker.imageCache.size >= memoryTracker.maxCacheSize) {
    const oldestKey = memoryTracker.imageCache.keys().next().value;
    memoryTracker.imageCache.delete(oldestKey);
  }
  
  memoryTracker.imageCache.set(src, {
    element: imageElement,
    cachedAt: Date.now(),
    size: estimateImageSize(imageElement)
  });
}

/**
 * Get cached image
 */
export function getCachedImage(src) {
  return memoryTracker.imageCache.get(src);
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  memoryTracker.imageCache.clear();
}

/**
 * Estimate image memory usage
 */
function estimateImageSize(imageElement) {
  if (!imageElement.naturalWidth || !imageElement.naturalHeight) {
    return 0;
  }
  
  // Rough estimate: width * height * 4 bytes per pixel (RGBA)
  return imageElement.naturalWidth * imageElement.naturalHeight * 4;
}

/**
 * Force garbage collection (if available)
 */
export function forceGarbageCollection() {
  if (window.gc && typeof window.gc === 'function') {
    window.gc();
  }
}

/**
 * Clean up unused resources
 */
export function cleanupUnusedResources() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  // Clean up old timers
  memoryTracker.timers.forEach(timer => {
    if (now - timer.createdAt > maxAge) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.id);
      } else {
        clearInterval(timer.id);
      }
      memoryTracker.timers.delete(timer);
    }
  });
  
  // Clean up old observers
  memoryTracker.observers.forEach(observer => {
    if (now - observer.createdAt > maxAge) {
      if (observer.instance && observer.instance.disconnect) {
        observer.instance.disconnect();
      }
      memoryTracker.observers.delete(observer);
    }
  });
  
  // Clean up old cached images
  memoryTracker.imageCache.forEach((value, key) => {
    if (now - value.cachedAt > maxAge) {
      memoryTracker.imageCache.delete(key);
    }
  });
}

/**
 * Get memory usage report
 */
export function getMemoryReport() {
  const report = {
    components: memoryTracker.components.size,
    eventListeners: Array.from(memoryTracker.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
    timers: memoryTracker.timers.size,
    observers: memoryTracker.observers.size,
    cachedImages: memoryTracker.imageCache.size,
    estimatedImageCacheSize: Array.from(memoryTracker.imageCache.values()).reduce((sum, img) => sum + img.size, 0),
    totalEstimatedUsage: 0
  };
  
  // Calculate total estimated usage
  memoryTracker.components.forEach(component => {
    report.totalEstimatedUsage += component.memoryUsage;
  });
  
  report.totalEstimatedUsage += report.estimatedImageCacheSize;
  
  return report;
}

/**
 * Monitor memory usage and clean up when needed
 */
export function startMemoryMonitoring() {
  // Clean up unused resources every 2 minutes
  const cleanupInterval = setInterval(cleanupUnusedResources, 2 * 60 * 1000);
  
  // Monitor memory usage if available
  if ('memory' in performance) {
    const memoryCheckInterval = setInterval(() => {
      const memory = performance.memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 80) {
        console.warn('High memory usage detected, cleaning up resources...');
        cleanupUnusedResources();
        
        // Force garbage collection if available
        forceGarbageCollection();
        
        // Clear image cache if memory is still high
        setTimeout(() => {
          const newMemory = performance.memory;
          const newUsagePercent = (newMemory.usedJSHeapSize / newMemory.jsHeapSizeLimit) * 100;
          if (newUsagePercent > 75) {
            clearImageCache();
          }
        }, 1000);
      }
    }, 10000); // Check every 10 seconds
    
    // Store intervals for cleanup
    memoryTracker.timers.add({
      id: cleanupInterval,
      type: 'interval',
      componentId: 'memory-monitor',
      createdAt: Date.now()
    });
    
    memoryTracker.timers.add({
      id: memoryCheckInterval,
      type: 'interval',
      componentId: 'memory-monitor',
      createdAt: Date.now()
    });
  }
}

/**
 * Stop memory monitoring
 */
export function stopMemoryMonitoring() {
  // Clean up monitoring timers
  memoryTracker.timers.forEach(timer => {
    if (timer.componentId === 'memory-monitor') {
      if (timer.type === 'timeout') {
        clearTimeout(timer.id);
      } else {
        clearInterval(timer.id);
      }
      memoryTracker.timers.delete(timer);
    }
  });
}

/**
 * Create a memory-efficient Vue composable
 */
export function useMemoryManagement(componentId) {
  const cleanup = [];
  
  const addEventListenerWithCleanup = (element, event, handler, options) => {
    const cleanupFn = registerEventListener(componentId, element, event, handler, options);
    cleanup.push(cleanupFn);
    return cleanupFn;
  };
  
  const addTimerWithCleanup = (type, callback, delay) => {
    const timerId = registerTimer(componentId, type, callback, delay);
    cleanup.push(() => {
      if (type === 'timeout') {
        clearTimeout(timerId);
      } else {
        clearInterval(timerId);
      }
    });
    return timerId;
  };
  
  const addObserverWithCleanup = (observerInstance, type) => {
    registerObserver(componentId, observerInstance, type);
    cleanup.push(() => {
      if (observerInstance && observerInstance.disconnect) {
        observerInstance.disconnect();
      }
    });
    return observerInstance;
  };
  
  const cleanupAll = () => {
    cleanup.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    cleanup.length = 0;
    unregisterComponent(componentId);
  };
  
  return {
    addEventListener: addEventListenerWithCleanup,
    setTimeout: (callback, delay) => addTimerWithCleanup('timeout', callback, delay),
    setInterval: (callback, delay) => addTimerWithCleanup('interval', callback, delay),
    addObserver: addObserverWithCleanup,
    cleanup: cleanupAll
  };
}

// Initialize memory monitoring in development
if (process.env.NODE_ENV === 'development') {
  startMemoryMonitoring();
  
  // Log memory report every 30 seconds
  setInterval(() => {
    const report = getMemoryReport();
    console.group('🧠 Memory Usage Report');
    console.table(report);
    console.groupEnd();
  }, 30000);
}