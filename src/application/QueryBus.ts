/**
 * Query Bus Implementation
 * Central dispatcher for all queries with caching and performance optimization
 */

import { IQuery, IQueryHandler, IQueryBus, QueryResult, QueryMiddleware, ICacheManager, QueryMetrics } from './queries/base/IQuery';

export class QueryBus implements IQueryBus {
  private handlers = new Map<string, IQueryHandler<any>>();
  public middleware: QueryMiddleware[] = [];
  private performanceMetrics = new Map<string, QueryPerformanceMetric>();
  private cacheManager: ICacheManager;
  private container?: any; // DIContainer reference for middleware dependencies

  constructor(cacheManager?: ICacheManager, container?: any) {
    this.cacheManager = cacheManager || new InMemoryCacheManager();
    this.container = container;
    this.initializeMiddleware();
  }

  private initializeMiddleware(): void {
    // Create middleware instances - they can use container if available
    this.middleware = [
      new CachingMiddleware(this.cacheManager, this.container),
      new LoggingMiddleware(this.container),
      new PerformanceMiddleware(this.container),
      new ValidationMiddleware(this.container),
      new ErrorHandlingMiddleware(this.container),
    ].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Set the DI container for dependency resolution in middleware
   */
  setContainer(container: any): void {
    this.container = container;
    this.initializeMiddleware(); // Reinitialize middleware with container
  }

  register<T extends IQuery>(queryType: string, handler: IQueryHandler<T>): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler already registered for query type: ${queryType}`);
    }
    
    this.handlers.set(queryType, handler);
    console.log(`✅ Registered query handler for: ${queryType}`);
  }

  async execute<T extends IQuery, R = any>(query: T): Promise<QueryResult<R>> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    
    // Enhance query with metadata
    const enhancedQuery = {
      ...query,
      correlationId: query.correlationId || queryId,
      timestamp: query.timestamp || new Date(),
      metadata: {
        ...query.metadata,
        queryId,
        busVersion: '1.0.0',
      }
    };

    try {
      // Find handler
      const handler = this.handlers.get(query.type);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for query type: ${query.type}`,
          metadata: {
            executionTime: Date.now() - startTime,
            cacheHit: false,
            queryId,
            timestamp: new Date(),
          }
        };
      }

      // Execute middleware pipeline
      const result = await this.executeMiddlewarePipeline(enhancedQuery, handler);
      
      // Update performance metrics
      this.updatePerformanceMetrics(query.type, Date.now() - startTime, result.success, result.metadata?.cacheHit || false);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime: Date.now() - startTime,
          queryId,
          timestamp: new Date(),
        }
      };

    } catch (error) {
      const errorResult: QueryResult<R> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit: false,
          queryId,
          timestamp: new Date(),
        }
      };

      // Update performance metrics for errors
      this.updatePerformanceMetrics(query.type, Date.now() - startTime, false, false);
      
      return errorResult;
    }
  }

  private async executeMiddlewarePipeline<T extends IQuery>(
    query: T,
    handler: IQueryHandler<T>
  ): Promise<QueryResult> {
    let index = 0;

    const next = async (q: T): Promise<QueryResult> => {
      if (index >= this.middleware.length) {
        // All middleware executed, call the actual handler
        return await handler.handle(q);
      }

      const middleware = this.middleware[index++];
      return await middleware.execute(q, next);
    };

    return await next(query);
  }

  private generateQueryId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `qry_${timestamp}_${randomPart}`;
  }

  private updatePerformanceMetrics(queryType: string, executionTime: number, success: boolean, cacheHit: boolean): void {
    const existing = this.performanceMetrics.get(queryType) || {
      queryType,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      lastExecution: new Date(),
    };

    existing.totalExecutions++;
    existing.totalExecutionTime += executionTime;
    existing.averageExecutionTime = existing.totalExecutionTime / existing.totalExecutions;
    existing.minExecutionTime = Math.min(existing.minExecutionTime, executionTime);
    existing.maxExecutionTime = Math.max(existing.maxExecutionTime, executionTime);
    existing.lastExecution = new Date();

    if (success) {
      existing.successfulExecutions++;
    } else {
      existing.failedExecutions++;
    }

    if (cacheHit) {
      existing.cacheHits++;
    } else {
      existing.cacheMisses++;
    }

    this.performanceMetrics.set(queryType, existing);
  }

  // Public methods for monitoring and diagnostics
  getPerformanceMetrics(): QueryPerformanceMetric[] {
    return Array.from(this.performanceMetrics.values());
  }

  getQueryMetrics(queryType: string): QueryPerformanceMetric | undefined {
    return this.performanceMetrics.get(queryType);
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  async clearCache(pattern?: string): Promise<void> {
    await this.cacheManager.clear(pattern);
  }

  addMiddleware(middleware: QueryMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => a.priority - b.priority);
  }

  removeMiddleware(middlewareName: string): void {
    this.middleware = this.middleware.filter(m => m.name !== middlewareName);
  }

  getCacheStats(): CacheStats {
    const metrics = this.getPerformanceMetrics();
    const totalQueries = metrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    const totalCacheHits = metrics.reduce((sum, m) => sum + m.cacheHits, 0);
    
    return {
      totalQueries,
      totalCacheHits,
      cacheHitRate: totalQueries > 0 ? (totalCacheHits / totalQueries) * 100 : 0,
      averageExecutionTime: metrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / (metrics.length || 1),
    };
  }
}

// ===== CACHE MANAGER IMPLEMENTATION =====

class InMemoryCacheManager implements ICacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 1000;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 30000): Promise<void> {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldestEntries();
    }

    const entry: CacheEntry = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

// ===== MIDDLEWARE IMPLEMENTATIONS =====

class CachingMiddleware implements QueryMiddleware {
  readonly name = 'CachingMiddleware';
  readonly priority = 5; // High priority - run early

  constructor(private cacheManager: ICacheManager, private container?: any) {}

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    // Generate cache key - this could be more sophisticated
    const cacheKey = this.generateCacheKey(query);
    
    // Try to get from cache
    const cachedResult = await this.cacheManager.get<QueryResult>(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          cacheHit: true,
          executionTime: 0, // Cache hits are essentially instant
        }
      };
    }

    // Execute query
    const result = await next(query);

    // Cache successful results only
    if (result.success && this.shouldCache(query, result)) {
      const ttl = this.getCacheTTL(query);
      await this.cacheManager.set(cacheKey, result, ttl);
    }

    return {
      ...result,
      metadata: {
        ...result.metadata,
        cacheHit: false,
      }
    };
  }

  private generateCacheKey<T extends IQuery>(query: T): string {
    // Create a deterministic cache key from query properties
    const keyData = {
      type: query.type,
      ...query,
      timestamp: undefined, // Exclude timestamp from cache key
      correlationId: undefined,
      metadata: undefined,
    };
    
    return `query:${query.type}:${this.hashObject(keyData)}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private shouldCache<T extends IQuery>(query: T, result: QueryResult): boolean {
    // Don't cache large result sets
    if (result.data && Array.isArray(result.data) && result.data.length > 100) {
      return false;
    }

    // Don't cache real-time or user-specific queries
    if (query.type.includes('realtime') || query.type.includes('current')) {
      return false;
    }

    return true;
  }

  private getCacheTTL<T extends IQuery>(query: T): number {
    // Different TTLs based on query type
    if (query.type.includes('stats') || query.type.includes('Stats')) {
      return 60000; // 1 minute for stats
    } else if (query.type.includes('search') || query.type.includes('Search')) {
      return 120000; // 2 minutes for searches
    }
    
    return 30000; // 30 seconds default
  }
}

class LoggingMiddleware implements QueryMiddleware {
  readonly name = 'LoggingMiddleware';
  readonly priority = 20;

  constructor(private container?: any) {}

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Executing query: ${query.type}`, {
      queryId: query.metadata?.queryId,
      userId: query.userId,
      timestamp: query.timestamp,
    });

    try {
      const result = await next(query);
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        const resultSize = result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0;
        console.log(`✅ Query executed successfully: ${query.type} (${executionTime}ms, ${resultSize} results, cache: ${result.metadata?.cacheHit ? 'HIT' : 'MISS'})`);
      } else {
        console.error(`❌ Query failed: ${query.type} (${executionTime}ms)`, {
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`💥 Query threw exception: ${query.type} (${executionTime}ms)`, error);
      throw error;
    }
  }
}

class PerformanceMiddleware implements QueryMiddleware {
  readonly name = 'PerformanceMiddleware';
  readonly priority = 10;

  constructor(private container?: any) {}

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const result = await next(query);
    const executionTime = Date.now() - startTime;

    // Log slow queries
    if (executionTime > 500 && !result.metadata?.cacheHit) { // > 500ms for non-cached queries
      console.warn(`🐌 Slow query detected: ${query.type} (${executionTime}ms)`);
    }

    // Add performance data to result metadata
    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime,
        performanceFlags: {
          slow: executionTime > 500 && !result.metadata?.cacheHit,
          verySlow: executionTime > 2000 && !result.metadata?.cacheHit,
        }
      }
    };
  }
}

class ValidationMiddleware implements QueryMiddleware {
  readonly name = 'ValidationMiddleware';
  readonly priority = 15;

  constructor(private container?: any) {}

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    // Basic query validation
    if (!query.type) {
      return {
        success: false,
        error: 'Query type is required',
        metadata: {
          executionTime: 0,
          cacheHit: false,
          queryId: 'invalid',
          timestamp: new Date(),
        }
      };
    }

    // Validate pagination parameters
    if ('pagination' in query && query.pagination) {
      const { offset, limit } = query.pagination;
      if (offset < 0) {
        return {
          success: false,
          error: 'Pagination offset must be non-negative',
          metadata: {
            executionTime: 0,
            cacheHit: false,
            queryId: query.metadata?.queryId || 'invalid',
            timestamp: new Date(),
          }
        };
      }
      if (limit <= 0 || limit > 1000) {
        return {
          success: false,
          error: 'Pagination limit must be between 1 and 1000',
          metadata: {
            executionTime: 0,
            cacheHit: false,
            queryId: query.metadata?.queryId || 'invalid',
            timestamp: new Date(),
          }
        };
      }
    }

    return await next(query);
  }
}

class ErrorHandlingMiddleware implements QueryMiddleware {
  readonly name = 'ErrorHandlingMiddleware';
  readonly priority = 100; // Low priority - run last

  constructor(private container?: any) {}

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    try {
      return await next(query);
    } catch (error) {
      console.error(`💥 Unhandled error in query ${query.type}:`, error);

      // Convert uncaught exceptions to QueryResult
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unhandled error occurred',
        metadata: {
          executionTime: 0,
          cacheHit: false,
          queryId: query.metadata?.queryId || 'unknown',
          timestamp: new Date(),
          errorType: 'unhandled_exception',
          originalError: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
        }
      };
    }
  }
}

// ===== SUPPORTING TYPES =====

interface CacheEntry {
  value: any;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
}

interface QueryPerformanceMetric {
  queryType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  cacheHits: number;
  cacheMisses: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  lastExecution: Date;
}

interface CacheStats {
  totalQueries: number;
  totalCacheHits: number;
  cacheHitRate: number;
  averageExecutionTime: number;
}

// Singleton instance
export const queryBus = new QueryBus();