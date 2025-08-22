import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import mockAnalyticsData from '../../data/mock/mockAnalytics.json';

export interface CoverageAnalytics {
  dailyCoverage: {
    date: string;
    totalPatrolTime: number;
    coveredAreas: number;
    missedCheckpoints: number;
    complianceRate: number;
    zones: Array<{
      zoneId: string;
      coverage: number;
      patrolCount: number;
      avgResponseTime: number;
      incidents: number;
    }>;
  };
  heatmapData: Array<{
    latitude: number;
    longitude: number;
    intensity: number;
    visits: number;
    avgDwellTime: number;
  }>;
}

export interface AssetPerformance {
  overallUptime: number;
  byType: {
    [key: string]: {
      uptime: number;
      totalAssets: number;
      onlineCount: number;
      alertCount: number;
      offlineCount: number;
    };
  };
  trends: Array<{
    date: string;
    uptime: number;
  }>;
}

export interface PatrolCompliance {
  overallScore: number;
  guards: Array<{
    guardId: number;
    guardName: string;
    complianceScore: number;
    completedRoutes: number;
    missedCheckpoints: number;
    avgPatrolTime: number;
    incidents: number;
  }>;
}

export interface IncidentCorrelation {
  incidentId: string;
  timestamp: string;
  type: string;
  location: {
    building: string;
    floor: number;
    zone: string;
  };
  guardPresent: boolean;
  guardId: number | null;
  guardDistance: number | null;
  responseTime: number;
  assetInvolved: string;
  resolved: boolean;
}

interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  building?: string;
  zone?: string;
  guardId?: number;
  assetType?: string;
}

interface MockAnalyticsState {
  coverageAnalytics: CoverageAnalytics;
  assetPerformance: AssetPerformance;
  patrolCompliance: PatrolCompliance;
  incidentCorrelation: IncidentCorrelation[];
  filters: AnalyticsFilters;
  selectedMetric: string | null;
  isLoading: boolean;
  lastUpdate: Date | null;

  // Actions
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  setSelectedMetric: (metric: string | null) => void;
  refreshAnalytics: () => Promise<void>;
  
  // Data retrieval
  getCoverageByZone: (zoneId?: string) => number;
  getAssetUptimeByType: (type?: string) => number;
  getGuardPerformance: (guardId?: number) => PatrolCompliance['guards'][0] | null;
  getIncidentsByTimeRange: (start: string, end: string) => IncidentCorrelation[];
  
  // Chart data generators
  generateCoverageHeatmap: () => Array<{ lat: number; lng: number; intensity: number }>;
  generateUptimeTrend: (days?: number) => Array<{ date: string; uptime: number }>;
  generateComplianceChart: () => Array<{ guardName: string; score: number }>;
  generateIncidentTimeline: () => Array<{ time: string; count: number }>;
  
  // Export functions
  exportToPDF: (reportType: string) => Promise<void>;
  exportToCSV: (dataType: string) => Promise<void>;
  
  // Mock API simulation
  mockApiDelay: (operation: string) => Promise<void>;
  simulateDataUpdates: () => void;
}

export const useMockAnalyticsStore = create<MockAnalyticsState>()(
  persist(
    (set, get) => ({
      coverageAnalytics: mockAnalyticsData.coverageAnalytics as CoverageAnalytics,
      assetPerformance: mockAnalyticsData.assetPerformance as AssetPerformance,
      patrolCompliance: mockAnalyticsData.patrolCompliance as PatrolCompliance,
      incidentCorrelation: mockAnalyticsData.incidentCorrelation as IncidentCorrelation[],
      filters: {},
      selectedMetric: null,
      isLoading: false,
      lastUpdate: new Date(),

      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),

      setSelectedMetric: (metric) => set({ selectedMetric: metric }),

      refreshAnalytics: async () => {
        await get().mockApiDelay('refresh');
        
        // Simulate updated data with slight variations
        const state = get();
        const updatedCoverage = {
          ...state.coverageAnalytics,
          dailyCoverage: {
            ...state.coverageAnalytics.dailyCoverage,
            complianceRate: Math.max(85, Math.min(98, 
              state.coverageAnalytics.dailyCoverage.complianceRate + (Math.random() - 0.5) * 2
            ))
          }
        };

        const updatedAssetPerformance = {
          ...state.assetPerformance,
          overallUptime: Math.max(90, Math.min(99, 
            state.assetPerformance.overallUptime + (Math.random() - 0.5) * 1
          ))
        };

        set({
          coverageAnalytics: updatedCoverage,
          assetPerformance: updatedAssetPerformance,
          lastUpdate: new Date()
        });
      },

      getCoverageByZone: (zoneId) => {
        const { coverageAnalytics } = get();
        
        if (zoneId) {
          const zone = coverageAnalytics.dailyCoverage.zones.find(z => z.zoneId === zoneId);
          return zone ? zone.coverage : 0;
        }
        
        return coverageAnalytics.dailyCoverage.complianceRate;
      },

      getAssetUptimeByType: (type) => {
        const { assetPerformance } = get();
        
        if (type && assetPerformance.byType[type]) {
          return assetPerformance.byType[type].uptime;
        }
        
        return assetPerformance.overallUptime;
      },

      getGuardPerformance: (guardId) => {
        const { patrolCompliance } = get();
        
        if (guardId) {
          return patrolCompliance.guards.find(g => g.guardId === guardId) || null;
        }
        
        return null;
      },

      getIncidentsByTimeRange: (start, end) => {
        const { incidentCorrelation } = get();
        
        return incidentCorrelation.filter(incident => {
          const incidentTime = new Date(incident.timestamp);
          return incidentTime >= new Date(start) && incidentTime <= new Date(end);
        });
      },

      generateCoverageHeatmap: () => {
        const { coverageAnalytics } = get();
        return coverageAnalytics.heatmapData.map(point => ({
          lat: point.latitude,
          lng: point.longitude,
          intensity: point.intensity
        }));
      },

      generateUptimeTrend: (days = 7) => {
        const { assetPerformance } = get();
        return assetPerformance.trends.slice(-days);
      },

      generateComplianceChart: () => {
        const { patrolCompliance } = get();
        return patrolCompliance.guards.map(guard => ({
          guardName: guard.guardName,
          score: guard.complianceScore
        }));
      },

      generateIncidentTimeline: () => {
        const { incidentCorrelation } = get();
        
        // Group incidents by hour
        const hourlyIncidents: { [key: string]: number } = {};
        
        incidentCorrelation.forEach(incident => {
          const hour = new Date(incident.timestamp).getHours();
          const timeKey = `${hour.toString().padStart(2, '0')}:00`;
          hourlyIncidents[timeKey] = (hourlyIncidents[timeKey] || 0) + 1;
        });

        return Object.entries(hourlyIncidents).map(([time, count]) => ({
          time,
          count
        })).sort((a, b) => a.time.localeCompare(b.time));
      },

      exportToPDF: async (reportType) => {
        await get().mockApiDelay('export');
        
        // Simulate PDF generation
        console.log(`Generating PDF report for: ${reportType}`);
        
        // In a real implementation, this would generate and download a PDF
        const blob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      exportToCSV: async (dataType) => {
        await get().mockApiDelay('export');
        
        const state = get();
        let csvContent = '';
        let filename = '';

        switch (dataType) {
          case 'coverage':
            csvContent = 'Zone,Coverage,Patrol Count,Avg Response Time,Incidents\\n' +
              state.coverageAnalytics.dailyCoverage.zones.map(zone =>
                `${zone.zoneId},${zone.coverage},${zone.patrolCount},${zone.avgResponseTime},${zone.incidents}`
              ).join('\\n');
            filename = 'coverage-analytics';
            break;
            
          case 'compliance':
            csvContent = 'Guard Name,Compliance Score,Completed Routes,Missed Checkpoints,Avg Patrol Time,Incidents\\n' +
              state.patrolCompliance.guards.map(guard =>
                `${guard.guardName},${guard.complianceScore},${guard.completedRoutes},${guard.missedCheckpoints},${guard.avgPatrolTime},${guard.incidents}`
              ).join('\\n');
            filename = 'patrol-compliance';
            break;
            
          case 'incidents':
            csvContent = 'Incident ID,Timestamp,Type,Building,Floor,Zone,Guard Present,Response Time,Asset,Resolved\\n' +
              state.incidentCorrelation.map(incident =>
                `${incident.incidentId},${incident.timestamp},${incident.type},${incident.location.building},${incident.location.floor},${incident.location.zone},${incident.guardPresent},${incident.responseTime},${incident.assetInvolved},${incident.resolved}`
              ).join('\\n');
            filename = 'incident-correlation';
            break;
            
          default:
            csvContent = 'No data available for the selected type';
            filename = 'analytics-export';
        }

        // Create and download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      simulateDataUpdates: () => {
        // Simulate periodic data updates every 5 minutes
        setInterval(() => {
          const state = get();
          
          // Update coverage analytics with small variations
          const updatedZones = state.coverageAnalytics.dailyCoverage.zones.map(zone => ({
            ...zone,
            coverage: Math.max(80, Math.min(100, zone.coverage + (Math.random() - 0.5) * 1)),
            patrolCount: zone.patrolCount + Math.floor(Math.random() * 2)
          }));

          set({
            coverageAnalytics: {
              ...state.coverageAnalytics,
              dailyCoverage: {
                ...state.coverageAnalytics.dailyCoverage,
                zones: updatedZones,
                complianceRate: updatedZones.reduce((sum, zone) => sum + zone.coverage, 0) / updatedZones.length
              }
            },
            lastUpdate: new Date()
          });
        }, 300000); // 5 minutes
      },

      mockApiDelay: async (operation: string) => {
        set({ isLoading: true });
        
        const delays = {
          'refresh': 1000,
          'export': 2000,
          'calculate': 500
        };

        const delay = delays[operation as keyof typeof delays] || 500;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'mock-analytics-store',
      partialize: (state) => ({ 
        coverageAnalytics: state.coverageAnalytics,
        assetPerformance: state.assetPerformance,
        patrolCompliance: state.patrolCompliance,
        incidentCorrelation: state.incidentCorrelation,
        filters: state.filters,
        lastUpdate: state.lastUpdate
      }),
    }
  )
);

// Initialize data simulation
let analyticsSimulationStarted = false;
export const initializeAnalyticsSimulation = () => {
  if (!analyticsSimulationStarted) {
    useMockAnalyticsStore.getState().simulateDataUpdates();
    analyticsSimulationStarted = true;
  }
};