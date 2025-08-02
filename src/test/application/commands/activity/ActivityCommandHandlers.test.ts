/**
 * Unit Tests for Activity Command Handlers
 * Tests CQRS command handling, validation, business logic, and event publishing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CreateActivityCommandHandler,
  UpdateActivityCommandHandler,
  AssignActivityCommandHandler,
  ArchiveActivityCommandHandler,
  BulkUpdateStatusCommandHandler,
  BatchCreateActivitiesCommandHandler
} from '../../../../application/commands/activity/ActivityCommandHandlers'
import {
  CreateActivityCommand,
  UpdateActivityCommand,
  AssignActivityCommand,
  ArchiveActivityCommand,
  BulkUpdateStatusCommand,
  BatchCreateActivitiesCommand
} from '../../../../application/commands/activity/ActivityCommands'
import { CreateActivityUseCase } from '../../../../domains/activities/use-cases/CreateActivity'
import { Activity, ActivityFactory } from '../../../../domains/activities/entities/Activity'
import { IActivityRepository } from '../../../../domains/activities/repositories/IActivityRepository'
import { eventBus } from '../../../../infrastructure/storage/EventBus'
import { Priority, Status } from '../../../../../lib/utils/status'
import { ActivityType } from '../../../../../lib/utils/security'

// Mock dependencies
class MockActivityRepository implements Partial<IActivityRepository> {
  private activities = new Map<string, Activity>()
  private shouldFailOperation = false

  async create(activity: Activity): Promise<Activity> {
    if (this.shouldFailOperation) {
      throw new Error('Repository create failed')
    }
    
    const created = { ...activity, id: `activity-${Date.now()}` } as Activity
    this.activities.set(created.id, created)
    return created
  }

  async findById(id: string): Promise<Activity | null> {
    if (this.shouldFailOperation) {
      throw new Error('Repository findById failed')
    }
    
    return this.activities.get(id) || null
  }

  async findByIds(ids: string[]): Promise<Activity[]> {
    if (this.shouldFailOperation) {
      throw new Error('Repository findByIds failed')
    }
    
    return ids.map(id => this.activities.get(id)).filter(Boolean) as Activity[]
  }

  async update(activity: Activity): Promise<Activity> {
    if (this.shouldFailOperation) {
      throw new Error('Repository update failed')
    }
    
    this.activities.set(activity.id, { ...activity, updated_at: new Date() })
    return this.activities.get(activity.id)!
  }

  // Test helper methods
  addActivity(activity: Activity) {
    this.activities.set(activity.id, activity)
  }

  setShouldFailOperation(fail: boolean) {
    this.shouldFailOperation = fail
  }

  getActivity(id: string): Activity | undefined {
    return this.activities.get(id)
  }

  clear() {
    this.activities.clear()
  }

  getAllActivities(): Activity[] {
    return Array.from(this.activities.values())
  }
}

class MockCreateActivityUseCase {
  private shouldFail = false
  private shouldReturnInvalid = false

  async execute(command: any) {
    if (this.shouldFail) {
      return {
        success: false,
        error: 'Use case execution failed',
        validationErrors: ['Validation error']
      }
    }

    if (this.shouldReturnInvalid) {
      return {
        success: false,
        error: 'Created activity is invalid'
      }
    }

    const activity = ActivityFactory.createManual({
      type: command.type,
      title: command.title,
      location: command.location,
      priority: command.priority,
      created_by: command.createdBy
    })

    return {
      success: true,
      activity: { ...activity, id: `activity-${Date.now()}` }
    }
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  setShouldReturnInvalid(invalid: boolean) {
    this.shouldReturnInvalid = invalid
  }
}

// Mock event bus
const mockEventBus = {
  publish: vi.fn()
}

// Test data factories
const createTestActivity = (overrides: Partial<Activity> = {}): Activity => {
  const activity = ActivityFactory.createManual({
    type: 'security-breach',
    title: 'Test Activity',
    location: 'Building A - Main Entrance',
    priority: 'medium',
    created_by: 'test-user'
  })
  
  return {
    ...activity,
    id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    building: 'Building A',
    zone: 'Main Entrance',
    assignedTo: undefined,
    status: 'open',
    ...overrides
  } as Activity
}

const createCreateActivityCommand = (overrides: Partial<CreateActivityCommand> = {}): CreateActivityCommand => ({
  type: 'CreateActivityCommand',
  userId: 'test-user',
  aggregateId: 'test-aggregate',
  timestamp: new Date(),
  correlationId: 'test-correlation',
  metadata: {},
  data: {
    activityType: 'security-breach',
    title: 'Test Security Breach',
    location: 'Building A - Main Entrance',
    priority: 'high',
    description: 'Test description',
    building: 'Building A',
    zone: 'Main Entrance',
    confidence: 85,
    ...overrides.data
  },
  ...overrides
})

const createUpdateActivityCommand = (activityId: string, overrides: Partial<UpdateActivityCommand> = {}): UpdateActivityCommand => ({
  type: 'UpdateActivityCommand',
  userId: 'test-user',
  aggregateId: activityId,
  timestamp: new Date(),
  correlationId: 'test-correlation',
  metadata: {},
  data: {
    updates: {
      status: 'resolved',
      description: 'Updated description'
    },
    reason: 'Test update',
    ...overrides.data
  },
  ...overrides
})

describe('Activity Command Handlers', () => {
  let mockRepository: MockActivityRepository
  let mockUseCase: MockCreateActivityUseCase

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    mockUseCase = new MockCreateActivityUseCase()
    vi.clearAllMocks()
    
    // Mock event bus
    vi.mocked(eventBus.publish).mockClear()
    Object.assign(eventBus, mockEventBus)
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('CreateActivityCommandHandler', () => {
    let handler: CreateActivityCommandHandler

    beforeEach(() => {
      handler = new CreateActivityCommandHandler(mockUseCase as any, mockRepository as any)
    })

    describe('Successful Creation', () => {
      it('should create activity successfully', async () => {
        const command = createCreateActivityCommand()
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data!.activityId).toBeDefined()
        expect(result.data!.autoTagsApplied).toBeDefined()
        expect(result.error).toBeUndefined()
      })

      it('should generate appropriate auto-tags', async () => {
        const command = createCreateActivityCommand({
          data: {
            activityType: 'medical',
            title: 'Medical Emergency',
            location: 'Hospital Wing',
            priority: 'critical',
            building: 'Main Building',
            zone: 'Emergency Room'
          }
        })
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.autoTagsApplied).toContain('high-priority')
        expect(result.data!.autoTagsApplied).toContain('emergency-response')
        expect(result.data!.autoTagsApplied).toContain('building:main building')
        expect(result.data!.autoTagsApplied).toContain('zone:emergency room')
      })

      it('should apply business hours tags correctly', async () => {
        // Mock date to be during business hours (10 AM)
        const businessHourDate = new Date()
        businessHourDate.setHours(10, 0, 0, 0)
        
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(10)
        
        const command = createCreateActivityCommand()
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.autoTagsApplied).toContain('business-hours')
        
        vi.restoreAllMocks()
      })

      it('should apply after-hours tags correctly', async () => {
        // Mock date to be after hours (11 PM)
        vi.spyOn(Date.prototype, 'getHours').mockReturnValue(23)
        
        const command = createCreateActivityCommand()
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.autoTagsApplied).toContain('after-hours')
        
        vi.restoreAllMocks()
      })

      it('should publish activity created event', async () => {
        const command = createCreateActivityCommand()
        
        await handler.handle(command)
        
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityCreated',
            data: expect.objectContaining({
              activityType: 'security-breach',
              priority: 'high'
            })
          })
        )
      })
    })

    describe('Validation', () => {
      it('should validate required fields', async () => {
        const invalidCommands = [
          createCreateActivityCommand({ data: { title: '' } }),
          createCreateActivityCommand({ data: { location: '' } }),
          createCreateActivityCommand({ data: { activityType: undefined as any } }),
          createCreateActivityCommand({ data: { priority: undefined as any } })
        ]
        
        for (const command of invalidCommands) {
          const result = await handler.handle(command)
          
          expect(result.success).toBe(false)
          expect(result.error).toBe('Validation failed')
          expect(result.validationErrors).toBeDefined()
          expect(result.validationErrors!.length).toBeGreaterThan(0)
        }
      })

      it('should validate confidence range', async () => {
        const invalidConfidenceCommands = [
          createCreateActivityCommand({ data: { confidence: -1 } }),
          createCreateActivityCommand({ data: { confidence: 101 } })
        ]
        
        for (const command of invalidConfidenceCommands) {
          const result = await handler.handle(command)
          
          expect(result.success).toBe(false)
          expect(result.validationErrors).toContain('Confidence must be between 0 and 100')
        }
      })
    })

    describe('Error Handling', () => {
      it('should handle use case failures', async () => {
        mockUseCase.setShouldFail(true)
        const command = createCreateActivityCommand()
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Use case execution failed')
      })

      it('should handle invalid activity creation', async () => {
        mockUseCase.setShouldReturnInvalid(true)
        const command = createCreateActivityCommand()
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Created activity is invalid')
      })

      it('should handle unexpected exceptions', async () => {
        vi.spyOn(mockUseCase, 'execute').mockRejectedValue(new Error('Unexpected error'))
        
        const command = createCreateActivityCommand()
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Unexpected error')
      })
    })
  })

  describe('UpdateActivityCommandHandler', () => {
    let handler: UpdateActivityCommandHandler
    let testActivity: Activity

    beforeEach(() => {
      handler = new UpdateActivityCommandHandler(mockRepository as any)
      testActivity = createTestActivity()
      mockRepository.addActivity(testActivity)
    })

    describe('Successful Updates', () => {
      it('should update activity status', async () => {
        const command = createUpdateActivityCommand(testActivity.id, {
          data: {
            updates: { status: 'resolved' },
            reason: 'Issue resolved'
          }
        })
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.updatedFields).toContain('status')
        expect(result.data!.triggeredWorkflows).toContain('resolution-workflow')
      })

      it('should update activity assignment', async () => {
        const command = createUpdateActivityCommand(testActivity.id, {
          data: {
            updates: { assignedTo: 'officer-123' },
            reason: 'Assigned to officer'
          }
        })
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.updatedFields).toContain('assignedTo')
        expect(result.data!.triggeredWorkflows).toContain('assignment-notification')
      })

      it('should update activity priority', async () => {
        const command = createUpdateActivityCommand(testActivity.id, {
          data: {
            updates: { priority: 'critical' },
            reason: 'Escalated to critical'
          }
        })
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.updatedFields).toContain('priority')
        expect(result.data!.triggeredWorkflows).toContain('critical-priority-alert')
      })

      it('should update multiple fields', async () => {
        const command = createUpdateActivityCommand(testActivity.id, {
          data: {
            updates: {
              status: 'in-progress',
              assignedTo: 'officer-456',
              description: 'Updated description',
              userTags: ['urgent', 'security']
            },
            reason: 'Multiple updates'
          }
        })
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.updatedFields).toEqual(
          expect.arrayContaining(['status', 'assignedTo', 'description', 'userTags'])
        )
      })

      it('should publish appropriate events', async () => {
        const command = createUpdateActivityCommand(testActivity.id, {
          data: {
            updates: { status: 'resolved', assignedTo: 'officer-789' },
            reason: 'Resolved and assigned'
          }
        })
        
        await handler.handle(command)
        
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityStatusUpdated'
          })
        )
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityAssigned'
          })
        )
      })
    })

    describe('Validation', () => {
      it('should validate required fields', async () => {
        const invalidCommands = [
          createUpdateActivityCommand('', {}),
          createUpdateActivityCommand(testActivity.id, { data: { updates: {} } })
        ]
        
        for (const command of invalidCommands) {
          const result = await handler.handle(command)
          
          expect(result.success).toBe(false)
          expect(result.error).toBe('Validation failed')
          expect(result.validationErrors!.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Handling', () => {
      it('should handle activity not found', async () => {
        const command = createUpdateActivityCommand('non-existent-id')
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Activity not found')
      })

      it('should handle repository failures', async () => {
        mockRepository.setShouldFailOperation(true)
        const command = createUpdateActivityCommand(testActivity.id)
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Repository')
      })
    })
  })

  describe('AssignActivityCommandHandler', () => {
    let handler: AssignActivityCommandHandler
    let testActivity: Activity

    beforeEach(() => {
      handler = new AssignActivityCommandHandler(mockRepository as any)
      testActivity = createTestActivity({ status: 'open' })
      mockRepository.addActivity(testActivity)
    })

    describe('Successful Assignment', () => {
      it('should assign activity successfully', async () => {
        const command: AssignActivityCommand = {
          type: 'AssignActivityCommand',
          userId: 'supervisor-123',
          aggregateId: testActivity.id,
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            assignedTo: 'officer-456',
            assignedBy: 'supervisor-123',
            notifyAssignee: true
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.previousAssignee).toBeUndefined()
        expect(result.data!.notificationSent).toBe(true)
        
        const updatedActivity = mockRepository.getActivity(testActivity.id)
        expect(updatedActivity!.assignedTo).toBe('officer-456')
        expect(updatedActivity!.status).toBe('assigned')
      })

      it('should handle reassignment', async () => {
        testActivity.assignedTo = 'old-officer'
        mockRepository.addActivity(testActivity)
        
        const command: AssignActivityCommand = {
          type: 'AssignActivityCommand',
          userId: 'supervisor-123',
          aggregateId: testActivity.id,
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            assignedTo: 'new-officer',
            assignedBy: 'supervisor-123',
            notifyAssignee: false
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.previousAssignee).toBe('old-officer')
        expect(result.data!.notificationSent).toBe(false)
      })

      it('should publish assignment event', async () => {
        const command: AssignActivityCommand = {
          type: 'AssignActivityCommand',
          userId: 'supervisor-123',
          aggregateId: testActivity.id,
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            assignedTo: 'officer-456',
            assignedBy: 'supervisor-123'
          }
        }
        
        await handler.handle(command)
        
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityAssigned',
            data: expect.objectContaining({
              newAssignee: 'officer-456',
              assignedBy: 'supervisor-123'
            })
          })
        )
      })
    })

    describe('Validation', () => {
      it('should validate required fields', async () => {
        const invalidCommands = [
          {
            ...createCreateActivityCommand(),
            type: 'AssignActivityCommand' as const,
            aggregateId: '',
            data: { assignedTo: 'officer', assignedBy: 'supervisor' }
          },
          {
            ...createCreateActivityCommand(),
            type: 'AssignActivityCommand' as const,
            aggregateId: testActivity.id,
            data: { assignedTo: '', assignedBy: 'supervisor' }
          },
          {
            ...createCreateActivityCommand(),
            type: 'AssignActivityCommand' as const,
            aggregateId: testActivity.id,
            data: { assignedTo: 'officer', assignedBy: '' }
          }
        ]
        
        for (const command of invalidCommands) {
          const result = await handler.handle(command as any)
          
          expect(result.success).toBe(false)
          expect(result.error).toBe('Validation failed')
        }
      })
    })
  })

  describe('ArchiveActivityCommandHandler', () => {
    let handler: ArchiveActivityCommandHandler
    let testActivity: Activity

    beforeEach(() => {
      handler = new ArchiveActivityCommandHandler(mockRepository as any)
      testActivity = createTestActivity()
      mockRepository.addActivity(testActivity)
    })

    describe('Successful Archiving', () => {
      it('should archive activity successfully', async () => {
        const command: ArchiveActivityCommand = {
          type: 'ArchiveActivityCommand',
          userId: 'admin-123',
          aggregateId: testActivity.id,
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            reason: 'Resolved and no longer needed',
            archivedBy: 'admin-123'
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.archivedAt).toBeInstanceOf(Date)
        expect(result.data!.retentionDate).toBeInstanceOf(Date)
        
        // Retention date should be 30 days from archive date
        const expectedRetentionDate = new Date(result.data!.archivedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        expect(Math.abs(result.data!.retentionDate.getTime() - expectedRetentionDate.getTime())).toBeLessThan(1000)
      })

      it('should publish archive event', async () => {
        const command: ArchiveActivityCommand = {
          type: 'ArchiveActivityCommand',
          userId: 'admin-123',
          aggregateId: testActivity.id,
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            reason: 'Archived for testing',
            archivedBy: 'admin-123'
          }
        }
        
        await handler.handle(command)
        
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityArchived',
            data: expect.objectContaining({
              reason: 'Archived for testing',
              archivedBy: 'admin-123'
            })
          })
        )
      })
    })

    describe('Validation', () => {
      it('should validate required fields', async () => {
        const invalidCommands = [
          {
            ...createCreateActivityCommand(),
            type: 'ArchiveActivityCommand' as const,
            aggregateId: '',
            data: { reason: 'test', archivedBy: 'admin' }
          },
          {
            ...createCreateActivityCommand(),
            type: 'ArchiveActivityCommand' as const,
            aggregateId: testActivity.id,
            data: { reason: '', archivedBy: 'admin' }
          },
          {
            ...createCreateActivityCommand(),
            type: 'ArchiveActivityCommand' as const,
            aggregateId: testActivity.id,
            data: { reason: 'test', archivedBy: '' }
          }
        ]
        
        for (const command of invalidCommands) {
          const result = await handler.handle(command as any)
          
          expect(result.success).toBe(false)
          expect(result.error).toBe('Validation failed')
        }
      })
    })
  })

  describe('BulkUpdateStatusCommandHandler', () => {
    let handler: BulkUpdateStatusCommandHandler
    let testActivities: Activity[]

    beforeEach(() => {
      handler = new BulkUpdateStatusCommandHandler(mockRepository as any)
      testActivities = [
        createTestActivity({ id: 'activity-1' }),
        createTestActivity({ id: 'activity-2' }),
        createTestActivity({ id: 'activity-3' })
      ]
      testActivities.forEach(activity => mockRepository.addActivity(activity))
    })

    describe('Successful Bulk Updates', () => {
      it('should update multiple activities successfully', async () => {
        const command: BulkUpdateStatusCommand = {
          type: 'BulkUpdateStatusCommand',
          userId: 'supervisor-123',
          aggregateId: 'bulk-update-1',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            activityIds: ['activity-1', 'activity-2'],
            status: 'resolved',
            reason: 'Bulk resolution',
            notifyAssigned: false
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.successCount).toBe(2)
        expect(result.data!.failedIds).toHaveLength(0)
        expect(result.data!.notificationsSent).toBe(0)
      })

      it('should handle partial failures', async () => {
        const command: BulkUpdateStatusCommand = {
          type: 'BulkUpdateStatusCommand',
          userId: 'supervisor-123',
          aggregateId: 'bulk-update-2',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            activityIds: ['activity-1', 'non-existent', 'activity-2'],
            status: 'dismissed',
            reason: 'Bulk dismissal'
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false) // Some failures
        expect(result.data!.successCount).toBe(2)
        expect(result.data!.failedIds).toContain('non-existent')
      })

      it('should publish events for each update', async () => {
        const command: BulkUpdateStatusCommand = {
          type: 'BulkUpdateStatusCommand',
          userId: 'supervisor-123',
          aggregateId: 'bulk-update-3',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            activityIds: ['activity-1', 'activity-2'],
            status: 'resolved',
            reason: 'Bulk resolution'
          }
        }
        
        await handler.handle(command)
        
        expect(eventBus.publish).toHaveBeenCalledTimes(2)
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ActivityStatusUpdated'
          })
        )
      })
    })

    describe('Validation', () => {
      it('should validate activity count limits', async () => {
        const tooManyIds = Array.from({ length: 101 }, (_, i) => `activity-${i}`)
        
        const command: BulkUpdateStatusCommand = {
          type: 'BulkUpdateStatusCommand',
          userId: 'supervisor-123',
          aggregateId: 'bulk-update-4',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            activityIds: tooManyIds,
            status: 'resolved',
            reason: 'Too many activities'
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors).toContain('Cannot update more than 100 activities at once')
      })
    })
  })

  describe('BatchCreateActivitiesCommandHandler', () => {
    let handler: BatchCreateActivitiesCommandHandler

    beforeEach(() => {
      handler = new BatchCreateActivitiesCommandHandler(mockUseCase as any)
    })

    describe('Successful Batch Creation', () => {
      it('should create multiple activities successfully', async () => {
        const activities = [
          {
            type: 'medical' as ActivityType,
            title: 'Medical Emergency 1',
            location: 'Hospital Wing',
            priority: 'critical' as Priority
          },
          {
            type: 'security-breach' as ActivityType,
            title: 'Security Breach 1',
            location: 'Main Entrance',
            priority: 'high' as Priority
          }
        ]
        
        const command: BatchCreateActivitiesCommand = {
          type: 'BatchCreateActivitiesCommand',
          userId: 'system-batch',
          aggregateId: 'batch-1',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            batchId: 'batch-123',
            activities
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(true)
        expect(result.data!.batchId).toBe('batch-123')
        expect(result.data!.successCount).toBe(2)
        expect(result.data!.failedCount).toBe(0)
        expect(result.data!.createdActivityIds).toHaveLength(2)
        expect(result.data!.failures).toHaveLength(0)
      })

      it('should handle partial failures in batch', async () => {
        // Set up use case to fail for certain activities
        const originalExecute = mockUseCase.execute
        mockUseCase.execute = vi.fn().mockImplementation((command) => {
          if (command.title === 'Failing Activity') {
            return Promise.resolve({
              success: false,
              error: 'Intentional failure',
              validationErrors: ['Test validation error']
            })
          }
          return originalExecute.call(mockUseCase, command)
        })
        
        const activities = [
          {
            type: 'medical' as ActivityType,
            title: 'Medical Emergency',
            location: 'Hospital Wing',
            priority: 'critical' as Priority
          },
          {
            type: 'alert' as ActivityType,
            title: 'Failing Activity',
            location: 'Test Location',
            priority: 'medium' as Priority
          }
        ]
        
        const command: BatchCreateActivitiesCommand = {
          type: 'BatchCreateActivitiesCommand',
          userId: 'system-batch',
          aggregateId: 'batch-2',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            batchId: 'batch-456',
            activities
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false) // Partial failure
        expect(result.data!.successCount).toBe(1)
        expect(result.data!.failedCount).toBe(1)
        expect(result.data!.failures).toHaveLength(1)
        expect(result.data!.failures[0].index).toBe(1)
        expect(result.data!.failures[0].error).toContain('Intentional failure')
      })
    })

    describe('Validation', () => {
      it('should validate batch limits', async () => {
        const tooManyActivities = Array.from({ length: 51 }, (_, i) => ({
          type: 'alert' as ActivityType,
          title: `Activity ${i}`,
          location: 'Test Location',
          priority: 'low' as Priority
        }))
        
        const command: BatchCreateActivitiesCommand = {
          type: 'BatchCreateActivitiesCommand',
          userId: 'system-batch',
          aggregateId: 'batch-3',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            batchId: 'batch-789',
            activities: tooManyActivities
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors).toContain('Cannot create more than 50 activities at once')
      })

      it('should validate required batch ID', async () => {
        const command: BatchCreateActivitiesCommand = {
          type: 'BatchCreateActivitiesCommand',
          userId: 'system-batch',
          aggregateId: 'batch-4',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          metadata: {},
          data: {
            batchId: '',
            activities: [{
              type: 'alert' as ActivityType,
              title: 'Test Activity',
              location: 'Test Location',
              priority: 'low' as Priority
            }]
          }
        }
        
        const result = await handler.handle(command)
        
        expect(result.success).toBe(false)
        expect(result.validationErrors).toContain('Batch ID is required')
      })
    })
  })
})
