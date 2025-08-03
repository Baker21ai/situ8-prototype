import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { useWebSocket } from '../hooks/useWebSocket';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatus({ className = '', showLabel = false }: ConnectionStatusProps) {
  const { isConnected, connectionState, error } = useWebSocket({
    token: 'authenticated-token', // This will be replaced with real auth later
    autoConnect: true
  });

  // Check if WebSocket is disabled
  const isWebSocketEnabled = import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' || 
                            import.meta.env.VITE_ENABLE_WEBSOCKET === true;

  if (!isWebSocketEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 ${className}`}>
              <WifiOff className="h-3 w-3" />
              {showLabel && <span>Offline Mode</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Real-time updates disabled in development</p>
            <p className="text-xs text-muted-foreground">Set VITE_ENABLE_WEBSOCKET=true to enable</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'connecting':
        return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return error || 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getTooltipText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Establishing connection to server...';
      case 'error':
        return error || 'Failed to connect to WebSocket server';
      default:
        return 'Not connected to real-time updates';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={connectionState === 'connected' ? 'default' : 'outline'} 
            className={`gap-1 ${className}`}
          >
            {getStatusIcon()}
            {showLabel && <span>{getStatusText()}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}