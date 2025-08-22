/**
 * Activity Event Handler
 * Subscribes to activity domain events and coordinates with other services
 */

import { eventBus } from './EventBus';
import { 
  ActivityStatusChangedEvent, 
  ActivityAssignedEvent, 
  ActivityEscalatedEvent,
  ActivityCreatedEvent
} from './DomainEvent';

export class ActivityEventHandler {
  private static instance: ActivityEventHandler;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  private constructor() {
    this.setupEventHandlers();
  }

  static getInstance(): ActivityEventHandler {
    if (!ActivityEventHandler.instance) {
      ActivityEventHandler.instance = new ActivityEventHandler();
    }
    return ActivityEventHandler.instance;
  }

  private setupEventHandlers(): void {
    // Subscribe to ActivityCreated events
    this.subscriptions.push(
      eventBus.subscribe<ActivityCreatedEvent>('ActivityCreated', async (event) => {
        console.log('🎯 New activity created:', event.payload.title);
        
        // Notify incident service to check if this should become an incident
        if (event.payload.priority === 'critical' || event.payload.priority === 'high') {
          console.log('🚨 High priority activity - checking for incident creation');
          // TODO: Call incident service to evaluate
        }
        
        // Notify BOL service to check for matches
        console.log('🔍 Checking BOL matches for new activity');
        // TODO: Call BOL service to check patterns
      })
    );

    // Subscribe to ActivityStatusChanged events
    this.subscriptions.push(
      eventBus.subscribe<ActivityStatusChangedEvent>('ActivityStatusChanged', async (event) => {
        console.log(`📊 Activity ${event.payload.activityId} status changed: ${event.payload.oldStatus} → ${event.payload.newStatus}`);
        
        // Notify audit service
        console.log('📝 Recording status change in audit log');
        // TODO: Call audit service
        
        // If resolved, check if related incidents should be updated
        if (event.payload.newStatus === 'resolved') {
          console.log('✅ Activity resolved - checking related incidents');
          // TODO: Update related incidents
        }
      })
    );

    // Subscribe to ActivityAssigned events
    this.subscriptions.push(
      eventBus.subscribe<ActivityAssignedEvent>('ActivityAssigned', async (event) => {
        console.log(`👤 Activity ${event.payload.activityId} assigned to ${event.payload.assignedTo}`);
        
        // Notify the assigned user
        console.log('📧 Notifying assigned user');
        // TODO: Send notification
        
        // Update guard status if assigned to a guard
        console.log('🛡️ Updating guard status');
        // TODO: Update guard store
      })
    );

    // Subscribe to ActivityEscalated events
    this.subscriptions.push(
      eventBus.subscribe<ActivityEscalatedEvent>('ActivityEscalated', async (event) => {
        console.log(`⬆️ Activity ${event.payload.activityId} escalated to level ${event.payload.newLevel}`);
        
        // Notify supervisors
        console.log('🚨 Notifying supervisors of escalation');
        // TODO: Send escalation notifications
        
        // Create incident if escalation is high enough
        if (event.payload.newLevel >= 3) {
          console.log('🔥 High escalation - creating incident');
          // TODO: Create incident
        }
      })
    );

    console.log('✅ Activity event handlers initialized');
  }

  /**
   * Clean up event subscriptions
   */
  destroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}

// Initialize the event handler
export const activityEventHandler = ActivityEventHandler.getInstance();