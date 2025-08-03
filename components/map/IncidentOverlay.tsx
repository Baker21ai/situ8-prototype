import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { AlertTriangle, AlertCircle, Info, AlertOctagon } from 'lucide-react';
import { useIncidentStore } from '../../stores/incidentStore';
import { Badge } from '../ui/badge';

// Building coordinate mapping (should match your actual campus layout)
const BUILDING_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'building-a': { lat: 37.7749, lng: -122.4194 },
  'building-b': { lat: 37.7755, lng: -122.4200 },
  'parking-lot': { lat: 37.7743, lng: -122.4188 },
  'perimeter': { lat: 37.7759, lng: -122.4194 },
  'SITE-001': { lat: 37.7749, lng: -122.4194 }, // Default site center
};

// Priority to color mapping
const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'critical': return '#DC2626'; // Red
    case 'high': return '#F59E0B';     // Amber
    case 'medium': return '#3B82F6';   // Blue
    case 'low': return '#10B981';      // Green
    default: return '#6B7280';         // Gray
  }
};

// Create custom incident icon
const createIncidentIcon = (priority: string, type: string) => {
  const color = getPriorityColor(priority);
  const iconChar = priority === 'critical' ? '!' : 
                  priority === 'high' ? '⚠' : 
                  priority === 'medium' ? '●' : 
                  '○';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: bold;
        position: relative;
      ">
        ${iconChar}
        ${priority === 'critical' ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 0 2px ${color};
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'incident-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

interface IncidentOverlayProps {
  onIncidentClick?: (incidentId: string) => void;
}

export const IncidentOverlay: React.FC<IncidentOverlayProps> = ({ onIncidentClick }) => {
  const { incidents } = useIncidentStore();
  
  // Filter out resolved incidents
  const activeIncidents = incidents.filter(
    incident => incident.status !== 'resolved' && incident.status !== 'closed'
  );

  // Get incident coordinates based on building or site
  const getIncidentCoordinates = (incident: any): [number, number] | null => {
    if (incident.building_id && BUILDING_COORDINATES[incident.building_id]) {
      const coords = BUILDING_COORDINATES[incident.building_id];
      // Add slight random offset to prevent overlapping markers
      return [
        coords.lat + (Math.random() - 0.5) * 0.0005,
        coords.lng + (Math.random() - 0.5) * 0.0005
      ];
    } else if (incident.site_id && BUILDING_COORDINATES[incident.site_id]) {
      const coords = BUILDING_COORDINATES[incident.site_id];
      return [coords.lat, coords.lng];
    }
    return null;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  // Separate critical incidents from others for different handling
  const criticalIncidents = activeIncidents.filter(i => i.priority === 'critical');
  const nonCriticalIncidents = activeIncidents.filter(i => i.priority !== 'critical');

  return (
    <>
      {/* Clustered non-critical incidents */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          const size = count < 5 ? 'small' : count < 10 ? 'medium' : 'large';
          const sizeClass = size === 'small' ? 35 : size === 'medium' ? 45 : 55;
          
          return L.divIcon({
            html: `<div style="
              background: #F59E0B;
              color: white;
              width: ${sizeClass}px;
              height: ${sizeClass}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${size === 'small' ? 14 : size === 'medium' ? 16 : 18}px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">⚠ ${count}</div>`,
            className: 'incident-cluster-custom',
            iconSize: L.point(sizeClass, sizeClass, true),
          });
        }}
      >
        {nonCriticalIncidents.map((incident) => {
          const coordinates = getIncidentCoordinates(incident);
          if (!coordinates) return null;

          return (
            <Marker
              key={incident.id}
              position={coordinates}
              icon={createIncidentIcon(incident.priority, incident.type)}
              eventHandlers={{
                click: () => onIncidentClick?.(incident.id)
              }}
            >
              <Popup>
                <div className="p-3 min-w-[250px]">
                  <h3 className="font-semibold text-sm mb-2">{incident.title}</h3>
                  <p className="text-xs text-gray-600 mb-3">{incident.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <Badge variant={getStatusBadgeVariant(incident.status)} className="text-xs">
                        {incident.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Priority:</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getPriorityColor(incident.priority), color: getPriorityColor(incident.priority) }}
                      >
                        {incident.priority}
                      </Badge>
                    </div>
                    
                    {incident.assigned_to && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Assigned:</span>
                        <span className="text-xs font-medium">{incident.assigned_to}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Location:</span>
                      <span className="text-xs font-medium">
                        {incident.building_name || incident.site_name || 'Unknown'}
                      </span>
                    </div>
                    
                    {incident.auto_created && (
                      <div className="text-xs text-gray-500 italic mt-2">
                        Auto-created from activity
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Critical incidents - always visible, not clustered */}
      {criticalIncidents.map((incident) => {
        const coordinates = getIncidentCoordinates(incident);
        if (!coordinates) return null;

        return (
          <React.Fragment key={`critical-${incident.id}`}>
            <Marker
              position={coordinates}
              icon={createIncidentIcon(incident.priority, incident.type)}
              eventHandlers={{
                click: () => onIncidentClick?.(incident.id)
              }}
            >
              <Popup>
                <div className="p-3 min-w-[250px]">
                  <h3 className="font-semibold text-sm mb-2">{incident.title}</h3>
                  <p className="text-xs text-gray-600 mb-3">{incident.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <Badge variant={getStatusBadgeVariant(incident.status)} className="text-xs">
                        {incident.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Priority:</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getPriorityColor(incident.priority), color: getPriorityColor(incident.priority) }}
                      >
                        {incident.priority}
                      </Badge>
                    </div>
                    
                    {incident.assigned_to && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Assigned:</span>
                        <span className="text-xs font-medium">{incident.assigned_to}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Location:</span>
                      <span className="text-xs font-medium">
                        {incident.building_name || incident.site_name || 'Unknown'}
                      </span>
                    </div>
                    
                    {incident.auto_created && (
                      <div className="text-xs text-gray-500 italic mt-2">
                        Auto-created from activity
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Critical incident danger zone */}
            <Circle
              center={coordinates}
              radius={50} // 50 meter radius
              pathOptions={{
                color: getPriorityColor(incident.priority),
                fillColor: getPriorityColor(incident.priority),
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};