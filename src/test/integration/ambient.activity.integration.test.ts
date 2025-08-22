/**
 * Integration Tests for Ambient.AI Activity Model Integration
 * 
 * This test suite provides comprehensive integration testing to validate:
 * - End-to-end Activity creation and management flow with Ambient data
 * - TypeScript compilation and type safety
 * - Backward compatibility with existing mock data
 * - Real-world usage scenarios
 * - Performance characteristics
 * - Error handling across the entire stack
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Activity, ActivityFactory } from '../../domains/activities/entities/Activity'
import { ActivityService } from '../../../services/activity.service'
import { mockActivities, getActivitiesByPriority } from '../../../components/mock-data/mockActivityData'
import { ActivityType } from '../../../lib/utils/security'
import { Priority, Status } from '../../../lib/utils/status'
import { EnterpriseActivity } from '../../../lib/types/activity'
import { AuditContext } from '../../../services/types'

// Mock store implementations for integration testing
class IntegrationMockActivityStore {
  private activities: EnterpriseActivity[] = []
  private nextId = 1

  get filteredActivities() {
    return [...this.activities]
  }

  createActivity(activity: EnterpriseActivity): void {
    const activityWithId = {
      ...activity,
      id: activity.id || `INT-${this.nextId++}`
    }
    this.activities.push(activityWithId)
  }

  updateActivity(id: string, updates: Partial<EnterpriseActivity>): void {
    const index = this.activities.findIndex(a => a.id === id)
    if (index >= 0) {
      this.activities[index] = {
        ...this.activities[index],
        ...updates,
        updated_at: new Date()
      }
    }
  }

  findById(id: string): EnterpriseActivity | undefined {
    return this.activities.find(a => a.id === id)
  }

  findByAmbientAlertId(ambientAlertId: string): EnterpriseActivity | undefined {
    return this.activities.find(a => a.ambient_alert_id === ambientAlertId)
  }

  clear(): void {
    this.activities = []
    this.nextId = 1
  }

  getAll(): EnterpriseActivity[] {
    return [...this.activities]
  }
}

class IntegrationMockIncidentStore {
  private incidents: any[] = []

  createIncident(incident: any): void {
    this.incidents.push({
      ...incident,
      id: `INC-${Date.now()}`
    })
  }

  getIncidents(): any[] {
    return [...this.incidents]
  }

  clear(): void {
    this.incidents = []
  }
}

// Setup integration test environment
describe('Ambient.AI Activity Integration Tests', () => {
  let activityStore: IntegrationMockActivityStore
  let incidentStore: IntegrationMockIncidentStore
  let service: ActivityService
  let mockContext: AuditContext

  beforeEach(() => {
    activityStore = new IntegrationMockActivityStore()
    incidentStore = new IntegrationMockIncidentStore()
    
    // Mock the stores
    vi.doMock('../../../stores/activityStore', () => ({
      useActivityStore: {
        getState: () => activityStore
      }
    }))

    vi.doMock('../../../stores/incidentStore', () => ({
      useIncidentStore: {
        getState: () => incidentStore
      }
    }))

    vi.doMock('../../../stores/auditStore', () => ({
      useAuditStore: {
        getState: () => ({
          addAuditEntry: vi.fn()
        })
      }
    }))

    service = new ActivityService()
    mockContext = {
      userId: 'integration-test-user',
      userRole: 'supervisor',
      sessionId: 'integration-session',
      timestamp: new Date(),
      clientIp: '10.0.0.1',
      userAgent: 'integration-test-agent'
    }

    vi.clearAllMocks()
  })

  afterEach(() => {
    activityStore.clear()
    incidentStore.clear()
    vi.clearAllMocks()
  })

  describe('End-to-End Ambient Activity Lifecycle', () => {
    it('should handle complete Ambient activity lifecycle', async () => {
      // Step 1: Create Ambient activity
      const ambientData = {
        ambient_alert_id: 'AMB-LIFECYCLE-001',
        type: 'security-breach' as ActivityType,
        title: 'Complete Lifecycle Test',
        location: 'Integration Test Building - Main Entrance',
        priority: 'critical' as Priority,
        preview_url: 'https://ambient.ai/preview/lifecycle-001.jpg',
        deep_link_url: 'https://ambient.ai/alerts/lifecycle-001',
        confidence_score: 0.94,
        description: 'High-confidence security breach for lifecycle testing',
        building: 'Integration Test Building',
        zone: 'Main Entrance',
        confidence: 94
      }

      const createResult = await service.createActivityFromAmbient(ambientData, mockContext)

      expect(createResult.success).toBe(true)
      expect(createResult.data).toBeDefined()
      
      const activityId = createResult.data!.id
      const ambientAlertId = createResult.data!.ambient_alert_id

      // Step 2: Verify activity was stored correctly
      const storedActivity = activityStore.findById(activityId)
      expect(storedActivity).toBeDefined()
      expect(storedActivity!.source).toBe('AMBIENT')
      expect(storedActivity!.ambient_alert_id).toBe('AMB-LIFECYCLE-001')

      // Step 3: Find by Ambient Alert ID
      const findResult = await service.findByAmbientAlertId(ambientAlertId!)
      expect(findResult.success).toBe(true)
      expect(findResult.data!.id).toBe(activityId)

      // Step 4: Update Ambient activity
      const updateData = {
        preview_url: 'https://ambient.ai/preview/lifecycle-001-updated.jpg',
        confidence_score: 0.96,
        status: 'assigned' as Status
      }

      const updateResult = await service.updateAmbientActivity(ambientAlertId!, updateData, mockContext)
      expect(updateResult.success).toBe(true)

      // Step 5: Verify updates were applied
      const updatedActivity = activityStore.findById(activityId)
      expect(updatedActivity!.preview_url).toBe('https://ambient.ai/preview/lifecycle-001-updated.jpg')
      expect(updatedActivity!.confidence_score).toBe(0.96)
      expect(updatedActivity!.status).toBe('assigned')

      // Step 6: Verify incident was created (based on business rules)
      const incidents = incidentStore.getIncidents()
      expect(incidents.length).toBeGreaterThan(0)
      
      const relatedIncident = incidents.find(inc => inc.trigger_activity_id === activityId)
      expect(relatedIncident).toBeDefined()
      expect(relatedIncident!.type).toBe('security_breach')
    })

    it('should handle multiple concurrent Ambient activities', async () => {
      const concurrentCreations = Array.from({ length: 10 }, (_, i) => ({
        ambient_alert_id: `AMB-CONCURRENT-${i.toString().padStart(3, '0')}`,
        type: 'alert' as ActivityType,
        title: `Concurrent Alert ${i}`,
        location: `Location ${i}`,
        priority: (i % 2 === 0 ? 'high' : 'medium') as Priority,
        confidence_score: 0.8 + (i * 0.01)
      }))

      const results = await Promise.all(
        concurrentCreations.map(data => 
          service.createActivityFromAmbient(data, mockContext)
        )
      )

      // All should succeed
      expect(results.every(r => r.success)).toBe(true)

      // Verify all were stored
      const allActivities = activityStore.getAll()
      expect(allActivities.length).toBe(10)

      // Verify each has correct Ambient properties
      allActivities.forEach((activity, index) => {
        expect(activity.source).toBe('AMBIENT')
        expect(activity.ambient_alert_id).toBe(`AMB-CONCURRENT-${index.toString().padStart(3, '0')}`)
        expect(activity.confidence_score).toBeCloseTo(0.8 + (index * 0.01))
      })

      // Test concurrent lookups
      const lookupResults = await Promise.all(
        concurrentCreations.map(data => 
          service.findByAmbientAlertId(data.ambient_alert_id)
        )
      )

      expect(lookupResults.every(r => r.success)).toBe(true)
    })
  })

  describe('Backward Compatibility with Existing Mock Data', () => {
    it('should process existing mock activities alongside new Ambient activities', async () => {
      // Convert existing mock data to EnterpriseActivity format
      const existingMockActivities: EnterpriseActivity[] = mockActivities.map(mock => ({
        id: mock.id,
        timestamp: mock.timestamp || new Date(),
        type: mock.type as ActivityType,
        title: mock.title,
        location: mock.location,
        priority: mock.priority as Priority,
        status: (mock.status as Status) || 'detecting',
        created_by: 'mock-data-user',
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: 'mock-data-user',
        system_tags: [`type:${mock.type}`, 'source:manual'],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_archived: false,
        allowed_status_transitions: ['assigned', 'responding', 'resolved'],
        requires_approval: false,
        source: 'MANUAL',
        building: mock.building,
        zone: mock.zone,
        confidence: mock.confidence,
        description: mock.description,
        assignedTo: mock.assignedTo,
        detectedObjects: mock.detectedObjects,
        badgeHolder: mock.badgeHolder,
        respondingUnits: mock.respondingUnits
      }))

      // Add existing mock activities to store
      existingMockActivities.forEach(activity => {
        activityStore.createActivity(activity)
      })

      // Create new Ambient activity
      const newAmbientData = {
        ambient_alert_id: 'AMB-COMPAT-001',
        type: 'security-breach' as ActivityType,
        title: 'New Ambient Security Alert',
        location: 'Building F - Security Office',
        priority: 'high' as Priority,
        preview_url: 'https://ambient.ai/preview/compat-001.jpg',
        confidence_score: 0.91
      }

      const result = await service.createActivityFromAmbient(newAmbientData, mockContext)
      expect(result.success).toBe(true)

      // Verify both types coexist
      const allActivities = activityStore.getAll()
      expect(allActivities.length).toBe(existingMockActivities.length + 1)

      const ambientActivities = allActivities.filter(a => a.source === 'AMBIENT')
      const manualActivities = allActivities.filter(a => a.source === 'MANUAL')

      expect(ambientActivities.length).toBe(1)
      expect(manualActivities.length).toBe(existingMockActivities.length)

      // Verify Ambient activity has correct properties
      const ambientActivity = ambientActivities[0]
      expect(ambientActivity.ambient_alert_id).toBe('AMB-COMPAT-001')
      expect(ambientActivity.preview_url).toBe('https://ambient.ai/preview/compat-001.jpg')

      // Verify existing activities maintain their properties
      manualActivities.forEach(activity => {
        expect(activity.ambient_alert_id).toBeUndefined()
        expect(activity.preview_url).toBeUndefined()
        expect(activity.source).toBe('MANUAL')
      })
    })

    it('should maintain priority sorting with mixed activity sources', async () => {
      // Create activities with various sources and priorities
      const testActivities = [
        {
          type: 'security-breach' as ActivityType,
          title: 'Manual Critical Alert',
          location: 'Manual Location',
          priority: 'critical' as Priority,
          source: 'MANUAL' as const
        },
        {
          ambient_alert_id: 'AMB-PRIORITY-001',
          type: 'alert' as ActivityType,
          title: 'Ambient High Alert',
          location: 'Ambient Location',
          priority: 'high' as Priority
        },
        {
          type: 'patrol' as ActivityType,
          title: 'Manual Low Priority',
          location: 'Patrol Location',
          priority: 'low' as Priority,
          source: 'MANUAL' as const
        }
      ]

      // Create manual activities
      for (const activity of testActivities.filter(a => a.source === 'MANUAL')) {
        await service.createActivity(activity, mockContext)
      }

      // Create Ambient activities
      for (const activity of testActivities.filter(a => !a.source)) {
        await service.createActivityFromAmbient(activity as any, mockContext)
      }

      const allActivities = activityStore.getAll()
      expect(allActivities.length).toBe(3)

      // Test priority sorting using existing mock data function
      const sortedActivities = getActivitiesByPriority(allActivities as any[])
      
      expect(sortedActivities[0].priority).toBe('critical')
      expect(sortedActivities[1].priority).toBe('high')
      expect(sortedActivities[2].priority).toBe('low')

      // Verify mixed sources in sorted order
      expect(sortedActivities[0].source).toBe('MANUAL')
      expect(sortedActivities[1].source).toBe('AMBIENT')
      expect(sortedActivities[2].source).toBe('MANUAL')
    })
  })

  describe('TypeScript Type Safety Validation', () => {
    it('should enforce type safety for Ambient-specific fields', () => {
      // Test that TypeScript types are correctly enforced
      const validAmbientActivity: Partial<EnterpriseActivity> = {
        source: 'AMBIENT',
        ambient_alert_id: 'AMB-TYPE-001',
        preview_url: 'https://ambient.ai/preview.jpg',
        deep_link_url: 'https://ambient.ai/alert',
        confidence_score: 0.85
      }

      // These should compile without issues
      expect(validAmbientActivity.source).toBe('AMBIENT')
      expect(typeof validAmbientActivity.ambient_alert_id).toBe('string')
      expect(typeof validAmbientActivity.preview_url).toBe('string')
      expect(typeof validAmbientActivity.deep_link_url).toBe('string')
      expect(typeof validAmbientActivity.confidence_score).toBe('number')
    })

    it('should allow optional Ambient fields to be undefined', () => {
      const partialAmbientActivity: Partial<EnterpriseActivity> = {
        source: 'AMBIENT'
        // Other Ambient fields omitted
      }

      expect(partialAmbientActivity.ambient_alert_id).toBeUndefined()
      expect(partialAmbientActivity.preview_url).toBeUndefined()
      expect(partialAmbientActivity.deep_link_url).toBeUndefined()
      expect(partialAmbientActivity.confidence_score).toBeUndefined()
    })

    it('should validate source type restrictions', () => {
      const validSources: Array<'AMBIENT' | 'SITU8' | 'MANUAL'> = ['AMBIENT', 'SITU8', 'MANUAL']
      
      validSources.forEach(source => {
        const activity: Partial<EnterpriseActivity> = { source }
        expect(['AMBIENT', 'SITU8', 'MANUAL']).toContain(activity.source)
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large-scale Ambient activity operations efficiently', async () => {
      const LARGE_SCALE_COUNT = 100
      const startTime = Date.now()

      // Create large number of Ambient activities
      const creationPromises = Array.from({ length: LARGE_SCALE_COUNT }, (_, i) => {
        return service.createActivityFromAmbient({
          ambient_alert_id: `AMB-SCALE-${i.toString().padStart(4, '0')}`,
          type: 'alert' as ActivityType,
          title: `Scale Test Alert ${i}`,
          location: `Location ${i}`,
          priority: 'medium' as Priority,
          confidence_score: 0.5 + (i % 50) * 0.01
        }, mockContext)
      })

      const creationResults = await Promise.all(creationPromises)
      const creationTime = Date.now() - startTime

      // All should succeed
      expect(creationResults.every(r => r.success)).toBe(true)
      expect(activityStore.getAll().length).toBe(LARGE_SCALE_COUNT)

      // Should complete within reasonable time for integration test
      expect(creationTime).toBeLessThan(5000) // 5 seconds

      // Test bulk lookups
      const lookupStartTime = Date.now()
      const lookupPromises = Array.from({ length: 50 }, (_, i) => {
        return service.findByAmbientAlertId(`AMB-SCALE-${i.toString().padStart(4, '0')}`)
      })

      const lookupResults = await Promise.all(lookupPromises)
      const lookupTime = Date.now() - lookupStartTime

      expect(lookupResults.every(r => r.success)).toBe(true)
      expect(lookupTime).toBeLessThan(1000) // 1 second

      // Test bulk updates
      const updateStartTime = Date.now()
      const updatePromises = Array.from({ length: 25 }, (_, i) => {
        return service.updateAmbientActivity(
          `AMB-SCALE-${i.toString().padStart(4, '0')}`,
          { confidence_score: 0.95 },
          mockContext
        )
      })

      const updateResults = await Promise.all(updatePromises)
      const updateTime = Date.now() - updateStartTime

      expect(updateResults.every(r => r.success)).toBe(true)
      expect(updateTime).toBeLessThan(2000) // 2 seconds
    })

    it('should maintain performance with mixed activity types at scale', async () => {
      const MIXED_SCALE_COUNT = 200
      const startTime = Date.now()

      // Create mixed activities (Ambient, Manual, SITU8)
      const mixedPromises = Array.from({ length: MIXED_SCALE_COUNT }, (_, i) => {
        const sourceType = i % 3
        
        if (sourceType === 0) {
          // Ambient activity
          return service.createActivityFromAmbient({
            ambient_alert_id: `AMB-MIXED-${i}`,
            type: 'alert' as ActivityType,
            title: `Ambient Alert ${i}`,
            location: `Location ${i}`,
            priority: 'medium' as Priority
          }, mockContext)
        } else {
          // Manual or SITU8 activity
          return service.createActivity({
            type: sourceType === 1 ? 'patrol' : 'security-breach' as ActivityType,
            title: `${sourceType === 1 ? 'Manual' : 'SITU8'} Activity ${i}`,
            location: `Location ${i}`,
            priority: 'medium' as Priority,
            source: sourceType === 1 ? 'MANUAL' : 'SITU8' as const
          }, mockContext)
        }
      })

      const results = await Promise.all(mixedPromises)
      const totalTime = Date.now() - startTime

      expect(results.every(r => r.success)).toBe(true)
      expect(activityStore.getAll().length).toBe(MIXED_SCALE_COUNT)
      expect(totalTime).toBeLessThan(10000) // 10 seconds

      // Verify correct distribution of sources
      const allActivities = activityStore.getAll()
      const ambientCount = allActivities.filter(a => a.source === 'AMBIENT').length
      const manualCount = allActivities.filter(a => a.source === 'MANUAL').length
      const situ8Count = allActivities.filter(a => a.source === 'SITU8').length

      expect(ambientCount).toBeCloseTo(MIXED_SCALE_COUNT / 3, 1)
      expect(manualCount).toBeCloseTo(MIXED_SCALE_COUNT / 3, 1)
      expect(situ8Count).toBeCloseTo(MIXED_SCALE_COUNT / 3, 1)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle and recover from various error scenarios', async () => {
      // Test duplicate Ambient alert ID handling
      const duplicateData = {
        ambient_alert_id: 'AMB-DUPLICATE-001',
        type: 'alert' as ActivityType,
        title: 'Duplicate Test',
        location: 'Test Location',
        priority: 'medium' as Priority
      }

      const firstResult = await service.createActivityFromAmbient(duplicateData, mockContext)
      expect(firstResult.success).toBe(true)

      // Create another with same ambient_alert_id (should succeed as they get different activity IDs)
      const secondResult = await service.createActivityFromAmbient(duplicateData, mockContext)
      expect(secondResult.success).toBe(true)

      // Both should exist but with different activity IDs
      expect(firstResult.data!.id).not.toBe(secondResult.data!.id)
      expect(firstResult.data!.ambient_alert_id).toBe(secondResult.data!.ambient_alert_id)

      // Test missing data scenarios
      const invalidData = {
        type: 'alert' as ActivityType,
        title: 'Invalid Test',
        location: 'Test Location',
        priority: 'medium' as Priority
        // Missing ambient_alert_id
      }

      const invalidResult = await service.createActivityFromAmbient(invalidData as any, mockContext)
      expect(invalidResult.success).toBe(false)

      // Test update of non-existent Ambient activity
      const nonExistentUpdate = await service.updateAmbientActivity(
        'AMB-NONEXISTENT',
        { confidence_score: 0.99 },
        mockContext
      )
      expect(nonExistentUpdate.success).toBe(false)

      // Test search for non-existent Ambient alert
      const nonExistentSearch = await service.findByAmbientAlertId('AMB-NONEXISTENT')
      expect(nonExistentSearch.success).toBe(false)
    })
  })

  describe('Real-World Usage Scenarios', () => {
    it('should handle typical Ambient.AI webhook integration scenario', async () => {
      // Simulate receiving webhook from Ambient.AI
      const webhookPayload = {
        alert_id: 'AMB-WEBHOOK-001',
        alert_type: 'security_breach',
        confidence: 0.87,
        location: {
          building: 'Main Office',
          zone: 'Loading Dock',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        media: {
          preview_image: 'https://ambient.ai/preview/webhook-001.jpg',
          video_clip: 'https://ambient.ai/video/webhook-001.mp4',
          deep_link: 'https://ambient.ai/alerts/webhook-001'
        },
        timestamp: new Date().toISOString(),
        description: 'Unauthorized person detected in restricted area'
      }

      // Transform webhook payload to Activity data
      const activityData = {
        ambient_alert_id: webhookPayload.alert_id,
        type: 'security-breach' as ActivityType,
        title: `Security Alert: ${webhookPayload.alert_type}`,
        location: `${webhookPayload.location.building} - ${webhookPayload.location.zone}`,
        priority: webhookPayload.confidence > 0.8 ? 'high' : 'medium' as Priority,
        preview_url: webhookPayload.media.preview_image,
        deep_link_url: webhookPayload.media.deep_link,
        confidence_score: webhookPayload.confidence,
        description: webhookPayload.description,
        building: webhookPayload.location.building,
        zone: webhookPayload.location.zone
      }

      const result = await service.createActivityFromAmbient(activityData, {
        ...mockContext,
        userId: 'webhook-processor'
      })

      expect(result.success).toBe(true)
      expect(result.data!.source).toBe('AMBIENT')
      expect(result.data!.system_tags).toContain('source:ambient')
      expect(result.data!.system_tags).toContain('high-confidence')

      // Simulate subsequent update from Ambient with additional information
      const updateResult = await service.updateAmbientActivity(
        webhookPayload.alert_id,
        {
          confidence_score: 0.95,
          status: 'assigned' as Status
        },
        mockContext
      )

      expect(updateResult.success).toBe(true)
      expect(updateResult.data!.confidence_score).toBe(0.95)
      expect(updateResult.data!.status).toBe('assigned')
    })

    it('should support security operations center (SOC) workflow', async () => {
      // Step 1: Multiple Ambient alerts come in
      const alertBatch = [
        {
          ambient_alert_id: 'AMB-SOC-001',
          type: 'security-breach' as ActivityType,
          title: 'Perimeter Breach - North Gate',
          location: 'North Perimeter Gate',
          priority: 'critical' as Priority,
          confidence_score: 0.96
        },
        {
          ambient_alert_id: 'AMB-SOC-002',
          type: 'alert' as ActivityType,
          title: 'Suspicious Loitering - Parking Lot',
          location: 'Employee Parking Lot B',
          priority: 'medium' as Priority,
          confidence_score: 0.73
        },
        {
          ambient_alert_id: 'AMB-SOC-003',
          type: 'security-breach' as ActivityType,
          title: 'Unauthorized Access - Server Room',
          location: 'Building A - Server Room',
          priority: 'critical' as Priority,
          confidence_score: 0.91
        }
      ]

      // Create all alerts
      const createResults = await Promise.all(
        alertBatch.map(alert => service.createActivityFromAmbient(alert, mockContext))
      )

      expect(createResults.every(r => r.success)).toBe(true)

      // Step 2: SOC operator filters for critical alerts
      const allActivities = activityStore.getAll()
      const criticalAlerts = allActivities.filter(a => a.priority === 'critical')
      expect(criticalAlerts.length).toBe(2)

      // Step 3: Assign critical alerts to response teams
      for (const alert of criticalAlerts) {
        const assignResult = await service.assignActivity(
          alert.id,
          `response-team-${alert.id.slice(-1)}`,
          mockContext
        )
        expect(assignResult.success).toBe(true)
      }

      // Step 4: Update status as teams respond
      const statusUpdates = [
        { id: criticalAlerts[0].id, status: 'responding' as Status },
        { id: criticalAlerts[1].id, status: 'responding' as Status }
      ]

      for (const update of statusUpdates) {
        const updateResult = await service.updateActivityStatus(
          update.id,
          update.status,
          mockContext
        )
        expect(updateResult.success).toBe(true)
      }

      // Step 5: Verify incidents were created for critical activities
      const incidents = incidentStore.getIncidents()
      const criticalIncidents = incidents.filter(inc => 
        criticalAlerts.some(alert => alert.id === inc.trigger_activity_id)
      )
      expect(criticalIncidents.length).toBe(2)

      // Step 6: Close out resolved activities
      for (const alert of criticalAlerts) {
        const resolveResult = await service.updateActivityStatus(
          alert.id,
          'resolved',
          { ...mockContext, userRole: 'supervisor' }
        )
        expect(resolveResult.success).toBe(true)
      }
    })
  })
})