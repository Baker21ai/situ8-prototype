import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Guard status color mapping
const getGuardColor = (status: string): string => {
  switch (status) {
    case 'available': return '#10B981';    // Green
    case 'responding': return '#EF4444';   // Red
    case 'patrolling': return '#3B82F6';   // Blue
    case 'investigating': return '#F59E0B'; // Yellow
    case 'break': return '#8B5CF6';        // Purple
    case 'off_duty': return '#6B7280';     // Gray
    case 'emergency': return '#DC2626';    // Dark Red
    default: return '#6B7280';             // Default Gray
  }
};

// Custom guard marker icon
const createGuardIcon = (status: string) => {
  const color = getGuardColor(status);
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">G</div>
    `,
    className: 'guard-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Mock guard data interface (will be replaced with actual store data)
interface Guard {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  badge?: string;
  lastUpdate?: Date;
}

interface LeafletCampusMapProps {
  guards?: Guard[];
  onGuardClick?: (guardId: string) => void;
  onBuildingClick?: (buildingId: string) => void;
  className?: string;
}

export const LeafletCampusMap: React.FC<LeafletCampusMapProps> = ({
  guards = [],
  onGuardClick,
  onBuildingClick,
  className
}) => {
  // Default campus center (San Francisco Bay Area)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const defaultZoom = 16;

  // Mock guard data for testing (will be removed when integrated with stores)
  const mockGuards: Guard[] = useMemo(() => [
    {
      id: '1',
      name: 'Garcia, M.',
      latitude: 37.7749,
      longitude: -122.4194,
      status: 'available',
      badge: 'SEC-4782'
    },
    {
      id: '2', 
      name: 'Chen, L.',
      latitude: 37.7751,
      longitude: -122.4196,
      status: 'patrolling',
      badge: 'SEC-4783'
    },
    {
      id: '3',
      name: 'Rodriguez, A.',
      latitude: 37.7747,
      longitude: -122.4192,
      status: 'investigating',
      badge: 'SEC-4784'
    }
  ], []);

  // Use provided guards or fallback to mock data
  const displayGuards = guards.length > 0 ? guards : mockGuards;

  // Handle guard marker click
  const handleGuardClick = (guard: Guard) => {
    if (onGuardClick) {
      onGuardClick(guard.id);
    }
  };

  return (
    <div className={`w-full h-full ${className || ''}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-campus-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render guard markers */}
        {displayGuards.map((guard) => (
          <Marker
            key={guard.id}
            position={[guard.latitude, guard.longitude]}
            icon={createGuardIcon(guard.status)}
            eventHandlers={{
              click: () => handleGuardClick(guard)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{guard.name}</h3>
                <p className="text-xs text-gray-600">Badge: {guard.badge}</p>
                <p className="text-xs text-gray-600">Status: {guard.status}</p>
                {guard.lastUpdate && (
                  <p className="text-xs text-gray-500">
                    Last update: {guard.lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletCampusMap;