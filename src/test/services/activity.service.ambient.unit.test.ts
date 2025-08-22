/**
 * Unit Tests for ActivityService Ambient.AI Integration
 * 
 * Focused unit tests that validate:
 * - ActivityService Ambient-specific methods work correctly
 * - Proper data transformation and validation
 * - Error handling for Ambient operations
 * - Integration with Activity entity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ActivityFactory } from '../../domains/activities/entities/Activity'
import { ActivityType } from '../../../lib/utils/security'
import { Priority, Status } from '../../../lib/utils/status'
import { EnterpriseActivity } from '../../../lib/types/activity'

describe('ActivityService Ambient Integration - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ActivityFactory.createFromAmbient Integration', () => {
    it('should create valid EnterpriseActivity from Ambient data', () => {
      const ambientData = {
        ambient_alert_id: 'AMB-UNIT-001',
        type: 'security-breach' as ActivityType,
        title: 'Unit Test Security Breach',
        location: 'Building A - Test Area',
        priority: 'critical' as Priority,
        created_by: 'ambient-system',
        preview_url: 'https://ambient.ai/preview/unit-001.jpg',
        deep_link_url: 'https://ambient.ai/alerts/unit-001',
        confidence_score: 0.92,
        description: 'High-confidence security breach for unit testing',
        building: 'Building A',
        zone: 'Test Area',
        confidence: 92
      }

      const activity = ActivityFactory.createFromAmbient(ambientData)
      const snapshot = activity.toSnapshot()

      // Verify Ambient-specific fields
      expect(snapshot.ambient_alert_id).toBe('AMB-UNIT-001')
      expect(snapshot.source).toBe('AMBIENT')
      expect(snapshot.preview_url).toBe('https://ambient.ai/preview/unit-001.jpg')
      expect(snapshot.deep_link_url).toBe('https://ambient.ai/alerts/unit-001')
      expect(snapshot.confidence_score).toBe(0.92)

      // Verify standard fields
      expect(snapshot.type).toBe('security-breach')
      expect(snapshot.title).toBe('Unit Test Security Breach')
      expect(snapshot.priority).toBe('critical')
      expect(snapshot.status).toBe('detecting')

      // Verify enhanced tagging
      expect(snapshot.system_tags).toContain('source:ambient')
      expect(snapshot.system_tags).toContain('high-confidence')
      expect(snapshot.system_tags).toContain('building:Building A')
      expect(snapshot.system_tags).toContain('zone:Test Area')

      // Verify business rules
      expect(snapshot.retention_date).toBeInstanceOf(Date)
      expect(snapshot.is_archived).toBe(false)
      expect(activity.allowed_status_transitions).toContain('assigned')
      expect(activity.requires_approval).toBe(true) // Critical priority requires approval
    })

    it('should handle minimal Ambient data correctly', () => {
      const minimalData = {
        ambient_alert_id: 'AMB-MIN-001',
        type: 'alert' as ActivityType,
        title: 'Minimal Alert',
        location: 'Unknown Location',
        priority: 'medium' as Priority,
        created_by: 'ambient-system'
      }

      const activity = ActivityFactory.createFromAmbient(minimalData)
      const snapshot = activity.toSnapshot()

      expect(snapshot.ambient_alert_id).toBe('AMB-MIN-001')
      expect(snapshot.source).toBe('AMBIENT')
      expect(snapshot.preview_url).toBeUndefined()
      expect(snapshot.deep_link_url).toBeUndefined()
      expect(snapshot.confidence_score).toBeUndefined()
      expect(snapshot.type).toBe('alert')
      expect(snapshot.priority).toBe('medium')
      expect(activity.requires_approval).toBe(false) // Medium priority doesn't require approval
    })

    it('should validate Ambient data integrity', () => {
      const testCases = [
        {
          name: 'Valid high confidence',
          data: {
            ambient_alert_id: 'AMB-VALID-HIGH',
            type: 'security-breach' as ActivityType,
            title: 'High Confidence Test',
            location: 'Test Location',
            priority: 'high' as Priority,
            created_by: 'test',
            confidence_score: 0.95
          },
          expectedTag: 'high-confidence'
        },
        {
          name: 'Valid medium confidence',
          data: {
            ambient_alert_id: 'AMB-VALID-MED',
            type: 'alert' as ActivityType,
            title: 'Medium Confidence Test',
            location: 'Test Location',
            priority: 'medium' as Priority,
            created_by: 'test',
            confidence_score: 0.72
          },
          expectedTag: 'medium-confidence'
        },
        {
          name: 'Valid low confidence',
          data: {
            ambient_alert_id: 'AMB-VALID-LOW',
            type: 'alert' as ActivityType,
            title: 'Low Confidence Test',
            location: 'Test Location',
            priority: 'low' as Priority,
            created_by: 'test',
            confidence_score: 0.45
          },
          expectedTag: 'low-confidence'
        }
      ]

      testCases.forEach(testCase => {
        const activity = ActivityFactory.createFromAmbient(testCase.data)
        const snapshot = activity.toSnapshot()

        expect(snapshot.system_tags, `${testCase.name} - system tags`).toContain(testCase.expectedTag)
        expect(snapshot.system_tags, `${testCase.name} - source tag`).toContain('source:ambient')
        expect(activity.isValid(), `${testCase.name} - validity`).toBe(true)
      })
    })
  })

  describe('Data Transformation and Validation', () => {
    it('should properly convert Activity entity to EnterpriseActivity format', () => {
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-TRANSFORM-001',
        type: 'security-breach' as ActivityType,
        title: 'Transformation Test',
        location: 'Building B',
        priority: 'high' as Priority,
        created_by: 'ambient-system',
        preview_url: 'https://ambient.ai/preview/transform.jpg',
        confidence_score: 0.88,
        building: 'Building B',
        zone: 'Security Zone'
      })

      // Convert to Enterprise format (as ActivityService would do)
      const enterpriseActivity: EnterpriseActivity = {
        ...activity.toSnapshot(),
        id: `AMB-${Date.now().toString().padStart(6, '0')}`,
        allowed_status_transitions: activity.allowed_status_transitions,
        requires_approval: activity.requires_approval
      } as EnterpriseActivity

      // Verify the transformation
      expect(enterpriseActivity.id).toMatch(/^AMB-\d+$/)
      expect(enterpriseActivity.ambient_alert_id).toBe('AMB-TRANSFORM-001')
      expect(enterpriseActivity.source).toBe('AMBIENT')
      expect(enterpriseActivity.preview_url).toBe('https://ambient.ai/preview/transform.jpg')
      expect(enterpriseActivity.confidence_score).toBe(0.88)
      expect(enterpriseActivity.allowed_status_transitions).toEqual(activity.allowed_status_transitions)
      expect(enterpriseActivity.requires_approval).toBe(activity.requires_approval)
    })

    it('should handle edge cases in Ambient data', () => {
      const edgeCases = [
        {
          name: 'Empty optional strings',
          data: {
            ambient_alert_id: 'AMB-EDGE-EMPTY',
            type: 'alert' as ActivityType,
            title: 'Edge Case Test',
            location: 'Test Location',
            priority: 'medium' as Priority,
            created_by: 'test',
            preview_url: '',
            deep_link_url: '',
            description: ''
          }
        },
        {
          name: 'Boundary confidence values',
          data: {
            ambient_alert_id: 'AMB-EDGE-BOUNDARY',
            type: 'alert' as ActivityType,
            title: 'Boundary Test',
            location: 'Test Location',
            priority: 'medium' as Priority,
            created_by: 'test',
            confidence_score: 0.0
          }
        },
        {
          name: 'Maximum confidence',
          data: {
            ambient_alert_id: 'AMB-EDGE-MAX',
            type: 'alert' as ActivityType,
            title: 'Max Confidence Test',
            location: 'Test Location',
            priority: 'medium' as Priority,
            created_by: 'test',
            confidence_score: 1.0
          }
        }
      ]

      edgeCases.forEach(edgeCase => {
        const activity = ActivityFactory.createFromAmbient(edgeCase.data)
        
        expect(activity.isValid(), `${edgeCase.name} - should be valid`).toBe(true)
        expect(activity.source, `${edgeCase.name} - should be AMBIENT`).toBe('AMBIENT')
        expect(activity.ambient_alert_id, `${edgeCase.name} - should have alert ID`).toBe(edgeCase.data.ambient_alert_id)
      })
    })
  })

  describe('Business Logic Integration', () => {
    it('should apply correct business rules for different activity types', () => {
      const activityTypes: { type: ActivityType; expectedIncident: boolean }[] = [
        { type: 'security-breach', expectedIncident: true },
        { type: 'medical', expectedIncident: true },
        { type: 'alert', expectedIncident: true },
        { type: 'bol-event', expectedIncident: true },
        { type: 'property-damage', expectedIncident: true },
        { type: 'patrol', expectedIncident: false },
        { type: 'evidence', expectedIncident: false }
      ]

      activityTypes.forEach(({ type, expectedIncident }) => {
        const activity = ActivityFactory.createFromAmbient({
          ambient_alert_id: `AMB-RULE-${type.toUpperCase()}`,
          type,
          title: `Business Rule Test - ${type}`,
          location: 'Test Location',
          priority: 'medium' as Priority,
          created_by: 'ambient-system'
        })

        const snapshot = activity.toSnapshot()

        // Verify type-specific tags
        expect(snapshot.system_tags).toContain(`type:${type}`)
        expect(snapshot.system_tags).toContain('source:ambient')

        // Verify activity validity
        expect(activity.isValid()).toBe(true)

        // Note: Incident creation logic would be tested in integration tests
        // as it requires the full service context
      })
    })

    it('should generate appropriate retention and archival rules', () => {
      const activity = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-RETENTION-001',
        type: 'security-breach' as ActivityType,
        title: 'Retention Test',
        location: 'Test Location',
        priority: 'high' as Priority,
        created_by: 'ambient-system'
      })

      const snapshot = activity.toSnapshot()

      // Verify retention date is set (30 days from creation)
      expect(snapshot.retention_date).toBeInstanceOf(Date)
      const retentionDate = new Date(snapshot.retention_date)
      const expectedRetention = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      // Allow for slight time differences in test execution
      expect(Math.abs(retentionDate.getTime() - expectedRetention.getTime())).toBeLessThan(1000)

      // Verify archival status
      expect(snapshot.is_archived).toBe(false)
      expect(snapshot.archive_reason).toBeUndefined()
    })
  })

  describe('Backward Compatibility Verification', () => {
    it('should not break existing Activity entity functionality', () => {
      // Create a traditional manual activity
      const manualActivity = ActivityFactory.createManual({
        type: 'patrol',
        title: 'Manual Patrol Activity',
        location: 'Building C',
        priority: 'low',
        created_by: 'officer-123',
        building: 'Building C',
        zone: 'Patrol Zone'
      })

      const manualSnapshot = manualActivity.toSnapshot()

      // Verify manual activity properties
      expect(manualSnapshot.source).toBe('MANUAL')
      expect(manualSnapshot.ambient_alert_id).toBeUndefined()
      expect(manualSnapshot.preview_url).toBeUndefined()
      expect(manualSnapshot.deep_link_url).toBeUndefined()
      expect(manualSnapshot.confidence_score).toBeUndefined()

      // Create an external system activity
      const externalActivity = ActivityFactory.createFromExternalSystem({
        externalData: {
          sourceSystem: 'legacy-system',
          originalType: 'motion_alert',
          rawPayload: { sensorId: 'sensor-001' },
          processingTimestamp: new Date().toISOString(),
          mappingUsed: 'v1',
          originalEvent: { type: 'motion' }
        },
        type: 'alert',
        title: 'External System Alert',
        location: 'Building D',
        priority: 'medium',
        created_by: 'integration-service'
      })

      const externalSnapshot = externalActivity.toSnapshot()

      // Verify external activity properties
      expect(externalSnapshot.source).toBe('SITU8')
      expect(externalSnapshot.ambient_alert_id).toBeUndefined()
      expect(externalSnapshot.externalData).toBeDefined()
      expect(externalSnapshot.externalData!.sourceSystem).toBe('legacy-system')

      // Verify all activities are valid
      expect(manualActivity.isValid()).toBe(true)
      expect(externalActivity.isValid()).toBe(true)
    })

    it('should handle mixed scenarios with different activity sources', () => {
      const activities = [
        ActivityFactory.createFromAmbient({
          ambient_alert_id: 'AMB-MIXED-001',
          type: 'security-breach' as ActivityType,
          title: 'Ambient Alert',
          location: 'Building A',
          priority: 'high' as Priority,
          created_by: 'ambient-system'
        }),
        ActivityFactory.createManual({
          type: 'patrol',
          title: 'Manual Patrol',
          location: 'Building B',
          priority: 'low',
          created_by: 'officer-456'
        }),
        ActivityFactory.createFromExternalSystem({
          externalData: {
            sourceSystem: 'camera-system',
            originalType: 'motion',
            rawPayload: {},
            processingTimestamp: new Date().toISOString(),
            mappingUsed: 'v1',
            originalEvent: {}
          },
          type: 'alert',
          title: 'Camera Alert',
          location: 'Building C',
          priority: 'medium',
          created_by: 'camera-integration'
        })
      ]

      const snapshots = activities.map(a => a.toSnapshot())

      // Verify each source type has correct properties
      expect(snapshots[0].source).toBe('AMBIENT')
      expect(snapshots[0].ambient_alert_id).toBe('AMB-MIXED-001')
      expect(snapshots[0].system_tags).toContain('source:ambient')

      expect(snapshots[1].source).toBe('MANUAL')
      expect(snapshots[1].ambient_alert_id).toBeUndefined()
      expect(snapshots[1].system_tags).toContain('source:manual')

      expect(snapshots[2].source).toBe('SITU8')
      expect(snapshots[2].ambient_alert_id).toBeUndefined()
      expect(snapshots[2].externalData).toBeDefined()
      expect(snapshots[2].system_tags).toContain('source:situ8')

      // All should be valid
      expect(activities.every(a => a.isValid())).toBe(true)
    })
  })

  describe('Error Handling and Validation', () => {
    it('should maintain data integrity with invalid inputs', () => {
      // Test with undefined confidence score
      const activity1 = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-ERROR-001',
        type: 'alert' as ActivityType,
        title: 'Error Test 1',
        location: 'Test Location',
        priority: 'medium' as Priority,
        created_by: 'test',
        confidence_score: undefined
      })

      expect(activity1.confidence_score).toBeUndefined()
      expect(activity1.isValid()).toBe(true)

      // Test with empty strings
      const activity2 = ActivityFactory.createFromAmbient({
        ambient_alert_id: 'AMB-ERROR-002',
        type: 'alert' as ActivityType,
        title: 'Error Test 2',
        location: 'Test Location',
        priority: 'medium' as Priority,
        created_by: 'test',
        preview_url: '',
        deep_link_url: ''
      })

      expect(activity2.preview_url).toBe('')
      expect(activity2.deep_link_url).toBe('')
      expect(activity2.isValid()).toBe(true)
    })
  })
})