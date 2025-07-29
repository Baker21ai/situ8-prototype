import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { MapPin } from 'lucide-react';
import { formatTime, formatTimeAgo } from '../lib/utils/time';
import { getPriorityColor, getStatusColor } from '../lib/utils/status';
import { getTypeIcon } from '../lib/utils/security';
import { cn } from './ui/utils';
import { ActivityData } from '../lib/types/activity';

// Card variant types
export type ActivityCardVariant = 'stream' | 'timeline' | 'list' | 'evidence' | 'mobile';

interface ActivityCardProps {
  activity: ActivityData;
  variant: ActivityCardVariant;
  onSelect?: (activity: ActivityData) => void;
  onAction?: (action: string, activity: ActivityData) => void;
  isSelected?: boolean;
  showCheckbox?: boolean;
  className?: string;
}

// Note: Utility functions have been moved to centralized locations:
// - Time utilities: @/lib/utils/time
// - Status utilities: @/lib/utils/status  
// - Security utilities: @/lib/utils/security

// Stream Card Component (Command Center - Left Panel) - Compact Version
const StreamCard: React.FC<{ activity: ActivityData; onSelect?: (activity: ActivityData) => void; isSelected?: boolean }> = ({
  activity,
  onSelect,
  isSelected = false
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={() => onSelect?.(activity)}
    >
      <CardContent className="p-2 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-mono shrink-0">{formatTime(activity.timestamp)}</span>
            <span className="text-sm shrink-0">{getTypeIcon(activity.type)}</span>
            <span className="text-xs font-medium truncate">{activity.type}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {activity.isNewActivity && (
              <Badge className="bg-red-100 text-red-800 text-xs animate-pulse">NEW</Badge>
            )}
            {activity.isBoloActive && (
              <Badge className="bg-orange-100 text-orange-800 text-xs">BOLO</Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="font-medium text-xs leading-tight">{activity.title}</div>

        {/* Location */}
        <div className="text-xs text-gray-600 truncate">{activity.zone || activity.location}</div>

        {/* Status and Priority */}
        <div className="flex items-center justify-between">
          <Badge className={cn(
            getPriorityColor(activity.priority).background,
            getPriorityColor(activity.priority).text,
            getPriorityColor(activity.priority).border
          )}>
            {activity.priority.toUpperCase()}
          </Badge>
          {activity.assignedTo && (
            <div className="text-xs text-gray-600 truncate">{activity.assignedTo}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Timeline Card Component (Command Center - Right Panel) - Compact Version
const TimelineCard: React.FC<{ activity: ActivityData; onSelect?: (activity: ActivityData) => void }> = ({
  activity,
  onSelect
}) => {
  return (
    <div 
      className="border-l-2 border-gray-200 pl-2 pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect?.(activity)}
    >
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">{formatTimeAgo(activity.timestamp)}</span>
            <span className="text-xs">{getTypeIcon(activity.type)}</span>
          </div>
          {activity.isNewActivity && (
            <Badge className="bg-red-100 text-red-800 text-xs">NEW</Badge>
          )}
        </div>
        
        <div className="font-medium text-xs">{activity.title}</div>
        
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="h-2 w-2" />
          <span>{activity.location}</span>
        </div>
        
        {activity.isBoloActive && (
          <Badge className="text-xs bg-red-100 text-red-800">BOLO</Badge>
        )}
      </div>
    </div>
  );
};

// List Card Component (Activities Page) - Compact Version
const ListCard: React.FC<{ 
  activity: ActivityData; 
  onSelect?: (activity: ActivityData) => void; 
  onAction?: (action: string, activity: ActivityData) => void;
  isSelected?: boolean;
  showCheckbox?: boolean;
}> = ({
  activity,
  onSelect,
  onAction,
  isSelected = false,
  showCheckbox = false
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={() => onSelect?.(activity)}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Checkbox */}
          {showCheckbox && (
            <div className="flex items-start pt-1">
              <Checkbox 
                checked={isSelected}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onSelect?.(activity)}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono">{formatTime(activity.timestamp)}</span>
                <span className="text-sm">{getTypeIcon(activity.type)}</span>
                <span className="text-xs font-medium">{activity.type}</span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-gray-600">{activity.location}</span>
              </div>
              {activity.isNewActivity && (
                <Badge className="bg-red-100 text-red-800 text-xs">NEW</Badge>
              )}
            </div>

            {/* Title */}
            <div className="font-medium text-sm">{activity.title}</div>
            
            {/* Status and Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Badge className={cn(
                  getPriorityColor(activity.priority).background,
                  getPriorityColor(activity.priority).text,
                  getPriorityColor(activity.priority).border
                )}>
                  {activity.priority.toUpperCase()}
                </Badge>
                <Badge className={cn(
                  getStatusColor(activity.status).background,
                  getStatusColor(activity.status).text
                )}>
                  {activity.status.toUpperCase()}
                </Badge>
                {activity.isBoloActive && (
                  <Badge className="bg-red-100 text-red-800 text-xs">BOLO</Badge>
                )}
              </div>
              
              {activity.assignedTo && (
                <div className="text-xs text-gray-600">{activity.assignedTo}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Evidence Card Component (Case Management) - Compact Version
const EvidenceCard: React.FC<{ activity: ActivityData; onSelect?: (activity: ActivityData) => void }> = ({
  activity,
  onSelect
}) => {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
      onClick={() => onSelect?.(activity)}
    >
      <CardContent className="p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs">
            EVIDENCE #{activity.evidenceNumber} - {activity.type}
          </span>
          <Badge className={cn(
            getPriorityColor(activity.priority).background,
            getPriorityColor(activity.priority).text,
            getPriorityColor(activity.priority).border
          )}>
            {activity.priority}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-600">
          {formatTime(activity.timestamp)} {activity.caseTimeOffset && `(${activity.caseTimeOffset})`}
        </div>
        
        <div className="text-xs text-gray-600">{activity.location}</div>
        
        {activity.caseRelevance && (
          <div className="text-xs">
            <span className="font-medium">Relevance:</span> {activity.caseRelevance}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Card Component (Guard Mobile App) - Compact Version
const MobileCard: React.FC<{ activity: ActivityData; onAction?: (action: string, activity: ActivityData) => void }> = ({
  activity,
  onAction
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {activity.priority === 'critical' && <span className="text-sm">🔴</span>}
            <span className="font-medium text-sm">{activity.type}</span>
            {activity.isNewActivity && (
              <Badge className="bg-red-100 text-red-800 text-xs">NOW</Badge>
            )}
          </div>
        </div>
        
        <div className="font-medium text-sm">{activity.location}</div>
        
        <div className="flex gap-2">
          <Button 
                        className="flex-1"
            onClick={() => onAction?.('respond', activity)}
          >
            RESPOND
          </Button>
          <Button 
                        variant="outline"
            className="flex-1"
            onClick={() => onAction?.('details', activity)}
          >
            DETAILS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main ActivityCard Component
export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  variant,
  onSelect,
  onAction,
  isSelected = false,
  showCheckbox = false,
  className = ''
}) => {
  const baseClassName = `${className}`;

  switch (variant) {
    case 'stream':
      return (
        <div className={baseClassName}>
          <StreamCard 
            activity={activity} 
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </div>
      );
      
    case 'timeline':
      return (
        <div className={baseClassName}>
          <TimelineCard 
            activity={activity} 
            onSelect={onSelect}
          />
        </div>
      );
      
    case 'list':
      return (
        <div className={baseClassName}>
          <ListCard 
            activity={activity} 
            onSelect={onSelect}
            onAction={onAction}
            isSelected={isSelected}
            showCheckbox={showCheckbox}
          />
        </div>
      );
      
    case 'evidence':
      return (
        <div className={baseClassName}>
          <EvidenceCard 
            activity={activity} 
            onSelect={onSelect}
          />
        </div>
      );
      
    case 'mobile':
      return (
        <div className={baseClassName}>
          <MobileCard 
            activity={activity} 
            onAction={onAction}
          />
        </div>
      );
      
    default:
      return (
        <div className={baseClassName}>
          <StreamCard 
            activity={activity} 
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </div>
      );
  }
};

export default ActivityCard;