/**
 * Activity Service
 * Implements business logic for Activities including auto-tagging, status progression,
 * and human-in-the-loop incident creation. ALL activities that create incidents require
 * human validation and start in PENDING status for supervisor review.
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  BusinessRule,
  AutoCreationRule,
  AutoCreationCondition,
  StatusTransitionRule,
  TagGenerationRule,
  ServiceMethod,
  ServiceListMethod,
  ServiceBooleanMethod,
  QueryOptions
} from './types';
import { EnterpriseActivity } from '../lib/types/activity';
import { ActivityType } from '../lib/utils/security';
import { Priority, Status } from '../lib/utils/status';
import { useActivityStore } from '../stores/activityStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useAuditStore } from '../stores/auditStore';
import { ActivityTypeMapper, ACTIVITY_TYPE_REGISTRY } from '../lib/config/activity-types.config';

export class ActivityService extends BaseService<EnterpriseActivity, string> {
  private activityStore: ReturnType<typeof useActivityStore.getState>;
  private incidentStore: ReturnType<typeof useIncidentStore.getState>;
  private auditStore: ReturnType<typeof useAuditStore.getState>;

  // Business logic configuration - Human-in-the-loop validation for all incidents
  private readonly autoIncidentRules: AutoCreationRule[] = [
    {
      sourceEntityType: 'activity',
      targetEntityType: 'incident',
      condition: { type: 'always' },
      configuration: {
        skipPending: false,
        requiresValidation: true,
        dismissible: true,
        defaultPriority: 'medium',
        defaultStatus: 'pending'
      }
    }
  ];

  private readonly statusTransitionRules: StatusTransitionRule[] = [
    // Officers: Forward progression only
    { fromStatus: 'detecting', toStatus: 'assigned', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'assigned', toStatus: 'responding', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'responding', toStatus: 'resolved', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    
    // Supervisors/Admins: Any status change allowed
    { fromStatus: 'assigned', toStatus: 'detecting', requiredRole: ['supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'responding', toStatus: 'assigned', requiredRole: ['supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'resolved', toStatus: 'responding', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'resolved', toStatus: 'assigned', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'resolved', toStatus: 'detecting', requiredRole: ['supervisor', 'admin'], requiresApproval: true }
  ];

  private readonly tagGenerationRules: TagGenerationRule[] = [
    { type: 'system', source: 'created_by', template: 'trigger:{value}', conditions: [] },
    { type: 'system', source: 'metadata.site', template: 'location:{value}', conditions: [] },
    { type: 'system', source: 'timestamp', template: 'time:{businessHours}', conditions: [] },
    { type: 'system', source: 'confidence', template: 'confidence:{value}', conditions: [
      { field: 'confidence', operator: 'gt', value: 0 }
    ]}
  ];

  constructor() {
    super('ActivityService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true
    });

    // Get store instances (in real app, these would be injected)
    this.activityStore = useActivityStore.getState();
    this.incidentStore = useIncidentStore.getState();
    this.auditStore = useAuditStore.getState();
  }

  protected getEntityName(): string {
    return 'Activity';
  }

  protected validateEntity(activity: Partial<EnterpriseActivity>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    const requiredError = this.validateRequired(activity.type, 'type');
    if (requiredError) errors.push(requiredError);

    const titleError = this.validateRequired(activity.title, 'title');
    if (titleError) errors.push(titleError);

    const locationError = this.validateRequired(activity.location, 'location');
    if (locationError) errors.push(locationError);

    // Dynamic activity type validation using configuration
    if (activity.type) {
      const validTypes = ActivityTypeMapper.getAllValidTypes();
      const typeError = this.validateEnum(
        activity.type,
        'type',
        validTypes
      );
      if (typeError) errors.push(typeError);
    }

    if (activity.priority) {
      const priorityError = this.validateEnum(
        activity.priority,
        'priority',
        ['low', 'medium', 'high', 'critical']
      );
      if (priorityError) errors.push(priorityError);
    }

    if (activity.status) {
      const statusError = this.validateEnum(
        activity.status,
        'status',
        ['detecting', 'assigned', 'responding', 'resolved']
      );
      if (statusError) errors.push(statusError);
    }

    // Title length validation
    if (activity.title) {
      const titleLengthError = this.validateLength(activity.title, 'title', 3, 200);
      if (titleLengthError) errors.push(titleLengthError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(activity: Partial<EnterpriseActivity>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Auto-tagging rules
    if (operation === 'create' || operation === 'update') {
      results.push(this.enforceAutoTaggingRules(activity));
    }

    // Status progression rules
    if (operation === 'updateStatus') {
      results.push(...this.enforceStatusProgressionRules(activity));
    }

    // 30-day retention rule
    if (operation === 'create') {
      results.push(this.enforceRetentionRules(activity));
    }

    return results;
  }

  // Business rule implementations
  private enforceAutoTaggingRules(activity: Partial<EnterpriseActivity>): BusinessRuleResult {
    try {
      if (!activity.system_tags) {
        activity.system_tags = [];
      }

      // Generate system tags based on rules
      this.tagGenerationRules.forEach(rule => {
        if (rule.type === 'system') {
          const tag = this.generateTag(activity, rule);
          if (tag && !activity.system_tags!.includes(tag)) {
            activity.system_tags!.push(tag);
          }
        }
      });

      return {
        ruleName: 'auto_tagging',
        passed: true,
        message: `Generated ${activity.system_tags.length} system tags`
      };
    } catch (error) {
      return {
        ruleName: 'auto_tagging',
        passed: false,
        message: `Auto-tagging failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceStatusProgressionRules(activity: Partial<EnterpriseActivity>): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // This would typically get the current user's role from context
    // For now, we'll assume it's passed in the activity data
    const userRole = 'officer'; // This should come from AuditContext
    
    if (activity.status) {
      const allowedTransitions = this.statusTransitionRules.filter(rule => 
        rule.requiredRole.includes(userRole)
      );

      results.push({
        ruleName: 'status_progression',
        passed: allowedTransitions.some(rule => rule.toStatus === activity.status),
        message: `Status transition to ${activity.status} ${allowedTransitions.some(rule => rule.toStatus === activity.status) ? 'allowed' : 'denied'} for role ${userRole}`
      });
    }

    return results;
  }

  private enforceRetentionRules(activity: Partial<EnterpriseActivity>): BusinessRuleResult {
    try {
      const now = new Date();
      const retentionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      activity.retention_date = retentionDate;
      activity.is_archived = false;

      return {
        ruleName: 'retention_policy',
        passed: true,
        message: `Retention date set to ${retentionDate.toISOString()}`
      };
    } catch (error) {
      return {
        ruleName: 'retention_policy',
        passed: false,
        message: `Failed to set retention policy: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private generateTag(activity: Partial<EnterpriseActivity>, rule: TagGenerationRule): string | null {
    try {
      let value: any;
      
      switch (rule.source) {
        case 'created_by':
          value = activity.created_by === 'system' ? 'integration' : 'human';
          break;
        case 'metadata.site':
          value = activity.metadata?.site || 'unknown';
          break;
        case 'timestamp':
          if (activity.timestamp) {
            const hour = activity.timestamp.getHours();
            value = (hour >= 9 && hour <= 17) ? 'business-hours' : 'after-hours';
          }
          break;
        case 'confidence':
          value = activity.confidence || 0;
          break;
        default:
          return null;
      }

      return rule.template.replace('{value}', String(value)).replace('{businessHours}', value);
    } catch {
      return null;
    }
  }

  // Auto-incident creation logic based on business rules
  private async checkAutoIncidentCreation(
    activity: EnterpriseActivity,
    context: AuditContext
  ): Promise<boolean> {
    const rules = this.getAutoIncidentRules(activity.type);
    
    for (const rule of rules) {
      if (await this.shouldCreateIncident(activity, rule)) {
        await this.createIncidentFromActivity(activity, rule, context);
        return true;
      }
    }
    
    return false;
  }

  private getAutoIncidentRules(activityType: ActivityType): AutoCreationRule[] {
    // ALL activity types now create PENDING incidents requiring human validation
    const universalRule: AutoCreationRule = {
      sourceEntityType: 'activity',
      targetEntityType: 'incident',
      condition: { type: 'always' },
      configuration: {
        skipPending: false,
        requiresValidation: true,
        dismissible: true,
        defaultPriority: this.getActivityPriority(activityType),
        defaultStatus: 'pending'
      }
    };

    // Only patrol and evidence activities don't create incidents
    if (activityType === 'patrol' || activityType === 'evidence') {
      return [];
    }

    return [universalRule];
  }

  private getActivityPriority(activityType: ActivityType): Priority {
    const priorityMap: Record<ActivityType, Priority> = {
      'medical': 'critical',
      'security-breach': 'high',
      'bol-event': 'high',
      'alert': 'medium',
      'property-damage': 'medium',
      'patrol': 'low',
      'evidence': 'low'
    };
    return priorityMap[activityType] || 'medium';
  }

  private async shouldCreateIncident(activity: EnterpriseActivity, rule: AutoCreationRule): Promise<boolean> {
    if (rule.condition.type === 'always') {
      return true;
    }
    
    if (rule.condition.type === 'never') {
      return false;
    }
    
    if (rule.condition.type === 'conditional' && rule.condition.rules) {
      return rule.condition.rules.every(businessRule => this.evaluateRule(activity, businessRule));
    }
    
    return false;
  }

  private async createIncidentFromActivity(
    activity: EnterpriseActivity,
    rule: AutoCreationRule,
    context: AuditContext
  ): Promise<void> {
    try {
      const incident = {
        title: `Incident: ${activity.title}`,
        type: this.mapActivityTypeToIncidentType(activity.type),
        status: rule.configuration.defaultStatus || 'pending',
        priority: rule.configuration.defaultPriority || activity.priority,
        trigger_activity_id: activity.id,
        created_at: new Date()
      };

      this.incidentStore.createIncident(incident);

      // Log the auto-creation
      await this.auditLog(
        context,
        'auto_create_incident',
        activity.id,
        undefined,
        { incident_created: true, rule_name: 'auto_incident_creation' }
      );

      // Publish event
      await this.publishEvent({
        eventType: 'incident.auto_created',
        entityType: 'activity',
        entityId: activity.id,
        userId: context.userId,
        data: { incident, rule: rule.configuration }
      });

    } catch (error) {
      console.error('Failed to create incident from activity:', error);
    }
  }

  private mapActivityTypeToIncidentType(activityType: ActivityType): string {
    const typeMap: Record<ActivityType, string> = {
      'medical': 'medical_emergency',
      'security-breach': 'security_breach',
      'bol-event': 'external_threat',
      'alert': 'system_alert',
      'property-damage': 'property_incident',
      'patrol': 'operational',
      'evidence': 'operational'
    };

    return typeMap[activityType] || 'other';
  }

  // Public service methods
  async createActivity(
    activityData: Partial<EnterpriseActivity>,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    try {
      // Validation
      await this.validateInput(activityData);
      
      // Business rules
      await this.enforceRules(activityData, 'create');

      // Set default values
      const now = new Date();
      const activity: EnterpriseActivity = {
        id: `ACT-${Date.now().toString().padStart(6, '0')}`,
        timestamp: now,
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
        system_tags: [],
        user_tags: [],
        incident_contexts: [],
        retention_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        is_archived: false,
        allowed_status_transitions: ['detecting', 'assigned', 'responding', 'resolved'],
        requires_approval: false,
        status: 'detecting',
        priority: 'medium',
        type: 'alert',
        title: 'New Activity',
        location: 'Unknown Location',
        ...activityData
      } as EnterpriseActivity;

      // Store the activity
      this.activityStore.createActivity(activity);

      // Check for auto-incident creation
      await this.checkAutoIncidentCreation(activity, context);

      // Audit logging
      await this.auditLog(context, 'create', activity.id, undefined, activity);

      // Publish event
      await this.publishEvent({
        eventType: 'activity.created',
        entityType: 'activity',
        entityId: activity.id,
        userId: context.userId,
        data: activity
      });

      return this.createSuccessResponse(activity, 'Activity created successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateActivity(
    id: string,
    updates: Partial<EnterpriseActivity>,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    try {
      // Get existing activity
      const existingActivity = this.activityStore.activities.find(a => a.id === id);
      if (!existingActivity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      // Validation
      await this.validateInput(updates);
      
      // Business rules
      await this.enforceRules(updates, 'update');

      // Apply updates
      const updatedActivity = {
        ...existingActivity,
        ...updates,
        updated_at: new Date(),
        updated_by: context.userId
      };

      // Store the update
      this.activityStore.updateActivity(id, updatedActivity);

      // Audit logging
      await this.auditLog(context, 'update', id, existingActivity, updatedActivity);

      // Publish event
      await this.publishEvent({
        eventType: 'activity.updated',
        entityType: 'activity',
        entityId: id,
        userId: context.userId,
        data: { before: existingActivity, after: updatedActivity }
      });

      return this.createSuccessResponse(updatedActivity, 'Activity updated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateActivityStatus(
    id: string,
    newStatus: Status,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    try {
      // Authorization check for status transitions
      const activity = this.activityStore.activities.find(a => a.id === id);
      if (!activity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      const allowedTransition = this.statusTransitionRules.find(rule =>
        rule.fromStatus === activity.status &&
        rule.toStatus === newStatus &&
        rule.requiredRole.includes(context.userRole)
      );

      if (!allowedTransition) {
        return this.createErrorResponse(
          `Status transition from ${activity.status} to ${newStatus} not allowed for role ${context.userRole}`,
          'UNAUTHORIZED_STATUS_TRANSITION'
        );
      }

      return await this.updateActivity(id, { status: newStatus }, context);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async assignActivity(
    id: string,
    assignedTo: string,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    return await this.updateActivity(id, { 
      assignedTo, 
      status: 'assigned' as Status 
    }, context);
  }

  async findById(id: string): ServiceMethod<EnterpriseActivity> {
    try {
      const activity = this.activityStore.activities.find(a => a.id === id);
      if (!activity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      return this.createSuccessResponse(activity);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findAll(options: QueryOptions = {}): ServiceListMethod<EnterpriseActivity> {
    try {
      const activities = this.activityStore.filteredActivities;
      const metadata = this.buildQueryMetadata(activities, activities.length, options);

      return this.createSuccessResponse(activities, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteActivity(id: string, context: AuditContext): ServiceBooleanMethod {
    try {
      // Soft delete only (business rule: no hard deletes)
      const result = await this.updateActivity(id, { 
        is_archived: true,
        archive_reason: 'Deleted by user'
      }, context);
      
      return this.createSuccessResponse(result.success);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Tag management
  async updateTags(
    id: string,
    userTags: string[],
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    return await this.updateActivity(id, { user_tags: userTags }, context);
  }

  // Multi-incident support
  async linkToIncident(
    activityId: string,
    incidentId: string,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    try {
      const activity = this.activityStore.activities.find(a => a.id === activityId);
      if (!activity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      const updatedContexts = [...activity.incident_contexts];
      if (!updatedContexts.includes(incidentId)) {
        updatedContexts.push(incidentId);
      }

      return await this.updateActivity(activityId, { 
        incident_contexts: updatedContexts 
      }, context);
      
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async unlinkFromIncident(
    activityId: string,
    incidentId: string,
    context: AuditContext
  ): ServiceMethod<EnterpriseActivity> {
    try {
      const activity = this.activityStore.activities.find(a => a.id === activityId);
      if (!activity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      const updatedContexts = activity.incident_contexts.filter(id => id !== incidentId);

      return await this.updateActivity(activityId, { 
        incident_contexts: updatedContexts 
      }, context);
      
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }
}