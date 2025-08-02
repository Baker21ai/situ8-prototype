import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PTTButton } from './PTTButton';
import { VoiceChannelManager } from './VoiceChannelManager';
import { voiceService } from '../../services/voice.service';
import { format } from 'date-fns';

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderEmail: string;
  senderRole: string;
  content: string;
  timestamp: number;
  messageType: 'text' | 'voice_transcript' | 'system';
}

interface CommunicationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userRole: string;
  userClearance?: number;
  token: string;
}

export function CommunicationsModal({
  open,
  onOpenChange,
  userId,
  userName,
  userRole,
  userClearance = 1,
  token
}: CommunicationsModalProps) {
  const [activeChannel, setActiveChannel] = useState('main');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, subscribe, isConnected } = useWebSocket({ token });

  useEffect(() => {
    if (!open) return;

    // Join the default channel
    sendMessage({
      action: 'joinChannel',
      channelId: activeChannel
    });

    // Subscribe to new messages
    const unsubscribeMessages = subscribe('newMessage', (data) => {
      if (data.message && data.message.channelId === activeChannel) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // Monitor voice connection
    voiceService.setCallbacks({
      onConnectionStateChanged: (state) => {
        setIsVoiceConnected(state === 'connected');
      }
    });

    return () => {
      unsubscribeMessages();
      sendMessage({
        action: 'leaveChannel',
        channelId: activeChannel
      });
    };
  }, [open, activeChannel, sendMessage, subscribe]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;

    sendMessage({
      action: 'sendMessage',
      channelId: activeChannel,
      content: inputValue.trim(),
      messageType: 'text'
    });

    setInputValue('');
  };

  const handleChannelChange = (newChannel: string) => {
    // Leave current channel
    sendMessage({
      action: 'leaveChannel',
      channelId: activeChannel
    });

    // Join new channel
    setActiveChannel(newChannel);
    sendMessage({
      action: 'joinChannel',
      channelId: newChannel
    });

    // Clear messages (in real app, would load channel history)
    setMessages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Communications Center</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant={isVoiceConnected ? 'default' : 'outline'}>
                <Phone className="w-3 h-3 mr-1" />
                {isVoiceConnected ? 'Voice Active' : 'Voice Off'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeChannel} onValueChange={handleChannelChange} className="flex-1 flex flex-col">
          <TabsList className="mx-6">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="dispatch" disabled={userClearance < 3}>
              Dispatch
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 flex">
            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              <TabsContent value={activeChannel} className="flex-1 m-0 p-0">
                <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages in this channel
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-3',
                            message.senderId === userId && 'justify-end'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg p-3',
                              message.senderId === userId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {message.senderEmail}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {message.senderRole}
                              </Badge>
                              {message.messageType === 'voice_transcript' && (
                                <Mic className="w-3 h-3" />
                              )}
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70">
                              {format(new Date(message.timestamp), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t px-6 py-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type a message..."
                      disabled={!isConnected}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!isConnected || !inputValue.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </div>

            {/* Voice Panel */}
            <div className="w-80 border-l bg-muted/10 p-6">
              <h3 className="font-medium mb-4">Voice Communication</h3>
              
              <VoiceChannelManager
                userId={userId}
                userName={userName}
                userClearance={userClearance}
                token={token}
                className="mb-6"
              />

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    sendMessage({
                      action: 'sendMessage',
                      channelId: activeChannel,
                      content: '10-4 (Acknowledged)',
                      messageType: 'text'
                    });
                  }}
                >
                  10-4 (Acknowledged)
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    sendMessage({
                      action: 'sendMessage',
                      channelId: activeChannel,
                      content: '10-20 (Location)',
                      messageType: 'text'
                    });
                  }}
                >
                  10-20 (Location)
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600"
                  onClick={() => {
                    sendMessage({
                      action: 'sendMessage',
                      channelId: 'emergency',
                      content: '10-33 (Emergency)',
                      messageType: 'text'
                    });
                    handleChannelChange('emergency');
                  }}
                >
                  10-33 (Emergency)
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}