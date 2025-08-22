/**
 * Environment Variable Adapter
 * Handles both REACT_APP_ and VITE_ prefixes for backward compatibility
 * FIXED: Properly maps Cognito variables
 */

interface EnvConfig {
  // AWS Cognito Configuration
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_IDENTITY_POOL_ID?: string;
  COGNITO_REGION: string;
  
  // API Configuration
  API_BASE_URL: string;
  WEBSOCKET_URL: string;
  
  // Feature Flags
  ENABLE_MOCK_DATA?: string;
  ENVIRONMENT?: string;
  
  // Other configurations
  [key: string]: string | undefined;
}

function getEnvVar(key: string, fallbackKey?: string): string | undefined {
  // Try VITE_ prefix first (Vite native)
  const viteKey = `VITE_${key}`;
  if (import.meta.env[viteKey] !== undefined) {
    console.log(`✅ Found ${key} as ${viteKey}:`, import.meta.env[viteKey]);
    return import.meta.env[viteKey];
  }
  
  // Try REACT_APP_ prefix (backward compatibility)
  const reactAppKey = `REACT_APP_${key}`;
  if (import.meta.env[reactAppKey] !== undefined) {
    console.log(`✅ Found ${key} as ${reactAppKey}:`, import.meta.env[reactAppKey]);
    return import.meta.env[reactAppKey];
  }
  
  // Try process.env for REACT_APP_ variables
  if (typeof process !== 'undefined' && process.env && process.env[reactAppKey] !== undefined) {
    console.log(`✅ Found ${key} in process.env as ${reactAppKey}:`, process.env[reactAppKey]);
    return process.env[reactAppKey];
  }

  // Try direct key (for backward compatibility)
  if (import.meta.env[key] !== undefined) {
    console.log(`✅ Found ${key} directly:`, import.meta.env[key]);
    return import.meta.env[key];
  }
  
  // Try fallback key if provided
  if (fallbackKey && import.meta.env[fallbackKey] !== undefined) {
    console.log(`✅ Found ${key} as fallback ${fallbackKey}:`, import.meta.env[fallbackKey]);
    return import.meta.env[fallbackKey];
  }
  
  console.log(`❌ Could not find ${key} in any form`);
  return undefined;
}

// FRESH DEBUG SESSION MARKER
console.log('🚀 === FRESH DEBUG SESSION STARTED AT:', new Date().toISOString(), '===');
console.log('🔍 Raw import.meta.env:', import.meta.env);
console.log('🔍 VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

export const env: EnvConfig = {
  // AWS Cognito - FIXED: Map VITE_COGNITO_* to COGNITO_*
  COGNITO_USER_POOL_ID: getEnvVar('COGNITO_USER_POOL_ID', 'VITE_COGNITO_USER_POOL_ID') || '',
  COGNITO_CLIENT_ID: getEnvVar('COGNITO_CLIENT_ID', 'VITE_COGNITO_CLIENT_ID') || '',
  COGNITO_IDENTITY_POOL_ID: getEnvVar('COGNITO_IDENTITY_POOL_ID', 'VITE_COGNITO_IDENTITY_POOL_ID'),
  COGNITO_REGION: getEnvVar('COGNITO_REGION', 'VITE_AWS_REGION') || 'us-west-2',
  
  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL', 'VITE_API_BASE_URL') || '',
  WEBSOCKET_URL: getEnvVar('WEBSOCKET_URL', 'VITE_WEBSOCKET_URL') || '',
  
  // Feature Flags
  ENABLE_MOCK_DATA: getEnvVar('ENABLE_MOCK_DATA'),
  ENVIRONMENT: getEnvVar('ENVIRONMENT') || 'development',
};

// Debug: Log what we actually loaded
console.log('📋 Loaded env config:', {
  COGNITO_USER_POOL_ID: env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: env.COGNITO_CLIENT_ID,
  hasValues: {
    poolId: !!env.COGNITO_USER_POOL_ID,
    clientId: !!env.COGNITO_CLIENT_ID
  }
});

// Helper function to check if running in mock mode
export const isMockMode = (): boolean => {
  return env.ENABLE_MOCK_DATA === 'true' || env.ENABLE_MOCK_DATA === '1';
};

// Helper function to check if required Cognito config is present
export const hasCognitoConfig = (): boolean => {
  const hasPoolId = !!env.COGNITO_USER_POOL_ID;
  const hasClientId = !!env.COGNITO_CLIENT_ID;
  
  console.log('🔍 hasCognitoConfig check:', {
    COGNITO_USER_POOL_ID: env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: env.COGNITO_CLIENT_ID,
    hasPoolId,
    hasClientId,
    result: hasPoolId && hasClientId
  });
  
  return hasPoolId && hasClientId;
};

// Debug helper for development
if (import.meta.env.DEV) {
  console.log('🔧 Environment configuration:', {
    hasCognitoConfig: hasCognitoConfig(),
    isMockMode: isMockMode(),
    environment: env.ENVIRONMENT,
    cognitoRegion: env.COGNITO_REGION,
  });
}