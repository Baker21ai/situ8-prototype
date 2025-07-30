/**
 * BOL (Be On Lookout) Service
 * Implements business logic for BOL alerts including confidence scoring,
 * auto-expiration, and real-time matching per the Situ8 business logic specification
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  StatusTransitionRule,
  ServiceMethod,
  ServiceListMethod,
  ServiceBooleanMethod,
  QueryOptions
} from './types';
import { BOLAlert } from '../lib/types/bol';
import { EnterpriseActivity } from '../lib/types/activity';
import { Priority, Status } from '../lib/utils/status';
import { useBOLStore } from '../stores/bolStore';
import { useActivityStore } from '../stores/activityStore';
import { useAuditStore } from '../stores/auditStore';

export class BOLService extends BaseService<BOLAlert, string> {
  private bolStore: ReturnType<typeof useBOLStore.getState>;
  private activityStore: ReturnType<typeof useActivityStore.getState>;
  private auditStore: ReturnType<typeof useAuditStore.getState>;

  // Business logic configuration
  private readonly statusTransitionRules: StatusTransitionRule[] = [
    // Officers: Limited transitions
    { fromStatus: 'active', toStatus: 'matched', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'active', toStatus: 'expired', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    
    // Supervisors/Admins: Full control
    { fromStatus: 'matched', toStatus: 'active', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'expired', toStatus: 'active', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'active', toStatus: 'cancelled', requiredRole: ['supervisor', 'admin'], requiresApproval: false }
  ];

  private readonly confidenceFactors = {
    // Location matching
    exact_location: 0.3,
    nearby_location: 0.15,
    same_building: 0.1,
    same_site: 0.05,
    
    // Time matching
    exact_time: 0.2,
    within_hour: 0.15,
    within_day: 0.1,
    
    // Physical descriptors
    exact_description: 0.25,
    partial_description: 0.15,
    general_description: 0.05,
    
    // Behavioral patterns
    exact_behavior: 0.2,
    similar_behavior: 0.1,
    
    // Vehicle information
    exact_vehicle: 0.3,
    similar_vehicle: 0.15,
    vehicle_color_match: 0.05,
    
    // Witness reliability
    reliable_witness: 0.1,
    multiple_witnesses: 0.15,
    
    // Historical patterns
    repeat_offender: 0.1,
    known_associate: 0.05
  };

  private readonly minimumConfidenceThreshold = 0.6; // 60% confidence required for auto-match

  constructor() {
    super('BOLService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true
    });

    // Get store instances (in real app, these would be injected)
    this.bolStore = useBOLStore.getState();
    this.activityStore = useActivityStore.getState();
    this.auditStore = useAuditStore.getState();
  }

  protected getEntityName(): string {
    return 'BOLAlert';
  }

  protected validateEntity(bol: Partial<BOLAlert>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    const titleError = this.validateRequired(bol.title, 'title');
    if (titleError) errors.push(titleError);

    const typeError = this.validateRequired(bol.type, 'type');
    if (typeError) errors.push(typeError);

    const priorityError = this.validateRequired(bol.priority, 'priority');
    if (priorityError) errors.push(priorityError);

    const statusError = this.validateRequired(bol.status, 'status');
    if (statusError) errors.push(statusError);

    // Enum validation
    if (bol.type) {
      const typeEnumError = this.validateEnum(
        bol.type,
        'type',
        ['person', 'vehicle', 'object', 'behavior', 'activity', 'threat']
      );
      if (typeEnumError) errors.push(typeEnumError);
    }

    if (bol.priority) {
      const priorityEnumError = this.validateEnum(
        bol.priority,
        'priority',
        ['low', 'medium', 'high', 'critical']
      );
      if (priorityEnumError) errors.push(priorityEnumError);
    }

    if (bol.status) {
      const statusEnumError = this.validateEnum(
        bol.status,
        'status',
        ['active', 'matched', 'expired', 'cancelled']
      );
      if (statusEnumError) errors.push(statusEnumError);
    }

    // Title length validation
    if (bol.title) {
      const titleLengthError = this.validateLength(bol.title, 'title', 3, 200);
      if (titleLengthError) errors.push(titleLengthError);
    }

    // Description length validation (if present)
    if (bol.description) {
      const descLengthError = this.validateLength(bol.description, 'description', 0, 2000);
      if (descLengthError) errors.push(descLengthError);
    }

    // Expiry date validation
    if (bol.expires_at && bol.expires_at <= new Date()) {
      errors.push({
        field: 'expires_at',
        code: 'INVALID_EXPIRY',
        message: 'Expiry date must be in the future',
        value: bol.expires_at
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(bol: Partial<BOLAlert>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Auto-expiration rules
    if (operation === 'create') {
      results.push(this.enforceAutoExpirationRules(bol));
    }

    // Status progression rules
    if (operation === 'updateStatus') {
      results.push(...this.enforceStatusProgressionRules(bol));
    }

    // Confidence scoring rules
    if (operation === 'create' || operation === 'update' || operation === 'match') {
      results.push(this.enforceConfidenceScoringRules(bol));
    }

    // Geographic scope rules
    if (operation === 'create' || operation === 'update') {
      results.push(this.enforceGeographicScopeRules(bol));
    }

    return results;
  }

  // Business rule implementations
  private enforceAutoExpirationRules(bol: Partial<BOLAlert>): BusinessRuleResult {
    try {
      if (!bol.expires_at) {
        const now = new Date();
        let expirationHours = 24; // Default 24 hours

        // Adjust expiration based on priority
        switch (bol.priority) {
          case 'critical':
            expirationHours = 72; // 3 days
            break;
          case 'high':
            expirationHours = 48; // 2 days
            break;
          case 'medium':
            expirationHours = 24; // 1 day
            break;
          case 'low':
            expirationHours = 12; // 12 hours
            break;
        }

        bol.expires_at = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      }

      return {
        ruleName: 'auto_expiration',
        passed: true,
        message: `BOL expiration set to ${bol.expires_at?.toISOString()}`
      };
    } catch (error) {
      return {
        ruleName: 'auto_expiration',
        passed: false,
        message: `Auto-expiration failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceStatusProgressionRules(bol: Partial<BOLAlert>): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // This would typically get the current user's role from context
    const userRole = 'officer'; // This should come from AuditContext
    
    if (bol.status) {
      const allowedTransitions = this.statusTransitionRules.filter(rule => 
        rule.requiredRole.includes(userRole)
      );

      results.push({
        ruleName: 'status_progression',
        passed: allowedTransitions.some(rule => rule.toStatus === bol.status),
        message: `Status transition to ${bol.status} ${allowedTransitions.some(rule => rule.toStatus === bol.status) ? 'allowed' : 'denied'} for role ${userRole}`
      });
    }

    return results;
  }

  private enforceConfidenceScoringRules(bol: Partial<BOLAlert>): BusinessRuleResult {
    try {
      // Initialize or validate confidence threshold
      if (!bol.confidence_threshold) {
        bol.confidence_threshold = this.minimumConfidenceThreshold;
      }

      // Ensure confidence threshold is reasonable
      if (bol.confidence_threshold < 0.1 || bol.confidence_threshold > 1.0) {
        return {
          ruleName: 'confidence_scoring',
          passed: false,
          message: 'Confidence threshold must be between 0.1 and 1.0'
        };
      }

      return {
        ruleName: 'confidence_scoring',
        passed: true,
        message: `Confidence threshold set to ${(bol.confidence_threshold * 100).toFixed(1)}%`
      };
    } catch (error) {
      return {
        ruleName: 'confidence_scoring',
        passed: false,
        message: `Confidence scoring failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceGeographicScopeRules(bol: Partial<BOLAlert>): BusinessRuleResult {
    try {
      // Set default geographic scope if not specified
      if (!bol.geographic_scope) {
        bol.geographic_scope = {
          sites: [],
          buildings: [],
          zones: [],
          radius_meters: 1000 // Default 1km radius
        };
      }

      // Validate geographic scope
      const scope = bol.geographic_scope;
      if (scope.sites.length === 0 && scope.buildings.length === 0 && scope.zones.length === 0 && !scope.radius_meters) {
        return {
          ruleName: 'geographic_scope',
          passed: false,
          message: 'BOL must have at least one geographic constraint'
        };
      }

      return {
        ruleName: 'geographic_scope',
        passed: true,
        message: 'Geographic scope configured successfully'
      };
    } catch (error) {
      return {
        ruleName: 'geographic_scope',
        passed: false,
        message: `Geographic scope validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Confidence scoring algorithm
  private calculateMatchConfidence(bol: BOLAlert, activity: EnterpriseActivity): number {
    let confidence = 0;
    const factors: Array<{ factor: string; score: number; weight: number }> = [];

    // Location matching
    if (bol.target_location && activity.location) {
      if (bol.target_location.toLowerCase() === activity.location.toLowerCase()) {
        const score = this.confidenceFactors.exact_location;
        confidence += score;
        factors.push({ factor: 'exact_location', score, weight: this.confidenceFactors.exact_location });
      } else if (this.isNearbyLocation(bol.target_location, activity.location)) {
        const score = this.confidenceFactors.nearby_location;
        confidence += score;
        factors.push({ factor: 'nearby_location', score, weight: this.confidenceFactors.nearby_location });
      }
    }

    // Time matching
    if (bol.target_timeframe && activity.timestamp) {
      const timeMatch = this.calculateTimeMatch(bol.target_timeframe, activity.timestamp);
      confidence += timeMatch.score;
      if (timeMatch.score > 0) {
        factors.push({ factor: timeMatch.factor, score: timeMatch.score, weight: timeMatch.score });
      }
    }

    // Physical descriptors matching
    if (bol.physical_descriptors && activity.description) {
      const descMatch = this.calculateDescriptionMatch(bol.physical_descriptors, activity.description);
      confidence += descMatch.score;
      if (descMatch.score > 0) {
        factors.push({ factor: descMatch.factor, score: descMatch.score, weight: descMatch.score });
      }
    }

    // Behavioral patterns matching
    if (bol.behavioral_indicators && activity.type) {
      const behaviorMatch = this.calculateBehaviorMatch(bol.behavioral_indicators, activity.type);
      confidence += behaviorMatch.score;
      if (behaviorMatch.score > 0) {
        factors.push({ factor: behaviorMatch.factor, score: behaviorMatch.score, weight: behaviorMatch.score });
      }
    }

    // Vehicle information matching
    if (bol.vehicle_info && this.hasVehicleInfo(activity)) {
      const vehicleMatch = this.calculateVehicleMatch(bol.vehicle_info, activity);
      confidence += vehicleMatch.score;
      if (vehicleMatch.score > 0) {
        factors.push({ factor: vehicleMatch.factor, score: vehicleMatch.score, weight: vehicleMatch.score });
      }
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return confidence;
  }

  private isNearbyLocation(location1: string, location2: string): boolean {
    // Simplified location proximity check
    // In a real system, this would use actual geographic coordinates
    const loc1Parts = location1.toLowerCase().split(/[-\s]/);
    const loc2Parts = location2.toLowerCase().split(/[-\s]/);
    
    return loc1Parts.some(part => loc2Parts.some(part2 => 
      part.includes(part2) || part2.includes(part)
    ));
  }

  private calculateTimeMatch(timeframe: any, timestamp: Date): { factor: string; score: number } {
    // Simplified time matching logic
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return { factor: 'within_hour', score: this.confidenceFactors.within_hour };
    } else if (hoursDiff < 24) {
      return { factor: 'within_day', score: this.confidenceFactors.within_day };
    }

    return { factor: 'time_no_match', score: 0 };
  }

  private calculateDescriptionMatch(descriptors: any[], description: string): { factor: string; score: number } {
    // Simplified description matching
    const descLower = description.toLowerCase();
    
    for (const descriptor of descriptors) {
      if (typeof descriptor === 'string' && descLower.includes(descriptor.toLowerCase())) {
        if (descLower === descriptor.toLowerCase()) {
          return { factor: 'exact_description', score: this.confidenceFactors.exact_description };
        } else {
          return { factor: 'partial_description', score: this.confidenceFactors.partial_description };
        }
      }
    }

    return { factor: 'description_no_match', score: 0 };
  }

  private calculateBehaviorMatch(indicators: any[], activityType: string): { factor: string; score: number } {
    // Simplified behavior matching
    for (const indicator of indicators) {
      if (typeof indicator === 'string' && indicator.toLowerCase() === activityType.toLowerCase()) {
        return { factor: 'exact_behavior', score: this.confidenceFactors.exact_behavior };
      }
    }

    return { factor: 'behavior_no_match', score: 0 };
  }

  private hasVehicleInfo(activity: EnterpriseActivity): boolean {
    // Check if activity contains vehicle-related information
    const description = activity.description?.toLowerCase() || '';
    const vehicleKeywords = ['vehicle', 'car', 'truck', 'van', 'motorcycle', 'license', 'plate'];
    return vehicleKeywords.some(keyword => description.includes(keyword));
  }

  private calculateVehicleMatch(vehicleInfo: any, activity: EnterpriseActivity): { factor: string; score: number } {
    // Simplified vehicle matching
    const description = activity.description?.toLowerCase() || '';
    
    if (vehicleInfo.license_plate && description.includes(vehicleInfo.license_plate.toLowerCase())) {
      return { factor: 'exact_vehicle', score: this.confidenceFactors.exact_vehicle };
    }

    if (vehicleInfo.color && description.includes(vehicleInfo.color.toLowerCase())) {
      return { factor: 'vehicle_color_match', score: this.confidenceFactors.vehicle_color_match };
    }

    return { factor: 'vehicle_no_match', score: 0 };
  }

  // Public service methods
  async createBOL(
    bolData: Partial<BOLAlert>,
    context: AuditContext
  ): ServiceMethod<BOLAlert> {
    try {
      // Validation
      await this.validateInput(bolData);
      
      // Business rules
      await this.enforceRules(bolData, 'create');

      // Set default values
      const now = new Date();
      const bol: BOLAlert = {
        id: `BOL-${Date.now().toString().padStart(6, '0')}`,
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
        match_history: [],
        confidence_threshold: this.minimumConfidenceThreshold,
        auto_match_enabled: true,
        notification_settings: {
          immediate: true,
          digest: false,
          escalation: true
        },
        geographic_scope: {
          sites: [],
          buildings: [],
          zones: [],
          radius_meters: 1000
        },
        title: 'New BOL Alert',
        type: 'person',
        status: 'active',
        priority: 'medium',
        ...bolData
      } as BOLAlert;

      // Store the BOL
      this.bolStore.createBOL(bol);

      // Check for immediate matches with existing activities
      await this.checkExistingActivities(bol, context);

      // Audit logging
      await this.auditLog(context, 'create', bol.id, undefined, bol);

      // Publish event
      await this.publishEvent({
        eventType: 'bol.created',
        entityType: 'bol',
        entityId: bol.id,
        userId: context.userId,
        data: bol
      });

      return this.createSuccessResponse(bol, 'BOL alert created successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateBOL(
    id: string,
    updates: Partial<BOLAlert>,
    context: AuditContext
  ): ServiceMethod<BOLAlert> {
    try {
      // Get existing BOL
      const existingBOL = this.bolStore.bols.find(b => b.id === id);
      if (!existingBOL) {
        return this.createErrorResponse('BOL not found', 'NOT_FOUND');
      }

      // Validation
      await this.validateInput(updates);
      
      // Business rules
      await this.enforceRules(updates, 'update');

      // Apply updates
      const updatedBOL = {
        ...existingBOL,
        ...updates,
        updated_at: new Date(),
        updated_by: context.userId
      };

      // Store the update
      this.bolStore.updateBOL(id, updatedBOL);

      // Audit logging
      await this.auditLog(context, 'update', id, existingBOL, updatedBOL);

      // Publish event
      await this.publishEvent({
        eventType: 'bol.updated',
        entityType: 'bol',
        entityId: id,
        userId: context.userId,
        data: { before: existingBOL, after: updatedBOL }
      });

      return this.createSuccessResponse(updatedBOL, 'BOL updated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async matchActivity(
    bolId: string,
    activityId: string,
    context: AuditContext,
    manualMatch = false
  ): ServiceMethod<{
    matched: boolean;
    confidence: number;
    match_id: string;
  }> {
    try {
      const bol = this.bolStore.bols.find(b => b.id === bolId);
      if (!bol) {
        return this.createErrorResponse('BOL not found', 'NOT_FOUND');
      }

      const activity = this.activityStore.activities.find(a => a.id === activityId);
      if (!activity) {
        return this.createErrorResponse('Activity not found', 'NOT_FOUND');
      }

      // Calculate confidence
      const confidence = manualMatch ? 1.0 : this.calculateMatchConfidence(bol, activity);
      const isMatch = confidence >= bol.confidence_threshold || manualMatch;

      // Create match record
      const matchRecord = {
        id: `MATCH-${Date.now().toString().padStart(6, '0')}`,
        activity_id: activityId,
        matched_at: new Date(),
        matched_by: context.userId,
        confidence_score: confidence,
        is_manual: manualMatch,
        match_factors: [] // Would contain detailed matching factors
      };

      if (isMatch) {
        // Add to match history
        const updatedMatchHistory = [...(bol.match_history || []), matchRecord];
        
        // Update BOL status if first match
        const updateData: Partial<BOLAlert> = {
          match_history: updatedMatchHistory
        };

        if (bol.status === 'active') {
          updateData.status = 'matched' as Status;
          updateData.matched_at = new Date();
        }

        await this.updateBOL(bolId, updateData, context);

        // Publish match event
        await this.publishEvent({
          eventType: 'bol.matched',
          entityType: 'bol',
          entityId: bolId,
          userId: context.userId,
          data: { 
            activity_id: activityId,
            confidence,
            manual: manualMatch,
            match_record: matchRecord
          }
        });
      }

      return this.createSuccessResponse({
        matched: isMatch,
        confidence,
        match_id: matchRecord.id
      }, isMatch ? 'Match found' : 'No match - confidence below threshold');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Check existing activities for matches when BOL is created
  private async checkExistingActivities(bol: BOLAlert, context: AuditContext): Promise<void> {
    if (!bol.auto_match_enabled) return;

    try {
      // Get recent activities (last 24 hours)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentActivities = this.activityStore.activities.filter(activity => 
        activity.timestamp >= yesterday
      );

      // Check each activity for potential matches
      for (const activity of recentActivities) {
        const confidence = this.calculateMatchConfidence(bol, activity);
        
        if (confidence >= bol.confidence_threshold) {
          await this.matchActivity(bol.id, activity.id, context, false);
        }
      }
    } catch (error) {
      console.warn('Failed to check existing activities for BOL matches:', error);
    }
  }

  // Called by ActivityService when new activities are created
  async checkNewActivity(
    activity: EnterpriseActivity,
    context: AuditContext
  ): ServiceListMethod<{
    bol_id: string;
    confidence: number;
    matched: boolean;
  }> {
    try {
      const results: Array<{
        bol_id: string;
        confidence: number;
        matched: boolean;
      }> = [];

      // Get active BOLs
      const activeBOLs = this.bolStore.bols.filter(bol => 
        bol.status === 'active' && 
        bol.auto_match_enabled &&
        (!bol.expires_at || bol.expires_at > new Date())
      );

      // Check each active BOL
      for (const bol of activeBOLs) {
        const confidence = this.calculateMatchConfidence(bol, activity);
        const matched = confidence >= bol.confidence_threshold;

        results.push({
          bol_id: bol.id,
          confidence,
          matched
        });

        // If matched, create the match record
        if (matched) {
          await this.matchActivity(bol.id, activity.id, context, false);
        }
      }

      return this.createSuccessResponse(results, `Checked ${activeBOLs.length} active BOLs`);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async expireBOL(
    id: string,
    context: AuditContext
  ): ServiceMethod<BOLAlert> {
    return await this.updateBOL(id, { 
      status: 'expired' as Status,
      expired_at: new Date()
    }, context);
  }

  async checkExpiredBOLs(): ServiceListMethod<BOLAlert> {
    try {
      const now = new Date();
      const expiredBOLs = this.bolStore.bols.filter(bol => 
        bol.status === 'active' &&
        bol.expires_at &&
        bol.expires_at <= now
      );

      // Auto-expire BOLs (would need system context)
      for (const bol of expiredBOLs) {
        await this.updateBOL(bol.id, { 
          status: 'expired' as Status,
          expired_at: now
        }, {
          userId: 'system',
          userName: 'System',
          userRole: 'admin',
          action: 'auto_expire'
        });
      }

      return this.createSuccessResponse(expiredBOLs, `Auto-expired ${expiredBOLs.length} BOLs`);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findById(id: string): ServiceMethod<BOLAlert> {
    try {
      const bol = this.bolStore.bols.find(b => b.id === id);
      if (!bol) {
        return this.createErrorResponse('BOL not found', 'NOT_FOUND');
      }

      return this.createSuccessResponse(bol);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findAll(options: QueryOptions = {}): ServiceListMethod<BOLAlert> {
    try {
      const bols = this.bolStore.bols;
      
      // Apply filters
      let filtered = bols;
      if (options.filters) {
        if (options.filters.status) {
          filtered = filtered.filter(b => b.status === options.filters!.status);
        }
        if (options.filters.priority) {
          filtered = filtered.filter(b => b.priority === options.filters!.priority);
        }
        if (options.filters.type) {
          filtered = filtered.filter(b => b.type === options.filters!.type);
        }
        if (options.filters.active_only) {
          filtered = filtered.filter(b => b.status === 'active' && 
            (!b.expires_at || b.expires_at > new Date()));
        }
      }

      // Apply sorting
      if (options.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = (a as any)[options.sortBy!];
          const bValue = (b as any)[options.sortBy!];
          
          if (options.sortDirection === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const paginatedBOLs = filtered.slice(startIndex, startIndex + limit);

      const metadata = this.buildQueryMetadata(paginatedBOLs, filtered.length, options);

      return this.createSuccessResponse(paginatedBOLs, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteBOL(id: string, context: AuditContext): ServiceBooleanMethod {
    try {
      // Soft delete only (change status to cancelled)
      const result = await this.updateBOL(id, { 
        status: 'cancelled' as Status,
        cancelled_at: new Date(),
        cancelled_by: context.userId,
        cancel_reason: 'Deleted by user'
      }, context);
      
      return this.createSuccessResponse(result.success);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get BOL statistics for dashboards
  async getBOLStatistics(
    timeRange: { start: Date; end: Date }
  ): ServiceMethod<{
    totalBOLs: number;
    bolsByStatus: Record<string, number>;
    bolsByPriority: Record<string, number>;
    bolsByType: Record<string, number>;
    matchRate: number;
    avgConfidenceScore: number;
    expiredBOLsCount: number;
  }> {
    try {
      const bols = this.bolStore.bols.filter(bol => 
        bol.created_at >= timeRange.start && bol.created_at <= timeRange.end
      );
      
      const bolsByStatus: Record<string, number> = {};
      const bolsByPriority: Record<string, number> = {};
      const bolsByType: Record<string, number> = {};
      let totalMatches = 0;
      let totalConfidenceScore = 0;
      let confidenceCount = 0;
      let expiredCount = 0;

      bols.forEach(bol => {
        // By status
        bolsByStatus[bol.status] = (bolsByStatus[bol.status] || 0) + 1;
        
        // By priority
        bolsByPriority[bol.priority] = (bolsByPriority[bol.priority] || 0) + 1;
        
        // By type
        bolsByType[bol.type] = (bolsByType[bol.type] || 0) + 1;
        
        // Match statistics
        if (bol.match_history && bol.match_history.length > 0) {
          totalMatches += bol.match_history.length;
          
          // Average confidence
          bol.match_history.forEach(match => {
            totalConfidenceScore += match.confidence_score;
            confidenceCount++;
          });
        }
        
        // Expired count
        if (bol.status === 'expired') {
          expiredCount++;
        }
      });

      const matchRate = bols.length > 0 ? (bols.filter(b => b.match_history && b.match_history.length > 0).length / bols.length) : 0;
      const avgConfidenceScore = confidenceCount > 0 ? totalConfidenceScore / confidenceCount : 0;

      const statistics = {
        totalBOLs: bols.length,
        bolsByStatus,
        bolsByPriority,
        bolsByType,
        matchRate: Math.round(matchRate * 100) / 100, // Round to 2 decimal places
        avgConfidenceScore: Math.round(avgConfidenceScore * 100) / 100,
        expiredBOLsCount: expiredCount
      };

      return this.createSuccessResponse(statistics, 'BOL statistics generated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }
}