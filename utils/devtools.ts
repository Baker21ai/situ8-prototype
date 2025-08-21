/**
 * Development Tools for Situ8
 * Provides browser console access to application state and debugging utilities
 */

import { useActivityStore } from '../stores/activityStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useCaseStore } from '../stores/caseStore';
import { useUserStore, useAuth } from '../stores/userStore';
import { useAuditStore } from '../stores/auditStore';
import { usePassdownStore } from '../stores/passdownStore';
import { useServices } from '../services/ServiceProvider';
import { debug } from './debug';

interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastChecked?: Date;
  error?: string;
  metadata?: any;
}

interface Situ8DevTools {
  // Store access
  stores: {
    activity: () => ReturnType<typeof useActivityStore.getState>;
    incident: () => ReturnType<typeof useIncidentStore.getState>;
    case: () => ReturnType<typeof useCaseStore.getState>;
    user: () => ReturnType<typeof useUserStore.getState>;
    auth: () => ReturnType<typeof useAuth>;
    audit: () => ReturnType<typeof useAuditStore.getState>;
    passdown: () => ReturnType<typeof usePassdownStore.getState>;
    all: () => Record<string, any>;
  };
  
  // Service access
  services: {
    list: () => string[];
    get: (name: string) => any;
    all: () => Record<string, any>;
    checkHealth: () => Promise<ServiceHealthStatus[]>;
  };
  
  // Debug utilities
  debug: {
    clearAll: () => void;
    clearStorage: () => void;
    showAuth: () => void;
    showUser: () => void;
    triggerError: (message: string) => void;
    checkHealth: () => Promise<void>;
    exportState: () => string;
    importState: (json: string) => void;
    resetStores: () => void;
    enableVerboseLogging: () => void;
    disableLogging: () => void;
  };
  
  // Performance monitoring
  perf: {
    measureStoreSize: () => Record<string, number>;
    getMemoryUsage: () => any;
    startProfiling: (label: string) => void;
    endProfiling: (label: string) => void;
    getMetrics: () => any;
  };
  
  // Testing utilities
  test: {
    generateActivities: (count: number) => void;
    simulateError: (type: 'network' | 'auth' | 'permission' | 'generic') => void;
    simulateSlowNetwork: (delayMs: number) => void;
    fillStores: () => void;
    clearAllData: () => void;
  };
  
  // Quick actions
  actions: {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    switchUser: (role: string) => void;
    createActivity: (type: string, title: string) => Promise<void>;
    createIncident: (severity: string) => Promise<void>;
  };
  
  // Info
  version: string;
  environment: string;
  features: string[];
}

const performanceMarks = new Map<string, number>();

export const createDevTools = (): Situ8DevTools => {
  const devTools: Situ8DevTools = {
    stores: {
      activity: () => useActivityStore.getState(),
      incident: () => useIncidentStore.getState(),
      case: () => useCaseStore.getState(),
      user: () => useUserStore.getState(),
      auth: () => useAuth(),
      audit: () => useAuditStore.getState(),
      passdown: () => usePassdownStore.getState(),
      all: () => ({
        activity: useActivityStore.getState(),
        incident: useIncidentStore.getState(),
        case: useCaseStore.getState(),
        user: useUserStore.getState(),
        auth: useAuth(),
        audit: useAuditStore.getState(),
        passdown: usePassdownStore.getState()
      })
    },
    
    services: {
      list: () => {
        const services = useServices();
        return Object.keys(services).filter(key => 
          key !== 'isInitialized' && 
          key !== 'setInitialized' &&
          key !== 'initializeServices'
        );
      },
      
      get: (name: string) => {
        const services = useServices();
        return (services as any)[name];
      },
      
      all: () => {
        const services = useServices();
        const result: Record<string, any> = {};
        
        Object.keys(services).forEach(key => {
          if (key !== 'isInitialized' && 
              key !== 'setInitialized' &&
              key !== 'initializeServices') {
            result[key] = (services as any)[key];
          }
        });
        
        return result;
      },
      
      checkHealth: async () => {
        const services = useServices();
        const healthChecks: ServiceHealthStatus[] = [];
        
        for (const [name, service] of Object.entries(services)) {
          if (typeof service === 'object' && 
              service !== null && 
              'healthCheck' in service &&
              typeof service.healthCheck === 'function') {
            try {
              const health = await service.healthCheck();
              healthChecks.push({
                name,
                status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
                lastChecked: new Date(),
                metadata: health
              });
            } catch (error) {
              healthChecks.push({
                name,
                status: 'unhealthy',
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
        
        return healthChecks;
      }
    },
    
    debug: {
      clearAll: () => {
        console.clear();
        debug.clear();
      },
      
      clearStorage: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ All storage cleared');
      },
      
      showAuth: () => {
        const auth = useAuth();
        console.table({
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
          error: auth.error,
          user: auth.user?.email,
          role: auth.user?.role,
          clearance: auth.user?.clearanceLevel
        });
      },
      
      showUser: () => {
        const user = useUserStore.getState();
        console.log('Current User:', user.currentUser);
        console.log('Demo Mode:', user.isDemoMode);
        console.log('Available Demo Users:', user.availableDemoUsers);
      },
      
      triggerError: (message: string) => {
        throw new Error(message);
      },
      
      checkHealth: async () => {
        const healthStatuses = await devTools.services.checkHealth();
        console.table(healthStatuses);
      },
      
      exportState: () => {
        const state = devTools.stores.all();
        const json = JSON.stringify(state, null, 2);
        console.log('📋 State exported to clipboard');
        navigator.clipboard.writeText(json);
        return json;
      },
      
      importState: (json: string) => {
        try {
          const state = JSON.parse(json);
          
          // Import each store's state
          if (state.activity) useActivityStore.setState(state.activity);
          if (state.incident) useIncidentStore.setState(state.incident);
          if (state.case) useCaseStore.setState(state.case);
          if (state.user) useUserStore.setState(state.user);
          if (state.audit) useAuditStore.setState(state.audit);
          if (state.passdown) usePassdownStore.setState(state.passdown);
          
          console.log('✅ State imported successfully');
        } catch (error) {
          console.error('❌ Failed to import state:', error);
        }
      },
      
      resetStores: () => {
        useActivityStore.getState().resetStore();
        useIncidentStore.getState().resetStore();
        useCaseStore.getState().resetStore();
        useAuditStore.getState().resetStore();
        usePassdownStore.getState().resetStore();
        console.log('✅ All stores reset');
      },
      
      enableVerboseLogging: () => {
        debug.configure({ 
          enabled: true, 
          logLevel: 'debug', 
          includeStackTrace: true 
        });
        console.log('✅ Verbose logging enabled');
      },
      
      disableLogging: () => {
        debug.configure({ enabled: false });
        console.log('✅ Logging disabled');
      }
    },
    
    perf: {
      measureStoreSize: () => {
        const stores = devTools.stores.all();
        const sizes: Record<string, number> = {};
        
        Object.entries(stores).forEach(([name, state]) => {
          const json = JSON.stringify(state);
          sizes[name] = Math.round(json.length / 1024); // KB
        });
        
        return sizes;
      },
      
      getMemoryUsage: () => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      },
      
      startProfiling: (label: string) => {
        performanceMarks.set(label, performance.now());
        console.log(`⏱️  Started profiling: ${label}`);
      },
      
      endProfiling: (label: string) => {
        const start = performanceMarks.get(label);
        if (start) {
          const duration = performance.now() - start;
          performanceMarks.delete(label);
          console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
          return duration;
        }
        console.warn(`⏱️  No profiling started for: ${label}`);
        return null;
      },
      
      getMetrics: () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          pageLoad: navigation ? navigation.loadEventEnd - navigation.fetchStart : null,
          domReady: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : null,
          resourceCount: performance.getEntriesByType('resource').length,
          marks: Array.from(performanceMarks.entries())
        };
      }
    },
    
    test: {
      generateActivities: (count: number) => {
        const activityStore = useActivityStore.getState();
        for (let i = 0; i < count; i++) {
          activityStore.generateRealtimeActivity();
        }
        console.log(`✅ Generated ${count} activities`);
      },
      
      simulateError: (type: string) => {
        switch (type) {
          case 'network':
            throw new Error('Network request failed: Unable to fetch data from server');
          case 'auth':
            throw new Error('Authentication failed: Invalid credentials');
          case 'permission':
            throw new Error('Permission denied: Insufficient clearance level');
          default:
            throw new Error('An unexpected error occurred');
        }
      },
      
      simulateSlowNetwork: (delayMs: number) => {
        // This would need to be implemented in your API layer
        console.log(`🐌 Simulating ${delayMs}ms network delay`);
        localStorage.setItem('situ8-network-delay', delayMs.toString());
      },
      
      fillStores: () => {
        devTools.test.generateActivities(100);
        console.log('✅ Stores filled with test data');
      },
      
      clearAllData: () => {
        devTools.debug.resetStores();
        devTools.debug.clearStorage();
        console.log('✅ All data cleared');
      }
    },
    
    actions: {
      login: async (email: string, password: string) => {
        const { login } = useAuth();
        await login({ email, password });
        console.log('✅ Login attempted');
      },
      
      logout: async () => {
        const { logout } = useAuth();
        await logout();
        console.log('✅ Logged out');
      },
      
      switchUser: (role: string) => {
        const { switchDemoUser } = useUserStore.getState();
        const demoUsers = useUserStore.getState().availableDemoUsers;
        const user = demoUsers.find(u => u.role === role);
        
        if (user) {
          switchDemoUser(user.id);
          console.log(`✅ Switched to ${role} user`);
        } else {
          console.error(`❌ No demo user found with role: ${role}`);
        }
      },
      
      createActivity: async (type: string, title: string) => {
        const { createActivity } = useActivityStore.getState();
        const context = {
          userId: 'dev-tools',
          userName: 'DevTools',
          userRole: 'admin',
          action: 'CREATE_ACTIVITY'
        };
        
        await createActivity({
          type: type as any,
          title,
          description: 'Created via DevTools',
          priority: 'medium',
          status: 'active' as any
        }, context);
        
        console.log('✅ Activity created');
      },
      
      createIncident: async (severity: string) => {
        const { createIncident } = useIncidentStore.getState();
        const context = {
          userId: 'dev-tools',
          userName: 'DevTools',
          userRole: 'admin',
          action: 'CREATE_INCIDENT'
        };
        
        createIncident({
          title: `Test Incident (${severity})`,
          description: 'Created via DevTools',
          severity: severity as any,
          type: 'security-breach',
          location: { building: 'A', floor: 1, zone: 'North' }
        } as any);
        
        console.log('✅ Incident created');
      }
    },
    
    version: '1.0.0',
    environment: import.meta.env.MODE,
    features: [
      'activities',
      'incidents', 
      'cases',
      'passdowns',
      'communications',
      'audit-trail',
      'real-time-updates'
    ]
  };
  
  return devTools;
};

// Initialize DevTools in development
export const initializeDevTools = () => {
  if (!import.meta.env.DEV) return;
  
  const devTools = createDevTools();
  
  // Make it available globally
  (window as any).__SITU8__ = devTools;
  
  // Add helpful console message
  console.log(
    '%c🚀 Situ8 DevTools Loaded',
    'background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold;',
    '\n\nAvailable commands:\n' +
    '  __SITU8__.stores.activity()     - Get activity store state\n' +
    '  __SITU8__.debug.showAuth()      - Show auth status\n' +
    '  __SITU8__.debug.checkHealth()   - Check service health\n' +
    '  __SITU8__.actions.switchUser()  - Switch demo user\n' +
    '  __SITU8__.perf.measureStoreSize() - Measure store sizes\n' +
    '\nType __SITU8__ to see all available tools.'
  );
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D - Toggle debug panel
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      console.log('Debug panel toggled (not implemented yet)');
    }
    
    // Ctrl+Shift+L - Clear console and logs
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      devTools.debug.clearAll();
    }
  });
};