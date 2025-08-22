import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { 
  Layers,
  Camera,
  DoorOpen,
  Zap,
  AlertTriangle,
  Wifi,
  Shield,
  Activity,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';

export interface LayerVisibility {
  assets: boolean;
  guards: boolean;
  guardTrails: boolean;
  heatmap: boolean;
  incidents: boolean;
  zones: boolean;
}

export interface AssetTypeFilter {
  camera: boolean;
  door: boolean;
  sensor: boolean;
  alarm: boolean;
  access_point: boolean;
}

interface LayerControlsProps {
  layerVisibility: LayerVisibility;
  assetTypeFilter: AssetTypeFilter;
  onLayerToggle: (layer: keyof LayerVisibility) => void;
  onAssetTypeToggle: (type: keyof AssetTypeFilter) => void;
  onToggleAll: (visible: boolean) => void;
  className?: string;
}

const layerConfig = [
  {
    key: 'assets' as keyof LayerVisibility,
    label: 'Assets',
    icon: MapPin,
    description: 'Security equipment and devices',
    color: 'text-blue-600'
  },
  {
    key: 'guards' as keyof LayerVisibility,
    label: 'Guards',
    icon: Shield,
    description: 'Current guard positions',
    color: 'text-green-600'
  },
  {
    key: 'guardTrails' as keyof LayerVisibility,
    label: 'Guard Trails',
    icon: Activity,
    description: 'Historical patrol routes',
    color: 'text-purple-600'
  },
  {
    key: 'heatmap' as keyof LayerVisibility,
    label: 'Coverage Heatmap',
    icon: Activity,
    description: 'Patrol coverage analysis',
    color: 'text-red-600'
  },
  {
    key: 'incidents' as keyof LayerVisibility,
    label: 'Incidents',
    icon: AlertTriangle,
    description: 'Security incidents and alerts',
    color: 'text-orange-600'
  },
  {
    key: 'zones' as keyof LayerVisibility,
    label: 'Security Zones',
    icon: Layers,
    description: 'Zone boundaries and areas',
    color: 'text-gray-600'
  }
];

const assetTypeConfig = [
  {
    key: 'camera' as keyof AssetTypeFilter,
    label: 'Cameras',
    icon: Camera,
    color: 'text-blue-600'
  },
  {
    key: 'door' as keyof AssetTypeFilter,
    label: 'Doors',
    icon: DoorOpen,
    color: 'text-green-600'
  },
  {
    key: 'sensor' as keyof AssetTypeFilter,
    label: 'Sensors',
    icon: Zap,
    color: 'text-yellow-600'
  },
  {
    key: 'alarm' as keyof AssetTypeFilter,
    label: 'Alarms',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  {
    key: 'access_point' as keyof AssetTypeFilter,
    label: 'Access Points',
    icon: Wifi,
    color: 'text-purple-600'
  }
];

export const LayerControls: React.FC<LayerControlsProps> = ({
  layerVisibility,
  assetTypeFilter,
  onLayerToggle,
  onAssetTypeToggle,
  onToggleAll,
  className = ''
}) => {
  const visibleLayersCount = Object.values(layerVisibility).filter(Boolean).length;
  const totalLayers = Object.keys(layerVisibility).length;
  const allVisible = visibleLayersCount === totalLayers;
  const noneVisible = visibleLayersCount === 0;

  const visibleAssetTypesCount = Object.values(assetTypeFilter).filter(Boolean).length;
  const totalAssetTypes = Object.keys(assetTypeFilter).length;

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Map Layers</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {visibleLayersCount}/{totalLayers}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={allVisible ? "default" : "outline"}
            onClick={() => onToggleAll(true)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Show All
          </Button>
          <Button
            size="sm"
            variant={noneVisible ? "default" : "outline"}
            onClick={() => onToggleAll(false)}
            className="flex-1 text-xs"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Hide All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Layer Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Map Layers</h4>
          {layerConfig.map((layer) => {
            const Icon = layer.icon;
            const isVisible = layerVisibility[layer.key];
            
            return (
              <div
                key={layer.key}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`h-4 w-4 ${layer.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{layer.label}</span>
                      {isVisible && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          ON
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => onLayerToggle(layer.key)}
                  className="ml-2"
                />
              </div>
            );
          })}
        </div>

        {/* Asset Type Filters */}
        {layerVisibility.assets && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Asset Types</h4>
              <Badge variant="outline" className="text-xs">
                {visibleAssetTypesCount}/{totalAssetTypes}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {assetTypeConfig.map((assetType) => {
                const Icon = assetType.icon;
                const isVisible = assetTypeFilter[assetType.key];
                
                return (
                  <div
                    key={assetType.key}
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                      isVisible 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onAssetTypeToggle(assetType.key)}
                  >
                    <Icon className={`h-3 w-3 ${assetType.color}`} />
                    <span className="text-xs font-medium flex-1">
                      {assetType.label}
                    </span>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => onAssetTypeToggle(assetType.key)}
                      size="sm"
                      className="scale-75"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Layer Statistics */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{visibleLayersCount}</div>
              <div className="text-muted-foreground">Active Layers</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{visibleAssetTypesCount}</div>
              <div className="text-muted-foreground">Asset Types</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};