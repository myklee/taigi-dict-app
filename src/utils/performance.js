/**
 * Performance monitoring utilities for router and application performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true'
  }

  /**
   * Start measuring a performance metric
   * @param {string} name - Name of the metric
   * @param {object} metadata - Additional metadata
   */
  start(name, metadata = {}) {
    if (!this.enabled) return

    this.metrics.set(name, {
      startTime: performance.now(),
      metadata,
      completed: false
    })
  }

  /**
   * End measuring a performance metric
   * @param {string} name - Name of the metric
   * @param {object} additionalData - Additional data to include
   */
  end(name, additionalData = {}) {
    if (!this.enabled) return

    const metric = this.metrics.get(name)
    if (!metric || metric.completed) return

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration
    metric.completed = true
    metric.additionalData = additionalData

    // Log performance metrics in development
    if (import.meta.env.DEV) {
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`, {
        ...metric.metadata,
        ...additionalData
      })
    }

    // Send to analytics in production (if configured)
    this.sendToAnalytics(name, metric)

    return metric
  }

  /**
   * Measure a function execution time
   * @param {string} name - Name of the metric
   * @param {Function} fn - Function to measure
   * @param {object} metadata - Additional metadata
   */
  async measure(name, fn, metadata = {}) {
    this.start(name, metadata)
    try {
      const result = await fn()
      this.end(name, { success: true })
      return result
    } catch (error) {
      this.end(name, { success: false, error: error.message })
      throw error
    }
  }

  /**
   * Get all completed metrics
   */
  getMetrics() {
    const completed = new Map()
    for (const [name, metric] of this.metrics) {
      if (metric.completed) {
        completed.set(name, metric)
      }
    }
    return completed
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metrics = this.getMetrics()
    const summary = {
      totalMetrics: metrics.size,
      averageDuration: 0,
      slowestOperation: null,
      fastestOperation: null
    }

    if (metrics.size === 0) return summary

    let totalDuration = 0
    let slowest = { duration: 0 }
    let fastest = { duration: Infinity }

    for (const [name, metric] of metrics) {
      totalDuration += metric.duration
      
      if (metric.duration > slowest.duration) {
        slowest = { name, ...metric }
      }
      
      if (metric.duration < fastest.duration) {
        fastest = { name, ...metric }
      }
    }

    summary.averageDuration = totalDuration / metrics.size
    summary.slowestOperation = slowest
    summary.fastestOperation = fastest

    return summary
  }

  /**
   * Send metrics to analytics service
   * @param {string} name - Metric name
   * @param {object} metric - Metric data
   */
  sendToAnalytics(name, metric) {
    // Implement analytics integration here
    // For example: Google Analytics, Mixpanel, etc.
    
    // Example implementation:
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        duration: metric.duration,
        metadata: JSON.stringify(metric.metadata)
      })
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear()
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Router-specific performance monitoring
 */
export class RouterPerformanceMonitor {
  constructor(router) {
    this.router = router
    this.setupRouterMonitoring()
  }

  setupRouterMonitoring() {
    // Monitor route navigation performance
    this.router.beforeEach((to, from, next) => {
      const routeName = to.name || to.path
      performanceMonitor.start(`route_navigation_${routeName}`, {
        from: from.name || from.path,
        to: routeName,
        params: to.params,
        query: to.query
      })
      next()
    })

    this.router.afterEach((to, from) => {
      const routeName = to.name || to.path
      performanceMonitor.end(`route_navigation_${routeName}`, {
        success: true
      })
    })

    // Monitor route resolution errors
    this.router.onError((error) => {
      const routeName = this.router.currentRoute.value.name || this.router.currentRoute.value.path
      performanceMonitor.end(`route_navigation_${routeName}`, {
        success: false,
        error: error.message
      })
    })
  }

  /**
   * Get router-specific performance metrics
   */
  getRouterMetrics() {
    const allMetrics = performanceMonitor.getMetrics()
    const routerMetrics = new Map()

    for (const [name, metric] of allMetrics) {
      if (name.startsWith('route_navigation_')) {
        routerMetrics.set(name, metric)
      }
    }

    return routerMetrics
  }

  /**
   * Get route performance summary
   */
  getRouteSummary() {
    const routerMetrics = this.getRouterMetrics()
    const routeStats = new Map()

    for (const [name, metric] of routerMetrics) {
      const routeName = name.replace('route_navigation_', '')
      
      if (!routeStats.has(routeName)) {
        routeStats.set(routeName, {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          errors: 0
        })
      }

      const stats = routeStats.get(routeName)
      stats.count++
      stats.totalDuration += metric.duration
      stats.minDuration = Math.min(stats.minDuration, metric.duration)
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration)
      
      if (metric.additionalData && !metric.additionalData.success) {
        stats.errors++
      }
      
      stats.averageDuration = stats.totalDuration / stats.count
    }

    return routeStats
  }
}

/**
 * Component loading performance monitor
 */
export function monitorComponentLoading(componentName, loadPromise) {
  return performanceMonitor.measure(
    `component_load_${componentName}`,
    () => loadPromise,
    { componentName }
  )
}

/**
 * Bundle chunk loading monitor
 */
export function monitorChunkLoading(chunkName, loadPromise) {
  return performanceMonitor.measure(
    `chunk_load_${chunkName}`,
    () => loadPromise,
    { chunkName }
  )
}

/**
 * Initialize performance monitoring for the application
 */
export function initializePerformanceMonitoring(router) {
  // Set up router monitoring
  new RouterPerformanceMonitor(router)

  // Monitor initial page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      performanceMonitor.end('initial_page_load', {
        loadTime: performance.now(),
        timing: performance.timing
      })
    })

    // Start measuring initial page load
    performanceMonitor.start('initial_page_load', {
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  // Log performance summary periodically in development
  if (import.meta.env.DEV) {
    setInterval(() => {
      const summary = performanceMonitor.getSummary()
      if (summary.totalMetrics > 0) {
        console.log('📊 Performance Summary:', summary)
      }
    }, 30000) // Every 30 seconds
  }
}

export default performanceMonitor