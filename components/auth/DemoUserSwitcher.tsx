/**
 * Demo User Switcher Component
 * Allows switching between demo users for presentations and testing
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Users, 
  UserCheck, 
  LogOut, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Crown,
  Shield,
  Code,
  User
} from 'lucide-react';
import { useAuth, useCurrentUser, useDemoMode } from '../../stores/userStore';
import { UserRole, ClearanceLevel } from '../../config/cognito';

interface DemoUserSwitcherProps {
  onUserSwitch?: (userId: string) => void;
  onDemoModeToggle?: (enabled: boolean) => void;
  showCompactView?: boolean;
  className?: string;
}

export const DemoUserSwitcher: React.FC<DemoUserSwitcherProps> = ({
  onUserSwitch,
  onDemoModeToggle,
  showCompactView = false,
  className = ''
}) => {
  const { logout, isLoading } = useAuth();
  const currentUser = useCurrentUser();
  const { 
    isDemoMode, 
    enableDemoMode, 
    disableDemoMode, 
    availableDemoUsers,
    currentDemoUser,
    switchDemoUser 
  } = useDemoMode();

  const [isSwitching, setIsSwitching] = useState(false);

  const handleDemoModeToggle = (enabled: boolean) => {
    if (enabled) {
      enableDemoMode();
    } else {
      disableDemoMode();
    }
    
    if (onDemoModeToggle) {
      onDemoModeToggle(enabled);
    }
  };

  const handleUserSwitch = async (userId: string) => {
    if (!isDemoMode) return;

    setIsSwitching(true);
    try {
      const success = await switchDemoUser(userId);
      if (success && onUserSwitch) {
        onUserSwitch(userId);
      }
    } catch (error) {
      console.error('Failed to switch demo user:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Crown className="h-4 w-4" />;
      case UserRole.SECURITY_OFFICER:
        return <Shield className="h-4 w-4" />;
      case UserRole.DEVELOPER:
        return <Code className="h-4 w-4" />;
      case UserRole.VIEWER:
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case UserRole.SECURITY_OFFICER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.DEVELOPER:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case UserRole.VIEWER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getClearanceColor = (level: ClearanceLevel) => {
    if (level >= 5) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (level >= 4) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (level >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (level >= 2) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatRoleName = (role: UserRole) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (showCompactView) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Demo Mode</Label>
          <Switch
            checked={isDemoMode}
            onCheckedChange={handleDemoModeToggle}
            disabled={isLoading || isSwitching}
          />
        </div>

        {/* Current User Display */}
        {isDemoMode && currentUser && (
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <span className="text-2xl">{currentDemoUser?.avatar || '👤'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentUser.profile.fullName || currentUser.email}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Badge className={`${getRoleColor(currentUser.role)} text-xs`}>
                  {formatRoleName(currentUser.role)}
                </Badge>
                <Badge variant="outline" className={`${getClearanceColor(currentUser.clearanceLevel)} text-xs`}>
                  L{currentUser.clearanceLevel}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* User Selector */}
        {isDemoMode && (
          <Select
            value={currentDemoUser?.id || ''}
            onValueChange={handleUserSwitch}
            disabled={isSwitching}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select demo user..." />
            </SelectTrigger>
            <SelectContent>
              {availableDemoUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <span>{user.avatar}</span>
                    <span>{user.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatRoleName(user.role)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Demo User Switcher</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Demo Mode</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Enable to switch between demonstration users
            </p>
          </div>
          <Switch
            checked={isDemoMode}
            onCheckedChange={handleDemoModeToggle}
            disabled={isLoading || isSwitching}
          />
        </div>

        {/* Demo Mode Active Alert */}
        {isDemoMode && (
          <Alert>
            <UserCheck className="h-4 w-4" />
            <AlertDescription>
              🎭 Demo mode is active. You can switch between different user roles for testing and presentations.
            </AlertDescription>
          </Alert>
        )}

        {/* Current User */}
        {isDemoMode && currentUser && (
          <div>
            <Label className="text-sm font-medium">Current User</Label>
            <div className="mt-2 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{currentDemoUser?.avatar || '👤'}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {currentUser.profile.fullName || currentUser.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(currentUser.role)}>
                      {getRoleIcon(currentUser.role)}
                      <span className="ml-1">{formatRoleName(currentUser.role)}</span>
                    </Badge>
                    <Badge variant="outline" className={getClearanceColor(currentUser.clearanceLevel)}>
                      Clearance L{currentUser.clearanceLevel}
                    </Badge>
                    {currentUser.badgeNumber && (
                      <Badge variant="secondary">
                        {currentUser.badgeNumber}
                      </Badge>
                    )}
                  </div>
                  {currentDemoUser && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Status: {currentDemoUser.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Demo Users */}
        {isDemoMode && (
          <div>
            <Label className="text-sm font-medium">Switch to User</Label>
            <div className="mt-2 space-y-2">
              {availableDemoUsers.map((user) => {
                const isCurrentUser = currentDemoUser?.id === user.id;
                
                return (
                  <Button
                    key={user.id}
                    variant={isCurrentUser ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4"
                    onClick={() => handleUserSwitch(user.id)}
                    disabled={isSwitching || isCurrentUser}
                  >
                    <div className="flex items-center space-x-4 text-left w-full">
                      <div className="text-2xl">{user.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.name}</span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`${getRoleColor(user.role)} text-xs`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1">{formatRoleName(user.role)}</span>
                          </Badge>
                          <Badge variant="outline" className={`${getClearanceColor(user.clearanceLevel)} text-xs`}>
                            L{user.clearanceLevel}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {user.badgeNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-muted-foreground">Access:</span>
                          {user.facilityCodes.slice(0, 3).map((code) => (
                            <Badge key={code} variant="outline" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                          {user.facilityCodes.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{user.facilityCodes.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      {isSwitching && isCurrentUser && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Exit Demo Mode */}
        {isDemoMode && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Exit Demo Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Return to normal authentication
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoModeToggle(false)}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Disable Demo
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  disabled={isLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Warning when demo mode is disabled */}
        {!isDemoMode && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Demo mode is disabled. Enable it to switch between demonstration users for testing and presentations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};