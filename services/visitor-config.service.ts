/**
 * Visitor Management Configuration Service
 * Provides dynamic configuration management for visitor management integrations
 * Supports modular third-party integrations and workflow configuration
 */

import { BaseService } from './base.service';
import { 
  VisitorManagementConfig, 
  ProviderConfig, 
  WorkflowConfig, 
  NotificationConfig,
  AccessControlConfig,
  UISettings,
  IntegrationType
} from '../lib/types/visitor';
import { ServiceResponse, AuditContext, ValidationResult, BusinessRuleResult } from './types';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class VisitorConfigService extends BaseService<VisitorManagementConfig, string> {
  private configPath: string;
  private currentConfig: VisitorManagementConfig;
  private configWatchers: Array<(config: VisitorManagementConfig) => void> = [];

  constructor(configPath?: string) {
    super('visitor-config', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      cacheEnabled: false // Config changes should be immediate
    });

    this.configPath = configPath || join(process.cwd(), 'config', 'visitor-management.json');
    this.currentConfig = this.loadConfiguration();
  }

  protected validateEntity(config: Partial<VisitorManagementConfig>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!config) {
      errors.push({ field: 'config', message: 'Configuration is required' });
      return { isValid: false, errors, warnings: [] };
    }

    if (config.enabled === undefined) {
      errors.push({ field: 'enabled', message: 'Enabled flag is required' });
    }

    if (!config.integration_type) {
      errors.push({ field: 'integration_type', message: 'Integration type is required' });
    } else if (!this.isValidIntegrationType(config.integration_type)) {
      errors.push({ field: 'integration_type', message: `Invalid integration type: ${config.integration_type}` });
    }

    if (config.providers) {
      config.providers.forEach((provider, index) => {
        if (!provider.id) {
          errors.push({ field: `providers[${index}].id`, message: 'Provider ID is required' });
        }
        if (!provider.type) {
          errors.push({ field: `providers[${index}].type`, message: 'Provider type is required' });
        }
        if (!provider.api_config?.base_url) {
          errors.push({ field: `providers[${index}].api_config.base_url`, message: 'Provider base URL is required' });
        }
      });
    }

    if (config.workflows) {
      config.workflows.forEach((workflow, index) => {
        if (!workflow.id) {
          errors.push({ field: `workflows[${index}].id`, message: 'Workflow ID is required' });
        }
        if (!workflow.name) {
          errors.push({ field: `workflows[${index}].name`, message: 'Workflow name is required' });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(config: Partial<VisitorManagementConfig>, operation: string): BusinessRuleResult[] {
    const rules: BusinessRuleResult[] = [];

    // Ensure at least one provider is enabled if system is enabled
    if (config.enabled && config.providers) {
      const enabledProviders = config.providers.filter(p => p.enabled);
      if (enabledProviders.length === 0) {
        rules.push({
          passed: false,
          ruleName: 'minimum_providers',
          message: 'At least one provider must be enabled when system is enabled'
        });
      }
    }

    // Validate priority uniqueness
    if (config.providers) {
      const priorities = config.providers.map(p => p.priority);
      const uniquePriorities = new Set(priorities);
      if (uniquePriorities.size !== priorities.length) {
        rules.push({
          passed: false,
          ruleName: 'unique_priorities',
          message: 'Provider priorities must be unique'
        });
      }
    }

    return rules;
  }

  protected getEntityName(): string {
    return 'visitor-config';
  }

  private isValidIntegrationType(type: string): boolean {
    const validTypes: IntegrationType[] = ['lenel_onguard', 'hid_easylobby', 'custom_api', 'hybrid'];
    return validTypes.includes(type as IntegrationType);
  }

  // Configuration management
  async getConfiguration(context: AuditContext): Promise<ServiceResponse<VisitorManagementConfig>> {
    try {
      await this.auditLog(context, 'get_configuration', 'read');
      return this.createSuccessResponse(this.currentConfig);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : String(error));
    }
  }

  async updateConfiguration(config: Partial<VisitorManagementConfig>, context: AuditContext): Promise<ServiceResponse<VisitorManagementConfig>> {
    try {
      await this.validateInput(config);
      await this.enforceBusinessRules(config, 'update');

      const updatedConfig: VisitorManagementConfig = {
        ...this.currentConfig,
        ...config,
        updated_at: new Date()
      };

      this.saveConfiguration(updatedConfig);
      this.currentConfig = updatedConfig;
      this.notifyWatchers();

      await this.auditLog(context, 'update_configuration', 'update', undefined, this.currentConfig, updatedConfig);
      
      return this.createSuccessResponse(updatedConfig, 'Configuration updated successfully');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : String(error));
    }
  }

  async resetConfiguration(context: AuditContext): Promise<ServiceResponse<VisitorManagementConfig>> {
    try {
      const defaultConfig = this.getDefaultConfiguration();
      
      this.saveConfiguration(defaultConfig);
      this.currentConfig = defaultConfig;
      this.notifyWatchers();

      await this.auditLog(context, 'reset_configuration', 'reset');
      
      return this.createSuccessResponse(defaultConfig, 'Configuration reset to defaults');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : String(error));
    }
  }

  // Provider management
  async addProvider(provider: ProviderConfig, context: AuditContext): Promise<ServiceResponse<ProviderConfig>> {
    try {
      const existing = this.currentConfig.providers.find(p => p.id === provider.id);
      if (existing) {
        return this.createErrorResponse('Provider ID already exists', 'DUPLICATE');
      }

      this.currentConfig.providers.push(provider);
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'add_provider', 'create', provider.id);
      
      return this.createSuccessResponse(provider, 'Provider added successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async updateProvider(providerId: string, updates: Partial<ProviderConfig>, context: AuditContext): Promise<ServiceResponse<ProviderConfig>> {
    try {
      const providerIndex = this.currentConfig.providers.findIndex(p => p.id === providerId);
      if (providerIndex === -1) {
        return this.createErrorResponse('Provider not found', 'NOT_FOUND');
      }

      const updatedProvider = {
        ...this.currentConfig.providers[providerIndex],
        ...updates
      };

      this.currentConfig.providers[providerIndex] = updatedProvider;
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'update_provider', 'update', providerId);
      
      return this.createSuccessResponse(updatedProvider);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async removeProvider(providerId: string, context: AuditContext): Promise<ServiceResponse<void>> {
    try {
      const providerIndex = this.currentConfig.providers.findIndex(p => p.id === providerId);
      if (providerIndex === -1) {
        return this.createErrorResponse('Provider not found', 'NOT_FOUND');
      }

      this.currentConfig.providers.splice(providerIndex, 1);
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'remove_provider', 'delete', providerId);
      
      return this.createSuccessResponse(undefined, 'Provider removed successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // Workflow management
  async addWorkflow(workflow: WorkflowConfig, context: AuditContext): Promise<ServiceResponse<WorkflowConfig>> {
    try {
      const existing = this.currentConfig.workflows.find(w => w.id === workflow.id);
      if (existing) {
        return this.createErrorResponse('Workflow ID already exists', 'DUPLICATE');
      }

      this.currentConfig.workflows.push(workflow);
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'add_workflow', 'create', workflow.id);
      
      return this.createSuccessResponse(workflow, 'Workflow added successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<WorkflowConfig>, context: AuditContext): Promise<ServiceResponse<WorkflowConfig>> {
    try {
      const workflowIndex = this.currentConfig.workflows.findIndex(w => w.id === workflowId);
      if (workflowIndex === -1) {
        return this.createErrorResponse('Workflow not found', 'NOT_FOUND');
      }

      const updatedWorkflow = {
        ...this.currentConfig.workflows[workflowIndex],
        ...updates
      };

      this.currentConfig.workflows[workflowIndex] = updatedWorkflow;
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'update_workflow', 'update', workflowId);
      
      return this.createSuccessResponse(updatedWorkflow);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async removeWorkflow(workflowId: string, context: AuditContext): Promise<ServiceResponse<void>> {
    try {
      const workflowIndex = this.currentConfig.workflows.findIndex(w => w.id === workflowId);
      if (workflowIndex === -1) {
        return this.createErrorResponse('Workflow not found', 'NOT_FOUND');
      }

      this.currentConfig.workflows.splice(workflowIndex, 1);
      this.saveConfiguration(this.currentConfig);
      this.notifyWatchers();

      await this.auditLog(context, 'remove_workflow', 'delete', workflowId);
      
      return this.createSuccessResponse(undefined, 'Workflow removed successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // Configuration validation
  async validateConfiguration(context: AuditContext): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    try {
      const validation = this.validateEntity(this.currentConfig);
      const warnings: string[] = [];

      // Additional validation checks
      if (this.currentConfig.enabled) {
        const enabledProviders = this.currentConfig.providers.filter(p => p.enabled);
        if (enabledProviders.length === 0) {
          warnings.push('No providers are enabled - system will not function');
        }

        const lenelProvider = this.currentConfig.providers.find(p => p.type === 'lenel_onguard' && p.enabled);
        if (!lenelProvider) {
          warnings.push('Lenel OnGuard integration not enabled - access control features may be limited');
        }
      }

      await this.auditLog(context, 'validate_configuration');
      
      return this.createSuccessResponse({
        isValid: validation.isValid,
        errors: validation.errors,
        warnings
      });
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  // Configuration export/import
  async exportConfiguration(context: AuditContext): Promise<ServiceResponse<string>> {
    try {
      const configJson = JSON.stringify(this.currentConfig, null, 2);
      
      await this.auditLog(context, 'export_configuration');
      
      return this.createSuccessResponse(configJson, 'Configuration exported successfully');
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async importConfiguration(configJson: string, context: AuditContext): Promise<ServiceResponse<VisitorManagementConfig>> {
    try {
      const importedConfig = JSON.parse(configJson);
      
      const result = await this.updateConfiguration(importedConfig, context);
      
      return result;
    } catch (error) {
      return this.createErrorResponse(error, 'INVALID_JSON');
    }
  }

  // Configuration watching
  onConfigurationChange(callback: (config: VisitorManagementConfig) => void): void {
    this.configWatchers.push(callback);
  }

  offConfigurationChange(callback: (config: VisitorManagementConfig) => void): void {
    this.configWatchers = this.configWatchers.filter(cb => cb !== callback);
  }

  private notifyWatchers(): void {
    this.configWatchers.forEach(callback => {
      try {
        callback(this.currentConfig);
      } catch (error) {
        console.error('Error in configuration watcher:', error);
      }
    });
  }

  // Private methods
  private loadConfiguration(): VisitorManagementConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
    }

    return this.getDefaultConfiguration();
  }

  private saveConfiguration(config: VisitorManagementConfig): void {
    try {
      const configDir = this.configPath.split('/').slice(0, -1).join('/');
      if (!existsSync(configDir)) {
        require('fs').mkdirSync(configDir, { recursive: true });
      }
      
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  private getDefaultConfiguration(): VisitorManagementConfig {
    return {
      enabled: true,
      integration_type: 'lenel_onguard',
      providers: [
        {
          id: 'lenel-primary',
          name: 'Lenel OnGuard Primary',
          type: 'lenel_onguard',
          enabled: true,
          api_config: {
            base_url: 'https://lenel-server.company.com/api',
            timeout_ms: 30000,
            retry_count: 3,
            webhook_url: 'https://situ8.company.com/webhooks/lenel'
          },
          features: ['access_control', 'card_management', 'visitor_sync'],
          priority: 1
        },
        {
          id: 'hid-backup',
          name: 'HID EasyLobby Backup',
          type: 'hid_easylobby',
          enabled: false,
          api_config: {
            base_url: 'https://easylobby.company.com/api',
            timeout_ms: 30000,
            retry_count: 2
          },
          features: ['visitor_registration', 'badge_printing'],
          priority: 2
        }
      ],
      workflows: [
        {
          id: 'standard_check_in',
          name: 'Standard Check-in Workflow',
          enabled: true,
          triggers: [
            {
              type: 'visitor_check_in',
              source: 'kiosk',
              event: 'check_in_initiated'
            }
          ],
          actions: [
            {
              type: 'send_notification',
              target: 'host',
              parameters: {
                message: 'Your visitor has arrived',
                channels: ['email', 'sms']
              }
            },
            {
              type: 'log_audit',
              target: 'system',
              parameters: {
                event_type: 'visitor_check_in'
              }
            }
          ],
          conditions: [
            {
              field: 'priority',
              operator: 'not_equals',
              value: 'vip'
            }
          ]
        },
        {
          id: 'vip_check_in',
          name: 'VIP Check-in Workflow',
          enabled: true,
          triggers: [
            {
              type: 'visitor_check_in',
              source: 'guard',
              event: 'vip_check_in'
            }
          ],
          actions: [
            {
              type: 'send_notification',
              target: 'security_manager',
              parameters: {
                message: 'VIP visitor has arrived',
                channels: ['email', 'sms', 'push']
              }
            },
            {
              type: 'escalate_security',
              target: 'security_team',
              parameters: {
                priority: 'high'
              }
            }
          ],
          conditions: [
            {
              field: 'priority',
              operator: 'equals',
              value: 'vip'
            }
          ]
        }
      ],
      access_control: {
        lenel_config: {
          server_url: 'lenel://primary-server.company.com',
          database_connection: 'lenel_db_connection_string',
          card_format: 'H10301',
          clearance_levels: ['visitor', 'contractor', 'vip', 'emergency'],
          visitor_card_type: 'TEMPORARY',
          default_expiry_hours: 8
        },
        card_templates: [
          {
            id: 'standard_visitor',
            name: 'Standard Visitor Badge',
            template_file: 'templates/standard_visitor.html',
            fields: ['visitor_number', 'name', 'company', 'host', 'expiry', 'photo'],
            enabled: true
          },
          {
            id: 'vip_visitor',
            name: 'VIP Visitor Badge',
            template_file: 'templates/vip_visitor.html',
            fields: ['visitor_number', 'name', 'company', 'host', 'expiry', 'photo', 'vip_indicator'],
            enabled: true
          }
        ],
        access_levels: [
          {
            id: 'lobby_access',
            name: 'Lobby Only',
            description: 'Access to main lobby and public areas',
            zones: ['lobby', 'reception', 'public_restrooms'],
            time_restrictions: [
              {
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                start_time: '08:00',
                end_time: '18:00'
              }
            ]
          },
          {
            id: 'general_access',
            name: 'General Building Access',
            description: 'Access to most areas except secure zones',
            zones: ['lobby', 'conference_rooms', 'break_rooms', 'general_offices'],
            time_restrictions: [
              {
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                start_time: '07:00',
                end_time: '19:00'
              }
            ]
          }
        ],
        visitor_zones: [
          {
            id: 'main_lobby',
            name: 'Main Lobby',
            building_id: 'building-1',
            requires_escort: false,
            security_level: 'public'
          },
          {
            id: 'conference_a',
            name: 'Conference Room A',
            building_id: 'building-1',
            floor_id: 'floor-2',
            requires_escort: false,
            security_level: 'public'
          },
          {
            id: 'executive_floor',
            name: 'Executive Floor',
            building_id: 'building-1',
            floor_id: 'floor-10',
            requires_escort: true,
            security_level: 'restricted'
          }
        ]
      },
      notifications: {
        channels: [
          {
            id: 'email_primary',
            type: 'email',
            enabled: true,
            config: {
              smtp_server: 'smtp.company.com',
              port: 587,
              username: 'notifications@company.com',
              encryption: 'STARTTLS'
            }
          },
          {
            id: 'sms_primary',
            type: 'sms',
            enabled: true,
            config: {
              provider: 'twilio',
              account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
              from_number: '+1234567890'
            }
          },
          {
            id: 'webhook_security',
            type: 'webhook',
            enabled: true,
            config: {
              url: 'https://security.company.com/webhooks/visitor-events',
              headers: {
                'Authorization': 'Bearer security_token',
                'Content-Type': 'application/json'
              }
            }
          }
        ],
        templates: [
          {
            id: 'host_notification',
            name: 'Host Notification',
            type: 'visitor_arrival',
            subject: 'Visitor Arrival: {visitor_name}',
            body: 'Your visitor {visitor_name} from {company} has arrived at {location}.',
            variables: ['visitor_name', 'company', 'location', 'arrival_time']
          },
          {
            id: 'security_alert',
            name: 'Security Alert',
            type: 'security_incident',
            subject: 'Security Alert: {alert_type}',
            body: 'Security incident involving visitor {visitor_name}. Immediate attention required.',
            variables: ['visitor_name', 'alert_type', 'location', 'timestamp']
          }
        ],
        rules: [
          {
            id: 'host_notification_rule',
            event_type: 'visitor_check_in',
            recipients: ['{host_user_id}'],
            channels: ['email_primary', 'sms_primary'],
            delay_minutes: 0
          },
          {
            id: 'security_escalation',
            event_type: 'access_denied',
            recipients: ['security_team', 'facility_manager'],
            channels: ['webhook_security', 'sms_primary'],
            delay_minutes: 0
          }
        ]
      },
      compliance: {
        data_retention_days: 2555, // 7 years
        privacy_settings: {
          mask_visitor_data: false,
          retention_period_days: 2555,
          anonymize_after_days: 90,
          allowed_data_sharing: ['security_team', 'host_employee', 'compliance_officer']
        },
        audit_requirements: [
          {
            event_type: 'visitor_check_in',
            required_fields: ['visitor_id', 'timestamp', 'method', 'location', 'operator'],
            retention_period: '7_years'
          },
          {
            event_type: 'visitor_check_out',
            required_fields: ['visitor_id', 'timestamp', 'duration', 'operator'],
            retention_period: '7_years'
          }
        ],
        document_requirements: [
          {
            type: 'government_id',
            required: false,
            max_age_days: 3650,
            verification_required: true
          },
          {
            type: 'nda',
            required: true,
            max_age_days: 365,
            verification_required: true
          }
        ]
      },
      ui_settings: {
        check_in_flow: {
          steps: [
            {
              id: 'welcome',
              name: 'Welcome',
              required: true,
              type: 'form'
            },
            {
              id: 'visitor_info',
              name: 'Visitor Information',
              required: true,
              type: 'form'
            },
            {
              id: 'host_selection',
              name: 'Select Host',
              required: true,
              type: 'form'
            },
            {
              id: 'photo',
              name: 'Take Photo',
              required: true,
              type: 'photo'
            },
            {
              id: 'signature',
              name: 'Digital Signature',
              required: true,
              type: 'signature'
            },
            {
              id: 'badge_print',
              name: 'Print Badge',
              required: false,
              type: 'form'
            }
          ],
          require_photo: true,
          require_signature: true,
          require_documents: ['nda'],
          allow_pre_check_in: true
        },
        kiosk_config: {
          enabled: true,
          locations: ['main_lobby', 'building_a_lobby', 'building_b_lobby'],
          idle_timeout_seconds: 120,
          require_assistance: false,
          print_badges: true
        },
        mobile_config: {
          enabled: true,
          app_required: false,
          qr_code_check_in: true,
          geofencing: true
        },
        branding: {
          primary_color: '#2563eb',
          welcome_message: 'Welcome to Company - Please check in',
          company_name: 'Company Security',
          privacy_policy_url: 'https://company.com/privacy'
        }
      }
    };
  }
}