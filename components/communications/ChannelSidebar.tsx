import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Hash,
  Radio as RadioIcon,
  AlertTriangle,
  Shield,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Plus,
  Bell,
  BellOff,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface RadioChannel {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'hybrid';
  category: 'main' | 'emergency' | 'dispatch' | 'tactical' | 'support';
  clearanceLevel: number;
  participants: string[];
  activeSpeakers: string[];
  unreadCount?: number;
  isPrivate?: boolean;
  isMuted?: boolean;
  lastActivity?: string;
  transcriptionEnabled?: boolean;
}

interface ChannelCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  isCollapsed: boolean;
  channels: RadioChannel[];
}

interface User {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  isSpeaking?: boolean;
  currentChannel?: string;
  clearanceLevel: number;
}

const MOCK_CHANNELS: RadioChannel[] = [
  {
    id: 'main-general',
    name: 'General',
    type: 'hybrid',
    category: 'main',
    clearanceLevel: 1,
    participants: ['user1', 'user2', 'user3', 'user4', 'user5'],
    activeSpeakers: ['user2'],
    unreadCount: 3,
    transcriptionEnabled: true,
    lastActivity: '2 min ago'
  },
  {
    id: 'main-patrol',
    name: 'Patrol Updates',
    type: 'voice',
    category: 'main',
    clearanceLevel: 1,
    participants: ['user1', 'user3', 'user6'],
    activeSpeakers: [],
    transcriptionEnabled: true,
    lastActivity: '5 min ago'
  },
  {
    id: 'emergency-alpha',
    name: 'Emergency Response',
    type: 'hybrid',
    category: 'emergency',
    clearanceLevel: 2,
    participants: ['user1', 'user4'],
    activeSpeakers: ['user1'],
    isPrivate: true,
    transcriptionEnabled: true,
    lastActivity: 'Active'
  },
  {
    id: 'dispatch-central',
    name: 'Central Dispatch',
    type: 'hybrid',
    category: 'dispatch',
    clearanceLevel: 3,
    participants: ['user1', 'user2'],
    activeSpeakers: [],
    transcriptionEnabled: true,
    lastActivity: '1 min ago'
  },
  {
    id: 'tactical-ops',
    name: 'Tactical Operations',
    type: 'voice',
    category: 'tactical',
    clearanceLevel: 4,
    participants: ['user1'],
    activeSpeakers: [],
    isPrivate: true,
    transcriptionEnabled: false,
    lastActivity: '30 min ago'
  }
];

const MOCK_USERS: User[] = [
  { id: 'user1', name: 'Commander Alpha', role: 'Incident Commander', status: 'online', currentChannel: 'emergency-alpha', clearanceLevel: 5, isSpeaking: true },
  { id: 'user2', name: 'Guard Beta', role: 'Security Officer', status: 'online', currentChannel: 'main-general', clearanceLevel: 2, isSpeaking: true },
  { id: 'user3', name: 'Dispatcher Gamma', role: 'Dispatcher', status: 'busy', currentChannel: 'main-patrol', clearanceLevel: 3 },
  { id: 'user4', name: 'Officer Delta', role: 'Senior Officer', status: 'online', currentChannel: 'emergency-alpha', clearanceLevel: 3 },
  { id: 'user5', name: 'Guard Echo', role: 'Security Officer', status: 'away', clearanceLevel: 1 },
  { id: 'user6', name: 'Supervisor Foxtrot', role: 'Supervisor', status: 'online', currentChannel: 'main-patrol', clearanceLevel: 4 }
];

interface ChannelSidebarProps {
  currentUserId: string;
  currentUserClearance: number;
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onChannelMute: (channelId: string, muted: boolean) => void;
  className?: string;
}

export function ChannelSidebar({
  currentUserId,
  currentUserClearance,
  activeChannelId,
  onChannelSelect,
  onChannelMute,
  className
}: ChannelSidebarProps) {
  const [channels] = useState<RadioChannel[]>(MOCK_CHANNELS);
  const [users] = useState<User[]>(MOCK_USERS);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showOfflineUsers, setShowOfflineUsers] = useState(false);

  // Group channels by category
  const channelCategories: ChannelCategory[] = [
    {
      id: 'main',
      name: 'Main Channels',
      icon: Hash,
      color: 'text-blue-600',
      isCollapsed: collapsedCategories.has('main'),
      channels: channels.filter(c => c.category === 'main' && c.clearanceLevel <= currentUserClearance)
    },
    {
      id: 'emergency',
      name: 'Emergency',
      icon: AlertTriangle,
      color: 'text-red-600',
      isCollapsed: collapsedCategories.has('emergency'),
      channels: channels.filter(c => c.category === 'emergency' && c.clearanceLevel <= currentUserClearance)
    },
    {
      id: 'dispatch',
      name: 'Dispatch',
      icon: RadioIcon,
      color: 'text-orange-600',
      isCollapsed: collapsedCategories.has('dispatch'),
      channels: channels.filter(c => c.category === 'dispatch' && c.clearanceLevel <= currentUserClearance)
    },
    {
      id: 'tactical',
      name: 'Tactical',
      icon: Shield,
      color: 'text-purple-600',
      isCollapsed: collapsedCategories.has('tactical'),
      channels: channels.filter(c => c.category === 'tactical' && c.clearanceLevel <= currentUserClearance)
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getChannelIcon = (channel: RadioChannel) => {
    switch (channel.type) {
      case 'voice':
        return <Volume2 className="h-4 w-4" />;
      case 'text':
        return <Hash className="h-4 w-4" />;
      case 'hybrid':
        return <RadioIcon className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const onlineUsers = users.filter(u => u.status !== 'offline');
  const offlineUsers = users.filter(u => u.status === 'offline');
  const displayUsers = showOfflineUsers ? users : onlineUsers;

  return (
    <div className={cn("w-64 bg-gray-100 border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Radio Communications</h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{onlineUsers.length} online</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Channel Categories */}
          {channelCategories.map((category) => {
            if (category.channels.length === 0) return null;

            return (
              <div key={category.id} className="mb-4">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-2 w-full px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
                >
                  {category.isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <category.icon className={cn("h-4 w-4", category.color)} />
                  <span className="flex-1 text-left">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.channels.length}
                  </Badge>
                </button>

                {/* Channels */}
                {!category.isCollapsed && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.channels.map((channel) => (
                      <div
                        key={channel.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group",
                          "hover:bg-gray-200 transition-colors",
                          activeChannelId === channel.id 
                            ? "bg-blue-100 text-blue-900" 
                            : "text-gray-700"
                        )}
                        onClick={() => onChannelSelect(channel.id)}
                      >
                        {getChannelIcon(channel)}
                        <span className="flex-1 text-sm font-medium truncate">
                          {channel.name}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Active speakers indicator */}
                          {channel.activeSpeakers.length > 0 && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-600 ml-1">
                                {channel.activeSpeakers.length}
                              </span>
                            </div>
                          )}

                          {/* Transcription indicator */}
                          {channel.transcriptionEnabled && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Transcription enabled" />
                          )}

                          {/* Private channel indicator */}
                          {channel.isPrivate && (
                            <Lock className="h-3 w-3 text-gray-500" />
                          )}

                          {/* Unread count */}
                          {channel.unreadCount && channel.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">
                              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                            </Badge>
                          )}

                          {/* Mute toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChannelMute(channel.id, !channel.isMuted);
                            }}
                          >
                            {channel.isMuted ? (
                              <BellOff className="h-3 w-3" />
                            ) : (
                              <Bell className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Users Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <h4 className="text-sm font-medium text-gray-700">Users</h4>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{displayUsers.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowOfflineUsers(!showOfflineUsers)}
                >
                  {showOfflineUsers ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {displayUsers.map((user) => {
                const currentChannel = channels.find(c => c.id === user.currentChannel);
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                        getStatusColor(user.status)
                      )} />
                      {user.isSpeaking && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentChannel ? `In ${currentChannel.name}` : user.role}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.isSpeaking && (
                        <Mic className="h-3 w-3 text-green-500" />
                      )}
                      {user.clearanceLevel >= 4 && (
                        <Shield className="h-3 w-3 text-purple-500" title="High clearance" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offline users count */}
            {!showOfflineUsers && offlineUsers.length > 0 && (
              <button
                onClick={() => setShowOfflineUsers(true)}
                className="w-full text-left px-2 py-1 mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                + {offlineUsers.length} offline
              </button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Mic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Headphones className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}