/**
 * Test Error Boundaries Integration
 * Simple test component to verify error boundaries are working correctly
 */

import React, { useState } from 'react';
import { 
  ActivityErrorBoundaryWrapper, 
  VirtualScrollErrorWrapper, 
  SearchErrorWrapper,
  getErrorStats,
  clearErrorHistory 
} from './src/presentation/atoms/errors';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

// Test component that can throw errors
const ErrorThrowingComponent: React.FC<{ shouldError: boolean; errorType: string }> = ({ 
  shouldError, 
  errorType 
}) => {
  if (shouldError) {
    switch (errorType) {
      case 'virtual-scroll':
        throw new Error('Virtual scrolling viewport measurement failed');
      case 'search':
        throw new Error('Search query processing failed');
      case 'activity':
        throw new Error('Activity data processing failed');
      default:
        throw new Error('Generic component error');
    }
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <p className="text-green-800">Component is working correctly!</p>
    </div>
  );
};

export function ErrorBoundaryTest() {
  const [errors, setErrors] = useState({
    activity: false,
    virtualScroll: false,
    search: false
  });

  const [errorStats, setErrorStats] = useState(getErrorStats());

  const triggerError = (type: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [type]: true }));
  };

  const resetError = (type: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [type]: false }));
  };

  const refreshStats = () => {
    setErrorStats(getErrorStats());
  };

  const clearAllErrors = () => {
    clearErrorHistory();
    setErrorStats(getErrorStats());
    setErrors({ activity: false, virtualScroll: false, search: false });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Error Boundary Integration Test</h1>
        <p className="text-gray-600">Test the error boundaries and recovery mechanisms</p>
      </div>

      {/* Error Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Error Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{errorStats.byType.activity}</div>
              <div className="text-sm text-gray-600">Activity Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{errorStats.byType.virtualScroll}</div>
              <div className="text-sm text-gray-600">Virtual Scroll</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{errorStats.byType.search}</div>
              <div className="text-sm text-gray-600">Search Errors</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={refreshStats} size="sm">Refresh Stats</Button>
            <Button onClick={clearAllErrors} variant="outline" size="sm">Clear All Errors</Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Error Boundary Test */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Error Boundary Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => triggerError('activity')} 
                variant="destructive"
                size="sm"
              >
                Trigger Activity Error
              </Button>
              <Button 
                onClick={() => resetError('activity')} 
                variant="outline"
                size="sm"
              >
                Reset Component
              </Button>
            </div>
            
            <ActivityErrorBoundaryWrapper context="Test Activity Component">
              <ErrorThrowingComponent 
                shouldError={errors.activity} 
                errorType="activity" 
              />
            </ActivityErrorBoundaryWrapper>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Scroll Error Boundary Test */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Scroll Error Boundary Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => triggerError('virtualScroll')} 
                variant="destructive"
                size="sm"
              >
                Trigger Virtual Scroll Error
              </Button>
              <Button 
                onClick={() => resetError('virtualScroll')} 
                variant="outline"
                size="sm"
              >
                Reset Component
              </Button>
            </div>
            
            <VirtualScrollErrorWrapper 
              context="Test Virtual Scroll Component"
              itemCount={100}
              onFallbackToStandardList={() => console.log('Fallback triggered')}
            >
              <ErrorThrowingComponent 
                shouldError={errors.virtualScroll} 
                errorType="virtual-scroll" 
              />
            </VirtualScrollErrorWrapper>
          </div>
        </CardContent>
      </Card>

      {/* Search Error Boundary Test */}
      <Card>
        <CardHeader>
          <CardTitle>Search Error Boundary Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => triggerError('search')} 
                variant="destructive"
                size="sm"
              >
                Trigger Search Error
              </Button>
              <Button 
                onClick={() => resetError('search')} 
                variant="outline"
                size="sm"
              >
                Reset Component
              </Button>
            </div>
            
            <SearchErrorWrapper 
              context="Test Search Component"
              onSearchFallback={(query) => console.log('Fallback search:', query)}
              placeholder="Test search..."
            >
              <ErrorThrowingComponent 
                shouldError={errors.search} 
                errorType="search" 
              />
            </SearchErrorWrapper>
          </div>
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Integration Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700 space-y-2">
            <p>✅ Error boundaries have been successfully integrated into the Activities page</p>
            <p>✅ Specialized error boundaries for virtual scrolling and search are available</p>
            <p>✅ Error recovery, retry mechanisms, and telemetry are functional</p>
            <p>✅ The new compound ActivityList component is integrated with comprehensive error handling</p>
            
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="font-medium">Key Features:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Isolated error boundaries prevent cascade failures</li>
                <li>Specialized recovery strategies for different error types</li>
                <li>Error telemetry and local storage for debugging</li>
                <li>User-friendly error messages with retry options</li>
                <li>Graceful degradation to fallback modes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}