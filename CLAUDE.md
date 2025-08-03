# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
npm run dev          # Start dev server (Vite) - http://localhost:5173
npm run build        # Production build
npm run typecheck    # Check TypeScript
npm test             # Run tests (Vitest)
npm run lint         # ESLint check
```

## Critical Issues & Fixes

### White Screen on `npm run dev`
- **Issue**: Environment variables use wrong prefix
- **Fix**: Rename `REACT_APP_*` to `VITE_*` in .env.development
- **Alternative**: Add process.env support to vite.config.ts

### TypeScript Build Errors
- **Issue**: tsconfig.json excludes src/ but entry is src/main.tsx
- **Fix**: Update tsconfig include/exclude paths

### Service Initialization Hangs
- **Issue**: ServiceProvider stuck on "Initializing services..."
- **Debug**: Check browser console for health check failures
- **Fix**: Temporarily disable failing services

## Architecture Rules

### Service Layer Pattern
- Business logic ONLY in services (extend BaseService)
- All mutations create audit entries
- Services handle validation, stores handle UI state
- No hard deletes - soft delete pattern only

### Store Pattern
- Stores delegate to services - never contain business logic
- Virtual scrolling required for lists > 100 items
- WebSocket updates via handleWebSocketMessage()

### Three-Tier Security Model
```
Activities → Incidents → Cases
(Foundation) (Response) (Investigation)
```

## Key Files & Patterns

### Service Provider Chain
```
App.tsx → ServiceProvider → 8 Services → Store Init → UI
```
Any failure = white screen

### Critical Services
- ActivityService: Auto-tagging, BOL matching, clustering
- IncidentService: Auto-creates from activity patterns
- CommunicationService: WebSocket + chat management

### Performance Settings
```bash
REACT_APP_VIRTUAL_SCROLL_ENABLED=true
REACT_APP_BATCH_SIZE=100  # Activities per batch
```

## Do Not Modify
- `tasks.json` - Use task-master commands
- Service health check implementations
- Virtual scrolling logic in ActivityStore
- BaseService audit methods

## AWS Deployment

```bash
# Deploy in order:
./scripts/deploy-cognito.sh         # Auth first
./scripts/deploy-dynamodb-tables.sh # Data layer
./scripts/deploy-api-gateway.sh     # API routes
./scripts/deploy-*-lambda.sh        # Functions
./scripts/create-chat-tables.sh     # Chat tables
```

## Testing Approach
- Test services for business logic
- Test stores for UI state management
- Mock services in component tests
- Use react-window for performance tests

## Detailed Documentation

- @docs/claude/architecture.md - Service layer & component patterns
- @docs/claude/troubleshooting.md - Debugging guides & solutions
- @docs/claude/aws-setup.md - Infrastructure deployment
- @docs/claude/chat-system.md - WebSocket implementation
- @docs/claude/development.md - Code style & workflows