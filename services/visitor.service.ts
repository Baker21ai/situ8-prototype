/**
 * Visitor Management Service
 * Handles visitor operations with Lenel access control integration
 * Supports configurable third-party providers and modular workflows
 */

import { BaseService } from './base.service';
import { 
  Visitor, 
  VisitorManagementConfig, 
  VisitorSearchRequest, 
  VisitorStats, 
  IntegrationResponse,
  VisitorSyncRequest,
  VisitorState,
  CheckInMethod,
  BackgroundCheckStatus,
  SyncStatus
} from '../lib/types/visitor';
import { ServiceResponse, AuditContext, ValidationResult, BusinessRuleResult } from './types';
// Generate UUID using native crypto if uuid package not available
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class VisitorService extends BaseService<Visitor, string> {
  private config: VisitorManagementConfig;
  private lenelIntegration: LenelIntegrationService;
  private providerIntegrations: Map<string, ProviderIntegration>;

  constructor(config: VisitorManagementConfig) {
    super('visitor', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      maxRetries: 3,
      timeoutMs: 30000,
      cacheEnabled: true,
      cacheTtlMs: 300000,
      ...config
    });
    
    this.config = config;
    this.lenelIntegration = new LenelIntegrationService(config.access_control.lenel_config);
    this.providerIntegrations = new Map();
    
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.config.providers.forEach(provider => {
      if (provider.enabled) {
        const integration = this.createProviderIntegration(provider);
        this.providerIntegrations.set(provider.id, integration);
      }
    });
  }

  private createProviderIntegration(provider: any): ProviderIntegration {
    switch (provider.type) {
      case 'lenel_onguard':
        return new LenelIntegrationService(provider.api_config);
      case 'hid_easylobby':
        return new HIDEasyLobbyService(provider.api_config);
      case 'custom_api':
        return new CustomAPIService(provider.api_config);
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }

  protected validateEntity(entity: Partial<Visitor>): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    if (!entity.first_name || entity.first_name.trim().length === 0) {
      errors.push({ field: 'first_name', message: 'First name is required' });
    }

    if (!entity.last_name || entity.last_name.trim().length === 0) {
      errors.push({ field: 'last_name', message: 'Last name is required' });
    }

    if (!entity.host_user_id) {
      errors.push({ field: 'host_user_id', message: 'Host user is required' });
    }

    if (!entity.purpose || entity.purpose.trim().length === 0) {
      errors.push({ field: 'purpose', message: 'Purpose of visit is required' });
    }

    if (!entity.expected_arrival) {
      errors.push({ field: 'expected_arrival', message: 'Expected arrival time is required' });
    }

    if (!entity.expected_departure) {
      errors.push({ field: 'expected_departure', message: 'Expected departure time is required' });
    }

    if (entity.expected_arrival && entity.expected_departure) {
      if (new Date(entity.expected_arrival) >= new Date(entity.expected_departure)) {
        errors.push({ field: 'expected_departure', message: 'Departure time must be after arrival time' });
      }
    }

    if (entity.email && !this.isValidEmail(entity.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (entity.phone && !this.isValidPhone(entity.phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone format' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(entity: Partial<Visitor>, operation: string): BusinessRuleResult[] {
    const rules: BusinessRuleResult[] = [];

    // Background check rules
    if (entity.background_check_required && entity.background_check_status === 'denied') {
      rules.push({
        passed: false,
        ruleName: 'background_check_approval',
        message: 'Visitor access denied due to failed background check'
      });
    }

    // Access level validation
    if (entity.access_level) {
      const validLevels = this.config.access_control.access_levels.map(al => al.id);
      if (!validLevels.includes(entity.access_level)) {
        rules.push({
          passed: false,
          ruleName: 'valid_access_level',
          message: `Invalid access level: ${entity.access_level}`
        });
      }
    }

    // Time-based access validation
    if (entity.expected_arrival) {
      const arrival = new Date(entity.expected_arrival);
      const now = new Date();
      const maxAdvanceDays = 30; // Maximum 30 days advance booking
      
      if (arrival > new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000)) {
        rules.push({
          passed: false,
          ruleName: 'advance_booking_limit',
          message: 'Booking too far in advance'
        });
      }
    }

    // VIP visitor special handling
    if (entity.priority === 'vip') {
      rules.push({
        passed: true,
        ruleName: 'vip_notification',
        message: 'VIP visitor requires special handling'
      });
    }

    return rules;
  }

  protected getEntityName(): string {
    return 'visitor';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Core visitor operations
  async createVisitor(visitorData: Partial<Visitor>, context: AuditContext): Promise<ServiceResponse<Visitor>> {
    try {
      await this.validateInput(visitorData);
      await this.enforceRules(visitorData, 'create');

      const visitor: Visitor = {
        ...visitorData,
        id: uuidv4(),
        visitor_number: this.generateVisitorNumber(),
        status: {
          current: 'pre_registered',
          history: [{
            state: 'pre_registered',
            timestamp: new Date(),
            changed_by: context.userId
          }]
        },
        pre_screening_passed: false,
        background_check_required: this.shouldRequireBackgroundCheck(visitorData),
        background_check_status: 'not_required',
        documents: [],
        agreements_signed: [],
        sync_status: 'pending_sync',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: context.userId,
        updated_by: context.userId
      } as Visitor;

      // Sync with access control system
      const syncResult = await this.syncVisitorToAccessControl(visitor);
      if (syncResult.success) {
        visitor.sync_status = 'synced';
        visitor.external_id = syncResult.external_id;
      }

      await this.auditLog(context, 'create', 'create', visitor.id, undefined, visitor);
      
      return this.createSuccessResponse(visitor, 'Visitor created successfully');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : String(error));
    }
  }

  async updateVisitor(visitorId: string, updates: Partial<Visitor>, context: AuditContext): Promise<ServiceResponse<Visitor>> {
    try {
      const existingVisitor = await this.getVisitorById(visitorId);
      if (!existingVisitor) {
        return this.createErrorResponse('Visitor not found', 'NOT_FOUND');
      }

      await this.validateInput(updates);
      await this.enforceRules({ ...existingVisitor, ...updates }, 'update');

      const updatedVisitor: Visitor = {
        ...existingVisitor,
        ...updates,
        updated_at: new Date(),
        updated_by: context.userId
      };

      // Sync changes with access control
      const syncResult = await this.syncVisitorToAccessControl(updatedVisitor);
      if (syncResult.success) {
        updatedVisitor.sync_status = 'synced';
      }

      await this.auditLog(context, 'update', 'update', visitorId, existingVisitor, updatedVisitor);
      
      return this.createSuccessResponse(updatedVisitor, 'Visitor updated successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async checkInVisitor(visitorId: string, checkInData: {
    method: CheckInMethod;
    location: string;
    photo_url?: string;
    signature_url?: string;
  }, context: AuditContext): Promise<ServiceResponse<Visitor>> {
    try {
      const visitor = await this.getVisitorById(visitorId);
      if (!visitor) {
        return this.createErrorResponse('Visitor not found', 'NOT_FOUND');
      }

      // Update visitor status
      visitor.status.current = 'checked_in';
      visitor.status.history.push({
        state: 'checked_in',
        timestamp: new Date(),
        changed_by: context.userId,
        location: checkInData.location
      });
      visitor.actual_arrival = new Date();
      visitor.check_in_method = checkInData.method;
      
      if (checkInData.photo_url) visitor.photo_url = checkInData.photo_url;
      if (checkInData.signature_url) visitor.signature_url = checkInData.signature_url;

      // Activate access card in Lenel
      if (visitor.card_number) {
        await this.lenelIntegration.activateCard(visitor.card_number, {
          start_time: new Date(),
          end_time: visitor.expected_departure,
          access_level: visitor.access_level
        });
      }

      // Send notifications
      await this.sendCheckInNotifications(visitor);

      await this.auditLog(context, 'check_in', 'update', visitorId, undefined, visitor);
      
      return this.createSuccessResponse(visitor, 'Visitor checked in successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async checkOutVisitor(visitorId: string, context: AuditContext): Promise<ServiceResponse<Visitor>> {
    try {
      const visitor = await this.getVisitorById(visitorId);
      if (!visitor) {
        return this.createErrorResponse('Visitor not found', 'NOT_FOUND');
      }

      visitor.status.current = 'checked_out';
      visitor.status.history.push({
        state: 'checked_out',
        timestamp: new Date(),
        changed_by: context.userId
      });
      visitor.actual_departure = new Date();

      // Deactivate access card
      if (visitor.card_number) {
        await this.lenelIntegration.deactivateCard(visitor.card_number);
      }

      // Send checkout notifications
      await this.sendCheckOutNotifications(visitor);

      await this.auditLog(context, 'check_out', 'update', visitorId, undefined, visitor);
      
      return this.createSuccessResponse(visitor, 'Visitor checked out successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async searchVisitors(searchRequest: VisitorSearchRequest, context: AuditContext): Promise<ServiceResponse<{
    visitors: Visitor[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // In a real implementation, this would query the database
      // For now, returning mock data structure
      const mockVisitors = this.generateMockVisitors();
      
      // Apply filters
      let filtered = mockVisitors;
      
      searchRequest.filters.forEach(filter => {
        filtered = this.applyFilter(filtered, filter);
      });

      // Apply sorting
      filtered = this.applySorting(filtered, searchRequest.sort);

      // Apply pagination
      const start = (searchRequest.pagination.page - 1) * searchRequest.pagination.limit;
      const paginated = filtered.slice(start, start + searchRequest.pagination.limit);

      await this.auditLog(context, 'search', 'read', undefined, undefined, { searchRequest });

      return this.createSuccessResponse({
        visitors: paginated,
        total: filtered.length,
        page: searchRequest.pagination.page,
        limit: searchRequest.pagination.limit
      });
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getVisitorStats(siteId?: string, context?: AuditContext): Promise<ServiceResponse<VisitorStats>> {
    try {
      // In a real implementation, this would query the database
      const mockStats: VisitorStats = {
        total_visitors: 1250,
        active_visitors: 47,
        checked_in_today: 23,
        expected_today: 31,
        average_visit_duration: 127,
        popular_destinations: [
          { zone_id: 'zone-1', zone_name: 'Main Lobby', visitor_count: 15, percentage: 32 },
          { zone_id: 'zone-2', zone_name: 'Conference Room A', visitor_count: 8, percentage: 17 },
          { zone_id: 'zone-3', zone_name: 'Executive Floor', visitor_count: 6, percentage: 13 }
        ],
        security_incidents: 2,
        compliance_score: 94.5
      };

      if (context) {
        await this.auditLog(context, 'get_stats', 'read', undefined, undefined, { site_id: siteId });
      }

      return this.createSuccessResponse(mockStats);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async syncVisitor(visitorId: string, context: AuditContext): Promise<ServiceResponse<Visitor>> {
    try {
      const visitor = await this.getVisitorById(visitorId);
      if (!visitor) {
        return this.createErrorResponse('Visitor not found', 'NOT_FOUND');
      }

      const syncResult = await this.syncVisitorToAccessControl(visitor);
      if (syncResult.success) {
        visitor.sync_status = 'synced';
        visitor.external_id = syncResult.external_id;
      } else {
        visitor.sync_status = 'sync_failed';
      }

      await this.auditLog(context, 'sync', 'sync', visitorId, undefined, visitor);
      
      return this.createSuccessResponse(visitor);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // Private helper methods
  private generateVisitorNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `V${year}${sequence}`;
  }

  private shouldRequireBackgroundCheck(visitorData: Partial<Visitor>): boolean {
    return visitorData.priority === 'contractor' || visitorData.access_level === 'high_security';
  }

  private async syncVisitorToAccessControl(visitor: Visitor): Promise<IntegrationResponse> {
    try {
      // Sync with Lenel OnGuard
      const result = await this.lenelIntegration.createVisitor(visitor);
      return result;
    } catch (error) {
      console.error('Failed to sync visitor to access control:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async getVisitorById(visitorId: string): Promise<Visitor | null> {
    // In a real implementation, this would query the database
    // For now, returning mock data
    return this.generateMockVisitors().find(v => v.id === visitorId) || null;
  }

  private async sendCheckInNotifications(visitor: Visitor): Promise<void> {
    // Implementation would send notifications based on configuration
    console.log(`Sending check-in notifications for visitor: ${visitor.visitor_number}`);
  }

  private async sendCheckOutNotifications(visitor: Visitor): Promise<void> {
    // Implementation would send notifications based on configuration
    console.log(`Sending check-out notifications for visitor: ${visitor.visitor_number}`);
  }

  private applyFilter(visitors: Visitor[], filter: any): Visitor[] {
    // Implementation would apply filters based on field and operator
    return visitors;
  }

  private applySorting(visitors: Visitor[], sort: any[]): Visitor[] {
    // Implementation would apply sorting
    return visitors;
  }

  private generateMockVisitors(): Visitor[] {
    return [
      {
        id: 'v1',
        visitor_number: 'V2024001234',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Inc',
        host_user_id: 'user-123',
        host_name: 'Alice Johnson',
        purpose: 'Business meeting',
        priority: 'standard',
        access_level: 'lobby_access',
        site_id: 'site-1',
        building_id: 'building-1',
        expected_arrival: new Date('2024-01-15T09:00:00Z'),
        expected_departure: new Date('2024-01-15T11:00:00Z'),
        status: {
          current: 'checked_in',
          history: []
        },
        check_in_method: 'kiosk',
        pre_screening_passed: true,
        background_check_required: false,
        background_check_status: 'not_required',
        documents: [],
        agreements_signed: [],
        integration_source: 'situ8',
        sync_status: 'synced',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system'
      }
    ];
  }
}

// Integration services
abstract class ProviderIntegration {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  abstract createVisitor(visitor: Visitor): Promise<IntegrationResponse>;
  abstract updateVisitor(visitor: Visitor): Promise<IntegrationResponse>;
  abstract activateCard(cardNumber: string, access: any): Promise<IntegrationResponse>;
  abstract deactivateCard(cardNumber: string): Promise<IntegrationResponse>;
}

class LenelIntegrationService extends ProviderIntegration {
  async createVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    // Implementation for Lenel OnGuard API
    console.log('Creating visitor in Lenel:', visitor.visitor_number);
    return {
      success: true,
      external_id: `LENEL_${visitor.visitor_number}`,
      sync_timestamp: new Date()
    };
  }

  async updateVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    console.log('Updating visitor in Lenel:', visitor.visitor_number);
    return { success: true, sync_timestamp: new Date() };
  }

  async activateCard(cardNumber: string, access: any): Promise<IntegrationResponse> {
    console.log('Activating card in Lenel:', cardNumber);
    return { success: true };
  }

  async deactivateCard(cardNumber: string): Promise<IntegrationResponse> {
    console.log('Deactivating card in Lenel:', cardNumber);
    return { success: true };
  }
}

class HIDEasyLobbyService extends ProviderIntegration {
  async createVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    console.log('Creating visitor in HID EasyLobby:', visitor.visitor_number);
    return {
      success: true,
      external_id: `HID_${visitor.visitor_number}`,
      sync_timestamp: new Date()
    };
  }

  async updateVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    console.log('Updating visitor in HID EasyLobby:', visitor.visitor_number);
    return { success: true, sync_timestamp: new Date() };
  }

  async activateCard(cardNumber: string, access: any): Promise<IntegrationResponse> {
    console.log('Activating card in HID:', cardNumber);
    return { success: true };
  }

  async deactivateCard(cardNumber: string): Promise<IntegrationResponse> {
    console.log('Deactivating card in HID:', cardNumber);
    return { success: true };
  }
}

class CustomAPIService extends ProviderIntegration {
  async createVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    console.log('Creating visitor in Custom API:', visitor.visitor_number);
    return {
      success: true,
      external_id: `CUSTOM_${visitor.visitor_number}`,
      sync_timestamp: new Date()
    };
  }

  async updateVisitor(visitor: Visitor): Promise<IntegrationResponse> {
    console.log('Updating visitor in Custom API:', visitor.visitor_number);
    return { success: true, sync_timestamp: new Date() };
  }

  async activateCard(cardNumber: string, access: any): Promise<IntegrationResponse> {
    console.log('Activating card in Custom API:', cardNumber);
    return { success: true };
  }

  async deactivateCard(cardNumber: string): Promise<IntegrationResponse> {
    console.log('Deactivating card in Custom API:', cardNumber);
    return { success: true };
  }
}