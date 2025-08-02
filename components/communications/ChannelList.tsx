import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Hash, 
  Lock, 
  Globe, 
  Users,
  Search,
  Plus,
  Filter,
  ChevronRight,
  Activity,
  Bell,
  Shield,
  Radio,
  Signal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  type: 'team' | 'incident' | 'broadcast' | 'direct';
  description?: string;
  memberCount: number;
  activeCount: number;
  unreadCount?: number;
  lastActivity?: string;
  isPrivate?: boolean;
  requiredClearance?: number;
  isEmergency?: boolean;
  tags?: string[];
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  hasVoiceActivity?: boolean;
  frequency?: string;
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
  userClearance?: number;
}

export function ChannelList({ 
  channels, 
  selectedChannel, 
  onSelectChannel,
  userClearance = 1 
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'team': return Hash;
      case 'incident': return Lock;
      case 'broadcast': return Globe;
      case 'direct': return Users;
      default: return Hash;
    }
  };

  const getChannelTypeColor = (type: string, isActive: boolean = false) => {
    const baseClasses = {
      team: 'channel-team',
      incident: 'channel-incident', 
      broadcast: 'channel-broadcast',
      direct: 'channel-direct',
      emergency: 'channel-emergency'
    };
    
    return cn(
      baseClasses[type as keyof typeof baseClasses] || 'text-gray-600 bg-gray-50',
      isActive && 'channel-active'
    );
  };

  const filteredChannels = channels.filter(channel => {
    // Search filter
    if (searchQuery && !channel.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filterType !== 'all' && channel.type !== filterType) {
      return false;
    }
    
    // Active filter
    if (showOnlyActive && channel.activeCount === 0) {
      return false;
    }
    
    // Clearance filter
    if (channel.requiredClearance && channel.requiredClearance > userClearance) {
      return false;
    }
    
    return true;
  });

  // Group channels by type
  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    const group = channel.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  const channelTypeLabels = {
    team: 'Team Channels',
    incident: 'Incident Channels',
    broadcast: 'Broadcast Channels',
    direct: 'Direct Messages'
  };

  const SignalStrengthIndicator = ({ strength }: { strength?: string }) => {
    if (!strength || strength === 'none') return null;
    
    return (
      <div className={cn(
        "signal-strength",
        `signal-strength--${strength}`
      )}>
        {[1, 2, 3, 4, 5].map((bar) => (
          <div key={bar} className="signal-strength__bar" />
        ))}
      </div>
    );
  };

  const VoiceActivityIndicator = ({ isActive }: { isActive?: boolean }) => {
    if (!isActive) return null;
    
    return (
      <div className="voice-activity">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
          <div key={bar} className="voice-activity__bar" />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white border-r border-gray-600">
      <div className="p-4 border-b border-gray-600 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold radio-mono">Radio Channels</h2>
          <Button size="sm" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-700">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className={cn(
                "text-xs border-gray-600",
                filterType === 'all' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterType === 'team' ? 'default' : 'outline'}
              onClick={() => setFilterType('team')}
              className={cn(
                "text-xs border-gray-600",
                filterType === 'team' 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              Team
            </Button>
            <Button
              size="sm"
              variant={filterType === 'incident' ? 'default' : 'outline'}
              onClick={() => setFilterType('incident')}
              className={cn(
                "text-xs border-gray-600",
                filterType === 'incident' 
                  ? 'bg-red-600 text-white border-red-500' 
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              Incident
            </Button>
            <Button
              size="sm"
              variant={showOnlyActive ? 'default' : 'outline'}
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              className={cn(
                "text-xs ml-auto border-gray-600",
                showOnlyActive 
                  ? 'bg-green-600 text-white border-green-500' 
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              <Activity className="h-3 w-3 mr-1" />
              Active
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {Object.entries(groupedChannels).map(([type, typeChannels]) => (
              <div key={type} className="radio-fade-in">
                <h3 className="text-sm font-medium text-gray-400 mb-3 radio-mono uppercase tracking-wider">
                  {channelTypeLabels[type as keyof typeof channelTypeLabels]}
                </h3>
                <div className="space-y-1">
                  {typeChannels.map((channel) => {
                    const Icon = getChannelIcon(channel.type);
                    const isSelected = selectedChannel === channel.id;
                    const hasUnread = (channel.unreadCount || 0) > 0;
                    const isActiveChannel = channel.activeCount > 0;
                    const channelType = channel.isEmergency ? 'emergency' : channel.type;
                    
                    return (
                      <button
                        key={channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all border-l-4",
                          "hover:bg-gray-700/50",
                          "focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                          isSelected && "bg-gray-700 border-l-blue-500",
                          !isSelected && getChannelTypeColor(channelType, isActiveChannel),
                          hasUnread && "channel-unread",
                          channel.isEmergency && "radio-emergency animate-pulse"
                        )}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-full border-2",
                              channel.isEmergency 
                                ? "bg-red-600 border-red-400 text-white" 
                                : isActiveChannel
                                  ? "bg-green-600 border-green-400 text-white"
                                  : "bg-gray-600 border-gray-500 text-gray-300"
                            )}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "font-medium radio-mono text-sm",
                                  isSelected ? "text-white" : "text-gray-200"
                                )}>
                                  {channel.name}
                                </span>
                                {channel.frequency && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-gray-700 text-blue-300 border-blue-600 radio-mono"
                                  >
                                    {channel.frequency}
                                  </Badge>
                                )}
                                {channel.isPrivate && (
                                  <Shield className="h-3 w-3 text-yellow-400" />
                                )}
                                {channel.isEmergency && (
                                  <Bell className="h-3 w-3 text-red-400 animate-pulse" />
                                )}
                                {isActiveChannel && (
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {channel.description && (
                                  <p className="text-xs text-gray-400 font-mono flex-1">
                                    {channel.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <SignalStrengthIndicator strength={channel.signalStrength} />
                                  <VoiceActivityIndicator isActive={channel.hasVoiceActivity} />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {hasUnread && (
                              <Badge 
                                variant="destructive" 
                                className="text-xs bg-red-500 text-white animate-pulse border-red-400"
                              >
                                {channel.unreadCount}
                              </Badge>
                            )}
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-colors",
                              isSelected ? "text-blue-400" : "text-gray-500"
                            )} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "radio-mono",
                              isActiveChannel ? "text-green-400" : "text-gray-400"
                            )}>
                              {channel.activeCount}/{channel.memberCount} active
                            </span>
                            {channel.requiredClearance && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-yellow-900 text-yellow-300 border-yellow-600"
                              >
                                L{channel.requiredClearance}+
                              </Badge>
                            )}
                          </div>
                          {channel.lastActivity && (
                            <span className="text-gray-500 radio-mono">
                              {channel.lastActivity}
                            </span>
                          )}
                        </div>
                        
                        {channel.tags && channel.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {channel.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-gray-700 text-gray-300 border-gray-600 radio-mono"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredChannels.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm radio-mono">No channels found</p>
                {searchQuery && (
                  <p className="text-xs mt-1 text-gray-500">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}