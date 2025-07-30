/**
 * Incident types for the Situ8 business logic system
 * Incidents are created automatically from Activities based on business rules
 */

import { Priority, User, Site, Timestamps } from './common';
import { BaseActivity } from './activity';

// Core incident interface
export interface Incident extends Timestamps {
  id: string;
  
  // Basic incident information
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: Priority;
  
  // Auto-creation metadata
  trigger_activity_id: string; // The activity that created this incident
  auto_created: boolean;
  creation_rule: string; // Which business rule triggered creation
  
  // Location information
  site_id: string;
  site_name: string;
  building_id?: string;
  building_name?: string;
  zone_id?: string;
  zone_name?: string;
  multi_location: boolean; // Incidents can span multiple locations
  affected_locations: IncidentLocation[];
  
  // Assignment and ownership
  assigned_to?: string; // User ID
  assigned_team?: string[]; // Array of user IDs
  commander?: string; // Incident commander user ID
  
  // Validation and timing
  is_pending: boolean; // True during validation period
  pending_until: Date; // When pending status expires
  validated_at?: Date;
  validated_by?: string;
  
  // Related entities
  related_activities: string[]; // All activities linked to this incident
  parent_case_id?: string; // If this incident is part of a case
  child_incidents: string[]; // Sub-incidents
  parent_incident_id?: string; // For hierarchical incidents
  
  // Response information
  response_started_at?: Date;
  response_completed_at?: Date;
  estimated_resolution_time?: Date;
  actual_resolution_time?: Date;
  
  // External coordination
  external_agencies_notified: string[];
  external_reference_numbers: Record<string, string>; // Agency -> Reference
  requires_external_response: boolean;
  
  // Documentation
  initial_assessment?: string;
  final_report?: string;
  lessons_learned?: string;
  
  // Classification and impact
  severity: IncidentSeverity;
  business_impact: BusinessImpact;
  operational_impact: OperationalImpact;
  
  // Metrics and KPIs
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  escalation_count: number;
  
  // Compliance and reporting
  requires_regulatory_reporting: boolean;
  regulatory_deadlines: RegulatoryDeadline[];
  compliance_status: ComplianceStatus;
  
  // Tags and categorization
  tags: string[];
  categories: string[];
  
  // Closure information
  closed_at?: Date;
  closed_by?: string;
  closure_reason?: ClosureReason;
  closure_summary?: string;
}

// Types of incidents based on the business logic
export type IncidentType = 
  | 'medical_emergency'    // Always auto-created from medical activities
  | 'security_breach'      // From security-breach activities
  | 'fire_emergency'       // From fire/smoke detection
  | 'equipment_failure'    // From critical equipment faults
  | 'safety_incident'      // From safety-related activities
  | 'operational_disruption' // From activities affecting operations
  | 'environmental'        // Environmental hazards
  | 'theft_vandalism'      // Property crimes
  | 'access_control'       // Unauthorized access attempts
  | 'crowd_control'        // Crowd management issues
  | 'external_threat'      // External security threats
  | 'communication_failure' // System/communication failures
  | 'other';               // Manually created incidents

// Incident status progression
export type IncidentStatus = 
  | 'pending'      // During 5-15 minute validation period
  | 'active'       // Confirmed and being handled
  | 'assigned'     // Assigned to specific personnel
  | 'responding'   // Response in progress
  | 'contained'    // Immediate threat contained
  | 'investigating' // Under investigation
  | 'resolved'     // Incident resolved
  | 'closed'       // Formally closed with documentation
  | 'cancelled';   // Cancelled due to false alarm

// Incident severity levels
export type IncidentSeverity = 
  | 'minor'        // Limited impact, routine response
  | 'moderate'     // Significant impact, elevated response
  | 'major'        // High impact, full response required
  | 'critical'     // Severe impact, emergency response
  | 'catastrophic'; // Extreme impact, disaster response

// Business impact assessment
export interface BusinessImpact {
  financial_impact: 'none' | 'low' | 'medium' | 'high' | 'severe';
  operational_impact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  reputational_impact: 'none' | 'low' | 'medium' | 'high' | 'severe';
  regulatory_impact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  estimated_cost?: number;
  recovery_time_estimate?: number; // minutes
}

// Operational impact details
export interface OperationalImpact {
  affected_systems: string[];
  affected_processes: string[];
  personnel_impact: number; // Number of people affected
  customer_impact: number;  // Number of customers affected
  service_disruption: boolean;
  productivity_loss_percentage?: number;
}

// Location information for multi-location incidents
export interface IncidentLocation {
  site_id: string;
  site_name: string;
  building_id?: string;
  building_name?: string;
  zone_id?: string;
  zone_name?: string;
  is_primary: boolean; // Primary location of the incident
  involvement_level: 'primary' | 'secondary' | 'affected' | 'evacuated';
}

// Regulatory reporting requirements
export interface RegulatoryDeadline {
  agency: string;
  deadline: Date;
  requirement_type: string;
  status: 'pending' | 'submitted' | 'acknowledged' | 'closed';
  reference_number?: string;
}

// Compliance tracking
export type ComplianceStatus = 
  | 'compliant'
  | 'pending_review'
  | 'requires_reporting'  
  | 'overdue'
  | 'non_compliant';

// Incident closure reasons
export type ClosureReason = 
  | 'resolved'
  | 'false_alarm'
  | 'duplicate'
  | 'transferred'
  | 'cancelled'
  | 'escalated_to_case';

// Incident timeline entry
export interface IncidentTimelineEntry {
  id: string;
  incident_id: string;
  timestamp: Date;
  type: TimelineEntryType;
  description: string;
  user_id?: string;
  user_name?: string;
  automated: boolean;
  metadata?: Record<string, any>;
}

export type TimelineEntryType = 
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'activity_linked'
  | 'note_added'
  | 'escalated'
  | 'external_notification'
  | 'validation_complete'
  | 'response_initiated'
  | 'resolved'
  | 'closed';

// Incident search and filtering
export interface IncidentSearchRequest {
  // Basic filters
  type?: IncidentType;
  status?: IncidentStatus;
  priority?: Priority;
  severity?: IncidentSeverity;
  
  // Assignment filters
  assigned_to?: string;
  commander?: string;
  unassigned?: boolean;
  
  // Time filters
  created_after?: Date;
  created_before?: Date;
  pending_only?: boolean;
  overdue_only?: boolean;
  
  // Location filters
  site_id?: string;
  building_id?: string;
  multi_location_only?: boolean;
  
  // Content search
  search_term?: string;
  
  // Relationship filters
  has_related_case?: boolean;
  activity_count_min?: number;
  
  // Compliance filters
  requires_reporting?: boolean;
  compliance_status?: ComplianceStatus;
  
  // Pagination and sorting
  page?: number;
  limit?: number;
  sort_field?: keyof Incident;
  sort_direction?: 'asc' | 'desc';
}

// Incident statistics for dashboards
export interface IncidentStatistics {
  total_incidents: number;
  open_incidents: number;
  pending_validation: number;
  overdue_incidents: number;
  
  // By time period
  incidents_today: number;
  incidents_this_week: number;
  incidents_this_month: number;
  
  // By classification
  by_type: Record<IncidentType, number>;
  by_status: Record<IncidentStatus, number>;
  by_priority: Record<Priority, number>;
  by_severity: Record<IncidentSeverity, number>;
  
  // Performance metrics
  average_response_time: number; // minutes
  average_resolution_time: number; // minutes
  resolution_rate: number; // percentage
  
  // Trends
  trend_data: Array<{
    date: string;
    count: number;
    resolved: number;
  }>;
}

// Incident escalation rules
export interface IncidentEscalationRule {
  id: string;
  name: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  is_active: boolean;
  priority_threshold?: Priority;
  time_threshold_minutes?: number;
}

export interface EscalationCondition {
  field: keyof Incident;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'not_in';
  value: any;
}

export interface EscalationAction {
  type: 'notify_user' | 'assign_to' | 'change_priority' | 'change_severity' | 'create_case';
  parameters: Record<string, any>;
}

// Incident template for common incident types
export interface IncidentTemplate {
  id: string;
  name: string;
  incident_type: IncidentType;
  default_title: string;
  default_description: string;
  default_priority: Priority;
  default_severity: IncidentSeverity;
  required_fields: string[];
  auto_assign_rules?: AssignmentRule[];
}

export interface AssignmentRule {
  condition: string; // e.g., "site_id === 'SITE001'"
  assign_to: string; // User ID or team name
  priority: number;  // Rule priority for conflicts
}