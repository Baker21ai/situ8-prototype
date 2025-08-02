/**
 * Authentication Service
 * Handles AWS Cognito authentication, user management, and role-based access control
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  ValidationResult,
  BusinessRuleResult,
  AuditContext,
  ServiceMethod,
  ServiceException,
  AuthorizationException
} from './types';
import {
  getCognitoConfig,
  UserRole,
  Department,
  ClearanceLevel,
  CognitoUserAttributes,
  ParsedUserAttributes,
  parseUserAttributes,
  hasPermission,
  hasClearanceLevel,
  rolePermissions,
  clearanceLevelRequirements
} from '../config/cognito';

// Auth-specific types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  sessionInfo: SessionInfo;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  department: Department;
  clearanceLevel: ClearanceLevel;
  badgeNumber?: string;
  facilityCodes?: string[];
  profile: UserProfile;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SessionInfo {
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

// Demo user type for presentation mode
export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  clearanceLevel: ClearanceLevel;
  badgeNumber: string;
  facilityCodes: string[];
  avatar: string;
  status: 'on-duty' | 'off-duty' | 'break' | 'available';
  isDemoUser: true;
}

export class AuthService extends BaseService<AuthenticatedUser> {
  private cognitoConfig = getCognitoConfig();
  private currentUser: AuthenticatedUser | null = null;
  private tokens: AuthTokens | null = null;
  private sessionInfo: SessionInfo | null = null;
  private isDemoMode = false;
  private currentDemoUser: DemoUser | null = null;

  constructor() {
    super('AuthService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      maxRetries: 3,
      timeoutMs: 10000,
      cacheEnabled: false // Auth tokens should not be cached
    });

    // Initialize from stored session if available
    this.initializeFromStorage();
  }

  protected validateEntity(entity: Partial<AuthenticatedUser>): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!entity.email) {
      errors.push({
        field: 'email',
        code: 'REQUIRED',
        message: 'Email is required'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entity.email)) {
      errors.push({
        field: 'email',
        code: 'INVALID_FORMAT',
        message: 'Invalid email format'
      });
    }

    if (entity.role && !Object.values(UserRole).includes(entity.role)) {
      errors.push({
        field: 'role',
        code: 'INVALID_VALUE',
        message: 'Invalid user role'
      });
    }

    if (entity.clearanceLevel && (entity.clearanceLevel < 1 || entity.clearanceLevel > 5)) {
      errors.push({
        field: 'clearanceLevel',
        code: 'INVALID_RANGE',
        message: 'Clearance level must be between 1 and 5'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  protected enforceBusinessRules(entity: Partial<AuthenticatedUser>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Rule: Admin role requires highest clearance level
    if (entity.role === UserRole.ADMIN && entity.clearanceLevel && entity.clearanceLevel < 5) {
      results.push({
        ruleName: 'admin_clearance_requirement',
        passed: false,
        message: 'Admin role requires clearance level 5',
        metadata: { requiredLevel: 5, currentLevel: entity.clearanceLevel }
      });
    }

    // Rule: Security officers must have at least level 2 clearance
    if (entity.role === UserRole.SECURITY_OFFICER && entity.clearanceLevel && entity.clearanceLevel < 2) {
      results.push({
        ruleName: 'security_officer_minimum_clearance',
        passed: false,
        message: 'Security officers require minimum clearance level 2',
        metadata: { requiredLevel: 2, currentLevel: entity.clearanceLevel }
      });
    }

    return results;
  }

  protected getEntityName(): string {
    return 'User';
  }

  // Authentication Methods

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): ServiceMethod<LoginResponse> {
    try {
      // In demo mode, handle demo login
      if (this.isDemoMode) {
        return this.loginDemoUser(request.email);
      }

      // Validate request
      const validation = this.validateLoginRequest(request);
      if (!validation.isValid) {
        return this.createErrorResponse('Invalid login request', 'VALIDATION_ERROR');
      }

      // TODO: Implement actual Cognito authentication
      // For now, simulate successful login for development
      const mockUser = this.createMockUser(request.email);
      const tokens = this.createMockTokens();
      const sessionInfo = this.createSessionInfo();

      this.currentUser = mockUser;
      this.tokens = tokens;
      this.sessionInfo = sessionInfo;

      // Store in localStorage for persistence
      this.persistSession();

      // Create audit context
      const auditContext = this.createAuditContext(mockUser, 'LOGIN');
      
      // Log successful login
      await this.logAuditEvent('USER_LOGIN', auditContext, {
        email: request.email,
        rememberMe: request.rememberMe
      });

      return {
        success: true,
        data: {
          user: mockUser,
          tokens,
          sessionInfo
        },
        message: 'Login successful'
      };

    } catch (error) {
      return this.createErrorResponse(error, 'LOGIN_ERROR');
    }
  }

  /**
   * Login demo user for presentations
   */
  private async loginDemoUser(email: string): ServiceMethod<LoginResponse> {
    const demoUser = this.getDemoUserByEmail(email);
    if (!demoUser) {
      return this.createErrorResponse('Demo user not found', 'DEMO_USER_NOT_FOUND');
    }

    this.currentDemoUser = demoUser;
    const authenticatedUser = this.convertDemoUserToAuthenticatedUser(demoUser);
    const tokens = this.createMockTokens();
    const sessionInfo = this.createSessionInfo();

    this.currentUser = authenticatedUser;
    this.tokens = tokens;
    this.sessionInfo = sessionInfo;

    return {
      success: true,
      data: {
        user: authenticatedUser,
        tokens,
        sessionInfo
      },
      message: 'Demo login successful'
    };
  }

  /**
   * Logout current user
   */
  async logout(): ServiceMethod<boolean> {
    try {
      if (!this.currentUser) {
        return this.createErrorResponse('No user logged in', 'NO_ACTIVE_SESSION');
      }

      const auditContext = this.createAuditContext(this.currentUser, 'LOGOUT');
      
      // Log logout
      await this.logAuditEvent('USER_LOGOUT', auditContext, {
        sessionDuration: this.sessionInfo ? Date.now() - this.sessionInfo.loginTime.getTime() : 0
      });

      // Clear session
      this.clearSession();

      return {
        success: true,
        data: true,
        message: 'Logout successful'
      };

    } catch (error) {
      return this.createErrorResponse(error, 'LOGOUT_ERROR');
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(request: RefreshTokenRequest): ServiceMethod<AuthTokens> {
    try {
      if (!this.tokens || this.tokens.refreshToken !== request.refreshToken) {
        return this.createErrorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // TODO: Implement actual token refresh with Cognito
      const newTokens = this.createMockTokens();
      this.tokens = newTokens;
      this.persistSession();

      return {
        success: true,
        data: newTokens,
        message: 'Tokens refreshed successfully'
      };

    } catch (error) {
      return this.createErrorResponse(error, 'TOKEN_REFRESH_ERROR');
    }
  }

  // User Management Methods

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  /**
   * Get current session info
   */
  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.tokens !== null && !this.isTokenExpired();
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    return this.isAuthenticated() && this.sessionInfo !== null;
  }

  // Permission & Authorization Methods

  /**
   * Check if current user has specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser) return false;
    return hasPermission(this.currentUser.role, resource as any, action);
  }

  /**
   * Check if current user has required clearance level
   */
  hasClearanceLevel(requiredLevel: ClearanceLevel): boolean {
    if (!this.currentUser) return false;
    return hasClearanceLevel(this.currentUser.clearanceLevel, requiredLevel);
  }

  /**
   * Get user permissions for resource
   */
  getUserPermissions(resource: string): string[] {
    if (!this.currentUser) return [];
    const permissions = rolePermissions[this.currentUser.role];
    return permissions ? permissions[resource as keyof typeof permissions] || [] : [];
  }

  /**
   * Require authentication (throws if not authenticated)
   */
  requireAuth(): void {
    if (!this.isAuthenticated()) {
      throw new ServiceException('AUTHENTICATION_REQUIRED', 'User must be authenticated');
    }
  }

  /**
   * Require specific role (throws if insufficient)
   */
  requireRole(requiredRole: UserRole): void {
    this.requireAuth();
    if (this.currentUser!.role !== requiredRole && this.currentUser!.role !== UserRole.ADMIN) {
      throw new AuthorizationException(requiredRole, this.currentUser!.role);
    }
  }

  /**
   * Require minimum clearance level (throws if insufficient)
   */
  requireClearanceLevel(requiredLevel: ClearanceLevel): void {
    this.requireAuth();
    if (!this.hasClearanceLevel(requiredLevel)) {
      throw new ServiceException(
        'INSUFFICIENT_CLEARANCE',
        `Required clearance level ${requiredLevel}, user has level ${this.currentUser!.clearanceLevel}`
      );
    }
  }

  // Demo Mode Methods

  /**
   * Enable demo mode for presentations
   */
  enableDemoMode(): void {
    this.isDemoMode = true;
  }

  /**
   * Disable demo mode
   */
  disableDemoMode(): void {
    this.isDemoMode = false;
    this.currentDemoUser = null;
  }

  /**
   * Check if in demo mode
   */
  isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  /**
   * Switch to demo user
   */
  async switchDemoUser(userId: string): ServiceMethod<LoginResponse> {
    if (!this.isDemoMode) {
      return this.createErrorResponse('Demo mode not enabled', 'DEMO_MODE_DISABLED');
    }

    const demoUser = this.getDemoUserById(userId);
    if (!demoUser) {
      return this.createErrorResponse('Demo user not found', 'DEMO_USER_NOT_FOUND');
    }

    return this.loginDemoUser(demoUser.email);
  }

  /**
   * Get available demo users
   */
  getDemoUsers(): DemoUser[] {
    return [
      {
        id: 'demo-guard-001',
        email: 'mike.johnson@demo.situ8.com',
        name: 'Mike Johnson',
        role: UserRole.SECURITY_OFFICER,
        department: Department.SECURITY,
        clearanceLevel: ClearanceLevel.LEVEL_2,
        badgeNumber: 'SEC-001',
        facilityCodes: ['MAIN', 'WAREHOUSE'],
        avatar: '👮‍♂️',
        status: 'on-duty',
        isDemoUser: true
      },
      {
        id: 'demo-admin-001',
        email: 'lisa.thompson@demo.situ8.com',
        name: 'Lisa Thompson',
        role: UserRole.ADMIN,
        department: Department.MANAGEMENT,
        clearanceLevel: ClearanceLevel.LEVEL_5,
        badgeNumber: 'ADM-001',
        facilityCodes: ['ALL'],
        avatar: '👩‍💼',
        status: 'available',
        isDemoUser: true
      },
      {
        id: 'demo-dev-001',
        email: 'yamen.k@demo.situ8.com',
        name: 'Yamen K',
        role: UserRole.DEVELOPER,
        department: Department.IT,
        clearanceLevel: ClearanceLevel.LEVEL_3,
        badgeNumber: 'DEV-001',
        facilityCodes: ['MAIN', 'LAB'],
        avatar: '👨‍💻',
        status: 'available',
        isDemoUser: true
      }
    ];
  }

  // Private Helper Methods

  private validateLoginRequest(request: LoginRequest): ValidationResult {
    const errors: any[] = [];
    
    if (!request.email) {
      errors.push({
        field: 'email',
        code: 'REQUIRED',
        message: 'Email is required'
      });
    }
    
    if (!request.password) {
      errors.push({
        field: 'password',
        code: 'REQUIRED',
        message: 'Password is required'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private createMockUser(email: string): AuthenticatedUser {
    // Create mock authenticated user (in real implementation, this would come from Cognito)
    return {
      id: 'user-' + Date.now(),
      email,
      emailVerified: true,
      role: UserRole.ADMIN,
      department: Department.MANAGEMENT,
      clearanceLevel: ClearanceLevel.LEVEL_5,
      badgeNumber: 'ADM-001',
      facilityCodes: ['ALL'],
      profile: {
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        avatar: '👤',
        preferredLanguage: 'en',
        timezone: 'UTC'
      }
    };
  }

  private createMockTokens(): AuthTokens {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    return {
      accessToken: 'mock-access-token-' + Date.now(),
      idToken: 'mock-id-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresAt
    };
  }

  private createSessionInfo(): SessionInfo {
    return {
      sessionId: 'session-' + Date.now(),
      loginTime: new Date(),
      lastActivity: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
      deviceInfo: {
        type: 'desktop',
        browser: 'Chrome',
        os: 'Unknown'
      }
    };
  }

  private createAuditContext(user: AuthenticatedUser, action: string): AuditContext {
    return {
      userId: user.id,
      userName: user.profile.fullName || user.email,
      userRole: user.role,
      action,
      sessionId: this.sessionInfo?.sessionId,
      ipAddress: this.sessionInfo?.ipAddress,
      userAgent: this.sessionInfo?.userAgent
    };
  }

  private isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return new Date() >= this.tokens.expiresAt;
  }

  private persistSession(): void {
    if (typeof window !== 'undefined') {
      const sessionData = {
        user: this.currentUser,
        tokens: this.tokens,
        sessionInfo: this.sessionInfo,
        isDemoMode: this.isDemoMode,
        currentDemoUser: this.currentDemoUser
      };
      localStorage.setItem('situ8_auth_session', JSON.stringify(sessionData));
    }
  }

  private initializeFromStorage(): void {
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('situ8_auth_session');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          this.currentUser = parsed.user;
          this.tokens = parsed.tokens ? {
            ...parsed.tokens,
            expiresAt: new Date(parsed.tokens.expiresAt)
          } : null;
          this.sessionInfo = parsed.sessionInfo ? {
            ...parsed.sessionInfo,
            loginTime: new Date(parsed.sessionInfo.loginTime),
            lastActivity: new Date(parsed.sessionInfo.lastActivity)
          } : null;
          this.isDemoMode = parsed.isDemoMode || false;
          this.currentDemoUser = parsed.currentDemoUser;

          // Check if session is still valid
          if (this.isTokenExpired()) {
            this.clearSession();
          }
        } catch (error) {
          // Invalid session data, clear it
          this.clearSession();
        }
      }
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    this.tokens = null;
    this.sessionInfo = null;
    this.currentDemoUser = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('situ8_auth_session');
    }
  }

  private getDemoUserByEmail(email: string): DemoUser | null {
    return this.getDemoUsers().find(user => user.email === email) || null;
  }

  private getDemoUserById(id: string): DemoUser | null {
    return this.getDemoUsers().find(user => user.id === id) || null;
  }

  private convertDemoUserToAuthenticatedUser(demoUser: DemoUser): AuthenticatedUser {
    return {
      id: demoUser.id,
      email: demoUser.email,
      emailVerified: true,
      role: demoUser.role,
      department: demoUser.department,
      clearanceLevel: demoUser.clearanceLevel,
      badgeNumber: demoUser.badgeNumber,
      facilityCodes: demoUser.facilityCodes,
      profile: {
        fullName: demoUser.name,
        avatar: demoUser.avatar
      }
    };
  }

  private async logAuditEvent(eventType: string, context: AuditContext, data: any): Promise<void> {
    // This would integrate with the audit service
    console.log('Auth Audit Event:', { eventType, context, data });
  }
}