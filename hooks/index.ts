// Custom service hooks for AI assistant and other components
export { useIncidentService } from './useIncidentService';
export { useActivityService } from './useActivityService';
export { useSearchService } from './useSearchService';

// Re-export types for convenience
export type { 
  CreateIncidentData, 
  UpdateIncidentData 
} from './useIncidentService';

export type { 
  CreateActivityData, 
  UpdateActivityData 
} from './useActivityService';

export type { 
  SearchFilters, 
  SearchResults 
} from './useSearchService';