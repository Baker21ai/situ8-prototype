/**
 * Login Form Component
 * Handles user authentication with email/password and demo mode support
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Loader2, Shield, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth, useDemoMode } from '../../stores/userStore';
import { LoginRequest } from '../../services/auth.service';
import { AuthStatusToggle } from './AuthStatusToggle';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showDemoMode?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/command-center',
  showDemoMode = true
}) => {
  // Auth state
  const { isLoading, error, login, isAuthenticated } = useAuth();
  const { 
    isDemoMode, 
    enableDemoMode, 
    disableDemoMode, 
    availableDemoUsers,
    switchDemoUser 
  } = useDemoMode();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Demo mode state
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  
  // Don't enable demo mode by default - use real AWS authentication
  // Users can manually toggle demo mode if needed

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && onSuccess) {
      onSuccess();
    }
  }, [isAuthenticated, onSuccess]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const loginRequest: LoginRequest = {
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    };

    const success = await login(loginRequest);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  // Handle demo user selection
  const handleDemoUserSelect = async (userId: string) => {
    console.log(`🎯 Demo user button clicked: ${userId}`);
    const success = await switchDemoUser(userId);
    console.log(`🔄 switchDemoUser result: ${success}`);
    if (success && onSuccess) {
      console.log('✅ Login successful, calling onSuccess callback');
      onSuccess();
    } else if (!success) {
      console.error('❌ Demo login failed');
    }
  };

  // Handle demo mode toggle
  const handleDemoModeToggle = (enabled: boolean) => {
    if (enabled) {
      enableDemoMode();
      setShowDemoUsers(true);
      // Clear form errors when switching to demo mode
      setValidationErrors({});
    } else {
      disableDemoMode();
      setShowDemoUsers(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Situ8 Security Platform</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in to access your security dashboard
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Demo Mode Toggle */}
          {showDemoMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Demo Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable for presentations and testing
                  </p>
                </div>
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={handleDemoModeToggle}
                  disabled={isLoading}
                />
              </div>
              
              {isDemoMode && (
                <Alert>
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    Demo mode enabled. Select a user below or use any email with demo mode.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Quick Role Login Buttons - Always Visible */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Access</Label>
            <div className="grid gap-2">
              <Button
                variant="default"
                className="justify-start h-auto p-4 bg-red-600 hover:bg-red-700"
                onClick={() => handleDemoUserSelect('demo-admin-001')}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3 text-left w-full">
                  <span className="text-xl">👑</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Admin Access</p>
                    <p className="text-xs text-red-100">Full system control</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-red-300 text-red-100">
                    L5
                  </Badge>
                </div>
              </Button>
              
              <Button
                variant="default"
                className="justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleDemoUserSelect('demo-guard-001')}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3 text-left w-full">
                  <span className="text-xl">👮‍♂️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Security Officer Access</p>
                    <p className="text-xs text-blue-100">Field operations</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-100">
                    L2
                  </Badge>
                </div>
              </Button>
              
              <Button
                variant="default"
                className="justify-start h-auto p-4 bg-green-600 hover:bg-green-700"
                onClick={() => handleDemoUserSelect('demo-dev-001')}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3 text-left w-full">
                  <span className="text-xl">🛡️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Developer Access</p>
                    <p className="text-xs text-green-100">Technical operations</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-green-300 text-green-100">
                    L3
                  </Badge>
                </div>
              </Button>
            </div>
          </div>

          {/* Demo User Selection */}
          {isDemoMode && showDemoUsers && (
            <div className="space-y-3">
              <Separator className="my-4" />
              <Label className="text-sm font-medium">All Demo Users</Label>
              <div className="grid gap-2">
                {availableDemoUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="justify-start h-auto p-3"
                    onClick={() => handleDemoUserSelect(user.id)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <span className="text-lg">{user.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            L{user.clearanceLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground text-center">
                Or sign in with any email below</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{validationErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{validationErrors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Switch
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange('rememberMe', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm">
                Remember me
              </Label>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Forgot Password */}
          <div className="text-center">
            <Button variant="link" className="text-sm text-muted-foreground">
              Forgot your password?
            </Button>
          </div>

          {/* Demo Mode Info */}
          {isDemoMode && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                🎭 Demo mode is active. Any email will work for testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};