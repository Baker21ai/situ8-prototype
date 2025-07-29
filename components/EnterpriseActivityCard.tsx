import { useState, memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  MapPin, 
  Eye, 
  MoreVertical,
  Camera,
  Layers
} from 'lucide-react';
import { EnterpriseActivity, ActivityCluster } from '../lib/types/activity';
import { getPriorityColor, getStatusColor, getBusinessImpactColor, Priority } from '../lib/utils/status';
import { getTypeIcon } from '../lib/utils/security';
import { formatTime, formatTimeAgo } from '../lib/utils/time';

// Helper function to get simple priority background color
const getPriorityBgColor = (priority: Priority) => {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};



// Card variant types for enterprise
export type EnterpriseCardVariant = 'stream' | 'timeline' | 'list' | 'evidence' | 'mobile' | 'cluster' | 'summary' | 'minimal';

interface EnterpriseActivityCardProps {
  activity: EnterpriseActivity | ActivityCluster;
  variant: EnterpriseCardVariant;
  onSelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  isSelected?: boolean;
  showCheckbox?: boolean;
  className?: string;
  index?: number; // For virtualization
  isVisible?: boolean; // For performance optimization
  compactMode?: boolean;
}


// Minimal Card for high-density displays - Even More Compact
const MinimalCard = memo<{ 
  activity: EnterpriseActivity; 
  onSelect?: (activity: EnterpriseActivity) => void; 
  isSelected?: boolean;
}>(({ activity, onSelect, isSelected = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`w-2 h-2 rounded cursor-pointer transition-all hover:scale-125 ${
              getPriorityBgColor(activity.priority)
            } ${activity.priority === 'critical' ? 'animate-pulse' : ''} ${
              isSelected ? 'ring-1 ring-blue-500' : ''
            }`}
            onClick={() => onSelect?.(activity)}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium text-xs">{activity.title}</div>
            <div className="text-xs text-muted-foreground">{activity.type}</div>
            <div className="text-xs">{activity.location}</div>
            <div className="text-xs">{formatTimeAgo(activity.timestamp)}</div>
            {activity.confidence && (
              <div className="text-xs">Confidence: {activity.confidence}%</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Cluster Card for grouped activities - Compact Version
const ClusterCard = memo<{ 
  cluster: ActivityCluster; 
  onSelect?: (cluster: ActivityCluster) => void; 
  onAction?: (action: string, cluster: ActivityCluster) => void;
  isSelected?: boolean;
  variant: EnterpriseCardVariant;
}>(({ cluster, onSelect, onAction, isSelected = false, variant }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`relative w-3 h-3 rounded cursor-pointer transition-all hover:scale-110 ${
                getPriorityBgColor(cluster.highestPriority)
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onSelect?.(cluster)}
            >
              <span className="absolute -top-1 -right-1 text-xs font-bold text-white bg-black rounded-full w-2 h-2 flex items-center justify-center">
                {cluster.count}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium text-xs">{cluster.count} activities in {cluster.location}</div>
              <div className="text-xs text-muted-foreground">Highest: {cluster.highestPriority.toUpperCase()}</div>
              <div className="text-xs">{formatTimeAgo(cluster.timeRange.start)} - {formatTimeAgo(cluster.timeRange.end)}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={() => onSelect?.(cluster)}
    >
      <CardContent className="p-2 space-y-1">
        {/* Cluster Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-blue-600" />
            <span className="font-medium text-xs">{cluster.count} activities</span>
            <Badge className={`${getPriorityColor(cluster.highestPriority).background} ${getPriorityColor(cluster.highestPriority).text} ${getPriorityColor(cluster.highestPriority).border}`}>
              {cluster.highestPriority.toUpperCase()}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <Eye className="h-2 w-2" /> : <MoreVertical className="h-2 w-2" />}
          </Button>
        </div>

        {/* Representative Activity */}
        <div className="space-y-0.5">
          <div className="font-medium text-xs">{cluster.representative.title}</div>
          <div className="text-xs text-gray-600">{cluster.location}</div>
          <div className="text-xs text-gray-500">
            {formatTimeAgo(cluster.timeRange.start)} - {formatTimeAgo(cluster.timeRange.end)}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="flex gap-0.5">
          {cluster.activities.slice(0, 5).map((activity, index) => (
            <div
              key={activity.id}
              className={`w-1 h-1 rounded ${
                getPriorityBgColor(activity.priority)
              }`}
              title={activity.title}
            />
          ))}
          {cluster.count > 5 && (
            <div className="text-xs text-gray-500 ml-1">+{cluster.count - 5}</div>
          )}
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t pt-1 space-y-0.5">
            {cluster.activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="text-xs p-1 bg-gray-50 rounded">
                <div className="font-medium">{activity.title}</div>
                <div className="text-gray-500">{formatTimeAgo(activity.timestamp)}</div>
              </div>
            ))}
            {cluster.count > 3 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-4 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('view_all', cluster);
                }}
              >
                View all {cluster.count}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Enhanced Stream Card for enterprise features - Always Compact Version
const EnterpriseStreamCard = memo<{ 
  activity: EnterpriseActivity; 
  onSelect?: (activity: EnterpriseActivity) => void; 
  onAction?: (action: string, activity: EnterpriseActivity) => void;
  isSelected?: boolean;
  compactMode?: boolean;
}>(({ activity, onSelect, onAction, isSelected = false, compactMode = true }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      } ${activity.isMassCasualty ? 'ring-2 ring-red-500' : ''} ${
        activity.isSecurityThreat ? 'ring-2 ring-orange-500' : ''
      }`}
      onClick={() => onSelect?.(activity)}
    >
      <CardContent className="p-2 space-y-1">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">
              {formatTime(activity.timestamp)}
            </span>
            <span className="text-sm">{getTypeIcon(activity.type)}</span>
            <span className="font-medium text-xs">
              {activity.type}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {activity.businessImpact && activity.businessImpact !== 'none' && (
              <div 
                className={`w-2 h-2 rounded-full ${getBusinessImpactColor(activity.businessImpact)}`}
                title={`Business Impact: ${activity.businessImpact}`}
              />
            )}
            {activity.isNewActivity && (
              <Badge className="bg-red-100 text-red-800 text-xs animate-pulse">NEW</Badge>
            )}
            {activity.isBoloActive && (
              <Badge className="bg-orange-100 text-orange-800 text-xs">BOLO</Badge>
            )}
            {activity.isMassCasualty && (
              <Badge className="bg-red-100 text-red-800 text-xs animate-pulse">MASS</Badge>
            )}
            {activity.isSecurityThreat && (
              <Badge className="bg-orange-100 text-orange-800 text-xs">THREAT</Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="font-medium text-xs">{activity.title}</div>

        {/* Location */}
        <div className="text-xs text-gray-600">{activity.zone || activity.location}</div>

        {/* Status and Assignment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Badge className={`${getPriorityColor(activity.priority).background} ${getPriorityColor(activity.priority).text} ${getPriorityColor(activity.priority).border}`}>
              {activity.priority.toUpperCase()}
            </Badge>
            {activity.escalationLevel && activity.escalationLevel > 0 && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                ESC {activity.escalationLevel}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-600">
            {activity.assignedTo && activity.assignedTo}
            {activity.respondingUnits && activity.respondingUnits.length > 0 && 
              ` • ${activity.respondingUnits.length}u`}
          </div>
        </div>

        {/* Additional Cameras */}
        {activity.additionalCameras && activity.additionalCameras.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Camera className="h-2 w-2" />
            <span>+{activity.additionalCameras.length} cameras</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Summary Card for high-level overview - Compact Version
const SummaryCard = memo<{ 
  activity: EnterpriseActivity; 
  onSelect?: (activity: EnterpriseActivity) => void;
  isSelected?: boolean;
}>(({ activity, onSelect, isSelected = false }) => {
  return (
    <div 
      className={`border-l-2 ${
        activity.priority === 'critical' ? 'border-red-500 bg-red-50' :
        activity.priority === 'high' ? 'border-orange-500 bg-orange-50' :
        activity.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
        'border-gray-300 bg-gray-50'
      } pl-2 py-1 cursor-pointer hover:bg-opacity-75 transition-colors ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect?.(activity)}
    >
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-medium text-xs">{activity.type}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
          </div>
          {activity.confidence && (
            <Badge variant="outline" className="text-xs">
              {activity.confidence}%
            </Badge>
          )}
        </div>
        
        <div className="font-medium text-xs">{activity.title}</div>
        
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="h-2 w-2" />
          <span>{activity.location}</span>
          {activity.cameraName && (
            <>
              <span>•</span>
              <Camera className="h-2 w-2" />
              <span>{activity.cameraName}</span>
            </>
          )}
        </div>
        
        {activity.assignedTo && (
          <div className="text-xs text-gray-600">
            {activity.assignedTo}
          </div>
        )}
      </div>
    </div>
  );
});

// Main Enterprise Activity Card Component
export const EnterpriseActivityCard = memo<EnterpriseActivityCardProps>(({
  activity,
  variant,
  onSelect,
  onAction,
  isSelected = false,
  className = '',
  isVisible = true,
  compactMode = false
}) => {
  // Performance optimization: don't render if not visible
  if (!isVisible) {
    return <div className="h-0" />;
  }

  const baseClassName = `${className}`;

  // Handle both individual activities and clusters
  const isCluster = 'clusterType' in activity && (activity as any).clusterType === 'cluster';

  if (isCluster) {
    return (
      <div className={baseClassName}>
        <ClusterCard 
          cluster={activity as ActivityCluster}
          onSelect={onSelect}
          onAction={onAction}
          isSelected={isSelected}
          variant={variant}
        />
      </div>
    );
  }

  const activityData = activity as EnterpriseActivity;

  switch (variant) {
    case 'minimal':
      return (
        <div className={baseClassName}>
          <MinimalCard 
            activity={activityData}
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </div>
      );
      
    case 'stream':
      return (
        <div className={baseClassName}>
          <EnterpriseStreamCard 
            activity={activityData}
            onSelect={onSelect}
            onAction={onAction}
            isSelected={isSelected}
            compactMode={compactMode}
          />
        </div>
      );
      
    case 'summary':
      return (
        <div className={baseClassName}>
          <SummaryCard 
            activity={activityData}
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </div>
      );
      
    case 'timeline':
      return (
        <div className={baseClassName}>
          <SummaryCard 
            activity={activityData}
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </div>
      );
      
    default:
      return (
        <div className={baseClassName}>
          <EnterpriseStreamCard 
            activity={activityData}
            onSelect={onSelect}
            onAction={onAction}
            isSelected={isSelected}
            compactMode={compactMode}
          />
        </div>
      );
  }
});

export default EnterpriseActivityCard;