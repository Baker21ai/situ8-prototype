/**
 * Incident Store - Basic implementation for Task #2
 * Will be expanded in Task #6 with full business logic
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simplified incident interface for now
interface SimpleIncident {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  trigger_activity_id?: string;
}

interface IncidentState {
  incidents: SimpleIncident[];
  selectedIncident: SimpleIncident | null;
  loading: boolean;
  error: string | null;
}

interface IncidentActions {
  createIncident: (incident: Partial<SimpleIncident>) => void;
  updateIncident: (id: string, updates: Partial<SimpleIncident>) => void;
  selectIncident: (incident: SimpleIncident | null) => void;
  getIncidentStats: () => {
    total: number;
    pending: number;
    active: number;
    resolved: number;
  };
  resetStore: () => void;
}

type IncidentStore = IncidentState & IncidentActions;

export const useIncidentStore = create<IncidentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      incidents: [],
      selectedIncident: null,
      loading: false,
      error: null,
      
      // Actions
      createIncident: (incidentData) => {
        const { incidents } = get();
        const newIncident: SimpleIncident = {
          id: `INC-${Date.now()}`,
          title: 'New Incident',
          status: 'pending',
          priority: 'medium',
          created_at: new Date(),
          ...incidentData,
        };
        
        set({ incidents: [newIncident, ...incidents] });
      },
      
      updateIncident: (id, updates) => {
        const { incidents } = get();
        const updatedIncidents = incidents.map(incident =>
          incident.id === id ? { ...incident, ...updates } : incident
        );
        set({ incidents: updatedIncidents });
      },
      
      selectIncident: (incident) => {
        set({ selectedIncident: incident });
      },
      
      getIncidentStats: () => {
        const { incidents } = get();
        return {
          total: incidents.length,
          pending: incidents.filter(i => i.status === 'pending').length,
          active: incidents.filter(i => i.status === 'active').length,
          resolved: incidents.filter(i => i.status === 'resolved').length,
        };
      },
      
      resetStore: () => {
        set({
          incidents: [],
          selectedIncident: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'situ8-incident-store',
      partialize: (state) => ({
        incidents: state.incidents,
      }),
    }
  )
);