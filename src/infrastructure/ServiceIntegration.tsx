/**
 * Service Integration Layer
 * Bridges the new CQRS stores with existing service layer for backward compatibility
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeStorage, StorageConfig, useActivityStore, useIncidentStore } from './storage';
import { ActivityRepository } from './repositories/ActivityRepository';

// Integration context
interface ServiceIntegrationContext {
  isInitialized: boolean;
  activityRepository: ActivityRepository | null;
  storage: {
    eventBus: any;
    activityRepository: ActivityRepository | null;
    stores: {
      activity: typeof useActivityStore;
      incident: typeof useIncidentStore;
    };
  } | null;
  error: string | null;
}

const ServiceIntegrationContext = createContext<ServiceIntegrationContext>({
  isInitialized: false,
  activityRepository: null,
  storage: null,
  error: null
});

export const useServiceIntegration = () => {
  const context = useContext(ServiceIntegrationContext);
  if (!context) {
    throw new Error('useServiceIntegration must be used within ServiceIntegrationProvider');
  }
  return context;
};

// Provider component
interface ServiceIntegrationProviderProps {
  children: React.ReactNode;
  config?: StorageConfig;
}

export const ServiceIntegrationProvider: React.FC<ServiceIntegrationProviderProps> = ({
  children,
  config = {}
}) => {
  const [state, setState] = useState<ServiceIntegrationContext>({
    isInitialized: false,
    activityRepository: null,
    storage: null,
    error: null
  });

  useEffect(() => {
    const initializeIntegration = async () => {
      try {
        // Initialize the complete storage infrastructure
        const storage = await initializeStorage({
          activityStore: {
            enableRealtime: true,
            cacheTimeout: 30000,
            maxCacheSize: 1000,
            ...config.activityStore
          },
          incidentStore: {
            enableAutoCreation: true,
            validationTimeoutMinutes: 5,
            maxRecentIncidents: 50,
            ...config.incidentStore
          },
          eventBus: {
            maxEventStoreSize: 1000,
            debugMode: process.env.NODE_ENV === 'development',
            ...config.eventBus
          },
          repositories: {
            activity: {
              enableCaching: true,
              cacheTimeout: 30000,
              batchSize: 100,
              ...config.repositories?.activity
            }
          }
        });

        setState({
          isInitialized: true,
          activityRepository: storage.activityRepository,
          storage,
          error: null
        });

        // Set up cross-store event handlers for backward compatibility
        setupBackwardCompatibilityHandlers(storage);

      } catch (error) {
        setState({
          isInitialized: false,
          activityRepository: null,
          storage: null,
          error: error instanceof Error ? error.message : 'Failed to initialize services'
        });
      }
    };

    initializeIntegration();
  }, []);

  return (
    <ServiceIntegrationContext.Provider value={state}>
      {children}
    </ServiceIntegrationContext.Provider>
  );
};

// Backward compatibility handlers
const setupBackwardCompatibilityHandlers = (storage: any) => {
  const { eventBus, stores } = storage;

  // Listen to activity events and sync with incident store
  eventBus.subscribe((event: any) => {
    if (event.type === 'activity.created') {
      // The incident store will handle auto-creation through its own event handlers
      // No additional action needed here due to the event-driven architecture
    }
  }, { aggregate: 'activity' });

  // Listen to incident events and update activity contexts
  eventBus.subscribe((event: any) => {
    if (event.type === 'incident.created') {
      const incidentData = event.data;
      if (incidentData.triggerActivityId) {
        // Update the activity to include incident context
        const activityStore = stores.activity.getState();
        activityStore.getActivityById(incidentData.triggerActivityId).then(activity => {
          if (activity && !activity.incident_contexts.includes(incidentData.incidentId)) {
            activity.addIncidentContext(incidentData.incidentId);
            // The store will handle the update through its repository
          }
        });
      }
    }
  }, { aggregate: 'incident' });
};

// Hooks for accessing new stores with backward compatibility
export const useNewActivityStore = () => {
  const { isInitialized, storage } = useServiceIntegration();
  
  if (!isInitialized || !storage) {
    throw new Error('Storage not initialized');
  }
  
  return storage.stores.activity;
};

export const useNewIncidentStore = () => {
  const { isInitialized, storage } = useServiceIntegration();
  
  if (!isInitialized || !storage) {
    throw new Error('Storage not initialized');
  }
  
  return storage.stores.incident;
};

// Migration helpers for existing components
export const useMigratedActivityStore = () => {
  const newStore = useNewActivityStore();
  const store = newStore();
  
  // Provide backward compatibility interface
  return {
    // New CQRS methods
    ...store,
    
    // Legacy method compatibility
    activities: store.getRecentActivities(1000), // Get recent activities for legacy components
    createActivity: async (activityData: any) => {
      const result = await store.createActivity({
        type: activityData.type || 'alert',
        title: activityData.title || 'Untitled Activity',
        location: activityData.location || 'Unknown Location',
        priority: activityData.priority || 'medium',
        description: activityData.description,
        building: activityData.building,
        zone: activityData.zone,
        assignedTo: activityData.assignedTo,
        confidence: activityData.confidence,
        createdBy: activityData.created_by || 'current-user'
      });
      return result;
    },
    
    updateActivity: async (id: string, updates: any) => {
      const result = await store.updateActivity({
        activityId: id,
        updates: {
          priority: updates.priority,
          status: updates.status,
          description: updates.description,
          assignedTo: updates.assignedTo,
          userTags: updates.user_tags
        },
        updatedBy: updates.updated_by || 'current-user',
        reason: updates.reason
      });
      return result;
    },
    
    // Keep existing filter and pagination methods
    setFilters: (filters: any) => {
      // Convert old filter format to new query format
      store.getActivities({
        filters: {
          types: filters.types,
          statuses: filters.statuses,
          priorities: filters.priorities,
          buildings: filters.sites, // Map sites to buildings
          searchText: filters.searchQuery,
          isArchived: !filters.showArchived ? false : undefined,
          dateRange: filters.dateRange?.start ? {
            start: filters.dateRange.start,
            end: filters.dateRange.end || new Date()
          } : undefined
        }
      });
    }
  };
};

export const useMigratedIncidentStore = () => {
  const newStore = useNewIncidentStore();
  const store = newStore();
  
  return {
    // New CQRS methods
    ...store,
    
    // Legacy compatibility
    incidents: Array.from(store.cachedIncidents.values()),
    
    createIncident: async (incidentData: any) => {
      const result = await store.createIncident({
        title: incidentData.title || 'Untitled Incident',
        description: incidentData.description || '',
        type: incidentData.type || 'other',
        priority: incidentData.priority || 'medium',
        trigger_activity_id: incidentData.trigger_activity_id || '',
        site_id: incidentData.site_id || 'SITE-001',
        site_name: incidentData.site_name || 'Main Campus',
        created_by: incidentData.created_by || 'current-user',
        auto_created: incidentData.auto_created || false,
        requires_validation: incidentData.requires_validation || false
      });
      return result;
    },
    
    updateIncident: async (id: string, updates: any) => {
      const result = await store.updateIncident({
        incidentId: id,
        updates: {
          status: updates.status,
          priority: updates.priority,
          assigned_to: updates.assigned_to,
          description: updates.description,
          business_impact: updates.business_impact,
          resolution_summary: updates.resolution_summary
        },
        updated_by: updates.updated_by || 'current-user',
        reason: updates.reason
      });
      return result;
    }
  };
};

// Development tools for debugging
export const useStorageDebugTools = () => {
  const { storage } = useServiceIntegration();
  
  return {
    getEventHistory: () => storage?.eventBus.getEventHistory(),
    getActivityCacheStats: () => storage?.stores.activity.getState().getCacheStats(),
    getIncidentStats: () => storage?.stores.incident.getState().getIncidentStats(),
    clearAllCaches: () => {
      storage?.stores.activity.getState().invalidateCache();
      storage?.stores.incident.getState().invalidateIncidentCache();
    },
    enableDebugMode: () => storage?.eventBus.setDebugMode(true),
    disableDebugMode: () => storage?.eventBus.setDebugMode(false)
  };
};