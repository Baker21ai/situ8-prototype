/**
 * Activity Store - Manages all activity-related state and operations
 * Implements the business logic requirements for activities with service layer integration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActivityData, ActivityFilters, ActivityStats, ActivityCluster, EnterpriseActivity } from '../lib/types/activity';
import { Priority, Status } from '../lib/utils/status';
import { ActivityType } from '../lib/utils/security';
import { generateEnterpriseActivities, generateRealtimeActivity } from '../components/mock-data/enterpriseMockData.tsx';
import { ActivityService } from '../services/activity.service';
import { AuditService } from '../services/audit.service';
import { BOLService } from '../services/bol.service';
import { AuditContext } from '../services/types';
import { useUserStore } from './userStore';
import { useAlertStore } from './alertStore';
import { ambientAlertsToActivities, activityToAmbientAlert } from '../lib/adapters/ambientToActivity';
import { debug } from '../utils/debug';

// Type alias for Activity
type Activity = ActivityData | EnterpriseActivity;

// Helper function to create default audit context
const getDefaultAuditContext = (): AuditContext => {
  const { currentUser } = useUserStore.getState();
  return {
    userId: currentUser?.id || 'system',
    userName: currentUser?.email || 'System',
    userRole: currentUser?.role || 'admin',
    action: 'system_operation'
  };
};

// Helper function to ensure context is provided
const ensureContext = (context?: AuditContext): AuditContext => {
  return context || getDefaultAuditContext();
};

interface ActivityState {
  // Activity data
  activities: EnterpriseActivity[];
  filteredActivities: EnterpriseActivity[];
  selectedActivity: EnterpriseActivity | null;
  
  // Service instances
  activityService: ActivityService | null;
  auditService: AuditService | null;
  bolService: BOLService | null;
  
  // Ambient.AI integration
  ambientMode: boolean;
  ambientConnected: boolean;
  
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
  createActivity: (activity: Partial<EnterpriseActivity>, context: AuditContext) => Promise<EnterpriseActivity>;
  updateActivity: (id: string, updates: Partial<EnterpriseActivity>, context: AuditContext) => Promise<void>;
  deleteActivity: (id: string, context: AuditContext) => Promise<void>;
  selectActivity: (activity: EnterpriseActivity | null) => void;
  
  // Status management (with business logic compliance)
  updateActivityStatus: (id: string, status: Status, context: AuditContext, reason?: string) => Promise<void>;
  assignActivity: (id: string, assignedTo: string, context: AuditContext) => Promise<void>;
  
  // Ambient.AI integration
  enableAmbientMode: () => void;
  disableAmbientMode: () => void;
  syncWithAmbientAlerts: () => void;
  
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
    (set, get) => {
      // Initialize with empty state - activities will be loaded based on mode
      const initialActivities: EnterpriseActivity[] = [];
      const initialLastId = 0;
      
      return {
        // Initial state with immediate data
        activities: initialActivities,
        filteredActivities: initialActivities,
        selectedActivity: null,
        activityService: null,
        auditService: null,
        bolService: null,
        ambientMode: true,
        ambientConnected: false,
        realtimeEnabled: false,
        lastActivityId: initialLastId,
        filters: defaultFilters,
        pagination: { ...defaultPagination, total: initialActivities.length },
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
        const { activityService, ambientMode } = get();
        
        // If in ambient mode, sync with alerts instead of loading regular activities
        if (ambientMode) {
          console.log('🚫 loadActivities called but in ambient mode - syncing with alerts instead');
          get().syncWithAmbientAlerts();
          return;
        }
        
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
            console.log('📦 Loading mock enterprise activities (5000)');
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
      
      createActivity: async (activity: Partial<Activity>, context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          let newActivity: Activity;
          
          if (activityService) {
            const result = await activityService.createActivity(activity, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to create activity');
            }
            newActivity = result.data;
          } else {
            // Fallback creation with ensured context
            const safeContext = ensuredContext;
            const id = `ACT-${Date.now()}`;
            newActivity = {
              id,
              type: activity.type || 'note',
              title: activity.title || 'New Activity',
              description: activity.description || '',
              timestamp: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
              created_by: safeContext.userId,
              updated_by: safeContext.userId,
              status: 'detecting',
              priority: 'medium',
              system_tags: [],
              user_tags: [],
              incident_contexts: [],
              retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              is_archived: false,
              allowed_status_transitions: ['detecting', 'assigned', 'responding', 'resolved'],
              requires_approval: false,
              location: activity.location || 'Unknown',
              source: 'MANUAL' as const,
              ...activity
            };
          }
          
          set(state => ({
            activities: [newActivity, ...state.activities],
            loading: false,
            lastActivityId: parseInt(newActivity.id.split('-')[1]) || 0
          }));
          
          get().applyFilters();
          return newActivity;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create activity',
            loading: false 
          });
          throw error;
        }
      },
      
      updateActivity: async (id: string, updates: Partial<Activity>, context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          let updatedActivity: Activity;
          
          if (activityService) {
            const result = await activityService.updateActivity(id, updates, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to update activity');
            }
            updatedActivity = result.data;
          } else {
            // Fallback update with ensured context
            set(state => {
              const activity = state.activities.find(a => a.id === id);
              if (!activity) throw new Error('Activity not found');
              
              updatedActivity = {
                ...activity,
                ...updates,
                updated_by: ensuredContext.userId,
                updated_at: new Date()
              };
              
              return {
                activities: state.activities.map(a => 
                  a.id === id ? updatedActivity : a
                )
              };
            });
          }
          
          set({ loading: false });
          get().applyFilters();
          return updatedActivity;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update activity',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteActivity: async (id: string, context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.deleteActivity(id, ensuredContext);
            if (!result.success) {
              throw new Error(result.error?.message || 'Failed to delete activity');
            }
          }
          
          set(state => ({
            activities: state.activities.filter(activity => activity.id !== id),
            loading: false
          }));
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete activity',
            loading: false
          });
          throw error;
        }
      },
      
      selectActivity: (activity) => {
        set({ selectedActivity: activity });
      },
      
      // Status management with business logic
      updateActivityStatus: async (id: string, status: Status, context?: AuditContext, reason?: string) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.updateActivityStatus(id, status, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Status update not allowed');
            }
            
            set(state => ({
              activities: state.activities.map(activity =>
                activity.id === id ? result.data! : activity
              ),
              loading: false
            }));
          } else {
            await get().updateActivity(id, { status }, ensuredContext);
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update activity status',
            loading: false
          });
          throw error;
        }
      },
      
      assignActivity: async (id: string, assignedTo: string, context?: AuditContext) => {
        const { activityService, ambientMode } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.assignActivity(id, assignedTo, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to assign activity');
            }
            
            set(state => ({
              activities: state.activities.map(activity =>
                activity.id === id ? result.data! : activity
              ),
              loading: false
            }));
          } else {
            await get().updateActivity(id, { assignedTo, status: 'assigned' }, ensuredContext);
            
            // If in ambient mode, also update the corresponding alert
            if (ambientMode) {
              const alertStore = useAlertStore.getState();
              const activity = get().activities.find(a => a.id === id);
              if (activity && activity.ambient_alert_id) {
                // Find and update the corresponding alert
                alertStore.updateAlertAssignment(activity.ambient_alert_id, assignedTo);
              }
            }
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to assign activity',
            loading: false
          });
          throw error;
        }
      },
      
      updateTags: async (id: string, userTags: string[], context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.updateTags(id, userTags, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to update tags');
            }
            
            set(state => ({
              activities: state.activities.map(activity =>
                activity.id === id ? result.data! : activity
              ),
              loading: false
            }));
          } else {
            await get().updateActivity(id, { user_tags: userTags }, ensuredContext);
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update tags',
            loading: false
          });
          throw error;
        }
      },
      
      linkToIncident: async (activityId: string, incidentId: string, context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.linkToIncident(activityId, incidentId, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to link to incident');
            }
            
            set(state => ({
              activities: state.activities.map(activity =>
                activity.id === activityId ? result.data! : activity
              ),
              loading: false
            }));
          } else {
            const { activities } = get();
            const activity = activities.find(a => a.id === activityId);
            if (activity && !activity.incident_contexts.includes(incidentId)) {
              await get().updateActivity(activityId, {
                incident_contexts: [...activity.incident_contexts, incidentId]
              }, ensuredContext);
            }
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to link to incident',
            loading: false
          });
          throw error;
        }
      },
      
      unlinkFromIncident: async (activityId: string, incidentId: string, context?: AuditContext) => {
        const { activityService } = get();
        const ensuredContext = ensureContext(context);
        
        set({ loading: true, error: null });
        
        try {
          if (activityService) {
            const result = await activityService.unlinkFromIncident(activityId, incidentId, ensuredContext);
            if (!result.success || !result.data) {
              throw new Error(result.error?.message || 'Failed to unlink from incident');
            }
            
            set(state => ({
              activities: state.activities.map(activity =>
                activity.id === activityId ? result.data! : activity
              ),
              loading: false
            }));
          } else {
            const { activities } = get();
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
              await get().updateActivity(activityId, {
                incident_contexts: activity.incident_contexts.filter(id => id !== incidentId)
              }, ensuredContext);
            }
          }
          
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to unlink from incident',
            loading: false
          });
          throw error;
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
      
      // Real-time generation functions
      startRealtimeGeneration: () => {
        set({ realtimeEnabled: true });
        console.log('Real-time activity generation started');
      },
      
      stopRealtimeGeneration: () => {
        set({ realtimeEnabled: false });
        console.log('Real-time activity generation stopped');
      },
      
      generateRealtimeActivity: async () => {
        const { lastActivityId, realtimeEnabled } = get();
        if (!realtimeEnabled) return;
        
        const newId = lastActivityId + 1;
        const newActivity = {
          ...generateRealtimeActivity(newId),
          id: newId.toString(),
          timestamp: new Date(),
        };

        
        // Use system context through ensureContext
        await get().createActivity(newActivity, ensureContext());
      },
      
      // Ambient.AI integration methods
      enableAmbientMode: () => {
        set({ 
          ambientMode: true,
          ambientConnected: true
        });
        
        // Sync with Ambient alerts immediately
        get().syncWithAmbientAlerts();
      },
      
              disableAmbientMode: () => {
          set({ 
            ambientMode: false,
            ambientConnected: false
          });
          
          // Load regular activities when disabling Ambient mode
          get().loadActivities();
        },
      
      syncWithAmbientAlerts: () => {
        const { ambientMode } = get();
        console.log('🔄 syncWithAmbientAlerts called, ambientMode:', ambientMode);
        if (!ambientMode) return;
        
        try {
          // Get alerts from alert store
          const alertStore = useAlertStore.getState();
          const ambientAlerts = alertStore.alerts;
          console.log('📡 Found ambient alerts:', ambientAlerts.length);
          
          // Convert to activities
          const ambientActivities = ambientAlertsToActivities(ambientAlerts);
          console.log('🔄 Converted to activities:', ambientActivities.length);
          
          // Generate additional mock activities with full status range for demonstration
          // This ensures we have activities in all Kanban columns to show the complete incident flow
          const mockActivities = generateEnterpriseActivities(20); // Generate 20 mock activities
          console.log('🎭 Generated mock activities:', mockActivities.length);
          
          // Combine ambient and mock activities
          const allActivities = [...ambientActivities, ...mockActivities];
          console.log('🎯 Total activities for Kanban:', allActivities.length);
          
          set({ 
            activities: allActivities,
            filteredActivities: allActivities,
            ambientConnected: true,
            loading: false,
            error: null
          });
          
          get().applyFilters();
        } catch (error) {
          console.error('Failed to sync with Ambient alerts:', error);
          set({ 
            ambientConnected: false,
            error: 'Failed to sync with Ambient.AI'
          });
        }
      },
    };
  },
  {
    name: 'situ8-activity-store',
    // Only persist essential data, not derived state or service instances
    partialize: (state) => ({
      // Don't persist activities - always load fresh mock data
      filters: state.filters,
      pagination: state.pagination,
      sorting: state.sorting,
      realtimeEnabled: state.realtimeEnabled,
      lastActivityId: state.lastActivityId,
      ambientMode: state.ambientMode,
    }),
  }
));
