/**
 * AWS Status Indicator Component
 * Shows the current AWS API connection status and configuration
 */

import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useApiClient } from '../services/ServiceProvider';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface AWSStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function AWSStatusIndicator({ className = '', showDetails = false }: AWSStatusIndicatorProps) {
  const apiClient = useApiClient();
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true';
  const hasApiClient = !!apiClient;
  
  // Determine status
  const getStatus = () => {
    if (!useAwsApi) {
      return {
        type: 'local',
        label: 'Local Mode',
        description: 'Using local Zustand stores',
        icon: <Wifi className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    
    if (useAwsApi && hasApiClient) {
      return {
        type: 'aws',
        label: 'AWS Connected',
        description: 'Using AWS Lambda APIs',
        icon: <Cloud className="h-3 w-3" />,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    return {
      type: 'error',
      label: 'AWS Error',
      description: 'AWS configured but client not initialized',
      icon: <CloudOff className="h-3 w-3" />,
      color: 'bg-red-100 text-red-800 border-red-200'
    };
  };
  
  const status = getStatus();
  
  if (!showDetails) {
    return (
      <Badge className={`${status.color} ${className}`}>
        {status.icon}
        <span className="ml-1">{status.label}</span>
      </Badge>
    );
  }
  
  return (
    <div className={className}>
      <Alert className={`border ${status.color.includes('red') ? 'border-red-200' : status.color.includes('green') ? 'border-green-200' : 'border-blue-200'}`}>
        <div className="flex items-center gap-2">
          {status.icon}
          <div className="flex-1">
            <div className="font-medium text-sm">{status.label}</div>
            <AlertDescription className="text-xs">
              {status.description}
            </AlertDescription>
          </div>
          {status.type === 'aws' && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              Ready
            </div>
          )}
          {status.type === 'error' && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Error
            </div>
          )}
        </div>
      </Alert>
      
      {showDetails && useAwsApi && (
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <div>API Base URL: {process.env.REACT_APP_API_BASE_URL || 'Not configured'}</div>
          <div>AWS Region: {process.env.REACT_APP_AWS_REGION || 'Not configured'}</div>
          <div>Cognito Pool: {process.env.REACT_APP_COGNITO_USER_POOL_ID ? 'Configured' : 'Not configured'}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get AWS connection status
 */
export function useAWSStatus() {
  const apiClient = useApiClient();
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true';
  const hasApiClient = !!apiClient;
  
  return {
    useAwsApi,
    hasApiClient,
    isConnected: useAwsApi && hasApiClient,
    isLocal: !useAwsApi,
    hasError: useAwsApi && !hasApiClient
  };
}