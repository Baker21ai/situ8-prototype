/**
 * ActivityDetails Molecule Component
 * Displays detailed activity information including metadata, description, and status
 * Combines multiple atomic components for comprehensive activity display
 */

import React from 'react';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';
import { StatusBadge } from '../../atoms/badges/StatusBadge';
import { PriorityIndicator } from '../../atoms/indicators/PriorityIndicator';
import { LocationTag } from '../../atoms/badges/LocationTag';
import { TimeDisplay } from '../../atoms/displays/TimeDisplay';
import { Badge } from '../../../../components/ui/badge';
import { AlertTriangle, Users, Camera, Tag } from 'lucide-react';

export interface ActivityDetailsProps {
  activity: EnterpriseActivity | ActivityCluster;
  variant?: 'full' | 'summary' | 'compact' | 'inline';
  showMetadata?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  showAssignment?: boolean;
  showCameras?: boolean;
  className?: string;
}

/**
 * ActivityDetails - Comprehensive activity information display
 * 
 * @example
 * <ActivityDetails activity={activity} />
 * <ActivityDetails activity={activity} variant="summary" />
 * <ActivityDetails activity={cluster} variant="compact" />
 */
export const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  activity,
  variant = 'full',
  showMetadata = true,
  showDescription = true,
  showTags = true,
  showAssignment = true,
  showCameras = true,
  className = ''
}) => {
  const isCluster = 'clusterType' in activity;
  const regularActivity = activity as EnterpriseActivity;
  const cluster = activity as ActivityCluster;
  
  const getSizeClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          spacing: 'space-y-1',
          text: 'text-xs',
          title: 'text-sm font-medium',
          description: 'text-xs',
          badge: 'xs' as const
        };
      case 'inline':
        return {
          spacing: 'space-x-2 flex items-center flex-wrap',
          text: 'text-xs',
          title: 'text-sm font-medium',
          description: 'text-xs',
          badge: 'xs' as const
        };
      case 'summary':
        return {
          spacing: 'space-y-2',
          text: 'text-sm',
          title: 'text-base font-medium',
          description: 'text-sm',
          badge: 'sm' as const
        };
      default: // full
        return {
          spacing: 'space-y-3',
          text: 'text-sm',
          title: 'text-lg font-semibold',
          description: 'text-sm',
          badge: 'md' as const
        };
    }
  };
  
  const classes = getSizeClasses();
  const isInline = variant === 'inline';

  return (
    <div className={`${isInline ? classes.spacing : `${classes.spacing} ${className}`}`}>
      {/* Title and Priority */}
      <div className={`${isInline ? 'contents' : 'flex items-start justify-between'}`}>
        <div className={isInline ? 'contents' : 'flex-1'}>
          <h3 className={`${classes.title} ${isInline ? 'mr-2' : ''}`}>
            {isCluster ? cluster.title : regularActivity.title}
          </h3>
          
          {/* Cluster Count */}
          {isCluster && (
            <Badge variant="outline" size={classes.badge} className="ml-2">
              <Users className="h-3 w-3 mr-1" />
              {cluster.count} activities
            </Badge>
          )}
        </div>
        
        {showMetadata && (
          <div className={`flex items-center gap-2 ${isInline ? '' : 'flex-shrink-0'}`}>
            <PriorityIndicator 
              priority={isCluster ? cluster.highestPriority : regularActivity.priority}
              size={classes.badge}
              variant="badge"
            />
            {!isCluster && (
              <StatusBadge
                priority={regularActivity.priority}
                status={regularActivity.status}
                size={classes.badge}
              />
            )}
          </div>
        )}
      </div>

      {/* Location and Time */}
      {showMetadata && (
        <div className={`flex items-center gap-3 ${classes.text} text-muted-foreground`}>
          <LocationTag 
            location={isCluster ? cluster.location : regularActivity.location}
            type="site"
            size={classes.badge}
            showIcon
          />
          <TimeDisplay 
            date={isCluster ? cluster.lastActivity : regularActivity.timestamp}
            format="relative"
            size={classes.badge}
            showIcon
          />
        </div>
      )}

      {/* Description */}
      {showDescription && (regularActivity.description || cluster?.description) && (
        <div className={`${classes.description} text-muted-foreground`}>
          {isCluster ? cluster.description : regularActivity.description}
        </div>
      )}

      {/* Assignment Info */}
      {showAssignment && !isCluster && regularActivity.assignedTo && (
        <div className={`${classes.text} text-muted-foreground`}>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Assigned to: {regularActivity.assignedTo}</span>
            {regularActivity.respondingUnits && regularActivity.respondingUnits.length > 0 && (
              <span className="ml-2">
                • {regularActivity.respondingUnits.length} units responding
              </span>
            )}
          </div>
        </div>
      )}

      {/* Camera Information */}
      {showCameras && !isCluster && regularActivity.cameraName && (
        <div className={`${classes.text} text-muted-foreground`}>
          <div className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            <span>{regularActivity.cameraName}</span>
            {regularActivity.additionalCameras && regularActivity.additionalCameras.length > 0 && (
              <span className="ml-2">
                +{regularActivity.additionalCameras.length} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {showTags && !isCluster && regularActivity.tags && regularActivity.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {regularActivity.tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              size={classes.badge}
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Confidence Indicator for alerts */}
      {!isCluster && regularActivity.type === 'alert' && regularActivity.confidence && (
        <div className={`${classes.text} text-muted-foreground`}>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Confidence: {Math.round(regularActivity.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* Cluster-specific metadata */}
      {isCluster && showMetadata && (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Time Range: {cluster.timeRange}</div>
          <div>Highest Priority: {cluster.highestPriority}</div>
          <div>Types: {cluster.types.join(', ')}</div>
          <div>Last Activity: 
            <TimeDisplay 
              date={cluster.lastActivity}
              format="relative"
              size="xs"
              className="ml-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized variants for convenience
export const ActivityDetailsSummary: React.FC<Omit<ActivityDetailsProps, 'variant'>> = (props) => (
  <ActivityDetails {...props} variant="summary" />
);

export const ActivityDetailsCompact: React.FC<Omit<ActivityDetailsProps, 'variant'>> = (props) => (
  <ActivityDetails {...props} variant="compact" />
);

export const ActivityDetailsInline: React.FC<Omit<ActivityDetailsProps, 'variant'>> = (props) => (
  <ActivityDetails {...props} variant="inline" />
);
