import React, { useState, useEffect } from 'react';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from '../../components/ui/card';
import { Button as _Button } from '../../components/ui/button';
import { Badge as _Badge } from '../../components/ui/badge';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea as _ScrollArea } from '../../components/ui/scroll-area';
import { Separator as _Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Select as _Select, SelectContent as _SelectContent, SelectItem as _SelectItem, SelectTrigger as _SelectTrigger, SelectValue as _SelectValue } from '../../components/ui/select';
import { Input as _Input } from '../../components/ui/input';
import { Textarea as _Textarea } from '../../components/ui/textarea';
import { 
  Radio, 
  Mic, 
  Phone, 
  MessageCircle, 
  Activity as _Activity, 
  AlertTriangle, 
  Shield as _Shield, 
  Clock, 
  MapPin as _MapPin, 
  Search,
  Settings as _Settings,
  BarChart3,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Users,
  Wifi as _Wifi,
  Bell as _Bell,
  User as _User,
  LogOut as _LogOut,
  Download,
  Upload as _Upload,
  Filter,
  RefreshCw,
  Send,
  Headphones as _Headphones,
  VolumeX,
  _Volume1,
  Building,
  Eye,
  FileText as _FileText,
  Calendar as _Calendar,
  TrendingUp,
  Database as _Database,
  Zap,
  Layers as _Layers,
  Globe as _Globe,
  Cpu,
  Signal,
  Target,
  Crosshair as _Crosshair,
  Radar
} from 'lucide-react';
import './tactical-dark-styles.css';

interface CommunicationsPageTacticalProps {
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
    name: 'TAC-ALPHA', 
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
    name: 'EMERGENCY PROTOCOL', 
    type: 'radio', 
    activeCount: 0, 
    totalCount: 15, 
    lastActivity: 'STANDBY', 
    status: 'standby',
    messageCount: 0,
    transcriptionRate: 1.0,
    incidentCount: 0
  },
  { 
    id: 'telegram', 
    name: 'SECURE-NET', 
    type: 'telegram', 
    activeCount: 3, 
    totalCount: 15, 
    lastActivity: '2M AGO', 
    status: 'active',
    messageCount: 45,
    transcriptionRate: 1.0,
    incidentCount: 3
  },
  { 
    id: 'ambient', 
    name: 'AI-SURVEILLANCE', 
    type: 'integrated', 
    activeCount: 8, 
    totalCount: 10, 
    lastActivity: '1M AGO', 
    status: 'active',
    messageCount: 23,
    transcriptionRate: 0.95,
    incidentCount: 8
  }
];

const mockGuards: Guard[] = [
  { id: 'alpha-01', name: 'ALPHA-01', status: 'investigating', location: 'SECTOR-ALPHA', building: 'Building A', lastSeen: '14:36', channel: 'main' },
  { id: 'bravo-02', name: 'BRAVO-02', status: 'responding', location: 'SECTOR-ALPHA', building: 'Building A', lastSeen: '14:33', channel: 'main' },
  { id: 'charlie-03', name: 'CHARLIE-03', status: 'available', location: 'COMMAND-CENTER', building: 'Building B', lastSeen: '14:32', channel: 'main' },
  { id: 'delta-04', name: 'DELTA-04', status: 'break', location: 'SECTOR-BRAVO', building: 'Building B', lastSeen: '14:20', channel: 'main' },
  { id: 'echo-05', name: 'ECHO-05', status: 'available', location: 'RECEPTION', building: 'Building A', lastSeen: '14:35', channel: 'main' }
];

const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36:22',
    guardId: 'alpha-01',
    guardName: 'ALPHA-01',
    location: 'SECTOR-ALPHA',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'CONTACT STABILIZED, MEDICS HAVE CONTROL, STANDING BY',
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
    guardId: 'ai-tactical',
    guardName: 'TAC-AI',
    location: 'COMMAND-CORE',
    building: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'MEDICAL CONTACT DETECTED. BACKUP DISPATCHED. ETA ANALYSIS REQUESTED',
    priority: 'medium'
  },
  {
    id: 'msg-003',
    timestamp: '14:32:45',
    guardId: 'alpha-01',
    guardName: 'ALPHA-01',
    location: 'SECTOR-ALPHA',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'ON SCENE, CONTACT DOWN, VITAL SIGNS CRITICAL BUT STABLE',
    transcriptionConfidence: 0.92,
    priority: 'critical',
    hasAudio: true,
    duration: 12
  }
];

export function CommunicationsPage_Tactical({ onBackToCommandCenter }: CommunicationsPageTacticalProps) {
  const [selectedChannel, setSelectedChannel] = useState('main');
  const [_selectedSite, setSelectedSite] = useState('all');
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
      case 'available': return 'text-green-400';
      case 'responding': return 'text-blue-400';
      case 'investigating': return 'text-amber-400';
      case 'break': return 'text-yellow-400';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'available': return 'tactical-status-new';
      case 'responding': return 'tactical-status-active';
      case 'investigating': return 'tactical-status-assigned';
      case 'break': return 'tactical-status-resolved';
      case 'offline': return 'tactical-status';
      default: return 'tactical-status';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'radio': return Radio;
      case 'telegram': return Signal;
      case 'integrated': return Cpu;
      default: return Radio;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return 'tactical-badge';
    return `tactical-badge-${priority}`;
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'tactical-badge-critical';
      case 'security': return 'tactical-badge-high';
      case 'patrol': return 'tactical-badge-medium';
      case 'visitor': return 'tactical-badge-low';
      default: return 'tactical-badge';
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
        guardId: 'command-01',
        guardName: 'COMMAND-ACTUAL',
        location: 'TAC-COMMAND',
        building: 'Building A',
        channel: selectedChannel,
        type: 'text',
        content: newMessage.toUpperCase(),
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
    <div className="tactical-theme tactical-background" data-design="tactical">
      {/* Tactical Command Header */}
      <div className="tactical-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCommandCenter}
              className="tactical-button tactical-button-primary"
            >
              <ArrowLeft className="tactical-icon" />
              TAC-COMMAND
            </button>
            <div>
              <h1>TACTICAL COMMUNICATIONS CENTER</h1>
              <p>SECURE ENCRYPTED TACTICAL COMMUNICATIONS MATRIX</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="tactical-badge tactical-badge-low">
              <Users className="tactical-icon-sm" />
              {activeGuards.length} UNITS ONLINE
            </div>
            <div className="tactical-badge tactical-badge-medium">
              <Radio className="tactical-icon-sm" />
              {mockChannels.filter(c => c.status === 'active').length} CHANNELS
            </div>
            <div className="tactical-badge tactical-badge-high">
              <Zap className="tactical-icon-sm" />
              {Math.round(totalMessagesToday / 24)} MSG/HR
            </div>
          </div>
        </div>

        {/* Tactical System Status */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="tactical-stat-card tactical-hud-element">
            <Radio className="tactical-stat-icon text-green-400" />
            <div className="tactical-stat-value">{mockChannels.filter(c => c.status === 'active').length}</div>
            <div className="tactical-stat-label">ACTIVE CHANNELS</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <Users className="tactical-stat-icon text-green-400" />
            <div className="tactical-stat-value">{activeGuards.length}</div>
            <div className="tactical-stat-label">UNITS DEPLOYED</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <MessageCircle className="tactical-stat-icon text-amber-400" />
            <div className="tactical-stat-value">{totalMessagesToday}</div>
            <div className="tactical-stat-label">TRANSMISSIONS</div>
          </div>
          <div className="tactical-stat-card tactical-hud-element">
            <TrendingUp className="tactical-stat-icon text-green-400" />
            <div className="tactical-stat-value">{Math.round(avgTranscriptionRate * 100)}%</div>
            <div className="tactical-stat-label">DECODE RATE</div>
          </div>
        </div>
      </div>

      {/* Main Tactical Interface Layout */}
      <div className="flex gap-4 p-4 h-[calc(100vh-280px)]">
        {/* Left Panel - Tactical Channels */}
        <div className="w-72 tactical-panel">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Signal className="tactical-icon" />
              TACTICAL CHANNELS
            </div>
          </div>
          
          <div className="tactical-scroll-area">
            <div className="space-y-2">
              {mockChannels.map((channel) => {
                const IconComponent = getChannelIcon(channel.type);
                return (
                  <div
                    key={channel.id}
                    className={`tactical-card cursor-pointer transition-all hover:border-green-400 ${
                      selectedChannel === channel.id ? 'border-green-400' : ''
                    }`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="tactical-icon text-green-400" />
                        <span className="text-xs font-bold text-white">{channel.name}</span>
                        <div className={`tactical-status ${channel.status === 'active' ? 'tactical-status-new' : 'tactical-status-resolved'}`}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-300 font-mono">
                        <div>{channel.activeCount} ACTIVE</div>
                        <div>{channel.lastActivity}</div>
                        <div>{channel.messageCount} MSGS</div>
                        <div>{Math.round(channel.transcriptionRate * 100)}% ACC</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="my-4 h-px bg-gray-800"></div>
            
            {/* Tactical Systems Status */}
            <div>
              <h3 className="text-xs font-bold mb-2 text-green-400">TACTICAL SYSTEMS</h3>
              <div className="space-y-2">
                <div className="tactical-card p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">ENCRYPTION</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                </div>
                <div className="tactical-card p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">AI-SURVEILLANCE</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                </div>
                <div className="tactical-card p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">TACTICAL-NET</span>
                    <div className="tactical-status tactical-status-active"></div>
                  </div>
                </div>
                <div className="tactical-card p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">BIO-SCANNER</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Tactical Communication Log */}
        <div className="flex-1 tactical-panel">
          <div className="tactical-card-header">
            <div className="flex items-center justify-between">
              <div className="tactical-card-title">
                <Eye className="tactical-icon" />
                TACTICAL COMMUNICATION MATRIX
              </div>
              <div className="flex items-center gap-2">
                <button className="tactical-button tactical-button-primary">
                  <RefreshCw className="tactical-icon" />
                  SYNC
                </button>
                <span className="tactical-badge tactical-badge-low">
                  {filteredMessages.length} CONTACTS
                </span>
              </div>
            </div>
          </div>
          
          {/* Tactical Filter Interface */}
          <div className="border-b border-gray-800 p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 tactical-search-container">
                <Search className="tactical-search-icon" />
                <input
                  type="text"
                  placeholder="SEARCH TACTICAL TRANSMISSIONS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tactical-input tactical-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="tactical-icon text-green-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="tactical-input w-20"
                >
                  <option value="all">ALL</option>
                  <option value="critical">CRIT</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MED</option>
                  <option value="low">LOW</option>
                </select>
                
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="tactical-input w-24"
                >
                  <option value="last_24_hours">24HR</option>
                  <option value="last_4_hours">4HR</option>
                  <option value="last_hour">1HR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tactical-scroll-area">
            <div className="space-y-2">
              {filteredMessages.map((message) => {
                const isAI = message.type === 'ai_response';
                const isPlaying = playingMessage === message.id;
                
                return (
                  <div 
                    key={message.id} 
                    className={`tactical-card cursor-pointer transition-all hover:border-green-400 ${
                      message.priority ? `tactical-priority-${message.priority}` : ''
                    } ${selectedMessage?.id === message.id ? 'border-green-400' : ''}`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isAI ? (
                            <div className="w-6 h-6 tactical-card rounded border-green-400 flex items-center justify-center">
                              <Cpu className="tactical-icon text-green-400" />
                            </div>
                          ) : (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-green-500/20 text-green-300 font-mono">
                                {message.guardName.split('-')[0].substring(0,2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white font-mono">{message.guardName}</span>
                              {message.type === 'voice' && <Mic className="tactical-icon-sm text-green-400" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                              <Clock className="tactical-icon-sm" />
                              <span>{message.timestamp}</span>
                              <Building className="tactical-icon-sm" />
                              <span>{message.building}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {message.hasAudio && (
                            <button 
                              className="tactical-button p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayAudio(message.id);
                              }}
                            >
                              {isPlaying ? <Pause className="tactical-icon-sm" /> : <Play className="tactical-icon-sm" />}
                            </button>
                          )}
                          {message.transcriptionConfidence && (
                            <span className="tactical-badge tactical-badge-low text-xs">
                              {Math.round(message.transcriptionConfidence * 100)}%
                            </span>
                          )}
                          {message.priority && (
                            <span className={`tactical-badge ${getPriorityBadge(message.priority)}`}>
                              {message.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs mb-2 text-gray-200 font-mono">{message.content}</p>
                      
                      {message.activityId && (
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-green-400">→</span>
                          <span className={`tactical-badge ${getActivityTypeColor(message.activityType)}`}>
                            {message.activityType?.toUpperCase()}
                          </span>
                          <span className="text-gray-400">({message.activityId})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel - Unit Status Matrix */}
        <div className="w-72 tactical-panel">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Target className="tactical-icon" />
              UNIT STATUS MATRIX
            </div>
          </div>
          
          <div className="tactical-scroll-area">
            {/* Sector Deployment */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-bold mb-2 text-green-400">SECTOR DEPLOYMENT:</h3>
                
                {['Building A', 'Building B', 'Building C'].map((building) => {
                  const buildingGuards = guards.filter(g => g.building === building);
                  const activeCount = buildingGuards.filter(g => g.status !== 'offline').length;
                  
                  return (
                    <div key={building} className="tactical-card p-2 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {building.replace('Building ', 'SECTOR-')}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          ({activeCount}/{buildingGuards.length})
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {buildingGuards.map((guard) => (
                          <div key={guard.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`tactical-status ${getStatusDot(guard.status)}`}></div>
                              <span className="text-gray-300 font-mono">{guard.name}</span>
                            </div>
                            <span className={`text-xs font-mono ${getStatusColor(guard.status)}`}>
                              {guard.status === 'available' ? 'READY' :
                               guard.status === 'responding' ? 'ACTIVE' :
                               guard.status === 'investigating' ? 'INVEST' :
                               guard.status === 'break' ? 'STANDBY' : 'OFFLINE'}
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
          
          {/* Tactical Command Operations */}
          <div className="border-t border-gray-800 p-3">
            <h3 className="text-xs font-bold mb-2 text-green-400">TACTICAL OPS</h3>
            <div className="space-y-1">
              <button className="tactical-button tactical-button-primary w-full text-left">
                <Radio className="tactical-icon" />
                BROADCAST ALL
              </button>
              <button className="tactical-button tactical-button-danger w-full text-left">
                <AlertTriangle className="tactical-icon" />
                EMERGENCY
              </button>
              <button className="tactical-button tactical-button-blue w-full text-left">
                <BarChart3 className="tactical-icon" />
                ANALYTICS
              </button>
              <button className="tactical-button tactical-button-primary w-full text-left">
                <Download className="tactical-icon" />
                EXTRACT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Communication Controls */}
      <div className="border-t border-gray-800 tactical-card p-3">
        <div className="flex items-center gap-3">
          <button className="tactical-button tactical-button-primary">
            <Mic className="tactical-icon" />
            TAC-BROADCAST
          </button>
          
          <button className="tactical-button tactical-button-blue">
            <Phone className="tactical-icon" />
            DIRECT CALL
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="TRANSMIT TACTICAL MESSAGE..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="tactical-input flex-1"
            />
            <button 
              onClick={handleSendMessage}
              className="tactical-button tactical-button-primary"
            >
              <Send className="tactical-icon" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="tactical-button"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="tactical-icon" /> : <Volume2 className="tactical-icon" />}
            </button>
            <div className="w-16">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-green-500/20 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}