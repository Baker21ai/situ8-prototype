import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import mockPatrolData from '../../data/mock/mockPatrolHistory.json';

export interface PatrolPosition {
  id: string;
  guardId: number;
  guardName: string;
  timestamp: string;
  position: {
    latitude: number;
    longitude: number;
    floor: number;
    building: string;
    accuracy: number;
  };
  checkPoint: string | null;
  checkPointName: string | null;
  status: 'checked' | 'missed' | 'patrolling' | 'incident';
  notes: string;
  patrolRoute: string;
  shiftStart: string;
}

export interface PatrolRoute {
  id: string;
  name: string;
  checkPoints: string[];
  estimatedDuration: number; // in minutes
  frequency: 'hourly' | 'every-2-hours' | 'shift' | 'daily';
  building: string;
  isActive: boolean;
}

export interface GuardTrail {
  guardId: number;
  guardName: string;
  positions: PatrolPosition[];
  startTime: string;
  endTime: string;
  totalDistance: number; // in meters
  checkPointsCompleted: number;
  checkPointsMissed: number;
  complianceScore: number;
}

interface PatrolFilters {
  guardId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  building?: string;
  route?: string;
  status?: PatrolPosition['status'];
}

interface MockPatrolState {
  patrolHistory: PatrolPosition[];
  patrolRoutes: PatrolRoute[];
  selectedGuardTrail: GuardTrail | null;
  filters: PatrolFilters;
  playbackState: {
    isPlaying: boolean;
    currentIndex: number;
    speed: number; // 1x, 2x, 4x, etc.
    selectedTrail: GuardTrail | null;
  };
  isLoading: boolean;
  lastUpdate: Date | null;

  // Actions
  setPatrolHistory: (history: PatrolPosition[]) => void;
  addPatrolPosition: (position: Omit<PatrolPosition, 'id'>) => void;
  updatePatrolPosition: (id: string, updates: Partial<PatrolPosition>) => void;
  setFilters: (filters: Partial<PatrolFilters>) => void;
  getFilteredHistory: () => PatrolPosition[];
  getGuardTrail: (guardId: number, dateRange?: { start: string; end: string }) => GuardTrail;
  getAllGuardTrails: (dateRange?: { start: string; end: string }) => GuardTrail[];
  
  // Playback controls
  startPlayback: (trail: GuardTrail) => void;
  pausePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackIndex: (index: number) => void;
  
  // Route management
  addPatrolRoute: (route: Omit<PatrolRoute, 'id'>) => void;
  updatePatrolRoute: (id: string, updates: Partial<PatrolRoute>) => void;
  deletePatrolRoute: (id: string) => void;
  
  // Analytics
  getPatrolCompliance: (guardId?: number) => number;
  getCoverageHeatmap: () => Array<{ lat: number; lng: number; intensity: number }>;
  
  // Mock API simulation
  mockApiDelay: (operation: string) => Promise<void>;
  simulateRealTimePatrol: () => void;
}

// Mock patrol routes
const mockPatrolRoutes: PatrolRoute[] = [
  {
    id: 'route-001',
    name: 'Morning Routine',
    checkPoints: ['CP-001', 'CP-002', 'CP-007'],
    estimatedDuration: 45,
    frequency: 'every-2-hours',
    building: 'building-a',
    isActive: true
  },
  {
    id: 'route-002',
    name: 'Operations Patrol',
    checkPoints: ['CP-101', 'CP-102'],
    estimatedDuration: 30,
    frequency: 'hourly',
    building: 'building-b',
    isActive: true
  },
  {
    id: 'route-003',
    name: 'Parking Sweep',
    checkPoints: ['CP-201'],
    estimatedDuration: 20,
    frequency: 'every-2-hours',
    building: 'parking-main',
    isActive: true
  }
];

export const useMockPatrolStore = create<MockPatrolState>()(
  persist(
    (set, get) => ({
      patrolHistory: mockPatrolData as PatrolPosition[],
      patrolRoutes: mockPatrolRoutes,
      selectedGuardTrail: null,
      filters: {},
      playbackState: {
        isPlaying: false,
        currentIndex: 0,
        speed: 1,
        selectedTrail: null
      },
      isLoading: false,
      lastUpdate: new Date(),

      setPatrolHistory: (history) => set({ patrolHistory: history, lastUpdate: new Date() }),

      addPatrolPosition: async (positionData) => {
        await get().mockApiDelay('create');
        
        const newPosition: PatrolPosition = {
          ...positionData,
          id: `patrol-${Date.now()}`,
        };

        set((state) => ({
          patrolHistory: [...state.patrolHistory, newPosition].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
          lastUpdate: new Date()
        }));
      },

      updatePatrolPosition: async (id, updates) => {
        await get().mockApiDelay('update');
        
        set((state) => ({
          patrolHistory: state.patrolHistory.map((position) =>
            position.id === id ? { ...position, ...updates } : position
          ),
          lastUpdate: new Date()
        }));
      },

      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),

      getFilteredHistory: () => {
        const { patrolHistory, filters } = get();
        let filtered = [...patrolHistory];

        if (filters.guardId) {
          filtered = filtered.filter(p => p.guardId === filters.guardId);
        }

        if (filters.building) {
          filtered = filtered.filter(p => p.position.building === filters.building);
        }

        if (filters.route) {
          filtered = filtered.filter(p => p.patrolRoute === filters.route);
        }

        if (filters.status) {
          filtered = filtered.filter(p => p.status === filters.status);
        }

        if (filters.dateRange) {
          const { start, end } = filters.dateRange;
          filtered = filtered.filter(p => {
            const timestamp = new Date(p.timestamp);
            return timestamp >= new Date(start) && timestamp <= new Date(end);
          });
        }

        return filtered;
      },

      getGuardTrail: (guardId, dateRange) => {
        const { patrolHistory } = get();
        let positions = patrolHistory.filter(p => p.guardId === guardId);

        if (dateRange) {
          positions = positions.filter(p => {
            const timestamp = new Date(p.timestamp);
            return timestamp >= new Date(dateRange.start) && timestamp <= new Date(dateRange.end);
          });
        }

        if (positions.length === 0) {
          return {
            guardId,
            guardName: `Guard ${guardId}`,
            positions: [],
            startTime: '',
            endTime: '',
            totalDistance: 0,
            checkPointsCompleted: 0,
            checkPointsMissed: 0,
            complianceScore: 0
          };
        }

        const sortedPositions = positions.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate total distance (simplified)
        let totalDistance = 0;
        for (let i = 1; i < sortedPositions.length; i++) {
          const prev = sortedPositions[i - 1];
          const curr = sortedPositions[i];
          
          // Haversine formula (simplified for demo)
          const lat1 = prev.position.latitude * Math.PI / 180;
          const lat2 = curr.position.latitude * Math.PI / 180;
          const deltaLat = (curr.position.latitude - prev.position.latitude) * Math.PI / 180;
          const deltaLon = (curr.position.longitude - prev.position.longitude) * Math.PI / 180;

          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = 6371000 * c; // Earth's radius in meters

          totalDistance += distance;
        }

        const checkPointsCompleted = positions.filter(p => p.status === 'checked').length;
        const checkPointsMissed = positions.filter(p => p.status === 'missed').length;
        const totalCheckPoints = checkPointsCompleted + checkPointsMissed;
        const complianceScore = totalCheckPoints > 0 ? (checkPointsCompleted / totalCheckPoints) * 100 : 100;

        return {
          guardId,
          guardName: sortedPositions[0].guardName,
          positions: sortedPositions,
          startTime: sortedPositions[0].timestamp,
          endTime: sortedPositions[sortedPositions.length - 1].timestamp,
          totalDistance: Math.round(totalDistance),
          checkPointsCompleted,
          checkPointsMissed,
          complianceScore: Math.round(complianceScore * 10) / 10
        };
      },

      getAllGuardTrails: (dateRange) => {
        const { patrolHistory } = get();
        const guardIds = [...new Set(patrolHistory.map(p => p.guardId))];
        
        return guardIds.map(guardId => get().getGuardTrail(guardId, dateRange));
      },

      startPlayback: (trail) => {
        set({
          playbackState: {
            isPlaying: true,
            currentIndex: 0,
            speed: 1,
            selectedTrail: trail
          }
        });

        // Start playback interval
        const interval = setInterval(() => {
          const state = get().playbackState;
          if (!state.isPlaying || !state.selectedTrail) {
            clearInterval(interval);
            return;
          }

          const nextIndex = state.currentIndex + 1;
          if (nextIndex >= state.selectedTrail.positions.length) {
            set({ playbackState: { ...state, isPlaying: false } });
            clearInterval(interval);
            return;
          }

          set({ 
            playbackState: { ...state, currentIndex: nextIndex }
          });
        }, 1000 / get().playbackState.speed);
      },

      pausePlayback: () => {
        set((state) => ({
          playbackState: { ...state.playbackState, isPlaying: false }
        }));
      },

      setPlaybackSpeed: (speed) => {
        set((state) => ({
          playbackState: { ...state.playbackState, speed }
        }));
      },

      setPlaybackIndex: (index) => {
        set((state) => ({
          playbackState: { ...state.playbackState, currentIndex: index }
        }));
      },

      addPatrolRoute: async (routeData) => {
        await get().mockApiDelay('create');
        
        const newRoute: PatrolRoute = {
          ...routeData,
          id: `route-${Date.now()}`,
        };

        set((state) => ({
          patrolRoutes: [...state.patrolRoutes, newRoute],
          lastUpdate: new Date()
        }));
      },

      updatePatrolRoute: async (id, updates) => {
        await get().mockApiDelay('update');
        
        set((state) => ({
          patrolRoutes: state.patrolRoutes.map((route) =>
            route.id === id ? { ...route, ...updates } : route
          ),
          lastUpdate: new Date()
        }));
      },

      deletePatrolRoute: async (id) => {
        await get().mockApiDelay('delete');
        
        set((state) => ({
          patrolRoutes: state.patrolRoutes.filter(route => route.id !== id),
          lastUpdate: new Date()
        }));
      },

      getPatrolCompliance: (guardId) => {
        const trails = guardId 
          ? [get().getGuardTrail(guardId)]
          : get().getAllGuardTrails();
        
        if (trails.length === 0) return 0;
        
        const avgCompliance = trails.reduce((sum, trail) => sum + trail.complianceScore, 0) / trails.length;
        return Math.round(avgCompliance * 10) / 10;
      },

      getCoverageHeatmap: () => {
        const { patrolHistory } = get();
        const heatmapData: { [key: string]: { lat: number; lng: number; count: number } } = {};

        patrolHistory.forEach(position => {
          const key = `${position.position.latitude.toFixed(4)},${position.position.longitude.toFixed(4)}`;
          if (heatmapData[key]) {
            heatmapData[key].count++;
          } else {
            heatmapData[key] = {
              lat: position.position.latitude,
              lng: position.position.longitude,
              count: 1
            };
          }
        });

        const maxCount = Math.max(...Object.values(heatmapData).map(d => d.count));
        
        return Object.values(heatmapData).map(point => ({
          lat: point.lat,
          lng: point.lng,
          intensity: point.count / maxCount
        }));
      },

      simulateRealTimePatrol: () => {
        // Simulate new patrol positions every 30 seconds
        setInterval(() => {
          const guards = [1, 2, 3, 4];
          const randomGuard = guards[Math.floor(Math.random() * guards.length)];
          
          // Get last position for this guard
          const { patrolHistory } = get();
          const lastPosition = patrolHistory
            .filter(p => p.guardId === randomGuard)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          if (lastPosition) {
            // Simulate movement (small random offset)
            const newPosition = {
              guardId: randomGuard,
              guardName: lastPosition.guardName,
              timestamp: new Date().toISOString(),
              position: {
                latitude: lastPosition.position.latitude + (Math.random() - 0.5) * 0.0001,
                longitude: lastPosition.position.longitude + (Math.random() - 0.5) * 0.0001,
                floor: lastPosition.position.floor,
                building: lastPosition.position.building,
                accuracy: Math.floor(Math.random() * 5) + 2
              },
              checkPoint: null,
              checkPointName: null,
              status: 'patrolling' as const,
              notes: 'Routine patrol movement',
              patrolRoute: lastPosition.patrolRoute,
              shiftStart: lastPosition.shiftStart
            };

            get().addPatrolPosition(newPosition);
          }
        }, 30000);
      },

      mockApiDelay: async (operation: string) => {
        set({ isLoading: true });
        
        const delays = {
          'create': 600,
          'update': 400,
          'delete': 300,
          'fetch': 500
        };

        const delay = delays[operation as keyof typeof delays] || 400;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'mock-patrol-store',
      partialize: (state) => ({ 
        patrolHistory: state.patrolHistory,
        patrolRoutes: state.patrolRoutes,
        filters: state.filters,
        lastUpdate: state.lastUpdate
      }),
    }
  )
);

// Initialize real-time simulation
let patrolSimulationStarted = false;
export const initializePatrolSimulation = () => {
  if (!patrolSimulationStarted) {
    useMockPatrolStore.getState().simulateRealTimePatrol();
    patrolSimulationStarted = true;
  }
};