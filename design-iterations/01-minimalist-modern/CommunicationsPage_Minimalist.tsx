import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
  Upload,
  Filter,
  RefreshCw,
  Send,
  Headphones,
  VolumeX,
  Volume1,
  Building,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  Database
} from 'lucide-react';
import './minimalist-styles.css';

interface CommunicationsPageMinimalistProps {
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
  }
];

const mockGuards: Guard[] = [
  { id: 'garcia-m', name: 'Garcia, M.', status: 'investigating', location: 'Lobby', building: 'Building A', lastSeen: '14:36', channel: 'main' },
  { id: 'wilson-r', name: 'Wilson, R.', status: 'responding', location: 'Section A', building: 'Building A', lastSeen: '14:33', channel: 'main' },
  { id: 'chen-l', name: 'Chen, L.', status: 'available', location: 'Operations Center', building: 'Building B', lastSeen: '14:32', channel: 'main' },
  { id: 'davis-k', name: 'Davis, K.', status: 'break', location: 'Research Lobby', building: 'Building B', lastSeen: '14:20', channel: 'main' },
  { id: 'smith-j', name: 'Smith, J.', status: 'available', location: 'Reception', building: 'Building A', lastSeen: '14:35', channel: 'main' }
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
    duration: 8
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
    priority: 'medium'
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
    duration: 12
  }
];

export function CommunicationsPage_Minimalist({ onBackToCommandCenter }: CommunicationsPageMinimalistProps) {
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

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return '';
    return `minimalist-badge-${priority}`;
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'minimalist-badge-critical';
      case 'security': return 'minimalist-badge-high';
      case 'patrol': return 'minimalist-badge-medium';
      case 'visitor': return 'minimalist-badge-low';
      default: return 'minimalist-badge';
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
  const totalMessagesToday = mockChannels.reduce((sum, channel) => sum + channel.messageCount, 0);
  const avgTranscriptionRate = mockChannels.reduce((sum, channel) => sum + channel.transcriptionRate, 0) / mockChannels.length;

  return (
    <div className="minimalist-theme minimalist-container" data-design="minimalist">
      {/* Clean Header */}
      <div className="minimalist-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToCommandCenter}
              className="minimalist-button"
            >
              <ArrowLeft className="minimalist-icon" />
              Back to Command Center
            </button>
            <div>
              <h1>Communications Center</h1>
              <p>Real-time radio communications and messaging</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="minimalist-badge">
              <Users className="minimalist-icon-sm" />
              {activeGuards.length} Active Guards
            </div>
            <div className="minimalist-badge">
              <Radio className="minimalist-icon-sm" />
              {mockChannels.filter(c => c.status === 'active').length} Channels
            </div>
            <div className="minimalist-badge">
              <MessageCircle className="minimalist-icon-sm" />
              {Math.round(totalMessagesToday / 24)} msg/hr
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="minimalist-stat-card">
            <Radio className="minimalist-stat-icon text-blue-600" />
            <div className="minimalist-stat-value">{mockChannels.filter(c => c.status === 'active').length}</div>
            <div className="minimalist-stat-label">Active Channels</div>
          </div>
          <div className="minimalist-stat-card">
            <Users className="minimalist-stat-icon text-green-600" />
            <div className="minimalist-stat-value">{activeGuards.length}</div>
            <div className="minimalist-stat-label">Guards Online</div>
          </div>
          <div className="minimalist-stat-card">
            <MessageCircle className="minimalist-stat-icon text-orange-600" />
            <div className="minimalist-stat-value">{totalMessagesToday}</div>
            <div className="minimalist-stat-label">Messages Today</div>
          </div>
          <div className="minimalist-stat-card">
            <TrendingUp className="minimalist-stat-icon text-purple-600" />
            <div className="minimalist-stat-value">{Math.round(avgTranscriptionRate * 100)}%</div>
            <div className="minimalist-stat-label">Transcription Rate</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6 p-6 h-[calc(100vh-260px)]">
        {/* Left Sidebar - Channels & Quick Stats */}
        <div className="w-80 minimalist-panel">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <Radio className="minimalist-icon" />
              Communication Channels
            </div>
          </div>
          
          <div className="minimalist-scroll-area">
            <div className="space-y-3">
              {mockChannels.map((channel) => {
                const IconComponent = getChannelIcon(channel.type);
                return (
                  <div
                    key={channel.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedChannel === channel.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <IconComponent className="minimalist-icon text-blue-600" />
                      <span className="font-medium">{channel.name}</span>
                      <div className={`minimalist-status minimalist-status-${channel.status === 'active' ? 'new' : 'resolved'}`}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>{channel.activeCount} active</div>
                      <div>{channel.lastActivity}</div>
                      <div>{channel.messageCount} msgs</div>
                      <div>{Math.round(channel.transcriptionRate * 100)}% acc</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6" />
            
            {/* Integration Status */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900">System Integrations</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ambient.ai</span>
                  <div className="minimalist-status minimalist-status-new"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Lenel OnGuard</span>
                  <div className="minimalist-status minimalist-status-new"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>N8N Workflows</span>
                  <div className="minimalist-status minimalist-status-new"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Telegram Bot</span>
                  <div className="minimalist-status minimalist-status-new"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Communication Log */}
        <div className="flex-1 minimalist-panel">
          <div className="minimalist-card-header">
            <div className="flex items-center justify-between">
              <div className="minimalist-card-title">
                <MessageCircle className="minimalist-icon" />
                Communication Log
              </div>
              <div className="flex items-center gap-3">
                <button className="minimalist-button">
                  <RefreshCw className="minimalist-icon" />
                  Refresh
                </button>
                <span className="minimalist-badge">
                  {filteredMessages.length} messages
                </span>
              </div>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 minimalist-search-container">
                <Search className="minimalist-search-icon" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="minimalist-input minimalist-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="minimalist-icon text-gray-500" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="minimalist-input w-24"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="minimalist-input w-24"
                >
                  <option value="last_24_hours">24 hrs</option>
                  <option value="last_4_hours">4 hrs</option>
                  <option value="last_hour">1 hr</option>
                </select>
              </div>
            </div>
          </div>

          <div className="minimalist-scroll-area">
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const isAI = message.type === 'ai_response';
                const isPlaying = playingMessage === message.id;
                
                return (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-blue-300 ${
                      message.priority ? `minimalist-priority-${message.priority}` : 'border-gray-200'
                    } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isAI ? (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="minimalist-icon text-blue-600" />
                          </div>
                        ) : (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {message.guardName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{message.guardName}</span>
                            {message.type === 'voice' && <Mic className="minimalist-icon-sm text-gray-500" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="minimalist-icon-sm" />
                            <span>{message.timestamp}</span>
                            <Building className="minimalist-icon-sm" />
                            <span>{message.building}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {message.hasAudio && (
                          <button 
                            className="minimalist-button p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio(message.id);
                            }}
                          >
                            {isPlaying ? <Pause className="minimalist-icon-sm" /> : <Play className="minimalist-icon-sm" />}
                          </button>
                        )}
                        {message.transcriptionConfidence && (
                          <span className="minimalist-badge text-xs">
                            {Math.round(message.transcriptionConfidence * 100)}%
                          </span>
                        )}
                        {message.priority && (
                          <span className={`minimalist-badge ${getPriorityBadge(message.priority)}`}>
                            {message.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 text-gray-900">{message.content}</p>
                    
                    {message.activityId && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">→</span>
                        <span className={`minimalist-badge ${getActivityTypeColor(message.activityType)}`}>
                          {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)}
                        </span>
                        <span className="text-gray-500">({message.activityId})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Guard Status */}
        <div className="w-80 minimalist-panel">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <Users className="minimalist-icon" />
              Guard Status
            </div>
          </div>
          
          <div className="minimalist-scroll-area">
            {/* Location Breakdown */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3 text-gray-900">By Location:</h3>
                
                {['Building A', 'Building B', 'Building C'].map((building) => {
                  const buildingGuards = guards.filter(g => g.building === building);
                  const activeCount = buildingGuards.filter(g => g.status !== 'offline').length;
                  
                  return (
                    <div key={building} className="border rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{building}</span>
                        <span className="text-xs text-gray-500">
                          ({activeCount}/{buildingGuards.length})
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {buildingGuards.map((guard) => (
                          <div key={guard.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`minimalist-status ${getStatusDot(guard.status)}`}></div>
                              <span>{guard.name}</span>
                            </div>
                            <span className={`text-xs ${getStatusColor(guard.status)}`}>
                              {guard.status === 'available' ? 'Available' :
                               guard.status === 'responding' ? 'Responding' :
                               guard.status === 'investigating' ? 'Investigating' :
                               guard.status === 'break' ? 'Break' : 'Off Duty'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="font-medium mb-3 text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <button className="minimalist-button w-full text-left">
                <Radio className="minimalist-icon" />
                Broadcast All
              </button>
              <button className="minimalist-button minimalist-button-danger w-full text-left">
                <AlertTriangle className="minimalist-icon" />
                Emergency Mode
              </button>
              <button className="minimalist-button w-full text-left">
                <BarChart3 className="minimalist-icon" />
                Shift Report
              </button>
              <button className="minimalist-button w-full text-left">
                <Download className="minimalist-icon" />
                Export Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Communication Controls */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <button className="minimalist-button minimalist-button-primary">
            <Mic className="minimalist-icon" />
            Push to Talk
          </button>
          
          <button className="minimalist-button">
            <Phone className="minimalist-icon" />
            Call Guard
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="minimalist-input flex-1"
            />
            <button 
              onClick={handleSendMessage}
              className="minimalist-button minimalist-button-primary"
            >
              <Send className="minimalist-icon" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="minimalist-button"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="minimalist-icon" /> : <Volume2 className="minimalist-icon" />}
            </button>
            <div className="w-20">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}