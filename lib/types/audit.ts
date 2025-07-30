/**
 * Audit trail types for the Situ8 business logic system
 * Implements WHO, WHAT, WHEN, WHERE, WHY audit requirements
 */

import { User } from './common';

// Core audit entry interface
export interface AuditEntry {
  id: string;
  
  // WHO - User information
  user_id: string;
  user_name: string;
  user_role: string;
  user_ip?: string;
  user_agent?: string;
  
  // WHAT - Action details
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  
  // WHEN - Timestamp information
  timestamp: Date;
  session_id?: string;
  
  // WHERE - Location context
  site_id?: string;
  site_name?: string;
  building_id?: string;
  zone_id?: string;
  
  // WHY - Reason and context
  reason?: string;
  context?: AuditContext;
  
  // Change tracking
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  changes?: FieldChange[];
  
  // System metadata
  source: 'web' | 'mobile' | 'api' | 'system';
  correlation_id?: string; // For tracking related operations
  
  // Compliance and retention
  retention_date: Date; // When this audit entry can be purged
  is_sensitive: boolean; // Contains PII or sensitive data
}

// Types of actions that can be audited
export type AuditAction = 
  // Entity lifecycle
  | 'create'
  | 'read'
  | 'update' 
  | 'delete'
  | 'archive'
  | 'restore'
  
  // Status changes
  | 'status_change'
  | 'assign'
  | 'reassign'
  | 'escalate'
  | 'resolve'
  
  // Relationship operations
  | 'link'
  | 'unlink'
  | 'merge'
  | 'split'
  
  // Permission operations
  | 'grant_access'
  | 'revoke_access'
  | 'permission_check'
  
  // Data operations
  | 'export'
  | 'import'
  | 'backup'
  | 'restore_backup'
  
  // Authentication
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  
  // System operations
  | 'configuration_change'
  | 'system_maintenance'
  | 'data_migration';

// Entity types that can be audited
export type EntityType = 
  | 'activity'
  | 'incident'
  | 'case'
  | 'bol'
  | 'user'
  | 'role'
  | 'site'
  | 'building'
  | 'zone'
  | 'notification'
  | 'comment'
  | 'attachment'
  | 'configuration';

// Additional context for audit entries
export interface AuditContext {
  // Related entities
  related_activities?: string[];
  related_incidents?: string[];
  related_cases?: string[];
  related_bols?: string[];
  
  // Business context
  business_justification?: string;
  priority_level?: string;
  urgency_reason?: string;
  
  // Technical context
  system_version?: string;
  feature_flag?: string;
  api_endpoint?: string;
  
  // Integration context
  external_system?: string;
  external_reference?: string;
  
  // Workflow context
  workflow_step?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
}

// Individual field changes for detailed tracking
export interface FieldChange {
  field_name: string;
  old_value: any;
  new_value: any;
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  is_sensitive: boolean; // Should be masked in certain contexts
}

// Audit search and filtering
export interface AuditSearchRequest {
  // Basic filters
  user_id?: string;
  entity_type?: EntityType;
  entity_id?: string;
  action?: AuditAction;
  
  // Time range
  start_date?: Date;
  end_date?: Date;
  
  // Location filters
  site_id?: string;
  building_id?: string;
  zone_id?: string;
  
  // Content search
  search_term?: string; // Search in descriptions, reasons, etc.
  
  // Advanced filters
  source?: string;
  has_changes?: boolean;
  is_sensitive?: boolean;
  
  // Pagination
  page?: number;
  limit?: number;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

// Audit statistics for reporting
export interface AuditStatistics {
  total_entries: number;
  entries_by_action: Record<AuditAction, number>;
  entries_by_user: Record<string, number>;
  entries_by_entity_type: Record<EntityType, number>;
  entries_by_date: Record<string, number>; // Date string as key
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    entry_count: number;
  }>;
  most_modified_entities: Array<{
    entity_type: EntityType;
    entity_id: string;
    modification_count: number;
  }>;
}

// Audit configuration
export interface AuditConfiguration {
  // Retention settings
  default_retention_days: number;
  sensitive_retention_days: number;
  
  // What to audit
  enabled_entity_types: EntityType[];
  enabled_actions: AuditAction[];
  
  // Privacy settings
  mask_sensitive_fields: boolean;
  log_user_agents: boolean;
  log_ip_addresses: boolean;
  
  // Performance settings
  batch_size: number;
  async_logging: boolean;
  
  // Alerting
  alert_on_bulk_operations: boolean;
  alert_threshold: number;
  alert_recipients: string[];
}

// Pre-defined audit templates for common operations
export interface AuditTemplate {
  name: string;
  description: string;
  entity_type: EntityType;
  action: AuditAction;
  required_context_fields: string[];
  retention_override_days?: number;
  is_sensitive_by_default: boolean;
}

// Compliance reporting
export interface ComplianceReport {
  id: string;
  report_type: 'access_log' | 'data_changes' | 'user_activity' | 'system_events';
  generated_by: string;
  generated_at: Date;
  parameters: AuditSearchRequest;
  results: AuditEntry[];
  statistics: AuditStatistics;
  file_path?: string; // For exported reports
  expires_at: Date;
}