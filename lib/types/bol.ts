/**
 * BOL (Be-On-Lookout) types for the Situ8 business logic system
 * BOLs create activities when patterns/subjects are detected with confidence scoring
 */

import { Priority, User, Site, Timestamps } from './common';
import { BaseActivity } from './activity';

// Core BOL interface
export interface BOL extends Timestamps {
  id: string;
  
  // Basic BOL information
  title: string;
  description: string;
  bol_number: string; // Formatted BOL number (e.g., BOL-2024-001234)
  type: BOLType;
  status: BOLStatus;
  priority: Priority;
  urgency_level: UrgencyLevel;
  
  // Subject information
  subject: BOLSubject;
  
  // Detection criteria
  detection_criteria: DetectionCriteria;
  confidence_thresholds: ConfidenceThresholds;
  
  // Geographic scope
  active_sites: string[]; // Site IDs where BOL is active
  distribution_scope: DistributionScope;
  geographic_restrictions?: GeographicRestriction[];
  
  // Temporal scope
  effective_from: Date;
  effective_until?: Date; // null means indefinite
  time_restrictions?: TimeRestriction[];
  
  // Issuing authority information
  issued_by: string; // User ID
  issuing_agency?: string;
  external_reference?: string;
  authorization_level: AuthorizationLevel;
  
  // Related entities
  source_incident_id?: string; // If created from an incident
  source_case_id?: string; // If part of ongoing investigation
  related_bols: string[]; // Related BOL IDs
  
  // Response instructions
  response_protocol: ResponseProtocol;
  contact_instructions: ContactInstruction[];
  special_handling_notes?: string;
  
  // Pattern matching and AI
  detection_patterns: DetectionPattern[];
  ai_model_settings: AIModelSettings;
  false_positive_feedback: FalsePositiveFeedback[];
  
  // Activity generation
  generated_activities: string[]; // Activity IDs created by this BOL
  activity_generation_rules: ActivityGenerationRule[];
  
  // Performance tracking
  detection_statistics: DetectionStatistics;
  effectiveness_metrics: EffectivenessMetrics;
  
  // Distribution and notifications
  notification_settings: NotificationSettings;
  distribution_list: string[]; // User IDs who receive notifications
  external_distribution: ExternalDistribution[];
  
  // Legal and compliance
  legal_basis?: string;
  privacy_considerations: string[];
  retention_requirements: RetentionRequirements;
  
  // Updates and modifications
  modification_history: BOLModification[];
  last_reviewed_at?: Date;
  next_review_date?: Date;
  
  // Closure information
  closed_at?: Date;
  closed_by?: string;
  closure_reason?: BOLClosureReason;
  closure_summary?: string;
  outcome_summary?: string;
}

// Types of BOLs based on subject matter
export type BOLType = 
  | 'person_of_interest'    // Individual person
  | 'suspect'               // Criminal suspect
  | 'missing_person'        // Missing individual
  | 'vehicle'               // Vehicle lookout
  | 'object'                // Specific object/item
  | 'behavior_pattern'      // Behavioral pattern
  | 'threat_indicator'      // Security threat indicators
  | 'contraband'            // Prohibited items
  | 'unauthorized_access'   // Access pattern monitoring
  | 'fraud_pattern'         // Fraud indicators
  | 'safety_hazard'         // Safety-related lookouts
  | 'other';

// BOL status lifecycle
export type BOLStatus = 
  | 'draft'        // Being prepared
  | 'pending_approval' // Awaiting approval
  | 'active'       // Currently active and monitoring
  | 'suspended'    // Temporarily suspended
  | 'expired'      // Past effective date
  | 'resolved'     // Subject found/resolved
  | 'cancelled'    // Cancelled before resolution
  | 'archived';    // Archived for records

// Urgency levels affecting response protocols
export type UrgencyLevel = 
  | 'routine'      // Standard monitoring
  | 'elevated'     // Increased attention
  | 'urgent'       // Immediate response required
  | 'critical'     // Emergency response
  | 'imminent';    // Imminent threat

// Subject description and identifiers
export interface BOLSubject {
  // Basic identification
  type: 'person' | 'vehicle' | 'object' | 'pattern';
  primary_identifier: string;
  aliases: string[];
  
  // Physical description (for persons)
  physical_description?: PhysicalDescription;
  
  // Vehicle information
  vehicle_details?: VehicleDetails;
  
  // Object description
  object_details?: ObjectDetails;
  
  // Pattern description
  pattern_details?: PatternDetails;
  
  // Visual references
  reference_images: ReferenceImage[];
  reference_videos?: ReferenceVideo[];
  
  // Biometric data
  biometric_identifiers?: BiometricIdentifiers;
  
  // Known associates and connections
  known_associates: string[];
  frequent_locations: string[];
  behavioral_patterns: string[];
  
  // Risk assessment
  threat_level: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  risk_factors: string[];
  known_weapons?: boolean;
  violence_history?: boolean;
}

// Physical description for persons
export interface PhysicalDescription {
  gender?: 'male' | 'female' | 'unknown';
  age_range?: string;
  height_range?: string;
  weight_range?: string;
  build?: 'slim' | 'average' | 'heavy' | 'muscular';
  hair_color?: string;
  hair_style?: string;
  eye_color?: string;
  skin_tone?: string;
  distinguishing_marks: string[];
  clothing_description?: string;
  accessories?: string[];
}

// Vehicle identification details
export interface VehicleDetails {
  make?: string;
  model?: string;
  year_range?: string;
  color: string;
  license_plate?: string;
  license_state?: string;
  vin?: string;
  vehicle_type: 'sedan' | 'suv' | 'truck' | 'van' | 'motorcycle' | 'other';
  distinguishing_features: string[];
  damage_description?: string;
}

// Object identification details
export interface ObjectDetails {
  category: string;
  brand?: string;
  model?: string;
  color?: string[];
  size_description?: string;
  serial_number?: string;
  unique_identifiers: string[];
  estimated_value?: number;
}

// Pattern identification details
export interface PatternDetails {
  pattern_type: 'behavioral' | 'temporal' | 'spatial' | 'operational';
  pattern_description: string;
  trigger_conditions: string[];
  frequency_indicators: string[];
  location_patterns?: string[];
  time_patterns?: string[];
}

// Reference images with metadata
export interface ReferenceImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  description: string;
  quality_score: number; // 1-10
  date_taken?: Date;
  source: string;
  confidence_value: number; // How confident this represents the subject
  facial_recognition_enabled?: boolean;
  key_features_highlighted?: string[];
}

// Reference videos
export interface ReferenceVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  description: string;
  duration_seconds: number;
  quality_score: number;
  date_recorded?: Date;
  source: string;
  key_timestamps: Array<{
    timestamp: number;
    description: string;
  }>;
}

// Biometric identifiers
export interface BiometricIdentifiers {
  facial_recognition_template?: string;
  fingerprint_data?: string;
  iris_scan_data?: string;
  voice_print?: string;
  gait_analysis?: string;
  dna_profile?: string;
}

// Detection criteria for AI systems
export interface DetectionCriteria {
  // Visual detection
  facial_recognition_enabled: boolean;
  object_recognition_enabled: boolean;
  behavioral_analysis_enabled: boolean;
  pattern_matching_enabled: boolean;
  
  // Detection parameters
  minimum_image_quality: number;
  minimum_subject_size: number; // percentage of frame
  lighting_requirements: 'any' | 'good' | 'excellent';
  angle_restrictions?: string[];
  
  // Spatial criteria
  detection_zones?: string[]; // Specific zones to monitor
  exclusion_zones?: string[]; // Zones to ignore
  
  // Temporal criteria
  detection_hours?: string; // e.g., "09:00-17:00"
  detection_days?: string[]; // Days of week
  
  // Context criteria
  context_requirements?: string[];
  co_occurrence_patterns?: string[];
}

// Confidence thresholds for different response levels
export interface ConfidenceThresholds {
  // Confidence levels that trigger different responses
  low_confidence: number;     // Default: 70% - Log only
  medium_confidence: number;  // Default: 85% - Create activity
  high_confidence: number;    // Default: 95% - Immediate alert
  
  // Response actions for each level
  low_confidence_action: ResponseAction;
  medium_confidence_action: ResponseAction;
  high_confidence_action: ResponseAction;
  
  // Adjustment settings
  dynamic_adjustment: boolean; // Adjust based on false positives
  learning_enabled: boolean;   // Machine learning improvements
}

// Response actions for different confidence levels
export interface ResponseAction {
  create_activity: boolean;
  notify_security: boolean;
  notify_management: boolean;
  notify_external: boolean;
  immediate_response: boolean;
  lockdown_procedures: boolean;
  activity_priority: Priority;
  custom_instructions?: string[];
}

// Geographic distribution scope
export type DistributionScope = 
  | 'single_site'    // One specific site
  | 'regional'       // Multiple sites in region
  | 'enterprise'     // All sites in organization
  | 'external'       // Shared with external agencies
  | 'custom';        // Custom site selection

// Geographic restrictions
export interface GeographicRestriction {
  type: 'include' | 'exclude';
  scope: 'site' | 'building' | 'zone' | 'area';
  identifiers: string[];
  reason?: string;
}

// Time-based restrictions
export interface TimeRestriction {
  type: 'active_hours' | 'inactive_hours' | 'specific_dates';
  time_pattern: string; // cron-like pattern or specific format
  timezone: string;
  description: string;
}

// Authorization levels for BOL issuance
export type AuthorizationLevel = 
  | 'security_officer'   // Basic security staff
  | 'security_supervisor' // Security management
  | 'facility_manager'   // Site management
  | 'regional_manager'   // Regional authority
  | 'corporate_security' // Corporate security
  | 'law_enforcement'    // External law enforcement
  | 'federal_authority'; // Federal agencies

// Response protocols for detections
export interface ResponseProtocol {
  immediate_actions: string[];
  notification_sequence: NotificationStep[];
  escalation_triggers: EscalationTrigger[];
  containment_procedures?: string[];
  evidence_collection_requirements: string[];
  safety_precautions: string[];
  legal_considerations: string[];
}

// Notification steps in sequence
export interface NotificationStep {
  sequence_order: number;
  recipient_type: 'user' | 'role' | 'external_agency';
  recipient_identifier: string;
  notification_method: 'immediate' | 'sms' | 'email' | 'radio' | 'all';
  message_template: string;
  timeout_minutes?: number; // Escalate if no response
}

// Contact instructions for personnel
export interface ContactInstruction {
  contact_type: 'do_not_approach' | 'observe_only' | 'detain_if_safe' | 'immediate_contact';
  specific_instructions: string[];
  safety_warnings: string[];
  legal_authority?: string;
  backup_procedures: string[];
}

// Escalation triggers
export interface EscalationTrigger {
  condition: string; // Description of trigger condition
  confidence_threshold?: number;
  time_delay_minutes?: number;
  escalation_action: ResponseAction;
  notification_override: NotificationStep[];
}

// Detection patterns for AI matching
export interface DetectionPattern {
  id: string;
  pattern_name: string;
  pattern_type: 'visual' | 'behavioral' | 'temporal' | 'spatial';
  algorithm: string;
  parameters: Record<string, any>;
  weight: number; // Importance in overall confidence calculation
  active: boolean;
  false_positive_rate?: number;
  last_tuned_at?: Date;
}

// AI model configuration
export interface AIModelSettings {
  models_enabled: string[];
  model_weights: Record<string, number>;
  preprocessing_options: Record<string, any>;
  postprocessing_filters: Record<string, any>;
  performance_mode: 'accuracy' | 'speed' | 'balanced';
  gpu_allocation?: number;
  batch_processing: boolean;
  real_time_processing: boolean;
}

// False positive feedback for learning
export interface FalsePositiveFeedback {
  id: string;
  detection_timestamp: Date;
  reported_by: string;
  confidence_at_detection: number;
  actual_subject: boolean;
  feedback_notes: string;
  corrective_action_taken: string;
  model_adjustment_made: boolean;
}

// Activity generation rules
export interface ActivityGenerationRule {
  confidence_threshold: number;
  activity_type: string;
  priority_mapping: Priority;
  title_template: string;
  description_template: string;
  auto_assign_to?: string;
  additional_metadata: Record<string, any>;
}

// Detection performance statistics
export interface DetectionStatistics {
  total_detections: number;
  true_positives: number;
  false_positives: number;
  false_negatives?: number; // If we can measure these
  precision: number;
  recall?: number;
  f1_score?: number;
  
  // Time-based stats
  detections_today: number;
  detections_this_week: number;
  detections_this_month: number;
  
  // Confidence distribution
  confidence_distribution: Record<string, number>; // confidence range -> count
  
  // Performance by site
  performance_by_site: Record<string, SitePerformance>;
}

export interface SitePerformance {
  site_id: string;
  detections: number;
  true_positives: number;
  false_positives: number;
  precision: number;
  last_detection?: Date;
}

// Overall effectiveness metrics
export interface EffectivenessMetrics {
  resolution_achieved: boolean;
  subject_apprehended: boolean;
  threat_neutralized: boolean;
  prevention_success: boolean;
  
  // Time metrics
  time_to_first_detection?: number; // minutes
  time_to_resolution?: number; // minutes
  active_duration: number; // minutes
  
  // Cost-benefit analysis
  estimated_cost: number;
  estimated_benefit: number;
  roi_calculation?: number;
  
  // Stakeholder satisfaction
  stakeholder_feedback: StakeholderFeedback[];
}

export interface StakeholderFeedback {
  stakeholder_type: 'security_staff' | 'management' | 'law_enforcement' | 'public';
  feedback_score: number; // 1-10
  comments?: string;
  provided_at: Date;
}

// Notification configuration
export interface NotificationSettings {
  immediate_notifications: boolean;
  digest_notifications: boolean;
  digest_frequency: 'hourly' | 'daily' | 'weekly';
  notification_channels: NotificationChannel[];
  quiet_hours?: TimeRange;
  escalation_notifications: boolean;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'radio' | 'dashboard';
  enabled: boolean;
  priority_threshold?: Priority;
  confidence_threshold?: number;
}

export interface TimeRange {
  start_time: string;
  end_time: string;
  timezone: string;
}

// External distribution to other agencies
export interface ExternalDistribution {
  agency_name: string;
  contact_person: string;
  contact_method: string;
  sharing_level: 'basic' | 'detailed' | 'full';
  bilateral_sharing: boolean;
  data_retention_agreement?: string;
}

// Legal retention requirements
export interface RetentionRequirements {
  retention_period_days: number;
  legal_hold: boolean;
  purge_date?: Date;
  retention_reason: string;
  compliance_requirements: string[];
  data_classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

// BOL modification tracking
export interface BOLModification {
  id: string;
  modified_at: Date;
  modified_by: string;
  modification_type: 'created' | 'updated' | 'status_changed' | 'criteria_updated' | 'suspended' | 'reactivated';
  changes_made: FieldChange[];
  reason: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
}

interface FieldChange {
  field_name: string;
  old_value: any;
  new_value: any;
}

// BOL closure reasons
export type BOLClosureReason = 
  | 'subject_apprehended'
  | 'threat_resolved'
  | 'case_closed'
  | 'expired'
  | 'false_information'
  | 'superseded'
  | 'resource_constraints'
  | 'legal_restriction'
  | 'privacy_concerns'
  | 'other';

// BOL search and filtering
export interface BOLSearchRequest {
  // Basic filters
  type?: BOLType;
  status?: BOLStatus;
  priority?: Priority;
  urgency_level?: UrgencyLevel;
  
  // Subject filters
  subject_type?: 'person' | 'vehicle' | 'object' | 'pattern';
  threat_level?: string;
  
  // Geographic filters
  site_id?: string;
  distribution_scope?: DistributionScope;
  
  // Time filters
  created_after?: Date;
  created_before?: Date;
  active_only?: boolean;
  expired_only?: boolean;
  expiring_soon?: boolean; // Within next 7 days
  
  // Performance filters
  has_detections?: boolean;
  high_false_positive_rate?: boolean;
  effective_bols_only?: boolean;
  
  // Authority filters
  issued_by?: string;
  authorization_level?: AuthorizationLevel;
  
  // Content search
  search_term?: string;
  bol_number?: string;
  
  // Pagination and sorting
  page?: number;
  limit?: number;
  sort_field?: keyof BOL;
  sort_direction?: 'asc' | 'desc';
}

// BOL analytics and reporting
export interface BOLAnalytics {
  total_bols: number;
  active_bols: number;
  expired_bols: number;
  resolved_bols: number;
  
  // By classification
  by_type: Record<BOLType, number>;
  by_status: Record<BOLStatus, number>;
  by_priority: Record<Priority, number>;
  by_urgency: Record<UrgencyLevel, number>;
  
  // Performance metrics
  overall_effectiveness_rate: number;
  average_time_to_resolution: number; // days
  false_positive_rate: number;
  
  // Detection metrics
  total_detections: number;
  detections_this_month: number;
  true_positive_rate: number;
  
  // Distribution metrics
  multi_site_bols: number;
  external_shared_bols: number;
  
  // Trend data
  trend_data: Array<{
    date: string;
    created: number;
    resolved: number;
    active: number;
    detections: number;
  }>;
  
  // Top performers
  most_effective_bols: Array<{
    bol_id: string;
    effectiveness_score: number;
    detections: number;
  }>;
}