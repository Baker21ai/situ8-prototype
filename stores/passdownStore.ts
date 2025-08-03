/**
 * Passdown Store - Zustand state management for Passdowns module
 * Handles UI state, caching, and coordination with the PassdownService
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Passdown, 
  PassdownSummary,
  PassdownFilters,
  PassdownStats,
  CreatePassdownRequest,
  UpdatePassdownRequest,
  ShiftType,
  UrgencyLevel,
  PassdownStatus,
  PassdownReceipt
} from '../lib/types/passdown';
import { PassdownService } from '../services/passdown.service';
// Services are accessed via window.__SITU8_SERVICES__

interface PassdownState {
  // Data
  passdowns: PassdownSummary[];
  selectedPassdown: Passdown | null;
  readReceipts: PassdownReceipt[];
  stats: PassdownStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  filters: PassdownFilters;
  viewMode: 'list' | 'grid';
  showArchived: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  lastEvaluatedKey: string | null;
}

interface PassdownActions {
  // Fetch operations
  fetchPassdowns: (filters?: PassdownFilters) => Promise<void>;
  fetchPassdownById: (id: string, includeRelated?: boolean) => Promise<void>;
  fetchCurrentShiftPassdowns: () => Promise<void>;
  fetchUrgentPassdowns: () => Promise<void>;
  
  // CRUD operations
  createPassdown: (data: CreatePassdownRequest) => Promise<boolean>;
  updatePassdown: (id: string, data: UpdatePassdownRequest) => Promise<boolean>;
  acknowledgePassdown: (id: string, acknowledged: boolean, notes?: string) => Promise<boolean>;
  archiveOldPassdowns: (daysOld: number) => Promise<number>;
  
  // UI operations
  setFilters: (filters: Partial<PassdownFilters>) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setShowArchived: (show: boolean) => void;
  selectPassdown: (passdown: Passdown | null) => void;
  
  // Utility
  refreshStats: () => void;
  clearError: () => void;
  resetStore: () => void;
}

type PassdownStore = PassdownState & PassdownActions;

const initialState: PassdownState = {
  passdowns: [],
  selectedPassdown: null,
  readReceipts: [],
  stats: null,
  loading: false,
  error: null,
  filters: {},
  viewMode: 'list',
  showArchived: false,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasMore: false,
  lastEvaluatedKey: null
};

export const usePassdownStore = create<PassdownStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Fetch passdowns with filters
      fetchPassdowns: async (filters?: PassdownFilters) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          // Get auth context (in real app, this would come from auth store)
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'View passdowns',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const appliedFilters = filters || get().filters;
          const response = await passdownService.getPassdowns(
            appliedFilters,
            { limit: 50, page: get().currentPage },
            context
          );
          
          if (response.success && response.data) {
            set({
              passdowns: response.data.passdowns,
              stats: response.data.stats || null,
              totalCount: response.data.pagination.total,
              totalPages: response.data.pagination.totalPages || 1,
              hasMore: response.data.pagination.hasMore,
              lastEvaluatedKey: response.data.pagination.lastEvaluatedKey || null,
              loading: false
            });
            
            // Update local stats
            get().refreshStats();
          } else {
            set({ 
              error: response.error?.message || 'Failed to fetch passdowns',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
        }
      },
      
      // Fetch single passdown by ID
      fetchPassdownById: async (id: string, includeRelated = false) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'View passdown details',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.getPassdownById(id, includeRelated, context);
          
          if (response.success && response.data) {
            set({
              selectedPassdown: response.data.passdown,
              readReceipts: response.data.readReceipts,
              loading: false
            });
          } else {
            set({ 
              error: response.error?.message || 'Failed to fetch passdown',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
        }
      },
      
      // Fetch passdowns for current shift
      fetchCurrentShiftPassdowns: async () => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'View current shift passdowns',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.getCurrentShiftPassdowns(context);
          
          if (response.success && response.data) {
            set({
              passdowns: response.data.passdowns,
              loading: false
            });
          } else {
            set({ 
              error: response.error?.message || 'Failed to fetch current shift passdowns',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
        }
      },
      
      // Fetch urgent passdowns
      fetchUrgentPassdowns: async () => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'View urgent passdowns',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.getUrgentPassdowns(context);
          
          if (response.success && response.data) {
            set({
              passdowns: response.data.passdowns,
              loading: false
            });
          } else {
            set({ 
              error: response.error?.message || 'Failed to fetch urgent passdowns',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
        }
      },
      
      // Create new passdown
      createPassdown: async (data: CreatePassdownRequest) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return false;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'Create passdown',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.createPassdown(data, context);
          
          if (response.success) {
            // Refresh the list
            await get().fetchPassdowns();
            set({ loading: false });
            return true;
          } else {
            set({ 
              error: response.error?.message || 'Failed to create passdown',
              loading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
          return false;
        }
      },
      
      // Update existing passdown
      updatePassdown: async (id: string, data: UpdatePassdownRequest) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return false;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'Update passdown',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.updatePassdown(id, data, context);
          
          if (response.success) {
            // Update local state
            const passdowns = get().passdowns.map(p => 
              p.id === id ? { ...p, ...data } : p
            );
            set({ passdowns, loading: false });
            
            // If this is the selected passdown, update it too
            if (get().selectedPassdown?.id === id) {
              await get().fetchPassdownById(id);
            }
            
            return true;
          } else {
            set({ 
              error: response.error?.message || 'Failed to update passdown',
              loading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
          return false;
        }
      },
      
      // Acknowledge passdown
      acknowledgePassdown: async (id: string, acknowledged: boolean, notes?: string) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return false;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'security_officer',
            companyId: 'company-123',
            token: 'auth-token',
            reason: 'Acknowledge passdown',
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.acknowledgePassdown(id, acknowledged, notes, context);
          
          if (response.success) {
            // Update acknowledgment count in list
            const passdowns = get().passdowns.map(p => {
              if (p.id === id) {
                return {
                  ...p,
                  acknowledgmentCount: acknowledged ? p.acknowledgmentCount + 1 : p.acknowledgmentCount,
                  readCount: p.readCount + 1
                };
              }
              return p;
            });
            
            set({ passdowns, loading: false });
            
            // Refresh selected passdown if it's this one
            if (get().selectedPassdown?.id === id) {
              await get().fetchPassdownById(id);
            }
            
            return true;
          } else {
            set({ 
              error: response.error?.message || 'Failed to acknowledge passdown',
              loading: false 
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
          return false;
        }
      },
      
      // Archive old passdowns
      archiveOldPassdowns: async (daysOld: number) => {
        // @ts-ignore - Service will be injected by ServiceProvider
        const passdownService = (window as any).__SITU8_SERVICES__?.passdownService;
        if (!passdownService) {
          set({ error: 'Passdown service not initialized' });
          return 0;
        }
        
        set({ loading: true, error: null });
        
        try {
          const context = {
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'admin',
            companyId: 'company-123',
            token: 'auth-token',
            reason: `Archive passdowns older than ${daysOld} days`,
            sessionId: 'session-123',
            ipAddress: '127.0.0.1'
          };
          
          const response = await passdownService.archiveOldPassdowns(daysOld, context);
          
          if (response.success && response.data) {
            // Refresh the list
            await get().fetchPassdowns();
            set({ loading: false });
            return response.data;
          } else {
            set({ 
              error: response.error?.message || 'Failed to archive passdowns',
              loading: false 
            });
            return 0;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
          return 0;
        }
      },
      
      // Set filters
      setFilters: (filters: Partial<PassdownFilters>) => {
        const newFilters = { ...get().filters, ...filters };
        set({ filters: newFilters, currentPage: 1 });
        // Automatically fetch with new filters
        get().fetchPassdowns(newFilters);
      },
      
      // Clear filters
      clearFilters: () => {
        set({ filters: {}, currentPage: 1 });
        get().fetchPassdowns({});
      },
      
      // Set view mode
      setViewMode: (mode: 'list' | 'grid') => {
        set({ viewMode: mode });
      },
      
      // Set show archived
      setShowArchived: (show: boolean) => {
        set({ showArchived: show });
        const filters = get().filters;
        if (show) {
          get().setFilters({ ...filters, status: 'archived' as PassdownStatus });
        } else {
          const { status, ...otherFilters } = filters;
          get().setFilters(otherFilters);
        }
      },
      
      // Select passdown
      selectPassdown: (passdown: Passdown | null) => {
        set({ selectedPassdown: passdown });
      },
      
      // Refresh stats
      refreshStats: () => {
        const passdowns = get().passdowns;
        
        const stats: PassdownStats = {
          total: passdowns.length,
          byStatus: {
            draft: passdowns.filter(p => p.status === 'draft').length,
            active: passdowns.filter(p => p.status === 'active').length,
            acknowledged: passdowns.filter(p => p.status === 'acknowledged').length,
            expired: passdowns.filter(p => p.status === 'expired').length,
            archived: passdowns.filter(p => p.status === 'archived').length,
          },
          byUrgency: {
            low: passdowns.filter(p => p.urgencyLevel === 'low').length,
            medium: passdowns.filter(p => p.urgencyLevel === 'medium').length,
            high: passdowns.filter(p => p.urgencyLevel === 'high').length,
            critical: passdowns.filter(p => p.urgencyLevel === 'critical').length,
          },
          byShift: {
            night: passdowns.filter(p => p.toShift === 'night').length,
            day: passdowns.filter(p => p.toShift === 'day').length,
            evening: passdowns.filter(p => p.toShift === 'evening').length,
            swing: passdowns.filter(p => p.toShift === 'swing').length,
            custom: passdowns.filter(p => p.toShift === 'custom').length,
          },
          todayCount: passdowns.filter(p => {
            const today = new Date().toISOString().split('T')[0];
            return p.shiftDate === today;
          }).length,
          pendingAcknowledgment: passdowns.filter(p => 
            p.status === 'active' && p.acknowledgmentCount === 0
          ).length,
          recentlyCreated: passdowns.filter(p => {
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return new Date(p.createdAt) > dayAgo;
          }).length,
          attachmentCount: passdowns.filter(p => p.hasAttachments).length
        };
        
        set({ stats });
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Reset store
      resetStore: () => {
        set(initialState);
      }
    }),
    {
      name: 'situ8-passdown-store',
      partialize: (state) => ({
        filters: state.filters,
        viewMode: state.viewMode,
        showArchived: state.showArchived
      })
    }
  )
);