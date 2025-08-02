/**
 * Infrastructure Layer - Main Index
 * Exports all infrastructure components for the application
 */

// Storage Layer
export * from './storage';

// Repository Implementations
export * from './repositories/ActivityRepository';

// Service Integration
export * from './ServiceIntegration';

// Type Definitions
export type {
  StorageConfig,
  ActivityStore,
  IncidentStore,
  ActivityCommandActions,
  ActivityQueryActions,
  ActivityRealtimeActions,
  IncidentCommandActions,
  IncidentQueryActions,
  IncidentRealtimeActions
} from './storage';