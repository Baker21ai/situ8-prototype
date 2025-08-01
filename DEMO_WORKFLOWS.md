# SITU8 DEMO WORKFLOWS

## 🎯 TOP 10 CUSTOMER DEMO WORKFLOWS

### 1. TAILGATE DETECTION WITH VALIDATION

**Source**: Ambient AI  
**Duration**: 3-5 minutes  
**Key Points**: Human-in-the-loop validation, no auto-escalation

```
FLOW:
1. Ambient AI detects tailgating at Building A entrance
2. Activity created with soft blue "Ambient AI" badge
3. Card gently pops up with breathing animation
4. Shows "PENDING VALIDATION" status
5. Supervisor reviews video evidence
6. Clicks VALIDATE → Creates incident
7. Assigns guard to respond
8. Full audit trail captured
```

**What to Emphasize**:
- No automatic incidents - human judgment required
- Gentle UI prevents alert fatigue
- Source clearly identified
- Complete accountability trail

### 2. MEDICAL EMERGENCY RESPONSE

**Source**: Manual Report / Panic Button  
**Duration**: 2-3 minutes  
**Key Points**: Urgent but controlled response

```
FLOW:
1. Guard reports medical emergency via radio
2. Activity created with "Manual" badge
3. PENDING status (not auto-critical)
4. Supervisor immediately validates
5. Escalates to HIGH priority incident
6. Assigns closest guard with medical training
7. Tracks response and resolution
```

**What to Emphasize**:
- Even medical emergencies need validation
- Prevents false alarms from causing panic
- Rapid validation process for true emergencies
- Skill-based guard suggestions

### 3. SECURITY BREACH INVESTIGATION

**Source**: Lenel Access Control  
**Duration**: 5-7 minutes  
**Key Points**: Multi-source correlation

```
FLOW:
1. Lenel detects unauthorized access attempt
2. Creates PENDING activity with purple badge
3. Supervisor investigates access logs
4. Correlates with camera footage
5. Validates and creates incident
6. Opens investigation case
7. Links related activities
8. Assigns investigation team
```

**What to Emphasize**:
- Integration with existing security systems
- Investigation workflow from incident to case
- Evidence correlation capabilities
- Team collaboration features

### 4. BOL (BE-ON-LOOKOUT) PATTERN MATCHING

**Source**: Manual + Agentic Workflow  
**Duration**: 4-6 minutes  
**Key Points**: Pattern matching across locations

```
FLOW:
1. Supervisor creates BOL for suspicious vehicle
2. BOL saved as PENDING activity
3. LangChain workflow analyzes patterns
4. Finds 3 potential matches at other sites
5. Creates 3 new PENDING activities
6. Each site validates independently
7. Confirmed sightings escalated
8. Multi-site coordination initiated
```

**What to Emphasize**:
- BOLs are activities, not separate entities
- Agentic workflows enhance human decisions
- Multi-site capability
- Pattern matching without false positives

### 5. AGENTIC WORKFLOW INTEGRATION

**Source**: LangChain / SOP Manager  
**Duration**: 3-4 minutes  
**Key Points**: AI assistance with human control

```
FLOW:
1. SOP Manager detects policy violation
2. Creates PENDING activity with orange badge
3. Shows "SOP: Visitor Badge Expired"
4. Supervisor reviews context
5. Validates or dismisses based on situation
6. If validated, follows SOP workflow
7. Automatic notifications per policy
```

**What to Emphasize**:
- AI helps but doesn't decide
- Clear source identification
- Policy compliance automation
- Flexibility for human judgment

### 6. MULTI-SITE INCIDENT COORDINATION

**Source**: Multiple  
**Duration**: 6-8 minutes  
**Key Points**: Enterprise-wide visibility

```
FLOW:
1. Power outage at Site A
2. Multiple systems create PENDING activities
3. Site A supervisor validates primary incident
4. Alerts sent to Sites B and C
5. Each site checks backup systems
6. Coordinated response plan activated
7. Cross-site resource sharing
8. Resolution tracked across all sites
```

**What to Emphasize**:
- Enterprise-scale coordination
- Site autonomy with visibility
- Resource optimization
- Unified response protocols

### 7. SHIFT HANDOVER WORKFLOW

**Source**: System Generated  
**Duration**: 3-4 minutes  
**Key Points**: Continuity of operations

```
FLOW:
1. Shift change approaching
2. System shows pending activities summary
3. Outgoing supervisor reviews each item
4. Adds handover notes
5. Incoming supervisor acknowledges
6. Pending items transfer ownership
7. Audit trail maintains continuity
```

**What to Emphasize**:
- Nothing falls through cracks
- Clear accountability transfer
- Historical context preserved
- Smooth operational continuity

### 8. EXTERNAL THREAT CORRELATION

**Source**: Multiple AI Systems  
**Duration**: 5-6 minutes  
**Key Points**: Intelligent correlation without alarm fatigue

```
FLOW:
1. Perimeter camera detects unusual activity
2. Drone detection system alerts
3. Both create PENDING activities
4. System suggests correlation
5. Supervisor reviews both together
6. Validates as single incident
7. Escalates to law enforcement
8. Coordinates external response
```

**What to Emphasize**:
- Multiple AI sources work together
- Human validates correlations
- Reduces duplicate incidents
- External agency coordination

### 9. AUDIT TRAIL DEMONSTRATION

**Source**: Various  
**Duration**: 2-3 minutes  
**Key Points**: Complete accountability

```
FLOW:
1. Select any completed incident
2. Show full timeline:
   - Who created (source + user)
   - Who validated
   - Who assigned
   - Who responded
   - Who resolved
3. Show all status changes
4. Display decision rationale
5. Export for compliance
```

**What to Emphasize**:
- Every action tracked
- Clear accountability chain
- Compliance ready
- Legal defensibility

### 10. EQUIPMENT FAILURE RESPONSE

**Source**: IoT Sensors / Manual  
**Duration**: 3-4 minutes  
**Key Points**: Operational continuity

```
FLOW:
1. HVAC sensor reports failure
2. Creates PENDING activity
3. Facility manager validates
4. Creates maintenance incident
5. Assigns technical team
6. Tracks repair progress
7. Updates affected areas
8. Confirms resolution
```

**What to Emphasize**:
- Beyond security use cases
- Integrated facility management
- Vendor coordination
- Business continuity

## 🎨 UI/UX DEMO POINTS

### Gentle Animations
- Show how cards pop up softly from bottom
- Demonstrate breathing effect on pending items
- Note the calming color palette
- Highlight non-intrusive notifications

### Source Identification
- Point out source badges on each activity
- Explain color coding system
- Show source filtering options
- Demonstrate source-based analytics

### Validation Process
- Emphasize human decision requirement
- Show role-based permissions
- Demonstrate audit trail creation
- Highlight accountability features

## 📊 DEMO METRICS TO SHOW

- **Response Time**: Average validation time by priority
- **False Positive Rate**: Dismissed vs validated activities
- **Source Distribution**: Activities by source system
- **Workload Balance**: Pending items per supervisor
- **Compliance Score**: Validation within SLA

## 🎯 KEY DIFFERENTIATORS

1. **Human-Centric**: AI assists but humans decide
2. **Source Transparency**: Always know where alerts originate
3. **Calm Urgency**: Important without inducing panic
4. **Complete Accountability**: Every decision tracked
5. **Enterprise Scale**: Multi-site coordination built-in