/**
 * Event Bus - Central event system for cross-domain communication
 * Implements type-safe event definitions with subscription management
 */

// Base event interface
export interface DomainEvent {
  id: string;
  type: string;
  aggregate: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  userId?: string;
  metadata?: Record<string, any>;
}

// Activity domain events
export interface ActivityCreatedEvent extends DomainEvent {
  type: 'activity.created';
  aggregate: 'activity';
  data: {
    activityId: string;
    activityType: string;
    priority: string;
    status: string;
    location: string;
    building?: string;
    zone?: string;
    externalSystemId?: string;
    confidence?: number;
  };
}

export interface ActivityStatusUpdatedEvent extends DomainEvent {
  type: 'activity.status_updated';
  aggregate: 'activity';
  data: {
    activityId: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    reason?: string;
  };
}

export interface ActivityAssignedEvent extends DomainEvent {
  type: 'activity.assigned';
  aggregate: 'activity';
  data: {
    activityId: string;
    previousAssignee?: string;
    newAssignee: string;
    assignedBy: string;
  };
}

export interface ActivityArchivedEvent extends DomainEvent {
  type: 'activity.archived';
  aggregate: 'activity';
  data: {
    activityId: string;
    reason: string;
    archivedBy: string;
  };
}

// Incident domain events
export interface IncidentCreatedEvent extends DomainEvent {
  type: 'incident.created';
  aggregate: 'incident';
  data: {
    incidentId: string;
    triggerActivityId: string;
    incidentType: string;
    priority: string;
    autoCreated: boolean;
    requiresValidation: boolean;
    creationRule?: string;
  };
}

export interface IncidentValidatedEvent extends DomainEvent {
  type: 'incident.validated';
  aggregate: 'incident';
  data: {
    incidentId: string;
    validationStatus: 'approved' | 'dismissed';
    validatedBy: string;
    validationReason?: string;
  };
}

export interface IncidentEscalatedEvent extends DomainEvent {
  type: 'incident.escalated';
  aggregate: 'incident';
  data: {
    incidentId: string;
    escalationLevel: number;
    escalatedBy: string;
    escalationTarget: string;
  };
}

// Case domain events
export interface CaseCreatedEvent extends DomainEvent {
  type: 'case.created';
  aggregate: 'case';
  data: {
    caseId: string;
    caseType: string;
    priority: string;
    leadInvestigator: string;
    relatedIncidents: string[];
    relatedActivities: string[];
  };
}

export interface EvidenceAddedEvent extends DomainEvent {
  type: 'case.evidence_added';
  aggregate: 'case';
  data: {
    caseId: string;
    evidenceId: string;
    evidenceType: string;
    addedBy: string;
    chainOfCustody: {
      custodian: string;
      timestamp: Date;
      location: string;
    };
  };
}

// Union type of all domain events
export type AllDomainEvents = 
  | ActivityCreatedEvent
  | ActivityStatusUpdatedEvent
  | ActivityAssignedEvent
  | ActivityArchivedEvent
  | IncidentCreatedEvent
  | IncidentValidatedEvent
  | IncidentEscalatedEvent
  | CaseCreatedEvent
  | EvidenceAddedEvent;

// Event subscription callback type
export type EventCallback<T extends DomainEvent = AllDomainEvents> = (event: T) => void;

// Event filter for subscriptions
export interface EventFilter {
  aggregate?: string;
  type?: string;
  aggregateId?: string;
  userId?: string;
  fromTimestamp?: Date;
  toTimestamp?: Date;
}

// Subscription interface
export interface Subscription {
  id: string;
  filter?: EventFilter;
  callback: EventCallback;
  created: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

// Event store for replay capabilities
export interface EventStore {
  events: AllDomainEvents[];
  maxSize: number;
  addEvent(event: AllDomainEvents): void;
  getEvents(filter?: EventFilter): AllDomainEvents[];
  getEventsByAggregate(aggregate: string, aggregateId: string): AllDomainEvents[];
  clear(): void;
}

// Main EventBus class
export class EventBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventStore: EventStore;
  private debugMode: boolean = false;

  constructor(options?: {
    maxEventStoreSize?: number;
    debugMode?: boolean;
  }) {
    this.debugMode = options?.debugMode || false;
    
    // Initialize event store
    this.eventStore = {
      events: [],
      maxSize: options?.maxEventStoreSize || 1000,
      
      addEvent: (event: AllDomainEvents) => {
        this.eventStore.events.push(event);
        
        // Maintain max size by removing oldest events
        if (this.eventStore.events.length > this.eventStore.maxSize) {
          this.eventStore.events = this.eventStore.events.slice(-this.eventStore.maxSize);
        }
      },
      
      getEvents: (filter?: EventFilter) => {
        if (!filter) return [...this.eventStore.events];
        
        return this.eventStore.events.filter(event => {
          if (filter.aggregate && event.aggregate !== filter.aggregate) return false;
          if (filter.type && event.type !== filter.type) return false;
          if (filter.aggregateId && event.aggregateId !== filter.aggregateId) return false;
          if (filter.userId && event.userId !== filter.userId) return false;
          if (filter.fromTimestamp && event.timestamp < filter.fromTimestamp) return false;
          if (filter.toTimestamp && event.timestamp > filter.toTimestamp) return false;
          return true;
        });
      },
      
      getEventsByAggregate: (aggregate: string, aggregateId: string) => {
        return this.eventStore.events.filter(
          event => event.aggregate === aggregate && event.aggregateId === aggregateId
        );
      },
      
      clear: () => {
        this.eventStore.events = [];
      }
    };
  }

  /**
   * Publish an event to all matching subscribers
   */
  publish<T extends AllDomainEvents>(event: T): void {
    // Add to event store for replay
    this.eventStore.addEvent(event);
    
    if (this.debugMode) {
      console.log(`[EventBus] Publishing event: ${event.type}`, event);
    }

    // Notify all matching subscribers
    for (const subscription of this.subscriptions.values()) {
      if (this.eventMatchesFilter(event, subscription.filter)) {
        try {
          subscription.callback(event);
          subscription.lastTriggered = new Date();
          subscription.triggerCount++;
        } catch (error) {
          console.error(`[EventBus] Error in event handler for ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to events with optional filtering
   */
  subscribe<T extends AllDomainEvents>(
    callback: EventCallback<T>,
    filter?: EventFilter
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: Subscription = {
      id: subscriptionId,
      filter,
      callback: callback as EventCallback,
      created: new Date(),
      triggerCount: 0
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    if (this.debugMode) {
      console.log(`[EventBus] Created subscription: ${subscriptionId}`, filter);
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    
    if (this.debugMode && removed) {
      console.log(`[EventBus] Removed subscription: ${subscriptionId}`);
    }
    
    return removed;
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    totalSubscriptions: number;
    subscriptionsByAggregate: Record<string, number>;
    subscriptionsByType: Record<string, number>;
  } {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByAggregate: {} as Record<string, number>,
      subscriptionsByType: {} as Record<string, number>
    };

    for (const subscription of this.subscriptions.values()) {
      if (subscription.filter) {
        if (subscription.filter.aggregate) {
          stats.subscriptionsByAggregate[subscription.filter.aggregate] = 
            (stats.subscriptionsByAggregate[subscription.filter.aggregate] || 0) + 1;
        }
        if (subscription.filter.type) {
          stats.subscriptionsByType[subscription.filter.type] = 
            (stats.subscriptionsByType[subscription.filter.type] || 0) + 1;
        }
      }
    }

    return stats;
  }

  /**
   * Get event replay for debugging
   */
  getEventHistory(filter?: EventFilter): AllDomainEvents[] {
    return this.eventStore.getEvents(filter);
  }

  /**
   * Get events for a specific aggregate
   */
  getAggregateHistory(aggregate: string, aggregateId: string): AllDomainEvents[] {
    return this.eventStore.getEventsByAggregate(aggregate, aggregateId);
  }

  /**
   * Clear all subscriptions and event history
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventStore.clear();
    
    if (this.debugMode) {
      console.log('[EventBus] Cleared all subscriptions and events');
    }
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get health status of the event bus
   */
  getHealthStatus(): {
    isHealthy: boolean;
    totalSubscriptions: number;
    totalEvents: number;
    oldestEvent?: Date;
    newestEvent?: Date;
    memoryUsage: number;
  } {
    const events = this.eventStore.events;
    
    return {
      isHealthy: true,
      totalSubscriptions: this.subscriptions.size,
      totalEvents: events.length,
      oldestEvent: events.length > 0 ? events[0].timestamp : undefined,
      newestEvent: events.length > 0 ? events[events.length - 1].timestamp : undefined,
      memoryUsage: JSON.stringify([...this.subscriptions.values(), ...events]).length
    };
  }

  private eventMatchesFilter(event: AllDomainEvents, filter?: EventFilter): boolean {
    if (!filter) return true;
    
    if (filter.aggregate && event.aggregate !== filter.aggregate) return false;
    if (filter.type && event.type !== filter.type) return false;
    if (filter.aggregateId && event.aggregateId !== filter.aggregateId) return false;
    if (filter.userId && event.userId !== filter.userId) return false;
    if (filter.fromTimestamp && event.timestamp < filter.fromTimestamp) return false;
    if (filter.toTimestamp && event.timestamp > filter.toTimestamp) return false;
    
    return true;
  }
}

// Singleton instance for global use
export const eventBus = new EventBus({
  maxEventStoreSize: 1000,
  debugMode: process.env.NODE_ENV === 'development'
});

// Helper functions for common event creation
export const createActivityEvent = {
  created: (data: ActivityCreatedEvent['data'], userId?: string): ActivityCreatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'activity.created',
    aggregate: 'activity',
    aggregateId: data.activityId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  statusUpdated: (data: ActivityStatusUpdatedEvent['data'], userId?: string): ActivityStatusUpdatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'activity.status_updated',
    aggregate: 'activity',
    aggregateId: data.activityId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  assigned: (data: ActivityAssignedEvent['data'], userId?: string): ActivityAssignedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'activity.assigned',
    aggregate: 'activity',
    aggregateId: data.activityId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  archived: (data: ActivityArchivedEvent['data'], userId?: string): ActivityArchivedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'activity.archived',
    aggregate: 'activity',
    aggregateId: data.activityId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  })
};

export const createIncidentEvent = {
  created: (data: IncidentCreatedEvent['data'], userId?: string): IncidentCreatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'incident.created',
    aggregate: 'incident',
    aggregateId: data.incidentId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  validated: (data: IncidentValidatedEvent['data'], userId?: string): IncidentValidatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'incident.validated',
    aggregate: 'incident',
    aggregateId: data.incidentId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  escalated: (data: IncidentEscalatedEvent['data'], userId?: string): IncidentEscalatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'incident.escalated',
    aggregate: 'incident',
    aggregateId: data.incidentId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  })
};

export const createCaseEvent = {
  created: (data: CaseCreatedEvent['data'], userId?: string): CaseCreatedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'case.created',
    aggregate: 'case',
    aggregateId: data.caseId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  }),
  
  evidenceAdded: (data: EvidenceAddedEvent['data'], userId?: string): EvidenceAddedEvent => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'case.evidence_added',
    aggregate: 'case',
    aggregateId: data.caseId,
    timestamp: new Date(),
    version: 1,
    userId,
    data
  })
};