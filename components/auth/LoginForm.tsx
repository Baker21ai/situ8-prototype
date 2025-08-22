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
import { AWSStatusIndicator } from '../AWSStatusIndicator';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showDemoMode?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/command-center',
  showDemoMode = false // DISABLED - AWS only
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
  
  // Password change state
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeEmail, setPasswordChangeEmail] = useState('');

  // Demo mode state
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  
  // AWS ONLY - Demo mode removed to prevent conflicts
  // Always use real AWS Cognito authentication

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
    
    // Check if password change is required
    if (!success && error?.includes('NEW_PASSWORD_REQUIRED')) {
      setPasswordChangeRequired(true);
      setPasswordChangeEmail(formData.email);
      return;
    }
    
    if (success && onSuccess) {
      onSuccess();
    }
  };
  
  // Handle password change submission
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate new passwords
    const errors: Record<string, string> = {};
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Call auth service to complete password change
    // For now, we'll need to add this to the auth service
    const loginRequest: LoginRequest = {
      email: passwordChangeEmail,
      password: formData.password,
      newPassword: newPassword,
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
    <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-slate-900">Sign In</CardTitle>
          
          {/* AWS Connection Status */}
          <div className="mt-4">
            <AWSStatusIndicator className="justify-center" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">


          {/* Password Change Form */}
          {passwordChangeRequired ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your password must be changed before you can continue.
                </AlertDescription>
              </Alert>
              
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setValidationErrors({});
                    }}
                    disabled={isLoading}
                    className={validationErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {validationErrors.newPassword && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.newPassword}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationErrors({});
                  }}
                  disabled={isLoading}
                  className={validationErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.confirmPassword}</span>
                  </p>
                )}
              </div>
              
              {/* Error Display */}
              {error && !error.includes('NEW_PASSWORD_REQUIRED') && (
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
                    Changing Password...
                  </>
                ) : (
                  <>Change Password and Sign In</>
                )}
              </Button>
              
              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPasswordChangeRequired(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setValidationErrors({});
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </form>
          ) : (
            /* Login Form */
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
          )}

          {/* Forgot Password */}
          <div className="text-center">
            <Button variant="link" className="text-sm text-muted-foreground">
              Forgot your password?
            </Button>
          </div>

        </CardContent>
      </Card>
  );
};