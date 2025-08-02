/**
 * VirtualScrollErrorBoundary - Specialized error boundary for virtual scrolling components
 * Handles virtual scrolling specific errors and provides specialized recovery
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { RefreshCw, List, Grid, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onFallbackToStandardList?: () => void;
  itemCount?: number;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  fallbackMode: 'none' | 'standard-list' | 'error-display';
}

export class VirtualScrollErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      fallbackMode: 'none'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine the appropriate fallback based on error type
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('virtual') || 
        errorMessage.includes('scroll') || 
        errorMessage.includes('viewport') ||
        errorMessage.includes('height') ||
        errorMessage.includes('measurement')) {
      return {
        hasError: true,
        error,
        fallbackMode: 'standard-list'
      };
    }

    return {
      hasError: true,
      error,
      fallbackMode: 'error-display'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 VirtualScrollErrorBoundary Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Item Count:', this.props.itemCount);
    console.error('Context:', this.props.context);
    console.groupEnd();

    // Save virtual scroll specific error data
    this.saveVirtualScrollError(error, errorInfo);
  }

  private saveVirtualScrollError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        type: 'virtual-scroll',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: this.props.context,
        itemCount: this.props.itemCount,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent
      };

      const existingErrors = JSON.parse(
        localStorage.getItem('situ8_virtual_scroll_errors') || '[]'
      );
      
      const updatedErrors = [errorData, ...existingErrors.slice(0, 4)];
      localStorage.setItem('situ8_virtual_scroll_errors', JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.error('Failed to save virtual scroll error:', storageError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      fallbackMode: 'none'
    });
  };

  private handleFallbackToStandard = () => {
    const { onFallbackToStandardList } = this.props;
    
    if (onFallbackToStandardList) {
      onFallbackToStandardList();
    }
    
    this.setState({
      fallbackMode: 'standard-list'
    });
  };

  render() {
    const { hasError, error, fallbackMode } = this.state;
    const { children, itemCount } = this.props;

    if (hasError && error) {
      if (fallbackMode === 'standard-list') {
        return (
          <div className="h-full flex flex-col">
            {/* Fallback Notice */}
            <Alert className="m-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Virtual scrolling encountered an issue. Displaying in standard mode.
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Virtual Scroll
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Standard List Fallback */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {/* This would be replaced with actual fallback content */}
                <div className="text-center py-8 text-gray-500">
                  <List className="h-8 w-8 mx-auto mb-2" />
                  <p>Standard list mode active</p>
                  <p className="text-sm">
                    {itemCount ? `${itemCount} items` : 'Loading items...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Full error display
      return (
        <div className="h-full flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Virtual Scrolling Error</h3>
              <p className="text-gray-600 mb-4 text-sm">
                There was an issue with the virtual scrolling component.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Virtual Scroll
                </Button>
                
                <Button
                  onClick={this.handleFallbackToStandard}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <List className="h-4 w-4 mr-2" />
                  Use Standard List
                </Button>
              </div>

              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  <div><strong>Error:</strong> {error.name}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  {itemCount && (
                    <div><strong>Item Count:</strong> {itemCount}</div>
                  )}
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Convenience wrapper
export const VirtualScrollErrorWrapper: React.FC<{
  children: ReactNode;
  itemCount?: number;
  context?: string;
  onFallbackToStandardList?: () => void;
}> = ({ children, itemCount, context, onFallbackToStandardList }) => (
  <VirtualScrollErrorBoundary
    itemCount={itemCount}
    context={context}
    onFallbackToStandardList={onFallbackToStandardList}
  >
    {children}
  </VirtualScrollErrorBoundary>
);