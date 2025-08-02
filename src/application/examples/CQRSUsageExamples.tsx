/**
 * CQRS Usage Examples
 * Demonstrates how to use the new Command/Query separation architecture
 */

import { 
  initializeCQRS, 
  getCQRSService,
  createActivityCommand,
  createActivityQuery 
} from '../CQRSIntegrationService';
import { 
  CreateActivityCommand,
  UpdateActivityCommand,
  AssignActivityCommand,
  BulkUpdateStatusCommand 
} from '../commands/activity/ActivityCommands';
import {
  GetActivitiesQuery,
  GetActivityByIdQuery,
  SearchActivitiesQuery,
  GetActivityStatsQuery
} from '../queries/activity/ActivityQueries';

// ===== INITIALIZATION EXAMPLE =====

export async function initializeExample() {
  try {
    // Initialize the CQRS system
    const cqrsService = await initializeCQRS();
    
    console.log('✅ CQRS System initialized');
    
    // Check health
    const health = await cqrsService.healthCheck();
    console.log('Health check:', health);
    
    return cqrsService;
  } catch (error) {
    console.error('❌ Failed to initialize CQRS:', error);
    throw error;
  }
}

// ===== COMMAND EXAMPLES =====

export async function createActivityExample() {
  const cqrsService = getCQRSService();
  
  // Method 1: Using the convenience method
  const result1 = await cqrsService.getApplicationService().createActivity({
    activityType: 'security-breach',
    title: 'Unauthorized Access Attempt',
    location: 'Building A - Entrance',
    priority: 'high',
    description: 'Multiple failed badge attempts detected',
    building: 'Building A',
    zone: 'Entrance',
    confidence: 85
  }, 'user123');
  
  console.log('Create activity result:', result1);
  
  // Method 2: Using explicit command
  const command: CreateActivityCommand = {
    type: 'CreateActivity',
    userId: 'user123',
    timestamp: new Date(),
    correlationId: 'example-correlation-id',
    data: {
      activityType: 'medical',
      title: 'Medical Emergency',
      location: 'Building B - 2nd Floor',
      priority: 'critical',
      description: 'Person down, ambulance requested',
      building: 'Building B',
      zone: '2nd Floor'
    }
  };
  
  const result2 = await cqrsService.executeCommand(command);
  console.log('Command result:', result2);
  
  return result1.success ? result1.data?.activityId : null;
}

export async function updateActivityExample(activityId: string) {
  const cqrsService = getCQRSService();
  
  const command: UpdateActivityCommand = {
    type: 'UpdateActivity',
    aggregateId: activityId,
    userId: 'supervisor456',
    timestamp: new Date(),
    data: {
      updates: {
        status: 'in-progress',
        assignedTo: 'responder789',
        priority: 'critical'
      },
      reason: 'Escalating due to severity'
    }
  };
  
  const result = await cqrsService.executeCommand(command);
  console.log('Update activity result:', result);
  
  return result;
}

export async function assignActivityExample(activityId: string) {
  const cqrsService = getCQRSService();
  
  const result = await cqrsService.getApplicationService().assignActivity(
    activityId,
    'responder123',
    'supervisor456',
    {
      reason: 'Best available responder',
      notifyAssignee: true
    }
  );
  
  console.log('Assign activity result:', result);
  return result;
}

export async function bulkUpdateExample(activityIds: string[]) {
  const cqrsService = getCQRSService();
  
  const command: BulkUpdateStatusCommand = {
    type: 'BulkUpdateStatus',
    userId: 'supervisor456',
    timestamp: new Date(),
    data: {
      activityIds,
      status: 'resolved',
      reason: 'Bulk resolution after incident closure',
      notifyAssigned: true
    }
  };
  
  const result = await cqrsService.executeCommand(command);
  console.log('Bulk update result:', result);
  
  return result;
}

// ===== QUERY EXAMPLES =====

export async function getActivitiesExample() {
  const cqrsService = getCQRSService();
  
  // Method 1: Using convenience method
  const result1 = await cqrsService.getApplicationService().getActivities(
    {
      types: ['security-breach', 'medical'],
      statuses: ['open', 'in-progress'],
      priorities: ['high', 'critical'],
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      },
      buildings: ['Building A', 'Building B']
    },
    {
      offset: 0,
      limit: 20
    },
    {
      field: 'timestamp',
      order: 'desc'
    }
  );
  
  console.log('Get activities result:', result1);
  
  // Method 2: Using explicit query
  const query: GetActivitiesQuery = {
    type: 'GetActivities',
    userId: 'user123',
    timestamp: new Date(),
    filters: {
      priorities: ['critical'],
      isArchived: false,
      hasIncidentContext: true
    },
    pagination: {
      offset: 0,
      limit: 10
    },
    sorting: {
      field: 'priority',
      order: 'desc'
    }
  };
  
  const result2 = await cqrsService.executeQuery(query);
  console.log('Query result:', result2);
  
  return result1;
}

export async function getActivityByIdExample(activityId: string) {
  const cqrsService = getCQRSService();
  
  const result = await cqrsService.getApplicationService().getActivityById(
    activityId,
    {
      includeRelated: true,
      includeTimeline: true,
      includeEvidence: true
    }
  );
  
  console.log('Get activity by ID result:', result);
  return result;
}

export async function searchActivitiesExample() {
  const cqrsService = getCQRSService();
  
  const result = await cqrsService.getApplicationService().searchActivities(
    'medical emergency building',
    {
      types: ['medical'],
      priorities: ['high', 'critical']
    },
    {
      offset: 0,
      limit: 15
    }
  );
  
  console.log('Search activities result:', result);
  return result;
}

export async function getActivityStatsExample() {
  const cqrsService = getCQRSService();
  
  const query: GetActivityStatsQuery = {
    type: 'GetActivityStats',
    userId: 'analyst123',
    timestamp: new Date(),
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    },
    groupBy: ['day'],
    includeComparisons: true,
    filters: {
      types: ['security-breach', 'medical', 'alert'],
      isArchived: false
    }
  };
  
  const result = await cqrsService.executeQuery(query);
  console.log('Activity stats result:', result);
  
  return result;
}

// ===== ADVANCED EXAMPLES =====

export async function transactionExample() {
  const cqrsService = getCQRSService();
  
  // Demonstrate transaction-like behavior
  const result = await cqrsService.getApplicationService().withTransaction(async () => {
    // Create an activity
    const createResult = await cqrsService.getApplicationService().createActivity({
      activityType: 'security-breach',
      title: 'Security Incident',
      location: 'Server Room',
      priority: 'critical'
    }, 'user123');
    
    if (!createResult.success) {
      throw new Error('Failed to create activity');
    }
    
    const activityId = createResult.data?.activityId!;
    
    // Assign it immediately
    const assignResult = await cqrsService.getApplicationService().assignActivity(
      activityId,
      'security-team',
      'user123',
      { notifyAssignee: true }
    );
    
    if (!assignResult.success) {
      throw new Error('Failed to assign activity');
    }
    
    // Create incident coordination
    const incidentResult = await cqrsService.getApplicationService().coordinateIncidentCreation(
      activityId,
      {
        title: 'Security Breach Investigation',
        type: 'security_breach',
        priority: 'critical'
      },
      'user123'
    );
    
    return {
      activityId,
      incidentId: incidentResult.data?.incidentId,
      assigned: true
    };
  });
  
  console.log('Transaction result:', result);
  return result;
}

export async function performanceMonitoringExample() {
  const cqrsService = getCQRSService();
  
  // Get performance metrics
  const metrics = cqrsService.getMetrics();
  console.log('Performance metrics:', metrics);
  
  // Execute some operations to generate metrics
  await createActivityExample();
  await getActivitiesExample();
  
  // Check metrics again
  const updatedMetrics = cqrsService.getMetrics();
  console.log('Updated metrics:', updatedMetrics);
  
  return updatedMetrics;
}

export async function errorHandlingExample() {
  const cqrsService = getCQRSService();
  
  try {
    // Attempt to create an invalid activity
    const result = await cqrsService.getApplicationService().createActivity({
      activityType: '', // Invalid
      title: '', // Invalid
      location: '', // Invalid
      priority: 'invalid' as any // Invalid
    }, ''); // Invalid user
    
    console.log('This should fail:', result);
  } catch (error) {
    console.log('Expected error caught:', error);
  }
  
  // Attempt to get non-existent activity
  const getResult = await cqrsService.getApplicationService().getActivityById('non-existent-id');
  console.log('Non-existent activity result:', getResult);
}

// ===== COMPLETE WORKFLOW EXAMPLE =====

export async function completeWorkflowExample() {
  console.log('🚀 Starting complete CQRS workflow example...');
  
  try {
    // 1. Initialize
    await initializeExample();
    
    // 2. Create some activities
    const activityId1 = await createActivityExample();
    if (!activityId1) throw new Error('Failed to create activity');
    
    // 3. Update and assign
    await updateActivityExample(activityId1);
    await assignActivityExample(activityId1);
    
    // 4. Query activities
    await getActivitiesExample();
    await getActivityByIdExample(activityId1);
    await searchActivitiesExample();
    
    // 5. Get statistics
    await getActivityStatsExample();
    
    // 6. Monitor performance
    await performanceMonitoringExample();
    
    // 7. Test error handling
    await errorHandlingExample();
    
    console.log('✅ Complete workflow example completed successfully');
    
  } catch (error) {
    console.error('❌ Workflow example failed:', error);
    throw error;
  }
}

// ===== USAGE IN REACT COMPONENTS =====

import React from 'react';
import { useCQRS } from '../CQRSIntegrationService';
import { useCallback, useEffect, useState } from 'react';

export function ActivityManagementExample() {
  const { isInitialized, executeCommand, executeQuery, error } = useCQRS();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadActivities = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const query = createActivityQuery('GetActivities', {
        filters: {
          statuses: ['open', 'in-progress'],
          priorities: ['high', 'critical']
        },
        pagination: { offset: 0, limit: 20 }
      });
      
      const result = await executeQuery(query);
      if (result.success) {
        setActivities(result.data.activities);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, executeQuery]);
  
  const createActivity = useCallback(async (activityData: any) => {
    if (!isInitialized) return;
    
    const command = createActivityCommand(
      'CreateActivity',
      activityData,
      'current-user-id'
    );
    
    const result = await executeCommand(command);
    if (result.success) {
      await loadActivities(); // Refresh the list
    }
    
    return result;
  }, [isInitialized, executeCommand, loadActivities]);
  
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!isInitialized) {
    return <div>Initializing CQRS system...</div>;
  }
  
  return (
    <div>
      <h2>Activity Management (CQRS)</h2>
      {loading ? (
        <div>Loading activities...</div>
      ) : (
        <div>
          <p>{activities.length} activities loaded</p>
          {/* Render activities */}
        </div>
      )}
    </div>
  );
}

// Export for easy testing
export const examples = {
  initialize: initializeExample,
  createActivity: createActivityExample,
  updateActivity: updateActivityExample,
  assignActivity: assignActivityExample,
  bulkUpdate: bulkUpdateExample,
  getActivities: getActivitiesExample,
  getActivityById: getActivityByIdExample,
  searchActivities: searchActivitiesExample,
  getActivityStats: getActivityStatsExample,
  transaction: transactionExample,
  performanceMonitoring: performanceMonitoringExample,
  errorHandling: errorHandlingExample,
  completeWorkflow: completeWorkflowExample
};