/**
 * Case Store - Basic implementation for Task #2
 * Will be expanded in Task #7 with full investigation workflow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simplified case interface for now
interface SimpleCase {
  id: string;
  case_number: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lead_investigator: string;
  created_at: Date;
}

interface CaseState {
  cases: SimpleCase[];
  selectedCase: SimpleCase | null;
  loading: boolean;
  error: string | null;
}

interface CaseActions {
  createCase: (caseData: Partial<SimpleCase>) => void;
  updateCase: (id: string, updates: Partial<SimpleCase>) => void;
  selectCase: (caseData: SimpleCase | null) => void;
  getCaseStats: () => {
    total: number;
    active: number;
    completed: number;
    draft: number;
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
      
      // Actions
      createCase: (caseData) => {
        const { cases } = get();
        const caseNumber = `CASE-${new Date().getFullYear()}-${(cases.length + 1).toString().padStart(6, '0')}`;
        
        const newCase: SimpleCase = {
          id: `CASE-${Date.now()}`,
          case_number: caseNumber,
          title: 'New Investigation Case',
          status: 'draft',
          priority: 'medium',
          lead_investigator: 'current-user',
          created_at: new Date(),
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
      
      getCaseStats: () => {
        const { cases } = get();
        return {
          total: cases.length,
          active: cases.filter(c => c.status === 'active').length,
          completed: cases.filter(c => c.status === 'completed').length,
          draft: cases.filter(c => c.status === 'draft').length,
        };
      },
      
      resetStore: () => {
        set({
          cases: [],
          selectedCase: null,
          loading: false,
          error: null,
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