/**
 * Enhanced Service Provider with DI Integration
 * Backward-compatible service provider that uses the new DI system internally
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DependencyProvider, useDIContainer, useService } from './DependencyProvider';
import { createDevelopmentContainer, createProductionContainer } from './CompositionRoot';
import { SERVICE_TOKENS } from './DIContainer';

// Import existing services for backward compatibility
import { ActivityService } from '../../../services/activity.service';
import { IncidentService } from '../../../services/incident.service';
import { CaseService } from '../../../services/case.service';
import { BOLService } from '../../../services/bol.service';
import { AuditService } from '../../../services/audit.service';
import { VisitorService } from '../../../services/visitor.service';

// Backward compatibility interface
interface LegacyServiceContextType {
  activityService: ActivityService;
  incidentService: IncidentService;
  caseService: CaseService;
  bolService: BOLService;
  auditService: AuditService;
  visitorService: VisitorService;
  isInitialized: boolean;
}

// Legacy service context for backward compatibility
const LegacyServiceContext = createContext<LegacyServiceContextType | null>(null);

/**
 * Enhanced Service Provider Props
 */
interface EnhancedServiceProviderProps {
  children: React.ReactNode;
  useDI?: boolean; // Flag to enable/disable DI system
  environment?: 'development' | 'production' | 'test';
}

/**
 * Main Enhanced Service Provider Component
 */
export const EnhancedServiceProvider: React.FC<EnhancedServiceProviderProps> = ({ 
  children, 
  useDI = true,
  environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
}) => {
  if (useDI) {
    // Use new DI system
    const compositionRoot = environment === 'production' 
      ? createProductionContainer()
      : createDevelopmentContainer();

    return (
      <DependencyProvider 
        compositionRoot={compositionRoot}
        enableDevTools={environment === 'development'}
      >
        <DIAwareServiceProvider>
          {children}
        </DIAwareServiceProvider>
      </DependencyProvider>
    );
  } else {
    // Use legacy service system
    return (
      <LegacyServiceProvider>
        {children}
      </LegacyServiceProvider>
    );
  }
};

/**
 * DI-aware service provider that wraps services for backward compatibility
 */
const DIAwareServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [legacyServices, setLegacyServices] = useState<LegacyServiceContextType | null>(null);
  
  // Get services from DI container
  const container = useDIContainer();

  useEffect(() => {
    try {
      // Create legacy service instances using DI services as dependencies
      const activityRepository = container.tryResolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY);
      const eventBus = container.tryResolve(SERVICE_TOKENS.EVENT_BUS);
      const commandBus = container.tryResolve(SERVICE_TOKENS.COMMAND_BUS);
      const queryBus = container.tryResolve(SERVICE_TOKENS.QUERY_BUS);

      // Create legacy services with DI dependencies injected
      const activityService = new ActivityService();
      const incidentService = new IncidentService();
      const caseService = new CaseService();
      const bolService = new BOLService();
      const auditService = new AuditService();
      
      // Default visitor management config
      const visitorConfig = {
        enabled: true,
        integration_type: 'lenel_onguard' as const,
        providers: [
          {
            name: 'Lenel OnGuard',
            type: 'lenel_onguard' as const,
            enabled: true,
            config: {
              server_url: 'https://onguard.example.com',
              username: 'api_user',
              password: 'api_password',
              sync_interval: 300000
            }
          }
        ]
      };
      
      const visitorService = new VisitorService(visitorConfig);

      // If DI services are available, enhance legacy services
      if (activityRepository) {
        // Inject repository into activity service
        (activityService as any).repository = activityRepository;
      }

      if (eventBus) {
        // Inject event bus into services that need it
        (activityService as any).eventBus = eventBus;
        (incidentService as any).eventBus = eventBus;
        (auditService as any).eventBus = eventBus;
      }

      if (commandBus) {
        (activityService as any).commandBus = commandBus;
      }

      if (queryBus) {
        (activityService as any).queryBus = queryBus;
      }

      setLegacyServices({
        activityService,
        incidentService,
        caseService,
        bolService,
        auditService,
        visitorService,
        isInitialized: true
      });

    } catch (error) {
      console.error('Failed to initialize services with DI:', error);
      
      // Fallback to legacy initialization
      const activityService = new ActivityService();
      const incidentService = new IncidentService();
      const caseService = new CaseService();
      const bolService = new BOLService();
      const auditService = new AuditService();
      const visitorService = new VisitorService({
        enabled: true,
        integration_type: 'lenel_onguard',
        providers: []
      });

      setLegacyServices({
        activityService,
        incidentService,
        caseService,
        bolService,
        auditService,
        visitorService,
        isInitialized: true
      });
    }
  }, [container]);

  if (!legacyServices) {
    return <div>Initializing services...</div>;
  }

  return (
    <LegacyServiceContext.Provider value={legacyServices}>
      {children}
    </LegacyServiceContext.Provider>
  );
};

/**
 * Legacy Service Provider (original implementation)
 */
const LegacyServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<LegacyServiceContextType | null>(null);

  useEffect(() => {
    // Initialize all services (original logic)
    const activityService = new ActivityService();
    const incidentService = new IncidentService();
    const caseService = new CaseService();
    const bolService = new BOLService();
    const auditService = new AuditService();
    
    // Default visitor management config
    const visitorConfig = {
      enabled: true,
      integration_type: 'lenel_onguard' as const,
      providers: [
        {
          name: 'Lenel OnGuard',
          type: 'lenel_onguard' as const,
          enabled: true,
          config: {
            server_url: 'https://onguard.example.com',
            username: 'api_user',
            password: 'api_password',
            sync_interval: 300000
          }
        }
      ]
    };
    
    const visitorService = new VisitorService(visitorConfig);

    setServices({
      activityService,
      incidentService,
      caseService,
      bolService,
      auditService,
      visitorService,
      isInitialized: true
    });
  }, []);

  if (!services) {
    return <div>Initializing services...</div>;
  }

  return (
    <LegacyServiceContext.Provider value={services}>
      {children}
    </LegacyServiceContext.Provider>
  );
};

/**
 * Hook to use services (backward compatible)
 */
export const useServices = (): LegacyServiceContextType => {
  const services = useContext(LegacyServiceContext);
  
  if (!services) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  
  return services;
};

/**
 * New hooks for DI-aware components
 */

/**
 * Hook to use services from DI container directly
 */
export const useDIServices = () => {
  try {
    const container = useDIContainer();
    
    return {
      activityService: container.tryResolve(SERVICE_TOKENS.ACTIVITY_SERVICE),
      incidentService: container.tryResolve(SERVICE_TOKENS.INCIDENT_SERVICE),
      caseService: container.tryResolve(SERVICE_TOKENS.CASE_SERVICE),
      auditService: container.tryResolve(SERVICE_TOKENS.AUDIT_SERVICE),
      
      // CQRS services
      commandBus: container.tryResolve(SERVICE_TOKENS.COMMAND_BUS),
      queryBus: container.tryResolve(SERVICE_TOKENS.QUERY_BUS),
      
      // Repositories
      activityRepository: container.tryResolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY),
      
      // Infrastructure
      eventBus: container.tryResolve(SERVICE_TOKENS.EVENT_BUS),
      logger: container.tryResolve(SERVICE_TOKENS.LOGGER)
    };
  } catch {
    // Fallback to legacy services if DI is not available
    return useServices();
  }
};

/**
 * Hook to use a specific service from DI
 */
export const useDIService = <T>(token: string | symbol): T | null => {
  try {
    return useService(token as any);
  } catch {
    return null;
  }
};

/**
 * Migration helper to gradually move to DI
 */
export const useServiceMigration = () => {
  const legacyServices = useServices();
  const diServices = useDIServices();
  
  return {
    // Prefer DI services when available, fallback to legacy
    activityService: diServices.activityService || legacyServices.activityService,
    incidentService: diServices.incidentService || legacyServices.incidentService,
    caseService: diServices.caseService || legacyServices.caseService,
    auditService: diServices.auditService || legacyServices.auditService,
    
    // New DI-only services
    commandBus: diServices.commandBus,
    queryBus: diServices.queryBus,
    activityRepository: diServices.activityRepository,
    eventBus: diServices.eventBus,
    logger: diServices.logger,
    
    // Legacy services for backward compatibility
    bolService: legacyServices.bolService,
    visitorService: legacyServices.visitorService,
    
    isInitialized: legacyServices.isInitialized
  };
};

/**
 * Default export for backward compatibility
 */
export default EnhancedServiceProvider;

/**
 * Legacy export alias
 */
export { EnhancedServiceProvider as ServiceProvider };