/**
 * Passdown Service
 * Handles all business logic and API communication for the Passdowns module
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  BusinessRuleResult,
  QueryOptions
} from './types';
import {
  Passdown,
  PassdownSummary,
  CreatePassdownRequest,
  UpdatePassdownRequest,
  PassdownFilters,
  PassdownListResponse,
  PassdownDetailResponse,
  PassdownReceipt,
  PassdownAttachment,
  ShiftType,
  UrgencyLevel,
  PassdownStatus,
  PASSDOWN_VALIDATION,
  DEFAULT_PASSDOWN_VALUES
} from '../lib/types/passdown';

export class PassdownService extends BaseService<Passdown, string> {
  private apiBaseUrl: string;
  
  constructor(apiBaseUrl: string = import.meta.env.VITE_API_URL || '') {
    super('PassdownService');
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Create a new passdown
   */
  async createPassdown(
    data: CreatePassdownRequest,
    context: AuditContext
  ): Promise<ServiceResponse<Passdown>> {
    try {
      // Validate input
      await this.validateInput(data);
      
      // Enforce business rules
      await this.enforceRules(data as Partial<Passdown>, 'create');
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to create passdown');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'create', response.data.passdown.id, null, response.data.passdown);
      
      // Publish event
      await this.publishEvent({
        eventType: 'passdown.created',
        entityId: response.data.passdown.id,
        entityType: 'passdown',
        data: response.data.passdown,
        userId: context.userId,
        companyId: context.companyId
      });
      
      return this.createSuccessResponse(
        response.data.passdown,
        'Passdown created successfully'
      );
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_CREATE_ERROR');
    }
  }

  /**
   * Get passdowns list with filtering
   */
  async getPassdowns(
    filters: PassdownFilters,
    options: QueryOptions,
    context: AuditContext
  ): Promise<ServiceResponse<PassdownListResponse>> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.shiftDate) queryParams.append('shiftDate', filters.shiftDate);
      if (filters.fromShift) queryParams.append('fromShift', filters.fromShift);
      if (filters.toShift) queryParams.append('toShift', filters.toShift);
      if (filters.urgencyLevel) queryParams.append('urgencyLevel', filters.urgencyLevel);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.locationId) queryParams.append('locationId', filters.locationId);
      
      // Add pagination
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${context.token}`
          }
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to fetch passdowns');
        }
        
        return res.json();
      });
      
      return this.createSuccessResponse(response.data);
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_FETCH_ERROR');
    }
  }

  /**
   * Get passdown by ID
   */
  async getPassdownById(
    id: string,
    includeRelated: boolean,
    context: AuditContext
  ): Promise<ServiceResponse<PassdownDetailResponse>> {
    try {
      const url = `${this.apiBaseUrl}/api/passdowns/${id}${includeRelated ? '?includeRelated=true' : ''}`;
      
      const response = await this.withRetry(async () => {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${context.token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Passdown not found');
          }
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to fetch passdown');
        }
        
        return res.json();
      });
      
      return this.createSuccessResponse(response.data);
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_FETCH_ERROR');
    }
  }

  /**
   * Update an existing passdown
   */
  async updatePassdown(
    id: string,
    data: UpdatePassdownRequest,
    context: AuditContext
  ): Promise<ServiceResponse<Passdown>> {
    try {
      // Get existing passdown for audit trail
      const existingResponse = await this.getPassdownById(id, false, context);
      if (!existingResponse.success) {
        return existingResponse as ServiceResponse<Passdown>;
      }
      
      const existing = existingResponse.data?.passdown;
      
      // Validate update
      await this.validateInput(data);
      
      // Enforce business rules
      await this.enforceRules({ ...existing, ...data }, 'update');
      
      // Make API call
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to update passdown');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'update', id, existing, response.data.passdown);
      
      // Publish event
      await this.publishEvent({
        eventType: 'passdown.updated',
        entityId: id,
        entityType: 'passdown',
        data: response.data.passdown,
        userId: context.userId,
        companyId: context.companyId
      });
      
      return this.createSuccessResponse(
        response.data.passdown,
        'Passdown updated successfully'
      );
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_UPDATE_ERROR');
    }
  }

  /**
   * Acknowledge a passdown
   */
  async acknowledgePassdown(
    id: string,
    acknowledged: boolean,
    notes: string | undefined,
    context: AuditContext
  ): Promise<ServiceResponse<PassdownReceipt>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/${id}/acknowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`
          },
          body: JSON.stringify({ acknowledged, notes })
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || 'Failed to acknowledge passdown');
        }
        
        return res.json();
      });
      
      // Audit log
      await this.auditLog(context, 'acknowledge', id);
      
      // Publish event
      await this.publishEvent({
        eventType: 'passdown.acknowledged',
        entityId: id,
        entityType: 'passdown',
        data: { passdownId: id, acknowledged, userId: context.userId },
        userId: context.userId,
        companyId: context.companyId
      });
      
      return this.createSuccessResponse(
        response.data.receipt,
        acknowledged ? 'Passdown acknowledged' : 'Passdown marked as read'
      );
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_ACKNOWLEDGE_ERROR');
    }
  }

  /**
   * Get passdowns for current shift
   */
  async getCurrentShiftPassdowns(
    context: AuditContext
  ): Promise<ServiceResponse<PassdownListResponse>> {
    const currentShift = this.getCurrentShift();
    const today = new Date().toISOString().split('T')[0];
    
    return this.getPassdowns(
      {
        toShift: currentShift,
        shiftDate: today,
        status: 'active' as PassdownStatus
      },
      { limit: 50 },
      context
    );
  }

  /**
   * Get urgent passdowns requiring attention
   */
  async getUrgentPassdowns(
    context: AuditContext
  ): Promise<ServiceResponse<PassdownListResponse>> {
    return this.getPassdowns(
      {
        urgencyLevel: 'critical' as UrgencyLevel,
        status: 'active' as PassdownStatus
      },
      { limit: 20 },
      context
    );
  }

  /**
   * Archive old passdowns
   */
  async archiveOldPassdowns(
    daysOld: number,
    context: AuditContext
  ): Promise<ServiceResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Get old passdowns
      const response = await this.getPassdowns(
        {
          endDate: cutoffDate.toISOString().split('T')[0],
          status: 'acknowledged' as PassdownStatus
        },
        { limit: 100 },
        context
      );
      
      if (!response.success || !response.data) {
        return this.createErrorResponse('Failed to fetch passdowns for archiving');
      }
      
      let archivedCount = 0;
      
      // Archive each passdown
      for (const passdown of response.data.passdowns) {
        const updateResponse = await this.updatePassdown(
          passdown.id,
          { status: 'archived' as PassdownStatus },
          context
        );
        
        if (updateResponse.success) {
          archivedCount++;
        }
      }
      
      return this.createSuccessResponse(
        archivedCount,
        `Archived ${archivedCount} passdowns`
      );
    } catch (error) {
      return this.createErrorResponse(error, 'PASSDOWN_ARCHIVE_ERROR');
    }
  }

  // BaseService implementation methods
  
  protected validateEntity(entity: Partial<Passdown>): ValidationResult {
    const errors = [];
    
    // Title validation
    if (entity.title) {
      const titleError = this.validateLength(
        entity.title,
        'title',
        1,
        PASSDOWN_VALIDATION.TITLE_MAX_LENGTH
      );
      if (titleError) errors.push(titleError);
    }
    
    // Notes validation
    if (entity.notes) {
      const notesError = this.validateLength(
        entity.notes,
        'notes',
        1,
        PASSDOWN_VALIDATION.NOTES_MAX_LENGTH
      );
      if (notesError) errors.push(notesError);
    }
    
    // Tags validation
    if (entity.tags && entity.tags.length > PASSDOWN_VALIDATION.TAGS_MAX_COUNT) {
      errors.push({
        field: 'tags',
        code: 'TOO_MANY',
        message: `Maximum ${PASSDOWN_VALIDATION.TAGS_MAX_COUNT} tags allowed`,
        value: entity.tags
      });
    }
    
    // Shift validation
    const validShifts: ShiftType[] = ['night', 'day', 'evening', 'swing', 'custom'];
    if (entity.fromShift && !validShifts.includes(entity.fromShift)) {
      errors.push({
        field: 'fromShift',
        code: 'INVALID_ENUM',
        message: 'Invalid from shift type',
        value: entity.fromShift
      });
    }
    
    if (entity.toShift && !validShifts.includes(entity.toShift)) {
      errors.push({
        field: 'toShift',
        code: 'INVALID_ENUM',
        message: 'Invalid to shift type',
        value: entity.toShift
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected enforceBusinessRules(
    entity: Partial<Passdown>,
    operation: string
  ): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // Rule: Cannot create passdown for past dates
    if (operation === 'create' && entity.shiftDate) {
      const shiftDate = new Date(entity.shiftDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (shiftDate < today) {
        results.push({
          rule: 'no-past-dates',
          passed: false,
          message: 'Cannot create passdowns for past dates',
          severity: 'error'
        });
      }
    }
    
    // Rule: Critical passdowns require acknowledgment
    if (entity.urgencyLevel === 'critical' && entity.acknowledgmentRequired === false) {
      results.push({
        rule: 'critical-requires-ack',
        passed: false,
        message: 'Critical passdowns must require acknowledgment',
        severity: 'warning'
      });
    }
    
    // Rule: Cannot change status from archived
    if (operation === 'update' && entity.status === 'archived') {
      results.push({
        rule: 'no-unarchive',
        passed: false,
        message: 'Cannot modify archived passdowns',
        severity: 'error'
      });
    }
    
    return results;
  }

  protected getEntityName(): string {
    return 'Passdown';
  }

  // File attachment methods
  
  /**
   * Generate pre-signed URL for file upload
   */
  async generateUploadUrl(
    passdownId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    context: AuditContext
  ): Promise<ServiceResponse<{presignedUrl: string; attachmentId: string; s3Key: string; expiresIn: number}>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/attachments/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`,
          },
          body: JSON.stringify({
            passdownId,
            fileName,
            fileType,
            fileSize
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to generate upload URL');
        }

        return res.json();
      });

      return this.createSuccessResponse(response.data, 'Upload URL generated successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'UPLOAD_URL_ERROR');
    }
  }

  /**
   * Upload file to S3 using pre-signed URL
   */
  async uploadFileToS3(
    presignedUrl: string,
    file: File
  ): Promise<ServiceResponse<boolean>> {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed with status: ${response.status}`);
      }

      return this.createSuccessResponse(true, 'File uploaded successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'S3_UPLOAD_ERROR');
    }
  }

  /**
   * Complete file upload and update metadata
   */
  async completeFileUpload(
    attachmentId: string,
    s3Key: string,
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/attachments/complete-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.token}`,
          },
          body: JSON.stringify({
            attachmentId,
            s3Key,
            status: 'active'
          }),
        });

        return res.ok;
      });

      if (response) {
        return this.createSuccessResponse(true, 'Upload completed successfully');
      } else {
        throw new Error('Failed to complete upload');
      }
    } catch (error) {
      return this.createErrorResponse(error, 'UPLOAD_COMPLETE_ERROR');
    }
  }

  /**
   * Get download URL for attachment
   */
  async getAttachmentDownloadUrl(
    attachmentId: string,
    context: AuditContext
  ): Promise<ServiceResponse<{downloadUrl: string; fileName: string; fileType: string; fileSize: number; expiresAt: string}>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/attachments/${attachmentId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${context.token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Attachment not found');
          }
          if (res.status === 403) {
            throw new Error('Access denied to attachment');
          }
          const error = await res.json();
          throw new Error(error.error || 'Failed to get download URL');
        }

        return res.json();
      });

      return this.createSuccessResponse(response.data, 'Download URL generated successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'DOWNLOAD_URL_ERROR');
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    attachmentId: string,
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.apiBaseUrl}/api/passdowns/attachments/${attachmentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${context.token}`,
          },
        });

        return res.ok;
      });

      if (response) {
        // Audit log
        await this.auditLog(context, 'delete', attachmentId, null, null, 'attachment');
        
        return this.createSuccessResponse(true, 'Attachment deleted successfully');
      } else {
        throw new Error('Failed to delete attachment');
      }
    } catch (error) {
      return this.createErrorResponse(error, 'ATTACHMENT_DELETE_ERROR');
    }
  }

  /**
   * Upload file to passdown (complete workflow)
   */
  async uploadFileToPassdown(
    passdownId: string,
    file: File,
    description: string | undefined,
    context: AuditContext
  ): Promise<ServiceResponse<PassdownAttachment>> {
    try {
      // Step 1: Generate pre-signed URL
      const uploadUrlResponse = await this.generateUploadUrl(
        passdownId,
        file.name,
        file.type,
        file.size,
        context
      );
      
      if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
        return this.createErrorResponse('Failed to generate upload URL', 'UPLOAD_INIT_ERROR');
      }

      const { presignedUrl, attachmentId, s3Key } = uploadUrlResponse.data;

      // Step 2: Upload file to S3
      const uploadResponse = await this.uploadFileToS3(presignedUrl, file);
      if (!uploadResponse.success) {
        return this.createErrorResponse('Failed to upload file to S3', 'S3_UPLOAD_ERROR');
      }

      // Step 3: Complete upload and update metadata
      const completeResponse = await this.completeFileUpload(attachmentId, s3Key, context);
      if (!completeResponse.success) {
        return this.createErrorResponse('Failed to complete upload', 'UPLOAD_COMPLETE_ERROR');
      }

      // Create attachment object to return
      const attachment: PassdownAttachment = {
        id: attachmentId,
        passdownId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        s3Key,
        s3Bucket: 'situ8-passdown-attachments',
        uploadedBy: context.userId,
        uploadedByName: context.userEmail || 'Current User',
        uploadedAt: new Date().toISOString(),
        description
      };

      // Audit log
      await this.auditLog(context, 'upload', attachmentId, null, attachment, 'attachment');

      // Publish event
      await this.publishEvent({
        eventType: 'passdown.attachment.uploaded',
        entityId: passdownId,
        entityType: 'passdown',
        data: { attachmentId, fileName: file.name },
        userId: context.userId,
        companyId: context.companyId
      });

      return this.createSuccessResponse(attachment, 'File uploaded successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'FILE_UPLOAD_ERROR');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeBytes: number = 50 * 1024 * 1024): ValidationResult {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Archives
      'application/zip', 'application/x-rar-compressed',
      // Audio/Video (for security footage)
      'video/mp4', 'video/avi', 'video/quicktime',
      'audio/mpeg', 'audio/wav'
    ];

    const errors = [];

    // Check file size
    if (file.size > maxSizeBytes) {
      errors.push({
        field: 'fileSize',
        code: 'TOO_LARGE',
        message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeBytes / 1024 / 1024}MB)`,
        value: file.size
      });
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'fileType',
        code: 'INVALID_TYPE',
        message: `File type ${file.type} is not allowed`,
        value: file.type
      });
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push({
        field: 'fileName',
        code: 'TOO_LONG',
        message: 'File name is too long (max 255 characters)',
        value: file.name
      });
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.com$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push({
        field: 'fileName',
        code: 'DANGEROUS_FILE',
        message: 'File type not allowed for security reasons',
        value: file.name
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper method to determine current shift
   */
  private getCurrentShift(): ShiftType {
    const hour = new Date().getHours();
    
    if (hour >= 23 || hour < 7) return 'night';
    if (hour >= 7 && hour < 15) return 'day';
    if (hour >= 15 && hour < 23) return 'evening';
    
    return 'day'; // Default
  }
}