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
  type SignInOutput
} from '@aws-amplify/auth';
import { getCognitoConfig } from '../config/cognito';

// Initialize Amplify with Cognito configuration
export const initializeCognito = () => {
  const config = getCognitoConfig();
  console.log('🔧 Initializing Amplify v6 with Cognito config');
  
  try {
    // Amplify v6 correct format
    const amplifyConfig = {
      Auth: {
        Cognito: {
          userPoolId: config.userPoolId,
          userPoolClientId: config.userPoolWebClientId,
          region: config.region,
          identityPoolId: config.identityPoolId
        }
      }
    };
    
    // Add OAuth config if domain exists
    if (config.domain) {
      amplifyConfig.Auth.Cognito.loginWith = {
        oauth: {
          domain: config.domain.replace('https://', '').replace('http://', ''),
          scopes: config.oauth.scope,
          redirectSignIn: [config.oauth.redirectSignIn],
          redirectSignOut: [config.oauth.redirectSignOut],
          responseType: config.oauth.responseType
        }
      };
    }
    
    console.log('🔧 Applying config:', JSON.stringify(amplifyConfig, null, 2));
    Amplify.configure(amplifyConfig);
    console.log('✅ Amplify configured successfully');
  } catch (error) {
    console.error('❌ Amplify configuration error:', error);
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

// Store initialization state
let isInitialized = false;
let initializationError: Error | null = null;

// Initialize Cognito when module loads
if (typeof window !== 'undefined') {
  try {
    initializeCognito();
    isInitialized = true;
    console.log('✅ Cognito initialized successfully');
  } catch (error) {
    initializationError = error as Error;
    console.error('❌ Failed to initialize Cognito:', error);
    console.error('⚠️  App will continue in fallback mode');
  }
}

// Export initialization state
export const getCognitoInitStatus = () => ({
  isInitialized,
  error: initializationError
});

export default cognitoOperations;