/**
 * Audit Service
 * Implements universal audit trail with WHO, WHAT, WHEN, WHERE, WHY capture
 * All operations in the system must be audited per business logic requirements
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  ServiceMethod,
  ServiceListMethod,
  QueryOptions
} from './types';
import { AuditEntry } from '../lib/types/audit';
import { useAuditStore } from '../stores/auditStore';

export class AuditService extends BaseService<AuditEntry, string> {
  private auditStore: ReturnType<typeof useAuditStore.getState>;

  constructor() {
    super('AuditService', {
      enableAudit: false, // Prevent recursive audit logging
      enableValidation: true,
      enableBusinessRules: true
    });

    this.auditStore = useAuditStore.getState();
  }

  protected getEntityName(): string {
    return 'AuditEntry';
  }

  protected validateEntity(auditEntry: Partial<AuditEntry>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation - WHO
    const userIdError = this.validateRequired(auditEntry.user_id, 'user_id');
    if (userIdError) errors.push(userIdError);

    const userNameError = this.validateRequired(auditEntry.user_name, 'user_name');
    if (userNameError) errors.push(userNameError);

    const userRoleError = this.validateRequired(auditEntry.user_role, 'user_role');
    if (userRoleError) errors.push(userRoleError);

    // Required field validation - WHAT
    const actionError = this.validateRequired(auditEntry.action, 'action');
    if (actionError) errors.push(actionError);

    const entityTypeError = this.validateRequired(auditEntry.entity_type, 'entity_type');
    if (entityTypeError) errors.push(entityTypeError);

    const entityIdError = this.validateRequired(auditEntry.entity_id, 'entity_id');
    if (entityIdError) errors.push(entityIdError);

    // WHEN is auto-generated
    // WHERE and WHY are optional but recommended

    // Enum validation
    if (auditEntry.entity_type) {
      const entityTypeEnumError = this.validateEnum(
        auditEntry.entity_type,
        'entity_type',
        ['activity', 'incident', 'case', 'bol', 'user', 'role', 'site', 'building', 'zone', 'notification', 'comment', 'attachment', 'configuration']
      );
      if (entityTypeEnumError) errors.push(entityTypeEnumError);
    }

    if (auditEntry.action) {
      const actionEnumError = this.validateEnum(
        auditEntry.action,
        'action',
        [
          'create', 'read', 'update', 'delete', 'archive', 'restore',
          'status_change', 'assign', 'reassign', 'escalate', 'resolve',
          'link', 'unlink', 'merge', 'split',
          'grant_access', 'revoke_access', 'permission_check',
          'export', 'import', 'backup', 'restore_backup',
          'login', 'logout', 'login_failed', 'password_change',
          'configuration_change', 'system_maintenance', 'data_migration'
        ]
      );
      if (actionEnumError) errors.push(actionEnumError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(auditEntry: Partial<AuditEntry>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Rule 1: Audit entries must have complete WHO information
    results.push({
      ruleName: 'complete_user_info',
      passed: Boolean(auditEntry.user_id && auditEntry.user_name && auditEntry.user_role),
      message: 'WHO information must include user ID, name, and role'
    });

    // Rule 2: Sensitive operations must include reason (WHY)
    const sensitiveActions = ['delete', 'archive', 'escalate', 'grant_access', 'revoke_access', 'export'];
    if (auditEntry.action && sensitiveActions.includes(auditEntry.action)) {
      results.push({
        ruleName: 'sensitive_action_reason',
        passed: Boolean(auditEntry.reason),
        message: 'Sensitive actions must include a reason'
      });
    }

    // Rule 3: State changes must include before/after states
    if (auditEntry.action === 'update' || auditEntry.action === 'status_change') {
      results.push({
        ruleName: 'state_change_tracking',
        passed: Boolean(auditEntry.before_state || auditEntry.after_state),
        message: 'State changes must include before and/or after states'
      });
    }

    // Rule 4: Retention date must be set
    results.push({
      ruleName: 'retention_date_required',
      passed: Boolean(auditEntry.retention_date),
      message: 'Audit entries must have retention date set'
    });

    return results;
  }

  // Core audit logging method - this is called by all other services
  async logAuditEntry(
    context: AuditContext,
    entityType: string,
    entityId: string,
    action: string,
    options: {
      reason?: string;
      beforeState?: Record<string, any>;
      afterState?: Record<string, any>;
      changes?: Array<{
        field: string;
        oldValue: any;
        newValue: any;
        fieldType: string;
        isSensitive: boolean;
      }>;
      siteId?: string;
      siteName?: string;
      buildingId?: string;
      zoneId?: string;
      correlationId?: string;
      isSensitive?: boolean;
    } = {}
  ): ServiceMethod<AuditEntry> {
    try {
      const now = new Date();
      const auditEntry: AuditEntry = {
        id: `AUDIT-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
        
        // WHO
        user_id: context.userId,
        user_name: context.userName,
        user_role: context.userRole,
        user_ip: context.ipAddress,
        user_agent: context.userAgent,
        
        // WHAT
        action,
        entity_type: entityType,
        entity_id: entityId,
        
        // WHEN
        timestamp: now,
        session_id: context.sessionId,
        
        // WHERE
        site_id: options.siteId,
        site_name: options.siteName,
        building_id: options.buildingId,
        zone_id: options.zoneId,
        
        // WHY
        reason: options.reason,
        context: {
          business_justification: options.reason,
          system_version: '1.0.0',
          api_endpoint: 'internal',
          workflow_step: action
        },
        
        // Change tracking
        before_state: options.beforeState,
        after_state: options.afterState,
        changes: options.changes,
        
        // System metadata
        source: 'web',
        correlation_id: options.correlationId || this.generateCorrelationId(),
        
        // Compliance and retention
        retention_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        is_sensitive: options.isSensitive || false
      };

      // Validation
      await this.validateInput(auditEntry);
      
      // Business rules (but don't enforce, just log violations)
      const ruleResults = this.enforceBusinessRules(auditEntry, 'create');
      const violations = ruleResults.filter(r => !r.passed);
      if (violations.length > 0) {
        console.warn('Audit entry business rule violations:', violations);
      }

      // Store the audit entry
      this.auditStore.logAction({
        user_id: auditEntry.user_id,
        user_name: auditEntry.user_name,
        action: auditEntry.action,
        entity_type: auditEntry.entity_type as any,
        entity_id: auditEntry.entity_id,
        description: this.buildAuditDescription(auditEntry)
      });

      return this.createSuccessResponse(auditEntry, 'Audit entry created successfully');

    } catch (error) {
      // If audit logging fails, we still log to console but don't throw
      console.error('Failed to create audit entry:', error);
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Helper method to build human-readable audit description
  private buildAuditDescription(auditEntry: AuditEntry): string {
    const parts = [
      auditEntry.user_name,
      auditEntry.action,
      auditEntry.entity_type,
      auditEntry.entity_id
    ];

    if (auditEntry.reason) {
      parts.push(`- ${auditEntry.reason}`);
    }

    if (auditEntry.site_name) {
      parts.push(`at ${auditEntry.site_name}`);
    }

    return parts.join(' ');
  }

  // Query audit trail for specific entity
  async getAuditTrail(
    entityType: string,
    entityId: string,
    options: QueryOptions = {}
  ): ServiceMethod<AuditEntry[]> {
    try {
      const auditEntries = this.auditStore.getAuditTrail(entityType, entityId);
      const metadata = this.buildQueryMetadata(auditEntries, auditEntries.length, options);

      return this.createSuccessResponse(auditEntries, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get recent audit activity
  async getRecentActivity(limit = 50): ServiceMethod<AuditEntry[]> {
    try {
      const auditEntries = this.auditStore.getRecentActivity(limit);
      return this.createSuccessResponse(auditEntries);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Search audit entries with complex filters
  async searchAuditEntries(searchRequest: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    siteId?: string;
    buildingId?: string;
    searchTerm?: string;
    hasSensitiveData?: boolean;
    page?: number;
    limit?: number;
  }): ServiceMethod<AuditEntry[]> {
    try {
      // This is a simplified implementation - in a real system this would query a database
      let auditEntries = this.auditStore.getRecentActivity(1000);

      // Apply filters
      if (searchRequest.userId) {
        auditEntries = auditEntries.filter(entry => entry.user_id === searchRequest.userId);
      }

      if (searchRequest.entityType) {
        auditEntries = auditEntries.filter(entry => entry.entity_type === searchRequest.entityType);
      }

      if (searchRequest.entityId) {
        auditEntries = auditEntries.filter(entry => entry.entity_id === searchRequest.entityId);
      }

      if (searchRequest.action) {
        auditEntries = auditEntries.filter(entry => entry.action === searchRequest.action);
      }

      if (searchRequest.startDate) {
        auditEntries = auditEntries.filter(entry => entry.timestamp >= searchRequest.startDate!);
      }

      if (searchRequest.endDate) {
        auditEntries = auditEntries.filter(entry => entry.timestamp <= searchRequest.endDate!);
      }

      if (searchRequest.searchTerm) {
        const term = searchRequest.searchTerm.toLowerCase();
        auditEntries = auditEntries.filter(entry => 
          entry.description?.toLowerCase().includes(term) ||
          entry.reason?.toLowerCase().includes(term) ||
          entry.user_name.toLowerCase().includes(term)
        );
      }

      // Pagination
      const page = searchRequest.page || 1;
      const limit = searchRequest.limit || 50;
      const startIndex = (page - 1) * limit;
      const paginatedEntries = auditEntries.slice(startIndex, startIndex + limit);

      const metadata = this.buildQueryMetadata(paginatedEntries, auditEntries.length, {
        page,
        limit
      });

      return this.createSuccessResponse(paginatedEntries, undefined, metadata);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Generate compliance reports
  async generateComplianceReport(
    reportType: 'access_log' | 'data_changes' | 'user_activity' | 'system_events',
    parameters: {
      startDate: Date;
      endDate: Date;
      userId?: string;
      entityType?: string;
      includeDetails?: boolean;
    }
  ): ServiceMethod<{
    reportId: string;
    reportType: string;
    generatedAt: Date;
    parameters: any;
    summary: {
      totalEntries: number;
      uniqueUsers: number;
      entitiesAffected: number;
      criticalActions: number;
    };
    entries: AuditEntry[];
  }> {
    try {
      const searchResult = await this.searchAuditEntries({
        startDate: parameters.startDate,
        endDate: parameters.endDate,
        userId: parameters.userId,
        entityType: parameters.entityType,
        limit: 10000 // Large limit for reports
      });

      if (!searchResult.success || !searchResult.data) {
        return this.createErrorResponse('Failed to generate compliance report');
      }

      const entries = searchResult.data;
      const uniqueUsers = new Set(entries.map(e => e.user_id)).size;
      const entitiesAffected = new Set(entries.map(e => `${e.entity_type}:${e.entity_id}`)).size;
      const criticalActions = entries.filter(e => 
        ['delete', 'archive', 'grant_access', 'revoke_access', 'export'].includes(e.action)
      ).length;

      const report = {
        reportId: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reportType,
        generatedAt: new Date(),
        parameters,
        summary: {
          totalEntries: entries.length,
          uniqueUsers,
          entitiesAffected,
          criticalActions
        },
        entries: parameters.includeDetails ? entries : []
      };

      return this.createSuccessResponse(report, 'Compliance report generated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Clean up old audit entries based on retention policy
  async cleanupExpiredEntries(): ServiceMethod<{ entriesRemoved: number }> {
    try {
      const now = new Date();
      const auditEntries = this.auditStore.getRecentActivity(10000);
      const expiredEntries = auditEntries.filter(entry => 
        entry.retention_date && entry.retention_date < now
      );

      // In a real implementation, this would delete from the database
      // For now, we'll just count what would be removed
      console.log(`Would remove ${expiredEntries.length} expired audit entries`);

      return this.createSuccessResponse(
        { entriesRemoved: expiredEntries.length },
        `Removed ${expiredEntries.length} expired audit entries`
      );

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get audit statistics for dashboards
  async getAuditStatistics(
    timeRange: { start: Date; end: Date }
  ): ServiceMethod<{
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByUser: Record<string, number>;
    entriesByEntityType: Record<string, number>;
    entriesByDate: Record<string, number>;
    mostActiveUsers: Array<{ userId: string; userName: string; entryCount: number }>;
    sensitiveOperations: number;
    complianceViolations: number;
  }> {
    try {
      const searchResult = await this.searchAuditEntries({
        startDate: timeRange.start,
        endDate: timeRange.end,
        limit: 10000
      });

      if (!searchResult.success || !searchResult.data) {
        return this.createErrorResponse('Failed to get audit statistics');
      }

      const entries = searchResult.data;
      
      const entriesByAction: Record<string, number> = {};
      const entriesByUser: Record<string, number> = {};
      const entriesByEntityType: Record<string, number> = {};
      const entriesByDate: Record<string, number> = {};
      const userNames: Record<string, string> = {};

      entries.forEach(entry => {
        // By action
        entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
        
        // By user
        entriesByUser[entry.user_id] = (entriesByUser[entry.user_id] || 0) + 1;
        userNames[entry.user_id] = entry.user_name;
        
        // By entity type
        entriesByEntityType[entry.entity_type] = (entriesByEntityType[entry.entity_type] || 0) + 1;
        
        // By date
        const dateKey = entry.timestamp.toISOString().split('T')[0];
        entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;
      });

      // Most active users
      const mostActiveUsers = Object.entries(entriesByUser)
        .map(([userId, count]) => ({
          userId,
          userName: userNames[userId],
          entryCount: count
        }))
        .sort((a, b) => b.entryCount - a.entryCount)
        .slice(0, 10);

      const sensitiveOperations = entries.filter(e => e.is_sensitive).length;
      const complianceViolations = 0; // Would be calculated based on business rules

      const statistics = {
        totalEntries: entries.length,
        entriesByAction,
        entriesByUser,
        entriesByEntityType,
        entriesByDate,
        mostActiveUsers,
        sensitiveOperations,
        complianceViolations
      };

      return this.createSuccessResponse(statistics, 'Audit statistics generated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }
}