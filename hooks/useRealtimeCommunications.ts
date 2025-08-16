/**
 * Real-time Communications Hook
 * Integrates WebSocket with communication store for real-time messaging
 */

import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { useCommunicationStore } from '../stores/communicationStore';
import { useUserStore } from '../stores/userStore';

export interface RealtimeMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderEmail: string;
  senderRole: string;
  content: string;
  type: 'text' | 'voice' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const useRealtimeCommunications = (channelId: string = 'main') => {
  const [isReady, setIsReady] = useState(false);
  const [localMessages, setLocalMessages] = useState<RealtimeMessage[]>([]);
  
  // Get current user info
  const currentUser = useUserStore(state => state.currentUser);
  const userEmail = currentUser?.email || 'anonymous@situ8.com';
  const userId = currentUser?.id || 'anonymous';
  const userRole = currentUser?.role || 'user';
  
  // Get auth token - same approach as realtimeChatStore
  const token = localStorage.getItem('cognitoIdToken') || `test-${userEmail}-${userRole}`;
  
  // Communication store
  const {
    messages,
    channels,
    activeChannelId,
    setActiveChannel,
    addMessage,
    handleWebSocketMessage,
    setConnectionState
  } = useCommunicationStore();
  
  // WebSocket connection
  const {
    isConnected,
    connectionState,
    sendMessage: sendWebSocketMessage,
    subscribe
  } = useWebSocket({
    token,
    autoConnect: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5
  });
  
  // Update connection state in store
  useEffect(() => {
    setConnectionState(connectionState);
  }, [connectionState, setConnectionState]);
  
  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = subscribe('*', (data) => {
      handleWebSocketMessage(data);
    });
    
    return unsubscribe;
  }, [subscribe, handleWebSocketMessage]);
  
  // Join channel when connected
  useEffect(() => {
    if (isConnected && channelId) {
      sendWebSocketMessage({
        action: 'join',
        channelId: channelId
      });
      setActiveChannel(channelId);
      setIsReady(true);
    }
  }, [isConnected, channelId, sendWebSocketMessage, setActiveChannel]);
  
  // Get messages for current channel
  const channelMessages = messages[channelId] || [];
  
  // Send a message
  const sendMessage = useCallback((content: string, type: 'text' | 'voice' = 'text') => {
    if (!isConnected || !content.trim()) return;
    
    const message = {
      action: 'message',
      channelId: channelId,
      content: content,
      type: type,
      metadata: {
        senderId: userId,
        senderEmail: userEmail,
        senderRole: userRole,
        timestamp: new Date().toISOString()
      }
    };
    
    sendWebSocketMessage(message);
    
    // Optimistically add to local messages
    const localMessage: RealtimeMessage = {
      id: `local-${Date.now()}`,
      channelId: channelId,
      senderId: userId,
      senderEmail: userEmail,
      senderRole: userRole,
      content: content,
      type: type,
      timestamp: new Date(),
      metadata: message.metadata
    };
    
    setLocalMessages(prev => [...prev, localMessage]);
  }, [isConnected, channelId, userId, userEmail, userRole, sendWebSocketMessage]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isConnected) return;
    
    sendWebSocketMessage({
      action: 'typing',
      channelId: channelId,
      isTyping: isTyping
    });
  }, [isConnected, channelId, sendWebSocketMessage]);
  
  // Leave channel
  const leaveChannel = useCallback(() => {
    if (!isConnected) return;
    
    sendWebSocketMessage({
      action: 'leave',
      channelId: channelId
    });
  }, [isConnected, channelId, sendWebSocketMessage]);
  
  // Ping to keep connection alive
  const ping = useCallback(() => {
    if (!isConnected) return;
    
    sendWebSocketMessage({
      action: 'ping'
    });
  }, [isConnected, sendWebSocketMessage]);
  
  // Set up keepalive ping
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, ping]);
  
  // Combine local and store messages
  const allMessages = [...channelMessages, ...localMessages]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );
  
  return {
    // State
    isConnected,
    isReady,
    connectionState,
    messages: allMessages,
    channelId,
    channels,
    activeChannelId,
    
    // Actions
    sendMessage,
    sendTypingIndicator,
    leaveChannel,
    setActiveChannel,
    
    // User info
    currentUser: {
      id: userId,
      email: userEmail,
      role: userRole
    }
  };
};