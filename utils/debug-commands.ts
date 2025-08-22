/**
 * Debug Command Suite for Situ8 Platform
 * Browser console commands for debugging and testing
 */

declare global {
  interface Window {
    // Debug commands
    DEBUG: any;
    RESET_ALL: () => void;
    FIX_COGNITO: () => boolean;
    FORCE_AWS: () => void;
    CHECK_USERS: () => void;
    TEST_LOGIN: (email: string, password: string) => Promise<void>;
    CLEAR_SESSIONS: () => void;
    CHECK_STATE: () => void;
    ERROR_LOG: Array<{time: string; error: string; stack?: string}>;
    WS_LOG: Array<{time: string; event: string; data?: any}>;
    PERF_LOG: Record<string, number>;
    DEBUG_MODE: Record<string, boolean>;
  }
}

// Initialize error logging
if (typeof window !== 'undefined') {
  window.ERROR_LOG = [];
  window.WS_LOG = [];
  window.PERF_LOG = {
    pageLoadTime: performance.now()
  };
  
  // Global error handler
  window.addEventListener('error', (event) => {
    window.ERROR_LOG.push({
      time: new Date().toISOString(),
      error: event.message,
      stack: event.error?.stack
    });
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    window.ERROR_LOG.push({
      time: new Date().toISOString(),
      error: `Unhandled Promise: ${event.reason}`,
      stack: event.reason?.stack
    });
  });
}

export const initializeDebugCommands = () => {
  if (typeof window === 'undefined') return;
  
  // Debug mode flags
  window.DEBUG_MODE = {
    auth: false,
    websocket: false,
    services: false,
    performance: false
  };
  
  // Main debug object
  window.DEBUG = {
    // Get current state
    state: () => {
      const userStore = (window as any).useUserStore?.getState();
      const authService = (window as any).__AUTH_SERVICE__;
      const services = (window as any).__SITU8_SERVICES__;
      
      return {
        user: userStore?.currentUser,
        isDemoMode: userStore?.isDemoMode,
        isAuthenticated: userStore?.isAuthenticated,
        authMode: authService?.getAuthStatus?.().isDemoMode ? 'DEMO' : 'AWS',
        cognitoInitialized: authService?.getAuthStatus?.().cognitoInitialized,
        services: services ? Object.keys(services) : []
      };
    },
    
    // Check auth status
    auth: () => {
      const authService = (window as any).__AUTH_SERVICE__;
      const cognitoStatus = (window as any).getCognitoInitStatus?.();
      const userStore = (window as any).useUserStore?.getState();
      
      console.log('🔐 Authentication Status:');
      console.log('  Cognito Initialized:', cognitoStatus?.isInitialized);
      console.log('  Demo Mode:', authService?.getAuthStatus?.().isDemoMode);
      console.log('  Current User:', userStore?.currentUser?.email || 'None');
      console.log('  Has Tokens:', !!authService?.tokens?.idToken);
      
      return {
        cognito: cognitoStatus,
        authService: authService?.getAuthStatus?.(),
        user: userStore?.currentUser
      };
    },
    
    // Check WebSocket
    websocket: () => {
      const wsConnections = document.querySelectorAll('[data-ws-status]');
      console.log('📡 WebSocket Status:');
      console.log('  Active Connections:', wsConnections.length);
      console.log('  Recent Events:', window.WS_LOG.slice(-5));
      return window.WS_LOG;
    },
    
    // Check services
    services: () => {
      const services = (window as any).__SITU8_SERVICES__;
      if (!services) {
        console.log('❌ No services loaded');
        return null;
      }
      
      console.log('🏭 Services Status:');
      Object.keys(services).forEach(key => {
        const service = services[key];
        const hasHealthCheck = typeof service?.healthCheck === 'function';
        console.log(`  ${key}: ${hasHealthCheck ? '✅' : '⚠️'}`);
      });
      
      return services;
    },
    
    // Show errors
    errors: () => {
      console.log('❌ Error Log:');
      window.ERROR_LOG.forEach(err => {
        console.log(`  [${err.time}] ${err.error}`);
        if (err.stack) console.log('    Stack:', err.stack);
      });
      return window.ERROR_LOG;
    },
    
    // Performance metrics
    perf: () => {
      console.log('⚡ Performance Metrics:');
      Object.entries(window.PERF_LOG).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}ms`);
      });
      return window.PERF_LOG;
    },
    
    // Enable verbose logging
    verbose: (enable = true) => {
      window.DEBUG_MODE = {
        auth: enable,
        websocket: enable,
        services: enable,
        performance: enable
      };
      console.log(enable ? '🔊 Verbose mode ON' : '🔇 Verbose mode OFF');
    }
  };
  
  // PANIC BUTTON - Reset everything
  window.RESET_ALL = () => {
    console.log('🚨 RESETTING EVERYTHING...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('✅ All storage cleared');
    console.log('🔄 Reloading page...');
    
    setTimeout(() => location.reload(), 1000);
  };
  
  // Fix Cognito configuration
  window.FIX_COGNITO = () => {
    console.log('🔧 Attempting to fix Cognito...');
    
    const recoverFn = (window as any).recoverCognitoConfiguration;
    if (recoverFn) {
      const recovered = recoverFn();
      console.log(recovered ? '✅ Cognito recovered!' : '❌ Recovery failed');
      return recovered;
    }
    
    console.log('⚠️ Recovery function not available');
    return false;
  };
  
  // Force AWS mode
  window.FORCE_AWS = () => {
    console.log('🔐 Forcing AWS mode...');
    
    const userStore = (window as any).useUserStore?.getState();
    if (userStore) {
      userStore.disableDemoMode();
      userStore.logout();
      console.log('✅ Ready for AWS login');
    } else {
      console.log('❌ UserStore not available');
    }
  };
  
  // Check test users
  window.CHECK_USERS = () => {
    const testUsers = [
      { email: 'yamen@example.com', password: 'SecurePass123!', status: 'ready' },
      { email: 'dispatcher01@situ8.com', password: 'SecurePass123!', status: 'ready' },
      { email: 'admin@situ8.test', password: 'SecurePass123!', status: 'pending' },
      { email: 'guard@situ8.test', password: 'SecurePass123!', status: 'pending' },
      { email: 'supervisor@situ8.test', password: 'SecurePass123!', status: 'pending' }
    ];
    
    console.log('👥 Test Users:');
    testUsers.forEach(user => {
      const icon = user.status === 'ready' ? '✅' : '⏳';
      console.log(`  ${icon} ${user.email} / ${user.password}`);
    });
    
    return testUsers;
  };
  
  // Test login helper
  window.TEST_LOGIN = async (email: string, password: string) => {
    console.log(`🔐 Testing login for ${email}...`);
    
    const userStore = (window as any).useUserStore?.getState();
    if (!userStore) {
      console.error('❌ UserStore not available');
      return;
    }
    
    // Ensure not in demo mode
    userStore.disableDemoMode();
    
    try {
      window.PERF_LOG.login_start = performance.now();
      const result = await userStore.login({ email, password });
      window.PERF_LOG.login_duration = performance.now() - window.PERF_LOG.login_start;
      
      if (result) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log(`  Time: ${window.PERF_LOG.login_duration.toFixed(2)}ms`);
        console.log('  User:', userStore.currentUser);
        
        // Check tokens
        const authService = (window as any).__AUTH_SERVICE__;
        if (authService?.tokens?.idToken) {
          console.log('✅ AWS tokens acquired');
        }
      } else {
        console.error('❌ Login failed:', userStore.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };
  
  // Clear sessions helper
  window.CLEAR_SESSIONS = () => {
    console.log('🗑️ Clearing sessions...');
    
    // Clear specific Situ8 items
    const keysToRemove = [
      'situ8_user',
      'situ8_session',
      'situ8_auth_mode',
      'situ8-user-store',
      'situ8-activity-store',
      'aws-amplify-cacheable'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear all situ8- prefixed items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('situ8')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Sessions cleared');
  };
  
  // Check current state
  window.CHECK_STATE = () => {
    console.log('📊 Current State:');
    console.log('  ', window.DEBUG.state());
    console.log('\n🔐 Auth Details:');
    console.log('  ', window.DEBUG.auth());
    console.log('\n🏭 Services:');
    window.DEBUG.services();
    console.log('\n❌ Recent Errors:');
    console.log('  ', window.ERROR_LOG.slice(-3));
  };
  
  // Log initialization
  console.log('🎮 Debug Commands Loaded!');
  console.log('Available commands:');
  console.log('  window.DEBUG.state()     - Current app state');
  console.log('  window.DEBUG.auth()      - Auth status');
  console.log('  window.DEBUG.services()  - Service health');
  console.log('  window.DEBUG.errors()    - Error log');
  console.log('  window.DEBUG.verbose()   - Enable verbose logging');
  console.log('  window.RESET_ALL()       - Clear everything and reload');
  console.log('  window.FORCE_AWS()       - Force AWS mode');
  console.log('  window.CHECK_USERS()     - List test users');
  console.log('  window.TEST_LOGIN(email, password) - Test login');
  console.log('  window.CLEAR_SESSIONS()  - Clear auth sessions');
  console.log('  window.CHECK_STATE()     - Full state check');
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  initializeDebugCommands();
}