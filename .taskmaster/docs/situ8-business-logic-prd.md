# Situ8 Business Logic Implementation PRD

## Project Overview
Implement the complete Activity → Incident → Case business logic architecture for the Situ8 enterprise security platform. This will be an in-memory prototype with localStorage persistence, designed to demonstrate all business rules without requiring a database.

## Goal
Create a fully functional security management system that tracks activities (events), groups them into incidents (operational responses), and escalates to cases (investigations), following the comprehensive business rules documented.

## Technical Approach
- Frontend-only implementation using React and TypeScript
- Zustand for state management (simpler than Redux, perfect for prototypes)
- Service layer pattern for easy future database integration
- localStorage for data persistence between sessions
- Rich mock data for realistic demonstrations

## Implementation Phases

### Phase 1: Core Infrastructure and Types
Set up the foundation for all business logic implementation.

Tasks:
- Create comprehensive TypeScript interfaces for Activity, Incident, Case, and BOL entities
- Set up Zustand stores for state management with persistence
- Implement service layer pattern with repository interfaces
- Create audit trail infrastructure with universal logging
- Build localStorage persistence adapters for all entities
- Set up mock data generators extending existing enterpriseMockData

### Phase 2: Enhanced Activity System
Upgrade the existing activity system to match all business requirements.

Tasks:
- Implement activity type enumeration (medical, security-breach, alert, patrol, evidence, property-damage, bol-event)
- Create auto-tagging system with system tags (read-only) and user tags (role-based limits)
- Build activity status progression with role-based permissions
- Implement multi-incident activity support with context tracking
- Create 30-day retention simulation with archive functionality
- Add activity lifecycle management (active → archive → deletion)

### Phase 3: Incident Management System
Build the complete incident response workflow.

Tasks:
- Create incident service with auto-creation rules from activities
- Implement pending incident validation workflow (5 min initial, 15 min escalation)
- Build multi-location incident support with permission cascading
- Create incident status workflow (pending → active → assigned → responding → investigating → resolved)
- Implement guard assignment UI with "no automatic dispatch" rule
- Add incident-activity relationship management with status independence

### Phase 4: Case Investigation System
Implement strategic investigation capabilities.

Tasks:
- Create case service supporting creation from incidents or direct from activities
- Build evidence management system with chain of custody
- Implement multi-site case coordination with team roles
- Create case lifecycle management (open → investigating → review → closed)
- Add case-activity direct linking for any priority level
- Build case closure requirements validation

### Phase 5: BOL (Be-On-Lookout) System
Create the BOL alert and matching system.

Tasks:
- Implement BOL entity management with multi-site distribution
- Create automatic BOL-to-activity generation on BOL creation
- Build confidence scoring system for pattern matching
- Implement BOL matching thresholds (70%, 85%, 95% confidence levels)
- Create BOL resolution workflow with activity generation
- Add real-time monitoring simulation

### Phase 6: Cross-Entity Integration
Connect all entities with proper relationships and permissions.

Tasks:
- Implement activity-incident-case relationship rules
- Create status independence between entities
- Build cross-location permission cascading (Organization → Region → Site → Building → Zone)
- Implement entity access control based on user location and role
- Create activity context tracking for multiple incidents
- Add conflict resolution for multi-entity relationships

### Phase 7: Audit and Compliance System
Ensure complete accountability and traceability.

Tasks:
- Create universal audit service capturing WHO, WHAT, WHEN, WHERE, WHY
- Implement before/after state tracking for all changes
- Build audit event types for each entity
- Create compliance reporting features
- Implement data retention policies (7 years)
- Add audit log UI with filtering and search

### Phase 8: UI Components and Integration
Build user interfaces for all new functionality.

Tasks:
- Create Incident Management panel with pending validation UI
- Build Case Investigation interface with evidence upload
- Design BOL Management screen with confidence indicators
- Integrate audit trail viewer into all entity views
- Update Timeline component to show incidents and cases
- Create unified search across all entity types
- Build role-based UI variations (Officer, Supervisor, Admin)

### Phase 9: Advanced Features
Implement sophisticated business logic scenarios.

Tasks:
- Handle rapid activity influx (1000+ per second) with batching
- Create pattern detection for auto-grouping similar activities
- Implement emergency override system with logging
- Build offline operation queue with sync on reconnect
- Create activity clustering for related events
- Add predictive incident creation based on patterns

### Phase 10: Testing and Documentation
Ensure reliability and maintainability.

Tasks:
- Create comprehensive test suites for all business rules
- Build integration tests for complex workflows
- Implement performance tests for high-volume scenarios
- Create user documentation for each role
- Build developer documentation for future database integration
- Add interactive demo scenarios showcasing all features

## Success Criteria
- All business rules from situ8-business-logic.md implemented
- Smooth user experience for security operations workflow
- Data persists between browser sessions
- Clear audit trail for all actions
- Easy to demonstrate to stakeholders
- Architecture ready for database integration

## Non-Goals (Future Phases)
- Real database implementation
- Authentication/authorization
- Real-time WebSocket updates
- Third-party integrations (Twilio, Ambient.ai, etc.)
- Multi-tenant architecture
- Production deployment

## Technical Stack
- React 18+ with TypeScript
- Zustand for state management
- Tailwind CSS (already in use)
- Vitest for testing
- localStorage for persistence
- Date-fns for time handling
- UUID for ID generation