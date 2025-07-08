/**
 * AI Service Optimization Layer
 * Implements caching, batching, and performance optimizations for AI services
 */

import { errorLogger as logger } from '../security/error-handling';
import { performanceMonitor } from './performance-monitor';

export interface AIRequest {
  id: string;
  service: 'openai' | 'anthropic' | 'gemini';
  operation: string;
  payload: any;
  priority: 'low' | 'normal' | 'high';
  timestamp: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface AIResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  cached: boolean;
  latency: number;
  service: string;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  enableBatching: boolean;
}

/**
 * AI Service Optimizer Class
 */
export class AIServiceOptimizer {
  private static instance: AIServiceOptimizer;
  private cache = new Map<string, CacheEntry>();
  private requestQueue: AIRequest[] = [];
  private batchTimer?: NodeJS.Timeout;
  private isProcessing = false;
  
  private config: BatchConfig = {
    maxBatchSize: 5,
    maxWaitTime: 100, // 100ms
    enableBatching: true,
  };

  private constructor() {}

  static getInstance(): AIServiceOptimizer {
    if (!AIServiceOptimizer.instance) {
      AIServiceOptimizer.instance = new AIServiceOptimizer();
    }
    return AIServiceOptimizer.instance;
  }

  /**
   * Initialize the optimizer
   */
  initialize(config?: Partial<BatchConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute

    logger.info('AI Service Optimizer initialized', 'AIServiceOptimizer', this.config);
  }

  /**
   * Process AI request with optimization
   */
  async processRequest(request: Omit<AIRequest, 'id' | 'timestamp'>): Promise<AIResponse> {
    const optimizedRequest: AIRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: Date.now(),
    };

    // Check cache first
    if (optimizedRequest.cacheKey) {
      const cachedResponse = this.getCachedResponse(optimizedRequest.cacheKey);
      if (cachedResponse) {
        logger.debug('Cache hit for AI request', 'AIServiceOptimizer', {
          requestId: optimizedRequest.id,
          cacheKey: optimizedRequest.cacheKey,
        });

        return {
          id: optimizedRequest.id,
          success: true,
          data: cachedResponse,
          cached: true,
          latency: 0,
          service: optimizedRequest.service,
        };
      }
    }

    // Add to queue for batching or process immediately
    if (this.config.enableBatching && optimizedRequest.priority !== 'high') {
      return this.addToQueue(optimizedRequest);
    } else {
      return this.processImmediately(optimizedRequest);
    }
  }

  /**
   * Add request to batch queue
   */
  private async addToQueue(request: AIRequest): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      // Add resolve/reject to request for later callback
      (request as any).resolve = resolve;
      (request as any).reject = reject;

      this.requestQueue.push(request);

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }

      // Process immediately if batch is full
      if (this.requestQueue.length >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Process batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    const batch = this.requestQueue.splice(0, this.config.maxBatchSize);
    
    logger.debug('Processing AI request batch', 'AIServiceOptimizer', {
      batchSize: batch.length,
      services: [...new Set(batch.map(r => r.service))],
    });

    // Group by service for efficient processing
    const serviceGroups = this.groupByService(batch);

    // Process each service group
    const promises = Object.entries(serviceGroups).map(([service, requests]) =>
      this.processServiceBatch(service as AIRequest['service'], requests)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error('Batch processing failed', 'AIServiceOptimizer', error);
    }

    this.isProcessing = false;

    // Process next batch if queue has items
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processBatch(), 0);
    }
  }

  /**
   * Group requests by service
   */
  private groupByService(requests: AIRequest[]): Record<string, AIRequest[]> {
    return requests.reduce((groups, request) => {
      if (!groups[request.service]) {
        groups[request.service] = [];
      }
      groups[request.service].push(request);
      return groups;
    }, {} as Record<string, AIRequest[]>);
  }

  /**
   * Process batch for specific service
   */
  private async processServiceBatch(service: AIRequest['service'], requests: AIRequest[]): Promise<void> {
    // Sort by priority
    requests.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process requests
    for (const request of requests) {
      try {
        const response = await this.processImmediately(request);
        (request as any).resolve(response);
      } catch (error) {
        (request as any).reject(error);
      }
    }
  }

  /**
   * Process request immediately
   */
  private async processImmediately(request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now();

    try {
      logger.debug('Processing AI request', 'AIServiceOptimizer', {
        requestId: request.id,
        service: request.service,
        operation: request.operation,
      });

      // Call the actual AI service
      const data = await this.callAIService(request);
      const latency = performance.now() - startTime;

      // Cache the response if cache key is provided
      if (request.cacheKey) {
        this.cacheResponse(request.cacheKey, data, request.cacheTTL || 300000); // 5 min default
      }

      // Record performance metrics
      performanceMonitor.recordAIMetric({
        service: request.service,
        operation: request.operation,
        requestSize: JSON.stringify(request.payload).length,
        responseSize: JSON.stringify(data).length,
        latency,
        success: true,
      });

      return {
        id: request.id,
        success: true,
        data,
        cached: false,
        latency,
        service: request.service,
      };
    } catch (error) {
      const latency = performance.now() - startTime;

      // Record failed metrics
      performanceMonitor.recordAIMetric({
        service: request.service,
        operation: request.operation,
        requestSize: JSON.stringify(request.payload).length,
        responseSize: 0,
        latency,
        success: false,
        errorType: error.message,
      });

      logger.error('AI request failed', 'AIServiceOptimizer', error, {
        requestId: request.id,
        service: request.service,
        operation: request.operation,
      });

      return {
        id: request.id,
        success: false,
        error: error.message,
        cached: false,
        latency,
        service: request.service,
      };
    }
  }

  /**
   * Call AI service (placeholder for actual implementation)
   */
  private async callAIService(request: AIRequest): Promise<any> {
    // This would be replaced with actual AI service calls
    // For now, simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      result: `Mock response for ${request.operation}`,
      service: request.service,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get cached response
   */
  private getCachedResponse(cacheKey: string): any | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, data: any, ttl: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(cacheKey, entry);

    // Limit cache size
    if (this.cache.size > 1000) {
      this.evictLeastUsed();
    }
  }

  /**
   * Evict least used cache entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access count and last accessed time
    entries.sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;
      
      if (entryA.accessCount !== entryB.accessCount) {
        return entryA.accessCount - entryB.accessCount;
      }
      
      return entryA.lastAccessed - entryB.lastAccessed;
    });

    // Remove bottom 10%
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.debug('Evicted cache entries', 'AIServiceOptimizer', {
      removed: toRemove,
      remaining: this.cache.size,
    });
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cleaned up expired cache entries', 'AIServiceOptimizer', {
        removed,
        remaining: this.cache.size,
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
    totalHits: number;
    averageAccessCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track this separately
      totalRequests: 0, // Would need to track this separately
      totalHits: 0, // Would need to track this separately
      averageAccessCount: entries.length > 0 ? totalAccess / entries.length : 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('AI Service Optimizer config updated', 'AIServiceOptimizer', this.config);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('AI Service cache cleared', 'AIServiceOptimizer', { entriesRemoved: size });
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    cache: ReturnType<typeof this.getCacheStats>;
    queue: {
      currentSize: number;
      isProcessing: boolean;
      batchConfig: BatchConfig;
    };
    performance: {
      averageBatchSize: number;
      averageWaitTime: number;
      cacheHitRatio: number;
    };
  } {
    return {
      cache: this.getCacheStats(),
      queue: {
        currentSize: this.requestQueue.length,
        isProcessing: this.isProcessing,
        batchConfig: this.config,
      },
      performance: {
        averageBatchSize: 0, // Would need to track this
        averageWaitTime: 0, // Would need to track this
        cacheHitRatio: 0, // Would need to track this
      },
    };
  }

  /**
   * Cleanup optimizer
   */
  cleanup(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.cache.clear();
    this.requestQueue = [];
    this.isProcessing = false;

    logger.info('AI Service Optimizer cleaned up', 'AIServiceOptimizer');
  }
}

// Export singleton instance
export const aiOptimizer = AIServiceOptimizer.getInstance();

