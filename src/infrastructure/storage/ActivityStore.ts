/**
 * Domain-Specific Activity Store
 * Implements CQRS architecture with clean separation of commands and queries
 * Integrates with Activity domain entities and use cases from Phase 1
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Activity } from '../../domains/activities/entities/Activity';
import { CreateActivityUseCase, ActivityCreationHelper } from '../../domains/activities/use-cases/CreateActivity';
import { FilterActivitiesUseCase } from '../../domains/activities/use-cases/FilterActivities';
import { ClusterActivitiesUseCase } from '../../domains/activities/use-cases/ClusterActivities';
import { IActivityRepository, ActivityQuery, ActivityStats } from '../../domains/activities/repositories/IActivityRepository';
import { 
  eventBus, 
  createActivityEvent, 
  ActivityCreatedEvent, 
  ActivityStatusUpdatedEvent,
  ActivityAssignedEvent,
  ActivityArchivedEvent 
} from './EventBus';
import { Priority, Status } from '../../../lib/utils/status';
import { ActivityType } from '../../../lib/utils/security';

// ===== COMMAND INTERFACES =====

export interface CreateActivityCommand {
  type: ActivityType;
  title: string;
  location: string;
  priority: Priority;
  description?: string;
  building?: string;
  zone?: string;
  assignedTo?: string;
  confidence?: number;
  externalData?: {
    sourceSystem: string;
    originalType: string;
    rawPayload: Record<string, any>;
  };
  createdBy: string;
}

export interface UpdateActivityCommand {
  activityId: string;
  updates: {
    priority?: Priority;
    status?: Status;
    description?: string;
    assignedTo?: string;
    userTags?: string[];
  };
  updatedBy: string;
  reason?: string;
}

export interface AssignActivityCommand {
  activityId: string;
  assignedTo: string;
  assignedBy: string;
}

export interface ArchiveActivityCommand {
  activityId: string;
  reason: string;
  archivedBy: string;
}

export interface BulkStatusUpdateCommand {
  activityIds: string[];
  status: Status;
  updatedBy: string;
  reason?: string;
}

// ===== QUERY INTERFACES =====

export interface ActivityListQuery {
  filters?: {
    types?: ActivityType[];
    statuses?: Status[];
    priorities?: Priority[];
    buildings?: string[];
    zones?: string[];
    assignedTo?: string[];
    createdBy?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    searchText?: string;
    hasIncidentContext?: boolean;
    isArchived?: boolean;
    confidenceThreshold?: number;
  };
  pagination?: {
    offset: number;
    limit: number;
  };
  sorting?: {
    field: 'timestamp' | 'priority' | 'updated_at' | 'title';
    order: 'asc' | 'desc';
  };
}

export interface ActivityClusterQuery {
  activityId: string;
  timeWindowMinutes?: number;
  locationRadius?: number;
  includeArchived?: boolean;
}

// ===== STATE INTERFACES =====

export interface ActivityCommandState {
  // Command execution state
  isExecutingCommand: boolean;
  lastCommandResult: {
    success: boolean;
    error?: string;
    commandType?: string;
    timestamp: Date;
  } | null;
  
  // Optimistic updates
  optimisticUpdates: Map<string, Partial<Activity>>;
  
  // Command queue for offline support
  pendingCommands: Array<{
    id: string;
    command: any;
    timestamp: Date;
    retryCount: number;
  }>;
}

export interface ActivityQueryState {
  // Cached query results
  cachedActivities: Map<string, Activity>;
  cachedQueries: Map<string, {
    query: ActivityListQuery;
    results: Activity[];
    timestamp: Date;
    totalCount: number;
  }>;
  
  // Real-time subscriptions
  activeSubscriptions: Set<string>;
  
  // Query execution state
  isExecutingQuery: boolean;
  lastQueryError: string | null;
  
  // Statistics cache
  cachedStats: {
    stats: ActivityStats | null;
    timestamp: Date | null;
    query: ActivityQuery | null;
  };
}

export interface ActivityRealtimeState {
  // Real-time updates enabled
  realtimeEnabled: boolean;
  
  // Event subscriptions
  eventSubscriptionId: string | null;
  
  // Live activity feed
  recentActivities: Activity[];
  recentActivitiesLimit: number;
  
  // Connection state
  isConnected: boolean;
  lastHeartbeat: Date | null;
}

// ===== COMMAND ACTIONS =====

export interface ActivityCommandActions {
  // Basic CRUD commands
  createActivity: (command: CreateActivityCommand) => Promise<{ success: bool

活动ean; activityId?: string; error?: string }>;
  updateActivity: (command: UpdateActivityCommand) => Promise<{ success: boolean; error?: string }>;
  assignActivity: (command: AssignActivityCommand) => Promise<{ success: boolean; error?: string }>;
  archiveActivity: (command: ArchiveActivityCommand) => Promise<{ success: boolean; error?: string }>;
  
  // Bulk operations
  bulkUpdateStatus: (command: BulkStatusUpdateCommand) => Promise<{ success: boolean; failedIds?: string[]; error?: string }>;
  bulkArchive: (activityIds: string[], reason: string, archivedBy: string) => Promise<{ success: boolean; failedIds?: string[]; error?: string }>;
  
  // External system integration
  createFromWebhook: (webhookData: any, createdBy?: string) => Promise<{ success: boolean; activityId?: string; error?: string }>;
  createFromSecurityAlert: (alertData: any, createdBy?: string) => Promise<{ success: boolean; activityId?: string; error?: string }>;
  
  // Command queue management
  retryFailedCommands: () => Promise<void>;
  clearCommandQueue: () => void;
  
  // Optimistic update management
  applyOptimisticUpdate: (activityId: string, updates: Partial<Activity>) => void;
  revertOptimisticUpdate: (activityId: string) => void;
  clearOptimisticUpdates: () => void;
}

// ===== QUERY ACTIONS =====

export interface ActivityQueryActions {
  // Basic queries
  getActivities: (query?: ActivityListQuery) => Promise<{
    activities: Activity[];
    totalCount: number;
    hasMore: boolean;
  }>;
  getActivityById: (id: string) => Promise<Activity | null>;
  getActivitiesByIds: (ids: string[]) => Promise<Activity[]>;
  
  // Specialized queries
  getActivitiesRequiringAttention: () => Promise<Activity[]>;
  getOverdueActivities: () => Promise<Activity[]>;
  getRelatedActivities: (activityId: string, timeWindowMinutes?: number) => Promise<Activity[]>;
  getActivitiesForClustering: (query: ActivityClusterQuery) => Promise<Activity[]>;
  
  // Search and filtering
  searchActivities: (searchText: string, filters?: ActivityListQuery['filters']) => Promise<Activity[]>;
  getFilteredActivities: (filters: ActivityListQuery['filters']) => Promise<Activity[]>;
  
  // Statistics and analytics
  getActivityStats: (query?: ActivityQuery) => Promise<ActivityStats>;
  getActivityTimeline: (start: Date, end: Date, bucketSize: 'hour' | 'day' | 'week') => Promise<Array<{
    timestamp: Date;
    count: number;
    byPriority: Record<Priority, number>;
  }>>;
  getTopLocations: (limit?: number, timeRange?: { start: Date; end: Date }) => Promise<Array<{
    location: string;
    building?: string;
    zone?: string;
    count: number;
  }>>;
  
  // Cache management
  invalidateCache: (pattern?: string) => void;
  preloadActivities: (query: ActivityListQuery) => Promise<void>;
  getCacheStats: () => {
    cachedActivitiesCount: number;
    cachedQueriesCount: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
}

// ===== REAL-TIME ACTIONS =====

export interface ActivityRealtimeActions {
  // Real-time subscriptions
  enableRealtime: () => Promise<void>;
  disableRealtime: () => Promise<void>;
  subscribeToActivity: (activityId: string, callback: (activity: Activity) => void) => string;
  unsubscribeFromActivity: (subscriptionId: string) => void;
  
  // Live feed management
  getRecentActivities: (limit?: number) => Activity[];
  setRecentActivitiesLimit: (limit: number) => void;
  clearRecentActivities: () => void;
  
  // Connection management
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<void>;
  getConnectionStatus: () => {
    isConnected: boolean;
    lastHeartbeat: Date | null;
    uptime: number;
  };
}

// ===== MAIN STORE TYPE =====

export type ActivityStore = 
  & ActivityCommandState 
  & ActivityQueryState 
  & ActivityRealtimeState 
  & ActivityCommandActions 
  & ActivityQueryActions 
  & ActivityRealtimeActions;

// ===== STORE IMPLEMENTATION =====

export const useActivityStore = create<ActivityStore>()(
  subscribeWithSelector((set, get) => {
    // Service instances (injected via DI)
    let activityRepository: IActivityRepository;
    let createActivityUseCase: CreateActivityUseCase;
    let filterActivitiesUseCase: FilterActivitiesUseCase;
    let clusterActivitiesUseCase: ClusterActivitiesUseCase;
    let activityCreationHelper: ActivityCreationHelper;

    // Initialize services
    const initializeServices = (repository: IActivityRepository) => {
      activityRepository = repository;
      createActivityUseCase = new CreateActivityUseCase(repository);
      filterActivitiesUseCase = new FilterActivitiesUseCase(repository);
      clusterActivitiesUseCase = new ClusterActivitiesUseCase(repository);
      activityCreationHelper = new ActivityCreationHelper(createActivityUseCase);
    };

    // Event handlers
    const handleActivityEvent = (event: ActivityCreatedEvent | ActivityStatusUpdatedEvent | ActivityAssignedEvent | ActivityArchivedEvent) => {
      const state = get();
      
      switch (event.type) {
        case 'activity.created':
          // Invalidate relevant caches
          get().invalidateCache('activities');
          
          // Add to recent activities if realtime enabled
          if (state.realtimeEnabled && event.data.activityId) {
            // Fetch the full activity and add to recent activities
            get().getActivityById(event.data.activityId).then(activity => {
              if (activity) {
                const recent = [activity, ...state.recentActivities]
                  .slice(0, state.recentActivitiesLimit);
                set({ recentActivities: recent });
              }
            });
          }
          break;
          
        case 'activity.status_updated':
        case 'activity.assigned':
          // Update cached activity if exists
          const { cachedActivities } = get();
          if (cachedActivities.has(event.aggregateId)) {
            get().getActivityById(event.aggregateId).then(activity => {
              if (activity) {
                cachedActivities.set(event.aggregateId, activity);
                set({ cachedActivities: new Map(cachedActivities) });
              }
            });
          }
          
          // Invalidate query caches
          get().invalidateCache('queries');
          break;
          
        case 'activity.archived':
          // Remove from caches
          const newCachedActivities = new Map(get().cachedActivities);
          newCachedActivities.delete(event.aggregateId);
          set({ cachedActivities: newCachedActivities });
          
          // Invalidate all caches
          get().invalidateCache();
          break;
      }
    };

    return {
      // ===== INITIAL STATE =====
      
      // Command state
      isExecutingCommand: false,
      lastCommandResult: null,
      optimisticUpdates: new Map(),
      pendingCommands: [],
      
      // Query state
      cachedActivities: new Map(),
      cachedQueries: new Map(),
      activeSubscriptions: new Set(),
      isExecutingQuery: false,
      lastQueryError: null,
      cachedStats: {
        stats: null,
        timestamp: null,
        query: null
      },
      
      // Realtime state
      realtimeEnabled: false,
      eventSubscriptionId: null,
      recentActivities: [],
      recentActivitiesLimit: 50,
      isConnected: false,
      lastHeartbeat: null,
      
      // ===== COMMAND ACTIONS =====
      
      createActivity: async (command: CreateActivityCommand) => {
        if (!createActivityUseCase) {
          return { success: false, error: 'Activity service not initialized' };
        }
        
        set({ isExecutingCommand: true });
        
        try {
          const result = await createActivityUseCase.execute({
            ...command,
            createdBy: command.createdBy
          });
          
          const commandResult = {
            success: result.success,
            error: result.error || result.validationErrors?.join(', '),
            commandType: 'createActivity',
            timestamp: new Date()
          };
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: commandResult
          });
          
          if (result.success && result.activity) {
            // Publish domain event
            eventBus.publish(createActivityEvent.created({
              activityId: result.activity.id,
              activityType: result.activity.type,
              priority: result.activity.priority,
              status: result.activity.status,
              location: result.activity.location,
              building: result.activity.building,
              zone: result.activity.zone,
              confidence: result.activity.confidence
            }, command.createdBy));
            
            return { 
              success: true, 
              activityId: result.activity.id 
            };
          }
          
          return { 
            success: false, 
            error: result.error || result.validationErrors?.join(', ') 
          };
          
        } catch (error) {
          const commandResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            commandType: 'createActivity',
            timestamp: new Date()
          };
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: commandResult
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      updateActivity: async (command: UpdateActivityCommand) => {
        if (!activityRepository) {
          return { success: false, error: 'Activity repository not initialized' };
        }
        
        set({ isExecutingCommand: true });
        
        // Apply optimistic update
        if (command.updates) {
          get().applyOptimisticUpdate(command.activityId, command.updates as Partial<Activity>);
        }
        
        try {
          const activity = await activityRepository.findById(command.activityId);
          if (!activity) {
            get().revertOptimisticUpdate(command.activityId);
            return { success: false, error: 'Activity not found' };
          }
          
          // Apply updates to domain entity
          if (command.updates.status && command.updates.status !== activity.status) {
            activity.updateStatus(command.updates.status, command.updatedBy);
          }
          
          if (command.updates.assignedTo && command.updates.assignedTo !== activity.assignedTo) {
            activity.assignTo(command.updates.assignedTo, command.updatedBy);
          }
          
          if (command.updates.userTags) {
            // Clear existing user tags and add new ones
            command.updates.userTags.forEach(tag => activity.addUserTag(tag));
          }
          
          // Persist the updated activity
          await activityRepository.update(activity);
          
          // Publish appropriate domain events
          if (command.updates.status) {
            eventBus.publish(createActivityEvent.statusUpdated({
              activityId: command.activityId,
              previousStatus: activity.status, // This needs to be tracked
              newStatus: command.updates.status,
              updatedBy: command.updatedBy,
              reason: command.reason
            }, command.updatedBy));
          }
          
          if (command.updates.assignedTo) {
            eventBus.publish(createActivityEvent.assigned({
              activityId: command.activityId,
              previousAssignee: activity.assignedTo,
              newAssignee: command.updates.assignedTo,
              assignedBy: command.updatedBy
            }, command.updatedBy));
          }
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'updateActivity',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          // Revert optimistic update on failure
          get().revertOptimisticUpdate(command.activityId);
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'updateActivity',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      assignActivity: async (command: AssignActivityCommand) => {
        return get().updateActivity({
          activityId: command.activityId,
          updates: { 
            assignedTo: command.assignedTo,
            status: 'assigned' as Status 
          },
          updatedBy: command.assignedBy
        });
      },
      
      archiveActivity: async (command: ArchiveActivityCommand) => {
        if (!activityRepository) {
          return { success: false, error: 'Activity repository not initialized' };
        }
        
        set({ isExecutingCommand: true });
        
        try {
          const activity = await activityRepository.findById(command.activityId);
          if (!activity) {
            return { success: false, error: 'Activity not found' };
          }
          
          activity.archive(command.reason, command.archivedBy);
          await activityRepository.update(activity);
          
          // Publish domain event
          eventBus.publish(createActivityEvent.archived({
            activityId: command.activityId,
            reason: command.reason,
            archivedBy: command.archivedBy
          }, command.archivedBy));
          
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: true,
              commandType: 'archiveActivity',
              timestamp: new Date()
            }
          });
          
          return { success: true };
          
        } catch (error) {
          set({ 
            isExecutingCommand: false,
            lastCommandResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              commandType: 'archiveActivity',
              timestamp: new Date()
            }
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      bulkUpdateStatus: async (command: BulkStatusUpdateCommand) => {
        const results = await Promise.allSettled(
          command.activityIds.map(activityId =>
            get().updateActivity({
              activityId,
              updates: { status: command.status },
              updatedBy: command.updatedBy,
              reason: command.reason
            })
          )
        );
        
        const failedIds: string[] = [];
        results.forEach((result, index) => {
          if (result.status === 'rejected' || !result.value.success) {
            failedIds.push(command.activityIds[index]);
          }
        });
        
        return {
          success: failedIds.length === 0,
          failedIds: failedIds.length > 0 ? failedIds : undefined,
          error: failedIds.length > 0 ? `Failed to update ${failedIds.length} activities` : undefined
        };
      },
      
      bulkArchive: async (activityIds: string[], reason: string, archivedBy: string) => {
        const results = await Promise.allSettled(
          activityIds.map(activityId =>
            get().archiveActivity({ activityId, reason, archivedBy })
          )
        );
        
        const failedIds: string[] = [];
        results.forEach((result, index) => {
          if (result.status === 'rejected' || !result.value.success) {
            failedIds.push(activityIds[index]);
          }
        });
        
        return {
          success: failedIds.length === 0,
          failedIds: failedIds.length > 0 ? failedIds : undefined,
          error: failedIds.length > 0 ? `Failed to archive ${failedIds.length} activities` : undefined
        };
      },
      
      createFromWebhook: async (webhookData: any, createdBy: string = 'system') => {
        if (!activityCreationHelper) {
          return { success: false, error: 'Activity creation helper not initialized' };
        }
        
        try {
          const result = await activityCreationHelper.createFromWebhook(webhookData, createdBy);
          return {
            success: result.success,
            activityId: result.activity?.id,
            error: result.error || result.validationErrors?.join(', ')
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      createFromSecurityAlert: async (alertData: any, createdBy: string = 'security-system') => {
        if (!activityCreationHelper) {
          return { success: false, error: 'Activity creation helper not initialized' };
        }
        
        try {
          const result = await activityCreationHelper.createFromSecurityAlert(alertData, createdBy);
          return {
            success: result.success,
            activityId: result.activity?.id,
            error: result.error || result.validationErrors?.join(', ')
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      
      retryFailedCommands: async () => {
        const { pendingCommands } = get();
        const updatedCommands = [...pendingCommands];
        
        for (let i = updatedCommands.length - 1; i >= 0; i--) {
          const pendingCommand = updatedCommands[i];
          if (pendingCommand.retryCount < 3) {
            try {
              // Retry the command based on its type
              // This would need to be implemented based on command structure
              updatedCommands.splice(i, 1);
            } catch (error) {
              pendingCommand.retryCount++;
            }
          } else {
            // Remove command after max retries
            updatedCommands.splice(i, 1);
          }
        }
        
        set({ pendingCommands: updatedCommands });
      },
      
      clearCommandQueue: () => {
        set({ pendingCommands: [] });
      },
      
      applyOptimisticUpdate: (activityId: string, updates: Partial<Activity>) => {
        const { optimisticUpdates } = get();
        const newUpdates = new Map(optimisticUpdates);
        newUpdates.set(activityId, { ...newUpdates.get(activityId), ...updates });
        set({ optimisticUpdates: newUpdates });
      },
      
      revertOptimisticUpdate: (activityId: string) => {
        const { optimisticUpdates } = get();
        const newUpdates = new Map(optimisticUpdates);
        newUpdates.delete(activityId);
        set({ optimisticUpdates: newUpdates });
      },
      
      clearOptimisticUpdates: () => {
        set({ optimisticUpdates: new Map() });
      },
      
      // ===== QUERY ACTIONS =====
      
      getActivities: async (query?: ActivityListQuery) => {
        if (!filterActivitiesUseCase) {
          throw new Error('Filter activities use case not initialized');
        }
        
        set({ isExecutingQuery: true, lastQueryError: null });
        
        try {
          // Check cache first
          const cacheKey = JSON.stringify(query);
          const { cachedQueries } = get();
          const cached = cachedQueries.get(cacheKey);
          
          if (cached && Date.now() - cached.timestamp.getTime() < 30000) { // 30 second cache
            set({ isExecutingQuery: false });
            return {
              activities: cached.results,
              totalCount: cached.totalCount,
              hasMore: cached.results.length < cached.totalCount
            };
          }
          
          // Execute query
          const repositoryQuery: ActivityQuery = {
            ...(query?.filters && {
              type: query.filters.types,
              status: query.filters.statuses,
              priority: query.filters.priorities,
              building: query.filters.buildings,
              zone: query.filters.zones,
              assignedTo: query.filters.assignedTo,
              createdBy: query.filters.createdBy,
              timeRange: query.filters.dateRange,
              searchText: query.filters.searchText,
              hasIncidentContext: query.filters.hasIncidentContext,
              isArchived: query.filters.isArchived,
              confidenceThreshold: query.filters.confidenceThreshold
            }),
            limit: query?.pagination?.limit || 50,
            offset: query?.pagination?.offset || 0,
            sortBy: query?.sorting?.field || 'timestamp',
            sortOrder: query?.sorting?.order || 'desc'
          };
          
          const result = await filterActivitiesUseCase.execute(repositoryQuery);
          
          if (result.success && result.activities) {
            // Cache the result
            const newCachedQueries = new Map(cachedQueries);
            newCachedQueries.set(cacheKey, {
              query: query || {},
              results: result.activities,
              timestamp: new Date(),
              totalCount: result.totalCount || result.activities.length
            });
            
            // Update cached activities
            const { cachedActivities } = get();
            const newCachedActivities = new Map(cachedActivities);
            result.activities.forEach(activity => {
              newCachedActivities.set(activity.id, activity);
            });
            
            set({ 
              isExecutingQuery: false,
              cachedQueries: newCachedQueries,
              cachedActivities: newCachedActivities
            });
            
            return {
              activities: result.activities,
              totalCount: result.totalCount || result.activities.length,
              hasMore: (query?.pagination?.offset || 0) + result.activities.length < (result.totalCount || result.activities.length)
            };
          } else {
            throw new Error(result.error || 'Failed to execute query');
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ 
            isExecutingQuery: false,
            lastQueryError: errorMessage
          });
          throw error;
        }
      },
      
      getActivityById: async (id: string) => {
        const { cachedActivities } = get();
        
        // Check cache first
        if (cachedActivities.has(id)) {
          return cachedActivities.get(id)!;
        }
        
        if (!activityRepository) {
          return null;
        }
        
        try {
          const activity = await activityRepository.findById(id);
          
          if (activity) {
            // Cache the result
            const newCachedActivities = new Map(cachedActivities);
            newCachedActivities.set(id, activity);
            set({ cachedActivities: newCachedActivities });
          }
          
          return activity;
        } catch (error) {
          console.error('Error fetching activity by ID:', error);
          return null;
        }
      },
      
      getActivitiesByIds: async (ids: string[]) => {
        const { cachedActivities } = get();
        const results: Activity[] = [];
        const uncachedIds: string[] = [];
        
        // Check cache first
        ids.forEach(id => {
          if (cachedActivities.has(id)) {
            results.push(cachedActivities.get(id)!);
          } else {
            uncachedIds.push(id);
          }
        });
        
        // Fetch uncached activities
        if (uncachedIds.length > 0 && activityRepository) {
          try {
            const uncachedActivities = await activityRepository.findByIds(uncachedIds);
            
            // Cache the results
            const newCachedActivities = new Map(cachedActivities  );
            uncachedActivities.forEach(activity => {
              newCachedActivities.set(activity.id, activity);
              results.push(activity);
            });
            
            set({ cachedActivities: newCachedActivities });
          } catch (error) {
            console.error('Error fetching activities by IDs:', error);
          }
        }
        
        return results;
      },
      
      getActivitiesRequiringAttention: async () => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        return await activityRepository.findRequiringAttention();
      },
      
      getOverdueActivities: async () => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        return await activityRepository.findOverdue();
      },
      
      getRelatedActivities: async (activityId: string, timeWindowMinutes?: number) => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        return await activityRepository.findRelated(activityId, timeWindowMinutes);
      },
      
      getActivitiesForClustering: async (query: ActivityClusterQuery) => {
        if (!clusterActivitiesUseCase) {
          throw new Error('Cluster activities use case not initialized');
        }
        
        const result = await clusterActivitiesUseCase.execute({
          activityId: query.activityId,
          timeWindowMinutes: query.timeWindowMinutes || 30,
          includeArchived: query.includeArchived || false
        });
        
        if (result.success && result.clusters) {
          // Return all activities from clusters
          return result.clusters.flatMap(cluster => cluster.activities);
        }
        
        return [];
      },
      
      searchActivities: async (searchText: string, filters?: ActivityListQuery['filters']) => {
        return (await get().getActivities({
          filters: {
            ...filters,
            searchText
          }
        })).activities;
      },
      
      getFilteredActivities: async (filters: ActivityListQuery['filters']) => {
        return (await get().getActivities({ filters })).activities;
      },
      
      getActivityStats: async (query?: ActivityQuery) => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        // Check cache
        const { cachedStats } = get();
        const cacheKey = JSON.stringify(query);
        
        if (cachedStats.stats && cachedStats.timestamp && 
            Date.now() - cachedStats.timestamp.getTime() < 60000 && // 1 minute cache
            JSON.stringify(cachedStats.query) === cacheKey) {
          return cachedStats.stats;
        }
        
        // Fetch fresh stats
        const stats = await activityRepository.getStats(query);
        
        set({
          cachedStats: {
            stats,
            timestamp: new Date(),
            query
          }
        });
        
        return stats;
      },
      
      getActivityTimeline: async (start: Date, end: Date, bucketSize: 'hour' | 'day' | 'week') => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        return await activityRepository.getActivityTimeline(start, end, bucketSize);
      },
      
      getTopLocations: async (limit?: number, timeRange?: { start: Date; end: Date }) => {
        if (!activityRepository) {
          throw new Error('Activity repository not initialized');
        }
        
        return await activityRepository.getTopLocations(limit, timeRange);
      },
      
      invalidateCache: (pattern?: string) => {
        const { cachedActivities, cachedQueries } = get();
        
        if (pattern === 'activities') {
          set({ cachedActivities: new Map() });
        } else if (pattern === 'queries') {
          set({ cachedQueries: new Map() });
        } else if (pattern === 'stats') {
          set({ cachedStats: { stats: null, timestamp: null, query: null } });
        } else {
          // Clear all caches
          set({ 
            cachedActivities: new Map(),
            cachedQueries: new Map(),
            cachedStats: { stats: null, timestamp: null, query: null }
          });
        }
      },
      
      preloadActivities: async (query: ActivityListQuery) => {
        await get().getActivities(query);
      },
      
      getCacheStats: () => {
        const { cachedActivities, cachedQueries } = get();
        
        return {
          cachedActivitiesCount: cachedActivities.size,
          cachedQueriesCount: cachedQueries.size,
          cacheHitRate: 0, // Would need to track hits/misses
          memoryUsage: JSON.stringify([
            Array.from(cachedActivities.values()),
            Array.from(cachedQueries.values())
          ]).length
        };
      },
      
      // ===== REAL-TIME ACTIONS =====
      
      enableRealtime: async () => {
        if (get().realtimeEnabled) return;
        
        // Subscribe to activity events
        const subscriptionId = eventBus.subscribe(
          handleActivityEvent,
          { aggregate: 'activity' }
        );
        
        set({ 
          realtimeEnabled: true,
          eventSubscriptionId: subscriptionId,
          isConnected: true,
          lastHeartbeat: new Date()
        });
      },
      
      disableRealtime: async () => {
        const { eventSubscriptionId } = get();
        
        if (eventSubscriptionId) {
          eventBus.unsubscribe(eventSubscriptionId);
        }
        
        set({ 
          realtimeEnabled: false,
          eventSubscriptionId: null,
          isConnected: false,
          lastHeartbeat: null
        });
      },
      
      subscribeToActivity: (activityId: string, callback: (activity: Activity) => void) => {
        const subscriptionId = eventBus.subscribe(
          (event) => {
            if (event.aggregateId === activityId) {
              // Fetch updated activity and call callback
              get().getActivityById(activityId).then(activity => {
                if (activity) callback(activity);
              });
            }
          },
          { aggregate: 'activity', aggregateId: activityId }
        );
        
        const { activeSubscriptions } = get();
        const newSubscriptions = new Set(activeSubscriptions);
        newSubscriptions.add(subscriptionId);
        set({ activeSubscriptions: newSubscriptions });
        
        return subscriptionId;
      },
      
      unsubscribeFromActivity: (subscriptionId: string) => {
        eventBus.unsubscribe(subscriptionId);
        
        const { activeSubscriptions } = get();
        const newSubscriptions = new Set(activeSubscriptions);
        newSubscriptions.delete(subscriptionId);
        set({ activeSubscriptions: newSubscriptions });
      },
      
      getRecentActivities: (limit?: number) => {
        const { recentActivities, recentActivitiesLimit } = get();
        return recentActivities.slice(0, limit || recentActivitiesLimit);
      },
      
      setRecentActivitiesLimit: (limit: number) => {
        set({ recentActivitiesLimit: limit });
        
        // Trim current recent activities if needed
        const { recentActivities } = get();
        if (recentActivities.length > limit) {
          set({ recentActivities: recentActivities.slice(0, limit) });
        }
      },
      
      clearRecentActivities: () => {
        set({ recentActivities: [] });
      },
      
      checkConnection: async () => {
        // Implement health check if needed
        return get().isConnected;
      },
      
      reconnect: async () => {
        if (get().realtimeEnabled) {
          await get().disableRealtime();
          await get().enableRealtime();
        }
      },
      
      getConnectionStatus: () => {
        const { isConnected, lastHeartbeat } = get();
        return {
          isConnected,
          lastHeartbeat,
          uptime: lastHeartbeat ? Date.now() - lastHeartbeat.getTime() : 0
        };
      }
    };
  })
);

// Dependency injection helper
export const initializeActivityStore = (repository: IActivityRepository) => {
  // This would be called from the service provider to inject dependencies
  const store = useActivityStore.getState();
  (store as any).initializeServices?.(repository);
};