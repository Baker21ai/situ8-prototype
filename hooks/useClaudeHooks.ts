import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface ClaudeMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface ClaudeChat {
  id: string;
  title: string;
  messages: ClaudeMessage[];
  status: 'idle' | 'active' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaudeHooksConfig {
  enableNotifications?: boolean;
  enableSounds?: boolean;
  autoSaveChats?: boolean;
  maxChatHistory?: number;
  notificationDuration?: number;
}

export interface ClaudeHooksReturn {
  // Chat management
  chats: ClaudeChat[];
  activeChat: ClaudeChat | null;
  createChat: (title?: string) => ClaudeChat;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  
  // Message management
  sendMessage: (content: string, chatId?: string) => Promise<ClaudeMessage>;
  addMessage: (message: Omit<ClaudeMessage, 'id' | 'timestamp'>, chatId?: string) => ClaudeMessage;
  updateMessage: (messageId: string, updates: Partial<ClaudeMessage>) => void;
  
  // Status and notifications
  isProcessing: boolean;
  lastCompletedChat: ClaudeChat | null;
  
  // Configuration
  config: ClaudeHooksConfig;
  updateConfig: (newConfig: Partial<ClaudeHooksConfig>) => void;
  
  // Utilities
  clearHistory: () => void;
  exportChats: () => string;
  importChats: (data: string) => void;
}

const defaultConfig: ClaudeHooksConfig = {
  enableNotifications: true,
  enableSounds: true,
  autoSaveChats: true,
  maxChatHistory: 50,
  notificationDuration: 4000,
};

export function useClaudeHooks(initialConfig?: Partial<ClaudeHooksConfig>): ClaudeHooksReturn {
  const [chats, setChats] = useState<ClaudeChat[]>([]);
  const [activeChat, setActiveChat] = useState<ClaudeChat | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCompletedChat, setLastCompletedChat] = useState<ClaudeChat | null>(null);
  const [config, setConfig] = useState<ClaudeHooksConfig>({ ...defaultConfig, ...initialConfig });
  
  const chatIdCounter = useRef(0);
  const messageIdCounter = useRef(0);

  // Load chats from localStorage on mount
  useEffect(() => {
    if (config.autoSaveChats) {
      const savedChats = localStorage.getItem('claude-chats');
      if (savedChats) {
        try {
          const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setChats(parsedChats);
        } catch (error) {
          console.error('Failed to load saved chats:', error);
        }
      }
    }
  }, [config.autoSaveChats]);

  // Save chats to localStorage when chats change
  useEffect(() => {
    if (config.autoSaveChats && chats.length > 0) {
      localStorage.setItem('claude-chats', JSON.stringify(chats));
    }
  }, [chats, config.autoSaveChats]);

  // Notification for chat completion
  useEffect(() => {
    if (lastCompletedChat && config.enableNotifications) {
      const lastMessage = lastCompletedChat.messages[lastCompletedChat.messages.length - 1];
      
      if (lastMessage?.role === 'assistant' && lastMessage.status === 'completed') {
        toast.success('Claude chat completed!', {
          description: `Chat "${lastCompletedChat.title}" has finished processing.`,
          duration: config.notificationDuration,
          action: {
            label: 'View',
            onClick: () => selectChat(lastCompletedChat.id),
          },
        });

        // Play notification sound if enabled
        if (config.enableSounds) {
          playNotificationSound();
        }
      }
    }
  }, [lastCompletedChat, config.enableNotifications, config.enableSounds, config.notificationDuration]);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (browser restrictions)
      });
    } catch (error) {
      // Ignore audio creation errors
    }
  }, []);

  const createChat = useCallback((title?: string): ClaudeChat => {
    const newChat: ClaudeChat = {
      id: `chat-${++chatIdCounter.current}`,
      title: title || `Chat ${chatIdCounter.current}`,
      messages: [],
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats(prev => {
      const updated = [newChat, ...prev];
      // Limit chat history
      if (config.maxChatHistory && updated.length > config.maxChatHistory) {
        return updated.slice(0, config.maxChatHistory);
      }
      return updated;
    });

    setActiveChat(newChat);
    return newChat;
  }, [config.maxChatHistory]);

  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
    }
  }, [chats]);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
    }
  }, [activeChat]);

  const addMessage = useCallback((
    message: Omit<ClaudeMessage, 'id' | 'timestamp'>,
    chatId?: string
  ): ClaudeMessage => {
    const newMessage: ClaudeMessage = {
      ...message,
      id: `msg-${++messageIdCounter.current}`,
      timestamp: new Date(),
    };

    const targetChatId = chatId || activeChat?.id;
    if (!targetChatId) {
      throw new Error('No active chat or chat ID provided');
    }

    setChats(prev => prev.map(chat => {
      if (chat.id === targetChatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, newMessage],
          updatedAt: new Date(),
          status: message.status === 'completed' ? 'completed' as const : chat.status,
        };

        // Set as last completed chat if message is completed
        if (message.role === 'assistant' && message.status === 'completed') {
          setLastCompletedChat(updatedChat);
        }

        return updatedChat;
      }
      return chat;
    }));

    return newMessage;
  }, [activeChat]);

  const updateMessage = useCallback((messageId: string, updates: Partial<ClaudeMessage>) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
      updatedAt: new Date(),
    })));
  }, []);

  const sendMessage = useCallback(async (content: string, chatId?: string): Promise<ClaudeMessage> => {
    const targetChatId = chatId || activeChat?.id;
    if (!targetChatId) {
      throw new Error('No active chat or chat ID provided');
    }

    setIsProcessing(true);

    // Add user message
    const userMessage = addMessage({
      content,
      role: 'user',
      status: 'completed',
    }, targetChatId);

    // Add assistant message with pending status
    const assistantMessage = addMessage({
      content: '',
      role: 'assistant',
      status: 'pending',
    }, targetChatId);

    try {
      // Simulate Claude API call (replace with actual API integration)
      await simulateClaudeResponse(assistantMessage.id, content);
      
      return assistantMessage;
    } catch (error) {
      updateMessage(assistantMessage.id, {
        status: 'error',
        content: 'Error: Failed to get response from Claude',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [activeChat, addMessage, updateMessage]);

  // Simulate Claude API response (replace with actual implementation)
  const simulateClaudeResponse = useCallback(async (messageId: string, userContent: string) => {
    // Simulate streaming
    updateMessage(messageId, { status: 'streaming' });

    const responses = [
      "I understand you're working on implementing Claude hooks for chat completion notifications. This is a great approach for improving user experience!",
      "Based on your request, I can help you create a comprehensive notification system that will alert users when Claude finishes processing their requests.",
      "The implementation you're building includes real-time status updates, toast notifications, and proper state management. This follows React best practices!",
      "Here's what I think about your approach: The use of custom hooks, context providers, and integration with existing UI components shows solid architectural thinking.",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const words = response.split(' ');

    // Simulate word-by-word streaming
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const partialContent = words.slice(0, i + 1).join(' ');
      updateMessage(messageId, { 
        content: partialContent,
        status: 'streaming',
      });
    }

    // Mark as completed
    updateMessage(messageId, { 
      status: 'completed',
      metadata: {
        model: 'claude-3-sonnet',
        tokens: words.length * 1.3,
        duration: words.length * 100,
      },
    });
  }, [updateMessage]);

  const updateConfig = useCallback((newConfig: Partial<ClaudeHooksConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const clearHistory = useCallback(() => {
    setChats([]);
    setActiveChat(null);
    setLastCompletedChat(null);
    if (config.autoSaveChats) {
      localStorage.removeItem('claude-chats');
    }
  }, [config.autoSaveChats]);

  const exportChats = useCallback(() => {
    return JSON.stringify(chats, null, 2);
  }, [chats]);

  const importChats = useCallback((data: string) => {
    try {
      const importedChats = JSON.parse(data).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setChats(importedChats);
      toast.success('Chats imported successfully!');
    } catch (error) {
      toast.error('Failed to import chats. Invalid format.');
    }
  }, []);

  return {
    chats,
    activeChat,
    createChat,
    selectChat,
    deleteChat,
    sendMessage,
    addMessage,
    updateMessage,
    isProcessing,
    lastCompletedChat,
    config,
    updateConfig,
    clearHistory,
    exportChats,
    importChats,
  };
}