/**
 * Test Component for Real-time Chat
 * Simple UI to test WebSocket messaging between two users
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRealtimeCommunications } from '../hooks/useRealtimeCommunications';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Circle, CircleCheck, Wifi, WifiOff } from 'lucide-react';

export function TestRealtimeChat() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnected,
    isReady,
    connectionState,
    messages,
    channelId,
    sendMessage,
    sendTypingIndicator,
    currentUser
  } = useRealtimeCommunications('main');
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 1000);
  };
  
  // Handle sending message
  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message, 'text');
      setMessage('');
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  };
  
  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get connection status color
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4" />;
    } else {
      return <WifiOff className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Real-time Chat Test</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              Channel: {channelId}
            </Badge>
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium capitalize">{connectionState}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Logged in as: <strong>{currentUser.email}</strong> ({currentUser.role})
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUser.id || 
                                    msg.senderEmail === currentUser.email;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {msg.senderEmail}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0 ${
                            isOwnMessage ? 'border-blue-300 text-blue-100' : ''
                          }`}
                        >
                          {msg.senderRole}
                        </Badge>
                      </div>
                      <p className="text-sm break-words">{msg.content}</p>
                      <div className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !message.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!isReady && (
            <div className="mt-2 text-sm text-yellow-600">
              Connecting to chat server...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}