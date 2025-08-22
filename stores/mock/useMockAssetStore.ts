import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import mockAssetsData from '../../data/mock/mockAssets.json';

export interface Asset {
  id: string;
  name: string;
  type: 'camera' | 'door' | 'sensor' | 'alarm' | 'access_point';
  status: 'online' | 'offline' | 'alert' | 'maintenance';
  location: {
    latitude: number;
    longitude: number;
    floor: number;
    building: string;
    room: string;
    zone: string;
  };
  metadata: {
    installationDate: string;
    lastMaintenance: string;
    firmwareVersion: string;
    manufacturer: string;
    model: string;
    [key: string]: any;
  };
  performance: {
    uptime: number;
    lastStatusChange: string;
    avgResponseTime: number;
    errorCount: number;
  };
}

interface AssetFilters {
  type?: Asset['type'];
  status?: Asset['status'];
  building?: string;
  zone?: string;
  searchTerm?: string;
}

interface MockAssetState {
  assets: Asset[];
  selectedAsset: Asset | null;
  filters: AssetFilters;
  isLoading: boolean;
  lastUpdate: Date | null;

  // Actions
  setAssets: (assets: Asset[]) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  updateAssetStatus: (assetId: string, status: Asset['status']) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setFilters: (filters: Partial<AssetFilters>) => void;
  getAssetById: (assetId: string) => Asset | undefined;
  getAssetsByType: (type: Asset['type']) => Asset[];
  getAssetsByStatus: (status: Asset['status']) => Asset[];
  getAssetsByBuilding: (building: string) => Asset[];
  getFilteredAssets: () => Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  removeAsset: (assetId: string) => void;
  
  // Mock API simulation
  simulateStatusChanges: () => void;
  mockApiDelay: (operation: string) => Promise<void>;
}

export const useMockAssetStore = create<MockAssetState>()(
  persist(
    (set, get) => ({
      assets: mockAssetsData as Asset[],
      selectedAsset: null,
      filters: {},
      isLoading: false,
      lastUpdate: new Date(),

      setAssets: (assets) => set({ assets, lastUpdate: new Date() }),

      updateAsset: async (assetId, updates) => {
        await get().mockApiDelay('update');
        
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === assetId 
              ? { 
                  ...asset, 
                  ...updates,
                  performance: {
                    ...asset.performance,
                    lastStatusChange: new Date().toISOString()
                  }
                }
              : asset
          ),
          lastUpdate: new Date()
        }));
      },

      updateAssetStatus: async (assetId, status) => {
        await get().mockApiDelay('status-update');
        
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === assetId 
              ? { 
                  ...asset, 
                  status,
                  performance: {
                    ...asset.performance,
                    lastStatusChange: new Date().toISOString()
                  }
                }
              : asset
          ),
          lastUpdate: new Date()
        }));
      },

      setSelectedAsset: (asset) => set({ selectedAsset: asset }),

      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),

      getAssetById: (assetId) => {
        return get().assets.find(asset => asset.id === assetId);
      },

      getAssetsByType: (type) => {
        return get().assets.filter(asset => asset.type === type);
      },

      getAssetsByStatus: (status) => {
        return get().assets.filter(asset => asset.status === status);
      },

      getAssetsByBuilding: (building) => {
        return get().assets.filter(asset => asset.location.building === building);
      },

      getFilteredAssets: () => {
        const { assets, filters } = get();
        let filteredAssets = [...assets];

        if (filters.type) {
          filteredAssets = filteredAssets.filter(asset => asset.type === filters.type);
        }

        if (filters.status) {
          filteredAssets = filteredAssets.filter(asset => asset.status === filters.status);
        }

        if (filters.building) {
          filteredAssets = filteredAssets.filter(asset => asset.location.building === filters.building);
        }

        if (filters.zone) {
          filteredAssets = filteredAssets.filter(asset => asset.location.zone === filters.zone);
        }

        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filteredAssets = filteredAssets.filter(asset => 
            asset.name.toLowerCase().includes(term) ||
            asset.id.toLowerCase().includes(term) ||
            asset.metadata.manufacturer.toLowerCase().includes(term)
          );
        }

        return filteredAssets;
      },

      addAsset: async (assetData) => {
        await get().mockApiDelay('create');
        
        const newAsset: Asset = {
          ...assetData,
          id: `asset-${Date.now()}`,
        };

        set((state) => ({
          assets: [...state.assets, newAsset],
          lastUpdate: new Date()
        }));
      },

      removeAsset: async (assetId) => {
        await get().mockApiDelay('delete');
        
        set((state) => ({
          assets: state.assets.filter(asset => asset.id !== assetId),
          selectedAsset: state.selectedAsset?.id === assetId ? null : state.selectedAsset,
          lastUpdate: new Date()
        }));
      },

      simulateStatusChanges: () => {
        // Simulate real-time status changes every 10 seconds
        setInterval(() => {
          const assets = get().assets;
          if (assets.length === 0) return;

          const randomAsset = assets[Math.floor(Math.random() * assets.length)];
          const statuses: Asset['status'][] = ['online', 'offline', 'alert', 'maintenance'];
          const currentStatus = randomAsset.status;
          const newStatuses = statuses.filter(s => s !== currentStatus);
          const newStatus = newStatuses[Math.floor(Math.random() * newStatuses.length)];

          // 80% chance to stay online, 20% chance to change status
          if (Math.random() > 0.8) {
            get().updateAssetStatus(randomAsset.id, newStatus);
          }
        }, 10000);
      },

      mockApiDelay: async (operation: string) => {
        set({ isLoading: true });
        
        // Simulate different API response times
        const delays = {
          'create': 800,
          'update': 500,
          'delete': 300,
          'status-update': 200,
          'fetch': 400
        };

        const delay = delays[operation as keyof typeof delays] || 500;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'mock-asset-store',
      partialize: (state) => ({ 
        assets: state.assets,
        filters: state.filters,
        lastUpdate: state.lastUpdate
      }),
    }
  )
);

// Initialize status simulation when store is first used
let simulationStarted = false;
export const initializeAssetSimulation = () => {
  if (!simulationStarted) {
    useMockAssetStore.getState().simulateStatusChanges();
    simulationStarted = true;
  }
};