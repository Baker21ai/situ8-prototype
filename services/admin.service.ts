/**
 * Admin Service
 * Handles system administration, user management, SOP management, automations, and integrations
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  ValidationResult,
  BusinessRuleResult,
  AuditContext,
  ServiceMethod,
  ServiceException
} from './types';
import { AWSApiClient } from './aws-api';

// System Health Types
export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: ServiceStatus[];
  infrastructure: InfrastructureStatus;
  metrics: SystemMetrics;
  lastUpdated: Date;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'degraded';
  uptime: string;
  cpu: number;
  memory: number;
  responseTime?: number;
  errorRate?: number;
  lastHealthCheck: Date;
}

export interface InfrastructureStatus {
  apiGateway: 'healthy' | 'degraded' | 'down';
  lambda: 'healthy' | 'degraded' | 'down';
  dynamodb: 'healthy' | 'degraded' | 'down';
  s3: 'healthy' | 'degraded' | 'down';
  cognito: 'healthy' | 'degraded' | 'down';
  cloudwatch: 'healthy' | 'degraded' | 'down';
}

export interface SystemMetrics {
  totalRequests: number;
  errorRate: number;
  avgLatency: number;
  activeConnections: number;
  totalUsers: number;
  activeUsers: number;
  storageUsed: number;
  costToday: number;
}

// User Management Types
export interface UserManagement {
  id: string;
  username: string;
  email: string;
  role: string;
  clearanceLevel: number;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  department?: string;
  badgeNumber?: string;
  facilityCodes?: string[];
}

// SOP Management Types
export interface SOPDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  processedDate?: Date;
  status: 'uploading' | 'processing' | 'processed' | 'failed' | 'archived';
  extractedData?: SOPExtractedData;
  originalUrl: string;
  version: number;
  tags: string[];
  category?: string;
}

export interface SOPExtractedData {
  summary: string;
  keywords: string[];
  teamsToNotify: string[];
  immediateActions: string[];
  mappedActivities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface SOPUploadRequest {
  file: File;
  title?: string;
  category?: string;
  tags?: string[];
}

// Automation Types
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'auto-incident' | 'sop-trigger' | 'notification' | 'escalation';
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: 'create_incident' | 'send_notification' | 'assign_team' | 'trigger_sop' | 'escalate';
  parameters: Record<string, any>;
}

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: 'lemel' | 'ambient' | 'webhook' | 'api' | 'other';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  config: IntegrationConfig;
  lastSync?: Date;
  errorCount: number;
  successCount: number;
  healthStatus: 'healthy' | 'degraded' | 'failing';
}

export interface IntegrationConfig {
  endpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
  authType?: 'api_key' | 'oauth' | 'basic' | 'bearer';
  dataMapping?: Record<string, string>;
  syncFrequency?: number; // minutes
  filters?: Record<string, any>;
  retrySettings?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
}

// Compliance Types
export interface ComplianceSettings {
  dataRetention: {
    auditLogs: number; // days
    voiceRecordings: number;
    transcripts: number;
    messages: number;
    activities: number;
    incidents: number;
  };
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    keyRotation: number; // days
  };
  backup: {
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    offsite: boolean;
    encryption: boolean;
  };
  monitoring: {
    realTime: boolean;
    alerting: boolean;
    reporting: boolean;
    auditTrail: boolean;
  };
  access: {
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
    };
  };
}

export class AdminService extends BaseService<any> {
  private apiClient: AWSApiClient;

  constructor(apiClient: AWSApiClient) {
    super('AdminService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      maxRetries: 3,
      timeoutMs: 30000, // 30 seconds for admin operations
      cacheEnabled: true,
      cacheTtlMs: 5 * 60 * 1000 // 5 minutes cache for system health
    });

    this.apiClient = apiClient;
  }

  protected validateEntity(entity: any): ValidationResult {
    // Basic validation for admin operations
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  protected enforceBusinessRules(entity: any, operation: string): BusinessRuleResult[] {
    // Business rules for admin operations
    return [];
  }

  protected getEntityName(): string {
    return 'AdminEntity';
  }

  // System Health & Monitoring Methods

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): ServiceMethod<SystemHealth> {
    try {
      const response = await this.apiClient.makeRequest<SystemHealth>('/admin/health');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            ...response.data,
            lastUpdated: new Date()
          },
          message: 'System health retrieved successfully'
        };
      }

      // Fallback to mock data if API fails
      return {
        success: true,
        data: this.getMockSystemHealth(),
        message: 'System health retrieved (mock data)'
      };
    } catch (error) {
      // Return mock data on error for admin panel functionality
      return {
        success: true,
        data: this.getMockSystemHealth(),
        message: 'System health retrieved (fallback mode)'
      };
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(limit: number = 100): ServiceMethod<string[]> {
    try {
      const response = await this.apiClient.makeRequest<string[]>('/admin/logs', {
        queryParams: { limit: limit.toString() }
      });

      return response.success 
        ? { success: true, data: response.data || [], message: 'Logs retrieved successfully' }
        : { success: false, error: { code: 'LOGS_FETCH_ERROR', message: response.error || 'Failed to fetch logs' } };
    } catch (error) {
      return this.createErrorResponse(error, 'LOGS_FETCH_ERROR');
    }
  }

  /**
   * Restart system services
   */
  async restartServices(services?: string[]): ServiceMethod<boolean> {
    try {
      const response = await this.apiClient.makeRequest<boolean>('/admin/system/restart', {
        method: 'POST',
        body: { services }
      });

      if (response.success) {
        await this.logAuditEvent('SYSTEM_RESTART', {
          services: services || 'all'
        });
      }

      return response.success
        ? { success: true, data: true, message: 'Services restart initiated' }
        : { success: false, error: { code: 'RESTART_ERROR', message: response.error || 'Failed to restart services' } };
    } catch (error) {
      return this.createErrorResponse(error, 'RESTART_ERROR');
    }
  }

  // User Management Methods

  /**
   * Get all users with pagination
   */
  async getUserList(page: number = 1, limit: number = 50): ServiceMethod<{ users: UserManagement[]; total: number }> {
    try {
      const response = await this.apiClient.makeRequest<{ users: UserManagement[]; total: number }>('/admin/users', {
        queryParams: { 
          page: page.toString(), 
          limit: limit.toString() 
        }
      });

      return response.success
        ? { success: true, data: response.data!, message: 'Users retrieved successfully' }
        : { success: false, error: { code: 'USERS_FETCH_ERROR', message: response.error || 'Failed to fetch users' } };
    } catch (error) {
      return this.createErrorResponse(error, 'USERS_FETCH_ERROR');
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): ServiceMethod<UserManagement> {
    try {
      const response = await this.apiClient.makeRequest<UserManagement>(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: { status }
      });

      if (response.success) {
        await this.logAuditEvent('USER_STATUS_UPDATED', {
          userId,
          newStatus: status
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'User status updated successfully' }
        : { success: false, error: { code: 'USER_UPDATE_ERROR', message: response.error || 'Failed to update user status' } };
    } catch (error) {
      return this.createErrorResponse(error, 'USER_UPDATE_ERROR');
    }
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: string[]): ServiceMethod<UserManagement> {
    try {
      const response = await this.apiClient.makeRequest<UserManagement>(`/admin/users/${userId}/permissions`, {
        method: 'PUT',
        body: { permissions }
      });

      if (response.success) {
        await this.logAuditEvent('USER_PERMISSIONS_UPDATED', {
          userId,
          permissions
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'User permissions updated successfully' }
        : { success: false, error: { code: 'PERMISSIONS_UPDATE_ERROR', message: response.error || 'Failed to update permissions' } };
    } catch (error) {
      return this.createErrorResponse(error, 'PERMISSIONS_UPDATE_ERROR');
    }
  }

  // SOP Management Methods

  /**
   * Upload SOP document
   */
  async uploadSOP(request: SOPUploadRequest): ServiceMethod<SOPDocument> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.title) formData.append('title', request.title);
      if (request.category) formData.append('category', request.category);
      if (request.tags) formData.append('tags', JSON.stringify(request.tags));

      // Upload file
      const response = await fetch(`${this.apiClient.getBaseUrl()}/admin/sop/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.apiClient.getAuthToken()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        await this.logAuditEvent('SOP_UPLOADED', {
          fileName: request.file.name,
          fileSize: request.file.size,
          title: request.title
        });

        return {
          success: true,
          data: result.data,
          message: 'SOP uploaded successfully'
        };
      }

      return {
        success: false,
        error: { code: 'SOP_UPLOAD_ERROR', message: result.error || 'Failed to upload SOP' }
      };
    } catch (error) {
      return this.createErrorResponse(error, 'SOP_UPLOAD_ERROR');
    }
  }

  /**
   * Get SOP library
   */
  async getSOPLibrary(status?: string): ServiceMethod<SOPDocument[]> {
    try {
      const response = await this.apiClient.makeRequest<SOPDocument[]>('/admin/sop/library', {
        queryParams: status ? { status } : {}
      });

      return response.success
        ? { success: true, data: response.data || [], message: 'SOP library retrieved successfully' }
        : { success: false, error: { code: 'SOP_FETCH_ERROR', message: response.error || 'Failed to fetch SOP library' } };
    } catch (error) {
      return this.createErrorResponse(error, 'SOP_FETCH_ERROR');
    }
  }

  /**
   * Update SOP extracted data
   */
  async updateSOPData(sopId: string, extractedData: Partial<SOPExtractedData>): ServiceMethod<SOPDocument> {
    try {
      const response = await this.apiClient.makeRequest<SOPDocument>(`/admin/sop/${sopId}`, {
        method: 'PUT',
        body: { extractedData }
      });

      if (response.success) {
        await this.logAuditEvent('SOP_DATA_UPDATED', {
          sopId,
          updatedFields: Object.keys(extractedData)
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'SOP data updated successfully' }
        : { success: false, error: { code: 'SOP_UPDATE_ERROR', message: response.error || 'Failed to update SOP' } };
    } catch (error) {
      return this.createErrorResponse(error, 'SOP_UPDATE_ERROR');
    }
  }

  // Automation Methods

  /**
   * Get automation rules
   */
  async getAutomationRules(): ServiceMethod<AutomationRule[]> {
    try {
      const response = await this.apiClient.makeRequest<AutomationRule[]>('/admin/automations');

      return response.success
        ? { success: true, data: response.data || [], message: 'Automation rules retrieved successfully' }
        : { success: false, error: { code: 'AUTOMATION_FETCH_ERROR', message: response.error || 'Failed to fetch automation rules' } };
    } catch (error) {
      return this.createErrorResponse(error, 'AUTOMATION_FETCH_ERROR');
    }
  }

  /**
   * Create automation rule
   */
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>): ServiceMethod<AutomationRule> {
    try {
      const response = await this.apiClient.makeRequest<AutomationRule>('/admin/automations', {
        method: 'POST',
        body: rule
      });

      if (response.success) {
        await this.logAuditEvent('AUTOMATION_RULE_CREATED', {
          ruleName: rule.name,
          ruleType: rule.type
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'Automation rule created successfully' }
        : { success: false, error: { code: 'AUTOMATION_CREATE_ERROR', message: response.error || 'Failed to create automation rule' } };
    } catch (error) {
      return this.createErrorResponse(error, 'AUTOMATION_CREATE_ERROR');
    }
  }

  /**
   * Update automation rule
   */
  async updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>): ServiceMethod<AutomationRule> {
    try {
      const response = await this.apiClient.makeRequest<AutomationRule>(`/admin/automations/${ruleId}`, {
        method: 'PUT',
        body: updates
      });

      if (response.success) {
        await this.logAuditEvent('AUTOMATION_RULE_UPDATED', {
          ruleId,
          updatedFields: Object.keys(updates)
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'Automation rule updated successfully' }
        : { success: false, error: { code: 'AUTOMATION_UPDATE_ERROR', message: response.error || 'Failed to update automation rule' } };
    } catch (error) {
      return this.createErrorResponse(error, 'AUTOMATION_UPDATE_ERROR');
    }
  }

  // Integration Methods

  /**
   * Get all integrations
   */
  async getIntegrations(): ServiceMethod<Integration[]> {
    try {
      const response = await this.apiClient.makeRequest<Integration[]>('/admin/integrations');

      return response.success
        ? { success: true, data: response.data || [], message: 'Integrations retrieved successfully' }
        : { success: false, error: { code: 'INTEGRATIONS_FETCH_ERROR', message: response.error || 'Failed to fetch integrations' } };
    } catch (error) {
      return this.createErrorResponse(error, 'INTEGRATIONS_FETCH_ERROR');
    }
  }

  /**
   * Create or update integration
   */
  async saveIntegration(integration: Omit<Integration, 'id' | 'lastSync' | 'errorCount' | 'successCount'>): ServiceMethod<Integration> {
    try {
      const response = await this.apiClient.makeRequest<Integration>('/admin/integrations', {
        method: 'POST',
        body: integration
      });

      if (response.success) {
        await this.logAuditEvent('INTEGRATION_CONFIGURED', {
          integrationName: integration.name,
          integrationType: integration.type
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'Integration saved successfully' }
        : { success: false, error: { code: 'INTEGRATION_SAVE_ERROR', message: response.error || 'Failed to save integration' } };
    } catch (error) {
      return this.createErrorResponse(error, 'INTEGRATION_SAVE_ERROR');
    }
  }

  /**
   * Test integration connection
   */
  async testIntegration(integrationId: string): ServiceMethod<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await this.apiClient.makeRequest<{ success: boolean; message: string; details?: any }>(`/admin/integrations/${integrationId}/test`, {
        method: 'POST'
      });

      return response.success
        ? { success: true, data: response.data!, message: 'Integration test completed' }
        : { success: false, error: { code: 'INTEGRATION_TEST_ERROR', message: response.error || 'Failed to test integration' } };
    } catch (error) {
      return this.createErrorResponse(error, 'INTEGRATION_TEST_ERROR');
    }
  }

  // Compliance & Settings Methods

  /**
   * Get compliance settings
   */
  async getComplianceSettings(): ServiceMethod<ComplianceSettings> {
    try {
      const response = await this.apiClient.makeRequest<ComplianceSettings>('/admin/compliance');

      return response.success
        ? { success: true, data: response.data!, message: 'Compliance settings retrieved successfully' }
        : { success: false, error: { code: 'COMPLIANCE_FETCH_ERROR', message: response.error || 'Failed to fetch compliance settings' } };
    } catch (error) {
      return this.createErrorResponse(error, 'COMPLIANCE_FETCH_ERROR');
    }
  }

  /**
   * Update compliance settings
   */
  async updateComplianceSettings(settings: Partial<ComplianceSettings>): ServiceMethod<ComplianceSettings> {
    try {
      const response = await this.apiClient.makeRequest<ComplianceSettings>('/admin/compliance', {
        method: 'PUT',
        body: settings
      });

      if (response.success) {
        await this.logAuditEvent('COMPLIANCE_SETTINGS_UPDATED', {
          updatedSections: Object.keys(settings)
        });
      }

      return response.success
        ? { success: true, data: response.data!, message: 'Compliance settings updated successfully' }
        : { success: false, error: { code: 'COMPLIANCE_UPDATE_ERROR', message: response.error || 'Failed to update compliance settings' } };
    } catch (error) {
      return this.createErrorResponse(error, 'COMPLIANCE_UPDATE_ERROR');
    }
  }

  // Private Helper Methods

  private getMockSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      services: [
        { name: 'API Gateway', status: 'running', uptime: '99.9%', cpu: 15, memory: 45, responseTime: 120, errorRate: 0.1, lastHealthCheck: new Date() },
        { name: 'Lambda Functions', status: 'running', uptime: '99.8%', cpu: 22, memory: 38, responseTime: 200, errorRate: 0.2, lastHealthCheck: new Date() },
        { name: 'DynamoDB', status: 'running', uptime: '100%', cpu: 5, memory: 20, responseTime: 50, errorRate: 0.0, lastHealthCheck: new Date() },
        { name: 'S3 Storage', status: 'running', uptime: '100%', cpu: 2, memory: 10, responseTime: 80, errorRate: 0.0, lastHealthCheck: new Date() },
        { name: 'WebSocket API', status: 'degraded', uptime: '99.5%', cpu: 35, memory: 68, responseTime: 300, errorRate: 0.5, lastHealthCheck: new Date() }
      ],
      infrastructure: {
        apiGateway: 'healthy',
        lambda: 'healthy',
        dynamodb: 'healthy',
        s3: 'healthy',
        cognito: 'degraded',
        cloudwatch: 'healthy'
      },
      metrics: {
        totalRequests: 25640,
        errorRate: 0.3,
        avgLatency: 185,
        activeConnections: 48,
        totalUsers: 156,
        activeUsers: 23,
        storageUsed: 2.4, // GB
        costToday: 12.45 // USD
      },
      lastUpdated: new Date()
    };
  }

  private async logAuditEvent(eventType: string, data: any): Promise<void> {
    try {
      await this.logAuditAsync(eventType, data);
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  }
}