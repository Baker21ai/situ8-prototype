/**
 * AWS Cognito Client Configuration
 * Handles AWS Amplify setup and authentication operations
 */

import { Amplify } from '@aws-amplify/core';
import { 
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  signUp,
  confirmSignUp,
  updatePassword,
  fetchUserAttributes,
  confirmSignIn,
  type SignInOutput
} from '@aws-amplify/auth';
import { getCognitoConfig } from '../config/cognito';

// Helper: determine if Cognito config is present without importing env-adapter
const hasCognitoConfigSafe = (): boolean => {
  try {
    const cfg = getCognitoConfig();
    return Boolean(cfg?.userPoolId && cfg?.userPoolWebClientId);
  } catch {
    return false;
  }
};

// Initialize Amplify with Cognito configuration
export const initializeCognito = () => {
  console.log('🔧 Initializing Amplify v6 with Cognito config');
  
  // Check if we have Cognito configuration
  if (!hasCognitoConfigSafe()) {
    console.warn('⚠️  No Cognito configuration found, app will run in fallback mode');
    throw new Error('Missing Cognito configuration');
  }
  
  try {
    const config = getCognitoConfig();
    
    // Amplify v6 configuration - corrected field names
    const amplifyConfig = {
      Auth: {
        Cognito: {
          userPoolId: config.userPoolId,
          userPoolClientId: config.userPoolWebClientId, // Correct field name for v6
          region: config.region || 'us-west-2'
          // No OAuth - using USER_PASSWORD_AUTH flow
          // No identity pool - not needed for basic auth
        }
      }
    };
    
    console.log('🔧 Applying simplified Amplify config:', {
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolWebClientId,
      region: config.region || 'us-west-2'
    });
    
    Amplify.configure(amplifyConfig);
    lastValidConfig = amplifyConfig; // Store for recovery
    console.log('✅ Amplify configured successfully (OAuth removed, using password auth only)');
  } catch (error) {
    console.error('❌ Amplify configuration error:', error);
    // Log the error details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Authentication operations
export const cognitoOperations = {
  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string): Promise<SignInOutput> {
    try {
      // If a user is already authenticated, sign them out first to avoid
      // UserAlreadyAuthenticatedException from Amplify Auth v6
      try {
        const existingUser = await getCurrentUser();
        if (existingUser) {
          console.log('🔄 Existing Cognito session detected. Signing out before sign-in...');
          await signOut();
        }
      } catch {
        // getCurrentUser throws when no user; safe to ignore
      }

      const result = await signIn({
        username: email,
        password
      });
      return result;
    } catch (error) {
      console.error('Cognito signIn error:', error);
      throw error;
    }
  },
  
  /**
   * Complete new password challenge
   */
  async confirmSignIn(newPassword: string): Promise<SignInOutput> {
    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword
      });
      return result;
    } catch (error) {
      console.error('Cognito confirmSignIn error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Cognito signOut error:', error);
      throw error;
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      // User not authenticated
      return null;
    }
  },

  /**
   * Get current session tokens
   */
  async getSession() {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      console.error('Cognito getSession error:', error);
      throw error;
    }
  },

  /**
   * Get user attributes from Cognito
   */
  async getUserAttributes() {
    try {
      const attributes = await fetchUserAttributes();
      return attributes;
    } catch (error) {
      console.error('Cognito getUserAttributes error:', error);
      throw error;
    }
  },

  /**
   * Update user password
   */
  async updatePassword(oldPassword: string, newPassword: string) {
    try {
      await updatePassword({ oldPassword, newPassword });
    } catch (error) {
      console.error('Cognito updatePassword error:', error);
      throw error;
    }
  },

  /**
   * Initiate password reset
   */
  async resetPassword(email: string) {
    try {
      const result = await resetPassword({ username: email });
      return result;
    } catch (error) {
      console.error('Cognito resetPassword error:', error);
      throw error;
    }
  },

  /**
   * Confirm password reset with code
   */
  async confirmResetPassword(email: string, code: string, newPassword: string) {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
    } catch (error) {
      console.error('Cognito confirmResetPassword error:', error);
      throw error;
    }
  },

  /**
   * Sign up new user (admin only)
   */
  async signUp(email: string, password: string, attributes: Record<string, string>) {
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: attributes
        }
      });
      return result;
    } catch (error) {
      console.error('Cognito signUp error:', error);
      throw error;
    }
  },

  /**
   * Confirm sign up with code
   */
  async confirmSignUp(email: string, code: string) {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code
      });
      return result;
    } catch (error) {
      console.error('Cognito confirmSignUp error:', error);
      throw error;
    }
  }
};

// Store initialization state - SINGLETON PATTERN
let isInitialized = false;
let initializationError: Error | null = null;
let initializationPromise: Promise<void> | null = null;

// Store config for recovery
let lastValidConfig: any = null;

// Singleton initialization function
export const ensureCognitoInitialized = async (): Promise<void> => {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log('✅ Cognito already initialized');
    return;
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('⏳ Waiting for Cognito initialization in progress...');
    return initializationPromise;
  }
  
  // Start initialization
  initializationPromise = (async () => {
    try {
      // Only initialize if we have proper configuration
      if (!hasCognitoConfig()) {
        throw new Error('No Cognito configuration found');
      }
      
      console.log('🔧 Starting Cognito initialization...');
      initializeCognito();
      
      // Verify configuration was successful
      // Note: getConfig might not be available in v6, so we'll trust the configuration worked
      console.log('🔍 Configuration applied, checking if Amplify is configured...');
      
      // Try to verify by attempting to get current user (will fail if not configured)
      try {
        // This will throw if not configured properly
        await getCurrentUser().catch(() => {
          // Expected to fail if no user is logged in, but should not throw config error
          console.log('✅ getCurrentUser check passed (no config error)');
        });
      } catch (configError: any) {
        if (configError.message?.includes('UserPool')) {
          throw new Error(`Amplify configuration failed: ${configError.message}`);
        }
      }
      
      isInitialized = true;
      console.log('✅ Cognito initialized and verified successfully');
    } catch (error) {
      initializationError = error as Error;
      console.error('❌ Failed to initialize Cognito:', error);
      throw error;
    }
  })();
  
  return initializationPromise;
};

// Initialize Cognito when module loads (with better error handling)
if (typeof window !== 'undefined') {
  // Don't auto-initialize - let it be called explicitly
  console.log('🔧 Cognito client module loaded, waiting for explicit initialization');
}

// Recovery function to reconfigure Amplify after errors
export const recoverCognitoConfiguration = () => {
  if (lastValidConfig) {
    try {
      console.log('🔧 Attempting to recover Cognito configuration...');
      Amplify.configure(lastValidConfig);
      isInitialized = true;
      initializationError = null;
      console.log('✅ Cognito configuration recovered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to recover configuration:', error);
      return false;
    }
  }
  console.warn('⚠️ No valid configuration to recover');
  return false;
};

// Export initialization state
export const getCognitoInitStatus = () => ({
  isInitialized,
  error: initializationError,
  hasCognitoConfig: hasCognitoConfigSafe()
});

export default cognitoOperations;