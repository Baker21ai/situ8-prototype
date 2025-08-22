/**
 * Domain Event System
 * Base classes and interfaces for domain events
 */

import { Priority, Status } from '../../../../lib/utils/status';
import { ActivityType } from '../../../../lib/utils/security';

// Base domain event interface
export interface DomainEvent {
  id: string;
  aggregateId: string; // The entity ID this event relates to
  type: string;
  timestamp: Date;
  userId: string;
  version: number;
  metadata?: Record<string, any>;
}

// Activity-specific events
export interface ActivityCreatedEvent extends DomainEvent {
  type: 'ActivityCreated';
  payload: {
    activityId: string;
    title: string;
    activityType: ActivityType;
    priority: Priority;
    location: string;
    createdBy: string;
  };
}

export interface ActivityStatusChangedEvent extends DomainEvent {
  type: 'ActivityStatusChanged';
  payload: {
    activityId: string;
    oldStatus: Status;
    newStatus: Status;
    changedBy: string;
    reason?: string;
  };
}

export interface ActivityAssignedEvent extends DomainEvent {
  type: 'ActivityAssigned';
  payload: {
    activityId: string;
    assignedTo: string;
    assignedBy: string;
    previousAssignee?: string;
  };
}

export interface ActivityEscalatedEvent extends DomainEvent {
  type: 'ActivityEscalated';
  payload: {
    activityId: string;
    previousLevel: number;
    newLevel: number;
    escalatedBy: string;
    reason?: string;
  };
}

export interface ActivityTaggedEvent extends DomainEvent {
  type: 'ActivityTagged';
  payload: {
    activityId: string;
    tag: string;
    tagType: 'user' | 'system';
    addedBy: string;
  };
}

export interface ActivityEvidenceAddedEvent extends DomainEvent {
  type: 'ActivityEvidenceAdded';
  payload: {
    activityId: string;
    evidenceId: string;
    evidenceType: 'image' | 'video' | 'audio' | 'document';
    addedBy: string;
  };
}

export interface ActivityArchivedEvent extends DomainEvent {
  type: 'ActivityArchived';
  payload: {
    activityId: string;
    reason: string;
    archivedBy: string;
  };
}

// Union type of all activity events
export type ActivityEvent = 
  | ActivityCreatedEvent
  | ActivityStatusChangedEvent
  | ActivityAssignedEvent
  | ActivityEscalatedEvent
  | ActivityTaggedEvent
  | ActivityEvidenceAddedEvent
  | ActivityArchivedEvent;

// Event handler type
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

// Event subscription interface
export interface EventSubscription {
  unsubscribe: () => void;
}

// Helper to create events
export class EventFactory {
  static createEvent<T extends DomainEvent>(
    type: T['type'],
    aggregateId: string,
    userId: string,
    payload: any,
    metadata?: Record<string, any>
  ): T {
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      aggregateId,
      type,
      timestamp: new Date(),
      userId,
      version: 1,
      payload,
      metadata
    } as T;
  }

  static createActivityCreatedEvent(
    activityId: string,
    title: string,
    activityType: ActivityType,
    priority: Priority,
    location: string,
    createdBy: string
  ): ActivityCreatedEvent {
    return this.createEvent<ActivityCreatedEvent>(
      'ActivityCreated',
      activityId,
      createdBy,
      {
        activityId,
        title,
        activityType,
        priority,
        location,
        createdBy
      }
    );
  }

  static createActivityStatusChangedEvent(
    activityId: string,
    oldStatus: Status,
    newStatus: Status,
    changedBy: string,
    reason?: string
  ): ActivityStatusChangedEvent {
    return this.createEvent<ActivityStatusChangedEvent>(
      'ActivityStatusChanged',
      activityId,
      changedBy,
      {
        activityId,
        oldStatus,
        newStatus,
        changedBy,
        reason
      }
    );
  }

  static createActivityAssignedEvent(
    activityId: string,
    assignedTo: string,
    assignedBy: string,
    previousAssignee?: string
  ): ActivityAssignedEvent {
    return this.createEvent<ActivityAssignedEvent>(
      'ActivityAssigned',
      activityId,
      assignedBy,
      {
        activityId,
        assignedTo,
        assignedBy,
        previousAssignee
      }
    );
  }

  static createActivityEscalatedEvent(
    activityId: string,
    previousLevel: number,
    newLevel: number,
    escalatedBy: string,
    reason?: string
  ): ActivityEscalatedEvent {
    return this.createEvent<ActivityEscalatedEvent>(
      'ActivityEscalated',
      activityId,
      escalatedBy,
      {
        activityId,
        previousLevel,
        newLevel,
        escalatedBy,
        reason
      }
    );
  }
}