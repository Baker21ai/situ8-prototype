/**
 * Filter Activities Use Case
 * Handles complex activity filtering and sorting logic
 */

import { Activity } from '../entities/Activity';
import { IActivityRepository, ActivityQuery } from '../repositories/IActivityRepository';
import { Priority, Status } from '../../../../lib/utils/status';
import { ActivityType } from '../../../../lib/utils/security';

// Filter command object
export interface FilterActivitiesCommand {
  // Basic filters
  priorities?: Priority[];
  statuses?: Status[];  
  types?: ActivityType[];
  assignedTo?: string[];
  building?: string[];
  zone?: string[];
  
  // Time-based filters
  timeRange?: {
    start: Date;
    end: Date;
  };
  quickTimeFilter?: 'live' | '15m' | '1h' | '4h' | '24h' | 'week' | 'month';
  
  // Content filters
  searchText?: string;
  hasEvidence?: boolean;
  hasIncidentContext?: boolean;
  isArchived?: boolean;
  
  // AI/ML filters
  confidenceThreshold?: number;
  falsePositiveLikelihood?: number;
  enableAIFiltering?: boolean;
  
  // Business logic filters
  requiresAttention?: boolean;
  isOverdue?: boolean;
  businessImpact?: string[];
  
  // Pagination and sorting
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'priority' | 'updated_at' | 'title' | 'confidence';
  sortOrder?: 'asc' | 'desc';
  
  // Performance options
  enableClustering?: boolean;
  includeStats?: boolean;
}

export interface FilterActivitiesResult {
  activities: Activity[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
  stats?: {
    total: number;
    byPriority: Record<Priority, number>;
    byStatus: Record<Status, number>;
    byType: Record<ActivityType, number>;
    averageConfidence: number;
  };
  executionTime: number;
  clustered?: boolean;
}

export class FilterActivitiesUseCase {
  constructor(
    private activityRepository: IActivityRepository
  ) {}

  async execute(command: FilterActivitiesCommand): Promise<FilterActivitiesResult> {
    const startTime = Date.now();
    
    try {
      // Build repository query from command
      const query = this.buildQuery(command);
      
      // Execute query with pagination
      const result = await this.activityRepository.findWithPagination(query);
      
      // Apply post-processing filters (AI filtering, business rules)
      let filteredActivities = await this.applyPostProcessingFilters(result.activities, command);
      
      // Apply AI-powered filtering if enabled
      if (command.enableAIFiltering) {
        filteredActivities = this.applyAIFiltering(filteredActivities);
      }
      
      // Get statistics if requested
      let stats;
      if (command.includeStats) {
        stats = await this.calculateStats(filteredActivities);
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        activities: filteredActivities,
        total: result.total,
        hasMore: result.hasMore,
        nextOffset: result.nextOffset,
        stats,
        executionTime
      };
      
    } catch (error) {
      throw new Error(`Filter activities failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildQuery(command: FilterActivitiesCommand): ActivityQuery {
    const query: ActivityQuery = {};
    
    // Basic filters
    if (command.priorities?.length) {
      query.priority = command.priorities;
    }
    
    if (command.statuses?.length) {
      query.status = command.statuses;
    }
    
    if (command.types?.length) {
      query.type = command.types;
    }
    
    if (command.assignedTo?.length) {
      query.assignedTo = command.assignedTo;
    }
    
    if (command.building?.length) {
      query.building = command.building;
    }
    
    if (command.zone?.length) {
      query.zone = command.zone;
    }
    
    // Time filters
    if (command.timeRange) {
      query.timeRange = command.timeRange;
    } else if (command.quickTimeFilter) {
      query.timeRange = this.buildQuickTimeRange(command.quickTimeFilter);
    }
    
    // Content filters  
    if (command.searchText) {
      query.searchText = command.searchText;
    }
    
    if (command.hasIncidentContext !== undefined) {
      query.hasIncidentContext = command.hasIncidentContext;
    }
    
    if (command.isArchived !== undefined) {
      query.isArchived = command.isArchived;
    }
    
    if (command.confidenceThreshold !== undefined) {
      query.confidenceThreshold = command.confidenceThreshold;
    }
    
    // Pagination and sorting
    if (command.limit) {
      query.limit = command.limit;
    }
    
    if (command.offset) {
      query.offset = command.offset;
    }
    
    if (command.sortBy) {
      query.sortBy = command.sortBy;
    }
    
    if (command.sortOrder) {
      query.sortOrder = command.sortOrder;
    }
    
    return query;
  }

  private buildQuickTimeRange(quickFilter: string): { start: Date; end: Date } {
    const now = new Date();
    const timeRanges = {
      'live': 5 * 60 * 1000, // 5 minutes
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000
    };
    
    const duration = timeRanges[quickFilter as keyof typeof timeRanges] || timeRanges['24h'];
    
    return {
      start: new Date(now.getTime() - duration),
      end: now
    };
  }

  private async applyPostProcessingFilters(activities: Activity[], command: FilterActivitiesCommand): Promise<Activity[]> {
    let filtered = activities;
    
    // Filter by business rules
    if (command.requiresAttention) {
      filtered = filtered.filter(activity => 
        (activity.priority === 'critical' || activity.priority === 'high') &&
        !activity.assignedTo
      );
    }
    
    if (command.isOverdue) {
      filtered = await this.filterOverdueActivities(filtered);
    }
    
    if (command.hasEvidence) {
      filtered = filtered.filter(activity => 
        activity.evidence && activity.evidence.length > 0
      );
    }
    
    if (command.falsePositiveLikelihood !== undefined) {
      filtered = filtered.filter(activity => 
        !activity.falsePositiveLikelihood || 
        activity.falsePositiveLikelihood <= command.falsePositiveLikelihood!
      );
    }
    
    if (command.businessImpact?.length) {
      filtered = filtered.filter(activity =>
        activity.businessImpact && 
        command.businessImpact!.includes(activity.businessImpact)
      );
    }
    
    return filtered;
  }

  private applyAIFiltering(activities: Activity[]): Activity[] {
    return activities.filter(activity => {
      // Filter out likely false positives
      if (activity.falsePositiveLikelihood && activity.falsePositiveLikelihood > 0.8) {
        return false;
      }
      
      // Filter out low-confidence detections for non-critical events
      if (activity.confidence && activity.confidence < 30 && activity.priority !== 'critical') {
        return false;
      }
      
      // Business hours filtering for low-priority events
      const hour = activity.timestamp.getHours();
      if (activity.priority === 'low' && (hour < 6 || hour > 22)) {
        return false;
      }
      
      // Filter out repetitive patrol activities
      if (activity.type === 'patrol' && activity.system_tags.includes('repetitive')) {
        return false;
      }
      
      return true;
    });
  }

  private async filterOverdueActivities(activities: Activity[]): Promise<Activity[]> {
    const now = new Date();
    
    // Define SLA thresholds by priority (in hours)
    const slaThresholds = {
      'critical': 1,   // 1 hour
      'high': 4,       // 4 hours  
      'medium': 24,    // 24 hours
      'low': 72        // 72 hours
    };
    
    return activities.filter(activity => {
      if (activity.status === 'resolved' || activity.status === 'closed') {
        return false;
      }
      
      const threshold = slaThresholds[activity.priority];
      const hoursSinceCreated = (now.getTime() - activity.timestamp.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceCreated > threshold;
    });
  }

  private async calculateStats(activities: Activity[]): Promise<FilterActivitiesResult['stats']> {
    const stats = {
      total: activities.length,
      byPriority: {} as Record<Priority, number>,
      byStatus: {} as Record<Status, number>,
      byType: {} as Record<ActivityType, number>,
      averageConfidence: 0
    };
    
    // Initialize counters
    const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
    const statuses: Status[] = ['open', 'in-progress', 'resolved', 'closed', 'deferred', 'escalated'];
    
    priorities.forEach(p => stats.byPriority[p] = 0);
    statuses.forEach(s => stats.byStatus[s] = 0);
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    // Count activities by category
    activities.forEach(activity => {
      stats.byPriority[activity.priority]++;
      stats.byStatus[activity.status]++;
      
      if (!stats.byType[activity.type]) {
        stats.byType[activity.type] = 0;
      }
      stats.byType[activity.type]++;
      
      if (activity.confidence) {
        totalConfidence += activity.confidence;
        confidenceCount++;
      }
    });
    
    // Calculate average confidence
    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    return stats;
  }
}

// Predefined filter configurations for common use cases
export class ActivityFilterPresets {
  static getRequiringAttention(): FilterActivitiesCommand {
    return {
      priorities: ['critical', 'high'],
      statuses: ['open', 'escalated'],
      requiresAttention: true,
      sortBy: 'priority',
      sortOrder: 'desc',
      limit: 50
    };
  }
  
  static getCriticalLast24Hours(): FilterActivitiesCommand {
    return {
      priorities: ['critical'],
      quickTimeFilter: '24h',
      sortBy: 'timestamp',
      sortOrder: 'desc',
      includeStats: true
    };
  }
  
  static getUnassignedOpen(): FilterActivitiesCommand {
    return {
      statuses: ['open'],
      assignedTo: [], // Empty array means unassigned
      sortBy: 'timestamp',
      sortOrder: 'desc',
      limit: 100
    };
  }
  
  static getHighConfidenceAlerts(): FilterActivitiesCommand {
    return {
      types: ['alert', 'security-breach'],
      confidenceThreshold: 80,
      enableAIFiltering: true,
      sortBy: 'confidence',
      sortOrder: 'desc'
    };
  }
  
  static getOverdueActivities(): FilterActivitiesCommand {
    return {
      statuses: ['open', 'in-progress', 'escalated'],
      isOverdue: true,
      sortBy: 'timestamp',
      sortOrder: 'asc',
      includeStats: true
    };
  }
  
  static getBuildingActivities(building: string, timeFilter: string = '24h'): FilterActivitiesCommand {
    return {
      building: [building],
      quickTimeFilter: timeFilter as any,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      includeStats: true
    };
  }
}