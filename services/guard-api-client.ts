/**
 * Guard API Client
 * Handles communication with external guard management systems
 * Supports synchronization of guard data with external APIs
 */

import type { Guard, GuardLocation } from '../stores/guardStore';

export interface GuardApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface GuardApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface GuardSyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}

export class GuardApiClient {
  private config: GuardApiConfig;
  private offlineQueue: Array<{
    action: 'update' | 'create' | 'delete';
    data: any;
    timestamp: Date;
    retryCount: number;
  }> = [];

  constructor(config: GuardApiConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
    
    // Load offline queue from localStorage
    this.loadOfflineQueue();
  }

  /**
   * Fetch all guards from external API
   */
  async fetchGuards(): Promise<GuardApiResponse<Guard[]>> {
    try {
      const response = await this.makeRequest('/guards', 'GET');
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform external API data to our Guard format
      const guards = this.transformGuardData(data);
      
      return {
        success: true,
        data: guards,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch guards:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Update guard data in external API
   */
  async updateGuard(guardId: number, updates: Partial<Guard>): Promise<GuardApiResponse<Guard>> {
    try {
      // If offline, queue the update
      if (!navigator.onLine) {
        this.queueOfflineAction('update', { guardId, updates });
        return {
          success: false,
          error: 'Offline - update queued for sync',
          timestamp: new Date()
        };
      }
      
      const response = await this.makeRequest(`/guards/${guardId}`, 'PUT', updates);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const guard = this.transformSingleGuard(data);
      
      return {
        success: true,
        data: guard,
        timestamp: new Date()
      };
    } catch (error) {
      // Queue for retry on failure
      this.queueOfflineAction('update', { guardId, updates });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Update guard location
   */
  async updateGuardLocation(guardId: number, location: GuardLocation): Promise<GuardApiResponse<void>> {
    try {
      if (!navigator.onLine) {
        this.queueOfflineAction('update', { 
          guardId, 
          updates: { 
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            lastUpdate: location.timestamp || new Date()
          } 
        });
        return {
          success: false,
          error: 'Offline - location update queued',
          timestamp: new Date()
        };
      }
      
      const response = await this.makeRequest(`/guards/${guardId}/location`, 'POST', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp || new Date()
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      this.queueOfflineAction('update', { 
        guardId, 
        updates: { 
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          lastUpdate: location.timestamp || new Date()
        }
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Sync all queued offline changes
   */
  async syncOfflineQueue(): Promise<GuardSyncResult> {
    const result: GuardSyncResult = {
      total: this.offlineQueue.length,
      synced: 0,
      failed: 0,
      errors: []
    };
    
    if (!navigator.onLine) {
      result.errors.push('Cannot sync - still offline');
      return result;
    }
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of queue) {
      try {
        if (item.action === 'update') {
          const response = await this.updateGuard(item.data.guardId, item.data.updates);
          if (response.success) {
            result.synced++;
          } else {
            result.failed++;
            result.errors.push(`Failed to sync guard ${item.data.guardId}: ${response.error}`);
            // Re-queue if retry count not exceeded
            if (item.retryCount < (this.config.retryAttempts || 3)) {
              this.offlineQueue.push({ ...item, retryCount: item.retryCount + 1 });
            }
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
    
    // Save updated queue
    this.saveOfflineQueue();
    
    return result;
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): { count: number; oldestItem?: Date } {
    return {
      count: this.offlineQueue.length,
      oldestItem: this.offlineQueue.length > 0 ? this.offlineQueue[0].timestamp : undefined
    };
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    endpoint: string, 
    method: string, 
    body?: any
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Transform external API data to our Guard format
   */
  private transformGuardData(apiData: any[]): Guard[] {
    return apiData.map(item => this.transformSingleGuard(item));
  }

  /**
   * Transform single guard from API
   */
  private transformSingleGuard(apiGuard: any): Guard {
    return {
      id: apiGuard.id || apiGuard.guardId,
      name: apiGuard.name || `${apiGuard.firstName} ${apiGuard.lastName}`,
      status: this.mapGuardStatus(apiGuard.status),
      location: apiGuard.location || apiGuard.currentLocation || 'Unknown',
      building: apiGuard.building || apiGuard.assignedBuilding || 'Unknown',
      zone: apiGuard.zone || apiGuard.currentZone || 'Unknown',
      lastUpdate: new Date(apiGuard.lastUpdate || apiGuard.lastSeen || Date.now()),
      radio: apiGuard.radioChannel || apiGuard.radio || 'N/A',
      assignedActivity: apiGuard.assignedActivity || apiGuard.currentTask || null,
      badge: apiGuard.badge || apiGuard.badgeNumber || '',
      shift: apiGuard.shift || apiGuard.currentShift || '',
      department: apiGuard.department || 'Security',
      skills: apiGuard.skills || apiGuard.certifications || [],
      latitude: apiGuard.latitude || apiGuard.location?.lat || 0,
      longitude: apiGuard.longitude || apiGuard.location?.lng || 0,
      accuracy: apiGuard.accuracy || apiGuard.location?.accuracy || 10,
      metrics: {
        activitiesCreated: apiGuard.metrics?.activitiesCreated || 0,
        incidentsResolved: apiGuard.metrics?.incidentsResolved || 0,
        hoursPatrolled: apiGuard.metrics?.hoursPatrolled || 0,
        areasChecked: apiGuard.metrics?.areasChecked || 0
      }
    };
  }

  /**
   * Map external API status to our status enum
   */
  private mapGuardStatus(apiStatus: string): Guard['status'] {
    const statusMap: Record<string, Guard['status']> = {
      'on_duty': 'available',
      'available': 'available',
      'busy': 'responding',
      'responding': 'responding',
      'patrol': 'patrolling',
      'patrolling': 'patrolling',
      'investigation': 'investigating',
      'investigating': 'investigating',
      'break': 'break',
      'on_break': 'break',
      'offline': 'off_duty',
      'off_duty': 'off_duty',
      'emergency': 'emergency',
      'sos': 'emergency'
    };
    
    return statusMap[apiStatus.toLowerCase()] || 'off_duty';
  }

  /**
   * Queue action for offline sync
   */
  private queueOfflineAction(action: 'update' | 'create' | 'delete', data: any): void {
    this.offlineQueue.push({
      action,
      data,
      timestamp: new Date(),
      retryCount: 0
    });
    
    this.saveOfflineQueue();
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('situ8-guard-offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('situ8-guard-offline-queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }
}

// Singleton instance
let guardApiClientInstance: GuardApiClient | null = null;

/**
 * Get or create guard API client instance
 */
export function getGuardApiClient(config?: GuardApiConfig): GuardApiClient {
  if (!guardApiClientInstance && config) {
    guardApiClientInstance = new GuardApiClient(config);
  } else if (!guardApiClientInstance) {
    throw new Error('Guard API client not initialized. Provide config on first call.');
  }
  
  return guardApiClientInstance;
}

/**
 * Reset guard API client (useful for testing or config changes)
 */
export function resetGuardApiClient(): void {
  guardApiClientInstance = null;
}