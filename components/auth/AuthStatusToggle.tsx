/**
 * Auth Status Toggle Component
 * Shows current auth mode and allows toggling between AWS and Demo mode
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { useAuth, useDemoMode } from '../../stores/userStore';
import { useServices } from '../../services/ServiceProvider';

export const AuthStatusToggle: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isDemoMode, enableDemoMode, disableDemoMode } = useDemoMode();
  const { authService } = useServices();
  
  // Get auth status
  const authStatus = authService?.getAuthStatus?.() || {
    isDemoMode: true,
    cognitoInitialized: false,
    error: 'Auth service not available'
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      enableDemoMode();
    } else {
      // Try to disable demo mode (will fail if Cognito not initialized)
      disableDemoMode();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {authStatus.cognitoInitialized ? (
            <Cloud className="h-5 w-5 text-green-500" />
          ) : (
            <CloudOff className="h-5 w-5 text-yellow-500" />
          )}
          Authentication Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AWS Connection Status */}
        <Alert variant={authStatus.cognitoInitialized ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>AWS Cognito Status</AlertTitle>
          <AlertDescription>
            {authStatus.cognitoInitialized ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Connected to AWS Cognito
              </span>
            ) : (
              <>
                <p>Not connected to AWS Cognito</p>
                {authStatus.error && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    Error: {authStatus.error}
                  </p>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="demo-mode">Demo Mode</Label>
            <p className="text-sm text-muted-foreground">
              {isDemoMode ? 'Using local demo users' : 'Using AWS authentication'}
            </p>
          </div>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={handleToggle}
            disabled={!authStatus.cognitoInitialized && !isDemoMode}
          />
        </div>

        {/* Info based on current mode */}
        {isDemoMode ? (
          <Alert>
            <AlertDescription>
              <p className="font-medium">Demo Mode Active</p>
              <p className="text-sm mt-1">
                You can use the demo user buttons to quickly switch between test accounts.
                Data is stored locally and will not persist.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default" className="border-green-200 dark:border-green-800">
            <AlertDescription>
              <p className="font-medium">AWS Mode Active</p>
              <p className="text-sm mt-1">
                Connected to AWS Cognito. Use your real credentials to log in.
                All data is persisted in AWS DynamoDB.
              </p>
              <p className="text-sm mt-2">
                Available users: yamen@example.com, river@example.com, 
                celine@example.com, phil@example.com
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Retry button if AWS failed */}
        {!authStatus.cognitoInitialized && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Retry AWS Connection
          </Button>
        )}
      </CardContent>
    </Card>
  );
};