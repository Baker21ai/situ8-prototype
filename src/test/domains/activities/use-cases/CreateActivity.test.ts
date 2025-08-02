/**
 * Unit Tests for CreateActivity Use Case
 * Tests business logic, validation, error handling, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CreateActivityUseCase, CreateActivityCommand, ActivityCreationHelper } from '../../../../domains/activities/use-cases/CreateActivity'
import { Activity, ActivityFactory } from '../../../../domains/activities/entities/Activity'
import { IActivityRepository } from '../../../../domains/activities/repositories/IActivityRepository'
import { Priority } from '../../../../../lib/utils/status'
import { ActivityType } from '../../../../../lib/utils/security'

// Mock repository interface
class MockActivityRepository implements Partial<IActivityRepository> {
  private activities: Activity[] = []
  private duplicateCheckDelay = 0
  private shouldFailCreate = false
  private shouldFailDuplicateCheck = false

  async create(activity: Activity): Promise<Activity> {
    if (this.shouldFailCreate) {
      throw new Error('Repository create failed')
    }
    
    const created = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    } as Activity
    
    this.activities.push(created)
    return created
  }

  async findMany(query: any): Promise<Activity[]> {
    if (this.shouldFailDuplicateCheck) {
      throw new Error('Repository find failed')
    }
    
    // Simulate database delay
    if (this.duplicateCheckDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.duplicateCheckDelay))
    }
    
    if (query.timeRange && query.limit) {
      const { start, end } = query.timeRange
      return this.activities.filter(activity => 
        activity.timestamp >= start && activity.timestamp <= end
      )
    }
    
    return this.activities
  }

  // Test helper methods
  setDuplicateCheckDelay(delay: number) {
    this.duplicateCheckDelay = delay
  }

  setShouldFailCreate(fail: boolean) {
    this.shouldFailCreate = fail
  }

  setShouldFailDuplicateCheck(fail: boolean) {
    this.shouldFailDuplicateCheck = fail
  }

  addExistingActivity(activity: Activity) {
    this.activities.push(activity)
  }

  getCreatedActivities(): Activity[] {
    return [...this.activities]
  }

  clear() {
    this.activities = []
  }
}

// Test data factories
const createValidCommand = (overrides: Partial<CreateActivityCommand> = {}): CreateActivityCommand => ({
  type: 'security-breach',
  title: 'Test Security Breach',
  location: 'Building A - Main Entrance',
  priority: 'high',
  description: 'Unauthorized access attempt detected',
  building: 'Building A',
  zone: 'Main Entrance',
  confidence: 85,
  createdBy: 'test-user-123',
  ...overrides
})

const createExternalDataCommand = (overrides: Partial<CreateActivityCommand> = {}): CreateActivityCommand => ({
  ...createValidCommand(),
  externalData: {
    sourceSystem: 'security-camera-system',
    originalType: 'motion_detection',
    rawPayload: {
      cameraId: 'cam-001',
      confidence: 0.95,
      boundingBox: { x: 100, y: 100, width: 200, height: 300 }
    },
    processingTimestamp: new Date().toISOString(),
    mappingUsed: 'security-alert-v2',
    originalEvent: {
      eventType: 'motion_detection',
      timestamp: new Date().toISOString()
    }
  },
  ...overrides
})

const createActivityWithBadgeHolder = (overrides: Partial<CreateActivityCommand> = {}): CreateActivityCommand => ({
  ...createValidCommand(),
  badgeHolder: {
    name: 'John Doe',
    id: 'badge-12345',
    department: 'IT',
    clearanceLevel: 'Level 2'
  },
  ...overrides
})

describe('CreateActivityUseCase', () => {
  let useCase: CreateActivityUseCase
  let mockRepository: MockActivityRepository

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    useCase = new CreateActivityUseCase(mockRepository as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('Successful Activity Creation', () => {
    it('should create a manual activity successfully', async () => {
      const command = createValidCommand()
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
      expect(result.activity!.title).toBe(command.title)
      expect(result.activity!.type).toBe(command.type)
      expect(result.activity!.priority).toBe(command.priority)
      expect(result.activity!.location).toBe(command.location)
      expect(result.activity!.building).toBe(command.building)
      expect(result.activity!.zone).toBe(command.zone)
      expect(result.error).toBeUndefined()
      expect(result.validationErrors).toBeUndefined()
    })

    it('should create an activity from external system', async () => {
      const command = createExternalDataCommand()
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
      expect(result.activity!.source).toBe('integration')
      expect(result.activity!.externalData).toEqual(command.externalData)
    })

    it('should create activity with badge holder information', async () => {
      const command = createActivityWithBadgeHolder()
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
      expect(result.activity!.badgeHolder).toEqual(command.badgeHolder)
    })

    it('should auto-escalate critical priority activities', async () => {
      const command = createValidCommand({ priority: 'critical' })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
      expect(result.activity!.escalationLevel).toBe(1)
      expect(result.activity!.escalatedBy).toBe('system')
    })

    it('should assign activity if assignedTo is provided', async () => {
      const command = createValidCommand({ assignedTo: 'officer-456' })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
      expect(result.activity!.assignedTo).toBe('officer-456')
      expect(result.activity!.status).toBe('assigned')
    })

    it('should handle all activity types correctly', async () => {
      const activityTypes: ActivityType[] = [
        'medical', 'security-breach', 'property-damage', 'alert', 'bol-event', 
        'access-control', 'visitor-management', 'maintenance', 'other'
      ]

      for (const type of activityTypes) {
        mockRepository.clear()
        const command = createValidCommand({ type, title: `Test ${type} activity` })
        
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(true)
        expect(result.activity!.type).toBe(type)
      }
    })

    it('should handle all priority levels correctly', async () => {
      const priorities: Priority[] = ['low', 'medium', 'high', 'critical']

      for (const priority of priorities) {
        mockRepository.clear()
        const command = createValidCommand({ priority, title: `Test ${priority} priority` })
        
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(true)
        expect(result.activity!.priority).toBe(priority)
        
        // Only critical should be auto-escalated
        if (priority === 'critical') {
          expect(result.activity!.escalationLevel).toBe(1)
        } else {
          expect(result.activity!.escalationLevel).toBe(0)
        }
      }
    })
  })

  describe('Validation Tests', () => {
    it('should reject command with missing required fields', async () => {
      const invalidCommands = [
        { ...createValidCommand(), type: undefined as any },
        { ...createValidCommand(), title: '' },
        { ...createValidCommand(), location: '' },
        { ...createValidCommand(), priority: undefined as any },
        { ...createValidCommand(), createdBy: '' }
      ]

      for (const command of invalidCommands) {
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors).toBeDefined()
        expect(result.validationErrors!.length).toBeGreaterThan(0)
        expect(result.activity).toBeUndefined()
      }
    })

    it('should reject title longer than 200 characters', async () => {
      const longTitle = 'A'.repeat(201)
      const command = createValidCommand({ title: longTitle })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.validationErrors).toContain('Title must be 200 characters or less')
    })

    it('should reject description longer than 2000 characters', async () => {
      const longDescription = 'A'.repeat(2001)
      const command = createValidCommand({ description: longDescription })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.validationErrors).toContain('Description must be 2000 characters or less')
    })

    it('should reject invalid confidence values', async () => {
      const invalidConfidenceCommands = [
        createValidCommand({ confidence: -1 }),
        createValidCommand({ confidence: 101 })
      ]

      for (const command of invalidConfidenceCommands) {
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors).toContain('Confidence must be between 0 and 100')
      }
    })

    it('should validate external data fields', async () => {
      const invalidExternalDataCommands = [
        createExternalDataCommand({
          externalData: {
            ...createExternalDataCommand().externalData!,
            sourceSystem: ''
          }
        }),
        createExternalDataCommand({
          externalData: {
            ...createExternalDataCommand().externalData!,
            originalType: ''
          }
        })
      ]

      for (const command of invalidExternalDataCommands) {
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors!.length).toBeGreaterThan(0)
      }
    })

    it('should accept valid confidence boundary values', async () => {
      const validConfidenceCommands = [
        createValidCommand({ confidence: 0 }),
        createValidCommand({ confidence: 100 })
      ]

      for (const command of validConfidenceCommands) {
        mockRepository.clear()
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(true)
        expect(result.activity!.confidence).toBe(command.confidence)
      }
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicate activities within 5 minutes', async () => {
      const now = new Date()
      const existingActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'Test Security Breach',
        location: 'Building A - Main Entrance',
        priority: 'high',
        created_by: 'test-user'
      })
      existingActivity.timestamp = new Date(now.getTime() - 3 * 60 * 1000) // 3 minutes ago
      
      mockRepository.addExistingActivity(existingActivity)
      
      const command = createValidCommand({
        title: 'Test Security Breach',
        location: 'Building A - Main Entrance'
      })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Duplicate activity detected within 5 minutes')
    })

    it('should allow similar activities after 5 minutes', async () => {
      const now = new Date()
      const existingActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'Test Security Breach',
        location: 'Building A - Main Entrance',
        priority: 'high',
        created_by: 'test-user'
      })
      existingActivity.timestamp = new Date(now.getTime() - 6 * 60 * 1000) // 6 minutes ago
      
      mockRepository.addExistingActivity(existingActivity)
      
      const command = createValidCommand({
        title: 'Test Security Breach',
        location: 'Building A - Main Entrance'
      })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity).toBeDefined()
    })

    it('should allow activities with different titles or locations', async () => {
      const existingActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'Different Title',
        location: 'Building A - Main Entrance',
        priority: 'high',
        created_by: 'test-user'
      })
      mockRepository.addExistingActivity(existingActivity)
      
      const commands = [
        createValidCommand({ title: 'Test Security Breach', location: 'Building A - Main Entrance' }),
        createValidCommand({ title: 'Different Title', location: 'Building B - Side Door' })
      ]
      
      for (const command of commands) {
        const result = await useCase.execute(command)
        expect(result.success).toBe(true)
      }
    })

    it('should handle case-insensitive duplicate detection', async () => {
      const existingActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'test security breach',
        location: 'building a - main entrance',
        priority: 'high',
        created_by: 'test-user'
      })
      mockRepository.addExistingActivity(existingActivity)
      
      const command = createValidCommand({
        title: 'TEST SECURITY BREACH',
        location: 'BUILDING A - MAIN ENTRANCE'
      })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Duplicate activity detected within 5 minutes')
    })
  })

  describe('Error Handling', () => {
    it('should handle repository creation failures', async () => {
      mockRepository.setShouldFailCreate(true)
      const command = createValidCommand()
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Repository create failed')
    })

    it('should handle repository duplicate check failures', async () => {
      mockRepository.setShouldFailDuplicateCheck(true)
      const command = createValidCommand()
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Repository find failed')
    })

    it('should handle invalid activity creation', async () => {
      // Mock ActivityFactory to create invalid activity
      const originalCreate = ActivityFactory.createManual
      vi.spyOn(ActivityFactory, 'createManual').mockReturnValue({
        isValid: () => false
      } as any)
      
      const command = createValidCommand()
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Created activity is invalid')
      
      ActivityFactory.createManual = originalCreate
    })

    it('should handle unexpected errors gracefully', async () => {
      // Force an unexpected error
      vi.spyOn(mockRepository, 'findMany').mockRejectedValue(new Error('Unexpected database error'))
      
      const command = createValidCommand()
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected database error')
    })

    it('should handle non-Error exceptions', async () => {
      vi.spyOn(mockRepository, 'create').mockRejectedValue('String error')
      
      const command = createValidCommand()
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error occurred')
    })
  })

  describe('Performance Tests', () => {
    it('should complete creation within reasonable time', async () => {
      const command = createValidCommand()
      const startTime = Date.now()
      
      const result = await useCase.execute(command)
      const executionTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle slow duplicate checks', async () => {
      mockRepository.setDuplicateCheckDelay(100) // 100ms delay
      const command = createValidCommand()
      const startTime = Date.now()
      
      const result = await useCase.execute(command)
      const executionTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(executionTime).toBeGreaterThan(90) // Should include the delay
      expect(executionTime).toBeLessThan(500) // But still reasonable
    })

    it('should handle bulk validation efficiently', async () => {
      const commands = Array.from({ length: 100 }, (_, i) => 
        createValidCommand({ title: `Test Activity ${i}` })
      )
      
      const startTime = Date.now()
      const results = await Promise.all(
        commands.map(command => useCase.execute(command))
      )
      const executionTime = Date.now() - startTime
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true)
      // Should complete within reasonable time for 100 activities
      expect(executionTime).toBeLessThan(5000) // 5 seconds
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string fields correctly', async () => {
      const command = createValidCommand({
        description: '',
        building: '',
        zone: ''
      })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity!.description).toBe('')
      expect(result.activity!.building).toBe('')
      expect(result.activity!.zone).toBe('')
    })

    it('should handle whitespace-only fields', async () => {
      const command = {
        ...createValidCommand(),
        title: '   ',
        location: '\t\n  ',
        createdBy: '   '
      }
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.validationErrors).toContain('Title is required')
      expect(result.validationErrors).toContain('Location is required')
      expect(result.validationErrors).toContain('Created by user ID is required')
    })

    it('should handle special characters in fields', async () => {
      const command = createValidCommand({
        title: 'Test with special chars: @#$%^&*()[]{}|\\;:"<>?,./`~',
        description: 'Description with emoji 🚨 and unicode ñáéíóú',
        location: 'Building-1_Floor.2/Room#3',
        building: 'Building-α',
        zone: 'Zone_β'
      })
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.activity!.title).toBe(command.title)
      expect(result.activity!.description).toBe(command.description)
    })

    it('should handle very small and large confidence values', async () => {
      const commands = [
        createValidCommand({ confidence: 0.1 }),
        createValidCommand({ confidence: 99.9 })
      ]
      
      for (const command of commands) {
        mockRepository.clear()
        const result = await useCase.execute(command)
        
        expect(result.success).toBe(true)
        expect(result.activity!.confidence).toBe(command.confidence)
      }
    })

    it('should handle activities created at exact same timestamp', async () => {
      const now = new Date()
      const existingActivity = ActivityFactory.createManual({
        type: 'security-breach',
        title: 'First Activity',
        location: 'Same Location',
        priority: 'high',
        created_by: 'test-user'
      })
      existingActivity.timestamp = now
      
      mockRepository.addExistingActivity(existingActivity)
      
      const command = createValidCommand({
        title: 'Second Activity',
        location: 'Same Location'
      })
      
      // Mock Date.now to return the same timestamp
      const originalNow = Date.now
      Date.now = vi.fn(() => now.getTime())
      
      const result = await useCase.execute(command)
      
      expect(result.success).toBe(true) // Different titles, so not duplicate
      
      Date.now = originalNow
    })
  })
})

describe('ActivityCreationHelper', () => {
  let useCase: CreateActivityUseCase
  let helper: ActivityCreationHelper
  let mockRepository: MockActivityRepository

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    useCase = new CreateActivityUseCase(mockRepository as any)
    helper = new ActivityCreationHelper(useCase)
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('createFromWebhook', () => {
    it('should create activity from webhook data', async () => {
      const webhookData = {
        sourceSystem: 'access-control-system',
        eventType: 'access_violation',
        payload: {
          badgeId: 'badge-123',
          doorId: 'door-456',
          severity: 'high',
          timestamp: new Date().toISOString()
        },
        location: 'Building A - Secure Door',
        building: 'Building A',
        zone: 'Secure Area'
      }
      
      const result = await helper.createFromWebhook(webhookData, 'webhook-processor')
      
      expect(result.success).toBe(true)
      expect(result.activity!.type).toBe('security-breach')
      expect(result.activity!.priority).toBe('high')
      expect(result.activity!.source).toBe('integration')
      expect(result.activity!.externalData).toBeDefined()
      expect(result.activity!.externalData!.sourceSystem).toBe('access-control-system')
    })

    it('should map different event types correctly', async () => {
      const eventTypeMappings = [
        { eventType: 'medical_emergency', expectedType: 'medical' },
        { eventType: 'fire_alarm', expectedType: 'alert' },
        { eventType: 'equipment_malfunction', expectedType: 'property-damage' },
        { eventType: 'patrol_checkpoint', expectedType: 'patrol' as ActivityType },
        { eventType: 'unknown_event', expectedType: 'alert' }
      ]
      
      for (const mapping of eventTypeMappings) {
        mockRepository.clear()
        const webhookData = {
          sourceSystem: 'test-system',
          eventType: mapping.eventType,
          payload: { severity: 'medium' },
          location: 'Test Location'
        }
        
        const result = await helper.createFromWebhook(webhookData)
        
        expect(result.success).toBe(true)
        expect(result.activity!.type).toBe(mapping.expectedType)
      }
    })

    it('should determine priority from payload', async () => {
      const priorityTests = [
        { payload: { severity: 'critical', emergency: true }, expectedPriority: 'critical' },
        { payload: { severity: 'high', confidence: 90 }, expectedPriority: 'high' },
        { payload: { confidence: 65 }, expectedPriority: 'medium' },
        { payload: { confidence: 30 }, expectedPriority: 'low' }
      ]
      
      for (const test of priorityTests) {
        mockRepository.clear()
        const webhookData = {
          sourceSystem: 'test-system',
          eventType: 'test_event',
          payload: test.payload,
          location: 'Test Location'
        }
        
        const result = await helper.createFromWebhook(webhookData)
        
        expect(result.success).toBe(true)
        expect(result.activity!.priority).toBe(test.expectedPriority)
      }
    })
  })

  describe('createManualActivity', () => {
    it('should create manual activity with provided data', async () => {
      const data = {
        type: 'maintenance' as ActivityType,
        title: 'HVAC System Check',
        location: 'Building B - Mechanical Room',
        priority: 'medium' as Priority,
        description: 'Routine maintenance check',
        building: 'Building B',
        zone: 'Mechanical Room',
        assignedTo: 'maintenance-tech-001'
      }
      
      const result = await helper.createManualActivity(data, 'supervisor-123')
      
      expect(result.success).toBe(true)
      expect(result.activity!.type).toBe(data.type)
      expect(result.activity!.title).toBe(data.title)
      expect(result.activity!.assignedTo).toBe(data.assignedTo)
      expect(result.activity!.source).toBe('manual')
    })
  })

  describe('createFromSecurityAlert', () => {
    it('should create activity from security alert data', async () => {
      const alertData = {
        cameraId: 'cam-floor2-001',
        location: 'Building C - Floor 2 Corridor',
        building: 'Building C',
        zone: 'Floor 2 Corridor',
        alertType: 'tailgating',
        confidence: 95,
        detectedObjects: ['person', 'badge'],
        badgeHolder: {
          name: 'Jane Smith',
          id: 'badge-789',
          department: 'Engineering'
        }
      }
      
      const result = await helper.createFromSecurityAlert(alertData)
      
      expect(result.success).toBe(true)
      expect(result.activity!.type).toBe('security-breach')
      expect(result.activity!.priority).toBe('critical') // confidence > 90
      expect(result.activity!.title).toBe('Security Alert: tailgating')
      expect(result.activity!.confidence).toBe(95)
      expect(result.activity!.detectedObjects).toEqual(['person', 'badge'])
      expect(result.activity!.badgeHolder).toEqual(alertData.badgeHolder)
    })

    it('should map alert types to activity types correctly', async () => {
      const alertTypeMappings = [
        { alertType: 'weapon_detection', expectedType: 'security-breach' },
        { alertType: 'fall_detection', expectedType: 'medical' },
        { alertType: 'equipment_damage', expectedType: 'property-damage' },
        { alertType: 'loitering', expectedType: 'alert' },
        { alertType: 'unknown_alert', expectedType: 'alert' }
      ]
      
      for (const mapping of alertTypeMappings) {
        mockRepository.clear()
        const alertData = {
          cameraId: 'test-cam',
          location: 'Test Location',
          building: 'Test Building',
          zone: 'Test Zone',
          alertType: mapping.alertType,
          confidence: 75,
          detectedObjects: []
        }
        
        const result = await helper.createFromSecurityAlert(alertData)
        
        expect(result.success).toBe(true)
        expect(result.activity!.type).toBe(mapping.expectedType)
      }
    })

    it('should determine priority based on confidence levels', async () => {
      const confidenceTests = [
        { confidence: 95, expectedPriority: 'critical' },
        { confidence: 85, expectedPriority: 'high' },
        { confidence: 75, expectedPriority: 'high' },
        { confidence: 65, expectedPriority: 'medium' }
      ]
      
      for (const test of confidenceTests) {
        mockRepository.clear()
        const alertData = {
          cameraId: 'test-cam',
          location: 'Test Location',
          building: 'Test Building',
          zone: 'Test Zone',
          alertType: 'test_alert',
          confidence: test.confidence,
          detectedObjects: []
        }
        
        const result = await helper.createFromSecurityAlert(alertData)
        
        expect(result.success).toBe(true)
        expect(result.activity!.priority).toBe(test.expectedPriority)
      }
    })
  })
})
