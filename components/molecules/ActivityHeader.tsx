import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { TimeDisplay, LocationBadge } from '@/components/atoms';
import { ActivityData, EnterpriseActivity } from '@/lib/types/activity';
import { getTypeIcon } from '@/lib/utils/security';
import { specialColors } from '@/lib/tokens/colors';
import { Layers } from 'lucide-react';

interface ActivityHeaderProps {
  activity: ActivityData | EnterpriseActivity;
  showTime?: boolean;
  showType?: boolean;
  showLocation?: boolean;
  showSiteBadge?: boolean;
  showSpecialBadges?: boolean;
  timeFormat?: 'time' | 'relative' | 'relative-short';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  // Cluster support
  isCluster?: boolean;
  clusterCount?: number;
}

/**
 * ActivityHeader - Molecule component for activity card headers
 * 
 * Combines time display, activity type, location badges, and special indicators
 * into a consistent header format used across all activity cards.
 * 
 * @example
 * <ActivityHeader 
 *   activity={activity}
 *   showTime
 *   showType
 *   showSiteBadge
 *   timeFormat="relative-short"
 *   size="sm"
 * />
 */
export const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  activity,
  showTime = true,
  showType = true,
  showLocation = false,
  showSiteBadge = false,
  showSpecialBadges = true,
  timeFormat = 'time',
  size = 'sm',
  className,
  isCluster = false,
  clusterCount
}) => {
  const isEnterprise = 'metadata' in activity;
  const enterpriseActivity = activity as EnterpriseActivity;
  
  // Size configurations
  const sizeConfig = {
    xs: {
      text: 'text-xs',
      gap: 'gap-1',
      iconSize: 'text-xs'
    },
    sm: {
      text: 'text-sm',
      gap: 'gap-1.5',
      iconSize: 'text-sm'
    },
    md: {
      text: 'text-base',
      gap: 'gap-2',
      iconSize: 'text-base'
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Left side - Time, Type, Location */}
      <div className={cn('flex items-center min-w-0', config.gap)}>
        {showTime && (
          <TimeDisplay
            date={activity.timestamp}
            format={timeFormat}
            size={size === 'xs' ? 'xs' : 'sm'}
            className="shrink-0"
          />
        )}
        
        {showType && (
          <>
            <span className={cn(config.iconSize, 'shrink-0')}>
              {getTypeIcon(activity.type)}
            </span>
            <span className={cn(config.text, 'font-medium truncate')}>
              {activity.type}
            </span>
          </>
        )}
        
        {isCluster && clusterCount && (
          <Badge className={cn(
            'bg-blue-100 text-blue-800',
            size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
          )}>
            <Layers className="h-3 w-3 mr-1" />
            {clusterCount}
          </Badge>
        )}
        
        {showLocation && activity.location && (
          <span className={cn(config.text, 'text-muted-foreground truncate')}>
            {activity.location}
          </span>
        )}
      </div>
      
      {/* Right side - Special badges */}
      <div className={cn('flex items-center shrink-0', config.gap)}>
        {showSiteBadge && isEnterprise && enterpriseActivity.metadata?.site && (
          <LocationBadge
            location={enterpriseActivity.metadata.site}
            type="site"
            size={size === 'md' ? 'sm' : 'xs'}
          />
        )}
        
        {showSpecialBadges && (
          <>
            {activity.isNewActivity && (
              <Badge className={cn(
                specialColors.bolo.background,
                specialColors.bolo.text,
                'animate-pulse',
                size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
              )}>
                NEW
              </Badge>
            )}
            
            {activity.isBoloActive && (
              <Badge className={cn(
                specialColors.bolo.background,
                specialColors.bolo.text,
                size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
              )}>
                BOLO
              </Badge>
            )}
            
            {isEnterprise && enterpriseActivity.isMassCasualty && (
              <Badge className={cn(
                specialColors.massCasualty.background,
                specialColors.massCasualty.text,
                'animate-pulse',
                size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
              )}>
                MASS
              </Badge>
            )}
            
            {isEnterprise && enterpriseActivity.isSecurityThreat && (
              <Badge className={cn(
                specialColors.securityThreat.background,
                specialColors.securityThreat.text,
                size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
              )}>
                THREAT
              </Badge>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Compact variant for minimal space
export const CompactActivityHeader: React.FC<{
  activity: ActivityData;
  className?: string;
}> = ({ activity, className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TimeDisplay
        date={activity.timestamp}
        format="relative-short"
        size="xs"
        className="text-muted-foreground"
      />
      <span className="text-muted-foreground">•</span>
      <span className="text-xs">{getTypeIcon(activity.type)}</span>
      <span className="text-xs font-medium">{activity.type}</span>
    </div>
  );
};