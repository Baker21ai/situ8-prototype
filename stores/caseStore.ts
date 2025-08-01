/**
 * Case Store - Basic implementation for Task #2
 * Will be expanded in Task #7 with full investigation workflow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaseType, CaseStatus } from '../lib/types/case';

// Simplified case interface that's compatible with full Case interface
interface SimpleCase {
  id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lead_investigator: string;
  created_at: Date;
  description?: string;
  assignedTo?: string;
  type: CaseType;
  investigators?: string[];
  linked_incident_ids?: string[];
  evidence_items?: any[];
  timeline_events?: any[];
  updated_at: Date;
  created_by: string;
  updated_by: string;
  conclusion?: string;
  // Add compatibility properties that components expect
  related_incidents?: string[];
  related_activities?: string[];
}

interface CaseState {
  cases: SimpleCase[];
  selectedCase: SimpleCase | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
    type?: string;
  };
}

interface CaseActions {
  createCase: (caseData: Partial<SimpleCase>) => void;
  updateCase: (id: string, updates: Partial<SimpleCase>) => void;
  selectCase: (caseData: SimpleCase | null) => void;
  setFilters: (filters: Partial<CaseState['filters']>) => void;
  clearFilters: () => void;
  getCaseStats: () => {
    total: number;
    active: number;
    completed: number;
    draft: number;
    byStatus: Record<string, number>;
    criticalCount: number;
    closedCount: number;
  };
  resetStore: () => void;
}

type CaseStore = CaseState & CaseActions;

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cases: [],
      selectedCase: null,
      loading: false,
      error: null,
      filters: {},
      
      // Actions
      createCase: (caseData) => {
        const { cases } = get();
        const caseNumber = `CASE-${new Date().getFullYear()}-${(cases.length + 1).toString().padStart(6, '0')}`;
        
        const newCase: SimpleCase = {
          id: `CASE-${Date.now()}`,
          case_number: caseNumber,
          title: 'New Investigation Case',
          status: 'draft' as CaseStatus,
          priority: 'medium',
          lead_investigator: 'current-user',
          type: 'incident_investigation' as CaseType,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'current-user',
          updated_by: 'current-user',
          ...caseData,
        };
        
        set({ cases: [newCase, ...cases] });
      },
      
      updateCase: (id, updates) => {
        const { cases } = get();
        const updatedCases = cases.map(caseItem =>
          caseItem.id === id ? { ...caseItem, ...updates } : caseItem
        );
        set({ cases: updatedCases });
      },
      
      selectCase: (caseData) => {
        set({ selectedCase: caseData });
      },
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },
      
      clearFilters: () => {
        set({ filters: {} });
      },
      
      getCaseStats: () => {
        const { cases } = get();
        const stats = {
          total: cases.length,
          active: cases.filter(c => c.status === 'active').length,
          completed: cases.filter(c => c.status === 'completed').length,
          draft: cases.filter(c => c.status === 'draft').length,
          byStatus: {} as Record<string, number>,
          criticalCount: cases.filter(c => c.priority === 'critical').length,
          closedCount: cases.filter(c => c.status === 'closed').length,
        };
        
        // Calculate byStatus - set default values for expected statuses
        stats.byStatus = {
          open: 0,
          investigating: 0,
          evidence_collection: 0,
          analysis: 0,
          closed: 0,
        };
        
        cases.forEach(c => {
          // Map simplified statuses to expected ones
          if (c.status === 'draft' || c.status === 'active') {
            stats.byStatus.open = (stats.byStatus.open || 0) + 1;
          } else if (c.status === 'closed') {
            stats.byStatus.closed = (stats.byStatus.closed || 0) + 1;
          }
        });
        
        return stats;
      },
      
      resetStore: () => {
        set({
          cases: [],
          selectedCase: null,
          loading: false,
          error: null,
          filters: {},
        });
      },
    }),
    {
      name: 'situ8-case-store',
      partialize: (state) => ({
        cases: state.cases,
      }),
    }
  )
);