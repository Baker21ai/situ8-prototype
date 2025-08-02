/**
 * ActivityInfo Molecule Component
 * Displays core activity information (title, location, time, type)
 * Following atomic design principles for maximum reusability
 */

import React from 'react';
import { MapPin, Clock, Camera } from 'lucide-react';
import { EnterpriseActivity } from '../../../../lib/types/activity';
import { getTypeIcon } from '../../../../lib/utils/security';
import { formatTime, formatTimeAgo } from '../../../../lib/utils/time';

export interface ActivityInfoProps {
  activity: EnterpriseActivity;
  variant?: 'full' | 'compact' | 'minimal' | 'summary';
  showType?: boolean;
  showLocation?: boolean;
  showTime?: boolean;
  showCamera?: boolean;
  timeFormat?: 'absolute' | 'relative';
  className?: string;
}

export const ActivityInfo: React.FC<ActivityInfoProps> = ({
  activity,
  variant = 'full',
  showType = true,
  showLocation = true,
  showTime = true,
  showCamera = true,
  timeFormat = 'relative',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (variant) {
      case 'minimal':
        return {
          title: 'text-xs font-medium',
          subtitle: 'text-xs text-gray-600',
          meta: 'text-xs text-gray-500',
          icon: 'h-2 w-2',
          spacing: 'space-y-0.5'
        };
      case 'compact':
        return {
          title: 'text-sm font-medium',
          subtitle: 'text-xs text-gray-600',
          meta: 'text-xs text-gray-500',
          icon: 'h-3 w-3',
          spacing: 'space-y-1'
        };
      case 'summary':
        return {
          title: 'text-sm font-medium',
          subtitle: 'text-sm text-gray-600',
          meta: 'text-sm text-gray-500',
          icon: 'h-4 w-4',
          spacing: 'space-y-1'
        };
      default: // full
        return {
          title: 'text-base font-semibold',
          subtitle: 'text-sm text-gray-600',
          meta: 'text-sm text-gray-500',
          icon: 'h-4 w-4',
          spacing: 'space-y-2'
        };
    }
  };

  const classes = getSizeClasses();

  return (
    <div className={`${classes.spacing} ${className}`}>
      {/* Type and Time Header */}
      {(showType || showTime) && (
        <div className="flex items-center justify-between">
          {showType && (
            <div className="flex items-center gap-1">
              <span className={classes.icon}>{getTypeIcon(activity.type)}</span>
              <span className={classes.meta}>{activity.type}</span>
            </div>
          )}
          {showTime && (
            <div className="flex items-center gap-1">
              <Clock className={classes.icon} />
              <span className={classes.meta}>
                {timeFormat === 'absolute' 
                  ? formatTime(activity.timestamp)
                  : formatTimeAgo(activity.timestamp)
                }
              </span>
            </div>
          )}
        </div>
      )}

      {/* Activity Title */}
      <div className={classes.title} title={activity.title}>
        {activity.title}
      </div>

      {/* Location and Camera Info */}
      {(showLocation || (showCamera && activity.cameraName)) && (
        <div className="flex items-center gap-2 flex-wrap">
          {showLocation && (
            <div className="flex items-center gap-1">
              <MapPin className={classes.icon} />
              <span className={classes.subtitle}>
                {activity.zone || activity.location}
              </span>
            </div>
          )}
          
          {showCamera && activity.cameraName && (
            <div className="flex items-center gap-1">
              <Camera className={classes.icon} />
              <span className={classes.subtitle}>{activity.cameraName}</span>
            </div>
          )}

          {showCamera && activity.additionalCameras && activity.additionalCameras.length > 0 && (
            <div className="flex items-center gap-1">
              <Camera className={classes.icon} />
              <span className={classes.subtitle}>+{activity.additionalCameras.length} more</span>
            </div>
          )}
        </div>
      )}

      {/* Assignment Info */}
      {activity.assignedTo && (
        <div className={classes.subtitle}>
          Assigned: {activity.assignedTo}
          {activity.respondingUnits && activity.respondingUnits.length > 0 && 
            ` • ${activity.respondingUnits.length} units responding`
          }
        </div>
      )}
    </div>
  );
};

// Specialized variants for convenience
export const ActivityInfoCompact: React.FC<Omit<ActivityInfoProps, 'variant'>> = (props) => (
  <ActivityInfo {...props} variant="compact" />
);

export const ActivityInfoMinimal: React.FC<Omit<ActivityInfoProps, 'variant'>> = (props) => (
  <ActivityInfo {...props} variant="minimal" />
);

export const ActivityInfoSummary: React.FC<Omit<ActivityInfoProps, 'variant'>> = (props) => (
  <ActivityInfo {...props} variant="summary" />
);