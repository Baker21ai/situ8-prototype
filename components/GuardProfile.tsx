import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  User as _User, 
  MapPin, 
  Radio, 
  Clock, 
  Phone, 
  MessageCircle, 
  Activity,
  AlertTriangle,
  CheckCircle as _CheckCircle,
  Eye,
  Navigation,
  Shield as _Shield,
  FileText,
  Signal as _Signal,
  X,
  Target,
  Bell,
  ArrowRight,
  Users,
  Hash,
  Timer as _Timer,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Zap
} from 'lucide-react';

interface Guard {
  id: number;
  name: string;
  status: 'available' | 'responding' | 'patrolling' | 'break' | 'emergency';
  location: string;
  lastUpdate: Date;
  radio: string;
  assignedActivity: number | null;
  badge?: string;
  shift?: string;
  department?: string;
}

interface GuardActivity {
  id: number;
  title: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  time: Date;
  location: string;
  description?: string;
}

interface RadioMessage {
  id: number;
  time: Date;
  from: string;
  to: string;
  message: string;
  channel: string;
  type: 'incoming' | 'outgoing' | 'emergency' | 'system';
}

interface StatusUpdate {
  id: number;
  time: Date;
  status: string;
  location: string;
  note?: string;
  type: 'status_change' | 'location_update' | 'assignment' | 'completion' | 'emergency';
}

interface GuardProfileProps {
  guard: Guard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities?: GuardActivity[];
  radioMessages?: RadioMessage[];
  statusUpdates?: StatusUpdate[];
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'available': 
      return { 
        color: 'bg-green-500', 
        badge: 'bg-green-50 text-green-800 border-green-200',
        priority: 'Ready for Assignment',
        urgency: 'low'
      };
    case 'responding': 
      return { 
        color: 'bg-orange-500 animate-pulse', 
        badge: 'bg-orange-50 text-orange-800 border-orange-200',
        priority: 'En Route to Incident',
        urgency: 'high'
      };
    case 'patrolling': 
      return { 
        color: 'bg-blue-500', 
        badge: 'bg-blue-50 text-blue-800 border-blue-200',
        priority: 'On Patrol Route',
        urgency: 'medium'
      };
    case 'break': 
      return { 
        color: 'bg-yellow-500', 
        badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        priority: 'On Break',
        urgency: 'low'
      };
    case 'emergency': 
      return { 
        color: 'bg-red-500 animate-pulse', 
        badge: 'bg-red-50 text-red-800 border-red-200',
        priority: 'EMERGENCY RESPONSE',
        urgency: 'critical'
      };
    default: 
      return { 
        color: 'bg-gray-500', 
        badge: 'bg-gray-50 text-gray-800 border-gray-200',
        priority: 'Status Unknown',
        urgency: 'low'
      };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical': return { color: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, animate: true };
    case 'high': return { color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, animate: false };
    case 'medium': return { color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FileText, animate: false };
    case 'low': return { color: 'bg-gray-400', badge: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, animate: false };
    default: return { color: 'bg-gray-400', badge: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText, animate: false };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800';
    case 'responding': return 'bg-orange-100 text-orange-800';
    case 'investigating': return 'bg-blue-100 text-blue-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
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

// Enhanced mock data for demonstration
const generateMockActivities = (guardName: string): GuardActivity[] => [
  {
    id: 1,
    title: 'CRITICAL: Unauthorized Entry Response',
    type: 'Security Alert',
    priority: 'critical',
    status: 'active',
    time: new Date(Date.now() - 15 * 60 * 1000),
    location: 'Building A - Floor 3 - Zone 7',
    description: 'Motion sensor triggered in high-security area. Multiple access attempts detected.'
  },
  {
    id: 2,
    title: 'Emergency Medical Response',
    type: 'Medical Emergency',
    priority: 'high',
    status: 'responding',
    time: new Date(Date.now() - 45 * 60 * 1000),
    location: 'Building C - Lobby',
    description: 'Employee reported chest pains, paramedics en route'
  },
  {
    id: 3,
    title: 'Routine Security Round',
    type: 'Patrol Check',
    priority: 'low',
    status: 'completed',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: 'Building B - All Floors',
    description: 'Standard perimeter check completed successfully'
  }
];

const generateMockRadioMessages = (guardName: string): RadioMessage[] => [
  {
    id: 1,
    time: new Date(Date.now() - 5 * 60 * 1000),
    from: 'Command',
    to: guardName,
    message: 'PRIORITY: Respond to Building A, Floor 3. Possible security breach in progress.',
    channel: 'Channel 1',
    type: 'emergency'
  },
  {
    id: 2,
    time: new Date(Date.now() - 8 * 60 * 1000),
    from: guardName,
    to: 'Command',
    message: 'Copy that Command. En route to Building A. ETA 2 minutes.',
    channel: 'Channel 1',
    type: 'outgoing'
  },
  {
    id: 3,
    time: new Date(Date.now() - 12 * 60 * 1000),
    from: 'System',
    to: 'All Units',
    message: 'ALERT: Motion sensor triggered - Building A, Zone 7',
    channel: 'Channel 1',
    type: 'system'
  }
];

const generateMockStatusUpdates = (guardName: string): StatusUpdate[] => [
  {
    id: 1,
    time: new Date(Date.now() - 2 * 60 * 1000),
    status: 'responding',
    location: 'Building A - Floor 3',
    note: 'Investigating unauthorized entry alert - PRIORITY',
    type: 'assignment'
  },
  {
    id: 2,
    time: new Date(Date.now() - 45 * 60 * 1000),
    status: 'patrolling',
    location: 'Building B - Parking Garage',
    note: 'Starting routine patrol round',
    type: 'status_change'
  }
];

export function GuardProfile({ 
  guard, 
  open, 
  onOpenChange,
  activities: propActivities,
  radioMessages: propRadioMessages,
  statusUpdates: propStatusUpdates
}: GuardProfileProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    incidents: false,
    radio: false,
    metrics: false,
    status: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'p':
            event.preventDefault();
            // Call guard
            break;
          case 'm':
            event.preventDefault();
            // Message guard
            break;
          case 'l':
            event.preventDefault();
            // Track location
            break;
        }
      }
      
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!guard) return null;

  const statusConfig = getStatusConfig(guard.status);
  const activities = propActivities || generateMockActivities(guard.name);
  const radioMessages = propRadioMessages || generateMockRadioMessages(guard.name);
  const statusUpdates = propStatusUpdates || generateMockStatusUpdates(guard.name);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  // Calculate response metrics
  const activeIncidents = activities.filter(a => a.status === 'active' || a.status === 'responding');
  const completedToday = activities.filter(a => a.status === 'completed' && 
    new Date(a.time).toDateString() === new Date().toDateString()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-full max-w-md max-h-[90vh] overflow-hidden p-0 bg-white rounded-lg shadow-xl"
        aria-labelledby="guard-profile-title"
        aria-describedby="guard-profile-description"
      >
        {/* Compact Header */}
        <div className={`px-6 py-4 border-b ${
          statusConfig.urgency === 'critical' ? 'bg-red-50 border-red-200' :
          statusConfig.urgency === 'high' ? 'bg-orange-50 border-orange-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {/* Guard Essential Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                  <AvatarFallback className="bg-blue-600 text-white font-bold">
                    {getInitials(guard.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusConfig.color}`}>
                  {statusConfig.urgency === 'critical' && (
                    <AlertTriangle className="h-2 w-2 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
              
              <div>
                <h2 
                  id="guard-profile-title"
                  className="font-bold text-lg text-gray-900"
                >
                  {guard.name}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span className="font-medium">{guard.badge || `BADGE-${guard.id}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{guard.shift || 'Day Shift'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">{guard.location}</span>
                </div>
              </div>
            </div>

            {/* Critical Actions */}
            <div className="flex flex-col gap-2">
              <Badge className={`${statusConfig.badge} px-3 py-1 text-sm font-semibold justify-center`}>
                {statusConfig.priority}
              </Badge>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0" 
                  title="Call (Ctrl+P)"
                  aria-label={`Call ${guard.name}`}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0"
                  title="Message (Ctrl+M)"
                  aria-label={`Message ${guard.name}`}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0"
                  title="Track (Ctrl+L)"
                  aria-label={`Track ${guard.name}`}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close guard profile"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Emergency Alert Bar */}
          {statusConfig.urgency === 'critical' && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
              <AlertDescription className="text-red-800 font-medium">
                EMERGENCY - Immediate attention required
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Current Assignment Status */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 
            id="guard-profile-description"
            className="font-medium text-gray-900 mb-2"
          >
            Current Assignment
          </h3>
          {guard.assignedActivity ? (
            <div className="text-sm text-gray-700">
              <p>Activity #{guard.assignedActivity} - {guard.status}</p>
              <p className="text-xs text-gray-500 mt-1">Updated {formatTimeAgo(guard.lastUpdate)}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active assignment</p>
          )}
        </div>

        {/* Communication Quick Actions */}
        <div className="px-6 py-4 border-b">
          <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              className="justify-start h-9 text-sm" 
              variant="outline"
              aria-label={`Assign task to ${guard.name}`}
            >
              <Target className="h-4 w-4 mr-2" />
              Assign Task
            </Button>
            <Button 
              className="justify-start h-9 text-sm" 
              variant="outline"
              aria-label={`Send alert to ${guard.name}`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Alert
            </Button>
            <Button 
              className="justify-start h-9 text-sm" 
              variant="outline"
              aria-label={`View ${guard.name} on map`}
            >
              <Eye className="h-4 w-4 mr-2" />
              View on Map
            </Button>
            <Button 
              className="justify-start h-9 text-sm" 
              variant="outline"
              aria-label={`Request backup for ${guard.name}`}
            >
              <Users className="h-4 w-4 mr-2" />
              Request Backup
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto max-h-96">
          <div className="p-6 space-y-4">

            {/* Activity History List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activities
                <Badge className="bg-gray-100 text-gray-800 text-xs">
                  {activities.length}
                </Badge>
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {activities.slice(0, 5).map((activity) => {
                  const priorityConfig = getPriorityConfig(activity.priority);
                  const PriorityIcon = priorityConfig.icon;
                  
                  return (
                    <div 
                      key={activity.id} 
                      className={`border-l-4 pl-3 py-2 rounded-r cursor-pointer hover:bg-gray-50 transition-colors ${
                        activity.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        activity.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${activity.title}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityIcon className={`h-3 w-3 ${
                          activity.priority === 'critical' ? 'text-red-600 animate-pulse' :
                          activity.priority === 'high' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                        <Badge className={`${priorityConfig.badge} text-xs px-1 py-0`}>
                          {activity.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatTimeAgo(activity.time)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold mb-1">{activity.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{activity.location}</span>
                      </div>
                      <div className="mt-1">
                        <Badge className={`${getStatusColor(activity.status)} text-xs px-1 py-0`}>
                          {activity.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          {/* Expandable Section: Active Incidents */}
          <Collapsible open={expandedSections.incidents} onOpenChange={() => toggleSection('incidents')}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto"
                aria-expanded={expandedSections.incidents}
                aria-controls="incidents-content"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Active Incidents</span>
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    {activeIncidents.length}
                  </Badge>
                </div>
                {expandedSections.incidents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2" id="incidents-content">
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {activeIncidents.length > 0 ? (
                    activeIncidents.map((activity) => {
                      const priorityConfig = getPriorityConfig(activity.priority);
                      const PriorityIcon = priorityConfig.icon;
                      
                      return (
                        <div key={activity.id} className={`border-l-4 pl-3 py-2 rounded-r ${
                          activity.priority === 'critical' ? 'border-red-500 bg-red-50' :
                          activity.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                          'border-blue-500 bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <PriorityIcon className={`h-3 w-3 ${
                              activity.priority === 'critical' ? 'text-red-600 animate-pulse' :
                              activity.priority === 'high' ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                            <Badge className={`${priorityConfig.badge} text-xs px-1 py-0`}>
                              {activity.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-auto">
                              {formatTimeAgo(activity.time)}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold mb-1">{activity.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.location}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No active incidents</p>
                  )}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Expandable Section: Radio Traffic */}
          <Collapsible open={expandedSections.radio} onOpenChange={() => toggleSection('radio')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Radio Traffic</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {radioMessages.length}
                  </Badge>
                </div>
                {expandedSections.radio ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {radioMessages.slice(0, 6).map((message) => (
                    <div key={message.id} className={`p-2 rounded border-l-4 ${
                      message.type === 'emergency' ? 'border-red-500 bg-red-50' :
                      message.type === 'outgoing' ? 'border-blue-500 bg-blue-50' :
                      message.type === 'system' ? 'border-yellow-500 bg-yellow-50' :
                      'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={`text-xs px-1 py-0 ${
                          message.type === 'emergency' ? 'bg-red-100 text-red-800' :
                          message.type === 'outgoing' ? 'bg-blue-100 text-blue-800' :
                          message.type === 'system' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {message.channel}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(message.time)}</span>
                      </div>
                      <div className="text-xs mb-1">
                        <span className="font-semibold">{message.from}</span>
                        <ArrowRight className="h-2 w-2 inline mx-1" />
                        <span className="font-semibold">{message.to}</span>
                      </div>
                      <p className="text-xs text-gray-800 leading-tight">{message.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Expandable Section: Performance Metrics */}
          <Collapsible open={expandedSections.metrics} onOpenChange={() => toggleSection('metrics')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Today's Metrics</span>
                </div>
                {expandedSections.metrics ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="text-lg font-bold text-orange-700">{activeIncidents.length}</div>
                    <div className="text-xs text-orange-600">Active</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-lg font-bold text-green-700">{completedToday.length}</div>
                    <div className="text-xs text-green-600">Complete</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-lg font-bold text-blue-700">2.3m</div>
                    <div className="text-xs text-blue-600">Avg Response</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Response Time Target</span>
                    <span className="font-medium">85% within 3m</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500 uppercase tracking-wide mb-1">Radio</div>
                    <div className="flex items-center gap-1">
                      <Radio className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{guard.radio}</span>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 uppercase tracking-wide mb-1">Last Update</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <span className="font-medium">{formatTimeAgo(guard.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Expandable Section: Status History */}
          <Collapsible open={expandedSections.status} onOpenChange={() => toggleSection('status')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Recent Status</span>
                </div>
                {expandedSections.status ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {statusUpdates.map((update) => (
                    <div key={update.id} className="border-l-2 border-gray-300 pl-2 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium capitalize">{update.status}</span>
                        <span className="text-xs text-gray-500">{formatTime(update.time)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{update.location}</div>
                      {update.note && (
                        <div className="text-xs text-gray-700 italic">{update.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}