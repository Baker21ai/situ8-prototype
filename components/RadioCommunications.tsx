import React, { useState, useEffect } from 'react';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator as _Separator } from './ui/separator';
import { Avatar as _Avatar, AvatarFallback as _AvatarFallback } from './ui/avatar';
import { ActivityCard } from './organisms/ActivityCard';
import { ActivityData, EnterpriseActivity, ActivityCluster } from '@/lib/types/activity';
import { mockActivities, getActivitiesByTime } from './mockActivityData';
import { CommunicationControls } from './shared/CommunicationControls';
import { useCommunications } from '@/hooks/useCommunications';
import { 
  Radio, 
  Mic, 
  Phone as _Phone, 
  MessageCircle, 
  Activity, 
  AlertTriangle, 
  Shield as _Shield, 
  Clock, 
  MapPin, 
  ChevronDown,
  Play,
  ExternalLink,
  Headphones,
  Filter
} from 'lucide-react';

interface RadioMessage {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  location: string;
  channel: 'main' | 'emergency' | 'telegram';
  type: 'voice' | 'text' | 'ai_response';
  content: string;
  transcriptionConfidence?: number;
  activityId?: string;
  activityType?: string;
  threadId?: string;
  isConverted?: boolean;
  originalType?: string;
  status?: 'pending' | 'processed' | 'converted';
  hasAudio?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface Guard {
  id: string;
  name: string;
  status: 'available' | 'responding' | 'investigating' | 'break' | 'offline';
  location: string;
  lastSeen: string;
  channel: string;
}

interface RadioCommunicationsProps {
  className?: string;
  showHeader?: boolean;
  isModal?: boolean;
  onOpenModal?: () => void;
  onOpenFullPage?: () => void;
  activities?: ActivityData[];
}

// Mock data
const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Medical emergency resolved, patient stable',
    transcriptionConfidence: 0.95,
    activityId: 'ACT-0578',
    activityType: 'medical',
    isConverted: true,
    originalType: 'radio_communication',
    status: 'converted',
    hasAudio: true,
    priority: 'high'
  },
  {
    id: 'msg-002',
    timestamp: '14:34',
    guardId: 'ai-assistant',
    guardName: 'AI Assistant → Garcia',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Acknowledged. Incident marked resolved.',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-003',
    timestamp: '14:32',
    guardId: 'chen-l',
    guardName: 'Chen, L.',
    location: 'Building B',
    channel: 'main',
    type: 'voice',
    content: 'Routine patrol complete, sectors 3-5 clear',
    transcriptionConfidence: 0.92,
    activityId: 'ACT-0577',
    activityType: 'patrol',
    status: 'converted',
    hasAudio: true,
    priority: 'low'
  },
  {
    id: 'msg-004',
    timestamp: '14:30',
    guardId: 'wilson-r',
    guardName: 'Wilson, R.',
    location: 'Parking Lot',
    channel: 'main',
    type: 'voice',
    content: 'Suspicious vehicle, license ABC-123',
    transcriptionConfidence: 0.88,
    activityId: 'ACT-0576',
    activityType: 'security',
    isConverted: true,
    originalType: 'radio_communication',
    status: 'converted',
    hasAudio: true,
    priority: 'high',
    threadId: 'thread-001'
  },
  {
    id: 'msg-005',
    timestamp: '14:31',
    guardId: 'ai-assistant',
    guardName: 'AI',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Running plate check...',
    threadId: 'thread-001',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-006',
    timestamp: '14:32',
    guardId: 'ai-assistant',
    guardName: 'AI',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'No BOL match. Log details?',
    threadId: 'thread-001',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-007',
    timestamp: '14:33',
    guardId: 'wilson-r',
    guardName: 'Wilson',
    location: 'Parking Lot',
    channel: 'main',
    type: 'voice',
    content: 'Logging with photos',
    transcriptionConfidence: 0.96,
    threadId: 'thread-001',
    hasAudio: true,
    priority: 'medium'
  }
];

const mockGuards: Guard[] = [
  { id: 'garcia-m', name: 'Garcia, M.', status: 'investigating', location: 'Building A', lastSeen: '14:36', channel: 'main' },
  { id: 'chen-l', name: 'Chen, L.', status: 'available', location: 'Building B', lastSeen: '14:32', channel: 'main' },
  { id: 'wilson-r', name: 'Wilson, R.', status: 'responding', location: 'Parking Lot', lastSeen: '14:33', channel: 'main' },
  { id: 'davis-k', name: 'Davis, K.', status: 'break', location: 'Building C', lastSeen: '14:20', channel: 'main' },
  { id: 'smith-j', name: 'Smith, J.', status: 'offline', location: 'Building A', lastSeen: '13:45', channel: 'main' }
];

interface TimelineEvent {
  id: string;
  time: Date;
  event: string;
  type: 'response' | 'alert' | 'completion' | 'incident' | 'assignment' | 'status_change';
  guardName?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Mock timeline events
const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl-001',
    time: new Date(Date.now() - 2 * 60 * 1000),
    event: 'Garcia, M. responded to Building A alert',
    type: 'response',
    guardName: 'Garcia, M.',
    location: 'Building A',
    priority: 'high'
  },
  {
    id: 'tl-002',
    time: new Date(Date.now() - 4 * 60 * 1000),
    event: 'Critical alert: Unauthorized entry detected',
    type: 'alert',
    location: 'Building A - Floor 3',
    priority: 'critical'
  },
  {
    id: 'tl-003',
    time: new Date(Date.now() - 8 * 60 * 1000),
    event: 'Wilson, R. assigned to suspicious vehicle investigation',
    type: 'assignment',
    guardName: 'Wilson, R.',
    location: 'Parking Lot',
    priority: 'medium'
  },
  {
    id: 'tl-004',
    time: new Date(Date.now() - 12 * 60 * 1000),
    event: 'Chen, L. completed patrol round',
    type: 'completion',
    guardName: 'Chen, L.',
    location: 'Building B',
    priority: 'low'
  },
  {
    id: 'tl-005',
    time: new Date(Date.now() - 19 * 60 * 1000),
    event: 'Medical emergency reported in Building C',
    type: 'incident',
    location: 'Building C - Lobby',
    priority: 'critical'
  }
];

export function RadioCommunications({ 
  className = "", 
  isModal = false,
  onOpenModal,
  onOpenFullPage,
  activities = mockActivities 
}: RadioCommunicationsProps) {
  const { 
    messages, 
    guards, 
    activeChannel, 
    setActiveChannel, 
    playAudio, 
    playingMessage 
  } = useCommunications();
  
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [activeTab, setActiveTab] = useState<string>('communications');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);


  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'responding': return 'text-blue-600';
      case 'investigating': return 'text-orange-600';
      case 'break': return 'text-yellow-600';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const _getStatusDot = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'responding': return 'bg-blue-500';
      case 'investigating': return 'bg-orange-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      case 'patrol': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const getThreadMessages = (threadId: string) => {
    return messages.filter(msg => msg.threadId === threadId);
  };

  const _formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
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

  const getIncidentMessages = () => {
    return messages.filter(msg => 
      msg.priority === 'critical' || 
      msg.priority === 'high' || 
      msg.activityType === 'medical' ||
      msg.activityType === 'security'
    );
  };

  const handleActivitySelect = (activity: ActivityData | EnterpriseActivity | ActivityCluster) => {
    setSelectedActivity(selectedActivity === activity.id ? null : activity.id);
  };

  const getIncidentActivities = () => {
    return activities.filter(activity => 
      activity.priority === 'critical' || 
      activity.priority === 'high' ||
      activity.type === 'MEDICAL' ||
      activity.type === 'ARMED_PERSON' ||
      activity.type === 'FIRE'
    );
  };

  const getTimelineActivities = () => {
    return getActivitiesByTime(activities).slice(0, 8); // Show recent 8 activities
  };

  const renderMessage = (message: RadioMessage, isThreadMessage = false) => {
    const isAI = message.type === 'ai_response';
    const threadMessages = message.threadId ? getThreadMessages(message.threadId) : [];
    const hasThread = threadMessages.length > 1 && !isThreadMessage;
    const isThreadExpanded = message.threadId ? expandedThreads.has(message.threadId) : false;

    return (
      <div key={message.id} className={`space-y-2 ${isThreadMessage ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
        <div className={`p-3 rounded-lg border-l-4 ${getPriorityColor(message.priority)}`}>
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{message.timestamp}</span>
              <span className="font-semibold">{message.guardName}</span>
              {!isAI && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{message.location}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {message.hasAudio && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => playAudio(message.id)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              {message.transcriptionConfidence && (
                <Badge variant="secondary" className="text-xs px-1">
                  {Math.round(message.transcriptionConfidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Message Content */}
          <div className="mb-2">
            <p className="text-sm italic">"{message.content}"</p>
          </div>
          
          {/* Activity Conversion Display */}
          {message.isConverted && message.activityId && (
            <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
              <span className="text-blue-600">→</span>
              <span className="text-blue-700">Converted to</span>
              <Badge className={getActivityTypeColor(message.activityType)}>
                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)} Activity
              </Badge>
              <span className="text-blue-600">({message.activityId})</span>
            </div>
          )}

          {/* Auto-logging display */}
          {message.activityId && !message.isConverted && (
            <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
              <span className="text-gray-600">→</span>
              <span className="text-gray-700">Auto-logged as</span>
              <Badge className={getActivityTypeColor(message.activityType)}>
                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)} Activity
              </Badge>
            </div>
          )}

          {/* AI Response Styling */}
          {isAI && (
            <div className="flex items-center gap-2 text-xs">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 font-medium">AI Assistant Response</span>
            </div>
          )}
          
          {/* Thread Controls */}
          {hasThread && (
            <div className="mt-2 pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleThread(message.threadId!)}
                className="text-xs h-6 px-2 text-blue-600"
              >
                [View Thread ↓]
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isThreadExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>
        
        {/* Expanded Thread Messages */}
        {hasThread && isThreadExpanded && (
          <div className="space-y-2 ml-4">
            {threadMessages.slice(1).map(threadMsg => (
              <div key={threadMsg.id} className="border-l-2 border-gray-200 pl-3">
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{threadMsg.timestamp}</span>
                    <span className="text-xs font-semibold">{threadMsg.guardName}:</span>
                  </div>
                  <p className="text-xs italic">"{threadMsg.content}"</p>
                  {threadMsg.type === 'ai_response' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Activity className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">AI Response</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const activeGuards = guards.filter(g => g.status !== 'offline');
  const _channelStats = {
    main: { active: activeGuards.length, total: guards.length },
    emergency: { active: 0, total: guards.length },
    telegram: { active: 3, total: guards.length }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Timeline & Communications Hub</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenModal && !isModal && (
              <Button variant="ghost" size="sm" onClick={onOpenModal} title="Open Radio Modal">
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {onOpenFullPage && (
              <Button variant="ghost" size="sm" onClick={onOpenFullPage} title="Communications Page">
                <Radio className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Communications Tab */}
        <TabsContent value="communications" className="flex-1 mt-4">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Radio className="h-4 w-4" />
              <span className="font-medium">RADIO COMMUNICATIONS</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span>Channel: <strong>Main</strong></span>
                <span>Guards: <strong>{activeGuards.length} Active</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Live</span>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3">
              {messages.filter(msg => !msg.threadId || expandedThreads.has(msg.threadId)).map(msg => renderMessage(msg))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="flex-1 mt-4">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">INCIDENT FEED</span>
            </div>
            <div className="text-sm text-gray-500">
              Showing high-priority activities and communications
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3">
              {/* High Priority Activities */}
              {getIncidentActivities().map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  variant="compact"
                  layout="timeline"
                  features={{
                    showPriority: true,
                    showSiteBadge: true,
                    showTime: true
                  }}
                  onClick={handleActivitySelect}
                />
              ))}
              
              {/* High Priority Communications */}
              {getIncidentMessages().map(msg => renderMessage(msg))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 mt-4">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">UNIFIED TIMELINE</span>
            </div>
            <div className="text-sm text-gray-500">
              All system events, activities, and communications
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {/* Recent Activities */}
              {getTimelineActivities().map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  variant="compact"
                  layout="timeline"
                  features={{
                    showPriority: true,
                    showSiteBadge: true,
                    showTime: true
                  }}
                  onClick={handleActivitySelect}
                />
              ))}
              
              {/* System Timeline Events */}
              {timelineEvents.map(event => (
                <div key={event.id} className="border-l-2 border-blue-200 pl-3 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">SYSTEM EVENT</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(event.time)}</span>
                      </div>
                    </div>
                    
                    <div className="font-medium text-sm">{event.event}</div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span>{event.type.toUpperCase()}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Radio Messages in Timeline */}
              {messages.slice(0, 5).map(message => (
                <div key={`timeline-${message.id}`} className="border-l-2 border-green-200 pl-3 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">RADIO MSG</span>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="font-medium text-sm">{message.guardName}: "{message.content}"</div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Radio className="h-3 w-3" />
                      <span>{message.location}</span>
                      {message.activityType && (
                        <>
                          <span>•</span>
                          <span>{message.activityType.toUpperCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Communication Controls Footer */}
      <CommunicationControls
        variant="compact"
        onOpenFullPage={onOpenFullPage}
        showFilters={true}
      />
    </div>
  );
}