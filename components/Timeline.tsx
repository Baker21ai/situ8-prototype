import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Radio,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Activity,
  MessageCircle,
  Phone,
  ExternalLink,
  Play,
  Volume2,
  Zap,
  Eye,
  Users,
  Building,
  Camera,
  ChevronDown,
  ChevronRight,
  Mic,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// Enhanced data interfaces
interface TimelineEntry {
  id: string;
  timestamp: Date;
  type: 'incident' | 'communication' | 'system' | 'access' | 'ai_detection';
  source: 'ambient_ai' | 'lenel' | 'radio' | 'chat' | 'system';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location?: string;
  actor?: string; // Guard, system, etc.
  confidence?: number;
  evidence?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbnail?: string;
  }[];
  relatedActivities?: string[];
  metadata?: Record<string, any>;
}

interface CommunicationEntry {
  id: string;
  timestamp: Date;
  type: 'voice' | 'text' | 'ai_response';
  channel: 'main' | 'emergency' | 'dispatch';
  from: string;
  to?: string;
  content: string;
  location?: string;
  transcriptionConfidence?: number;
  hasAudio?: boolean;
  threadId?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  activityId?: string;
  status: 'active' | 'resolved' | 'archived';
}

interface TimelineProps {
  className?: string;
  onOpenModal?: () => void;
  onOpenFullPage?: () => void;
  activities?: any[];
}

// Mock data generators
const generateIncidentData = (): TimelineEntry[] => [
  {
    id: 'inc-001',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'incident',
    source: 'ambient_ai',
    priority: 'critical',
    title: 'Tailgating Detection',
    description: 'Unauthorized person following authorized badge holder',
    location: 'Building A - East Entrance',
    confidence: 94,
    evidence: [
      { type: 'video', url: '/evidence/tailgate-001.mp4', thumbnail: '/thumbnails/tailgate-001.jpg' }
    ],
    metadata: {
      badgeHolder: 'Johnson, Mark (EMP-4521)',
      cameraId: 'CAM-AE-001',
      detectionModel: 'Tailgate-v3.2'
    }
  },
  {
    id: 'inc-002',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    type: 'access',
    source: 'lenel',
    priority: 'high',
    title: 'Access Denied - Multiple Attempts',
    description: 'Badge ID 7821 attempted entry 3 times, access denied',
    location: 'Building B - Server Room',
    actor: 'Martinez, Ana (EMP-7821)',
    metadata: {
      badgeId: '7821',
      attempts: 3,
      accessLevel: 'Standard',
      requiredLevel: 'IT-Admin'
    }
  },
  {
    id: 'inc-003',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    type: 'ai_detection',
    source: 'ambient_ai',
    priority: 'medium',
    title: 'Unusual Behavior Pattern',
    description: 'Person loitering in parking area for extended period',
    location: 'Parking Lot - Zone P-3',
    confidence: 78,
    evidence: [
      { type: 'image', url: '/evidence/loiter-001.jpg', thumbnail: '/thumbnails/loiter-001.jpg' }
    ]
  }
];

const generateCommunicationData = (): CommunicationEntry[] => [
  {
    id: 'comm-001',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    type: 'voice',
    channel: 'main',
    from: 'Garcia, M.',
    content: 'Responding to Building A tailgating alert, ETA 2 minutes',
    location: 'Building A - Lobby',
    transcriptionConfidence: 96,
    hasAudio: true,
    priority: 'high',
    activityId: 'inc-001',
    status: 'active'
  },
  {
    id: 'comm-002',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    type: 'ai_response',
    channel: 'main',
    from: 'AI Assistant',
    to: 'Garcia, M.',
    content: 'Alert escalated. Subject identified via facial recognition. Dispatching backup.',
    priority: 'medium',
    activityId: 'inc-001',
    status: 'active'
  },
  {
    id: 'comm-003',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    type: 'text',
    channel: 'dispatch',
    from: 'Dispatch',
    to: 'All Units',
    content: 'Security Level 2 - Restrict access to Building A until further notice',
    priority: 'high',
    status: 'active'
  },
  {
    id: 'comm-004',
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    type: 'voice',
    channel: 'main',
    from: 'Chen, L.',
    content: 'Patrol complete, all clear in Building B, Zones 1-4',
    location: 'Building B - Zone 4',
    transcriptionConfidence: 92,
    hasAudio: true,
    priority: 'low',
    status: 'resolved'
  }
];

export function Timeline({ className = '', onOpenModal, onOpenFullPage, activities = [] }: TimelineProps) {
  // Convert enterprise activities to timeline format
  const [incidentData, setIncidentData] = useState<TimelineEntry[]>(() => {
    if (activities.length > 0) {
      return activities.slice(0, 50).map((activity: any) => ({
        id: activity.id,
        timestamp: activity.timestamp,
        type: 'incident',
        source: 'system',
        priority: activity.priority,
        title: activity.title,
        description: activity.description || '',
        location: activity.location,
        confidence: activity.confidence || 85,
        metadata: activity.metadata || {}
      }));
    }
    return generateIncidentData();
  });
  const [communicationData, setCommunicationData] = useState<CommunicationEntry[]>(generateCommunicationData());
  const [activeTab, setActiveTab] = useState<'incidents' | 'communications'>('incidents');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<'15m' | '1h' | '4h' | '24h'>('1h');

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // Add new communication
        const newComm: CommunicationEntry = {
          id: `comm-${Date.now()}`,
          timestamp: new Date(),
          type: Math.random() > 0.8 ? 'ai_response' : 'voice',
          channel: 'main',
          from: ['Garcia, M.', 'Chen, L.', 'Wilson, R.', 'AI Assistant'][Math.floor(Math.random() * 4)],
          content: [
            'Sector clear, continuing patrol',
            'Visitor escort completed',
            'Checking perimeter fence',
            'All systems operational'
          ][Math.floor(Math.random() * 4)],
          location: ['Building A', 'Building B', 'Parking Lot', 'Perimeter'][Math.floor(Math.random() * 4)],
          transcriptionConfidence: 85 + Math.random() * 15,
          hasAudio: Math.random() > 0.3,
          priority: 'low',
          status: 'active'
        };
        setCommunicationData(prev => [newComm, ...prev.slice(0, 19)]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter data based on time range
  const filteredIncidents = useMemo(() => {
    const timeRanges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    const cutoff = new Date(Date.now() - timeRanges[timeFilter]);
    return incidentData.filter(item => item.timestamp >= cutoff);
  }, [incidentData, timeFilter]);

  const filteredCommunications = useMemo(() => {
    const timeRanges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    const cutoff = new Date(Date.now() - timeRanges[timeFilter]);
    return communicationData.filter(item => item.timestamp >= cutoff);
  }, [communicationData, timeFilter]);

  // Utility functions
  const formatTime = (date: Date) => {
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
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSourceIcon = (source: string, type?: string) => {
    switch (source) {
      case 'ambient_ai': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'lenel': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'radio': return <Radio className="h-4 w-4 text-green-600" />;
      case 'chat': return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'system': return <Activity className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderIncidentCard = (incident: TimelineEntry) => (
    <div key={incident.id} className={`relative border-l-4 ${getPriorityColor(incident.priority)} rounded-r-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white`}>
      {/* Priority stripe */}
      <div className={`absolute top-0 right-0 w-1 h-full ${incident.priority === 'critical' ? 'bg-red-500' : incident.priority === 'high' ? 'bg-orange-500' : incident.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
      
      {/* Header with source badge */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${incident.priority === 'critical' ? 'bg-red-100' : incident.priority === 'high' ? 'bg-orange-100' : incident.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {getSourceIcon(incident.source, incident.type)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-base mb-1">{incident.title}</div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {incident.source.replace('_', ' ').toUpperCase()}
                </Badge>
                {incident.metadata?.site && (
                  <Badge className="text-xs px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-800">
                    {incident.metadata.site}
                  </Badge>
                )}
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {incident.type}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1">
              {getPriorityIcon(incident.priority)}
              <span className="text-xs font-medium text-gray-600 uppercase">
                {incident.priority}
              </span>
            </div>
            <span className="text-xs text-gray-500">{formatTime(incident.timestamp)}</span>
            <span className="text-xs text-gray-400">{formatTimeAgo(incident.timestamp)}</span>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{incident.description}</p>

        {/* Enhanced metadata section */}
        <div className="space-y-2">
          {/* Location and Actor */}
          <div className="flex items-center flex-wrap gap-4 text-xs text-gray-600">
            {incident.location && (
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{incident.location}</span>
              </div>
            )}
            {incident.actor && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                <User className="h-3 w-3" />
                <span className="font-medium">{incident.actor}</span>
              </div>
            )}
            {incident.confidence && (
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                <Zap className="h-3 w-3" />
                <span className="font-medium">{incident.confidence}% Confidence</span>
              </div>
            )}
          </div>

          {/* Evidence */}
          {incident.evidence && incident.evidence.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Evidence:</span>
              <div className="flex gap-1">
                {incident.evidence.map((evidence, idx) => (
                  <Button key={idx} variant="ghost" size="sm" className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100">
                    {evidence.type === 'video' && <Play className="h-3 w-3 mr-1" />}
                    {evidence.type === 'audio' && <Volume2 className="h-3 w-3 mr-1" />}
                    {evidence.type === 'image' && <Camera className="h-3 w-3 mr-1" />}
                    {evidence.type}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Technical details */}
          {incident.metadata && Object.keys(incident.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs border">
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(incident.metadata).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <span className="font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCommunicationCard = (comm: CommunicationEntry) => (
    <div key={comm.id} className={`relative border-l-4 ${getPriorityColor(comm.priority)} rounded-r-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white`}>
      {/* AI Assistant indicator */}
      {comm.from === 'AI Assistant' && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
          AI
        </div>
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className={`h-8 w-8 ${comm.from === 'AI Assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <AvatarFallback className="text-sm font-medium">
                {comm.from === 'AI Assistant' ? '🤖' : comm.from.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-base">{comm.from}</div>
              {comm.to && (
                <div className="text-xs text-gray-500">to {comm.to}</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {comm.channel.toUpperCase()}
                </Badge>
                {comm.location && (
                  <Badge className="text-xs px-2 py-0.5 bg-purple-50 border-purple-200 text-purple-800">
                    {comm.location.split(' - ')[0]} {/* Extract site name from location */}
                  </Badge>
                )}
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {comm.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              {comm.hasAudio && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-green-50 hover:bg-green-100">
                  <Play className="h-3 w-3 text-green-600" />
                </Button>
              )}
              <span className="text-xs font-medium text-gray-600">{formatTime(comm.timestamp)}</span>
            </div>
            <span className="text-xs text-gray-400">{formatTimeAgo(comm.timestamp)}</span>
          </div>
        </div>

        {/* Message content with enhanced styling */}
        <div className={`${comm.from === 'AI Assistant' ? 'bg-blue-50 border-l-2 border-blue-200' : 'bg-gray-50 border-l-2 border-gray-200'} rounded-r-lg p-3 mb-3`}>
          <p className="text-sm leading-relaxed">
            <span className="text-gray-600">\\"</span>
            <span className="font-medium">{comm.content}</span>
            <span className="text-gray-600">\\"</span>
          </p>
        </div>

        {/* Enhanced footer with status indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {comm.location && (
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{comm.location}</span>
              </div>
            )}
            {comm.transcriptionConfidence && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-50 text-green-700">
                {Math.round(comm.transcriptionConfidence)}% accurate
              </Badge>
            )}
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${comm.status === 'active' ? 'bg-green-50 text-green-700' : comm.status === 'resolved' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${comm.status === 'active' ? 'bg-green-500' : comm.status === 'resolved' ? 'bg-blue-500' : 'bg-gray-500'}`} />
              <span className="font-medium capitalize">{comm.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {comm.activityId && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                → {comm.activityId}
              </Badge>
            )}
            {comm.threadId && (
              <Badge variant="outline" className="text-xs">
                Thread
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const getCriticalCount = () => {
    const criticalIncidents = filteredIncidents.filter(i => i.priority === 'critical').length;
    const criticalComms = filteredCommunications.filter(c => c.priority === 'critical').length;
    return criticalIncidents + criticalComms;
  };

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Unified Timeline</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Live Feed
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getCriticalCount() > 0 && (
              <Badge className="bg-red-500 text-white">
                {getCriticalCount()} Critical
              </Badge>
            )}
            {onOpenModal && (
              <Button variant="ghost" size="sm" onClick={onOpenModal}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          {(['15m', '1h', '4h', '24h'] as const).map(period => (
            <Button
              key={period}
              variant={timeFilter === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(period)}
              className="h-7 px-3 text-xs"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-3">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
            <Badge variant="secondary" className="text-xs">
              {filteredIncidents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Communications
            <Badge variant="secondary" className="text-xs">
              {filteredCommunications.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="flex-1 mt-4">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">SECURITY INCIDENTS</span>
            </div>
            <div className="text-sm text-gray-500">
              AI detections, access control alerts, and system events
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-0">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map(renderIncidentCard)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="font-medium">No incidents in selected timeframe</div>
                  <div className="text-sm">All systems operating normally</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="flex-1 mt-4">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Radio className="h-4 w-4" />
              <span className="font-medium">RADIO & DISPATCH</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Voice communications and system messages</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-0">
              {filteredCommunications.length > 0 ? (
                filteredCommunications.map(renderCommunicationCard)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="font-medium">No communications in selected timeframe</div>
                  <div className="text-sm">Channel quiet</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <div className="flex-shrink-0 p-4 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1">
            <Mic className="h-4 w-4 mr-2" />
            Push to Talk
          </Button>
          {onOpenFullPage && (
            <Button size="sm" variant="outline" onClick={onOpenFullPage}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}