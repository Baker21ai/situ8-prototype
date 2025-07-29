# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Situ8 is an enterprise-scale security platform designed for 24/7 operations across 30+ facilities. It provides real-time security management with a sophisticated three-panel interface optimized for security command centers.

## Architecture

### Core Layout Structure
The application uses a three-panel command center layout:

```
┌─────────────────────────────────────────────────────┐
│ Header: Situ8 logo, time, critical alerts          │
├────────────┬───────────────┬───────────────────────┤
│ LEFT       │ CENTER        │ RIGHT                 │
│ Activities │ Interactive   │ Timeline              │
│ Stream     │ Map           │ (Incidents/Comms)     │
└────────────┴───────────────┴───────────────────────┘
```

### Component Hierarchy
- `App.tsx` - Main navigation shell with collapsible sidebar
- `CommandCenter.tsx` / `CommandCenter_new.tsx` - Primary three-panel layout
- Key feature components:
  - `EnterpriseActivityManager` - Handles 5000+ activities across sites
  - `InteractiveMap` - Multi-level navigation (Site → Building → Floor)
  - `Timeline` - Dual-mode (Incidents/Communications) with real-time updates
  - `GuardManagement` - Personnel tracking and assignment

### Data Flow
- Mock data generators in `enterpriseMockData.tsx` create realistic security scenarios
- Activities include site/building metadata for geographic distribution
- Real-time simulation through `generateRealtimeActivity()`

## Development Commands

**Note**: This appears to be a component library within a larger project. Build/test commands should be run from the parent project directory that contains package.json and build configuration.

```bash
# Component development workflow
# 1. Choose main component version in App.tsx:
#    - CommandCenter.tsx (stable)
#    - CommandCenter_new.tsx (latest)

# 2. Verify mock data integration
# 3. Check component imports match the setup guide
```

## Key Development Patterns

### UI Components
All UI primitives are in `components/ui/` using shadcn/ui patterns:
- Always import from relative paths: `./ui/component`
- Components use compound pattern (Card, CardHeader, CardContent)
- Styling via Tailwind classes with specific design constraints

### Styling Guidelines
Per the design system requirements:
- **DO NOT** use Tailwind font utilities (text-2xl, font-bold, etc.)
- Use semantic HTML elements - styling handled by globals.css
- Priority colors are pre-defined:
  - Critical: `border-red-500 bg-red-50`
  - High: `border-orange-500 bg-orange-50`
  - Medium: `border-yellow-500 bg-yellow-50`
  - Low: `border-green-500 bg-green-50`
- Site badges use purple theme: `bg-purple-50 border-purple-200 text-purple-800`

### Mock Data Structure
Activities must include:
```typescript
{
  site: string,         // Geographic site name
  building: string,     // Building within site
  priority: 'critical' | 'high' | 'medium' | 'low',
  metadata: {
    site: string,       // Required for Timeline badges
    // other metadata
  }
}
```

### Component Integration Order
1. Mock Data → Feature Components
2. UI Components → Feature Components  
3. Feature Components → CommandCenter
4. CommandCenter → App.tsx

## Important References

- `SITU8_SETUP_GUIDE.md` - Detailed setup checklist and troubleshooting
- `guidelines/Guidelines.md` - Project-specific guidelines (currently minimal)
- `styles/globals.css` - CSS variables using Tailwind v4.0 with oklch colors

## Performance Considerations

- Activity stream limited to 100 items in command center view for performance
- Full 5000+ activities available in dedicated Activities module
- Map navigation uses breadcrumb pattern to prevent deep nesting
- Timeline uses virtualization for large datasets

## Common Issues & Solutions

1. **Missing Icons**: Ensure lucide-react imports use named exports
2. **No Data in Timeline**: Check mock data generators return arrays with metadata.site
3. **Styling Issues**: Verify globals.css is imported and no conflicting CSS
4. **Component Not Rendering**: Check import paths are relative (./ui/ not @/components/ui/)