import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Play,
  Pause,
  Clock,
  MapPin,
  Shield,
  Bot,
  User,
  AlertTriangle,
  Info,
  CheckCheck,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderClearance?: number;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'system' | 'ai' | 'alert';
  voiceDuration?: number;
  voiceTranscript?: string;
  transcriptionConfidence?: number;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  location?: {
    building: string;
    zone: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  relatedActivityId?: string;
  threadId?: string;
  isEdited?: boolean;
  editedAt?: string;
}

interface MessagePanelProps {
  channelId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
}

export function MessagePanel({ 
  channelId, 
  messages, 
  onSendMessage,
  currentUserId,
  isLoading 
}: MessagePanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAudioPlayback = (messageId: string) => {
    setPlayingAudioId(playingAudioId === messageId ? null : messageId);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'ai': return Bot;
      case 'system': return Info;
      case 'alert': return AlertTriangle;
      default: return User;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return '';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent': return <Check className="h-3 w-3" />;
      case 'delivered': return <CheckCheck className="h-3 w-3" />;
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Messages</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {messages.length} messages
            </Badge>
            {isLoading && (
              <Badge variant="secondary" className="text-xs">
                Loading...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-4 my-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(date).toDateString() === new Date().toDateString() 
                      ? 'Today' 
                      : date}
                  </span>
                  <Separator className="flex-1" />
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUserId;
                    const Icon = getMessageIcon(message.type);
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isOwnMessage && "flex-row-reverse"
                        )}
                      >
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.type === 'ai' ? (
                              <Bot className="h-4 w-4" />
                            ) : message.type === 'system' ? (
                              <Info className="h-4 w-4" />
                            ) : (
                              message.senderName.split(' ').map(n => n[0]).join('')
                            )}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Message content */}
                        <div 
                          className={cn(
                            "flex-1 max-w-[70%]",
                            isOwnMessage && "items-end"
                          )}
                        >
                          {/* Sender info */}
                          <div className={cn(
                            "flex items-center gap-2 mb-1",
                            isOwnMessage && "justify-end"
                          )}>
                            <span className="text-sm font-medium">
                              {message.senderName}
                            </span>
                            {message.senderRole && (
                              <Badge variant="outline" className="text-xs">
                                {message.senderRole}
                              </Badge>
                            )}
                            {message.senderClearance && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                L{message.senderClearance}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          
                          {/* Message bubble */}
                          <div className={cn(
                            "rounded-lg p-3",
                            isOwnMessage 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted",
                            message.priority && getPriorityColor(message.priority)
                          )}>
                            {/* Voice message */}
                            {message.type === 'voice' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={isOwnMessage ? "secondary" : "outline"}
                                    className="h-8 w-8 p-0"
                                    onClick={() => toggleAudioPlayback(message.id)}
                                  >
                                    {playingAudioId === message.id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <span className="text-sm">
                                    {message.voiceDuration}s
                                  </span>
                                  {message.transcriptionConfidence && (
                                    <Badge 
                                      variant={isOwnMessage ? "secondary" : "outline"} 
                                      className="text-xs"
                                    >
                                      {Math.round(message.transcriptionConfidence * 100)}%
                                    </Badge>
                                  )}
                                </div>
                                {message.voiceTranscript && (
                                  <p className="text-sm italic">
                                    "{message.voiceTranscript}"
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Text message */}
                            {message.type === 'text' && (
                              <p className="text-sm">{message.content}</p>
                            )}
                            
                            {/* System/AI message */}
                            {(message.type === 'system' || message.type === 'ai') && (
                              <div className="flex items-start gap-2">
                                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{message.content}</p>
                              </div>
                            )}
                            
                            {/* Alert message */}
                            {message.type === 'alert' && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-medium">{message.content}</p>
                              </div>
                            )}
                            
                            {/* Location info */}
                            {message.location && (
                              <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {message.location.building} - {message.location.zone}
                                </span>
                              </div>
                            )}
                            
                            {/* Related activity */}
                            {message.relatedActivityId && (
                              <div className="mt-2">
                                <Badge 
                                  variant={isOwnMessage ? "secondary" : "outline"} 
                                  className="text-xs"
                                >
                                  Activity: {message.relatedActivityId}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Status indicator */}
                          {isOwnMessage && message.status && (
                            <div className="flex justify-end mt-1">
                              {getStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start a conversation</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                isRecording && "text-red-500"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <Button size="icon" variant="ghost">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>Recording...</span>
              <Button size="sm" variant="ghost" onClick={() => setIsRecording(false)}>
                Stop
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}