import React from 'react';
import { EnterpriseActivity, ActivityCluster } from '../lib/types/activity';
import { ActivityList } from '../src/presentation/organisms/lists';

interface EnterpriseActivityManagerProps {
  activities: EnterpriseActivity[];
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  realTimeMode?: boolean;
  className?: string;
}

/**
 * EnterpriseActivityManager - Now using the new compound ActivityList component
 * This demonstrates the clean, maintainable approach replacing the monolithic implementation
 */
export function EnterpriseActivityManager({
  activities,
  onActivitySelect,
  onActivityAction,
  onBulkAction,
  realTimeMode = true,
  className = ''
}: EnterpriseActivityManagerProps) {
  return (
    <ActivityList
      activities={activities}
      onActivitySelect={onActivitySelect}
      onActivityAction={onActivityAction}
      onBulkAction={onBulkAction}
      realTimeMode={realTimeMode}
      className={className}
    >
      <ActivityList.Header>
        <div className="flex items-center gap-2 mb-2">
          <ActivityList.Search />
          <ActivityList.ViewToggle />
          <ActivityList.Filters showAdvanced={false} />
        </div>
        <ActivityList.Filters showAdvanced={true} />
      </ActivityList.Header>
      
      <ActivityList.Content />
      
      <ActivityList.Footer />
    </ActivityList>
  );
}