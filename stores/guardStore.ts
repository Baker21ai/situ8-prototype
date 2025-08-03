import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

export interface GuardLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp?: Date;
}

export interface Guard {
  id: number;
  name: string;
  status: 'available' | 'responding' | 'patrolling' | 'investigating' | 'break' | 'off_duty' | 'emergency';
  location: string;
  building: string;
  zone: string;
  lastUpdate: Date;
  radio: string;
  assignedActivity?: number | null;
  badge: string;
  shift: string;
  department: string;
  skills: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  metrics: {
    activitiesCreated: number;
    incidentsResolved: number;
    hoursPatrolled: number;
    areasChecked: number;
  };
}

interface GuardState {
  guards: Guard[];
  selectedGuard: Guard | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;

  // Actions
  setGuards: (guards: Guard[]) => void;
  updateGuard: (guardId: number, updates: Partial<Guard>) => void;
  updateGuardLocation: (guardId: number, location: GuardLocation) => void;
  setSelectedGuard: (guard: Guard | null) => void;
  assignGuardToActivity: (guardId: number, activityId: number) => void;
  updateGuardStatus: (guardId: number, status: Guard['status']) => void;
  getGuardById: (guardId: number) => Guard | undefined;
  getAvailableGuards: () => Guard[];
  getGuardsByBuilding: (building: string) => Guard[];
  syncGuards: () => Promise<void>;
}

// Initial mock data matching CommandCenter_new.tsx
const initialGuards: Guard[] = [
  {
    id: 1,
    name: 'Garcia, M.',
    status: 'responding',
    location: 'Building A - Floor 3',
    building: 'building-a',
    zone: 'Zone A-2',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: 1,
    badge: 'SEC-4782',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Medical', 'Supervisor'],
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
    metrics: {
      activitiesCreated: 34,
      incidentsResolved: 12,
      hoursPatrolled: 156,
      areasChecked: 89
    }
  },
  {
    id: 2,
    name: 'Chen, L.',
    status: 'patrolling',
    location: 'Building B - Floor 2',
    building: 'building-b',
    zone: 'Zone B-1',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4783',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['K9 Handler'],
    latitude: 37.7751,
    longitude: -122.4196,
    accuracy: 5,
    metrics: {
      activitiesCreated: 28,
      incidentsResolved: 8,
      hoursPatrolled: 142,
      areasChecked: 76
    }
  },
  {
    id: 3,
    name: 'Rodriguez, A.',
    status: 'available',
    location: 'Building A - Lobby',
    building: 'building-a',
    zone: 'Zone A-1',
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: null,
    badge: 'SEC-4784',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Medical', 'Fire Safety'],
    latitude: 37.7747,
    longitude: -122.4192,
    accuracy: 5,
    metrics: {
      activitiesCreated: 42,
      incidentsResolved: 15,
      hoursPatrolled: 178,
      areasChecked: 94
    }
  },
  {
    id: 4,
    name: 'Johnson, K.',
    status: 'break',
    location: 'Building A - Break Room',
    building: 'building-a',
    zone: 'Zone A-0',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: null,
    badge: 'SEC-4785',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Supervisor', 'Training'],
    latitude: 37.7745,
    longitude: -122.4190,
    accuracy: 5,
    metrics: {
      activitiesCreated: 56,
      incidentsResolved: 23,
      hoursPatrolled: 201,
      areasChecked: 112
    }
  },
  {
    id: 5,
    name: 'Smith, J.',
    status: 'patrolling',
    location: 'Building B - Parking',
    building: 'building-b',
    zone: 'Zone B-1',
    lastUpdate: new Date(Date.now() - 7 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4786',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Vehicle Patrol'],
    latitude: 37.7753,
    longitude: -122.4198,
    accuracy: 5,
    metrics: {
      activitiesCreated: 31,
      incidentsResolved: 9,
      hoursPatrolled: 134,
      areasChecked: 67
    }
  },
  {
    id: 6,
    name: 'Williams, B.',
    status: 'investigating',
    location: 'Building B - Server Room',
    building: 'building-b',
    zone: 'Zone B-2',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: 3,
    badge: 'SEC-4787',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Technical', 'Access Control'],
    latitude: 37.7755,
    longitude: -122.4200,
    accuracy: 5,
    metrics: {
      activitiesCreated: 45,
      incidentsResolved: 18,
      hoursPatrolled: 167,
      areasChecked: 98
    }
  },
  {
    id: 7,
    name: 'Davis, R.',
    status: 'available',
    location: 'Building B - East Wing',
    building: 'building-b',
    zone: 'Zone B-3',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4788',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Medical'],
    latitude: 37.7757,
    longitude: -122.4202,
    accuracy: 5,
    metrics: {
      activitiesCreated: 29,
      incidentsResolved: 11,
      hoursPatrolled: 145,
      areasChecked: 71
    }
  },
  {
    id: 8,
    name: 'Martinez, E.',
    status: 'responding',
    location: 'Parking Lot - Section C',
    building: 'parking-lot',
    zone: 'Zone P-1',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: 4,
    badge: 'SEC-4789',
    shift: '22:00 - 06:00',
    department: 'Security',
    skills: ['Night Shift', 'Perimeter'],
    latitude: 37.7743,
    longitude: -122.4188,
    accuracy: 5,
    metrics: {
      activitiesCreated: 38,
      incidentsResolved: 14,
      hoursPatrolled: 189,
      areasChecked: 105
    }
  },
  {
    id: 9,
    name: 'Thompson, H.',
    status: 'patrolling',
    location: 'Perimeter - North Gate',
    building: 'perimeter',
    zone: 'Zone P-2',
    lastUpdate: new Date(Date.now() - 12 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: null,
    badge: 'SEC-4790',
    shift: '22:00 - 06:00',
    department: 'Security',
    skills: ['Gate Security', 'Vehicle Inspection'],
    latitude: 37.7759,
    longitude: -122.4194,
    accuracy: 5,
    metrics: {
      activitiesCreated: 52,
      incidentsResolved: 19,
      hoursPatrolled: 198,
      areasChecked: 116
    }
  },
  {
    id: 10,
    name: 'Wilson, P.',
    status: 'emergency',
    location: 'Perimeter - South Gate',
    building: 'perimeter',
    zone: 'Zone P-3',
    lastUpdate: new Date(Date.now() - 0 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: 5,
    badge: 'SEC-4791',
    shift: '22:00 - 06:00',
    department: 'Security',
    skills: ['Emergency Response', 'Medical'],
    latitude: 37.7741,
    longitude: -122.4194,
    accuracy: 5,
    metrics: {
      activitiesCreated: 61,
      incidentsResolved: 26,
      hoursPatrolled: 212,
      areasChecked: 124
    }
  }
];

export const useGuardStore = create<GuardState>()(
  devtools(
    persist(
      (set, get) => ({
        guards: initialGuards,
        selectedGuard: null,
        isLoading: false,
        error: null,
        lastSync: null,

        setGuards: (guards) => set({ guards }),

        updateGuard: (guardId, updates) => {
          set((state) => ({
            guards: state.guards.map((guard) =>
              guard.id === guardId ? { ...guard, ...updates, lastUpdate: new Date() } : guard
            )
          }));
        },

        updateGuardLocation: (guardId, location) => {
          set((state) => ({
            guards: state.guards.map((guard) =>
              guard.id === guardId
                ? {
                    ...guard,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    lastUpdate: location.timestamp || new Date()
                  }
                : guard
            )
          }));
        },

        setSelectedGuard: (guard) => set({ selectedGuard: guard }),

        assignGuardToActivity: (guardId, activityId) => {
          set((state) => ({
            guards: state.guards.map((guard) =>
              guard.id === guardId
                ? { ...guard, assignedActivity: activityId, status: 'responding', lastUpdate: new Date() }
                : guard
            )
          }));
        },

        updateGuardStatus: (guardId, status) => {
          set((state) => ({
            guards: state.guards.map((guard) =>
              guard.id === guardId ? { ...guard, status, lastUpdate: new Date() } : guard
            )
          }));
        },

        getGuardById: (guardId) => {
          return get().guards.find((guard) => guard.id === guardId);
        },

        getAvailableGuards: () => {
          return get().guards.filter((guard) => guard.status === 'available');
        },

        getGuardsByBuilding: (building) => {
          return get().guards.filter((guard) => guard.building === building);
        },

        syncGuards: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: Implement API call to sync guards with backend
            // For now, we'll simulate a successful sync
            await new Promise((resolve) => setTimeout(resolve, 1000));
            set({ lastSync: new Date(), isLoading: false });
          } catch (error) {
            set({ error: 'Failed to sync guards', isLoading: false });
          }
        }
      }),
      {
        name: 'guard-store',
        partialize: (state) => ({
          guards: state.guards,
          selectedGuard: state.selectedGuard
        })
      }
    )
  )
);