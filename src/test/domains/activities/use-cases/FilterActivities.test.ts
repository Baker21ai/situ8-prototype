/**
 * Unit Tests for FilterActivities Use Case
 * Tests complex filtering logic, pagination, sorting, and performance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FilterActivitiesUseCase, FilterActivitiesCommand, ActivityFilterPresets } from '../../../../domains/activities/use-cases/FilterActivities'
import { Activity, ActivityFactory } from '../../../../domains/activities/entities/Activity'
import { IActivityRepository, ActivityQuery } from '../../../../domains/activities/repositories/IActivityRepository'
import { Priority, Status } from '../../../../../lib/utils/status'
import { ActivityType } from '../../../../../lib/utils/security'

// Mock repository with comprehensive test data
class MockActivityRepository implements Partial<IActivityRepository> {
  private activities: Activity[] = []
  private shouldFailQuery = false
  private queryDelay = 0
  private mockStats = {
    total: 0,
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    byStatus: { pending: 0, open: 0, assigned: 0, 'in-progress': 0, resolved: 0, dismissed: 0, archived: 0 },
    byType: { 'access-control': 0, 'visitor-management': 0, medical: 0, 'security-breach': 0, 'property-damage': 0, alert: 0, 'bol-event': 0, maintenance: 0, other: 0 },
    averageResolutionTime: 0,
    averageConfidence: 0
  }

  async findWithPagination(query: ActivityQuery) {
    if (this.shouldFailQuery) {
      throw new Error('Repository query failed')
    }

    if (this.queryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.queryDelay))
    }

    let filtered = [...this.activities]

    // Apply filters
    if (query.priority) {
      filtered = filtered.filter(a => query.priority!.includes(a.priority))
    }
    if (query.status) {
      filtered = filtered.filter(a => query.status!.includes(a.status))
    }
    if (query.type) {
      filtered = filtered.filter(a => query.type!.includes(a.type))
    }
    if (query.assignedTo) {
      filtered = filtered.filter(a => a.assignedTo && query.assignedTo!.includes(a.assignedTo))
    }
    if (query.building) {
      filtered = filtered.filter(a => a.building && query.building!.includes(a.building))
    }
    if (query.zone) {
      filtered = filtered.filter(a => a.zone && query.zone!.includes(a.zone))
    }
    if (query.timeRange) {
      const { start, end } = query.timeRange
      filtered = filtered.filter(a => a.timestamp >= start && a.timestamp <= end)
    }
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase()
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        (a.description && a.description.toLowerCase().includes(searchLower))
      )
    }
    if (query.hasIncidentContext !== undefined) {
      filtered = filtered.filter(a => 
        query.hasIncidentContext ? (a.incident_contexts && a.incident_contexts.length > 0) : true
      )
    }
    if (query.isArchived !== undefined) {
      filtered = filtered.filter(a => a.isArchived === query.isArchived)
    }
    if (query.confidenceThreshold !== undefined) {
      filtered = filtered.filter(a => (a.confidence || 0) >= query.confidenceThreshold!)
    }

    // Apply sorting
    if (query.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (query.sortBy) {
          case 'timestamp':
            aVal = a.timestamp.getTime()
            bVal = b.timestamp.getTime()
            break
          case 'priority':
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
            aVal = priorityOrder[a.priority as keyof typeof priorityOrder]
            bVal = priorityOrder[b.priority as keyof typeof priorityOrder]
            break
          case 'title':
            aVal = a.title.toLowerCase()
            bVal = b.title.toLowerCase()
            break
          case 'updated_at':
            aVal = a.updated_at.getTime()
            bVal = b.updated_at.getTime()
            break
          default:
            aVal = a.timestamp.getTime()
            bVal = b.timestamp.getTime()
        }
        
        if (query.sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 50
    const total = filtered.length
    const paginatedActivities = filtered.slice(offset, offset + limit)
    
    return {
      activities: paginatedActivities,
      total,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : undefined
    }
  }

  // Test helper methods
  addActivity(activity: Activity) {
    this.activities.push(activity)
  }

  addActivities(activities: Activity[]) {
    this.activities.push(...activities)
  }

  setShouldFailQuery(fail: boolean) {
    this.shouldFailQuery = fail
  }

  setQueryDelay(delay: number) {
    this.queryDelay = delay
  }

  clear() {
    this.activities = []
  }

  getActivities(): Activity[] {
    return [...this.activities]
  }
}

// Test data factories
const createTestActivity = (overrides: Partial<Activity> = {}): Activity => {
  const baseActivity = ActivityFactory.createManual({
    type: 'security-breach',
    title: 'Test Activity',
    location: 'Building A - Main Entrance',
    priority: 'medium',
    created_by: 'test-user'
  })
  
  return {
    ...baseActivity,
    building: 'Building A',
    zone: 'Main Entrance',
    confidence: 80,
    ...overrides
  } as Activity
}

const createTestActivities = (count: number, overrides: Partial<Activity> = {}): Activity[] => {
  return Array.from({ length: count }, (_, i) => createTestActivity({
    title: `Test Activity ${i + 1}`,
    ...overrides
  }))
}

const createDiverseTestActivities = (): Activity[] => {
  const activities: Activity[] = []
  const priorities: Priority[] = ['low', 'medium', 'high', 'critical']
  const statuses: Status[] = ['open', 'assigned', 'in-progress', 'resolved']
  const types: ActivityType[] = ['medical', 'security-breach', 'alert', 'maintenance']
  const buildings = ['Building A', 'Building B', 'Building C']
  const zones = ['Floor 1', 'Floor 2', 'Basement']
  
  let id = 1
  for (const priority of priorities) {
    for (const status of statuses) {
      for (const type of types) {
        activities.push(createTestActivity({
          title: `Activity ${id++}`,
          priority,
          status,
          type,
          building: buildings[Math.floor(Math.random() * buildings.length)],
          zone: zones[Math.floor(Math.random() * zones.length)],
          assignedTo: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 10)}` : undefined,
          confidence: Math.floor(Math.random() * 100),
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
        }))
      }
    }
  }
  
  return activities
}

describe('FilterActivitiesUseCase', () => {
  let useCase: FilterActivitiesUseCase
  let mockRepository: MockActivityRepository

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    useCase = new FilterActivitiesUseCase(mockRepository as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('Basic Filtering', () => {
    it('should filter activities by priority', async () => {
      const activities = [
        createTestActivity({ priority: 'low', title: 'Low Priority' }),
        createTestActivity({ priority: 'high', title: 'High Priority' }),
        createTestActivity({ priority: 'critical', title: 'Critical Priority' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        priorities: ['high', 'critical']
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.every(a => ['high', 'critical'].includes(a.priority))).toBe(true)
    })

    it('should filter activities by status', async () => {
      const activities = [
        createTestActivity({ status: 'open', title: 'Open Activity' }),
        createTestActivity({ status: 'resolved', title: 'Resolved Activity' }),
        createTestActivity({ status: 'in-progress', title: 'In Progress Activity' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        statuses: ['open', 'in-progress']
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.every(a => ['open', 'in-progress'].includes(a.status))).toBe(true)
    })

    it('should filter activities by type', async () => {
      const activities = [
        createTestActivity({ type: 'medical', title: 'Medical Emergency' }),
        createTestActivity({ type: 'security-breach', title: 'Security Breach' }),
        createTestActivity({ type: 'maintenance', title: 'Maintenance Issue' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        types: ['medical', 'security-breach']
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.every(a => ['medical', 'security-breach'].includes(a.type))).toBe(true)
    })

    it('should filter activities by assigned user', async () => {
      const activities = [
        createTestActivity({ assignedTo: 'user-1', title: 'Assigned to User 1' }),
        createTestActivity({ assignedTo: 'user-2', title: 'Assigned to User 2' }),
        createTestActivity({ assignedTo: undefined, title: 'Unassigned' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        assignedTo: ['user-1']
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].assignedTo).toBe('user-1')
    })

    it('should filter activities by building and zone', async () => {
      const activities = [
        createTestActivity({ building: 'Building A', zone: 'Floor 1', title: 'A-1' }),
        createTestActivity({ building: 'Building A', zone: 'Floor 2', title: 'A-2' }),
        createTestActivity({ building: 'Building B', zone: 'Floor 1', title: 'B-1' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        building: ['Building A'],
        zone: ['Floor 1']
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].building).toBe('Building A')
      expect(result.activities[0].zone).toBe('Floor 1')
    })
  })

  describe('Time-based Filtering', () => {
    it('should filter activities by time range', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      
      const activities = [
        createTestActivity({ timestamp: now, title: 'Today' }),
        createTestActivity({ timestamp: yesterday, title: 'Yesterday' }),
        createTestActivity({ timestamp: twoDaysAgo, title: 'Two days ago' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        timeRange: {
          start: yesterday,
          end: now
        }
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.find(a => a.title === 'Two days ago')).toBeUndefined()
    })

    it('should filter activities by quick time filters', async () => {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      
      const activities = [
        createTestActivity({ timestamp: now, title: 'Just now' }),
        createTestActivity({ timestamp: thirtyMinutesAgo, title: '30 minutes ago' }),
        createTestActivity({ timestamp: twoHoursAgo, title: '2 hours ago' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        quickTimeFilter: '1h'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.find(a => a.title === '2 hours ago')).toBeUndefined()
    })

    it('should handle all quick time filter options', async () => {
      const quickFilters = ['live', '15m', '1h', '4h', '24h', 'week', 'month']
      
      for (const filter of quickFilters) {
        const command: FilterActivitiesCommand = {
          quickTimeFilter: filter as any
        }
        
        const result = await useCase.execute(command)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Content-based Filtering', () => {
    it('should search activities by text', async () => {
      const activities = [
        createTestActivity({ title: 'Security breach detected', description: 'Unauthorized access' }),
        createTestActivity({ title: 'Medical emergency', description: 'Patient fell down' }),
        createTestActivity({ title: 'Maintenance required', description: 'HVAC system malfunction' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        searchText: 'security'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toContain('Security')
    })

    it('should search in both title and description', async () => {
      const activities = [
        createTestActivity({ title: 'Normal activity', description: 'Security concerns noted' }),
        createTestActivity({ title: 'Medical emergency', description: 'Patient condition stable' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        searchText: 'security'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].description).toContain('Security')
    })

    it('should filter by confidence threshold', async () => {
      const activities = [
        createTestActivity({ confidence: 95, title: 'High confidence' }),
        createTestActivity({ confidence: 75, title: 'Medium confidence' }),
        createTestActivity({ confidence: 45, title: 'Low confidence' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        confidenceThreshold: 70
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.every(a => (a.confidence || 0) >= 70)).toBe(true)
    })
  })

  describe('Business Logic Filtering', () => {
    it('should filter activities requiring attention', async () => {
      const activities = [
        createTestActivity({ priority: 'critical', assignedTo: undefined, title: 'Critical unassigned' }),
        createTestActivity({ priority: 'high', assignedTo: undefined, title: 'High unassigned' }),
        createTestActivity({ priority: 'critical', assignedTo: 'user-1', title: 'Critical assigned' }),
        createTestActivity({ priority: 'low', assignedTo: undefined, title: 'Low unassigned' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        requiresAttention: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.every(a => 
        (a.priority === 'critical' || a.priority === 'high') && !a.assignedTo
      )).toBe(true)
    })

    it('should filter overdue activities', async () => {
      const now = new Date()
      const activities = [
        // Critical activity from 2 hours ago (overdue - SLA is 1 hour)
        createTestActivity({ 
          priority: 'critical', 
          status: 'open',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          title: 'Overdue critical'
        }),
        // High priority from 5 hours ago (overdue - SLA is 4 hours)
        createTestActivity({ 
          priority: 'high', 
          status: 'in-progress',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          title: 'Overdue high'
        }),
        // Medium priority from 12 hours ago (not overdue - SLA is 24 hours)
        createTestActivity({ 
          priority: 'medium', 
          status: 'open',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          title: 'Not overdue medium'
        }),
        // Resolved activity (should not be overdue)
        createTestActivity({ 
          priority: 'critical', 
          status: 'resolved',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          title: 'Resolved critical'
        })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        isOverdue: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities.map(a => a.title)).toEqual(
        expect.arrayContaining(['Overdue critical', 'Overdue high'])
      )
    })

    it('should filter by evidence presence', async () => {
      const activities = [
        createTestActivity({ 
          title: 'With evidence',
          evidence: [{ type: 'image', url: 'test.jpg', timestamp: new Date() }]
        }),
        createTestActivity({ 
          title: 'Without evidence',
          evidence: []
        })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        hasEvidence: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('With evidence')
    })
  })

  describe('AI-powered Filtering', () => {
    it('should apply AI filtering when enabled', async () => {
      const activities = [
        createTestActivity({ 
          title: 'High confidence activity',
          confidence: 95,
          falsePositiveLikelihood: 0.1
        }),
        createTestActivity({ 
          title: 'Likely false positive',
          confidence: 30,
          falsePositiveLikelihood: 0.9
        }),
        createTestActivity({ 
          title: 'Low confidence non-critical',
          confidence: 25,
          priority: 'low'
        }),
        createTestActivity({ 
          title: 'Low confidence critical',
          confidence: 25,
          priority: 'critical'
        })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        enableAIFiltering: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      // Should filter out likely false positive and low confidence non-critical
      expect(result.activities).toHaveLength(2)
      expect(result.activities.map(a => a.title)).toEqual(
        expect.arrayContaining(['High confidence activity', 'Low confidence critical'])
      )
    })

    it('should filter out repetitive patrol activities', async () => {
      const activities = [
        createTestActivity({ 
          type: 'patrol',
          title: 'Regular patrol',
          system_tags: ['routine', 'repetitive']
        }),
        createTestActivity({ 
          type: 'patrol',
          title: 'Important patrol',
          system_tags: ['routine']
        })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        enableAIFiltering: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('Important patrol')
    })

    it('should filter low priority activities during off-hours', async () => {
      const offHourTime = new Date()
      offHourTime.setHours(2) // 2 AM
      
      const activities = [
        createTestActivity({ 
          priority: 'low',
          timestamp: offHourTime,
          title: 'Low priority at night'
        }),
        createTestActivity({ 
          priority: 'high',
          timestamp: offHourTime,
          title: 'High priority at night'
        })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        enableAIFiltering: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('High priority at night')
    })
  })

  describe('Pagination and Sorting', () => {
    beforeEach(() => {
      // Add 25 test activities for pagination testing
      const activities = createTestActivities(25)
      mockRepository.addActivities(activities)
    })

    it('should paginate results correctly', async () => {
      const command: FilterActivitiesCommand = {
        limit: 10,
        offset: 0
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(10)
      expect(result.total).toBe(25)
      expect(result.hasMore).toBe(true)
      expect(result.nextOffset).toBe(10)
    })

    it('should handle second page pagination', async () => {
      const command: FilterActivitiesCommand = {
        limit: 10,
        offset: 10
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(10)
      expect(result.hasMore).toBe(true)
      expect(result.nextOffset).toBe(20)
    })

    it('should handle last page pagination', async () => {
      const command: FilterActivitiesCommand = {
        limit: 10,
        offset: 20
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(5)
      expect(result.hasMore).toBe(false)
      expect(result.nextOffset).toBeUndefined()
    })

    it('should sort by timestamp descending (default)', async () => {
      mockRepository.clear()
      const activities = [
        createTestActivity({ timestamp: new Date('2024-01-01'), title: 'Oldest' }),
        createTestActivity({ timestamp: new Date('2024-01-03'), title: 'Newest' }),
        createTestActivity({ timestamp: new Date('2024-01-02'), title: 'Middle' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities.map(a => a.title)).toEqual(['Newest', 'Middle', 'Oldest'])
    })

    it('should sort by priority', async () => {
      mockRepository.clear()
      const activities = [
        createTestActivity({ priority: 'low', title: 'Low' }),
        createTestActivity({ priority: 'critical', title: 'Critical' }),
        createTestActivity({ priority: 'medium', title: 'Medium' }),
        createTestActivity({ priority: 'high', title: 'High' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        sortBy: 'priority',
        sortOrder: 'desc'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities.map(a => a.title)).toEqual(['Critical', 'High', 'Medium', 'Low'])
    })

    it('should sort by title alphabetically', async () => {
      mockRepository.clear()
      const activities = [
        createTestActivity({ title: 'Charlie' }),
        createTestActivity({ title: 'Alpha' }),
        createTestActivity({ title: 'Bravo' })
      ]
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        sortBy: 'title',
        sortOrder: 'asc'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities.map(a => a.title)).toEqual(['Alpha', 'Bravo', 'Charlie'])
    })
  })

  describe('Statistics Generation', () => {
    beforeEach(() => {
      const activities = createDiverseTestActivities()
      mockRepository.addActivities(activities)
    })

    it('should generate statistics when requested', async () => {
      const command: FilterActivitiesCommand = {
        includeStats: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.stats).toBeDefined()
      expect(result.stats!.total).toBeGreaterThan(0)
      expect(result.stats!.byPriority).toBeDefined()
      expect(result.stats!.byStatus).toBeDefined()
      expect(result.stats!.byType).toBeDefined()
      expect(typeof result.stats!.averageConfidence).toBe('number')
    })

    it('should not generate statistics when not requested', async () => {
      const command: FilterActivitiesCommand = {}
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.stats).toBeUndefined()
    })
  })

  describe('Performance Tests', () => {
    it('should complete filtering within reasonable time', async () => {
      const activities = createTestActivities(1000)
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {
        priorities: ['high', 'critical'],
        limit: 50
      }
      
      const startTime = Date.now()
      const result = await useCase.execute(command)
      const executionTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(executionTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(result.executionTime).toBeDefined()
    })

    it('should handle slow repository queries', async () => {
      mockRepository.setQueryDelay(200) // 200ms delay
      const activities = createTestActivities(10)
      mockRepository.addActivities(activities)
      
      const command: FilterActivitiesCommand = {}
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.executionTime).toBeGreaterThan(190)
    })

    it('should include execution time in results', async () => {
      const command: FilterActivitiesCommand = {}
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(typeof result.executionTime).toBe('number')
      expect(result.executionTime).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle repository query failures', async () => {
      mockRepository.setShouldFailQuery(true)
      const command: FilterActivitiesCommand = {}
      
      await expect(useCase.execute(command)).rejects.toThrow('Filter activities failed: Repository query failed')
    })

    it('should handle invalid filter combinations gracefully', async () => {
      const command: FilterActivitiesCommand = {
        timeRange: {
          start: new Date('2024-01-02'),
          end: new Date('2024-01-01') // End before start
        }
      }
      
      const result = await useCase.execute(command)
      
      // Should not fail, but return empty results
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(0)
    })
  })

  describe('Complex Filter Combinations', () => {
    beforeEach(() => {
      const activities = createDiverseTestActivities()
      mockRepository.addActivities(activities)
    })

    it('should apply multiple filters correctly', async () => {
      const command: FilterActivitiesCommand = {
        priorities: ['high', 'critical'],
        statuses: ['open', 'in-progress'],
        types: ['security-breach', 'medical'],
        confidenceThreshold: 50,
        limit: 20,
        sortBy: 'priority',
        sortOrder: 'desc',
        includeStats: true
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities.every(a => 
        ['high', 'critical'].includes(a.priority) &&
        ['open', 'in-progress'].includes(a.status) &&
        ['security-breach', 'medical'].includes(a.type) &&
        (a.confidence || 0) >= 50
      )).toBe(true)
      expect(result.stats).toBeDefined()
    })

    it('should handle empty results from complex filters', async () => {
      const command: FilterActivitiesCommand = {
        priorities: ['critical'],
        types: ['maintenance'],
        confidenceThreshold: 99,
        searchText: 'nonexistent'
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })
})

describe('ActivityFilterPresets', () => {
  describe('getRequiringAttention', () => {
    it('should return correct filter for activities requiring attention', () => {
      const preset = ActivityFilterPresets.getRequiringAttention()
      
      expect(preset.priorities).toEqual(['critical', 'high'])
      expect(preset.statuses).toEqual(['open', 'escalated'])
      expect(preset.requiresAttention).toBe(true)
      expect(preset.sortBy).toBe('priority')
      expect(preset.sortOrder).toBe('desc')
      expect(preset.limit).toBe(50)
    })
  })

  describe('getCriticalLast24Hours', () => {
    it('should return correct filter for critical activities in last 24 hours', () => {
      const preset = ActivityFilterPresets.getCriticalLast24Hours()
      
      expect(preset.priorities).toEqual(['critical'])
      expect(preset.quickTimeFilter).toBe('24h')
      expect(preset.sortBy).toBe('timestamp')
      expect(preset.sortOrder).toBe('desc')
      expect(preset.includeStats).toBe(true)
    })
  })

  describe('getUnassignedOpen', () => {
    it('should return correct filter for unassigned open activities', () => {
      const preset = ActivityFilterPresets.getUnassignedOpen()
      
      expect(preset.statuses).toEqual(['open'])
      expect(preset.assignedTo).toEqual([])
      expect(preset.sortBy).toBe('timestamp')
      expect(preset.sortOrder).toBe('desc')
      expect(preset.limit).toBe(100)
    })
  })

  describe('getHighConfidenceAlerts', () => {
    it('should return correct filter for high confidence alerts', () => {
      const preset = ActivityFilterPresets.getHighConfidenceAlerts()
      
      expect(preset.types).toEqual(['alert', 'security-breach'])
      expect(preset.confidenceThreshold).toBe(80)
      expect(preset.enableAIFiltering).toBe(true)
      expect(preset.sortBy).toBe('confidence')
      expect(preset.sortOrder).toBe('desc')
    })
  })

  describe('getOverdueActivities', () => {
    it('should return correct filter for overdue activities', () => {
      const preset = ActivityFilterPresets.getOverdueActivities()
      
      expect(preset.statuses).toEqual(['open', 'in-progress', 'escalated'])
      expect(preset.isOverdue).toBe(true)
      expect(preset.sortBy).toBe('timestamp')
      expect(preset.sortOrder).toBe('asc')
      expect(preset.includeStats).toBe(true)
    })
  })

  describe('getBuildingActivities', () => {
    it('should return correct filter for building activities', () => {
      const preset = ActivityFilterPresets.getBuildingActivities('Building A')
      
      expect(preset.building).toEqual(['Building A'])
      expect(preset.quickTimeFilter).toBe('24h')
      expect(preset.sortBy).toBe('timestamp')
      expect(preset.sortOrder).toBe('desc')
      expect(preset.includeStats).toBe(true)
    })

    it('should accept custom time filter', () => {
      const preset = ActivityFilterPresets.getBuildingActivities('Building B', 'week')
      
      expect(preset.building).toEqual(['Building B'])
      expect(preset.quickTimeFilter).toBe('week')
    })
  })
})
