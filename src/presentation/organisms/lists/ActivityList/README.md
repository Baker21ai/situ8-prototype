# ActivityList Compound Component

A modern, flexible compound component architecture for displaying enterprise activities with advanced filtering, virtual scrolling, and priority-based segmentation.

## Features

- **Compound Component Pattern**: Flexible composition with sub-components
- **Virtual Scrolling**: Handles 5000+ activities efficiently
- **Priority-based Segmentation**: Visual grouping by priority levels
- **AI-powered Filtering**: Intelligent false positive detection
- **Activity Clustering**: Automatic grouping of similar activities
- **Real-time Updates**: Live data refresh capabilities
- **Keyboard Navigation**: Full keyboard support
- **Type Safety**: Complete TypeScript interfaces

## Basic Usage

```tsx
import { ActivityList } from '../src/presentation/organisms/lists';

function MyActivityManager({ activities, onSelect }) {
  return (
    <ActivityList 
      activities={activities} 
      onActivitySelect={onSelect}
      realTimeMode={true}
    >
      <ActivityList.Header>
        <ActivityList.Search />
        <ActivityList.ViewToggle />
        <ActivityList.Filters />
      </ActivityList.Header>
      
      <ActivityList.Content />
      
      <ActivityList.Footer />
    </ActivityList>
  );
}
```

## Advanced Usage

```tsx
function AdvancedActivityManager({ activities }) {
  return (
    <ActivityList 
      activities={activities}
      onActivitySelect={handleSelect}
      onActivityAction={handleAction}
      onBulkAction={handleBulkAction}
      realTimeMode={true}
      height={600}
    >
      {/* Custom header layout */}
      <ActivityList.Header>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <ActivityList.Search placeholder="Search activities..." />
            <ActivityList.ViewToggle />
          </div>
          <ActivityList.Stats detailed={false} />
        </div>
        
        {/* Advanced filters */}
        <ActivityList.Filters showAdvanced={true} />
      </ActivityList.Header>
      
      {/* Main content area */}
      <ActivityList.Content height={400} />
      
      {/* Footer with bulk actions */}
      <ActivityList.Footer />
    </ActivityList>
  );
}
```

## Component Architecture

### Core Components

- **`ActivityList`**: Main provider component with context
- **`ActivityList.Header`**: Header section with controls
- **`ActivityList.Content`**: Main content area with virtual scrolling
- **`ActivityList.Footer`**: Footer with status and bulk actions

### Specialized Components

- **`ActivityList.Search`**: Search input component
- **`ActivityList.ViewToggle`**: View mode toggle (minimal/summary/stream)
- **`ActivityList.Filters`**: Advanced filtering controls
- **`ActivityList.Stats`**: Performance and activity statistics

## Context Usage

Access the ActivityList context in custom components:

```tsx
import { useActivityListContext } from '../src/presentation/organisms/lists';

function CustomComponent() {
  const {
    filteredActivities,
    filters,
    setFilters,
    performanceMetrics,
    priorityMetrics
  } = useActivityListContext();
  
  return (
    <div>
      Total: {filteredActivities.length}
      Critical: {priorityMetrics.critical}
    </div>
  );
}
```

## Features

### AI-Powered Filtering

Automatically filters out:
- False positives (>80% likelihood)
- Low confidence detections (<30%)
- Off-hours low priority events

### Activity Clustering

Groups similar activities by:
- Same location and type
- Within 15-minute time window
- Maintains highest priority in cluster

### Priority Segmentation

Visual grouping with color coding:
- **Critical**: Red background, pulsing animation
- **High**: Orange background 
- **Medium**: Yellow background
- **Low**: Green background

### Performance Optimization

- Virtual scrolling for large datasets
- Memoized components for render efficiency
- Intelligent batching and lazy loading
- Memory usage monitoring

## Props Reference

### ActivityList Props

```typescript
interface ActivityListProps {
  activities: (EnterpriseActivity | ActivityCluster)[];
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  realTimeMode?: boolean;
  className?: string;
  height?: number;
  children?: React.ReactNode;
}
```

### Filter State

```typescript
interface ActivityFilterState {
  search: string;
  priorities: Priority[];
  statuses: string[];
  types: string[];
  locations: string[];
  timeRange: 'live' | '15m' | '1h' | '4h' | '24h' | 'custom';
  businessImpact: string[];
  confidenceThreshold: number;
  showClusters: boolean;
  aiFiltering: boolean;
}
```

## Migration from EnterpriseActivityManager

The new compound component replaces the 772-line monolithic `EnterpriseActivityManager`:

### Before (Monolithic)
```tsx
// 772 lines of complex, tightly coupled code
<EnterpriseActivityManager
  activities={activities}
  onActivitySelect={onSelect}
  // ... many more props
/>
```

### After (Compound)
```tsx
// Clean, composable, maintainable
<ActivityList activities={activities} onActivitySelect={onSelect}>
  <ActivityList.Header>
    <ActivityList.Search />
    <ActivityList.Filters />
  </ActivityList.Header>
  <ActivityList.Content />
  <ActivityList.Footer />
</ActivityList>
```

## Benefits

1. **Maintainability**: Smaller, focused components
2. **Flexibility**: Compose layouts as needed
3. **Performance**: Optimized virtual scrolling and memoization
4. **Type Safety**: Complete TypeScript coverage
5. **Testability**: Individual components can be tested in isolation
6. **Reusability**: Sub-components can be used independently

## Keyboard Shortcuts

- `Ctrl+F`: Focus search input
- `Ctrl+R`: Toggle AI filtering
- `Ctrl+M`: Toggle view mode
- `Ctrl+V`: Toggle virtual scrolling
- `↑↓`: Navigate activities
- `Enter`: Select activity
- `Home/End`: Jump to first/last

## Performance

- Handles 5000+ activities smoothly
- Virtual scrolling reduces DOM nodes
- Memoized rendering prevents unnecessary updates
- Memory usage monitoring included
- Efficient filtering algorithms