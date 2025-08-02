/**
 * CQRS Integration Service
 * Bridges the new CQRS architecture with existing domain stores
 */

import { ApplicationService, initializeApplicationService } from './ApplicationService';
import { IActivityRepository } from '../domains/activities/repositories/IActivityRepository';
import { ActivityRepository } from '../infrastructure/repositories/ActivityRepository';
import { useActivityStore } from '../infrastructure/storage/ActivityStore';
import { useIncidentStore } from '../infrastructure/storage/IncidentStore';

export class CQRSIntegrationService {
  private applicationService: ApplicationService | null = null;
  private activityRepository: IActivityRepository | null = null;

  async initialize(): Promise<void> {
    try {
      // Initialize repository (this bridges to the existing stores)
      this.activityRepository = new ActivityRepository();
      
      // Initialize application service with repositories
      this.applicationService = await initializeApplicationService({
        activityRepository: this.activityRepository
      });

      // Connect to existing stores for backward compatibility
      this.connectToExistingStores();

      console.log('✅ CQRS Integration Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CQRS Integration Service:', error);
      throw error;
    }
  }

  private connectToExistingStores(): void {
    // Get store instances
    const activityStore = useActivityStore.getState();
    const incidentStore = useIncidentStore.getState();

    // Forward store operations to CQRS layer
    this.forwardActivityStoreOperations(activityStore);
    this.forwardIncidentStoreOperations(incidentStore);
  }

  private forwardActivityStoreOperations(activityStore: any): void {
    // Wrap existing store methods to use CQRS
    const originalCreateActivity = activityStore.createActivity;
    const originalUpdateActivity = activityStore.updateActivity;
    const originalGetActivities = activityStore.getActivities;

    // Create Activity Command Forwarding
    activityStore.createActivity = async (command: any) => {
      try {
        if (this.applicationService) {
          const result = await this.applicationService.createActivity({
            activityType: command.type,
            title: command.title,
            location: command.location,
            priority: command.priority,
            description: command.description,
            building: command.building,
            zone: command.zone,
            assignedTo: command.assignedTo,
            confidence: command.confidence,
            externalData: command.externalData
          }, command.createdBy);

          return {
            success: result.success,
            activityId: result.data?.activityId,
            error: result.error
          };
        }
        // Fallback to original implementation
        return await originalCreateActivity(command);
      } catch (error) {
        console.error('Error in CQRS createActivity forwarding:', error);
        return await originalCreateActivity(command);
      }
    };

    // Update Activity Command Forwarding
    activityStore.updateActivity = async (command: any) => {
      try {
        if (this.applicationService) {
          const result = await this.applicationService.updateActivity(
            command.activityId,
            command.updates,
            command.reason,
            command.updatedBy
          );

          return {
            success: result.success,
            error: result.error
          };
        }
        return await originalUpdateActivity(command);
      } catch (error) {
        console.error('Error in CQRS updateActivity forwarding:', error);
        return await originalUpdateActivity(command);
      }
    };

    // Get Activities Query Forwarding
    activityStore.getActivities = async (query?: any) => {
      try {
        if (this.applicationService) {
          const result = await this.applicationService.getActivities(
            query?.filters,
            query?.pagination,
            query?.sorting,
            'system' // Default user for queries
          );

          if (result.success && result.data) {
            return {
              activities: result.data.activities,
              totalCount: result.data.totalCount,
              hasMore: result.data.hasMore
            };
          }
        }
        return await originalGetActivities(query);
      } catch (error) {
        console.error('Error in CQRS getActivities forwarding:', error);
        return await originalGetActivities(query);
      }
    };
  }

  private forwardIncidentStoreOperations(incidentStore: any): void {
    // Similar forwarding for incident operations
    // This would be implemented when incident command/query handlers are ready
    console.log('Incident store forwarding placeholder - implement when incident handlers are ready');
  }

  // ===== PUBLIC API FOR COMPONENTS =====

  /**
   * Execute a command through the CQRS layer
   */
  async executeCommand<T = any>(command: any): Promise<T> {
    if (!this.applicationService) {
      throw new Error('CQRS Integration Service not initialized');
    }

    return await this.applicationService.executeCommand(command);
  }

  /**
   * Execute a query through the CQRS layer
   */
  async executeQuery<T = any>(query: any): Promise<T> {
    if (!this.applicationService) {
      throw new Error('CQRS Integration Service not initialized');
    }

    return await this.applicationService.executeQuery(query);
  }

  /**
   * Get the underlying application service
   */
  getApplicationService(): ApplicationService {
    if (!this.applicationService) {
      throw new Error('CQRS Integration Service not initialized');
    }
    return this.applicationService;
  }

  /**
   * Health check for the CQRS system
   */
  async healthCheck() {
    if (!this.applicationService) {
      return {
        status: 'unhealthy',
        error: 'Not initialized'
      };
    }

    return await this.applicationService.healthCheck();
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    if (!this.applicationService) {
      return null;
    }

    return this.applicationService.getPerformanceMetrics();
  }
}

// ===== SINGLETON INSTANCE =====

let cqrsIntegrationService: CQRSIntegrationService | null = null;

export async function initializeCQRS(): Promise<CQRSIntegrationService> {
  if (cqrsIntegrationService) {
    console.warn('CQRS Integration Service already initialized');
    return cqrsIntegrationService;
  }

  cqrsIntegrationService = new CQRSIntegrationService();
  await cqrsIntegrationService.initialize();
  
  return cqrsIntegrationService;
}

export function getCQRSService(): CQRSIntegrationService {
  if (!cqrsIntegrationService) {
    throw new Error('CQRS Integration Service not initialized. Call initializeCQRS first.');
  }
  return cqrsIntegrationService;
}

// ===== REACT HOOK FOR COMPONENTS =====

import { useEffect, useState, useCallback } from 'react';

export function useCQRS() {
  const [service, setService] = useState<CQRSIntegrationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const cqrsService = await initializeCQRS();
        if (mounted) {
          setService(cqrsService);
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize CQRS');
          setIsInitialized(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const executeCommand = useCallback(async (command: any) => {
    if (!service) {
      throw new Error('CQRS service not available');
    }
    return await service.executeCommand(command);
  }, [service]);

  const executeQuery = useCallback(async (query: any) => {
    if (!service) {
      throw new Error('CQRS service not available');
    }
    return await service.executeQuery(query);
  }, [service]);

  const getMetrics = useCallback(() => {
    if (!service) {
      return null;
    }
    return service.getMetrics();
  }, [service]);

  return {
    service,
    isInitialized,
    error,
    executeCommand,
    executeQuery,
    getMetrics
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Helper to create activity commands with proper typing
 */
export function createActivityCommand(
  type: string,
  data: any,
  userId: string,
  aggregateId?: string
) {
  return {
    type,
    userId,
    timestamp: new Date(),
    correlationId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    aggregateId,
    data
  };
}

/**
 * Helper to create activity queries with proper typing
 */
export function createActivityQuery(
  type: string,
  data: any,
  userId?: string
) {
  return {
    type,
    userId,
    timestamp: new Date(),
    correlationId: `qry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...data
  };
}

/**
 * Validation helper for commands
 */
export function validateCommand(command: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!command.type) {
    errors.push('Command type is required');
  }

  if (!command.userId) {
    errors.push('User ID is required');
  }

  if (!command.timestamp) {
    errors.push('Timestamp is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validation helper for queries
 */
export function validateQuery(query: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query.type) {
    errors.push('Query type is required');
  }

  if (!query.timestamp) {
    errors.push('Timestamp is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}