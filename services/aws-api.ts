/**
 * AWS API Client
 * Unified client for all AWS Lambda API endpoints
 * Replaces Zustand stores with AWS API Gateway calls
 */

import { AuditContext } from './types';

// API Response types
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    total?: number;
    limit?: number;
    hasMore?: boolean;
    lastEvaluatedKey?: string;
  };
}

// Configuration interface
interface AWSConfig {
  apiBaseUrl: string;
  region: string;
  userPoolId: string;
}

// Request options interface
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export class AWSApiClient {
  private config: AWSConfig;
  private authToken: string | null = null;

  constructor(config: AWSConfig) {
    this.config = config;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Get base URL for API
   */
  getBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Make authenticated API request with retry logic
   */
  async makeRequest<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { method = 'GET', body, headers = {}, queryParams } = options;
    
    // Build URL with query parameters
    let url = `${this.config.apiBaseUrl}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    };

    try {
      // Make request with retry logic
      const response = await this.withRetry(async () => {
        const res = await fetch(url, requestOptions);
        
        if (!res.ok) {
          // Handle different error types
          if (res.status === 401) {
            throw new Error('Authentication required');
          } else if (res.status === 403) {
            throw new Error('Access forbidden');
          } else if (res.status === 404) {
            throw new Error('Resource not found');
          } else if (res.status >= 500) {
            throw new Error('Server error');
          }
          
          // Try to get error message from response
          try {
            const errorData = await res.json();
            throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
          } catch {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      });

      return response;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== AI (Bedrock) API ====================

  /**
   * Send conversation to AI backend (Bedrock) and receive assistant reply
   */
  async aiChat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, options?: { modelId?: string; temperature?: number; maxTokens?: number }): Promise<APIResponse<{ reply: string }>> {
    return this.makeRequest('/api/ai/chat', {
      method: 'POST',
      body: {
        messages,
        modelId: options?.modelId,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      }
    });
  }

  /**
   * Retry logic for failed requests
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry authentication errors
        if (lastError.message.includes('Authentication') || 
            lastError.message.includes('Access forbidden')) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }

  // ==================== ACTIVITIES API ====================

  /**
   * Get activities with optional filtering
   */
  async getActivities(queryParams?: Record<string, string>): Promise<APIResponse> {
    return this.makeRequest('/api/activities', { queryParams });
  }

  /**
   * Get single activity by ID
   */
  async getActivity(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/activities/${id}`);
  }

  /**
   * Create new activity
   */
  async createActivity(activityData: any): Promise<APIResponse> {
    return this.makeRequest('/api/activities', {
      method: 'POST',
      body: activityData
    });
  }

  /**
   * Update existing activity
   */
  async updateActivity(id: string, updates: any): Promise<APIResponse> {
    return this.makeRequest(`/api/activities/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete activity (soft delete)
   */
  async deleteActivity(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/activities/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== INCIDENTS API ====================

  /**
   * Get incidents with optional filtering
   */
  async getIncidents(queryParams?: Record<string, string>): Promise<APIResponse> {
    return this.makeRequest('/api/incidents', { queryParams });
  }

  /**
   * Get single incident by ID
   */
  async getIncident(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/incidents/${id}`);
  }

  /**
   * Create new incident
   */
  async createIncident(incidentData: any): Promise<APIResponse> {
    return this.makeRequest('/api/incidents', {
      method: 'POST',
      body: incidentData
    });
  }

  /**
   * Update existing incident
   */
  async updateIncident(id: string, updates: any): Promise<APIResponse> {
    return this.makeRequest(`/api/incidents/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/incidents/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CASES API ====================

  /**
   * Get cases with optional filtering
   */
  async getCases(queryParams?: Record<string, string>): Promise<APIResponse> {
    return this.makeRequest('/api/cases', { queryParams });
  }

  /**
   * Get single case by ID
   */
  async getCase(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/cases/${id}`);
  }

  /**
   * Create new case
   */
  async createCase(caseData: any): Promise<APIResponse> {
    return this.makeRequest('/api/cases', {
      method: 'POST',
      body: caseData
    });
  }

  /**
   * Update existing case
   */
  async updateCase(id: string, updates: any): Promise<APIResponse> {
    return this.makeRequest(`/api/cases/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete case
   */
  async deleteCase(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/cases/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== BOL API ====================

  /**
   * Get BOL entries with optional filtering
   */
  async getBOLs(queryParams?: Record<string, string>): Promise<APIResponse> {
    return this.makeRequest('/api/bol', { queryParams });
  }

  /**
   * Get single BOL by ID
   */
  async getBOL(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/bol/${id}`);
  }

  /**
   * Create new BOL
   */
  async createBOL(bolData: any): Promise<APIResponse> {
    return this.makeRequest('/api/bol', {
      method: 'POST',
      body: bolData
    });
  }

  /**
   * Update existing BOL
   */
  async updateBOL(id: string, updates: any): Promise<APIResponse> {
    return this.makeRequest(`/api/bol/${id}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete BOL
   */
  async deleteBOL(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/bol/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Perform pattern matching
   */
  async performPatternMatching(bolData: any, activityData: any): Promise<APIResponse> {
    return this.makeRequest('/api/bol', {
      method: 'POST',
      body: {
        operation: 'patternMatch',
        bolData,
        activityData
      }
    });
  }

  /**
   * Distribute BOL to multiple sites
   */
  async distributeBOL(bolId: string, sites: string[]): Promise<APIResponse> {
    return this.makeRequest('/api/bol', {
      method: 'POST',
      body: {
        operation: 'distribute',
        bolId,
        sites
      }
    });
  }

  // ==================== AUDIT API ====================

  /**
   * Get audit entries with optional filtering
   */
  async getAuditEntries(queryParams?: Record<string, string>): Promise<APIResponse> {
    return this.makeRequest('/api/audit', { queryParams });
  }

  /**
   * Get single audit entry by ID
   */
  async getAuditEntry(id: string): Promise<APIResponse> {
    return this.makeRequest(`/api/audit/${id}`);
  }

  /**
   * Log audit entry
   */
  async logAudit(auditData: any): Promise<APIResponse> {
    return this.makeRequest('/api/audit', {
      method: 'POST',
      body: auditData
    });
  }

  /**
   * Get audit trail for specific entity
   */
  async getAuditTrail(entityType: string, entityId: string): Promise<APIResponse> {
    return this.makeRequest('/api/audit', {
      queryParams: {
        entityType,
        entityId
      }
    });
  }

  /**
   * Get recent audit activity
   */
  async getRecentAuditActivity(limit: number = 50): Promise<APIResponse> {
    return this.makeRequest('/api/audit', {
      queryParams: {
        recent: 'true',
        limit: limit.toString()
      }
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(reportType: string, parameters: any): Promise<APIResponse> {
    return this.makeRequest('/api/audit', {
      method: 'POST',
      body: {
        operation: 'generateReport',
        reportType,
        parameters
      }
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(startDate?: string, endDate?: string): Promise<APIResponse> {
    const queryParams: Record<string, string> = {
      statistics: 'true'
    };
    
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    
    return this.makeRequest('/api/audit', { queryParams });
  }
}

// Default instance that will be configured in ServiceProvider
export let apiClient: AWSApiClient;

/**
 * Initialize the API client with configuration
 */
export function initializeApiClient(config: AWSConfig) {
  apiClient = new AWSApiClient(config);
  return apiClient;
}

/**
 * Get the configured API client instance
 */
export function getApiClient(): AWSApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient() first.');
  }
  return apiClient;
}

export type { APIResponse, AWSConfig };