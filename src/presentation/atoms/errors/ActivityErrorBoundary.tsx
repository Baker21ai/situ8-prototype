/**
 * ActivityErrorBoundary - Comprehensive error boundary for activity components
 * Handles different error scenarios with specialized recovery strategies
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, prevents error propagation to parent boundaries
  context?: string; // Context for better error reporting
  enableRecovery?: boolean; // Enable retry and recovery features
  enableTelemetry?: boolean; // Enable error telemetry
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

export class ActivityErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
      isRecovering: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context, enableTelemetry = true } = this.props;
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Log error for debugging
    console.group(`🚨 ActivityErrorBoundary Error ${context ? `(${context})` : ''}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Send telemetry if enabled
    if (enableTelemetry) {
      this.sendErrorTelemetry(error, errorInfo);
    }

    // Save error to local storage for debugging
    this.saveErrorToLocalStorage(error, errorInfo);
  }

  private sendErrorTelemetry = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, this would send to your error reporting service
      const telemetryData = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: this.props.context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(), // Implement based on your auth system
        sessionId: this.getSessionId()
      };

      // Example: Send to error reporting service
      // errorReportingService.captureException(telemetryData);
      
      console.log('📊 Error telemetry data:', telemetryData);
    } catch (telemetryError) {
      console.error('Failed to send error telemetry:', telemetryError);
    }
  };

  private saveErrorToLocalStorage = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: this.props.context,
        retryCount: this.state.retryCount
      };

      const existingErrors = JSON.parse(
        localStorage.getItem('situ8_activity_errors') || '[]'
      );
      
      // Keep only last 10 errors to prevent storage bloat
      const updatedErrors = [errorData, ...existingErrors.slice(0, 9)];
      
      localStorage.setItem('situ8_activity_errors', JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.error('Failed to save error to localStorage:', storageError);
    }
  };

  private getCurrentUserId = (): string | null => {
    // Implement based on your authentication system
    // For now, return a placeholder
    return localStorage.getItem('current_user_id') || null;
  };

  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({ isRecovering: true });

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
        isRecovering: false
      });
    }, delay);
  };

  private handleReset = () => {
    // Clear any pending retries
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Reset to initial state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false
    });
  };

  private handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create issue report data
    const issueData = {
      errorId,
      timestamp: new Date().toISOString(),
      error: error?.toString(),
      componentStack: errorInfo?.componentStack,
      context: this.props.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, this would open your issue reporting system
    console.log('🐛 Issue report data:', issueData);
    
    // Example: Open issue reporting form
    // const issueUrl = `${config.issueReportingUrl}?data=${encodeURIComponent(JSON.stringify(issueData))}`;
    // window.open(issueUrl, '_blank');
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(issueData, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => console.error('Failed to copy error details'));
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, isRecovering, retryCount } = this.state;
    const { children, fallback, enableRecovery = true, context = 'Activity Component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback && !enableRecovery) {
        return fallback;
      }

      // Use enhanced error fallback with recovery features
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          context={context}
          onRetry={enableRecovery ? this.handleRetry : undefined}
          onReset={enableRecovery ? this.handleReset : undefined}
          onReportIssue={this.handleReportIssue}
          isRecovering={isRecovering}
          retryCount={retryCount}
          maxRetries={this.maxRetries}
          canRetry={enableRecovery && retryCount < this.maxRetries}
        />
      );
    }

    return children;
  }
}

// Convenience wrapper for common use cases
export const ActivityErrorBoundaryWrapper: React.FC<{
  children: ReactNode;
  context?: string;
  isolate?: boolean;
}> = ({ children, context, isolate = false }) => (
  <ActivityErrorBoundary
    context={context}
    isolate={isolate}
    enableRecovery={true}
    enableTelemetry={true}
  >
    {children}
  </ActivityErrorBoundary>
);

// Higher-order component for easy integration
export function withActivityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  const WrappedComponent = (props: P) => (
    <ActivityErrorBoundary context={context || Component.displayName || Component.name}>
      <Component {...props} />
    </ActivityErrorBoundary>
  );

  WrappedComponent.displayName = `withActivityErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}