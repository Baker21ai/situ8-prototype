/**
 * Communication Store
 * Manages real-time messaging, channels, and WebSocket connections
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommunicationService, CommunicationMessage, CommunicationChannel } from '../services/communication.service';
import { useServices } from '../services/ServiceProvider';

// Store state interface
interface CommunicationState {
  // Messages
  messages: Record<string, CommunicationMessage[]>; // channelId -> messages
  unreadCounts: Record<string, number>; // channelId -> unread count
  
  // Channels
  channels: CommunicationChannel[];
  activeChannelId: string | null;
  
  // WebSocket connection
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  
  // User status
  onlineUsers: Record<string, { userId: string; userName: string; status: string; lastSeen: Date }>;
  
  // UI state
  isLoading: boolean;
  isMessagePanelOpen: boolean;
  selectedMessageId: string | null;

  // Services
  communicationService: CommunicationService | null;
}

// Store actions interface
interface CommunicationActions {
  // Service initialization
  initializeService: (service: CommunicationService) => void;
  
  // Channel management
  loadUserChannels: (userId: string) => Promise<void>;
  createChannel: (
    name: string,
    type: CommunicationChannel['type'],
    description: string,
    memberIds: string[],
    creatorId: string,
    requiredClearance?: number
  ) => Promise<CommunicationChannel | null>;
  joinChannel: (channelId: string, userId: string, userName: string) => Promise<void>;
  leaveChannel: (channelId: string, userId: string, userName: string) => Promise<void>;
  setActiveChannel: (channelId: string | null) => void;
  
  // Message management
  loadChannelMessages: (channelId: string, limit?: number) => Promise<void>;
  sendMessage: (
    channelId: string,
    content: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    type?: CommunicationMessage['type'],
    metadata?: CommunicationMessage['metadata']
  ) => Promise<CommunicationMessage | null>;
  addMessage: (message: CommunicationMessage) => void;
  markChannelAsRead: (channelId: string) => void;
  
  // WebSocket management
  setConnectionState: (state: CommunicationState['connectionState']) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  handleWebSocketMessage: (message: any) => void;
  
  // User status
  updateUserStatus: (userId: string, userName: string, status: string) => void;
  removeUser: (userId: string) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  toggleMessagePanel: () => void;
  setSelectedMessage: (messageId: string | null) => void;
  
  // Utility
  getChannelById: (channelId: string) => CommunicationChannel | undefined;
  getUnreadCount: (channelId: string) => number;
  getTotalUnreadCount: () => number;
  clearChannelMessages: (channelId: string) => void;
  reset: () => void;
}

type CommunicationStore = CommunicationState & CommunicationActions;

// Initial state
const initialState: CommunicationState = {
  messages: {},
  unreadCounts: {},
  channels: [],
  activeChannelId: null,
  isConnected: false,
  connectionState: 'disconnected',
  error: null,
  onlineUsers: {},
  isLoading: false,
  isMessagePanelOpen: false,
  selectedMessageId: null,
  communicationService: null,
};

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Service initialization
      initializeService: (service: CommunicationService) => {
        set({ communicationService: service });
      },

      // Channel management
      loadUserChannels: async (userId: string) => {
        const { communicationService } = get();
        if (!communicationService) return;

        set({ isLoading: true });

        try {
          const response = await communicationService.getUserChannels(userId);
          if (response.success && response.data) {
            set({ channels: response.data });
          } else {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load channels' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load channels' });
        } finally {
          set({ isLoading: false });
        }
      },

      createChannel: async (
        name: string,
        type: CommunicationChannel['type'],
        description: string,
        memberIds: string[],
        creatorId: string,
        requiredClearance?: number
      ) => {
        const { communicationService, channels } = get();
        if (!communicationService) return null;

        set({ isLoading: true });

        try {
          const response = await communicationService.createChannel(
            name,
            type,
            description,
            memberIds,
            creatorId,
            requiredClearance
          );

          if (response.success && response.data) {
            const newChannel = response.data;
            set({ 
              channels: [...channels, newChannel],
              activeChannelId: newChannel.id 
            });
            return newChannel;
          } else {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create channel' });
            return null;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create channel' });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      joinChannel: async (channelId: string, userId: string, userName: string) => {
        const { communicationService } = get();
        if (!communicationService) return;

        try {
          const response = await communicationService.joinChannel(channelId, userId, userName);
          if (!response.success) {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to join channel' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to join channel' });
        }
      },

      leaveChannel: async (channelId: string, userId: string, userName: string) => {
        const { communicationService, channels, activeChannelId } = get();
        if (!communicationService) return;

        try {
          const response = await communicationService.leaveChannel(channelId, userId, userName);
          if (response.success) {
            // Remove channel from local state
            const updatedChannels = channels.filter(channel => channel.id !== channelId);
            set({ 
              channels: updatedChannels,
              activeChannelId: activeChannelId === channelId ? null : activeChannelId
            });
          } else {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to leave channel' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to leave channel' });
        }
      },

      setActiveChannel: (channelId: string | null) => {
        set({ activeChannelId: channelId });
        
        // Load messages for the active channel if not already loaded
        if (channelId) {
          const { messages } = get();
          if (!messages[channelId]) {
            get().loadChannelMessages(channelId);
          }
          // Mark channel as read
          get().markChannelAsRead(channelId);
        }
      },

      // Message management  
      loadChannelMessages: async (channelId: string, limit = 50) => {
        const { communicationService, messages } = get();
        if (!communicationService) return;

        set({ isLoading: true });

        try {
          const response = await communicationService.getChannelMessages(channelId, limit);
          if (response.success && response.data) {
            set({
              messages: {
                ...messages,
                [channelId]: response.data.messages
              }
            });
          } else {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load messages' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load messages' });
        } finally {
          set({ isLoading: false });
        }
      },

      sendMessage: async (
        channelId: string,
        content: string,
        senderId: string,
        senderName: string,
        senderRole: string,
        type = 'text' as CommunicationMessage['type'],
        metadata?: CommunicationMessage['metadata']
      ) => {
        const { communicationService } = get();
        if (!communicationService) return null;

        try {
          const response = await communicationService.sendMessage(
            channelId,
            content,
            senderId,
            senderName,
            senderRole,
            type,
            metadata
          );

          if (response.success && response.data) {
            // Message will be added via WebSocket broadcast
            return response.data;
          } else {
            set({ error: typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to send message' });
            return null;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send message' });
          return null;
        }
      },

      addMessage: (message: CommunicationMessage) => {
        const { messages, activeChannelId, unreadCounts } = get();
        const channelMessages = messages[message.channelId] || [];
        
        set({
          messages: {
            ...messages,
            [message.channelId]: [...channelMessages, message]
          }
        });

        // Update unread count if not the active channel
        if (message.channelId !== activeChannelId) {
          const currentUnread = unreadCounts[message.channelId] || 0;
          set({
            unreadCounts: {
              ...unreadCounts,
              [message.channelId]: currentUnread + 1
            }
          });
        }
      },

      markChannelAsRead: (channelId: string) => {
        const { unreadCounts } = get();
        if (unreadCounts[channelId]) {
          set({
            unreadCounts: {
              ...unreadCounts,
              [channelId]: 0
            }
          });
        }
      },

      // WebSocket management
      setConnectionState: (connectionState: CommunicationState['connectionState']) => {
        set({ connectionState, isConnected: connectionState === 'connected' });
      },

      setConnected: (connected: boolean) => {
        set({ 
          isConnected: connected,
          connectionState: connected ? 'connected' : 'disconnected',
          error: connected ? null : get().error
        });
      },

      setError: (error: string | null) => {
        set({ error, connectionState: error ? 'error' : get().connectionState });
      },

      handleWebSocketMessage: (wsMessage: any) => {
        const { action } = wsMessage;

        switch (action) {
          case 'newMessage':
            if (wsMessage.message) {
              get().addMessage(wsMessage.message);
            }
            break;

          case 'channelCreated':
            if (wsMessage.channel) {
              const { channels } = get();
              set({ channels: [...channels, wsMessage.channel] });
            }
            break;

          case 'memberJoined':
            get().updateUserStatus(wsMessage.userId, wsMessage.userName, 'online');
            break;

          case 'memberLeft':
            get().removeUser(wsMessage.userId);
            break;

          case 'userStatusUpdate':
            if (wsMessage.userId && wsMessage.userName && wsMessage.status) {
              get().updateUserStatus(wsMessage.userId, wsMessage.userName, wsMessage.status);
            }
            break;

          default:
            console.log('Unknown WebSocket message action:', action);
        }
      },

      // User status
      updateUserStatus: (userId: string, userName: string, status: string) => {
        const { onlineUsers } = get();
        set({
          onlineUsers: {
            ...onlineUsers,
            [userId]: {
              userId,
              userName,
              status,
              lastSeen: new Date()
            }
          }
        });
      },

      removeUser: (userId: string) => {
        const { onlineUsers } = get();
        const updated = { ...onlineUsers };
        delete updated[userId];
        set({ onlineUsers: updated });
      },

      // UI state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      toggleMessagePanel: () => {
        set({ isMessagePanelOpen: !get().isMessagePanelOpen });
      },

      setSelectedMessage: (messageId: string | null) => {
        set({ selectedMessageId: messageId });
      },

      // Utility functions
      getChannelById: (channelId: string) => {
        return get().channels.find(channel => channel.id === channelId);
      },

      getUnreadCount: (channelId: string) => {
        return get().unreadCounts[channelId] || 0;
      },

      getTotalUnreadCount: () => {
        const { unreadCounts } = get();
        return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
      },

      clearChannelMessages: (channelId: string) => {
        const { messages } = get();
        const updated = { ...messages };
        delete updated[channelId];
        set({ messages: updated });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'communication-store',
      partialize: (state) => ({
        // Only persist essential data, not real-time state
        channels: state.channels,
        activeChannelId: state.activeChannelId,
        unreadCounts: state.unreadCounts,
        isMessagePanelOpen: state.isMessagePanelOpen,
      }),
    }
  )
);

// Selector hooks for performance optimization
export const useMessages = (channelId?: string) => 
  useCommunicationStore(state => 
    channelId ? state.messages[channelId] || [] : state.messages
  );

export const useChannels = () => 
  useCommunicationStore(state => state.channels);

export const useActiveChannel = () => 
  useCommunicationStore(state => {
    const activeId = state.activeChannelId;
    return activeId ? state.getChannelById(activeId) : null;
  });

export const useUnreadCounts = () => 
  useCommunicationStore(state => state.unreadCounts);

export const useTotalUnreadCount = () => 
  useCommunicationStore(state => state.getTotalUnreadCount());

export const useConnectionState = () => 
  useCommunicationStore(state => ({
    isConnected: state.isConnected,
    connectionState: state.connectionState,
    error: state.error
  }));