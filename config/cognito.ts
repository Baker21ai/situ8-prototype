/**
 * AWS Cognito Configuration
 * Centralized configuration for authentication across all environments
 */

/// <reference types="vite/client" />

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  identityPoolId?: string;
  domain?: string;
  redirectSignIn: string;
  redirectSignOut: string;
  responseType: 'code' | 'token';
  oauth: {
    scope: string[];
    redirectSignIn: string;
    redirectSignOut: string;
    responseType: 'code' | 'token';
  };
}

// Helper function to get environment variable with fallbacks
const getEnvVar = (viteKey: string, reactKey: string, fallback: string = ''): string => {
  return import.meta.env[viteKey] || 
         (typeof process !== 'undefined' ? process.env?.[reactKey] : '') || 
         fallback;
};

// Environment-specific Cognito configurations
const cognitoConfigs: Record<string, CognitoConfig> = {
  local: {
    region: getEnvVar('VITE_AWS_REGION', 'REACT_APP_AWS_REGION', 'us-west-2'),
    userPoolId: getEnvVar('VITE_COGNITO_USER_POOL_ID', 'REACT_APP_COGNITO_USER_POOL_ID', 'us-west-2_ECLKvbdSp'),
    userPoolWebClientId: getEnvVar('VITE_COGNITO_CLIENT_ID', 'REACT_APP_COGNITO_CLIENT_ID', '5ouh548bibh1rrp11neqcvvqf6'),
    identityPoolId: getEnvVar('VITE_COGNITO_IDENTITY_POOL_ID', 'REACT_APP_COGNITO_IDENTITY_POOL_ID', 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4'),
    domain: getEnvVar('VITE_COGNITO_DOMAIN', 'REACT_APP_COGNITO_DOMAIN', 'https://situ8-platform-auth-dev.auth.us-west-2.amazoncognito.com'),
    redirectSignIn: getEnvVar('VITE_COGNITO_REDIRECT_SIGN_IN', 'REACT_APP_COGNITO_REDIRECT_SIGN_IN', 'http://localhost:5173/auth/callback'),
    redirectSignOut: getEnvVar('VITE_COGNITO_REDIRECT_SIGN_OUT', 'REACT_APP_COGNITO_REDIRECT_SIGN_OUT', 'http://localhost:5173/auth/logout'),
    responseType: 'code',
    oauth: {
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'http://localhost:5173/auth/callback',
      redirectSignOut: 'http://localhost:5173/auth/logout',
      responseType: 'code'
    }
  },
  
  development: {
    region: getEnvVar('VITE_AWS_REGION', 'REACT_APP_AWS_REGION', 'us-west-2'),
    userPoolId: getEnvVar('VITE_COGNITO_USER_POOL_ID', 'REACT_APP_COGNITO_USER_POOL_ID', 'us-west-2_ECLKvbdSp'),
    userPoolWebClientId: getEnvVar('VITE_COGNITO_CLIENT_ID', 'REACT_APP_COGNITO_CLIENT_ID', '5ouh548bibh1rrp11neqcvvqf6'),
    identityPoolId: getEnvVar('VITE_COGNITO_IDENTITY_POOL_ID', 'REACT_APP_COGNITO_IDENTITY_POOL_ID', 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4'),
    domain: getEnvVar('VITE_COGNITO_DOMAIN', 'REACT_APP_COGNITO_DOMAIN', 'https://situ8-platform-auth-dev.auth.us-west-2.amazoncognito.com'),
    redirectSignIn: getEnvVar('VITE_COGNITO_REDIRECT_SIGN_IN', 'REACT_APP_COGNITO_REDIRECT_SIGN_IN', 'https://dev.situ8.com/auth/callback'),
    redirectSignOut: getEnvVar('VITE_COGNITO_REDIRECT_SIGN_OUT', 'REACT_APP_COGNITO_REDIRECT_SIGN_OUT', 'https://dev.situ8.com/auth/logout'),
    responseType: 'code',
    oauth: {
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'https://dev.situ8.com/auth/callback',
      redirectSignOut: 'https://dev.situ8.com/auth/logout',
      responseType: 'code'
    }
  },
  
  staging: {
    region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    redirectSignIn: 'https://staging.situ8.com/auth/callback',
    redirectSignOut: 'https://staging.situ8.com/auth/logout',
    responseType: 'code',
    oauth: {
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'https://staging.situ8.com/auth/callback',
      redirectSignOut: 'https://staging.situ8.com/auth/logout',
      responseType: 'code'
    }
  },
  
  production: {
    region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-west-2_ECLKvbdSp',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '5ouh548bibh1rrp11neqcvvqf6',
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || 'https://situ8-platform-auth-dev.auth.us-west-2.amazoncognito.com',
    redirectSignIn: 'https://situ8-prototype.vercel.app/auth/callback',
    redirectSignOut: 'https://situ8-prototype.vercel.app/auth/logout',
    responseType: 'code',
    oauth: {
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'https://situ8-prototype.vercel.app/auth/callback',
      redirectSignOut: 'https://situ8-prototype.vercel.app/auth/logout',
      responseType: 'code'
    }
  }
};

// Get current environment
const getCurrentEnvironment = (): string => {
  // First check explicit environment variable
  if (import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT;
  }
  // Then check Vite mode
  if (import.meta.env.MODE === 'production') {
    return 'production';
  }
  if (import.meta.env.MODE === 'development') {
    return 'development';
  }
  // Default to local for dev server
  return 'local';
};

// Get Cognito configuration for current environment
export const getCognitoConfig = (): CognitoConfig => {
  const environment = getCurrentEnvironment();
  console.log('🔧 getCognitoConfig: Current environment:', environment);
  
  const config = cognitoConfigs[environment];
  
  if (!config) {
    console.error('❌ No config found for environment:', environment);
    throw new Error(`No Cognito configuration found for environment: ${environment}`);
  }
  
  console.log('🔧 getCognitoConfig: Config found:', {
    userPoolId: config.userPoolId,
    clientId: config.userPoolWebClientId,
    hasIdentityPool: !!config.identityPoolId,
    hasDomain: !!config.domain
  });
  
  // Validate required fields
  if (!config.userPoolId || !config.userPoolWebClientId) {
    console.error('❌ Missing required fields:', { 
      userPoolId: config.userPoolId, 
      clientId: config.userPoolWebClientId 
    });
    throw new Error(
      `Missing required Cognito configuration for environment: ${environment}. ` +
      'Please check your environment variables.'
    );
  }
  
  return config;
};

// AWS Amplify configuration format
export const getAmplifyAuthConfig = () => {
  const config = getCognitoConfig();
  
  return {
    Auth: {
      region: config.region,
      userPoolId: config.userPoolId,
      userPoolWebClientId: config.userPoolWebClientId,
      identityPoolId: config.identityPoolId,
      authenticationFlowType: 'USER_PASSWORD_AUTH',
      
      // OAuth configuration
      oauth: {
        domain: config.domain,
        scope: config.oauth.scope,
        redirectSignIn: config.oauth.redirectSignIn,
        redirectSignOut: config.oauth.redirectSignOut,
        responseType: config.oauth.responseType
      },
      
      // Cookie storage configuration
      cookieStorage: {
        domain: getCurrentEnvironment() === 'production' ? '.situ8.com' : 'localhost',
        path: '/',
        expires: 365,
        secure: getCurrentEnvironment() === 'production',
        sameSite: 'strict'
      },
      
      // Advanced settings
      clientMetadata: {
        application: 'situ8-security-platform',
        environment: getCurrentEnvironment()
      }
    }
  };
};

// User role definitions for the security platform
export enum UserRole {
  ADMIN = 'admin',
  SECURITY_OFFICER = 'security-officer', 
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export enum Department {
  SECURITY = 'security',
  MANAGEMENT = 'management',
  OPERATIONS = 'operations',
  IT = 'it'
}

export enum ClearanceLevel {
  LEVEL_1 = 1,  // Basic access
  LEVEL_2 = 2,  // Standard operations
  LEVEL_3 = 3,  // Sensitive operations
  LEVEL_4 = 4,  // High security
  LEVEL_5 = 5   // Maximum security
}

// User attribute interfaces
export interface CognitoUserAttributes {
  sub: string;                      // Unique user ID
  email: string;                    // Primary email
  email_verified: string;           // Email verification status
  'custom:role': UserRole;          // Security platform role
  'custom:department': Department;  // User department
  'custom:clearanceLevel': string;  // Security clearance (stored as string)
  'custom:badgeNumber'?: string;    // Physical badge ID
  'custom:facilityCodes'?: string;  // Comma-separated facility access codes
}

export interface ParsedUserAttributes {
  sub: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  department: Department;
  clearanceLevel: ClearanceLevel;
  badgeNumber?: string;
  facilityCodes?: string[];
}

// Helper function to parse Cognito attributes
export const parseUserAttributes = (attributes: CognitoUserAttributes): ParsedUserAttributes => {
  return {
    sub: attributes.sub,
    email: attributes.email,
    emailVerified: attributes.email_verified === 'true',
    role: attributes['custom:role'],
    department: attributes['custom:department'],
    clearanceLevel: parseInt(attributes['custom:clearanceLevel'], 10) as ClearanceLevel,
    badgeNumber: attributes['custom:badgeNumber'],
    facilityCodes: attributes['custom:facilityCodes']?.split(',').map(code => code.trim())
  };
};

// Role-based permissions
export const rolePermissions: Record<UserRole, {
  activities: string[];
  cases: string[];
  incidents: string[];
  bol: string[];
  users: string[];
  audit: string[];
}> = {
  [UserRole.ADMIN]: {
    activities: ['create', 'read', 'update', 'delete', 'assign'],
    cases: ['create', 'read', 'update', 'delete', 'assign'],
    incidents: ['create', 'read', 'update', 'delete', 'escalate'],
    bol: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete', 'manage-roles'],
    audit: ['read', 'export']
  },
  
  [UserRole.SECURITY_OFFICER]: {
    activities: ['create', 'read', 'update', 'assign'],
    cases: ['create', 'read', 'update', 'assign'],
    incidents: ['create', 'read', 'update', 'escalate'],
    bol: ['read'],
    users: ['read'],
    audit: ['read']
  },
  
  [UserRole.DEVELOPER]: {
    activities: ['create', 'read', 'update'],
    cases: ['read'],
    incidents: ['read'],
    bol: ['create', 'read', 'update'],
    users: ['read'],
    audit: ['read']
  },
  
  [UserRole.VIEWER]: {
    activities: ['read'],
    cases: ['read'],
    incidents: ['read'],
    bol: ['read'],
    users: [],
    audit: []
  }
};

// Check if user has permission for specific action
export const hasPermission = (
  userRole: UserRole,
  resource: keyof typeof rolePermissions[UserRole.ADMIN],
  action: string
): boolean => {
  const permissions = rolePermissions[userRole];
  return permissions && permissions[resource]?.includes(action) || false;
};

// Clearance level requirements for different operations
export const clearanceLevelRequirements = {
  viewBasicActivities: ClearanceLevel.LEVEL_1,
  createActivities: ClearanceLevel.LEVEL_2,
  viewSensitiveIncidents: ClearanceLevel.LEVEL_3,
  manageCriticalCases: ClearanceLevel.LEVEL_4,
  accessSystemAdmin: ClearanceLevel.LEVEL_5
};

// Check if user has required clearance level
export const hasClearanceLevel = (
  userClearance: ClearanceLevel,
  requiredLevel: ClearanceLevel
): boolean => {
  return userClearance >= requiredLevel;
};

// Initial users for development/testing
export const initialUsers = [
  {
    email: 'river@example.com',
    temporaryPassword: 'TempPassword123!',
    attributes: {
      'custom:role': UserRole.ADMIN,
      'custom:department': Department.MANAGEMENT,
      'custom:clearanceLevel': '5',
      'custom:badgeNumber': 'ADM001',
      'custom:facilityCodes': 'ALL'
    }
  },
  {
    email: 'celine@example.com',
    temporaryPassword: 'TempPassword123!',
    attributes: {
      'custom:role': UserRole.SECURITY_OFFICER,
      'custom:department': Department.SECURITY,
      'custom:clearanceLevel': '4',
      'custom:badgeNumber': 'SEC001',
      'custom:facilityCodes': 'ALL'
    }
  },
  {
    email: 'yamen@example.com',
    temporaryPassword: 'TempPassword123!',
    attributes: {
      'custom:role': UserRole.DEVELOPER,
      'custom:department': Department.IT,
      'custom:clearanceLevel': '3',
      'custom:badgeNumber': 'DEV001',
      'custom:facilityCodes': 'MAIN,LAB'
    }
  },
  {
    email: 'phil@example.com',
    temporaryPassword: 'TempPassword123!',
    attributes: {
      'custom:role': UserRole.VIEWER,
      'custom:department': Department.OPERATIONS,
      'custom:clearanceLevel': '1',
      'custom:badgeNumber': 'VIE001',
      'custom:facilityCodes': 'MAIN'
    }
  }
];

export default getCognitoConfig;