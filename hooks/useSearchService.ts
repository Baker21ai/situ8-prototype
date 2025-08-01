import { useState } from 'react';
import { useServices, createAuditContext } from '../services/ServiceProvider';
import { useAuditStore } from '../stores/auditStore';
import type { EnterpriseActivity } from '../lib/types/activity';
import type { Incident } from '../lib/types/incident';
import type { Case } from '../lib/types/case';

interface SearchFilters {
  entityTypes?: ('activities' | 'incidents' | 'cases')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  priority?: string[];
  location?: string;
  tags?: string[];
}

interface SearchResults {
  activities: EnterpriseActivity[];
  incidents: Incident[];
  cases: Case[];
  totalCount: number;
}

export const useSearchService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { services } = useServices();
  const { logAction } = useAuditStore();

  const searchAll = async (query: string, filters?: SearchFilters): Promise<SearchResults> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const entityTypes = filters?.entityTypes || ['activities', 'incidents', 'cases'];
      
      const results: SearchResults = {
        activities: [],
        incidents: [],
        cases: [],
        totalCount: 0
      };

      // Search activities if requested
      if (entityTypes.includes('activities')) {
        try {
          const activityResponse = await services.activityService.searchActivities(query, auditContext);
          if (activityResponse.success && activityResponse.data) {
            results.activities = activityResponse.data;
          }
        } catch (err) {
          console.warn('Activity search failed:', err);
        }
      }

      // Search incidents if requested
      if (entityTypes.includes('incidents')) {
        try {
          const incidentResponse = await services.incidentService.searchIncidents(query, auditContext);
          if (incidentResponse.success && incidentResponse.data) {
            results.incidents = incidentResponse.data;
          }
        } catch (err) {
          console.warn('Incident search failed:', err);
        }
      }

      // Search cases if requested
      if (entityTypes.includes('cases')) {
        try {
          const caseResponse = await services.caseService.searchCases(query, auditContext);
          if (caseResponse.success && caseResponse.data) {
            results.cases = caseResponse.data;
          }
        } catch (err) {
          console.warn('Case search failed:', err);
        }
      }

      // Apply additional filters if provided
      if (filters) {
        results.activities = applyFiltersToActivities(results.activities, filters);
        results.incidents = applyFiltersToIncidents(results.incidents, filters);
        results.cases = applyFiltersToCases(results.cases, filters);
      }

      results.totalCount = results.activities.length + results.incidents.length + results.cases.length;

      // Log successful search
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'search_all',
        entity_type: 'search',
        description: `Global search: "${query}" (${results.totalCount} results)`,
        metadata: { 
          query, 
          entityTypes, 
          filters,
          resultCounts: {
            activities: results.activities.length,
            incidents: results.incidents.length,
            cases: results.cases.length
          }
        }
      });
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'search_all_failed',
        entity_type: 'search',
        description: `Global search failed: ${errorMessage}`,
        metadata: { error: errorMessage, query, filters }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchTodaysIncidents = async (): Promise<Incident[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await searchAll('', {
      entityTypes: ['incidents'],
      dateRange: { start: today, end: tomorrow }
    });

    return results.incidents;
  };

  const searchByLocation = async (location: string): Promise<SearchResults> => {
    return searchAll(location, { location });
  };

  const searchByPriority = async (priority: string): Promise<SearchResults> => {
    return searchAll('', { priority: [priority] });
  };

  const searchByStatus = async (status: string): Promise<SearchResults> => {
    return searchAll('', { status: [status] });
  };

  const clearError = () => setError(null);

  return {
    searchAll,
    searchTodaysIncidents,
    searchByLocation,
    searchByPriority,
    searchByStatus,
    loading,
    error,
    clearError
  };
};

// Helper functions to apply filters
function applyFiltersToActivities(activities: EnterpriseActivity[], filters: SearchFilters): EnterpriseActivity[] {
  return activities.filter(activity => {
    // Date range filter
    if (filters.dateRange) {
      const activityDate = new Date(activity.timestamp);
      if (activityDate < filters.dateRange.start || activityDate > filters.dateRange.end) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(activity.status)) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(activity.priority)) {
        return false;
      }
    }

    // Location filter
    if (filters.location) {
      if (!activity.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const activityTags = activity.tags || [];
      if (!filters.tags.some(tag => activityTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

function applyFiltersToIncidents(incidents: Incident[], filters: SearchFilters): Incident[] {
  return incidents.filter(incident => {
    // Date range filter
    if (filters.dateRange) {
      const incidentDate = new Date(incident.timestamp);
      if (incidentDate < filters.dateRange.start || incidentDate > filters.dateRange.end) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(incident.status)) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(incident.priority)) {
        return false;
      }
    }

    // Location filter
    if (filters.location) {
      if (!incident.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

function applyFiltersToCases(cases: Case[], filters: SearchFilters): Case[] {
  return cases.filter(caseItem => {
    // Date range filter
    if (filters.dateRange) {
      const caseDate = new Date(caseItem.created_at);
      if (caseDate < filters.dateRange.start || caseDate > filters.dateRange.end) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(caseItem.status)) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(caseItem.priority)) {
        return false;
      }
    }

    return true;
  });
}