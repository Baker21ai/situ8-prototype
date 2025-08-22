/**
 * Sync Status Indicator Component
 * Shows real-time synchronization status for guard data
 * Displays offline queue count and allows manual sync
 */

import React, { useEffect, useState } from 'react';
import { useGuardStore } from '../stores/guardStore';
import { cn } from '../lib/utils';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

export const SyncStatusIndicator: React.FC = () => {
  const {
    syncStatus,
    lastSync,
    offlineQueueCount,
    isLoading,
    error,
    syncGuards,
    syncOfflineChanges,
    getOfflineQueueStatus
  } = useGuardStore();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineQueueCount > 0) {
      handleSync();
    }
  }, [isOnline]);
  
  // Periodic sync check
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && !isSyncing) {
        // Check if we need to sync
        const queueStatus = getOfflineQueueStatus();
        if (queueStatus.count > 0 && queueStatus.oldestItem) {
          const ageInMinutes = (Date.now() - queueStatus.oldestItem.getTime()) / 1000 / 60;
          if (ageInMinutes > 5) {
            handleSync();
          }
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isOnline, isSyncing]);
  
  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      // First sync offline changes
      if (offlineQueueCount > 0) {
        await syncOfflineChanges();
      }
      // Then sync fresh data
      await syncGuards();
    } finally {
      setIsSyncing(false);
    }
  };
  
  const getSyncIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isSyncing || isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (syncStatus === 'success') return <Check className="h-4 w-4" />;
    if (syncStatus === 'error' || error) return <AlertCircle className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };
  
  const getSyncColor = () => {
    if (!isOnline) return 'text-gray-500';
    if (isSyncing || isLoading) return 'text-blue-500';
    if (syncStatus === 'success') return 'text-green-500';
    if (syncStatus === 'error' || error) return 'text-red-500';
    return 'text-gray-400';
  };
  
  const getSyncTooltip = () => {
    if (!isOnline) return 'Offline - changes will sync when connection restored';
    if (isSyncing || isLoading) return 'Syncing...';
    if (syncStatus === 'error' || error) return `Sync error: ${error || 'Unknown error'}`;
    if (lastSync) return `Last synced ${formatDistanceToNow(lastSync, { addSuffix: true })}`;
    return 'Click to sync';
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Offline Queue Badge */}
      {offlineQueueCount > 0 && (
        <Badge 
          variant={isOnline ? "default" : "secondary"}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          {offlineQueueCount} pending
        </Badge>
      )}
      
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {/* Sync Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                getSyncColor()
              )}
              onClick={handleSync}
              disabled={!isOnline || isSyncing || isLoading}
            >
              {getSyncIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getSyncTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

/**
 * Compact version for header/toolbar use
 */
export const SyncStatusCompact: React.FC = () => {
  const {
    syncStatus,
    offlineQueueCount,
    isLoading,
    error
  } = useGuardStore();
  
  const [isOnline] = useState(navigator.onLine);
  
  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    if (isLoading) return 'bg-blue-500';
    if (syncStatus === 'success' && offlineQueueCount === 0) return 'bg-green-500';
    if (syncStatus === 'error' || error) return 'bg-red-500';
    if (offlineQueueCount > 0) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isLoading) return 'Syncing';
    if (offlineQueueCount > 0) return `${offlineQueueCount} pending`;
    if (syncStatus === 'error' || error) return 'Sync error';
    return 'Synced';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              getStatusColor()
            )} />
            <span className="text-xs text-muted-foreground">
              {getStatusText()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <SyncStatusDetails />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Detailed sync status for tooltips/modals
 */
const SyncStatusDetails: React.FC = () => {
  const {
    lastSync,
    offlineQueueCount,
    error,
    getOfflineQueueStatus
  } = useGuardStore();
  
  const queueStatus = getOfflineQueueStatus();
  
  return (
    <div className="space-y-2 text-sm">
      {lastSync && (
        <div>
          <span className="text-muted-foreground">Last sync: </span>
          <span>{formatDistanceToNow(lastSync, { addSuffix: true })}</span>
        </div>
      )}
      
      {offlineQueueCount > 0 && (
        <div>
          <span className="text-muted-foreground">Pending changes: </span>
          <span className="text-yellow-600">{offlineQueueCount}</span>
        </div>
      )}
      
      {queueStatus.oldestItem && (
        <div>
          <span className="text-muted-foreground">Oldest change: </span>
          <span>{formatDistanceToNow(queueStatus.oldestItem, { addSuffix: true })}</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
};