import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { InteractiveMap } from './InteractiveMap';
import { GuardProfile } from './GuardProfile';
import { GuardManagement } from './GuardManagement';
import { Timeline } from './Timeline';
import { RadioModal } from './RadioModal';
import { CommunicationsPage } from './CommunicationsPage';
import { ActivityCard } from './organisms/ActivityCard';
import { ActivityData } from '@/lib/types/activity';
import { ActivityDetail } from './ActivityDetail';
import { EnterpriseActivityManager } from './EnterpriseActivityManager';
import { mockActivities, getActivitiesByPriority, getCriticalActivities } from './mockActivityData';
import { enterpriseActivities, generateRealtimeActivity, getFacilityStats } from './enterpriseMockData';
import { 
  AlertTriangle, 
  Clock, 
  Target,
  Users,
  Radio,
  Headphones,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info
} from 'lucide-react';

// Enhanced activities using enterprise-scale data system
const getInitialActivities = () => {
  // Use full enterprise dataset for proper scale testing
  return enterpriseActivities; // Full dataset - optimized with proper pagination in UI
};

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

// Utility functions for activities
const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

export function CommandCenter() {
  const [activities, setActivities] = useState<ActivityData[]>(getInitialActivities());
  const [guards, setGuards] = useState(initialGuards);
  const [timelineEvents, setTimelineEvents] = useState(initialTimelineEvents);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ActivityData | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<typeof initialGuards[0] | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showCommunicationsPage, setShowCommunicationsPage] = useState(false);
  const [activityIdCounter, setActivityIdCounter] = useState(100001);
  const [facilityStats, setFacilityStats] = useState(getFacilityStats(enterpriseActivities));
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    critical: false, // Critical starts expanded
    high: false,     // High starts expanded
    medium: true,    // Medium starts collapsed
    low: true        // Low starts collapsed
  });

  // Guard Management handlers
  const handleGuardUpdate = useCallback((guardId: number, updates: Partial<typeof initialGuards[0]>) => {
    setGuards(prev => prev.map(guard => 
      guard.id === guardId ? { ...guard, ...updates } : guard
    ));
  }, []);

  const handleGuardAssign = useCallback((guardId: number, activityId: number) => {
    setGuards(prev => prev.map(guard => ({
      ...guard,
      assignedActivity: guard.id === guardId ? activityId : guard.assignedActivity,
      status: guard.id === guardId ? 'responding' : guard.status
    })));

    setActivities(prev => prev.map(activity => ({
      ...activity,
      assignedTo: activity.id === activityId ? guards.find(g => g.id === guardId)?.name || activity.assignedTo : activity.assignedTo,
      status: activity.id === activityId ? 'assigned' : activity.status
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
    setGuards(prev => prev.map(guard => 
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
      filtered = activities.filter(activity => 
        activity.priority === 'critical' && 
        (activity.status === 'new' || activity.status === 'active')
      );
    }
    
    // Safe sorting function that handles both ActivityData and EnterpriseActivityData
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return filtered.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Safe timestamp comparison - handle both timestamp and time properties
      const aTime = a.timestamp || a.time;
      const bTime = b.timestamp || b.time;
      if (aTime && bTime) {
        return bTime.getTime() - aTime.getTime();
      }
      return 0;
    });
  }, [activities, showCriticalOnly]);

  // Group activities by priority
  const getActivitiesByPriority = useCallback(() => {
    const filtered = getFilteredActivities();
    return {
      critical: filtered.filter(a => a.priority === 'critical'),
      high: filtered.filter(a => a.priority === 'high'),
      medium: filtered.filter(a => a.priority === 'medium'),
      low: filtered.filter(a => a.priority === 'low')
    };
  }, [getFilteredActivities]);

  // Toggle section collapse state
  const toggleSection = useCallback((priority: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  }, []);

  // Get priority styling
  const getPriorityConfig = (priority: string) => {
    const configs = {
      critical: {
        color: 'text-red-400',
        bgColor: 'bg-red-600/10',
        borderColor: 'border-red-600/20',
        icon: AlertTriangle,
        label: 'Critical'
      },
      high: {
        color: 'text-orange-400',
        bgColor: 'bg-orange-600/10',
        borderColor: 'border-orange-600/20',
        icon: AlertCircle,
        label: 'High'
      },
      medium: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-600/10',
        borderColor: 'border-yellow-600/20',
        icon: Info,
        label: 'Medium'
      },
      low: {
        color: 'text-green-400',
        bgColor: 'bg-green-600/10',
        borderColor: 'border-green-600/20',
        icon: Info,
        label: 'Low'
      }
    };
    return configs[priority as keyof typeof configs] || configs.low;
  };

  const getAvailableGuards = useCallback(() => {
    return guards.filter(g => g.status === 'available').length;
  }, [guards]);

  const getCriticalIncidents = useCallback(() => {
    return activities.filter(activity => 
      activity.priority === 'critical' && 
      (activity.status === 'new' || activity.status === 'active')
    ).length;
  }, [activities]);

  // Activity handlers for enterprise system
  const handleActivitySelect = useCallback((activity: any) => {
    setSelectedActivity(selectedActivity === activity.id ? null : activity.id);
    // Open activity detail modal when clicked
    setSelectedActivityDetail(activity);
  }, [selectedActivity]);

  const handleActivityAction = useCallback((action: string, activity: any) => {
    console.log(`Activity action: ${action}`, activity);
    // Handle enterprise activity actions
    switch (action) {
      case 'escalate':
        console.log('Escalating activity:', activity.id);
        break;
      case 'correlate':
        console.log('Finding correlated activities:', activity.id);
        break;
      case 'notify_business':
        console.log('Notifying business stakeholders:', activity.id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, []);

  const handleBulkAction = useCallback((action: string, activities: any[]) => {
    console.log(`Bulk action: ${action} on ${activities.length} activities`);
  }, []);

  // Auto-add new enterprise activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 15 seconds (realistic for large facility)
        const newActivity = generateRealtimeActivity(activityIdCounter);
        setActivityIdCounter(prev => prev + 1);
        
        // Use the enterprise activity directly
        setActivities(prev => [newActivity, ...prev.slice(0, 99)]); // Keep last 100 for performance
        
        // Update facility stats
        setFacilityStats(getFacilityStats([...enterpriseActivities, newActivity]));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activityIdCounter]);

  const handleZoneClick = (building: string, zone: any) => {
    console.log('Zone clicked:', building, zone);
  };

  const handleGuardClick = (guardName: string) => {
    const guard = guards.find(g => g.name === guardName);
    setSelectedGuard(guard || null);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Command Center</h1>
            <p className="text-muted-foreground text-sm">Real-time security operations dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {getCriticalIncidents() > 0 && (
              <Alert className="border-red-600/20 bg-red-600/10 px-3 py-2 max-w-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400 font-medium text-sm">
                  {getCriticalIncidents()} Critical Incident{getCriticalIncidents() > 1 ? 's' : ''} Active
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRadioModal(true)}
                className="flex items-center gap-2"
              >
                <Radio className="h-4 w-4" />
                Open Radio Modal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommunicationsPage(true)}
                className="flex items-center gap-2"
              >
                <Headphones className="h-4 w-4" />
                Communications Page
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Badge variant="outline" className={getCriticalIncidents() > 0 ? "bg-red-600/10 text-red-400 border-red-600/20" : "bg-green-600/10 text-green-400 border-green-600/20"}>
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
      </div>

      {/* Main Layout - Full height grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 min-h-0">
        {/* Left Panel - Activity Stream (25%) */}
        <div className="col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-lg">
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
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2">
                  {Object.entries(getActivitiesByPriority()).map(([priority, priorityActivities]) => {
                    const config = getPriorityConfig(priority);
                    const IconComponent = config.icon;
                    const isCollapsed = collapsedSections[priority];
                    
                    if (priorityActivities.length === 0) return null;
                    
                    return (
                      <Collapsible
                        key={priority}
                        open={!isCollapsed}
                        onOpenChange={() => toggleSection(priority)}
                        className="mb-3"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-between p-3 h-auto ${config.bgColor} ${config.borderColor} border rounded-lg hover:${config.bgColor} transition-all duration-200`}
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent className={`h-4 w-4 ${config.color}`} />
                              <span className={`font-medium ${config.color}`}>
                                {config.label} Priority
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={`${config.bgColor} ${config.color} border-0`}
                              >
                                {priorityActivities.length}
                              </Badge>
                            </div>
                            {isCollapsed ? (
                              <ChevronRight className={`h-4 w-4 ${config.color}`} />
                            ) : (
                              <ChevronDown className={`h-4 w-4 ${config.color}`} />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2 ml-2">
                          {priorityActivities.map(activity => (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              variant="compact"
                              layout="stream"
                              features={{
                                showPriority: true,
                                showAssignment: true,
                                showActions: true,
                                showSiteBadge: true
                              }}
                              isSelected={selectedActivity === activity.id}
                              onClick={handleActivitySelect}
                              onAction={handleActivityAction}
                            />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                  
                  {/* Show message if no activities */}
                  {Object.values(getActivitiesByPriority()).every(arr => arr.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No activities found</p>
                      <p className="text-sm">All systems operating normally</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Map + Guard Management (50%) */}
        <div className="col-span-6 flex flex-col gap-2">
          {/* Map View - Responsive sizing based on content */}
          <div className="flex-1 min-h-0">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <InteractiveMap onZoneClick={handleZoneClick} onGuardClick={handleGuardClick} />
              </CardContent>
            </Card>
          </div>

          {/* Guard Management - Compact footer section */}
          <div className="flex-shrink-0 h-48">
            <Card className="h-full">
              <GuardManagement
                guards={guards}
                onGuardUpdate={handleGuardUpdate}
                onGuardAssign={handleGuardAssign}
                onGuardStatusChange={handleGuardStatusChange}
                onGuardSelect={setSelectedGuard}
              />
            </Card>
          </div>
        </div>

        {/* Right Panel - Timeline (25%) */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Timeline 
                className="h-full"
                onOpenModal={() => setShowRadioModal(true)}
                onOpenFullPage={() => setShowCommunicationsPage(true)}
                activities={activities}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guard Profile Modal */}
      <GuardProfile
        guard={selectedGuard}
        open={selectedGuard !== null}
        onOpenChange={(open) => !open && setSelectedGuard(null)}
      />

      {/* Radio Modal */}
      <RadioModal
        isOpen={showRadioModal}
        onClose={() => setShowRadioModal(false)}
        onOpenFullPage={() => {
          setShowRadioModal(false);
          setShowCommunicationsPage(true);
        }}
      />

      {/* Communications Page */}
      {showCommunicationsPage && (
        <div className="fixed inset-0 bg-background z-50">
          <CommunicationsPage
            onBackToCommandCenter={() => setShowCommunicationsPage(false)}
          />
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivityDetail && (
        <ActivityDetail
          activity={{
            id: parseInt(selectedActivityDetail.id.toString()),
            type: selectedActivityDetail.type,
            title: selectedActivityDetail.title,
            description: selectedActivityDetail.description || '',
            location: selectedActivityDetail.location,
            time: selectedActivityDetail.timestamp,
            priority: selectedActivityDetail.priority,
            status: selectedActivityDetail.status,
            assignedTo: selectedActivityDetail.assignedTo || '',
            evidence: [],
            tags: []
          }}
          isOpen={!!selectedActivityDetail}
          onClose={() => setSelectedActivityDetail(null)}
          onUpdate={(activityId, updates) => {
            // Handle activity updates here
            console.log('Activity update:', activityId, updates);
          }}
        />
      )}
    </div>
  );
}