# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Situ8 is an enterprise-scale security platform designed for 24/7 operations across 30+ facilities. It provides real-time security management with a sophisticated three-panel interface optimized for security command centers.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview

# TypeScript type checking (included in build)
tsc
```

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

## Using Multiple Claude Sessions for Concurrent Work

You can leverage multiple Claude Code sessions to work on different aspects of the codebase simultaneously. Here are effective patterns:

### 1. Feature Branch Workflow
Open separate Claude sessions in different git worktrees:

```bash
# Main branch for stable development
cd /path/to/situ8
claude

# Feature branch for new components
git worktree add ../situ8-new-feature feature/new-component
cd ../situ8-new-feature
claude

# Bug fix branch
git worktree add ../situ8-bugfix fix/timeline-issue
cd ../situ8-bugfix
claude
```

### 2. Component-Focused Sessions
Dedicate each session to specific components:
- **Session 1**: Activities and EnterpriseActivityManager
- **Session 2**: Timeline and Communications
- **Session 3**: InteractiveMap and navigation
- **Session 4**: UI components and styling

### 3. Task Division Strategies
- **Frontend/Backend Split**: One session for UI, another for data/logic
- **Feature/Testing Split**: One for implementation, another for tests
- **Refactoring/Feature Split**: One maintaining existing code, another adding features

### 4. Coordination Tips
- Use clear commit messages to track work across sessions
- Create a shared TODO file or use Task Master AI for task coordination
- Use different terminals/tabs with descriptive names
- Regularly pull changes between sessions to stay synchronized

### 5. Example Multi-Session Setup
```bash
# Terminal 1: Main development
cd ~/situ8 && claude
# Working on: CommandCenter layout improvements

# Terminal 2: Component development  
cd ~/situ8-components && claude
# Working on: New ActivityCard variants

# Terminal 3: Bug fixes
cd ~/situ8-fixes && claude
# Working on: Timeline data loading issues

# Terminal 4: Documentation
cd ~/situ8 && claude
# Working on: Updating component documentation
```

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
5. **TypeScript Errors**: Run `tsc` to check types, ensure tsconfig.json includes all source files
6. **Build Failures**: Check for unused variables (ESLint), fix with `npm run lint`

## Project-Specific Configuration

### TypeScript Configuration
- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Includes: src, components, *.tsx files in root
- Excludes: design-iterations, ui-iterations folders

### ESLint Configuration
- TypeScript parser with React plugins
- Ignores design-iterations and ui-iterations folders
- Unused vars must be prefixed with underscore
- React globals are pre-defined

### Vite Configuration
- React plugin with Fast Refresh
- Development server on port 5173
- Path alias resolution matching tsconfig