/**
 * Cluster Activities Use Case
 * Handles intelligent grouping of related activities
 */

import { Activity } from '../entities/Activity';
import { IActivityRepository } from '../repositories/IActivityRepository';
import { Priority } from '../../../../lib/utils/status';
import { ActivityType } from '../../../../lib/utils/security';

// Cluster configuration
export interface ClusterConfig {
  // Clustering criteria
  maxDistance?: number; // meters for geo-based clustering
  timeWindowMinutes?: number; // time window for temporal clustering
  minActivitiesForCluster?: number; // minimum activities to form a cluster
  
  // Clustering strategies
  strategy?: 'location' | 'type' | 'temporal' | 'semantic' | 'hybrid';
  
  // Clustering weights (for hybrid strategy)  
  locationWeight?: number;
  typeWeight?: number;
  temporalWeight?: number;
  semanticWeight?: number;
  
  // Performance options
  maxClusters?: number;
  enableSmartClustering?: boolean; // Use AI-powered clustering
}

// Activity cluster representation
export interface ActivityCluster {
  id: string;
  type: 'single' | 'cluster';
  activities: Activity[];
  representative: Activity; // Most important activity in cluster
  count: number;
  
  // Cluster metadata
  highestPriority: Priority;
  clusterType: ActivityType;
  location: string;
  building?: string;
  zone?: string;
  
  // Temporal info
  timeRange: {
    start: Date;
    end: Date;
    duration: number; // in minutes
  };
  
  // Clustering scores
  coherenceScore: number; // How well activities fit together (0-1)
  confidenceScore: number; // Confidence in clustering decision (0-1)
  
  // Display properties
  title: string;
  description: string;
  isExpanded?: boolean;
}

export interface ClusterActivitiesCommand {
  activities: Activity[];
  config?: ClusterConfig;
}

export interface ClusterActivitiesResult {
  clusters: ActivityCluster[];
  totalActivities: number;
  totalClusters: number;
  clusteringEfficiency: number; // Reduction in items to display
  executionTime: number;
}

export class ClusterActivitiesUseCase {
  private defaultConfig: ClusterConfig = {
    maxDistance: 300, // 300 meters
    timeWindowMinutes: 15,
    minActivitiesForCluster: 2,
    strategy: 'hybrid',
    locationWeight: 0.4,
    typeWeight: 0.3,
    temporalWeight: 0.2,
    semanticWeight: 0.1,
    maxClusters: 50,
    enableSmartClustering: true
  };

  constructor(
    private activityRepository: IActivityRepository
  ) {}

  async execute(command: ClusterActivitiesCommand): Promise<ClusterActivitiesResult> {
    const startTime = Date.now();
    const config = { ...this.defaultConfig, ...command.config };
    
    try {
      // Early return if too few activities
      if (command.activities.length < (config.minActivitiesForCluster || 2)) {
        return this.createSingletonClusters(command.activities, Date.now() - startTime);
      }
      
      let clusters: ActivityCluster[] = [];
      
      // Choose clustering strategy
      switch (config.strategy) {
        case 'location':
          clusters = await this.clusterByLocation(command.activities, config);
          break;
        case 'type':
          clusters = await this.clusterByType(command.activities, config);
          break;
        case 'temporal':
          clusters = await this.clusterByTemporal(command.activities, config);
          break;
        case 'semantic':
          clusters = await this.clusterBySemantic(command.activities, config);
          break;
        case 'hybrid':
        default:
          clusters = await this.hybridClustering(command.activities, config);
          break;
      }
      
      // Apply smart clustering enhancements if enabled
      if (config.enableSmartClustering) {
        clusters = await this.applySmartClustering(clusters, config);
      }
      
      // Sort clusters by importance (priority, time, size)
      clusters = this.sortClustersByImportance(clusters);
      
      // Calculate clustering metrics
      const totalClusters = clusters.length;
      const clusteringEfficiency = 1 - (totalClusters / command.activities.length);
      const executionTime = Date.now() - startTime;
      
      return {
        clusters,
        totalActivities: command.activities.length,
        totalClusters,
        clusteringEfficiency,
        executionTime
      };
      
    } catch (error) {
      throw new Error(`Activity clustering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async clusterByLocation(activities: Activity[], config: ClusterConfig): Promise<ActivityCluster[]> {
    const clusters: ActivityCluster[] = [];
    const processed = new Set<string>();
    
    for (const activity of activities) {
      if (processed.has(activity.id)) continue;
      
      // Find activities in same location within time window
      const similar = activities.filter(other => 
        !processed.has(other.id) &&
        this.isSameLocation(activity, other) &&
        this.isWithinTimeWindow(activity, other, config.timeWindowMinutes!)
      );
      
      if (similar.length >= config.minActivitiesForCluster!) {
        clusters.push(this.createCluster(similar, 'location'));
        similar.forEach(a => processed.add(a.id));
      } else {
        clusters.push(this.createSingletonCluster(activity));
        processed.add(activity.id);
      }
    }
    
    return clusters;
  }

  private async clusterByType(activities: Activity[], config: ClusterConfig): Promise<ActivityCluster[]> {
    const typeGroups = new Map<ActivityType, Activity[]>();
    
    // Group by type
    activities.forEach(activity => {
      if (!typeGroups.has(activity.type)) {
        typeGroups.set(activity.type, []);
      }
      typeGroups.get(activity.type)!.push(activity);
    });
    
    const clusters: ActivityCluster[] = [];
    
    // Create clusters for each type group
    typeGroups.forEach((typeActivities, type) => {
      if (typeActivities.length >= config.minActivitiesForCluster!) {
        clusters.push(this.createCluster(typeActivities, 'type'));
      } else {
        // Convert to singleton clusters
        typeActivities.forEach(activity => {
          clusters.push(this.createSingletonCluster(activity));
        });
      }
    });
    
    return clusters;
  }

  private async clusterByTemporal(activities: Activity[], config: ClusterConfig): Promise<ActivityCluster[]> {
    // Sort activities by timestamp
    const sortedActivities = [...activities].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    const clusters: ActivityCluster[] = [];
    let currentCluster: Activity[] = [];
    
    for (const activity of sortedActivities) {
      if (currentCluster.length === 0) {
        currentCluster.push(activity);
      } else {
        const lastActivity = currentCluster[currentCluster.length - 1];
        const timeDiff = (activity.timestamp.getTime() - lastActivity.timestamp.getTime()) / (1000 * 60);
        
        if (timeDiff <= config.timeWindowMinutes!) {
          currentCluster.push(activity);
        } else {
          // Finalize current cluster
          if (currentCluster.length >= config.minActivitiesForCluster!) {
            clusters.push(this.createCluster(currentCluster, 'temporal'));
          } else {
            currentCluster.forEach(act => {
              clusters.push(this.createSingletonCluster(act));
            });
          }
          currentCluster = [activity];
        }
      }
    }
    
    // Handle last cluster
    if (currentCluster.length >= config.minActivitiesForCluster!) {
      clusters.push(this.createCluster(currentCluster, 'temporal'));
    } else {
      currentCluster.forEach(act => {
        clusters.push(this.createSingletonCluster(act));
      });
    }
    
    return clusters;
  }

  private async clusterBySemantic(activities: Activity[], config: ClusterConfig): Promise<ActivityCluster[]> {
    // Simple semantic clustering based on keywords in titles/descriptions
    const clusters: ActivityCluster[] = [];
    const processed = new Set<string>();
    
    for (const activity of activities) {
      if (processed.has(activity.id)) continue;
      
      const keywords = this.extractKeywords(activity);
      const similar = activities.filter(other => 
        !processed.has(other.id) &&
        this.calculateSemanticSimilarity(keywords, this.extractKeywords(other)) > 0.7
      );
      
      if (similar.length >= config.minActivitiesForCluster!) {
        clusters.push(this.createCluster(similar, 'semantic'));
        similar.forEach(a => processed.add(a.id));
      } else {
        clusters.push(this.createSingletonCluster(activity));
        processed.add(activity.id);
      }
    }
    
    return clusters;
  }

  private async hybridClustering(activities: Activity[], config: ClusterConfig): Promise<ActivityCluster[]> {
    const clusters: ActivityCluster[] = [];
    const processed = new Set<string>();
    
    for (const activity of activities) {
      if (processed.has(activity.id)) continue;
      
      // Calculate similarity scores with all other activities
      const similarities = activities
        .filter(other => !processed.has(other.id) && other.id !== activity.id)
        .map(other => ({
          activity: other,
          score: this.calculateHybridSimilarity(activity, other, config)
        }))
        .filter(sim => sim.score > 0.6) // Threshold for clustering
        .sort((a, b) => b.score - a.score);
      
      // Create cluster with similar activities
      const clusterActivities = [activity, ...similarities.map(s => s.activity)];
      
      if (clusterActivities.length >= config.minActivitiesForCluster!) {
        clusters.push(this.createCluster(clusterActivities, 'hybrid'));
        clusterActivities.forEach(a => processed.add(a.id));
      } else {
        clusters.push(this.createSingletonCluster(activity));
        processed.add(activity.id);
      }
    }
    
    return clusters;
  }

  private calculateHybridSimilarity(activity1: Activity, activity2: Activity, config: ClusterConfig): number {
    let score = 0;
    
    // Location similarity
    const locationSim = this.isSameLocation(activity1, activity2) ? 1 : 0;
    score += locationSim * (config.locationWeight || 0.4);
    
    // Type similarity  
    const typeSim = activity1.type === activity2.type ? 1 : 0;
    score += typeSim * (config.typeWeight || 0.3);
    
    // Temporal similarity
    const timeDiff = Math.abs(activity1.timestamp.getTime() - activity2.timestamp.getTime()) / (1000 * 60);
    const temporalSim = Math.max(0, 1 - (timeDiff / (config.timeWindowMinutes || 15)));
    score += temporalSim * (config.temporalWeight || 0.2);
    
    // Semantic similarity
    const keywords1 = this.extractKeywords(activity1);
    const keywords2 = this.extractKeywords(activity2);
    const semanticSim = this.calculateSemanticSimilarity(keywords1, keywords2);
    score += semanticSim * (config.semanticWeight || 0.1);
    
    return score;
  }

  private async applySmartClustering(clusters: ActivityCluster[], config: ClusterConfig): Promise<ActivityCluster[]> {
    // Merge overlapping clusters
    const mergedClusters = this.mergeOverlappingClusters(clusters);
    
    // Split clusters that are too large or incoherent
    const refinedClusters = this.splitIncoherentClusters(mergedClusters);
    
    // Enhance cluster metadata with AI insights
    return refinedClusters.map(cluster => this.enhanceClusterWithAI(cluster));
  }

  private mergeOverlappingClusters(clusters: ActivityCluster[]): ActivityCluster[] {
    // Simple implementation - can be enhanced with more sophisticated logic
    return clusters; // TODO: Implement cluster merging
  }

  private splitIncoherentClusters(clusters: ActivityCluster[]): ActivityCluster[] {
    // Split clusters with low coherence scores
    return clusters.filter(cluster => cluster.coherenceScore > 0.5);
  }

  private enhanceClusterWithAI(cluster: ActivityCluster): ActivityCluster {
    // Add AI-generated insights about the cluster
    return {
      ...cluster,
      description: this.generateClusterDescription(cluster),
      confidenceScore: this.calculateClusterConfidence(cluster)
    };
  }

  private createCluster(activities: Activity[], clusteringMethod: string): ActivityCluster {
    const representative = this.selectRepresentative(activities);
    const timeRange = this.calculateTimeRange(activities);
    const highestPriority = this.getHighestPriority(activities);
    
    return {
      id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'cluster',
      activities,
      representative,
      count: activities.length,
      highestPriority,
      clusterType: representative.type,
      location: representative.location,
      building: representative.building,
      zone: representative.zone,
      timeRange,
      coherenceScore: this.calculateCoherenceScore(activities),
      confidenceScore: 0.8, // Will be enhanced by AI
      title: this.generateClusterTitle(activities, clusteringMethod),
      description: this.generateClusterDescription({ activities } as ActivityCluster),
      isExpanded: false
    };
  }

  private createSingletonCluster(activity: Activity): ActivityCluster {
    return {
      id: `single-${activity.id}`,
      type: 'single',
      activities: [activity],
      representative: activity,
      count: 1,
      highestPriority: activity.priority,
      clusterType: activity.type,
      location: activity.location,
      building: activity.building,
      zone: activity.zone,
      timeRange: {
        start: activity.timestamp,
        end: activity.timestamp,
        duration: 0
      },
      coherenceScore: 1.0,
      confidenceScore: 1.0,
      title: activity.title,
      description: activity.description || '',
      isExpanded: false
    };
  }

  private createSingletonClusters(activities: Activity[], executionTime: number): ClusterActivitiesResult {
    const clusters = activities.map(activity => this.createSingletonCluster(activity));
    
    return {
      clusters,
      totalActivities: activities.length,
      totalClusters: clusters.length,
      clusteringEfficiency: 0,
      executionTime
    };
  }

  // Helper methods
  private isSameLocation(activity1: Activity, activity2: Activity): boolean {
    return activity1.location === activity2.location && 
           activity1.building === activity2.building &&
           activity1.zone === activity2.zone;
  }

  private isWithinTimeWindow(activity1: Activity, activity2: Activity, windowMinutes: number): boolean {
    const timeDiff = Math.abs(activity1.timestamp.getTime() - activity2.timestamp.getTime()) / (1000 * 60);
    return timeDiff <= windowMinutes;
  }

  private extractKeywords(activity: Activity): string[] {
    const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
    return text.split(/\s+/).filter(word => word.length > 3);
  }

  private calculateSemanticSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private selectRepresentative(activities: Activity[]): Activity {
    // Select the most important activity (highest priority, most recent)
    return activities.reduce((rep, activity) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const repPriority = priorityOrder[rep.priority as keyof typeof priorityOrder];
      const actPriority = priorityOrder[activity.priority as keyof typeof priorityOrder];
      
      if (actPriority > repPriority) return activity;
      if (actPriority === repPriority && activity.timestamp > rep.timestamp) return activity;
      return rep;
    });
  }

  private calculateTimeRange(activities: Activity[]): { start: Date; end: Date; duration: number } {
    const timestamps = activities.map(a => a.timestamp.getTime());
    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    
    return { start, end, duration };
  }

  private getHighestPriority(activities: Activity[]): Priority {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return activities.reduce((highest, activity) => {
      const highestValue = priorityOrder[highest as keyof typeof priorityOrder];
      const activityValue = priorityOrder[activity.priority as keyof typeof priorityOrder];
      return activityValue > highestValue ? activity.priority : highest;
    }, 'low' as Priority);
  }

  private calculateCoherenceScore(activities: Activity[]): number {
    // Simple coherence calculation based on similarity of activities
    if (activities.length <= 1) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const similarity = this.calculateHybridSimilarity(activities[i], activities[j], this.defaultConfig);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private generateClusterTitle(activities: Activity[], method: string): string {
    const representative = this.selectRepresentative(activities);
    const count = activities.length;
    
    if (method === 'location') {
      return `${count} activities at ${representative.location}`;
    } else if (method === 'type') {
      return `${count} ${representative.type} activities`;
    } else {
      return `${count} related activities`;
    }
  }

  private generateClusterDescription(cluster: { activities: Activity[] }): string {
    const types = [...new Set(cluster.activities.map(a => a.type))];
    const locations = [...new Set(cluster.activities.map(a => a.location))];
    
    return `${cluster.activities.length} activities across ${types.join(', ')} in ${locations.join(', ')}`;
  }

  private calculateClusterConfidence(cluster: ActivityCluster): number {
    // Calculate confidence based on coherence and cluster size
    const sizeScore = Math.min(cluster.count / 10, 1); // Up to 10 activities = max score
    return (cluster.coherenceScore + sizeScore) / 2;
  }

  private sortClustersByImportance(clusters: ActivityCluster[]): ActivityCluster[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    return clusters.sort((a, b) => {
      // First by priority
      const aPriority = priorityOrder[a.highestPriority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.highestPriority as keyof typeof priorityOrder];
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Then by cluster size
      if (a.count !== b.count) return b.count - a.count;
      
      // Finally by time (most recent first)
      return b.timeRange.end.getTime() - a.timeRange.end.getTime();
    });
  }
}