/**
 * Real-time Chat Store
 * Connects chat UI to WebSocket backend for real-time messaging
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUserStore } from './userStore';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  content: string;
  type: 'text' | 'voice' | 'radio' | 'system' | 'file';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    type: 'image' | 'file' | 'voice';
    url: string;
    name: string;
    size?: number;
    duration?: number;
  }[];
  metadata?: {
    radioMessageId?: string;
    activityId?: string;
    location?: string;
    transcriptionConfidence?: number;
  };
  replyTo?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'building' | 'broadcast';
  name: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastActivity: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  metadata?: {
    building?: string;
    purpose?: string;
    createdBy?: string;
    createdAt?: string;
  };
  avatar?: string;
  description?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

interface RealtimeChatState {
  // State
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeConversationId: string | null;
  typingIndicators: TypingIndicator[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // WebSocket instance
  ws: WebSocket | null;
  
  // Pagination
  messagesCursor: Record<string, string | null>;
  hasMoreMessages: Record<string, boolean>;
  
  // UI State
  searchQuery: string;
  selectedMessageId: string | null;
  replyingToMessageId: string | null;
  
  // Actions
  initializeWebSocket: () => void;
  setActiveConversation: (conversationId: string | null) => void;
  createConversation: (type: Conversation['type'], participants: string[], name: string, metadata?: Conversation['metadata']) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string, type?: ChatMessage['type'], attachments?: ChatMessage['attachments']) => Promise<void>;
  loadMessages: (conversationId: string, cursor?: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  addTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (userId: string, conversationId: string) => void;
  pinConversation: (conversationId: string) => void;
  muteConversation: (conversationId: string) => void;
  searchMessages: (query: string) => void;
  setReplyingTo: (messageId: string | null) => void;
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void;
  
  // WebSocket handlers
  handleWebSocketMessage: (data: any) => void;
  handleConnectionStateChange: (state: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
}

// Default conversations for initial state
const defaultConversations: Conversation[] = [
  {
    id: 'main',
    type: 'broadcast',
    name: 'Main Channel',
    participants: ['all'],
    lastActivity: new Date().toISOString(),
    unreadCount: 0,
    isPinned: true,
    metadata: {
      purpose: 'Main communication channel for all security personnel'
    }
  },
  {
    id: 'emergency',
    type: 'broadcast',
    name: 'Emergency Channel',
    participants: ['all'],
    lastActivity: new Date().toISOString(),
    unreadCount: 0,
    isPinned: true,
    metadata: {
      purpose: 'Emergency communications only'
    }
  }
];

export const useRealtimeChatStore = create<RealtimeChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      conversations: defaultConversations,
      messages: {},
      activeConversationId: 'main',
      typingIndicators: [],
      isLoading: false,
      error: null,
      isConnected: false,
      connectionState: 'disconnected',
      ws: null,
      messagesCursor: {},
      hasMoreMessages: {},
      searchQuery: '',
      selectedMessageId: null,
      replyingToMessageId: null,

      // Initialize WebSocket connection
      initializeWebSocket: () => {
        const state = get();
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
          return; // Already connected
        }

        const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev';
        
        // Get auth token
        const currentUser = useUserStore.getState().currentUser;
        const token = localStorage.getItem('cognitoIdToken') || `test-${currentUser?.email || 'anonymous'}-${currentUser?.role || 'user'}`;
        
        const ws = new WebSocket(`${wsUrl}?token=${token}`);
        
        ws.onopen = () => {
          console.log('Chat WebSocket connected');
          set({ 
            ws, 
            isConnected: true, 
            connectionState: 'connected',
            error: null 
          });
          
          // Join main channel
          ws.send(JSON.stringify({
            action: 'join',
            channelId: 'main'
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            get().handleWebSocketMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          set({ 
            connectionState: 'error',
            error: 'Connection error' 
          });
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          set({ 
            ws: null,
            isConnected: false, 
            connectionState: 'disconnected' 
          });
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (get().connectionState === 'disconnected') {
              get().initializeWebSocket();
            }
          }, 3000);
        };
        
        set({ ws, connectionState: 'connecting' });
      },

      // Handle incoming WebSocket messages
      handleWebSocketMessage: (data: any) => {
        const { action } = data;
        
        switch (action) {
          case 'message':
            // New message received
            if (data.message) {
              const message: ChatMessage = {
                id: data.message.messageId || `msg-${Date.now()}`,
                conversationId: data.message.channelId || 'main',
                senderId: data.message.senderId,
                senderName: data.message.senderEmail || data.message.senderId,
                senderEmail: data.message.senderEmail,
                senderRole: data.message.senderRole,
                content: data.message.content,
                type: data.message.type || 'text',
                timestamp: data.message.timestamp || new Date().toISOString(),
                status: 'delivered',
                metadata: data.message.metadata
              };
              
              const { messages } = get();
              const conversationMessages = messages[message.conversationId] || [];
              
              // Check if message already exists (prevent duplicates)
              if (!conversationMessages.find(m => m.id === message.id)) {
                set({
                  messages: {
                    ...messages,
                    [message.conversationId]: [...conversationMessages, message]
                  }
                });
                
                // Update conversation's last message
                const conversations = get().conversations.map(conv => {
                  if (conv.id === message.conversationId) {
                    return {
                      ...conv,
                      lastMessage: message,
                      lastActivity: message.timestamp,
                      unreadCount: conv.id !== get().activeConversationId 
                        ? conv.unreadCount + 1 
                        : conv.unreadCount
                    };
                  }
                  return conv;
                });
                set({ conversations });
              }
            }
            break;
            
          case 'message_history':
            // Message history received when joining channel
            if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
              const channelId = data.messages[0].channelId || 'main';
              const historyMessages: ChatMessage[] = data.messages.map((msg: any) => ({
                id: msg.messageId || `msg-${Date.now()}-${Math.random()}`,
                conversationId: msg.channelId || channelId,
                senderId: msg.senderId,
                senderName: msg.senderEmail || msg.senderId,
                senderEmail: msg.senderEmail,
                senderRole: msg.senderRole,
                content: msg.content,
                type: msg.type || 'text',
                timestamp: msg.timestamp || new Date().toISOString(),
                status: 'delivered',
                metadata: msg.metadata
              }));
              
              set({
                messages: {
                  ...get().messages,
                  [channelId]: historyMessages
                }
              });
            }
            break;
            
          case 'user_joined':
            console.log('User joined:', data.userEmail);
            break;
            
          case 'user_left':
            console.log('User left:', data.userId);
            break;
            
          case 'typing':
            // Handle typing indicator
            if (data.isTyping) {
              get().addTypingIndicator({
                conversationId: data.channelId || 'main',
                userId: data.userId,
                userName: data.userEmail || data.userId,
                timestamp: Date.now()
              });
            } else {
              get().removeTypingIndicator(data.userId, data.channelId || 'main');
            }
            break;
            
          case 'pong':
            // Keepalive response
            break;
            
          default:
            console.log('Unknown WebSocket action:', action);
        }
      },

      // Handle connection state changes
      handleConnectionStateChange: (state) => {
        set({ connectionState: state, isConnected: state === 'connected' });
      },

      // Set active conversation
      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
        
        // Join the channel via WebSocket
        const ws = get().ws;
        if (ws && ws.readyState === WebSocket.OPEN && conversationId) {
          ws.send(JSON.stringify({
            action: 'join',
            channelId: conversationId
          }));
        }
        
        // Mark messages as read
        if (conversationId) {
          const conversations = get().conversations.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          });
          set({ conversations });
        }
      },

      // Create conversation
      createConversation: async (type, participants, name, metadata) => {
        // In real implementation, this would call an API
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          type,
          name,
          participants,
          lastActivity: new Date().toISOString(),
          unreadCount: 0,
          metadata
        };
        
        set({ 
          conversations: [...get().conversations, newConversation] 
        });
        
        return newConversation;
      },

      // Send message
      sendMessage: async (conversationId, content, type = 'text', attachments) => {
        const currentUser = useUserStore.getState().currentUser;
        const ws = get().ws;
        
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          set({ error: 'Not connected to chat server' });
          return;
        }
        
        // Create optimistic message
        const optimisticMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          conversationId,
          senderId: currentUser?.id || 'unknown',
          senderName: currentUser?.email || 'Unknown User',
          senderEmail: currentUser?.email,
          senderRole: currentUser?.role,
          content,
          type,
          timestamp: new Date().toISOString(),
          status: 'sending',
          attachments,
          replyTo: get().replyingToMessageId || undefined
        };
        
        // Add to messages optimistically
        const messages = get().messages;
        set({
          messages: {
            ...messages,
            [conversationId]: [...(messages[conversationId] || []), optimisticMessage]
          },
          replyingToMessageId: null
        });
        
        // Send via WebSocket
        ws.send(JSON.stringify({
          action: 'message',
          channelId: conversationId,
          content,
          type,
          metadata: {
            attachments,
            replyTo: get().replyingToMessageId
          }
        }));
        
        // Update message status after a short delay
        setTimeout(() => {
          get().updateMessageStatus(optimisticMessage.id, 'sent');
        }, 500);
      },

      // Load messages (from cache or fetch if needed)
      loadMessages: async (conversationId, cursor) => {
        // Messages are loaded via WebSocket when joining channel
        // This is here for compatibility
        const ws = get().ws;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'join',
            channelId: conversationId
          }));
        }
      },

      // Load conversations
      loadConversations: async () => {
        // In real implementation, fetch from API
        // For now, we use default conversations
      },

      // Mark as read
      markAsRead: (conversationId, messageId) => {
        const messages = get().messages[conversationId] || [];
        const updatedMessages = messages.map(msg => {
          if (msg.id === messageId && msg.status !== 'read') {
            return { ...msg, status: 'read' as const };
          }
          return msg;
        });
        
        set({
          messages: {
            ...get().messages,
            [conversationId]: updatedMessages
          }
        });
      },

      // Delete message
      deleteMessage: (messageId) => {
        const messages = get().messages;
        const updatedMessages: Record<string, ChatMessage[]> = {};
        
        Object.keys(messages).forEach(convId => {
          updatedMessages[convId] = messages[convId].filter(msg => msg.id !== messageId);
        });
        
        set({ messages: updatedMessages });
      },

      // Set typing indicator
      setTyping: (conversationId, isTyping) => {
        const ws = get().ws;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'typing',
            channelId: conversationId,
            isTyping
          }));
        }
      },

      // Add typing indicator
      addTypingIndicator: (indicator) => {
        const indicators = get().typingIndicators.filter(
          i => !(i.userId === indicator.userId && i.conversationId === indicator.conversationId)
        );
        set({ typingIndicators: [...indicators, indicator] });
        
        // Remove after 3 seconds
        setTimeout(() => {
          get().removeTypingIndicator(indicator.userId, indicator.conversationId);
        }, 3000);
      },

      // Remove typing indicator
      removeTypingIndicator: (userId, conversationId) => {
        set({
          typingIndicators: get().typingIndicators.filter(
            i => !(i.userId === userId && i.conversationId === conversationId)
          )
        });
      },

      // Pin conversation
      pinConversation: (conversationId) => {
        const conversations = get().conversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, isPinned: !conv.isPinned };
          }
          return conv;
        });
        set({ conversations });
      },

      // Mute conversation
      muteConversation: (conversationId) => {
        const conversations = get().conversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, isMuted: !conv.isMuted };
          }
          return conv;
        });
        set({ conversations });
      },

      // Search messages
      searchMessages: (query) => {
        set({ searchQuery: query });
      },

      // Set replying to
      setReplyingTo: (messageId) => {
        set({ replyingToMessageId: messageId });
      },

      // Update message status
      updateMessageStatus: (messageId, status) => {
        const messages = get().messages;
        const updatedMessages: Record<string, ChatMessage[]> = {};
        
        Object.keys(messages).forEach(convId => {
          updatedMessages[convId] = messages[convId].map(msg => {
            if (msg.id === messageId) {
              return { ...msg, status };
            }
            return msg;
          });
        });
        
        set({ messages: updatedMessages });
      }
    }),
    {
      name: 'realtime-chat-store'
    }
  )
);