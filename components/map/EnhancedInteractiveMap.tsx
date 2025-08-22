import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Navigation, 
  MapPin, 
  Shield,
  Building,
  Home,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Map,
  Grid3X3,
  ArrowLeft,
  Settings,
  Layers,
  Filter,
  Play,
  Pause
} from 'lucide-react';
import { LayerControls, LayerVisibility, AssetTypeFilter } from './controls/LayerControls';
import { AssetLayer } from './layers/AssetLayer';
import { GuardTrailLayer } from './layers/GuardTrailLayer';
import { useMockAssetStore, Asset } from '../../stores/mock/useMockAssetStore';
import { useMockPatrolStore, PatrolPosition } from '../../stores/mock/useMockPatrolStore';

// Lazy load the LeafletCampusMap component
const LeafletCampusMap = lazy(() => import('../LeafletCampusMap'));

// Enhanced navigation state with layer support
interface EnhancedNavigationState {
  level: 'sites' | 'buildings' | 'floors' | 'rooms' | 'assets';
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  showLayerControls: boolean;
  selectedAsset?: Asset;
  selectedGuardTrail?: number;
}

interface EnhancedInteractiveMapProps {
  onZoneClick?: (building: string, zone: any) => void;
  onGuardClick?: (guardName: string) => void;
  className?: string;
  // Activity-based filtering
  activityFilter?: {
    location?: string;
    building?: string;
    floor?: string;
    zone?: string;
  };
}

export function EnhancedInteractiveMap({ 
  onZoneClick, 
  onGuardClick,
  className = '',
  activityFilter
}: EnhancedInteractiveMapProps) {
  const [navigation, setNavigation] = useState<EnhancedNavigationState>({
    level: 'sites',
    showLayerControls: false
  });
  
  const [zoom, setZoom] = useState(5);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  
  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    assets: true,
    guards: true,
    guardTrails: false,
    heatmap: false,
    incidents: true,
    zones: false
  });

  // Asset type filters
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>({
    camera: true,
    door: true,
    sensor: true,
    alarm: true,
    access_point: true
  });

  // Time range for historical data
  const [timeRange, setTimeRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
    end: new Date().toISOString()
  });

  // Mock stores
  const { selectedAsset, setSelectedAsset } = useMockAssetStore();
  const { playbackState } = useMockPatrolStore();

  // Auto-focus map on activity location when filter is applied
  useEffect(() => {
    if (activityFilter?.location) {
      console.log('Map auto-focusing on activity location:', activityFilter.location);
      // In a real implementation, this would center the map view on the activity's coordinates
      // For now, we just log the action
    }
  }, [activityFilter]);

  const handleLayerToggle = (layer: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleAssetTypeToggle = (type: keyof AssetTypeFilter) => {
    setAssetTypeFilter(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleToggleAllLayers = (visible: boolean) => {
    setLayerVisibility(prev => 
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: visible
      }), {} as LayerVisibility)
    );
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setNavigation(prev => ({ ...prev, selectedAsset: asset }));
  };

  const handlePatrolPositionClick = (position: PatrolPosition) => {
    console.log('Patrol position clicked:', position);
    // Could open a detail panel or navigate to guard info
  };

  const handleGuardMarkerClick = (guardId: string) => {
    const numericGuardId = parseInt(guardId);
    setNavigation(prev => ({ ...prev, selectedGuardTrail: numericGuardId }));
    if (onGuardClick) {
      onGuardClick(`Guard ${guardId}`);
    }
  };

  const handleBuildingClick = (buildingId: string) => {
    console.log('Building clicked:', buildingId);
    // Could navigate to building detail or filter assets by building
  };

  // Apply activity-based filtering to data
  const getFilteredData = () => {
    if (!activityFilter) return { assets: [], guards: [], incidents: [] };
    
    // In a real implementation, this would query the backend for:
    // 1. Assets in the same building/zone as the activity
    // 2. Guards currently assigned to or near the activity location
    // 3. Related incidents within a time/location radius
    
    console.log('Applying contextual filters for activity location:', {
      location: activityFilter.location,
      building: activityFilter.building,
      floor: activityFilter.floor,
      zone: activityFilter.zone
    });
    
    return {
      assets: [], // Would contain filtered assets
      guards: [], // Would contain relevant guard positions
      incidents: [] // Would contain related incidents
    };
  };

  const toggleLayerControls = () => {
    setNavigation(prev => ({ 
      ...prev, 
      showLayerControls: !prev.showLayerControls 
    }));
  };

  const filteredAssetTypes = Object.entries(assetTypeFilter)
    .filter(([_, visible]) => visible)
    .map(([type, _]) => type);

  return (
    <div className={`h-full flex flex-col bg-white relative ${className}`}>
      {/* Enhanced Header with Layer Controls */}
      <div className="p-4 border-b space-y-4 bg-white z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-blue-50 border-blue-200">
              <Map className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                Enhanced Security Map
              </span>
            </div>
            
            {selectedAsset && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedAsset.name}
              </Badge>
            )}

            {activityFilter && (
              <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
                <Filter className="h-3 w-3" />
                Filtered: {activityFilter.location}
              </Badge>
            )}

            {navigation.selectedGuardTrail && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Guard {navigation.selectedGuardTrail}
              </Badge>
            )}

            {playbackState.isPlaying && (
              <Badge variant="default" className="flex items-center gap-1 animate-pulse">
                <Play className="h-3 w-3" />
                Playback Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Layer Controls Toggle */}
            <Button
              variant={navigation.showLayerControls ? "default" : "outline"}
              size="sm"
              onClick={toggleLayerControls}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Layers
            </Button>

            {/* Asset Filter Indicator */}
            {layerVisibility.assets && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {filteredAssetTypes.length}/{Object.keys(assetTypeFilter).length}
              </Button>
            )}
            
            {/* Zoom Controls */}
            <div className="flex items-center border rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom(prev => Math.max(1, prev - 1))}
                className="border-r rounded-r-none"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1 text-sm font-medium bg-gray-50 border-r">
                {zoom}x
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom(prev => Math.min(10, prev + 1))}
                className="rounded-l-none"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Layer Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(layerVisibility).map(([layer, visible]) => 
            visible && (
              <Badge 
                key={layer} 
                variant="outline" 
                className="text-xs capitalize"
              >
                {layer.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            )
          )}
        </div>

        <Separator />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Layer Controls Panel */}
        {navigation.showLayerControls && (
          <div className="absolute top-4 left-4 z-20">
            <LayerControls
              layerVisibility={layerVisibility}
              assetTypeFilter={assetTypeFilter}
              onLayerToggle={handleLayerToggle}
              onAssetTypeToggle={handleAssetTypeToggle}
              onToggleAll={handleToggleAllLayers}
            />
          </div>
        )}

        {/* Map Container */}
        <div className="h-full w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-muted-foreground">Loading enhanced map...</p>
              </div>
            </div>
          }>
            <LeafletCampusMap 
              onGuardClick={handleGuardMarkerClick}
              onBuildingClick={handleBuildingClick}
              className="h-full w-full"
            >
              {/* Asset Layer */}
              <AssetLayer
                visible={layerVisibility.assets}
                onAssetClick={handleAssetClick}
                buildingFilter={activityFilter?.building || navigation.buildingId}
                statusFilter={undefined}
                activityFilter={activityFilter}
              />

              {/* Guard Trail Layer */}
              <GuardTrailLayer
                visible={layerVisibility.guardTrails}
                selectedGuardId={navigation.selectedGuardTrail}
                timeRange={timeRange}
                onPositionClick={handlePatrolPositionClick}
                activityFilter={activityFilter}
              />

              {/* Future layers can be added here */}
              {/* <HeatmapLayer visible={layerVisibility.heatmap} /> */}
              {/* <IncidentLayer visible={layerVisibility.incidents} /> */}
              {/* <ZoneLayer visible={layerVisibility.zones} /> */}
            </LeafletCampusMap>
          </Suspense>
        </div>

        {/* Selected Asset Details Panel */}
        {selectedAsset && (
          <div className="absolute bottom-4 right-4 z-20">
            <Card className="w-80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedAsset.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAsset(null)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAsset.type.replace('_', ' ').toUpperCase()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={selectedAsset.status === 'online' ? 'default' : 'destructive'}>
                      {selectedAsset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{selectedAsset.performance.uptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{selectedAsset.location.zone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Playback Controls (when active) */}
        {playbackState.isPlaying && playbackState.selectedTrail && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {playbackState.selectedTrail.guardName}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {playbackState.currentIndex + 1} / {playbackState.selectedTrail.positions.length}
                </div>
                <div className="text-sm">
                  {playbackState.speed}x speed
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedInteractiveMap;