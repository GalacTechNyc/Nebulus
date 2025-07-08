/**
 * Performance Monitoring Service
 * Tracks and optimizes application performance across all processes
 */

import { logger } from '../security/error-handling';

export interface PerformanceMetrics {
  timestamp: number;
  category: 'startup' | 'render' | 'ai' | 'filesystem' | 'memory' | 'network';
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  external: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

export interface StartupMetrics {
  electronStart: number;
  mainProcessReady: number;
  rendererReady: number;
  firstPaint: number;
  firstContentfulPaint: number;
  totalStartupTime: number;
}

export interface AIServiceMetrics {
  service: 'openai' | 'anthropic' | 'gemini';
  operation: string;
  requestSize: number;
  responseSize: number;
  latency: number;
  success: boolean;
  errorType?: string;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private memorySnapshots: MemoryMetrics[] = [];
  private aiMetrics: AIServiceMetrics[] = [];
  private startupMetrics: Partial<StartupMetrics> = {};
  private isMonitoring: boolean = false;
  private memoryCheckInterval?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.isMonitoring) return;

    logger.info('Initializing performance monitoring', 'PerformanceMonitor');

    // Record startup metrics
    this.recordStartupMetrics();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Initialize performance observer for web vitals
    this.initializePerformanceObserver();

    // Monitor unhandled performance issues
    this.setupPerformanceWarnings();

    this.isMonitoring = true;
    logger.info('Performance monitoring initialized', 'PerformanceMonitor');
  }

  /**
   * Record startup metrics
   */
  private recordStartupMetrics(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.startupMetrics = {
        electronStart: Date.now() - performance.timeOrigin,
        mainProcessReady: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        rendererReady: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
      };

      this.startupMetrics.totalStartupTime = Math.max(
        this.startupMetrics.rendererReady || 0,
        this.startupMetrics.firstContentfulPaint || 0
      );

      logger.info('Startup metrics recorded', 'PerformanceMonitor', this.startupMetrics);
    }
  }

  /**
   * Get First Paint timing
   */
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const memoryMetrics: MemoryMetrics = {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          external: memUsage.external,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
        };

        this.memorySnapshots.push(memoryMetrics);

        // Keep only last 100 snapshots
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots = this.memorySnapshots.slice(-100);
        }

        // Check for memory leaks
        this.checkMemoryLeaks(memoryMetrics);
      }
    };

    // Check memory every 30 seconds
    this.memoryCheckInterval = setInterval(checkMemory, 30000);
    
    // Initial check
    checkMemory();
  }

  /**
   * Initialize performance observer
   */
  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            timestamp: Date.now(),
            category: 'render',
            operation: entry.name,
            duration: entry.duration,
            metadata: {
              entryType: entry.entryType,
              startTime: entry.startTime,
            },
          });
        }
      });

      // Observe various performance entry types
      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
      } catch (error) {
        logger.warn('Some performance entry types not supported', 'PerformanceMonitor', error);
      }
    }
  }

  /**
   * Setup performance warnings
   */
  private setupPerformanceWarnings(): void {
    // Warn about long tasks
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              logger.warn('Long task detected', 'PerformanceMonitor', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        logger.debug('Long task observer not supported', 'PerformanceMonitor');
      }
    }
  }

  /**
   * Check for memory leaks
   */
  private checkMemoryLeaks(currentMemory: MemoryMetrics): void {
    if (this.memorySnapshots.length < 10) return;

    const recent = this.memorySnapshots.slice(-10);
    const trend = this.calculateMemoryTrend(recent);

    // If memory usage is consistently increasing
    if (trend > 1.1) { // 10% increase trend
      logger.warn('Potential memory leak detected', 'PerformanceMonitor', {
        currentUsage: currentMemory.heapUsed,
        trend,
        recentSnapshots: recent.length,
      });
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(snapshots: MemoryMetrics[]): number {
    if (snapshots.length < 2) return 1;

    const first = snapshots[0].heapUsed;
    const last = snapshots[snapshots.length - 1].heapUsed;

    return last / first;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log slow operations
    if (metric.duration > 100) {
      logger.warn('Slow operation detected', 'PerformanceMonitor', metric);
    }
  }

  /**
   * Record AI service metrics
   */
  recordAIMetric(metric: AIServiceMetrics): void {
    this.aiMetrics.push(metric);

    // Keep only last 500 AI metrics
    if (this.aiMetrics.length > 500) {
      this.aiMetrics = this.aiMetrics.slice(-500);
    }

    // Log slow AI operations
    if (metric.latency > 5000) { // 5 seconds
      logger.warn('Slow AI operation detected', 'PerformanceMonitor', metric);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        timestamp: Date.now(),
        category: 'render',
        operation,
        duration,
      });
    };
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(
    operation: string,
    category: PerformanceMetrics['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        timestamp: Date.now(),
        category,
        operation,
        duration,
        metadata: { ...metadata, success: true },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        timestamp: Date.now(),
        category,
        operation,
        duration,
        metadata: { ...metadata, success: false, error: error.message },
      });
      
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    startup: StartupMetrics;
    memory: {
      current: MemoryMetrics;
      trend: number;
      leakWarning: boolean;
    };
    operations: {
      total: number;
      slow: number;
      averageDuration: number;
      categories: Record<string, number>;
    };
    ai: {
      total: number;
      averageLatency: number;
      successRate: number;
      serviceBreakdown: Record<string, number>;
    };
  } {
    const currentMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
    const memoryTrend = this.calculateMemoryTrend(this.memorySnapshots.slice(-10));
    
    const slowOperations = this.metrics.filter(m => m.duration > 100);
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    
    const categories = this.metrics.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successfulAI = this.aiMetrics.filter(m => m.success);
    const totalAILatency = this.aiMetrics.reduce((sum, m) => sum + m.latency, 0);
    
    const serviceBreakdown = this.aiMetrics.reduce((acc, m) => {
      acc[m.service] = (acc[m.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      startup: this.startupMetrics as StartupMetrics,
      memory: {
        current: currentMemory,
        trend: memoryTrend,
        leakWarning: memoryTrend > 1.1,
      },
      operations: {
        total: this.metrics.length,
        slow: slowOperations.length,
        averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
        categories,
      },
      ai: {
        total: this.aiMetrics.length,
        averageLatency: this.aiMetrics.length > 0 ? totalAILatency / this.aiMetrics.length : 0,
        successRate: this.aiMetrics.length > 0 ? successfulAI.length / this.aiMetrics.length : 0,
        serviceBreakdown,
      },
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    category: string;
    issue: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];
    const summary = this.getPerformanceSummary();

    // Startup performance
    if (summary.startup.totalStartupTime > 3000) {
      recommendations.push({
        category: 'startup',
        issue: 'Slow startup time',
        recommendation: 'Implement lazy loading and reduce initial bundle size',
        priority: 'high' as const,
      });
    }

    // Memory usage
    if (summary.memory.leakWarning) {
      recommendations.push({
        category: 'memory',
        issue: 'Potential memory leak detected',
        recommendation: 'Review component cleanup and event listener removal',
        priority: 'high' as const,
      });
    }

    // Slow operations
    if (summary.operations.slow > summary.operations.total * 0.1) {
      recommendations.push({
        category: 'performance',
        issue: 'High number of slow operations',
        recommendation: 'Optimize component rendering and use memoization',
        priority: 'medium' as const,
      });
    }

    // AI service performance
    if (summary.ai.averageLatency > 3000) {
      recommendations.push({
        category: 'ai',
        issue: 'High AI service latency',
        recommendation: 'Implement request caching and batching',
        priority: 'medium' as const,
      });
    }

    // AI service reliability
    if (summary.ai.successRate < 0.95) {
      recommendations.push({
        category: 'ai',
        issue: 'Low AI service success rate',
        recommendation: 'Implement retry logic and fallback services',
        priority: 'high' as const,
      });
    }

    return recommendations;
  }

  /**
   * Export performance data
   */
  exportData(): {
    metrics: PerformanceMetrics[];
    memorySnapshots: MemoryMetrics[];
    aiMetrics: AIServiceMetrics[];
    startupMetrics: Partial<StartupMetrics>;
    summary: ReturnType<typeof this.getPerformanceSummary>;
    recommendations: ReturnType<typeof this.getOptimizationRecommendations>;
  } {
    return {
      metrics: this.metrics,
      memorySnapshots: this.memorySnapshots,
      aiMetrics: this.aiMetrics,
      startupMetrics: this.startupMetrics,
      summary: this.getPerformanceSummary(),
      recommendations: this.getOptimizationRecommendations(),
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics = [];
    this.memorySnapshots = [];
    this.aiMetrics = [];
    this.startupMetrics = {};
    
    logger.info('Performance data cleared', 'PerformanceMonitor');
  }

  /**
   * Cleanup monitoring
   */
  cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.isMonitoring = false;
    logger.info('Performance monitoring stopped', 'PerformanceMonitor');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

