import React, { useState, useEffect, useMemo } from 'react';
import { Card as _Card, CardContent as _CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Radio,
  Shield,
  AlertTriangle,
  Clock as _Clock,
  MapPin,
  User as _User,
  Activity,
  MessageCircle,
  Phone as _Phone,
  ExternalLink,
  Play,
  Volume2,
  Zap,
  Eye,
  Users as _Users,
  Building,
  Camera,
  Mic as _Mic,
  CheckCircle,
  XCircle as _XCircle,
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

// Combined entry type for chronological merging
interface CombinedEntry {
  id: string;
  timestamp: Date;
  entryType: 'timeline' | 'communication';
  priority: 'critical' | 'high' | 'medium' | 'low';
  data: TimelineEntry | CommunicationEntry;
}

interface CommunicationsPanelProps {
  className?: string;
  onOpenModal?: () => void;
  onOpenFullPage?: () => void;
  activities?: any[];
  showAllTab?: boolean; // Control whether to show the "All" tab
  defaultTab?: 'timeline' | 'communications' | 'all';
}

// Mock data generators (reusing from Timeline.tsx)
const generateIncidentData = (): TimelineEntry[] => [
  {
    id: 'inc-001',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'incident',
    source: 'ambient_ai',
    priority: 'critical',
    title: 'Tailgating Detection',
    description: 'Unauthorized person following authorized badge holder',
    location: 'Seattle Distribution Hub - Fulfillment Center A - Receiving Area',
    confidence: 94,
    evidence: [
      { type: 'video', url: '/evidence/tailgate-001.mp4', thumbnail: '/thumbnails/tailgate-001.jpg' }
    ],
    metadata: {
      badgeHolder: 'Johnson, Mark (EMP-4521)',
      cameraId: 'CAM-SEA-001',
      detectionModel: 'Tailgate-v3.2',
      site: 'Seattle Distribution Hub'
    }
  },
  {
    id: 'inc-002',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    type: 'access',
    source: 'lenel',
    priority: 'critical',
    title: 'Critical System Alert - Data Center',
    description: 'Unauthorized access attempt to server room, multiple failed biometric scans',
    location: 'Denver Regional Center - Data Center - Server Room 1',
    actor: 'Unknown Individual',
    metadata: {
      failedAttempts: 5,
      accessLevel: 'None',
      requiredLevel: 'Critical-Admin',
      site: 'Denver Regional Center',
      lockdownTriggered: true
    }
  },
  {
    id: 'inc-003',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    type: 'system',
    source: 'system',
    priority: 'high',
    title: 'Hazmat Containment Alert',
    description: 'Chemical sensor detected elevated levels, containment protocols activated',
    location: 'Atlanta Distribution Center - Hazmat Processing Center - Containment Area 1',
    confidence: 97,
    evidence: [
      { type: 'image', url: '/evidence/hazmat-001.jpg', thumbnail: '/thumbnails/hazmat-001.jpg' }
    ],
    metadata: {
      chemicalType: 'Class 3 Flammable',
      sensorReading: '850 ppm',
      safetyThreshold: '500 ppm',
      site: 'Atlanta Distribution Center',
      emergencyResponse: 'Active'
    }
  },
  {
    id: 'inc-004',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    type: 'ai_detection',
    source: 'ambient_ai',
    priority: 'medium',
    title: 'Equipment Malfunction Detection',
    description: 'Manufacturing equipment operating outside normal parameters',
    location: 'Chicago Processing Facility - Manufacturing Plant A - Assembly Line 1',
    confidence: 85,
    evidence: [
      { type: 'video', url: '/evidence/equipment-001.mp4', thumbnail: '/thumbnails/equipment-001.jpg' }
    ],
    metadata: {
      equipmentId: 'ASM-LINE-001',
      anomalyType: 'Vibration Pattern',
      site: 'Chicago Processing Facility',
      maintenanceScheduled: false
    }
  }
];

const generateCommunicationData = (): CommunicationEntry[] => [
  {
    id: 'comm-001',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    type: 'voice',
    channel: 'emergency',
    from: 'Garcia, M.',
    content: 'Code Red - Responding to Denver Data Center breach, all available units converge',
    location: 'Denver Regional Center - Security Office',
    transcriptionConfidence: 98,
    hasAudio: true,
    priority: 'critical',
    activityId: 'inc-002',
    status: 'active'
  },
  {
    id: 'comm-002',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'ai_response',
    channel: 'emergency',
    from: 'AI Assistant',
    to: 'All Security Units',
    content: 'ALERT: Lockdown protocols activated. Server room secured. Suspect containment in progress.',
    priority: 'critical',
    activityId: 'inc-002',
    status: 'active'
  },
  {
    id: 'comm-003',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    type: 'voice',
    channel: 'main',
    from: 'Davis, K.',
    content: 'Atlanta Hazmat situation under control, evacuation zone secured, awaiting HazMat team',
    location: 'Atlanta Distribution Center - Command Post',
    transcriptionConfidence: 94,
    hasAudio: true,
    priority: 'high',
    activityId: 'inc-003',
    status: 'active'
  },
  {
    id: 'comm-004',
    timestamp: new Date(Date.now() - 6 * 60 * 1000),
    type: 'text',
    channel: 'dispatch',
    from: 'Regional Dispatch',
    to: 'Seattle Hub',
    content: 'Tailgating incident Seattle FC-A under investigation. Review all entry logs past 2 hours.',
    priority: 'high',
    activityId: 'inc-001',
    status: 'active'
  },
  {
    id: 'comm-005',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    type: 'voice',
    channel: 'main',
    from: 'Martinez, A.',
    content: 'Chicago manufacturing line shutdown complete, maintenance team notified',
    location: 'Chicago Processing Facility - Plant Control Room',
    transcriptionConfidence: 91,
    hasAudio: true,
    priority: 'medium',
    activityId: 'inc-004',
    status: 'resolved'
  },
  {
    id: 'comm-006',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    type: 'voice',
    channel: 'main',
    from: 'Brown, T.',
    content: 'Miami container yard sweep complete, unknown vehicle departed, no security concerns',
    location: 'Miami Fulfillment Hub - Guard Station 3',
    transcriptionConfidence: 89,
    hasAudio: true,
    priority: 'low',
    status: 'resolved'
  }
];

export function CommunicationsPanel({ 
  className = '', 
  onOpenModal, 
  showAllTab = true,
  defaultTab = 'timeline'
}: CommunicationsPanelProps) {
  const [incidentData, setIncidentData] = useState<TimelineEntry[]>(generateIncidentData());
  const [communicationData, setCommunicationData] = useState<CommunicationEntry[]>(generateCommunicationData());
  const [activeTab, setActiveTab] = useState<'timeline' | 'communications' | 'all'>(defaultTab);
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

  // Combined chronological feed
  const combinedEntries = useMemo(() => {
    const combined: CombinedEntry[] = [
      ...filteredIncidents.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        entryType: 'timeline' as const,
        priority: item.priority,
        data: item
      })),
      ...filteredCommunications.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        entryType: 'communication' as const,
        priority: item.priority,
        data: item
      }))
    ];

    // Sort by timestamp (newest first)
    return combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filteredIncidents, filteredCommunications]);

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

  const renderIncidentCard = (incident: TimelineEntry, isEmbedded = false) => (
    <div key={incident.id} className={`relative border-l-4 ${getPriorityColor(incident.priority)} rounded-r-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white ${isEmbedded ? 'ml-4' : ''}`}>
      {/* Priority stripe */}
      <div className={`absolute top-0 right-0 w-1 h-full ${incident.priority === 'critical' ? 'bg-red-500' : incident.priority === 'high' ? 'bg-orange-500' : incident.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
      
      {/* Header with source badge */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded-lg ${incident.priority === 'critical' ? 'bg-red-100' : incident.priority === 'high' ? 'bg-orange-100' : incident.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {getSourceIcon(incident.source, incident.type)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">{incident.title}</div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {incident.source.replace('_', ' ').toUpperCase()}
                </Badge>
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

        <p className="text-sm text-gray-700 mb-2 leading-relaxed">{incident.description}</p>

        {/* Enhanced metadata section */}
        <div className="space-y-1.5">
          {/* Site and Location */}
          <div className="flex items-center flex-wrap gap-1 text-xs text-gray-600">
            {incident.metadata?.site && (
              <div className="flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                <Building className="h-3 w-3 text-purple-600" />
                <span className="font-medium text-purple-800">{incident.metadata.site}</span>
              </div>
            )}
            {incident.location && (
              <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{incident.location.split(' - ').slice(-2).join(' - ')}</span>
              </div>
            )}
            {incident.confidence && (
              <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                <Zap className="h-3 w-3" />
                <span className="font-medium">{incident.confidence}% Confidence</span>
              </div>
            )}
          </div>

          {/* Evidence */}
          {incident.evidence && incident.evidence.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">Evidence:</span>
              <div className="flex gap-1">
                {incident.evidence.map((evidence, idx) => (
                  <Button key={idx} variant="ghost" size="sm" className="h-6 px-1.5 text-xs bg-blue-50 hover:bg-blue-100">
                    {evidence.type === 'video' && <Play className="h-2 w-2 mr-1" />}
                    {evidence.type === 'audio' && <Volume2 className="h-2 w-2 mr-1" />}
                    {evidence.type === 'image' && <Camera className="h-2 w-2 mr-1" />}
                    {evidence.type}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCommunicationCard = (comm: CommunicationEntry, isEmbedded = false) => (
    <div key={comm.id} className={`relative border-l-4 ${getPriorityColor(comm.priority)} rounded-r-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white ${isEmbedded ? 'ml-4' : ''}`}>
      {/* AI Assistant indicator */}
      {comm.from === 'AI Assistant' && (
        <div className="absolute top-1 right-1 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
          AI
        </div>
      )}
      
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className={`h-6 w-6 ${comm.from === 'AI Assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <AvatarFallback className="text-xs font-medium">
                {comm.from === 'AI Assistant' ? '🤖' : comm.from.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{comm.from}</div>
              {comm.to && (
                <div className="text-xs text-gray-500">to {comm.to}</div>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {comm.channel.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {comm.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1">
              {comm.hasAudio && (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 bg-green-50 hover:bg-green-100">
                  <Play className="h-2 w-2 text-green-600" />
                </Button>
              )}
              <span className="text-xs font-medium text-gray-600">{formatTime(comm.timestamp)}</span>
            </div>
            <span className="text-xs text-gray-400">{formatTimeAgo(comm.timestamp)}</span>
          </div>
        </div>

        {/* Message content with enhanced styling */}
        <div className={`${comm.from === 'AI Assistant' ? 'bg-blue-50 border-l-2 border-blue-200' : 'bg-gray-50 border-l-2 border-gray-200'} rounded-r-lg p-2 mb-2`}>
          <p className="text-sm leading-relaxed">
            <span className="text-gray-600">"</span>
            <span className="font-medium">{comm.content}</span>
            <span className="text-gray-600">"</span>
          </p>
        </div>

        {/* Enhanced footer with status indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {comm.location && (
              <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                <MapPin className="h-2 w-2" />
                <span className="font-medium">{comm.location}</span>
              </div>
            )}
            {comm.transcriptionConfidence && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700">
                {Math.round(comm.transcriptionConfidence)}% accurate
              </Badge>
            )}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${comm.status === 'active' ? 'bg-green-50 text-green-700' : comm.status === 'resolved' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
              <div className={`w-1 h-1 rounded-full ${comm.status === 'active' ? 'bg-green-500' : comm.status === 'resolved' ? 'bg-blue-500' : 'bg-gray-500'}`} />
              <span className="font-medium capitalize">{comm.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {comm.activityId && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                → {comm.activityId}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCombinedCard = (entry: CombinedEntry) => {
    if (entry.entryType === 'timeline') {
      return renderIncidentCard(entry.data as TimelineEntry, true);
    } else {
      return renderCommunicationCard(entry.data as CommunicationEntry, true);
    }
  };

  const getCriticalCount = () => {
    const criticalIncidents = filteredIncidents.filter(i => i.priority === 'critical').length;
    const criticalComms = filteredCommunications.filter(c => c.priority === 'critical').length;
    return criticalIncidents + criticalComms;
  };

  const getTabsList = () => {
    const tabs = [
      {
        value: 'timeline',
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Timeline',
        count: filteredIncidents.length
      },
      {
        value: 'communications',
        icon: <Radio className="h-4 w-4" />,
        label: 'Communications',  
        count: filteredCommunications.length
      }
    ];

    if (showAllTab) {
      tabs.push({
        value: 'all',
        icon: <Activity className="h-4 w-4" />,
        label: 'All',
        count: combinedEntries.length
      });
    }

    return tabs;
  };

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Communications Hub</h3>
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

        {/* Enhanced Filter Controls */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          {/* Time Filter Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">Time:</span>
            {(['15m', '1h', '4h', '24h'] as const).map(period => (
              <Button
                key={period}
                variant={timeFilter === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(period)}
                className="h-8 px-3 text-sm"
              >
                {period}
              </Button>
            ))}
          </div>

          {/* Priority & Channel Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Priority:</span>
              <div className="flex gap-1">
                {['critical', 'high', 'medium', 'low'].map(priority => (
                  <Button
                    key={priority}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    title={`Filter ${priority} priority`}
                  >
                    {priority.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Channel:</span>
              <div className="flex gap-1">
                {['Main', 'Emergency', 'Dispatch'].map(channel => (
                  <Button
                    key={channel}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    title={`Filter ${channel} channel`}
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className={`grid w-full ${showAllTab ? 'grid-cols-3' : 'grid-cols-2'} mx-4 mt-3`}>
          {getTabsList().map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              <Badge variant="secondary" className="text-xs">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 mt-4">
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
                filteredIncidents.map(incident => renderIncidentCard(incident))
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
              <span className="font-medium">RADIO COMMUNICATIONS</span>
            </div>
            <div className="text-sm text-gray-500">
              Radio traffic, dispatches, and AI-generated responses
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-0">
              {filteredCommunications.length > 0 ? (
                filteredCommunications.map(comm => renderCommunicationCard(comm))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="font-medium">No communications in selected timeframe</div>
                  <div className="text-sm">Radio channels are quiet</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* All Tab - Chronological Combined Feed */}
        {showAllTab && (
          <TabsContent value="all" className="flex-1 mt-4">
            <div className="px-4 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">UNIFIED CHRONOLOGICAL FEED</span>
              </div>
              <div className="text-sm text-gray-500">
                All incidents and communications merged chronologically
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-0">
                {combinedEntries.length > 0 ? (
                  combinedEntries.map(entry => renderCombinedCard(entry))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div className="font-medium">No activity in selected timeframe</div>
                    <div className="text-sm">All systems quiet</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}