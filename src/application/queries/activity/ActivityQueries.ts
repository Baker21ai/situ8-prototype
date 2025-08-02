/**
 * Activity Domain Queries
 * All queries related to activity data retrieval and analysis
 */

import { IQuery, IPaginatedQuery, IFilteredQuery } from '../base/IQuery';
import { ActivityType } from '../../../lib/utils/security';
import { Priority, Status } from '../../../lib/utils/status';
import { EnterpriseActivity } from '../../../lib/types/activity';

// ===== GET ACTIVITIES QUERY =====

export interface GetActivitiesQuery extends IPaginatedQuery, IFilteredQuery {
  readonly type: 'GetActivities';
  readonly filters?: {
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
    hasIncidentContext?: boolean;
    isArchived?: boolean;
    confidenceThreshold?: number;
    tags?: string[];
    hasEvidence?: boolean;
  };
}

export interface GetActivitiesResult {
  activities: EnterpriseActivity[];
  totalCount: number;
  hasMore: boolean;
  aggregations?: {
    byPriority: Record<Priority, number>;
    byStatus: Record<Status, number>;
    byType: Record<ActivityType, number>;
    byBuilding: Record<string, number>;
  };
}

// ===== GET ACTIVITY BY ID QUERY =====

export interface GetActivityByIdQuery extends IQuery {
  readonly type: 'GetActivityById';
  readonly activityId: string;
  readonly includeRelated?: boolean;
  readonly includeTimeline?: boolean;
  readonly includeEvidence?: boolean;
}

export interface GetActivityByIdResult {
  activity: EnterpriseActivity | null;
  relatedActivities?: EnterpriseActivity[];
  timeline?: ActivityTimelineEntry[];
  evidence?: ActivityEvidence[];
}

// ===== SEARCH ACTIVITIES QUERY =====

export interface SearchActivitiesQuery extends IPaginatedQuery {
  readonly type: 'SearchActivities';
  readonly searchText: string;
  readonly searchFields?: ('title' | 'description' | 'location' | 'tags')[];
  readonly filters?: GetActivitiesQuery['filters'];
  readonly fuzzyMatch?: boolean;
  readonly highlightResults?: boolean;
}

export interface SearchActivitiesResult {
  activities: EnterpriseActivity[];
  totalCount: number;
  hasMore: boolean;
  searchMetadata: {
    queryTime: number;
    searchTerms: string[];
    suggestedTerms?: string[];
    highlights?: Record<string, string[]>;
  };
}

// ===== GET ACTIVITY STATISTICS QUERY =====

export interface GetActivityStatsQuery extends IQuery {
  readonly type: 'GetActivityStats';
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly groupBy?: ('hour' | 'day' | 'week' | 'month')[];
  readonly includeComparisons?: boolean;
  readonly filters?: GetActivitiesQuery['filters'];
}

export interface GetActivityStatsResult {
  summary: {
    total: number;
    averagePerDay: number;
    responseTime: {
      average: number;
      median: number;
      p95: number;
    };
    resolutionRate: number;
  };
  distributions: {
    byPriority: Record<Priority, number>;
    byStatus: Record<Status, number>;
    byType: Record<ActivityType, number>;
    byBuilding: Record<string, number>;
    byHour: Record<number, number>;
    byDayOfWeek: Record<string, number>;
  };
  trends?: {
    period: string;
    data: Array<{
      timestamp: Date;
      count: number;
      byPriority: Record<Priority, number>;
    }>;
  };
  comparisons?: {
    previousPeriod: GetActivityStatsResult['summary'];
    percentageChange: Record<string, number>;
  };
}

// ===== GET ACTIVITIES REQUIRING ATTENTION QUERY =====

export interface GetActivitiesRequiringAttentionQuery extends IQuery {
  readonly type: 'GetActivitiesRequiringAttention';
  readonly urgencyLevel?: 'all' | 'high' | 'critical';
  readonly assignedToUser?: string;
  readonly includeOverdue?: boolean;
}

export interface GetActivitiesRequiringAttentionResult {
  activities: EnterpriseActivity[];
  urgencyBreakdown: {
    overdue: number;
    critical: number;
    highPriority: number;
    unassigned: number;
    pendingValidation: number;
  };
  recommendations: Array<{
    activityId: string;
    action: 'assign' | 'escalate' | 'archive' | 'validate';
    reason: string;
    priority: number;
  }>;
}

// ===== GET OVERDUE ACTIVITIES QUERY =====

export interface GetOverdueActivitiesQuery extends IQuery {
  readonly type: 'GetOverdueActivities';
  readonly thresholdHours?: number;
  readonly includeAssigned?: boolean;
  readonly priority?: Priority[];
}

export interface GetOverdueActivitiesResult {
  activities: EnterpriseActivity[];
  overdueMetrics: {
    totalCount: number;
    averageOverdueHours: number;
    oldestActivity: {
      id: string;
      hoursOverdue: number;
    };
  };
}

// ===== GET RELATED ACTIVITIES QUERY =====

export interface GetRelatedActivitiesQuery extends IQuery {
  readonly type: 'GetRelatedActivities';
  readonly activityId: string;
  readonly relationTypes?: ('location' | 'time' | 'type' | 'user' | 'incident')[];
  readonly timeWindowMinutes?: number;
  readonly locationRadius?: number;
  readonly maxResults?: number;
}

export interface GetRelatedActivitiesResult {
  activities: EnterpriseActivity[];
  relationships: Array<{
    activityId: string;
    relationshipType: string;
    strength: number; // 0-1 confidence
    explanation: string;
  }>;
  clusters?: Array<{
    type: string;
    activities: string[];
    confidence: number;
  }>;
}

// ===== GET ACTIVITY CLUSTERS QUERY =====

export interface GetActivityClustersQuery extends IQuery {
  readonly type: 'GetActivityClusters';
  readonly timeWindow: {
    start: Date;
    end: Date;
  };
  readonly clusteringRules?: {
    timeProximity?: number; // minutes
    locationProximity?: number; // meters
    typeMatching?: boolean;
    priorityMatching?: boolean;
  };
  readonly minClusterSize?: number;
}

export interface GetActivityClustersResult {
  clusters: Array<{
    id: string;
    activities: EnterpriseActivity[];
    centroid: {
      location: string;
      timestamp: Date;
      type: ActivityType;
    };
    metrics: {
      timeSpan: number; // minutes
      locationSpan: number; // meters
      coherenceScore: number; // 0-1
    };
    suggestedActions: string[];
  }>;
  unclusteredActivities: EnterpriseActivity[];
  clusteringMetadata: {
    totalClusters: number;
    averageClusterSize: number;
    clusteringTime: number;
  };
}

// ===== GET ACTIVITY TIMELINE QUERY =====

export interface GetActivityTimelineQuery extends IQuery {
  readonly type: 'GetActivityTimeline';
  readonly timeRange: {
    start: Date;
    end: Date;
  };
  readonly granularity: 'minute' | 'hour' | 'day' | 'week';
  readonly filters?: GetActivitiesQuery['filters'];
  readonly includeEvents?: boolean;
}

export interface GetActivityTimelineResult {
  timeline: Array<{
    timestamp: Date;
    count: number;
    activities: EnterpriseActivity[];
    events?: Array<{
      type: string;
      count: number;
      significance: number;
    }>;
  }>;
  patterns: {
    peakHours: number[];
    busyDays: string[];
    seasonality?: {
      pattern: string;
      confidence: number;
    };
  };
  anomalies: Array<{
    timestamp: Date;
    type: 'spike' | 'drop' | 'pattern_break';
    severity: number;
    description: string;
  }>;
}

// ===== GET TOP LOCATIONS QUERY =====

export interface GetTopLocationsQuery extends IQuery {
  readonly type: 'GetTopLocations';
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly limit?: number;
  readonly includeZones?: boolean;
  readonly activityTypes?: ActivityType[];
}

export interface GetTopLocationsResult {
  locations: Array<{
    location: string;
    building?: string;
    zone?: string;
    count: number;
    byPriority: Record<Priority, number>;
    byType: Record<ActivityType, number>;
    trends: {
      increasing: boolean;
      percentageChange: number;
    };
  }>;
  insights: {
    hottestLocation: string;
    emergingLocation?: string;
    patternChanges: Array<{
      location: string;
      change: string;
      significance: number;
    }>;
  };
}

// ===== GET ACTIVITIES BY USER QUERY =====

export interface GetActivitiesByUserQuery extends IPaginatedQuery {
  readonly type: 'GetActivitiesByUser';
  readonly targetUserId: string;
  readonly relationshipType: 'created' | 'assigned' | 'updated' | 'involved';
  readonly timeRange?: {
    start: Date;
    end: Date;
  };
  readonly includeStats?: boolean;
}

export interface GetActivitiesByUserResult {
  activities: EnterpriseActivity[];
  totalCount: number;
  hasMore: boolean;
  userStats?: {
    createdCount: number;
    assignedCount: number;
    resolvedCount: number;
    averageResolutionTime: number;
    performanceScore: number;
  };
}

// ===== SUPPORTING TYPES =====

export interface ActivityTimelineEntry {
  id: string;
  activityId: string;
  timestamp: Date;
  type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'commented' | 'resolved';
  user: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface ActivityEvidence {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

// Union type of all activity queries
export type ActivityQuery = 
  | GetActivitiesQuery
  | GetActivityByIdQuery
  | SearchActivitiesQuery
  | GetActivityStatsQuery
  | GetActivitiesRequiringAttentionQuery
  | GetOverdueActivitiesQuery
  | GetRelatedActivitiesQuery
  | GetActivityClustersQuery
  | GetActivityTimelineQuery
  | GetTopLocationsQuery
  | GetActivitiesByUserQuery;