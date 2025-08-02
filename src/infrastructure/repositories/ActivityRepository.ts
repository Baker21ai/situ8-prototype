/**
 * Activity Repository Implementation
 * Uses Zustand stores as persistence layer with proper serialization
 * Implements IActivityRepository interface with caching and error handling
 */

import { Activity } from '../../domains/activities/entities/Activity';
import { 
  IActivityRepository, 
  ActivityQuery, 
  ActivityStats, 
  BatchResult, 
  ActivityRepositoryEvent,
  ActivityRepositoryError,
  ActivityRepositoryConfig
} from '../../domains/activities/repositories/IActivityRepository';
import { eventBus, createActivityEvent } from '../storage/EventBus';
import { Priority, Status } from '../../../lib/utils/status';
import { ActivityType } from '../../../lib/utils/security';

// ===== STORAGE INTERFACES =====

interface StoredActivity {
  id: string;
  snapshot: any; // Serialized activity snapshot
  metadata: {
    created_at: Date;
    updated_at: Date;
    version: number;
    checksum: string;
  };
}

interface ActivityStorage {
  activities: Map<string, StoredActivity>;
  indexes: {
    byType: Map<ActivityType, Set<string>>;
    byStatus: Map<Status, Set<string>>;
    byPriority: Map<Priority, Set<string>>;
    byAssignee: Map<string, Set<string>>;
    byBuilding: Map<string, Set<string>>;
    byZone: Map<string, Set<string>>;
    byCreatedBy: Map<string, Set<string>>;
    byTimestamp: Array<{ timestamp: Date; id: string }>;
    byIncidentContext: Map<string, Set<string>>;
  };
  metadata: {
    totalCount: number;
    lastUpdate: Date;
    version: number;
  };
}

// ===== REPOSITORY IMPLEMENTATION =====

export class ActivityRepository implements IActivityRepository {
  private storage: ActivityStorage;
  private config: ActivityRepositoryConfig;
  private subscribers: Map<string, (event: ActivityRepositoryEvent) => void> = new Map();
  private cache: Map<string, { activity: Activity; timestamp: Date }> = new Map();
  private isInitialized: boolean = false;

  constructor(config: ActivityRepositoryConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 30000, // 30 seconds
      enableSearchIndex: true,
      batchSize: 100,
      defaultRetentionDays: 30,
      autoArchiveEnabled: false,
      enableRealTimeUpdates: true,
      maxSubscribers: 100,
      ...config
    };

    this.storage = this.initializeStorage();
    this.setupEventHandlers();
  }

  private initializeStorage(): ActivityStorage {
    return {
      activities: new Map(),
      indexes: {
        byType: new Map(),
        byStatus: new Map(),
        byPriority: new Map(),
        byAssignee: new Map(),
        byBuilding: new Map(),
        byZone: new Map(),
        byCreatedBy: new Map(),
        byTimestamp: [],
        byIncidentContext: new Map()
      },
      metadata: {
        totalCount: 0,
        lastUpdate: new Date(),
        version: 1
      }
    };
  }

  private setupEventHandlers(): void {
    // Listen to domain events to maintain cache consistency
    eventBus.subscribe((event) => {
      if (event.aggregate === 'activity') {
        this.handleActivityEvent(event as any);
      }
    }, { aggregate: 'activity' });
  }

  private handleActivityEvent(event: any): void {
    // Invalidate cache for the affected activity
    this.cache.delete(event.aggregateId);
    
    // Notify subscribers
    const repositoryEvent: ActivityRepositoryEvent = this.mapToRepositoryEvent(event);
    this.notifySubscribers(repositoryEvent);
  }

  private mapToRepositoryEvent(domainEvent: any): ActivityRepositoryEvent {
    switch (domainEvent.type) {
      case 'activity.created':
        return {
          type: 'created',
          activity: this.findByIdSync(domainEvent.aggregateId)!
        };
      case 'activity.status_updated':
      case 'activity.assigned':
        return {
          type: 'updated',
          activity: this.findByIdSync(domainEvent.aggregateId)!,
          previousSnapshot: null // Would need to track this
        };
      case 'activity.archived':
        return {
          type: 'archived',
          activityId: domainEvent.aggregateId
        };
      default:
        throw new Error(`Unknown event type: ${domainEvent.type}`);
    }
  }

  private notifySubscribers(event: ActivityRepositoryEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in repository event subscriber:', error);
      }
    });
  }

  private findByIdSync(id: string): Activity | null {
    const stored = this.storage.activities.get(id);
    if (!stored) return null;

    try {
      return Activity.fromSnapshot(stored.snapshot);
    } catch (error) {
      console.error(`Error deserializing activity ${id}:`, error);
      return null;
    }
  }

  private calculateChecksum(activity: Activity): string {
    return btoa(JSON.stringify(activity.toSnapshot())).slice(0, 16);
  }

  private addToIndexes(activity: Activity): void {
    const { indexes } = this.storage;

    // Type index
    if (!indexes.byType.has(activity.type)) {
      indexes.byType.set(activity.type, new Set());
    }
    indexes.byType.get(activity.type)!.add(activity.id);

    // Status index
    if (!indexes.byStatus.has(activity.status)) {
      indexes.byStatus.set(activity.status, new Set());
    }
    indexes.byStatus.get(activity.status)!.add(activity.id);

    // Priority index
    if (!indexes.byPriority.has(activity.priority)) {
      indexes.byPriority.set(activity.priority, new Set());
    }
    indexes.byPriority.get(activity.priority)!.add(activity.id);

    // Assignee index
    if (activity.assignedTo) {
      if (!indexes.byAssignee.has(activity.assignedTo)) {
        indexes.byAssignee.set(activity.assignedTo, new Set());
      }
      indexes.byAssignee.get(activity.assignedTo)!.add(activity.id);
    }

    // Building index
    if (activity.building) {
      if (!indexes.byBuilding.has(activity.building)) {
        indexes.byBuilding.set(activity.building, new Set());
      }
      indexes.byBuilding.get(activity.building)!.add(activity.id);
    }

    // Zone index
    if (activity.zone) {
      if (!indexes.byZone.has(activity.zone)) {
        indexes.byZone.set(activity.zone, new Set());
      }
      indexes.byZone.get(activity.zone)!.add(activity.id);
    }

    // Created by index
    if (!indexes.byCreatedBy.has(activity.created_by)) {
      indexes.byCreatedBy.set(activity.created_by, new Set());
    }
    indexes.byCreatedBy.get(activity.created_by)!.add(activity.id);

    // Timestamp index (sorted)
    const timestampEntry = { timestamp: activity.timestamp, id: activity.id };
    const insertIndex = indexes.byTimestamp.findIndex(
      entry => entry.timestamp < activity.timestamp
    );
    
    if (insertIndex === -1) {
      indexes.byTimestamp.push(timestampEntry);
    } else {
      indexes.byTimestamp.splice(insertIndex, 0, timestampEntry);
    }

    // Incident context index
    activity.incident_contexts.forEach(incidentId => {
      if (!indexes.byIncidentContext.has(incidentId)) {
        indexes.byIncidentContext.set(incidentId, new Set());
      }
      indexes.byIncidentContext.get(incidentId)!.add(activity.id);
    });
  }

  private removeFromIndexes(activityId: string, oldActivity?: Activity): void {
    const { indexes } = this.storage;

    if (oldActivity) {
      // Remove from specific indexes
      indexes.byType.get(oldActivity.type)?.delete(activityId);
      indexes.byStatus.get(oldActivity.status)?.delete(activityId);
      indexes.byPriority.get(oldActivity.priority)?.delete(activityId);
      
      if (oldActivity.assignedTo) {
        indexes.byAssignee.get(oldActivity.assignedTo)?.delete(activityId);
      }
      
      if (oldActivity.building) {
        indexes.byBuilding.get(oldActivity.building)?.delete(activityId);
      }
      
      if (oldActivity.zone) {
        indexes.byZone.get(oldActivity.zone)?.delete(activityId);
      }
      
      indexes.byCreatedBy.get(oldActivity.created_by)?.delete(activityId);
      
      // Remove from timestamp index
      const timestampIndex = indexes.byTimestamp.findIndex(entry => entry.id === activityId);
      if (timestampIndex !== -1) {
        indexes.byTimestamp.splice(timestampIndex, 1);
      }
      
      // Remove from incident context indexes
      oldActivity.incident_contexts.forEach(incidentId => {
        indexes.byIncidentContext.get(incidentId)?.delete(activityId);
      });
    } else {
      // Brute force removal if no old activity provided
      indexes.byType.forEach(set => set.delete(activityId));
      indexes.byStatus.forEach(set => set.delete(activityId));
      indexes.byPriority.forEach(set => set.delete(activityId));
      indexes.byAssignee.forEach(set => set.delete(activityId));
      indexes.byBuilding.forEach(set => set.delete(activityId));
      indexes.byZone.forEach(set => set.delete(activityId));
      indexes.byCreatedBy.forEach(set => set.delete(activityId));
      indexes.byIncidentContext.forEach(set => set.delete(activityId));
      
      const timestampIndex = indexes.byTimestamp.findIndex(entry => entry.id === activityId);
      if (timestampIndex !== -1) {
        indexes.byTimestamp.splice(timestampIndex, 1);
      }
    }
  }

  private getFromCache(id: string): Activity | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(id);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp.getTime() > (this.config.cacheTimeout || 30000)) {
      this.cache.delete(id);
      return null;
    }

    return cached.activity;
  }

  private addToCache(activity: Activity): void {
    if (!this.config.enableCaching) return;

    this.cache.set(activity.id, {
      activity,
      timestamp: new Date()
    });

    // Prevent cache from growing too large
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private applyQuery(activities: Activity[], query: ActivityQuery): Activity[] {
    let filtered = activities;

    // Apply filters
    if (query.ids) {
      filtered = filtered.filter(a => query.ids!.includes(a.id));
    }

    if (query.priority) {
      filtered = filtered.filter(a => query.priority!.includes(a.priority));
    }

    if (query.status) {
      filtered = filtered.filter(a => query.status!.includes(a.status));
    }

    if (query.type) {
      filtered = filtered.filter(a => query.type!.includes(a.type));
    }

    if (query.assignedTo) {
      filtered = filtered.filter(a => a.assignedTo && query.assignedTo!.includes(a.assignedTo));
    }

    if (query.building) {
      filtered = filtered.filter(a => a.building && query.building!.includes(a.building));
    }

    if (query.zone) {
      filtered = filtered.filter(a => a.zone && query.zone!.includes(a.zone));
    }

    if (query.createdBy) {
      filtered = filtered.filter(a => query.createdBy!.includes(a.created_by));
    }

    if (query.timeRange) {
      filtered = filtered.filter(a => 
        a.timestamp >= query.timeRange!.start && a.timestamp <= query.timeRange!.end
      );
    }

    if (query.hasIncidentContext !== undefined) {
      filtered = filtered.filter(a => 
        query.hasIncidentContext ? a.incident_contexts.length > 0 : a.incident_contexts.length === 0
      );
    }

    if (query.isArchived !== undefined) {
      filtered = filtered.filter(a => a.is_archived === query.isArchived);
    }

    if (query.confidenceThreshold !== undefined) {
      filtered = filtered.filter(a => (a.confidence || 0) >= query.confidenceThreshold!);
    }

    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      filtered = filtered.filter(a => {
        const searchableText = [
          a.title,
          a.description,
          a.location,
          a.id,
          a.assignedTo,
          ...a.system_tags,
          ...a.user_tags
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
    }

    // Apply sorting
    if (query.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (query.sortBy) {
          case 'timestamp':
            aValue = a.timestamp;
            bValue = b.timestamp;
            break;
          case 'priority':
            const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
            break;
          case 'updated_at':
            aValue = a.updated_at;
            bValue = b.updated_at;
            break;
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return query.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return query.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (query.offset !== undefined && query.limit !== undefined) {
      filtered = filtered.slice(query.offset, query.offset + query.limit);
    } else if (query.limit !== undefined) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  // ===== INTERFACE IMPLEMENTATION =====

  async create(activity: Activity): Promise<Activity> {
    if (!activity.isValid()) {
      throw new ActivityRepositoryError(
        'Activity validation failed',
        'VALIDATION_ERROR',
        { activity: activity.toSnapshot() }
      );
    }

    // Check if activity already exists
    if (this.storage.activities.has(activity.id)) {
      throw new ActivityRepositoryError(
        `Activity with ID ${activity.id} already exists`,
        'CONSTRAINT_VIOLATION',
        { activityId: activity.id }
      );
    }

    try {
      const snapshot = activity.toSnapshot();
      const stored: StoredActivity = {
        id: activity.id,
        snapshot,
        metadata: {
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          checksum: this.calculateChecksum(activity)
        }
      };

      this.storage.activities.set(activity.id, stored);
      this.addToIndexes(activity);
      this.addToCache(activity);
      
      this.storage.metadata.totalCount++;
      this.storage.metadata.lastUpdate = new Date();
      this.storage.metadata.version++;

      return activity;
    } catch (error) {
      throw new ActivityRepositoryError(
        'Failed to create activity',
        'INTERNAL_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async createBatch(activities: Activity[]): Promise<BatchResult<Activity>> {
    const successful: Activity[] = [];
    const failed: Array<{ item: Activity; error: string }> = [];

    for (const activity of activities) {
      try {
        const created = await this.create(activity);
        successful.push(created);
      } catch (error) {
        failed.push({
          item: activity,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  async findById(id: string): Promise<Activity | null> {
    // Check cache first
    const cached = this.getFromCache(id);
    if (cached) return cached;

    const stored = this.storage.activities.get(id);
    if (!stored) return null;

    try {
      const activity = Activity.fromSnapshot(stored.snapshot);
      this.addToCache(activity);
      return activity;
    } catch (error) {
      console.error(`Error deserializing activity ${id}:`, error);
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Activity[]> {
    const activities: Activity[] = [];

    for (const id of ids) {
      const activity = await this.findById(id);
      if (activity) {
        activities.push(activity);
      }
    }

    return activities;
  }

  async update(activity: Activity): Promise<Activity> {
    if (!activity.isValid()) {
      throw new ActivityRepositoryError(
        'Activity validation failed',
        'VALIDATION_ERROR',
        { activity: activity.toSnapshot() }
      );
    }

    const existing = this.storage.activities.get(activity.id);
    if (!existing) {
      throw new ActivityRepositoryError(
        `Activity with ID ${activity.id} not found`,
        'NOT_FOUND',
        { activityId: activity.id }
      );
    }

    try {
      const oldActivity = Activity.fromSnapshot(existing.snapshot);
      const snapshot = activity.toSnapshot();
      
      const updated: StoredActivity = {
        ...existing,
        snapshot,
        metadata: {
          ...existing.metadata,
          updated_at: new Date(),
          version: existing.metadata.version + 1,
          checksum: this.calculateChecksum(activity)
        }
      };

      this.storage.activities.set(activity.id, updated);
      
      // Update indexes
      this.removeFromIndexes(activity.id, oldActivity);
      this.addToIndexes(activity);
      
      // Update cache
      this.addToCache(activity);
      
      this.storage.metadata.lastUpdate = new Date();
      this.storage.metadata.version++;

      return activity;
    } catch (error) {
      throw new ActivityRepositoryError(
        'Failed to update activity',
        'INTERNAL_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async updateBatch(activities: Activity[]): Promise<BatchResult<Activity>> {
    const successful: Activity[] = [];
    const failed: Array<{ item: Activity; error: string }> = [];

    for (const activity of activities) {
      try {
        const updated = await this.update(activity);
        successful.push(updated);
      } catch (error) {
        failed.push({
          item: activity,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  async delete(id: string): Promise<boolean> {
    const stored = this.storage.activities.get(id);
    if (!stored) return false;

    try {
      const activity = Activity.fromSnapshot(stored.snapshot);
      
      // Soft delete - mark as archived
      activity.archive('Deleted by repository', 'system');
      await this.update(activity);
      
      return true;
    } catch (error) {
      console.error(`Error soft deleting activity ${id}:`, error);
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    const stored = this.storage.activities.get(id);
    if (!stored) return false;

    try {
      const activity = Activity.fromSnapshot(stored.snapshot);
      
      this.storage.activities.delete(id);
      this.removeFromIndexes(id, activity);
      this.cache.delete(id);
      
      this.storage.metadata.totalCount--;
      this.storage.metadata.lastUpdate = new Date();
      this.storage.metadata.version++;
      
      return true;
    } catch (error) {
      console.error(`Error hard deleting activity ${id}:`, error);
      return false;
    }
  }

  async findMany(query: ActivityQuery): Promise<Activity[]> {
    try {
      // Get all activities (in real implementation, this would be optimized with indexes)
      const allActivities: Activity[] = [];
      
      for (const stored of this.storage.activities.values()) {
        try {
          const activity = Activity.fromSnapshot(stored.snapshot);
          allActivities.push(activity);
        } catch (error) {
          console.error(`Error deserializing activity ${stored.id}:`, error);
        }
      }

      return this.applyQuery(allActivities, query);
    } catch (error) {
      throw new ActivityRepositoryError(
        'Failed to execute query',
        'INTERNAL_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async count(query: ActivityQuery): Promise<number> {
    const activities = await this.findMany({ ...query, limit: undefined, offset: undefined });
    return activities.length;
  }

  async findWithPagination(query: ActivityQuery): Promise<{
    activities: Activity[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
  }> {
    const totalQuery = { ...query, limit: undefined, offset: undefined };
    const total = await this.count(totalQuery);
    
    const activities = await this.findMany(query);
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return {
      activities,
      total,
      hasMore: offset + activities.length < total,
      nextOffset: offset + activities.length < total ? offset + limit : undefined
    };
  }

  async findByPriority(priority: Priority, limit?: number): Promise<Activity[]> {
    return this.findMany({ priority: [priority], limit });
  }

  async findByStatus(status: Status, limit?: number): Promise<Activity[]> {
    return this.findMany({ status: [status], limit });
  }

  async findByType(type: ActivityType, limit?: number): Promise<Activity[]> {
    return this.findMany({ type: [type], limit });
  }

  async findByAssignee(userId: string, includeCompleted?: boolean): Promise<Activity[]> {
    const query: ActivityQuery = { assignedTo: [userId] };
    
    if (!includeCompleted) {
      query.status = ['detecting', 'assigned', 'responding'];
    }
    
    return this.findMany(query);
  }

  async findByLocation(building?: string, zone?: string, limit?: number): Promise<Activity[]> {
    const query: ActivityQuery = { limit };
    
    if (building) query.building = [building];
    if (zone) query.zone = [zone];
    
    return this.findMany(query);
  }

  async findByTimeRange(start: Date, end: Date, limit?: number): Promise<Activity[]> {
    return this.findMany({
      timeRange: { start, end },
      limit
    });
  }

  async search(searchText: string, limit?: number): Promise<Activity[]> {
    return this.findMany({ searchText, limit });
  }

  async findRequiringAttention(): Promise<Activity[]> {
    return this.findMany({
      priority: ['critical', 'high'],
      status: ['detecting', 'assigned']
    });
  }

  async findOverdue(): Promise<Activity[]> {
    const activities = await this.findMany({
      status: ['detecting', 'assigned', 'responding']
    });

    const now = new Date();
    return activities.filter(activity => {
      const hoursOld = (now.getTime() - activity.timestamp.getTime()) / (1000 * 60 * 60);
      const overdueThreshold = activity.priority === 'critical' ? 2 : 
                              activity.priority === 'high' ? 8 : 24;
      return hoursOld > overdueThreshold;
    });
  }

  async findEligibleForArchiving(): Promise<Activity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (this.config.defaultRetentionDays || 30));

    return this.findMany({
      status: ['resolved'],
      timeRange: { start: new Date(0), end: cutoffDate }
    });
  }

  async findWithIncidentContexts(incidentIds?: string[]): Promise<Activity[]> {
    if (incidentIds) {
      const activities: Activity[] = [];
      for (const incidentId of incidentIds) {
        const activityIds = this.storage.indexes.byIncidentContext.get(incidentId);
        if (activityIds) {
          for (const activityId of activityIds) {
            const activity = await this.findById(activityId);
            if (activity) activities.push(activity);
          }
        }
      }
      return activities;
    } else {
      return this.findMany({ hasIncidentContext: true });
    }
  }

  async findRelated(activityId: string, timeWindowMinutes?: number): Promise<Activity[]> {
    const activity = await this.findById(activityId);
    if (!activity) return [];

    const timeWindow = timeWindowMinutes || 30;
    const startTime = new Date(activity.timestamp.getTime() - timeWindow * 60 * 1000);
    const endTime = new Date(activity.timestamp.getTime() + timeWindow * 60 * 1000);

    const query: ActivityQuery = {
      timeRange: { start: startTime, end: endTime }
    };

    // Add location filters if available
    if (activity.building) query.building = [activity.building];
    if (activity.zone) query.zone = [activity.zone];

    const candidates = await this.findMany(query);
    
    // Exclude the original activity
    return candidates.filter(candidate => candidate.id !== activityId);
  }

  async findForClustering(timeWindowMinutes?: number): Promise<Activity[]> {
    const timeWindow = timeWindowMinutes || 30;
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 1000);

    return this.findMany({
      timeRange: { start: cutoffTime, end: new Date() },
      status: ['detecting', 'assigned']
    });
  }

  async findSuspiciousFalsePositives(threshold?: number): Promise<Activity[]> {
    const falsePositiveThreshold = threshold || 80;
    
    const activities = await this.findMany({});
    return activities.filter(activity => 
      (activity.falsePositiveLikelihood || 0) > falsePositiveThreshold
    );
  }

  async getStats(query?: ActivityQuery): Promise<ActivityStats> {
    const activities = query ? await this.findMany(query) : await this.findMany({});

    const stats: ActivityStats = {
      total: activities.length,
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byStatus: { detecting: 0, assigned: 0, responding: 0, resolved: 0 },
      byType: {} as Record<ActivityType, number>,
      byBuilding: {},
      averageResolutionTime: 0,
      averageConfidence: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    activities.forEach(activity => {
      // Priority stats
      stats.byPriority[activity.priority]++;
      
      // Status stats
      stats.byStatus[activity.status]++;
      
      // Type stats
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      
      // Building stats
      if (activity.building) {
        stats.byBuilding[activity.building] = (stats.byBuilding[activity.building] || 0) + 1;
      }
      
      // Resolution time (for resolved activities)
      if (activity.status === 'resolved') {
        const resolutionTime = activity.updated_at.getTime() - activity.timestamp.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
      
      // Confidence stats
      if (activity.confidence !== undefined) {
        totalConfidence += activity.confidence;
        confidenceCount++;
      }
    });

    stats.averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return stats;
  }

  async getActivityTimeline(
    start: Date,
    end: Date,
    bucketSize: 'hour' | 'day' | 'week'
  ): Promise<Array<{
    timestamp: Date;
    count: number;
    byPriority: Record<Priority, number>;
  }>> {
    const activities = await this.findByTimeRange(start, end);
    
    // Implementation would create time buckets and group activities
    // This is a simplified version
    const timeline: Array<{
      timestamp: Date;
      count: number;
      byPriority: Record<Priority, number>;
    }> = [];

    // Group by day for simplicity
    const buckets: Map<string, {
      count: number;
      byPriority: Record<Priority, number>;
    }> = new Map();

    activities.forEach(activity => {
      const dateKey = activity.timestamp.toISOString().split('T')[0];
      
      if (!buckets.has(dateKey)) {
        buckets.set(dateKey, {
          count: 0,
          byPriority: { low: 0, medium: 0, high: 0, critical: 0 }
        });
      }
      
      const bucket = buckets.get(dateKey)!;
      bucket.count++;
      bucket.byPriority[activity.priority]++;
    });

    buckets.forEach((bucket, dateKey) => {
      timeline.push({
        timestamp: new Date(dateKey),
        count: bucket.count,
        byPriority: bucket.byPriority
      });
    });

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getTopLocations(limit?: number, timeRange?: { start: Date; end: Date }): Promise<Array<{
    location: string;
    building?: string;
    zone?: string;
    count: number;
  }>> {
    const query: ActivityQuery = {};
    if (timeRange) query.timeRange = timeRange;
    
    const activities = await this.findMany(query);
    
    const locationCounts: Map<string, {
      location: string;
      building?: string;
      zone?: string;
      count: number;
    }> = new Map();

    activities.forEach(activity => {
      const key = `${activity.location}|${activity.building || ''}|${activity.zone || ''}`;
      
      if (!locationCounts.has(key)) {
        locationCounts.set(key, {
          location: activity.location,
          building: activity.building,
          zone: activity.zone,
          count: 0
        });
      }
      
      locationCounts.get(key)!.count++;
    });

    const results = Array.from(locationCounts.values())
      .sort((a, b) => b.count - a.count);

    return limit ? results.slice(0, limit) : results;
  }

  async getResolutionMetrics(timeRange?: { start: Date; end: Date }): Promise<{
    averageResolutionTime: number;
    resolutionTimeByPriority: Record<Priority, number>;
    resolutionRate: number;
  }> {
    const query: ActivityQuery = { status: ['resolved'] };
    if (timeRange) query.timeRange = timeRange;
    
    const resolvedActivities = await this.findMany(query);
    
    let totalResolutionTime = 0;
    const resolutionTimeByPriority: Record<Priority, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };
    const countByPriority: Record<Priority, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    resolvedActivities.forEach(activity => {
      const resolutionTime = activity.updated_at.getTime() - activity.timestamp.getTime();
      totalResolutionTime += resolutionTime;
      resolutionTimeByPriority[activity.priority] += resolutionTime;
      countByPriority[activity.priority]++;
    });

    // Calculate averages
    Object.keys(resolutionTimeByPriority).forEach(priority => {
      const p = priority as Priority;
      if (countByPriority[p] > 0) {
        resolutionTimeByPriority[p] = resolutionTimeByPriority[p] / countByPriority[p];
      }
    });

    // Calculate resolution rate (resolved vs total in time range)
    const allQuery: ActivityQuery = {};
    if (timeRange) allQuery.timeRange = timeRange;
    const totalActivities = await this.count(allQuery);
    
    const resolutionRate = totalActivities > 0 ? resolvedActivities.length / totalActivities : 0;

    return {
      averageResolutionTime: resolvedActivities.length > 0 ? totalResolutionTime / resolvedActivities.length : 0,
      resolutionTimeByPriority,
      resolutionRate
    };
  }

  async subscribe(
    callback: (event: ActivityRepositoryEvent) => void,
    filter?: ActivityQuery
  ): Promise<() => void> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Wrap callback with filter logic if provided
    const wrappedCallback = filter ? 
      (event: ActivityRepositoryEvent) => {
        // Apply filter logic here if needed
        callback(event);
      } : 
      callback;
    
    this.subscribers.set(subscriptionId, wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriptionId);
    };
  }

  async getRecent(minutes?: number, limit?: number): Promise<Activity[]> {
    const cutoffTime = new Date(Date.now() - (minutes || 30) * 60 * 1000);
    
    return this.findMany({
      timeRange: { start: cutoffTime, end: new Date() },
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  async *stream(query?: ActivityQuery): AsyncIterable<Activity> {
    const activities = await this.findMany(query || {});
    
    for (const activity of activities) {
      yield activity;
    }
  }

  async archiveExpired(): Promise<number> {
    if (!this.config.autoArchiveEnabled) return 0;
    
    const eligibleActivities = await this.findEligibleForArchiving();
    let archivedCount = 0;

    for (const activity of eligibleActivities) {
      try {
        activity.archive('Auto-archived due to retention policy', 'system');
        await this.update(activity);
        archivedCount++;
      } catch (error) {
        console.error(`Failed to archive activity ${activity.id}:`, error);
      }
    }

    return archivedCount;
  }

  async cleanupArchived(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const archivedActivities = await this.findMany({
      isArchived: true,
      timeRange: { start: new Date(0), end: cutoffDate }
    });

    let cleanedCount = 0;

    for (const activity of archivedActivities) {
      try {
        await this.hardDelete(activity.id);
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup archived activity ${activity.id}:`, error);
      }
    }

    return cleanedCount;
  }

  async rebuildSearchIndex(): Promise<void> {
    if (!this.config.enableSearchIndex) return;
    
    // Clear existing indexes
    this.storage.indexes = {
      byType: new Map(),
      byStatus: new Map(),
      byPriority: new Map(),
      byAssignee: new Map(),
      byBuilding: new Map(),
      byZone: new Map(),
      byCreatedBy: new Map(),
      byTimestamp: [],
      byIncidentContext: new Map()
    };

    // Rebuild indexes
    for (const stored of this.storage.activities.values()) {
      try {
        const activity = Activity.fromSnapshot(stored.snapshot);
        this.addToIndexes(activity);
      } catch (error) {
        console.error(`Error rebuilding index for activity ${stored.id}:`, error);
      }
    }
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    totalActivities: number;
    oldestActivity: Date;
    newestActivity: Date;
    indexStatus: 'healthy' | 'rebuilding' | 'error';
  }> {
    const totalActivities = this.storage.metadata.totalCount;
    
    let oldestActivity = new Date();
    let newestActivity = new Date(0);
    
    if (this.storage.indexes.byTimestamp.length > 0) {
      oldestActivity = this.storage.indexes.byTimestamp[this.storage.indexes.byTimestamp.length - 1].timestamp;
      newestActivity = this.storage.indexes.byTimestamp[0].timestamp;
    }

    return {
      isHealthy: true,
      totalActivities,
      oldestActivity,
      newestActivity,
      indexStatus: 'healthy'
    };
  }
}