/**
 * Incident Service
 * Implements business logic for Incidents including auto-creation from activities,
 * status management, and escalation rules per the Situ8 business logic specification
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  AutoCreationRule,
  StatusTransitionRule,
  ServiceMethod,
  ServiceListMethod,
  ServiceBooleanMethod,
  QueryOptions
} from './types';
import { Incident } from '../lib/types/incident';
import { EnterpriseActivity } from '../lib/types/activity';
import { Priority, Status } from '../lib/utils/status';
import { useIncidentStore } from '../stores/incidentStore';
import { useActivityStore } from '../stores/activityStore';
import { useAuditStore } from '../stores/auditStore';

export class IncidentService extends BaseService<Incident, string> {
  private incidentStore: ReturnType<typeof useIncidentStore.getState>;
  private activityStore: ReturnType<typeof useActivityStore.getState>;
  private auditStore: ReturnType<typeof useAuditStore.getState>;

  // Business logic configuration for incident auto-creation
  private readonly autoCreationRules: AutoCreationRule[] = [
    {
      sourceEntityType: 'activity',
      targetEntityType: 'incident',
      condition: { 
        type: 'conditional',
        rules: [
          { field: 'type', operator: 'in', value: ['medical', 'security-breach', 'bol-event'] }
        ]
      },
      configuration: {
        skipPending: false,
        requiresValidation: true,
        dismissible: false,
        defaultPriority: 'critical',
        defaultStatus: 'active'
      }
    }
  ];

  private readonly statusTransitionRules: StatusTransitionRule[] = [
    // Officers: Limited transitions
    { fromStatus: 'pending', toStatus: 'active', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'active', toStatus: 'investigating', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'investigating', toStatus: 'resolved', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    
    // Supervisors/Admins: Full control
    { fromStatus: 'resolved', toStatus: 'investigating', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'resolved', toStatus: 'active', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'investigating', toStatus: 'active', requiredRole: ['supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'active', toStatus: 'pending', requiredRole: ['supervisor', 'admin'], requiresApproval: true }
  ];

  private readonly escalationRules = [
    {
      condition: { field: 'priority', operator: 'eq', value: 'critical' },
      escalateAfterMinutes: 15,
      escalateToRole: 'supervisor'
    },
    {
      condition: { field: 'priority', operator: 'eq', value: 'high' },
      escalateAfterMinutes: 30,
      escalateToRole: 'supervisor'
    },
    {
      condition: { field: 'status', operator: 'eq', value: 'active' },
      escalateAfterMinutes: 60,
      escalateToRole: 'admin'
    }
  ];

  constructor() {
    super('IncidentService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true
    });

    // Get store instances (in real app, these would be injected)
    this.incidentStore = useIncidentStore.getState();
    this.activityStore = useActivityStore.getState();
    this.auditStore = useAuditStore.getState();
  }

  protected getEntityName(): string {
    return 'Incident';
  }

  protected validateEntity(incident: Partial<Incident>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    const titleError = this.validateRequired(incident.title, 'title');
    if (titleError) errors.push(titleError);

    const typeError = this.validateRequired(incident.type, 'type');
    if (typeError) errors.push(typeError);

    const statusError = this.validateRequired(incident.status, 'status');
    if (statusError) errors.push(statusError);

    const priorityError = this.validateRequired(incident.priority, 'priority');
    if (priorityError) errors.push(priorityError);

    // Enum validation
    if (incident.type) {
      const typeEnumError = this.validateEnum(
        incident.type,
        'type',
        ['medical_emergency', 'security_breach', 'external_threat', 'system_alert', 'property_incident', 'operational', 'other']
      );
      if (typeEnumError) errors.push(typeEnumError);
    }

    if (incident.priority) {
      const priorityEnumError = this.validateEnum(
        incident.priority,
        'priority',
        ['low', 'medium', 'high', 'critical']
      );
      if (priorityEnumError) errors.push(priorityEnumError);
    }

    if (incident.status) {
      const statusEnumError = this.validateEnum(
        incident.status,
        'status',
        ['pending', 'active', 'investigating', 'resolved', 'closed']
      );
      if (statusEnumError) errors.push(statusEnumError);
    }

    // Title length validation
    if (incident.title) {
      const titleLengthError = this.validateLength(incident.title, 'title', 3, 200);
      if (titleLengthError) errors.push(titleLengthError);
    }

    // Description length validation (if present)
    if (incident.description) {
      const descLengthError = this.validateLength(incident.description, 'description', 0, 2000);
      if (descLengthError) errors.push(descLengthError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(incident: Partial<Incident>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Auto-assignment rules
    if (operation === 'create') {
      results.push(this.enforceAutoAssignmentRules(incident));
    }

    // Status progression rules
    if (operation === 'updateStatus') {
      results.push(...this.enforceStatusProgressionRules(incident));
    }

    // Escalation rules
    if (operation === 'create' || operation === 'update') {
      results.push(this.enforceEscalationRules(incident));
    }

    // Multi-activity linkage rules
    if (operation === 'linkActivity') {
      results.push(this.enforceActivityLinkageRules(incident));
    }

    return results;
  }

  // Business rule implementations
  private enforceAutoAssignmentRules(incident: Partial<Incident>): BusinessRuleResult {
    try {
      // Auto-assign based on incident type and priority
      if (incident.priority === 'critical' && !incident.assignedTo) {
        // In a real system, this would query available supervisors
        incident.assignedTo = 'supervisor-on-duty';
        return {
          ruleName: 'auto_assignment_critical',
          passed: true,
          message: 'Critical incident auto-assigned to supervisor on duty'
        };
      }

      if (incident.type === 'medical_emergency' && !incident.assignedTo) {
        // Auto-assign to medical-trained personnel
        incident.assignedTo = 'medical-response-team';
        return {
          ruleName: 'auto_assignment_medical',
          passed: true,
          message: 'Medical emergency auto-assigned to medical response team'
        };
      }

      return {
        ruleName: 'auto_assignment',
        passed: true,
        message: 'No auto-assignment rules applied'
      };
    } catch (error) {
      return {
        ruleName: 'auto_assignment',
        passed: false,
        message: `Auto-assignment failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceStatusProgressionRules(incident: Partial<Incident>): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // This would typically get the current user's role from context
    const userRole = 'officer'; // This should come from AuditContext
    
    if (incident.status) {
      const allowedTransitions = this.statusTransitionRules.filter(rule => 
        rule.requiredRole.includes(userRole)
      );

      results.push({
        ruleName: 'status_progression',
        passed: allowedTransitions.some(rule => rule.toStatus === incident.status),
        message: `Status transition to ${incident.status} ${allowedTransitions.some(rule => rule.toStatus === incident.status) ? 'allowed' : 'denied'} for role ${userRole}`
      });

      // Check for approval requirements
      const transitionRule = this.statusTransitionRules.find(rule => 
        rule.toStatus === incident.status && rule.requiredRole.includes(userRole)
      );
      
      if (transitionRule?.requiresApproval) {
        results.push({
          ruleName: 'approval_required',
          passed: false, // This would check if approval was granted
          message: `Status transition to ${incident.status} requires supervisor approval`
        });
      }
    }

    return results;
  }

  private enforceEscalationRules(incident: Partial<Incident>): BusinessRuleResult {
    try {
      // Set escalation timer based on priority
      const escalationRule = this.escalationRules.find(rule => 
        this.evaluateRule(incident, rule.condition)
      );

      if (escalationRule) {
        const escalationTime = new Date();
        escalationTime.setMinutes(escalationTime.getMinutes() + escalationRule.escalateAfterMinutes);
        
        incident.escalation_time = escalationTime;
        incident.escalation_target = escalationRule.escalateToRole;

        return {
          ruleName: 'escalation_timer',
          passed: true,
          message: `Escalation timer set for ${escalationRule.escalateAfterMinutes} minutes to ${escalationRule.escalateToRole}`
        };
      }

      return {
        ruleName: 'escalation_timer',
        passed: true,
        message: 'No escalation rules applied'
      };
    } catch (error) {
      return {
        ruleName: 'escalation_timer',
        passed: false,
        message: `Escalation rule failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceActivityLinkageRules(incident: Partial<Incident>): BusinessRuleResult {
    try {
      // Ensure incident can be linked to multiple activities
      if (!incident.linked_activity_ids) {
        incident.linked_activity_ids = [];
      }

      // Validate that linked activities exist and are appropriate
      const linkedActivities = incident.linked_activity_ids.map(id => 
        this.activityStore.activities.find(a => a.id === id)
      ).filter(Boolean);

      return {
        ruleName: 'activity_linkage',
        passed: linkedActivities.length === incident.linked_activity_ids.length,
        message: `Successfully linked to ${linkedActivities.length} activities`
      };
    } catch (error) {
      return {
        ruleName: 'activity_linkage',
        passed: false,
        message: `Activity linkage failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Auto-creation logic - called by ActivityService
  async createIncidentFromActivity(
    activity: EnterpriseActivity,
    context: AuditContext,
    rule?: AutoCreationRule
  ): ServiceMethod<Incident> {
    try {
      const now = new Date();
      
      // Determine incident type based on activity type
      const incidentType = this.mapActivityTypeToIncidentType(activity.type);
      
      // Create incident data
      const incidentData: Partial<Incident> = {
        title: `Incident: ${activity.title}`,
        description: `Auto-created from activity: ${activity.description || activity.title}`,
        type: incidentType,
        priority: rule?.configuration.defaultPriority as Priority || activity.priority,
        status: rule?.configuration.defaultStatus as Status || 'pending',
        trigger_activity_id: activity.id,
        linked_activity_ids: [activity.id],
        location: activity.location,
        site_id: activity.metadata?.site,
        building_id: activity.metadata?.building,
        zone_id: activity.metadata?.zone,
        created_by: 'system',
        auto_created: true,
        requires_validation: rule?.configuration.requiresValidation || false,
        dismissible: rule?.configuration.dismissible || true
      };

      // Create the incident
      return await this.createIncident(incidentData, context);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private mapActivityTypeToIncidentType(activityType: string): string {
    const typeMap: Record<string, string> = {
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
  async createIncident(
    incidentData: Partial<Incident>,
    context: AuditContext
  ): ServiceMethod<Incident> {
    try {
      // Validation
      await this.validateInput(incidentData);
      
      // Business rules
      await this.enforceRules(incidentData, 'create');

      // Set default values
      const now = new Date();
      const incident: Incident = {
        id: `INC-${Date.now().toString().padStart(6, '0')}`,
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
        linked_activity_ids: [],
        evidence_items: [],
        comments: [],
        escalation_history: [],
        auto_created: false,
        requires_validation: false,
        dismissible: true,
        title: 'New Incident',
        type: 'other',
        status: 'pending',
        priority: 'medium',
        ...incidentData
      } as Incident;

      // Store the incident
      this.incidentStore.createIncident(incident);

      // Audit logging
      await this.auditLog(context, 'create', incident.id, undefined, incident);

      // Publish event
      await this.publishEvent({
        eventType: 'incident.created',
        entityType: 'incident',
        entityId: incident.id,
        userId: context.userId,
        data: incident
      });

      return this.createSuccessResponse(incident, 'Incident created successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateIncident(
    id: string,
    updates: Partial<Incident>,
    context: AuditContext
  ): ServiceMethod<Incident> {
    try {
      // Get existing incident
      const existingIncident = this.incidentStore.incidents.find(i => i.id === id);
      if (!existingIncident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      // Validation
      await this.validateInput(updates);
      
      // Business rules
      await this.enforceRules(updates, 'update');

      // Apply updates
      const updatedIncident = {
        ...existingIncident,
        ...updates,
        updated_at: new Date(),
        updated_by: context.userId
      };

      // Store the update
      this.incidentStore.updateIncident(id, updatedIncident);

      // Audit logging
      await this.auditLog(context, 'update', id, existingIncident, updatedIncident);

      // Publish event
      await this.publishEvent({
        eventType: 'incident.updated',
        entityType: 'incident',
        entityId: id,
        userId: context.userId,
        data: { before: existingIncident, after: updatedIncident }
      });

      return this.createSuccessResponse(updatedIncident, 'Incident updated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateIncidentStatus(
    id: string,
    newStatus: Status,
    context: AuditContext,
    reason?: string
  ): ServiceMethod<Incident> {
    try {
      // Authorization check for status transitions
      const incident = this.incidentStore.incidents.find(i => i.id === id);
      if (!incident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      const allowedTransition = this.statusTransitionRules.find(rule =>
        rule.fromStatus === incident.status &&
        rule.toStatus === newStatus &&
        rule.requiredRole.includes(context.userRole)
      );

      if (!allowedTransition) {
        return this.createErrorResponse(
          `Status transition from ${incident.status} to ${newStatus} not allowed for role ${context.userRole}`,
          'UNAUTHORIZED_STATUS_TRANSITION'
        );
      }

      // Add status change to escalation history
      const statusChange = {
        timestamp: new Date(),
        from_status: incident.status,
        to_status: newStatus,
        changed_by: context.userId,
        reason: reason || 'Status update',
        requires_approval: allowedTransition.requiresApproval
      };

      const escalationHistory = [...(incident.escalation_history || []), statusChange];

      return await this.updateIncident(id, { 
        status: newStatus,
        escalation_history: escalationHistory
      }, context);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async assignIncident(
    id: string,
    assignedTo: string,
    context: AuditContext
  ): ServiceMethod<Incident> {
    return await this.updateIncident(id, { 
      assignedTo,
      status: 'active' as Status 
    }, context);
  }

  async linkActivity(
    incidentId: string,
    activityId: string,
    context: AuditContext
  ): ServiceMethod<Incident> {
    try {
      const incident = this.incidentStore.incidents.find(i => i.id === incidentId);
      if (!incident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      const updatedActivityIds = [...(incident.linked_activity_ids || [])];
      if (!updatedActivityIds.includes(activityId)) {
        updatedActivityIds.push(activityId);
      }

      return await this.updateIncident(incidentId, { 
        linked_activity_ids: updatedActivityIds 
      }, context);
      
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async unlinkActivity(
    incidentId: string,
    activityId: string,
    context: AuditContext
  ): ServiceMethod<Incident> {
    try {
      const incident = this.incidentStore.incidents.find(i => i.id === incidentId);
      if (!incident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      const updatedActivityIds = (incident.linked_activity_ids || []).filter(id => id !== activityId);

      return await this.updateIncident(incidentId, { 
        linked_activity_ids: updatedActivityIds 
      }, context);
      
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async escalateIncident(
    id: string,
    targetRole: string,
    reason: string,
    context: AuditContext
  ): ServiceMethod<Incident> {
    try {
      const incident = this.incidentStore.incidents.find(i => i.id === id);
      if (!incident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      const escalationEntry = {
        timestamp: new Date(),
        from_status: incident.status,
        to_status: incident.status, // Status may not change on escalation
        escalated_to: targetRole,
        escalated_by: context.userId,
        reason: reason,
        requires_approval: false
      };

      const escalationHistory = [...(incident.escalation_history || []), escalationEntry];

      return await this.updateIncident(id, { 
        escalation_history: escalationHistory,
        escalation_target: targetRole
      }, context);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findById(id: string): ServiceMethod<Incident> {
    try {
      const incident = this.incidentStore.incidents.find(i => i.id === id);
      if (!incident) {
        return this.createErrorResponse('Incident not found', 'NOT_FOUND');
      }

      return this.createSuccessResponse(incident);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findAll(options: QueryOptions = {}): ServiceListMethod<Incident> {
    try {
      const incidents = this.incidentStore.incidents;
      
      // Apply filters
      let filtered = incidents;
      if (options.filters) {
        if (options.filters.status) {
          filtered = filtered.filter(i => i.status === options.filters!.status);
        }
        if (options.filters.priority) {
          filtered = filtered.filter(i => i.priority === options.filters!.priority);
        }
        if (options.filters.assignedTo) {
          filtered = filtered.filter(i => i.assignedTo === options.filters!.assignedTo);
        }
      }

      // Apply sorting
      if (options.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = (a as any)[options.sortBy!];
          const bValue = (b as any)[options.sortBy!];
          
          if (options.sortDirection === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const paginatedIncidents = filtered.slice(startIndex, startIndex + limit);

      const metadata = this.buildQueryMetadata(paginatedIncidents, filtered.length, options);

      return this.createSuccessResponse(paginatedIncidents, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteIncident(id: string, context: AuditContext): ServiceBooleanMethod {
    try {
      // Soft delete only (business rule: no hard deletes)
      const result = await this.updateIncident(id, { 
        status: 'closed' as Status,
        closed_at: new Date(),
        closed_by: context.userId,
        close_reason: 'Deleted by user'
      }, context);
      
      return this.createSuccessResponse(result.success);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Check for incidents that need escalation
  async checkEscalations(): ServiceListMethod<Incident> {
    try {
      const now = new Date();
      const incidents = this.incidentStore.incidents.filter(incident => 
        incident.escalation_time && 
        incident.escalation_time <= now &&
        incident.status !== 'resolved' &&
        incident.status !== 'closed'
      );

      return this.createSuccessResponse(incidents, `Found ${incidents.length} incidents requiring escalation`);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get incident statistics for dashboards
  async getIncidentStatistics(
    timeRange: { start: Date; end: Date }
  ): ServiceMethod<{
    totalIncidents: number;
    incidentsByStatus: Record<string, number>;
    incidentsByPriority: Record<string, number>;
    incidentsByType: Record<string, number>;
    autoCreatedCount: number;
    avgResolutionTime: number;
    escalatedCount: number;
  }> {
    try {
      const incidents = this.incidentStore.incidents.filter(incident => 
        incident.created_at >= timeRange.start && incident.created_at <= timeRange.end
      );
      
      const incidentsByStatus: Record<string, number> = {};
      const incidentsByPriority: Record<string, number> = {};
      const incidentsByType: Record<string, number> = {};
      let autoCreatedCount = 0;
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      let escalatedCount = 0;

      incidents.forEach(incident => {
        // By status
        incidentsByStatus[incident.status] = (incidentsByStatus[incident.status] || 0) + 1;
        
        // By priority
        incidentsByPriority[incident.priority] = (incidentsByPriority[incident.priority] || 0) + 1;
        
        // By type
        incidentsByType[incident.type] = (incidentsByType[incident.type] || 0) + 1;
        
        // Auto-created count
        if (incident.auto_created) {
          autoCreatedCount++;
        }
        
        // Resolution time calculation
        if (incident.status === 'resolved' && incident.resolved_at) {
          totalResolutionTime += incident.resolved_at.getTime() - incident.created_at.getTime();
          resolvedCount++;
        }
        
        // Escalation count
        if (incident.escalation_history && incident.escalation_history.length > 0) {
          escalatedCount++;
        }
      });

      const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

      const statistics = {
        totalIncidents: incidents.length,
        incidentsByStatus,
        incidentsByPriority,
        incidentsByType,
        autoCreatedCount,
        avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60)), // Convert to minutes
        escalatedCount
      };

      return this.createSuccessResponse(statistics, 'Incident statistics generated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }
}