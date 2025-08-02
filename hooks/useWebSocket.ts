import { useEffect, useRef, useState, useCallback } from 'react';
import { useActivityStore } from '../stores/activityStore';
import { useCommunicationStore } from '../stores/communicationStore';

export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export interface WebSocketState {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
}

interface UseWebSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  // Use proper environment variable prefix for Vite
  const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 
                      import.meta.env.REACT_APP_WEBSOCKET_URL ||
                      'wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev';
  
  const {
    url = websocketUrl,
    token,
    autoConnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 3, // Reduced for faster failure in dev
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionState: 'disconnected',
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const messageHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  // Communication store integration
  const communicationStore = useCommunicationStore();

  // Check if we're in development mode and should use mock data
  const isDevelopment = import.meta.env.DEV;
  const useMockWebSocket = isDevelopment && !import.meta.env.VITE_WEBSOCKET_URL && !import.meta.env.REACT_APP_WEBSOCKET_URL;

  // Connect to WebSocket
  const connect = useCallback((authToken?: string) => {
    if (useMockWebSocket) {
      console.log('Development mode: Using mock WebSocket behavior');
      setState({
        isConnected: true,
        connectionState: 'connected',
        error: null,
      });
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connectionState: 'connecting', error: null }));

    const connectUrl = authToken || token 
      ? `${url}?token=${encodeURIComponent(authToken || token || '')}`
      : url;

    try {
      const ws = new WebSocket(connectUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState({
          isConnected: true,
          connectionState: 'connected',
          error: null,
        });
        reconnectAttemptsRef.current = 0;

        // Update communication store connection state
        communicationStore.setConnectionState('connected');

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) {
            ws.send(JSON.stringify(msg));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          // Forward message to communication store for processing
          communicationStore.handleWebSocketMessage(data);

          // Call handlers for this action
          const handlers = messageHandlersRef.current.get(data.action);
          if (handlers) {
            handlers.forEach(handler => handler(data));
          }

          // Call wildcard handlers
          const wildcardHandlers = messageHandlersRef.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => handler(data));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        communicationStore.setError('Connection error');
        setState(prev => ({ ...prev, error: 'Connection error' }));
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        wsRef.current = null;
        
        // Update communication store connection state
        communicationStore.setConnectionState('disconnected');
        
        // Don't try to reconnect in development with mock endpoints
        if (useMockWebSocket) {
          setState({
            isConnected: false,
            connectionState: 'disconnected',
            error: 'Mock WebSocket disconnected',
          });
          return;
        }

        const errorMessage = event.code === 1008 ? 'Authentication failed' : null;
        communicationStore.setError(errorMessage);
        
        setState({
          isConnected: false,
          connectionState: 'disconnected',
          error: errorMessage,
        });

        // Auto-reconnect logic
        if (
          autoConnect && 
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1008 // Don't reconnect on auth failure
        ) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting in ${reconnectDelay}ms... (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(authToken);
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      communicationStore.setConnectionState('error');
      communicationStore.setError('Failed to connect');
      setState({
        isConnected: false,
        connectionState: 'error',
        error: 'Failed to connect',
      });
    }
  }, [url, token, autoConnect, reconnectDelay, maxReconnectAttempts, useMockWebSocket]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Update communication store connection state
    communicationStore.setConnectionState('disconnected');
    
    setState({
      isConnected: false,
      connectionState: 'disconnected',
      error: null,
    });
  }, [communicationStore]);

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (useMockWebSocket) {
      console.log('Mock WebSocket: Would send message:', message);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message);
      
      // Try to reconnect if not connected
      if (state.connectionState === 'disconnected' && autoConnect) {
        connect();
      }
    }
  }, [state.connectionState, autoConnect, connect, useMockWebSocket]);

  // Subscribe to message actions
  const subscribe = useCallback((action: string, handler: (data: any) => void) => {
    if (!messageHandlersRef.current.has(action)) {
      messageHandlersRef.current.set(action, new Set());
    }
    messageHandlersRef.current.get(action)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlersRef.current.get(action);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(action);
        }
      }
    };
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [autoConnect, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
  };
}