# Situ8 Business Logic Document
## Activities → Incidents → Cases

### Version: 1.0
### Last Updated: November 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Entity Definitions](#2-core-entity-definitions)
3. [Activity Business Logic](#3-activity-business-logic)
4. [Incident Business Logic](#4-incident-business-logic)
5. [Case Business Logic](#5-case-business-logic)
6. [BOL Business Logic](#6-bol-business-logic)
7. [Cross-Entity Relationships](#7-cross-entity-relationships)
8. [Audit & Compliance](#8-audit-compliance)
9. [Edge Cases & Special Scenarios](#9-edge-cases-special-scenarios)

---

## 1. Overview

### 1.1 Core Principle: Activity-First Architecture

Every security event enters Situ8 as an **Activity**. This creates a unified, searchable stream of all security operations. Activities can exist independently or be grouped into Incidents for operational response, which can then escalate to Cases for strategic investigation.

### 1.2 Entity Hierarchy

```
Activities (Foundation)
    ↓
Incidents (Operational Response) 
    ↓
Cases (Strategic Investigation)
```

### 1.3 Key Business Rules

1. **Everything starts as an Activity** - no exceptions
2. **Human validation required** for automated decisions
3. **Complete audit trail** - every change is logged
4. **No hard deletes** - soft delete only
5. **Good faith operations** - trust with verification

---

## 2. Core Entity Definitions

### 2.1 Activity

**Definition**: The atomic unit of security information representing any event, action, or observation.

**Types**:
- `medical` - Medical emergencies
- `security-breach` - Unauthorized access or security violations
- `alert` - System-generated security alerts
- `patrol` - Routine security rounds
- `evidence` - Investigation-related materials
- `property-damage` - Facility or asset damage
- `bol-event` - Be-on-lookout related activities

### 2.2 Incident

**Definition**: An operational response container that groups related activities requiring coordinated action.

**Key Characteristics**:
- Groups 1 or more related activities
- Requires human response
- Has assigned resources
- Time-bound resolution

### 2.3 Case

**Definition**: A strategic investigation container for complex security matters requiring long-term tracking and evidence management.

**Key Characteristics**:
- Can contain multiple incidents
- Can include activities directly (especially LOW priority)
- Requires documentation
- May span extended timeframes

---

## 3. Activity Business Logic

### 3.1 Activity Creation

**Sources**:
1. **Manual Entry** - Security personnel via UI/mobile
2. **Radio/Voice** - Transcribed communications via Twilio
3. **Integrations** - Ambient.ai, Lenel, sensors
4. **System Generated** - BOL matches, scheduled patrols

**Required Fields**:
- Type (from enumerated list)
- Description (minimum 10 characters)
- Location (auto-populated or selected)
- Trigger (human/integration)

**Auto-Generated Fields**:
- Unique ID (ACT-YYYY-XXXXX)
- Timestamp (UTC)
- Creator (user or system)
- Initial status: `detecting`
- System tags

### 3.2 Auto-Tagging Rules

**System Tags** (automatic, read-only):
- `trigger:[human|integration]`
- `location:[building-zone]`
- `time:[business-hours|after-hours]`
- `confidence:[0-100]` (integration only)

**User Tags** (manual, limited by role):
- Officers: Up to 10 descriptive tags
- Supervisors: Up to 15 tags including routing tags
- Admins: Unlimited tags

### 3.3 Status Progression

**Standard Flow**:
```
detecting → assigned → responding → resolved
```

**Status Rules**:
- **Officers**: Forward progression only
- **Supervisors/Admins**: Any status change allowed
- All changes require audit log entry with reason

### 3.4 Auto-Incident Creation Rules

| Activity Type | Rule | Pending State | Dismissible |
|--------------|------|---------------|-------------|
| `medical` | ALWAYS | Skip - Direct to active | No |
| `security-breach` | ALWAYS | Yes - Requires validation | Yes (Supervisor+) |
| `bol-event` | ALWAYS | Yes - Requires validation | No |
| `alert` | IF confidence >80% OR after-hours | Yes - Requires validation | Yes (Supervisor+) |
| `property-damage` | IF confidence >75% | Yes - Requires validation | Yes (Supervisor+) |
| `patrol` | NEVER | N/A | N/A |
| `evidence` | NEVER | N/A | N/A |

### 3.5 Activity Lifecycle

1. **Active Period**: 30 days in primary database
2. **Archive**: After 30 days → data lake
3. **Retention**: 7 years total
4. **Deletion**: Soft delete only (sets `deleted_at`)
5. **Restoration**: Admin only, within 90 days

### 3.6 Multi-Incident Activities

**Scenario**: One activity relevant to multiple incidents

**Implementation**:
```javascript
Activity {
  id: "ACT-2024-12345",
  primary_status: "resolved",
  
  incident_contexts: [
    {
      incident_id: "INC-001",
      context_status: "primary-evidence",
      added_at: "2024-01-15T10:00:00Z",
      added_by: "user-123",
      notes: "Initial breach detection"
    },
    {
      incident_id: "INC-002",
      context_status: "corroborating",
      added_at: "2024-01-15T11:00:00Z", 
      added_by: "user-456",
      notes: "Pattern confirmation"
    }
  ]
}
```

**Rules**:
- Activity maintains single `primary_status`
- Each incident tracks its relationship context
- Status changes apply universally
- Context updates are incident-specific

---

## 4. Incident Business Logic

### 4.1 Incident Creation

**Methods**:
1. **Auto-Created** - From activity rules (starts as "pending")
2. **Manual** - By any user role (starts as "active")
3. **Bulk** - From multiple selected activities

**Pending Incident Validation**:
- 5 minutes: Initial validation window
- 5-15 minutes: Auto-escalates to supervisor
- After 15 minutes: Converts to active with "auto-approved" flag

**Exception**: Medical emergencies skip pending state

### 4.2 Required Components

**Minimum Requirements**:
- At least 1 activity (primary trigger)
- Location assignment
- Priority (inherited from activities)

**Optional Components**:
- Additional related activities
- Assigned personnel
- Response notes
- Linked evidence

### 4.3 Multi-Location Incidents

**Structure**: ONE incident can span multiple locations

**Permissions**:
- Users at ANY involved location can:
  - View incident
  - Add activities
  - Update status
  - Add notes
- "Primary Site" designation for:
  - Closing incident
  - Major escalations
  - Resource allocation

**Example**:
```javascript
Incident {
  id: "INC-2024-001",
  primary_location: "Site-A",
  involved_locations: ["Site-A", "Site-B", "Site-C"],
  location_roles: {
    "Site-A": "primary",
    "Site-B": "affected", 
    "Site-C": "supporting"
  }
}
```

### 4.4 Status Workflow

```
pending → active → assigned → responding → investigating → resolved
```

**Status Rules**:
- Auto-created incidents start as "pending" (except medical)
- Manual incidents start as "active"
- Cannot close with unresolved activities
- Resolution requires documentation (min 50 characters)

### 4.5 Guard Assignment

**Critical Rule**: NO automatic guard dispatch

**Process**:
1. System suggests nearest available guards
2. Human reviews suggestions
3. Human manually assigns guards
4. Guards receive notification
5. Guards acknowledge assignment

---

## 5. Case Business Logic

### 5.1 Case Creation Methods

**Method 1: From Incidents** (Standard)
- Select one or more incidents
- Group related investigations
- Incidents can be resolved or active

**Method 2: Direct from Activities** (Allowed)
- ANY priority activities can bypass incident layer
- No minimum activity count
- Requires case justification (standard field)
- Common for LOW priority pattern investigations

### 5.2 Case Components

**Required**:
- Title (descriptive)
- Type (investigation category)
- Lead investigator
- Justification

**Optional**:
- Linked incidents
- Direct activities (especially evidence type)
- Team members
- External documentation

### 5.3 Evidence Management

**Evidence Activities**:
- Can be added directly to cases
- Maintain chain of custody
- Include:
  - Photos/videos
  - Witness statements
  - Documents
  - Physical evidence logs

### 5.4 Multi-Site Cases

**Structure**: ONE case across multiple sites

**Coordination**:
```javascript
Case {
  id: "CASE-2024-001",
  lead_site: "Site-A",
  involved_sites: ["Site-A", "Site-B", "Site-C"],
  team: [
    {user: "user-123", site: "Site-A", role: "lead"},
    {user: "user-456", site: "Site-B", role: "investigator"},
    {user: "user-789", site: "Site-C", role: "reviewer"}
  ]
}
```

### 5.5 Case Lifecycle

**Status Progression**:
```
open → investigating → review → closed
```

**Closure Requirements**:
- Resolution summary (min 200 characters)
- All tasks completed
- Team lead approval
- Lessons learned (optional)

---

## 6. BOL Business Logic

### 6.1 BOL Creation

**Process**:
1. Create BOL entity with details
2. System auto-creates `bol-event` activity
3. Activity distributed to selected sites
4. Auto-incident created (always)
5. Real-time monitoring begins

### 6.2 BOL Activities

**Every BOL action creates an activity**:
- BOL creation → `bol-event` activity
- BOL match → `bol-event` activity  
- BOL update → `evidence` activity
- BOL resolution → `bol-event` activity (resolved)

### 6.3 Multi-Site BOL

**Structure**: ONE BOL distributed to multiple sites

**Activity Creation**:
- Each site receives the `bol-event` activity
- Activities are linked via BOL ID
- Pattern analysis across all sites

### 6.4 BOL Matching

**Process**:
1. System detects potential match
2. Creates new `bol-event` activity
3. Confidence score assigned
4. Auto-incident created (pending validation)
5. Human investigates and confirms/dismisses

**Match Thresholds**:
- <70% confidence: No action
- 70-85%: Low priority alert
- 85-95%: Medium priority alert
- >95%: High priority alert

---

## 7. Cross-Entity Relationships

### 7.1 Relationship Rules

**Activities → Incidents**:
- 1 activity can belong to 0 or many incidents
- Activities can be added to incidents after creation
- Removing activity from incident requires reason

**Incidents → Cases**:
- 1 incident can belong to 0 or many cases
- Incidents retain independent lifecycle
- Case closure doesn't affect incident status

**Activities → Cases**:
- Evidence activities can link directly
- ANY priority activity can be added (good faith)
- Maintains activity → case audit trail

### 7.2 Status Independence

Each entity maintains its own status:
- Activity status is universal
- Incident status is independent
- Case status is independent

Example: An activity can be "resolved" while its incident is "investigating" and case is "open"

### 7.3 Cross-Location Coordination

**Permissions Cascade**:
- Organization → Region → Site → Building → Zone
- Higher level permissions include all lower levels
- Emergency overrides available for crisis

**Entity Access**:
- Activities: Viewed based on location assignment
- Incidents: Accessed if user has ANY involved location
- Cases: Accessed if user is on team OR admin

---

## 8. Audit & Compliance

### 8.1 Universal Audit Requirements

**Every change logged**:
- WHO: User ID and name
- WHAT: Specific action taken
- WHEN: UTC timestamp
- WHERE: Location context
- WHY: Reason (if applicable)
- BEFORE/AFTER: State changes

### 8.2 Audit Events by Entity

**Activity Audits**:
- Creation (source, type, trigger)
- Type changes (with justification)
- Status updates
- Tag additions/removals
- Auto-incident decisions
- Archive/restore actions

**Incident Audits**:
- Creation method (auto/manual)
- Validation actions
- Guard assignments
- Status changes
- Activity additions/removals
- Resolution details

**Case Audits**:
- Creation and justification
- Team changes
- Evidence additions
- Status updates
- Access logs
- Closure approval

### 8.3 Compliance Features

**Data Retention**:
- Audit logs: Permanent
- Activities: 7 years
- Incidents: 7 years
- Cases: 7 years after closure

**Access Control**:
- Role-based permissions
- Location-based filtering
- Time-based restrictions
- Emergency overrides (logged)

---

## 9. Edge Cases & Special Scenarios

### 9.1 Conflicting Auto-Rules

**Scenario**: Activity meets multiple auto-incident criteria

**Resolution**: 
- Apply highest priority rule
- Create single incident
- Log all matching rules
- Note in incident: "Multiple rules matched"

### 9.2 Orphaned Activities

**Scenario**: Incident deleted but activities remain

**Handling**:
- Activities retain full history
- Show "Previously linked to INC-XXX"
- Available for new incident assignment
- Maintain original audit trail

### 9.3 Cross-Time Zone Operations

**Scenario**: Incident spans sites in different time zones

**Handling**:
- Store all times in UTC
- Display in user's local time
- Show timezone indicator for other sites
- Activity timeline uses UTC ordering

### 9.4 Offline Site Operations

**Scenario**: Site loses connectivity

**Handling**:
- Queue activities locally
- Assign temporary IDs
- Sync when connected
- Preserve chronological order
- Flag as "offline-created"

### 9.5 Rapid Activity Influx

**Scenario**: 1000+ activities per second from integration

**Handling**:
- Route informational to data lake
- Process critical in real-time
- Batch similar activities
- Apply rate limiting
- Generate summary activity for patterns

### 9.6 Permission Conflicts

**Scenario**: User has different roles at different sites

**Resolution**:
- Apply highest permission level
- Context-aware permissions
- Location determines active role
- Audit logs show permission used

---

## Summary

This business logic ensures:

1. **Consistency**: Every event follows the same path
2. **Accountability**: Complete audit trail
3. **Flexibility**: Accommodates real-world scenarios
4. **Reliability**: No data loss, no missed events
5. **Scalability**: Handles enterprise volumes

The system trusts users to make good decisions while maintaining comprehensive logs for compliance and investigation.