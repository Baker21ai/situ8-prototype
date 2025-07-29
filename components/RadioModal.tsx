import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { 
  Radio, 
  Mic, 
  Phone, 
  MessageCircle, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin, 
  Search,
  Settings,
  BarChart3,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Users,
  Wifi,
  X,
  Filter
} from 'lucide-react';

interface RadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: () => void;
}

interface Channel {
  id: string;
  name: string;
  type: 'radio' | 'telegram' | 'integrated';
  activeCount: number;
  totalCount: number;
  lastActivity: string;
  status: 'active' | 'standby' | 'offline';
}

interface Guard {
  id: string;
  name: string;
  status: 'available' | 'responding' | 'investigating' | 'break' | 'offline';
  location: string;
  lastSeen: string;
  channel: string;
  currentTask?: string;
}

interface RadioMessage {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  location: string;
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
}

const mockChannels: Channel[] = [
  { id: 'main', name: 'Main', type: 'radio', activeCount: 12, totalCount: 15, lastActivity: '10s ago', status: 'active' },
  { id: 'emergency', name: 'Emergency', type: 'radio', activeCount: 0, totalCount: 15, lastActivity: 'Standby', status: 'standby' },
  { id: 'telegram', name: 'Telegram', type: 'telegram', activeCount: 3, totalCount: 15, lastActivity: '2m ago', status: 'active' },
  { id: 'integrated', name: 'Integrated Systems', type: 'integrated', activeCount: 8, totalCount: 10, lastActivity: '1m ago', status: 'active' }
];

const mockGuards: Guard[] = [
  { id: 'garcia-m', name: 'Garcia, M.', status: 'investigating', location: 'Building A', lastSeen: '14:36', channel: 'main', currentTask: 'Medical Response' },
  { id: 'chen-l', name: 'Chen, L.', status: 'available', location: 'Building B', lastSeen: '14:32', channel: 'main' },
  { id: 'wilson-r', name: 'Wilson, R.', status: 'responding', location: 'Parking Lot', lastSeen: '14:33', channel: 'main', currentTask: 'Suspicious Vehicle' },
  { id: 'davis-k', name: 'Davis, K.', status: 'break', location: 'Building C', lastSeen: '14:20', channel: 'main' },
  { id: 'smith-j', name: 'Smith, J.', status: 'available', location: 'Building A', lastSeen: '14:35', channel: 'main' },
  { id: 'johnson-a', name: 'Johnson, A.', status: 'available', location: 'Building B', lastSeen: '14:30', channel: 'main' },
  { id: 'brown-s', name: 'Brown, S.', status: 'offline', location: 'Building C', lastSeen: '13:45', channel: 'main' }
];

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
    priority: 'high',
    hasAudio: true,
    duration: 8
  },
  {
    id: 'msg-002',
    timestamp: '14:34',
    guardId: 'ai-assistant',
    guardName: 'AI Assistant',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Acknowledged. Incident marked resolved.',
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
    priority: 'low',
    hasAudio: true,
    duration: 6
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
    priority: 'high',
    hasAudio: true,
    duration: 12
  },
  {
    id: 'msg-005',
    timestamp: '14:28',
    guardId: 'johnson-a',
    guardName: 'Johnson, A.',
    location: 'Building B',
    channel: 'main',
    type: 'voice',
    content: 'Visitor escort to executive floor complete',
    transcriptionConfidence: 0.94,
    activityId: 'ACT-0575',
    activityType: 'visitor',
    priority: 'low',
    hasAudio: true,
    duration: 7
  }
];

export function RadioModal({ isOpen, onClose, onOpenFullPage }: RadioModalProps) {
  const [selectedChannel, setSelectedChannel] = useState('main');
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedGuard, setSelectedGuard] = useState('all');
  const [timeFilter, setTimeFilter] = useState('last_hour');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [messages, setMessages] = useState<RadioMessage[]>(mockMessages);
  const [guards, setGuards] = useState<Guard[]>(mockGuards);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMessage, setPlayingMessage] = useState<string | null>(null);

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
    // Simulate audio playback
    setTimeout(() => {
      setPlayingMessage(null);
    }, 3000);
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
  const channelStats = mockChannels.find(c => c.id === selectedChannel);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            RADIO COMMUNICATIONS
          </DialogTitle>
        </DialogHeader>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Quick Filters:</span>
          </div>
          
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="research">Research</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedGuard} onValueChange={setSelectedGuard}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Guards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Guards</SelectItem>
              {guards.map(guard => (
                <SelectItem key={guard.id} value={guard.id}>{guard.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Last Hour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_hour">Last Hour</SelectItem>
              <SelectItem value="last_4_hours">Last 4 Hours</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_24_hours">Last 24 Hours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

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

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden">
          {/* Channels & Guard Status */}
          <div className="col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Channels</CardTitle>
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
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{channel.activeCount} active</div>
                        <div>{channel.lastActivity}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Guards</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {activeGuards.map((guard) => (
                      <div key={guard.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(guard.status)}`}></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{guard.name}</div>
                          <div className="text-xs text-gray-500">{guard.location}</div>
                          {guard.currentTask && (
                            <div className="text-xs text-blue-600">{guard.currentTask}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Communication Feed */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Communication Feed</span>
                  <Badge variant="secondary">{filteredMessages.length} messages</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredMessages.map((message) => {
                      const isAI = message.type === 'ai_response';
                      const isPlaying = playingMessage === message.id;
                      
                      return (
                        <div key={message.id} className={`p-3 rounded-lg border-l-4 ${getPriorityColor(message.priority)}`}>
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
                                  {!isAI && (
                                    <>
                                      <MapPin className="h-3 w-3" />
                                      <span>{message.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {message.hasAudio && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => handlePlayAudio(message.id)}
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
                          
                          <div className="mb-2">
                            <p className="text-sm">{message.content}</p>
                            {message.duration && (
                              <div className="text-xs text-gray-500 mt-1">
                                Duration: {message.duration}s
                              </div>
                            )}
                          </div>
                          
                          {message.activityId && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">→</span>
                              <Badge className={getActivityTypeColor(message.activityType)}>
                                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)} Activity
                              </Badge>
                              <span className="text-gray-500">({message.activityId})</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <Button className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Push to Talk
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenFullPage && (
              <Button variant="outline" onClick={onOpenFullPage}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Page
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}