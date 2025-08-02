/**
 * Base Query Interface
 * Defines the contract for all queries in the CQRS architecture
 */

export interface IQuery {
  readonly type: string;
  readonly userId?: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Query Result Interface
 * Standardized return type for all query operations
 */
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    cacheHit: boolean;
    queryId: string;
    timestamp: Date;
    totalCount?: number;
    hasMore?: boolean;
  };
}

/**
 * Paginated Query Interface
 * For queries that support pagination
 */
export interface IPaginatedQuery extends IQuery {
  pagination?: {
    offset: number;
    limit: number;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * Filtered Query Interface
 * For queries that support filtering
 */
export interface IFilteredQuery extends IQuery {
  filters?: Record<string, any>;
  searchText?: string;
}

/**
 * Query Handler Interface
 * All query handlers must implement this interface
 */
export abstract class IQueryHandler<TQuery extends IQuery, TResult = any> {
  abstract handle(query: TQuery): Promise<QueryResult<TResult>>;
  
  protected async beforeHandle(query: TQuery): Promise<void> {
    // Override in derived classes for pre-processing
  }
  
  protected async afterHandle(query: TQuery, result: QueryResult<TResult>): Promise<void> {
    // Override in derived classes for post-processing
  }
  
  protected getCacheKey(query: TQuery): string | null {
    // Override to enable caching
    return null;
  }
  
  protected getCacheTTL(): number {
    // Default cache TTL in milliseconds
    return 30000; // 30 seconds
  }
}

/**
 * Query Bus Interface
 * Central dispatcher for all queries
 */
export interface IQueryBus {
  register<T extends IQuery>(queryType: string, handler: IQueryHandler<T>): void;
  execute<T extends IQuery, R = any>(query: T): Promise<QueryResult<R>>;
  middleware: QueryMiddleware[];
}

/**
 * Query Middleware Interface
 * For cross-cutting concerns like caching, logging, performance monitoring
 */
export interface QueryMiddleware {
  readonly name: string;
  readonly priority: number;
  execute<T extends IQuery>(
    query: T, 
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult>;
}

/**
 * Cache Manager Interface
 * Abstraction for query result caching
 */
export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Query Performance Metrics
 */
export interface QueryMetrics {
  queryType: string;
  executionTime: number;
  cacheHit: boolean;
  resultCount: number;
  timestamp: Date;
  userId?: string;
}