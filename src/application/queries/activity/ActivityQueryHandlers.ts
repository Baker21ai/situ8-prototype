/**
 * Activity Query Handlers
 * Implementation of all activity-related query processing
 */

import { IQueryHandler, QueryResult } from '../base/IQuery';
import {
  GetActivitiesQuery, GetActivitiesResult,
  GetActivityByIdQuery, GetActivityByIdResult,
  SearchActivitiesQuery, SearchActivitiesResult,
  GetActivityStatsQuery, GetActivityStatsResult,
  GetActivitiesRequiringAttentionQuery, GetActivitiesRequiringAttentionResult,
  GetOverdueActivitiesQuery, GetOverdueActivitiesResult,
  GetRelatedActivitiesQuery, GetRelatedActivitiesResult,
  GetActivityClustersQuery, GetActivityClustersResult,
  GetActivityTimelineQuery, GetActivityTimelineResult,
  GetTopLocationsQuery, GetTopLocationsResult,
  GetActivitiesByUserQuery, GetActivitiesByUserResult,
  ActivityTimelineEntry,
  ActivityEvidence
} from './ActivityQueries';
import { IActivityRepository, ActivityQuery } from '../../../domains/activities/repositories/IActivityRepository';
import { FilterActivitiesUseCase } from '../../../domains/activities/use-cases/FilterActivities';
import { ClusterActivitiesUseCase } from '../../../domains/activities/use-cases/ClusterActivities';
import { EnterpriseActivity } from '../../../lib/types/activity';
import { ActivityType } from '../../../lib/utils/security';
import { Priority, Status } from '../../../lib/utils/status';

// ===== GET ACTIVITIES HANDLER =====

export class GetActivitiesQueryHandler extends IQueryHandler<GetActivitiesQuery, GetActivitiesResult> {
  constructor(
    private filterActivitiesUseCase: FilterActivitiesUseCase,
    private activityRepository: IActivityRepository
  ) {
    super();
  }

  protected getCacheKey(query: GetActivitiesQuery): string {
    return `activities:${JSON.stringify({
      filters: query.filters,
      pagination: query.pagination,
      sorting: query.sorting
    })}`;
  }

  protected getCacheTTL(): number {
    return 30000; // 30 seconds
  }

  async handle(query: GetActivitiesQuery): Promise<QueryResult<GetActivitiesResult>> {
    try {
      // Convert to repository query format
      const repositoryQuery: ActivityQuery = {
        type: query.filters?.types,
        status: query.filters?.statuses,
        priority: query.filters?.priorities,
        building: query.filters?.buildings,
        zone: query.filters?.zones,
        assignedTo: query.filters?.assignedTo,
        createdBy: query.filters?.createdBy,
        timeRange: query.filters?.dateRange,
        searchText: query.filters?.searchText,
        hasIncidentContext: query.filters?.hasIncidentContext,
        isArchived: query.filters?.isArchived,
        confidenceThreshold: query.filters?.confidenceThreshold,
        limit: query.pagination?.limit || 50,
        offset: query.pagination?.offset || 0,
        sortBy: query.sorting?.field || 'timestamp',
        sortOrder: query.sorting?.order || 'desc'
      };

      const result = await this.filterActivitiesUseCase.execute(repositoryQuery);

      if (!result.success || !result.activities) {
        return {
          success: false,
          error: result.error || 'Failed to retrieve activities'
        };
      }

      // Generate aggregations if requested
      let aggregations;
      if (query.filters) {
        aggregations = this.generateAggregations(result.activities);
      }

      return {
        success: true,
        data: {
          activities: result.activities,
          totalCount: result.totalCount || result.activities.length,
          hasMore: (query.pagination?.offset || 0) + result.activities.length < (result.totalCount || result.activities.length),
          aggregations
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateAggregations(activities: EnterpriseActivity[]) {
    const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byStatus: Record<Status, number> = { 
      pending: 0, open: 0, assigned: 0, 'in-progress': 0, resolved: 0, dismissed: 0, archived: 0 
    };
    const byType: Record<ActivityType, number> = {
      'access-control': 0, 'visitor-management': 0, medical: 0, 'security-breach': 0,
      'property-damage': 0, alert: 0, 'bol-event': 0, maintenance: 0, other: 0
    };
    const byBuilding: Record<string, number> = {};

    activities.forEach(activity => {
      byPriority[activity.priority]++;
      byStatus[activity.status]++;
      byType[activity.type]++;
      
      if (activity.building) {
        byBuilding[activity.building] = (byBuilding[activity.building] || 0) + 1;
      }
    });

    return { byPriority, byStatus, byType, byBuilding };
  }
}

// ===== GET ACTIVITY BY ID HANDLER =====

export class GetActivityByIdQueryHandler extends IQueryHandler<GetActivityByIdQuery, GetActivityByIdResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected getCacheKey(query: GetActivityByIdQuery): string {
    return `activity:${query.activityId}:${query.includeRelated}:${query.includeTimeline}:${query.includeEvidence}`;
  }

  protected getCacheTTL(): number {
    return 60000; // 1 minute
  }

  async handle(query: GetActivityByIdQuery): Promise<QueryResult<GetActivityByIdResult>> {
    try {
      const activity = await this.activityRepository.findById(query.activityId);
      
      if (!activity) {
        return {
          success: true,
          data: {
            activity: null
          }
        };
      }

      let relatedActivities: EnterpriseActivity[] | undefined;
      let timeline: ActivityTimelineEntry[] | undefined;
      let evidence: ActivityEvidence[] | undefined;

      // Load related data if requested
      if (query.includeRelated) {
        relatedActivities = await this.activityRepository.findRelated(query.activityId, 30);
      }

      if (query.includeTimeline) {
        timeline = await this.getActivityTimeline(query.activityId);
      }

      if (query.includeEvidence) {
        evidence = await this.getActivityEvidence(query.activityId);
      }

      return {
        success: true,
        data: {
          activity,
          relatedActivities,
          timeline,
          evidence
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async getActivityTimeline(activityId: string): Promise<ActivityTimelineEntry[]> {
    // Mock implementation - would integrate with audit/timeline service
    return [
      {
        id: `timeline-${activityId}-1`,
        activityId,
        timestamp: new Date(),
        type: 'created',
        user: 'system',
        description: 'Activity created',
        metadata: {}
      }
    ];
  }

  private async getActivityEvidence(activityId: string): Promise<ActivityEvidence[]> {
    // Mock implementation - would integrate with evidence service
    return [];
  }
}

// ===== SEARCH ACTIVITIES HANDLER =====

export class SearchActivitiesQueryHandler extends IQueryHandler<SearchActivitiesQuery, SearchActivitiesResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected getCacheKey(query: SearchActivitiesQuery): string {
    return `search:${query.searchText}:${JSON.stringify(query.filters)}:${JSON.stringify(query.pagination)}`;
  }

  protected getCacheTTL(): number {
    return 120000; // 2 minutes
  }

  async handle(query: SearchActivitiesQuery): Promise<QueryResult<SearchActivitiesResult>> {
    try {
      const startTime = Date.now();
      
      // Parse search terms
      const searchTerms = query.searchText.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      // Build repository query
      const repositoryQuery: ActivityQuery = {
        searchText: query.searchText,
        ...(query.filters && {
          type: query.filters.types,
          status: query.filters.statuses,
          priority: query.filters.priorities,
          building: query.filters.buildings,
          zone: query.filters.zones,
          assignedTo: query.filters.assignedTo,
          createdBy: query.filters.createdBy,
          timeRange: query.filters.dateRange,
          hasIncidentContext: query.filters.hasIncidentContext,
          isArchived: query.filters.isArchived,
          confidenceThreshold: query.filters.confidenceThreshold
        }),
        limit: query.pagination?.limit || 50,
        offset: query.pagination?.offset || 0,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      };

      // Execute search
      const searchResult = await this.activityRepository.search(repositoryQuery);
      
      const queryTime = Date.now() - startTime;
      
      // Generate suggested terms (simplified implementation)
      const suggestedTerms = this.generateSuggestions(searchTerms);
      
      // Generate highlights if requested
      let highlights: Record<string, string[]> | undefined;
      if (query.highlightResults) {
        highlights = this.generateHighlights(searchResult, searchTerms);
      }

      return {
        success: true,
        data: {
          activities: searchResult,
          totalCount: searchResult.length,
          hasMore: false, // Would be calculated based on actual search implementation
          searchMetadata: {
            queryTime,
            searchTerms,
            suggestedTerms,
            highlights
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateSuggestions(searchTerms: string[]): string[] {
    // Mock implementation - would use search analytics
    const suggestions = ['medical emergency', 'security breach', 'visitor management'];
    return suggestions.filter(suggestion => 
      searchTerms.some(term => suggestion.includes(term))
    );
  }

  private generateHighlights(activities: EnterpriseActivity[], searchTerms: string[]): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    
    activities.forEach(activity => {
      const activityHighlights: string[] = [];
      
      searchTerms.forEach(term => {
        if (activity.title.toLowerCase().includes(term)) {
          activityHighlights.push(`title: ${this.highlightTerm(activity.title, term)}`);
        }
        if (activity.description?.toLowerCase().includes(term)) {
          activityHighlights.push(`description: ${this.highlightTerm(activity.description, term)}`);
        }
      });
      
      if (activityHighlights.length > 0) {
        highlights[activity.id] = activityHighlights;
      }
    });
    
    return highlights;
  }

  private highlightTerm(text: string, term: string): string {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

// ===== GET ACTIVITY STATISTICS HANDLER =====

export class GetActivityStatsQueryHandler extends IQueryHandler<GetActivityStatsQuery, GetActivityStatsResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected getCacheKey(query: GetActivityStatsQuery): string {
    return `stats:${JSON.stringify(query.timeRange)}:${JSON.stringify(query.filters)}`;
  }

  protected getCacheTTL(): number {
    return 60000; // 1 minute
  }

  async handle(query: GetActivityStatsQuery): Promise<QueryResult<GetActivityStatsResult>> {
    try {
      // Build base query for statistics
      const baseQuery: ActivityQuery = {
        ...(query.timeRange && { timeRange: query.timeRange }),
        ...(query.filters && {
          type: query.filters.types,
          status: query.filters.statuses,
          priority: query.filters.priorities,
          building: query.filters.buildings,
          zone: query.filters.zones,
          assignedTo: query.filters.assignedTo,
          createdBy: query.filters.createdBy,
          hasIncidentContext: query.filters.hasIncidentContext,
          isArchived: query.filters.isArchived,
          confidenceThreshold: query.filters.confidenceThreshold
        })
      };

      // Get activity statistics
      const stats = await this.activityRepository.getStats(baseQuery);
      
      // Calculate summary metrics
      const summary = {
        total: stats.total,
        averagePerDay: this.calculateAveragePerDay(stats.total, query.timeRange),
        responseTime: {
          average: stats.responseTime?.average || 0,
          median: stats.responseTime?.median || 0,
          p95: stats.responseTime?.p95 || 0
        },
        resolutionRate: stats.resolutionRate || 0
      };

      // Get distributions
      const distributions = {
        byPriority: stats.byPriority,
        byStatus: stats.byStatus,
        byType: stats.byType,
        byBuilding: stats.byBuilding || {},
        byHour: await this.getHourlyDistribution(baseQuery),
        byDayOfWeek: await this.getDayOfWeekDistribution(baseQuery)
      };

      // Get trends if requested
      let trends;
      if (query.groupBy?.includes('day') || query.groupBy?.includes('week')) {
        trends = await this.getTrends(baseQuery, query.groupBy[0]);
      }

      // Get comparisons if requested
      let comparisons;
      if (query.includeComparisons && query.timeRange) {
        comparisons = await this.getComparisons(baseQuery, query.timeRange);
      }

      return {
        success: true,
        data: {
          summary,
          distributions,
          trends,
          comparisons
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private calculateAveragePerDay(total: number, timeRange?: { start: Date; end: Date }): number {
    if (!timeRange) return 0;
    
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? total / days : 0;
  }

  private async getHourlyDistribution(query: ActivityQuery): Promise<Record<number, number>> {
    // Mock implementation - would query actual data
    const distribution: Record<number, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = Math.floor(Math.random() * 10);
    }
    return distribution;
  }

  private async getDayOfWeekDistribution(query: ActivityQuery): Promise<Record<string, number>> {
    // Mock implementation - would query actual data
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution: Record<string, number> = {};
    days.forEach(day => {
      distribution[day] = Math.floor(Math.random() * 20);
    });
    return distribution;
  }

  private async getTrends(query: ActivityQuery, period: string) {
    // Mock implementation - would calculate actual trends
    return {
      period,
      data: [
        {
          timestamp: new Date(),
          count: 10,
          byPriority: { low: 2, medium: 5, high: 2, critical: 1 }
        }
      ]
    };
  }

  private async getComparisons(query: ActivityQuery, timeRange: { start: Date; end: Date }) {
    // Mock implementation - would compare with previous period
    return {
      previousPeriod: {
        total: 95,
        averagePerDay: 3.2,
        responseTime: { average: 45, median: 30, p95: 120 },
        resolutionRate: 0.85
      },
      percentageChange: {
        total: 5.3,
        averagePerDay: 12.5,
        resolutionRate: -2.1
      }
    };
  }
}

// ===== GET ACTIVITIES REQUIRING ATTENTION HANDLER =====

export class GetActivitiesRequiringAttentionQueryHandler extends IQueryHandler<GetActivitiesRequiringAttentionQuery, GetActivitiesRequiringAttentionResult> {
  constructor(private activityRepository: IActivityRepository) {
    super();
  }

  protected getCacheKey(query: GetActivitiesRequiringAttentionQuery): string {
    return `attention:${query.urgencyLevel}:${query.assignedToUser}:${query.includeOverdue}`;
  }

  protected getCacheTTL(): number {
    return 10000; // 10 seconds - short cache for urgent items
  }

  async handle(query: GetActivitiesRequiringAttentionQuery): Promise<QueryResult<GetActivitiesRequiringAttentionResult>> {
    try {
      const activities = await this.activityRepository.findRequiringAttention();
      
      // Filter by urgency level if specified
      let filteredActivities = activities;
      if (query.urgencyLevel && query.urgencyLevel !== 'all') {
        filteredActivities = activities.filter(activity => {
          if (query.urgencyLevel === 'critical') {
            return activity.priority === 'critical';
          } else if (query.urgencyLevel === 'high') {
            return activity.priority === 'critical' || activity.priority === 'high';
          }
          return true;
        });
      }

      // Filter by assigned user if specified
      if (query.assignedToUser) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.assignedTo === query.assignedToUser
        );
      }

      // Calculate urgency breakdown
      const urgencyBreakdown = {
        overdue: this.countOverdue(filteredActivities),
        critical: filteredActivities.filter(a => a.priority === 'critical').length,
        highPriority: filteredActivities.filter(a => a.priority === 'high').length,
        unassigned: filteredActivities.filter(a => !a.assignedTo).length,
        pendingValidation: filteredActivities.filter(a => a.incident_contexts?.length > 0).length
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(filteredActivities);

      return {
        success: true,
        data: {
          activities: filteredActivities,
          urgencyBreakdown,
          recommendations
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private countOverdue(activities: EnterpriseActivity[]): number {
    const now = new Date();
    return activities.filter(activity => {
      const hoursActive = (now.getTime() - activity.created_at.getTime()) / (1000 * 60 * 60);
      const threshold = activity.priority === 'critical' ? 2 : 
                       activity.priority === 'high' ? 8 : 24;
      return hoursActive > threshold;
    }).length;
  }

  private generateRecommendations(activities: EnterpriseActivity[]) {
    const recommendations: Array<{
      activityId: string;
      action: 'assign' | 'escalate' | 'archive' | 'validate';
      reason: string;
      priority: number;
    }> = [];

    activities.forEach(activity => {
      if (!activity.assignedTo && activity.priority === 'critical') {
        recommendations.push({
          activityId: activity.id,
          action: 'assign',
          reason: 'Critical priority activity requires immediate assignment',
          priority: 1
        });
      }

      if (activity.status === 'in-progress') {
        const hoursActive = (Date.now() - activity.created_at.getTime()) / (1000 * 60 * 60);
        if (hoursActive > 24) {
          recommendations.push({
            activityId: activity.id,
            action: 'escalate',
            reason: 'Activity has been in progress for over 24 hours',
            priority: 2
          });
        }
      }
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}

// Export all handlers for registration
export const activityQueryHandlers = {
  GetActivitiesQueryHandler,
  GetActivityByIdQueryHandler,
  SearchActivitiesQueryHandler,
  GetActivityStatsQueryHandler,
  GetActivitiesRequiringAttentionQueryHandler,
};