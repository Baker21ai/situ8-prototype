'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Activity, 
  MessageSquare, 
  Shield, 
  Clock,
  Users,
  MapPin,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingAction {
  id: string;
  type: 'create_incident' | 'create_activity' | 'update_status' | 'assign_guards' | 'send_alert';
  title: string;
  description: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  estimatedImpact?: string;
  affectedUsers?: number;
}

interface ActionConfirmationProps {
  pendingAction: PendingAction | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onModify?: (modifiedData: Record<string, any>) => void;
}

export function ActionConfirmation({
  pendingAction,
  isOpen,
  onConfirm,
  onCancel,
  onModify
}: ActionConfirmationProps) {
  if (!pendingAction) return null;

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_incident':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'create_activity':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'update_status':
        return <Shield className="w-5 h-5 text-green-500" />;
      case 'assign_guards':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'send_alert':
        return <Zap className="w-5 h-5 text-red-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatActionTitle = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getActionIcon(pendingAction.type)}
            Confirm AI Action
          </AlertDialogTitle>
          <AlertDialogDescription>
            Review the action the AI assistant wants to perform:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Action Overview */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">
                  {formatActionTitle(pendingAction.type)}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs capitalize",
                    getPriorityColor(pendingAction.priority)
                  )}
                >
                  {pendingAction.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {pendingAction.description}
              </p>

              {/* Action Details */}
              <div className="space-y-2">
                {Object.entries(pendingAction.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground capitalize font-medium">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-mono bg-background px-2 py-1 rounded">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Assessment */}
          {(pendingAction.estimatedImpact || pendingAction.affectedUsers) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Impact Assessment
                </h4>
                
                {pendingAction.estimatedImpact && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Impact:</span>
                    <span>{pendingAction.estimatedImpact}</span>
                  </div>
                )}
                
                {pendingAction.affectedUsers && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Affected Users:</span>
                    <Badge variant="outline">{pendingAction.affectedUsers}</Badge>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Warnings for Critical Actions */}
          {pendingAction.priority === 'critical' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                Critical Action Warning
              </div>
              <p className="text-xs text-red-600/80">
                This action has significant impact and cannot be easily undone. 
                Please review carefully before proceeding.
              </p>
            </div>
          )}

          {/* Guard Assignment Warning */}
          {pendingAction.type === 'assign_guards' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-1">
                <Users className="w-4 h-4" />
                Guard Assignment
              </div>
              <p className="text-xs text-amber-600/80">
                This will notify assigned guards and update their duty status.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          
          {onModify && (
            <AlertDialogAction
              onClick={() => onModify(pendingAction.data)}
              className="bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
            >
              Modify
            </AlertDialogAction>
          )}
          
          <AlertDialogAction 
            onClick={onConfirm}
            className={cn(
              pendingAction.priority === 'critical' && "bg-red-600 hover:bg-red-700"
            )}
          >
            {pendingAction.priority === 'critical' ? 'Confirm Critical Action' : 'Confirm & Execute'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}