'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Check, 
  AlertTriangle, 
  Clock, 
  Zap,
  Shield,
  Activity,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  actionType?: 'create_incident' | 'create_activity' | 'search' | 'update_status';
  actionData?: any;
  isStreaming?: boolean;
}

interface AIChatProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
  onActionConfirm: (messageId: string, confirmed: boolean) => void;
}

export function AIChat({ 
  messages, 
  isProcessing, 
  onSendMessage, 
  onActionConfirm 
}: AIChatProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 mb-4",
          isUser && "flex-row-reverse"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary text-primary-foreground" : 
          isSystem ? "bg-muted" : "bg-accent text-accent-foreground"
        )}>
          {isUser && <User className="w-4 h-4" />}
          {!isUser && !isSystem && <Bot className="w-4 h-4" />}
          {isSystem && <Shield className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex-1 max-w-[85%]",
          isUser && "text-right"
        )}>
          <div className={cn(
            "inline-block p-3 rounded-lg text-sm",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : isSystem 
                ? "bg-muted text-muted-foreground border"
                : "bg-card border"
          )}>
            {/* Message text */}
            <div className="whitespace-pre-wrap">
              {message.content}
              {message.isStreaming && (
                <span className="animate-pulse">|</span>
              )}
            </div>

            {/* Action Preview */}
            {message.actionType && message.actionData && (
              <div className="mt-3 p-2 bg-background/50 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  {message.actionType === 'create_incident' && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  {message.actionType === 'create_activity' && (
                    <Activity className="w-4 h-4 text-blue-500" />
                  )}
                  {message.actionType === 'search' && (
                    <MessageSquare className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-xs font-medium">
                    {message.actionType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="text-xs space-y-1">
                  {Object.entries(message.actionData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => onActionConfirm(message.id, true)}
                    className="h-6 px-2 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActionConfirm(message.id, false)}
                    className="h-6 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Message Status */}
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs",
              isUser ? "justify-start" : "justify-end"
            )}>
              <span className="text-muted-foreground">
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              
              {message.status === 'sending' && (
                <Clock className="w-3 h-3 text-muted-foreground animate-spin" />
              )}
              {message.status === 'sent' && (
                <Check className="w-3 h-3 text-green-500" />
              )}
              {message.status === 'error' && (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">AI Assistant Ready</h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Ask me to create incidents, search records, or manage activities
              </p>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="space-y-2 w-full max-w-[240px]">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => setInputValue("Create a fire incident in Building A")}
              >
                <Zap className="w-3 h-3 mr-2" />
                Create Fire Incident
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => setInputValue("Create medical incident in Building B")}
              >
                <Activity className="w-3 h-3 mr-2" />
                Medical Emergency
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => setInputValue("Show today's incidents")}
              >
                <MessageSquare className="w-3 h-3 mr-2" />
                Show Today's Incidents
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={() => setInputValue("Assign Unit 5 to patrol")}
              >
                <Shield className="w-3 h-3 mr-2" />
                Assign Guards
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            
            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-lg bg-card border">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <Separator />
      <div className="p-3 bg-background/50">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              data-ai-chat-input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI to create incidents, search records..."
              className={cn(
                "w-full min-h-[32px] max-h-[80px] px-3 py-2 text-sm resize-none",
                "bg-background border border-border rounded-md",
                "focus:outline-none focus:ring-1 focus:ring-primary",
                "placeholder:text-muted-foreground"
              )}
              rows={1}
              disabled={isProcessing}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
            className="h-8 px-3"
          >
            Send
          </Button>
        </div>

        {/* Character Count */}
        {inputValue.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {inputValue.length}/500
          </div>
        )}
      </div>
    </div>
  );
}