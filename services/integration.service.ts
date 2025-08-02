/**
 * 🔌 INTEGRATION SERVICE
 * 
 * This is your "Universal Adapter" for external systems!
 * Think of it as a "Language Translator" that converts
 * external system events into your internal format.
 * 
 * 🎯 HANDLES:
 * - Lenel Access Control events
 * - Ambient AI detections  
 * - Future integrations (cameras, sensors, etc.)
 */

import { ActivityTypeMapper, ActivityTypeConfig } from '../lib/config/activity-types.config';
import { EnterpriseActivity } from '../lib/types/activity';
import { Incident } from '../lib/types/incident';
import { Case } from '../lib/types/case';
import { CreatePassdownRequest, RelatedEntity } from '../lib/types/passdown';
import { 
  createPassdownFromActivity,
  createPassdownFromIncident,
  createPassdownFromCase,
  generateActionItemsForEntity
} from '../lib/integrations/passdown-integrations';

/**
 * External system event interface
 */
export interface ExternalEvent {
  // Source system identifier
  systemName: string;
  
  // External event type (e.g., "ACCESS_DENIED", "TAILGATING_DETECTED")
  externalType: string;
  
  // Event timestamp
  timestamp: Date;
  
  // Location information
  location: string;
  
  // Raw event data from external system
  rawData: Record<string, any>;
  
  // Optional fields
  confidence?: number;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Integration result
 */
export interface IntegrationResult {
  success: boolean;
  internalActivity?: Partial<EnterpriseActivity>;
  error?: string;
  warnings?: string[];
}

/**
 * 🚀 THE INTEGRATION SERVICE
 */
export class IntegrationService {
  
  /**
   * 🔄 MAIN INTEGRATION METHOD
   * Converts external system events to internal activities
   */
  static processExternalEvent(event: ExternalEvent): IntegrationResult {
    try {
      // Step 1: Map external type to internal type
      const internalType = ActivityTypeMapper.mapExternalToInternal(
        event.externalType, 
        event.systemName
      );

      if (!internalType) {
        return {
          success: false,
          error: `Unknown activity type: ${event.externalType} from system: ${event.systemName}`
        };
      }

      // Step 2: Get configuration for this type
      const config = ActivityTypeMapper.getConfig(internalType);
      if (!config) {
        return {
          success: false,
          error: `No configuration found for internal type: ${internalType}`
        };
      }

      // Step 3: Build internal activity
      const activity = this.buildInternalActivity(event, internalType, config);

      // Step 4: Apply business rules
      const enrichedActivity = this.applyBusinessRules(activity, config);

      return {
        success: true,
        internalActivity: enrichedActivity,
        warnings: this.generateWarnings(event, config)
      };

    } catch (error) {
      return {
        success: false,
        error: `Integration failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 🏗️ BUILD INTERNAL ACTIVITY
   * Converts external event to internal activity format
   */
  private static buildInternalActivity(
    event: ExternalEvent,
    internalType: string,
    config: ActivityTypeConfig
  ): Partial<EnterpriseActivity> {
    
    const baseActivity: Partial<EnterpriseActivity> = {
      // Core fields
      type: internalType as any,
      title: this.generateTitle(event, config),
      location: event.location,
      timestamp: event.timestamp,
      
      // System tracking
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
      
      // Integration metadata - store in description for now
      description: event.description || this.generateTitle(event, config),
      
      // 🎯 PRESERVE RAW EXTERNAL DATA FOR DISPLAY
      externalData: {
        sourceSystem: event.systemName,
        originalType: event.externalType,
        rawPayload: event.rawData,
        processingTimestamp: new Date().toISOString(),
        mappingUsed: `${event.systemName} -> ${internalType}`,
        originalEvent: {
          type: event.externalType,
          timestamp: event.timestamp,
          location: event.location,
          confidence: event.confidence,
          ...event.rawData
        }
      }
    };

    // Add system-specific fields
    switch (event.systemName) {
      case 'lenel':
        return this.enrichLenelActivity(baseActivity, event);
      
      case 'ambientAI':
        return this.enrichAmbientAIActivity(baseActivity, event);
      
      default:
        return baseActivity;
    }
  }

  /**
   * 🔒 LENEL ACCESS CONTROL ENRICHMENT
   */
  private static enrichLenelActivity(
    activity: Partial<EnterpriseActivity>,
    event: ExternalEvent
  ): Partial<EnterpriseActivity> {
    
    const lenelData = event.rawData;
    
    return {
      ...activity,
      description: this.generateLenelDescription(event.externalType, lenelData),
      
      // Set priority based on Lenel event type
      priority: this.getLenelPriority(event.externalType),
      
      // Set initial status
      status: 'detecting',
      
      // Add source system tag
      system_tags: [
        ...(activity.system_tags || []),
        `source-${event.systemName.toLowerCase()}`
      ]
    };
  }

  /**
   * 🤖 AMBIENT AI ENRICHMENT
   */
  private static enrichAmbientAIActivity(
    activity: Partial<EnterpriseActivity>,
    event: ExternalEvent
  ): Partial<EnterpriseActivity> {
    
    const aiData = event.rawData;
    
    return {
      ...activity,
      description: this.generateAIDescription(event.externalType, aiData),
      confidence: event.confidence || aiData.confidence || 0.8,
      
      // Set priority based on AI confidence and type
      priority: this.getAIPriority(event.externalType, event.confidence || 0.8),
      
      // Set initial status
      status: 'detecting'
    };
  }

  /**
   * 📋 BUSINESS RULES APPLICATION
   */
  private static applyBusinessRules(
    activity: Partial<EnterpriseActivity>,
    config: ActivityTypeConfig
  ): Partial<EnterpriseActivity> {
    
    const rules = config.businessRules;
    
    return {
      ...activity,
      
      // Apply configured priority if not already set
      priority: activity.priority || rules.priority,
      
      // Add system tags
      system_tags: [
        ...(activity.system_tags || []),
        ...rules.tags,
        'auto-generated',
        'external-integration'
      ]
    };
  }

  /**
   * 🏷️ TITLE GENERATION
   */
  private static generateTitle(event: ExternalEvent, config: ActivityTypeConfig): string {
    const baseTitle = config.displayName;
    const location = event.location;
    const time = event.timestamp.toLocaleTimeString();
    
    return `${baseTitle} at ${location} (${time})`;
  }

  /**
   * 📝 DESCRIPTION GENERATORS
   */
  private static generateLenelDescription(externalType: string, data: any): string {
    switch (externalType) {
      case 'ACCESS_DENIED':
        return `Access denied at ${data.accessPoint || 'unknown location'}. Card: ${data.cardId || 'unknown'}`;
      
      case 'TAILGATE':
        return `Tailgating detected at ${data.accessPoint || 'unknown location'}. Multiple persons detected.`;
      
      case 'FORCED_ENTRY':
        return `Forced entry detected at ${data.accessPoint || 'unknown location'}. Door opened without valid access.`;
      
      default:
        return `Lenel event: ${externalType}`;
    }
  }

  private static generateAIDescription(externalType: string, data: any): string {
    switch (externalType) {
      case 'TAILGATING_DETECTED':
        return `AI detected tailgating behavior. Confidence: ${(data.confidence * 100).toFixed(1)}%`;
      
      case 'UNAUTHORIZED_PERSON':
        return `AI detected unauthorized person in restricted area. Confidence: ${(data.confidence * 100).toFixed(1)}%`;
      
      case 'WEAPON_DETECTED':
        return `AI detected potential weapon. Confidence: ${(data.confidence * 100).toFixed(1)}%`;
      
      default:
        return `AI detection: ${externalType}`;
    }
  }

  /**
   * 🎯 PRIORITY CALCULATORS
   */
  private static getLenelPriority(externalType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (externalType) {
      case 'FORCED_ENTRY':
      case 'CARD_CLONING':
        return 'critical';
      
      case 'ACCESS_DENIED':
      case 'TAILGATE':
        return 'high';
      
      default:
        return 'medium';
    }
  }

  private static getAIPriority(externalType: string, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    // High confidence + critical detection = critical priority
    if (confidence > 0.9 && ['WEAPON_DETECTED', 'UNAUTHORIZED_PERSON'].includes(externalType)) {
      return 'critical';
    }
    
    // High confidence = high priority
    if (confidence > 0.8) {
      return 'high';
    }
    
    // Medium confidence = medium priority
    if (confidence > 0.6) {
      return 'medium';
    }
    
    // Low confidence = low priority
    return 'low';
  }

  /**
   * ⚠️ WARNING GENERATION
   */
  private static generateWarnings(event: ExternalEvent, config: ActivityTypeConfig): string[] {
    const warnings: string[] = [];
    
    // Check for missing optional fields
    if (event.systemName === 'ambientAI' && !event.confidence) {
      warnings.push('AI event missing confidence score');
    }
    
    // Check for old events
    const eventAge = Date.now() - event.timestamp.getTime();
    if (eventAge > 5 * 60 * 1000) { // 5 minutes
      warnings.push(`Event is ${Math.round(eventAge / 60000)} minutes old`);
    }
    
    return warnings;
  }

  /**
   * 🔗 CROSS-MODULE INTEGRATION METHODS
   * These methods handle integration between internal modules
   */

  /**
   * Create a passdown from an activity
   */
  static createPassdownFromActivity(activity: EnterpriseActivity): CreatePassdownRequest {
    const passdownData = createPassdownFromActivity(activity);
    const actionItems = generateActionItemsForEntity('activity', activity);
    
    return {
      ...passdownData,
      actionItems,
      shiftDate: passdownData.shiftDate || new Date().toISOString().split('T')[0],
      fromShift: passdownData.fromShift || this.getCurrentShift(),
      toShift: passdownData.toShift || this.getNextShift(this.getCurrentShift())
    } as CreatePassdownRequest;
  }

  /**
   * Create a passdown from an incident
   */
  static createPassdownFromIncident(incident: Incident): CreatePassdownRequest {
    const passdownData = createPassdownFromIncident(incident);
    const actionItems = generateActionItemsForEntity('incident', incident);
    
    return {
      ...passdownData,
      actionItems,
      shiftDate: passdownData.shiftDate || new Date().toISOString().split('T')[0],
      fromShift: passdownData.fromShift || this.getCurrentShift(),
      toShift: passdownData.toShift || this.getNextShift(this.getCurrentShift())
    } as CreatePassdownRequest;
  }

  /**
   * Create a passdown from a case
   */
  static createPassdownFromCase(caseItem: Case): CreatePassdownRequest {
    const passdownData = createPassdownFromCase(caseItem);
    const actionItems = generateActionItemsForEntity('case', caseItem);
    
    return {
      ...passdownData,
      actionItems,
      shiftDate: passdownData.shiftDate || new Date().toISOString().split('T')[0],
      fromShift: passdownData.fromShift || this.getCurrentShift(),
      toShift: passdownData.toShift || this.getNextShift(this.getCurrentShift())
    } as CreatePassdownRequest;
  }

  /**
   * Get current shift based on time
   */
  private static getCurrentShift(): 'night' | 'day' | 'evening' | 'swing' {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 7) return 'night';
    if (hour >= 7 && hour < 15) return 'day';
    if (hour >= 15 && hour < 23) return 'evening';
    return 'day';
  }

  /**
   * Get next shift in rotation
   */
  private static getNextShift(currentShift: 'night' | 'day' | 'evening' | 'swing'): 'night' | 'day' | 'evening' | 'swing' {
    switch (currentShift) {
      case 'night': return 'day';
      case 'day': return 'evening';
      case 'evening': return 'night';
      default: return 'day';
    }
  }
}

/**
 * 🎯 USAGE EXAMPLES:
 * 
 * // Lenel Access Control Event
 * const lenelEvent: ExternalEvent = {
 *   systemName: 'lenel',
 *   externalType: 'ACCESS_DENIED',
 *   timestamp: new Date(),
 *   location: 'Building A - Main Entrance',
 *   rawData: {
 *     accessPoint: 'DOOR_001',
 *     cardId: '12345',
 *     personId: 'EMP_001'
 *   }
 * };
 * 
 * const result = IntegrationService.processExternalEvent(lenelEvent);
 * // Result: Internal activity of type "security-breach"
 * 
 * // Ambient AI Event
 * const aiEvent: ExternalEvent = {
 *   systemName: 'ambientAI',
 *   externalType: 'TAILGATING_DETECTED',
 *   timestamp: new Date(),
 *   location: 'Building B - Side Entrance',
 *   confidence: 0.92,
 *   rawData: {
 *     camera_id: 'CAM_005',
 *     zone: 'entrance_zone',
 *     image_url: 'https://...'
 *   }
 * };
 * 
 * const result2 = IntegrationService.processExternalEvent(aiEvent);
 * // Result: Internal activity of type "access-violation"
 */