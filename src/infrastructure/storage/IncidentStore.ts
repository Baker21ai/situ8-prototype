/**
 * Domain-Specific Incident Store
 * Implements CQRS architecture with incident-specific business logic
 * Handles auto-creation from activities based on business rules
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  eventBus, 
  createIncidentEvent,
  ActivityCreatedEvent,
  ActivityStatusUpdatedEvent,
  IncidentCreatedEvent,
  IncidentValidatedEvent,
  IncidentEscalatedEvent
} from './EventBus';
import { Priority, Status } from '../../../lib/utils/status';
import { ActivityType } from '../../../lib/utils/security';

// ===== DOMAIN INTERFACES =====

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'security_breach' | 'medical_emergency' | 'system_anomaly' | 'external_threat' | 'other';
  status: 'pending' | 'active' | 'investigating' | 'resolved' | 'dismissed';
  priority: Priority;
  
  // Activity relationships
  trigger_activity_id: string;
  related_activities: string[];
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  
  // User tracking
  created_by: string;
  updated_by: string;
  assigned_to?: string;
  
  // Location data
  site_id: string;
  site_name: string;
  multi_location: boolean;
  affected_locations: string[];
  
  // Auto-creation metadata
  auto_created: boolean;
  creation_rule?: string;
  confidence?: number;
  
  // Validation workflow
  is_pending: boolean;
  pending_until?: Date;
  requires_validation: boolean;
  dismissible: boolean;
  validation_status?: 'approved' | 'dismissed' | 'requires_review';
  validated_by?: string;
  validated_at?: Date;
  validation_reason?: string;
  
  // Escalation
  escalation_time?: Date;
  escalation_target?: string;
  escalation_level?: number;
  
  // External integrations
  external_ticket_id?: string;
  external_system_data?: Record<string, any>;
  
  // Evidence and documentation
  evidence_ids: string[];
  documentation: string[];
  
  // Impact assessment
  business_impact?: 'low' | 'medium' | 'high' | 'critical';
  affected_systems: string[];
  estimated_cost?: number;
  
  // Resolution data
  resolution_summary?: string;
  lessons_learned?: string;
  preventive_actions?: string[];
}

// ===== COMMAND INTERFACES =====

export interface CreateIncidentCommand {
  title: string;
  description: string;
  type: Incident['type'];
  priority: Priority;
  trigger_activity_id: string;
  related_activities?: string[];
  site_id: string;
  site_name: string;
  created_by: string;
  auto_created?: boolean;
  creation_rule?: string;
  confidence?: number;
  requires_validation?: boolean;
}

export interface ValidateIncidentCommand {
  incidentId: string;
  validation_status: 'approved' | 'dismissed';
  validated_by: string;
  validation_reason?: string;
}

export interface EscalateIncidentCommand {
  incidentId: string;
  escalation_level: number;
  escalation_target: string;
  escalated_by: string;
  reason?: string;
}

export interface UpdateIncidentCommand {
  incidentId: string;
  updates: {
    status?: Incident['status'];
    priority?: Priority;
    assigned_to?: string;
    description?: string;
    business_impact?: Incident['business_impact'];
    affected_systems?: string[];
    resolution_summary?: string;
  };
  updated_by: string;
  reason?: string;
}

export interface AddEvidenceCommand {
  incidentId: string;
  evidence_id: string;
  added_by: string;
  evidence_type: string;
  chain_of_custody: {
    custodian: string;
    timestamp: Date;
    location: string;
  };
}

// ===== QUERY INTERFACES =====

export interface IncidentListQuery {
  filters?: {
    types?: Incident['type'][];
    statuses?: Incident['status'][];
    priorities?: Priority[];
    sites?: string[];
    assigned_to?: string[];
    auto_created?: boolean;
    is_pending?: boolean;
    validation_status?: Incident['validation_status'][];
    date_range?: {
      start: Date;
      end: Date;
    };
    search_text?: string;
    has_evidence?: boolean;
    business_impact?: Incident['business_impact'][];
  };
  pagination?: {
    offset: number;
    limit: number;
  };
  sorting?: {
    field: 'created_at' | 'updated_at' | 'priority' | 'title';
    order: 'asc' | 'desc';
  };
}

// ===== AUTO-CREATION RULES =====

export interface IncidentCreationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Trigger conditions
  activity_types: ActivityType[];
  activity_statuses?: Status[];
  priority_threshold?: Priority;
  confidence_threshold?: number;
  time_window_minutes?: number;
  location_based?: boolean;
  
  // Incident configuration
  incident_type: Incident['type'];
  incident_priority: Priority;
  requires_validation: boolean;
  auto_assign_to?: string;
  escalation_minutes?: number;
  
  // Business logic
  validation_timeout_minutes: number;
  dismissible: boolean;
  
  // Conditions
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
}

// ===== STATE INTERFACES =====

export interface IncidentCommandState {
  isExecutingCommand: boolean;
  lastCommandResult: {
    success: boolean;
    error?: string;
    commandType?: string;
    timestamp: Date;
  } | null;
  
  // Auto-creation state
  autoCreationEnabled: boolean;
  creationRules: IncidentCreationRule[];
  lastAutoCreationCheck: Date | null;
  
  // Validation queue
  pendingValidations: {
    incidentId: string;
    expires_at: Date;
    reminder_sent: boolean;
  }[];
}

export interface IncidentQueryState {
  // Cached incidents
  cachedIncidents: Map<string, Incident>;
  cachedQueries: Map<string, {
    query: IncidentListQuery;
    results: Incident[];
    timestamp: Date;
    totalCount: number;
  }>;
  
  // Query execution state
  isExecutingQuery: boolean;
  lastQueryError: string | null;
  
  // Statistics cache
  cachedStats: {
    stats: {
      total: number;
      byStatus: Record<Incident['status'], number>;
      byType: Record<Incident['type'], number>;
      byPriority: Record<Priority, number>;
      pendingValidation: number;
      overdue: number;
      autoCreated: number;
    } | null;
    timestamp: Date | null;
  };
}

export interface IncidentRealtimeState {
  realtimeEnabled: boolean;
  activitySubscriptionId: string | null;
  incidentSubscriptionId: string | null;
  
  // Live incident feed
  recentIncidents: Incident[];
  recentIncidentsLimit: number;
  
  // Validation alerts
  validationAlerts: {
    incidentId: string;
    expires_at: Date;
    priority: Priority;
  }[];
}

// ===== ACTION INTERFACES =====

export interface IncidentCommandActions {
  // Core incident commands
  createIncident: (command: CreateIncidentCommand) => Promise<{ success: boolean; incidentId?: string; error?: string }>;
  validateIncident: (command: ValidateIncidentCommand) => Promise<{ success: boolean; error?: string }>;
  escalateIncident: (command: EscalateIncidentCommand) => Promise<{ success: boolean; error?: string }>;
  updateIncident: (command: UpdateIncidentCommand) => Promise<{ success: boolean; error?: string }>;
  addEvidence: (command: AddEvidenceCommand) => Promise<{ success: boolean; error?: string }>;
  
  // Auto-creation management
  enableAutoCreation: () => void;
  disableAutoCreation: () => void;
  addCreationRule: (rule: IncidentCreationRule) => void;
  updateCreationRule: (ruleId: string, updates: Partial<IncidentCreationRule>) => void;
  removeCreationRule: (ruleId: string) => void;
  testCreationRule: (ruleId: string, activity: any) => boolean;
  
  // Validation management
  processValidationQueue: () => Promise<void>;
  sendValidationReminder: (incidentId: string) => Promise<void>;
  autoResolveExpiredValidations: () => Promise<void>;
}

export interface IncidentQueryActions {
  // Basic queries
  getIncidents: (query?: IncidentListQuery) => Promise<{
    incidents: Incident[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getIncidentById: (id: string) => Promise<Incident | null>;
  getIncidentsByIds: (ids: string[]) => Promise<Incident[]>;
  
  // Specialized queries
  getPendingValidationIncidents: () => Promise<Incident[]>;
  getOverdueIncidents: () => Promise<Incident[]>;
  getIncidentsByActivity: (activityId: string) => Promise<Incident[]>;
  getActiveIncidentsByLocation: (siteId: string) => Promise<Incident[]>;
  
  // Statistics
  getIncidentStats: () => Promise<IncidentQueryState['cachedStats']['stats']>;
  getIncidentTimeline: (start: Date, end: Date) => Promise<Array<{
    timestamp: Date;
    count: number;
    byType: Record<Incident['type'], number>;
  }>>;
  
  // Cache management
  invalidateIncidentCache: (pattern?: string) => void;
  preloadIncidents: (query: IncidentListQuery) => Promise<void>;
}

export interface IncidentRealtimeActions {
  enableIncidentRealtime: () => Promise<void>;
  disableIncidentRealtime: () => Promise<void>;
  getRecentIncidents: (limit?: number) => Incident[];
  getValidationAlerts: () => IncidentRealtimeState['validationAlerts'];
  dismissValidationAlert: (incidentId: string) => void;
}

// ===== MAIN STORE TYPE =====

export type IncidentStore = 
  & IncidentCommandState 
  & IncidentQueryState 
  & IncidentRealtimeState 
  & IncidentCommandActions 
  & IncidentQueryActions 
  & IncidentRealtimeActions;

// ===== DEFAULT CREATION RULES =====

const defaultCreationRules: IncidentCreationRule[] = [
  {
    id: 'medical_emergency_rule',
    name: 'Medical Emergency Auto-Creation',
    description: 'Auto-create incidents for all medical activities',
    enabled: true,
    activity_types: ['medical'],
    incident_type: 'medical_emergency',
    incident_priority: 'critical',
    requires_validation: false,
    validation_timeout_minutes: 5,
    dismissible: false,
    conditions: []
  },
  {
    id: 'security_breach_high_confidence',
    name: 'High Confidence Security Breach',
    description: 'Auto-create incidents for security breaches with >80% confidence',
    enabled: true,
    activity_types: ['security-breach'],
    confidence_threshold: 80,
    incident_type: 'security_breach',
    incident_priority: 'high',
    requires_validation: true,
    validation_timeout_minutes: 5,
    dismissible: true,
    conditions: []
  },
  {
    id: 'alert_clustering_rule',
    name: 'Alert Clustering',
    description: 'Auto-create incidents when multiple alerts occur in same location',
    enabled: true,
    activity_types: ['alert'],
    time_window_minutes: 15,
    location_based: true,
    incident_type: 'system_anomaly',
    incident_priority: 'medium',
    requires_validation: true,
    validation_timeout_minutes: 15,
    dismissible: true,
    conditions: [
      { field: 'count', operator: 'greater_than', value: 2 }
    ]
  }
];

// ===== STORE IMPLEMENTATION =====

export const useIncidentStore = create<IncidentStore>()(
  subscribeWithSelector((set, get) => {
    
    // ===== BUSINESS RULE HELPERS =====
    
    const evaluateCreationRules = (activity: any): IncidentCreationRule[] => {
      const { creationRules } = get();
      
      return creationRules.filter(rule => {
        if (!rule.enabled) return false;
        
        // Check activity type
        if (!rule.activity_types.includes(activity.type)) return false;
        
        // Check confidence threshold
        if (rule.confidence_threshold && activity.confidence < rule.confidence_threshold) return false;
        
        // Check priority threshold
        if (rule.priority_threshold) {
          const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
          if (priorityOrder[activity.priority] < priorityOrder[rule.priority_threshold]) return false;
        }
        
        // Check custom conditions
        for (const condition of rule.conditions) {
          if (!evaluateCondition(activity, condition)) return false;
        }
        
        return true;
      });
    };
    
    const evaluateCondition = (activity: any, condition: any): boolean => {
      const value = activity[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return false;
      }
    };
    
    const handleActivityEvent = async (event: ActivityCreatedEvent | ActivityStatusUpdatedEvent) => {
      const { autoCreationEnabled } = get();
      if (!autoCreationEnabled) return;
      
      if (event.type === 'activity.created') {
        const matchingRules = evaluateCreationRules(event.data);
        
        for (const rule of matchingRules) {
          try {
            await get().createIncident({
              title: `Auto-created: ${event.data.activityType} at ${event.data.location}`,
              description: `Incident auto-created based on rule: ${rule.name}`,
              type: rule.incident_type,
              priority: rule.incident_priority,
              trigger_activity_id: event.data.activityId,
              site_id: 'SITE-001', // This should come from activity data
              site_name: 'Main Campus', // This should come from activity data
              created_by: 'system',
              auto_created: true,
              creation_rule: rule.id,
              confidence: event.data.confidence,
              requires_validation: rule.requires_validation
            });
          } catch (error) {
            console.error('Failed to auto-create incident:', error);
          }
        }
      }
    };
    
    const handleIncidentEvent = (event: IncidentCreatedEvent | IncidentValidatedEvent | IncidentEscalatedEvent) => {
      const { realtimeEnabled, recentIncidents, recentIncidentsLimit } = get();
      
      if (event.type === 'incident.created' && realtimeEnabled) {
        // Add to recent incidents feed
        get().getIncidentById(event.data.incidentId).then(incident => {
          if (incident) {
            const updated = [incident, ...recentIncidents].slice(0, recentIncidentsLimit);
            set({ recentIncidents: updated });
            
            // Add validation alert if needed
            if (incident.requires_validation && incident.is_pending) {
              const { validationAlerts } = get();
              const newAlert = {
                incidentId: incident.id,
                expires_at: incident.pending_until || new Date(Date.now() + 5 * 60 * 1000),
                priority: incident.priority
              };
              set({ validationAlerts: [...validationAlerts, newAlert] });
            }
          }
        });
      }
      
      // Invalidate caches
      get().invalidateIncidentCache();
    };
    
    return {
      // ===== INITIAL STATE =====
      
      // Command state
      isExecutingCommand: false,
      lastCommandResult: null,
      autoCreationEnabled: true,
      creationRules: defaultCreationRules,
      lastAutoCreationCheck: null,
      pendingValidations: [],
      
      // Query state
      cachedIncidents: new Map(),
      cachedQueries: new Map(),
      isExecutingQuery: false,
      lastQueryError: null,
      cachedStats: {
        stats: null,
        timestamp: null
      },
      
      // Realtime state
      realtimeEnabled: false,
      activitySubscriptionId: null,
      incidentSubscriptionId: null,
      recentIncidents: [],
      recentIncidentsLimit: 20,
      validationAlerts: [],
      
      // ===== COMMAND ACTIONS =====
      
      createIncident: async (command: CreateIncidentCommand) => {
        set({ isExecutingCommand: true });
        
        try {
          const incident: Incident = {
            id: `INC-${Date.now().toString().padStart(6, '0')}`,
            title: command.title,
            description: command.description,
            type: command.type,
            status: command.requires_validation ? 'pending' : 'active',
            priority: command.priority,
            trigger_activity_id: command.trigger_activity_id,
            related_activities: command.related_activities || [command.trigger_activity_id],
            created_at: new Date(),
            updated_at: new Date(),
            created_by: command.created_by,
            updated_by: command.created_by,
            site_id: command.site_id,
            site_name: command.site_name,
            multi_location: false,
            affected_locations: [],
            auto_created: command.auto_created || false,
            creation_rule: command.creation_rule,
            confidence: command.confidence,
            is_pending: command.requires_validation || false,
            pending_until: command.requires_validation ? 
              new Date(Date.now() + 5 * 60 * 1000) : undefined,
            requires_validation: command.requires_validation || false,
            dismissible: command.requires_validation || false,
            evidence_ids: [],
            documentation: [],
            affected_systems: []
          };
          
          // Add to cache
          const { cachedIncidents } = get();
          const newCache = new Map(cachedIncidents);
          newCache.set(incident.id, incident);
          set({ cachedIncidents: newCache });
          
          // Publish domain event
          eventBus.publish(createIncidentEvent.created({
            incidentId: incident.id,
            triggerActivityId: incident.trigger_activity_id,
            incidentType: incident.type,
            priority: incident.priority,
            autoCreated: incident.auto_created,
            requiresValidation: incident.requires_validation,
            creationRule: incident.creation_rule
          }, command.created_by));
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'createIncident',
              timestamp: new Date()
            }
          });
          
          return { success: true, incidentId: incident.id };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'createIncident',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      validateIncident: async (command: ValidateIncidentCommand) => {
        set({ isExecutingCommand: true });
        
        try {
          const { cachedIncidents } = get();
          const incident = cachedIncidents.get(command.incidentId);
          
          if (!incident) {
            throw new Error('Incident not found');
          }
          
          const updatedIncident: Incident = {
            ...incident,
            validation_status: command.validation_status,
            validated_by: command.validated_by,
            validated_at: new Date(),
            validation_reason: command.validation_reason,
            is_pending: false,
            status: command.validation_status === 'approved' ? 'active' : 'dismissed',
            updated_at: new Date(),
            updated_by: command.validated_by
          };
          
          // Update cache
          const newCache = new Map(cachedIncidents);
          newCache.set(command.incidentId, updatedIncident);
          set({ cachedIncidents: newCache });
          
          // Remove from validation alerts
          const { validationAlerts } = get();
          set({ 
            validationAlerts: validationAlerts.filter(alert => alert.incidentId !== command.incidentId)
          });
          
          // Publish domain event
          eventBus.publish(createIncidentEvent.validated({
            incidentId: command.incidentId,
            validationStatus: command.validation_status,
            validatedBy: command.validated_by,
            validationReason: command.validation_reason
          }, command.validated_by));
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'validateIncident',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'validateIncident',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      escalateIncident: async (command: EscalateIncidentCommand) => {
        set({ isExecutingCommand: true });
        
        try {
          const { cachedIncidents } = get();
          const incident = cachedIncidents.get(command.incidentId);
          
          if (!incident) {
            throw new Error('Incident not found');
          }
          
          const updatedIncident: Incident = {
            ...incident,
            escalation_level: command.escalation_level,
            escalation_target: command.escalation_target,
            escalation_time: new Date(),
            updated_at: new Date(),
            updated_by: command.escalated_by
          };
          
          // Update cache
          const newCache = new Map(cachedIncidents);
          newCache.set(command.incidentId, updatedIncident);
          set({ cachedIncidents: newCache });
          
          // Publish domain event
          eventBus.publish(createIncidentEvent.escalated({
            incidentId: command.incidentId,
            escalationLevel: command.escalation_level,
            escalatedBy: command.escalated_by,
            escalationTarget: command.escalation_target
          }, command.escalated_by));
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'escalateIncident',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'escalateIncident',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      updateIncident: async (command: UpdateIncidentCommand) => {
        set({ isExecutingCommand: true });
        
        try {
          const { cachedIncidents } = get();
          const incident = cachedIncidents.get(command.incidentId);
          
          if (!incident) {
            throw new Error('Incident not found');
          }
          
          const updatedIncident: Incident = {
            ...incident,
            ...command.updates,
            updated_at: new Date(),
            updated_by: command.updated_by,
            resolved_at: command.updates.status === 'resolved' ? new Date() : incident.resolved_at
          };
          
          // Update cache
          const newCache = new Map(cachedIncidents);
          newCache.set(command.incidentId, updatedIncident);
          set({ cachedIncidents: newCache });
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'updateIncident',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'updateIncident',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      addEvidence: async (command: AddEvidenceCommand) => {
        set({ isExecutingCommand: true });
        
        try {
          const { cachedIncidents } = get();
          const incident = cachedIncidents.get(command.incidentId);
          
          if (!incident) {
            throw new Error('Incident not found');
          }
          
          const updatedIncident: Incident = {
            ...incident,
            evidence_ids: [...incident.evidence_ids, command.evidence_id],
            updated_at: new Date(),
            updated_by: command.added_by
          };
          
          // Update cache
          const newCache = new Map(cachedIncidents);
          newCache.set(command.incidentId, updatedIncident);
          set({ cachedIncidents: newCache });
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'addEvidence',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'addEvidence',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      // Auto-creation management
      enableAutoCreation: () => {
        set({ autoCreationEnabled: true });
      },
      
      disableAutoCreation: () => {
        set({ autoCreationEnabled: false });
      },
      
      addCreationRule: (rule: IncidentCreationRule) => {
        const { creationRules } = get();
        set({ creationRules: [...creationRules, rule] });
      },
      
      updateCreationRule: (ruleId: string, updates: Partial<IncidentCreationRule>) => {
        const { creationRules } = get();
        const updatedRules = creationRules.map(rule =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        );
        set({ creationRules: updatedRules });
      },
      
      removeCreationRule: (ruleId: string) => {
        const { creationRules } = get();
        set({ creationRules: creationRules.filter(rule => rule.id !== ruleId) });
      },
      
      testCreationRule: (ruleId: string, activity: any) => {
        const { creationRules } = get();
        const rule = creationRules.find(r => r.id === ruleId);
        if (!rule) return false;
        
        return evaluateCreationRules(activity).includes(rule);
      },
      
      processValidationQueue: async () => {
        const { pendingValidations } = get();
        const now = new Date();
        
        for (const validation of pendingValidations) {
          if (validation.expires_at <= now) {
            // Auto-resolve expired validations
            await get().validateIncident({
              incidentId: validation.incidentId,
              validation_status: 'dismissed',
              validated_by: 'system',
              validation_reason: 'Validation timeout - auto-dismissed'
            });
          }
        }
        
        // Remove processed validations
        set({
          pendingValidations: pendingValidations.filter(v => v.expires_at > now)
        });
      },
      
      sendValidationReminder: async (incidentId: string) => {
        // Implementation would send notification/email
        console.log(`Sending validation reminder for incident ${incidentId}`);
      },
      
      autoResolveExpiredValidations: async () => {
        await get().processValidationQueue();
      },
      
      // ===== QUERY ACTIONS =====
      
      getIncidents: async (query?: IncidentListQuery) => {
        set({ isExecutingQuery: true, lastQueryError: null });
        
        try {
          // Check cache first
          const cacheKey = JSON.stringify(query);
          const { cachedQueries } = get();
          const cached = cachedQueries.get(cacheKey);
          
          if (cached && Date.now() - cached.timestamp.getTime() < 30000) { // 30 second cache
            set({ isExecutingQuery: false });
            return {
              incidents: cached.results,
              totalCount: cached.totalCount,
              hasMore: cached.results.length < cached.totalCount
            };
          }
          
          // For now, return from cache - in real implementation would query repository
          const { cachedIncidents } = get();
          let incidents = Array.from(cachedIncidents.values());
          
          // Apply filters
          if (query?.filters) {
            incidents = incidents.filter(incident => {
              if (query.filters!.types && !query.filters!.types.includes(incident.type)) return false;
              if (query.filters!.statuses && !query.filters!.statuses.includes(incident.status)) return false;
              if (query.filters!.priorities && !query.filters!.priorities.includes(incident.priority)) return false;
              if (query.filters!.sites && !query.filters!.sites.includes(incident.site_id)) return false;
              if (query.filters!.assigned_to && incident.assigned_to !== query.filters!.assigned_to[0]) return false;
              if (query.filters!.auto_created !== undefined && incident.auto_created !== query.filters!.auto_created) return false;
              if (query.filters!.is_pending !== undefined && incident.is_pending !== query.filters!.is_pending) return false;
              
              if (query.filters!.search_text) {
                const searchText = query.filters!.search_text.toLowerCase();
                const searchableText = [
                  incident.title,
                  incident.description,
                  incident.id
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchText)) return false;
              }
              
              return true;
            });
          }
          
          // Apply sorting
          if (query?.sorting) {
            incidents.sort((a, b) => {
              const aValue = a[query.sorting!.field];
              const bValue = b[query.sorting!.field];
              const comparison = aValue > bValue ? 1 : -1;
              return query.sorting!.order === 'asc' ? comparison : -comparison;
            });
          }
          
          // Apply pagination
          const offset = query?.pagination?.offset || 0;
          const limit = query?.pagination?.limit || 50;
          const totalCount = incidents.length;
          incidents = incidents.slice(offset, offset + limit);
          
          // Cache the result
          const newCachedQueries = new Map(cachedQueries);
          newCachedQueries.set(cacheKey, {
            query: query || {},
            results: incidents,
            timestamp: new Date(),
            totalCount
          });
          
          set({ 
            isExecutingQuery: false,
            cachedQueries: newCachedQueries
          });
          
          return {
            incidents,
            totalCount,
            hasMore: offset + incidents.length < totalCount
          };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ 
            isExecutingQuery: false,
            lastQueryError: errorMessage
          });
          throw error;
        }
      },
      
      getIncidentById: async (id: string) => {
        const { cachedIncidents } = get();
        return cachedIncidents.get(id) || null;
      },
      
      getIncidentsByIds: async (ids: string[]) => {
        const { cachedIncidents } = get();
        return ids.map(id => cachedIncidents.get(id)).filter(Boolean) as Incident[];
      },
      
      getPendingValidationIncidents: async () => {
        const { incidents } = await get().getIncidents({
          filters: { is_pending: true, validation_status: undefined }
        });
        return incidents;
      },
      
      getOverdueIncidents: async () => {
        const { cachedIncidents } = get();
        const now = new Date();
        
        return Array.from(cachedIncidents.values()).filter(incident => {
          if (incident.status === 'resolved' || incident.status === 'dismissed') return false;
          
          // Consider incidents overdue if they've been active for more than expected time
          const hoursActive = (now.getTime() - incident.created_at.getTime()) / (1000 * 60 * 60);
          const overdueThreshold = incident.priority === 'critical' ? 2 : 
                                  incident.priority === 'high' ? 8 : 24;
          
          return hoursActive > overdueThreshold;
        });
      },
      
      getIncidentsByActivity: async (activityId: string) => {
        const { cachedIncidents } = get();
        return Array.from(cachedIncidents.values()).filter(incident =>
          incident.trigger_activity_id === activityId || 
          incident.related_activities.includes(activityId)
        );
      },
      
      getActiveIncidentsByLocation: async (siteId: string) => {
        const { incidents } = await get().getIncidents({
          filters: { 
            sites: [siteId],
            statuses: ['active', 'investigating']
          }
        });
        return incidents;
      },
      
      getIncidentStats: async () => {
        const { cachedStats } = get();
        
        // Check cache
        if (cachedStats.stats && cachedStats.timestamp && 
            Date.now() - cachedStats.timestamp.getTime() < 60000) { // 1 minute cache
          return cachedStats.stats;
        }
        
        const { cachedIncidents } = get();
        const incidents = Array.from(cachedIncidents.values());
        
        const stats = {
          total: incidents.length,
          byStatus: incidents.reduce((acc, incident) => {
            acc[incident.status] = (acc[incident.status] || 0) + 1;
            return acc;
          }, {} as Record<Incident['status'], number>),
          byType: incidents.reduce((acc, incident) => {
            acc[incident.type] = (acc[incident.type] || 0) + 1;
            return acc;
          }, {} as Record<Incident['type'], number>),
          byPriority: incidents.reduce((acc, incident) => {
            acc[incident.priority] = (acc[incident.priority] || 0) + 1;
            return acc;
          }, {} as Record<Priority, number>),
          pendingValidation: incidents.filter(i => i.is_pending).length,
          overdue: (await get().getOverdueIncidents()).length,
          autoCreated: incidents.filter(i => i.auto_created).length
        };
        
        set({
          cachedStats: {
            stats,
            timestamp: new Date()
          }
        });
        
        return stats;
      },
      
      getIncidentTimeline: async (start: Date, end: Date) => {
        const { cachedIncidents } = get();
        const incidents = Array.from(cachedIncidents.values()).filter(
          incident => incident.created_at >= start && incident.created_at <= end
        );
        
        // Group by day for now (could be made configurable)
        const timeline: Record<string, { count: number; byType: Record<Incident['type'], number> }> = {};
        
        incidents.forEach(incident => {
          const dateKey = incident.created_at.toISOString().split('T')[0];
          if (!timeline[dateKey]) {
            timeline[dateKey] = {
              count: 0,
              byType: {} as Record<Incident['type'], number>
            };
          }
          
          timeline[dateKey].count++;
          timeline[dateKey].byType[incident.type] = (timeline[dateKey].byType[incident.type] || 0) + 1;
        });
        
        return Object.entries(timeline).map(([dateStr, data]) => ({
          timestamp: new Date(dateStr),
          count: data.count,
          byType: data.byType
        }));
      },
      
      invalidateIncidentCache: (pattern?: string) => {
        if (pattern === 'incidents') {
          set({ cachedIncidents: new Map() });
        } else if (pattern === 'queries') {
          set({ cachedQueries: new Map() });
        } else if (pattern === 'stats') {
          set({ cachedStats: { stats: null, timestamp: null } });
        } else {
          // Clear all caches
          set({ 
            cachedIncidents: new Map(),
            cachedQueries: new Map(),
            cachedStats: { stats: null, timestamp: null }
          });
        }
      },
      
      preloadIncidents: async (query: IncidentListQuery) => {
        await get().getIncidents(query);
      },
      
      // ===== REAL-TIME ACTIONS =====
      
      enableIncidentRealtime: async () => {
        if (get().realtimeEnabled) return;
        
        // Subscribe to activity events for auto-creation
        const activitySubscriptionId = eventBus.subscribe(
          handleActivityEvent,
          { aggregate: 'activity' }
        );
        
        // Subscribe to incident events for updates
        const incidentSubscriptionId = eventBus.subscribe(
          handleIncidentEvent,
          { aggregate: 'incident' }
        );
        
        set({ 
          realtimeEnabled: true,
          activitySubscriptionId,
          incidentSubscriptionId
        });
      },
      
      disableIncidentRealtime: async () => {
        const { activitySubscriptionId, incidentSubscriptionId } = get();
        
        if (activitySubscriptionId) {
          eventBus.unsubscribe(activitySubscriptionId);
        }
        
        if (incidentSubscriptionId) {
          eventBus.unsubscribe(incidentSubscriptionId);
        }
        
        set({ 
          realtimeEnabled: false,
          activitySubscriptionId: null,
          incidentSubscriptionId: null
        });
      },
      
      getRecentIncidents: (limit?: number) => {
        const { recentIncidents, recentIncidentsLimit } = get();
        return recentIncidents.slice(0, limit || recentIncidentsLimit);
      },
      
      getValidationAlerts: () => {
        return get().validationAlerts;
      },
      
      dismissValidationAlert: (incidentId: string) => {
        const { validationAlerts } = get();
        set({ 
          validationAlerts: validationAlerts.filter(alert => alert.incidentId !== incidentId)
        });
      }
    };
  })
);