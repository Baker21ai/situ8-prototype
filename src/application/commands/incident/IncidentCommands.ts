/**
 * Incident Domain Commands
 * All commands related to incident management
 */

import { ICommand } from '../base/ICommand';
import { Priority } from '../../../lib/utils/status';

// ===== INCIDENT TYPES =====

export type IncidentType = 'security_breach' | 'medical_emergency' | 'system_anomaly' | 'external_threat' | 'other';
export type IncidentStatus = 'pending' | 'active' | 'investigating' | 'resolved' | 'dismissed';
export type ValidationStatus = 'approved' | 'dismissed' | 'requires_review';
export type BusinessImpact = 'low' | 'medium' | 'high' | 'critical';

// ===== CREATE INCIDENT COMMAND =====

export interface CreateIncidentCommand extends ICommand {
  readonly type: 'CreateIncident';
  readonly data: {
    title: string;
    description: string;
    incidentType: IncidentType;
    priority: Priority;
    triggerActivityId: string;
    relatedActivityIds?: string[];
    siteId: string;
    siteName: string;
    autoCreated?: boolean;
    creationRule?: string;
    confidence?: number;
    requiresValidation?: boolean;
    validationTimeout?: number; // minutes
    assignedTo?: string;
    businessImpact?: BusinessImpact;
    affectedSystems?: string[];
  };
}

export interface CreateIncidentResult {
  incidentId: string;
  status: IncidentStatus;
  validationRequired: boolean;
  validationExpiresAt?: Date;
  notificationsSent: string[];
}

// ===== VALIDATE INCIDENT COMMAND =====

export interface ValidateIncidentCommand extends ICommand {
  readonly type: 'ValidateIncident';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    validationStatus: ValidationStatus;
    validationReason?: string;
    escalate?: boolean;
    escalationTarget?: string;
  };
}

export interface ValidateIncidentResult {
  previousStatus: IncidentStatus;
  newStatus: IncidentStatus;
  escalated: boolean;
  notificationsSent: string[];
}

// ===== ESCALATE INCIDENT COMMAND =====

export interface EscalateIncidentCommand extends ICommand {
  readonly type: 'EscalateIncident';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    escalationLevel: number;
    escalationTarget: string;
    escalationReason: string;
    urgentNotification?: boolean;
    externalSystemNotification?: {
      system: string;
      ticketId?: string;
    };
  };
}

export interface EscalateIncidentResult {
  previousEscalationLevel: number;
  newEscalationLevel: number;
  escalationTarget: string;
  externalTicketCreated?: {
    system: string;
    ticketId: string;
  };
  notificationsSent: string[];
}

// ===== UPDATE INCIDENT COMMAND =====

export interface UpdateIncidentCommand extends ICommand {
  readonly type: 'UpdateIncident';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    updates: {
      status?: IncidentStatus;
      priority?: Priority;
      assignedTo?: string;
      description?: string;
      businessImpact?: BusinessImpact;
      affectedSystems?: string[];
      resolutionSummary?: string;
      lessonsLearned?: string;
      preventiveActions?: string[];
    };
    updateReason?: string;
    notifyStakeholders?: boolean;
  };
}

export interface UpdateIncidentResult {
  updatedFields: string[];
  statusChanged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  notificationsSent: string[];
}

// ===== ADD EVIDENCE COMMAND =====

export interface AddEvidenceCommand extends ICommand {
  readonly type: 'AddEvidence';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    evidenceId: string;
    evidenceType: 'activity' | 'document' | 'image' | 'video' | 'audio' | 'witness_statement';
    chainOfCustody: {
      custodian: string;
      location: string;
      timestamp: Date;
      integrity_hash?: string;
    };
    description?: string;
    tags?: string[];
  };
}

export interface AddEvidenceResult {
  evidenceId: string;
  chainOfCustodyId: string;
  totalEvidenceCount: number;
}

// ===== LINK ACTIVITIES COMMAND =====

export interface LinkActivitiesCommand extends ICommand {
  readonly type: 'LinkActivities';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    activityIds: string[];
    linkType: 'related' | 'causal' | 'evidence' | 'consequence';
    linkReason?: string;
    confidence?: number;
  };
}

export interface LinkActivitiesResult {
  linkedActivityIds: string[];
  totalLinkedActivities: number;
  linkType: string;
}

// ===== ASSIGN INCIDENT TEAM COMMAND =====

export interface AssignIncidentTeamCommand extends ICommand {
  readonly type: 'AssignIncidentTeam';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    incidentCommander: string;
    team: Array<{
      userId: string;
      role: 'lead_investigator' | 'investigator' | 'analyst' | 'coordinator' | 'subject_matter_expert';
      specialization?: string;
    }>;
    notifyTeam?: boolean;
  };
}

export interface AssignIncidentTeamResult {
  incidentCommander: string;
  teamSize: number;
  rolesAssigned: string[];
  notificationsSent: string[];
}

// ===== MERGE INCIDENTS COMMAND =====

export interface MergeIncidentsCommand extends ICommand {
  readonly type: 'MergeIncidents';
  readonly data: {
    primaryIncidentId: string;
    incidentIdsToMerge: string[];
    mergeReason: string;
    mergedBy: string;
    preserveData?: {
      evidence: boolean;
      timeline: boolean;
      team: boolean;
      documentation: boolean;
    };
  };
}

export interface MergeIncidentsResult {
  primaryIncidentId: string;
  mergedIncidentIds: string[];
  mergedData: {
    evidenceLinked: string[];
    activitiesLinked: string[];
    timelineEntriesAdded: number;
    teamMembersAdded: string[];
  };
}

// ===== CLOSE INCIDENT COMMAND =====

export interface CloseIncidentCommand extends ICommand {
  readonly type: 'CloseIncident';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    resolutionSummary: string;
    rootCause?: string;
    lessonsLearned?: string;
    preventiveActions?: string[];
    followUpRequired?: {
      tasks: string[];
      assignedTo: string[];
      dueDate: Date;
    };
    stakeholderNotification?: boolean;
    documentationComplete: boolean;
  };
}

export interface CloseIncidentResult {
  closedAt: Date;
  resolutionTime: number; // minutes
  followUpTasksCreated: number;
  notificationsSent: string[];
  complianceReportGenerated: boolean;
}

// ===== REOPEN INCIDENT COMMAND =====

export interface ReopenIncidentCommand extends ICommand {
  readonly type: 'ReopenIncident';
  readonly aggregateId: string; // Incident ID
  readonly data: {
    reopenReason: string;
    newEvidence?: string;
    reopenedBy: string;
    priority?: Priority;
    assignTo?: string;
  };
}

export interface ReopenIncidentResult {
  reopenedAt: Date;
  previousClosureDate: Date;
  newPriority: Priority;
  notificationsSent: string[];
}

// ===== BULK INCIDENT OPERATIONS =====

export interface BulkUpdateIncidentsCommand extends ICommand {
  readonly type: 'BulkUpdateIncidents';
  readonly data: {
    incidentIds: string[];
    updates: {
      status?: IncidentStatus;
      priority?: Priority;
      assignedTo?: string;
      businessImpact?: BusinessImpact;
    };
    updateReason: string;
    notifyStakeholders?: boolean;
  };
}

export interface BulkUpdateIncidentsResult {
  successCount: number;
  failedIds: string[];
  notificationsSent: number;
  updatedFields: string[];
}

// Union type of all incident commands
export type IncidentCommand = 
  | CreateIncidentCommand
  | ValidateIncidentCommand
  | EscalateIncidentCommand
  | UpdateIncidentCommand
  | AddEvidenceCommand
  | LinkActivitiesCommand
  | AssignIncidentTeamCommand
  | MergeIncidentsCommand
  | CloseIncidentCommand
  | ReopenIncidentCommand
  | BulkUpdateIncidentsCommand;