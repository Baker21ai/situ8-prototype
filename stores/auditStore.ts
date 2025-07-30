/**
 * Audit Store - Basic implementation for Task #2
 * Will be expanded in Task #4 with full WHO, WHAT, WHEN, WHERE, WHY audit trail
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simplified audit entry for now
interface SimpleAuditEntry {
  id: string;
  timestamp: Date;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: 'activity' | 'incident' | 'case' | 'bol';
  entity_id: string;
  description: string;
}

interface AuditState {
  auditEntries: SimpleAuditEntry[];
  loading: boolean;
  error: string | null;
}

interface AuditActions {
  logAction: (entry: Omit<SimpleAuditEntry, 'id' | 'timestamp'>) => void;
  getAuditTrail: (entityType: string, entityId: string) => SimpleAuditEntry[];
  getRecentActivity: (limit?: number) => SimpleAuditEntry[];
  clearOldEntries: (daysToKeep: number) => void;
  resetStore: () => void;
}

type AuditStore = AuditState & AuditActions;

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      // Initial state
      auditEntries: [],
      loading: false,
      error: null,
      
      // Actions
      logAction: (entryData) => {
        const { auditEntries } = get();
        const newEntry: SimpleAuditEntry = {
          id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          ...entryData,
        };
        
        set({ auditEntries: [newEntry, ...auditEntries] });
      },
      
      getAuditTrail: (entityType, entityId) => {
        const { auditEntries } = get();
        return auditEntries
          .filter(entry => entry.entity_type === entityType && entry.entity_id === entityId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      },
      
      getRecentActivity: (limit = 50) => {
        const { auditEntries } = get();
        return auditEntries
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
      },
      
      clearOldEntries: (daysToKeep) => {
        const { auditEntries } = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const filteredEntries = auditEntries.filter(
          entry => entry.timestamp >= cutoffDate
        );
        
        set({ auditEntries: filteredEntries });
      },
      
      resetStore: () => {
        set({
          auditEntries: [],
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'situ8-audit-store',
      partialize: (state) => ({
        auditEntries: state.auditEntries,
      }),
    }
  )
);