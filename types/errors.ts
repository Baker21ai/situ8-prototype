/**
 * Smart Error Types with Solutions
 * Provides actionable error messages with suggested fixes
 */

export interface ErrorSolution {
  id: string;
  title: string;
  steps: string[];
  link?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Base error class with solutions
 */
export class Situ8Error extends Error {
  public readonly code: string;
  public readonly solutions: ErrorSolution[];
  public readonly context?: ErrorContext;
  public readonly recoverable: boolean;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  
  constructor(
    message: string,
    code: string,
    solutions: ErrorSolution[] = [],
    options?: {
      cause?: Error;
      context?: ErrorContext;
      recoverable?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    }
  ) {
    super(message);
    this.name = 'Situ8Error';
    this.code = code;
    this.solutions = solutions;
    this.context = options?.context;
    this.recoverable = options?.recoverable ?? true;
    this.severity = options?.severity ?? 'medium';
    
    if (options?.cause) {
      this.cause = options.cause;
    }
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Situ8Error);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      solutions: this.solutions,
      context: this.context,
      recoverable: this.recoverable,
      severity: this.severity,
      stack: this.stack
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends Situ8Error {
  constructor(
    message: string,
    options?: {
      endpoint?: string;
      method?: string;
      status?: number;
      cause?: Error;
    }
  ) {
    const solutions: ErrorSolution[] = [
      {
        id: 'check-connection',
        title: 'Check Internet Connection',
        steps: [
          'Verify you have an active internet connection',
          'Try loading other websites to confirm connectivity',
          'Check if you\'re behind a firewall or proxy'
        ]
      },
      {
        id: 'retry-request',
        title: 'Retry the Request',
        steps: [
          'Click the refresh button to retry',
          'Wait a few seconds before retrying',
          'If the issue persists, try again in a few minutes'
        ]
      },
      {
        id: 'check-vpn',
        title: 'VPN/Proxy Settings',
        steps: [
          'If using a VPN, try disconnecting and reconnecting',
          'Check your proxy settings in browser preferences',
          'Contact IT if you\'re on a corporate network'
        ]
      }
    ];
    
    super(message, 'NETWORK_ERROR', solutions, {
      ...options,
      severity: 'medium',
      recoverable: true,
      context: {
        endpoint: options?.endpoint,
        method: options?.method,
        status: options?.status
      }
    });
    
    this.name = 'NetworkError';
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends Situ8Error {
  constructor(
    message: string,
    code: string = 'AUTH_ERROR',
    options?: {
      authType?: 'login' | 'token' | 'permission' | 'session';
      cause?: Error;
    }
  ) {
    const solutions: ErrorSolution[] = [];
    
    switch (options?.authType) {
      case 'login':
        solutions.push(
          {
            id: 'check-credentials',
            title: 'Verify Your Credentials',
            steps: [
              'Ensure your email is typed correctly',
              'Check that Caps Lock is off',
              'Try resetting your password if forgotten'
            ]
          },
          {
            id: 'clear-cookies',
            title: 'Clear Browser Data',
            steps: [
              'Clear cookies and site data',
              'Try using an incognito/private window',
              'Disable browser extensions temporarily'
            ]
          }
        );
        break;
        
      case 'token':
        solutions.push(
          {
            id: 'refresh-session',
            title: 'Refresh Your Session',
            steps: [
              'Log out and log back in',
              'Clear browser cache and cookies',
              'Try a different browser'
            ]
          }
        );
        break;
        
      case 'permission':
        solutions.push(
          {
            id: 'contact-admin',
            title: 'Insufficient Permissions',
            steps: [
              'Contact your administrator for access',
              'Verify you\'re using the correct account',
              'Check if you need additional clearance level'
            ]
          }
        );
        break;
        
      case 'session':
        solutions.push(
          {
            id: 'session-expired',
            title: 'Session Expired',
            steps: [
              'Your session has expired for security',
              'Please log in again to continue',
              'Enable "Remember Me" to stay logged in longer'
            ]
          }
        );
        break;
    }
    
    super(message, code, solutions, {
      ...options,
      severity: options?.authType === 'permission' ? 'high' : 'medium',
      recoverable: true
    });
    
    this.name = 'AuthenticationError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends Situ8Error {
  public readonly fields: Record<string, string[]>;
  
  constructor(
    message: string,
    fields: Record<string, string[]>,
    options?: {
      form?: string;
      cause?: Error;
    }
  ) {
    const solutions: ErrorSolution[] = [
      {
        id: 'fix-fields',
        title: 'Fix Invalid Fields',
        steps: Object.entries(fields).map(([field, errors]) => 
          `${field}: ${errors.join(', ')}`
        )
      },
      {
        id: 'check-requirements',
        title: 'Check Field Requirements',
        steps: [
          'Review required fields marked with asterisk (*)',
          'Ensure dates are in correct format',
          'Check character limits for text fields'
        ]
      }
    ];
    
    super(message, 'VALIDATION_ERROR', solutions, {
      ...options,
      severity: 'low',
      recoverable: true,
      context: {
        form: options?.form,
        fields: Object.keys(fields)
      }
    });
    
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Service errors
 */
export class ServiceError extends Situ8Error {
  constructor(
    message: string,
    serviceName: string,
    operation: string,
    options?: {
      cause?: Error;
      retryable?: boolean;
    }
  ) {
    const solutions: ErrorSolution[] = [];
    
    if (options?.retryable !== false) {
      solutions.push({
        id: 'retry-operation',
        title: 'Retry Operation',
        steps: [
          'Click retry to attempt the operation again',
          'If multiple retries fail, wait a few minutes',
          'Check service health status'
        ]
      });
    }
    
    solutions.push(
      {
        id: 'check-service-health',
        title: 'Check Service Status',
        steps: [
          'Open the service health panel (bottom right)',
          `Look for ${serviceName} service status`,
          'Wait for service to recover if unhealthy'
        ]
      },
      {
        id: 'report-issue',
        title: 'Report Issue',
        steps: [
          'Copy error details (click Copy button)',
          'Contact support with the error information',
          'Include what you were trying to do'
        ]
      }
    );
    
    super(message, 'SERVICE_ERROR', solutions, {
      ...options,
      severity: 'high',
      recoverable: options?.retryable !== false,
      context: {
        service: serviceName,
        operation
      }
    });
    
    this.name = 'ServiceError';
  }
}

/**
 * Data errors
 */
export class DataError extends Situ8Error {
  constructor(
    message: string,
    dataType: string,
    operation: 'load' | 'save' | 'delete' | 'sync',
    options?: {
      cause?: Error;
      entityId?: string;
      entityType?: string;
    }
  ) {
    const solutions: ErrorSolution[] = [];
    
    switch (operation) {
      case 'load':
        solutions.push(
          {
            id: 'refresh-data',
            title: 'Refresh Data',
            steps: [
              'Click refresh to reload the data',
              'Check your filters and search criteria',
              'Try clearing filters to see all data'
            ]
          }
        );
        break;
        
      case 'save':
        solutions.push(
          {
            id: 'retry-save',
            title: 'Retry Save',
            steps: [
              'Check all required fields are filled',
              'Ensure no validation errors',
              'Try saving again'
            ]
          },
          {
            id: 'check-connection',
            title: 'Check Connection',
            steps: [
              'Verify internet connection',
              'Check if server is accessible',
              'Try refreshing the page'
            ]
          }
        );
        break;
        
      case 'delete':
        solutions.push(
          {
            id: 'check-permissions',
            title: 'Check Permissions',
            steps: [
              'Verify you have delete permissions',
              'Check if item is locked or in use',
              'Contact admin if needed'
            ]
          }
        );
        break;
        
      case 'sync':
        solutions.push(
          {
            id: 'force-sync',
            title: 'Force Synchronization',
            steps: [
              'Click sync button to force update',
              'Check for conflicting changes',
              'Resolve any merge conflicts'
            ]
          }
        );
        break;
    }
    
    super(message, 'DATA_ERROR', solutions, {
      ...options,
      severity: operation === 'delete' ? 'high' : 'medium',
      recoverable: true,
      context: {
        dataType,
        operation,
        entityId: options?.entityId,
        entityType: options?.entityType
      }
    });
    
    this.name = 'DataError';
  }
}

/**
 * Performance errors
 */
export class PerformanceError extends Situ8Error {
  constructor(
    message: string,
    issue: 'memory' | 'cpu' | 'network' | 'storage',
    options?: {
      cause?: Error;
      metric?: number;
      threshold?: number;
    }
  ) {
    const solutions: ErrorSolution[] = [];
    
    switch (issue) {
      case 'memory':
        solutions.push(
          {
            id: 'reduce-memory',
            title: 'Reduce Memory Usage',
            steps: [
              'Close unused browser tabs',
              'Refresh the page to clear memory',
              'Reduce the amount of data displayed'
            ]
          },
          {
            id: 'browser-restart',
            title: 'Restart Browser',
            steps: [
              'Save any unsaved work',
              'Close all browser windows',
              'Restart browser and try again'
            ]
          }
        );
        break;
        
      case 'cpu':
        solutions.push(
          {
            id: 'reduce-activity',
            title: 'Reduce Activity',
            steps: [
              'Pause real-time updates temporarily',
              'Close other applications',
              'Disable animations in settings'
            ]
          }
        );
        break;
        
      case 'network':
        solutions.push(
          {
            id: 'optimize-network',
            title: 'Optimize Network Usage',
            steps: [
              'Reduce data refresh frequency',
              'Enable data pagination',
              'Check network speed and latency'
            ]
          }
        );
        break;
        
      case 'storage':
        solutions.push(
          {
            id: 'clear-storage',
            title: 'Clear Storage',
            steps: [
              'Clear browser cache',
              'Remove old downloaded files',
              'Clear application data if needed'
            ]
          }
        );
        break;
    }
    
    super(message, 'PERFORMANCE_ERROR', solutions, {
      ...options,
      severity: 'high',
      recoverable: true,
      context: {
        issue,
        metric: options?.metric,
        threshold: options?.threshold
      }
    });
    
    this.name = 'PerformanceError';
  }
}

/**
 * Helper function to create user-friendly error messages
 */
export function createUserFriendlyError(error: Error): Situ8Error {
  // If already a Situ8Error, return as-is
  if (error instanceof Situ8Error) {
    return error;
  }
  
  // Analyze error and create appropriate Situ8Error
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
    return new NetworkError('Unable to connect to server', { cause: error });
  }
  
  // Auth errors
  if (message.includes('unauthorized') || message.includes('401')) {
    return new AuthenticationError('Your session has expired', 'SESSION_EXPIRED', {
      authType: 'session',
      cause: error
    });
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return new AuthenticationError('You don\'t have permission to access this resource', 'PERMISSION_DENIED', {
      authType: 'permission',
      cause: error
    });
  }
  
  // Performance errors
  if (message.includes('memory') || message.includes('heap')) {
    return new PerformanceError('Application is running out of memory', 'memory', { cause: error });
  }
  
  // Default error
  return new Situ8Error(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    [
      {
        id: 'general-troubleshooting',
        title: 'General Troubleshooting',
        steps: [
          'Refresh the page',
          'Clear browser cache and cookies',
          'Try a different browser',
          'Contact support if issue persists'
        ]
      }
    ],
    {
      cause: error,
      severity: 'medium',
      recoverable: true
    }
  );
}