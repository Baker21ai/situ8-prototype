/**
 * Base Service Class
 * Provides common functionality for all services in the Situ8 business logic layer
 */

import {
  ServiceResponse,
  ServiceError,
  ServiceConfig,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  BusinessRule,
  ServiceException,
  ValidationException,
  BusinessRuleException,
  AuthorizationException,
  ServiceEvent,
  QueryOptions,
  ResponseMetadata
} from './types';

export abstract class BaseService<T, K = string> {
  protected config: ServiceConfig;
  protected serviceName: string;
  
  constructor(serviceName: string, config?: Partial<ServiceConfig>) {
    this.serviceName = serviceName;
    this.config = {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      maxRetries: 3,
      timeoutMs: 5000,
      cacheEnabled: false,
      cacheTtlMs: 300000, // 5 minutes
      ...config
    };
  }

  // Abstract methods that must be implemented by concrete services
  protected abstract validateEntity(entity: Partial<T>): ValidationResult;
  protected abstract enforceBusinessRules(entity: Partial<T>, operation: string): BusinessRuleResult[];
  protected abstract getEntityName(): string;

  // Common error handling
  protected createErrorResponse<R>(error: string | Error, code = 'UNKNOWN_ERROR'): ServiceResponse<R> {
    const errorMessage = error instanceof Error ? error.message : error;
    
    if (this.config.enableAudit) {
      this.logError(code, errorMessage, error instanceof Error ? error.stack : undefined);
    }

    return {
      success: false,
      error: {
        code,
        message: errorMessage,
        details: error instanceof Error ? { name: error.name } : undefined,
        stackTrace: error instanceof Error ? error.stack : undefined
      }
    };
  }

  // Common success response
  protected createSuccessResponse<R>(
    data: R, 
    message?: string, 
    metadata?: ResponseMetadata
  ): ServiceResponse<R> {
    return {
      success: true,
      data,
      message,
      metadata
    };
  }

  // Validation wrapper
  protected async validateInput(entity: Partial<T>): Promise<void> {
    if (!this.config.enableValidation) return;

    const validationResult = this.validateEntity(entity);
    if (!validationResult.isValid) {
      throw new ValidationException(
        `Validation failed for ${this.getEntityName()}`,
        validationResult.errors
      );
    }
  }

  // Business rules wrapper
  protected async enforceRules(entity: Partial<T>, operation: string): Promise<void> {
    if (!this.config.enableBusinessRules) return;

    const ruleResults = this.enforceBusinessRules(entity, operation);
    const failedRules = ruleResults.filter(r => !r.passed);
    
    if (failedRules.length > 0) {
      throw new BusinessRuleException(
        `Business rule violations for ${this.getEntityName()}`,
        failedRules
      );
    }
  }

  // Authorization check
  protected checkAuthorization(context: AuditContext, requiredRoles: string[]): void {
    if (requiredRoles.length === 0) return;
    
    if (!requiredRoles.includes(context.userRole)) {
      throw new AuthorizationException(
        requiredRoles.join(' or '),
        context.userRole
      );
    }
  }

  // Audit logging
  protected async auditLog(
    context: AuditContext,
    operation: string,
    entityId?: K,
    beforeState?: Partial<T>,
    afterState?: Partial<T>
  ): Promise<void> {
    if (!this.config.enableAudit) return;

    try {
      // In a real implementation, this would call the audit service
      console.log(`[AUDIT] ${this.serviceName}`, {
        userId: context.userId,
        userName: context.userName,
        userRole: context.userRole,
        action: `${this.getEntityName()}.${operation}`,
        entityId,
        reason: context.reason,
        timestamp: new Date(),
        beforeState,
        afterState,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress
      });
    } catch (error) {
      console.warn(`Failed to audit log for ${this.serviceName}:`, error);
    }
  }

  // Error logging
  protected logError(code: string, message: string, stackTrace?: string): void {
    console.error(`[ERROR] ${this.serviceName}`, {
      code,
      message,
      stackTrace,
      timestamp: new Date()
    });
  }

  // Event publishing (for future pub/sub integration)
  protected async publishEvent(event: Omit<ServiceEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const fullEvent: ServiceEvent = {
      ...event,
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // In a real implementation, this would publish to an event bus
    console.log(`[EVENT] ${this.serviceName}`, fullEvent);
  }

  // Retry logic wrapper
  protected async withRetry<R>(
    operation: () => Promise<R>,
    maxRetries = this.config.maxRetries
  ): Promise<R> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Timeout wrapper
  protected async withTimeout<R>(
    operation: Promise<R>,
    timeoutMs = this.config.timeoutMs
  ): Promise<R> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([operation, timeoutPromise]);
  }

  // Common business rule evaluators
  protected evaluateRule(entity: any, rule: BusinessRule): boolean {
    const fieldValue = this.getNestedValue(entity, rule.field);
    
    switch (rule.operator) {
      case 'eq':
        return fieldValue === rule.value;
      case 'ne':
        return fieldValue !== rule.value;
      case 'gt':
        return fieldValue > rule.value;
      case 'lt':
        return fieldValue < rule.value;
      case 'gte':
        return fieldValue >= rule.value;
      case 'lte':
        return fieldValue <= rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(rule.value);
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(rule.value).test(fieldValue);
      default:
        return false;
    }
  }

  // Helper to get nested object values
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Generate correlation ID for multi-entity operations
  protected generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Standard field validators
  protected validateRequired(value: any, fieldName: string): ValidationError | null {
    if (value === undefined || value === null || value === '') {
      return {
        field: fieldName,
        code: 'REQUIRED',
        message: `${fieldName} is required`,
        value
      };
    }
    return null;
  }

  protected validateEmail(email: string, fieldName: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        field: fieldName,
        code: 'INVALID_EMAIL',
        message: `${fieldName} must be a valid email address`,
        value: email
      };
    }
    return null;
  }

  protected validateLength(
    value: string, 
    fieldName: string, 
    min?: number, 
    max?: number
  ): ValidationError | null {
    if (min !== undefined && value.length < min) {
      return {
        field: fieldName,
        code: 'TOO_SHORT',
        message: `${fieldName} must be at least ${min} characters`,
        value
      };
    }
    
    if (max !== undefined && value.length > max) {
      return {
        field: fieldName,
        code: 'TOO_LONG',
        message: `${fieldName} must be no more than ${max} characters`,
        value
      };
    }
    
    return null;
  }

  protected validateEnum(
    value: any, 
    fieldName: string, 
    allowedValues: any[]
  ): ValidationError | null {
    if (!allowedValues.includes(value)) {
      return {
        field: fieldName,
        code: 'INVALID_ENUM',
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        value
      };
    }
    return null;
  }

  // Query option helpers
  protected buildQueryMetadata(
    results: T[],
    totalCount: number,
    options: QueryOptions = {}
  ): ResponseMetadata {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      },
      timing: {
        executionTime: 0, // Would be calculated in real implementation
        timestamp: new Date()
      }
    };
  }

  // Health check for service monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      // Basic health checks - override in concrete services for specific checks
      return {
        status: 'healthy',
        details: {
          serviceName: this.serviceName,
          config: this.config,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          serviceName: this.serviceName,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        }
      };
    }
  }
}