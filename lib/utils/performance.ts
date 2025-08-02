/**
 * Performance Monitoring Utilities
 * Comprehensive performance tracking and optimization tools for the Situ8 platform
 */

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
  TTI: number; // Time to Interactive
  
  // Custom metrics
  componentRenderTime: number;
  virtualScrollPerformance: number;
  stateUpdateTime: number;
  memoryUsage: number;
  bundleSize: number;
  
  // Real-time metrics
  timestamp: number;
  url: string;
  userAgent: string;
}

// Performance observer for Core Web Vitals
class WebVitalsObserver {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Navigation timing for TTFB and FCP
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          this.metrics.TTFB = navigation.responseStart - navigation.requestStart;
          
          const paint = performance.getEntriesByType('paint');
          const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            this.metrics.FCP = fcp.startTime;
          }
        }, 0);
      });
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React component performance profiler
export class ComponentProfiler {
  private measurements: Map<string, number[]> = new Map();
  private activeTimers: Map<string, number> = new Map();

  public startMeasure(componentName: string, operation = 'render') {
    const key = `${componentName}:${operation}`;
    this.activeTimers.set(key, performance.now());
  }

  public endMeasure(componentName: string, operation = 'render') {
    const key = `${componentName}:${operation}`;
    const startTime = this.activeTimers.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(key)) {
        this.measurements.set(key, []);
      }
      
      this.measurements.get(key)!.push(duration);
      this.activeTimers.delete(key);
      
      // Log slow renders (>16ms)
      if (duration > 16) {
        console.warn(`Slow ${operation} detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  public getAverageTime(componentName: string, operation = 'render'): number {
    const key = `${componentName}:${operation}`;
    const measurements = this.measurements.get(key);
    
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  public getStats() {
    const stats: Record<string, { average: number; count: number; max: number }> = {};
    
    this.measurements.forEach((times, key) => {
      stats[key] = {
        average: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length,
        max: Math.max(...times)
      };
    });
    
    return stats;
  }

  public clear() {
    this.measurements.clear();
    this.activeTimers.clear();
  }
}

// Virtual scrolling performance monitor
export class VirtualScrollMonitor {
  private scrollMetrics: {
    frameTime: number;
    scrollTop: number;
    timestamp: number;
  }[] = [];
  
  private frameCallback: number | null = null;
  private lastScrollTop = 0;
  private isMonitoring = false;

  public startMonitoring(scrollElement: HTMLElement) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    const handleScroll = () => {
      if (!this.frameCallback) {
        this.frameCallback = requestAnimationFrame(() => {
          const now = performance.now();
          const scrollTop = scrollElement.scrollTop;
          
          this.scrollMetrics.push({
            frameTime: now,
            scrollTop,
            timestamp: Date.now()
          });
          
          // Keep only last 100 measurements
          if (this.scrollMetrics.length > 100) {
            this.scrollMetrics = this.scrollMetrics.slice(-100);
          }
          
          this.lastScrollTop = scrollTop;
          this.frameCallback = null;
        });
      }
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (this.frameCallback) {
        cancelAnimationFrame(this.frameCallback);
      }
      this.isMonitoring = false;
    };
  }

  public getScrollPerformance() {
    if (this.scrollMetrics.length < 2) return { fps: 0, smoothness: 0 };
    
    const frameTimes = this.scrollMetrics.map(m => m.frameTime);
    const intervals = [];
    
    for (let i = 1; i < frameTimes.length; i++) {
      intervals.push(frameTimes[i] - frameTimes[i - 1]);
    }
    
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const fps = 1000 / averageInterval;
    
    // Calculate smoothness (percentage of frames within 60fps threshold)
    const targetInterval = 1000 / 60; // 16.67ms
    const smoothFrames = intervals.filter(interval => interval <= targetInterval * 1.5).length;
    const smoothness = (smoothFrames / intervals.length) * 100;
    
    return { fps, smoothness };
  }
}

// Memory usage monitor
export class MemoryMonitor {
  public getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    
    return null;
  }

  public monitorMemoryLeaks(interval = 10000) {
    const measurements: Array<{ timestamp: number; memory: number }> = [];
    
    const measure = () => {
      const memory = this.getMemoryUsage();
      if (memory) {
        measurements.push({
          timestamp: Date.now(),
          memory: memory.usedJSHeapSize
        });
        
        // Keep only last 50 measurements
        if (measurements.length > 50) {
          measurements.shift();
        }
        
        // Check for potential memory leaks (consistent growth over time)
        if (measurements.length >= 10) {
          const recent = measurements.slice(-10);
          const growth = recent[recent.length - 1].memory - recent[0].memory;
          const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
          const growthRate = growth / timeSpan; // bytes per ms
          
          if (growthRate > 1000) { // More than 1KB/ms growth
            console.warn('Potential memory leak detected:', {
              growthRate: `${(growthRate * 1000).toFixed(2)} bytes/sec`,
              currentUsage: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
            });
          }
        }
      }
    };
    
    const intervalId = setInterval(measure, interval);
    measure(); // Initial measurement
    
    return () => clearInterval(intervalId);
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  public async analyzeBundleSize() {
    try {
      const response = await fetch('/dist/stats.json');
      const stats = await response.json();
      
      return {
        totalSize: stats.assets.reduce((sum: number, asset: any) => sum + asset.size, 0),
        chunkSizes: stats.chunks.map((chunk: any) => ({
          name: chunk.name,
          size: chunk.size
        })),
        assetSizes: stats.assets.map((asset: any) => ({
          name: asset.name,
          size: asset.size
        }))
      };
    } catch (error) {
      console.warn('Could not analyze bundle size:', error);
      return null;
    }
  }
}

// Main performance monitor class
export class PerformanceMonitor {
  private webVitalsObserver: WebVitalsObserver;
  private componentProfiler: ComponentProfiler;
  private virtualScrollMonitor: VirtualScrollMonitor;
  private memoryMonitor: MemoryMonitor;
  private bundleAnalyzer: BundleAnalyzer;
  
  private metricsHistory: PerformanceMetrics[] = [];
  private reportingInterval: number | null = null;

  constructor() {
    this.webVitalsObserver = new WebVitalsObserver();
    this.componentProfiler = new ComponentProfiler();
    this.virtualScrollMonitor = new VirtualScrollMonitor();
    this.memoryMonitor = new MemoryMonitor();
    this.bundleAnalyzer = new BundleAnalyzer();
  }

  public startMonitoring(options: {
    reportInterval?: number;
    enableMemoryMonitoring?: boolean;
    onReport?: (metrics: PerformanceMetrics) => void;
  } = {}) {
    const { reportInterval = 30000, enableMemoryMonitoring = true, onReport } = options;
    
    // Start memory leak detection
    if (enableMemoryMonitoring) {
      this.memoryMonitor.monitorMemoryLeaks();
    }
    
    // Start periodic reporting
    this.reportingInterval = window.setInterval(async () => {
      const metrics = await this.getCompleteMetrics();
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 reports
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }
      
      onReport?.(metrics);
    }, reportInterval);
  }

  public async getCompleteMetrics(): Promise<PerformanceMetrics> {
    const webVitals = this.webVitalsObserver.getMetrics();
    const memory = this.memoryMonitor.getMemoryUsage();
    const componentStats = this.componentProfiler.getStats();
    const scrollPerf = this.virtualScrollMonitor.getScrollPerformance();
    
    // Calculate average component render time
    const renderTimes = Object.values(componentStats)
      .filter(stat => stat.average > 0)
      .map(stat => stat.average);
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0;

    return {
      FCP: webVitals.FCP || 0,
      LCP: webVitals.LCP || 0,
      FID: webVitals.FID || 0,
      CLS: webVitals.CLS || 0,
      TTFB: webVitals.TTFB || 0,
      TTI: 0, // Would need custom implementation
      componentRenderTime: avgRenderTime,
      virtualScrollPerformance: scrollPerf.fps,
      stateUpdateTime: 0, // Would be measured by store
      memoryUsage: memory?.usedJSHeapSize || 0,
      bundleSize: 0, // Would be set during build
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  public getPerformanceReport() {
    return {
      current: this.metricsHistory[this.metricsHistory.length - 1],
      history: this.metricsHistory,
      componentStats: this.componentProfiler.getStats(),
      scrollPerformance: this.virtualScrollMonitor.getScrollPerformance(),
      memoryUsage: this.memoryMonitor.getMemoryUsage()
    };
  }

  public cleanup() {
    this.webVitalsObserver.cleanup();
    this.componentProfiler.clear();
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }
}

// React hooks for performance monitoring
import { useEffect, useRef, useCallback } from 'react';

export const usePerformanceProfiler = (componentName: string) => {
  const profiler = useRef<ComponentProfiler>(new ComponentProfiler());
  
  const startRender = useCallback(() => {
    profiler.current.startMeasure(componentName, 'render');
  }, [componentName]);
  
  const endRender = useCallback(() => {
    profiler.current.endMeasure(componentName, 'render');
  }, [componentName]);
  
  const startOperation = useCallback((operation: string) => {
    profiler.current.startMeasure(componentName, operation);
  }, [componentName]);
  
  const endOperation = useCallback((operation: string) => {
    profiler.current.endMeasure(componentName, operation);
  }, [componentName]);
  
  return { startRender, endRender, startOperation, endOperation };
};

export const useVirtualScrollPerformance = (scrollElementRef: React.RefObject<HTMLElement>) => {
  const monitor = useRef<VirtualScrollMonitor>(new VirtualScrollMonitor());
  
  useEffect(() => {
    if (scrollElementRef.current) {
      const cleanup = monitor.current.startMonitoring(scrollElementRef.current);
      return cleanup;
    }
  }, [scrollElementRef]);
  
  const getPerformance = useCallback(() => {
    return monitor.current.getScrollPerformance();
  }, []);
  
  return { getPerformance };
};

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring for development
if (process.env.NODE_ENV === 'development') {
  globalPerformanceMonitor.startMonitoring({
    reportInterval: 10000, // Report every 10 seconds in dev
    onReport: (metrics) => {
      console.log('Performance Report:', metrics);
    }
  });
}