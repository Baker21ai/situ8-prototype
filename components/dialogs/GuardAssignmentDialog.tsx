import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  User, 
  MapPin, 
  Clock, 
  Radio, 
  AlertTriangle,
  CheckCircle,
  Coffee,
  Home,
  Phone,
  MessageSquare,
  Mic,
  Volume2,
  Signal
} from 'lucide-react';
import { Alert } from '../../stores/alertStore';

interface Guard {
  id: string;
  name: string;
  badgeNumber: string;
  status: 'available' | 'busy' | 'break' | 'off_duty';
  currentZone?: string;
  currentActivity?: string;
  estimatedResponseTime: number; // in seconds
  location: {
    zone: string;
    description: string;
  };
  skills: string[];
  clearanceLevel: number;
  communication: {
    radioChannel: string;
    phoneNumber: string;
    radioStatus: 'online' | 'offline' | 'busy';
    lastRadioCheck: string;
  };
}

interface GuardAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: Alert | null;
  onAssignGuard: (guardId: string) => void;
}

export const GuardAssignmentDialog: React.FC<GuardAssignmentDialogProps> = ({
  open,
  onOpenChange,
  alert,
  onAssignGuard
}) => {
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [communicationMethod, setCommunicationMethod] = useState<'radio' | 'phone' | 'message'>('radio');
  const [isConnecting, setIsConnecting] = useState(false);

  // Mock guard data - in real implementation, this would come from guardStore
  const guards: Guard[] = [
    {
      id: 'guard_martinez_001',
      name: 'Martinez, J.',
      badgeNumber: 'G001',
      status: 'available',
      currentZone: 'Zone A',
      estimatedResponseTime: 45,
      location: {
        zone: 'Zone A',
        description: 'Main Building Patrol'
      },
      skills: ['Armed Response', 'First Aid', 'De-escalation'],
      clearanceLevel: 3,
      communication: {
        radioChannel: 'CH-1',
        phoneNumber: '+1-555-0101',
        radioStatus: 'online',
        lastRadioCheck: '2 mins ago'
      }
    },
    {
      id: 'guard_johnson_002',
      name: 'Johnson, R.',
      badgeNumber: 'G002', 
      status: 'busy',
      currentZone: 'Zone B',
      currentActivity: 'Incident Response',
      estimatedResponseTime: 180,
      location: {
        zone: 'Zone B',
        description: 'Cafeteria Area'
      },
      skills: ['Armed Response', 'Crowd Control'],
      clearanceLevel: 2,
      communication: {
        radioChannel: 'CH-2',
        phoneNumber: '+1-555-0102',
        radioStatus: 'busy',
        lastRadioCheck: '5 mins ago'
      }
    },
    {
      id: 'guard_davis_003',
      name: 'Davis, M.',
      badgeNumber: 'G003',
      status: 'available',
      currentZone: 'Zone C',
      estimatedResponseTime: 90,
      location: {
        zone: 'Zone C',
        description: 'Parking Lot Patrol'
      },
      skills: ['Unarmed Response', 'Vehicle Inspection'],
      clearanceLevel: 2,
      communication: {
        radioChannel: 'CH-3',
        phoneNumber: '+1-555-0103',
        radioStatus: 'online',
        lastRadioCheck: '1 min ago'
      }
    },
    {
      id: 'guard_wilson_004',
      name: 'Wilson, T.',
      badgeNumber: 'G004',
      status: 'break',
      currentActivity: 'Break Time',
      estimatedResponseTime: 300,
      location: {
        zone: 'Security Office',
        description: 'On Break'
      },
      skills: ['Armed Response', 'Technical Support'],
      clearanceLevel: 3,
      communication: {
        radioChannel: 'CH-4',
        phoneNumber: '+1-555-0104',
        radioStatus: 'offline',
        lastRadioCheck: '15 mins ago'
      }
    },
    {
      id: 'guard_thompson_005',
      name: 'Thompson, K.',
      badgeNumber: 'G005',
      status: 'off_duty',
      estimatedResponseTime: 0,
      location: {
        zone: 'Off Duty',
        description: 'Not Available'
      },
      skills: ['Armed Response', 'Emergency Medical'],
      clearanceLevel: 4,
      communication: {
        radioChannel: 'CH-5',
        phoneNumber: '+1-555-0105',
        radioStatus: 'offline',
        lastRadioCheck: '2 hours ago'
      }
    }
  ];

  const getStatusColor = (status: Guard['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      case 'off_duty': return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Guard['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <AlertTriangle className="h-4 w-4" />;
      case 'break': return <Coffee className="h-4 w-4" />;
      case 'off_duty': return <Home className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Guard['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'break': return 'On Break';
      case 'off_duty': return 'Off Duty';
    }
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getRadioStatusColor = (status: Guard['communication']['radioStatus']) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
    }
  };

  const getRadioStatusIcon = (status: Guard['communication']['radioStatus']) => {
    switch (status) {
      case 'online': return <Signal className="h-3 w-3" />;
      case 'busy': return <Volume2 className="h-3 w-3" />;
      case 'offline': return <Radio className="h-3 w-3 opacity-50" />;
    }
  };

  const handleCommunication = async (guard: Guard, method: 'radio' | 'phone' | 'message') => {
    setIsConnecting(true);
    
    try {
      // Simulate communication establishment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (method) {
        case 'radio':
          console.log(`📻 Connecting to ${guard.name} on ${guard.communication.radioChannel}`);
          // In real implementation: establish radio connection
          break;
        case 'phone':
          console.log(`📞 Calling ${guard.name} at ${guard.communication.phoneNumber}`);
          // In real implementation: initiate phone call
          break;
        case 'message':
          console.log(`💬 Sending message to ${guard.name}`);
          // In real implementation: send text/app message
          break;
      }
      
      // Show success notification
      alert(`${method.charAt(0).toUpperCase() + method.slice(1)} connection established with ${guard.name}`);
      
    } catch (error) {
      console.error('Communication failed:', error);
      alert(`Failed to establish ${method} connection with ${guard.name}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAssign = async () => {
    if (selectedGuard) {
      const guard = guards.find(g => g.id === selectedGuard);
      if (guard) {
        // First establish communication
        await handleCommunication(guard, communicationMethod);
        
        // Then assign the guard
        onAssignGuard(selectedGuard);
        onOpenChange(false);
        setSelectedGuard(null);
      }
    }
  };

  const getRecommendedGuards = () => {
    if (!alert) return guards;
    
    // Sort guards by availability and response time
    return guards
      .filter(guard => guard.status !== 'off_duty')
      .sort((a, b) => {
        // Prioritize available guards
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (b.status === 'available' && a.status !== 'available') return 1;
        
        // Then by response time
        return a.estimatedResponseTime - b.estimatedResponseTime;
      });
  };

  const recommendedGuards = getRecommendedGuards();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Guard to Alert
          </DialogTitle>
          <DialogDescription>
            Select a guard to respond to this {alert?.alertType.replace('_', ' ')} alert in {alert?.location.zoneName}
          </DialogDescription>
        </DialogHeader>

        {alert && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Badge variant={alert.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">
                  {alert.priority}
                </Badge>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{alert.location.zoneName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <Badge variant="outline">
                  {Math.round(alert.detection.confidence * 100)}% Confidence
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Available Guards</h3>
          
          {recommendedGuards.map((guard, index) => (
            <Card 
              key={guard.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedGuard === guard.id 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:shadow-md'
              } ${guard.status === 'off_duty' ? 'opacity-50' : ''}`}
              onClick={() => guard.status !== 'off_duty' && setSelectedGuard(guard.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white font-semibold">
                        {guard.name.split(',')[0].slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{guard.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {guard.badgeNumber}
                        </Badge>
                        {index === 0 && guard.status === 'available' && (
                          <Badge className="bg-green-600 text-white text-xs">
                            RECOMMENDED
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(guard.status)}`}></div>
                          <span>{getStatusLabel(guard.status)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{guard.location.zone}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {formatResponseTime(guard.estimatedResponseTime)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Level {guard.clearanceLevel}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Communication Status */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <div className={`flex items-center gap-1 ${getRadioStatusColor(guard.communication.radioStatus)}`}>
                          {getRadioStatusIcon(guard.communication.radioStatus)}
                          <span>{guard.communication.radioChannel}</span>
                          <span className="text-gray-400">({guard.communication.lastRadioCheck})</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{guard.communication.phoneNumber}</span>
                        </div>
                      </div>
                      
                      {guard.currentActivity && (
                        <div className="text-sm text-gray-500">
                          Current: {guard.currentActivity}
                        </div>
                      )}
                      
                      <div className="flex gap-1 mt-2">
                        {guard.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusIcon(guard.status)}
                    
                    {guard.status === 'available' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Radio className="h-4 w-4" />
                        <span className="text-xs">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Communication Method Selection */}
        {selectedGuard && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication Method
              </h4>
              <div className="flex gap-2">
                <Button
                  variant={communicationMethod === 'radio' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommunicationMethod('radio')}
                  className="flex items-center gap-2"
                >
                  <Radio className="h-4 w-4" />
                  Radio
                </Button>
                <Button
                  variant={communicationMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommunicationMethod('phone')}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </Button>
                <Button
                  variant={communicationMethod === 'message' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCommunicationMethod('message')}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </div>
              
              {selectedGuard && (() => {
                const guard = guards.find(g => g.id === selectedGuard);
                if (!guard) return null;
                
                return (
                  <div className="mt-3 text-sm text-gray-600">
                    {communicationMethod === 'radio' && (
                      <div className="flex items-center gap-2">
                        <span>Will connect via radio channel:</span>
                        <Badge variant="outline">{guard.communication.radioChannel}</Badge>
                        <div className={`flex items-center gap-1 ${getRadioStatusColor(guard.communication.radioStatus)}`}>
                          {getRadioStatusIcon(guard.communication.radioStatus)}
                          <span className="capitalize">{guard.communication.radioStatus}</span>
                        </div>
                      </div>
                    )}
                    {communicationMethod === 'phone' && (
                      <div className="flex items-center gap-2">
                        <span>Will call:</span>
                        <Badge variant="outline">{guard.communication.phoneNumber}</Badge>
                      </div>
                    )}
                    {communicationMethod === 'message' && (
                      <div className="flex items-center gap-2">
                        <span>Will send secure message to:</span>
                        <Badge variant="outline">{guard.name}</Badge>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedGuard || isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Connect & Assign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};