import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress as _Progress } from '@/components/ui/progress';
import { cn } from '@/components/ui/utils';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Radio, 
  Clock, 
  Activity,
  Shield,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Car as _Car,
  Wifi,
  WifiOff,
  MoreVertical
} from 'lucide-react';

// Import atomic components
import { StatusBadge as _StatusBadge, TimeDisplay as _TimeDisplay, LocationBadge as _LocationBadge } from '@/components/atoms';
import { ActivityHeader as _ActivityHeader, ActivityFooter as _ActivityFooter, MetadataDisplay as _MetadataDisplay } from '@/components/molecules';

// Import types and utilities
import { Guard, GuardStatus, GuardMetrics } from '@/lib/types/guards';
import { getStatusColor } from '@/lib/utils/status';
import { formatTimeAgo } from '@/lib/utils/time';
import { cardPadding, cardSpacing } from '@/lib/tokens/spacing';
import { guardStatusColors } from '@/lib/tokens/colors';

// Guard Card Variants
export type GuardCardVariant = 'compact' | 'detailed' | 'minimal' | 'profile';
export type GuardCardLayout = 'grid' | 'list' | 'stream' | 'building';

// Feature flags for card functionality
export interface GuardCardFeatures {
  showAvatar?: boolean;
  showStatus?: boolean;
  showLocation?: boolean;
  showRadio?: boolean;
  showSkills?: boolean;
  showMetrics?: boolean;
  showActions?: boolean;
  showAssignment?: boolean;
  showShift?: boolean;
  showLastUpdate?: boolean;
  showConnectivity?: boolean;
}

// Main GuardCard Props
export interface GuardCardProps {
  guard: Guard;
  variant?: GuardCardVariant;
  layout?: GuardCardLayout;
  features?: GuardCardFeatures;
  isSelected?: boolean;
  isOnline?: boolean;
  onClick?: (guard: Guard) => void;
  onAction?: (action: string, guard: Guard) => void;
  className?: string;
}

/**
 * Unified GuardCard Component
 * 
 * A single, configurable component for all guard displays.
 * Replaces various guard card implementations across the app.
 * 
 * @example
 * // Compact grid view
 * <GuardCard 
 *   guard={guard} 
 *   variant="compact" 
 *   layout="grid"
 *   features={{ showStatus: true, showActions: true }}
 * />
 * 
 * // Detailed list view
 * <GuardCard 
 *   guard={guard} 
 *   variant="detailed" 
 *   layout="list"
 *   features={{ showMetrics: true, showSkills: true }}
 * />
 */
export const GuardCard = memo<GuardCardProps>(({
  guard,
  variant = 'compact',
  layout = 'list',
  features = {},
  isSelected = false,
  isOnline = true,
  onClick,
  onAction,
  className
}) => {
  // Default features based on variant
  const defaultFeatures: GuardCardFeatures = {
    compact: {
      showAvatar: true,
      showStatus: true,
      showLocation: true,
      showActions: true,
      showLastUpdate: true
    },
    detailed: {
      showAvatar: true,
      showStatus: true,
      showLocation: true,
      showRadio: true,
      showSkills: true,
      showMetrics: true,
      showActions: true,
      showAssignment: true,
      showShift: true,
      showLastUpdate: true,
      showConnectivity: true
    },
    minimal: {
      showStatus: true,
      showLocation: true
    },
    profile: {
      showAvatar: true,
      showStatus: true,
      showLocation: true,
      showRadio: true,
      showSkills: true,
      showMetrics: true,
      showShift: true,
      showConnectivity: true
    }
  }[variant];

  // Merge default features with provided features
  const finalFeatures = { ...defaultFeatures, ...features };

  // Get status configuration
  const getGuardStatusConfig = (status: GuardStatus) => {
    const configs = {
      responding: {
        icon: <AlertCircle className="h-3 w-3" />,
        color: guardStatusColors.responding,
        label: 'Responding'
      },
      investigating: {
        icon: <Activity className="h-3 w-3" />,
        color: guardStatusColors.investigating,
        label: 'Investigating'
      },
      available: {
        icon: <CheckCircle className="h-3 w-3" />,
        color: guardStatusColors.available,
        label: 'Available'
      },
      patrolling: {
        icon: <Shield className="h-3 w-3" />,
        color: guardStatusColors.patrolling,
        label: 'Patrolling'
      },
      break: {
        icon: <Clock className="h-3 w-3" />,
        color: guardStatusColors.break,
        label: 'Break'
      },
      off_duty: {
        icon: <Users className="h-3 w-3" />,
        color: guardStatusColors.off_duty,
        label: 'Off Duty'
      }
    };
    return configs[status as keyof typeof configs] || configs.available;
  };

  const statusConfig = getGuardStatusConfig(guard.status);

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onClick(guard);
  };

  // Minimal variant for high-density views
  if (variant === 'minimal') {
    return <MinimalGuardCard guard={guard} onClick={onClick} />;
  }

  // Layout-specific styles
  const layoutStyles = {
    grid: 'hover:shadow-md transition-shadow',
    list: 'hover:bg-gray-50',
    stream: 'border-l-4 hover:shadow-sm',
    building: 'hover:shadow-sm'
  };

  // Variant-specific padding
  const variantPadding = {
    compact: cardPadding.sm,
    detailed: cardPadding.md,
    minimal: cardPadding.xs,
    profile: cardPadding.lg
  };

  return (
    <Card
      className={cn(
        layoutStyles[layout],
        isSelected && 'ring-2 ring-blue-500',
        !isOnline && 'opacity-60',
        layout === 'stream' && 'border-l-4',
        'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className={cn(variantPadding[variant], cardSpacing.sm)}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {finalFeatures.showAvatar && (
              <Avatar className={cn(
                variant === 'compact' ? 'h-10 w-10' : 'h-12 w-12',
                !isOnline && 'grayscale'
              )}>
                <AvatarFallback className={cn(
                  'font-medium',
                  statusConfig.color.background,
                  statusConfig.color.color
                )}>
                  {guard.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Name and Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  'font-semibold',
                  variant === 'compact' ? 'text-sm' : 'text-base'
                )}>
                  {guard.name}
                </h4>
                {finalFeatures.showConnectivity && (
                  isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-gray-400" />
                  )
                )}
              </div>
              
              {/* Badge and Department */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{guard.badge}</span>
                <span>•</span>
                <span>{guard.department}</span>
                {finalFeatures.showShift && guard.shift && (
                  <>
                    <span>•</span>
                    <span>{guard.shift}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          {finalFeatures.showStatus && (
            <Badge className={cn(
              'flex items-center gap-1',
              statusConfig.color.background,
              statusConfig.color.color
            )}>
              {statusConfig.icon}
              <span className={variant === 'compact' ? 'hidden sm:inline' : ''}>
                {statusConfig.label}
              </span>
            </Badge>
          )}
        </div>

        {/* Location and Radio */}
        <div className="space-y-2">
          {finalFeatures.showLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-muted-foreground">{guard.location}</span>
              {guard.zone && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{guard.zone}</span>
                </>
              )}
            </div>
          )}
          
          {finalFeatures.showRadio && (
            <div className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-gray-400" />
              <span className="text-muted-foreground">{guard.radio}</span>
            </div>
          )}
          
          {finalFeatures.showLastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last update: {formatTimeAgo(guard.lastUpdate)}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {finalFeatures.showSkills && guard.skills && guard.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {guard.skills.map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Assignment */}
        {finalFeatures.showAssignment && guard.assignedActivity && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700">
                Assigned to Activity #{guard.assignedActivity}
              </span>
            </div>
          </div>
        )}

        {/* Metrics - Only in detailed view */}
        {finalFeatures.showMetrics && guard.metrics && variant === 'detailed' && (
          <GuardMetricsDisplay metrics={guard.metrics} className="mt-3" />
        )}

        {/* Actions */}
        {finalFeatures.showActions && onAction && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('call', guard);
                }}
                title="Call Guard"
              >
                <Phone className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('message', guard);
                }}
                title="Message Guard"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('locate', guard);
                }}
                title="Locate Guard"
              >
                <MapPin className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('more', guard);
                }}
                title="More Options"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>
            
            {guard.status === 'available' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('assign', guard);
                }}
              >
                Assign
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Minimal guard card for high-density views
const MinimalGuardCard: React.FC<{
  guard: Guard;
  onClick?: (guard: Guard) => void;
}> = ({ guard, onClick }) => {
  const statusColor = guardStatusColors[guard.status as keyof typeof guardStatusColors] || guardStatusColors.available;
  const dotColor = statusColor.color.replace('text-', 'bg-').replace('-600', '-500');

  const statusConfig = {
    dot: dotColor,
    text: statusColor.color
  };

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
      onClick={() => onClick?.(guard)}
    >
      <div className={cn('w-2 h-2 rounded-full', statusConfig?.dot)} />
      <span className="text-sm font-medium flex-1">{guard.name}</span>
      <span className="text-xs text-muted-foreground">{guard.location}</span>
    </div>
  );
};

// Guard metrics display component
const GuardMetricsDisplay: React.FC<{
  metrics: GuardMetrics;
  className?: string;
}> = ({ metrics, className }) => {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <div className="text-center p-2 bg-gray-50 rounded">
        <div className="text-lg font-semibold">{metrics.activitiesCreated}</div>
        <div className="text-xs text-muted-foreground">Activities</div>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <div className="text-lg font-semibold">{metrics.incidentsResponded}</div>
        <div className="text-xs text-muted-foreground">Responses</div>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <div className="text-lg font-semibold">{metrics.patrolsCompleted}</div>
        <div className="text-xs text-muted-foreground">Patrols</div>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <div className="text-lg font-semibold">{metrics.avgResponseTime}</div>
        <div className="text-xs text-muted-foreground">Avg Response</div>
      </div>
    </div>
  );
};

// Building view card - special variant for building layout
export const BuildingGuardCard: React.FC<{
  guard: Guard;
  onAction?: (action: string, guard: Guard) => void;
  className?: string;
}> = ({ guard, onAction, className }) => {
  return (
    <GuardCard
      guard={guard}
      variant="compact"
      layout="building"
      features={{
        showAvatar: false,
        showStatus: true,
        showLocation: false,
        showRadio: true,
        showActions: true,
        showLastUpdate: false
      }}
      onAction={onAction}
      className={className}
    />
  );
};

// Profile view card - for guard details modal
export const GuardProfileCard: React.FC<{
  guard: Guard;
  className?: string;
}> = ({ guard, className }) => {
  return (
    <GuardCard
      guard={guard}
      variant="profile"
      layout="list"
      features={{
        showAvatar: true,
        showStatus: true,
        showLocation: true,
        showRadio: true,
        showSkills: true,
        showMetrics: true,
        showActions: false,
        showShift: true,
        showConnectivity: true
      }}
      className={className}
    />
  );
};

GuardCard.displayName = 'GuardCard';