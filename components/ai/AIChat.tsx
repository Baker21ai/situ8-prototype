'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  MessageSquare,
  ChevronDown,
  Copy
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
  onClearConversation: () => void;
}

export function AIChat({ 
  messages, 
  isProcessing, 
  onSendMessage, 
  onClearConversation 
}: AIChatProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    onClearConversation();
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

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100"
              onClick={() => handleCopy(message.content)}
            >
              <Copy className="w-3 h-3" />
            </Button>

            

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
      {/* Custom Notification Div - NEW! */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 m-2 rounded-r-md">
        <div className="flex items-center">
          <Bot className="w-4 h-4 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800 font-medium">AI Assistant is ready to help! 🚀</p>
          <span className="ml-auto text-[11px] text-blue-700/80">Powered by AWS Bedrock</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto">
        <ScrollArea ref={scrollAreaRef} className="px-4 py-2">
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
        
        
      </div>

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
          <Button
            onClick={handleClear}
            disabled={isProcessing}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            Clear
          </Button>
        </div>

        
      </div>
    </div>
  );
}