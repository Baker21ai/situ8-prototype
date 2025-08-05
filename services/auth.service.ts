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
import cognitoOperations, { getCognitoInitStatus } from './cognito-client';

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
  private isDemoMode = false; // Use real AWS Cognito authentication
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

    // Check Cognito initialization status
    const cognitoStatus = getCognitoInitStatus();
    if (!cognitoStatus.isInitialized) {
      console.warn('⚠️  AuthService: Cognito not initialized, enabling demo mode as fallback');
      console.warn('⚠️  Error:', cognitoStatus.error?.message);
      this.isDemoMode = true; // Enable demo mode as fallback
    }

    console.log('🔐 AuthService: Initializing with config:', {
      isDemoMode: this.isDemoMode,
      cognitoInitialized: cognitoStatus.isInitialized,
      userPoolId: this.cognitoConfig.userPoolId,
      clientId: this.cognitoConfig.userPoolWebClientId
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

      // Authenticate with AWS Cognito
      console.log('🔑 Attempting Cognito sign in for:', request.email);
      let signInResult;
      
      try {
        signInResult = await cognitoOperations.signIn(request.email, request.password);
        console.log('🔑 Sign in result:', signInResult);
      } catch (cognitoError: any) {
        console.error('❌ Cognito sign in error:', cognitoError);
        
        // If Cognito fails, check if we should fallback to demo mode
        if (cognitoError.name === 'AuthUserPoolException') {
          console.warn('⚠️  Falling back to demo mode due to Cognito error');
          this.isDemoMode = true;
          return this.loginDemoUser(request.email);
        }
        
        throw cognitoError;
      }
      
      // Handle different authentication states
      if (signInResult.isSignedIn) {
        // Get user attributes from Cognito
        const userAttributes = await cognitoOperations.getUserAttributes();
        const session = await cognitoOperations.getSession();
        
        // Parse Cognito attributes to our user format
        const authenticatedUser = await this.parseAndCreateUser(userAttributes);
        const tokens = await this.extractTokensFromSession(session);
        const sessionInfo = this.createSessionInfo();
        
        this.currentUser = authenticatedUser;
        this.tokens = tokens;
        this.sessionInfo = sessionInfo;
        
        // Store in localStorage for persistence
        if (request.rememberMe) {
          this.persistSession();
        }
        
        // Create audit context
        const auditContext = this.createAuditContext(authenticatedUser, 'LOGIN');
        
        // Log successful login
        await this.logAuditEvent('USER_LOGIN', auditContext, {
          email: request.email,
          rememberMe: request.rememberMe
        });
        
        return {
          success: true,
          data: {
            user: authenticatedUser,
            tokens,
            sessionInfo
          },
          message: 'Login successful'
        };
      } else if (signInResult.nextStep?.signInStep === 'NEW_PASSWORD_REQUIRED') {
        // User needs to change password
        return {
          success: false,
          error: {
            code: 'NEW_PASSWORD_REQUIRED',
            message: 'Password change required',
            details: { challengeName: 'NEW_PASSWORD_REQUIRED' }
          }
        };
      } else {
        // Other authentication challenges
        return {
          success: false,
          error: {
            code: 'AUTH_CHALLENGE',
            message: 'Additional authentication required',
            details: signInResult.nextStep
          }
        };
      }

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

    // IMPORTANT: Persist the session so the user stays logged in
    this.persistSession();
    console.log('💾 AuthService: Demo session persisted');

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

      // Sign out from Cognito if not in demo mode
      if (!this.isDemoMode) {
        await cognitoOperations.signOut();
      }
      
      // Clear local session
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

      // Get fresh session from Cognito if not in demo mode
      if (!this.isDemoMode) {
        const session = await cognitoOperations.getSession();
        
        if (!session || !session.tokens) {
          return this.createErrorResponse('No valid session found', 'SESSION_EXPIRED');
        }
        
        const newTokens = await this.extractTokensFromSession(session);
        this.tokens = newTokens;
        this.persistSession();

        return {
          success: true,
          data: newTokens,
          message: 'Tokens refreshed successfully'
        };
      } else {
        // Demo mode - use mock tokens
        const newTokens = this.createMockTokens();
        this.tokens = newTokens;
        this.persistSession();

        return {
          success: true,
          data: newTokens,
          message: 'Tokens refreshed successfully'
        };
      }

    } catch (error) {
      return this.createErrorResponse(error, 'TOKEN_REFRESH_ERROR');
    }
  }

  /**
   * Change user password
   */
  async changePassword(request: ChangePasswordRequest): ServiceMethod<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new AuthorizationException('User not authenticated');
      }

      // Validate passwords
      if (request.newPassword.length < 8) {
        return this.createErrorResponse('Password must be at least 8 characters', 'WEAK_PASSWORD');
      }

      if (!this.isDemoMode) {
        // Change password in Cognito
        await cognitoOperations.updatePassword(request.currentPassword, request.newPassword);
      }
      
      const auditContext = this.createAuditContext(this.currentUser!, 'PASSWORD_CHANGE');
      await this.logAuditEvent('PASSWORD_CHANGED', auditContext, {});

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return this.createErrorResponse(error, 'PASSWORD_CHANGE_ERROR');
    }
  }

  /**
   * Reset password request
   */
  async resetPassword(request: ResetPasswordRequest): ServiceMethod<void> {
    try {
      // Validate email
      const validation = this.validateEntity({ email: request.email });
      if (!validation.isValid) {
        return this.createErrorResponse('Invalid email', 'VALIDATION_ERROR');
      }

      if (!this.isDemoMode) {
        // Initiate password reset with Cognito
        await cognitoOperations.resetPassword(request.email);
      }
      
      await this.logAuditEvent('PASSWORD_RESET_REQUESTED', undefined, {
        email: request.email
      });

      return {
        success: true,
        message: this.isDemoMode ? 'Demo mode: Password reset simulated' : 'Password reset code sent to your email'
      };
    } catch (error) {
      return this.createErrorResponse(error, 'PASSWORD_RESET_ERROR');
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmResetPassword(request: ConfirmResetPasswordRequest): ServiceMethod<void> {
    try {
      // Validate inputs
      if (!request.confirmationCode || request.confirmationCode.length < 6) {
        return this.createErrorResponse('Invalid confirmation code', 'INVALID_CODE');
      }

      if (request.newPassword.length < 8) {
        return this.createErrorResponse('Password must be at least 8 characters', 'WEAK_PASSWORD');
      }

      if (!this.isDemoMode) {
        // Confirm password reset with Cognito
        await cognitoOperations.confirmResetPassword(
          request.email,
          request.confirmationCode,
          request.newPassword
        );
      }

      await this.logAuditEvent('PASSWORD_RESET_CONFIRMED', undefined, {
        email: request.email
      });

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      return this.createErrorResponse(error, 'PASSWORD_RESET_CONFIRM_ERROR');
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
   * Toggle between demo mode and AWS mode
   */
  setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
    console.log(`🔄 Auth mode changed to: ${enabled ? 'Demo' : 'AWS'}`);
    
    // If disabling demo mode, check if Cognito is initialized
    if (!enabled) {
      const cognitoStatus = getCognitoInitStatus();
      if (!cognitoStatus.isInitialized) {
        console.warn('⚠️  Cannot disable demo mode - Cognito not initialized');
        this.isDemoMode = true;
      }
    }
  }

  /**
   * Get current auth mode status
   */
  getAuthStatus(): { isDemoMode: boolean; cognitoInitialized: boolean; error?: string } {
    const cognitoStatus = getCognitoInitStatus();
    return {
      isDemoMode: this.isDemoMode,
      cognitoInitialized: cognitoStatus.isInitialized,
      error: cognitoStatus.error?.message
    };
  }

  /**
   * Switch to demo user
   */
  async switchDemoUser(userId: string): ServiceMethod<LoginResponse> {
    console.log(`🔐 AuthService: switchDemoUser called with userId: ${userId}`);
    
    if (!this.isDemoMode) {
      console.error('❌ AuthService: Demo mode not enabled');
      return this.createErrorResponse('Demo mode not enabled', 'DEMO_MODE_DISABLED');
    }

    console.log('🔍 AuthService: Looking for demo user...');
    const demoUser = this.getDemoUserById(userId);
    console.log('🔍 AuthService: Demo user found:', demoUser);
    
    if (!demoUser) {
      console.error(`❌ AuthService: Demo user not found for ID: ${userId}`);
      console.log('📋 Available demo users:', this.getDemoUsers().map(u => u.id));
      return this.createErrorResponse('Demo user not found', 'DEMO_USER_NOT_FOUND');
    }

    console.log('✅ AuthService: Logging in demo user:', demoUser.email);
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

  private async logAuditEvent(eventType: string, context: AuditContext | undefined, data: any): Promise<void> {
    // This would integrate with the audit service
    console.log('Auth Audit Event:', { eventType, context, data });
  }

  /**
   * Parse Cognito user attributes and create authenticated user
   */
  private async parseAndCreateUser(attributes: any): Promise<AuthenticatedUser> {
    // Map Cognito attributes to our user format
    const cognitoAttrs: CognitoUserAttributes = {
      sub: attributes.sub || '',
      email: attributes.email || '',
      email_verified: attributes.email_verified || 'false',
      'custom:role': attributes['custom:role'] || UserRole.VIEWER,
      'custom:department': attributes['custom:department'] || Department.OPERATIONS,
      'custom:clearanceLevel': attributes['custom:clearanceLevel'] || '1',
      'custom:badgeNumber': attributes['custom:badgeNumber'],
      'custom:facilityCodes': attributes['custom:facilityCodes']
    };
    
    const parsed = parseUserAttributes(cognitoAttrs);
    
    return {
      id: cognitoAttrs.sub,
      email: parsed.email,
      emailVerified: parsed.emailVerified,
      role: parsed.role,
      department: parsed.department,
      clearanceLevel: parsed.clearanceLevel,
      badgeNumber: parsed.badgeNumber,
      facilityCodes: parsed.facilityCodes,
      name: attributes.name || parsed.email.split('@')[0],
      avatar: this.generateAvatar(parsed.email),
      lastLogin: new Date(),
      status: 'active',
      permissions: rolePermissions[parsed.role],
      profile: {
        fullName: attributes.name || parsed.email.split('@')[0],
        avatar: this.generateAvatar(parsed.email)
      }
    };
  }
  
  /**
   * Extract tokens from Cognito session
   */
  private async extractTokensFromSession(session: any): Promise<AuthTokens> {
    const tokens = session.tokens;
    const expiresIn = 3600; // 1 hour default
    
    return {
      accessToken: tokens?.accessToken?.toString() || '',
      idToken: tokens?.idToken?.toString() || '',
      refreshToken: session.credentials?.refreshToken || '',
      expiresIn,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  }
  
  /**
   * Generate avatar URL based on email
   */
  private generateAvatar(email: string): string {
    const hash = email.split('@')[0].charCodeAt(0) % 5;
    const avatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
    ];
    return avatars[hash];
  }
}