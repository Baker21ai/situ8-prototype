/**
 * Case Store - Basic implementation for Task #2
 * Will be expanded in Task #7 with full investigation workflow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaseType, CaseStatus, InvestigationPhase } from '../lib/types/case';
import { useAuditStore } from './auditStore';
import { useUserStore } from './userStore';

// Simplified case interface that's compatible with full Case interface
interface SimpleCase {
  id: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  leadInvestigatorId?: string;
  createdAt: string;
  description: string;
  caseType: CaseType;
  currentPhase: InvestigationPhase;
  primarySiteId?: string;
  targetCompletionDate?: string;
  regulatoryDeadline?: string;
  tags?: string[];
  // Compatibility properties
  assignedTo?: string;
  investigators?: string[];
  linkedIncidentIds?: string[];
  evidenceItems?: any[];
  timelineEvents?: any[];
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  conclusion?: string;
  relatedIncidents?: string[];
  relatedActivities?: string[];
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
  deleteCase: (id: string) => Promise<void>;
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
  fetchCases: () => Promise<void>;
  clearError: () => void;
  initializeWithSampleData: () => void;
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
          caseNumber,
          title: 'New Investigation Case',
          description: 'Investigation case created via form',
          status: 'draft' as CaseStatus,
          priority: 'medium',
          leadInvestigatorId: 'current-user',
          caseType: 'incident_investigation' as CaseType,
          currentPhase: 'initiation' as InvestigationPhase,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedBy: 'current-user',
          ...caseData,
        };
        
        set({ cases: [newCase, ...cases] });
      },
      
      updateCase: (id, updates) => {
        const { cases } = get();
        const caseToUpdate = cases.find(c => c.id === id);
        
        if (!caseToUpdate) {
          console.error('Case not found:', id);
          return;
        }
        
        // Create updated case
        const updatedCase = { 
          ...caseToUpdate, 
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: updates.updatedBy || 'system'
        };
        
        // Update cases list
        const updatedCases = cases.map(caseItem =>
          caseItem.id === id ? updatedCase : caseItem
        );
        set({ cases: updatedCases });
        
        // Log audit entry
        const auditStore = useAuditStore.getState();
        const userStore = useUserStore.getState();
        const currentUser = userStore.currentUser;
        
        if (currentUser) {
          const changes = Object.entries(updates).map(([field, newValue]) => ({
            field,
            oldValue: (caseToUpdate as any)[field],
            newValue,
            fieldType: 'string',
            isSensitive: field === 'leadInvestigatorId'
          }));
          
          auditStore.logAction({
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            action: 'update',
            entityType: 'case',
            entityId: id,
            entityName: caseToUpdate.title,
            reason: `Case updated: ${caseToUpdate.caseNumber}`,
            changes,
            beforeState: caseToUpdate,
            afterState: updatedCase
          });
        }
      },
      
      deleteCase: async (id) => {
        set({ loading: true, error: null });
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { cases } = get();
          const caseToDelete = cases.find(c => c.id === id);
          
          if (!caseToDelete) {
            throw new Error('Case not found');
          }
          
          const updatedCases = cases.filter(caseItem => caseItem.id !== id);
          
          // If the deleted case was selected, clear selection
          const { selectedCase } = get();
          if (selectedCase?.id === id) {
            set({ selectedCase: null });
          }
          
          set({ cases: updatedCases, loading: false });
          
          // Log audit entry for deletion
          const auditStore = useAuditStore.getState();
          const userStore = useUserStore.getState();
          const currentUser = userStore.currentUser;
          
          if (currentUser) {
            auditStore.logAction({
              userId: currentUser.id,
              userName: currentUser.name,
              userRole: currentUser.role,
              action: 'delete',
              entityType: 'case',
              entityId: id,
              entityName: caseToDelete.title,
              reason: `Case deleted: ${caseToDelete.caseNumber}`,
              beforeState: caseToDelete,
              afterState: null,
              severity: 'high' // Case deletion is a high-severity action
            });
          }
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Failed to delete case' 
          });
          throw error;
        }
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

      fetchCases: async () => {
        set({ loading: true, error: null });
        try {
          // For now, we'll just resolve immediately since we're using local storage
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ loading: false });
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch cases' 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initializeWithSampleData: () => {
        const sampleCases: SimpleCase[] = [
          {
            id: 'CASE-001',
            caseNumber: 'CASE-2025-000001',
            title: 'Security Breach Investigation - East Wing',
            description: 'Unauthorized access detected in East Wing security systems. Multiple card swipes at unusual hours require investigation.',
            status: 'active',
            priority: 'high',
            leadInvestigatorId: 'inv-001',
            caseType: 'security_investigation',
            currentPhase: 'evidence_collection',
            primarySiteId: 'site-001',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin-001',
            updatedBy: 'inv-001',
            tags: ['urgent', 'access-control', 'east-wing'],
            targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'CASE-002',
            caseNumber: 'CASE-2025-000002',
            title: 'Workplace Incident - Slip and Fall',
            description: 'Employee reported slip and fall incident in cafeteria. Investigating potential safety hazards and liability.',
            status: 'pending_review',
            priority: 'medium',
            leadInvestigatorId: 'inv-002',
            caseType: 'safety_investigation',
            currentPhase: 'reporting',
            primarySiteId: 'site-001',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'hr-001',
            updatedBy: 'inv-002',
            tags: ['safety', 'cafeteria', 'liability'],
            regulatoryDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'CASE-003',
            caseNumber: 'CASE-2025-000003',
            title: 'Fraud Investigation - Expense Claims',
            description: 'Suspicious patterns detected in expense claim submissions from multiple employees. Potential fraudulent activity.',
            status: 'escalated',
            priority: 'critical',
            leadInvestigatorId: 'inv-003',
            caseType: 'fraud_investigation',
            currentPhase: 'analysis',
            primarySiteId: 'site-002',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            createdBy: 'finance-001',
            updatedBy: 'inv-003',
            tags: ['fraud', 'financial', 'expenses', 'high-priority'],
            targetCompletionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'CASE-004',
            caseNumber: 'CASE-2025-000004',
            title: 'Data Compliance Audit',
            description: 'Routine compliance audit to ensure data handling procedures meet regulatory requirements.',
            status: 'completed',
            priority: 'low',
            leadInvestigatorId: 'inv-004',
            caseType: 'compliance_investigation',
            currentPhase: 'closure',
            primarySiteId: 'site-001',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'compliance-001',
            updatedBy: 'inv-004',
            tags: ['compliance', 'data-protection', 'audit', 'routine'],
            conclusion: 'All data handling procedures found to be compliant with current regulations.',
          },
          {
            id: 'CASE-005',
            caseNumber: 'CASE-2025-000005',
            title: 'Property Damage Investigation',
            description: 'Damage to company vehicles in parking garage. Investigating cause and potential insurance claims.',
            status: 'draft',
            priority: 'medium',
            leadInvestigatorId: 'inv-001',
            caseType: 'property_investigation',
            currentPhase: 'initiation',
            primarySiteId: 'site-003',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'security-001',
            updatedBy: 'security-001',
            tags: ['property', 'vehicles', 'parking', 'insurance'],
            targetCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ];

        set({ cases: sampleCases });
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