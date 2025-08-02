/**
 * Activity Repository Interface
 * Defines the contract for activity data access operations
 * Following Repository Pattern with async operations
 */

import { Activity } from '../entities/Activity';
import { Priority, Status } from '../../../../lib/utils/status';
import { ActivityType } from '../../../../lib/utils/security';

// Query objects for complex filtering
export interface ActivityQuery {
  ids?: string[];
  priority?: Priority[];
  status?: Status[];
  type?: ActivityType[];
  assignedTo?: string[];
  building?: string[];
  zone?: string[];
  createdBy?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  hasIncidentContext?: boolean;
  isArchived?: boolean;
  confidenceThreshold?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'priority' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Aggregation results
export interface ActivityStats {
  total: number;
  byPriority: Record<Priority, number>;
  byStatus: Record<Status, number>;
  byType: Record<ActivityType, number>;
  byBuilding: Record<string, number>;
  averageResolutionTime: number;
  averageConfidence: number;
}

// Batch operation results
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
}

// Repository interface with comprehensive CRUD and query operations
export interface IActivityRepository {
  // ===== BASIC CRUD OPERATIONS =====
  
  /**
   * Create a new activity
   */
  create(activity: Activity): Promise<Activity>;

  /**
   * Create multiple activities in a batch
   */
  createBatch(activities: Activity[]): Promise<BatchResult<Activity>>;

  /**
   * Find activity by ID
   */
  findById(id: string): Promise<Activity | null>;

  /**
   * Find multiple activities by IDs
   */
  findByIds(ids: string[]): Promise<Activity[]>;

  /**
   * Update existing activity
   */
  update(activity: Activity): Promise<Activity>;

  /**
   * Update multiple activities in a batch
   */
  updateBatch(activities: Activity[]): Promise<BatchResult<Activity>>;

  /**
   * Delete activity by ID (soft delete - mark as archived)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Hard delete activity (permanent removal)
   */
  hardDelete(id: string): Promise<boolean>;

  // ===== QUERY OPERATIONS =====

  /**
   * Find activities matching query criteria
   */
  findMany(query: ActivityQuery): Promise<Activity[]>;

  /**
   * Count activities matching query criteria
   */
  count(query: ActivityQuery): Promise<number>;

  /**
   * Find activities with pagination
   */
  findWithPagination(query: ActivityQuery): Promise<{
    activities: Activity[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
  }>;

  /**
   * Find activities by priority with limit
   */
  findByPriority(priority: Priority, limit?: number): Promise<Activity[]>;

  /**
   * Find activities by status
   */
  findByStatus(status: Status, limit?: number): Promise<Activity[]>;

  /**
   * Find activities by type
   */
  findByType(type: ActivityType, limit?: number): Promise<Activity[]>;

  /**
   * Find activities assigned to user
   */
  findByAssignee(userId: string, includeCompleted?: boolean): Promise<Activity[]>;

  /**
   * Find activities in specific location
   */
  findByLocation(building?: string, zone?: string, limit?: number): Promise<Activity[]>;

  /**
   * Find activities within time range
   */
  findByTimeRange(start: Date, end: Date, limit?: number): Promise<Activity[]>;

  /**
   * Search activities by text (title, description, tags)
   */
  search(searchText: string, limit?: number): Promise<Activity[]>;

  // ===== BUSINESS LOGIC QUERIES =====

  /**
   * Find activities that need attention (critical/high priority, unassigned)
   */
  findRequiringAttention(): Promise<Activity[]>;

  /**
   * Find overdue activities (open for too long based on priority)
   */
  findOverdue(): Promise<Activity[]>;

  /**
   * Find activities eligible for auto-archiving
   */
  findEligibleForArchiving(): Promise<Activity[]>;

  /**
   * Find activities with incident contexts
   */
  findWithIncidentContexts(incidentIds?: string[]): Promise<Activity[]>;

  /**
   * Find related activities (same location, type, time window)
   */
  findRelated(activityId: string, timeWindowMinutes?: number): Promise<Activity[]>;

  /**
   * Find activities for clustering (same location/type within time window)
   */
  findForClustering(timeWindowMinutes?: number): Promise<Activity[]>;

  /**
   * Find activities with high false positive likelihood
   */
  findSuspiciousFalsePositives(threshold?: number): Promise<Activity[]>;

  // ===== AGGREGATION & ANALYTICS =====

  /**
   * Get activity statistics
   */
  getStats(query?: ActivityQuery): Promise<ActivityStats>;

  /**
   * Get activities by time buckets (hourly, daily, etc.)
   */
  getActivityTimeline(
    start: Date,
    end: Date,
    bucketSize: 'hour' | 'day' | 'week'
  ): Promise<Array<{
    timestamp: Date;
    count: number;
    byPriority: Record<Priority, number>;
  }>>;

  /**
   * Get top locations by activity count
   */
  getTopLocations(limit?: number, timeRange?: { start: Date; end: Date }): Promise<Array<{
    location: string;
    building?: string;
    zone?: string;
    count: number;
  }>>;

  /**
   * Get activity resolution metrics
   */
  getResolutionMetrics(timeRange?: { start: Date; end: Date }): Promise<{
    averageResolutionTime: number;
    resolutionTimeByPriority: Record<Priority, number>;
    resolutionRate: number;
  }>;

  // ===== REAL-TIME & STREAMING =====

  /**
   * Subscribe to activity changes (for real-time updates)
   */
  subscribe(
    callback: (event: ActivityRepositoryEvent) => void,
    filter?: ActivityQuery
  ): Promise<() => void>; // Returns unsubscribe function

  /**
   * Get recent activities (last N minutes)
   */
  getRecent(minutes?: number, limit?: number): Promise<Activity[]>;

  /**
   * Stream activities matching criteria
   */
  stream(query?: ActivityQuery): AsyncIterable<Activity>;

  // ===== MAINTENANCE OPERATIONS =====

  /**
   * Archive old activities based on retention policy
   */
  archiveExpired(): Promise<number>; // Returns count of archived activities

  /**
   * Cleanup archived activities older than specified days
   */
  cleanupArchived(olderThanDays: number): Promise<number>;

  /**
   * Rebuild search indexes
   */
  rebuildSearchIndex(): Promise<void>;

  /**
   * Get repository health status
   */
  getHealthStatus(): Promise<{
    isHealthy: boolean;
    totalActivities: number;
    oldestActivity: Date;
    newestActivity: Date;
    indexStatus: 'healthy' | 'rebuilding' | 'error';
  }>;
}

// Event types for repository subscriptions
export type ActivityRepositoryEvent = 
  | { type: 'created'; activity: Activity }
  | { type: 'updated'; activity: Activity; previousSnapshot: any }
  | { type: 'deleted'; activityId: string }
  | { type: 'archived'; activityId: string }
  | { type: 'bulk_created'; activities: Activity[] }
  | { type: 'bulk_updated'; activities: Activity[] };

// Error types for repository operations
export class ActivityRepositoryError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONSTRAINT_VIOLATION' | 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ActivityRepositoryError';
  }
}

// Configuration interface for repository implementations
export interface ActivityRepositoryConfig {
  // Connection settings
  connectionString?: string;
  maxConnections?: number;
  queryTimeout?: number;
  
  // Performance settings
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableSearchIndex?: boolean;
  batchSize?: number;
  
  // Retention settings
  defaultRetentionDays?: number;
  autoArchiveEnabled?: boolean;
  archiveSchedule?: string; // Cron expression
  
  // Real-time settings
  enableRealTimeUpdates?: boolean;
  maxSubscribers?: number;
}