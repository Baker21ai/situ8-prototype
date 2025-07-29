import React from 'react';
import { ActivityCard } from './ActivityCard';
import { ActivityData, EnterpriseActivity, ActivityCluster } from '@/lib/types/activity';

/**
 * Example implementations showing how to use the unified ActivityCard
 * to replace all existing card variants
 */

// Mock activity data
const mockActivity: ActivityData = {
  id: '001',
  timestamp: new Date(),
  type: 'TAILGATE',
  title: 'Unauthorized entry detected',
  location: 'Building A - East Entrance',
  zone: 'Zone A-1',
  building: 'Building A',
  priority: 'high',
  status: 'active',
  confidence: 94,
  assignedTo: 'Garcia, M.',
  isNewActivity: true,
  isBoloActive: false,
  thumbnailUrl: '/thumbnails/tailgate-001.jpg',
  gifUrl: '/evidence/tailgate-001.mp4'
};

/**
 * Stream Card - For Command Center Left Panel
 * Compact view with minimal information
 */
export const StreamCardExample: React.FC<{
  activity: ActivityData;
  onSelect: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  isSelected: boolean;
}> = ({ activity, onSelect, isSelected }) => {
  return (
    <ActivityCard
      activity={activity}
      variant="compact"
      layout="stream"
      onClick={onSelect}
      isSelected={isSelected}
      features={{
        showSiteBadge: true
      }}
    />
  );
};

/**
 * Timeline Card - For Command Center Right Panel
 * Compact timeline-specific styling
 */
export const TimelineCardExample: React.FC<{
  activity: ActivityData;
  onSelect: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
}> = ({ activity, onSelect }) => {
  return (
    <ActivityCard
      activity={activity}
      variant="compact"
      layout="timeline"
      onClick={onSelect}
      features={{
        showSiteBadge: true
      }}
    />
  );
};

/**
 * List Card - For Activities Page
 * Detailed view with actions and selection
 */
export const ListCardExample: React.FC<{
  activity: ActivityData;
  onSelect: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  onAction: (action: string, activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  isSelected: boolean;
  showCheckbox: boolean;
}> = ({ activity, onSelect, onAction, isSelected, showCheckbox }) => {
  return (
    <ActivityCard
      activity={activity}
      variant="detailed"
      layout="list"
      onClick={onSelect}
      onAction={onAction}
      isSelected={isSelected}
      features={{
        showCheckbox,
        showActions: true,
        showAssignment: true,
        showConfidence: true,
        showSiteBadge: true
      }}
    />
  );
};

/**
 * Grid Card - For Dashboard/Overview
 * Medium detail with visual emphasis
 */
export const GridCardExample: React.FC<{
  activity: ActivityData;
  onSelect: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  onAction: (action: string, activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
}> = ({ activity, onSelect, onAction }) => {
  return (
    <ActivityCard
      activity={activity}
      variant="detailed"
      layout="grid"
      onClick={onSelect}
      onAction={onAction}
      features={{
        showActions: true,
        showEvidence: true,
        showConfidence: true,
        showSiteBadge: true
      }}
    />
  );
};

/**
 * Minimal Card - For High-Density Displays
 * Tiny visual indicator only
 */
export const MinimalCardExample: React.FC<{
  activity: ActivityData;
  onSelect: (activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
  isSelected: boolean;
}> = ({ activity, onSelect, isSelected }) => {
  return (
    <ActivityCard
      activity={activity}
      variant="minimal"
      layout="stream"
      onClick={onSelect}
      isSelected={isSelected}
    />
  );
};

/**
 * Mobile Card - For Guard Mobile App
 * Touch-optimized with large action buttons
 */
export const MobileCardExample: React.FC<{
  activity: ActivityData;
  onAction: (action: string, activity: ActivityData | EnterpriseActivity | ActivityCluster) => void;
}> = ({ activity, onAction }) => {
  return (
    <div className="w-full">
      <ActivityCard
        activity={activity}
        variant="detailed"
        layout="list"
        onAction={onAction}
        features={{
          showActions: true,
          showAssignment: true
        }}
        className="shadow-lg"
      />
      {/* Mobile-specific action buttons */}
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium"
          onClick={() => onAction('respond', activity)}
        >
          RESPOND
        </button>
        <button
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium"
          onClick={() => onAction('details', activity)}
        >
          DETAILS
        </button>
      </div>
    </div>
  );
};

/**
 * Enterprise Card with Clustering
 * Shows grouped activities
 */
export const ClusterCardExample: React.FC<{
  cluster: any; // ActivityCluster type
  onSelect: (cluster: any) => void;
  onAction: (action: string, cluster: any) => void;
}> = ({ cluster, onSelect, onAction }) => {
  return (
    <ActivityCard
      activity={cluster}
      variant="compact"
      layout="stream"
      onClick={onSelect}
      onAction={onAction}
      features={{
        showActions: true,
        showSiteBadge: true
      }}
    />
  );
};