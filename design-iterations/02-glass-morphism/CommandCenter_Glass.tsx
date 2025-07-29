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
  Wifi
} from 'lucide-react';
import './glass-morphism-styles.css';

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

export function CommandCenter_Glass() {
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
        bgColor: 'glass-priority-critical',
        icon: AlertTriangle,
        label: 'Critical',
        glow: 'glass-glow-critical'
      },
      high: {
        color: 'text-orange-400',
        bgColor: 'glass-priority-high',
        icon: AlertCircle,
        label: 'High',
        glow: 'glass-glow-accent'
      },
      medium: {
        color: 'text-yellow-400',
        bgColor: 'glass-priority-medium',
        icon: Info,
        label: 'Medium',
        glow: 'glass-glow-success'
      },
      low: {
        color: 'text-green-400',
        bgColor: 'glass-priority-low',
        icon: Info,
        label: 'Low',
        glow: 'glass-glow-success'
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
    <div className="glass-theme glass-background" data-design="glass">
      {/* Glass Header */}
      <div className="glass-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>SECURITY COMMAND CENTER</h1>
            <p>Neural network surveillance and threat assessment</p>
          </div>
          
          {/* Holographic Stats Display */}
          <div className="flex items-center gap-4">
            {getCriticalIncidents() > 0 && (
              <div className="glass-card glass-glow-critical p-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="glass-icon text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    {getCriticalIncidents()} CRITICAL THREAT{getCriticalIncidents() > 1 ? 'S' : ''} DETECTED
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                className="glass-button glass-button-primary"
                onClick={() => setShowRadioModal(true)}
              >
                <Radio className="glass-icon" />
                TACTICAL RADIO
              </button>
              <button
                className="glass-button glass-button-primary"
                onClick={() => setShowCommunicationsPage(true)}
              >
                <Headphones className="glass-icon" />
                NEURAL LINK
              </button>
            </div>
          </div>
        </div>

        {/* Holographic System Stats */}
        <div className="glass-stats-grid mt-6">
          <div className="glass-stat-card glass-glow-accent hover:glass-glow-pulse">
            <Shield className="glass-stat-icon" />
            <div className="glass-stat-value">{getAvailableGuards()}</div>
            <div className="glass-stat-label">OPERATIVES READY</div>
          </div>
          <div className="glass-stat-card glass-glow-success">
            <Activity className="glass-stat-icon" />
            <div className="glass-stat-value">{activities.length}</div>
            <div className="glass-stat-label">ACTIVE SIGNALS</div>
          </div>
          <div className="glass-stat-card glass-glow-accent">
            <BarChart3 className="glass-stat-icon" />
            <div className="glass-stat-value">{facilityStats.buildingsMonitored}</div>
            <div className="glass-stat-label">SECTORS MONITORED</div>
          </div>
          <div className="glass-stat-card glass-glow-success">
            <Zap className="glass-stat-icon" />
            <div className="glass-stat-value">{facilityStats.averageResponseTime}</div>
            <div className="glass-stat-label">RESPONSE TIME</div>
          </div>
        </div>
      </div>

      {/* Main Three-Panel Glass Layout */}
      <div className="glass-layout">
        {/* Left Panel - Threat Stream */}
        <div className="glass-panel glass-panel-left">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Eye className="glass-icon" />
              THREAT DETECTION STREAM
            </div>
          </div>
          
          {/* Neural Search Interface */}
          <div className="p-4 border-b border-white/10">
            <div className="glass-search-container">
              <Search className="glass-search-icon" />
              <input
                type="text"
                placeholder="Neural pattern search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input glass-search-input"
              />
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                className={`glass-button ${showCriticalOnly ? 'glass-button-danger glass-glow-critical' : ''}`}
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              >
                <Target className="glass-icon-sm" />
                CRITICAL ONLY
              </button>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="glass-input text-sm"
              >
                <option value="all">ALL THREATS</option>
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>
          </div>

          <div className="glass-scroll-area">
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
                    <button className={`w-full p-3 rounded-lg glass-card ${config.glow} flex items-center justify-between text-left transition-all hover:scale-105 ${config.bgColor}`}>
                      <div className="flex items-center gap-3">
                        <IconComponent className={`glass-icon ${config.color}`} />
                        <span className={`font-medium ${config.color} uppercase tracking-wider`}>
                          {config.label} THREATS
                        </span>
                        <span className={`glass-badge glass-badge-${priority}`}>
                          {priorityActivities.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className={`glass-icon ${config.color}`} />
                      ) : (
                        <ChevronDown className={`glass-icon ${config.color}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {priorityActivities.map(activity => (
                      <div
                        key={activity.id}
                        className={`glass-activity-card ${config.bgColor}`}
                        onClick={() => handleActivitySelect(activity)}
                      >
                        <div className="glass-activity-header">
                          <div className="glass-activity-title uppercase tracking-wider">
                            {activity.title}
                          </div>
                          <div className="glass-activity-time">
                            {formatTimeAgo(activity.timestamp || activity.time || new Date())}
                          </div>
                        </div>
                        
                        <div className="glass-activity-description">
                          {activity.description || 'Neural pattern detected - analyzing...'}
                        </div>
                        
                        <div className="glass-activity-meta">
                          <div className="glass-location">
                            <MapPin className="glass-icon-sm" />
                            {activity.location}
                          </div>
                          <div className={`glass-status glass-status-${activity.status}`}></div>
                          <span className={`glass-badge glass-badge-${priority} uppercase`}>
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
                <Eye className="w-16 h-16 mx-auto mb-4 text-cyan-400 opacity-50 glass-glow-accent" />
                <h3 className="font-medium text-white mb-2 uppercase tracking-wider">ALL SYSTEMS SECURE</h3>
                <p className="text-sm text-gray-400">Neural network monitoring active</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Tactical Map */}
        <div className="glass-panel glass-panel-center">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Wifi className="glass-icon" />
              TACTICAL OVERVIEW MATRIX
            </div>
          </div>
          <div className="glass-card-content flex-1 p-0">
            <InteractiveMap onZoneClick={handleZoneClick} onGuardClick={handleGuardClick} />
          </div>
          
          {/* Operative Control Interface */}
          <div className="border-t border-white/10 p-4">
            <GuardManagement
              guards={guards}
              onGuardUpdate={handleGuardUpdate}
              onGuardAssign={handleGuardAssign}
              onGuardStatusChange={() => {}}
              onGuardSelect={setSelectedGuard}
            />
          </div>
        </div>

        {/* Right Panel - Neural Timeline */}
        <div className="glass-panel glass-panel-right">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Clock className="glass-icon" />
              NEURAL ACTIVITY TIMELINE
            </div>
          </div>
          <div className="glass-card-content flex-1 p-0">
            <Timeline 
              className="h-full"
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={activities}
            />
          </div>
        </div>
      </div>

      {/* Holographic Modals */}
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
        <div className="fixed inset-0 glass-background z-50">
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