import { useState } from 'react';
import { useServices, createAuditContext } from '../services/ServiceProvider';
import { useAuditStore } from '../stores/auditStore';
import { useActivityStore } from '../stores/activityStore';
import type { EnterpriseActivity, ActivityType, ActivityPriority, ActivityStatus } from '../lib/types/activity';

interface CreateActivityData {
  type: ActivityType;
  priority: ActivityPriority;
  location: string;
  description: string;
  source: string;
  status?: ActivityStatus;
  tags?: string[];
  details?: Record<string, any>;
}

interface UpdateActivityData {
  status?: ActivityStatus;
  priority?: ActivityPriority;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
}

export const useActivityService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { services } = useServices();
  const { logAction } = useAuditStore();
  const { addActivity, updateActivity: storeUpdateActivity } = useActivityStore();

  const createActivity = async (data: CreateActivityData): Promise<EnterpriseActivity> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.activityService.createActivity(data, auditContext);
      
      if (response.success && response.data) {
        // Log success to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'create_activity',
          entity_type: 'activity',
          entity_id: response.data.id,
          description: `Created ${data.type} activity: ${data.description}`,
          metadata: {
            priority: data.priority,
            location: data.location,
            source: data.source,
            tags: data.tags || []
          }
        });

        // Update store
        addActivity(response.data);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'create_activity_failed',
        entity_type: 'activity',
        description: `Failed to create activity: ${errorMessage}`,
        metadata: { error: errorMessage, requestData: data }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (activityId: string, data: UpdateActivityData): Promise<EnterpriseActivity> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.activityService.updateActivity(activityId, data, auditContext);
      
      if (response.success && response.data) {
        // Log success to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'update_activity',
          entity_type: 'activity',
          entity_id: activityId,
          description: `Updated activity: ${Object.keys(data).join(', ')}`,
          metadata: { updates: data }
        });

        // Update store
        storeUpdateActivity(activityId, data);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'update_activity_failed',
        entity_type: 'activity',
        entity_id: activityId,
        description: `Failed to update activity: ${errorMessage}`,
        metadata: { error: errorMessage, requestData: data }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchActivities = async (query: string): Promise<EnterpriseActivity[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.activityService.searchActivities(query, auditContext);
      
      if (response.success && response.data) {
        // Log search to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'search_activities',
          entity_type: 'activity',
          description: `Searched activities: "${query}" (${response.data.length} results)`,
          metadata: { query, resultCount: response.data.length }
        });
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search activities');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'search_activities_failed',
        entity_type: 'activity',
        description: `Failed to search activities: ${errorMessage}`,
        metadata: { error: errorMessage, query }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (activityId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const auditContext = createAuditContext('ai-assistant', 'AI Assistant');
      const response = await services.activityService.deleteActivity(activityId, auditContext);
      
      if (response.success) {
        // Log success to audit
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'delete_activity',
          entity_type: 'activity',
          entity_id: activityId,
          description: `Deleted activity: ${activityId}`,
        });

        // Update store (soft delete - set status to archived)
        storeUpdateActivity(activityId, { status: 'archived' });
      } else {
        throw new Error(response.message || 'Failed to delete activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log error to audit
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'delete_activity_failed',
        entity_type: 'activity',
        entity_id: activityId,
        description: `Failed to delete activity: ${errorMessage}`,
        metadata: { error: errorMessage }
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignActivity = async (activityId: string, assigneeId: string): Promise<EnterpriseActivity> => {
    return updateActivity(activityId, { assignedTo: assigneeId });
  };

  const addTags = async (activityId: string, tags: string[]): Promise<EnterpriseActivity> => {
    return updateActivity(activityId, { tags });
  };

  const clearError = () => setError(null);

  return {
    createActivity,
    updateActivity,
    searchActivities,
    deleteActivity,
    assignActivity,
    addTags,
    loading,
    error,
    clearError
  };
};