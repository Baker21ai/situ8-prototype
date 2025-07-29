# ActivityCard Migration Guide

This guide shows how to migrate from the old activity card implementations to the new unified ActivityCard component.

## Quick Reference

### Old → New Mapping

| Old Component | New Configuration |
|--------------|-------------------|
| `StreamCard` | `<ActivityCard variant="compact" layout="stream" />` |
| `TimelineCard` | `<ActivityCard variant="compact" layout="timeline" />` |
| `ListCard` | `<ActivityCard variant="detailed" layout="list" features={{ showCheckbox, showActions }} />` |
| `EvidenceCard` | `<ActivityCard variant="detailed" layout="list" features={{ showEvidence: true }} />` |
| `MobileCard` | `<ActivityCard variant="detailed" layout="list" />` + action buttons |
| `MinimalCard` | `<ActivityCard variant="minimal" />` |
| `ClusterCard` | `<ActivityCard />` (automatically handles clusters) |
| `EnterpriseStreamCard` | `<ActivityCard variant="compact" layout="stream" features={{ showSiteBadge: true }} />` |

## Migration Examples

### 1. Stream Card (Command Center - Left Panel)

**Before:**
```tsx
// In CommandCenter.tsx
<StreamCard 
  activity={activity} 
  onSelect={handleSelect}
  isSelected={selectedActivity?.id === activity.id}
/>
```

**After:**
```tsx
import { ActivityCard } from '@/components/organisms/ActivityCard';

<ActivityCard
  activity={activity}
  variant="compact"
  layout="stream"
  onClick={handleSelect}
  isSelected={selectedActivity?.id === activity.id}
  features={{
    showSiteBadge: true  // For enterprise features
  }}
/>
```

### 2. Timeline Card (Command Center - Right Panel)

**Before:**
```tsx
// In Timeline.tsx
<TimelineCard 
  activity={activity} 
  onSelect={handleActivitySelect}
/>
```

**After:**
```tsx
<ActivityCard
  activity={activity}
  variant="compact"
  layout="timeline"
  onClick={handleActivitySelect}
  features={{
    showSiteBadge: true
  }}
/>
```

### 3. List Card (Activities Page)

**Before:**
```tsx
// In Activities.tsx
<ListCard 
  activity={activity} 
  onSelect={handleSelect}
  onAction={handleAction}
  isSelected={selectedActivities.has(activity.id)}
  showCheckbox={true}
/>
```

**After:**
```tsx
<ActivityCard
  activity={activity}
  variant="detailed"
  layout="list"
  onClick={handleSelect}
  onAction={handleAction}
  isSelected={selectedActivities.has(activity.id)}
  features={{
    showCheckbox: true,
    showActions: true,
    showAssignment: true,
    showConfidence: true,
    showSiteBadge: true
  }}
/>
```

### 4. Mobile Card

**Before:**
```tsx
// In MobileApp.tsx
<MobileCard 
  activity={activity} 
  onAction={handleMobileAction}
/>
```

**After:**
```tsx
<div className="w-full">
  <ActivityCard
    activity={activity}
    variant="detailed"
    layout="list"
    onAction={handleMobileAction}
    features={{
      showActions: true,
      showAssignment: true
    }}
    className="shadow-lg"
  />
  {/* Keep mobile-specific action buttons separate */}
  <div className="flex gap-2 mt-2">
    <Button onClick={() => handleMobileAction('respond', activity)} className="flex-1">
      RESPOND
    </Button>
    <Button onClick={() => handleMobileAction('details', activity)} variant="outline" className="flex-1">
      DETAILS
    </Button>
  </div>
</div>
```

### 5. Enterprise Activity Card

**Before:**
```tsx
// In EnterpriseActivityManager.tsx
<EnterpriseActivityCard
  activity={activity}
  variant="stream"
  onSelect={handleSelect}
  compactMode={true}
/>
```

**After:**
```tsx
<ActivityCard
  activity={activity}  // Works with both ActivityData and EnterpriseActivity
  variant="compact"
  layout="stream"
  onClick={handleSelect}
  features={{
    showSiteBadge: true,
    showConfidence: true,
    showAssignment: true
  }}
/>
```

### 6. Cluster Card

**Before:**
```tsx
<ClusterCard 
  cluster={activityCluster}
  onSelect={handleClusterSelect}
  variant="stream"
/>
```

**After:**
```tsx
<ActivityCard
  activity={activityCluster}  // Automatically detects clusters
  variant="compact"
  layout="stream"
  onClick={handleClusterSelect}
  features={{
    showActions: true,
    showSiteBadge: true
  }}
/>
```

## Feature Flags Reference

```typescript
interface ActivityCardFeatures {
  showCheckbox?: boolean;      // Selection checkbox
  showActions?: boolean;       // Action menu button
  showMetadata?: boolean;      // Additional metadata
  showEvidence?: boolean;      // Thumbnail/media preview
  showAssignment?: boolean;    // Assigned guard name
  showConfidence?: boolean;    // AI confidence score
  showSiteBadge?: boolean;     // Purple site badge
}
```

## Variant & Layout Options

### Variants
- `compact` - Minimal spacing, small text (default)
- `detailed` - More spacing, larger text
- `minimal` - Tiny dot indicator only

### Layouts
- `stream` - Standard card with hover effects
- `timeline` - Left border, timeline styling
- `list` - Optimized for list views
- `grid` - For grid/dashboard layouts

## Benefits of Migration

1. **Single Source of Truth** - One component to maintain
2. **Consistent Behavior** - Same interactions everywhere
3. **Feature Parity** - All cards get new features automatically
4. **Performance** - Memoized and optimized rendering
5. **Type Safety** - Full TypeScript support
6. **Flexibility** - Easy to add new features via flags

## Step-by-Step Migration Process

1. **Import the new component**
   ```tsx
   import { ActivityCard } from '@/components/organisms/ActivityCard';
   ```

2. **Replace old component with ActivityCard**
   - Choose appropriate variant and layout
   - Map old props to new structure

3. **Configure features**
   - Enable features based on old component capabilities
   - Add any missing features via feature flags

4. **Test thoroughly**
   - Verify visual appearance matches
   - Test all interactions work correctly
   - Check performance is maintained

5. **Remove old component imports**
   - Once migrated, remove old component imports
   - Delete old component files when all usages are migrated

## Common Migration Issues

### Issue: Different prop names
**Solution**: Map old props to new structure:
```tsx
// Old
onSelect={handleSelect}

// New
onClick={handleSelect}
```

### Issue: Custom styling lost
**Solution**: Use className prop:
```tsx
<ActivityCard
  className="custom-styles"
  // ... other props
/>
```

### Issue: Missing functionality
**Solution**: Add via feature flags or wrap component:
```tsx
// If need custom behavior, wrap the ActivityCard
<div className="custom-wrapper">
  <ActivityCard {...props} />
  <CustomElements />
</div>
```

## Next Steps

1. Start with one component file
2. Migrate all instances in that file
3. Test thoroughly
4. Move to next file
5. Once all migrated, remove old components

The unified ActivityCard provides a consistent, maintainable solution for all activity display needs!