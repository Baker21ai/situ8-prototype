/**
 * Create Activity Use Case
 * Handles the business logic for creating new activities
 */

import { Activity, ActivityFactory } from '../entities/Activity';
import { IActivityRepository } from '../repositories/IActivityRepository';
import { Priority } from '../../../../lib/utils/status';
import { ActivityType } from '../../../../lib/utils/security';

// Command object for creating activity
export interface CreateActivityCommand {
  type: ActivityType;
  title: string;
  location: string;
  priority: Priority;
  description?: string;
  building?: string;
  zone?: string;
  floor?: string;
  confidence?: number;
  detectedObjects?: string[];
  assignedTo?: string;
  badgeHolder?: {
    name: string;
    id: string;
    department?: string;
    clearanceLevel?: string;
  };
  externalData?: {
    sourceSystem: string;
    originalType: string;
    rawPayload: Record<string, any>;
    processingTimestamp: string;
    mappingUsed: string;
    originalEvent: Record<string, any>;
  };
  metadata?: {
    site: string;
    siteCode: string;
    region: string;
    facilityType: string;
    coordinates: { lat: number; lng: number };
    securityLevel: string;
    operationalHours: string;
  };
  createdBy: string;
}

export interface CreateActivityResult {
  success: boolean;
  activity?: Activity;
  error?: string;
  validationErrors?: string[];
}

export class CreateActivityUseCase {
  constructor(
    private activityRepository: IActivityRepository
  ) {}

  async execute(command: CreateActivityCommand): Promise<CreateActivityResult> {
    try {
      // Validate command
      const validationErrors = this.validateCommand(command);
      if (validationErrors.length > 0) {
        return {
          success: false,
          validationErrors
        };
      }

      // Check for duplicates (same title, location, and timestamp within 5 minutes)
      const isDuplicate = await this.checkForDuplicate(command);
      if (isDuplicate) {
        return {
          success: false,
          error: 'Duplicate activity detected within 5 minutes'
        };
      }

      // Create activity based on source
      let activity: Activity;
      
      if (command.externalData) {
        // Activity from external system
        activity = ActivityFactory.createFromExternalSystem({
          externalData: command.externalData,
          type: command.type,
          title: command.title,
          location: command.location,
          priority: command.priority,
          created_by: command.createdBy,
          confidence: command.confidence,
          building: command.building,
          zone: command.zone
        });
      } else {
        // Manual activity
        activity = ActivityFactory.createManual({
          type: command.type,
          title: command.title,
          location: command.location,
          priority: command.priority,
          created_by: command.createdBy,
          description: command.description,
          building: command.building,
          zone: command.zone
        });
      }

      // Apply additional properties
      if (command.assignedTo) {
        activity.assignTo(command.assignedTo, command.createdBy);
      }

      // Validate the created activity
      if (!activity.isValid()) {
        return {
          success: false,
          error: 'Created activity is invalid'
        };
      }

      // Auto-escalate critical activities
      if (command.priority === 'critical') {
        activity.escalate(1, 'system');
      }

      // Persist the activity
      const savedActivity = await this.activityRepository.create(activity);

      return {
        success: true,
        activity: savedActivity
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateCommand(command: CreateActivityCommand): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!command.type) {
      errors.push('Activity type is required');
    }

    if (!command.title?.trim()) {
      errors.push('Title is required');
    }

    if (!command.location?.trim()) {
      errors.push('Location is required');
    }

    if (!command.priority) {
      errors.push('Priority is required');
    }

    if (!command.createdBy?.trim()) {
      errors.push('Created by user ID is required');
    }

    // Business rule validations
    if (command.title && command.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }

    if (command.description && command.description.length > 2000) {
      errors.push('Description must be 2000 characters or less');
    }

    if (command.confidence !== undefined && (command.confidence < 0 || command.confidence > 100)) {
      errors.push('Confidence must be between 0 and 100');
    }

    // External data validation
    if (command.externalData) {
      if (!command.externalData.sourceSystem?.trim()) {
        errors.push('External data source system is required');
      }
      if (!command.externalData.originalType?.trim()) {
        errors.push('External data original type is required');
      }
    }

    return errors;
  }

  private async checkForDuplicate(command: CreateActivityCommand): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentActivities = await this.activityRepository.findMany({
      timeRange: {
        start: fiveMinutesAgo,
        end: new Date()
      },
      limit: 100
    });

    // Check for activities with same title and location
    return recentActivities.some(activity => 
      activity.title.toLowerCase() === command.title.toLowerCase() &&
      activity.location.toLowerCase() === command.location.toLowerCase()
    );
  }
}

// Convenience function for common use cases
export class ActivityCreationHelper {
  constructor(private createActivityUseCase: CreateActivityUseCase) {}

  async createFromWebhook(webhookData: {
    sourceSystem: string;
    eventType: string;
    payload: Record<string, any>;
    location: string;
    building?: string;
    zone?: string;
  }, createdBy: string = 'system'): Promise<CreateActivityResult> {
    
    // Map webhook data to activity
    const activityType = this.mapEventTypeToActivityType(webhookData.eventType);
    const priority = this.determinePriorityFromPayload(webhookData.payload);
    const title = this.generateTitleFromPayload(webhookData.payload, webhookData.eventType);
    
    return this.createActivityUseCase.execute({
      type: activityType,
      title,
      location: webhookData.location,
      priority,
      building: webhookData.building,
      zone: webhookData.zone,
      externalData: {
        sourceSystem: webhookData.sourceSystem,
        originalType: webhookData.eventType,
        rawPayload: webhookData.payload,
        processingTimestamp: new Date().toISOString(),
        mappingUsed: 'webhook-v1',
        originalEvent: webhookData
      },
      createdBy
    });
  }

  async createManualActivity(data: {
    type: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    description?: string;
    building?: string;
    zone?: string;
    assignedTo?: string;
  }, createdBy: string): Promise<CreateActivityResult> {
    
    return this.createActivityUseCase.execute({
      ...data,
      createdBy
    });
  }

  async createFromSecurityAlert(alertData: {
    cameraId: string;
    location: string;
    building: string;
    zone: string;
    alertType: string;
    confidence: number;
    detectedObjects: string[];
    badgeHolder?: {
      name: string;
      id: string;
      department?: string;
    };
  }, createdBy: string = 'security-system'): Promise<CreateActivityResult> {
    
    const priority = alertData.confidence > 90 ? 'critical' : 
                    alertData.confidence > 70 ? 'high' : 'medium';
    
    return this.createActivityUseCase.execute({
      type: this.mapAlertTypeToActivityType(alertData.alertType),
      title: `Security Alert: ${alertData.alertType}`,
      location: alertData.location,
      priority,
      building: alertData.building,
      zone: alertData.zone,
      confidence: alertData.confidence,
      detectedObjects: alertData.detectedObjects,
      badgeHolder: alertData.badgeHolder,
      externalData: {
        sourceSystem: 'security-camera-system',
        originalType: alertData.alertType,
        rawPayload: alertData,
        processingTimestamp: new Date().toISOString(),
        mappingUsed: 'security-alert-v1',
        originalEvent: alertData
      },
      createdBy
    });
  }

  private mapEventTypeToActivityType(eventType: string): ActivityType {
    const mapping: Record<string, ActivityType> = {
      'medical_emergency': 'medical',
      'security_breach': 'security-breach',
      'access_violation': 'security-breach',
      'equipment_malfunction': 'property-damage',
      'fire_alarm': 'alert',
      'evacuation': 'alert',
      'patrol_checkpoint': 'patrol',
      'suspicious_activity': 'alert'
    };
    
    return mapping[eventType] || 'alert';
  }

  private mapAlertTypeToActivityType(alertType: string): ActivityType {
    const mapping: Record<string, ActivityType> = {
      'tailgating': 'security-breach',
      'unauthorized_access': 'security-breach',
      'loitering': 'alert',
      'weapon_detection': 'security-breach',
      'medical_emergency': 'medical',
      'fall_detection': 'medical',
      'equipment_damage': 'property-damage'
    };
    
    return mapping[alertType] || 'alert';
  }

  private determinePriorityFromPayload(payload: Record<string, any>): Priority {
    // Business rules for priority determination
    if (payload.severity === 'critical' || payload.emergency === true) {
      return 'critical';
    }
    
    if (payload.severity === 'high' || payload.confidence > 85) {
      return 'high';
    }
    
    if (payload.severity === 'medium' || payload.confidence > 60) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateTitleFromPayload(payload: Record<string, any>, eventType: string): string {
    // Generate descriptive titles based on payload content
    if (payload.title) {
      return payload.title;
    }
    
    if (payload.description) {
      return payload.description.substring(0, 100);
    }
    
    // Fallback to event type with some payload info
    const context = payload.location || payload.building || payload.zone || '';
    return `${eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}${context ? ' - ' + context : ''}`;
  }
}