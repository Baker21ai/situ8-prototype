/**
 * WebSocket Authentication Utilities
 * Handles signed URL generation for AWS API Gateway WebSocket connections
 */

import { fetchAuthSession } from '@aws-amplify/auth';

interface SignedUrlOptions {
  region?: string;
  service?: string;
  expiresIn?: number;
}

/**
 * Generate a signed WebSocket URL for AWS API Gateway
 * This is required because WebSocket connections don't support standard HTTP headers
 */
export async function generateSignedWebSocketUrl(
  baseUrl: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  try {
    // Get current auth session
    const session = await fetchAuthSession();
    
    if (!session || !session.credentials) {
      console.warn('No valid auth session for WebSocket');
      throw new Error('No authentication credentials available');
    }

    // Parse the base URL
    const url = new URL(baseUrl);
    
    // Add query parameters for authentication
    const searchParams = new URLSearchParams(url.search);
    
    // Option 1: Use the ID token as a query parameter (simpler approach)
    if (session.tokens?.idToken) {
      searchParams.set('token', session.tokens.idToken.toString());
      url.search = searchParams.toString();
      return url.toString();
    }
    
    // For now, we'll use the simpler token-based approach
    // AWS Signature V4 for WebSocket requires more complex implementation
    console.warn('Using token-based authentication for WebSocket');
    
    // Return the URL with token
    searchParams.set('token', session.tokens?.idToken?.toString() || '');
    url.search = searchParams.toString();
    return url.toString();
    
  } catch (error) {
    console.error('Failed to generate signed WebSocket URL:', error);
    
    // Fallback: try to use token from localStorage or return unsigned URL
    const fallbackToken = localStorage.getItem('authToken');
    if (fallbackToken) {
      const url = new URL(baseUrl);
      url.searchParams.set('token', fallbackToken);
      return url.toString();
    }
    
    // Last resort: return unsigned URL
    return baseUrl;
  }
}

/**
 * Extract token from current auth session for WebSocket authentication
 */
export async function getWebSocketAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    
    // Prefer ID token for user identity
    if (session.tokens?.idToken) {
      return session.tokens.idToken.toString();
    }
    
    // Fallback to access token
    if (session.tokens?.accessToken) {
      return session.tokens.accessToken.toString();
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get auth token for WebSocket:', error);
    return null;
  }
}

/**
 * Check if the current auth session is valid and not expired
 */
export async function isAuthSessionValid(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    
    if (!session || !session.tokens) {
      return false;
    }
    
    // Check if tokens are present and not expired
    const now = Math.floor(Date.now() / 1000);
    
    // Check ID token expiration
    if (session.tokens.idToken?.payload?.exp) {
      const idTokenExp = session.tokens.idToken.payload.exp as number;
      if (idTokenExp <= now) {
        return false;
      }
    }
    
    // Check access token expiration
    if (session.tokens.accessToken?.payload?.exp) {
      const accessTokenExp = session.tokens.accessToken.payload.exp as number;
      if (accessTokenExp <= now) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate auth session:', error);
    return false;
  }
}

/**
 * Refresh auth tokens if needed
 */
export async function refreshAuthTokensIfNeeded(): Promise<boolean> {
  try {
    const isValid = await isAuthSessionValid();
    
    if (!isValid) {
      // Force token refresh by fetching auth session with forceRefresh
      const session = await fetchAuthSession({ forceRefresh: true });
      return !!session.tokens;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to refresh auth tokens:', error);
    return false;
  }
}