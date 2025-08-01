/**
 * Custom hook for managing AI conversation state
 * Handles message history, streaming responses, and conversation context
 */

import { useState, useCallback, useRef } from 'react';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  actionId?: string;
  entityId?: string;
  entityType?: 'incident' | 'activity' | 'case';
}

export interface ConversationStats {
  totalMessages: number;
  actionsExecuted: number;
  lastActionTime?: Date;
  averageResponseTime: number;
}

export function useAIConversation() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 AI Assistant ready! I can help you:\n\n• **Create incidents**: "Create fire incident in Building A"\n• **Log activities**: "Log patrol activity in North Wing"\n• **Emergency response**: "Medical emergency in Building B"\n\nJust tell me what you need!',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const responseTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const addMessage = useCallback((message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<AIMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  const startTyping = useCallback(() => {
    setIsTyping(true);
    startTimeRef.current = Date.now();
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    responseTimeRef.current = Date.now() - startTimeRef.current;
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: '🔄 Conversation cleared. How can I help you?',
      timestamp: new Date(),
      status: 'sent'
    }]);
  }, []);

  const getConversationStats = useCallback((): ConversationStats => {
    const actionsExecuted = messages.filter(msg => 
      msg.entityId && msg.status === 'sent'
    ).length;
    
    const lastActionMessage = messages
      .filter(msg => msg.entityId && msg.status === 'sent')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      totalMessages: messages.length,
      actionsExecuted,
      lastActionTime: lastActionMessage?.timestamp,
      averageResponseTime: responseTimeRef.current
    };
  }, [messages]);

  const getRecentActions = useCallback(() => {
    return messages
      .filter(msg => msg.entityId && msg.status === 'sent')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(msg => ({
        id: msg.id,
        entityId: msg.entityId!,
        entityType: msg.entityType!,
        timestamp: msg.timestamp,
        description: msg.content
      }));
  }, [messages]);

  const streamResponse = useCallback(async (content: string, options?: {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    entityId?: string;
    entityType?: 'incident' | 'activity' | 'case';
  }) => {
    const messageId = addMessage({
      role: 'assistant',
      content: '',
      status: 'sending',
      entityId: options?.entityId,
      entityType: options?.entityType
    });

    try {
      startTyping();
      options?.onStart?.();

      // Simulate streaming by adding content gradually
      const words = content.split(' ');
      let currentContent = '';

      for (let i = 0; i < words.length; i++) {
        currentContent += (i > 0 ? ' ' : '') + words[i];
        updateMessage(messageId, { content: currentContent });
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      updateMessage(messageId, { status: 'sent' });
      options?.onComplete?.();
    } catch (error) {
      updateMessage(messageId, { 
        status: 'error',
        content: 'Error generating response. Please try again.'
      });
      options?.onError?.(error as Error);
    } finally {
      stopTyping();
    }

    return messageId;
  }, [addMessage, updateMessage, startTyping, stopTyping]);

  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant') return;

    updateMessage(messageId, { status: 'sending', content: '' });
    
    // Re-stream the content
    await streamResponse(message.content, {
      entityId: message.entityId,
      entityType: message.entityType
    });
  }, [messages, updateMessage, streamResponse]);

  return {
    messages,
    isTyping,
    addMessage,
    updateMessage,
    streamResponse,
    retryMessage,
    clearConversation,
    getConversationStats,
    getRecentActions,
    startTyping,
    stopTyping
  };
}