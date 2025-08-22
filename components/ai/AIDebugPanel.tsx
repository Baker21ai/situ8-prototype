'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useServices } from '../../services/ServiceProvider';
import { getApiClient } from '../../services/aws-api';

interface DebugInfo {
  hasApiClient: boolean;
  hasAuthToken: boolean;
  tokenPreview?: string;
  aiServiceAvailable: boolean;
  lastTestResult?: string;
  lastTestError?: string;
}

export function AIDebugPanel() {
  const { aiService } = useServices();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const apiClient = getApiClient();
      const authToken = apiClient?.getAuthToken();
      
      const info: DebugInfo = {
        hasApiClient: !!apiClient,
        hasAuthToken: !!authToken,
        tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : undefined,
        aiServiceAvailable: !!aiService,
      };
      
      setDebugInfo(info);
    } catch (error) {
      console.error('Debug diagnostics failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAIService = async () => {
    if (!aiService) {
      setDebugInfo(prev => prev ? { ...prev, lastTestError: 'AI Service not available' } : null);
      return;
    }

    setIsLoading(true);
    try {
      const testMessages = [{ role: 'user' as const, content: 'Hello, this is a test message. Please respond briefly.' }];
      const response = await aiService.generateReply(testMessages);
      
      setDebugInfo(prev => prev ? { 
        ...prev, 
        lastTestResult: response,
        lastTestError: undefined 
      } : null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(prev => prev ? { 
        ...prev, 
        lastTestResult: undefined,
        lastTestError: errorMessage 
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectAPI = async () => {
    setIsLoading(true);
    try {
      const apiClient = getApiClient();
      const authToken = apiClient?.getAuthToken();
      
      if (!authToken) {
        setDebugInfo(prev => prev ? { 
          ...prev, 
          lastTestError: 'No auth token available for direct API test' 
        } : null);
        return;
      }

      const response = await fetch('https://z4hhgkzhq7.execute-api.us-west-2.amazonaws.com/dev/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, this is a direct API test.' }],
          modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          temperature: 0.3,
          maxTokens: 800
        })
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        setDebugInfo(prev => prev ? { 
          ...prev, 
          lastTestResult: `Direct API Success: ${data.data?.reply || 'No reply in response'}`,
          lastTestError: undefined 
        } : null);
      } else {
        setDebugInfo(prev => prev ? { 
          ...prev, 
          lastTestResult: undefined,
          lastTestError: `Direct API Error (${response.status}): ${responseText}` 
        } : null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(prev => prev ? { 
        ...prev, 
        lastTestResult: undefined,
        lastTestError: `Direct API Exception: ${errorMessage}` 
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Service Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            Run Diagnostics
          </Button>
          <Button onClick={testAIService} disabled={isLoading || !debugInfo?.aiServiceAvailable}>
            Test AI Service
          </Button>
          <Button onClick={testDirectAPI} disabled={isLoading || !debugInfo?.hasAuthToken}>
            Test Direct API
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {debugInfo.hasApiClient ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>API Client</span>
                <Badge variant={debugInfo.hasApiClient ? 'default' : 'destructive'}>
                  {debugInfo.hasApiClient ? 'Available' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {debugInfo.hasAuthToken ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Auth Token</span>
                <Badge variant={debugInfo.hasAuthToken ? 'default' : 'destructive'}>
                  {debugInfo.hasAuthToken ? 'Present' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {debugInfo.aiServiceAvailable ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>AI Service</span>
                <Badge variant={debugInfo.aiServiceAvailable ? 'default' : 'destructive'}>
                  {debugInfo.aiServiceAvailable ? 'Available' : 'Missing'}
                </Badge>
              </div>
            </div>

            {debugInfo.tokenPreview && (
              <div className="text-sm text-gray-600">
                <strong>Token Preview:</strong> {debugInfo.tokenPreview}
              </div>
            )}

            {debugInfo.lastTestResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <strong className="text-green-800">Last Test Result:</strong>
                <div className="text-sm text-green-700 mt-1">{debugInfo.lastTestResult}</div>
              </div>
            )}

            {debugInfo.lastTestError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <strong className="text-red-800">Last Test Error:</strong>
                <div className="text-sm text-red-700 mt-1">{debugInfo.lastTestError}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}