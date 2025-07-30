/**
 * Service layer types and interfaces
 * Common types used across all services in the Situ8 business logic layer
 */

// Common service response wrapper
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  message?: string;
  metadata?: ResponseMetadata;
}

// Service error types
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
}

// Response metadata for pagination, etc.
export interface ResponseMetadata {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timing?: {
    executionTime: number;
    timestamp: Date;
  };
  version?: string;
}

// Common query parameters
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
  include?: string[];
  exclude?: string[];
}

// Audit context for all operations
export interface AuditContext {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Business rule evaluation result
export interface BusinessRuleResult {
  ruleName: string;
  passed: boolean;
  message: string;
  metadata?: Record<string, any>;
}

// Repository interface that all services implement
export interface Repository<T, K = string> {
  findById(id: K): Promise<ServiceResponse<T>>;
  findAll(options?: QueryOptions): Promise<ServiceResponse<T[]>>;
  create(data: Partial<T>, context: AuditContext): Promise<ServiceResponse<T>>;
  update(id: K, data: Partial<T>, context: AuditContext): Promise<ServiceResponse<T>>;
  delete(id: K, context: AuditContext): Promise<ServiceResponse<boolean>>;
  exists(id: K): Promise<boolean>;
}

// Service configuration
export interface ServiceConfig {
  enableAudit: boolean;
  enableValidation: boolean;
  enableBusinessRules: boolean;
  maxRetries: number;
  timeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

// Auto-creation rule configuration
export interface AutoCreationRule {
  sourceEntityType: 'activity' | 'incident' | 'case' | 'bol';
  targetEntityType: 'incident' | 'case' | 'bol';
  condition: AutoCreationCondition;
  configuration: AutoCreationConfig;
}

export interface AutoCreationCondition {
  type: 'always' | 'conditional' | 'never';
  rules?: BusinessRule[];
}

export interface AutoCreationConfig {
  skipPending?: boolean;
  requiresValidation?: boolean;
  dismissible?: boolean;
  defaultPriority?: string;
  defaultStatus?: string;
  assignmentRules?: AssignmentRule[];
}

export interface BusinessRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
  value: any;
  weight?: number;
}

export interface AssignmentRule {
  condition: BusinessRule[];
  assignTo: string;
  priority: number;
}

// Status transition rules
export interface StatusTransitionRule {
  fromStatus: string;
  toStatus: string;
  requiredRole: string[];
  requiresApproval: boolean;
  businessRules?: BusinessRule[];
}

// Tag generation rules
export interface TagGenerationRule {
  type: 'system' | 'user';
  source: string; // field name or function
  template: string; // template for tag generation
  conditions?: BusinessRule[];
}

// Multi-entity operation context
export interface OperationContext extends AuditContext {
  correlationId: string;
  entityType: string;
  entityId: string;
  operationType: 'create' | 'update' | 'delete' | 'link' | 'unlink';
  relatedEntities?: Array<{
    type: string;
    id: string;
    relationship: string;
  }>;
}

// Service method decorators metadata
export interface ServiceMethodMetadata {
  requiresAuth: boolean;
  requiredRoles: string[];
  auditLevel: 'none' | 'basic' | 'detailed';
  validateInput: boolean;
  enforceBusinessRules: boolean;
  cacheResult: boolean;
  retryOnFailure: boolean;
}

// Common service exceptions
export class ServiceException extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceException';
  }
}

export class ValidationException extends ServiceException {
  constructor(
    message: string,
    public validationErrors: ValidationError[]
  ) {
    super('VALIDATION_ERROR', message, { validationErrors });
    this.name = 'ValidationException';
  }
}

export class BusinessRuleException extends ServiceException {
  constructor(
    message: string,
    public ruleResults: BusinessRuleResult[]
  ) {
    super('BUSINESS_RULE_VIOLATION', message, { ruleResults });
    this.name = 'BusinessRuleException';
  }
}

export class AuthorizationException extends ServiceException {
  constructor(
    public requiredRole: string,
    public userRole: string
  ) {
    super('AUTHORIZATION_ERROR', `Required role: ${requiredRole}, user role: ${userRole}`);
    this.name = 'AuthorizationException';
  }
}

// Service event types for pub/sub
export interface ServiceEvent {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  userId: string;
  data: Record<string, any>;
  correlationId?: string;
}

// Service health check
export interface HealthCheckResult {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  timestamp: Date;
}

// Export utility type for service method return types
export type ServiceMethod<T> = Promise<ServiceResponse<T>>;
export type ServiceListMethod<T> = Promise<ServiceResponse<T[]>>;
export type ServiceBooleanMethod = Promise<ServiceResponse<boolean>>;