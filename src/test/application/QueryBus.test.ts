/**
 * Unit Tests for QueryBus
 * Tests query execution, caching, middleware pipeline, and performance metrics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryBus } from '../../application/QueryBus'
import { IQuery, IQueryHandler, QueryResult, QueryMiddleware, ICacheManager } from '../../application/queries/base/IQuery'

// Mock query types
interface TestQuery extends IQuery {
  type: 'TestQuery'
  data: {
    searchTerm: string
    includeArchived?: boolean
  }
}

interface TestQueryResult {
  items: string[]
  total: number
  searchTerm: string
}

// Mock query handler
class TestQueryHandler extends IQueryHandler<TestQuery, TestQueryResult> {
  private delay: number = 0
  private shouldFail: boolean = false
  private mockData: string[] = ['item1', 'item2', 'item3', 'archived1']

  protected getCacheKey(query: TestQuery): string {
    return `test:${query.data.searchTerm}:${query.data.includeArchived || false}`
  }

  protected getCacheTTL(): number {
    return 30000 // 30 seconds
  }

  async handle(query: TestQuery): Promise<QueryResult<TestQueryResult>> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    if (this.shouldFail) {
      return {
        success: false,
        error: 'Handler failed as requested'
      }
    }

    let filteredItems = this.mockData.filter(item => 
      item.toLowerCase().includes(query.data.searchTerm.toLowerCase())
    )

    if (!query.data.includeArchived) {
      filteredItems = filteredItems.filter(item => !item.includes('archived'))
    }

    return {
      success: true,
      data: {
        items: filteredItems,
        total: filteredItems.length,
        searchTerm: query.data.searchTerm
      }
    }
  }

  // Test helper methods
  setDelay(delay: number) {
    this.delay = delay
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  setMockData(data: string[]) {
    this.mockData = data
  }
}

// Mock cache manager
class MockCacheManager implements ICacheManager {
  private cache = new Map<string, any>()
  private ttls = new Map<string, number>()
  private shouldFail = false

  async get<T>(key: string): Promise<T | null> {
    if (this.shouldFail) {
      throw new Error('Cache get failed')
    }

    const ttl = this.ttls.get(key)
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key)
      this.ttls.delete(key)
      return null
    }

    return this.cache.get(key) || null
  }

  async set<T>(key: string, value: T, ttl: number = 30000): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Cache set failed')
    }

    this.cache.set(key, value)
    this.ttls.set(key, Date.now() + ttl)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    this.ttls.delete(key)
  }

  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      const regex = new RegExp(pattern)
      const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key))
      keysToDelete.forEach(key => {
        this.cache.delete(key)
        this.ttls.delete(key)
      })
    } else {
      this.cache.clear()
      this.ttls.clear()
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  // Test helper methods
  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  getSize(): number {
    return this.cache.size
  }

  getAllKeys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Mock middleware
class TestMiddleware implements QueryMiddleware {
  readonly name = 'TestMiddleware'
  readonly priority: number
  private shouldFail: boolean = false
  private delay: number = 0

  constructor(priority: number = 50) {
    this.priority = priority
  }

  async execute<T extends IQuery>(
    query: T,
    next: (query: T) => Promise<QueryResult>
  ): Promise<QueryResult> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    if (this.shouldFail) {
      return {
        success: false,
        error: 'Middleware failed',
        metadata: {
          executionTime: 0,
          cacheHit: false,
          queryId: 'test',
          timestamp: new Date()
        }
      }
    }

    // Add test metadata
    const enhancedQuery = {
      ...query,
      metadata: {
        ...query.metadata,
        testMiddlewareExecuted: true
      }
    }

    return await next(enhancedQuery)
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  setDelay(delay: number) {
    this.delay = delay
  }
}

const createTestQuery = (overrides: Partial<TestQuery> = {}): TestQuery => ({
  type: 'TestQuery',
  userId: 'test-user',
  timestamp: new Date(),
  correlationId: 'test-correlation',
  metadata: {},
  data: {
    searchTerm: 'item'
  },
  ...overrides
})

describe('QueryBus', () => {
  let queryBus: QueryBus
  let testHandler: TestQueryHandler
  let mockCacheManager: MockCacheManager

  beforeEach(() => {
    mockCacheManager = new MockCacheManager()
    queryBus = new QueryBus(mockCacheManager)
    testHandler = new TestQueryHandler()
    vi.clearAllMocks()
    
    // Clear default middleware to avoid interference
    queryBus.middleware = []
  })

  afterEach(() => {
    queryBus.clearPerformanceMetrics()
  })

  describe('Handler Registration', () => {
    it('should register query handlers successfully', () => {
      expect(() => {
        queryBus.register('TestQuery', testHandler)
      }).not.toThrow()
    })

    it('should prevent duplicate handler registration', () => {
      queryBus.register('TestQuery', testHandler)
      
      expect(() => {
        queryBus.register('TestQuery', new TestQueryHandler())
      }).toThrow('Handler already registered for query type: TestQuery')
    })

    it('should allow different handlers for different query types', () => {
      const anotherHandler = new TestQueryHandler()
      
      expect(() => {
        queryBus.register('TestQuery', testHandler)
        queryBus.register('AnotherQuery', anotherHandler)
      }).not.toThrow()
    })
  })

  describe('Query Execution', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should execute queries successfully', async () => {
      const query = createTestQuery()
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.items).toContain('item1')
      expect(result.data!.items).toContain('item2')
      expect(result.data!.total).toBe(3) // item1, item2, item3 (archived1 filtered out)
      expect(result.data!.searchTerm).toBe('item')
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.executionTime).toBeTypeOf('number')
      expect(result.metadata!.queryId).toMatch(/^qry_/)
    })

    it('should handle handler failures', async () => {
      testHandler.setShouldFail(true)
      const query = createTestQuery()
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Handler failed as requested')
      expect(result.data).toBeUndefined()
    })

    it('should return error for unregistered query types', async () => {
      const query = { ...createTestQuery(), type: 'UnregisteredQuery' as any }
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No handler registered for query type: UnregisteredQuery')
    })

    it('should enhance queries with metadata', async () => {
      const query = createTestQuery({ correlationId: undefined })
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(result.metadata!.queryId).toBeDefined()
      expect(result.metadata!.timestamp).toBeInstanceOf(Date)
    })

    it('should handle filtered results', async () => {
      const query = createTestQuery({ 
        data: { 
          searchTerm: 'archived',
          includeArchived: true 
        }
      })
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(result.data!.items).toContain('archived1')
      expect(result.data!.total).toBe(1)
    })

    it('should filter archived items by default', async () => {
      const query = createTestQuery({ 
        data: { searchTerm: 'archived' }
      })
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(result.data!.items).not.toContain('archived1')
      expect(result.data!.total).toBe(0)
    })
  })

  describe('Caching', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should cache successful query results', async () => {
      const query = createTestQuery()
      
      // First execution - cache miss
      const result1 = await queryBus.execute(query)
      expect(result1.success).toBe(true)
      expect(result1.metadata!.cacheHit).toBe(false)
      
      // Second execution - cache hit
      const result2 = await queryBus.execute(query)
      expect(result2.success).toBe(true)
      expect(result2.metadata!.cacheHit).toBe(true)
      expect(result2.metadata!.executionTime).toBe(0) // Cache hits are instant
    })

    it('should not cache failed queries', async () => {
      testHandler.setShouldFail(true)
      const query = createTestQuery()
      
      const result1 = await queryBus.execute(query)
      expect(result1.success).toBe(false)
      
      testHandler.setShouldFail(false)
      const result2 = await queryBus.execute(query)
      expect(result2.success).toBe(true)
      expect(result2.metadata!.cacheHit).toBe(false) // No cache hit for failed query
    })

    it('should generate different cache keys for different queries', async () => {
      const query1 = createTestQuery({ data: { searchTerm: 'item1' } })
      const query2 = createTestQuery({ data: { searchTerm: 'item2' } })
      
      await queryBus.execute(query1)
      await queryBus.execute(query2)
      
      expect(mockCacheManager.getSize()).toBe(2)
    })

    it('should respect cache TTL', async () => {
      const query = createTestQuery()
      
      // First execution
      const result1 = await queryBus.execute(query)
      expect(result1.metadata!.cacheHit).toBe(false)
      
      // Mock time passing beyond TTL
      const originalSet = mockCacheManager.set
      mockCacheManager.set = vi.fn().mockImplementation((key, value, ttl) => {
        return originalSet.call(mockCacheManager, key, value, -1) // Expired immediately
      })
      
      // Second execution should be cache miss due to expiration
      const result2 = await queryBus.execute(query)
      expect(result2.metadata!.cacheHit).toBe(false)
    })

    it('should handle cache failures gracefully', async () => {
      mockCacheManager.setShouldFail(true)
      const query = createTestQuery()
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true) // Query should still succeed
      expect(result.metadata!.cacheHit).toBe(false)
    })

    it('should support cache clearing', async () => {
      const query = createTestQuery()
      
      await queryBus.execute(query)
      expect(mockCacheManager.getSize()).toBe(1)
      
      await queryBus.clearCache()
      expect(mockCacheManager.getSize()).toBe(0)
    })

    it('should support pattern-based cache clearing', async () => {
      const query1 = createTestQuery({ data: { searchTerm: 'test1' } })
      const query2 = createTestQuery({ data: { searchTerm: 'test2' } })
      const query3 = createTestQuery({ data: { searchTerm: 'other' } })
      
      await queryBus.execute(query1)
      await queryBus.execute(query2)
      await queryBus.execute(query3)
      
      expect(mockCacheManager.getSize()).toBe(3)
      
      await queryBus.clearCache('test')
      
      const remainingKeys = mockCacheManager.getAllKeys()
      expect(remainingKeys.some(key => key.includes('other'))).toBe(true)
      expect(remainingKeys.some(key => key.includes('test'))).toBe(false)
    })
  })

  describe('Middleware Pipeline', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should execute middleware in priority order', async () => {
      const executionOrder: number[] = []
      
      const middleware1 = new TestMiddleware(10)
      const middleware2 = new TestMiddleware(5)
      const middleware3 = new TestMiddleware(15)
      
      // Override execute to track order
      middleware1.execute = vi.fn().mockImplementation(async (query, next) => {
        executionOrder.push(10)
        return await next(query)
      })
      middleware2.execute = vi.fn().mockImplementation(async (query, next) => {
        executionOrder.push(5)
        return await next(query)
      })
      middleware3.execute = vi.fn().mockImplementation(async (query, next) => {
        executionOrder.push(15)
        return await next(query)
      })
      
      queryBus.addMiddleware(middleware1)
      queryBus.addMiddleware(middleware2)
      queryBus.addMiddleware(middleware3)
      
      const query = createTestQuery()
      await queryBus.execute(query)
      
      expect(executionOrder).toEqual([5, 10, 15]) // Should execute in priority order
    })

    it('should handle middleware failures', async () => {
      const failingMiddleware = new TestMiddleware(5)
      failingMiddleware.setShouldFail(true)
      
      queryBus.addMiddleware(failingMiddleware)
      
      const query = createTestQuery()
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Middleware failed')
    })

    it('should skip remaining middleware after failure', async () => {
      const middleware1 = new TestMiddleware(5)
      const middleware2 = new TestMiddleware(10)
      const middleware3 = new TestMiddleware(15)
      
      middleware2.setShouldFail(true)
      
      const mockExecute1 = vi.spyOn(middleware1, 'execute')
      const mockExecute2 = vi.spyOn(middleware2, 'execute')
      const mockExecute3 = vi.spyOn(middleware3, 'execute')
      
      queryBus.addMiddleware(middleware1)
      queryBus.addMiddleware(middleware2)
      queryBus.addMiddleware(middleware3)
      
      const query = createTestQuery()
      await queryBus.execute(query)
      
      expect(mockExecute1).toHaveBeenCalled()
      expect(mockExecute2).toHaveBeenCalled()
      expect(mockExecute3).not.toHaveBeenCalled()
    })

    it('should allow middleware to modify queries', async () => {
      const modifyingMiddleware: QueryMiddleware = {
        name: 'ModifyingMiddleware',
        priority: 5,
        async execute(query, next) {
          const modifiedQuery = {
            ...query,
            data: {
              ...query.data,
              searchTerm: `modified_${query.data.searchTerm}`
            }
          }
          return await next(modifiedQuery)
        }
      }
      
      queryBus.addMiddleware(modifyingMiddleware)
      
      const query = createTestQuery({ data: { searchTerm: 'original' } })
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(result.data!.searchTerm).toBe('modified_original')
    })

    it('should allow adding and removing middleware', () => {
      const middleware = new TestMiddleware()
      
      queryBus.addMiddleware(middleware)
      expect(queryBus.middleware).toContain(middleware)
      
      queryBus.removeMiddleware('TestMiddleware')
      expect(queryBus.middleware.find(m => m.name === 'TestMiddleware')).toBeUndefined()
    })
  })

  describe('Performance Metrics', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should track performance metrics', async () => {
      const query = createTestQuery()
      
      await queryBus.execute(query)
      await queryBus.execute(query) // This should be a cache hit
      
      const metrics = queryBus.getPerformanceMetrics()
      expect(metrics).toHaveLength(1)
      
      const queryMetrics = metrics[0]
      expect(queryMetrics.queryType).toBe('TestQuery')
      expect(queryMetrics.totalExecutions).toBe(2)
      expect(queryMetrics.successfulExecutions).toBe(2)
      expect(queryMetrics.failedExecutions).toBe(0)
      expect(queryMetrics.cacheHits).toBe(1)
      expect(queryMetrics.cacheMisses).toBe(1)
    })

    it('should track failed executions', async () => {
      testHandler.setShouldFail(true)
      const query = createTestQuery()
      
      await queryBus.execute(query)
      await queryBus.execute(query)
      
      const metrics = queryBus.getQueryMetrics('TestQuery')
      expect(metrics).toBeDefined()
      expect(metrics!.totalExecutions).toBe(2)
      expect(metrics!.successfulExecutions).toBe(0)
      expect(metrics!.failedExecutions).toBe(2)
      expect(metrics!.cacheHits).toBe(0)
      expect(metrics!.cacheMisses).toBe(2)
    })

    it('should track execution times correctly', async () => {
      testHandler.setDelay(50)
      const query = createTestQuery()
      
      await queryBus.execute(query)
      
      const metrics = queryBus.getQueryMetrics('TestQuery')
      expect(metrics).toBeDefined()
      expect(metrics!.averageExecutionTime).toBeGreaterThan(40)
      expect(metrics!.minExecutionTime).toBeGreaterThan(40)
    })

    it('should provide cache statistics', async () => {
      const query1 = createTestQuery({ data: { searchTerm: 'test1' } })
      const query2 = createTestQuery({ data: { searchTerm: 'test2' } })
      
      // Execute twice each for cache hits
      await queryBus.execute(query1)
      await queryBus.execute(query1) // Cache hit
      await queryBus.execute(query2)
      await queryBus.execute(query2) // Cache hit
      
      const cacheStats = queryBus.getCacheStats()
      expect(cacheStats.totalQueries).toBe(4)
      expect(cacheStats.totalCacheHits).toBe(2)
      expect(cacheStats.cacheHitRate).toBe(50)
    })

    it('should clear performance metrics', async () => {
      const query = createTestQuery()
      await queryBus.execute(query)
      
      expect(queryBus.getPerformanceMetrics()).toHaveLength(1)
      
      queryBus.clearPerformanceMetrics()
      
      expect(queryBus.getPerformanceMetrics()).toHaveLength(0)
    })
  })

  describe('Default Middleware Behavior', () => {
    beforeEach(() => {
      // Re-create with default middleware
      queryBus = new QueryBus(mockCacheManager)
      queryBus.register('TestQuery', testHandler)
    })

    it('should execute caching middleware by default', async () => {
      const query = createTestQuery()
      
      const result1 = await queryBus.execute(query)
      expect(result1.metadata!.cacheHit).toBe(false)
      
      const result2 = await queryBus.execute(query)
      expect(result2.metadata!.cacheHit).toBe(true)
    })

    it('should execute logging middleware by default', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const query = createTestQuery()
      await queryBus.execute(query)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔍 Executing query: TestQuery'),
        expect.any(Object)
      )
      
      consoleSpy.mockRestore()
    })

    it('should execute validation middleware by default', async () => {
      const invalidQuery = { ...createTestQuery(), type: '' } as any
      
      const result = await queryBus.execute(invalidQuery)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Query type is required')
    })

    it('should validate pagination parameters', async () => {
      const invalidPaginationQuery = {
        ...createTestQuery(),
        pagination: { offset: -1, limit: 1001 }
      } as any
      
      const result = await queryBus.execute(invalidPaginationQuery)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Pagination')
    })

    it('should handle performance middleware', async () => {
      testHandler.setDelay(600) // Delay > 500ms (non-cached)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const query = createTestQuery()
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐌 Slow query detected: TestQuery')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should handle handler exceptions gracefully', async () => {
      const throwingHandler = new TestQueryHandler()
      vi.spyOn(throwingHandler, 'handle').mockRejectedValue(new Error('Handler exception'))
      
      queryBus.register('ThrowingQuery', throwingHandler)
      
      const query = { ...createTestQuery(), type: 'ThrowingQuery' as any }
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Handler exception')
      expect(result.metadata!.errorType).toBe('unhandled_exception')
    })

    it('should handle non-Error exceptions', async () => {
      const throwingHandler = new TestQueryHandler()
      vi.spyOn(throwingHandler, 'handle').mockRejectedValue('String error')
      
      queryBus.register('ThrowingQuery', throwingHandler)
      
      const query = { ...createTestQuery(), type: 'ThrowingQuery' as any }
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('String error')
    })

    it('should handle middleware exceptions', async () => {
      const throwingMiddleware: QueryMiddleware = {
        name: 'ThrowingMiddleware',
        priority: 5,
        async execute(query, next) {
          throw new Error('Middleware exception')
        }
      }
      
      queryBus.addMiddleware(throwingMiddleware)
      
      const query = createTestQuery()
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Middleware exception')
    })
  })

  describe('Concurrent Execution', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should handle concurrent query execution', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => 
        createTestQuery({ data: { searchTerm: `concurrent-${i}` } })
      )
      
      const results = await Promise.all(
        queries.map(query => queryBus.execute(query))
      )
      
      expect(results).toHaveLength(10)
      expect(results.every(r => r.success)).toBe(true)
      
      // All should have unique query IDs
      const queryIds = results.map(r => r.metadata!.queryId)
      const uniqueIds = new Set(queryIds)
      expect(uniqueIds.size).toBe(10)
    })

    it('should handle cache correctly during concurrent execution', async () => {
      const query = createTestQuery()
      
      // Execute same query concurrently
      const results = await Promise.all([
        queryBus.execute(query),
        queryBus.execute(query),
        queryBus.execute(query)
      ])
      
      expect(results.every(r => r.success)).toBe(true)
      
      // At least one should be a cache miss, others might be hits
      const cacheMisses = results.filter(r => !r.metadata!.cacheHit).length
      expect(cacheMisses).toBeGreaterThan(0)
    })
  })

  describe('Query ID Generation', () => {
    beforeEach(() => {
      queryBus.register('TestQuery', testHandler)
    })

    it('should generate unique query IDs', async () => {
      const query1 = createTestQuery()
      const query2 = createTestQuery()
      
      const result1 = await queryBus.execute(query1)
      const result2 = await queryBus.execute(query2)
      
      expect(result1.metadata!.queryId).not.toBe(result2.metadata!.queryId)
      expect(result1.metadata!.queryId).toMatch(/^qry_/)
      expect(result2.metadata!.queryId).toMatch(/^qry_/)
    })

    it('should include query ID in error results', async () => {
      const query = createTestQuery({ type: 'NonExistentQuery' as any })
      
      const result = await queryBus.execute(query)
      
      expect(result.success).toBe(false)
      expect(result.metadata!.queryId).toMatch(/^qry_/)
    })
  })
})
