/**
 * User Profile Component
 * Displays user information, permissions, and profile management
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Shield, 
  User, 
  Settings, 
  LogOut, 
  Edit,
  Key,
  MapPin,
  Calendar,
  Clock,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth, useCurrentUser, usePermissions, useDemoMode } from '../../stores/userStore';
import { UserRole, ClearanceLevel } from '../../config/cognito';
import { format } from 'date-fns';

interface UserProfileProps {
  onClose?: () => void;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  compact?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onClose,
  onEditProfile,
  onChangePassword,
  compact = false
}) => {
  const { logout, isLoading } = useAuth();
  const user = useCurrentUser();
  const { hasPermission, hasClearanceLevel, getUserPermissions } = usePermissions();
  const { isDemoMode, currentDemoUser } = useDemoMode();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No user information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      if (onClose) onClose();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
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

  const getUserInitials = () => {
    if (user.profile.fullName) {
      return user.profile.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Permission categories for display
  const permissionCategories = [
    { key: 'activities', label: 'Activities', icon: Shield },
    { key: 'cases', label: 'Cases', icon: AlertTriangle },
    { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { key: 'users', label: 'User Management', icon: User },
    { key: 'audit', label: 'Audit Trail', icon: Clock },
  ];

  if (compact) {
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-600 text-white">
                {currentDemoUser?.avatar || getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {user.profile.fullName || user.email}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getRoleColor(user.role)}>
                  {formatRoleName(user.role)}
                </Badge>
                <Badge variant="outline" className={getClearanceColor(user.clearanceLevel)}>
                  L{user.clearanceLevel}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isDemoMode && (
            <Alert className="mb-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                🎭 Demo Mode Active
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onEditProfile}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {currentDemoUser?.avatar || getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user.profile.fullName || user.email}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleColor(user.role)}>
                    {formatRoleName(user.role)}
                  </Badge>
                  <Badge variant="outline" className={getClearanceColor(user.clearanceLevel)}>
                    Clearance Level {user.clearanceLevel}
                  </Badge>
                  {user.badgeNumber && (
                    <Badge variant="outline">
                      Badge: {user.badgeNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {onEditProfile && (
                <Button variant="outline" onClick={onEditProfile}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            🎭 <strong>Demo Mode Active:</strong> You are signed in as a demonstration user. 
            {currentDemoUser && ` Current demo user: ${currentDemoUser.name}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Access Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Department</Label>
              <p className="text-sm text-muted-foreground capitalize">
                {user.department}
              </p>
            </div>
            
            {user.facilityCodes && user.facilityCodes.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Facility Access</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.facilityCodes.map((code) => (
                    <Badge key={code} variant="secondary" className="text-xs">
                      <MapPin className="mr-1 h-3 w-3" />
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Email Verified</Label>
              <div className="flex items-center space-x-2 mt-1">
                {user.emailVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {permissionCategories.map(({ key, label, icon: Icon }) => {
                const permissions = getUserPermissions(key);
                const hasAnyPermission = permissions.length > 0;
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {hasAnyPermission ? (
                        permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          No Access
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Password</Label>
                <p className="text-sm text-muted-foreground">
                  {isDemoMode ? 'Demo mode - no password required' : 'Last changed: Never'}
                </p>
              </div>
              {!isDemoMode && onChangePassword && (
                <Button variant="outline" onClick={onChangePassword}>
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              )}
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium">Session Security</Label>
                <div className="space-y-1 mt-1 text-muted-foreground">
                  <p>Two-factor authentication: Disabled</p>
                  <p>Session timeout: 12 hours</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Status</Label>
                <div className="space-y-1 mt-1 text-muted-foreground">
                  <p>Status: Active</p>
                  <p>Login attempts: 0 failed</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility component for labels
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);