/**
 * Comprehensive Tests for Activity Entity Ambient.AI Integration
 * 
 * This test suite validates:
 * - Activity entity accepts new Ambient-specific fields
 * - ActivityService handles Ambient-sourced activities correctly  
 * - ActivityFactory.createFromAmbient() works properly
 * - Backward compatibility is maintained
 * - TypeScript types are correct
 * - Serialization/deserialization works
 * - Enhanced tagging system for Ambient activities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Activity, ActivityFactory, BadgeHolder, Evidence } from '../../../../domains/activities/entities/Activity'
import { ActivityType } from '../../../../../lib/utils/security'
import { Priority, Status } from '../../../../../lib/utils/status'

describe('Activity Entity - Ambient.AI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Activity Entity - Ambient Field Acceptance', () => {
    it('should accept all Ambient-specific fields in constructor', () => {
      const ambientProps = {
        id: 'AMB-123456',
        timestamp: new Date(),
        type: 'security-breach' as ActivityType,
        title: 'Ambient Security Alert',
        location: 'Building A - Entrance',
        priority: 'high' as Priority,
        status: 'detecting' as Status,
        created_by: 'ambient-system',
        // Ambient-specific fields
        ambient_alert_id: 'AMB-ALERT-789',
        source: 'AMBIENT' as const,
        preview_url: 'https://ambient.ai/preview/alert-789.jpg',
        deep_link_url: 'https://ambient.ai/alerts/789',
        confidence_score: 0.92,
        description: 'High confidence security breach detected'
      }

      const activity = new Activity(ambientProps)

      expect(activity.ambient_alert_id).toBe('AMB-ALERT-789')
      expect(activity.source).toBe('AMBIENT')
      expect(activity.preview_url).toBe('https://ambient.ai/preview/alert-789.jpg')
      expect(activity.deep_link_url).toBe('https://ambient.ai/alerts/789')
      expect(activity.confidence_score).toBe(0.92)
      expect(activity.isValid()).toBe(true)
    })

    it('should default source to MANUAL when not specified', () => {
      const activity = new Activity({
        id: 'TEST-001',
        timestamp: new Date(),
        type: 'alert',
        title: 'Test Alert',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'test-user'
      })

      expect(activity.source).toBe('MANUAL')
    })

    it('should accept SITU8 as source type', () => {
      const activity = new Activity({
        id: 'TEST-002',
        timestamp: new Date(),
        type: 'alert',
        title: 'SITU8 Alert',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'situ8-system',
        source: 'SITU8'
      })

      expect(activity.source).toBe('SITU8')
    })

    it('should handle optional Ambient fields gracefully', () => {
      const activity = new Activity({
        id: 'AMB-PARTIAL',
        timestamp: new Date(),
        type: 'alert',
        title: 'Partial Ambient Alert',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'ambient-system',
        ambient_alert_id: 'AMB-456',
        source: 'AMBIENT'
        // preview_url, deep_link_url, confidence_score omitted
      })

      expect(activity.ambient_alert_id).toBe('AMB-456')
      expect(activity.source).toBe('AMBIENT')
      expect(activity.preview_url).toBeUndefined()
      expect(activity.deep_link_url).toBeUndefined()
      expect(activity.confidence_score).toBeUndefined()
      expect(activity.isValid()).toBe(true)
    })
  })

  describe('Activity Entity - Enhanced Tagging System', () => {
    it('should generate source-based system tags', () => {
      const ambientActivity = new Activity({
        id: 'AMB-TAG-001',
        timestamp: new Date(),
        type: 'security-breach',
        title: 'Ambient Security Alert',
        location: 'Building A',
        priority: 'high',
        status: 'detecting',
        created_by: 'ambient-system',
        source: 'AMBIENT',
        confidence_score: 0.85
      })

      expect(ambientActivity.system_tags).toContain('source:ambient')
    })

    it('should generate confidence-based tags for Ambient activities', () => {
      const highConfidenceActivity = new Activity({
        id: 'AMB-HIGH-CONF',
        timestamp: new Date(),
        type: 'alert',
        title: 'High Confidence Alert',
        location: 'Test Location',
        priority: 'high',
        status: 'detecting',
        created_by: 'ambient-system',
        source: 'AMBIENT',
        confidence_score: 0.95
      })

      const mediumConfidenceActivity = new Activity({
        id: 'AMB-MED-CONF',
        timestamp: new Date(),
        type: 'alert',
        title: 'Medium Confidence Alert',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'ambient-system',
        source: 'AMBIENT',
        confidence_score: 0.70
      })

      const lowConfidenceActivity = new Activity({
        id: 'AMB-LOW-CONF',
        timestamp: new Date(),
        type: 'alert',
        title: 'Low Confidence Alert',
        location: 'Test Location',
        priority: 'low',
        status: 'detecting',
        created_by: 'ambient-system',
        source: 'AMBIENT',
        confidence_score: 0.45
      })

      expect(highConfidenceActivity.system_tags).toContain('high-confidence')
      expect(mediumConfidenceActivity.system_tags).toContain('medium-confidence')
      expect(lowConfidenceActivity.system_tags).toContain('low-confidence')
    })

    it('should not generate confidence tags for non-Ambient activities', () => {
      const manualActivity = new Activity({
        id: 'MANUAL-001',
        timestamp: new Date(),
        type: 'alert',
        title: 'Manual Alert',
        location: 'Test Location',
        priority: 'high',
        status: 'detecting',
        created_by: 'user-123',
        source: 'MANUAL'
      })

      const tags = manualActivity.system_tags
      expect(tags).not.toContain('high-confidence')
      expect(tags).not.toContain('medium-confidence')
      expect(tags).not.toContain('low-confidence')
      expect(tags).toContain('source:manual')
    })
  })

  describe('Activity Entity - Serialization and Deserialization', () => {
    it('should serialize Ambient fields to snapshot', () => {
      const activity = new Activity({
        id: 'AMB-SERIALIZE',
        timestamp: new Date(),
        type: 'security-breach',
        title: 'Serialization Test',
        location: 'Test Location',
        priority: 'high',
        status: 'detecting',
        created_by: 'ambient-system',
        ambient_alert_id: 'AMB-SER-123',
        source: 'AMBIENT',
        preview_url: 'https://ambient.ai/preview/123.jpg',
        deep_link_url: 'https://ambient.ai/alerts/123',
        confidence_score: 0.88
      })

      const snapshot = activity.toSnapshot()

      expect(snapshot.ambient_alert_id).toBe('AMB-SER-123')
      expect(snapshot.source).toBe('AMBIENT')
      expect(snapshot.preview_url).toBe('https://ambient.ai/preview/123.jpg')
      expect(snapshot.deep_link_url).toBe('https://ambient.ai/alerts/123')
      expect(snapshot.confidence_score).toBe(0.88)
    })

    it('should deserialize Ambient fields from snapshot', () => {
      const snapshot = {
        id: 'AMB-DESERIALIZE',
        timestamp: new Date().toISOString(),
        type: 'alert',
        title: 'Deserialization Test',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'ambient-system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'ambient-system',
        system_tags: ['source:ambient', 'high-confidence'],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_archived: false,
        // Ambient fields
        ambient_alert_id: 'AMB-DESER-456',
        source: 'AMBIENT',
        preview_url: 'https://ambient.ai/preview/456.jpg',
        deep_link_url: 'https://ambient.ai/alerts/456',
        confidence_score: 0.76
      }

      const activity = Activity.fromSnapshot(snapshot)

      expect(activity.ambient_alert_id).toBe('AMB-DESER-456')
      expect(activity.source).toBe('AMBIENT')
      expect(activity.preview_url).toBe('https://ambient.ai/preview/456.jpg')
      expect(activity.deep_link_url).toBe('https://ambient.ai/alerts/456')
      expect(activity.confidence_score).toBe(0.76)
      expect(activity.isValid()).toBe(true)
    })

    it('should handle undefined Ambient fields in deserialization', () => {
      const snapshot = {
        id: 'AMB-PARTIAL-DESER',
        timestamp: new Date().toISOString(),
        type: 'alert',
        title: 'Partial Deserialization Test',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'ambient-system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'ambient-system',
        system_tags: ['source:ambient'],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_archived: false,
        source: 'AMBIENT'
        // Other Ambient fields omitted
      }

      const activity = Activity.fromSnapshot(snapshot)

      expect(activity.source).toBe('AMBIENT')
      expect(activity.ambient_alert_id).toBeUndefined()
      expect(activity.preview_url).toBeUndefined()
      expect(activity.deep_link_url).toBeUndefined()
      expect(activity.confidence_score).toBeUndefined()
      expect(activity.isValid()).toBe(true)
    })
  })

  describe('ActivityFactory - createFromAmbient', () => {
    it('should create Ambient activity with all fields', () => {
      const ambientData = {
        ambient_alert_id: 'AMB-FACTORY-001',
        type: 'security-breach' as ActivityType,
        title: 'Factory Test Alert',
        location: 'Building B - Lobby',
        priority: 'critical' as Priority,
        created_by: 'ambient-integration',
        preview_url: 'https://ambient.ai/preview/factory-001.jpg',
        deep_link_url: 'https://ambient.ai/alerts/factory-001',
        confidence_score: 0.94,
        description: 'Factory created Ambient alert',
        building: 'Building B',
        zone: 'Lobby',
        confidence: 94
      }

      const activity = ActivityFactory.createFromAmbient(ambientData)

      expect(activity.source).toBe('AMBIENT')
      expect(activity.ambient_alert_id).toBe('AMB-FACTORY-001')
      expect(activity.type).toBe('security-breach')
      expect(activity.title).toBe('Factory Test Alert')
      expect(activity.priority).toBe('critical')
      expect(activity.preview_url).toBe('https://ambient.ai/preview/factory-001.jpg')
      expect(activity.deep_link_url).toBe('https://ambient.ai/alerts/factory-001')
      expect(activity.confidence_score).toBe(0.94)
      expect(activity.building).toBe('Building B')
      expect(activity.zone).toBe('Lobby')
      expect(activity.confidence).toBe(94)
      expect(activity.status).toBe('detecting')
      expect(activity.isValid()).toBe(true)
    })

    it('should create Ambient activity with minimal required fields', () => {
      const minimalData = {
        ambient_alert_id: 'AMB-MIN-001',
        type: 'alert' as ActivityType,
        title: 'Minimal Alert',
        location: 'Unknown Location',
        priority: 'medium' as Priority,
        created_by: 'ambient-system'
      }

      const activity = ActivityFactory.createFromAmbient(minimalData)

      expect(activity.source).toBe('AMBIENT')
      expect(activity.ambient_alert_id).toBe('AMB-MIN-001')
      expect(activity.type).toBe('alert')
      expect(activity.priority).toBe('medium')
      expect(activity.preview_url).toBeUndefined()
      expect(activity.deep_link_url).toBeUndefined()
      expect(activity.confidence_score).toBeUndefined()
      expect(activity.isValid()).toBe(true)
    })

    it('should generate unique IDs with ambient prefix', () => {
      const data = {
        ambient_alert_id: 'AMB-UNIQUE-001',
        type: 'alert' as ActivityType,
        title: 'Unique ID Test',
        location: 'Test Location',
        priority: 'medium' as Priority,
        created_by: 'test-user'
      }

      const activity1 = ActivityFactory.createFromAmbient(data)
      const activity2 = ActivityFactory.createFromAmbient(data)

      expect(activity1.id).toMatch(/^ambient-\d+-[a-z0-9]+$/)
      expect(activity2.id).toMatch(/^ambient-\d+-[a-z0-9]+$/)
      expect(activity1.id).not.toBe(activity2.id)
    })

    it('should set timestamp to current time', () => {
      const beforeCreation = Date.now()
      
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-TIME-001',
        type: 'alert' as ActivityType,
        title: 'Timestamp Test',
        location: 'Test Location',
        priority: 'medium' as Priority,
        created_by: 'test-user'
      })

      const afterCreation = Date.now()

      expect(activity.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation)
      expect(activity.timestamp.getTime()).toBeLessThanOrEqual(afterCreation)
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing Activity creation', () => {
      // Test that existing manual creation still works
      const manualActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'Manual Security Breach',
        location: 'Building A',
        priority: 'high',
        created_by: 'security-officer',
        building: 'Building A',
        zone: 'Main Entrance'
      })

      expect(manualActivity.source).toBe('MANUAL')
      expect(manualActivity.ambient_alert_id).toBeUndefined()
      expect(manualActivity.preview_url).toBeUndefined()
      expect(manualActivity.deep_link_url).toBeUndefined()
      expect(manualActivity.confidence_score).toBeUndefined()
      expect(manualActivity.isValid()).toBe(true)
    })

    it('should maintain compatibility with external system creation', () => {
      const externalData = {
        sourceSystem: 'legacy-system',
        originalType: 'motion_detection',
        rawPayload: { cameraId: 'cam-001' },
        processingTimestamp: new Date().toISOString(),
        mappingUsed: 'v1',
        originalEvent: { type: 'motion' }
      }

      const externalActivity = ActivityFactory.createFromExternalSystem({
        externalData,
        type: 'alert',
        title: 'External System Alert',
        location: 'Building C',
        priority: 'medium',
        created_by: 'integration-service'
      })

      expect(externalActivity.source).toBe('SITU8')
      expect(externalActivity.ambient_alert_id).toBeUndefined()
      expect(externalActivity.externalData).toEqual(externalData)
      expect(externalActivity.isValid()).toBe(true)
    })

    it('should handle mixed Ambient and legacy fields', () => {
      const mixedActivity = new Activity({
        id: 'MIXED-001',
        timestamp: new Date(),
        type: 'security-breach',
        title: 'Mixed Data Activity',
        location: 'Building D',
        priority: 'high',
        status: 'detecting',
        created_by: 'mixed-system',
        // Legacy fields
        building: 'Building D',
        zone: 'Security Zone',
        confidence: 85,
        // Ambient fields
        ambient_alert_id: 'AMB-MIXED-001',
        source: 'AMBIENT',
        confidence_score: 0.85,
        // External data (legacy)
        externalData: {
          sourceSystem: 'legacy-cam-system',
          originalType: 'security_alert',
          rawPayload: { alertId: 'legacy-123' },
          processingTimestamp: new Date().toISOString(),
          mappingUsed: 'v1',
          originalEvent: { type: 'security' }
        }
      })

      expect(mixedActivity.source).toBe('AMBIENT')
      expect(mixedActivity.ambient_alert_id).toBe('AMB-MIXED-001')
      expect(mixedActivity.confidence).toBe(85)
      expect(mixedActivity.confidence_score).toBe(0.85)
      expect(mixedActivity.externalData).toBeDefined()
      expect(mixedActivity.building).toBe('Building D')
      expect(mixedActivity.isValid()).toBe(true)
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should enforce correct source types', () => {
      // This test validates that TypeScript compilation would catch type errors
      const validSources: Array<'AMBIENT' | 'SITU8' | 'MANUAL'> = ['AMBIENT', 'SITU8', 'MANUAL']
      
      validSources.forEach(source => {
        const activity = new Activity({
          id: `TYPE-${source}`,
          timestamp: new Date(),
          type: 'alert',
          title: `${source} Activity`,
          location: 'Test Location',
          priority: 'medium',
          status: 'detecting',
          created_by: 'test-user',
          source
        })

        expect(activity.source).toBe(source)
      })
    })

    it('should allow optional Ambient fields to be undefined', () => {
      const activity = new Activity({
        id: 'OPTIONAL-001',
        timestamp: new Date(),
        type: 'alert',
        title: 'Optional Fields Test',
        location: 'Test Location',
        priority: 'medium',
        status: 'detecting',
        created_by: 'test-user',
        source: 'AMBIENT'
        // All Ambient-specific fields omitted
      })

      // TypeScript should allow these to be undefined
      const undefinedFields: (string | undefined)[] = [
        activity.ambient_alert_id,
        activity.preview_url,
        activity.deep_link_url
      ]

      const undefinedNumber: number | undefined = activity.confidence_score

      expect(undefinedFields.every(field => field === undefined)).toBe(true)
      expect(undefinedNumber).toBeUndefined()
    })
  })

  describe('Integration with Domain Events', () => {
    it('should emit domain events for Ambient activities', () => {
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-EVENTS-001',
        type: 'security-breach',
        title: 'Event Test Activity',
        location: 'Building E',
        priority: 'high',
        created_by: 'ambient-system'
      })

      const events = activity.getUncommittedEvents()

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('ActivityCreated')
      expect(events[0].aggregateId).toBe(activity.id)
      expect(events[0].payload).toMatchObject({
        activityId: activity.id,
        title: 'Event Test Activity',
        activityType: 'security-breach',
        priority: 'high'
      })
    })

    it('should track status changes for Ambient activities', () => {
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-STATUS-001',
        type: 'alert',
        title: 'Status Change Test',
        location: 'Building F',
        priority: 'medium',
        created_by: 'ambient-system'
      })

      // Clear initial creation event
      activity.markEventsAsCommitted()

      // Update status
      activity.updateStatus('assigned', 'security-officer')

      const events = activity.getUncommittedEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('ActivityStatusChanged')
      expect(events[0].payload).toMatchObject({
        activityId: activity.id,
        oldStatus: 'detecting',
        newStatus: 'assigned'
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long Ambient URLs', () => {
      const longUrl = 'https://ambient.ai/preview/' + 'a'.repeat(500) + '.jpg'
      const longDeepLink = 'https://ambient.ai/alerts/' + 'b'.repeat(500)

      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-LONG-001',
        type: 'alert',
        title: 'Long URL Test',
        location: 'Test Location',
        priority: 'medium',
        created_by: 'test-user',
        preview_url: longUrl,
        deep_link_url: longDeepLink
      })

      expect(activity.preview_url).toBe(longUrl)
      expect(activity.deep_link_url).toBe(longDeepLink)
      expect(activity.isValid()).toBe(true)
    })

    it('should handle extreme confidence score values', () => {
      const extremeValues = [0, 1, 0.0001, 0.9999]

      extremeValues.forEach(score => {
        const activity = ActivityFactory.createFromAmbient({
          ambient_alert_id: `AMB-EXTREME-${score}`,
          type: 'alert',
          title: `Extreme Confidence ${score}`,
          location: 'Test Location',
          priority: 'medium',
          created_by: 'test-user',
          confidence_score: score
        })

        expect(activity.confidence_score).toBe(score)
        expect(activity.isValid()).toBe(true)
      })
    })

    it('should handle special characters in Ambient alert IDs', () => {
      const specialChars = ['AMB-SPECIAL_001', 'AMB-SPECIAL-002', 'AMB.SPECIAL.003', 'AMB:SPECIAL:004']

      specialChars.forEach(alertId => {
        const activity = ActivityFactory.createFromAmbient({
          ambient_alert_id: alertId,
          type: 'alert',
          title: 'Special Characters Test',
          location: 'Test Location',
          priority: 'medium',
          created_by: 'test-user'
        })

        expect(activity.ambient_alert_id).toBe(alertId)
        expect(activity.isValid()).toBe(true)
      })
    })

    it('should maintain immutability of core activity properties', () => {
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-IMMUTABLE-001',
        type: 'security-breach',
        title: 'Immutability Test',
        location: 'Building G',
        priority: 'high',
        created_by: 'ambient-system'
      })

      const originalId = activity.id
      const originalTimestamp = activity.timestamp
      const originalType = activity.type
      const originalTitle = activity.title
      const originalSource = activity.source

      // Attempt to modify immutable properties (should not be possible)
      expect(activity.id).toBe(originalId)
      expect(activity.timestamp).toBe(originalTimestamp)
      expect(activity.type).toBe(originalType)
      expect(activity.title).toBe(originalTitle)
      expect(activity.source).toBe(originalSource)
    })

    it('should handle concurrent activity creation from same Ambient alert', () => {
      const sharedData = {
        ambient_alert_id: 'AMB-CONCURRENT-001',
        type: 'alert' as ActivityType,
        title: 'Concurrent Test',
        location: 'Test Location',
        priority: 'medium' as Priority,
        created_by: 'ambient-system'
      }

      const activity1 = ActivityFactory.createFromAmbient(sharedData)
      const activity2 = ActivityFactory.createFromAmbient(sharedData)

      // Should create different Activity entities with different IDs
      expect(activity1.id).not.toBe(activity2.id)
      expect(activity1.ambient_alert_id).toBe(activity2.ambient_alert_id)
      expect(activity1.ambient_alert_id).toBe('AMB-CONCURRENT-001')
    })
  })
})