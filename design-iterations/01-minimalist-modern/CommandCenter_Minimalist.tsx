import React, { useState, useCallback, useEffect } from 'react';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from '../../components/ui/card';
import { Badge as _Badge } from '../../components/ui/badge';
import { Button as _Button } from '../../components/ui/button';
import { ScrollArea as _ScrollArea } from '../../components/ui/scroll-area';
import { Alert as _Alert, AlertDescription as _AlertDescription } from '../../components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import { InteractiveMap } from '../../components/InteractiveMap';
import { GuardProfile } from '../../components/GuardProfile';
import { GuardManagement } from '../../components/GuardManagement';
import { Timeline } from '../../components/Timeline';
import { RadioModal } from '../../components/RadioModal';
import { CommunicationsPage } from '../../components/CommunicationsPage';
import { ActivityCard as _ActivityCard, ActivityData } from '../../components/ActivityCard';
import { ActivityDetail } from '../../components/ActivityDetail';
import { EnterpriseActivityManager as _EnterpriseActivityManager } from '../../components/EnterpriseActivityManager';
import { enterpriseActivities, generateRealtimeActivity, getFacilityStats } from '../../components/enterpriseMockData';
import { 
  AlertTriangle, 
  Clock, 
  Target,
  Users as _Users,
  Radio,
  Headphones,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  Search,
  Filter as _Filter,
  BarChart3,
  Shield,
  Activity,
  MapPin
} from 'lucide-react';
import './minimalist-styles.css';

// Enhanced activities using enterprise-scale data system
const getInitialActivities = () => {
  return enterpriseActivities;
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
  }
];

const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

export function CommandCenter_Minimalist() {
  const [activities, setActivities] = useState<ActivityData[]>(getInitialActivities());
  const [guards, setGuards] = useState(initialGuards);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ActivityData | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<typeof initialGuards[0] | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showCommunicationsPage, setShowCommunicationsPage] = useState(false);
  const [activityIdCounter, setActivityIdCounter] = useState(100001);
  const [facilityStats, setFacilityStats] = useState(getFacilityStats(enterpriseActivities));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    critical: false,
    high: false,
    medium: true,
    low: true
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
  }, [guards, activities]);

  const getFilteredActivities = useCallback(() => {
    let filtered = activities;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === selectedPriority);
    }
    
    if (showCriticalOnly) {
      filtered = filtered.filter(activity => 
        activity.priority === 'critical' && 
        (activity.status === 'new' || activity.status === 'active')
      );
    }
    
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return filtered.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      const aTime = a.timestamp || a.time;
      const bTime = b.timestamp || b.time;
      if (aTime && bTime) {
        return bTime.getTime() - aTime.getTime();
      }
      return 0;
    });
  }, [activities, showCriticalOnly, searchQuery, selectedPriority]);

  const getActivitiesByPriority = useCallback(() => {
    const filtered = getFilteredActivities();
    return {
      critical: filtered.filter(a => a.priority === 'critical'),
      high: filtered.filter(a => a.priority === 'high'),
      medium: filtered.filter(a => a.priority === 'medium'),
      low: filtered.filter(a => a.priority === 'low')
    };
  }, [getFilteredActivities]);

  const toggleSection = useCallback((priority: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  }, []);

  const getPriorityConfig = (priority: string) => {
    const configs = {
      critical: {
        color: 'text-red-600',
        bgColor: 'minimalist-priority-critical',
        icon: AlertTriangle,
        label: 'Critical'
      },
      high: {
        color: 'text-orange-600',
        bgColor: 'minimalist-priority-high',
        icon: AlertCircle,
        label: 'High'
      },
      medium: {
        color: 'text-yellow-600',
        bgColor: 'minimalist-priority-medium',
        icon: Info,
        label: 'Medium'
      },
      low: {
        color: 'text-green-600',
        bgColor: 'minimalist-priority-low',
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

  const handleActivitySelect = useCallback((activity: any) => {
    setSelectedActivity(selectedActivity === activity.id ? null : activity.id);
    setSelectedActivityDetail(activity);
  }, [selectedActivity]);

  const _handleActivityAction = useCallback((action: string, activity: any) => {
    console.log(`Activity action: ${action}`, activity);
  }, []);

  const handleZoneClick = (building: string, zone: any) => {
    console.log('Zone clicked:', building, zone);
  };

  const handleGuardClick = (guardName: string) => {
    const guard = guards.find(g => g.name === guardName);
    setSelectedGuard(guard || null);
  };

  // Auto-add new enterprise activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newActivity = generateRealtimeActivity(activityIdCounter);
        setActivityIdCounter(prev => prev + 1);
        setActivities(prev => [newActivity, ...prev.slice(0, 99)]);
        setFacilityStats(getFacilityStats([...enterpriseActivities, newActivity]));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activityIdCounter]);

  return (
    <div className="minimalist-theme minimalist-container" data-design="minimalist">
      {/* Minimalist Header */}
      <div className="minimalist-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Security Command Center</h1>
            <p>Real-time monitoring and incident management</p>
          </div>
          
          {/* Clean Stats Display */}
          <div className="flex items-center gap-4">
            {getCriticalIncidents() > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 rounded-lg">
                <AlertTriangle className="minimalist-icon text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {getCriticalIncidents()} Critical Alert{getCriticalIncidents() > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                className="minimalist-button"
                onClick={() => setShowRadioModal(true)}
              >
                <Radio className="minimalist-icon" />
                Radio
              </button>
              <button
                className="minimalist-button"
                onClick={() => setShowCommunicationsPage(true)}
              >
                <Headphones className="minimalist-icon" />
                Communications
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="minimalist-stats-grid mt-6">
          <div className="minimalist-stat-card">
            <Shield className="minimalist-stat-icon" />
            <div className="minimalist-stat-value">{getAvailableGuards()}</div>
            <div className="minimalist-stat-label">Guards Available</div>
          </div>
          <div className="minimalist-stat-card">
            <Activity className="minimalist-stat-icon" />
            <div className="minimalist-stat-value">{activities.length}</div>
            <div className="minimalist-stat-label">Total Activities</div>
          </div>
          <div className="minimalist-stat-card">
            <BarChart3 className="minimalist-stat-icon" />
            <div className="minimalist-stat-value">{facilityStats.buildingsMonitored}</div>
            <div className="minimalist-stat-label">Buildings Monitored</div>
          </div>
          <div className="minimalist-stat-card">
            <Clock className="minimalist-stat-icon" />
            <div className="minimalist-stat-value">{facilityStats.averageResponseTime}</div>
            <div className="minimalist-stat-label">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Main Three-Panel Layout */}
      <div className="minimalist-layout">
        {/* Left Panel - Activities Stream */}
        <div className="minimalist-panel minimalist-panel-left">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <Activity className="minimalist-icon" />
              Activity Stream
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="minimalist-search-container">
              <Search className="minimalist-search-icon" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="minimalist-input minimalist-search-input"
              />
            </div>
            
            <div className="minimalist-filter-group">
              <button
                className={`minimalist-button ${showCriticalOnly ? 'minimalist-button-primary' : ''}`}
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              >
                <Target className="minimalist-icon-sm" />
                Critical Only
              </button>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="minimalist-input"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="minimalist-scroll-area">
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
                  className="mb-4"
                >
                  <CollapsibleTrigger asChild>
                    <button className={`w-full p-3 rounded-lg border flex items-center justify-between text-left transition-all hover:bg-gray-50 ${config.bgColor}`}>
                      <div className="flex items-center gap-3">
                        <IconComponent className={`minimalist-icon ${config.color}`} />
                        <span className={`font-medium ${config.color}`}>
                          {config.label} Priority
                        </span>
                        <span className={`minimalist-badge minimalist-badge-${priority}`}>
                          {priorityActivities.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className={`minimalist-icon ${config.color}`} />
                      ) : (
                        <ChevronDown className={`minimalist-icon ${config.color}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {priorityActivities.map(activity => (
                      <div
                        key={activity.id}
                        className={`minimalist-activity-card ${config.bgColor}`}
                        onClick={() => handleActivitySelect(activity)}
                      >
                        <div className="minimalist-activity-header">
                          <div className="minimalist-activity-title">{activity.title}</div>
                          <div className="minimalist-activity-time">
                            {formatTimeAgo(activity.timestamp || activity.time || new Date())}
                          </div>
                        </div>
                        
                        <div className="minimalist-activity-description">
                          {activity.description || 'No description available'}
                        </div>
                        
                        <div className="minimalist-activity-meta">
                          <div className="minimalist-location">
                            <MapPin className="minimalist-icon-sm" />
                            {activity.location}
                          </div>
                          <div className={`minimalist-status minimalist-status-${activity.status}`}></div>
                          <span className={`minimalist-badge minimalist-badge-${priority}`}>
                            {priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            
            {Object.values(getActivitiesByPriority()).every(arr => arr.length === 0) && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-sm text-gray-600">All systems operating normally</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Interactive Map */}
        <div className="minimalist-panel minimalist-panel-center">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <MapPin className="minimalist-icon" />
              Facility Overview
            </div>
          </div>
          <div className="minimalist-card-content flex-1 p-0">
            <InteractiveMap onZoneClick={handleZoneClick} onGuardClick={handleGuardClick} />
          </div>
          
          {/* Guard Management Footer */}
          <div className="border-t p-4">
            <GuardManagement
              guards={guards}
              onGuardUpdate={handleGuardUpdate}
              onGuardAssign={handleGuardAssign}
              onGuardStatusChange={() => {}}
              onGuardSelect={setSelectedGuard}
            />
          </div>
        </div>

        {/* Right Panel - Timeline */}
        <div className="minimalist-panel minimalist-panel-right">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <Clock className="minimalist-icon" />
              Activity Timeline
            </div>
          </div>
          <div className="minimalist-card-content flex-1 p-0">
            <Timeline 
              className="h-full"
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={activities}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <GuardProfile
        guard={selectedGuard}
        open={selectedGuard !== null}
        onOpenChange={(open) => !open && setSelectedGuard(null)}
      />

      <RadioModal
        isOpen={showRadioModal}
        onClose={() => setShowRadioModal(false)}
        onOpenFullPage={() => {
          setShowRadioModal(false);
          setShowCommunicationsPage(true);
        }}
      />

      {showCommunicationsPage && (
        <div className="fixed inset-0 bg-white z-50">
          <CommunicationsPage onBackToCommandCenter={() => setShowCommunicationsPage(false)} />
        </div>
      )}

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
            console.log('Activity update:', activityId, updates);
          }}
        />
      )}
    </div>
  );
}