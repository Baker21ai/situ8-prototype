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
import { VisitorService } from './visitor.service';
import { useActivityStore } from '../stores/activityStore';

// Service context interface
interface ServiceContextType {
  activityService: ActivityService;
  incidentService: IncidentService;
  caseService: CaseService;
  bolService: BOLService;
  auditService: AuditService;
  visitorService: VisitorService;
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
    
    // Default visitor management config
    const visitorConfig = {
      enabled: true,
      integration_type: 'lenel_onguard' as const,
      providers: [
        {
          id: 'lenel',
          name: 'Lenel OnGuard',
          type: 'lenel_onguard',
          enabled: true,
          api_config: {
            base_url: 'https://lenel-api.example.com',
            api_key: 'mock-key',
            username: 'api_user',
            password: 'mock_password',
            timeout_ms: 30000,
            retry_count: 3,
            webhook_url: 'https://situ8.local/webhooks/lenel',
            custom_headers: {
              'X-API-Version': 'v2.0'
            }
          },
          features: ['card_activation', 'access_control', 'real_time_sync'],
          priority: 1
        }
      ],
      workflows: [
        {
          id: 'standard_check_in',
          name: 'Standard Check-in',
          enabled: true,
          triggers: [
            {
              type: 'visitor_check_in' as const,
              source: 'manual',
              event: 'visitor_check_in'
            }
          ],
          actions: [
            {
              type: 'activate_card' as const,
              target: 'lenel_integration',
              parameters: {
                access_level: 'visitor',
                duration_hours: 8
              }
            }
          ],
          conditions: [
            {
              field: 'status',
              operator: 'equals',
              value: 'pre_registered'
            }
          ]
        }
      ],
      access_control: {
        lenel_config: {
          base_url: 'https://lenel-api.example.com',
          api_key: 'mock-key',
          timeout: 30000
        },
        access_levels: [
          { id: 'lobby_access', name: 'Lobby Access', description: 'Access to lobby areas only' },
          { id: 'building_access', name: 'Building Access', description: 'Access to building interior' },
          { id: 'secure_access', name: 'Secure Access', description: 'Access to secure areas' }
        ]
      },
      notifications: {
        channels: [
          { id: 'email', type: 'email' as const, enabled: true, config: {} },
          { id: 'sms', type: 'sms' as const, enabled: false, config: {} }
        ],
        templates: [
          { id: 'check_in', name: 'Check-in Confirmation', type: 'check_in' as const, body: 'Welcome!', variables: ['name'] }
        ],
        rules: [
          { id: 'host_notification', event_type: 'visitor_check_in', recipients: ['host'] as const, channels: ['email'], delay_minutes: 0 }
        ]
      },
      compliance: {
        data_retention_days: 365,
        privacy_settings: {
          mask_visitor_data: false,
          retention_period_days: 365,
          anonymize_after_days: 30,
          allowed_data_sharing: ['host_notification', 'security_alerts']
        },
        audit_requirements: [
          { event_type: 'visitor_check_in' as const, required_fields: ['visitor_id', 'timestamp', 'location'], retention_period: '7_years' as const },
          { event_type: 'visitor_check_out' as const, required_fields: ['visitor_id', 'timestamp', 'location'], retention_period: '7_years' as const }
        ],
        document_requirements: [
          { type: 'identification' as const, required: true, max_age_days: 365, verification_required: true },
          { type: 'nda' as const, required: false, max_age_days: 365, verification_required: false }
        ]
      },
      ui_settings: {
        check_in_flow: {
          steps: [
            { id: 'registration', name: 'Registration', required: true, type: 'form' as const },
            { id: 'screening', name: 'Security Screening', required: true, type: 'form' as const },
            { id: 'badge_assignment', name: 'Badge Assignment', required: true, type: 'form' as const }
          ],
          require_photo: true,
          require_signature: true,
          require_documents: ['identification'],
          allow_pre_check_in: true
        },
        kiosk_config: {
          enabled: true,
          locations: ['main_lobby', 'security_desk'],
          idle_timeout_seconds: 300,
          require_assistance: false,
          print_badges: true
        },
        mobile_config: {
          enabled: true,
          app_required: false,
          qr_code_check_in: true,
          geofencing: false
        },
        branding: {
          primary_color: '#0066CC',
          welcome_message: 'Welcome to our facility',
          company_name: 'Situ8 Security'
        }
      }
    };
    
    const visitorService = new VisitorService(visitorConfig);

    // Initialize stores with services
    initializeServices();

    // Create service context
    const serviceContext: ServiceContextType = {
      activityService,
      incidentService,
      caseService,
      bolService,
      auditService,
      visitorService,
      isInitialized: true
    };

    setServices(serviceContext);

    // Run health checks on all services
    Promise.allSettled([
      activityService.healthCheck(),
      incidentService.healthCheck(),
      caseService.healthCheck(),
      bolService.healthCheck(),
      auditService.healthCheck(),
      visitorService.healthCheck()
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

export const useVisitorService = () => {
  const { visitorService } = useServices();
  return visitorService;
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
        services.auditService.healthCheck(),
        services.visitorService.healthCheck()
      ]);

      const results = {
        activity: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' },
        incident: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' },
        case: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error' },
        bol: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'error' },
        audit: checks[4].status === 'fulfilled' ? checks[4].value : { status: 'error' },
        visitor: checks[5].status === 'fulfilled' ? checks[5].value : { status: 'error' }
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