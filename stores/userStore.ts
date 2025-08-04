/**
 * User Store - Manages authentication state and user session
 * Integrates with AuthService for authentication operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, AuthenticatedUser, DemoUser, LoginRequest, SessionInfo } from '../services/auth.service';
import { UserRole, ClearanceLevel } from '../config/cognito';

interface UserState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User data
  currentUser: AuthenticatedUser | null;
  sessionInfo: SessionInfo | null;
  
  // Demo mode
  isDemoMode: boolean;
  availableDemoUsers: DemoUser[];
  currentDemoUser: DemoUser | null;
  
  // Service instance
  authService: AuthService | null;
  
  // Actions
  initializeAuthService: () => void;
  login: (request: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  
  // Demo mode actions
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  switchDemoUser: (userId: string) => Promise<boolean>;
  
  // Permission helpers
  hasPermission: (resource: string, action: string) => boolean;
  hasClearanceLevel: (requiredLevel: ClearanceLevel) => boolean;
  getUserPermissions: (resource: string) => string[];
  
  // Session management
  updateLastActivity: () => void;
  checkSessionValidity: () => boolean;
  
  // State management
  setUser: (user: AuthenticatedUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset state
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  currentUser: null,
  sessionInfo: null,
  isDemoMode: false,
  availableDemoUsers: [],
  currentDemoUser: null,
  authService: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize auth service
      initializeAuthService: () => {
        if (!get().authService) {
          const service = new AuthService();
          const demoUsers = service.getDemoUsers();
          
          // Always enable demo mode for now
          service.enableDemoMode();
          
          set({
            authService: service,
            availableDemoUsers: demoUsers,
            isAuthenticated: service.isAuthenticated(),
            currentUser: service.getCurrentUser(),
            sessionInfo: service.getSessionInfo(),
            isDemoMode: true // Demo mode until AWS Amplify is integrated
          });

          // Check if we have a valid session on initialization
          if (service.isAuthenticated() && service.getCurrentUser()) {
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
              console.log('🔐 Restored authentication session:', service.getCurrentUser()?.email);
            }
          }
        }
      },

      // Authentication actions
      login: async (request: LoginRequest): Promise<boolean> => {
        const { authService } = get();
        if (!authService) {
          set({ error: 'Authentication service not initialized' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await authService.login(request);
          
          if (result.success && result.data) {
            const { user, sessionInfo } = result.data;
            
            set({
              isAuthenticated: true,
              currentUser: user,
              sessionInfo,
              isDemoMode: authService.isInDemoMode(),
              currentDemoUser: authService.isInDemoMode() ? authService.getDemoUsers().find(u => u.email === user.email) || null : null,
              isLoading: false,
              error: null
            });

            console.log('🔐 Login successful:', user.email, user.role);
            return true;
          } else {
            set({
              isLoading: false,
              error: result.message || 'Login failed'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        const { authService, currentUser } = get();
        if (!authService) return;

        set({ isLoading: true });

        try {
          await authService.logout();
          
          set({
            ...initialState,
            authService, // Keep the service instance
            availableDemoUsers: authService.getDemoUsers()
          });

          console.log('🔓 Logout successful:', currentUser?.email);
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear the session even if logout fails
          set({
            ...initialState,
            authService,
            availableDemoUsers: authService.getDemoUsers(),
            error: 'Logout failed, but session cleared'
          });
        }
      },

      refreshSession: async (): Promise<boolean> => {
        const { authService } = get();
        if (!authService || !authService.isAuthenticated()) {
          return false;
        }

        try {
          // Check if session is still valid
          if (!authService.isSessionValid()) {
            // Session expired, logout
            await get().logout();
            return false;
          }

          // Update activity timestamp
          get().updateLastActivity();
          return true;
        } catch (error) {
          console.error('Session refresh error:', error);
          return false;
        }
      },

      // Demo mode actions
      enableDemoMode: () => {
        console.log('🎬 UserStore: enableDemoMode called');
        const { authService } = get();
        if (authService) {
          console.log('✅ UserStore: AuthService available, enabling demo mode');
          authService.enableDemoMode();
          const demoUsers = authService.getDemoUsers();
          console.log('📋 UserStore: Available demo users:', demoUsers.map(u => ({ id: u.id, name: u.name })));
          set({ 
            isDemoMode: true,
            availableDemoUsers: demoUsers
          });
          console.log('🎭 Demo mode enabled');
        } else {
          console.error('❌ UserStore: AuthService not available for demo mode');
        }
      },

      disableDemoMode: () => {
        const { authService } = get();
        if (authService) {
          authService.disableDemoMode();
          set({ 
            isDemoMode: false,
            currentDemoUser: null
          });
          console.log('🎭 Demo mode disabled');
        }
      },

      switchDemoUser: async (userId: string): Promise<boolean> => {
        console.log(`🔍 UserStore: switchDemoUser called with userId: ${userId}`);
        const { authService } = get();
        
        if (!authService) {
          console.error('❌ UserStore: AuthService not initialized');
          set({ error: 'Auth service not initialized' });
          return false;
        }
        
        if (!authService.isInDemoMode()) {
          console.error('❌ UserStore: Demo mode not enabled');
          set({ error: 'Demo mode not enabled' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          console.log('📡 UserStore: Calling authService.switchDemoUser...');
          const result = await authService.switchDemoUser(userId);
          
          console.log('📨 UserStore: AuthService result:', result);
          
          if (result.success && result.data) {
            const { user } = result.data;
            const demoUser = authService.getDemoUsers().find(u => u.id === userId);
            
            console.log('✅ UserStore: Setting authenticated state with user:', user);
            set({
              currentUser: user,
              currentDemoUser: demoUser || null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            console.log('🎭 Switched to demo user:', user.email, user.role);
            return true;
          } else {
            console.error('❌ UserStore: Switch failed:', result.message);
            set({
              isLoading: false,
              error: result.message || 'Failed to switch demo user'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to switch demo user';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      // Permission helpers
      hasPermission: (resource: string, action: string): boolean => {
        const { authService } = get();
        return authService ? authService.hasPermission(resource, action) : false;
      },

      hasClearanceLevel: (requiredLevel: ClearanceLevel): boolean => {
        const { authService } = get();
        return authService ? authService.hasClearanceLevel(requiredLevel) : false;
      },

      getUserPermissions: (resource: string): string[] => {
        const { authService } = get();
        return authService ? authService.getUserPermissions(resource) : [];
      },

      // Session management
      updateLastActivity: () => {
        const { sessionInfo } = get();
        if (sessionInfo) {
          set({
            sessionInfo: {
              ...sessionInfo,
              lastActivity: new Date()
            }
          });
        }
      },

      checkSessionValidity: (): boolean => {
        const { authService } = get();
        if (!authService) return false;

        const isValid = authService.isSessionValid();
        if (!isValid) {
          // Session is invalid, clear state
          set({
            isAuthenticated: false,
            currentUser: null,
            sessionInfo: null,
            error: 'Session expired'
          });
        }
        return isValid;
      },

      // State management helpers
      setUser: (user: AuthenticatedUser | null) => {
        set({
          currentUser: user,
          isAuthenticated: user !== null
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        const { authService } = get();
        set({
          ...initialState,
          authService,
          availableDemoUsers: authService?.getDemoUsers() || []
        });
      }
    }),
    {
      name: 'situ8-user-store',
      // Only persist essential authentication state
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        sessionInfo: state.sessionInfo,
        isDemoMode: state.isDemoMode,
        currentDemoUser: state.currentDemoUser
      }),
      // Custom storage to handle dates properly
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const data = JSON.parse(str);
            // Restore Date objects
            if (data.state?.sessionInfo) {
              const sessionInfo = data.state.sessionInfo;
              if (sessionInfo.loginTime) {
                sessionInfo.loginTime = new Date(sessionInfo.loginTime);
              }
              if (sessionInfo.lastActivity) {
                sessionInfo.lastActivity = new Date(sessionInfo.lastActivity);
              }
            }
            return data;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);

// Selector hooks for common use cases
export const useAuth = () => {
  const store = useUserStore();
  return {
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    user: store.currentUser,
    login: store.login,
    logout: store.logout,
    refreshSession: store.refreshSession
  };
};

export const useCurrentUser = () => {
  return useUserStore((state) => state.currentUser);
};

export const usePermissions = () => {
  const store = useUserStore();
  return {
    hasPermission: store.hasPermission,
    hasClearanceLevel: store.hasClearanceLevel,
    getUserPermissions: store.getUserPermissions
  };
};

export const useDemoMode = () => {
  const store = useUserStore();
  return {
    isDemoMode: store.isDemoMode,
    availableDemoUsers: store.availableDemoUsers,
    currentDemoUser: store.currentDemoUser,
    enableDemoMode: store.enableDemoMode,
    disableDemoMode: store.disableDemoMode,
    switchDemoUser: store.switchDemoUser
  };
};

// Initialize the auth service when the module loads
if (typeof window !== 'undefined') {
  // Delay initialization to avoid SSR issues
  setTimeout(() => {
    useUserStore.getState().initializeAuthService();
  }, 0);
}