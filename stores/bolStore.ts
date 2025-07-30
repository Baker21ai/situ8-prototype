/**
 * BOL Store - Basic implementation for Task #2
 * Will be expanded in Task #8 with full pattern matching and confidence scoring
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simplified BOL interface for now
interface SimpleBOL {
  id: string;
  bol_number: string;
  title: string;
  type: 'person' | 'vehicle' | 'object' | 'pattern';
  status: 'draft' | 'active' | 'suspended' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  issued_by: string;
  created_at: Date;
  effective_until?: Date;
}

interface BOLState {
  bols: SimpleBOL[];
  selectedBOL: SimpleBOL | null;
  loading: boolean;
  error: string | null;
}

interface BOLActions {
  createBOL: (bolData: Partial<SimpleBOL>) => void;
  updateBOL: (id: string, updates: Partial<SimpleBOL>) => void;
  selectBOL: (bol: SimpleBOL | null) => void;
  getBOLStats: () => {
    total: number;
    active: number;
    suspended: number;
    resolved: number;
  };
  resetStore: () => void;
}

type BOLStore = BOLState & BOLActions;

export const useBOLStore = create<BOLStore>()(
  persist(
    (set, get) => ({
      // Initial state
      bols: [],
      selectedBOL: null,
      loading: false,
      error: null,
      
      // Actions
      createBOL: (bolData) => {
        const { bols } = get();
        const bolNumber = `BOL-${new Date().getFullYear()}-${(bols.length + 1).toString().padStart(6, '0')}`;
        
        const newBOL: SimpleBOL = {
          id: `BOL-${Date.now()}`,
          bol_number: bolNumber,
          title: 'New Be-On-Lookout',
          type: 'person',
          status: 'draft',
          priority: 'medium',
          issued_by: 'current-user',
          created_at: new Date(),
          ...bolData,
        };
        
        set({ bols: [newBOL, ...bols] });
      },
      
      updateBOL: (id, updates) => {
        const { bols } = get();
        const updatedBOLs = bols.map(bol =>
          bol.id === id ? { ...bol, ...updates } : bol
        );
        set({ bols: updatedBOLs });
      },
      
      selectBOL: (bol) => {
        set({ selectedBOL: bol });
      },
      
      getBOLStats: () => {
        const { bols } = get();
        return {
          total: bols.length,
          active: bols.filter(b => b.status === 'active').length,
          suspended: bols.filter(b => b.status === 'suspended').length,
          resolved: bols.filter(b => b.status === 'resolved').length,
        };
      },
      
      resetStore: () => {
        set({
          bols: [],
          selectedBOL: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'situ8-bol-store',
      partialize: (state) => ({
        bols: state.bols,
      }),
    }
  )
);