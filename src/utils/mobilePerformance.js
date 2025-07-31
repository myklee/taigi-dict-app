/**
 * Mobile Performance Monitoring and Optimization Utilities
 */

// Performance metrics tracking
let performanceMetrics = {
  renderTimes: [],
  interactionTimes: [],
  memoryUsage: [],
  frameRates: [],
  touchResponses: []
};

// Device capability detection
export const deviceCapabilities = {
  isLowEndDevice: false,
  isTouchDevice: false,
  supportsWebGL: false,
  supportsIntersectionObserver: false,
  supportsResizeObserver: false,
  connectionType: 'unknown',
  memoryLimit: null,
  hardwareConcurrency: navigator.hardwareConcurrency || 1
};

/**
 * Initialize device capability detection
 */
export function initializeDeviceDetection() {
  // Detect low-end device
  deviceCapabilities.isLowEndDevice = detectLowEndDevice();
  
  // Detect touch device
  deviceCapabilities.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Detect WebGL support
  deviceCapabilities.supportsWebGL = detectWebGLSupport();
  
  // Detect API support
  deviceCapabilities.supportsIntersectionObserver = 'IntersectionObserver' in window;
  deviceCapabilities.supportsResizeObserver = 'ResizeObserver' in window;
  
  // Detect connection type
  if ('connection' in navigator) {
    deviceCapabilities.connectionType = navigator.connection.effectiveType || 'unknown';
  }
  
  // Detect memory limit
  if ('memory' in performance) {
    deviceCapabilities.memoryLimit = performance.memory.jsHeapSizeLimit;
  }
  
  console.log('Device capabilities detected:', deviceCapabilities);
}

/**
 * Detect if device is low-end based on various factors
 */
function detectLowEndDevice() {
  const factors = [];
  
  // Check hardware concurrency
  if (navigator.hardwareConcurrency <= 2) {
    factors.push('low-cpu');
  }
  
  // Check memory (if available)
  if ('memory' in performance) {
    const memoryGB = performance.memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
    if (memoryGB < 2) {
      factors.push('low-memory');
    }
  }
  
  // Check connection speed
  if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      factors.push('slow-connection');
    }
  }
  
  // Check device pixel ratio (high DPR can indicate performance constraints)
  if (window.devicePixelRatio > 2) {
    factors.push('high-dpr');
  }
  
  return factors.length >= 2;
}

/**
 * Detect WebGL support
 */
function detectWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

/**
 * Optimize rendering based on device capabilities
 */
export function getOptimizedRenderSettings() {
  const settings = {
    enableAnimations: true,
    enableShadows: true,
    enableBlur: true,
    maxListItems: 50,
    imageQuality: 'high',
    enableVirtualScrolling: false,
    enableLazyLoading: true,
    debounceDelay: 100
  };
  
  if (deviceCapabilities.isLowEndDevice) {
    settings.enableAnimations = false;
    settings.enableShadows = false;
    settings.enableBlur = false;
    settings.maxListItems = 20;
    settings.imageQuality = 'medium';
    settings.enableVirtualScrolling = true;
    settings.debounceDelay = 200;
  }
  
  // Adjust for slow connections
  if (deviceCapabilities.connectionType === 'slow-2g' || deviceCapabilities.connectionType === '2g') {
    settings.imageQuality = 'low';
    settings.enableLazyLoading = true;
    settings.maxListItems = Math.min(settings.maxListItems, 10);
  }
  
  return settings;
}

/**
 * Monitor frame rate performance
 */
export function startFrameRateMonitoring() {
  let frameCount = 0;
  let lastTime = performance.now();
  
  function measureFrameRate() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      performanceMetrics.frameRates.push(fps);
      
      // Keep only last 10 measurements
      if (performanceMetrics.frameRates.length > 10) {
        performanceMetrics.frameRates.shift();
      }
      
      frameCount = 0;
      lastTime = currentTime;
      
      // Warn if FPS is consistently low
      if (performanceMetrics.frameRates.length >= 5) {
        const avgFps = performanceMetrics.frameRates.reduce((a, b) => a + b, 0) / performanceMetrics.frameRates.length;
        if (avgFps < 30) {
          console.warn(`Low frame rate detected: ${avgFps.toFixed(1)} FPS`);
        }
      }
    }
    
    requestAnimationFrame(measureFrameRate);
  }
  
  requestAnimationFrame(measureFrameRate);
}

/**
 * Monitor memory usage
 */
export function monitorMemoryUsage() {
  if (!('memory' in performance)) {
    console.warn('Memory monitoring not supported');
    return;
  }
  
  const checkMemory = () => {
    const memory = performance.memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      timestamp: Date.now()
    };
    
    performanceMetrics.memoryUsage.push(memoryInfo);
    
    // Keep only last 20 measurements
    if (performanceMetrics.memoryUsage.length > 20) {
      performanceMetrics.memoryUsage.shift();
    }
    
    // Warn if memory usage is high
    const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
    if (usagePercent > 80) {
      console.warn(`High memory usage: ${usagePercent.toFixed(1)}% (${memoryInfo.used}MB/${memoryInfo.limit}MB)`);
    }
  };
  
  // Check memory every 5 seconds
  setInterval(checkMemory, 5000);
  checkMemory(); // Initial check
}

/**
 * Measure touch response time
 */
export function measureTouchResponse(element) {
  if (!element) return;
  
  let touchStartTime = 0;
  
  const handleTouchStart = () => {
    touchStartTime = performance.now();
  };
  
  const handleTouchEnd = () => {
    if (touchStartTime > 0) {
      const responseTime = performance.now() - touchStartTime;
      performanceMetrics.touchResponses.push(responseTime);
      
      // Keep only last 50 measurements
      if (performanceMetrics.touchResponses.length > 50) {
        performanceMetrics.touchResponses.shift();
      }
      
      // Warn if response time is consistently slow
      if (performanceMetrics.touchResponses.length >= 10) {
        const avgResponse = performanceMetrics.touchResponses.reduce((a, b) => a + b, 0) / performanceMetrics.touchResponses.length;
        if (avgResponse > 100) {
          console.warn(`Slow touch response: ${avgResponse.toFixed(1)}ms average`);
        }
      }
      
      touchStartTime = 0;
    }
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Optimize CSS animations based on device capabilities
 */
export function optimizeAnimations() {
  if (deviceCapabilities.isLowEndDevice) {
    // Disable complex animations on low-end devices
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Debounce function optimized for mobile
 */
export function mobileDebounce(func, wait, immediate = false) {
  let timeout;
  const optimizedWait = deviceCapabilities.isLowEndDevice ? wait * 2 : wait;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, optimizedWait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function optimized for mobile
 */
export function mobileThrottle(func, limit) {
  let inThrottle;
  const optimizedLimit = deviceCapabilities.isLowEndDevice ? limit * 2 : limit;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, optimizedLimit);
    }
  };
}

/**
 * Optimize images for mobile devices
 */
export function getOptimizedImageSrc(originalSrc, width, height) {
  if (!originalSrc) return originalSrc;
  
  const settings = getOptimizedRenderSettings();
  const dpr = Math.min(window.devicePixelRatio, deviceCapabilities.isLowEndDevice ? 1.5 : 3);
  
  // Calculate optimal dimensions
  const optimalWidth = Math.round(width * dpr);
  const optimalHeight = Math.round(height * dpr);
  
  // Return optimized URL (this would typically integrate with an image service)
  const quality = settings.imageQuality === 'low' ? 60 : settings.imageQuality === 'medium' ? 80 : 90;
  
  // For now, return original src (in real implementation, you'd modify the URL)
  return originalSrc;
}

/**
 * Clean up performance monitoring
 */
export function cleanupPerformanceMonitoring() {
  performanceMetrics = {
    renderTimes: [],
    interactionTimes: [],
    memoryUsage: [],
    frameRates: [],
    touchResponses: []
  };
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  const report = {
    deviceCapabilities,
    metrics: {
      ...performanceMetrics,
      averageFrameRate: performanceMetrics.frameRates.length > 0 
        ? performanceMetrics.frameRates.reduce((a, b) => a + b, 0) / performanceMetrics.frameRates.length 
        : null,
      averageTouchResponse: performanceMetrics.touchResponses.length > 0
        ? performanceMetrics.touchResponses.reduce((a, b) => a + b, 0) / performanceMetrics.touchResponses.length
        : null,
      currentMemoryUsage: performanceMetrics.memoryUsage.length > 0
        ? performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1]
        : null
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (report.metrics.averageFrameRate && report.metrics.averageFrameRate < 30) {
    report.recommendations.push('Consider reducing animation complexity or disabling animations');
  }
  
  if (report.metrics.averageTouchResponse && report.metrics.averageTouchResponse > 100) {
    report.recommendations.push('Touch response is slow, consider optimizing event handlers');
  }
  
  if (report.metrics.currentMemoryUsage) {
    const usagePercent = (report.metrics.currentMemoryUsage.used / report.metrics.currentMemoryUsage.limit) * 100;
    if (usagePercent > 70) {
      report.recommendations.push('High memory usage detected, consider implementing virtual scrolling or lazy loading');
    }
  }
  
  return report;
}

/**
 * Initialize mobile performance monitoring
 */
export function initializeMobilePerformance() {
  initializeDeviceDetection();
  
  if (process.env.NODE_ENV === 'development') {
    startFrameRateMonitoring();
    monitorMemoryUsage();
    
    // Log performance report every 30 seconds in development
    setInterval(() => {
      const report = getPerformanceReport();
      console.group('📱 Mobile Performance Report');
      console.log('Device:', report.deviceCapabilities);
      console.log('Metrics:', report.metrics);
      if (report.recommendations.length > 0) {
        console.warn('Recommendations:', report.recommendations);
      }
      console.groupEnd();
    }, 30000);
  }
  
  // Apply optimizations
  optimizeAnimations();
  
  return getOptimizedRenderSettings();
}