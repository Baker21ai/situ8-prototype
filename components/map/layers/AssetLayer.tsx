import React, { useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMockAssetStore, Asset, initializeAssetSimulation } from '../../../stores/mock/useMockAssetStore';
import { Camera, DoorOpen, Zap, AlertTriangle, Wifi, Settings } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

interface AssetLayerProps {
  visible: boolean;
  onAssetClick?: (asset: Asset) => void;
  buildingFilter?: string;
  statusFilter?: Asset['status'];
}

// Asset type to icon mapping
const getAssetIcon = (type: Asset['type']) => {
  switch (type) {
    case 'camera': return Camera;
    case 'door': return DoorOpen;
    case 'sensor': return Zap;
    case 'alarm': return AlertTriangle;
    case 'access_point': return Wifi;
    default: return Settings;
  }
};

// Status color mapping
const getStatusColor = (status: Asset['status']) => {
  switch (status) {
    case 'online': return '#10B981'; // Green
    case 'alert': return '#EF4444';  // Red
    case 'maintenance': return '#F59E0B'; // Yellow
    case 'offline': return '#6B7280'; // Gray
    default: return '#6B7280';
  }
};

// Create custom asset marker
const createAssetMarker = (asset: Asset) => {
  const IconComponent = getAssetIcon(asset.type);
  const color = getStatusColor(asset.status);
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          ${getIconSVG(asset.type)}
        </svg>
        ${asset.status === 'alert' ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background: #DC2626;
            border-radius: 50%;
            border: 1px solid white;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `,
    className: 'asset-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Get SVG path for each icon type
const getIconSVG = (type: Asset['type']) => {
  switch (type) {
    case 'camera':
      return '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z"></path><circle cx="12" cy="13" r="4"></circle>';
    case 'door':
      return '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M14 13h.01"></path>';
    case 'sensor':
      return '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>';
    case 'alarm':
      return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
    case 'access_point':
      return '<path d="M1 8.5c4.68-4.68 12.32-4.68 17 0"></path><path d="M5 12.5c2.28-2.28 5.72-2.28 8 0"></path><circle cx="12" cy="17" r="1"></circle>';
    default:
      return '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>';
  }
};

export const AssetLayer: React.FC<AssetLayerProps> = ({
  visible,
  onAssetClick,
  buildingFilter,
  statusFilter
}) => {
  const { 
    assets, 
    getFilteredAssets, 
    setFilters, 
    setSelectedAsset,
    updateAssetStatus 
  } = useMockAssetStore();

  // Initialize simulation on component mount
  useEffect(() => {
    initializeAssetSimulation();
  }, []);

  // Apply filters
  useEffect(() => {
    setFilters({
      building: buildingFilter,
      status: statusFilter
    });
  }, [buildingFilter, statusFilter, setFilters]);

  // Get filtered assets
  const filteredAssets = getFilteredAssets();

  if (!visible) return null;

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    onAssetClick?.(asset);
  };

  const handleStatusToggle = async (asset: Asset) => {
    const newStatus: Asset['status'] = asset.status === 'online' ? 'maintenance' : 'online';
    await updateAssetStatus(asset.id, newStatus);
  };

  return (
    <>
      {filteredAssets.map((asset) => (
        <Marker
          key={asset.id}
          position={[asset.location.latitude, asset.location.longitude]}
          icon={createAssetMarker(asset)}
          eventHandlers={{
            click: () => handleAssetClick(asset),
          }}
        >
          <Popup>
            <Card className="w-80 border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{asset.name}</CardTitle>
                  <Badge 
                    variant={asset.status === 'online' ? 'default' : 
                            asset.status === 'alert' ? 'destructive' : 
                            asset.status === 'maintenance' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {asset.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {asset.type.replace('_', ' ').toUpperCase()} • {asset.location.zone}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="text-muted-foreground">
                      {asset.location.building} • Floor {asset.location.floor}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Uptime:</span>
                    <p className="text-muted-foreground">
                      {asset.performance.uptime}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Manufacturer:</span>
                    <p className="text-muted-foreground">
                      {asset.metadata.manufacturer}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <p className="text-muted-foreground">
                      {asset.metadata.model}
                    </p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Last Maintenance:</span>
                  <p className="text-muted-foreground">
                    {new Date(asset.metadata.lastMaintenance).toLocaleDateString()}
                  </p>
                </div>

                {asset.performance.errorCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      {asset.performance.errorCount} recent errors
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusToggle(asset)}
                    className="flex-1"
                  >
                    {asset.status === 'online' ? 'Set Maintenance' : 'Set Online'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAssetClick(asset)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Popup>
        </Marker>
      ))}
    </>
  );
};