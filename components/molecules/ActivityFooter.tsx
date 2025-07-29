import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { StatusBadge, PriorityIndicator } from '@/components/atoms';
import { ActivityData, EnterpriseActivity } from '@/lib/types/activity';
import { MoreVertical, User, Users, Zap, Target, CheckCircle } from 'lucide-react';

interface ActivityFooterProps {
  activity: ActivityData | EnterpriseActivity;
  showPriority?: boolean;
  showStatus?: boolean;
  showAssignment?: boolean;
  showConfidence?: boolean;
  showResponseUnits?: boolean;
  showActions?: boolean;
  priorityVariant?: 'badge' | 'icon' | 'dot';
  size?: 'xs' | 'sm' | 'md';
  onAction?: (action: string, activity: ActivityData | EnterpriseActivity) => void;
  className?: string;
}

/**
 * ActivityFooter - Molecule component for activity card footers
 * 
 * Combines priority, status, assignment info, and actions into a
 * consistent footer format used across all activity cards.
 * 
 * @example
 * <ActivityFooter 
 *   activity={activity}
 *   showPriority
 *   showStatus
 *   showAssignment
 *   showActions
 *   priorityVariant="badge"
 *   size="sm"
 *   onAction={handleAction}
 * />
 */
export const ActivityFooter: React.FC<ActivityFooterProps> = ({
  activity,
  showPriority = true,
  showStatus = false,
  showAssignment = false,
  showConfidence = false,
  showResponseUnits = false,
  showActions = false,
  priorityVariant = 'badge',
  size = 'sm',
  onAction,
  className
}) => {
  const isEnterprise = 'metadata' in activity;
  const enterpriseActivity = activity as EnterpriseActivity;
  
  // Size configurations
  const sizeConfig = {
    xs: {
      text: 'text-xs',
      gap: 'gap-1',
      buttonSize: 'h-5 w-5',
      badgeSize: 'xs' as const
    },
    sm: {
      text: 'text-sm',
      gap: 'gap-1.5',
      buttonSize: 'h-6 w-6',
      badgeSize: 'sm' as const
    },
    md: {
      text: 'text-base',
      gap: 'gap-2',
      buttonSize: 'h-8 w-8',
      badgeSize: 'md' as const
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Left side - Priority and Status */}
      <div className={cn('flex items-center', config.gap)}>
        {showPriority && (
          <PriorityIndicator
            priority={activity.priority}
            variant={priorityVariant}
            size={config.badgeSize}
            showLabel={priorityVariant !== 'dot'}
          />
        )}
        
        {showStatus && (
          <StatusBadge
            status={activity.status}
            size={config.badgeSize}
            variant={size === 'xs' ? 'minimal' : 'outline'}
          />
        )}
        
        {isEnterprise && enterpriseActivity.escalationLevel && enterpriseActivity.escalationLevel > 0 && (
          <Badge className={cn(
            'bg-purple-100 text-purple-800',
            config.text
          )}>
            ESC {enterpriseActivity.escalationLevel}
          </Badge>
        )}
      </div>
      
      {/* Right side - Assignment and Actions */}
      <div className={cn('flex items-center', config.gap)}>
        {/* Metadata items */}
        <div className={cn('flex items-center', config.gap, 'text-muted-foreground', config.text)}>
          {showConfidence && activity.confidence && (
            <div className="flex items-center gap-1">
              <Zap className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
              <span>{activity.confidence}%</span>
            </div>
          )}
          
          {showResponseUnits && activity.respondingUnits && activity.respondingUnits.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
              <span>{activity.respondingUnits.length}</span>
            </div>
          )}
          
          {showAssignment && activity.assignedTo && (
            <div className="flex items-center gap-1 max-w-24 truncate">
              <User className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
              <span className="truncate">{activity.assignedTo}</span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        {showActions && onAction && (
          <div className={cn('flex items-center', size === 'xs' ? 'gap-0.5' : 'gap-1')}>
            {activity.status === 'new' && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(config.buttonSize, 'p-0')}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('assign', activity);
                }}
                title="Assign"
              >
                <Target className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
              </Button>
            )}
            
            {activity.status === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(config.buttonSize, 'p-0')}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('resolve', activity);
                }}
                title="Resolve"
              >
                <CheckCircle className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(config.buttonSize, 'p-0')}
              onClick={(e) => {
                e.stopPropagation();
                onAction('menu', activity);
              }}
              title="More actions"
            >
              <MoreVertical className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick actions footer for mobile/touch interfaces
export const MobileActivityFooter: React.FC<{
  activity: ActivityData;
  onAction: (action: string, activity: ActivityData) => void;
  className?: string;
}> = ({ activity, onAction, className }) => {
  return (
    <div className={cn('flex gap-2 mt-3', className)}>
      <Button
        className="flex-1"
        variant={activity.priority === 'critical' ? 'destructive' : 'default'}
        onClick={() => onAction('respond', activity)}
      >
        RESPOND
      </Button>
      <Button
        className="flex-1"
        variant="outline"
        onClick={() => onAction('details', activity)}
      >
        DETAILS
      </Button>
    </div>
  );
};

// Minimal footer for compact displays
export const CompactActivityFooter: React.FC<{
  activity: ActivityData;
  className?: string;
}> = ({ activity, className }) => {
  return (
    <div className={cn('flex items-center justify-between mt-1', className)}>
      <PriorityIndicator
        priority={activity.priority}
        variant="dot"
        size="xs"
        showLabel={false}
      />
      {activity.assignedTo && (
        <span className="text-xs text-muted-foreground truncate max-w-20">
          {activity.assignedTo}
        </span>
      )}
    </div>
  );
};