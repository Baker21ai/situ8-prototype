import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { MapPin, Camera, Play, Eye, MoreVertical } from 'lucide-react';

// Import atomic components
import { StatusBadge, PriorityIndicator, TimeDisplay, LocationBadge } from '@/components/atoms';

// Import types and utilities
import { ActivityData, EnterpriseActivity, ActivityCluster } from '@/lib/types/activity';
import { formatTimeAgoShort } from '@/lib/utils/time';
import { getTypeIcon, getActivityTypeInfo } from '@/lib/utils/security';
import { specialColors } from '@/lib/tokens/colors';
import { cardPadding, cardSpacing } from '@/lib/tokens/spacing';

// Activity Card Variants
export type ActivityCardVariant = 'compact' | 'detailed' | 'minimal';
export type ActivityCardLayout = 'stream' | 'timeline' | 'list' | 'grid';

// Feature flags for card functionality
export interface ActivityCardFeatures {
  showCheckbox?: boolean;
  showActions?: boolean;
  showMetadata?: boolean;
  showEvidence?: boolean;
  showAssignment?: boolean;
  showConfidence?: boolean;
  showSiteBadge?: boolean;
  showPriority?: boolean;
  showTime?: boolean;
}

// Main ActivityCard Props
export interface ActivityCardProps {
  activity: ActivityData | EnterpriseActivity | ActivityCluster;
  variant?: ActivityCardVariant;
  layout?: ActivityCardLayout;
  features?: ActivityCardFeatures;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  onAction?: (action: string, activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  className?: string;
}

/**
 * Unified ActivityCard Component
 * 
 * A single, configurable component that replaces all activity card variants.
 * Uses composition and feature flags to enable different layouts and functionality.
 * 
 * @example
 * // Stream layout (left panel)
 * <ActivityCard 
 *   activity={activity} 
 *   variant="compact" 
 *   layout="stream" 
 *   onClick={handleSelect}
 * />
 * 
 * // List layout with actions
 * <ActivityCard 
 *   activity={activity} 
 *   variant="detailed" 
 *   layout="list"
 *   features={{ showCheckbox: true, showActions: true }}
 * />
 */
export const ActivityCard = memo<ActivityCardProps>(({
  activity,
  variant = 'compact',
  layout = 'stream',
  features = {},
  isSelected = false,
  isHovered = false,
  onClick,
  onAction,
  className
}) => {
  // Determine if this is a cluster
  const isCluster = 'clusterType' in activity && (activity as any).clusterType === 'cluster';
  const activityData = isCluster ? (activity as ActivityCluster).representative : activity as ActivityData;
  
  // Get activity type info
  const typeInfo = getActivityTypeInfo(activityData.type);
  
  // Layout-specific styles
  const layoutStyles = {
    stream: 'hover:shadow-md cursor-pointer',
    timeline: 'border-l-4 cursor-pointer hover:bg-gray-50',
    list: 'hover:shadow-md cursor-pointer',
    grid: 'h-full hover:shadow-lg cursor-pointer'
  };
  
  // Variant-specific padding
  const variantPadding = {
    compact: cardPadding.sm,
    detailed: cardPadding.md,
    minimal: cardPadding.xs
  };
  
  // Special status styles
  const specialStyles = cn(
    (activityData as EnterpriseActivity)?.isMassCasualty && `ring-2 ${specialColors.massCasualty.border}`,
    (activityData as EnterpriseActivity)?.isSecurityThreat && `ring-2 ${specialColors.securityThreat.border}`
  );
  
  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return;
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input')) return;
    onClick(activity);
  };
  
  // Render based on variant
  if (variant === 'minimal') {
    return <MinimalCard activity={activityData} isSelected={isSelected} onClick={onClick} />;
  }
  
  return (
    <Card
      className={cn(
        layoutStyles[layout],
        isSelected && 'border-blue-500 bg-blue-50',
        specialStyles,
        'transition-all duration-200',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className={cn(variantPadding[variant], cardSpacing.sm)}>
        {/* Checkbox if enabled */}
        {features.showCheckbox && (
          <div className="float-left mr-3">
            <Checkbox
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={() => onClick?.(activity)}
            />
          </div>
        )}
        
        {/* Header Section */}
        <ActivityHeader
          activity={activityData}
          layout={layout}
          showSiteBadge={features.showSiteBadge}
          isCluster={isCluster}
          clusterCount={isCluster ? (activity as ActivityCluster).count : undefined}
        />
        
        {/* Title */}
        <div className={cn(
          'font-medium',
          variant === 'compact' ? 'text-xs leading-tight' : 'text-sm',
          'mt-1'
        )}>
          {activityData.title}
        </div>
        
        {/* Location */}
        <div className={cn(
          'flex items-center gap-1 text-gray-600',
          variant === 'compact' ? 'text-xs mt-1' : 'text-sm mt-2'
        )}>
          <MapPin className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />
          <span className="truncate">{activityData.zone || activityData.location}</span>
        </div>
        
        {/* Footer Section */}
        <ActivityFooter
          activity={activityData}
          variant={variant}
          features={features}
          onAction={onAction}
        />
        
        {/* Evidence/Media if enabled */}
        {features.showEvidence && activityData.thumbnailUrl && (
          <div className="mt-2">
            <div className="relative rounded overflow-hidden bg-gray-100">
              <img 
                src={activityData.thumbnailUrl} 
                alt="Evidence" 
                className="w-full h-20 object-cover"
              />
              {activityData.gifUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('view_evidence', activity);
                  }}
                >
                  <Play className="h-3 w-3 text-white" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Minimal card for high-density displays
const MinimalCard: React.FC<{
  activity: ActivityData;
  isSelected: boolean;
  onClick?: (activity: ActivityData) => void;
}> = ({ activity, isSelected, onClick }) => {
  return (
    <div
      className={cn(
        'relative w-8 h-8 rounded cursor-pointer transition-all',
        'hover:scale-110 hover:z-10',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={() => onClick?.(activity)}
    >
      <PriorityIndicator
        priority={activity.priority}
        variant="dot"
        showLabel={false}
        size="sm"
        className="w-full h-full"
      />
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-xs flex items-center justify-center">
        {getTypeIcon(activity.type)}
      </div>
    </div>
  );
};

// Activity Header Component
const ActivityHeader: React.FC<{
  activity: ActivityData;
  layout: ActivityCardLayout;
  showSiteBadge?: boolean;
  isCluster?: boolean;
  clusterCount?: number;
}> = ({ activity, layout, showSiteBadge, isCluster, clusterCount }) => {
  const isEnterprise = 'metadata' in activity;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 min-w-0">
        <TimeDisplay
          date={activity.timestamp}
          format={layout === 'timeline' ? 'relative-short' : 'time'}
          size="xs"
          className="shrink-0"
        />
        <span className="text-sm shrink-0">{getTypeIcon(activity.type)}</span>
        <span className="text-xs font-medium truncate">{activity.type}</span>
        {isCluster && (
          <Badge className="text-xs bg-blue-100 text-blue-800">
            {clusterCount} items
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {showSiteBadge && isEnterprise && (activity as EnterpriseActivity).metadata?.site && (
          <LocationBadge
            location={(activity as EnterpriseActivity).metadata!.site}
            type="site"
            size="xs"
          />
        )}
        {activity.isNewActivity && (
          <Badge className={cn(specialColors.bolo.background, specialColors.bolo.text, 'text-xs animate-pulse')}>
            NEW
          </Badge>
        )}
        {activity.isBoloActive && (
          <Badge className={cn(specialColors.bolo.background, specialColors.bolo.text, 'text-xs')}>
            BOLO
          </Badge>
        )}
      </div>
    </div>
  );
};

// Activity Footer Component
const ActivityFooter: React.FC<{
  activity: ActivityData;
  variant: ActivityCardVariant;
  features: ActivityCardFeatures;
  onAction?: (action: string, activity: ActivityData) => void;
}> = ({ activity, variant, features, onAction }) => {
  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-1">
        <PriorityIndicator
          priority={activity.priority}
          variant="badge"
          size={variant === 'compact' ? 'xs' : 'sm'}
        />
        {variant === 'detailed' && (
          <StatusBadge
            status={activity.status}
            size="sm"
            variant="outline"
          />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {features.showConfidence && activity.confidence && (
          <span className="text-xs text-gray-500">
            {activity.confidence}% conf
          </span>
        )}
        
        {features.showAssignment && activity.assignedTo && (
          <div className="text-xs text-gray-600 truncate max-w-24">
            {activity.assignedTo}
          </div>
        )}
        
        {features.showActions && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('menu', activity);
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

ActivityCard.displayName = 'ActivityCard';