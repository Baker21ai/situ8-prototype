import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator as _Separator } from './ui/separator';
import { Dialog as _Dialog, DialogContent as _DialogContent, DialogHeader as _DialogHeader, DialogTitle as _DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { InteractiveMap } from './InteractiveMap';
import { GuardProfile } from './GuardProfile';
import { GuardManagement } from './GuardManagement';
import { 
  AlertTriangle, 
  Clock, 
  MapPin as _MapPin, 
  Radio as _Radio, 
  User as _User, 
  Eye as _Eye,
  MessageCircle as _MessageCircle,
  Zap as _Zap,
  Shield as _Shield,
  Navigation as _Navigation,
  Phone as _Phone,
  ArrowRight as _ArrowRight,
  UserCheck as _UserCheck,
  Bell as _Bell,
  Megaphone as _Megaphone,
  Target,
  Users,
  Activity as _Activity,
  Command as _Command,
  Keyboard as _Keyboard,
  X as _X,
  Play as _Play,
  Pause
} from 'lucide-react';

// Mock data with real-time simulation
const initialActivities = [
  {
    id: 1,
    type: 'Security Alert',
    title: 'Unauthorized Entry Detected',
    location: 'Building A - Floor 3 - Zone 7',
    time: new Date(Date.now() - 2 * 60 * 1000),
    priority: 'critical',
    status: 'active',
    assignedTo: 'Garcia, M.'
  },
  {
    id: 2,
    type: 'Patrol Check',
    title: 'Routine Security Round',
    location: 'Building B - Parking Garage',
    time: new Date(Date.now() - 15 * 60 * 1000),
    priority: 'low',
    status: 'completed',
    assignedTo: 'Chen, L.'
  },
  {
    id: 3,
    type: 'Incident',
    title: 'Medical Emergency',
    location: 'Building C - Floor 1 - Lobby',
    time: new Date(Date.now() - 23 * 60 * 1000),
    priority: 'high',
    status: 'responding',
    assignedTo: 'Davis, K.'
  },
  {
    id: 4,
    type: 'Access Control',
    title: 'Badge Reader Malfunction',
    location: 'Building A - Main Entrance',
    time: new Date(Date.now() - 45 * 60 * 1000),
    priority: 'medium',
    status: 'investigating',
    assignedTo: 'Wilson, R.'
  }
];

const initialGuards = [
  {
    id: 1,
    name: 'Garcia, M.',
    status: 'responding' as const,
    location: 'Building A - Floor 3',
    building: 'building-a',
    zone: 'Zone A-2',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: 1,
    badge: 'SEC-4782',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Medical', 'Supervisor'],
    metrics: {
      activitiesCreated: 34,
      incidentsResponded: 2,
      patrolsCompleted: 6,
      avgResponseTime: '1.8m',
      radioCalls: 12
    }
  },
  {
    id: 2,
    name: 'Chen, L.',
    status: 'patrolling' as const,
    location: 'Building A - Zone A-3',
    building: 'building-a',
    zone: 'Zone A-3',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4783',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['K9'],
    metrics: {
      activitiesCreated: 28,
      incidentsResponded: 1,
      patrolsCompleted: 8,
      avgResponseTime: '2.1m',
      radioCalls: 8
    }
  },
  {
    id: 3,
    name: 'Davis, K.',
    status: 'break' as const,
    location: 'Building A - Zone A-1',
    building: 'building-a',
    zone: 'Zone A-1',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: null,
    badge: 'SEC-4784',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Medical'],
    metrics: {
      activitiesCreated: 22,
      incidentsResponded: 1,
      patrolsCompleted: 7,
      avgResponseTime: '2.5m',
      radioCalls: 15
    }
  },
  {
    id: 4,
    name: 'Smith, J.',
    status: 'off_duty' as const,
    location: 'Off Duty',
    building: 'building-a',
    zone: 'Zone A-1',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: null,
    badge: 'SEC-4785',
    shift: '22:00 - 06:00',
    department: 'Security',
    skills: ['Tactical'],
    metrics: {
      activitiesCreated: 18,
      incidentsResponded: 0,
      patrolsCompleted: 5,
      avgResponseTime: '2.0m',
      radioCalls: 6
    }
  },
  {
    id: 5,
    name: 'Wilson, R.',
    status: 'available' as const,
    location: 'Building B - Zone B-1',
    building: 'building-b',
    zone: 'Zone B-1',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4786',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Investigations'],
    metrics: {
      activitiesCreated: 31,
      incidentsResponded: 3,
      patrolsCompleted: 8,
      avgResponseTime: '1.9m',
      radioCalls: 11
    }
  },
  {
    id: 6,
    name: 'Martinez, A.',
    status: 'patrolling' as const,
    location: 'Building B - Zone B-2',
    building: 'building-b',
    zone: 'Zone B-2',
    lastUpdate: new Date(Date.now() - 8 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: null,
    badge: 'SEC-4787',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Medical', 'K9'],
    metrics: {
      activitiesCreated: 26,
      incidentsResponded: 2,
      patrolsCompleted: 9,
      avgResponseTime: '2.2m',
      radioCalls: 9
    }
  },
  {
    id: 7,
    name: 'Brown, T.',
    status: 'available' as const,
    location: 'Building B - Zone B-3',
    building: 'building-b',
    zone: 'Zone B-3',
    lastUpdate: new Date(Date.now() - 12 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: null,
    badge: 'SEC-4788',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Supervisor'],
    metrics: {
      activitiesCreated: 29,
      incidentsResponded: 1,
      patrolsCompleted: 7,
      avgResponseTime: '1.7m',
      radioCalls: 13
    }
  },
  {
    id: 8,
    name: 'Johnson, T.',
    status: 'patrolling' as const,
    location: 'Parking Lot - Sector P-1',
    building: 'parking',
    zone: 'Sector P-1',
    lastUpdate: new Date(Date.now() - 22 * 60 * 1000),
    radio: 'Channel 2',
    assignedActivity: null,
    badge: 'SEC-4789',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['Tactical'],
    metrics: {
      activitiesCreated: 15,
      incidentsResponded: 0,
      patrolsCompleted: 6,
      avgResponseTime: '2.8m',
      radioCalls: 7
    }
  },
  {
    id: 9,
    name: 'Lee, S.',
    status: 'patrolling' as const,
    location: 'Perimeter - North Gate',
    building: 'perimeter',
    zone: 'North Gate',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    radio: 'Channel 1',
    assignedActivity: null,
    badge: 'SEC-4790',
    shift: '06:00 - 14:00',
    department: 'Security',
    skills: ['K9', 'Supervisor'],
    metrics: {
      activitiesCreated: 24,
      incidentsResponded: 1,
      patrolsCompleted: 8,
      avgResponseTime: '2.0m',
      radioCalls: 10
    }
  },
  {
    id: 10,
    name: 'Park, J.',
    status: 'available' as const,
    location: 'Perimeter - South Gate',
    building: 'perimeter',
    zone: 'South Gate',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'Channel 3',
    assignedActivity: null,
    badge: 'SEC-4791',
    shift: '14:00 - 22:00',
    department: 'Security',
    skills: ['Medical', 'Investigations'],
    metrics: {
      activitiesCreated: 33,
      incidentsResponded: 2,
      patrolsCompleted: 7,
      avgResponseTime: '1.6m',
      radioCalls: 14
    }
  }
];

const initialTimelineEvents = [
  {
    id: 1,
    time: new Date(Date.now() - 2 * 60 * 1000),
    event: 'Garcia, M. responded to Building A alert',
    type: 'response'
  },
  {
    id: 2,
    time: new Date(Date.now() - 4 * 60 * 1000),
    event: 'Critical alert: Unauthorized entry detected',
    type: 'alert'
  },
  {
    id: 3,
    time: new Date(Date.now() - 19 * 60 * 1000),
    event: 'Chen, L. completed patrol round',
    type: 'completion'
  },
  {
    id: 4,
    time: new Date(Date.now() - 27 * 60 * 1000),
    event: 'Medical emergency reported in Building C',
    type: 'incident'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const _getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'responding': return 'bg-orange-500';
    case 'patrolling': return 'bg-blue-500';
    case 'break': return 'bg-yellow-500';
    case 'emergency': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

export function CommandCenter() {
  const [activities, setActivities] = useState(initialActivities);
  const [guards, setGuards] = useState(initialGuards);
  const [timelineEvents, setTimelineEvents] = useState(initialTimelineEvents);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<typeof initialGuards[0] | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Guard Management handlers
  const handleGuardUpdate = useCallback((guardId: number, updates: Partial<typeof initialGuards[0]>) => {
    setGuards((prev: any) => prev.map((guard: any) => 
      guard.id === guardId ? { ...guard, ...updates } : guard
    ));
  }, []);

  const handleGuardAssign = useCallback((guardId: number, activityId: number) => {
    setGuards((prev: any) => prev.map((guard: any) => ({
      ...guard,
      assignedActivity: guard.id === guardId ? activityId : guard.assignedActivity,
      status: guard.id === guardId ? 'responding' : guard.status
    })));

    setActivities(prev => prev.map(activity => ({
      ...activity,
      assignedTo: activity.id === activityId ? guards.find(g => g.id === guardId)?.name || activity.assignedTo : activity.assignedTo,
      status: activity.id === activityId ? 'responding' : activity.status
    })));

    // Add to timeline
    const guard = guards.find(g => g.id === guardId);
    const activity = activities.find(a => a.id === activityId);
    if (guard && activity) {
      const newEvent = {
        id: Date.now(),
        time: new Date(),
        event: `${guard.name} assigned to ${activity.title}`,
        type: 'assignment'
      };
      setTimelineEvents(prev => [newEvent, ...prev]);
    }
  }, [guards, activities]);

  const handleGuardStatusChange = useCallback((guardId: number, status: typeof initialGuards[0]['status']) => {
    setGuards((prev: any) => prev.map((guard: any) => 
      guard.id === guardId ? { ...guard, status, lastUpdate: new Date() } : guard
    ));
    
    // Add to timeline
    const guard = guards.find(g => g.id === guardId);
    if (guard) {
      const newEvent = {
        id: Date.now(),
        time: new Date(),
        event: `${guard.name} status changed to ${status}`,
        type: 'status_change'
      };
      setTimelineEvents(prev => [newEvent, ...prev]);
    }
  }, [guards]);

  const getFilteredActivities = useCallback(() => {
    let filtered = activities;
    if (showCriticalOnly) {
      filtered = activities.filter(a => a.priority === 'critical' || a.priority === 'high');
    }
    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.time.getTime() - a.time.getTime();
    });
  }, [activities, showCriticalOnly]);

  const getAvailableGuards = useCallback(() => {
    return guards.filter(g => g.status === 'available').length;
  }, [guards]);

  const getCriticalIncidents = useCallback(() => {
    return activities.filter(a => a.priority === 'critical' && a.status === 'active').length;
  }, [activities]);

  const handleZoneClick = (building: string, zone: any) => {
    console.log('Zone clicked:', building, zone);
  };

  const handleGuardClick = (guardName: string) => {
    const guard = guards.find(g => g.name === guardName);
    setSelectedGuard(guard || null);
  };

  return (
    <div className="h-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Command Center</h1>
            <p className="text-muted-foreground">Real-time security operations dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            {getCriticalIncidents() > 0 && (
              <Alert className="border-red-200 bg-red-50 px-4 py-2 max-w-sm">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">
                  {getCriticalIncidents()} Critical Incident{getCriticalIncidents() > 1 ? 's' : ''} Active
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Badge variant="outline" className={getCriticalIncidents() > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}>
                {getCriticalIncidents() > 0 ? `${getCriticalIncidents()} Critical` : 'All Systems Operational'}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {getAvailableGuards()} Available
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid gap-4 grid-cols-12">
          {/* Left Panel - Activity Stream */}
          <div className="col-span-3">
            <Card className="h-full max-h-[650px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Activity Stream
                  <Button
                    size="sm"
                    variant={showCriticalOnly ? "default" : "outline"}
                    onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Critical Only
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="p-4 space-y-3">
                    {getFilteredActivities().map(activity => (
                      <div
                        key={activity.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedActivity === activity.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
                        </div>
                        <div className="font-medium text-sm mb-1">{activity.title}</div>
                        <div className="text-xs text-gray-600 mb-2">{activity.location}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Assigned: {activity.assignedTo}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel (40% width) */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Map View (Flexible height) */}
            <Card className="flex-grow">
              <CardHeader>
                <CardTitle>Facility Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-full">
                  <InteractiveMap onZoneClick={handleZoneClick} onGuardClick={handleGuardClick} />
                </div>
              </CardContent>
            </Card>

            {/* Guard Management (Auto-sized based on content) */}
            <div className="flex-shrink-0">
              <GuardManagement
                guards={guards as any}
                onGuardUpdate={handleGuardUpdate as any}
                onGuardAssign={handleGuardAssign}
                onGuardStatusChange={handleGuardStatusChange as any}
                onGuardSelect={setSelectedGuard as any}
              />
            </div>
          </div>

          {/* Right Panel - Timeline */}
          <div className="col-span-4">
            <Card className="h-full max-h-[650px]">
              <CardHeader>
                <CardTitle>Live Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="p-4 space-y-3">
                    {timelineEvents.map(event => (
                      <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{event.event}</span>
                          <span className="text-xs text-gray-500">{formatTime(event.time)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Guard Profile Modal */}
      <GuardProfile
        guard={selectedGuard as any}
        open={selectedGuard !== null}
        onOpenChange={(open) => !open && setSelectedGuard(null)}
      />
    </div>
  );
}