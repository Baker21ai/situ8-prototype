/**
 * Case Service
 * Implements business logic for Cases including evidence management,
 * digital chain of custody, and case progression per the Situ8 business logic specification
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
import { Case } from '../lib/types/case';
import { Evidence } from '../lib/types/evidence';
import { Priority, Status } from '../lib/utils/status';
import { useCaseStore } from '../stores/caseStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useAuditStore } from '../stores/auditStore';

export class CaseService extends BaseService<Case, string> {
  private caseStore: ReturnType<typeof useCaseStore.getState>;
  private incidentStore: ReturnType<typeof useIncidentStore.getState>;
  private auditStore: ReturnType<typeof useAuditStore.getState>;
  private apiBaseUrl: string;

  // Business logic configuration for case management
  private readonly statusTransitionRules: StatusTransitionRule[] = [
    // Officers: Limited transitions
    { fromStatus: 'open', toStatus: 'investigating', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'investigating', toStatus: 'evidence_collection', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'evidence_collection', toStatus: 'analysis', requiredRole: ['officer', 'supervisor', 'admin'], requiresApproval: true },
    
    // Supervisors/Admins: Full control
    { fromStatus: 'analysis', toStatus: 'closed', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'closed', toStatus: 'analysis', requiredRole: ['supervisor', 'admin'], requiresApproval: true },
    { fromStatus: 'analysis', toStatus: 'investigating', requiredRole: ['supervisor', 'admin'], requiresApproval: false },
    { fromStatus: 'investigating', toStatus: 'open', requiredRole: ['supervisor', 'admin'], requiresApproval: false }
  ];

  private readonly evidenceTypes = [
    'photo', 'video', 'audio', 'document', 'physical', 'digital', 'witness_statement', 'expert_analysis'
  ];

  private readonly evidenceClassifications = [
    'public', 'internal', 'confidential', 'restricted', 'top_secret'
  ];

  constructor(apiBaseUrl: string = import.meta.env.VITE_API_URL || '') {
    super('CaseService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true
    });

    // Get store instances (in real app, these would be injected)
    this.caseStore = useCaseStore.getState();
    this.incidentStore = useIncidentStore.getState();
    this.auditStore = useAuditStore.getState();
    this.apiBaseUrl = apiBaseUrl;
  }

  protected getEntityName(): string {
    return 'Case';
  }

  protected validateEntity(caseData: Partial<Case>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    const titleError = this.validateRequired(caseData.title, 'title');
    if (titleError) errors.push(titleError);

    const typeError = this.validateRequired(caseData.type, 'type');
    if (typeError) errors.push(typeError);

    const statusError = this.validateRequired(caseData.status, 'status');
    if (statusError) errors.push(statusError);

    const priorityError = this.validateRequired(caseData.priority, 'priority');
    if (priorityError) errors.push(priorityError);

    // Enum validation
    if (caseData.type) {
      const typeEnumError = this.validateEnum(
        caseData.type,
        'type',
        ['investigation', 'compliance', 'incident_followup', 'audit', 'legal', 'insurance', 'internal', 'external']
      );
      if (typeEnumError) errors.push(typeEnumError);
    }

    if (caseData.priority) {
      const priorityEnumError = this.validateEnum(
        caseData.priority,
        'priority',
        ['low', 'medium', 'high', 'critical']
      );
      if (priorityEnumError) errors.push(priorityEnumError);
    }

    if (caseData.status) {
      const statusEnumError = this.validateEnum(
        caseData.status,
        'status',
        ['open', 'investigating', 'evidence_collection', 'analysis', 'closed']
      );
      if (statusEnumError) errors.push(statusEnumError);
    }

    // Title length validation
    if (caseData.title) {
      const titleLengthError = this.validateLength(caseData.title, 'title', 3, 200);
      if (titleLengthError) errors.push(titleLengthError);
    }

    // Description length validation (if present)
    if (caseData.description) {
      const descLengthError = this.validateLength(caseData.description, 'description', 0, 5000);
      if (descLengthError) errors.push(descLengthError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  protected enforceBusinessRules(caseData: Partial<Case>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Case numbering and tracking rules
    if (operation === 'create') {
      results.push(this.enforceCaseNumberingRules(caseData));
    }

    // Status progression rules
    if (operation === 'updateStatus') {
      results.push(...this.enforceStatusProgressionRules(caseData));
    }

    // Evidence chain of custody rules
    if (operation === 'addEvidence' || operation === 'updateEvidence') {
      results.push(this.enforceChainOfCustodyRules(caseData));
    }

    // Case closure rules
    if (operation === 'close') {
      results.push(this.enforceCaseClosureRules(caseData));
    }

    // Retention and compliance rules
    if (operation === 'create' || operation === 'update') {
      results.push(this.enforceRetentionRules(caseData));
    }

    return results;
  }

  // Business rule implementations
  private enforceCaseNumberingRules(caseData: Partial<Case>): BusinessRuleResult {
    try {
      if (!caseData.case_number) {
        const year = new Date().getFullYear();
        const sequence = Date.now().toString().slice(-6);
        caseData.case_number = `CASE-${year}-${sequence}`;
      }

      return {
        ruleName: 'case_numbering',
        passed: true,
        message: `Case number assigned: ${caseData.case_number}`
      };
    } catch (error) {
      return {
        ruleName: 'case_numbering',
        passed: false,
        message: `Case numbering failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceStatusProgressionRules(caseData: Partial<Case>): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // This would typically get the current user's role from context
    const userRole = 'officer'; // This should come from AuditContext
    
    if (caseData.status) {
      const allowedTransitions = this.statusTransitionRules.filter(rule => 
        rule.requiredRole.includes(userRole)
      );

      results.push({
        ruleName: 'status_progression',
        passed: allowedTransitions.some(rule => rule.toStatus === caseData.status),
        message: `Status transition to ${caseData.status} ${allowedTransitions.some(rule => rule.toStatus === caseData.status) ? 'allowed' : 'denied'} for role ${userRole}`
      });

      // Check for approval requirements
      const transitionRule = this.statusTransitionRules.find(rule => 
        rule.toStatus === caseData.status && rule.requiredRole.includes(userRole)
      );
      
      if (transitionRule?.requiresApproval) {
        results.push({
          ruleName: 'approval_required',
          passed: false, // This would check if approval was granted
          message: `Status transition to ${caseData.status} requires supervisor approval`
        });
      }
    }

    return results;
  }

  private enforceChainOfCustodyRules(caseData: Partial<Case>): BusinessRuleResult {
    try {
      // Ensure all evidence has proper chain of custody tracking
      if (caseData.evidence_items && caseData.evidence_items.length > 0) {
        const invalidEvidence = caseData.evidence_items.filter(evidence => 
          !evidence.chain_of_custody || evidence.chain_of_custody.length === 0
        );

        if (invalidEvidence.length > 0) {
          return {
            ruleName: 'chain_of_custody',
            passed: false,
            message: `${invalidEvidence.length} evidence items missing chain of custody tracking`
          };
        }
      }

      return {
        ruleName: 'chain_of_custody',
        passed: true,
        message: 'All evidence items have proper chain of custody tracking'
      };
    } catch (error) {
      return {
        ruleName: 'chain_of_custody',
        passed: false,
        message: `Chain of custody validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceCaseClosureRules(caseData: Partial<Case>): BusinessRuleResult {
    try {
      // Ensure case has required documentation before closure
      const requiredFields = ['conclusion', 'recommendations'];
      const missingFields = requiredFields.filter(field => !caseData[field as keyof Case]);

      if (missingFields.length > 0) {
        return {
          ruleName: 'case_closure_requirements',
          passed: false,
          message: `Missing required fields for case closure: ${missingFields.join(', ')}`
        };
      }

      // Ensure all evidence is properly processed
      if (caseData.evidence_items && caseData.evidence_items.length > 0) {
        const unprocessedEvidence = caseData.evidence_items.filter(evidence => 
          evidence.processing_status !== 'processed' && evidence.processing_status !== 'archived'
        );

        if (unprocessedEvidence.length > 0) {
          return {
            ruleName: 'evidence_processing_complete',
            passed: false,
            message: `${unprocessedEvidence.length} evidence items still require processing`
          };
        }
      }

      return {
        ruleName: 'case_closure_requirements',
        passed: true,
        message: 'Case meets all closure requirements'
      };
    } catch (error) {
      return {
        ruleName: 'case_closure_requirements',
        passed: false,
        message: `Case closure validation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private enforceRetentionRules(caseData: Partial<Case>): BusinessRuleResult {
    try {
      const now = new Date();
      let retentionYears = 7; // Default retention period

      // Adjust retention based on case type
      switch (caseData.type) {
        case 'legal':
        case 'compliance':
          retentionYears = 10;
          break;
        case 'audit':
          retentionYears = 7;
          break;
        case 'investigation':
          retentionYears = 5;
          break;
        default:
          retentionYears = 3;
      }

      const retentionDate = new Date(now.getTime() + retentionYears * 365 * 24 * 60 * 60 * 1000);
      caseData.retention_date = retentionDate;

      return {
        ruleName: 'retention_policy',
        passed: true,
        message: `Retention date set to ${retentionDate.toISOString()} (${retentionYears} years)`
      };
    } catch (error) {
      return {
        ruleName: 'retention_policy',
        passed: false,
        message: `Failed to set retention policy: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Public service methods
  async createCase(
    caseData: Partial<Case>,
    context: AuditContext
  ): ServiceMethod<Case> {
    try {
      // Validation
      await this.validateInput(caseData);
      
      // Business rules
      await this.enforceRules(caseData, 'create');

      // Set default values
      const now = new Date();
      const caseRecord: Case = {
        id: `CASE-${Date.now().toString().padStart(6, '0')}`,
        case_number: '',
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
        linked_incident_ids: [],
        evidence_items: [],
        witness_statements: [],
        timeline_events: [],
        status_history: [{
          status: 'open',
          changed_at: now,
          changed_by: context.userId,
          reason: 'Case created'
        }],
        tags: [],
        involved_parties: [],
        is_archived: false,
        title: 'New Case',
        type: 'investigation',
        status: 'open',
        priority: 'medium',
        ...caseData
      } as Case;

      // Store the case
      this.caseStore.createCase(caseRecord);

      // Audit logging
      await this.auditLog(context, 'create', caseRecord.id, undefined, caseRecord);

      // Publish event
      await this.publishEvent({
        eventType: 'case.created',
        entityType: 'case',
        entityId: caseRecord.id,
        userId: context.userId,
        data: caseRecord
      });

      return this.createSuccessResponse(caseRecord, 'Case created successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateCase(
    id: string,
    updates: Partial<Case>,
    context: AuditContext
  ): ServiceMethod<Case> {
    try {
      // Get existing case
      const existingCase = this.caseStore.cases.find(c => c.id === id);
      if (!existingCase) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      // Validation
      await this.validateInput(updates);
      
      // Business rules
      await this.enforceRules(updates, 'update');

      // Apply updates
      const updatedCase = {
        ...existingCase,
        ...updates,
        updated_at: new Date(),
        updated_by: context.userId
      };

      // Store the update
      this.caseStore.updateCase(id, updatedCase);

      // Audit logging
      await this.auditLog(context, 'update', id, existingCase, updatedCase);

      // Publish event
      await this.publishEvent({
        eventType: 'case.updated',
        entityType: 'case',
        entityId: id,
        userId: context.userId,
        data: { before: existingCase, after: updatedCase }
      });

      return this.createSuccessResponse(updatedCase, 'Case updated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateCaseStatus(
    id: string,
    newStatus: Status,
    context: AuditContext,
    reason?: string
  ): ServiceMethod<Case> {
    try {
      // Authorization check for status transitions
      const caseRecord = this.caseStore.cases.find(c => c.id === id);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      const allowedTransition = this.statusTransitionRules.find(rule =>
        rule.fromStatus === caseRecord.status &&
        rule.toStatus === newStatus &&
        rule.requiredRole.includes(context.userRole)
      );

      if (!allowedTransition) {
        return this.createErrorResponse(
          `Status transition from ${caseRecord.status} to ${newStatus} not allowed for role ${context.userRole}`,
          'UNAUTHORIZED_STATUS_TRANSITION'
        );
      }

      // Add status change to history
      const statusChange = {
        status: newStatus,
        changed_at: new Date(),
        changed_by: context.userId,
        reason: reason || 'Status update',
        requires_approval: allowedTransition.requiresApproval
      };

      const statusHistory = [...(caseRecord.status_history || []), statusChange];

      return await this.updateCase(id, { 
        status: newStatus,
        status_history: statusHistory
      }, context);

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Evidence management methods
  async addEvidence(
    caseId: string,
    evidenceData: Partial<Evidence>,
    context: AuditContext
  ): ServiceMethod<Evidence> {
    try {
      const caseRecord = this.caseStore.cases.find(c => c.id === caseId);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      // Validate evidence data
      if (!evidenceData.type || !this.evidenceTypes.includes(evidenceData.type)) {
        return this.createErrorResponse(`Invalid evidence type. Must be one of: ${this.evidenceTypes.join(', ')}`, 'INVALID_EVIDENCE_TYPE');
      }

      // Create evidence record
      const now = new Date();
      const evidence: Evidence = {
        id: `EV-${Date.now().toString().padStart(6, '0')}`,
        case_id: caseId,
        collected_at: now,
        collected_by: context.userId,
        processing_status: 'pending',
        chain_of_custody: [{
          action: 'collected',
          timestamp: now,
          user_id: context.userId,
          user_name: context.userName,
          location: evidenceData.location || 'Unknown',
          notes: 'Evidence collected and entered into system'
        }],
        integrity_verified: false,
        classification: 'internal',
        tags: [],
        type: 'document',
        description: 'Evidence item',
        location: 'Unknown',
        ...evidenceData
      } as Evidence;

      // Add to case
      const updatedEvidenceItems = [...(caseRecord.evidence_items || []), evidence];
      await this.updateCase(caseId, { evidence_items: updatedEvidenceItems }, context);

      // Audit logging
      await this.auditLog(context, 'addEvidence', caseId, undefined, evidence);

      // Publish event
      await this.publishEvent({
        eventType: 'evidence.added',
        entityType: 'case',
        entityId: caseId,
        userId: context.userId,
        data: evidence
      });

      return this.createSuccessResponse(evidence, 'Evidence added successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateEvidenceChainOfCustody(
    caseId: string,
    evidenceId: string,
    action: string,
    context: AuditContext,
    notes?: string
  ): ServiceMethod<Evidence> {
    try {
      const caseRecord = this.caseStore.cases.find(c => c.id === caseId);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      const evidenceIndex = (caseRecord.evidence_items || []).findIndex(e => e.id === evidenceId);
      if (evidenceIndex === -1) {
        return this.createErrorResponse('Evidence not found', 'NOT_FOUND');
      }

      const evidence = caseRecord.evidence_items![evidenceIndex];
      const chainEntry = {
        action,
        timestamp: new Date(),
        user_id: context.userId,
        user_name: context.userName,
        location: context.ipAddress || 'System',
        notes: notes || `Evidence ${action}`
      };

      const updatedEvidence = {
        ...evidence,
        chain_of_custody: [...(evidence.chain_of_custody || []), chainEntry],
        updated_at: new Date(),
        updated_by: context.userId
      };

      const updatedEvidenceItems = [...caseRecord.evidence_items!];
      updatedEvidenceItems[evidenceIndex] = updatedEvidence;

      await this.updateCase(caseId, { evidence_items: updatedEvidenceItems }, context);

      // Audit logging
      await this.auditLog(context, 'updateEvidenceChain', evidenceId, evidence, updatedEvidence);

      return this.createSuccessResponse(updatedEvidence, 'Chain of custody updated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async processEvidence(
    caseId: string,
    evidenceId: string,
    processingResults: {
      status: 'processed' | 'rejected' | 'requires_analysis';
      analysis_results?: string;
      integrity_verified: boolean;
      notes?: string;
    },
    context: AuditContext
  ): ServiceMethod<Evidence> {
    try {
      const caseRecord = this.caseStore.cases.find(c => c.id === caseId);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      const evidenceIndex = (caseRecord.evidence_items || []).findIndex(e => e.id === evidenceId);
      if (evidenceIndex === -1) {
        return this.createErrorResponse('Evidence not found', 'NOT_FOUND');
      }

      const evidence = caseRecord.evidence_items![evidenceIndex];
      const updatedEvidence = {
        ...evidence,
        processing_status: processingResults.status,
        analysis_results: processingResults.analysis_results,
        integrity_verified: processingResults.integrity_verified,
        processed_at: new Date(),
        processed_by: context.userId,
        processing_notes: processingResults.notes
      };

      // Add chain of custody entry
      const chainEntry = {
        action: 'processed',
        timestamp: new Date(),
        user_id: context.userId,
        user_name: context.userName,
        location: 'Processing Center',
        notes: `Evidence processed with status: ${processingResults.status}`
      };

      updatedEvidence.chain_of_custody = [...(evidence.chain_of_custody || []), chainEntry];

      const updatedEvidenceItems = [...caseRecord.evidence_items!];
      updatedEvidenceItems[evidenceIndex] = updatedEvidence;

      await this.updateCase(caseId, { evidence_items: updatedEvidenceItems }, context);

      // Audit logging
      await this.auditLog(context, 'processEvidence', evidenceId, evidence, updatedEvidence);

      return this.createSuccessResponse(updatedEvidence, 'Evidence processed successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async linkIncident(
    caseId: string,
    incidentId: string,
    context: AuditContext
  ): ServiceMethod<Case> {
    try {
      const caseRecord = this.caseStore.cases.find(c => c.id === caseId);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      const updatedIncidentIds = [...(caseRecord.linked_incident_ids || [])];
      if (!updatedIncidentIds.includes(incidentId)) {
        updatedIncidentIds.push(incidentId);
      }

      return await this.updateCase(caseId, { 
        linked_incident_ids: updatedIncidentIds 
      }, context);
      
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async closeCase(
    id: string,
    closure: {
      conclusion: string;
      recommendations?: string;
      outcome: string;
    },
    context: AuditContext
  ): ServiceMethod<Case> {
    try {
      // Business rule validation for case closure
      const caseRecord = this.caseStore.cases.find(c => c.id === id);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      // Prepare closure data
      const closureData = {
        status: 'closed' as Status,
        closed_at: new Date(),
        closed_by: context.userId,
        conclusion: closure.conclusion,
        recommendations: closure.recommendations,
        outcome: closure.outcome
      };

      // Enforce closure rules
      await this.enforceRules({ ...caseRecord, ...closureData }, 'close');

      return await this.updateCaseStatus(id, 'closed' as Status, context, 'Case closed');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findById(id: string): ServiceMethod<Case> {
    try {
      const caseRecord = this.caseStore.cases.find(c => c.id === id);
      if (!caseRecord) {
        return this.createErrorResponse('Case not found', 'NOT_FOUND');
      }

      return this.createSuccessResponse(caseRecord);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findAll(options: QueryOptions = {}): ServiceListMethod<Case> {
    try {
      const cases = this.caseStore.cases;
      
      // Apply filters
      let filtered = cases;
      if (options.filters) {
        if (options.filters.status) {
          filtered = filtered.filter(c => c.status === options.filters!.status);
        }
        if (options.filters.priority) {
          filtered = filtered.filter(c => c.priority === options.filters!.priority);
        }
        if (options.filters.type) {
          filtered = filtered.filter(c => c.type === options.filters!.type);
        }
        if (options.filters.assignedTo) {
          filtered = filtered.filter(c => c.assignedTo === options.filters!.assignedTo);
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
      const paginatedCases = filtered.slice(startIndex, startIndex + limit);

      const metadata = this.buildQueryMetadata(paginatedCases, filtered.length, options);

      return this.createSuccessResponse(paginatedCases, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteCase(id: string, context: AuditContext): ServiceBooleanMethod {
    try {
      // Soft delete only (business rule: cases cannot be hard deleted)
      const result = await this.updateCase(id, { 
        is_archived: true,
        archived_at: new Date(),
        archived_by: context.userId,
        archive_reason: 'Deleted by user'
      }, context);
      
      return this.createSuccessResponse(result.success);
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get case statistics for dashboards
  async getCaseStatistics(
    timeRange: { start: Date; end: Date }
  ): ServiceMethod<{
    totalCases: number;
    casesByStatus: Record<string, number>;
    casesByPriority: Record<string, number>;
    casesByType: Record<string, number>;
    avgProcessingTime: number;
    evidenceCount: number;
    closedCasesCount: number;
  }> {
    try {
      const cases = this.caseStore.cases.filter(caseRecord => 
        caseRecord.created_at >= timeRange.start && caseRecord.created_at <= timeRange.end
      );
      
      const casesByStatus: Record<string, number> = {};
      const casesByPriority: Record<string, number> = {};
      const casesByType: Record<string, number> = {};
      let totalProcessingTime = 0;
      let closedCount = 0;
      let evidenceCount = 0;

      cases.forEach(caseRecord => {
        // By status
        casesByStatus[caseRecord.status] = (casesByStatus[caseRecord.status] || 0) + 1;
        
        // By priority
        casesByPriority[caseRecord.priority] = (casesByPriority[caseRecord.priority] || 0) + 1;
        
        // By type
        casesByType[caseRecord.type] = (casesByType[caseRecord.type] || 0) + 1;
        
        // Processing time calculation
        if (caseRecord.status === 'closed' && caseRecord.closed_at) {
          totalProcessingTime += caseRecord.closed_at.getTime() - caseRecord.created_at.getTime();
          closedCount++;
        }
        
        // Evidence count
        evidenceCount += (caseRecord.evidence_items || []).length;
      });

      const avgProcessingTime = closedCount > 0 ? totalProcessingTime / closedCount : 0;

      const statistics = {
        totalCases: cases.length,
        casesByStatus,
        casesByPriority,
        casesByType,
        avgProcessingTime: Math.round(avgProcessingTime / (1000 * 60 * 60 * 24)), // Convert to days
        evidenceCount,
        closedCasesCount: closedCount
      };

      return this.createSuccessResponse(statistics, 'Case statistics generated successfully');

    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ==================== AWS API METHODS ====================
  // These methods integrate with AWS Lambda functions for production

  /**
   * Create case via AWS API
   */
  async createCaseAWS(
    data: Partial<Case>,
    context: AuditContext
  ): Promise<ServiceResponse<{ case: Case; timeline: any[] }>> {
    try {
      // Validate input
      await this.validateInput(data);
      
      // Enforce business rules
      await this.enforceRules(data, 'create');
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/cases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to create case');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'create', response.data.case.id, null, response.data.case);
      
      // Publish event
      await this.publishEvent({
        eventType: 'case.created',
        entityId: response.data.case.id,
        entityType: 'case',
        data: response.data.case,
        userId: context.userId,
        companyId: context.companyId
      });
      
      return this.createSuccessResponse(
        response.data,
        'Case created successfully'
      );
    } catch (error) {
      return this.createErrorResponse(error, 'CASE_CREATE_ERROR');
    }
  }

  /**
   * Get cases via AWS API
   */
  async getCasesAWS(
    filters: any,
    options: QueryOptions,
    context: AuditContext
  ): Promise<ServiceResponse<{ cases: Case[]; pagination: any; statistics: any }>> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.caseType) queryParams.append('caseType', filters.caseType);
      if (filters.phase) queryParams.append('phase', filters.phase);
      if (filters.leadInvestigator) queryParams.append('leadInvestigator', filters.leadInvestigator);
      if (filters.investigator) queryParams.append('investigator', filters.investigator);
      if (filters.siteId) queryParams.append('siteId', filters.siteId);
      if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
      if (filters.caseNumber) queryParams.append('caseNumber', filters.caseNumber);
      if (filters.overdue) queryParams.append('overdue', 'true');
      if (filters.multiSite) queryParams.append('multiSite', 'true');
      
      // Add pagination
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/cases?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${context.token}`
          }
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to fetch cases');
        }
        
        return res.json();
      });
      
      return this.createSuccessResponse(response.data);
    } catch (error) {
      return this.createErrorResponse(error, 'CASE_FETCH_ERROR');
    }
  }

  /**
   * Get case by ID via AWS API
   */
  async getCaseByIdAWS(
    id: string,
    includeRelated: boolean,
    context: AuditContext
  ): Promise<ServiceResponse<{ case: Case; evidence?: any[]; timeline?: any[]; related?: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (includeRelated) {
        queryParams.append('includeEvidence', 'true');
        queryParams.append('includeTimeline', 'true');
        queryParams.append('includeRelated', 'true');
      }

      const url = `${this.apiBaseUrl}/api/cases/${id}${queryParams.toString() ? '?' + queryParams : ''}`;
      
      const response = await this.withRetry(async () => {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${context.token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Case not found');
          }
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to fetch case');
        }
        
        return res.json();
      });
      
      return this.createSuccessResponse(response.data);
    } catch (error) {
      return this.createErrorResponse(error, 'CASE_FETCH_ERROR');
    }
  }

  /**
   * Update case via AWS API
   */
  async updateCaseAWS(
    id: string,
    data: Partial<Case>,
    context: AuditContext
  ): Promise<ServiceResponse<{ case: Case }>> {
    try {
      // Get existing case for audit trail
      const existingResponse = await this.getCaseByIdAWS(id, false, context);
      if (!existingResponse.success) {
        return existingResponse as ServiceResponse<{ case: Case }>;
      }
      
      const existing = existingResponse.data?.case;
      
      // Validate update
      await this.validateInput(data);
      
      // Enforce business rules
      await this.enforceRules({ ...existing, ...data }, 'update');
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/cases/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to update case');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'update', id, existing, response.data.case);
      
      // Publish event
      await this.publishEvent({
        eventType: 'case.updated',
        entityId: id,
        entityType: 'case',
        data: response.data.case,
        userId: context.userId,
        companyId: context.companyId
      });
      
      return this.createSuccessResponse(
        response.data,
        'Case updated successfully'
      );
    } catch (error) {
      return this.createErrorResponse(error, 'CASE_UPDATE_ERROR');
    }
  }

  /**
   * Add evidence via AWS API
   */
  async addEvidenceAWS(
    caseId: string,
    evidenceData: any,
    context: AuditContext
  ): Promise<ServiceResponse<any>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/cases/${caseId}/evidence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify(evidenceData)
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add evidence');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'create', response.data.id, null, response.data, 'evidence');
      
      return this.createSuccessResponse(response.data, 'Evidence added successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'EVIDENCE_ADD_ERROR');
    }
  }

  /**
   * Helper method to determine which API to use based on environment
   */
  private shouldUseAWS(): boolean {
    return !!(this.apiBaseUrl && import.meta.env.VITE_USE_AWS_API === 'true');
  }

  /**
   * Unified case creation method that chooses between AWS and local
   */
  async createCaseUnified(
    data: Partial<Case>,
    context: AuditContext
  ): Promise<ServiceResponse<any>> {
    if (this.shouldUseAWS()) {
      return this.createCaseAWS(data, context);
    } else {
      return this.createCase(data, context);
    }
  }

  /**
   * Unified case fetching method that chooses between AWS and local
   */
  async getCasesUnified(
    filters: any,
    options: QueryOptions,
    context: AuditContext
  ): Promise<ServiceResponse<any>> {
    if (this.shouldUseAWS()) {
      return this.getCasesAWS(filters, options, context);
    } else {
      return this.getCases(filters, context);
    }
  }

  /**
   * Unified case by ID method that chooses between AWS and local
   */
  async getCaseByIdUnified(
    id: string,
    includeRelated: boolean,
    context: AuditContext
  ): Promise<ServiceResponse<any>> {
    if (this.shouldUseAWS()) {
      return this.getCaseByIdAWS(id, includeRelated, context);
    } else {
      return this.getCase(id, context);
    }
  }

  /**
   * Unified case update method that chooses between AWS and local
   */
  async updateCaseUnified(
    id: string,
    data: Partial<Case>,
    context: AuditContext
  ): Promise<ServiceResponse<any>> {
    if (this.shouldUseAWS()) {
      return this.updateCaseAWS(id, data, context);
    } else {
      return this.updateCase(id, data, context);
    }
  }
}