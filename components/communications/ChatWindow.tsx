import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Send, 
  Mic, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Reply,
  X,
  Radio as RadioIcon,
  Building,
  Users,
  MessageCircle,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useChatStore, ChatMessage } from '../../stores/chatStore';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  conversationId?: string;
  className?: string;
  onClose?: () => void;
}

export function ChatWindow({ 
  conversationId, 
  className = '',
  onClose 
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const {
    conversations,
    messages,
    activeConversationId,
    replyingToMessageId,
    sendMessage,
    setReplyingTo,
    loadMessages,
    typingIndicators
  } = useChatStore();

  const currentConversationId = conversationId || activeConversationId;
  const conversation = conversations.find(c => c.id === currentConversationId);
  const conversationMessages = messages[currentConversationId || ''] || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId && !messages[currentConversationId]) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId, loadMessages, messages]);

  const handleSend = async () => {
    if (!message.trim() || !currentConversationId) return;
    
    await sendMessage(currentConversationId, message.trim());
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // Simulate voice message
    if (currentConversationId && recordingDuration > 0) {
      await sendMessage(
        currentConversationId,
        'Voice message',
        'voice',
        [{
          type: 'voice',
          url: '/mock-voice-message.mp3',
          name: 'Voice message',
          duration: recordingDuration
        }]
      );
    }
    
    setRecordingDuration(0);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="h-4 w-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.senderId === 'current-user';
    const replyToMessage = msg.replyTo ? conversationMessages.find(m => m.id === msg.replyTo) : null;
    
    return (
      <div
        key={msg.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Reply preview */}
          {replyToMessage && (
            <div 
              className={`text-xs mb-1 px-2 py-1 rounded ${
                isOwnMessage ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Reply className="h-3 w-3 inline mr-1" />
              {replyToMessage.senderName}: {replyToMessage.content.substring(0, 50)}...
            </div>
          )}
          
          {/* Message bubble */}
          <div
            className={`
              px-4 py-2 rounded-lg 
              ${isOwnMessage 
                ? 'bg-blue-500 text-white' 
                : msg.type === 'radio'
                  ? 'bg-orange-100 text-orange-900 border border-orange-200'
                  : 'bg-gray-100 text-gray-900'
              }
            `}
          >
            {/* Sender name for group chats */}
            {!isOwnMessage && conversation?.type !== 'direct' && (
              <div className="font-medium text-sm mb-1">
                {msg.senderName}
              </div>
            )}
            
            {/* Radio message indicator */}
            {msg.type === 'radio' && (
              <div className="flex items-center gap-1 text-xs mb-1">
                <RadioIcon className="h-3 w-3" />
                <span>Radio Message</span>
                {msg.metadata?.transcriptionConfidence && (
                  <Badge variant="outline" className="text-xs px-1">
                    {Math.round(msg.metadata.transcriptionConfidence * 100)}%
                  </Badge>
                )}
              </div>
            )}
            
            {/* Voice message */}
            {msg.type === 'voice' && msg.attachments?.[0] && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 ${isOwnMessage ? 'text-white hover:bg-blue-400' : ''}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="h-8 bg-white/20 rounded-full"></div>
                </div>
                <span className="text-sm">
                  {formatDuration(msg.attachments[0].duration || 0)}
                </span>
              </div>
            )}
            
            {/* Text content */}
            {msg.type === 'text' && (
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            )}
            
            {/* System/Radio content */}
            {(msg.type === 'radio' || msg.type === 'system') && (
              <p className="whitespace-pre-wrap break-words italic">{msg.content}</p>
            )}
            
            {/* File attachment */}
            {msg.type === 'file' && msg.attachments?.[0] && (
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="underline">{msg.attachments[0].name}</span>
              </div>
            )}
          </div>
          
          {/* Message metadata */}
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span>{formatTime(msg.timestamp)}</span>
            {isOwnMessage && getMessageStatusIcon(msg.status)}
            {msg.metadata?.location && (
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                {msg.metadata.location}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Group messages by date
  const messagesByDate = conversationMessages.reduce((acc, msg) => {
    const date = format(new Date(msg.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const getConversationIcon = () => {
    switch (conversation?.type) {
      case 'direct':
        return <MessageCircle className="h-5 w-5" />;
      case 'group':
        return <Users className="h-5 w-5" />;
      case 'building':
        return <Building className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  if (!conversation) {
    return (
      <Card className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Select a conversation to start messaging</p>
        </div>
      </Card>
    );
  }

  const typingUsers = typingIndicators
    .filter(ti => ti.conversationId === currentConversationId)
    .map(ti => ti.userName);

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getConversationIcon()}
            <div>
              <h3 className="font-semibold">{conversation.name}</h3>
              {conversation.type === 'group' && (
                <p className="text-sm text-gray-500">
                  {conversation.participants.length} members
                </p>
              )}
              {conversation.metadata?.building && (
                <p className="text-sm text-gray-500">
                  {conversation.metadata.building}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Info className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.entries(messagesByDate).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-500">
                  {isToday(new Date(date)) 
                    ? 'Today' 
                    : isYesterday(new Date(date))
                      ? 'Yesterday'
                      : format(new Date(date), 'MMMM d, yyyy')
                  }
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              
              {/* Messages for this date */}
              {msgs.map(renderMessage)}
            </div>
          ))}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Reply preview */}
      {replyingToMessageId && (
        <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Replying to {conversationMessages.find(m => m.id === replyingToMessageId)?.senderName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Input area */}
      <CardContent className="p-4 border-t">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="h-10 w-10 p-0 rounded-full"
            >
              <Square className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-red-500 animate-pulse"></div>
                <div className="w-1 h-6 bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-1 h-8 bg-red-500 animate-pulse" style={{ animationDelay: '450ms' }}></div>
                <div className="w-1 h-6 bg-red-500 animate-pulse" style={{ animationDelay: '600ms' }}></div>
              </div>
              <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={stopRecording}
            >
              Send
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            {message.trim() ? (
              <Button 
                onClick={handleSend}
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={startRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}