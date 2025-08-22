/**
 * Case types for the Situ8 business logic system
 * Cases are investigations that can be created from incidents or directly from activities
 */

import { Priority, User, Site, Timestamps } from './common';
import { BaseActivity } from './activity';
import { Incident } from './incident';

// Core case interface
export interface Case extends Timestamps {
  id: string;
  
  // Basic case information
  title: string;
  description: string;
  case_number: string; // Formatted case number (e.g., CASE-2024-001234)
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  
  // Creation context
  creation_source: 'incident' | 'activity' | 'manual';
  source_incident_id?: string; // If created from incident
  source_activity_id?: string; // If created directly from activity
  
  // Investigation team
  lead_investigator: string; // User ID
  investigators: string[]; // Array of user IDs
  reviewers: string[]; // Users who can review and approve
  external_investigators?: ExternalInvestigator[];
  
  // Multi-site coordination
  primary_site_id: string;
  involved_sites: string[]; // Can involve multiple sites
  requires_site_coordination: boolean;
  
  // Related entities
  related_activities: string[]; // Any priority level activities can be linked
  related_incidents: string[];
  parent_case_id?: string; // For sub-cases
  child_cases: string[]; // Sub-cases
  
  // Evidence management
  evidence_items: EvidenceItem[];
  evidence_custody_log: CustodyLogEntry[];
  evidence_summary?: string;
  
  // Investigation phases
  current_phase: InvestigationPhase;
  phases_completed: InvestigationPhase[];
  phase_timeline: PhaseTimelineEntry[];
  
  // Documentation
  initial_findings?: string;
  investigation_plan?: string;
  interim_reports: InterimReport[];
  final_report?: FinalReport;
  
  // Deadlines and scheduling
  target_completion_date?: Date;
  regulatory_deadline?: Date;
  milestones: CaseMilestone[];
  
  // Approval workflow
  requires_approval: boolean;
  approval_status: ApprovalStatus;
  approvals: CaseApproval[];
  
  // Classification
  sensitivity_level: SensitivityLevel;
  case_category: string[];
  tags: string[];
  
  // Outcome tracking
  outcome?: CaseOutcome;
  recommendations: string[];
  corrective_actions: CorrectiveAction[];
  
  // Metrics
  estimated_hours?: number;
  actual_hours?: number;
  cost_estimate?: number;
  actual_cost?: number;
  
  // Communication
  stakeholder_updates: StakeholderUpdate[];
  confidentiality_level: ConfidentialityLevel;
  
  // Closure
  closed_at?: Date;
  closed_by?: string;
  closure_reason?: CaseClosureReason;
  closure_summary?: string;
}

// Types of cases based on investigation nature
export type CaseType = 
  | 'security_investigation'   // Security breach investigations
  | 'incident_investigation'   // Post-incident analysis
  | 'safety_investigation'     // Safety incident analysis
  | 'fraud_investigation'      // Fraud or misconduct
  | 'compliance_investigation' // Regulatory compliance
  | 'property_investigation'   // Theft, damage, vandalism
  | 'personnel_investigation'  // Employee conduct
  | 'operational_investigation' // Process or system failures
  | 'environmental_investigation' // Environmental incidents
  | 'quality_investigation'    // Quality control issues
  | 'audit_investigation'      // Internal audit findings
  | 'legal_investigation'      // Legal matters
  | 'other';

// Case status progression
export type CaseStatus = 
  | 'draft'          // Being prepared
  | 'open'           // Newly opened case
  | 'active'         // Under active investigation
  | 'pending_review' // Awaiting review/approval
  | 'on_hold'        // Temporarily suspended
  | 'escalated'      // Escalated to higher authority
  | 'completed'      // Investigation completed
  | 'closed'         // Formally closed
  | 'archived';      // Archived for retention

// Investigation phases
export type InvestigationPhase = 
  | 'initiation'     // Case setup and planning
  | 'evidence_collection' // Gathering evidence
  | 'analysis'       // Evidence analysis
  | 'interviews'     // Witness/stakeholder interviews
  | 'verification'   // Fact verification
  | 'reporting'      // Report preparation
  | 'review'         // Management review
  | 'closure';       // Case closure

// Evidence item with chain of custody
export interface EvidenceItem {
  id: string;
  case_id: string;
  
  // Evidence details
  type: EvidenceType;
  name: string;
  description: string;
  source_activity_id?: string;
  source_incident_id?: string;
  
  // Collection information
  collected_at: Date;
  collected_by: string;
  collection_location: string;
  collection_method: string;
  
  // Physical properties
  file_path?: string;
  file_size?: number;
  file_hash?: string;
  thumbnail_path?: string;
  
  // Chain of custody
  current_custodian: string;
  custody_history: CustodyLogEntry[];
  
  // Analysis
  analysis_status: 'pending' | 'in_progress' | 'completed';
  analysis_notes?: string;
  analysis_results?: Record<string, any>;
  
  // Legal and compliance
  is_admissible: boolean;
  legal_hold: boolean;
  retention_date: Date;
  
  // Metadata
  tags: string[];
  is_sensitive: boolean;
  access_restrictions: string[];
}

export type EvidenceType = 
  | 'photograph'
  | 'video_recording'
  | 'audio_recording'
  | 'document'
  | 'physical_item'
  | 'digital_file'
  | 'witness_statement'
  | 'system_log'
  | 'surveillance_footage'
  | 'forensic_data'
  | 'other';

// Chain of custody tracking
export interface CustodyLogEntry {
  id: string;
  evidence_id: string;
  
  // Transfer details
  transferred_at: Date;
  transferred_from: string; // User ID
  transferred_to: string;   // User ID
  transfer_reason: string;
  
  // Location tracking
  location_from?: string;
  location_to?: string;
  
  // Documentation
  transfer_notes?: string;
  witness_signatures: string[];
  
  // Validation
  evidence_condition: 'good' | 'damaged' | 'compromised';
  integrity_verified: boolean;
  verification_method?: string;
}

// External investigators (law enforcement, consultants, etc.)
export interface ExternalInvestigator {
  id: string;
  name: string;
  organization: string;
  contact_info: string;
  role: string;
  clearance_level?: string;
  assigned_at: Date;
  access_level: 'read_only' | 'contributor' | 'full_access';
}

// Phase timeline tracking
export interface PhaseTimelineEntry {
  phase: InvestigationPhase;
  started_at: Date;
  completed_at?: Date;
  assigned_to: string[];
  notes?: string;
  deliverables?: string[];
  hours_spent?: number;
}

// Interim reports during investigation
export interface InterimReport {
  id: string;
  case_id: string;
  
  // Report details
  title: string;
  content: string;
  created_at: Date;
  created_by: string;
  report_date: Date;
  
  // Status and approval
  status: 'draft' | 'under_review' | 'approved' | 'published';
  reviewed_by?: string[];
  approved_by?: string;
  
  // Distribution
  recipients: string[];
  confidentiality_level: ConfidentialityLevel;
  
  // Attachments
  attachments: string[]; // Evidence item IDs
}

// Final case report
export interface FinalReport {
  id: string;
  case_id: string;
  
  // Report structure
  executive_summary: string;
  background: string;
  methodology: string;
  findings: Finding[];
  conclusions: string;
  recommendations: Recommendation[];
  
  // Metadata
  created_at: Date;
  created_by: string;
  reviewed_by: string[];
  approved_by: string;
  version: number;
  
  // Distribution and access
  distribution_list: string[];
  confidentiality_level: ConfidentialityLevel;
  public_summary?: string; // Sanitized version for public release
  
  // Attachments
  supporting_documents: string[];
  evidence_references: string[];
}

// Individual findings
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence_supporting: string[]; // Evidence item IDs
  confidence_level: 'low' | 'medium' | 'high';
  implications: string;
}

// Recommendations from investigation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  implementation_timeline: 'immediate' | 'short_term' | 'long_term';
  responsible_party: string;
  estimated_cost?: number;
  success_metrics: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
}

// Case milestones
export interface CaseMilestone {
  id: string;
  case_id: string;
  title: string;
  description: string;
  due_date: Date;
  completion_date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigned_to: string[];
  dependencies: string[]; // Other milestone IDs
}

// Approval workflow
export type ApprovalStatus = 
  | 'not_required'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

export interface CaseApproval {
  id: string;
  case_id: string;
  approver_id: string;
  approver_name: string;
  approval_type: 'phase_completion' | 'interim_report' | 'final_report' | 'case_closure';
  status: ApprovalStatus;
  requested_at: Date;
  responded_at?: Date;
  comments?: string;
  conditions?: string[];
}

// Sensitivity and confidentiality levels
export type SensitivityLevel = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'classified';

export type ConfidentialityLevel = 
  | 'public'
  | 'internal_only'
  | 'management_only'
  | 'legal_only'
  | 'restricted_access';

// Case outcomes
export interface CaseOutcome {
  conclusion: CaseConclusion;
  root_cause?: string;
  contributing_factors: string[];
  corrective_actions_required: boolean;
  disciplinary_action_required: boolean;
  legal_action_required: boolean;
  regulatory_reporting_required: boolean;
  policy_changes_required: boolean;
}

export type CaseConclusion = 
  | 'substantiated'    // Allegations proven
  | 'unsubstantiated' // Allegations not proven
  | 'unfounded'       // Allegations false
  | 'policy_violation' // Policy violated but not criminal
  | 'no_violation'    // No violations found
  | 'inconclusive'    // Unable to determine
  | 'referred'        // Referred to external authority
  | 'administrative_closure'; // Closed for administrative reasons

// Corrective actions
export interface CorrectiveAction {
  id: string;
  case_id: string;
  title: string;
  description: string;
  type: 'immediate' | 'preventive' | 'systemic';
  priority: Priority;
  assigned_to: string;
  due_date: Date;
  completion_date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  verification_required: boolean;
  verified_by?: string;
  verification_date?: Date;
  cost_estimate?: number;
  actual_cost?: number;
}

// Stakeholder communication
export interface StakeholderUpdate {
  id: string;
  case_id: string;
  update_type: 'status_update' | 'milestone_completion' | 'finding_notification' | 'closure_notification';
  recipients: string[];
  subject: string;
  content: string;
  sent_at: Date;
  sent_by: string;
  delivery_status: 'sent' | 'delivered' | 'failed';
}

// Case closure reasons
export type CaseClosureReason = 
  | 'investigation_complete'
  | 'insufficient_evidence'
  | 'administrative_closure'
  | 'referred_external'
  | 'duplicate_case'
  | 'resource_constraints'
  | 'legal_settlement'
  | 'policy_change'
  | 'other';

// Case search and filtering
export interface CaseSearchRequest {
  // Basic filters
  type?: CaseType;
  status?: CaseStatus;
  priority?: Priority;
  current_phase?: InvestigationPhase;
  
  // Assignment filters
  lead_investigator?: string;
  investigator?: string;
  created_by?: string;
  
  // Time filters
  created_after?: Date;
  created_before?: Date;
  due_before?: Date;
  overdue_only?: boolean;
  
  // Location and site filters
  site_id?: string;
  multi_site_only?: boolean;
  
  // Content search
  search_term?: string;
  case_number?: string;
  
  // Relationship filters
  has_related_incidents?: boolean;
  evidence_count_min?: number;
  
  // Classification filters
  sensitivity_level?: SensitivityLevel;
  requires_approval?: boolean;
  approval_status?: ApprovalStatus;
  
  // Pagination and sorting
  page?: number;
  limit?: number;
  sort_field?: keyof Case;
  sort_direction?: 'asc' | 'desc';
}

// Case statistics for reporting
export interface CaseStatistics {
  total_cases: number;
  open_cases: number;
  overdue_cases: number;
  pending_approval: number;
  
  // By classification
  by_type: Record<CaseType, number>;
  by_status: Record<CaseStatus, number>;
  by_priority: Record<Priority, number>;
  by_phase: Record<InvestigationPhase, number>;
  
  // Performance metrics
  average_investigation_time: number; // days
  average_case_cost: number;
  closure_rate: number; // percentage
  
  // Workload metrics
  cases_per_investigator: Record<string, number>;
  evidence_items_total: number;
  
  // Trend data
  trend_data: Array<{
    date: string;
    opened: number;
    closed: number;
    backlog: number;
  }>;
}