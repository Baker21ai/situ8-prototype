/**
 * ErrorFallback - Comprehensive error fallback UI with recovery options
 * Provides user-friendly error display with retry, reset, and reporting capabilities
 */

import React, { useState, useEffect } from 'react';
import { ErrorInfo } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  RotateCcw, 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Copy,
  ExternalLink,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo | null;
  context?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onReportIssue?: () => void;
  isRecovering?: boolean;
  retryCount?: number;
  maxRetries?: number;
  canRetry?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  context = 'Component',
  onRetry,
  onReset,
  onReportIssue,
  isRecovering = false,
  retryCount = 0,
  maxRetries = 3,
  canRetry = true
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recoveryHistory, setRecoveryHistory] = useState<string[]>([]);

  // Auto-retry countdown for recoverable errors
  useEffect(() => {
    if (isRecovering && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isRecovering]);

  // Load recovery history from localStorage
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('situ8_recovery_history') || '[]');
      setRecoveryHistory(history.slice(0, 3)); // Show last 3 recovery attempts
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Determine error severity and recovery suggestions
  const getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'medium';
    }
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'high';
    }
    if (errorName.includes('chunk') || errorMessage.includes('loading')) {
      return 'low';
    }
    if (errorMessage.includes('memory') || errorMessage.includes('maximum')) {
      return 'critical';
    }
    
    return 'medium';
  };

  const getRecoverySuggestions = (error: Error): string[] => {
    const errorMessage = error.message?.toLowerCase() || '';
    const suggestions: string[] = [];

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the server is accessible');
      suggestions.push('Try refreshing the page');
    } else if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      suggestions.push('Clear your browser cache');
      suggestions.push('Refresh the page to reload resources');
      suggestions.push('Check for browser extensions that might block content');
    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      suggestions.push('Check your user permissions');
      suggestions.push('Try logging out and back in');
      suggestions.push('Contact your administrator');
    } else if (errorMessage.includes('memory') || errorMessage.includes('maximum')) {
      suggestions.push('Close other browser tabs');
      suggestions.push('Restart your browser');
      suggestions.push('Try using a different browser');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Contact support if the issue persists');
    }

    return suggestions;
  };

  const severity = getErrorSeverity(error);
  const suggestions = getRecoverySuggestions(error);

  const severityConfig = {
    low: {
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      icon: Activity
    },
    medium: {
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-800',
      icon: AlertTriangle
    },
    high: {
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-100 text-red-800',
      icon: AlertTriangle
    },
    critical: {
      color: 'bg-red-100 border-red-300',
      textColor: 'text-red-900',
      badgeColor: 'bg-red-200 text-red-900',
      icon: Shield
    }
  };

  const config = severityConfig[severity];
  const SeverityIcon = config.icon;

  const handleCopyError = () => {
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // You could show a toast notification here
        console.log('Error details copied to clipboard');
      })
      .catch(err => console.error('Failed to copy error details:', err));
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl ${config.color} shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${config.badgeColor}`}>
                <SeverityIcon className={`h-5 w-5 ${config.textColor}`} />
              </div>
              <div>
                <CardTitle className={`text-lg ${config.textColor}`}>
                  Something went wrong in {context}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={config.badgeColor}>
                    {severity.toUpperCase()} SEVERITY
                  </Badge>
                  {retryCount > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Attempt {retryCount + 1}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyError}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              {onReportIssue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReportIssue}
                  className="text-xs"
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert className="border-0 bg-white/50">
            <AlertDescription className={`font-medium ${config.textColor}`}>
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          {/* Recovery Actions */}
          <div className="flex flex-wrap gap-2">
            {onRetry && canRetry && (
              <Button
                onClick={onRetry}
                disabled={isRecovering}
                className="flex items-center gap-2"
                variant="default"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {countdown > 0 ? `Retrying in ${countdown}s` : 'Retrying...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Retry ({maxRetries - retryCount} left)
                  </>
                )}
              </Button>
            )}

            {onReset && (
              <Button
                onClick={onReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Component
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>

          {/* Recovery Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className={`font-medium text-sm ${config.textColor}`}>
                Try these solutions:
              </h4>
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index} 
                    className={`text-sm ${config.textColor} flex items-start gap-2`}
                  >
                    <span className="text-xs mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Recovery History */}
          {recoveryHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className={`font-medium text-sm ${config.textColor}`}>
                Recent Recovery Attempts:
              </h4>
              <div className="space-y-1">
                {recoveryHistory.map((attempt, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    <span className={config.textColor}>{attempt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between p-2 text-xs"
              >
                Technical Details
                {showDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong> {error.name}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Footer Info */}
          <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span>Error ID: {Date.now().toString(36)}</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};