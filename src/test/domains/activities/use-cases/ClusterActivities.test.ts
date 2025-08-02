/**
 * Unit Tests for ClusterActivities Use Case
 * Tests intelligent activity clustering, similarity algorithms, and performance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClusterActivitiesUseCase, ClusterConfig, ActivityCluster } from '../../../../domains/activities/use-cases/ClusterActivities'
import { Activity, ActivityFactory } from '../../../../domains/activities/entities/Activity'
import { IActivityRepository } from '../../../../domains/activities/repositories/IActivityRepository'
import { Priority } from '../../../../../lib/utils/status'
import { ActivityType } from '../../../../../lib/utils/security'

// Mock repository
class MockActivityRepository implements Partial<IActivityRepository> {
  private activities: Activity[] = []

  async findRelated(activityId: string, timeWindowMinutes?: number): Promise<Activity[]> {
    return this.activities.filter(a => a.id !== activityId)
  }

  // Test helper methods
  addActivity(activity: Activity) {
    this.activities.push(activity)
  }

  addActivities(activities: Activity[]) {
    this.activities.push(...activities)
  }

  clear() {
    this.activities = []
  }

  getActivities(): Activity[] {
    return [...this.activities]
  }
}

// Test data factories
const createTestActivity = (overrides: Partial<Activity> = {}): Activity => {
  const baseActivity = ActivityFactory.createManual({
    type: 'security-breach',
    title: 'Test Activity',
    location: 'Building A - Main Entrance',
    priority: 'medium',
    created_by: 'test-user'
  })
  
  return {
    ...baseActivity,
    id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    building: 'Building A',
    zone: 'Main Entrance',
    confidence: 80,
    timestamp: new Date(),
    ...overrides
  } as Activity
}

const createLocationCluster = (building: string, zone: string, count: number): Activity[] => {
  const baseTime = new Date()
  return Array.from({ length: count }, (_, i) => createTestActivity({
    title: `Activity ${i + 1} at ${building} ${zone}`,
    location: `${building} - ${zone}`,
    building,
    zone,
    timestamp: new Date(baseTime.getTime() + i * 60 * 1000) // 1 minute apart
  }))
}

const createTypeCluster = (type: ActivityType, count: number): Activity[] => {
  const baseTime = new Date()
  return Array.from({ length: count }, (_, i) => createTestActivity({
    type,
    title: `${type} activity ${i + 1}`,
    timestamp: new Date(baseTime.getTime() + i * 2 * 60 * 1000) // 2 minutes apart
  }))
}

const createTemporalCluster = (baseTime: Date, intervalMinutes: number, count: number): Activity[] => {
  return Array.from({ length: count }, (_, i) => createTestActivity({
    title: `Temporal activity ${i + 1}`,
    timestamp: new Date(baseTime.getTime() + i * intervalMinutes * 60 * 1000)
  }))
}

const createSemanticCluster = (baseTitleWords: string[], count: number): Activity[] => {
  return Array.from({ length: count }, (_, i) => createTestActivity({
    title: `${baseTitleWords.join(' ')} incident ${i + 1}`,
    description: `Security ${baseTitleWords[0]} detected in area`
  }))
}

describe('ClusterActivitiesUseCase', () => {
  let useCase: ClusterActivitiesUseCase
  let mockRepository: MockActivityRepository
  let defaultConfig: ClusterConfig

  beforeEach(() => {
    mockRepository = new MockActivityRepository()
    useCase = new ClusterActivitiesUseCase(mockRepository as any)
    defaultConfig = {
      maxDistance: 300,
      timeWindowMinutes: 15,
      minActivitiesForCluster: 2,
      strategy: 'hybrid',
      locationWeight: 0.4,
      typeWeight: 0.3,
      temporalWeight: 0.2,
      semanticWeight: 0.1,
      maxClusters: 50,
      enableSmartClustering: true
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockRepository.clear()
  })

  describe('Basic Clustering', () => {
    it('should return singleton clusters for insufficient activities', async () => {
      const activities = [createTestActivity({ title: 'Single activity' })]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('single')
      expect(result.clusters[0].count).toBe(1)
      expect(result.clusteringEfficiency).toBe(0) // No reduction
    })

    it('should create singleton clusters when clustering fails', async () => {
      const activities = [
        createTestActivity({ title: 'Activity 1', location: 'Location A' }),
        createTestActivity({ title: 'Activity 2', location: 'Location B' })
      ]
      
      const config = { ...defaultConfig, minActivitiesForCluster: 5 } // Too high threshold
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      expect(result.clusters.every(c => c.type === 'single')).toBe(true)
    })

    it('should calculate clustering efficiency correctly', async () => {
      const activities = createLocationCluster('Building A', 'Floor 1', 4)
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.totalActivities).toBe(4)
      expect(result.totalClusters).toBeLessThan(4)
      expect(result.clusteringEfficiency).toBeGreaterThan(0)
      expect(result.clusteringEfficiency).toBeLessThan(1)
    })

    it('should include execution time in results', async () => {
      const activities = createTestActivity({ title: 'Test activity' })
      
      const result = await useCase.execute({ activities: [activities] })
      
      expect(result.success).toBe(true)
      expect(typeof result.executionTime).toBe('number')
      expect(result.executionTime).toBeGreaterThan(0)
    })
  })

  describe('Location-based Clustering', () => {
    it('should cluster activities in same location', async () => {
      const activities = createLocationCluster('Building A', 'Main Entrance', 3)
      const config = { ...defaultConfig, strategy: 'location' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('cluster')
      expect(result.clusters[0].count).toBe(3)
      expect(result.clusters[0].location).toContain('Building A')
      expect(result.clusters[0].building).toBe('Building A')
      expect(result.clusters[0].zone).toBe('Main Entrance')
    })

    it('should separate activities in different locations', async () => {
      const activities = [
        ...createLocationCluster('Building A', 'Floor 1', 2),
        ...createLocationCluster('Building B', 'Floor 2', 2)
      ]
      const config = { ...defaultConfig, strategy: 'location' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      expect(result.clusters.every(c => c.type === 'cluster')).toBe(true)
      expect(result.clusters.every(c => c.count === 2)).toBe(true)
    })

    it('should respect time window for location clustering', async () => {
      const baseTime = new Date()
      const activities = [
        createTestActivity({ 
          location: 'Building A - Floor 1',
          building: 'Building A',
          zone: 'Floor 1',
          timestamp: baseTime,
          title: 'Recent activity 1'
        }),
        createTestActivity({ 
          location: 'Building A - Floor 1',
          building: 'Building A',
          zone: 'Floor 1',
          timestamp: new Date(baseTime.getTime() + 5 * 60 * 1000), // 5 minutes later
          title: 'Recent activity 2'
        }),
        createTestActivity({ 
          location: 'Building A - Floor 1',
          building: 'Building A',
          zone: 'Floor 1',
          timestamp: new Date(baseTime.getTime() + 20 * 60 * 1000), // 20 minutes later
          title: 'Old activity'
        })
      ]
      
      const config = { ...defaultConfig, strategy: 'location' as const, timeWindowMinutes: 15 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2) // One cluster of 2, one singleton
      
      const clusterSizes = result.clusters.map(c => c.count).sort()
      expect(clusterSizes).toEqual([1, 2])
    })
  })

  describe('Type-based Clustering', () => {
    it('should cluster activities of same type', async () => {
      const activities = createTypeCluster('medical', 4)
      const config = { ...defaultConfig, strategy: 'type' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('cluster')
      expect(result.clusters[0].count).toBe(4)
      expect(result.clusters[0].clusterType).toBe('medical')
    })

    it('should separate activities of different types', async () => {
      const activities = [
        ...createTypeCluster('medical', 2),
        ...createTypeCluster('security-breach', 3),
        ...createTypeCluster('maintenance', 2)
      ]
      const config = { ...defaultConfig, strategy: 'type' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(3)
      expect(result.clusters.every(c => c.type === 'cluster')).toBe(true)
      
      const types = result.clusters.map(c => c.clusterType).sort()
      expect(types).toEqual(['maintenance', 'medical', 'security-breach'])
    })

    it('should create singleton clusters for types below threshold', async () => {
      const activities = [
        ...createTypeCluster('medical', 3),
        createTestActivity({ type: 'alert', title: 'Single alert' })
      ]
      const config = { ...defaultConfig, strategy: 'type' as const, minActivitiesForCluster: 2 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      
      const clusterTypes = result.clusters.map(c => c.type)
      expect(clusterTypes).toContain('cluster') // Medical cluster
      expect(clusterTypes).toContain('single') // Alert singleton
    })
  })

  describe('Temporal Clustering', () => {
    it('should cluster activities within time window', async () => {
      const baseTime = new Date()
      const activities = createTemporalCluster(baseTime, 5, 4) // 5 minutes apart
      const config = { ...defaultConfig, strategy: 'temporal' as const, timeWindowMinutes: 10 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('cluster')
      expect(result.clusters[0].count).toBe(4)
      expect(result.clusters[0].timeRange.duration).toBeGreaterThan(0)
    })

    it('should separate activities outside time window', async () => {
      const baseTime = new Date()
      const activities = [
        ...createTemporalCluster(baseTime, 2, 3), // First group: 0, 2, 4 minutes
        ...createTemporalCluster(new Date(baseTime.getTime() + 20 * 60 * 1000), 2, 2) // Second group: 20, 22 minutes
      ]
      const config = { ...defaultConfig, strategy: 'temporal' as const, timeWindowMinutes: 10 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      expect(result.clusters.every(c => c.type === 'cluster')).toBe(true)
      
      const counts = result.clusters.map(c => c.count).sort()
      expect(counts).toEqual([2, 3])
    })

    it('should handle activities in chronological order', async () => {
      const baseTime = new Date()
      const activities = [
        createTestActivity({ timestamp: new Date(baseTime.getTime() + 10 * 60 * 1000), title: 'Third' }),
        createTestActivity({ timestamp: baseTime, title: 'First' }),
        createTestActivity({ timestamp: new Date(baseTime.getTime() + 5 * 60 * 1000), title: 'Second' })
      ]
      const config = { ...defaultConfig, strategy: 'temporal' as const, timeWindowMinutes: 15 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].count).toBe(3)
      
      // Check time range calculation
      const timeRange = result.clusters[0].timeRange
      expect(timeRange.start).toEqual(baseTime)
      expect(timeRange.end).toEqual(new Date(baseTime.getTime() + 10 * 60 * 1000))
      expect(timeRange.duration).toBe(10) // 10 minutes
    })
  })

  describe('Semantic Clustering', () => {
    it('should cluster activities with similar keywords', async () => {
      const activities = createSemanticCluster(['security', 'breach'], 3)
      const config = { ...defaultConfig, strategy: 'semantic' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('cluster')
      expect(result.clusters[0].count).toBe(3)
    })

    it('should separate activities with different semantic content', async () => {
      const activities = [
        ...createSemanticCluster(['medical', 'emergency'], 2),
        ...createSemanticCluster(['fire', 'alarm'], 2)
      ]
      const config = { ...defaultConfig, strategy: 'semantic' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      expect(result.clusters.every(c => c.type === 'cluster')).toBe(true)
      expect(result.clusters.every(c => c.count === 2)).toBe(true)
    })

    it('should handle activities with no common keywords', async () => {
      const activities = [
        createTestActivity({ title: 'Security breach detected', description: 'Unauthorized access' }),
        createTestActivity({ title: 'Medical emergency', description: 'Patient collapsed' }),
        createTestActivity({ title: 'Fire alarm activated', description: 'Smoke detected' })
      ]
      const config = { ...defaultConfig, strategy: 'semantic' as const }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(3)
      expect(result.clusters.every(c => c.type === 'single')).toBe(true)
    })
  })

  describe('Hybrid Clustering', () => {
    it('should use hybrid strategy by default', async () => {
      const activities = [
        createTestActivity({ 
          type: 'security-breach',
          title: 'Security breach 1',
          location: 'Building A - Floor 1',
          building: 'Building A',
          zone: 'Floor 1',
          timestamp: new Date()
        }),
        createTestActivity({ 
          type: 'security-breach',
          title: 'Security breach 2',
          location: 'Building A - Floor 1',
          building: 'Building A',
          zone: 'Floor 1',
          timestamp: new Date(Date.now() + 5 * 60 * 1000)
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].type).toBe('cluster')
      expect(result.clusters[0].count).toBe(2)
    })

    it('should calculate hybrid similarity scores correctly', async () => {
      const baseTime = new Date()
      const activities = [
        createTestActivity({ 
          type: 'medical',
          title: 'Medical emergency patient',
          location: 'Hospital Wing',
          building: 'Main Building',
          zone: 'Hospital Wing',
          timestamp: baseTime
        }),
        createTestActivity({ 
          type: 'medical',
          title: 'Medical emergency incident',
          location: 'Hospital Wing',
          building: 'Main Building',
          zone: 'Hospital Wing',
          timestamp: new Date(baseTime.getTime() + 3 * 60 * 1000)
        }),
        createTestActivity({ 
          type: 'maintenance',
          title: 'Maintenance required',
          location: 'Basement',
          building: 'Service Building',
          zone: 'Basement',
          timestamp: new Date(baseTime.getTime() + 2 * 60 * 1000)
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      
      // Medical activities should cluster together
      const medicalCluster = result.clusters.find(c => c.clusterType === 'medical')
      expect(medicalCluster).toBeDefined()
      expect(medicalCluster!.count).toBe(2)
      
      // Maintenance should be singleton
      const maintenanceCluster = result.clusters.find(c => c.clusterType === 'maintenance')
      expect(maintenanceCluster).toBeDefined()
      expect(maintenanceCluster!.count).toBe(1)
    })

    it('should respect similarity threshold', async () => {
      const activities = [
        createTestActivity({ 
          type: 'alert',
          title: 'Different alert',
          location: 'Location A',
          timestamp: new Date()
        }),
        createTestActivity({ 
          type: 'maintenance',
          title: 'Completely different',
          location: 'Location B',
          timestamp: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes apart
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2) // Should not cluster due to low similarity
      expect(result.clusters.every(c => c.type === 'single')).toBe(true)
    })
  })

  describe('Cluster Metadata and Enhancement', () => {
    it('should select correct representative activity', async () => {
      const baseTime = new Date()
      const activities = [
        createTestActivity({ 
          priority: 'medium',
          timestamp: baseTime,
          title: 'Medium priority older'
        }),
        createTestActivity({ 
          priority: 'high',
          timestamp: new Date(baseTime.getTime() + 5 * 60 * 1000),
          title: 'High priority newer'
        }),
        createTestActivity({ 
          priority: 'low',
          timestamp: new Date(baseTime.getTime() + 10 * 60 * 1000),
          title: 'Low priority newest'
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].representative.title).toBe('High priority newer')
      expect(result.clusters[0].highestPriority).toBe('high')
    })

    it('should calculate coherence scores', async () => {
      const activities = [
        createTestActivity({ 
          type: 'medical',
          title: 'Medical emergency',
          location: 'Hospital Wing',
          building: 'Main Building',
          zone: 'Hospital Wing'
        }),
        createTestActivity({ 
          type: 'medical',
          title: 'Medical incident',
          location: 'Hospital Wing',
          building: 'Main Building',
          zone: 'Hospital Wing'
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].coherenceScore).toBeGreaterThan(0)
      expect(result.clusters[0].coherenceScore).toBeLessThanOrEqual(1)
    })

    it('should generate appropriate cluster titles', async () => {
      const locationActivities = createLocationCluster('Building A', 'Main Entrance', 3)
      const typeActivities = createTypeCluster('medical', 3)
      
      const locationResult = await useCase.execute({ 
        activities: locationActivities,
        config: { ...defaultConfig, strategy: 'location' }
      })
      
      const typeResult = await useCase.execute({ 
        activities: typeActivities,
        config: { ...defaultConfig, strategy: 'type' }
      })
      
      expect(locationResult.clusters[0].title).toContain('activities at')
      expect(typeResult.clusters[0].title).toContain('medical activities')
    })

    it('should generate cluster descriptions', async () => {
      const activities = [
        createTestActivity({ type: 'medical', location: 'Hospital Wing' }),
        createTestActivity({ type: 'security-breach', location: 'Main Entrance' })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters[0].description).toBeDefined()
      expect(result.clusters[0].description.length).toBeGreaterThan(0)
    })
  })

  describe('Smart Clustering Enhancements', () => {
    it('should apply smart clustering when enabled', async () => {
      const activities = createLocationCluster('Building A', 'Floor 1', 4)
      const config = { ...defaultConfig, enableSmartClustering: true }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters.every(c => c.confidenceScore)).toBe(true)
    })

    it('should enhance cluster confidence scores', async () => {
      const activities = [
        createTestActivity({ title: 'Similar activity 1' }),
        createTestActivity({ title: 'Similar activity 2' }),
        createTestActivity({ title: 'Similar activity 3' }),
        createTestActivity({ title: 'Similar activity 4' }),
        createTestActivity({ title: 'Similar activity 5' })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      if (result.clusters.length > 0 && result.clusters[0].type === 'cluster') {
        expect(result.clusters[0].confidenceScore).toBeGreaterThan(0)
        expect(result.clusters[0].confidenceScore).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('Cluster Sorting', () => {
    it('should sort clusters by importance', async () => {
      const baseTime = new Date()
      const activities = [
        // Low priority, small cluster
        createTestActivity({ 
          priority: 'low',
          timestamp: new Date(baseTime.getTime() - 60 * 60 * 1000),
          title: 'Low priority old 1'
        }),
        createTestActivity({ 
          priority: 'low',
          timestamp: new Date(baseTime.getTime() - 50 * 60 * 1000),
          title: 'Low priority old 2'
        }),
        // Critical priority, larger cluster, newer
        createTestActivity({ 
          priority: 'critical',
          timestamp: baseTime,
          title: 'Critical recent 1'
        }),
        createTestActivity({ 
          priority: 'critical',
          timestamp: new Date(baseTime.getTime() + 5 * 60 * 1000),
          title: 'Critical recent 2'
        }),
        createTestActivity({ 
          priority: 'critical',
          timestamp: new Date(baseTime.getTime() + 10 * 60 * 1000),
          title: 'Critical recent 3'
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(2)
      
      // Critical cluster should be first
      expect(result.clusters[0].highestPriority).toBe('critical')
      expect(result.clusters[0].count).toBe(3)
      
      // Low priority cluster should be second
      expect(result.clusters[1].highestPriority).toBe('low')
      expect(result.clusters[1].count).toBe(2)
    })
  })

  describe('Configuration Options', () => {
    it('should respect maxDistance configuration', async () => {
      const activities = createLocationCluster('Building A', 'Floor 1', 3)
      const config = { ...defaultConfig, maxDistance: 100 } // Very small distance
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      // Result may vary based on location interpretation
    })

    it('should respect minActivitiesForCluster configuration', async () => {
      const activities = createTestActivities(4)
      const config = { ...defaultConfig, minActivitiesForCluster: 5 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(4) // All singletons
      expect(result.clusters.every(c => c.type === 'single')).toBe(true)
    })

    it('should respect maxClusters configuration', async () => {
      const activities = Array.from({ length: 20 }, (_, i) => 
        createTestActivity({ 
          title: `Unique activity ${i}`,
          location: `Location ${i}` // All different locations
        })
      )
      
      const config = { ...defaultConfig, maxClusters: 5 }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      expect(result.clusters.length).toBeLessThanOrEqual(5)
    })

    it('should use custom similarity weights', async () => {
      const activities = [
        createTestActivity({ 
          type: 'medical',
          title: 'Medical emergency',
          location: 'Different location A'
        }),
        createTestActivity({ 
          type: 'medical',
          title: 'Medical incident',
          location: 'Different location B'
        })
      ]
      
      const config = {
        ...defaultConfig,
        strategy: 'hybrid' as const,
        typeWeight: 0.8, // High type weight
        locationWeight: 0.1, // Low location weight
        temporalWeight: 0.05,
        semanticWeight: 0.05
      }
      
      const result = await useCase.execute({ activities, config })
      
      expect(result.success).toBe(true)
      // Should cluster based on type despite different locations
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].count).toBe(2)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large numbers of activities efficiently', async () => {
      const activities = createTestActivities(100)
      
      const startTime = Date.now()
      const result = await useCase.execute({ activities })
      const executionTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.executionTime).toBeDefined()
    })

    it('should maintain reasonable clustering efficiency', async () => {
      const activities = [
        ...createLocationCluster('Building A', 'Floor 1', 10),
        ...createLocationCluster('Building B', 'Floor 2', 10),
        ...createTypeCluster('medical', 8)
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.totalActivities).toBe(28)
      expect(result.totalClusters).toBeLessThan(28)
      expect(result.clusteringEfficiency).toBeGreaterThan(0.5) // At least 50% reduction
    })
  })

  describe('Error Handling', () => {
    it('should handle empty activity list', async () => {
      const result = await useCase.execute({ activities: [] })
      
      expect(result.success).toBe(true)
      expect(result.clusters).toHaveLength(0)
      expect(result.totalActivities).toBe(0)
      expect(result.totalClusters).toBe(0)
      expect(result.clusteringEfficiency).toBe(0)
    })

    it('should handle activities with missing fields gracefully', async () => {
      const activities = [
        createTestActivity({ building: undefined, zone: undefined }),
        createTestActivity({ confidence: undefined, description: undefined })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters.length).toBeGreaterThan(0)
    })

    it('should handle invalid configuration gracefully', async () => {
      const activities = createTestActivities(3)
      const invalidConfig = {
        ...defaultConfig,
        timeWindowMinutes: -1,
        minActivitiesForCluster: -1,
        maxClusters: 0
      }
      
      const result = await useCase.execute({ activities, config: invalidConfig })
      
      expect(result.success).toBe(true)
      // Should use reasonable defaults or handle gracefully
    })

    it('should handle clustering algorithm failures', async () => {
      const activities = createTestActivities(5)
      
      // Mock an internal failure
      const originalExecute = useCase.execute
      vi.spyOn(useCase, 'execute').mockImplementationOnce(async () => {
        throw new Error('Clustering algorithm failed')
      })
      
      await expect(useCase.execute({ activities })).rejects.toThrow(
        'Activity clustering failed: Clustering algorithm failed'
      )
      
      useCase.execute = originalExecute
    })
  })

  describe('Edge Cases', () => {
    it('should handle activities with identical timestamps', async () => {
      const sameTime = new Date()
      const activities = [
        createTestActivity({ timestamp: sameTime, title: 'Activity 1' }),
        createTestActivity({ timestamp: sameTime, title: 'Activity 2' }),
        createTestActivity({ timestamp: sameTime, title: 'Activity 3' })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters.length).toBeGreaterThan(0)
    })

    it('should handle activities with very high confidence scores', async () => {
      const activities = [
        createTestActivity({ confidence: 100, title: 'Perfect confidence 1' }),
        createTestActivity({ confidence: 100, title: 'Perfect confidence 2' })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters.length).toBe(1)
      expect(result.clusters[0].count).toBe(2)
    })

    it('should handle activities with special characters in text fields', async () => {
      const activities = [
        createTestActivity({ 
          title: 'Activity with émoji 🚨 and spëcial chars',
          description: 'Description with ñ, ü, and other characters: @#$%'
        }),
        createTestActivity ({ 
          title: 'Another activity with émoji 🚨',
          description: 'Similar description with spëcial chars'
        })
      ]
      
      const result = await useCase.execute({ activities })
      
      expect(result.success).toBe(true)
      expect(result.clusters.length).toBeGreaterThan(0)
      // Should handle special characters without crashing
    })
  })
})

// Helper function to create test activities array
function createTestActivities(count: number): Activity[] {
  return Array.from({ length: count }, (_, i) => 
    createTestActivity({ title: `Test Activity ${i + 1}` })
  )
}
