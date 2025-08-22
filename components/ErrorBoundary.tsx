/**
 * Error Boundary Component
 * Catches and handles errors in the React component tree
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getBreadcrumbTracker } from '../hooks/useErrorTracking';
import { debug } from '../utils/debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Get error context with breadcrumbs
    const tracker = getBreadcrumbTracker();
    const errorContext = tracker.getErrorContext(error);
    
    // Log error with full context
    debug.error('ErrorBoundary', error, {
      ...errorContext,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1
    });
    
    // Log breadcrumbs separately for clarity
    if (import.meta.env.DEV) {
      console.group('🍞 Error Breadcrumbs (Last 10 actions)');
      errorContext.breadcrumbs.slice(-10).forEach(breadcrumb => {
        const time = new Date(breadcrumb.timestamp).toLocaleTimeString();
        console.log(`${time} [${breadcrumb.type}] ${breadcrumb.message}`, breadcrumb.data);
      });
      console.groupEnd();
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external error reporting service in production
    if (!import.meta.env.DEV) {
      // TODO: Send to error reporting service (e.g., Sentry)
      // Include breadcrumbs for better debugging
      console.error('Production error with context:', errorContext);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isAuthError = error?.message?.toLowerCase().includes('auth') || 
                         error?.message?.toLowerCase().includes('cognito');
      const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                            error?.message?.toLowerCase().includes('fetch');

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 dark">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                {errorCount > 1 && (
                  <span className="text-yellow-600">
                    This error has occurred {errorCount} times.{' '}
                  </span>
                )}
                An unexpected error has occurred. The error has been logged.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Error details in development */}
                {import.meta.env.DEV && (
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <p className="font-semibold text-sm">Error Details:</p>
                    <p className="text-sm font-mono text-destructive">
                      {error?.message || 'Unknown error'}
                    </p>
                    {error?.stack && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Stack trace
                        </summary>
                        <pre className="mt-2 overflow-auto max-h-40 text-muted-foreground">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Helpful error messages */}
                {isAuthError && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                    <p className="text-sm">
                      This appears to be an authentication issue. 
                      The app will continue to work in demo mode.
                    </p>
                  </div>
                )}

                {isNetworkError && (
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                    <p className="text-sm">
                      This appears to be a network connectivity issue. 
                      Please check your internet connection.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleReload} variant="outline">
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </div>

                {/* Additional help text */}
                <p className="text-sm text-muted-foreground pt-4">
                  If this problem persists, please contact support or try:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Clearing your browser cache</li>
                  <li>Using a different browser</li>
                  <li>Checking if you're using the latest version</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for AWS/Amplify errors
export class AmplifyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's an Amplify-related error
    const isAmplifyError = error.message?.includes('Amplify') || 
                          error.message?.includes('Cognito') ||
                          error.message?.includes('AWS') ||
                          error.stack?.includes('@aws-amplify');
    
    if (isAmplifyError) {
      console.warn('AWS Amplify error caught, continuing in fallback mode:', error.message);
      // Don't show error UI for Amplify errors, just log them
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isAmplifyError = error.message?.includes('Amplify') || 
                          error.message?.includes('Cognito') ||
                          error.message?.includes('AWS') ||
                          error.stack?.includes('@aws-amplify');
    
    if (isAmplifyError) {
      console.warn('AWS Amplify error details:', {
        message: error.message,
        componentStack: errorInfo.componentStack
      });
      // Don't propagate Amplify errors
      return;
    }

    // For non-Amplify errors, use the parent class behavior
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  render() {
    if (this.state.hasError) {
      // For non-Amplify errors, show error UI
      return (
        <ErrorBoundary fallback={this.props.fallback}>
          {this.props.children}
        </ErrorBoundary>
      );
    }

    return this.props.children;
  }
}