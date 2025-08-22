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
import { useRealtimeChatStore, ChatMessage } from '../../stores/realtimeChatStore';
import { useCommunicationService } from '../../services/ServiceProvider';
import { useUserStore } from '../../stores/userStore';
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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
    loadMoreMessages,
    hasMoreMessages,
    typingIndicators,
    setTyping,
    initializeWebSocket,
    isConnected,
    connectionState,
    handleWebSocketMessage
  } = useRealtimeChatStore();
  const communicationService = useCommunicationService();
  const { currentUser } = useUserStore();

  const currentConversationId = conversationId || activeConversationId;
  const conversation = conversations.find(c => c.id === currentConversationId);
  const conversationMessages = messages[currentConversationId || ''] || [];

  // Initialize WebSocket on mount
  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Load persisted history when conversation changes (service-backed)
  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      if (!currentConversationId) return;
      try {
        const resp = await communicationService.getChannelMessages(currentConversationId, 50);
        if (!cancelled && resp.success && resp.data?.messages?.length) {
          handleWebSocketMessage({ action: 'message_history', messages: resp.data.messages });
        }
      } catch (e) {
        // ignore
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [currentConversationId, communicationService, handleWebSocketMessage]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    const handleTyping = () => {
      if (currentConversationId) {
        setTyping(currentConversationId, true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          setTyping(currentConversationId, false);
        }, 1000);
      }
    };
    
    if (message && currentConversationId) {
      handleTyping();
    }
    
    return () => clearTimeout(typingTimeout);
  }, [message, currentConversationId, setTyping]);

  const handleSend = async () => {
    if (!message.trim() || !currentConversationId) return;
    // Persist via service (DynamoDB) and broadcast via WebSocket
    await communicationService.sendMessage(
      currentConversationId,
      message.trim(),
      currentUser?.id || 'unknown',
      currentUser?.email || 'Unknown User',
      currentUser?.role || 'user',
      'text'
    );
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const requestMicrophone = async (): Promise<MediaStream | null> => {
    try {
      if (mediaStream) return mediaStream;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      return stream;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return null;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    const stream = await requestMicrophone();
    if (!stream) return;

    audioChunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.stop();
      });
    }

    // Create blob and local URL for playback
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];
    let fileUrl: string | null = null;
    try {
      // Upload to S3 via presigned URL
      const presign = await communicationService.getPresignedUploadUrl(`voice-${Date.now()}.webm`, 'audio/webm');
      if (presign.success && presign.data) {
        await communicationService.uploadToPresignedUrl(presign.data.uploadUrl, blob, 'audio/webm');
        fileUrl = presign.data.fileUrl;
      }
    } catch (e) {
      // Fallback to local blob URL (session-only)
      fileUrl = URL.createObjectURL(blob);
    }

    if (currentConversationId && recordingDuration > 0) {
      await communicationService.sendMessage(
        currentConversationId,
        'Voice message',
        currentUser?.id || 'unknown',
        currentUser?.email || 'Unknown User',
        currentUser?.role || 'user',
        'voice',
        {
          attachments: [
            {
              url: fileUrl,
              voiceDuration: recordingDuration
            } as any
          ]
        }
      );
    }

    setRecordingDuration(0);
  };

  // Keyboard Push-to-Talk: hold V or Space to record
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when typing in inputs or if already recording
      const target = e.target as HTMLElement;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isTyping) return;
      if ((e.key === 'v' || e.code === 'Space') && !isRecording) {
        e.preventDefault();
        startRecording();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.code === 'Space') {
        e.preventDefault();
        stopRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording]);

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
            {msg.type === 'voice' && (msg.attachments?.[0] || (msg.metadata as any)?.attachments?.[0]) && (
              <div className="flex items-center gap-3">
                <audio controls className="h-8">
                  <source src={(msg.attachments?.[0]?.url || (msg.metadata as any)?.attachments?.[0]?.url) as string} type="audio/webm" />
                </audio>
                <span className="text-sm">
                  {formatDuration((msg.attachments?.[0]?.duration || (msg.metadata as any)?.attachments?.[0]?.duration || 0) as number)}
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
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {conversation.type === 'group' && (
                  <span>{conversation.participants.length} members</span>
                )}
                {conversation.metadata?.building && (
                  <span>{conversation.metadata.building}</span>
                )}
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {isConnected ? 'Connected' : connectionState}
                </span>
              </div>
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
          {/* Load More Messages Button */}
          {currentConversationId && hasMoreMessages[currentConversationId] && (
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMoreMessages(currentConversationId)}
                className="text-xs"
              >
                Load More Messages
              </Button>
            </div>
          )}
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
                className={`h-10 w-10 p-0 ${isRecording ? 'text-red-600' : ''}`}
                onMouseDown={() => startRecording()}
                onMouseUp={() => stopRecording()}
                onMouseLeave={() => isRecording && stopRecording()}
                onTouchStart={() => startRecording()}
                onTouchEnd={() => stopRecording()}
                title="Hold to talk (V or Space)"
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