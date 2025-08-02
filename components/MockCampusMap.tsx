import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  MapPin,
  Radio,
  Clock,
  AlertCircle
} from 'lucide-react';

/**
 * Mock Campus Map for Guard Tracking Proof of Concept
 * 
 * This component demonstrates real-time guard tracking without requiring
 * paid MappedIn API keys. Uses SVG campus layout with live guard markers.
 */

interface GuardLocation {
  id: number;
  name: string;
  status: 'available' | 'responding' | 'patrolling' | 'investigating' | 'break' | 'off_duty' | 'emergency';
  x: number; // SVG coordinates (0-100)
  y: number; // SVG coordinates (0-100)
  building: string;
  zone: string;
  lastUpdate: Date;
  radio: string;
  badge: string;
}

// Mock campus guard positions (converted from lat/lng to SVG coordinates)
const mockGuards: GuardLocation[] = [
  {
    id: 1,
    name: 'Garcia, M.',
    status: 'responding',
    x: 25, y: 35, // Building A
    building: 'Building A',
    zone: 'Zone A-2',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    radio: 'Channel 1',
    badge: 'SEC-4782'
  },
  {
    id: 2,
    name: 'Chen, L.',
    status: 'patrolling',
    x: 30, y: 25, // Building A
    building: 'Building A',
    zone: 'Zone A-3',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'Channel 2',
    badge: 'SEC-4783'
  },
  {
    id: 3,
    name: 'Davis, K.',
    status: 'break',
    x: 20, y: 40, // Building A
    building: 'Building A',
    zone: 'Zone A-1',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
    radio: 'Channel 1',
    badge: 'SEC-4784'
  },
  {
    id: 4,
    name: 'Smith, J.',
    status: 'off_duty',
    x: 15, y: 65, // Parking
    building: 'Parking',
    zone: 'Lot A',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    radio: 'Channel 3',
    badge: 'SEC-4785'
  },
  {
    id: 5,
    name: 'Wilson, R.',
    status: 'available',
    x: 65, y: 30, // Building B
    building: 'Building B',
    zone: 'Zone B-1',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
    radio: 'Channel 2',
    badge: 'SEC-4786'
  },
  {
    id: 6,
    name: 'Martinez, A.',
    status: 'patrolling',
    x: 70, y: 40, // Building B
    building: 'Building B',
    zone: 'Zone B-2',
    lastUpdate: new Date(Date.now() - 8 * 60 * 1000),
    radio: 'Channel 1',
    badge: 'SEC-4787'
  },
  {
    id: 7,
    name: 'Brown, T.',
    status: 'available',
    x: 75, y: 25, // Building B
    building: 'Building B',
    zone: 'Zone B-3',
    lastUpdate: new Date(Date.now() - 12 * 60 * 1000),
    radio: 'Channel 3',
    badge: 'SEC-4788'
  },
  {
    id: 8,
    name: 'Johnson, T.',
    status: 'patrolling',
    x: 50, y: 75, // Parking
    building: 'Parking',
    zone: 'Sector P-1',
    lastUpdate: new Date(Date.now() - 22 * 60 * 1000),
    radio: 'Channel 2',
    badge: 'SEC-4789'
  },
  {
    id: 9,
    name: 'Lee, S.',
    status: 'patrolling',
    x: 45, y: 10, // North Gate
    building: 'Perimeter',
    zone: 'North Gate',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    radio: 'Channel 1',
    badge: 'SEC-4790'
  },
  {
    id: 10,
    name: 'Park, J.',
    status: 'available',
    x: 55, y: 85, // South Gate
    building: 'Perimeter',
    zone: 'South Gate',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'Channel 3',
    badge: 'SEC-4791'
  }
];

export function MockCampusMap() {
  const [guards, setGuards] = useState<GuardLocation[]>(mockGuards);
  const [selectedGuard, setSelectedGuard] = useState<GuardLocation | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDemo, setShowDemo] = useState(false);

  // Simulate real-time guard movement
  useEffect(() => {
    const interval = setInterval(() => {
      setGuards(prevGuards => prevGuards.map(guard => {
        // Simulate movement for patrolling guards
        if (guard.status === 'patrolling') {
          const deltaX = (Math.random() - 0.5) * 2; // -1 to 1
          const deltaY = (Math.random() - 0.5) * 2; // -1 to 1
          
          return {
            ...guard,
            x: Math.max(5, Math.min(95, guard.x + deltaX)),
            y: Math.max(5, Math.min(95, guard.y + deltaY)),
            lastUpdate: new Date()
          };
        }
        return guard;
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getGuardColor = (status: GuardLocation['status']) => {
    switch (status) {
      case 'available': return '#10B981'; // Green
      case 'responding': return '#EF4444'; // Red
      case 'patrolling': return '#3B82F6'; // Blue
      case 'investigating': return '#F59E0B'; // Yellow
      case 'break': return '#8B5CF6'; // Purple
      case 'off_duty': return '#6B7280'; // Gray
      case 'emergency': return '#DC2626'; // Dark Red
      default: return '#6B7280';
    }
  };

  const getStatusBadgeVariant = (status: GuardLocation['status']) => {
    switch (status) {
      case 'available': return 'default';
      case 'responding': return 'destructive';
      case 'emergency': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Campus Guard Tracking</h2>
            <p className="text-sm text-gray-600">Real-time guard positions and status</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showDemo ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? "Stop Demo" : "Start Demo"}
            </Button>
            
            <div className="flex items-center border rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="border-r rounded-r-none"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1 text-sm font-medium bg-gray-50 border-r">
                {Math.round(zoom * 100)}%
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                className="rounded-l-none"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
          <Badge variant="destructive">Responding</Badge>
          <Badge variant="default" className="bg-blue-100 text-blue-800">Patrolling</Badge>
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">Investigating</Badge>
          <Badge variant="secondary">Break</Badge>
          <Badge variant="outline">Off Duty</Badge>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Map Area */}
        <div className="flex-1 p-4">
          <div 
            className="relative w-full h-full bg-gray-100 rounded-lg border overflow-hidden"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Campus Background */}
              <rect x="0" y="0" width="100" height="100" fill="#f3f4f6" />
              
              {/* Building A */}
              <rect x="15" y="20" width="20" height="25" 
                    fill="#e5e7eb" stroke="#6b7280" strokeWidth="0.5" rx="1" />
              <text x="25" y="33" textAnchor="middle" fontSize="3" fill="#374151" fontWeight="bold">
                Building A
              </text>
              
              {/* Building B */}
              <rect x="60" y="20" width="20" height="25" 
                    fill="#e5e7eb" stroke="#6b7280" strokeWidth="0.5" rx="1" />
              <text x="70" y="33" textAnchor="middle" fontSize="3" fill="#374151" fontWeight="bold">
                Building B
              </text>
              
              {/* Parking Areas */}
              <rect x="10" y="60" width="15" height="20" 
                    fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="0.5" rx="1" />
              <text x="17.5" y="71" textAnchor="middle" fontSize="2.5" fill="#5b21b6">
                Parking A
              </text>
              
              <rect x="45" y="65" width="15" height="15" 
                    fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="0.5" rx="1" />
              <text x="52.5" y="73.5" textAnchor="middle" fontSize="2.5" fill="#5b21b6">
                Parking B
              </text>
              
              {/* Perimeter Gates */}
              <rect x="40" y="5" width="10" height="5" 
                    fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.5" rx="0.5" />
              <text x="45" y="8.5" textAnchor="middle" fontSize="2" fill="#92400e">
                North Gate
              </text>
              
              <rect x="50" y="85" width="10" height="5" 
                    fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.5" rx="0.5" />
              <text x="55" y="88.5" textAnchor="middle" fontSize="2" fill="#92400e">
                South Gate
              </text>
              
              {/* Walkways */}
              <path d="M 35 32.5 L 60 32.5" stroke="#9ca3af" strokeWidth="1" strokeDasharray="1,1" />
              <path d="M 25 45 L 25 60" stroke="#9ca3af" strokeWidth="1" strokeDasharray="1,1" />
              <path d="M 70 45 L 70 60" stroke="#9ca3af" strokeWidth="1" strokeDasharray="1,1" />
              
              {/* Guard Markers */}
              {guards.map((guard) => (
                <g key={guard.id}>
                  <circle
                    cx={guard.x}
                    cy={guard.y}
                    r="2"
                    fill={getGuardColor(guard.status)}
                    stroke="white"
                    strokeWidth="0.5"
                    className="cursor-pointer drop-shadow-sm"
                    onClick={() => setSelectedGuard(guard)}
                    style={{
                      filter: guard.status === 'responding' ? 'drop-shadow(0 0 3px #ef4444)' : undefined,
                      animation: guard.status === 'emergency' ? 'pulse 1s infinite' : undefined
                    }}
                  />
                  <text
                    x={guard.x}
                    y={guard.y - 3}
                    textAnchor="middle"
                    fontSize="1.5"
                    fill="#1f2937"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {guard.badge.split('-')[1]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Guard Details Panel */}
        <div className="w-80 border-l bg-gray-50 overflow-y-auto">
          {selectedGuard ? (
            <Card className="m-4">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedGuard.name}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedGuard.badge}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(selectedGuard.status)}>
                    {selectedGuard.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <p className="font-medium">{selectedGuard.building}</p>
                    <p className="text-gray-600">{selectedGuard.zone}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Radio className="h-3 w-3" />
                      Radio
                    </div>
                    <p className="font-medium">{selectedGuard.radio}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      Last Update
                    </div>
                    <p className="font-medium">{formatTimeAgo(selectedGuard.lastUpdate)}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <Button className="w-full" size="sm">
                    <Radio className="h-4 w-4 mr-2" />
                    Contact Guard
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Send to Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Click on a guard marker to view details</p>
            </div>
          )}

          {/* Guards List */}
          <div className="px-4 pb-4">
            <h3 className="font-medium text-gray-900 mb-3">All Guards ({guards.length})</h3>
            <div className="space-y-2">
              {guards.map((guard) => (
                <div
                  key={guard.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedGuard?.id === guard.id 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedGuard(guard)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{guard.name}</span>
                    <Badge variant={getStatusBadgeVariant(guard.status)} className="text-xs">
                      {guard.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {guard.building} • {formatTimeAgo(guard.lastUpdate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}