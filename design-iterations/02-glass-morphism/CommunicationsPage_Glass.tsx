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
  Database,
  Zap,
  Layers,
  Globe,
  Cpu
} from 'lucide-react';
import './glass-morphism-styles.css';

interface CommunicationsPageGlassProps {
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
    name: 'Alpha Channel', 
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
    name: 'Emergency Protocol', 
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
    name: 'Neural Link', 
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
    name: 'AI Surveillance', 
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
  { id: 'garcia-m', name: 'OPERATIVE GARCIA', status: 'investigating', location: 'Sector Alpha', building: 'Building A', lastSeen: '14:36', channel: 'main' },
  { id: 'wilson-r', name: 'OPERATIVE WILSON', status: 'responding', location: 'Section A', building: 'Building A', lastSeen: '14:33', channel: 'main' },
  { id: 'chen-l', name: 'OPERATIVE CHEN', status: 'available', location: 'Neural Center', building: 'Building B', lastSeen: '14:32', channel: 'main' },
  { id: 'davis-k', name: 'OPERATIVE DAVIS', status: 'break', location: 'Research Sector', building: 'Building B', lastSeen: '14:20', channel: 'main' },
  { id: 'smith-j', name: 'OPERATIVE SMITH', status: 'available', location: 'Reception', building: 'Building A', lastSeen: '14:35', channel: 'main' }
];

const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36:22',
    guardId: 'garcia-m',
    guardName: 'OPERATIVE GARCIA',
    location: 'Sector Alpha',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Bio-signature stabilized, neural paramedics have control',
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
    guardName: 'NEURAL AI',
    location: 'Quantum Core',
    building: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Medical pattern detected. Dispatching backup. Neural ETA analysis?',
    priority: 'medium'
  },
  {
    id: 'msg-003',
    timestamp: '14:32:45',
    guardId: 'garcia-m',
    guardName: 'OPERATIVE GARCIA',
    location: 'Sector Alpha',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'On scene, bio-signature critical, subject unconscious but stable',
    transcriptionConfidence: 0.92,
    priority: 'critical',
    hasAudio: true,
    duration: 12
  }
];

export function CommunicationsPage_Glass({ onBackToCommandCenter }: CommunicationsPageGlassProps) {
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
      case 'available': return 'text-green-400';
      case 'responding': return 'text-cyan-400';
      case 'investigating': return 'text-orange-400';
      case 'break': return 'text-yellow-400';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'available': return 'glass-status-new';
      case 'responding': return 'glass-status-active';
      case 'investigating': return 'glass-status-assigned';
      case 'break': return 'glass-status-resolved';
      case 'offline': return 'glass-status';
      default: return 'glass-status';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'radio': return Radio;
      case 'telegram': return Wifi;
      case 'integrated': return Cpu;
      default: return Radio;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return 'glass-badge';
    return `glass-badge-${priority}`;
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'glass-badge-critical';
      case 'security': return 'glass-badge-high';
      case 'patrol': return 'glass-badge-medium';
      case 'visitor': return 'glass-badge-low';
      default: return 'glass-badge';
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
        guardName: 'COMMANDER MATRIX',
        location: 'Neural Command',
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
    <div className="glass-theme glass-background" data-design="glass">
      {/* Holographic Header */}
      <div className="glass-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToCommandCenter}
              className="glass-button glass-glow-accent"
            >
              <ArrowLeft className="glass-icon" />
              NEURAL COMMAND
            </button>
            <div>
              <h1>NEURAL COMMUNICATIONS CENTER</h1>
              <p>Quantum-encrypted tactical communications matrix</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass-badge glass-glow-success">
              <Users className="glass-icon-sm" />
              {activeGuards.length} OPERATIVES ONLINE
            </div>
            <div className="glass-badge glass-glow-accent">
              <Radio className="glass-icon-sm" />
              {mockChannels.filter(c => c.status === 'active').length} CHANNELS ACTIVE
            </div>
            <div className="glass-badge glass-glow-accent">
              <Zap className="glass-icon-sm" />
              {Math.round(totalMessagesToday / 24)} NEURAL/HR
            </div>
          </div>
        </div>

        {/* Holographic System Status */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="glass-stat-card glass-glow-accent hover:scale-105 transition-transform">
            <Radio className="glass-stat-icon text-cyan-400" />
            <div className="glass-stat-value">{mockChannels.filter(c => c.status === 'active').length}</div>
            <div className="glass-stat-label uppercase tracking-wider">ACTIVE CHANNELS</div>
          </div>
          <div className="glass-stat-card glass-glow-success hover:scale-105 transition-transform">
            <Users className="glass-stat-icon text-green-400" />
            <div className="glass-stat-value">{activeGuards.length}</div>
            <div className="glass-stat-label uppercase tracking-wider">OPERATIVES ONLINE</div>
          </div>
          <div className="glass-stat-card glass-glow-accent hover:scale-105 transition-transform">
            <MessageCircle className="glass-stat-icon text-orange-400" />
            <div className="glass-stat-value">{totalMessagesToday}</div>
            <div className="glass-stat-label uppercase tracking-wider">NEURAL TRANSMISSIONS</div>
          </div>
          <div className="glass-stat-card glass-glow-success hover:scale-105 transition-transform">
            <TrendingUp className="glass-stat-icon text-purple-400" />
            <div className="glass-stat-value">{Math.round(avgTranscriptionRate * 100)}%</div>
            <div className="glass-stat-label uppercase tracking-wider">DECODE ACCURACY</div>
          </div>
        </div>
      </div>

      {/* Main Neural Interface Layout */}
      <div className="flex gap-6 p-6 h-[calc(100vh-300px)]">
        {/* Left Panel - Quantum Channels */}
        <div className="w-80 glass-panel">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Wifi className="glass-icon" />
              QUANTUM COMMUNICATION CHANNELS
            </div>
          </div>
          
          <div className="glass-scroll-area">
            <div className="space-y-3">
              {mockChannels.map((channel) => {
                const IconComponent = getChannelIcon(channel.type);
                return (
                  <div
                    key={channel.id}
                    className={`glass-card cursor-pointer transition-all hover:scale-105 ${
                      selectedChannel === channel.id ? 'glass-glow-accent border-cyan-400/50' : ''
                    }`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <IconComponent className="glass-icon text-cyan-400" />
                        <span className="font-medium text-white uppercase tracking-wider">{channel.name}</span>
                        <div className={`glass-status ${channel.status === 'active' ? 'glass-status-new' : 'glass-status-resolved'}`}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                        <div>{channel.activeCount} active</div>
                        <div>{channel.lastActivity}</div>
                        <div>{channel.messageCount} msgs</div>
                        <div>{Math.round(channel.transcriptionRate * 100)}% acc</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6 bg-white/10" />
            
            {/* Neural System Status */}
            <div>
              <h3 className="font-medium mb-3 text-cyan-400 uppercase tracking-wider">NEURAL SYSTEMS</h3>
              <div className="space-y-3">
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Quantum Encryption</span>
                    <div className="glass-status glass-status-new"></div>
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">AI Surveillance</span>
                    <div className="glass-status glass-status-new"></div>
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Neural Network</span>
                    <div className="glass-status glass-status-active"></div>
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Biometric Scanner</span>
                    <div className="glass-status glass-status-new"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Neural Communication Log */}
        <div className="flex-1 glass-panel">
          <div className="glass-card-header">
            <div className="flex items-center justify-between">
              <div className="glass-card-title">
                <Eye className="glass-icon" />
                NEURAL COMMUNICATION MATRIX
              </div>
              <div className="flex items-center gap-3">
                <button className="glass-button glass-glow-accent">
                  <RefreshCw className="glass-icon" />
                  SYNC NEURAL NET
                </button>
                <span className="glass-badge glass-glow-accent">
                  {filteredMessages.length} neural patterns
                </span>
              </div>
            </div>
          </div>
          
          {/* Advanced Filter Interface */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 glass-search-container">
                <Search className="glass-search-icon" />
                <input
                  type="text"
                  placeholder="Search neural transmissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input glass-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="glass-icon text-cyan-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="glass-input w-24"
                >
                  <option value="all">ALL</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
                
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="glass-input w-32"
                >
                  <option value="last_24_hours">24 NEURAL CYCLES</option>
                  <option value="last_4_hours">4 CYCLES</option>
                  <option value="last_hour">1 CYCLE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-scroll-area">
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const isAI = message.type === 'ai_response';
                const isPlaying = playingMessage === message.id;
                
                return (
                  <div 
                    key={message.id} 
                    className={`glass-card cursor-pointer transition-all hover:scale-102 ${
                      message.priority ? `glass-priority-${message.priority}` : ''
                    } ${selectedMessage?.id === message.id ? 'glass-glow-accent' : ''}`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {isAI ? (
                            <div className="w-8 h-8 glass-card glass-glow-accent rounded-full flex items-center justify-center">
                              <Cpu className="glass-icon text-cyan-400" />
                            </div>
                          ) : (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm bg-cyan-500/20 text-cyan-300">
                                {message.guardName.split(' ').slice(-1)[0].substring(0,2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white uppercase tracking-wide">{message.guardName}</span>
                              {message.type === 'voice' && <Mic className="glass-icon-sm text-cyan-400" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Clock className="glass-icon-sm" />
                              <span>{message.timestamp}</span>
                              <Building className="glass-icon-sm" />
                              <span>{message.building}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {message.hasAudio && (
                            <button 
                              className="glass-button p-2 glass-glow-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayAudio(message.id);
                              }}
                            >
                              {isPlaying ? <Pause className="glass-icon-sm" /> : <Play className="glass-icon-sm" />}
                            </button>
                          )}
                          {message.transcriptionConfidence && (
                            <span className="glass-badge glass-glow-success text-xs">
                              {Math.round(message.transcriptionConfidence * 100)}%
                            </span>
                          )}
                          {message.priority && (
                            <span className={`glass-badge ${getPriorityBadge(message.priority)} uppercase`}>
                              {message.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3 text-gray-200">{message.content}</p>
                      
                      {message.activityId && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-cyan-400">→</span>
                          <span className={`glass-badge ${getActivityTypeColor(message.activityType)} uppercase`}>
                            {message.activityType}
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

        {/* Right Panel - Operative Status Matrix */}
        <div className="w-80 glass-panel">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Shield className="glass-icon" />
              OPERATIVE STATUS MATRIX
            </div>
          </div>
          
          <div className="glass-scroll-area">
            {/* Sector Breakdown */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-3 text-cyan-400 uppercase tracking-wider">SECTOR DEPLOYMENT:</h3>
                
                {['Building A', 'Building B', 'Building C'].map((building) => {
                  const buildingGuards = guards.filter(g => g.building === building);
                  const activeCount = buildingGuards.filter(g => g.status !== 'offline').length;
                  
                  return (
                    <div key={building} className="glass-card p-3 mb-3 hover:scale-105 transition-transform">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-white uppercase tracking-wide">
                          {building.replace('Building ', 'SECTOR ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({activeCount}/{buildingGuards.length})
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {buildingGuards.map((guard) => (
                          <div key={guard.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`glass-status ${getStatusDot(guard.status)}`}></div>
                              <span className="text-gray-300">{guard.name}</span>
                            </div>
                            <span className={`text-xs uppercase tracking-wide ${getStatusColor(guard.status)}`}>
                              {guard.status === 'available' ? 'READY' :
                               guard.status === 'responding' ? 'ACTIVE' :
                               guard.status === 'investigating' ? 'INVESTIGATING' :
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
          
          {/* Tactical Operations Panel */}
          <div className="border-t border-white/10 p-4">
            <h3 className="font-medium mb-3 text-cyan-400 uppercase tracking-wider">TACTICAL OPS</h3>
            <div className="space-y-2">
              <button className="glass-button glass-button-primary glass-glow-accent w-full text-left">
                <Radio className="glass-icon" />
                BROADCAST ALL
              </button>
              <button className="glass-button glass-button-danger glass-glow-critical w-full text-left">
                <AlertTriangle className="glass-icon" />
                EMERGENCY PROTOCOL
              </button>
              <button className="glass-button glass-glow-success w-full text-left">
                <BarChart3 className="glass-icon" />
                NEURAL ANALYTICS
              </button>
              <button className="glass-button glass-glow-accent w-full text-left">
                <Download className="glass-icon" />
                EXTRACT DATA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Holographic Communication Controls */}
      <div className="border-t border-white/10 glass-card p-4">
        <div className="flex items-center gap-4">
          <button className="glass-button glass-button-primary glass-glow-accent">
            <Mic className="glass-icon" />
            NEURAL BROADCAST
          </button>
          
          <button className="glass-button glass-glow-success">
            <Phone className="glass-icon" />
            QUANTUM CALL
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="Transmit neural message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="glass-input flex-1"
            />
            <button 
              onClick={handleSendMessage}
              className="glass-button glass-button-primary glass-glow-accent"
            >
              <Send className="glass-icon" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="glass-button glass-glow-accent"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="glass-icon" /> : <Volume2 className="glass-icon" />}
            </button>
            <div className="w-20">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-cyan-500/20 rounded-lg appearance-none cursor-pointer glass-glow-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}