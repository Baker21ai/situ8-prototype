# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 White Screen Troubleshooting Guide

If `npm run dev` shows a white screen, follow these steps:

### 1. **Check Browser Console**
```bash
# Open browser dev tools (F12) and check for errors
# Look for common issues:
# - "Failed to resolve module" errors
# - Environment variable warnings
# - Service initialization failures
# - TypeScript compilation errors
```

### 2. **Environment Variables Issue (MOST COMMON)**
The project has incorrect environment variable prefixes:
```bash
# Current (incorrect for Vite):
REACT_APP_ENVIRONMENT=development

# Should be (correct for Vite):
VITE_ENVIRONMENT=development

# Quick fix: Either rename all REACT_APP_ to VITE_ in .env.development
# OR: Add to vite.config.ts to support REACT_APP_ prefix
```

### 3. **TypeScript Configuration Mismatch**
Check if TypeScript can find the entry point:
```bash
npm run typecheck
# Look for errors about src/main.tsx not being included
```

### 4. **Service Initialization Failures**
If stuck on "Initializing services..." loading screen:
```javascript
// Check browser console for service errors
// Add this to browser console to debug:
window.__SITU8_DEBUG__ = true;
localStorage.setItem('situ8-debug', 'true');
```

### 5. **Quick Reset Solutions**
```bash
# Nuclear option - clean everything:
rm -rf node_modules package-lock.json
npm install
npm run dev

# Clear browser data:
# - Clear localStorage for http://localhost:5173
# - Hard refresh (Ctrl+Shift+R)
# - Disable browser extensions
```

## 🛠️ Essential Development Commands

```bash
# Install dependencies
npm install

# Development server (Vite)
npm run dev

# Production build
npm run build
npm run build:check    # Build with type checking

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run with coverage report

# Preview production build
npm run preview
```

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components  
- **State Management**: Zustand stores with service layer
- **Testing**: Vitest + Testing Library
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Performance**: Virtual scrolling for large datasets

### Three-Tier Security Architecture
```
Activities (Foundation) → Incidents (Operational Response) → Cases (Strategic Investigation)
```

### Service Layer Architecture (Complex Dependency Injection)

**Initialization Flow**: `App.tsx` → `ServiceProvider` → Service Instances → Store Initialization

#### Service Provider Pattern (`services/ServiceProvider.tsx`)
```javascript
// Critical: ServiceProvider initializes ALL services and provides them via React Context
// If any service fails during initialization, app may hang on loading screen

const services = {
  activityService: new ActivityService(),
  incidentService: new IncidentService(), 
  caseService: new CaseService(),
  bolService: new BOLService(),
  auditService: new AuditService(),
  visitorService: new VisitorService(complexConfig), // 200+ lines of config
  passdownService: new PassdownService(),
  authService: new AuthService()
};

// Health checks run asynchronously - failures logged but don't block UI
```

#### Service Layer Hierarchy
```
BaseService (abstract)
├── ActivityService
├── IncidentService  
├── CaseService
├── BOLService
├── AuditService
├── VisitorService (most complex - has workflow engine)
├── PassdownService
└── AuthService
```

#### Service Communication Patterns
- **Cross-service dependencies**: IncidentService → ActivityService for auto-creation
- **Event-driven**: All services emit audit events to AuditService
- **Health monitoring**: Each service implements `healthCheck()` method
- **Error handling**: Services use `ServiceResponse<T>` pattern with success/failure states

### Store Pattern (Zustand + Service Integration)
Stores are **UI state containers** that delegate to services:
```javascript
// Stores NEVER contain business logic - only UI state and service calls
const { activityService } = useServices(); // Get service from context
const result = await activityService.createActivity(data, auditContext);

// Store responsibilities:
// - UI state (loading, pagination, filters)
// - Service method calls
// - Real-time updates (WebSocket integration)
// - Virtual scrolling state (handles 5000+ items)
```

#### Store Initialization Chain
```
ServiceProvider mounts → initializeStores() → Store.getState() → loadInitialData()
```

**Critical**: If service initialization fails, stores may not initialize properly, causing white screen.

## 🔐 User Management System

### Current State
- ✅ **AWS Cognito infrastructure**: Complete CloudFormation stack ready
- ✅ **Role-based access control**: 4 roles (Admin, Security Officer, Developer, Viewer)
- ✅ **Clearance levels**: 1-5 security levels for sensitive operations
- ✅ **WebSocket authentication**: Real-time communications with auth
- ❌ **Frontend integration**: Login components, auth service, protected routes needed

### Implementation Required
```typescript
// Need to implement:
- AuthService integration in ServiceProvider
- Login/Signup components using Cognito
- Protected routes with role-based access
- User context/state management
- Demo user switching for presentations
```

### Configuration
- **Cognito config**: `config/cognito.ts` - Environment-specific settings
- **User roles**: Admin, Security Officer, Developer, Viewer
- **Permissions**: Defined per role for activities, cases, incidents, BOL, users, audit

## 📁 Key Architecture Files & Patterns

### Critical Entry Points & Configuration
```
src/main.tsx                # Vite entry point (⚠️ excluded from tsconfig)
App.tsx                     # Root component with lazy loading
index.html                  # Vite HTML template
vite.config.ts              # Build config with complex chunking strategy
tsconfig.json               # ⚠️ Excludes src/ but entry point is src/main.tsx
.env.development            # ⚠️ Uses REACT_APP_ prefix (should be VITE_)
```

### Service Layer (Business Logic)
```
services/
├── ServiceProvider.tsx      # ⭐ Complex DI container - 8 services + health checks
├── base.service.ts          # Abstract base with audit/validation/business rules
├── activity.service.ts      # Auto-tagging, BOL integration, clustering
├── incident.service.ts      # Auto-creation from activities, escalation rules
├── case.service.ts          # Investigation workflows, evidence management
├── audit.service.ts         # Compliance tracking, change audit
├── auth.service.ts          # Cognito integration (not yet frontend connected)
└── types.ts                # Service contracts, error handling types
```

### State Management (UI Layer)
```
stores/
├── index.ts                # Store initialization, cleanup utilities
├── activityStore.ts        # Complex: Virtual scrolling, real-time generation
├── incidentStore.ts        # Auto-creation triggers from activities
├── caseStore.ts           # Investigation state, evidence tracking
├── userStore.ts           # Demo user switching, permissions
└── auditStore.ts          # Compliance audit trails
```

### Component Architecture Patterns
```
App.tsx                     # Lazy loading with React.Suspense
├── ServiceProvider         # Service DI context wrapper
├── Lazy Components:
│   ├── CommandCenter       # Dashboard with real-time data
│   ├── Activities          # Virtual scrolling (5000+ items)
│   ├── Cases              # Investigation management
│   └── Communications     # WebSocket real-time messaging

components/
├── atoms/                  # Simple UI components
├── molecules/              # Compound components
├── organisms/              # Complex business components
└── ui/                    # shadcn/ui component library
```

### Error Handling & Recovery
```
src/presentation/atoms/errors/
├── ErrorFallback.tsx       # Comprehensive error UI with recovery
├── ActivityErrorBoundary.tsx   # Activity-specific error handling
├── VirtualScrollErrorBoundary.tsx  # Performance error recovery
└── SearchErrorBoundary.tsx     # Search operation error handling
```

### Infrastructure & Deployment
```
infrastructure/
├── cognito-stack.yaml      # AWS Cognito CloudFormation (✅ Complete)
├── dynamodb/              # Table schemas for all entities
├── aws/lambdas/           # API Gateway + Lambda functions
└── api-gateway-stack.yaml  # REST API configuration

lambda/                     # Packaged Lambda functions
├── activities/            # Activity CRUD operations
├── incidents/             # Incident management
├── cases/                 # Case investigation APIs
└── audit/                 # Compliance logging
```

### Complex Configuration Files
```
vite.config.ts             # Advanced chunking strategy, compression
├── Manual chunking by domain (services, components, vendors)
├── Asset optimization (images, fonts)
├── Bundle analyzer integration
└── Development HMR optimizations

tailwind.config.js         # Custom design system
├── CSS custom properties integration
├── Animation definitions
└── Component-specific utilities
```

## 🚀 Current Implementation Status

| Module | Backend | Frontend | Status |
|--------|---------|----------|---------|
| **Activities** | ✅ Complete | ✅ Complete | Fully functional |
| **Incidents** | ✅ Complete | ✅ Timeline | Connected & working |
| **Cases** | ✅ Complete | ✅ Complete | Investigation UI ready |
| **Passdowns** | ✅ Complete | ✅ Complete | Shift handoff system |
| **BOL** | ✅ Complete | ❌ Integration needed | Pattern matching ready |
| **Auth/Users** | ✅ AWS ready | ❌ Frontend needed | Cognito infrastructure ready |
| **Communications** | ✅ WebSocket | ✅ Basic UI | Real-time messaging |

## 🔧 Development Environment & Debugging

### Environment Configuration Issues
**Current Problem**: Mixed environment variable prefixes
```bash
# .env.development has REACT_APP_ prefixes (Create React App)
# But project uses Vite which needs VITE_ prefixes

# Options to fix:
# 1. Rename all variables: REACT_APP_* → VITE_*
# 2. Or add to vite.config.ts:
define: {
  'process.env': Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((env, key) => {
      env[key] = JSON.stringify(process.env[key]);
      return env;
    }, {})
}
```

### TypeScript Configuration Debugging
```bash
# Check if src/main.tsx is included in compilation:
npm run typecheck

# Current issue: tsconfig.json excludes "src/**/*" but entry point is src/main.tsx
# Fix: Either move main.tsx to root OR update include/exclude paths
```

### Service Debugging Commands
```javascript
// Browser console debugging:
// 1. Check service initialization
window.__SITU8_SERVICES__ = useServices.getState();
console.log('Services initialized:', window.__SITU8_SERVICES__.isInitialized);

// 2. Check service health
const services = useServices.getState();
Object.keys(services).forEach(async (key) => {
  if (services[key].healthCheck) {
    const health = await services[key].healthCheck();
    console.log(`${key}:`, health.status);
  }
});

// 3. Check store state
window.__SITU8_STORES__ = {
  activity: useActivityStore.getState(),
  incident: useIncidentStore.getState(),
  user: useUserStore.getState()
};
```

### Performance Debugging
```javascript
// Virtual scrolling debugging:
// Check if large datasets are causing issues
const activityStore = useActivityStore.getState();
console.log('Activity count:', activityStore.activities.length);
console.log('Filtered count:', activityStore.filteredActivities.length);

// Memory usage:
console.log('Storage usage:', getStorageSize() + ' KB');
```

### Common Development Issues

#### 1. **Service Initialization Hanging**
```bash
# Symptoms: Stuck on "Initializing services..." screen
# Debug: Check browser console for service health check failures
# Fix: Disable problematic services temporarily
```

#### 2. **Virtual Scrolling Performance**
```bash
# Symptoms: Slow scrolling with large datasets
# Debug: Check activity count in store
# Fix: Adjust REACT_APP_BATCH_SIZE in .env.development
```

#### 3. **WebSocket Connection Issues**
```bash
# Symptoms: Real-time updates not working
# Debug: Check network tab for WebSocket connections
# Config: AWS WebSocket API Gateway endpoints in .env.development
```

#### 4. **AWS Service Mocking**
```javascript
// For local development without AWS:
REACT_APP_USE_LOCAL_DYNAMODB=true
REACT_APP_USE_LOCAL_LAMBDA=true
REACT_APP_ENABLE_MOCK_DATA=true
```

## 🔧 Development Guidelines

### Service Integration
```typescript
// Always use services for business logic
const { activityService } = useServices();
const result = await activityService.createActivity(data);

// Never modify store state directly
// Use service methods that handle validation, audit, business rules
```

### Testing Strategy
```bash
# Run specific test file
npm test Activities.test.tsx

# Run tests for specific component
npm test -- --grep="Activity"

# Coverage for specific directory
npm run test:coverage -- components/
```

### Performance Considerations
- Virtual scrolling implemented for activity lists (handles 5000+ entries)
- Lazy loading for heavy components (CommandCenter, Activities, Cases)
- Optimized Vite build with manual chunking strategy
- Use filters to reduce rendered items in large datasets

## 🌐 AWS Migration

### Quick Validation
```bash
# Verify AWS setup
aws sts get-caller-identity
aws cognito-idp list-user-pools --region us-west-2

# Deploy Cognito stack
aws cloudformation deploy --stack-name situ8-cognito \
  --template-body file://infrastructure/cognito-stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

## 📋 Immediate Next Steps

1. **User Management Integration** - Implement Cognito frontend integration
2. **BOL UI Integration** - Add BOL management to Activities page  
3. **Real-time Communications** - Complete WebSocket UI integration
4. **Testing Coverage** - Expand test suite for all services
5. **Performance Monitoring** - Add performance tracking for virtual scrolling

## 🧪 Debugging & Troubleshooting

### Check Service Status
```typescript
// Browser console
window.__SITU8_SERVICES__ = useServices.getState();
console.log(window.__SITU8_SERVICES__.isInitialized);
```

### Common Issues
- **Services not initialized**: Ensure ServiceProvider wraps App component
- **Type mismatches**: Run `npm run typecheck` to identify issues
- **Performance issues**: Check virtual scrolling implementation in large lists
- **Mock data showing**: Verify components use real stores not mock data

## 📝 Critical Implementation Patterns

### Complex Loading & Initialization Sequence
```javascript
// App.tsx loading chain (potential failure points):
1. ServiceProvider mounts → shows "Initializing services..." 
2. 8 services initialize with health checks
3. initializeStores() called → loads initial data
4. Real-time generation starts (activities)
5. Lazy components load with React.Suspense
6. Dark mode forced on (document.documentElement.classList.add('dark'))

// Any failure in this chain can cause white screen
```

### Virtual Scrolling Performance Architecture
```javascript
// Handles 5000+ activities with react-window
// Located in: components/VirtualScrollingPerformanceTest.tsx
// Store integration: stores/activityStore.ts (pagination, filtering)

// Performance settings in .env.development:
REACT_APP_VIRTUAL_SCROLL_ENABLED=true
REACT_APP_BATCH_SIZE=100
REACT_APP_CACHE_TIMEOUT=30000
```

### Service-Store Communication Pattern
```javascript
// Services handle business logic, stores handle UI state
// Critical pattern: NEVER put business logic in stores

// Correct:
const { activityService } = useServices();
const result = await activityService.createActivity(data, auditContext);
setActivities(result.data);

// Wrong:
setActivities([...activities, newActivity]); // No validation, audit, or business rules
```

### Error Boundary Strategy
```javascript
// Comprehensive error boundaries at multiple levels:
// 1. App-level: Catches service initialization failures
// 2. Component-level: Activity, VirtualScroll, Search specific errors
// 3. Recovery patterns: Retry, reset, graceful degradation
```

### AWS Integration Patterns
```javascript
// Two modes: Local development vs AWS integration
// Environment flag: REACT_APP_USE_AWS_API controls which mode

// Local mode: Mock services, localStorage persistence
// AWS mode: Real DynamoDB, Lambda, Cognito, WebSocket
```

## 📝 Important Development Rules

- **Never directly modify store state** - use service methods only
- **All operations must create audit entries** via BaseService pattern
- **No hard deletes** - soft delete pattern enforced across all entities
- **Business logic belongs in services**, not components or stores
- **Mock data generators exist** for testing (`components/enterpriseMockData.tsx`)
- **Service health checks are async** - don't block UI but log failures
- **Virtual scrolling required** for performance with large datasets (5000+ items)
- **Environment variables must use VITE_ prefix**, not REACT_APP_
- **Error boundaries wrap complex components** - check browser console for recovery options