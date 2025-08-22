/**
 * Event Bus
 * Centralized event publishing and subscription system
 */

import { DomainEvent, EventHandler, EventSubscription } from './DomainEvent';

// Feature flag to enable/disable domain events
const DOMAIN_EVENTS_ENABLED = import.meta.env.VITE_ENABLE_DOMAIN_EVENTS === 'true' || false;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 100; // Keep last 100 events
  private isEnabled = DOMAIN_EVENTS_ENABLED;

  private constructor() {
    if (this.isEnabled) {
      console.log('🚌 EventBus: Domain events enabled');
    }
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Enable or disable event bus
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🚌 EventBus: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.isEnabled) {
      return { unsubscribe: () => {} };
    }

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(handler: EventHandler): EventSubscription {
    return this.subscribe('*' as any, handler);
  }

  /**
   * Publish an event
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // Add to history
    this.addToHistory(event);

    // Get handlers for this event type
    const handlers = this.handlers.get(event.type) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();

    // Execute all handlers
    const allHandlers = [...handlers, ...wildcardHandlers];
    
    // Execute handlers asynchronously but don't wait
    Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      })
    ).catch(error => {
      console.error('Error publishing event:', error);
    });

    // Log event in development
    if (import.meta.env.DEV) {
      console.log(`📢 Event published: ${event.type}`, event);
    }
  }

  /**
   * Publish multiple events
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Get event history
   */
  getHistory(): DomainEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get events for a specific aggregate
   */
  getAggregateHistory(aggregateId: string): DomainEvent[] {
    return this.eventHistory.filter(event => event.aggregateId === aggregateId);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get handler count for debugging
   */
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size || 0;
    }
    
    let total = 0;
    this.handlers.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }

  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);
    
    // Keep only the last N events
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const eventBus = EventBus.getInstance();

// Convenience function for publishing events
export function publishEvent<T extends DomainEvent>(event: T): void {
  eventBus.publish(event).catch(error => {
    console.error('Failed to publish event:', error);
  });
}

// Convenience function for subscribing to events
export function subscribeToEvent<T extends DomainEvent>(
  eventType: T['type'],
  handler: EventHandler<T>
): EventSubscription {
  return eventBus.subscribe(eventType, handler);
}