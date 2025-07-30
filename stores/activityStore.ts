/**
 * Activity Store - Manages all activity-related state and operations
 * Implements the business logic requirements for activities with service layer integration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnterpriseActivity } from '../lib/types/activity';
import { Priority, Status } from '../lib/utils/status';
import { ActivityType } from '../lib/utils/security';
import { generateEnterpriseActivities, generateRealtimeActivity } from '../components/enterpriseMockData';
import { ActivityService } from '../services/activity.service';
import { AuditService } from '../services/audit.service';
import { BOLService } from '../services/bol.service';
import { AuditContext } from '../services/types';

interface ActivityState {
  // Activity data
  activities: EnterpriseActivity[];
  filteredActivities: EnterpriseActivity[];
  selectedActivity: EnterpriseActivity | null;
  
  // Service instances
  activityService: ActivityService | null;
  auditService: AuditService | null;
  bolService: BOLService | null;
  
  // Real-time generation
  realtimeEnabled: boolean;
  lastActivityId: number;
  
  // Filters and search
  filters: {
    types: ActivityType[];
    statuses: Status[];
    priorities: Priority[];
    sites: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    searchQuery: string;
    showArchived: boolean;
  };
  
  // Pagination and sorting
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  sorting: {
    field: keyof EnterpriseActivity;
    direction: 'asc' | 'desc';
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
}

interface ActivityActions {
  // Service initialization
  initializeServices: () => void;
  
  // Activity management (service-backed)
  loadActivities: () => Promise<void>;
  createActivity: (activity: Partial<EnterpriseActivity>, context: AuditContext) => Promise<void>;
  updateActivity: (id: string, updates: Partial<EnterpriseActivity>, context: AuditContext) => Promise<void>;
  deleteActivity: (id: string, context: AuditContext) => Promise<void>;
  selectActivity: (activity: EnterpriseActivity | null) => void;
  
  // Status management (with business logic compliance)
  updateActivityStatus: (id: string, status: Status, context: AuditContext, reason?: string) => Promise<void>;
  assignActivity: (id: string, assignedTo: string, context: AuditContext) => Promise<void>;
  
  // Real-time operations
  startRealtimeGeneration: () => void;
  stopRealtimeGeneration: () => void;
  generateRealtimeActivity: () => Promise<void>;
  
  // Auto-tagging system
  updateTags: (id: string, userTags: string[], context: AuditContext) => Promise<void>;
  
  // Multi-incident support
  linkToIncident: (activityId: string, incidentId: string, context: AuditContext) => Promise<void>;
  unlinkFromIncident: (activityId: string, incidentId: string, context: AuditContext) => Promise<void>;
  
  // Filtering and search
  setFilters: (filters: Partial<ActivityState['filters']>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
  
  // Pagination and sorting
  setPagination: (pagination: Partial<ActivityState['pagination']>) => void;
  setSorting: (field: keyof EnterpriseActivity, direction: 'asc' | 'desc') => void;
  
  // Bulk operations
  bulkUpdateStatus: (ids: string[], status: Status, context: AuditContext) => Promise<void>;
  bulkArchive: (ids: string[], context: AuditContext) => Promise<void>;
  
  // Statistics and analytics
  getActivityStats: () => {
    total: number;
    byStatus: Record<Status, number>;
    byPriority: Record<Priority, number>;
    byType: Record<ActivityType, number>;
    todayCount: number;
    criticalCount: number;
  };
  
  // Utility functions
  resetStore: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ActivityStore = ActivityState & ActivityActions;

// Default state
const defaultFilters: ActivityState['filters'] = {
  types: [],
  statuses: [],
  priorities: [],
  sites: [],
  dateRange: { start: null, end: null },
  searchQuery: '',
  showArchived: false,
};

const defaultPagination: ActivityState['pagination'] = {
  page: 1,
  limit: 50,
  total: 0,
};

const defaultSorting: ActivityState['sorting'] = {
  field: 'timestamp',
  direction: 'desc',
};

// Helper functions
const applyFiltersToActivities = (
  activities: EnterpriseActivity[],
  filters: ActivityState['filters']
): EnterpriseActivity[] => {
  return activities.filter(activity => {
    // Type filter
    if (filters.types.length > 0 && !filters.types.includes(activity.type)) {
      return false;
    }
    
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(activity.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(activity.priority)) {
      return false;
    }
    
    // Site filter
    if (filters.sites.length > 0 && activity.metadata?.site) {
      if (!filters.sites.includes(activity.metadata.site)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange.start && activity.timestamp < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && activity.timestamp > filters.dateRange.end) {
      return false;
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        activity.title,
        activity.description,
        activity.location,
        activity.id,
        activity.assignedTo
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    
    // Archive filter
    if (!filters.showArchived && activity.is_archived) {
      return false;
    }
    
    return true;
  });
};

const sortActivities = (
  activities: EnterpriseActivity[],
  sorting: ActivityState['sorting']
): EnterpriseActivity[] => {
  return [...activities].sort((a, b) => {
    const aValue = a[sorting.field];
    const bValue = b[sorting.field];
    
    if (aValue === bValue) return 0;
    if (aValue === undefined && bValue !== undefined) return 1;
    if (aValue !== undefined && bValue === undefined) return -1;
    if (aValue === undefined && bValue === undefined) return 0;
    
    const comparison = (aValue as any) > (bValue as any) ? 1 : -1;
    return sorting.direction === 'asc' ? comparison : -comparison;
  });
};

// Create the store
export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activities: [],
      filteredActivities: [],
      selectedActivity: null,
      activityService: null,
      auditService: null,
      bolService: null,
      realtimeEnabled: false,
      lastActivityId: 0,
      filters: defaultFilters,
      pagination: defaultPagination,
      sorting: defaultSorting,
      loading: false,
      error: null,
      
      // Service initialization
      initializeServices: () => {
        const activityService = new ActivityService();
        const auditService = new AuditService();
        const bolService = new BOLService();
        
        set({ 
          activityService,
          auditService,
          bolService
        });
      },
      
      // Activity management
      loadActivities: async () => {
        const { activityService } = get();
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            // Use service to load activities
            const result = await activityService.findAll({
              limit: 5000,
              sortBy: 'timestamp',
              sortDirection: 'desc'
            });
            
            if (result.success && result.data) {
              const lastId = Math.max(...result.data.map(a => parseInt(a.id.split('-')[1]) || 0));
              
              set({ 
                activities: result.data,
                lastActivityId: lastId,
                loading: false 
              });
            } else {
              throw new Error(result.error?.message || 'Failed to load activities');
            }
          } else {
            // Fallback to mock data generation
            const activities = generateEnterpriseActivities(5000);
            const lastId = Math.max(...activities.map(a => parseInt(a.id.split('-')[1]) || 0));
            
            set({ 
              activities,
              lastActivityId: lastId,
              loading: false 
            });
          }
          
          // Apply current filters
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load activities',
            loading: false 
          });
        }
      },
      
      createActivity: async (activityData, context) => {
        const { activityService, activities, lastActivityId, bolService } = get();
        
        try {
          if (activityService) {
            // Use service to create activity with business logic
            const result = await activityService.createActivity(activityData, context);
            
            if (result.success && result.data) {
              set({ 
                activities: [result.data, ...activities],
                lastActivityId: parseInt(result.data.id.split('-')[1]) || lastActivityId
              });
              
              // Check for BOL matches if service is available
              if (bolService) {
                await bolService.checkNewActivity(result.data, context);
              }
            } else {
              throw new Error(result.error?.message || 'Failed to create activity');
            }
          } else {
            // Fallback to direct creation
            const newId = lastActivityId + 1;
            const newActivity: EnterpriseActivity = {
              id: `ACT-${newId.toString().padStart(6, '0')}`,
              timestamp: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
              created_by: context.userId,
              updated_by: context.userId,
              system_tags: [],
              user_tags: [],
              incident_contexts: [],
              retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              is_archived: false,
              allowed_status_transitions: ['detecting', 'assigned', 'responding', 'resolved'],
              requires_approval: false,
              type: 'alert',
              title: 'New Activity',
              location: 'Unknown Location',
              priority: 'medium',
              status: 'detecting',
              ...activityData,
            } as EnterpriseActivity;
            
            set({ 
              activities: [newActivity, ...activities],
              lastActivityId: newId 
            });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create activity'
          });
        }
      },
      
      updateActivity: async (id, updates, context) => {
        const { activityService, activities } = get();
        
        try {
          if (activityService) {
            // Use service to update activity with business logic
            const result = await activityService.updateActivity(id, updates, context);
            
            if (result.success && result.data) {
              const updatedActivities = activities.map(activity =>
                activity.id === id ? result.data! : activity
              );
              set({ activities: updatedActivities });
            } else {
              throw new Error(result.error?.message || 'Failed to update activity');
            }
          } else {
            // Fallback to direct update
            const updatedActivities = activities.map(activity =>
              activity.id === id 
                ? { 
                    ...activity, 
                    ...updates, 
                    updated_at: new Date(),
                    updated_by: context.userId
                  }
                : activity
            );
            set({ activities: updatedActivities });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update activity'
          });
        }
      },
      
      deleteActivity: async (id, context) => {
        const { activityService, activities } = get();
        
        try {
          if (activityService) {
            // Use service to delete activity (soft delete with business logic)
            const result = await activityService.deleteActivity(id, context);
            
            if (result.success) {
              // Remove from local state after successful service call
              const updatedActivities = activities.filter(activity => activity.id !== id);
              set({ activities: updatedActivities });
            } else {
              throw new Error(result.error?.message || 'Failed to delete activity');
            }
          } else {
            // Fallback to direct removal
            const updatedActivities = activities.filter(activity => activity.id !== id);
            set({ activities: updatedActivities });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete activity'
          });
        }
      },
      
      selectActivity: (activity) => {
        set({ selectedActivity: activity });
      },
      
      // Status management with business logic
      updateActivityStatus: async (id, status, context, reason) => {
        const { activityService } = get();
        
        try {
          if (activityService) {
            // Use service for status updates with role-based validation
            const result = await activityService.updateActivityStatus(id, status, context);
            
            if (result.success && result.data) {
              const { activities } = get();
              const updatedActivities = activities.map(activity =>
                activity.id === id ? result.data! : activity
              );
              set({ activities: updatedActivities });
              get().applyFilters();
            } else {
              throw new Error(result.error?.message || 'Status update not allowed');
            }
          } else {
            // Fallback to direct update
            await get().updateActivity(id, { status }, context);
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update activity status'
          });
        }
      },
      
      assignActivity: async (id, assignedTo, context) => {
        const { activityService } = get();
        
        try {
          if (activityService) {
            // Use service for assignment with business logic
            const result = await activityService.assignActivity(id, assignedTo, context);
            
            if (result.success && result.data) {
              const { activities } = get();
              const updatedActivities = activities.map(activity =>
                activity.id === id ? result.data! : activity
              );
              set({ activities: updatedActivities });
              get().applyFilters();
            } else {
              throw new Error(result.error?.message || 'Failed to assign activity');
            }
          } else {
            // Fallback to direct update
            await get().updateActivity(id, { assignedTo, status: 'assigned' }, context);
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to assign activity'
          });
        }
      },
      
      // Real-time operations
      startRealtimeGeneration: () => {
        set({ realtimeEnabled: true });
      },
      
      stopRealtimeGeneration: () => {
        set({ realtimeEnabled: false });
      },
      
      generateRealtimeActivity: async () => {
        const { lastActivityId, realtimeEnabled } = get();
        if (!realtimeEnabled) return;
        
        const newId = lastActivityId + 1;
        const newActivity = generateRealtimeActivity(newId);
        
        // Create default audit context for system-generated activities
        const systemContext: AuditContext = {
          userId: 'system',
          userName: 'System',
          userRole: 'admin',
          action: 'generate_realtime_activity',
          reason: 'Automated real-time activity generation'
        };
        
        await get().createActivity(newActivity, systemContext);
      },
      
      // Auto-tagging system
      updateTags: async (id, userTags, context) => {
        const { activityService } = get();
        
        try {
          if (activityService) {
            // Use service for tag updates with auto-tagging logic
            const result = await activityService.updateTags(id, userTags, context);
            
            if (result.success && result.data) {
              const { activities } = get();
              const updatedActivities = activities.map(activity =>
                activity.id === id ? result.data! : activity
              );
              set({ activities: updatedActivities });
              get().applyFilters();
            } else {
              throw new Error(result.error?.message || 'Failed to update tags');
            }
          } else {
            // Fallback to direct update
            await get().updateActivity(id, { user_tags: userTags }, context);
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update tags'
          });
        }
      },
      
      // Multi-incident support
      linkToIncident: async (activityId, incidentId, context) => {
        const { activityService } = get();
        
        try {
          if (activityService) {
            // Use service for incident linking with business logic
            const result = await activityService.linkToIncident(activityId, incidentId, context);
            
            if (result.success && result.data) {
              const { activities } = get();
              const updatedActivities = activities.map(activity =>
                activity.id === activityId ? result.data! : activity
              );
              set({ activities: updatedActivities });
              get().applyFilters();
            } else {
              throw new Error(result.error?.message || 'Failed to link to incident');
            }
          } else {
            // Fallback to direct update
            const { activities } = get();
            const activity = activities.find(a => a.id === activityId);
            if (activity && !activity.incident_contexts.includes(incidentId)) {
              await get().updateActivity(activityId, {
                incident_contexts: [...activity.incident_contexts, incidentId]
              }, context);
            }
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to link to incident'
          });
        }
      },
      
      unlinkFromIncident: async (activityId, incidentId, context) => {
        const { activityService } = get();
        
        try {
          if (activityService) {
            // Use service for incident unlinking with business logic
            const result = await activityService.unlinkFromIncident(activityId, incidentId, context);
            
            if (result.success && result.data) {
              const { activities } = get();
              const updatedActivities = activities.map(activity =>
                activity.id === activityId ? result.data! : activity
              );
              set({ activities: updatedActivities });
              get().applyFilters();
            } else {
              throw new Error(result.error?.message || 'Failed to unlink from incident');
            }
          } else {
            // Fallback to direct update
            const { activities } = get();
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
              await get().updateActivity(activityId, {
                incident_contexts: activity.incident_contexts.filter(id => id !== incidentId)
              }, context);
            }
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to unlink from incident'
          });
        }
      },
      
      // Filtering and search
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
        get().applyFilters();
      },
      
      clearFilters: () => {
        set({ filters: defaultFilters });
        get().applyFilters();
      },
      
      setSearchQuery: (query) => {
        set(state => ({
          filters: { ...state.filters, searchQuery: query }
        }));
        get().applyFilters();
      },
      
      applyFilters: () => {
        const { activities, filters, sorting } = get();
        let filtered = applyFiltersToActivities(activities, filters);
        filtered = sortActivities(filtered, sorting);
        
        set({ 
          filteredActivities: filtered,
          pagination: { ...get().pagination, total: filtered.length }
        });
      },
      
      // Pagination and sorting
      setPagination: (newPagination) => {
        set(state => ({
          pagination: { ...state.pagination, ...newPagination }
        }));
      },
      
      setSorting: (field, direction) => {
        set({ sorting: { field, direction } });
        get().applyFilters();
      },
      
      // Bulk operations
      bulkUpdateStatus: async (ids, status, context) => {
        const promises = ids.map(id => 
          get().updateActivityStatus(id, status, context)
        );
        
        try {
          await Promise.all(promises);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk update status'
          });
        }
      },
      
      bulkArchive: async (ids, context) => {
        const promises = ids.map(id => 
          get().updateActivity(id, {
            is_archived: true,
            archive_reason: 'Bulk archive operation'
          }, context)
        );
        
        try {
          await Promise.all(promises);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk archive'
          });
        }
      },
      
      // Statistics and analytics
      getActivityStats: () => {
        const { activities } = get();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return {
          total: activities.length,
          byStatus: activities.reduce((acc, activity) => {
            acc[activity.status] = (acc[activity.status] || 0) + 1;
            return acc;
          }, {} as Record<Status, number>),
          byPriority: activities.reduce((acc, activity) => {
            acc[activity.priority] = (acc[activity.priority] || 0) + 1;
            return acc;
          }, {} as Record<Priority, number>),
          byType: activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
          }, {} as Record<ActivityType, number>),
          todayCount: activities.filter(a => a.timestamp >= todayStart).length,
          criticalCount: activities.filter(a => a.priority === 'critical').length,
        };
      },
      
      // Utility functions
      resetStore: () => {
        set({
          activities: [],
          filteredActivities: [],
          selectedActivity: null,
          filters: defaultFilters,
          pagination: defaultPagination,
          sorting: defaultSorting,
          loading: false,
          error: null,
        });
      },
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'situ8-activity-store',
      // Only persist essential data, not derived state or service instances
      partialize: (state) => ({
        activities: state.activities,
        filters: state.filters,
        pagination: state.pagination,
        sorting: state.sorting,
        realtimeEnabled: state.realtimeEnabled,
        lastActivityId: state.lastActivityId,
      }),
    }
  )
);