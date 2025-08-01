/**
 * Incident Store - Manages incident state with full business logic
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Incident } from '../lib/types/incident';
import { Priority, Status } from '../lib/utils/status';

interface IncidentState {
  incidents: Incident[];
  selectedIncident: Incident | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: Status;
    priority?: Priority;
    assignedTo?: string;
    showAutoCreated?: boolean;
  };
}

interface IncidentActions {
  createIncident: (incident: Partial<Incident>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  selectIncident: (incident: Incident | null) => void;
  setFilters: (filters: Partial<IncidentState['filters']>) => void;
  clearFilters: () => void;
  getIncidentStats: () => {
    total: number;
    pending: number;
    active: number;
    investigating: number;
    resolved: number;
    autoCreated: number;
    criticalCount: number;
  };
  generateMockIncidents: () => void;
  resetStore: () => void;
}

type IncidentStore = IncidentState & IncidentActions;

export const useIncidentStore = create<IncidentStore>()(
  persist(
    (set, get) => {
      // Generate initial mock incidents
      const generateInitialIncidents = (): Incident[] => {
        const now = new Date();
        return [
          {
            id: 'INC-000001',
            title: 'Unauthorized Access Attempt - Server Room',
            description: 'Multiple failed badge attempts detected at Building B server room',
            type: 'security_breach',
            status: 'active',
            priority: 'critical',
            trigger_activity_id: 'ACT-000123',
            related_activities: ['ACT-000123', 'ACT-000124'],
            created_at: new Date(now.getTime() - 5 * 60 * 1000),
            updated_at: new Date(now.getTime() - 2 * 60 * 1000),
            created_by: 'system',
            updated_by: 'garcia.m',
            assigned_to: 'garcia.m',
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            is_pending: false,
            pending_until: new Date(now.getTime() + 5 * 60 * 1000),
            auto_created: true,
            creation_rule: 'human_validated_security_breach',
            requires_validation: true,
            dismissible: true,
            escalation_time: new Date(now.getTime() + 10 * 60 * 1000),
            escalation_target: 'supervisor',
            validation_status: 'approved',
            validated_by: 'garcia.m',
            validated_at: new Date(now.getTime() - 3 * 60 * 1000)
          },
          {
            id: 'INC-000002',
            title: 'Medical Emergency - Cafeteria',
            description: 'Employee collapsed in main cafeteria, emergency services contacted',
            type: 'medical_emergency',
            status: 'pending',
            priority: 'critical',
            trigger_activity_id: 'ACT-000125',
            related_activities: ['ACT-000125'],
            created_at: new Date(now.getTime() - 15 * 60 * 1000),
            updated_at: new Date(now.getTime() - 15 * 60 * 1000),
            created_by: 'system',
            updated_by: 'system',
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            is_pending: true,
            pending_until: new Date(now.getTime() + 5 * 60 * 1000),
            auto_created: true,
            creation_rule: 'human_validated_medical',
            requires_validation: true,
            dismissible: true
          },
          {
            id: 'INC-000003',
            title: 'Suspicious Vehicle - Parking Lot P-3',
            description: 'Unregistered vehicle loitering in restricted parking area',
            type: 'external_threat',
            status: 'pending',
            priority: 'high',
            trigger_activity_id: 'ACT-000126',
            related_activities: ['ACT-000126'],
            created_at: new Date(now.getTime() - 8 * 60 * 1000),
            updated_at: new Date(now.getTime() - 8 * 60 * 1000),
            created_by: 'system',
            updated_by: 'system',
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            is_pending: true,
            pending_until: new Date(now.getTime() + 5 * 60 * 1000),
            auto_created: true,
            creation_rule: 'human_validated_threat',
            requires_validation: true,
            dismissible: true,
            confidence: 78
          },
          {
            id: 'INC-000004',
            title: 'Fire Alarm Activation - Building C',
            description: 'Fire alarm triggered on 3rd floor, investigating cause',
            type: 'system_anomaly',
            status: 'investigating',
            priority: 'high',
            trigger_activity_id: 'ACT-000127',
            related_activities: ['ACT-000127', 'ACT-000128'],
            created_at: new Date(now.getTime() - 25 * 60 * 1000),
            updated_at: new Date(now.getTime() - 5 * 60 * 1000),
            created_by: 'system',
            updated_by: 'wilson.r',
            assigned_to: 'wilson.r',
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            is_pending: false,
            pending_until: new Date(now.getTime() + 5 * 60 * 1000),
            auto_created: true,
            creation_rule: 'human_validated_anomaly',
            requires_validation: true,
            dismissible: true,
            validation_status: 'approved',
            validated_by: 'wilson.r',
            validated_at: new Date(now.getTime() - 20 * 60 * 1000)
          },
          {
            id: 'INC-000005',
            title: 'Tailgating Detection - Main Entrance',
            description: 'AI detected potential tailgating at main entrance',
            type: 'security_breach',
            status: 'pending',
            priority: 'medium',
            trigger_activity_id: 'ACT-000129',
            related_activities: ['ACT-000129'],
            created_at: new Date(now.getTime() - 3 * 60 * 1000),
            updated_at: new Date(now.getTime() - 3 * 60 * 1000),
            created_by: 'system',
            updated_by: 'system',
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            is_pending: true,
            pending_until: new Date(now.getTime() + 5 * 60 * 1000),
            auto_created: true,
            creation_rule: 'human_validated_tailgate',
            requires_validation: true,
            dismissible: true,
            confidence: 82
          }
        ];
      };
      
      return {
        // Initial state with mock data
        incidents: generateInitialIncidents(),
        selectedIncident: null,
        loading: false,
        error: null,
        filters: {},
        
        // Actions
        createIncident: (incidentData) => {
          const { incidents } = get();
          const newIncident: Incident = {
            id: `INC-${Date.now().toString().padStart(6, '0')}`,
            title: 'New Incident',
            description: '',
            type: 'other',
            status: 'pending',
            priority: 'medium',
            created_at: new Date(),
            updated_at: new Date(),
            created_by: 'current-user',
            updated_by: 'current-user',
            related_activities: [],
            auto_created: true,
            requires_validation: true,
            dismissible: true,
            is_pending: true,
            site_id: 'SITE-001',
            site_name: 'Main Campus',
            multi_location: false,
            affected_locations: [],
            creation_rule: 'human_validated_manual',
            ...incidentData,
          } as Incident;
          
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
        
        setFilters: (newFilters) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters }
          }));
        },
        
        clearFilters: () => {
          set({ filters: {} });
        },
        
        getIncidentStats: () => {
          const { incidents } = get();
          return {
            total: incidents.length,
            pending: incidents.filter(i => i.status === 'pending').length,
            active: incidents.filter(i => i.status === 'active').length,
            investigating: incidents.filter(i => i.status === 'investigating').length,
            resolved: incidents.filter(i => i.status === 'resolved').length,
            autoCreated: incidents.filter(i => i.auto_created).length,
            criticalCount: incidents.filter(i => i.priority === 'critical').length,
          };
        },
        
        generateMockIncidents: () => {
          const mockIncidents = generateInitialIncidents();
          set({ incidents: mockIncidents });
        },
        
        resetStore: () => {
          set({
            incidents: [],
            selectedIncident: null,
            loading: false,
            error: null,
            filters: {},
          });
        },
      };
    },
    {
      name: 'situ8-incident-store',
      partialize: (state) => ({
        incidents: state.incidents,
      }),
    }
  )
);

export type { Incident, IncidentStore };