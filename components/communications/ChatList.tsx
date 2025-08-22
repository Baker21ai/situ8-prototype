import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  MessageCircle, 
  Users, 
  Building, 
  Pin,
  Volume2,
  VolumeX,
  Circle,
  Search,
  Plus,
  Radio
} from 'lucide-react';
import { useRealtimeChatStore } from '../../stores/realtimeChatStore';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  onConversationSelect?: (conversationId: string) => void;
  onCreateConversation?: () => void;
  className?: string;
}

export function ChatList({ 
  onConversationSelect, 
  onCreateConversation,
  className = '' 
}: ChatListProps) {
  const { 
    conversations, 
    activeConversationId,
    setActiveConversation,
    initializeWebSocket
  } = useRealtimeChatStore();
  
  // Initialize WebSocket on mount
  React.useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  // Sort conversations by pinned first, then by last activity
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by last activity
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }, [conversations]);

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'building':
        return <Building className="h-4 w-4" />;
      case 'broadcast':
        return <Radio className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessagePreview = (message: any) => {
    if (!message) return 'No messages yet';
    
    if (message.type === 'voice') {
      return '🎤 Voice message';
    } else if (message.type === 'radio') {
      return message.content;
    } else if (message.type === 'file') {
      return '📎 File attachment';
    }
    
    return message.content;
  };

  const handleConversationClick = (conversationId: string) => {
    setActiveConversation(conversationId);
    onConversationSelect?.(conversationId);
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCreateConversation}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedConversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const hasUnread = conversation.unreadCount > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${isActive 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getConversationIcon(conversation.type)}
                      <span className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conversation.name}
                      </span>
                      {conversation.isPinned && (
                        <Pin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                      {conversation.isMuted && (
                        <VolumeX className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {conversation.lastMessage && 
                        formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { 
                          addSuffix: true 
                        }).replace('about ', '')
                      }
                    </span>
                  </div>
                  
                  {/* Message Preview Row */}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate flex-1 ${
                      hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage && (
                        <>
                          {conversation.lastMessage.senderId === 'current-user' && (
                            <span className="text-gray-500">You: </span>
                          )}
                          {getMessagePreview(conversation.lastMessage)}
                        </>
                      )}
                    </p>
                    
                    {hasUnread && (
                      <Badge 
                        variant="default" 
                        className="ml-2 h-5 min-w-[20px] flex items-center justify-center text-xs"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Metadata Row (for building/group chats) */}
                  {conversation.metadata && (
                    <div className="flex items-center gap-2 mt-1">
                      {conversation.metadata.building && (
                        <Badge variant="outline" className="text-xs">
                          <Building className="h-3 w-3 mr-1" />
                          {conversation.metadata.building}
                        </Badge>
                      )}
                      {conversation.type === 'group' && (
                        <span className="text-xs text-gray-500">
                          {conversation.participants.length} members
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Empty State */}
        {conversations.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={onCreateConversation}
                className="mt-2"
              >
                Start a conversation
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}