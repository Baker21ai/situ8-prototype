/**
 * Comprehensive Tests for ActivityService Ambient.AI Integration
 * 
 * This test suite validates:
 * - createActivityFromAmbient method
 * - findByAmbientAlertId method
 * - updateAmbientActivity method
 * - Enhanced tagging for Ambient activities
 * - Integration with domain events
 * - Audit logging for Ambient operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ActivityService } from '../../../services/activity.service'
import { Activity, ActivityFactory } from '../../../src/domains/activities/entities/Activity'
import { ActivityType } from '../../../lib/utils/security'
import { Priority, Status } from '../../../lib/utils/status'
import { EnterpriseActivity } from '../../../lib/types/activity'
import { AuditContext } from '../../../services/types'

// Mock modules at the top level without referencing variables
vi.mock('../../../stores/activityStore')
vi.mock('../../../stores/incidentStore')
vi.mock('../../../stores/auditStore')
vi.mock('../../../src/domains/activities/events/EventBus')

describe('ActivityService - Ambient.AI Integration', () => {
  let service: ActivityService
  let mockContext: AuditContext
  let mockActivityStore: any
  let mockIncidentStore: any
  let mockAuditStore: any
  let mockEventBus: any

  beforeEach(async () => {
    // Setup mocks
    mockActivityStore = {
      activities: [] as EnterpriseActivity[],
      createActivity: vi.fn(),
      updateActivity: vi.fn(),
      filteredActivities: [] as EnterpriseActivity[]
    }

    mockIncidentStore = {
      createIncident: vi.fn()
    }

    mockAuditStore = {
      addAuditEntry: vi.fn()
    }

    mockEventBus = {
      publish: vi.fn()
    }

    // Apply mocks
    const { useActivityStore } = await import('../../../stores/activityStore')
    const { useIncidentStore } = await import('../../../stores/incidentStore')
    const { useAuditStore } = await import('../../../stores/auditStore')
    const { eventBus } = await import('../../../src/domains/activities/events/EventBus')

    vi.mocked(useActivityStore.getState).mockReturnValue(mockActivityStore)
    vi.mocked(useIncidentStore.getState).mockReturnValue(mockIncidentStore)
    vi.mocked(useAuditStore.getState).mockReturnValue(mockAuditStore)
    vi.mocked(eventBus.publish).mockImplementation(mockEventBus.publish)

    service = new ActivityService()
    mockContext = {
      userId: 'test-user-123',
      userRole: 'officer',
      sessionId: 'session-456',
      timestamp: new Date(),
      clientIp: '192.168.1.1',
      userAgent: 'test-agent'
    }

    // Reset mocks
    vi.clearAllMocks()
    mockActivityStore.activities = []
    mockActivityStore.filteredActivities = []
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createActivityFromAmbient', () => {
    it('should create Ambient activity with all required fields', async () => {
      const ambientData = {
        ambient_alert_id: 'AMB-SERVICE-001',
        type: 'security-breach' as ActivityType,
        title: 'Service Test Security Breach',
        location: 'Building A - Main Entrance',
        priority: 'high' as Priority,
        preview_url: 'https://ambient.ai/preview/service-001.jpg',
        deep_link_url: 'https://ambient.ai/alerts/service-001',
        confidence_score: 0.89,
        description: 'Unauthorized access attempt detected by Ambient.AI',
        building: 'Building A',
        zone: 'Main Entrance',
        confidence: 89
      }

      mockActivityStore.createActivity.mockResolvedValue(undefined)

      const result = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.source).toBe('AMBIENT')
      expect(result.data!.ambient_alert_id).toBe('AMB-SERVICE-001')
      expect(result.data!.preview_url).toBe('https://ambient.ai/preview/service-001.jpg')
      expect(result.data!.deep_link_url).toBe('https://ambient.ai/alerts/service-001')
      expect(result.data!.confidence_score).toBe(0.89)
      expect(result.data!.id).toMatch(/^AMB-\d+$/)

      // Verify store was called
      expect(mockActivityStore.createActivity).toHaveBeenCalledTimes(1)

      // Verify domain events were published
      expect(mockEventBus.publish).toHaveBeenCalled()
    })

    it('should create Ambient activity with minimal required fields', async () => {
      const minimalData = {
        ambient_alert_id: 'AMB-MIN-002',
        type: 'alert' as ActivityType,
        title: 'Minimal Ambient Alert',
        location: 'Unknown Location',
        priority: 'medium' as Priority
      }

      const result = await service.createActivityFromAmbient(minimalData, mockContext)

      expect(result.success).toBe(true)
      expect(result.data!.ambient_alert_id).toBe('AMB-MIN-002')
      expect(result.data!.source).toBe('AMBIENT')
      expect(result.data!.preview_url).toBeUndefined()
      expect(result.data!.deep_link_url).toBeUndefined()
      expect(result.data!.confidence_score).toBeUndefined()
    })

    it('should reject creation without ambient_alert_id', async () => {
      const invalidData = {
        type: 'alert' as ActivityType,
        title: 'Invalid Ambient Alert',
        location: 'Test Location',
        priority: 'medium' as Priority
        // Missing ambient_alert_id
      }

      const result = await service.createActivityFromAmbient(invalidData as any, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ambient alert ID is required for Ambient activities')
      expect(result.errorCode).toBe('VALIDATION_ERROR')
      expect(mockActivityStore.createActivity).not.toHaveBeenCalled()
    })

    it('should handle service creation errors gracefully', async () => {
      const ambientData = {
        ambient_alert_id: 'AMB-ERROR-001',
        type: 'alert' as ActivityType,
        title: 'Error Test Alert',
        location: 'Test Location',
        priority: 'medium' as Priority
      }

      mockActivityStore.createActivity.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    it('should generate appropriate system tags for Ambient activities', async () => {
      const ambientData = {
        ambient_alert_id: 'AMB-TAGS-001',
        type: 'security-breach' as ActivityType,
        title: 'High Confidence Alert',
        location: 'Building B',
        priority: 'critical' as Priority,
        confidence_score: 0.95,
        building: 'Building B',
        zone: 'Secure Area'
      }

      const result = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(result.success).toBe(true)
      expect(result.data!.system_tags).toContain('source:ambient')
      expect(result.data!.system_tags).toContain('high-confidence')
      expect(result.data!.system_tags).toContain('building:Building B')
      expect(result.data!.system_tags).toContain('zone:Secure Area')
      expect(result.data!.system_tags).toContain('type:security-breach')
    })

    it('should create incident for Ambient activities based on business rules', async () => {
      const ambientData = {
        ambient_alert_id: 'AMB-INCIDENT-001',
        type: 'security-breach' as ActivityType,
        title: 'Incident Creating Alert',
        location: 'Building C',
        priority: 'high' as Priority
      }

      const result = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(result.success).toBe(true)
      // Verify incident creation was triggered (based on business rules)
      expect(mockIncidentStore.createIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Incident: Incident Creating Alert'),
          type: 'security_breach',
          trigger_activity_id: result.data!.id
        })
      )
    })

    it('should log audit trail for Ambient activity creation', async () => {
      const ambientData = {
        ambient_alert_id: 'AMB-AUDIT-001',
        type: 'alert' as ActivityType,
        title: 'Audit Test Alert',
        location: 'Test Location',
        priority: 'medium' as Priority
      }

      const result = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(result.success).toBe(true)
      
      // Note: Audit logging is called internally, this tests that it doesn't throw
      expect(result.data).toBeDefined()
    })
  })

  describe('findByAmbientAlertId', () => {
    beforeEach(() => {
      // Setup mock activities
      const ambientActivity: EnterpriseActivity = {
        id: 'AMB-FIND-001',
        timestamp: new Date(),
        type: 'alert',
        title: 'Findable Ambient Alert',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'ambient-system',
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: 'ambient-system',
        system_tags: ['source:ambient'],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(),
        is_archived: false,
        allowed_status_transitions: ['assigned'],
        requires_approval: false,
        source: 'AMBIENT',
        ambient_alert_id: 'AMB-SEARCH-123'
      }

      const manualActivity: EnterpriseActivity = {
        ...ambientActivity,
        id: 'MANUAL-001',
        title: 'Manual Activity',
        source: 'MANUAL',
        ambient_alert_id: undefined
      }

      mockActivityStore.activities = [ambientActivity, manualActivity]
    })

    it('should find activity by Ambient alert ID', async () => {
      const result = await service.findByAmbientAlertId('AMB-SEARCH-123')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.ambient_alert_id).toBe('AMB-SEARCH-123')
      expect(result.data!.source).toBe('AMBIENT')
    })

    it('should return not found for non-existent Ambient alert ID', async () => {
      const result = await service.findByAmbientAlertId('AMB-NONEXISTENT')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Activity not found for Ambient alert ID')
      expect(result.errorCode).toBe('NOT_FOUND')
    })

    it('should handle search errors gracefully', async () => {
      // Mock an error in the store
      Object.defineProperty(mockActivityStore, 'activities', {
        get: () => {
          throw new Error('Store access failed')
        }
      })

      const result = await service.findByAmbientAlertId('AMB-ERROR-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Store access failed')
    })
  })

  describe('updateAmbientActivity', () => {
    beforeEach(() => {
      const existingActivity: EnterpriseActivity = {
        id: 'AMB-UPDATE-001',
        timestamp: new Date(),
        type: 'security-breach',
        title: 'Updatable Ambient Alert',
        location: 'Building D',
        priority: 'high',
        status: 'detecting',
        created_by: 'ambient-system',
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: 'ambient-system',
        system_tags: ['source:ambient'],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(),
        is_archived: false,
        allowed_status_transitions: ['assigned'],
        requires_approval: false,
        source: 'AMBIENT',
        ambient_alert_id: 'AMB-UPDATE-123',
        preview_url: 'https://ambient.ai/preview/old.jpg',
        confidence_score: 0.75
      }

      mockActivityStore.activities = [existingActivity]
      mockActivityStore.updateActivity.mockResolvedValue(undefined)
    })

    it('should update Ambient activity with new data', async () => {
      const updates = {
        preview_url: 'https://ambient.ai/preview/updated.jpg',
        deep_link_url: 'https://ambient.ai/alerts/updated',
        confidence_score: 0.92,
        status: 'assigned' as Status
      }

      const result = await service.updateAmbientActivity('AMB-UPDATE-123', updates, mockContext)

      expect(result.success).toBe(true)
      expect(mockActivityStore.updateActivity).toHaveBeenCalledWith(
        'AMB-UPDATE-001',
        expect.objectContaining(updates),
        expect.any(Object)
      )
    })

    it('should return not found for non-existent Ambient alert ID', async () => {
      const updates = {
        preview_url: 'https://ambient.ai/preview/new.jpg'
      }

      const result = await service.updateAmbientActivity('AMB-NONEXISTENT', updates, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Activity not found for Ambient alert ID')
      expect(result.errorCode).toBe('NOT_FOUND')
      expect(mockActivityStore.updateActivity).not.toHaveBeenCalled()
    })

    it('should handle partial updates correctly', async () => {
      const partialUpdates = {
        confidence_score: 0.88
      }

      const result = await service.updateAmbientActivity('AMB-UPDATE-123', partialUpdates, mockContext)

      expect(result.success).toBe(true)
      expect(mockActivityStore.updateActivity).toHaveBeenCalledWith(
        'AMB-UPDATE-001',
        expect.objectContaining({ confidence_score: 0.88 }),
        expect.any(Object)
      )
    })

    it('should handle update errors gracefully', async () => {
      mockActivityStore.updateActivity.mockRejectedValue(new Error('Update failed'))

      const updates = {
        preview_url: 'https://ambient.ai/preview/error.jpg'
      }

      const result = await service.updateAmbientActivity('AMB-UPDATE-123', updates, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Update failed')
    })
  })

  describe('Enhanced Tagging System Integration', () => {
    it('should generate correct tags for different confidence levels', async () => {
      const testCases = [
        { confidence_score: 0.95, expectedTag: 'high-confidence' },
        { confidence_score: 0.75, expectedTag: 'medium-confidence' },
        { confidence_score: 0.45, expectedTag: 'low-confidence' }
      ]

      for (const testCase of testCases) {
        const ambientData = {
          ambient_alert_id: `AMB-CONF-${testCase.confidence_score}`,
          type: 'alert' as ActivityType,
          title: `Confidence Test ${testCase.confidence_score}`,
          location: 'Test Location',
          priority: 'medium' as Priority,
          confidence_score: testCase.confidence_score
        }

        const result = await service.createActivityFromAmbient(ambientData, mockContext)

        expect(result.success).toBe(true)
        expect(result.data!.system_tags).toContain(testCase.expectedTag)
        expect(result.data!.system_tags).toContain('source:ambient')
      }
    })

    it('should include time-based tags for Ambient activities', async () => {
      const businessHoursTime = new Date()
      businessHoursTime.setHours(14, 30, 0, 0) // 2:30 PM

      const afterHoursTime = new Date()
      afterHoursTime.setHours(22, 30, 0, 0) // 10:30 PM

      // Mock Date.now for business hours test
      const originalNow = Date.now
      Date.now = vi.fn(() => businessHoursTime.getTime())

      const businessHoursData = {
        ambient_alert_id: 'AMB-BUSINESS-001',
        type: 'alert' as ActivityType,
        title: 'Business Hours Alert',
        location: 'Test Location',
        priority: 'medium' as Priority
      }

      const businessResult = await service.createActivityFromAmbient(businessHoursData, mockContext)

      expect(businessResult.success).toBe(true)
      expect(businessResult.data!.system_tags).toContain('business-hours')

      // Reset and test after hours
      Date.now = vi.fn(() => afterHoursTime.getTime())

      const afterHoursData = {
        ambient_alert_id: 'AMB-AFTER-001',
        type: 'alert' as ActivityType,
        title: 'After Hours Alert',
        location: 'Test Location',
        priority: 'medium' as Priority
      }

      const afterResult = await service.createActivityFromAmbient(afterHoursData, mockContext)

      expect(afterResult.success).toBe(true)
      expect(afterResult.data!.system_tags).toContain('after-hours')

      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Integration with Legacy System', () => {
    it('should maintain compatibility when creating standard activities alongside Ambient ones', async () => {
      // Create a standard activity
      const standardData = {
        type: 'patrol' as ActivityType,
        title: 'Standard Patrol Activity',
        location: 'Building E',
        priority: 'low' as Priority,
        description: 'Regular patrol round'
      }

      const standardResult = await service.createActivity(standardData, mockContext)

      expect(standardResult.success).toBe(true)
      expect(standardResult.data!.source).toBe('MANUAL')
      expect(standardResult.data!.ambient_alert_id).toBeUndefined()

      // Create an Ambient activity
      const ambientData = {
        ambient_alert_id: 'AMB-COMPAT-001',
        type: 'alert' as ActivityType,
        title: 'Ambient Compatibility Test',
        location: 'Building E',
        priority: 'medium' as Priority
      }

      const ambientResult = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(ambientResult.success).toBe(true)
      expect(ambientResult.data!.source).toBe('AMBIENT')
      expect(ambientResult.data!.ambient_alert_id).toBe('AMB-COMPAT-001')

      // Both should coexist without issues
      expect(mockActivityStore.createActivity).toHaveBeenCalledTimes(2)
    })

    it('should handle mixed source types in activity queries', async () => {
      // Setup mixed activities
      const activities: EnterpriseActivity[] = [
        {
          id: 'AMB-MIXED-001',
          source: 'AMBIENT',
          ambient_alert_id: 'AMB-123',
          type: 'alert',
          title: 'Ambient Alert'
        } as EnterpriseActivity,
        {
          id: 'MANUAL-MIXED-001',
          source: 'MANUAL',
          type: 'patrol',
          title: 'Manual Patrol'
        } as EnterpriseActivity,
        {
          id: 'SITU8-MIXED-001',
          source: 'SITU8',
          type: 'security-breach',
          title: 'SITU8 Breach'
        } as EnterpriseActivity
      ]

      mockActivityStore.filteredActivities = activities

      const result = await service.findAll()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      
      const sources = result.data!.map(activity => activity.source)
      expect(sources).toContain('AMBIENT')
      expect(sources).toContain('MANUAL')
      expect(sources).toContain('SITU8')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle bulk Ambient activity creation efficiently', async () => {
      const startTime = Date.now()
      const promises = []

      // Create 50 Ambient activities concurrently
      for (let i = 0; i < 50; i++) {
        const ambientData = {
          ambient_alert_id: `AMB-BULK-${i.toString().padStart(3, '0')}`,
          type: 'alert' as ActivityType,
          title: `Bulk Alert ${i}`,
          location: `Location ${i}`,
          priority: 'medium' as Priority
        }

        promises.push(service.createActivityFromAmbient(ambientData, mockContext))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All should succeed
      expect(results.every(r => r.success)).toBe(true)
      
      // Should complete within reasonable time (this is a unit test, so should be very fast)
      expect(endTime - startTime).toBeLessThan(1000) // 1 second

      // Verify all were created
      expect(mockActivityStore.createActivity).toHaveBeenCalledTimes(50)
    })

    it('should handle Ambient alert ID search efficiently', async () => {
      // Setup large number of activities
      const largeActivitySet = Array.from({ length: 1000 }, (_, i) => ({
        id: `ACTIVITY-${i}`,
        ambient_alert_id: i % 2 === 0 ? `AMB-${i}` : undefined,
        source: i % 2 === 0 ? 'AMBIENT' : 'MANUAL',
        type: 'alert',
        title: `Activity ${i}`
      })) as EnterpriseActivity[]

      mockActivityStore.activities = largeActivitySet

      const startTime = Date.now()
      const result = await service.findByAmbientAlertId('AMB-500')
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data!.ambient_alert_id).toBe('AMB-500')
      
      // Should find efficiently (though this is mocked, it tests the logic)
      expect(endTime - startTime).toBeLessThan(100) // 100ms
    })
  })
})