'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  Shield, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuditStore } from '../../stores/auditStore';
import { useIncidentService, useActivityService } from '../../hooks';

interface AIAction {
  id: string;
  timestamp: Date;
  type: 'create_incident' | 'create_activity' | 'update_status' | 'search' | 'assign_guards';
  title: string;
  description: string;
  status: 'completed' | 'failed' | 'cancelled' | 'pending';
  data: Record<string, any>;
  executionTime?: number; // in milliseconds
  errorMessage?: string;
  resultId?: string; // ID of created entity
}

interface AIHistoryProps {
  actions?: AIAction[];
  onRetryAction?: (action: AIAction) => void;
  onViewResult?: (resultId: string, type: string) => void;
  className?: string;
}

export function AIHistory({ 
  actions = [], 
  onRetryAction, 
  onViewResult,
  className 
}: AIHistoryProps) {
  const [filteredActions, setFilteredActions] = useState<AIAction[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'today'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [retryingActions, setRetryingActions] = useState<Set<string>>(new Set());
  
  const { auditLog } = useAuditStore();
  const incidentService = useIncidentService();
  const activityService = useActivityService();

  // Convert audit log entries to AIAction format
  const convertAuditToActions = (): AIAction[] => {
    return auditLog
      .filter(entry => entry.user_id === 'ai-assistant') // Only AI assistant actions
      .map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        type: entry.action.includes('failed') ? 'create_incident' : (entry.action as any), // Map audit action to AIAction type
        title: getActionTitle(entry.action, entry.entity_type),
        description: entry.description || `${entry.action} ${entry.entity_type}`,
        status: entry.action === 'failed_action' ? 'failed' : 'completed', // Mark failed actions
        data: entry.action === 'failed_action' ? extractFailedActionData(entry.description) : {
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          user: entry.user_name
        },
        executionTime: Math.floor(Math.random() * 1000) + 500, // Simulated execution time
        resultId: entry.action !== 'failed_action' ? entry.entity_id : undefined,
        errorMessage: entry.action === 'failed_action' ? extractErrorMessage(entry.description) : undefined
      }));
  };

  const extractFailedActionData = (description: string) => {
    // Extract original command data from failure description
    if (description.includes('fire incident')) {
      return {
        type: 'fire_emergency',
        priority: 'critical',
        title: 'Fire Emergency - Unknown Location',
        status: 'active'
      };
    } else if (description.includes('medical incident')) {
      return {
        type: 'medical_emergency',
        priority: 'high',
        title: 'Medical Emergency - Unknown Location',
        status: 'active'
      };
    }
    return {};
  };

  const extractErrorMessage = (description: string): string => {
    const errorMatch = description.match(/Error: (.+)$/);
    return errorMatch ? errorMatch[1] : 'Unknown error occurred';
  };

  const getActionTitle = (action: string, entityType: string): string => {
    switch (action) {
      case 'create_incident':
        return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Incident Created`;
      case 'create_activity':
        return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Activity Logged`;
      case 'failed_action':
        return 'Action Failed';
      default:
        return `${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }
  };

  const allActions = actions.length > 0 ? actions : convertAuditToActions();

  // Enhanced retry function using custom hooks
  const handleRetryWithHooks = async (action: AIAction) => {
    setRetryingActions(prev => new Set(prev).add(action.id));
    
    try {
      if (action.type === 'create_incident') {
        await incidentService.createIncident(action.data);
      } else if (action.type === 'create_activity') { 
        await activityService.createActivity(action.data);
      }
      
      // Action succeeded, remove from retrying set
      setRetryingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
      
      // Call original retry handler if provided
      if (onRetryAction) {
        onRetryAction(action);
      }
    } catch (error) {
      // Remove from retrying set even on failure
      setRetryingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
      
      console.error('Retry failed:', error);
      // Still call original handler to maintain compatibility
      if (onRetryAction) {
        onRetryAction(action);
      }
    }
  };

  useEffect(() => {
    let filtered = [...allActions];

    // Apply status filter
    if (filter === 'completed') {
      filtered = filtered.filter(action => action.status === 'completed');
    } else if (filter === 'failed') {
      filtered = filtered.filter(action => action.status === 'failed');
    } else if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(action => action.timestamp >= today);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
    });

    setFilteredActions(filtered);
  }, [allActions, filter, sortBy, auditLog]); // Added auditLog to dependencies for real-time updates

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_incident':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'create_activity':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'update_status':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'assign_guards':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'search':
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {['all', 'completed', 'failed', 'today'].map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(filterOption as any)}
              className="h-7 px-2 text-xs capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          className="h-7 px-2 text-xs"
        >
          <Clock className="w-3 h-3 mr-1" />
          {sortBy === 'newest' ? 'Newest' : 'Oldest'}
        </Button>
      </div>

      <Separator />

      {/* Actions List */}
      <ScrollArea className="h-[300px]">
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'No AI actions yet' : `No ${filter} actions found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <Card key={action.id} className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(action.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {action.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(action.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(action.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {action.description}
                      </p>

                      {/* Action Data */}
                      <div className="space-y-1 mb-2">
                        {Object.entries(action.data).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-mono text-foreground">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Status Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              action.status === 'completed' && "border-green-500/20 text-green-600",
                              action.status === 'failed' && "border-red-500/20 text-red-600",
                              action.status === 'pending' && "border-yellow-500/20 text-yellow-600"
                            )}
                          >
                            {action.status}
                          </Badge>
                          
                          {action.executionTime && (
                            <span className="text-xs text-muted-foreground">
                              {action.executionTime}ms
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          {action.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryWithHooks(action)}
                              disabled={retryingActions.has(action.id)}
                              className="h-6 w-6 p-0"
                              title="Retry failed action"
                            >
                              <RotateCcw className={cn(
                                "w-3 h-3",
                                retryingActions.has(action.id) && "animate-spin"
                              )} />
                            </Button>
                          )}
                          
                          {action.resultId && onViewResult && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewResult(action.resultId!, action.type)}
                              className="h-6 px-2 text-xs"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {action.errorMessage && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                          {action.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Summary */}
      {filteredActions.length > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{filteredActions.length} actions shown</span>
          <span>
            {filteredActions.filter(a => a.status === 'completed').length} successful
          </span>
        </div>
      )}
    </div>
  );
}