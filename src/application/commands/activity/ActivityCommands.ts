/**
 * Activity Domain Commands
 * All commands related to activity management
 */

import { ICommand } from '../base/ICommand';
import { ActivityType } from '../../../lib/utils/security';
import { Priority, Status } from '../../../lib/utils/status';

// ===== CREATE ACTIVITY COMMAND =====

export interface CreateActivityCommand extends ICommand {
  readonly type: 'CreateActivity';
  readonly data: {
    activityType: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    description?: string;
    building?: string;
    zone?: string;
    assignedTo?: string;
    confidence?: number;
    externalData?: {
      sourceSystem: string;
      originalType: string;
      rawPayload: Record<string, any>;
    };
  };
}

export interface CreateActivityResult {
  activityId: string;
  autoTagsApplied: string[];
  incidentTriggered?: {
    incidentId: string;
    rule: string;
  };
}

// ===== UPDATE ACTIVITY COMMAND =====

export interface UpdateActivityCommand extends ICommand {
  readonly type: 'UpdateActivity';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    updates: {
      priority?: Priority;
      status?: Status;
      description?: string;
      assignedTo?: string;
      userTags?: string[];
    };
    reason?: string;
  };
}

export interface UpdateActivityResult {
  updatedFields: string[];
  triggeredWorkflows?: string[];
}

// ===== ASSIGN ACTIVITY COMMAND =====

export interface AssignActivityCommand extends ICommand {
  readonly type: 'AssignActivity';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    assignedTo: string;
    assignedBy: string;
    reason?: string;
    notifyAssignee?: boolean;
  };
}

export interface AssignActivityResult {
  previousAssignee?: string;
  notificationSent: boolean;
}

// ===== ARCHIVE ACTIVITY COMMAND =====

export interface ArchiveActivityCommand extends ICommand {
  readonly type: 'ArchiveActivity';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    reason: string;
    archivedBy: string;
    permanent?: boolean;
  };
}

export interface ArchiveActivityResult {
  archivedAt: Date;
  retentionDate: Date;
}

// ===== BULK STATUS UPDATE COMMAND =====

export interface BulkUpdateStatusCommand extends ICommand {
  readonly type: 'BulkUpdateStatus';
  readonly data: {
    activityIds: string[];
    status: Status;
    reason?: string;
    notifyAssigned?: boolean;
  };
}

export interface BulkUpdateStatusResult {
  successCount: number;
  failedIds: string[];
  notificationsSent: number;
}

// ===== ADD USER TAG COMMAND =====

export interface AddUserTagCommand extends ICommand {
  readonly type: 'AddUserTag';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    tag: string;
    addedBy: string;
  };
}

export interface AddUserTagResult {
  tag: string;
  allTags: string[];
}

// ===== REMOVE USER TAG COMMAND =====

export interface RemoveUserTagCommand extends ICommand {
  readonly type: 'RemoveUserTag';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    tag: string;
    removedBy: string;
  };
}

export interface RemoveUserTagResult {
  tag: string;
  allTags: string[];
}

// ===== ESCALATE ACTIVITY COMMAND =====

export interface EscalateActivityCommand extends ICommand {
  readonly type: 'EscalateActivity';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    escalationType: 'priority' | 'assignment' | 'incident';
    targetPriority?: Priority;
    targetAssignee?: string;
    createIncident?: boolean;
    reason: string;
    escalatedBy: string;
  };
}

export interface EscalateActivityResult {
  escalationType: string;
  previousState: {
    priority?: Priority;
    assignedTo?: string;
  };
  newState: {
    priority?: Priority;
    assignedTo?: string;
    incidentId?: string;
  };
}

// ===== LINK TO INCIDENT COMMAND =====

export interface LinkToIncidentCommand extends ICommand {
  readonly type: 'LinkToIncident';
  readonly aggregateId: string; // Activity ID
  readonly data: {
    incidentId: string;
    linkType: 'trigger' | 'related' | 'evidence';
    linkedBy: string;
    notes?: string;
  };
}

export interface LinkToIncidentResult {
  incidentId: string;
  linkType: string;
  allIncidentLinks: string[];
}

// ===== BATCH CREATE ACTIVITIES COMMAND =====

export interface BatchCreateActivitiesCommand extends ICommand {
  readonly type: 'BatchCreateActivities';
  readonly data: {
    activities: Array<{
      activityType: ActivityType;
      title: string;
      location: string;
      priority: Priority;
      description?: string;
      building?: string;
      zone?: string;
      confidence?: number;
      externalData?: {
        sourceSystem: string;
        originalType: string;
        rawPayload: Record<string, any>;
      };
    }>;
    batchId: string;
    sourceSystem?: string;
  };
}

export interface BatchCreateActivitiesResult {
  batchId: string;
  successCount: number;
  failedCount: number;
  createdActivityIds: string[];
  failures: Array<{
    index: number;
    error: string;
  }>;
  incidentsTriggered: Array<{
    activityId: string;
    incidentId: string;
    rule: string;
  }>;
}

// ===== MERGE ACTIVITIES COMMAND =====

export interface MergeActivitiesCommand extends ICommand {
  readonly type: 'MergeActivities';
  readonly data: {
    primaryActivityId: string;
    activityIdsToMerge: string[];
    mergeReason: string;
    mergedBy: string;
    preserveData?: {
      tags: boolean;
      assignments: boolean;
      timeline: boolean;
    };
  };
}

export interface MergeActivitiesResult {
  primaryActivityId: string;
  mergedActivityIds: string[];
  mergedData: {
    tagsAdded: string[];
    timelineEntriesAdded: number;
    evidenceLinked: string[];
  };
}

// Union type of all activity commands
export type ActivityCommand = 
  | CreateActivityCommand
  | UpdateActivityCommand
  | AssignActivityCommand
  | ArchiveActivityCommand
  | BulkUpdateStatusCommand
  | AddUserTagCommand
  | RemoveUserTagCommand
  | EscalateActivityCommand
  | LinkToIncidentCommand
  | BatchCreateActivitiesCommand
  | MergeActivitiesCommand;