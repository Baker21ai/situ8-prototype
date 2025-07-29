import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import { InteractiveMap } from '../../components/InteractiveMap';
import { GuardProfile } from '../../components/GuardProfile';
import { GuardManagement } from '../../components/GuardManagement';
import { Timeline } from '../../components/Timeline';
import { RadioModal } from '../../components/RadioModal';
import { CommunicationsPage } from '../../components/CommunicationsPage';
import { ActivityCard, ActivityData } from '../../components/ActivityCard';
import { ActivityDetail } from '../../components/ActivityDetail';
import { EnterpriseActivityManager } from '../../components/EnterpriseActivityManager';
import { enterpriseActivities, generateRealtimeActivity, getFacilityStats } from '../../components/enterpriseMockData';
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
  Info,
  Search,
  Filter,
  BarChart3,
  Shield,
  Activity,
  MapPin,
  Zap,
  Eye,
  Crosshair,
  Radar,
  Signal,
  Settings
} from 'lucide-react';
import './tactical-dark-styles.css';

// Enhanced activities using enterprise-scale data system
const getInitialActivities = () => {
  return enterpriseActivities;
};

const initialGuards = [
  {
    id: 1,
    name: 'ALPHA-01',
    status: 'responding' as const,
    location: 'SECTOR-A LEVEL-3',
    building: 'building-a',
    zone: 'Zone A-2',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    radio: 'TAC-1',
    assignedActivity: 1,
    badge: 'ALPHA-01',
    shift: '06:00 - 14:00',
    department: 'TACTICAL',
    skills: ['MEDICAL', 'SUPERVISOR'],
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
    name: 'BRAVO-02',
    status: 'patrolling' as const,
    location: 'SECTOR-A ZONE-3',
    building: 'building-a',
    zone: 'Zone A-3',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
    radio: 'TAC-2',
    assignedActivity: null,
    badge: 'BRAVO-02',
    shift: '06:00 - 14:00',
    department: 'TACTICAL',
    skills: ['K9-UNIT'],
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
    name: 'CHARLIE-03',
    status: 'break' as const,
    location: 'SECTOR-A ZONE-1',
    building: 'building-a',
    zone: 'Zone A-1',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
    radio: 'TAC-1',
    assignedActivity: null,
    badge: 'CHARLIE-03',
    shift: '14:00 - 22:00',
    department: 'TACTICAL',
    skills: ['MEDICAL'],
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
  
  if (minutes < 1) return 'NOW';
  if (minutes < 60) return `${minutes}MIN`;
  if (hours < 24) return `${hours}HR`;
  return date.toLocaleDateString();
};

export function CommandCenter_Tactical() {
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
        color: 'text-red-400',
        bgColor: 'tactical-priority-critical',
        icon: AlertTriangle,
        label: 'CRITICAL'
      },
      high: {
        color: 'text-amber-400',
        bgColor: 'tactical-priority-high',
        icon: AlertCircle,
        label: 'HIGH'
      },
      medium: {
        color: 'text-amber-400',
        bgColor: 'tactical-priority-medium',
        icon: Info,
        label: 'MEDIUM'
      },
      low: {
        color: 'text-green-400',
        bgColor: 'tactical-priority-low',
        icon: Info,
        label: 'LOW'
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

  const handleActivityAction = useCallback((action: string, activity: any) => {
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
    <div className="tactical-theme tactical-background" data-design="tactical">
      {/* Tactical Command Header */}
      <div className="tactical-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>TACTICAL COMMAND CENTER</h1>
            <p>THREAT ASSESSMENT & TACTICAL RESPONSE</p>
          </div>
          
          {/* HUD Status Display */}
          <div className="flex items-center gap-4">
            {getCriticalIncidents() > 0 && (
              <div className="tactical-card tactical-alert-critical p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="tactical-icon text-red-400" />
                  <span className="text-xs font-bold text-red-400">
                    {getCriticalIncidents()} CRITICAL THREAT{getCriticalIncidents() > 1 ? 'S' : ''}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                className="tactical-button tactical-button-primary"
                onClick={() => setShowRadioModal(true)}
              >
                <Radio className="tactical-icon" />
                TAC-RADIO
              </button>
              <button
                className="tactical-button tactical-button-blue"
                onClick={() => setShowCommunicationsPage(true)}
              >
                <Signal className="tactical-icon" />
                COMMS
              </button>
            </div>
          </div>
        </div>

        {/* Tactical HUD Stats */}
        <div className="tactical-stats-grid mt-4">
          <div className="tactical-stat-card tactical-hud-element">
            <Shield className="tactical-stat-icon" />
            <div className="tactical-stat-value">{getAvailableGuards()}</div>
            <div className="tactical-stat-label">UNITS READY</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <Radar className="tactical-stat-icon" />
            <div className="tactical-stat-value">{activities.length}</div>
            <div className="tactical-stat-label">ACTIVE CONTACTS</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <Crosshair className="tactical-stat-icon" />
            <div className="tactical-stat-value">{facilityStats.buildingsMonitored}</div>
            <div className="tactical-stat-label">SECTORS</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <Zap className="tactical-stat-icon" />
            <div className="tactical-stat-value">{facilityStats.averageResponseTime}</div>
            <div className="tactical-stat-label">RESPONSE</div>
          </div>
        </div>
      </div>

      {/* Main Tactical Interface Layout */}
      <div className="tactical-layout">
        {/* Left Panel - Threat Feed */}
        <div className="tactical-panel tactical-panel-left">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Eye className="tactical-icon" />
              THREAT FEED
            </div>
          </div>
          
          {/* Tactical Search Interface */}
          <div className="p-3 border-b border-gray-800">
            <div className="tactical-search-container">
              <Search className="tactical-search-icon" />
              <input
                type="text"
                placeholder="SEARCH THREATS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tactical-input tactical-search-input"
              />
            </div>
            
            <div className="flex gap-2 mt-2">
              <button
                className={`tactical-button ${showCriticalOnly ? 'tactical-button-danger' : ''}`}
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              >
                <Target className="tactical-icon-sm" />
                CRITICAL
              </button>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="tactical-input text-xs"
              >
                <option value="all">ALL</option>
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>
          </div>

          <div className="tactical-scroll-area">
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
                    <button className={`w-full p-2 tactical-card ${config.bgColor} flex items-center justify-between text-left transition-all hover:border-green-400`}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`tactical-icon ${config.color}`} />
                        <span className={`text-xs font-bold ${config.color}`}>
                          {config.label}
                        </span>
                        <span className={`tactical-badge tactical-badge-${priority}`}>
                          {priorityActivities.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className={`tactical-icon ${config.color}`} />
                      ) : (
                        <ChevronDown className={`tactical-icon ${config.color}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {priorityActivities.map(activity => (
                      <div
                        key={activity.id}
                        className={`tactical-activity-card ${config.bgColor}`}
                        onClick={() => handleActivitySelect(activity)}
                      >
                        <div className="tactical-activity-header">
                          <div className="tactical-activity-title">
                            {activity.title}
                          </div>
                          <div className="tactical-activity-time">
                            {formatTimeAgo(activity.timestamp || activity.time || new Date())}
                          </div>
                        </div>
                        
                        <div className="tactical-activity-description">
                          {activity.description || 'CONTACT DETECTED - ANALYZING...'}
                        </div>
                        
                        <div className="tactical-activity-meta">
                          <div className="tactical-location">
                            <MapPin className="tactical-icon-sm" />
                            {activity.location}
                          </div>
                          <div className={`tactical-status tactical-status-${activity.status}`}></div>
                          <span className={`tactical-badge tactical-badge-${priority}`}>
                            {priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            
            {Object.values(getActivitiesByPriority()).every(arr => arr.length === 0) && (
              <div className="text-center py-8">
                <Crosshair className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
                <h3 className="text-xs font-bold text-green-400 mb-1">ALL SECTORS SECURE</h3>
                <p className="text-xs text-gray-500">TACTICAL MONITORING ACTIVE</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Tactical Map */}
        <div className="tactical-panel tactical-panel-center">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Radar className="tactical-icon" />
              TACTICAL SITUATION MAP
            </div>
          </div>
          <div className="tactical-card-content flex-1 p-0">
            <InteractiveMap onZoneClick={handleZoneClick} onGuardClick={handleGuardClick} />
          </div>
          
          {/* Unit Control Interface */}
          <div className="border-t border-gray-800 p-3">
            <GuardManagement
              guards={guards}
              onGuardUpdate={handleGuardUpdate}
              onGuardAssign={handleGuardAssign}
              onGuardStatusChange={() => {}}
              onGuardSelect={setSelectedGuard}
            />
          </div>
        </div>

        {/* Right Panel - Command Timeline */}
        <div className="tactical-panel tactical-panel-right">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Clock className="tactical-icon" />
              COMMAND LOG
            </div>
          </div>
          <div className="tactical-card-content flex-1 p-0">
            <Timeline 
              className="h-full"
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={activities}
            />
          </div>
        </div>
      </div>

      {/* Tactical Modals */}
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
        <div className="fixed inset-0 tactical-background z-50">
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