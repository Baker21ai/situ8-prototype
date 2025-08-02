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
import { ExternalDataDisplay } from './ExternalDataDisplay';

// Import our new molecule components
import { 
  ActivityInfo, 
  ActivityInfoCompact, 
  ActivityInfoMinimal,
  ActivityMetadata, 
  ActivityMetadataCompact, 
  ActivityMetadataMinimal,
  ActivityActions,
  ActivityActionsCompact,
  ActivityActionsMinimal,
  ActivityActionsTooltip
} from '../src/presentation/molecules';

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


// Minimal Card for high-density displays - Refactored with Molecules
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
            <ActivityInfoMinimal 
              activity={activity}
              showType={true}
              showLocation={true}
              showTime={true}
              showCamera={false}
              timeFormat="relative"
            />
            <ActivityMetadataMinimal 
              activity={activity}
              showPriority={false}
              showStatus={false}
              showConfidence={true}
              showBusinessImpact={false}
              showSpecialBadges={false}
              showExternalData={false}
              showEscalation={false}
            />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Cluster Card for grouped activities - Refactored with Molecules
const ClusterCard = memo<{ 
  cluster: ActivityCluster; 
  onSelect?: (cluster: ActivityCluster) => void; 
  onAction?: (action: string, cluster: ActivityCluster) => void;
  isSelected?: boolean;
  variant: EnterpriseCardVariant;
}>(({ cluster, onSelect, onAction, isSelected = false, variant }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleAction = (action: string, item: any) => {
    if (action === 'expand') {
      setIsExpanded(true);
    } else if (action === 'collapse') {
      setIsExpanded(false);
    } else {
      onAction?.(action, item);
    }
  };
  
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
        className={`cursor-pointer transition-all hover:shadow-md max-w-full ${
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
          <ActivityActionsMinimal
            activity={cluster}
            onAction={handleAction}
            showExpandCollapse={true}
            isExpanded={isExpanded}
          />
        </div>

        {/* Representative Activity Info */}
        <ActivityInfoCompact
          activity={cluster.representative}
          showType={false}
          showTime={false}
          showLocation={true}
          showCamera={false}
        />
        
        {/* Time Range */}
        <div className="text-xs text-gray-500">
          {formatTimeAgo(cluster.timeRange.start)} - {formatTimeAgo(cluster.timeRange.end)}
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
                <ActivityInfoMinimal
                  activity={activity}
                  showType={false}
                  showTime={true}
                  showLocation={false}
                  showCamera={false}
                  timeFormat="relative"
                />
              </div>
            ))}
            <ActivityActionsCompact
              activity={cluster}
              onAction={handleAction}
              showQuickActions={true}
              showMainActions={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Enhanced Stream Card for enterprise features - Refactored with Molecules
const EnterpriseStreamCard = memo<{ 
  activity: EnterpriseActivity; 
  onSelect?: (activity: EnterpriseActivity) => void; 
  onAction?: (action: string, activity: EnterpriseActivity) => void;
  isSelected?: boolean;
  compactMode?: boolean;
}>(({ activity, onSelect, onAction, isSelected = false, compactMode = true }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md max-w-full ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
      } ${activity.isMassCasualty ? 'ring-2 ring-red-500' : ''} ${
        activity.isSecurityThreat ? 'ring-2 ring-orange-500' : ''
      }`}
      onClick={() => onSelect?.(activity)}
    >
      <CardContent className="p-2 space-y-1">
        {/* Activity Information */}
        <ActivityInfoCompact 
          activity={activity}
          timeFormat="absolute"
          showType={true}
          showTime={true}
        />

        {/* Activity Metadata */}
        <ActivityMetadataCompact 
          activity={activity}
          showPriority={true}
          showStatus={true}
          showConfidence={true}
          showBusinessImpact={true}
          showSpecialBadges={true}
          showExternalData={true}
          showEscalation={true}
        />

        {/* Activity Actions */}
        <ActivityActionsCompact 
          activity={activity}
          onAction={onAction}
          showQuickActions={false}
          showMainActions={false}
        />
      </CardContent>
    </Card>
  );
});

// Summary Card for high-level overview - Refactored with Molecules
const SummaryCard = memo<{ 
  activity: EnterpriseActivity; 
  onSelect?: (activity: EnterpriseActivity) => void;
  isSelected?: boolean;
}>(({ activity, onSelect, isSelected = false }) => {
  return (
    <div 
      className={`border-l-2 max-w-full ${
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
        {/* Header with type and confidence */}
        <div className="flex items-center justify-between">
          <ActivityInfoMinimal 
            activity={activity}
            showType={true}
            showTime={true}
            showLocation={false}
            showCamera={false}
            timeFormat="relative"
          />
          <ActivityMetadataMinimal 
            activity={activity}
            showPriority={false}
            showStatus={false}
            showConfidence={true}
            showBusinessImpact={false}
            showSpecialBadges={false}
            showExternalData={false}
            showEscalation={false}
          />
        </div>
        
        {/* Title from ActivityInfo */}
        <div className="font-medium text-xs">{activity.title}</div>
        
        {/* Location and camera info */}
        <ActivityInfoMinimal 
          activity={activity}
          showType={false}
          showTime={false}
          showLocation={true}
          showCamera={true}
        />
        
        {/* Assignment info handled by ActivityInfo */}
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