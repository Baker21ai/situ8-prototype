# SITU8 ACTIVITY MANAGEMENT SYSTEM

## SYSTEM OVERVIEW

The Situ8 Activity Management System is a sophisticated security platform that automatically processes activities, evaluates business rules, and creates incidents based on predefined criteria. The system ensures proper escalation of critical situations while maintaining detailed audit trails for all operations.

```ascii
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SITU8 ACTIVITY MANAGEMENT SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## ACTIVITY TYPES AND AUTO-INCIDENT RULES

### ACTIVITY TYPE MATRIX

| Activity Type | Icon | Label | Threat Level | Auto-Incident | Validation Required | Priority |
|--------------|------|-------|--------------|---------------|-------------------|----------|
| **MEDICAL** | 🏥 | Medical Emergency | CRITICAL | ALWAYS | NO | CRITICAL |
| **SECURITY-BREACH** | 🔓 | Security Breach | CRITICAL | ALWAYS | YES | HIGH |
| **ALERT** | ⚠️ | System Alert | HIGH | CONDITIONAL* | YES | MEDIUM |
| **PATROL** | 👮 | Patrol Activity | NONE | NEVER | N/A | LOW |
| **EVIDENCE** | 📋 | Evidence Collection | LOW | NEVER | N/A | LOW |
| **PROPERTY-DAMAGE** | ⚙️ | Property Damage | MEDIUM | CONDITIONAL** | YES | MEDIUM |
| **BOL-EVENT** | 👁️ | Be-On-Lookout | HIGH | ALWAYS | YES | HIGH |

*Creates incident if confidence > 80% OR occurs after hours
**Creates incident if confidence > 75%

## ACTIVITY PROCESSING FLOW

```ascii
                           ┌─────────────────────────┐
                           │   ACTIVITY CREATED      │
                           │ {type, title, priority} │
                           └───────────┬─────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        VALIDATION LAYER            │
                    │ • Required fields check            │
                    │ • Type validation                  │
                    │ • Priority assignment              │
                    └─────────────────┬───────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │      AUTO-TAGGING SYSTEM           │
                    ├─────────────────────────────────────┤
                    │ trigger:human     trigger:system   │
                    │ location:site-A   location:site-B  │
                    │ time:business     time:after-hours │
                    │ confidence:95     confidence:82     │
                    └─────────────────┬───────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │    BUSINESS RULES ENGINE           │
                    └─────────────────┬───────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
               ┌──────────────────┐      ┌──────────────────┐
               │  NO INCIDENT     │      │ CREATE INCIDENT  │
               └──────────────────┘      └──────────────────┘
```

### VALIDATION LAYER

The validation layer ensures all activities meet minimum requirements:
- **Required Fields**: type, title, timestamp
- **Type Validation**: Must be one of the predefined activity types
- **Priority Assignment**: Defaults based on activity type if not specified

### AUTO-TAGGING SYSTEM

System automatically generates tags based on activity attributes:

| Tag Type | Source | Template | Example |
|----------|---------|----------|---------|
| **TRIGGER** | created_by | trigger:{value} | trigger:human, trigger:system |
| **LOCATION** | metadata.site | location:{value} | location:building-a |
| **TIME** | timestamp | time:{businessHours} | time:business-hours, time:after-hours |
| **CONFIDENCE** | confidence | confidence:{value} | confidence:95 |

### BUSINESS RULES ENGINE

The engine evaluates each activity against predefined rules:

```javascript
// RULE EVALUATION LOGIC
IF activity.type === 'medical' THEN
    CREATE INCIDENT (CRITICAL, NO VALIDATION)
ELSE IF activity.type === 'security-breach' THEN
    CREATE INCIDENT (HIGH, REQUIRES VALIDATION)
ELSE IF activity.type === 'alert' AND (confidence > 80 OR isAfterHours) THEN
    CREATE INCIDENT (MEDIUM, REQUIRES VALIDATION)
ELSE IF activity.type === 'property-damage' AND confidence > 75 THEN
    CREATE INCIDENT (MEDIUM, REQUIRES VALIDATION)
ELSE IF activity.type === 'patrol' OR activity.type === 'evidence' THEN
    NO INCIDENT (LOG ONLY)
```

## STATUS PROGRESSION WORKFLOW

### ROLE-BASED STATUS TRANSITIONS

```ascii
OFFICER ROLE (Forward Only):
┌───────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│ DETECTING │ ──> │ ASSIGNED │ ──> │ RESPONDING │ ──> │ RESOLVED │
└───────────┘     └──────────┘     └────────────┘     └──────────┘
     🔵                🟠                 🟡                🟢

SUPERVISOR/ADMIN ROLE (Any Direction):
┌───────────┐ <──> ┌──────────┐ <──> ┌────────────┐ <──> ┌──────────┐
│ DETECTING │      │ ASSIGNED │      │ RESPONDING │      │ RESOLVED │
└───────────┘      └──────────┘      └────────────┘      └──────────┘
                                                              ⚠️
                                                    (Reopening requires
                                                        approval)
```

### STATUS DEFINITIONS

| Status | Description | Allowed Roles | Next States |
|--------|-------------|---------------|-------------|
| **DETECTING** | Initial detection phase | All | Assigned |
| **ASSIGNED** | Assigned to personnel | All | Responding, Detecting* |
| **RESPONDING** | Personnel actively responding | All | Resolved, Assigned* |
| **RESOLVED** | Issue resolved | All | Responding*, Assigned*, Detecting* |

*Supervisor/Admin only

## INCIDENT CREATION WORKFLOW

### PENDING INCIDENT VALIDATION

```ascii
┌─────────────────────────────────┐
│     INCIDENT CREATED            │
│  (requiresValidation = true)    │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│     PENDING STATUS (5 MIN)      │
│   ┌───────────────────────┐     │
│   │ ⏱️  VALIDATION TIMER   │     │
│   │                       │     │
│   │ [VALIDATE] [DISMISS]  │     │
│   └───────────────────────┘     │
└────────────┬────────────────────┘
             ▼
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌──────────────┐
│VALIDATED│     │  DISMISSED   │
│ ACTIVE  │     │  (CLOSED)    │
└─────────┘     └──────────────┘
    │
    ▼
┌─────────────────────────────────┐
│   ESCALATION (15 MIN)           │
│   If not validated:             │
│   • Notify supervisor           │
│   • Increase priority           │
└─────────────────────────────────┘
```

## DATA ARCHITECTURE

### SYSTEM COMPONENTS

```ascii
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI/API    │ ──> │  SERVICE    │ ──> │   STORE     │
│  TRIGGERS   │     │   LAYER     │     │  (ZUSTAND)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   ▼                    ▼
       │            ┌─────────────┐     ┌─────────────┐
       │            │ AUDIT TRAIL │     │ LOCAL STATE │
       │            │  WHO/WHAT   │     │ PERSISTENCE │
       │            │ WHEN/WHERE  │     └─────────────┘
       │            │    WHY      │
       │            └─────────────┘
       ▼
┌─────────────────────────────────────────────────────┐
│              ACTIVITY SERVICE                       │
├─────────────────────────────────────────────────────┤
│ • validateEntity()                                  │
│ • enforceBusinessRules()                           │
│ • checkAutoIncidentCreation()                      │
│ • generateSystemTags()                             │
│ • auditLog()                                       │
└─────────────────────────────────────────────────────┘
```

### SERVICE LAYER RESPONSIBILITIES

1. **VALIDATION**
   - Entity validation
   - Required field checks
   - Type enforcement

2. **BUSINESS LOGIC**
   - Auto-tagging
   - Status progression rules
   - Incident creation rules
   - Retention policies

3. **AUDIT TRAIL**
   - All operations logged
   - WHO: User performing action
   - WHAT: Action performed
   - WHEN: Timestamp
   - WHERE: Location/context
   - WHY: Business rule/reason

### RETENTION POLICY

```ascii
┌────────────────────────────────┐
│      30-DAY RETENTION          │
├────────────────────────────────┤
│ Day 1-29: ACTIVE               │
│ Day 30: AUTO-ARCHIVE           │
│ Day 31+: ARCHIVED (READ-ONLY)  │
└────────────────────────────────┘
```

## EXAMPLE SCENARIOS

### SCENARIO 1: MEDICAL EMERGENCY

```javascript
// INPUT
{
  type: 'medical',
  title: 'Employee collapsed in cafeteria',
  confidence: 95,
  priority: 'critical'
}

// PROCESSING
1. VALIDATION: ✓ All required fields present
2. AUTO-TAGS: ['trigger:human', 'location:cafeteria', 'time:business-hours', 'confidence:95']
3. BUSINESS RULE: Medical → ALWAYS create incident
4. INCIDENT: Created immediately (CRITICAL, NO VALIDATION)
5. STATUS: 'detecting' → Ready for assignment
6. AUDIT: Operation logged with full context
```

### SCENARIO 2: SECURITY BREACH (AFTER HOURS)

```javascript
// INPUT
{
  type: 'security-breach',
  title: 'Unauthorized access attempt - Server Room',
  confidence: 82,
  timestamp: '2025-01-30T22:30:00Z'  // 10:30 PM
}

// PROCESSING
1. VALIDATION: ✓ All required fields present
2. AUTO-TAGS: ['trigger:system', 'location:server-room', 'time:after-hours', 'confidence:82']
3. BUSINESS RULE: Security breach → ALWAYS create incident
4. INCIDENT: Created (HIGH PRIORITY, PENDING)
5. VALIDATION: 5-minute timer started
6. ESCALATION: If not validated → Supervisor notification at 15 min
```

### SCENARIO 3: ROUTINE PATROL

```javascript
// INPUT
{
  type: 'patrol',
  title: 'Perimeter check - Zone A',
  priority: 'low'
}

// PROCESSING
1. VALIDATION: ✓ All required fields present
2. AUTO-TAGS: ['trigger:human', 'location:zone-a', 'time:business-hours']
3. BUSINESS RULE: Patrol → NEVER create incident
4. RESULT: Activity logged only
5. STATUS: Can progress through normal workflow
6. LINKAGE: Can be manually linked to incidents if needed
```

## MULTI-INCIDENT SUPPORT

Activities can be associated with multiple incidents through the incident_contexts field:

```javascript
activity.incident_contexts = [
  {
    incident_id: 'INC-001',
    role: 'trigger',      // This activity triggered the incident
    linked_at: '2025-01-30T10:00:00Z'
  },
  {
    incident_id: 'INC-002',
    role: 'related',      // Related to this incident
    linked_at: '2025-01-30T10:05:00Z'
  },
  {
    incident_id: 'INC-003',
    role: 'evidence',     // Evidence for this incident
    linked_at: '2025-01-30T10:10:00Z'
  }
]
```

## KEY IMPLEMENTATION FILES

| File | Purpose |
|------|---------|
| **services/activity.service.ts** | Core business logic implementation |
| **stores/activityStore.ts** | State management and UI operations |
| **lib/types/activity.ts** | Type definitions and interfaces |
| **lib/utils/security.ts** | Activity type definitions and helpers |
| **services/types.ts** | Service layer type definitions |

## CONFIGURATION

### AUTO-INCIDENT RULES CONFIGURATION

```javascript
const AUTO_INCIDENT_RULES = {
  'medical': {
    condition: 'ALWAYS',
    skipValidation: true,
    priority: 'CRITICAL',
    dismissible: false
  },
  'security-breach': {
    condition: 'ALWAYS',
    skipValidation: false,
    priority: 'HIGH',
    dismissible: true
  },
  'alert': {
    condition: 'CONDITIONAL',
    rules: [
      { field: 'confidence', operator: '>', value: 80 },
      { field: 'time', operator: 'equals', value: 'after-hours' }
    ],
    skipValidation: false,
    priority: 'MEDIUM',
    dismissible: true
  }
}
```

## SUMMARY

The Situ8 Activity Management System provides:

1. **AUTOMATIC INCIDENT CREATION** based on activity type and conditions
2. **ROLE-BASED STATUS PROGRESSION** with enforcement
3. **COMPREHENSIVE AUDIT TRAIL** for all operations
4. **AUTO-TAGGING SYSTEM** for metadata enrichment
5. **30-DAY RETENTION POLICY** with automatic archival
6. **MULTI-INCIDENT SUPPORT** for complex scenarios
7. **VALIDATION TIMERS** for pending incidents
8. **ESCALATION WORKFLOWS** for unvalidated incidents

The system ensures critical situations are never missed while preventing alert fatigue from routine operations.