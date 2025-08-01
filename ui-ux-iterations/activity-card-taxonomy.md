# Activity Card Taxonomy & Design System

## Activity Card Types

### 1. Stream Card
- **Purpose**: Real-time activity feed
- **Context**: Command Center, Live Monitoring
- **Visual Priority**: Medium
- **Container Structure**:
  - Time Badge (top-right)
  - Integration Source (top-left)
  - Main Content Area
  - Action Bar (bottom)

### 2. Timeline Card
- **Purpose**: Chronological activity history
- **Context**: Activity Timeline, Audit Trail
- **Visual Priority**: High (detailed view)
- **Container Structure**:
  - Timestamp (left rail)
  - Content Block (center)
  - Metadata (bottom)
  - Expandable Details

### 3. List Card
- **Purpose**: Tabular activity overview
- **Context**: Activities Page, Reports
- **Visual Priority**: Low (compact view)
- **Container Structure**:
  - Checkbox (left)
  - Content Preview
  - Status Badge
  - Quick Actions (hover)

### 4. Evidence Card
- **Purpose**: Detailed incident evidence
- **Context**: Case Management, Investigations
- **Visual Priority**: Very High
- **Container Structure**:
  - Media Gallery (top)
  - Evidence Details
  - Chain of Custody
  - Related Activities

### 5. Mobile Card
- **Purpose**: Mobile-optimized activity view
- **Context**: Mobile App, Responsive Design
- **Visual Priority**: High (touch-friendly)
- **Container Structure**:
  - Swipe Actions
  - Full-width Touch Targets
  - Collapsible Details
  - Gesture Support

### 6. Case Card
- **Purpose**: Activity within case context
- **Context**: Case Details, Investigation
- **Visual Priority**: Medium
- **Container Structure**:
  - Case Link (top)
  - Activity Summary
  - Evidence Preview
  - Case Actions

### 7. Compact Card
- **Purpose**: High-density information display
- **Context**: Dashboard Widgets, Summary Views
- **Visual Priority**: Low
- **Container Structure**:
  - Icon + Title
  - Status Indicator
  - Mini Actions
  - Hover Expansion

### 8. Dashboard Card
- **Purpose**: KPI and metric display
- **Context**: Executive Dashboard, Overview
- **Visual Priority**: Medium
- **Container Structure**:
  - Metric Value
  - Trend Indicator
  - Sparkline Chart
  - Drill-down Link

### 9. Notification Card
- **Purpose**: Real-time alerts and updates
- **Context**: Notification Center, Alerts
- **Visual Priority**: Very High (urgent)
- **Container Structure**:
  - Alert Level (color-coded)
  - Urgency Badge
  - Quick Actions
  - Dismiss Button

## Activity View Types

### 1. Real-time Stream
- **Update Frequency**: Live (every 2-3 seconds)
- **Card Type**: Stream Card
- **Sort Order**: Chronological (newest first)
- **Auto-scroll**: Enabled
- **Container**: Infinite scroll

### 2. Historical Timeline
- **Update Frequency**: Manual refresh
- **Card Type**: Timeline Card
- **Sort Order**: Chronological (oldest first)
- **Filters**: Date range, type, source
- **Container**: Paginated

### 3. Grid/List View
- **Update Frequency**: Manual refresh
- **Card Type**: List Card
- **Sort Order**: Configurable
- **Actions**: Bulk operations
- **Container**: Table/grid layout

### 4. Case Timeline
- **Update Frequency**: Manual refresh
- **Card Type**: Case Card
- **Sort Order**: Case-relevant
- **Context**: Specific case activities
- **Container**: Nested timeline

### 5. Mobile Feed
- **Update Frequency**: Pull-to-refresh
- **Card Type**: Mobile Card
- **Sort Order**: Chronological
- **Gestures**: Swipe, tap, long-press
- **Container**: Stacked cards

### 6. Dashboard Widget
- **Update Frequency**: Every 30 seconds
- **Card Type**: Dashboard Card
- **Sort Order**: Metric-based
- **Interactivity**: Drill-down
- **Container**: Grid layout

### 7. Notification Center
- **Update Frequency**: Push notifications
- **Card Type**: Notification Card
- **Sort Order**: Urgency + Time
- **Actions**: Quick resolve, dismiss
- **Container**: Overlay panel

## Container Design System

### Universal Container Properties
All activity cards share these container characteristics:

```
┌─────────────────────────────────────────┐
│ Card Container                          │
│ ┌─────────────────────────────────────┐ │
│ │ Header Zone                         │ │
│ │ • Integration Source [left]        │ │
│ │ • Time [right]                     │ │
│ ├─────────────────────────────────────┤ │
│ │ Content Zone                        │ │
│ │ • Trigger/Event Description         │ │
│ │ • Location Information             │ │
│ │ • Intensity Level (if applicable)   │ │
│ ├─────────────────────────────────────┤ │
│ │ Media Zone (conditional)            │ │
│ │ • GIF/Video for AI alerts          │ │
│ │ • Evidence thumbnails              │ │
│ ├─────────────────────────────────────┤ │
│ │ Actions Zone                        │ │
│ │ • Quick Actions [primary]          │ │
│ │ • Secondary Actions [overflow]     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3+ columns)
- **Wide**: > 1440px (4+ columns)

### Color Coding System
- **Critical**: Red (#DC2626)
- **High**: Orange (#EA580C)
- **Medium**: Yellow (#CA8A04)
- **Low**: Blue (#2563EB)
- **Info**: Gray (#6B7280)
- **Success**: Green (#16A34A)

### Interactive States
- **Hover**: Subtle shadow increase
- **Active**: Pressed state (scale 0.98)
- **Selected**: Blue border highlight
- **Disabled**: Reduced opacity (0.6)
- **Loading**: Skeleton animation

## Data Structure Mapping

### Required Fields per Card Type

| Field | Stream | Timeline | List | Evidence | Mobile | Case | Compact | Dashboard | Notification |
|-------|--------|----------|------|----------|--------|------|---------|-----------|--------------|
| Time | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Location | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Integration Source | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trigger Type | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Intensity Level | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Media (GIF) | Conditional | Optional | ❌ | ✅ | Optional | Optional | ❌ | ❌ | Conditional |
| Quick Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Conditional Rules
- **GIF Display**: Only for AI-generated alerts with intensity > medium
- **Location**: Required for physical security events
- **Intensity**: Required for threat detection events
- **Media**: Required for evidence cards, optional for others
- **Actions**: Always available except for dashboard cards

## Usage Guidelines

### When to Use Each Card Type
- **Stream Card**: Live monitoring dashboards
- **Timeline Card**: Detailed audit trails
- **List Card**: Administrative interfaces
- **Evidence Card**: Investigation workflows
- **Mobile Card**: Field operations
- **Case Card**: Case management systems
- **Compact Card**: Overview dashboards
- **Dashboard Card**: Executive summaries
- **Notification Card**: Alert systems

### Performance Considerations
- **Stream Cards**: Limit to 50 visible items
- **Timeline Cards**: Paginate after 100 items
- **List Cards**: Virtual scrolling for > 500 items
- **Evidence Cards**: Lazy load media
- **Mobile Cards**: Optimize for touch targets > 44px

### Accessibility Requirements
- **Keyboard Navigation**: Tab order through all interactive elements
- **Screen Readers**: Descriptive labels for all icons
- **Color Contrast**: WCAG 2.1 AA compliance
- **Touch Targets**: Minimum 44x44px on mobile
- **Focus Indicators**: Visible focus rings for keyboard users