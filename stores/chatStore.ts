import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'voice' | 'radio' | 'system' | 'file';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    type: 'image' | 'file' | 'voice';
    url: string;
    name: string;
    size?: number;
    duration?: number; // for voice messages
  }[];
  metadata?: {
    radioMessageId?: string;
    activityId?: string;
    location?: string;
    transcriptionConfidence?: number;
  };
  replyTo?: string; // ID of message being replied to
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

interface ChatState {
  // State
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>; // conversationId -> messages
  activeConversationId: string | null;
  typingIndicators: TypingIndicator[];
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  messagesCursor: Record<string, string | null>; // conversationId -> cursor
  hasMoreMessages: Record<string, boolean>; // conversationId -> hasMore
  
  // UI State
  searchQuery: string;
  selectedMessageId: string | null;
  replyingToMessageId: string | null;
  
  // Actions
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
  addRadioMessage: (conversationId: string, radioMessage: any) => void;
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void;
}

// Mock data generator
const generateMockConversations = (): Conversation[] => [
  {
    id: 'conv-direct-garcia',
    type: 'direct',
    name: 'Michael Garcia',
    participants: ['current-user', 'garcia-m'],
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-direct-garcia',
      senderId: 'garcia-m',
      senderName: 'Michael Garcia',
      content: 'Roger that, heading to Building A now',
      type: 'text',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'read'
    },
    lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    unreadCount: 0,
    isPinned: true
  },
  {
    id: 'conv-building-a',
    type: 'building',
    name: 'Building A Security',
    participants: ['current-user', 'garcia-m', 'wilson-r', 'chen-l'],
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-building-a',
      senderId: 'system',
      senderName: 'System',
      content: '🎙️ Radio: "Fire alarm activated in Building A"',
      type: 'radio',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      status: 'delivered',
      metadata: {
        radioMessageId: 'radio-123',
        location: 'Building A'
      }
    },
    lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    unreadCount: 3,
    metadata: {
      building: 'Building A',
      purpose: 'Building security coordination'
    }
  },
  {
    id: 'conv-day-shift',
    type: 'group',
    name: 'Day Shift Team',
    participants: ['current-user', 'garcia-m', 'wilson-r', 'chen-l', 'davis-k'],
    lastMessage: {
      id: 'msg-3',
      conversationId: 'conv-day-shift',
      senderId: 'chen-l',
      senderName: 'Lisa Chen',
      content: 'Shift change in 30 minutes, please prepare handoff notes',
      type: 'text',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'delivered'
    },
    lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unreadCount: 1,
    description: 'Coordination for day shift personnel'
  }
];

const generateMockMessages = (conversationId: string): ChatMessage[] => {
  const now = Date.now();
  const messages: ChatMessage[] = [];
  
  // Generate different messages based on conversation type
  if (conversationId === 'conv-building-a') {
    messages.push(
      {
        id: 'msg-b1',
        conversationId,
        senderId: 'system',
        senderName: 'System',
        content: '🎙️ Radio: "Fire alarm activated in Building A"',
        type: 'radio',
        timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
        status: 'delivered',
        metadata: {
          radioMessageId: 'radio-123',
          location: 'Building A',
          transcriptionConfidence: 0.95
        }
      },
      {
        id: 'msg-b2',
        conversationId,
        senderId: 'garcia-m',
        senderName: 'Michael Garcia',
        content: 'I\'m on Floor 3, checking the alarm',
        type: 'text',
        timestamp: new Date(now - 9 * 60 * 1000).toISOString(),
        status: 'read'
      },
      {
        id: 'msg-b3',
        conversationId,
        senderId: 'wilson-r',
        senderName: 'Robert Wilson',
        content: 'Copy, I\'ll evacuate the parking lot',
        type: 'text',
        timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
        status: 'read'
      },
      {
        id: 'msg-b4',
        conversationId,
        senderId: 'garcia-m',
        senderName: 'Michael Garcia',
        content: 'False alarm - someone burned toast in the break room',
        type: 'voice',
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
        status: 'read',
        attachments: [{
          type: 'voice',
          url: '/mock-audio/garcia-voice-1.mp3',
          name: 'Voice message',
          duration: 8
        }]
      }
    );
  } else {
    // Generic messages for other conversations
    messages.push(
      {
        id: `msg-${conversationId}-1`,
        conversationId,
        senderId: 'other-user',
        senderName: 'Other User',
        content: 'Hey, are you available?',
        type: 'text',
        timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
        status: 'read'
      },
      {
        id: `msg-${conversationId}-2`,
        conversationId,
        senderId: 'current-user',
        senderName: 'You',
        content: 'Yes, what\'s up?',
        type: 'text',
        timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
        status: 'read'
      }
    );
  }
  
  return messages;
};

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      conversations: generateMockConversations(),
      messages: {},
      activeConversationId: null,
      typingIndicators: [],
      isLoading: false,
      error: null,
      messagesCursor: {},
      hasMoreMessages: {},
      searchQuery: '',
      selectedMessageId: null,
      replyingToMessageId: null,

      // Actions
      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
        
        // Load messages if not already loaded
        if (conversationId && !get().messages[conversationId]) {
          get().loadMessages(conversationId);
        }
        
        // Mark messages as read
        if (conversationId) {
          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            )
          }));
        }
      },

      createConversation: async (type, participants, name, metadata) => {
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          type,
          name,
          participants: ['current-user', ...participants],
          lastActivity: new Date().toISOString(),
          unreadCount: 0,
          metadata
        };

        set(state => ({
          conversations: [newConversation, ...state.conversations]
        }));

        return newConversation;
      },

      sendMessage: async (conversationId, content, type = 'text', attachments) => {
        const message: ChatMessage = {
          id: `msg-${Date.now()}`,
          conversationId,
          senderId: 'current-user',
          senderName: 'You',
          content,
          type,
          timestamp: new Date().toISOString(),
          status: 'sending',
          attachments,
          replyTo: get().replyingToMessageId || undefined
        };

        // Add message to state
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: [message, ...(state.messages[conversationId] || [])]
          },
          replyingToMessageId: null
        }));

        // Simulate sending
        setTimeout(() => {
          get().updateMessageStatus(message.id, 'sent');
          setTimeout(() => {
            get().updateMessageStatus(message.id, 'delivered');
          }, 1000);
        }, 500);

        // Update conversation last message
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, lastMessage: message, lastActivity: message.timestamp }
              : conv
          )
        }));
      },

      loadMessages: async (conversationId, cursor) => {
        set({ isLoading: true });

        // Simulate API call
        setTimeout(() => {
          const messages = generateMockMessages(conversationId);
          
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: cursor
                ? [...(state.messages[conversationId] || []), ...messages]
                : messages
            },
            hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: true },
            isLoading: false
          }));
        }, 500);
      },

      loadConversations: async () => {
        set({ isLoading: true });
        
        // Simulate API call
        setTimeout(() => {
          set({ 
            conversations: generateMockConversations(),
            isLoading: false 
          });
        }, 500);
      },

      markAsRead: (conversationId, messageId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(msg =>
              msg.id === messageId ? { ...msg, status: 'read' } : msg
            )
          }
        }));
      },

      deleteMessage: (messageId) => {
        set(state => {
          const updatedMessages = { ...state.messages };
          
          Object.keys(updatedMessages).forEach(convId => {
            updatedMessages[convId] = updatedMessages[convId].filter(
              msg => msg.id !== messageId
            );
          });
          
          return { messages: updatedMessages };
        });
      },

      setTyping: (conversationId, isTyping) => {
        // This would emit via WebSocket
        console.log(`User is ${isTyping ? 'typing' : 'stopped typing'} in ${conversationId}`);
      },

      addTypingIndicator: (indicator) => {
        set(state => ({
          typingIndicators: [...state.typingIndicators.filter(
            ti => !(ti.userId === indicator.userId && ti.conversationId === indicator.conversationId)
          ), indicator]
        }));
      },

      removeTypingIndicator: (userId, conversationId) => {
        set(state => ({
          typingIndicators: state.typingIndicators.filter(
            ti => !(ti.userId === userId && ti.conversationId === conversationId)
          )
        }));
      },

      pinConversation: (conversationId) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
          )
        }));
      },

      muteConversation: (conversationId) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, isMuted: !conv.isMuted } : conv
          )
        }));
      },

      searchMessages: (query) => {
        set({ searchQuery: query });
        // In real implementation, this would search across all messages
      },

      setReplyingTo: (messageId) => {
        set({ replyingToMessageId: messageId });
      },

      addRadioMessage: (conversationId, radioMessage) => {
        const chatMessage: ChatMessage = {
          id: `msg-radio-${Date.now()}`,
          conversationId,
          senderId: 'system',
          senderName: 'Radio System',
          content: `🎙️ ${radioMessage.guardName}: "${radioMessage.content}"`,
          type: 'radio',
          timestamp: new Date().toISOString(),
          status: 'delivered',
          metadata: {
            radioMessageId: radioMessage.id,
            location: radioMessage.location,
            transcriptionConfidence: radioMessage.transcriptionConfidence
          }
        };

        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: [chatMessage, ...(state.messages[conversationId] || [])]
          }
        }));

        // Update conversation
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { 
                  ...conv, 
                  lastMessage: chatMessage, 
                  lastActivity: chatMessage.timestamp,
                  unreadCount: conv.unreadCount + 1 
                }
              : conv
          )
        }));
      },

      updateMessageStatus: (messageId, status) => {
        set(state => {
          const updatedMessages = { ...state.messages };
          
          Object.keys(updatedMessages).forEach(convId => {
            updatedMessages[convId] = updatedMessages[convId].map(msg =>
              msg.id === messageId ? { ...msg, status } : msg
            );
          });
          
          return { messages: updatedMessages };
        });
      }
    }),
    {
      name: 'chat-store',
    }
  )
);