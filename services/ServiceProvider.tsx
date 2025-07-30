/**
 * Service Provider Component
 * Initializes all services and provides them to the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityService } from './activity.service';
import { IncidentService } from './incident.service';
import { CaseService } from './case.service';
import { BOLService } from './bol.service';
import { AuditService } from './audit.service';
import { useActivityStore } from '../stores/activityStore';

// Service context interface
interface ServiceContextType {
  activityService: ActivityService;
  incidentService: IncidentService;
  caseService: CaseService;
  bolService: BOLService;
  auditService: AuditService;
  isInitialized: boolean;
}

// Create service context
const ServiceContext = createContext<ServiceContextType | null>(null);

// Service provider component
interface ServiceProviderProps {
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [services, setServices] = useState<ServiceContextType | null>(null);
  const initializeServices = useActivityStore(state => state.initializeServices);

  useEffect(() => {
    // Initialize all services
    const activityService = new ActivityService();
    const incidentService = new IncidentService();
    const caseService = new CaseService();
    const bolService = new BOLService();
    const auditService = new AuditService();

    // Initialize stores with services
    initializeServices();

    // Create service context
    const serviceContext: ServiceContextType = {
      activityService,
      incidentService,
      caseService,
      bolService,
      auditService,
      isInitialized: true
    };

    setServices(serviceContext);

    // Run health checks on all services
    Promise.allSettled([
      activityService.healthCheck(),
      incidentService.healthCheck(),
      caseService.healthCheck(),
      bolService.healthCheck(),
      auditService.healthCheck()
    ]).then(results => {
      const unhealthyServices = results
        .map((result, index) => ({ 
          index, 
          result: result.status === 'fulfilled' ? result.value : { status: 'unhealthy' } 
        }))
        .filter(({ result }) => result.status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        console.warn('Some services failed health checks:', unhealthyServices);
      } else {
        console.log('All services initialized successfully and are healthy');
      }
    });

  }, [initializeServices]);

  if (!services) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing services...</p>
        </div>
      </div>
    );
  }

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

// Hook to use services
export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

// Individual service hooks for convenience
export const useActivityService = () => {
  const { activityService } = useServices();
  return activityService;
};

export const useIncidentService = () => {
  const { incidentService } = useServices();
  return incidentService;
};

export const useCaseService = () => {
  const { caseService } = useServices();
  return caseService;
};

export const useBOLService = () => {
  const { bolService } = useServices();
  return bolService;
};

export const useAuditService = () => {
  const { auditService } = useServices();
  return auditService;
};

// Audit context helper for creating consistent audit contexts
export const createAuditContext = (
  userId: string = 'current-user',
  userName: string = 'Current User',
  userRole: string = 'officer',
  action: string = 'user_action',
  reason?: string
) => ({
  userId,
  userName,
  userRole,
  action,
  reason,
  ipAddress: '127.0.0.1',
  userAgent: navigator.userAgent,
  sessionId: 'session-' + Date.now()
});

// Service status component for debugging
export const ServiceStatus: React.FC = () => {
  const { isInitialized } = useServices();
  const [healthChecks, setHealthChecks] = useState<Record<string, any>>({});

  const runHealthChecks = async () => {
    const services = useServices();
    const checks = await Promise.allSettled([
      services.activityService.healthCheck(),
      services.incidentService.healthCheck(),
      services.caseService.healthCheck(),
      services.bolService.healthCheck(),
      services.auditService.healthCheck()
    ]);

    const results = {
      activity: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' },
      incident: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' },
      case: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error' },
      bol: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'error' },
      audit: checks[4].status === 'fulfilled' ? checks[4].value : { status: 'error' }
    };

    setHealthChecks(results);
  };

  useEffect(() => {
    if (isInitialized) {
      runHealthChecks();
    }
  }, [isInitialized]);

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Service Status</h3>
      <div className="space-y-1 text-sm">
        {Object.entries(healthChecks).map(([serviceName, health]) => (
          <div key={serviceName} className="flex justify-between">
            <span className="capitalize">{serviceName}:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              health.status === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : health.status === 'degraded'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {health.status}
            </span>
          </div>
        ))}
      </div>
      <button 
        onClick={runHealthChecks}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
      >
        Refresh
      </button>
    </div>
  );
};