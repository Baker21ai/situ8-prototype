import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea as _Textarea } from './ui/textarea';
import { 
  Radio, 
  Mic, 
  Phone, 
  MessageCircle, 
  Activity, 
  AlertTriangle, 
  Shield as _Shield, 
  Clock, 
  MapPin as _MapPin, 
  Search,
  Settings,
  BarChart3,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Users,
  Wifi,
  Bell,
  User,
  LogOut,
  Download,
  Upload as _Upload,
  Filter,
  RefreshCw,
  Send,
  Headphones as _Headphones,
  VolumeX,
  Building,
  Eye,
  FileText as _FileText,
  Calendar as _Calendar,
  TrendingUp as _TrendingUp,
  Database
} from 'lucide-react';

interface CommunicationsPageProps {
  onBackToCommandCenter: () => void;
}

interface Channel {
  id: string;
  name: string;
  type: 'radio' | 'telegram' | 'integrated';
  activeCount: number;
  totalCount: number;
  lastActivity: string;
  status: 'active' | 'standby' | 'offline';
  messageCount: number;
  transcriptionRate: number;
  incidentCount: number;
}

interface Guard {
  id: string;
  name: string;
  status: 'available' | 'responding' | 'investigating' | 'break' | 'offline';
  location: string;
  building: string;
  lastSeen: string;
  channel: string;
  currentTask?: string;
  shiftStart?: string;
  shiftEnd?: string;
}

interface RadioMessage {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  location: string;
  building: string;
  channel: string;
  type: 'voice' | 'text' | 'ai_response';
  content: string;
  transcriptionConfidence?: number;
  activityId?: string;
  activityType?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  hasAudio?: boolean;
  duration?: number;
  isPlaying?: boolean;
  threadId?: string;
  relatedActivities?: string[];
}

interface LocationStats {
  building: string;
  activeGuards: number;
  totalGuards: number;
  guards: Guard[];
}

const mockChannels: Channel[] = [
  { 
    id: 'main', 
    name: 'Main Channel', 
    type: 'radio', 
    activeCount: 12, 
    totalCount: 15, 
    lastActivity: '10s ago', 
    status: 'active',
    messageCount: 156,
    transcriptionRate: 0.89,
    incidentCount: 12
  },
  { 
    id: 'emergency', 
    name: 'Emergency', 
    type: 'radio', 
    activeCount: 0, 
    totalCount: 15, 
    lastActivity: 'Standby', 
    status: 'standby',
    messageCount: 0,
    transcriptionRate: 1.0,
    incidentCount: 0
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    type: 'telegram', 
    activeCount: 3, 
    totalCount: 15, 
    lastActivity: '2m ago', 
    status: 'active',
    messageCount: 45,
    transcriptionRate: 1.0,
    incidentCount: 3
  },
  { 
    id: 'ambient', 
    name: 'Ambient.ai', 
    type: 'integrated', 
    activeCount: 8, 
    totalCount: 10, 
    lastActivity: '1m ago', 
    status: 'active',
    messageCount: 23,
    transcriptionRate: 0.95,
    incidentCount: 8
  },
  { 
    id: 'lenel', 
    name: 'Lenel', 
    type: 'integrated', 
    activeCount: 5, 
    totalCount: 10, 
    lastActivity: '5m ago', 
    status: 'active',
    messageCount: 12,
    transcriptionRate: 0.98,
    incidentCount: 2
  }
];

const mockGuards: Guard[] = [
  { id: 'garcia-m', name: 'Garcia, M.', status: 'investigating', location: 'Lobby', building: 'Building A', lastSeen: '14:36', channel: 'main', currentTask: 'Medical Response', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'wilson-r', name: 'Wilson, R.', status: 'responding', location: 'Section A', building: 'Building A', lastSeen: '14:33', channel: 'main', currentTask: 'Suspicious Vehicle', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'chen-l', name: 'Chen, L.', status: 'available', location: 'Operations Center', building: 'Building B', lastSeen: '14:32', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'davis-k', name: 'Davis, K.', status: 'break', location: 'Research Lobby', building: 'Building B', lastSeen: '14:20', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'smith-j', name: 'Smith, J.', status: 'available', location: 'Reception', building: 'Building A', lastSeen: '14:35', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'johnson-a', name: 'Johnson, A.', status: 'available', location: 'Operations Center', building: 'Building B', lastSeen: '14:30', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'brown-s', name: 'Brown, S.', status: 'available', location: 'Parking Level 1', building: 'Building C', lastSeen: '14:25', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'miller-k', name: 'Miller, K.', status: 'available', location: 'Parking Level 1', building: 'Building C', lastSeen: '14:28', channel: 'main', shiftStart: '06:00', shiftEnd: '18:00' },
  { id: 'taylor-p', name: 'Taylor, P.', status: 'offline', location: 'Building A', building: 'Building A', lastSeen: '13:45', channel: 'main', shiftStart: '18:00', shiftEnd: '06:00' }
];

const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36:22',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Lobby',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Patient stable, paramedics on scene taking over',
    transcriptionConfidence: 0.95,
    activityId: 'ACT-0578',
    activityType: 'medical',
    priority: 'high',
    hasAudio: true,
    duration: 8,
    threadId: 'thread-medical-001',
    relatedActivities: ['ACT-0575', 'ACT-0576']
  },
  {
    id: 'msg-002',
    timestamp: '14:35:02',
    guardId: 'ai-assistant',
    guardName: 'AI Assistant',
    location: 'System',
    building: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Medical incident created. Dispatching backup. ETA for EMS?',
    priority: 'medium',
    threadId: 'thread-medical-001'
  },
  {
    id: 'msg-003',
    timestamp: '14:32:45',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Lobby',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'On scene, elderly male collapsed, unconscious but breathing',
    transcriptionConfidence: 0.92,
    priority: 'critical',
    hasAudio: true,
    duration: 12,
    threadId: 'thread-medical-001'
  },
  {
    id: 'msg-004',
    timestamp: '14:32:15',
    guardId: 'chen-l',
    guardName: 'Chen, L.',
    location: 'Operations Center',
    building: 'Building B',
    channel: 'main',
    type: 'voice',
    content: 'Routine patrol complete, sectors 3-5 clear',
    transcriptionConfidence: 0.88,
    activityId: 'ACT-0577',
    activityType: 'patrol',
    priority: 'low',
    hasAudio: true,
    duration: 6
  },
  {
    id: 'msg-005',
    timestamp: '14:30:12',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Building A',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Heading to Building A, report of person down',
    transcriptionConfidence: 0.94,
    priority: 'high',
    hasAudio: true,
    duration: 7,
    threadId: 'thread-medical-001'
  },
  {
    id: 'msg-006',
    timestamp: '14:28:45',
    guardId: 'wilson-r',
    guardName: 'Wilson, R.',
    location: 'Section A',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Suspicious vehicle ABC-123 logged with photos',
    transcriptionConfidence: 0.89,
    activityId: 'ACT-0576',
    activityType: 'security',
    priority: 'medium',
    hasAudio: true,
    duration: 9
  }
];

export function CommunicationsPage({ onBackToCommandCenter }: CommunicationsPageProps) {
  const [selectedChannel, setSelectedChannel] = useState('main');
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedGuard, setSelectedGuard] = useState('all');
  const [timeFilter, setTimeFilter] = useState('last_24_hours');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [messages, setMessages] = useState<RadioMessage[]>(mockMessages);
  const [guards, setGuards] = useState<Guard[]>(mockGuards);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<RadioMessage | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [_activeTab, setActiveTab] = useState('communications');

  // Calculate location stats
  const locationStats: LocationStats[] = [
    {
      building: 'Building A',
      activeGuards: guards.filter(g => g.building === 'Building A' && g.status !== 'offline').length,
      totalGuards: guards.filter(g => g.building === 'Building A').length,
      guards: guards.filter(g => g.building === 'Building A')
    },
    {
      building: 'Building B',
      activeGuards: guards.filter(g => g.building === 'Building B' && g.status !== 'offline').length,
      totalGuards: guards.filter(g => g.building === 'Building B').length,
      guards: guards.filter(g => g.building === 'Building B')
    },
    {
      building: 'Building C',
      activeGuards: guards.filter(g => g.building === 'Building C' && g.status !== 'offline').length,
      totalGuards: guards.filter(g => g.building === 'Building C').length,
      guards: guards.filter(g => g.building === 'Building C')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'responding': return 'text-blue-600';
      case 'investigating': return 'text-orange-600';
      case 'break': return 'text-yellow-600';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'responding': return 'bg-blue-500';
      case 'investigating': return 'bg-orange-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'radio': return Radio;
      case 'telegram': return MessageCircle;
      case 'integrated': return Wifi;
      default: return Radio;
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
      case 'visitor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePlayAudio = (messageId: string) => {
    setPlayingMessage(messageId);
    setTimeout(() => setPlayingMessage(null), 3000);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: RadioMessage = {
        id: `msg-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        guardId: 'current-user',
        guardName: 'J. Smith',
        location: 'Command Center',
        building: 'Building A',
        channel: selectedChannel,
        type: 'text',
        content: newMessage,
        priority: 'medium'
      };
      setMessages(prev => [message, ...prev]);
      setNewMessage('');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesChannel = selectedChannel === 'all' || msg.channel === selectedChannel;
    const matchesGuard = selectedGuard === 'all' || msg.guardId === selectedGuard;
    const matchesPriority = priorityFilter === 'all' || msg.priority === priorityFilter;
    const matchesSearch = searchQuery === '' || 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.guardName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesChannel && matchesGuard && matchesPriority && matchesSearch;
  });

  const activeGuards = guards.filter(g => g.status !== 'offline');
  const _selectedChannelData = mockChannels.find(c => c.id === selectedChannel);
  const totalMessagesToday = mockChannels.reduce((sum, channel) => sum + channel.messageCount, 0);
  const avgTranscriptionRate = mockChannels.reduce((sum, channel) => sum + channel.transcriptionRate, 0) / mockChannels.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">COMMUNICATIONS CENTER</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">3</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">J.Smith</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="px-6 py-2 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBackToCommandCenter}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Command Center
            </Button>
            
            <div className="text-sm text-gray-600">
              Active: <span className="font-semibold">{activeGuards.length} Guards</span> | 
              <span className="ml-2">{mockChannels.length} Channels</span> | 
              <span className="ml-2">{Math.round(totalMessagesToday / 24)} msg/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Channels & Stats */}
          <div className="col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Active Channels ({mockChannels.filter(c => c.status === 'active').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockChannels.map((channel) => {
                  const IconComponent = getChannelIcon(channel.type);
                  return (
                    <div
                      key={channel.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedChannel === channel.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{channel.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          channel.status === 'active' ? 'bg-green-500' : 
                          channel.status === 'standby' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{channel.activeCount} active</div>
                        <div>{channel.lastActivity}</div>
                      </div>
                    </div>
                  );
                })}

                <Separator />
                
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between mb-1">
                    <span>• {totalMessagesToday} msgs today</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>• {Math.round(avgTranscriptionRate * 100)}% transcribed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• {mockChannels.reduce((sum, c) => sum + c.incidentCount, 0)} incidents</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>• Ambient.ai</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>• Lenel</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>• N8N Workflows</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Communication Log */}
          <div className="col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Communication Log</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setMessages([...mockMessages])}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary">{filteredMessages.length} messages</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filter Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={selectedSite} onValueChange={setSelectedSite}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_24_hours">24 hrs</SelectItem>
                        <SelectItem value="last_4_hours">4 hrs</SelectItem>
                        <SelectItem value="last_hour">1 hr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredMessages.map((message) => {
                      const isAI = message.type === 'ai_response';
                      const isPlaying = playingMessage === message.id;
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                            getPriorityColor(message.priority)
                          } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isAI ? (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Activity className="h-3 w-3 text-blue-600" />
                                </div>
                              ) : (
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {message.guardName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{message.guardName}</span>
                                  {message.type === 'voice' && <Mic className="h-3 w-3 text-gray-500" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{message.timestamp}</span>
                                  <Building className="h-3 w-3" />
                                  <span>{message.building}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {message.hasAudio && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayAudio(message.id);
                                  }}
                                >
                                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                </Button>
                              )}
                              {message.transcriptionConfidence && (
                                <Badge variant="secondary" className="text-xs px-1">
                                  {Math.round(message.transcriptionConfidence * 100)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm mb-2">{message.content}</p>
                          
                          {message.activityId && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">→</span>
                              <Badge className={getActivityTypeColor(message.activityType)}>
                                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)}
                              </Badge>
                              <span className="text-gray-500">({message.activityId})</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Load More */}
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm">
                    Load More ↑
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Guard Status & Details */}
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guard Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <span className="font-medium">Location Overview:</span>
                  </div>
                  
                  {locationStats.map((location) => (
                    <div key={location.building} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{location.building}</span>
                        <span className="text-xs text-gray-500">
                          ({location.activeGuards}/{location.totalGuards})
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {location.guards.map((guard) => (
                          <div key={guard.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusDot(guard.status)}`}></div>
                              <span>{guard.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={getStatusColor(guard.status)}>
                                {guard.status === 'available' ? 'Available' :
                                 guard.status === 'responding' ? 'Responding' :
                                 guard.status === 'investigating' ? 'Investigating' :
                                 guard.status === 'break' ? 'Break' : 'Off Duty'}
                              </span>
                              {guard.currentTask && (
                                <span className="text-blue-600">- {guard.currentTask}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Details */}
            {selectedMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Message Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium">Guard:</label>
                        <p>{selectedMessage.guardName}</p>
                      </div>
                      <div>
                        <label className="font-medium">Time:</label>
                        <p>{selectedMessage.timestamp}</p>
                      </div>
                      <div>
                        <label className="font-medium">Location:</label>
                        <p>{selectedMessage.location}</p>
                      </div>
                      <div>
                        <label className="font-medium">Building:</label>
                        <p>{selectedMessage.building}</p>
                      </div>
                      <div>
                        <label className="font-medium">Channel:</label>
                        <p>{selectedMessage.channel}</p>
                      </div>
                      <div>
                        <label className="font-medium">Type:</label>
                        <p>{selectedMessage.type}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="font-medium text-sm">Content:</label>
                      <p className="text-sm mt-1">{selectedMessage.content}</p>
                    </div>
                    
                    {selectedMessage.transcriptionConfidence && (
                      <div>
                        <label className="font-medium text-sm">Transcription Confidence:</label>
                        <p className="text-sm mt-1">{Math.round(selectedMessage.transcriptionConfidence * 100)}%</p>
                      </div>
                    )}
                    
                    {selectedMessage.relatedActivities && (
                      <div>
                        <label className="font-medium text-sm">Related Activities:</label>
                        <div className="flex gap-2 mt-1">
                          {selectedMessage.relatedActivities.map(actId => (
                            <Badge key={actId} variant="outline" className="text-xs">
                              {actId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="text-xs">
                    <Radio className="h-3 w-3 mr-2" />
                    Broadcast All
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-2" />
                    Emergency Mode
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-2" />
                    Shift Report
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Download className="h-3 w-3 mr-2" />
                    Export Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Communication Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Push to Talk
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call Guard
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Send message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-20">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}