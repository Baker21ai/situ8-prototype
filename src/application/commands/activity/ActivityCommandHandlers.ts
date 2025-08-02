/**
 * Activity Command Handlers
 * Implementation of all activity-related command processing
 */

import { ICommandHandler, CommandResult, ValidationResult } from '../base/ICommand';
import {
  CreateActivityCommand, CreateActivityResult,
  UpdateActivityCommand, UpdateActivityResult,
  AssignActivityCommand, AssignActivityResult,
  ArchiveActivityCommand, ArchiveActivityResult,
  BulkUpdateStatusCommand, BulkUpdateStatusResult,
  AddUserTagCommand, AddUserTagResult,
  RemoveUserTagCommand, RemoveUserTagResult,
  EscalateActivityCommand, EscalateActivityResult,
  LinkToIncidentCommand, LinkToIncidentResult,
  BatchCreateActivitiesCommand, BatchCreateActivitiesResult,
  MergeActivitiesCommand, MergeActivitiesResult
} from './ActivityCommands';
import { Activity } from '../../../domains/activities/entities/Activity';
import { CreateActivityUseCase } from '../../../domains/activities/use-cases/CreateActivity';
import { IActivityRepository } from '../../../domains/activities/repositories/IActivityRepository';
import { eventBus, createActivityEvent } from '../../../infrastructure/storage/EventBus';
import { ActivityType } from '../../../lib/utils/security';
import { Priority, Status } from '../../../lib/utils/status';

// ===== CREATE ACTIVITY HANDLER =====

export class CreateActivityCommandHandler extends ICommandHandler<CreateActivityCommand, CreateActivityResult> {
  constructor(
    private createActivityUseCase: CreateActivityUseCase,
    private activityRepository: IActivityRepository
  ) {
    super();
  }

  protected validate(command: CreateActivityCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.data.title?.trim()) {
      errors.push('Activity title is required');
    }

    if (!command.data.location?.trim()) {
      errors.push('Activity location is required');
    }

    if (!command.data.activityType) {
      errors.push('Activity type is required');
    }

    if (!command.data.priority) {
      errors.push('Activity priority is required');
    }

    if (command.data.confidence !== undefined && (command.data.confidence < 0 || command.data.confidence > 100)) {
      errors.push('Confidence must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: CreateActivityCommand): Promise<CommandResult<CreateActivityResult>> {
    // Validate command
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const result = await this.createActivityUseCase.execute({
        type: command.data.activityType,
        title: command.data.title,
        location: command.data.location,
        priority: command.data.priority,
        description: command.data.description,
        building: command.data.building,
        zone: command.data.zone,
        assignedTo: command.data.assignedTo,
        confidence: command.data.confidence,
        externalData: command.data.externalData,
        createdBy: command.userId
      });

      if (!result.success || !result.activity) {
        return {
          success: false,
          error: result.error || result.validationErrors?.join(', ') || 'Failed to create activity'
        };
      }

      // Generate auto-tags
      const autoTags = this.generateAutoTags(result.activity);

      // Check for incident triggers
      const incidentTrigger = await this.checkIncidentTriggers(result.activity);

      // Publish domain event
      eventBus.publish(createActivityEvent.created({
        activityId: result.activity.id,
        activityType: result.activity.type,
        priority: result.activity.priority,
        status: result.activity.status,
        location: result.activity.location,
        building: result.activity.building,
        zone: result.activity.zone,
        confidence: result.activity.confidence
      }, command.userId));

      return {
        success: true,
        data: {
          activityId: result.activity.id,
          autoTagsApplied: autoTags,
          incidentTriggered: incidentTrigger
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateAutoTags(activity: Activity): string[] {
    const tags: string[] = [];

    // Time-based tags
    const hour = activity.timestamp.getHours();
    if (hour >= 6 && hour < 18) {
      tags.push('business-hours');
    } else {
      tags.push('after-hours');
    }

    // Priority-based tags
    if (activity.priority === 'critical' || activity.priority === 'high') {
      tags.push('high-priority');
    }

    // Type-based tags
    if (['medical', 'security-breach'].includes(activity.type)) {
      tags.push('emergency-response');
    }

    // Location-based tags
    if (activity.building) {
      tags.push(`building:${activity.building.toLowerCase()}`);
    }
    if (activity.zone) {
      tags.push(`zone:${activity.zone.toLowerCase()}`);
    }

    return tags;
  }

  private async checkIncidentTriggers(activity: Activity): Promise<{ incidentId: string; rule: string } | undefined> {
    // This would integrate with incident auto-creation rules
    // For now, return undefined
    return undefined;
  }
}

// ===== UPDATE ACTIVITY HANDLER =====

export class UpdateActivityCommandHandler extends ICommandHandler<UpdateActivityCommand, UpdateActivityResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected validate(command: UpdateActivityCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.aggregateId) {
      errors.push('Activity ID is required');
    }

    if (!command.data.updates || Object.keys(command.data.updates).length === 0) {
      errors.push('At least one field to update is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: UpdateActivityCommand): Promise<CommandResult<UpdateActivityResult>> {
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const activity = await this.activityRepository.findById(command.aggregateId);
      if (!activity) {
        return {
          success: false,
          error: 'Activity not found'
        };
      }

      const updatedFields: string[] = [];
      const triggeredWorkflows: string[] = [];

      // Apply updates
      if (command.data.updates.status && command.data.updates.status !== activity.status) {
        activity.updateStatus(command.data.updates.status, command.userId);
        updatedFields.push('status');
        
        // Check for workflow triggers
        if (command.data.updates.status === 'resolved') {
          triggeredWorkflows.push('resolution-workflow');
        }
      }

      if (command.data.updates.assignedTo && command.data.updates.assignedTo !== activity.assignedTo) {
        activity.assignTo(command.data.updates.assignedTo, command.userId);
        updatedFields.push('assignedTo');
        triggeredWorkflows.push('assignment-notification');
      }

      if (command.data.updates.priority && command.data.updates.priority !== activity.priority) {
        activity.updatePriority(command.data.updates.priority);
        updatedFields.push('priority');
        
        if (command.data.updates.priority === 'critical') {
          triggeredWorkflows.push('critical-priority-alert');
        }
      }

      if (command.data.updates.description) {
        activity.updateDescription(command.data.updates.description);
        updatedFields.push('description');
      }

      if (command.data.updates.userTags) {
        // Clear existing user tags and add new ones
        command.data.updates.userTags.forEach(tag => activity.addUserTag(tag));
        updatedFields.push('userTags');
      }

      // Persist changes
      await this.activityRepository.update(activity);

      // Publish domain events
      if (updatedFields.includes('status')) {
        eventBus.publish(createActivityEvent.statusUpdated({
          activityId: command.aggregateId,
          previousStatus: activity.status, // Would need to track previous value
          newStatus: command.data.updates.status!,
          updatedBy: command.userId,
          reason: command.data.reason
        }, command.userId));
      }

      if (updatedFields.includes('assignedTo')) {
        eventBus.publish(createActivityEvent.assigned({
          activityId: command.aggregateId,
          previousAssignee: activity.assignedTo,
          newAssignee: command.data.updates.assignedTo!,
          assignedBy: command.userId
        }, command.userId));
      }

      return {
        success: true,
        data: {
          updatedFields,
          triggeredWorkflows
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ===== ASSIGN ACTIVITY HANDLER =====

export class AssignActivityCommandHandler extends ICommandHandler<AssignActivityCommand, AssignActivityResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected validate(command: AssignActivityCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.aggregateId) {
      errors.push('Activity ID is required');
    }

    if (!command.data.assignedTo) {
      errors.push('Assignee is required');
    }

    if (!command.data.assignedBy) {
      errors.push('Assigner is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: AssignActivityCommand): Promise<CommandResult<AssignActivityResult>> {
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const activity = await this.activityRepository.findById(command.aggregateId);
      if (!activity) {
        return {
          success: false,
          error: 'Activity not found'
        };
      }

      const previousAssignee = activity.assignedTo;
      
      // Assign the activity
      activity.assignTo(command.data.assignedTo, command.data.assignedBy);
      
      // Update status to assigned if it's not already in progress
      if (activity.status === 'pending' || activity.status === 'open') {
        activity.updateStatus('assigned', command.data.assignedBy);
      }

      // Persist changes
      await this.activityRepository.update(activity);

      // Send notification if requested
      let notificationSent = false;
      if (command.data.notifyAssignee) {
        // Would integrate with notification service
        notificationSent = true;
      }

      // Publish domain event
      eventBus.publish(createActivityEvent.assigned({
        activityId: command.aggregateId,
        previousAssignee,
        newAssignee: command.data.assignedTo,
        assignedBy: command.data.assignedBy
      }, command.userId));

      return {
        success: true,
        data: {
          previousAssignee,
          notificationSent
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ===== ARCHIVE ACTIVITY HANDLER =====

export class ArchiveActivityCommandHandler extends ICommandHandler<ArchiveActivityCommand, ArchiveActivityResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected validate(command: ArchiveActivityCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.aggregateId) {
      errors.push('Activity ID is required');
    }

    if (!command.data.reason?.trim()) {
      errors.push('Archive reason is required');
    }

    if (!command.data.archivedBy) {
      errors.push('Archived by user is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: ArchiveActivityCommand): Promise<CommandResult<ArchiveActivityResult>> {
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const activity = await this.activityRepository.findById(command.aggregateId);
      if (!activity) {
        return {
          success: false,
          error: 'Activity not found'
        };
      }

      const archivedAt = new Date();
      const retentionDate = new Date(archivedAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      // Archive the activity
      activity.archive(command.data.reason, command.data.archivedBy);

      // Persist changes
      await this.activityRepository.update(activity);

      // Publish domain event
      eventBus.publish(createActivityEvent.archived({
        activityId: command.aggregateId,
        reason: command.data.reason,
        archivedBy: command.data.archivedBy
      }, command.userId));

      return {
        success: true,
        data: {
          archivedAt,
          retentionDate
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ===== BULK UPDATE STATUS HANDLER =====

export class BulkUpdateStatusCommandHandler extends ICommandHandler<BulkUpdateStatusCommand, BulkUpdateStatusResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected validate(command: BulkUpdateStatusCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.data.activityIds || command.data.activityIds.length === 0) {
      errors.push('At least one activity ID is required');
    }

    if (!command.data.status) {
      errors.push('Status is required');
    }

    if (command.data.activityIds && command.data.activityIds.length > 100) {
      errors.push('Cannot update more than 100 activities at once');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: BulkUpdateStatusCommand): Promise<CommandResult<BulkUpdateStatusResult>> {
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const activities = await this.activityRepository.findByIds(command.data.activityIds);
      const failedIds: string[] = [];
      let successCount = 0;
      let notificationsSent = 0;

      for (const activity of activities) {
        try {
          activity.updateStatus(command.data.status, command.userId);
          await this.activityRepository.update(activity);
          successCount++;

          // Send notification if assigned and requested
          if (command.data.notifyAssigned && activity.assignedTo) {
            // Would integrate with notification service
            notificationsSent++;
          }

          // Publish domain event
          eventBus.publish(createActivityEvent.statusUpdated({
            activityId: activity.id,
            previousStatus: activity.status, // Would need to track previous value
            newStatus: command.data.status,
            updatedBy: command.userId,
            reason: command.data.reason
          }, command.userId));

        } catch (error) {
          failedIds.push(activity.id);
        }
      }

      // Add IDs that weren't found
      const foundIds = activities.map(a => a.id);
      const notFoundIds = command.data.activityIds.filter(id => !foundIds.includes(id));
      failedIds.push(...notFoundIds);

      return {
        success: failedIds.length === 0,
        data: {
          successCount,
          failedIds,
          notificationsSent
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ===== BATCH CREATE ACTIVITIES HANDLER =====

export class BatchCreateActivitiesCommandHandler extends ICommandHandler<BatchCreateActivitiesCommand, BatchCreateActivitiesResult> {
  constructor(private createActivityUseCase: CreateActivityUseCase) {
    super();
  }

  protected validate(command: BatchCreateActivitiesCommand): ValidationResult {
    const errors: string[] = [];

    if (!command.data.activities || command.data.activities.length === 0) {
      errors.push('At least one activity is required');
    }

    if (command.data.activities && command.data.activities.length > 50) {
      errors.push('Cannot create more than 50 activities at once');
    }

    if (!command.data.batchId) {
      errors.push('Batch ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async handle(command: BatchCreateActivitiesCommand): Promise<CommandResult<BatchCreateActivitiesResult>> {
    const validation = this.validate(command);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }

    try {
      const createdActivityIds: string[] = [];
      const failures: Array<{ index: number; error: string }> = [];
      const incidentsTriggered: Array<{ activityId: string; incidentId: string; rule: string }> = [];

      for (let i = 0; i < command.data.activities.length; i++) {
        const activityData = command.data.activities[i];
        
        try {
          const result = await this.createActivityUseCase.execute({
            ...activityData,
            createdBy: command.userId
          });

          if (result.success && result.activity) {
            createdActivityIds.push(result.activity.id);
          } else {
            failures.push({
              index: i,
              error: result.error || result.validationErrors?.join(', ') || 'Unknown error'
            });
          }
        } catch (error) {
          failures.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: failures.length === 0,
        data: {
          batchId: command.data.batchId,
          successCount: createdActivityIds.length,
          failedCount: failures.length,
          createdActivityIds,
          failures,
          incidentsTriggered
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export all handlers for registration
export const activityCommandHandlers = {
  CreateActivityCommandHandler,
  UpdateActivityCommandHandler,
  AssignActivityCommandHandler,
  ArchiveActivityCommandHandler,
  BulkUpdateStatusCommandHandler,
  BatchCreateActivitiesCommandHandler,
};