import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Building,
  Home,
  Zap,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Camera,
  DoorOpen,
  Wifi,
  Users,
  Car,
  Layers,
  Building2,
  Settings,
  Map,
  Grid3X3,
  ArrowLeft,
  ArrowRight,
  Eye,
  Activity,
  Search,
  X
} from 'lucide-react';

// Lazy load the LeafletCampusMap component
const LeafletCampusMap = lazy(() => import('./LeafletCampusMap'));

// Hierarchical data structure for Russian Doll navigation
interface Asset {
  id: string;
  name: string;
  type: 'camera' | 'door' | 'sensor' | 'alarm' | 'access_point';
  x: number;
  y: number;
  status: 'online' | 'offline' | 'alert' | 'maintenance';
  details?: string;
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  assets: Asset[];
  hasIncident?: boolean;
  incidentType?: 'critical' | 'high' | 'medium' | 'low';
  hasGuard?: boolean;
  guardName?: string;
}

interface Floor {
  id: string;
  name: string;
  number: number;
  rooms: Room[];
  blueprint?: string;
}

interface BuildingStructure {
  id: string;
  name: string;
  type: 'building' | 'parking' | 'facility';
  x: number;
  y: number;
  width: number;
  height: number;
  floors: Floor[];
  hasIncident?: boolean;
  incidentType?: 'critical' | 'high' | 'medium' | 'low';
  hasGuard?: boolean;
  guardName?: string;
}

interface Site {
  id: string;
  name: string;
  buildings: BuildingStructure[];
  coordinates?: { lat: number; lng: number };
}

// Navigation state type
interface NavigationState {
  level: 'sites' | 'buildings' | 'floors' | 'rooms' | 'assets';
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
}

// Mock hierarchical data structure
const mockSites: Site[] = [
  {
    id: 'corporate-campus',
    name: 'Corporate Campus',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    buildings: [
      {
        id: 'building-a',
        name: 'Building A - Executive',
        type: 'building',
        x: 15, y: 20, width: 20, height: 25,
        hasIncident: true, incidentType: 'critical',
        floors: [
          {
            id: 'a-floor-1',
            name: 'Ground Floor',
            number: 1,
            rooms: [
              {
                id: 'a-1-lobby',
                name: 'Main Lobby',
                x: 20, y: 25, width: 30, height: 20,
                hasIncident: true, incidentType: 'critical', hasGuard: true, guardName: 'Garcia, M.',
                assets: [
                  { id: 'cam-001', name: 'Entry Camera', type: 'camera', x: 30, y: 35, status: 'online' },
                  { id: 'door-001', name: 'Main Entrance', type: 'door', x: 40, y: 30, status: 'alert' },
                  { id: 'sensor-001', name: 'Motion Sensor', type: 'sensor', x: 45, y: 40, status: 'online' }
                ]
              },
              {
                id: 'a-1-reception',
                name: 'Reception',
                x: 55, y: 35, width: 25, height: 15,
                assets: [
                  { id: 'cam-002', name: 'Reception Camera', type: 'camera', x: 65, y: 40, status: 'online' },
                  { id: 'access-001', name: 'Reception Access Point', type: 'access_point', x: 70, y: 45, status: 'online' }
                ]
              }
            ]
          },
          {
            id: 'a-floor-3',
            name: 'Third Floor',
            number: 3,
            rooms: [
              {
                id: 'a-3-zone7',
                name: 'Zone 7 - Executive Offices',
                x: 25, y: 30, width: 40, height: 25,
                hasIncident: true, incidentType: 'critical', hasGuard: true, guardName: 'Officer Johnson',
                assets: [
                  { id: 'cam-301', name: 'Hallway Camera 1', type: 'camera', x: 35, y: 40, status: 'alert' },
                  { id: 'cam-302', name: 'Hallway Camera 2', type: 'camera', x: 50, y: 45, status: 'online' },
                  { id: 'door-301', name: 'Executive Suite', type: 'door', x: 45, y: 42, status: 'online' },
                  { id: 'sensor-301', name: 'Motion Detector', type: 'sensor', x: 55, y: 50, status: 'alert' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'building-b',
        name: 'Building B - Operations',
        type: 'building',
        x: 45, y: 25, width: 25, height: 30,
        floors: [
          {
            id: 'b-floor-1',
            name: 'Ground Floor',
            number: 1,
            rooms: [
              {
                id: 'b-1-operations',
                name: 'Operations Center',
                x: 30, y: 40, width: 35, height: 25,
                assets: [
                  { id: 'cam-101', name: 'Ops Camera 1', type: 'camera', x: 40, y: 50, status: 'online' },
                  { id: 'cam-102', name: 'Ops Camera 2', type: 'camera', x: 55, y: 55, status: 'online' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'parking-main',
        name: 'Main Parking Structure',
        type: 'parking',
        x: 20, y: 65, width: 30, height: 20,
        hasGuard: true, guardName: 'Officer Smith',
        floors: [
          {
            id: 'parking-level-1',
            name: 'Level 1',
            number: 1,
            rooms: [
              {
                id: 'parking-section-a',
                name: 'Section A',
                x: 25, y: 30, width: 25, height: 20,
                hasGuard: true, guardName: 'Officer Smith',
                assets: [
                  { id: 'cam-p01', name: 'Parking Camera 1', type: 'camera', x: 35, y: 40, status: 'online' },
                  { id: 'cam-p02', name: 'Parking Camera 2', type: 'camera', x: 45, y: 45, status: 'online' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'research-facility',
    name: 'Research Facility',
    coordinates: { lat: 37.7849, lng: -122.4094 },
    buildings: [
      {
        id: 'building-c',
        name: 'Building C - Research Labs',
        type: 'building',
        x: 30, y: 35, width: 35, height: 30,
        hasIncident: true, incidentType: 'high',
        floors: [
          {
            id: 'c-floor-1',
            name: 'Ground Floor',
            number: 1,
            rooms: [
              {
                id: 'c-1-lobby',
                name: 'Research Lobby',
                x: 35, y: 45, width: 30, height: 20,
                hasIncident: true, incidentType: 'high', hasGuard: true, guardName: 'Officer Davis',
                assets: [
                  { id: 'cam-c01', name: 'Lab Entry Camera', type: 'camera', x: 45, y: 55, status: 'online' },
                  { id: 'door-c01', name: 'Lab Access Door', type: 'door', x: 55, y: 60, status: 'online' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

interface InteractiveMapProps {
  onZoneClick?: (building: string, zone: any) => void;
  onGuardClick?: (guardName: string) => void;
}

export function InteractiveMap({ onZoneClick, onGuardClick }: InteractiveMapProps) {
  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'sites'
  });
  const [zoom, setZoom] = useState(5);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [_emergencyMode, setEmergencyMode] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('grid');

  // Navigation helpers
  const getCurrentData = () => {
    const site = mockSites.find(s => s.id === navigation.siteId);
    if (!site) return { sites: mockSites };
    
    const building = site.buildings.find(b => b.id === navigation.buildingId);
    if (!building) return { site, buildings: site.buildings };
    
    const floor = building.floors.find(f => f.id === navigation.floorId);
    if (!floor) return { site, building, floors: building.floors };
    
    const room = floor.rooms.find(r => r.id === navigation.roomId);
    if (!room) return { site, building, floor, rooms: floor.rooms };
    
    return { site, building, floor, room, assets: room.assets };
  };

  const navigateToLevel = (level: NavigationState['level'], ids: Partial<NavigationState> = {}) => {
    setNavigation({ level, ...ids });
  };

  const goBack = () => {
    switch (navigation.level) {
      case 'assets':
        setNavigation(prev => ({ level: 'rooms', siteId: prev.siteId, buildingId: prev.buildingId, floorId: prev.floorId }));
        break;
      case 'rooms':
        setNavigation(prev => ({ level: 'floors', siteId: prev.siteId, buildingId: prev.buildingId }));
        break;
      case 'floors':
        setNavigation(prev => ({ level: 'buildings', siteId: prev.siteId }));
        break;
      case 'buildings':
        setNavigation({ level: 'sites' });
        break;
    }
  };

  const getIncidentColor = (type?: 'critical' | 'high' | 'medium' | 'low') => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'low': return 'border-gray-500 bg-gray-50 text-gray-900';
      default: return 'border-gray-300 bg-white text-gray-900';
    }
  };

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

  const currentData = getCurrentData();

  const renderSites = () => {
    if (viewMode === 'map' && navigation.level === 'sites') {
      return (
        <div className="h-full w-full">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading map...</div>}>
            <LeafletCampusMap 
              onGuardClick={(guardId) => {
                // Handle guard click if needed
                if (onGuardClick) {
                  const guardName = `Guard ${guardId}`;
                  onGuardClick(guardName);
                }
              }}
              onBuildingClick={(buildingId) => {
                // Navigate to building when clicked on map
                console.log('Building clicked:', buildingId);
              }}
            />
          </Suspense>
        </div>
      );
    }

    // Default grid view
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        {currentData.sites?.map((site) => (
          <Card 
            key={site.id}
            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
              site.buildings.some(b => b.hasIncident) ? getIncidentColor('critical') : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => navigateToLevel('buildings', { siteId: site.id })}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{site.name}</h3>
                  <p className="text-sm text-muted-foreground">{site.buildings.length} buildings</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {site.buildings.filter(b => b.hasIncident).map(b => (
                  <Badge key={b.id} variant="destructive" className="text-xs">
                    {b.incidentType?.toUpperCase()}
                  </Badge>
                ))}
                {site.buildings.filter(b => b.hasGuard).map(b => (
                  <Badge key={b.id} variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Guard
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderBuildings = () => (
    <div className="p-4">
      <div className="relative w-full h-96 bg-gray-100 rounded-lg border overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {currentData.buildings?.map((building) => (
            <g key={building.id}>
              <rect
                x={building.x} y={building.y}
                width={building.width} height={building.height}
                className={`cursor-pointer transition-all stroke-2 ${
                  building.hasIncident 
                    ? 'fill-red-100 stroke-red-500 hover:fill-red-200' 
                    : 'fill-blue-100 stroke-blue-500 hover:fill-blue-200'
                }`}
                onClick={() => navigateToLevel('floors', { 
                  siteId: navigation.siteId, 
                  buildingId: building.id 
                })}
                onMouseEnter={() => setHoveredItem(building.id)}
                onMouseLeave={() => setHoveredItem(null)}
                rx="1"
              />
              <text
                x={building.x + building.width/2} 
                y={building.y + building.height/2}
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-xs font-semibold fill-current pointer-events-none"
              >
                {building.name.split(' ')[0]}
              </text>
              {building.hasIncident && (
                <circle
                  cx={building.x + building.width - 2}
                  cy={building.y + 2}
                  r="2"
                  className="fill-red-500 animate-pulse"
                />
              )}
            </g>
          ))}
        </svg>
        {hoveredItem && (
          <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-lg border">
            <p className="text-sm font-medium">
              {currentData.buildings?.find(b => b.id === hoveredItem)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFloors = () => (
    <div className="p-4 space-y-4">
      {currentData.floors?.map((floor) => (
        <Card 
          key={floor.id}
          className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-blue-300"
          onClick={() => navigateToLevel('rooms', { 
            siteId: navigation.siteId, 
            buildingId: navigation.buildingId, 
            floorId: floor.id 
          })}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{floor.name}</h3>
                  <p className="text-sm text-muted-foreground">{floor.rooms.length} rooms</p>
                </div>
              </div>
              <div className="flex gap-2">
                {floor.rooms.filter(r => r.hasIncident).map(r => (
                  <Badge key={r.id} variant="destructive" className="text-xs">
                    {r.incidentType?.toUpperCase()}
                  </Badge>
                ))}
                {floor.rooms.filter(r => r.hasGuard).map(r => (
                  <Badge key={r.id} variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {r.guardName}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRooms = () => (
    <div className="p-4">
      <div className="relative w-full h-96 bg-gray-100 rounded-lg border overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {currentData.rooms?.map((room) => (
            <g key={room.id}>
              <rect
                x={room.x} y={room.y}
                width={room.width} height={room.height}
                className={`cursor-pointer transition-all stroke-2 ${
                  room.hasIncident 
                    ? 'fill-red-100 stroke-red-500 hover:fill-red-200' 
                    : 'fill-green-100 stroke-green-500 hover:fill-green-200'
                }`}
                onClick={() => navigateToLevel('assets', { 
                  siteId: navigation.siteId, 
                  buildingId: navigation.buildingId, 
                  floorId: navigation.floorId,
                  roomId: room.id 
                })}
                onMouseEnter={() => setHoveredItem(room.id)}
                onMouseLeave={() => setHoveredItem(null)}
                rx="1"
              />
              <text
                x={room.x + room.width/2} 
                y={room.y + room.height/2}
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-xs font-semibold fill-current pointer-events-none"
              >
                {room.name.split(' ')[0]}
              </text>
              {room.hasGuard && (
                <Shield
                  x={room.x + 1}
                  y={room.y + 1}
                  width="3"
                  height="3"
                  className="fill-blue-600"
                />
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="p-4">
      <div className="relative w-full h-96 bg-gray-100 rounded-lg border overflow-hidden mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Room outline */}
          {currentData.room && (
            <rect
              x={currentData.room.x} y={currentData.room.y}
              width={currentData.room.width} height={currentData.room.height}
              className="fill-gray-50 stroke-gray-400 stroke-2"
              rx="1"
            />
          )}
          {/* Assets */}
          {currentData.assets?.map((asset) => {
            const _IconComponent = getAssetIcon(asset.type);
            return (
              <g key={asset.id}>
                <circle
                  cx={asset.x} cy={asset.y}
                  r="3"
                  className={`cursor-pointer transition-all ${
                    asset.status === 'alert' ? 'fill-red-500' : 
                    asset.status === 'online' ? 'fill-green-500' : 'fill-gray-500'
                  }`}
                  onMouseEnter={() => setHoveredItem(asset.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                />
              </g>
            );
          })}
        </svg>
        {hoveredItem && (
          <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-lg border">
            <p className="text-sm font-medium">
              {currentData.assets?.find(a => a.id === hoveredItem)?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Status: {currentData.assets?.find(a => a.id === hoveredItem)?.status}
            </p>
          </div>
        )}
      </div>
      
      {/* Asset List */}
      <div className="grid grid-cols-2 gap-3">
        {currentData.assets?.map((asset) => {
          const IconComponent = getAssetIcon(asset.type);
          return (
            <Card key={asset.id} className="p-3">
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${
                  asset.status === 'alert' ? 'text-red-500' : 
                  asset.status === 'online' ? 'text-green-500' : 'text-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{asset.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{asset.status}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (navigation.level) {
      case 'sites': return renderSites();
      case 'buildings': return renderBuildings();
      case 'floors': return renderFloors();
      case 'rooms': return renderRooms();
      case 'assets': return renderAssets();
      default: return renderSites();
    }
  };

  const levelIcons = {
    sites: Home,
    buildings: Building2,
    floors: Layers,
    rooms: Grid3X3,
    assets: Activity
  };
  
  const CurrentIcon = levelIcons[navigation.level];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Header */}
      <div className="p-4 border-b space-y-4">
        {/* Level Indicator & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-blue-50 border-blue-200">
              <CurrentIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold capitalize text-blue-900">
                {navigation.level}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground font-medium">
              {navigation.level === 'sites' && `${currentData.sites?.length || 0} sites`}
              {navigation.level === 'buildings' && `${currentData.buildings?.length || 0} buildings`}
              {navigation.level === 'floors' && `${currentData.floors?.length || 0} floors`}
              {navigation.level === 'rooms' && `${currentData.rooms?.length || 0} rooms`}
              {navigation.level === 'assets' && `${currentData.assets?.length || 0} assets`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle - Only show at sites level */}
            {navigation.level === 'sites' && (
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as 'map' | 'grid')}
                className="border rounded-md"
              >
                <ToggleGroupItem value="grid" size="sm" className="gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </ToggleGroupItem>
                <ToggleGroupItem value="map" size="sm" className="gap-2">
                  <Map className="h-4 w-4" />
                  Map
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            
            {/* Back Button */}
            {navigation.level !== 'sites' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
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

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={() => navigateToLevel('sites')}
                className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded"
              >
                <Home className="h-3 w-3" />
                Sites
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {navigation.siteId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={() => navigateToLevel('buildings', { siteId: navigation.siteId })}
                    className="hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    {currentData.site?.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            
            {navigation.buildingId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={() => navigateToLevel('floors', { 
                      siteId: navigation.siteId, 
                      buildingId: navigation.buildingId 
                    })}
                    className="hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    {currentData.building?.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            
            {navigation.floorId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={() => navigateToLevel('rooms', { 
                      siteId: navigation.siteId, 
                      buildingId: navigation.buildingId, 
                      floorId: navigation.floorId 
                    })}
                    className="hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    {currentData.floor?.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            
            {navigation.roomId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">
                    {currentData.room?.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <Separator />
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        {renderContent()}
      </ScrollArea>
    </div>
  );
}