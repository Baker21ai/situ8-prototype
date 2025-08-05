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
  
  // Amplify v6 configuration format
  const authConfig = {
    Cognito: {
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolWebClientId,
      identityPoolId: config.identityPoolId,
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: { required: true }
      },
      passwordFormat: {
        minLength: 8,
        requireNumbers: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSpecialCharacters: true
      }
    }
  };

  // Only add OAuth config if domain exists
  if (config.domain) {
    authConfig.Cognito.loginWith = {
      oauth: {
        domain: config.domain.replace('https://', '').replace('http://', ''),
        scopes: config.oauth.scope,
        redirectSignIn: [config.oauth.redirectSignIn],
        redirectSignOut: [config.oauth.redirectSignOut],
        responseType: config.oauth.responseType
      }
    };
  }

  Amplify.configure({
    Auth: authConfig
  });
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

// Initialize Cognito when module loads
if (typeof window !== 'undefined') {
  try {
    initializeCognito();
    console.log('✅ Cognito initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Cognito:', error);
  }
}

export default cognitoOperations;