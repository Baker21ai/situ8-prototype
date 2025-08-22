import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Radio,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle,
  AlertCircle,
  User,
  Route,
  Activity
} from 'lucide-react';
import { ActivityData } from '../../../lib/types/activity';
import { useMockPatrolStore } from '../../../stores/mock/useMockPatrolStore';

interface GuardsPanelProps {
  activity: ActivityData;
  isVisible: boolean;
  className?: string;
}

interface GuardStatus {
  id: string;
  name: string;
  badgeNumber: string;
  status: 'on-patrol' | 'available' | 'responding' | 'off-duty';
  location: string;
  lastSeen: string;
  currentRoute?: string;
  distanceToIncident: number; // in meters
  estimatedArrival: string;
  shift: string;
  phoneNumber: string;
  radioChannel: string;
}

export const GuardsPanel: React.FC<GuardsPanelProps> = ({
  activity,
  isVisible,
  className = ''
}) => {
  const { getAllGuardTrails } = useMockPatrolStore();
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState(false);

  // Mock guard data - in real implementation, this would come from guard management store
  const guards: GuardStatus[] = [
    {
      id: 'guard-001',
      name: 'Johnson',
      badgeNumber: 'G001',
      status: activity.assignedTo?.includes('Johnson') ? 'responding' : 'on-patrol',
      location: 'Building A - Floor 2',
      lastSeen: '2 min ago',
      currentRoute: 'Night Security Round',
      distanceToIncident: 120,
      estimatedArrival: '3 min',
      shift: '10PM - 6AM',
      phoneNumber: '+1-555-0101',
      radioChannel: 'CH-1'
    },
    {
      id: 'guard-002',
      name: 'Smith',
      badgeNumber: 'G002',
      status: 'available',
      location: 'Building B - Lobby',
      lastSeen: '5 min ago',
      distanceToIncident: 250,
      estimatedArrival: '5 min',
      shift: '10PM - 6AM',
      phoneNumber: '+1-555-0102',
      radioChannel: 'CH-1'
    },
    {
      id: 'guard-003',
      name: 'Williams',
      badgeNumber: 'G003',
      status: 'on-patrol',
      location: 'Building C - Floor 1',
      lastSeen: '1 min ago',
      currentRoute: 'Perimeter Check',
      distanceToIncident: 400,
      estimatedArrival: '8 min',
      shift: '10PM - 6AM',
      phoneNumber: '+1-555-0103',
      radioChannel: 'CH-2'
    }
  ];

  useEffect(() => {
    if (guards.length > 0 && !selectedGuard) {
      // Select the closest or responding guard by default
      const respondingGuard = guards.find(g => g.status === 'responding');
      const closestGuard = guards.reduce((closest, guard) => 
        guard.distanceToIncident < closest.distanceToIncident ? guard : closest
      );
      setSelectedGuard((respondingGuard || closestGuard).id);
    }
  }, [guards, selectedGuard]);

  const selectedGuardData = guards.find(g => g.id === selectedGuard);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responding': return 'text-red-600 bg-red-50 border-red-200';
      case 'on-patrol': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'available': return 'text-green-600 bg-green-50 border-green-200';
      case 'off-duty': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'responding': return AlertCircle;
      case 'on-patrol': return Activity;
      case 'available': return CheckCircle;
      default: return User;
    }
  };

  const handleAssignGuard = (guardId: string) => {
    console.log(`Assigning guard ${guardId} to activity ${activity.id}`);
    // In real implementation, update activity assignment
    setAssignmentMode(false);
  };

  const handleContactGuard = (method: 'radio' | 'phone' | 'message', guard: GuardStatus) => {
    console.log(`Contacting ${guard.name} via ${method}`);
    // In real implementation, initiate contact
  };

  const handleTrackGuard = (guardId: string) => {
    console.log(`Tracking guard ${guardId}`);
    // In real implementation, show guard location on map
  };

  if (!isVisible) return null;

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            Security Guards
          </CardTitle>
          <Badge variant="outline">
            {guards.filter(g => g.status !== 'off-duty').length} on duty
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Guards responding to {activity.location}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 h-[calc(100%-100px)] overflow-hidden">
        {/* Selected Guard Details */}
        {selectedGuardData && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedGuardData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Badge #{selectedGuardData.badgeNumber}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedGuardData.status)}>
                  {selectedGuardData.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Guard Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <p className="text-sm font-medium">{selectedGuardData.location}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    ETA
                  </div>
                  <p className="text-sm font-medium">{selectedGuardData.estimatedArrival}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Navigation className="h-3 w-3" />
                    Distance
                  </div>
                  <p className="text-sm font-medium">{selectedGuardData.distanceToIncident}m</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Radio className="h-3 w-3" />
                    Radio
                  </div>
                  <p className="text-sm font-medium">{selectedGuardData.radioChannel}</p>
                </div>
              </div>

              {/* Current Route */}
              {selectedGuardData.currentRoute && (
                <div className="mb-4 p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <Route className="h-3 w-3" />
                    Current Route
                  </div>
                  <p className="text-sm font-medium">{selectedGuardData.currentRoute}</p>
                </div>
              )}

              {/* Contact Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContactGuard('radio', selectedGuardData)}
                >
                  <Radio className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContactGuard('phone', selectedGuardData)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContactGuard('message', selectedGuardData)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Assignment</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignmentMode(!assignmentMode)}
            >
              {assignmentMode ? 'Cancel' : 'Assign Guard'}
            </Button>
          </div>

          {assignmentMode && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <p className="text-sm text-orange-800 mb-2">
                  Select a guard to assign to this incident:
                </p>
                <Select onValueChange={handleAssignGuard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose guard..." />
                  </SelectTrigger>
                  <SelectContent>
                    {guards
                      .filter(g => g.status !== 'off-duty')
                      .map(guard => (
                        <SelectItem key={guard.id} value={guard.id}>
                          {guard.name} ({guard.estimatedArrival} ETA)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Guards List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">All Guards</h4>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {guards.map((guard) => {
                const StatusIcon = getStatusIcon(guard.status);
                return (
                  <Card
                    key={guard.id}
                    className={`cursor-pointer transition-all ${
                      selectedGuard === guard.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedGuard(guard.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{guard.name}</span>
                              <span className="text-xs text-gray-500">#{guard.badgeNumber}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {guard.location} • {guard.lastSeen}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={getStatusColor(guard.status)}>
                            {guard.status.replace('-', ' ')}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            ETA: {guard.estimatedArrival}
                          </p>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackGuard(guard.id);
                          }}
                        >
                          Track
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactGuard('radio', guard);
                          }}
                        >
                          Radio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuardsPanel;