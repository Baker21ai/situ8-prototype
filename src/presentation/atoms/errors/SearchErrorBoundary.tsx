/**
 * SearchErrorBoundary - Specialized error boundary for search and filtering components
 * Handles search-specific errors and provides graceful fallbacks
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Search, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onSearchFallback?: (query: string) => void;
  context?: string;
  showFallbackSearch?: boolean;
  placeholder?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showFallbackSearch: boolean;
  fallbackQuery: string;
}

export class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showFallbackSearch: false,
      fallbackQuery: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Show fallback search for certain error types
    const showFallback = errorMessage.includes('search') || 
                        errorMessage.includes('filter') || 
                        errorMessage.includes('query') ||
                        errorMessage.includes('index');

    return {
      hasError: true,
      error,
      showFallbackSearch: showFallback
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 SearchErrorBoundary Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', this.props.context);
    console.groupEnd();

    // Save search-specific error data
    this.saveSearchError(error, errorInfo);
  }

  private saveSearchError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        type: 'search',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: this.props.context,
        lastQuery: this.state.fallbackQuery,
        userAgent: navigator.userAgent
      };

      const existingErrors = JSON.parse(
        localStorage.getItem('situ8_search_errors') || '[]'
      );
      
      const updatedErrors = [errorData, ...existingErrors.slice(0, 4)];
      localStorage.setItem('situ8_search_errors', JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.error('Failed to save search error:', storageError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      showFallbackSearch: false,
      fallbackQuery: ''
    });
  };

  private handleFallbackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const { onSearchFallback } = this.props;
    const { fallbackQuery } = this.state;
    
    if (onSearchFallback && fallbackQuery.trim()) {
      onSearchFallback(fallbackQuery.trim());
    }
  };

  private clearSearch = () => {
    this.setState({ fallbackQuery: '' });
    const { onSearchFallback } = this.props;
    if (onSearchFallback) {
      onSearchFallback('');
    }
  };

  render() {
    const { hasError, error, showFallbackSearch, fallbackQuery } = this.state;
    const { children, placeholder = 'Search...', context = 'Search Component' } = this.props;

    if (hasError && error) {
      return (
        <div className="space-y-4">
          {/* Error Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Search functionality encountered an issue in {context}.
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Search
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Fallback Search */}
          {showFallbackSearch && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Fallback Search Active
                  </span>
                </div>
                
                <form onSubmit={this.handleFallbackSearch} className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={placeholder}
                      value={fallbackQuery}
                      onChange={(e) => this.setState({ fallbackQuery: e.target.value })}
                      className="pr-8"
                    />
                    {fallbackQuery && (
                      <button
                        type="button"
                        onClick={this.clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={!fallbackQuery.trim()}>
                      <Search className="h-3 w-3 mr-1" />
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={this.clearSearch}
                    >
                      Clear
                    </Button>
                  </div>
                </form>

                <div className="mt-3 text-xs text-yellow-700">
                  <strong>Note:</strong> Using simplified search while the main search component recovers.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          <details className="text-sm">
            <summary className="text-gray-500 cursor-pointer mb-2">
              Technical Details
            </summary>
            <Card className="bg-gray-50">
              <CardContent className="p-3 font-mono text-xs">
                <div className="space-y-1">
                  <div><strong>Error:</strong> {error.name}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Context:</strong> {context}</div>
                  <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                </div>
              </CardContent>
            </Card>
          </details>
        </div>
      );
    }

    return children;
  }
}

// Convenience wrapper
export const SearchErrorWrapper: React.FC<{
  children: ReactNode;
  context?: string;
  onSearchFallback?: (query: string) => void;
  placeholder?: string;
}> = ({ children, context, onSearchFallback, placeholder }) => (
  <SearchErrorBoundary
    context={context}
    onSearchFallback={onSearchFallback}
    placeholder={placeholder}
    showFallbackSearch={!!onSearchFallback}
  >
    {children}
  </SearchErrorBoundary>
);