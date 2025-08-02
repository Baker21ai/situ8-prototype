import React, { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, Radio, Users, Volume2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PTTButton } from './PTTButton';
import { VoiceChannelManager } from './VoiceChannelManager';
import { voiceService } from '../../services/voice.service';
import { useWebSocket } from '../../hooks/useWebSocket';

interface RadioTrayProps {
  userId: string;
  userName: string;
  userRole: string;
  userClearance?: number;
  token: string;
  onOpenModal?: () => void;
  className?: string;
}

type TrayState = 'minimized' | 'compact' | 'expanded';

export function RadioTray({
  userId,
  userName,
  userRole,
  userClearance = 1,
  token,
  onOpenModal,
  className
}: RadioTrayProps) {
  const [trayState, setTrayState] = useState<TrayState>('compact');
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  
  const { isConnected: wsConnected, subscribe } = useWebSocket({ token });

  useEffect(() => {
    // Monitor voice connection state
    voiceService.setCallbacks({
      onConnectionStateChanged: (state) => {
        setIsConnected(state === 'connected');
        if (state === 'connected') {
          setCurrentChannel(voiceService.getCurrentChannel());
        } else {
          setCurrentChannel(null);
        }
      },
      onSpeakersChanged: setActiveSpeakers,
    });

    // Subscribe to new messages
    const unsubscribeMessages = subscribe('newMessage', () => {
      if (trayState === 'minimized') {
        setUnreadMessages(prev => prev + 1);
      }
    });

    return () => {
      unsubscribeMessages();
    };
  }, [subscribe, trayState]);

  const handleOpenChat = () => {
    setUnreadMessages(0);
    onOpenModal?.();
  };

  // Minimized state - professional radio button
  if (trayState === 'minimized') {
    return (
      <div className={cn(
        'fixed bottom-4 right-4 z-50',
        className
      )}>
        <Button
          onClick={() => setTrayState('compact')}
          className={cn(
            'rounded-full w-16 h-16 p-0 shadow-xl relative',
            'border-2 transition-all duration-300',
            'hover:scale-105 active:scale-95',
            isConnected 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-blue-500/25' 
              : 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300 shadow-gray-500/25'
          )}
        >
          <Radio className={cn(
            'w-7 h-7 text-white',
            isConnected && 'animate-pulse'
          )} />
          
          {/* Connection Status Ring */}
          <div className={cn(
            'absolute inset-0 rounded-full border-2',
            isConnected 
              ? 'border-green-400 animate-pulse' 
              : 'border-red-400'
          )} />
          
          {unreadMessages > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center animate-bounce"
              variant="destructive"
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop overlay for expanded state */}
      {trayState === 'expanded' && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setTrayState('compact')}
        />
      )}
      
      <div
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'bg-background border-2 rounded-lg shadow-2xl',
          'transition-all duration-300 ease-in-out',
          'backdrop-blur-md',
          trayState === 'compact' ? 'w-80' : 'w-96',
          'radio-fade-in',
          className
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded-full',
            isConnected 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          )}>
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground">Radio Control</span>
          {currentChannel && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-blue-600 text-white font-mono"
            >
              {currentChannel}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleOpenChat}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessages > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                variant="destructive"
              >
                {unreadMessages}
              </Badge>
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setTrayState(trayState === 'compact' ? 'expanded' : 'compact')}
          >
            {trayState === 'compact' ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setTrayState('minimized')}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Compact View */}
      {trayState === 'compact' && (
        <div className="p-4 space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-3 h-3 rounded-full border-2 border-white shadow-lg',
                wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span className={cn(
                'text-sm font-medium',
                wsConnected ? 'text-green-700' : 'text-red-700'
              )}>
                {wsConnected ? 'System Connected' : 'System Offline'}
              </span>
            </div>
            
            {activeSpeakers.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                <Volume2 className="w-3 h-3 text-orange-600 animate-pulse" />
                <span className="text-xs font-medium text-orange-700">
                  {activeSpeakers.length} active
                </span>
              </div>
            )}
          </div>

          {/* Quick PTT */}
          {isConnected && currentChannel && (
            <div className="flex justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <PTTButton
                channelId={currentChannel}
                size="md"
                className="shadow-lg"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={isConnected ? 'outline' : 'default'}
              className={cn(
                'relative overflow-hidden',
                isConnected 
                  ? 'border-blue-200 text-blue-700 hover:bg-blue-50' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              )}
              onClick={() => setTrayState('expanded')}
            >
              <Radio className="w-3 h-3 mr-1" />
              {isConnected ? 'Channels' : 'Connect'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 relative"
              onClick={handleOpenChat}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs" variant="destructive">
                  {unreadMessages}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {trayState === 'expanded' && (
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 rounded-lg border">
            <VoiceChannelManager
              userId={userId}
              userName={userName}
              userClearance={userClearance}
              token={token}
            />
          </div>
          
          {/* User Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{userName}</div>
                  <div className="text-xs text-gray-500">{userRole}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  {userRole}
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                  L{userClearance}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}