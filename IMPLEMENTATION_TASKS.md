# SITU8 IMPLEMENTATION TASKS

## 🏗️ CORE ARCHITECTURE UPDATES

### Human-in-the-Loop Validation
- [ ] Update activity service to remove ALL auto-incident creation logic
- [ ] Modify incident creation to ALWAYS require human validation
- [ ] Create pending validation queue in incident store
- [ ] Add role-based validation permissions (supervisor/admin only)
- [ ] Remove 5-minute timer logic - pending stays pending indefinitely
- [ ] Update business rules to support human-only escalation

### Agentic Workflow Integration
- [ ] Create architecture for LangChain workflow integration
- [ ] Add support for Celine's SOP Manager
- [ ] Create AgenticActivity interface with workflow metadata
- [ ] Implement pending state for all agentic outputs
- [ ] Add workflow source tracking (LangChain, SOP Manager, etc.)
- [ ] Create validation UI for agentic-generated activities

## 🎨 UI/UX COMPONENTS

### Source Badge Component
- [ ] Create components/SourceBadge.tsx
- [ ] Design soft, non-anxiety-inducing colors:
  - Ambient AI: Soft blue (#E6F3FF)
  - Lenel: Soft purple (#F3E6FF)
  - Manual: Soft green (#E6FFE6)
  - LangChain: Soft orange (#FFF0E6)
  - SOP Manager: Soft teal (#E6FFF9)
- [ ] Add subtle icon for each source
- [ ] Implement mini placard design

### Pending Card Animations
- [ ] Create styles/animations.css
- [ ] Implement gentle pop-up animation (ease-in from bottom)
- [ ] Add soft breathing/pulsing effect (opacity 0.8-1.0)
- [ ] Create slide-up entrance animation
- [ ] Add subtle glow effect for pending items
- [ ] Ensure animations are calming, not alerting

### Pending Validation Component
- [ ] Create components/PendingCard.tsx
- [ ] Show "Waiting for X minutes" counter
- [ ] Add VALIDATE and DISMISS buttons
- [ ] Include source badge integration
- [ ] Add gentle highlight on new items
- [ ] Implement stack animation for multiple pending items

## 🔄 BOL SYSTEM UPDATES

### BOL as Activities
- [ ] Update BOL service to create activities (not incidents)
- [ ] Add 'bol-event' activity type handling
- [ ] Create manual BOL creation form
- [ ] Implement BOL pattern matching → pending activities
- [ ] Add BOL correlation badges to activities
- [ ] Update activity cards to show BOL matches

### BOL Workflow
- [ ] Manual creation → Pending activity
- [ ] Agentic creation → Pending activity  
- [ ] Pattern match → Creates more pending activities
- [ ] All require human escalation to incident

## 👥 GUARD ASSIGNMENT UPDATES

### AI Suggestions (Minimal)
- [ ] Create subtle suggestion tooltip
- [ ] Show "Suggested: [Guard Name] (X min away)"
- [ ] Display only on hover/focus
- [ ] Keep assignment manual-only
- [ ] Track suggestion acceptance rate
- [ ] Add suggestion to audit trail

## 📋 DEMO WORKFLOWS

### Top 10 Customer Workflows
- [ ] Tailgate Detection (Ambient AI) → Pending → Validate → Incident
- [ ] Medical Emergency → Pending → Immediate validation → Response
- [ ] Security Breach → Pending → Investigate → Escalate
- [ ] BOL Creation → Pattern Matching → Multiple Pending Activities
- [ ] Multi-Site Incident → Cross-location coordination
- [ ] Investigation Creation → From validated incident → Case
- [ ] Audit Trail Review → Compliance demonstration
- [ ] Shift Handover → Pending activities transfer
- [ ] External Threat → Multi-source correlation → Response
- [ ] Equipment Failure → Maintenance workflow → Resolution

## 🧪 TESTING SCENARIOS

### Validation Workflows
- [ ] Test pending state persistence (no timeout)
- [ ] Test supervisor validation permissions
- [ ] Test admin validation permissions
- [ ] Test officer cannot validate (view only)
- [ ] Test dismiss vs validate outcomes
- [ ] Test audit trail for all validations

### Agentic Integration Tests
- [ ] Test LangChain activity creation
- [ ] Test SOP Manager activity creation
- [ ] Test agentic → pending → validation flow
- [ ] Test multiple agentic sources
- [ ] Test agentic activity metadata preservation

### UI/UX Tests
- [ ] Test animation performance with 50+ pending items
- [ ] Test animation smoothness across browsers
- [ ] Test source badge visibility
- [ ] Test mobile responsiveness
- [ ] Test accessibility (screen readers)

## 📁 FILES TO CREATE

### Components
- [ ] components/SourceBadge.tsx
- [ ] components/PendingCard.tsx
- [ ] components/ValidationQueue.tsx
- [ ] components/AgenticActivity.tsx
- [ ] components/SuggestionTooltip.tsx

### Services
- [ ] services/agentic.service.ts
- [ ] services/validation.service.ts

### Styles
- [ ] styles/animations.css
- [ ] styles/pending-cards.css

### Documentation
- [ ] DEMO_WORKFLOWS.md
- [ ] USER_TEST_SCENARIOS.md
- [ ] DEMO_CAPABILITIES.md
- [ ] AGENTIC_WORKFLOWS.md

## 🐛 FIXES NEEDED

### Type Fixes
- [ ] Fix medical emergency priority (not auto-critical)
- [ ] Update all activity type mappings
- [ ] Fix SimpleCase vs Case type mismatch
- [ ] Update incident creation to require validation

### Logic Updates
- [ ] Remove auto-incident creation rules
- [ ] Update status progression for pending states
- [ ] Fix escalation logic (no auto-escalation)
- [ ] Update mock data to reflect new flow

## 🚀 DEPLOYMENT PREP

### Build & Deploy
- [ ] Ensure TypeScript compiles with no errors
- [ ] Test production build
- [ ] Verify all animations work in production
- [ ] Test with realistic data volumes
- [ ] Document environment variables
- [ ] Create deployment guide

### Demo Preparation
- [ ] Create demo script for each workflow
- [ ] Prepare sample data for each scenario
- [ ] Test presenter mode (larger fonts/buttons)
- [ ] Create backup offline demo
- [ ] Prepare architecture diagrams

## 📊 SUCCESS METRICS

### Performance
- [ ] Pending queue handles 100+ items smoothly
- [ ] Animations maintain 60fps
- [ ] Page load under 3 seconds
- [ ] State updates under 100ms

### User Experience
- [ ] Zero anxiety-inducing elements
- [ ] Clear validation workflows
- [ ] Intuitive source identification
- [ ] Smooth, professional animations
- [ ] Accessible to all user types