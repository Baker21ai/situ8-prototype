# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠️ Essential Development Commands

```bash
# Install dependencies
npm install

# Development server (Vite)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand stores with service layer
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Three-Tier Security Architecture
```
Activities (Foundation) → Incidents (Operational Response) → Cases (Strategic Investigation)
```

### Service Layer Pattern
All business logic is centralized in the service layer (`services/`):
- **BaseService**: Common functionality (validation, audit, error handling)
- **ActivityService**: Activity logic, auto-tagging, BOL integration
- **IncidentService**: Incident auto-creation rules and workflows
- **CaseService**: Investigation management, evidence tracking
- **AuditService**: Compliance and change tracking
- **ServiceProvider**: React context for dependency injection

### Store Pattern (Zustand)
Stores handle UI state and delegate business logic to services:
- Immutable state updates
- Service integration via `useServices()`
- Audit trail for all operations
- Soft delete pattern (never hard delete)

## 🚀 Recent Updates (July 30, 2025)

### ✅ Completed Work
1. **Cases Page Implementation**
   - Created comprehensive Cases.tsx component with investigation management UI
   - Added case list/grid views, filters, creation dialog, and detail view
   - Implemented evidence management interface with chain of custody
   - Connected to case store for state management

2. **Navigation Integration**
   - Added Cases route to App.tsx navigation
   - Cases page is now accessible as a separate module
   - Updated navigation to show Cases as implemented

3. **Timeline-Incident Integration**
   - Connected Timeline component to real incident store
   - Replaced mock data with actual incident data from store
   - Added pending incident validation UI
   - Implemented real-time incident display with proper status indicators

4. **Type System Updates**
   - Added missing formatDistanceToNow utility function
   - Updated incident store mock data to match Incident interface
   - Fixed StatusBadge component to use new status values
   - Partially resolved type mismatches between stores and components

### ⚠️ Remaining Issues
1. **Type Mismatches**
   - Cases component expects full Case type but store provides SimpleCase
   - Need to either update store to use full types or create adapter layer
   - ActivityType and Status values in mockActivityData.tsx still use old values

2. **Missing UI Components**
   - IncidentPanel for detailed incident management
   - BOL management interface
   - Full activity type migration in UI components

3. **Service Layer Integration**
   - Cases component references caseService but it's not fully implemented
   - Need to complete service layer for all entities

### 📝 Immediate Next Steps
1. Fix mockActivityData.tsx to use new ActivityType values (medical, security-breach, etc.)
2. Update case store to handle full Case type or create adapter
3. Complete service layer implementation for cases
4. Create IncidentPanel component for Timeline

# Situ8 Security Platform - Development Guide

## 🏗️ Architecture Overview

### Three-Tier Security Workflow
```
Activities (Foundation) → Incidents (Operational Response) → Cases (Strategic Investigation)
```

### Current Implementation State

| Component | Backend | Frontend | Status |
|-----------|---------|----------|---------|
| **Activities** | ✅ Complete | ✅ Complete | Fully functional |
| **Incidents** | ✅ Complete | ✅ Timeline | Connected to Timeline |
| **Cases** | ✅ Complete | ✅ Basic UI | Cases page implemented |
| **BOL** | ✅ Complete | ❌ Missing | Needs Activities integration |
| **Audit** | ✅ Complete | ✅ Integrated | Working |

### Application Structure
```
┌─────────────────────────────────────────────────────┐
│ Navigation: Activities │ Command Center │ Cases │    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Command Center (Three Panels):                     │
│  ┌────────────┬───────────────┬─────────────────┐ │
│  │ Activities │ Interactive   │ Timeline        │ │
│  │ Stream     │ Map           │ (Incidents)     │ │
│  └────────────┴───────────────┴─────────────────┘ │
│                                                     │
│  Activities Page: Full activity management          │
│  Cases Page: Investigation management (TO BUILD)    │
└─────────────────────────────────────────────────────┘
```

## 📁 Key Files & Directories

### Service Layer (Business Logic) ✅
```
services/
├── base.service.ts          # Base service class with audit
├── activity.service.ts      # Activity logic, auto-tagging
├── incident.service.ts      # Incident auto-creation
├── case.service.ts          # Case & evidence management
├── bol.service.ts           # BOL pattern matching
├── audit.service.ts         # Audit trail
└── ServiceProvider.tsx      # React context provider
```

### State Management (Zustand) ✅
```
stores/
├── activityStore.ts         # Activity state & operations
├── incidentStore.ts         # Incident state
├── caseStore.ts             # Case state
├── bolStore.ts              # BOL state
├── auditStore.ts            # Audit log state
└── index.ts                 # Store exports
```

### Type Definitions ✅
```
lib/types/
├── activity.ts              # EnterpriseActivity interface
├── incident.ts              # Incident interface
├── case.ts                  # Case & Evidence interfaces
├── bol.ts                   # BOL interfaces
├── audit.ts                 # Audit trail types
└── common.ts                # Shared types
```

### UI Components
```
components/
├── Activities.tsx           ✅ Activity management page
├── CommandCenter.tsx        ✅ Three-panel layout
├── Timeline.tsx             ⚠️  Has mock incidents, needs real data
├── Cases.tsx                ❌ TO BUILD - Investigation page
├── IncidentPanel.tsx        ❌ TO BUILD - For Timeline
└── BOLManager.tsx           ❌ TO BUILD - For Activities
```

## 🚨 What's Left to Build

### 1. Cases Page (High Priority)
**File to create**: `components/Cases.tsx`
```typescript
// Route: /cases
// Full-page investigation management interface
// Features needed:
- Case list/grid with filters (status, priority, type)
- Case creation from incidents or activities
- Case detail view with:
  - Evidence management & chain of custody
  - Team assignment (lead, investigators)
  - Timeline of case events
  - Linked incidents/activities
  - Documentation & notes
```

### 2. Timeline Incident UI (High Priority)
**File to update**: `components/Timeline.tsx`
**New file**: `components/IncidentPanel.tsx`
```typescript
// Replace mock data with real incidents
// Features needed:
- Connect to incidentStore
- Pending incident validation (5/15 min timers)
- Incident creation from activities
- Quick actions (assign, escalate, resolve)
- Multi-location incident support
```

### 3. BOL Integration (Medium Priority)
**Files to update**: `components/Activities.tsx`, `components/EnterpriseActivityManager.tsx`
```typescript
// BOL creates activities automatically
// Features needed:
- BOL management section in Activities
- Confidence score display (70%, 85%, 95%)
- Pattern matching results
- Multi-site BOL distribution
```

### 4. Navigation Updates (High Priority)
**File to update**: `App.tsx`
```typescript
// Add Cases to main navigation
// Update routes:
- /activities (existing)
- /command-center (existing)
- /cases (new)
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🔧 Implementation Guide

### Adding the Cases Page

1. **Create the Cases component**:
```typescript
// components/Cases.tsx
import { useCaseStore } from '../stores/caseStore';
import { useServices } from '../services/ServiceProvider';

export function Cases() {
  const { cases, loading, error } = useCaseStore();
  const { caseService } = useServices();
  
  // Implement case list, filters, and detail views
}
```

2. **Add route in App.tsx**:
```typescript
<Route path="/cases" element={<Cases />} />
```

3. **Update navigation**:
```typescript
const navItems = [
  { path: '/activities', label: 'Activities', icon: Activity },
  { path: '/command-center', label: 'Command Center', icon: LayoutGrid },
  { path: '/cases', label: 'Cases', icon: Briefcase }, // NEW
];
```

### Connecting Timeline to Real Incidents

1. **Update Timeline.tsx**:
```typescript
import { useIncidentStore } from '../stores/incidentStore';

// Replace mock data with:
const { incidents, loading } = useIncidentStore();
```

2. **Create IncidentPanel component** for incident management within Timeline

### Business Logic Requirements

#### Activity Auto-Tagging
- System tags: `trigger:human|integration`, `location:building-zone`, `time:business-hours|after-hours`
- User tags: Manual, role-limited

#### Incident Auto-Creation Rules
| Activity Type | Creates Incident | Validation Required |
|--------------|------------------|---------------------|
| medical | ALWAYS | No - Direct to active |
| security-breach | ALWAYS | Yes - 5 min pending |
| bol-event | ALWAYS | Yes - 5 min pending |
| alert | IF confidence >80% | Yes - 5 min pending |
| property-damage | IF confidence >75% | Yes - 5 min pending |

#### Case Creation
- From incidents: Any status
- From activities: Direct creation allowed
- Evidence: Requires chain of custody tracking

## 🧪 Testing & Debugging

### Check Service Status
```typescript
// In browser console
window.__SITU8_SERVICES__ = useServices.getState();
console.log(window.__SITU8_SERVICES__.isInitialized);
```

### Verify Store Data
```typescript
// Check activities
useActivityStore.getState().activities

// Check incidents  
useIncidentStore.getState().incidents

// Check cases
useCaseStore.getState().cases
```

### Common Issues

1. **Services not initialized**: Ensure ServiceProvider wraps App
2. **Mock data showing**: Check Timeline uses real stores
3. **Types mismatch**: Run `npm run typecheck`

## 📊 Performance Considerations

- Activities: Handles 5000+ entries
- Virtual scrolling implemented in activity lists
- Pagination ready in all stores
- Use filters to reduce rendered items

## 🚀 Next Steps Priority

1. **Build Cases page** - Critical for investigation workflow
2. **Connect Timeline to incidents** - Replace mock data
3. **Add navigation** - Update App.tsx routes
4. **Test workflows** - Activities → Incidents → Cases
5. **BOL integration** - Pattern matching UI

## 📝 Important Notes

- Never directly modify store state - use service methods
- All operations must create audit entries
- No hard deletes - soft delete only
- Mock data generators exist for testing
- Business logic is in services, not components

## 🌤️ AWS Migration

For complete AWS migration guide and step-by-step tasks, see: **`AWS_MIGRATION_IMPLEMENTATION_TASKS.md`**

### Quick Reference
```bash
# AWS setup validation
aws bedrock list-foundation-models --region us-west-2

# Cost monitoring
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB
```