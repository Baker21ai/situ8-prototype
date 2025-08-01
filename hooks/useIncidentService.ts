import { useState } from 'react';
import { useServices, createAuditContext } from '../services/ServiceProvider';
import { useAuditStore } from '../stores/auditStore';
import { useIncidentStore } from '../stores/incidentStore';
import type { Incident, IncidentStatus, IncidentPriority } from '../lib/types/incident';

interface CreateIncidentData {
  type: 'fire_emergency' | 'medical_emergency' | 'security_breach' | 'property_damage' | 'other';
  priority: IncidentPriority;
  location: string;
  description: string;
  source: string;
  details?: Record<string, any>;
}

interface UpdateIncidentData {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedTo?: string;
  notes?: string;
}

export const useIncidentService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { services } = useServices();
  const { logAction } = useAuditStore();
  const { addIncident, updateIncident: storeUpdateIncident } = useIncidentStore();

  const createIncident = async (data: CreateIncidentData): Promise<Incident> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.incidentService.createIncident(data, auditContext);
      
      if (response.success && response.data) {
        // Log success to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'create_incident',
          entity_type: 'incident',
          entity_id: response.data.id,
          description: `Created ${data.type} incident: ${data.description}`,
          metadata: {
            priority: data.priority,
            location: data.location,
            source: data.source
          }
        });

        // Update store
        addIncident(response.data);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create incident');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'create_incident_failed',
        entity_type: 'incident',
        description: `Failed to create incident: ${errorMessage}`,
        metadata: { error: errorMessage, requestData: data }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateIncident = async (incidentId: string, data: UpdateIncidentData): Promise<Incident> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.incidentService.updateIncident(incidentId, data, auditContext);
      
      if (response.success && response.data) {
        // Log success to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'update_incident',
          entity_type: 'incident',
          entity_id: incidentId,
          description: `Updated incident: ${Object.keys(data).join(', ')}`,
          metadata: { updates: data }
        });

        // Update store
        storeUpdateIncident(incidentId, data);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update incident');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'update_incident_failed',
        entity_type: 'incident',
        entity_id: incidentId,
        description: `Failed to update incident: ${errorMessage}`,
        metadata: { error: errorMessage, requestData: data }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchIncidents = async (query: string): Promise<Incident[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.incidentService.searchIncidents(query, auditContext);
      
      if (response.success && response.data) {
        // Log search to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'search_incidents',
          entity_type: 'incident',
          description: `Searched incidents: "${query}" (${response.data.length} results)`,
          metadata: { query, resultCount: response.data.length }
        });
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search incidents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'search_incidents_failed',
        entity_type: 'incident',
        description: `Failed to search incidents: ${errorMessage}`,
        metadata: { error: errorMessage, query }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    createIncident,
    updateIncident,
    searchIncidents,
    loading,
    error,
    clearError
  };
};