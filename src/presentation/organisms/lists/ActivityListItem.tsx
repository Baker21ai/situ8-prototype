import React, { memo } from 'react';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';
import { EnterpriseActivityCard, EnterpriseCardVariant } from '../../../../components/EnterpriseActivityCard';

// Item heights for different card variants (in pixels)
export const ITEM_HEIGHTS = {
  minimal: 12,      // Tiny dots for minimal view
  summary: 80,      // Compact summary cards
  stream: 120,      // Full stream cards with metadata
  timeline: 120,    // Timeline view (same as stream)
  list: 60,         // List view format
  evidence: 140,    // Evidence cards with more space
  mobile: 100,      // Mobile-optimized cards
  cluster: 90,      // Cluster cards (adjustable based on expansion)
} as const;

export interface ActivityListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: (EnterpriseActivity | ActivityCluster)[];
    variant: EnterpriseCardVariant;
    onSelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
    onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
    selectedItems: Set<string>;
    compactMode: boolean;
    layoutMode: 'grid' | 'horizontal';
  };
}

// Memoized list item component for optimal performance
export const ActivityListItem = memo<ActivityListItemProps>(({ 
  index, 
  style, 
  data 
}) => {
  const { 
    items, 
    variant, 
    onSelect, 
    onAction, 
    selectedItems, 
    compactMode, 
    layoutMode 
  } = data;
  
  const item = items[index];
  if (!item) {
    return <div style={style} />;
  }

  const isSelected = selectedItems.has(
    'clusterType' in item && item.clusterType === 'cluster' ? item.id : item.id
  );

  // For grid layout mode, we need to handle multiple items per row
  if (layoutMode === 'grid') {
    return (
      <div style={style} className="px-4 py-2">
        <EnterpriseActivityCard
          activity={item}
          variant={variant}
          onSelect={onSelect}
          onAction={onAction}
          isSelected={isSelected}
          index={index}
          isVisible={true}
          compactMode={compactMode}
          className="w-full"
        />
      </div>
    );
  }

  // For horizontal layout mode (scrolling)
  return (
    <div style={style} className="px-3 py-1 flex-shrink-0">
      <div className="w-72">
        <EnterpriseActivityCard
          activity={item}
          variant={variant}
          onSelect={onSelect}
          onAction={onAction}
          isSelected={isSelected}
          index={index}
          isVisible={true}
          compactMode={true}
          className="w-full"
        />
      </div>
    </div>
  );
});

ActivityListItem.displayName = 'ActivityListItem';

// Helper function to get item height based on variant and item type
export const getItemHeight = (
  variant: EnterpriseCardVariant,
  item?: EnterpriseActivity | ActivityCluster,
  compactMode = false
): number => {
  let baseHeight = ITEM_HEIGHTS[variant];
  
  // Adjust height for clusters (may expand)
  if (item && 'clusterType' in item && item.clusterType === 'cluster') {
    if (item.isExpanded) {
      baseHeight += Math.min(item.count * 20, 100); // Max additional 100px for expanded
    }
  }
  
  // Compact mode reduces height by 20%
  if (compactMode) {
    baseHeight *= 0.8;
  }
  
  // Add padding/margin (8px top + 8px bottom = 16px total)
  return Math.ceil(baseHeight + 16);
};

// Helper function for dynamic height calculation with VariableSizeList
export const createItemSizeGetter = (
  items: (EnterpriseActivity | ActivityCluster)[],
  variant: EnterpriseCardVariant,
  compactMode = false
) => {
  return (index: number): number => {
    const item = items[index];
    return getItemHeight(variant, item, compactMode);
  };
};