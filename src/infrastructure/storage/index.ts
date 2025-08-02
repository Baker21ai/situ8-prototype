/**
 * Infrastructure Storage Layer - Index
 * Exports all storage components for the CQRS architecture
 */

// Event Bus
export * from './EventBus';

// Domain-Specific Stores
export * from './ActivityStore';
export * from './IncidentStore';

// Repository Implementations
export * from '../repositories/ActivityRepository';

// Store initialization and configuration
export interface StorageConfig {
  activityStore?: {
    enableRealtime?: boolean;
    cacheTimeout?: number;
    maxCacheSize?: number;
  };
  incidentStore?: {
    enableAutoCreation?: boolean;
    validationTimeoutMinutes?: number;
    maxRecentIncidents?: number;
  };
  eventBus?: {
    maxEventStoreSize?: number;
    debugMode?: boolean;
  };
  repositories?: {
    activity?: {
      enableCaching?: boolean;
      cacheTimeout?: number;
      batchSize?: number;
    };
  };
}

/**
 * Initialize the complete storage infrastructure
 */
export const initializeStorage = async (config: StorageConfig = {}) => {
  // Initialize event bus
  const { eventBus } = await import('./EventBus');
  eventBus.setDebugMode(config.eventBus?.debugMode || false);
  
  // Initialize activity repository
  const { ActivityRepository } = await import('../repositories/ActivityRepository');
  const activityRepository = new ActivityRepository(config.repositories?.activity);
  
  // Initialize stores with dependency injection
  const { initializeActivityStore } = await import('./ActivityStore');
  initializeActivityStore(activityRepository);
  
  // Enable real-time features if configured
  const { useActivityStore } = await import('./ActivityStore');
  const { useIncidentStore } = await import('./IncidentStore');
  
  if (config.activityStore?.enableRealtime !== false) {
    useActivityStore.getState().enableRealtime();
  }
  
  if (config.incidentStore?.enableAutoCreation !== false) {
    useIncidentStore.getState().enableAutoCreation();
    useIncidentStore.getState().enableIncidentRealtime();
  }
  
  return {
    eventBus,
    activityRepository,
    stores: {
      activity: useActivityStore,
      incident: useIncidentStore
    }
  };
};

/**
 * Get health status of the entire storage infrastructure
 */
export const getStorageHealth = async () => {
  const { eventBus } = await import('./EventBus');
  const { useActivityStore } = await import('./ActivityStore');
  const { useIncidentStore } = await import('./IncidentStore');
  
  const eventBusHealth = eventBus.getHealthStatus();
  const activityStoreHealth = {
    cachedActivitiesCount: useActivityStore.getState().getCacheStats().cachedActivitiesCount,
    isRealTimeEnabled: useActivityStore.getState().realtimeEnabled,
    isConnected: useActivityStore.getState().isConnected
  };
  const incidentStoreHealth = {
    totalIncidents: useIncidentStore.getState().cachedIncidents.size,
    autoCreationEnabled: useIncidentStore.getState().autoCreationEnabled,
    pendingValidations: useIncidentStore.getState().pendingValidations.length
  };
  
  return {
    eventBus: eventBusHealth,
    activityStore: activityStoreHealth,
    incidentStore: incidentStoreHealth,
    overallHealth: {
      isHealthy: eventBusHealth.isHealthy,
      timestamp: new Date()
    }
  };
};