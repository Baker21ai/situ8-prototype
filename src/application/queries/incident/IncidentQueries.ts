/**
 * Incident Domain Queries
 * All queries related to incident data retrieval and analysis
 */

import { IQuery, IPaginatedQuery, IFilteredQuery } from '../base/IQuery';
import { Priority } from '../../../lib/utils/status';
import { IncidentType, IncidentStatus, ValidationStatus, BusinessImpact } from '../../commands/incident/IncidentCommands';

// ===== INCIDENT INTERFACE =====

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
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
  validation_status?: ValidationStatus;
  validated_by?: string;
  validated_at?: Date;
  validation_reason?: string;
  
  // Escalation
  escalation_time?: Date;
  escalation_target?: string;
  escalation_level?: number;
  
  // Business impact
  business_impact?: BusinessImpact;
  affected_systems: string[];
  estimated_cost?: number;
  
  // Evidence and documentation
  evidence_ids: string[];
  documentation: string[];
  
  // Team assignment
  incident_commander?: string;
  team_members?: IncidentTeamMember[];
  
  // Resolution data
  resolution_summary?: string;
  lessons_learned?: string;
  preventive_actions?: string[];
}

export interface IncidentTeamMember {
  userId: string;
  role: 'lead_investigator' | 'investigator' | 'analyst' | 'coordinator' | 'subject_matter_expert';
  specialization?: string;
  assigned_at: Date;
}

// ===== GET INCIDENTS QUERY =====

export interface GetIncidentsQuery extends IPaginatedQuery, IFilteredQuery {
  readonly type: 'GetIncidents';
  readonly filters?: {
    types?: IncidentType[];
    statuses?: IncidentStatus[];
    priorities?: Priority[];
    sites?: string[];
    assignedTo?: string[];
    autoCreated?: boolean;
    isPending?: boolean;
    validationStatus?: ValidationStatus[];
    businessImpact?: BusinessImpact[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    hasEvidence?: boolean;
    escalationLevel?: number[];
    teamSize?: {
      min?: number;
      max?: number;
    };
  };
}

export interface GetIncidentsResult {
  incidents: Incident[];
  totalCount: number;
  hasMore: boolean;
  aggregations?: {
    byPriority: Record<Priority, number>;
    byStatus: Record<IncidentStatus, number>;
    byType: Record<IncidentType, number>;
    bySite: Record<string, number>;
  };
}

// ===== GET INCIDENT BY ID QUERY =====

export interface GetIncidentByIdQuery extends IQuery {
  readonly type: 'GetIncidentById';
  readonly incidentId: string;
  readonly includeActivities?: boolean;
  readonly includeEvidence?: boolean;
  readonly includeTimeline?: boolean;
  readonly includeTeam?: boolean;
}

export interface GetIncidentByIdResult {
  incident: Incident | null;
  activities?: Array<{
    id: string;
    title: string;
    type: string;
    timestamp: Date;
    relationshipType: 'trigger' | 'related' | 'evidence';
  }>;
  evidence?: IncidentEvidence[];
  timeline?: IncidentTimelineEntry[];
  team?: IncidentTeamMember[];
}

// ===== GET PENDING VALIDATION INCIDENTS QUERY =====

export interface GetPendingIncidentsQuery extends IQuery {
  readonly type: 'GetPendingIncidents';
  readonly urgencyLevel?: 'all' | 'expiring_soon' | 'overdue';
  readonly assignedTo?: string;
  readonly expirationThreshold?: number; // minutes before expiration
}

export interface GetPendingIncidentsResult {
  incidents: Incident[];
  urgencyBreakdown: {
    expiringSoon: number; // < 5 minutes
    normal: number; // 5-15 minutes
    overdue: number; // past expiration
  };
  nextExpirations: Array<{
    incidentId: string;
    expiresAt: Date;
    minutesRemaining: number;
  }>;
}

// ===== GET INCIDENT STATISTICS QUERY =====

export interface GetIncidentStatsQuery extends IQuery {
  readonly type: 'GetIncidentStats';
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly groupBy?: ('hour' | 'day' | 'week' | 'month')[];
  readonly includeComparisons?: boolean;
  readonly filters?: GetIncidentsQuery['filters'];
}

export interface GetIncidentStatsResult {
  summary: {
    total: number;
    active: number;
    resolved: number;
    dismissed: number;
    averageResolutionTime: number; // hours
    autoCreatedPercentage: number;
    validationAccuracy: number; // % of validated incidents that were approved
  };
  distributions: {
    byPriority: Record<Priority, number>;
    byStatus: Record<IncidentStatus, number>;
    byType: Record<IncidentType, number>;
    bySite: Record<string, number>;
    byCreationMethod: {
      manual: number;
      autoCreated: number;
    };
  };
  trends?: {
    period: string;
    data: Array<{
      timestamp: Date;
      created: number;
      resolved: number;
      dismissed: number;
      averageResolutionTime: number;
    }>;
  };
  performance: {
    validationMetrics: {
      averageValidationTime: number; // minutes
      autoApprovalRate: number;
      dismissalRate: number;
    };
    escalationMetrics: {
      escalationRate: number;
      averageEscalationTime: number; // hours
    };
    resolutionMetrics: {
      onTimeResolution: number;
      overdueIncidents: number;
      averageTeamSize: number;
    };
  };
}

// ===== GET OVERDUE INCIDENTS QUERY =====

export interface GetOverdueIncidentsQuery extends IQuery {
  readonly type: 'GetOverdueIncidents';
  readonly thresholdHours?: Record<Priority, number>;
  readonly includeNearOverdue?: boolean;
  readonly assignedTo?: string;
}

export interface GetOverdueIncidentsResult {
  incidents: Incident[];
  overdueMetrics: {
    totalCount: number;
    byPriority: Record<Priority, number>;
    averageOverdueHours: number;
    oldestIncident: {
      id: string;
      hoursOverdue: number;
    };
  };
  nearOverdue: Incident[]; // Within 2 hours of threshold
}

// ===== GET INCIDENTS BY ACTIVITY QUERY =====

export interface GetIncidentsByActivityQuery extends IQuery {
  readonly type: 'GetIncidentsByActivity';
  readonly activityId: string;
  readonly relationshipTypes?: ('trigger' | 'related' | 'evidence')[];
  readonly includeInactive?: boolean;
}

export interface GetIncidentsByActivityResult {
  incidents: Incident[];
  relationships: Array<{
    incidentId: string;
    relationshipType: 'trigger' | 'related' | 'evidence';
    confidence?: number;
    linkedAt: Date;
    linkedBy: string;
  }>;
}

// ===== GET ACTIVE INCIDENTS BY LOCATION QUERY =====

export interface GetActiveIncidentsByLocationQuery extends IQuery {
  readonly type: 'GetActiveIncidentsByLocation';
  readonly siteId: string;
  readonly includeNearbyIncidents?: boolean;
  readonly radius?: number; // kilometers
}

export interface GetActiveIncidentsByLocationResult {
  incidents: Incident[];
  locationMetrics: {
    activeCount: number;
    highPriorityCount: number;
    averageResolutionTime: number;
    incidentDensity: number; // incidents per day
  };
  nearbyIncidents?: Incident[];
  recommendations: Array<{
    type: 'resource_allocation' | 'pattern_alert' | 'escalation_suggestion';
    description: string;
    priority: number;
  }>;
}

// ===== GET INCIDENT TIMELINE QUERY =====

export interface GetIncidentTimelineQuery extends IQuery {
  readonly type: 'GetIncidentTimeline';
  readonly timeRange: {
    start: Date;
    end: Date;
  };
  readonly granularity: 'hour' | 'day' | 'week';
  readonly includeResolutions?: boolean;
  readonly filters?: GetIncidentsQuery['filters'];
}

export interface GetIncidentTimelineResult {
  timeline: Array<{
    timestamp: Date;
    created: number;
    resolved: number;
    escalated: number;
    byType: Record<IncidentType, number>;
    byPriority: Record<Priority, number>;
  }>;
  patterns: {
    peakCreationHours: number[];
    busyDays: string[];
    seasonalPatterns?: Array<{
      pattern: string;
      confidence: number;
      period: string;
    }>;
  };
  anomalies: Array<{
    timestamp: Date;
    type: 'creation_spike' | 'resolution_drop' | 'validation_delays';
    severity: number;
    description: string;
    affectedIncidents: string[];
  }>;
}

// ===== GET AUTO-CREATION EFFECTIVENESS QUERY =====

export interface GetAutoCreationEffectivenessQuery extends IQuery {
  readonly type: 'GetAutoCreationEffectiveness';
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly ruleId?: string;
  readonly includeRuleDetails?: boolean;
}

export interface GetAutoCreationEffectivenessResult {
  summary: {
    totalAutoCreated: number;
    approvalRate: number;
    dismissalRate: number;
    falsePositiveRate: number;
    averageValidationTime: number;
  };
  byRule: Array<{
    ruleId: string;
    ruleName: string;
    triggered: number;
    approved: number;
    dismissed: number;
    accuracy: number;
    averageConfidence: number;
    recommendations?: string[];
  }>;
  improvements: Array<{
    ruleId: string;
    suggestion: string;
    expectedImprovement: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ===== SEARCH INCIDENTS QUERY =====

export interface SearchIncidentsQuery extends IPaginatedQuery {
  readonly type: 'SearchIncidents';
  readonly searchText: string;
  readonly searchFields?: ('title' | 'description' | 'resolution_summary' | 'lessons_learned')[];
  readonly filters?: GetIncidentsQuery['filters'];
  readonly includeResolved?: boolean;
}

export interface SearchIncidentsResult {
  incidents: Incident[];
  totalCount: number;
  hasMore: boolean;
  searchMetadata: {
    queryTime: number;
    searchTerms: string[];
    suggestedTerms?: string[];
    highlights?: Record<string, string[]>;
  };
}

// ===== SUPPORTING TYPES =====

export interface IncidentEvidence {
  id: string;
  type: 'activity' | 'document' | 'image' | 'video' | 'audio' | 'witness_statement';
  description?: string;
  url?: string;
  addedAt: Date;
  addedBy: string;
  chainOfCustody: Array<{
    custodian: string;
    timestamp: Date;
    location: string;
    action: 'collected' | 'transferred' | 'analyzed' | 'stored';
  }>;
  tags?: string[];
}

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  timestamp: Date;
  type: 'created' | 'validated' | 'assigned' | 'escalated' | 'evidence_added' | 'status_changed' | 'resolved';
  user: string;
  description: string;
  metadata?: Record<string, any>;
}

// Union type of all incident queries
export type IncidentQuery = 
  | GetIncidentsQuery
  | GetIncidentByIdQuery
  | GetPendingIncidentsQuery
  | GetIncidentStatsQuery
  | GetOverdueIncidentsQuery
  | GetIncidentsByActivityQuery
  | GetActiveIncidentsByLocationQuery
  | GetIncidentTimelineQuery
  | GetAutoCreationEffectivenessQuery
  | SearchIncidentsQuery;