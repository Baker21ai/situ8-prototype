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
import { PassdownService } from './passdown.service';
import { AuthService } from './auth.service';
import { CommunicationService } from './communication.service';
import { ChatService } from './chat.service';
import { initializeApiClient, type AWSConfig } from './aws-api';
import { useActivityStore } from '../stores/activityStore';
import { useUserStore, useAuth } from '../stores/userStore';
import { useCommunicationStore } from '../stores/communicationStore';

// Service context interface
interface ServiceContextType {
  activityService: ActivityService;
  incidentService: IncidentService;
  caseService: CaseService;
  bolService: BOLService;
  auditService: AuditService;
  visitorService: VisitorService;
  passdownService: PassdownService;
  authService: AuthService;
  communicationService: CommunicationService;
  chatService: ChatService;
  apiClient?: any; // AWS API client instance
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get communication store for service integration
  const communicationStore = useCommunicationStore();

  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
    const initializeAllServices = async () => {
      try {
        // Initialize AWS API client if configured
        let apiClient: any = null;
        const useAwsApiVite = import.meta.env.VITE_USE_AWS_API === 'true';
        const useAwsApiReact = process.env.REACT_APP_USE_AWS_API === 'true';
        
        if (useAwsApiVite || useAwsApiReact) {
          try {
            const awsConfig: AWSConfig = {
              apiBaseUrl: import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || '',
              region: import.meta.env.VITE_AWS_REGION || process.env.REACT_APP_AWS_REGION || 'us-west-2',
              userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || process.env.REACT_APP_COGNITO_USER_POOL_ID || ''
            };
            apiClient = initializeApiClient(awsConfig);
            console.log('AWS API client initialized:', awsConfig.apiBaseUrl);
          } catch (awsError) {
            console.warn('AWS API client initialization failed, continuing without AWS integration:', awsError);
          }
        }

        // Initialize all services with error handling
        const activityService = new ActivityService();
        const incidentService = new IncidentService();
        const caseService = new CaseService();
        const bolService = new BOLService();
        const auditService = new AuditService();
        const passdownService = new PassdownService();
        const chatService = new ChatService();
        
        // Initialize communication service with API client (or null if not configured)
        let communicationService;
        try {
          communicationService = new CommunicationService(apiClient);
          // Connect communication service to the store
          communicationStore.initializeService(communicationService);
          console.log('Communication service initialized successfully');
        } catch (commError) {
          console.warn('Communication service initialization failed, using mock service:', commError);
          // Create a mock communication service
          communicationService = {
            healthCheck: () => Promise.resolve({ status: 'degraded', message: 'Mock communication service' }),
            sendMessage: () => Promise.resolve({ success: false, error: 'Communication service not available' }),
            getChannelMessages: () => Promise.resolve({ success: false, error: 'Communication service not available' }),
            createChannel: () => Promise.resolve({ success: false, error: 'Communication service not available' }),
            getUserChannels: () => Promise.resolve({ success: false, error: 'Communication service not available' }),
            joinChannel: () => Promise.resolve({ success: false, error: 'Communication service not available' }),
            leaveChannel: () => Promise.resolve({ success: false, error: 'Communication service not available' })
          };
        }
        
        // Initialize auth service with graceful fallback
        let authService;
        try {
          authService = new AuthService();
          console.log('Auth service initialized successfully');
        } catch (authError) {
          console.warn('Auth service initialization failed, using mock auth:', authError);
          // Create a mock auth service that doesn't crash
          authService = {
            healthCheck: () => Promise.resolve({ status: 'degraded', message: 'Mock auth service' }),
            login: () => Promise.resolve({ success: false, error: 'Auth service not available' }),
            logout: () => Promise.resolve(),
            getCurrentUser: () => null,
            isAuthenticated: () => false
          };
        }
    
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
              type: 'update_access_level' as const,
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
              operator: 'equals' as const,
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
        ],
        card_templates: [],
        visitor_zones: []
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

        // Note: Store initialization removed to prevent infinite re-render loop

        // Create service context
        const serviceContext: ServiceContextType = {
          activityService,
          incidentService,
          caseService,
          bolService,
          auditService,
          visitorService,
          passdownService,
          authService,
          communicationService,
          chatService,
          apiClient,
          isInitialized: true
        };

        setServices(serviceContext);
        console.log('✅ Services set successfully');

        // Expose services to window for stores
        if (typeof window !== 'undefined') {
          (window as any).__SITU8_SERVICES__ = serviceContext;
        }

        // Mark as initialized AFTER setting services
        setIsInitialized(true);
        console.log('✅ ServiceProvider initialization complete')

        // Run health checks on all services
        Promise.allSettled([
          activityService.healthCheck(),
          incidentService.healthCheck(),
          caseService.healthCheck(),
          bolService.healthCheck(),
          auditService.healthCheck(),
          visitorService.healthCheck(),
          passdownService.healthCheck(),
          communicationService.healthCheck(),
          chatService.healthCheck()
          // Note: AuthService doesn't implement healthCheck, it's handled by store initialization
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

      } catch (error) {
        console.error('Service initialization failed:', error);
        // Set minimal services to prevent app crash
        const fallbackServices = {
          activityService: new ActivityService(),
          incidentService: new IncidentService(),
          caseService: new CaseService(),
          bolService: new BOLService(),
          auditService: new AuditService(),
          visitorService: null as any,
          passdownService: new PassdownService(),
          authService: authService || new AuthService(), // Use existing auth if available
          communicationService: null as any,
          chatService: null as any,
          apiClient: null,
          isInitialized: true // Set to true so app can proceed
        };
        setServices(fallbackServices);
        setIsInitialized(true);
        console.warn('⚠️ Using fallback services due to initialization error');
      }
    };

    console.log('🚀 Starting service initialization...');
    initializeAllServices();
    // Removed setIsInitialized(true) from here - it's now inside the async function
  }, [communicationStore]);

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

export const usePassdownService = () => {
  const { passdownService } = useServices();
  return passdownService;
};

export const useAuthService = () => {
  const { authService } = useServices();
  return authService;
};

export const useCommunicationService = () => {
  const { communicationService } = useServices();
  return communicationService;
};

// AWS API Client hook
export const useApiClient = () => {
  const { apiClient } = useServices();
  if (!apiClient) {
    console.warn('AWS API client not initialized - falling back to local services');
  }
  return apiClient;
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
        services.visitorService.healthCheck(),
        services.passdownService.healthCheck(),
        services.communicationService.healthCheck()
      ]);

      const results = {
        activity: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' },
        incident: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' },
        case: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error' },
        bol: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'error' },
        audit: checks[4].status === 'fulfilled' ? checks[4].value : { status: 'error' },
        visitor: checks[5].status === 'fulfilled' ? checks[5].value : { status: 'error' },
        passdown: checks[6].status === 'fulfilled' ? checks[6].value : { status: 'error' },
        communication: checks[7].status === 'fulfilled' ? checks[7].value : { status: 'error' }
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