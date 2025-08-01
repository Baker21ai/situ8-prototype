/**
 * Visitor Management System Types
 * Modular visitor management with configurable third-party integrations
 * Designed for Lenel access control integration and extensibility
 */

import { AuditableEntity, Site, Building, Zone, User } from './common';

// Core visitor entity based on Lenel access control patterns
export interface Visitor extends AuditableEntity {
  id: string;
  visitor_number: string; // Lenel-style visitor ID (e.g., V2024001234)
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  host_user_id: string; // Person they're visiting
  host_name: string;
  purpose: string;
  priority: 'standard' | 'vip' | 'contractor' | 'emergency';
  
  // Access control integration
  access_level: string; // Lenel clearance level
  card_number?: string; // Temporary access card
  pin_code?: string; // Temporary PIN
  
  // Visit details
  expected_arrival: Date;
  expected_departure: Date;
  actual_arrival?: Date;
  actual_departure?: Date;
  
  // Location tracking
  site_id: string;
  building_id?: string;
  zone_id?: string;
  
  // Status workflow
  status: VisitorStatus;
  check_in_method: CheckInMethod;
  
  // Security screening
  pre_screening_passed: boolean;
  background_check_required: boolean;
  background_check_status: BackgroundCheckStatus;
  
  // Documents and compliance
  photo_url?: string;
  signature_url?: string;
  documents: VisitorDocument[];
  agreements_signed: string[]; // List of agreement IDs signed
  
  // Emergency contact
  emergency_contact?: EmergencyContact;
  
  // Integration metadata
  integration_source: string; // Which system created this visitor
  external_id?: string; // ID in external system
  sync_status: SyncStatus;
}

export interface VisitorStatus {
  current: VisitorState;
  history: VisitorStatusHistory[];
}

export type VisitorState = 
  | 'pre_registered'     // Visitor registered but not yet arrived
  | 'checked_in'         // Visitor has checked in
  | 'in_facility'        // Visitor is currently in facility
  | 'checked_out'        // Visitor has checked out
  | 'expired'           // Visit time expired without check-in
  | 'cancelled'         // Visit was cancelled
  | 'denied'            // Access denied
  | 'escalated'         // Requires security review

export interface VisitorStatusHistory {
  state: VisitorState;
  timestamp: Date;
  changed_by: string;
  reason?: string;
  location?: string;
}

export type CheckInMethod = 
  | 'kiosk'           // Self-service kiosk
  | 'guard'           // Security guard assisted
  | 'mobile'          // Mobile app check-in
  | 'pre_check_in'    // Remote pre-check-in
  | 'emergency'       // Emergency override

export type BackgroundCheckStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'expired'

export interface VisitorDocument {
  id: string;
  type: DocumentType;
  filename: string;
  url: string;
  uploaded_at: Date;
  verified: boolean;
  verified_by?: string;
  expires_at?: Date;
}

export type DocumentType =
  | 'government_id'
  | 'driver_license'
  | 'passport'
  | 'company_badge'
  | 'insurance_card'
  | 'work_order'
  | 'nda'
  | 'safety_certificate'
  | 'other'

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export type SyncStatus =
  | 'synced'
  | 'pending_sync'
  | 'sync_failed'
  | 'manual_override'

// Visitor management configuration
export interface VisitorManagementConfig {
  enabled: boolean;
  integration_type: IntegrationType;
  providers: ProviderConfig[];
  workflows: WorkflowConfig[];
  access_control: AccessControlConfig;
  notifications: NotificationConfig;
  compliance: ComplianceConfig;
  ui_settings: UISettings;
}

export type IntegrationType =
  | 'lenel_onguard'
  | 'hid_easylobby'
  | 'custom_api'
  | 'hybrid'

export interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  api_config: APIConfig;
  features: string[];
  priority: number;
}

export interface APIConfig {
  base_url: string;
  api_key?: string;
  username?: string;
  password?: string;
  timeout_ms: number;
  retry_count: number;
  webhook_url?: string;
  custom_headers?: Record<string, string>;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  enabled: boolean;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
}

export interface WorkflowTrigger {
  type: TriggerType;
  source: string;
  event: string;
  filters?: Record<string, any>;
}

export type TriggerType =
  | 'visitor_check_in'
  | 'visitor_check_out'
  | 'access_denied'
  | 'background_check_complete'
  | 'expired_visit'
  | 'emergency_alert'

export interface WorkflowAction {
  type: ActionType;
  target: string;
  parameters: Record<string, any>;
}

export type ActionType =
  | 'send_notification'
  | 'update_access_level'
  | 'escalate_security'
  | 'create_incident'
  | 'log_audit'
  | 'call_webhook'

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface AccessControlConfig {
  lenel_config: LenelConfig;
  card_templates: CardTemplate[];
  access_levels: AccessLevel[];
  visitor_zones: VisitorZone[];
}

export interface LenelConfig {
  server_url: string;
  database_connection: string;
  card_format: string;
  clearance_levels: string[];
  visitor_card_type: string;
  default_expiry_hours: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  template_file: string;
  fields: string[];
  enabled: boolean;
}

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  zones: string[];
  time_restrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  days: string[];
  start_time: string;
  end_time: string;
}

export interface VisitorZone {
  id: string;
  name: string;
  building_id: string;
  floor_id?: string;
  requires_escort: boolean;
  security_level: 'public' | 'restricted' | 'secure';
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
  rules: NotificationRule[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'radio';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  variables: string[];
}

export interface NotificationRule {
  id: string;
  event_type: string;
  recipients: string[];
  channels: string[];
  delay_minutes: number;
}

export interface ComplianceConfig {
  data_retention_days: number;
  privacy_settings: PrivacySettings;
  audit_requirements: AuditRequirement[];
  document_requirements: DocumentRequirement[];
}

export interface PrivacySettings {
  mask_visitor_data: boolean;
  retention_period_days: number;
  anonymize_after_days: number;
  allowed_data_sharing: string[];
}

export interface AuditRequirement {
  event_type: string;
  required_fields: string[];
  retention_period: string;
}

export interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  max_age_days: number;
  verification_required: boolean;
}

export interface UISettings {
  check_in_flow: CheckInFlowConfig;
  kiosk_config: KioskConfig;
  mobile_config: MobileConfig;
  branding: BrandingConfig;
}

export interface CheckInFlowConfig {
  steps: CheckInStep[];
  require_photo: boolean;
  require_signature: boolean;
  require_documents: DocumentType[];
  allow_pre_check_in: boolean;
}

export interface CheckInStep {
  id: string;
  name: string;
  required: boolean;
  type: 'form' | 'photo' | 'signature' | 'document' | 'agreement';
}

export interface KioskConfig {
  enabled: boolean;
  locations: string[];
  idle_timeout_seconds: number;
  require_assistance: boolean;
  print_badges: boolean;
}

export interface MobileConfig {
  enabled: boolean;
  app_required: boolean;
  qr_code_check_in: boolean;
  geofencing: boolean;
}

export interface BrandingConfig {
  logo_url?: string;
  primary_color: string;
  welcome_message: string;
  company_name: string;
  privacy_policy_url?: string;
}

// Search and filtering for visitors
export interface VisitorSearchRequest {
  filters: VisitorFilter[];
  sort: SortOption[];
  pagination: PaginationOptions;
  date_range?: DateRange;
  include_history?: boolean;
}

export interface VisitorFilter {
  field: VisitorField;
  operator: FilterOperator;
  value: any;
}

export type VisitorField =
  | 'visitor_number'
  | 'name'
  | 'email'
  | 'company'
  | 'host_user_id'
  | 'status'
  | 'site_id'
  | 'building_id'
  | 'access_level'
  | 'priority'
  | 'date_range'
  | 'expected_arrival'
  | 'integration_source'

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'between'

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SortOption {
  field: VisitorField;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// Visitor statistics and analytics
export interface VisitorStats {
  total_visitors: number;
  active_visitors: number;
  checked_in_today: number;
  expected_today: number;
  average_visit_duration: number; // minutes
  popular_destinations: DestinationStats[];
  security_incidents: number;
  compliance_score: number;
}

export interface DestinationStats {
  zone_id: string;
  zone_name: string;
  visitor_count: number;
  percentage: number;
}

// Integration response types
export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  external_id?: string;
  sync_timestamp?: Date;
}

export interface VisitorSyncRequest {
  visitor_id: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Visitor>;
  force_sync?: boolean;
}