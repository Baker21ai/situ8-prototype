/**
 * Unit Tests for Activity Query Handlers
 * Tests CQRS query handling, caching, filtering, and data retrieval
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  GetActivitiesQueryHandler,
  GetActivityByIdQueryHandler,
  SearchActivitiesQueryHandler,
  GetActivityStatsQueryHandler,
  GetActivitiesRequiringAttentionQueryHandler
} from '../../../../application/queries/activity/ActivityQueryHandlers'
import {
  GetActivitiesQuery,
  GetActivityByIdQuery,
  SearchActivitiesQuery,
  GetActivityStatsQuery,
  GetActivitiesRequiringAttentionQuery
} from '../../../../application/queries/activity/ActivityQueries'
import { FilterActivitiesUseCase } from '../../../../domains/activities/use-cases/FilterActivities'
import { ClusterActivitiesUseCase } from '../../../../domains/activities/use-cases/ClusterActivities'
import { IActivityRepository, ActivityQuery } from '../../../../domains/activities/repositories/IActivityRepository'
import { Activity, ActivityFactory } from '../../../../domains/activities/entities/Activity'
import { EnterpriseActivity } from '../../../../lib/types/activity'
import { Priority, Status } from '../../../../../lib/utils/status'
import { ActivityType } from '../../../../../lib/utils/security'

// Mock dependencies
class MockActivityRepository implements Partial<IActivityRepository> {
  private activities: EnterpriseActivity[] = []
  private shouldFailOperation = false

  async findById(id: string): Promise<Activity | null> {
    if (this.shouldFailOperation) {
      throw new Error('Repository findById failed')
    }
    
    const found = this.activities.find(a => a.id === id)
    return found ? found as Activity : null
  }

  async findRelated(activityId: string, limit?: number): Promise<EnterpriseActivity[]> {
    if (this.shouldFailOperation) {
      throw new Error('Repository findRelated failed')
    }
    
    return this.activities
      .filter(a => a.id !== activityId)
      .slice(0, limit || 30)
  }

  async search(query: ActivityQuery): Promise<EnterpriseActivity[]> {
    if (this.shouldFailOperation) {
      throw new Error('Repository search failed')
    }
    
    let filtered = [...this.activities]
    
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase()
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        (a.description && a.description.toLowerCase().includes(searchLower))
      )
    }
    
    return filtered.slice(0, query.limit || 50)
  }

  async getStats(query?: ActivityQuery) {
    if (this.shouldFailOperation) {
      throw new Error('Repository getStats failed')
    }
    
    const stats = {
      total: this.activities.length,
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byStatus: { pending: 0, open: 0, assigned: 0, 'in-progress': 0, resolved: 0, dismissed: 0, archived: 0 },
      byType: { 'access-control': 0, 'visitor-management': 0, medical: 0, 'security-breach': 0, 'property-damage': 0, alert: 0, 'bol-event': 0, maintenance: 0, other: 0 },
      averageResolutionTime: 0,
      averageConfidence: 0,
      responseTime: {
        average: 45,
        median: 30,
        p95: 120
      },
      resolutionRate: 0.87
    }
    
    this.activities.forEach(activity => {
      stats.byPriority[activity.priority]++
      stats.byStatus[activity.status]++
      stats.byType[activity.type]++
    })
    
    return stats
  }

  async findRequiringAttention(): Promise<EnterpriseActivity[]> {
    if (this.shouldFailOperation) {
      throw new Error('Repository findRequiringAttention failed')
    }
    
    return this.activities.filter(activity => 
      (activity.priority === 'critical' || activity.priority === 'high') &&
      (activity.status === 'open' || activity.status === 'escalated')
    )
  }

  // Test helper methods
  addActivity(activity: EnterpriseActivity) {
    this.activities.push(activity)
  }

  addActivities(activities: EnterpriseActivity[]) {
    this.activities.push(...activities)
  }

  setShouldFailOperation(fail: boolean) {
    this.shouldFailOperation = fail
  }

  clear() {
    this.activities = []
  }

  getActivities(): EnterpriseActivity[] {
    return [...this.activities]
  }
}

class MockFilterActivitiesUseCase {
  private shouldFail = false
  private mockResult: any = null

  async execute(query: any) {
    if (this.shouldFail) {
      return {
        success: false,
        error: 'Filter use case failed'
      }
    }

    return this.mockResult || {
      success: true,
      activities: [],
      totalCount: 0,
      hasMore: false,
      executionTime: 50
    }
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  setMockResult(result: any) {
    this.mockResult = result
  }
}

// Test data factories
const createTestActivity = (overrides: Partial<EnterpriseActivity> = {}): EnterpriseActivity => ({
  id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  title: 'Test Activity',
  description: 'Test description',
  type: 'security-breach',
  priority: 'medium',
  status: 'open',
  location: 'Building A - Main Entrance',
  building: 'Building A',
  zone: 'Main Entrance',
  created_at: new Date(),
  updated_at: new Date(),
  timestamp: new Date(),
  reported_by: 'test-user',
  confidence: 80,
  source: 'manual',
  system_tags: [],
  user_tags: [],
  escalationLevel: 0,
  isArchived: false,
  ...overrides
})

const createDiverseActivities = (): EnterpriseActivity[] => {
  const activities: EnterpriseActivity[] = []
  const priorities: Priority[] = ['low', 'medium', 'high', 'critical']
  const statuses: Status[] = ['open', 'assigned', 'in-progress', 'resolved']
  const types: ActivityType[] = ['medical', 'security-breach', 'alert', 'maintenance']
  const buildings = ['Building A', 'Building B', 'Building C']
  
  let id = 1
  priorities.forEach(priority => {
    statuses.forEach(status => {
      types.forEach(type => {
        activities.push(createTestActivity({
          id: `activity-${id++}`,
          title: `${type} activity ${id}`,
          priority,
          status,
          type,
          building: buildings[Math.floor(Math.random() * buildings.length)],
          confidence: Math.floor(Math.random() * 100),
          assignedTo: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 10)}` : undefined,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }))
      })
    })
  })
  
  return activities
}

describe('Activity Query Handlers', () => {
  let mockRepository: MockActivityRepository
  let mockFilterUseCase: MockFilterActivitiesUseCase

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    mockFilterUseCase = new MockFilterActivitiesUseCase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('GetActivitiesQueryHandler', () => {
    let handler: GetActivitiesQueryHandler

    beforeEach(() => {
      handler = new GetActivitiesQueryHandler(mockFilterUseCase as any, mockRepository as any)
    })

    describe('Successful Query Execution', () => {
      it('should execute query successfully with default parameters', async () => {
        const activities = createDiverseActivities().slice(0, 10)
        mockFilterUseCase.setMockResult({
          success: true,
          activities,
          totalCount: 10,
          hasMore: false,
          executionTime: 45
        })
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities).toHaveLength(10)
        expect(result.data!.totalCount).toBe(10)
        expect(result.data!.hasMore).toBe(false)
      })

      it('should apply filters correctly', async () => {
        const filteredActivities = createDiverseActivities().filter(a => a.priority === 'high')
        mockFilterUseCase.setMockResult({
          success: true,
          activities: filteredActivities,
          totalCount: filteredActivities.length,
          hasMore: false,
          executionTime: 32
        })
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          filters: {
            priorities: ['high'],
            statuses: ['open', 'in-progress'],
            types: ['security-breach']
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.every(a => a.priority === 'high')).toBe(true)
      })

      it('should handle pagination', async () => {
        const activities = createDiverseActivities().slice(10, 20)
        mockFilterUseCase.setMockResult({
          success: true,
          activities,
          totalCount: 100,
          hasMore: true,
          executionTime: 28
        })
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          pagination: {
            limit: 10,
            offset: 10
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities).toHaveLength(10)
        expect(result.data!.hasMore).toBe(true)
      })

      it('should generate aggregations when requested', async () => {
        const activities = createDiverseActivities().slice(0, 20)
        mockFilterUseCase.setMockResult({
          success: true,
          activities,
          totalCount: 20,
          hasMore: false,
          executionTime: 35
        })
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          filters: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.aggregations).toBeDefined()
        expect(result.data!.aggregations!.byPriority).toBeDefined()
        expect(result.data!.aggregations!.byStatus).toBeDefined()
        expect(result.data!.aggregations!.byType).toBeDefined()
        expect(result.data!.aggregations!.byBuilding).toBeDefined()
      })

      it('should apply sorting', async () => {
        const activities = createDiverseActivities().slice(0, 5)
        mockFilterUseCase.setMockResult({
          success: true,
          activities,
          totalCount: 5,
          hasMore: false,
          executionTime: 20
        })
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          sorting: {
            field: 'priority',
            order: 'desc'
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities).toHaveLength(5)
      })
    })

    describe('Caching', () => {
      it('should generate cache key correctly', () => {
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          filters: { priorities: ['high'] },
          pagination: { limit: 20, offset: 0 }
        }
        
        const cacheKey = (handler as any).getCacheKey(query)
        expect(cacheKey).toContain('activities:')
        expect(cacheKey).toContain('priorities')
      })

      it('should return appropriate cache TTL', () => {
        const ttl = (handler as any).getCacheTTL()
        expect(ttl).toBe(30000) // 30 seconds
      })
    })

    describe('Error Handling', () => {
      it('should handle filter use case failures', async () => {
        mockFilterUseCase.setShouldFail(true)
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Filter use case failed')
      })

      it('should handle unexpected exceptions', async () => {
        vi.spyOn(mockFilterUseCase, 'execute').mockRejectedValue(new Error('Unexpected error'))
        
        const query: GetActivitiesQuery = {
          type: 'GetActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Unexpected error')
      })
    })
  })

  describe('GetActivityByIdQueryHandler', () => {
    let handler: GetActivityByIdQueryHandler
    let testActivity: EnterpriseActivity

    beforeEach(() => {
      handler = new GetActivityByIdQueryHandler(mockRepository as any)
      testActivity = createTestActivity({ id: 'test-activity-123' })
      mockRepository.addActivity(testActivity)
    })

    describe('Successful Query Execution', () => {
      it('should retrieve activity by ID', async () => {
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activity).toBeDefined()
        expect(result.data!.activity!.id).toBe('test-activity-123')
        expect(result.data!.activity!.title).toBe(testActivity.title)
      })

      it('should return null for non-existent activity', async () => {
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'non-existent-id'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activity).toBeNull()
      })

      it('should include related activities when requested', async () => {
        const relatedActivities = createDiverseActivities().slice(0, 3)
        mockRepository.addActivities(relatedActivities)
        
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123',
          includeRelated: true
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.relatedActivities).toBeDefined()
        expect(result.data!.relatedActivities!.length).toBeGreaterThan(0)
      })

      it('should include timeline when requested', async () => {
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123',
          includeTimeline: true
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.timeline).toBeDefined()
        expect(Array.isArray(result.data!.timeline)).toBe(true)
      })

      it('should include evidence when requested', async () => {
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123',
          includeEvidence: true
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.evidence).toBeDefined()
        expect(Array.isArray(result.data!.evidence)).toBe(true)
      })
    })

    describe('Caching', () => {
      it('should generate cache key with all options', () => {
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123',
          includeRelated: true,
          includeTimeline: true,
          includeEvidence: true
        }
        
        const cacheKey = (handler as any).getCacheKey(query)
        expect(cacheKey).toContain('test-activity-123')
        expect(cacheKey).toContain('true') // For boolean options
      })

      it('should return appropriate cache TTL', () => {
        const ttl = (handler as any).getCacheTTL()
        expect(ttl).toBe(60000) // 1 minute
      })
    })

    describe('Error Handling', () => {
      it('should handle repository failures', async () => {
        mockRepository.setShouldFailOperation(true)
        
        const query: GetActivityByIdQuery = {
          type: 'GetActivityByIdQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          activityId: 'test-activity-123'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Repository findById failed')
      })
    })
  })

  describe('SearchActivitiesQueryHandler', () => {
    let handler: SearchActivitiesQueryHandler

    beforeEach(() => {
      handler = new SearchActivitiesQueryHandler(mockRepository as any)
      
      const activities = [
        createTestActivity({ title: 'Security breach detected', description: 'Unauthorized access attempt' }),
        createTestActivity({ title: 'Medical emergency', description: 'Patient needs immediate attention' }),
        createTestActivity({ title: 'Fire alarm activated', description: 'Smoke detected in building' }),
        createTestActivity({ title: 'Maintenance required', description: 'HVAC system malfunction' })
      ]
      
      mockRepository.addActivities(activities)
    })

    describe('Successful Search Execution', () => {
      it('should search activities by text', async () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'security'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.length).toBeGreaterThan(0)
        expect(result.data!.searchMetadata).toBeDefined()
        expect(result.data!.searchMetadata!.searchTerms).toContain('security')
        expect(result.data!.searchMetadata!.queryTime).toBeGreaterThan(0)
      })

      it('should generate search suggestions', async () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'medical'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.searchMetadata!.suggestedTerms).toBeDefined()
        expect(Array.isArray(result.data!.searchMetadata!.suggestedTerms)).toBe(true)
      })

      it('should generate highlights when requested', async () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'security',
          highlightResults: true
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.searchMetadata!.highlights).toBeDefined()
      })

      it('should apply filters to search', async () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'emergency',
          filters: {
            priorities: ['high', 'critical'],
            types: ['medical']
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities).toBeDefined()
      })

      it('should handle pagination in search', async () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'test',
          pagination: {
            limit: 2,
            offset: 0
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.length).toBeLessThanOrEqual(2)
      })
    })

    describe('Caching', () => {
      it('should generate cache key for search', () => {
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'security breach'
        }
        
        const cacheKey = (handler as any).getCacheKey(query)
        expect(cacheKey).toContain('search:security breach')
      })

      it('should return appropriate cache TTL', () => {
        const ttl = (handler as any).getCacheTTL()
        expect(ttl).toBe(120000) // 2 minutes
      })
    })

    describe('Error Handling', () => {
      it('should handle repository search failures', async () => {
        mockRepository.setShouldFailOperation(true)
        
        const query: SearchActivitiesQuery = {
          type: 'SearchActivitiesQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          searchText: 'test'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Repository search failed')
      })
    })
  })

  describe('GetActivityStatsQueryHandler', () => {
    let handler: GetActivityStatsQueryHandler

    beforeEach(() => {
      handler = new GetActivityStatsQueryHandler(mockRepository as any)
      
      const activities = createDiverseActivities()
      mockRepository.addActivities(activities)
    })

    describe('Successful Stats Query', () => {
      it('should retrieve activity statistics', async () => {
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.summary).toBeDefined()
        expect(result.data!.summary.total).toBeGreaterThan(0)
        expect(result.data!.summary.responseTime).toBeDefined()
        expect(result.data!.summary.resolutionRate).toBeGreaterThan(0)
        expect(result.data!.distributions).toBeDefined()
        expect(result.data!.distributions.byPriority).toBeDefined()
        expect(result.data!.distributions.byStatus).toBeDefined()
        expect(result.data!.distributions.byType).toBeDefined()
      })

      it('should apply time range filter to stats', async () => {
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.summary.averagePerDay).toBeGreaterThanOrEqual(0)
      })

      it('should include trends when requested', async () => {
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          groupBy: ['day']
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.trends).toBeDefined()
      })

      it('should include comparisons when requested', async () => {
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          includeComparisons: true,
          timeRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.comparisons).toBeDefined()
      })
    })

    describe('Caching', () => {
      it('should generate cache key for stats', () => {
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          timeRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          }
        }
        
        const cacheKey = (handler as any).getCacheKey(query)
        expect(cacheKey).toContain('stats:')
      })

      it('should return appropriate cache TTL', () => {
        const ttl = (handler as any).getCacheTTL()
        expect(ttl).toBe(60000) // 1 minute
      })
    })

    describe('Error Handling', () => {
      it('should handle repository stats failures', async () => {
        mockRepository.setShouldFailOperation(true)
        
        const query: GetActivityStatsQuery = {
          type: 'GetActivityStatsQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Repository getStats failed')
      })
    })
  })

  describe('GetActivitiesRequiringAttentionQueryHandler', () => {
    let handler: GetActivitiesRequiringAttentionQueryHandler

    beforeEach(() => {
      handler = new GetActivitiesRequiringAttentionQueryHandler(mockRepository as any)
      
      const activities = [
        createTestActivity({ 
          priority: 'critical',
          status: 'open',
          assignedTo: undefined,
          title: 'Critical unassigned'
        }),
        createTestActivity({ 
          priority: 'high',
          status: 'escalated',
          assignedTo: undefined,
          title: 'High escalated unassigned'
        }),
        createTestActivity({ 
          priority: 'critical',
          status: 'open',
          assignedTo: 'officer-123',
          title: 'Critical assigned'
        }),
        createTestActivity({ 
          priority: 'low',
          status: 'open',
          assignedTo: undefined,
          title: 'Low unassigned'
        }),
        createTestActivity({ 
          priority: 'high',
          status: 'in-progress',
          assignedTo: 'officer-456',
          created_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          title: 'Overdue in progress'
        })
      ]
      
      mockRepository.addActivities(activities)
    })

    describe('Successful Attention Query', () => {
      it('should retrieve activities requiring attention', async () => {
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.length).toBeGreaterThan(0)
        expect(result.data!.urgencyBreakdown).toBeDefined()
        expect(result.data!.urgencyBreakdown.critical).toBeGreaterThan(0)
        expect(result.data!.urgencyBreakdown.highPriority).toBeGreaterThan(0)
        expect(result.data!.urgencyBreakdown.unassigned).toBeGreaterThan(0)
        expect(result.data!.recommendations).toBeDefined()
      })

      it('should filter by urgency level', async () => {
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          urgencyLevel: 'critical'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.every(a => a.priority === 'critical')).toBe(true)
      })

      it('should filter by assigned user', async () => {
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          assignedToUser: 'officer-456'
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.activities.every(a => a.assignedTo === 'officer-456')).toBe(true)
      })

      it('should generate recommendations', async () => {
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(true)
        expect(result.data!.recommendations).toBeDefined()
        expect(Array.isArray(result.data!.recommendations)).toBe(true)
        
        if (result.data!.recommendations.length > 0) {
          const recommendation = result.data!.recommendations[0]
          expect(recommendation.activityId).toBeDefined()
          expect(recommendation.action).toBeDefined()
          expect(recommendation.reason).toBeDefined()
          expect(recommendation.priority).toBeDefined()
        }
      })
    })

    describe('Caching', () => {
      it('should generate cache key for attention query', () => {
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          urgencyLevel: 'critical',
          assignedToUser: 'officer-123'
        }
        
        const cacheKey = (handler as any).getCacheKey(query)
        expect(cacheKey).toContain('attention:critical:officer-123')
      })

      it('should return short cache TTL for urgent items', () => {
        const ttl = (handler as any).getCacheTTL()
        expect(ttl).toBe(10000) // 10 seconds
      })
    })

    describe('Error Handling', () => {
      it('should handle repository attention query failures', async () => {
        mockRepository.setShouldFailOperation(true)
        
        const query: GetActivitiesRequiringAttentionQuery = {
          type: 'GetActivitiesRequiringAttentionQuery',
          userId: 'test-user',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {}
        }
        
        const result = await handler.handle(query)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Repository findRequiringAttention failed')
      })
    })
  })
})
