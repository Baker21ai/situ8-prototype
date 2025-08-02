/**
 * App Integration Example
 * Shows how to integrate the DI system with the main application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// DI System imports
import { 
  DependencyProvider, 
  DIDevTools,
  useService,
  useServices,
  createDevelopmentContainer,
  createProductionContainer,
  SERVICE_TOKENS 
} from './index';

// Component imports (these would be your actual components)
import { Activities } from '../../presentation/organisms/ActivityManagement';
import { CommandCenter } from '../../presentation/templates/CommandCenter';
import { Cases } from '../../presentation/organisms/CaseManagement';

// Example of how to update your main App component
export function AppWithDI() {
  // Choose composition root based on environment
  const compositionRoot = process.env.NODE_ENV === 'production' 
    ? createProductionContainer()
    : createDevelopmentContainer();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <DependencyProvider 
        compositionRoot={compositionRoot}
        enableDevTools={process.env.NODE_ENV === 'development'}
      >
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<CommandCenter />} />
                <Route path="/activities" element={<DIAwareActivities />} />
                <Route path="/command-center" element={<CommandCenter />} />
                <Route path="/cases" element={<DIAwareCases />} />
              </Routes>
            </main>
          </div>
        </Router>
        
        {/* Development tools */}
        <DIDevTools />
      </DependencyProvider>
    </QueryClientProvider>
  );
}

// Example navigation component using DI services
function AppNavigation() {
  const { commandBus, queryBus } = useServices({
    commandBus: SERVICE_TOKENS.COMMAND_BUS,
    queryBus: SERVICE_TOKENS.QUERY_BUS
  });

  const [healthStatus, setHealthStatus] = React.useState<string>('checking...');

  React.useEffect(() => {
    // Example health check using DI services
    const checkHealth = async () => {
      try {
        if (commandBus && queryBus) {
          setHealthStatus('healthy');
        } else {
          setHealthStatus('degraded');
        }
      } catch (error) {
        setHealthStatus('error');
      }
    };

    checkHealth();
  }, [commandBus, queryBus]);

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-8">
            <a href="/activities" className="text-gray-700 hover:text-blue-600">
              Activities
            </a>
            <a href="/command-center" className="text-gray-700 hover:text-blue-600">
              Command Center
            </a>
            <a href="/cases" className="text-gray-700 hover:text-blue-600">
              Cases
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded text-xs ${
              healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
              healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              System: {healthStatus}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Example Activities component enhanced with DI
function DIAwareActivities() {
  const activityService = useService(SERVICE_TOKENS.ACTIVITY_SERVICE);
  const commandBus = useService(SERVICE_TOKENS.COMMAND_BUS);
  const queryBus = useService(SERVICE_TOKENS.QUERY_BUS);

  const [activities, setActivities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        
        const result = await queryBus.execute({
          type: 'SearchActivitiesQuery',
          userId: 'current-user', // Would come from auth context
          criteria: {
            limit: 50,
            sortBy: 'timestamp',
            sortOrder: 'desc'
          }
        });

        if (result.success) {
          setActivities(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [queryBus]);

  const handleCreateActivity = async (activityData: any) => {
    try {
      const result = await commandBus.execute({
        type: 'CreateActivityCommand',
        userId: 'current-user',
        data: activityData
      });

      if (result.success) {
        // Refresh activities list
        const refreshResult = await queryBus.execute({
          type: 'SearchActivitiesQuery',
          userId: 'current-user',
          criteria: { limit: 50 }
        });

        if (refreshResult.success) {
          setActivities(refreshResult.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <button
          onClick={() => handleCreateActivity({
            title: 'Sample Activity',
            type: 'security-breach',
            priority: 'medium'
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Activity
        </button>
      </div>

      <div className="grid gap-4">
        {activities.map((activity: any) => (
          <div key={activity.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">{activity.title}</h3>
            <p className="text-gray-600">{activity.description}</p>
            <div className="mt-2 flex space-x-2">
              <span className={`px-2 py-1 rounded text-xs ${
                activity.priority === 'critical' ? 'bg-red-100 text-red-800' :
                activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {activity.priority}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                {activity.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No activities found. Create one to get started.
        </div>
      )}
    </div>
  );
}

// Example Cases component enhanced with DI
function DIAwareCases() {
  const caseService = useService(SERVICE_TOKENS.CASE_SERVICE);
  const queryBus = useService(SERVICE_TOKENS.QUERY_BUS);

  const [cases, setCases] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        
        // If case queries are implemented
        const result = await queryBus.execute({
          type: 'SearchCasesQuery',
          userId: 'current-user',
          criteria: { limit: 20 }
        });

        if (result.success) {
          setCases(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load cases:', error);
        // Fallback to empty state
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [queryBus]);

  if (loading) {
    return <div className="flex justify-center py-8">Loading cases...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Create Case
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Investigation Management</h2>
        <p className="text-gray-600">
          Cases system is ready for implementation with full DI support.
          The case service and queries are registered and available.
        </p>
        
        {cases.length > 0 ? (
          <div className="mt-4 space-y-4">
            {cases.map((case_: any) => (
              <div key={case_.id} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">{case_.title}</h3>
                <p className="text-sm text-gray-600">{case_.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-center py-8 text-gray-500">
            No cases found. The investigation system is ready to use.
          </div>
        )}
      </div>
    </div>
  );
}

// Example custom hook for activity operations
export function useActivityOperations() {
  const commandBus = useService(SERVICE_TOKENS.COMMAND_BUS);
  const queryBus = useService(SERVICE_TOKENS.QUERY_BUS);

  const createActivity = React.useCallback(async (data: any) => {
    return await commandBus.execute({
      type: 'CreateActivityCommand',
      userId: 'current-user', // Would come from auth context
      data
    });
  }, [commandBus]);

  const updateActivity = React.useCallback(async (id: string, data: any) => {
    return await commandBus.execute({
      type: 'UpdateActivityCommand',
      userId: 'current-user',
      activityId: id,
      data
    });
  }, [commandBus]);

  const searchActivities = React.useCallback(async (criteria: any) => {
    return await queryBus.execute({
      type: 'SearchActivitiesQuery',
      userId: 'current-user',
      criteria
    });
  }, [queryBus]);

  const getActivityById = React.useCallback(async (id: string) => {
    return await queryBus.execute({
      type: 'GetActivityByIdQuery',
      userId: 'current-user',
      activityId: id
    });
  }, [queryBus]);

  return {
    createActivity,
    updateActivity,
    searchActivities,
    getActivityById
  };
}

// Example migration component that supports both old and new systems
export function MigrationAwareComponent() {
  // This hook works with both legacy and DI systems
  const services = useServiceMigration();

  React.useEffect(() => {
    console.log('Available services:', {
      // Legacy services (always available)
      hasActivityService: !!services.activityService,
      hasBOLService: !!services.bolService,
      
      // DI services (only available when DI is enabled)
      hasCommandBus: !!services.commandBus,
      hasQueryBus: !!services.queryBus,
      
      isInitialized: services.isInitialized
    });
  }, [services]);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-semibold text-yellow-800">Migration Status</h3>
      <p className="text-yellow-700">
        This component works with both legacy and DI service systems.
      </p>
      <ul className="mt-2 text-sm text-yellow-600">
        <li>✅ Activity Service: {services.activityService ? 'Available' : 'Missing'}</li>
        <li>✅ Command Bus: {services.commandBus ? 'Available (DI)' : 'Not Available'}</li>
        <li>✅ Query Bus: {services.queryBus ? 'Available (DI)' : 'Not Available'}</li>
      </ul>
    </div>
  );
}

// Helper function to gradually migrate components
function useServiceMigration() {
  // This would be imported from the actual enhanced service provider
  // It provides both legacy and DI services
  return {
    // Mock implementation for this example
    activityService: { create: () => Promise.resolve() },
    bolService: { process: () => Promise.resolve() },
    commandBus: null, // Would be available when DI is enabled
    queryBus: null,   // Would be available when DI is enabled
    isInitialized: true
  };
}

export default AppWithDI;