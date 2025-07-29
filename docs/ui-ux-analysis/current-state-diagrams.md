# Current State ASCII Diagrams - Situ8 Command Center

## Full Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Situ8 Security Platform - Real-time management                    14:32 | Admin | [A]  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  ┌──────────────┐  ┌─────────────────────────────────────────────┐  ┌──────────────────────┐  │
│  │ LEFT (25%)   │  │ CENTER (50%)                                │  │ RIGHT (25%)          │  │
│  │              │  │                                             │  │                      │  │
│  │ ACTIVITIES   │  │ INTERACTIVE MAP + GUARD MANAGEMENT          │  │ TIMELINE             │  │
│  │ STREAM       │  │                                             │  │                      │  │
│  │              │  │ ┌─────────────────────────────────────────┐ │  │ ┌──────────────────┐ │  │
│  │ [Critical▼]  │  │ │ Map Navigation:                         │ │ │ │ [Incidents] [Comm]│ │  │
│  │ ✗ Tailgate   │  │ │ Sites > Buildings > Floors > Rooms     │ │ │ │                  │ │  │
│  │ ✗ Alarm      │  │ │                                         │ │ │ │ 14:31 Critical   │ │  │
│  │              │  │ │ [Russian Doll Navigation]               │ │ │ │ Tailgating Alert │ │  │
│  │ [High ▼]     │  │ │                                         │ │ │ │ Building A East  │ │  │
│  │ ⚠ Access     │  │ │ SVG Layout Grid:                        │ │ │ │                  │ │  │
│  │ ⚠ Breach     │  │ │ Buildings, Zones, Assets                │ │ │ │ 14:29 Response   │ │  │
│  │              │  │ │                                         │ │ │ │ "Responding to   │ │  │
│  │ [Medium ▶]   │  │ │ [Zoom +/-] [Back] [Breadcrumbs]        │ │ │ │  alert, ETA 2m"  │ │  │
│  │ [Low ▶]      │  │ └─────────────────────────────────────────┘ │ │ │                  │ │  │
│  │              │  │                                             │ │ │ │ 14:27 Patrol     │ │  │
│  │ [Critical▲]  │  │ ┌─────────────────────────────────────────┐ │ │ │ │ Complete - B     │ │  │
│  │              │  │ │ GUARD MANAGEMENT (Compact Footer)       │ │ │ │                  │ │  │
│  │ Show: 47     │  │ │                                         │ │ │ │ [15m][1h][4h]    │ │  │
│  │ activities   │  │ │ Garcia[●Resp] Chen[●Patrol] Davis[○]    │ │ │ │ [24h]            │ │  │
│  │              │  │ │ [Status] [Location] [Assign]            │ │ │ │                  │ │  │
│  │              │  │ └─────────────────────────────────────────┘ │ │ │ │ [Push to Talk]   │ │  │
│  │              │  │                                             │ │ │ └──────────────────┘ │  │
│  └──────────────┘  └─────────────────────────────────────────────┘ │ └──────────────────────┘  │
│                                                                     │                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Left Panel: Activity Stream (Current Implementation)

```
┌──────────────────────┐
│ Activity Stream      │
├──────────────────────┤
│                      │
│ [Critical ▼] 3       │ ← Collapsible section header
│ ├─ Tailgate Alert    │ ← Individual activity cards
│ │  Building A East   │
│ │  [Garcia assigned] │
│ │  ●Red Priority     │
│ ├─ Alarm System      │
│ │  Building B West   │
│ │  [Unassigned]      │
│ │  ●Red Priority     │
│ └─ Breach Detected   │
│    Perimeter Gate    │
│    [Chen responding] │
│    ●Red Priority     │
│                      │
│ [High ▼] 4           │ ← Expandable section  
│ ├─ Access Denied     │
│ │  Server Room B     │
│ │  [Auto-lockdown]   │
│ │  ⚠Orange Priority  │
│ ├─ Badge Issue       │
│ │  Reception         │
│ │  [Under review]    │
│ │  ⚠Orange Priority  │
│ ├─ Suspicious        │
│ │  Parking Lot       │
│ │  [Davis patrol]    │
│ │  ⚠Orange Priority  │
│ └─ Door Fault        │
│    Building C        │
│    [Maintenance]     │
│    ⚠Orange Priority  │
│                      │
│ [Medium ▶] 8         │ ← Collapsed section
│ [Low ▶] 12           │ ← Collapsed section
│                      │
│ ┌──────────────────┐ │
│ │[Critical Only] ✓ │ │ ← Filter toggle
│ └──────────────────┘ │
│                      │
│ Show: 47 activities  │ ← Activity counter
└──────────────────────┘
```

## Center Panel: Interactive Map + Guard Management (Current Implementation)

```
┌─────────────────────────────────────────┐
│ Interactive Map                         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─Navigation Breadcrumbs─────────────┐ │
│ │ Sites > Corporate HQ > Building A  │ │
│ │ [Back] [Home] [Refresh]            │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌─Building Layout (SVG)──────────────┐ │
│ │                                    │ │
│ │   [North Wing]      [East Wing]    │ │
│ │        📷             📷📷         │ │
│ │                                    │ │
│ │   [Central Hub]     [South Wing]   │ │
│ │       🚪🚪              🚪         │ │
│ │                                    │ │
│ │   [West Wing]       [Service]      │ │
│ │       📷               ⚡           │ │
│ │                                    │ │
│ │ Zone Controls: [Zoom +/-] [Select] │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌─Guard Management (Footer)───────────┐ │
│ │                                     │ │
│ │ Guards Currently Active:            │ │
│ │ ┌─────┬─────────┬──────────┬──────┐ │ │
│ │ │ ID  │ Name    │ Status   │ Zone │ │ │
│ │ ├─────┼─────────┼──────────┼──────┤ │ │
│ │ │ 001 │ Garcia  │●Response │ A-E  │ │ │
│ │ │ 002 │ Chen    │●Patrol   │ A-N  │ │ │
│ │ │ 003 │ Davis   │○Break    │ A-W  │ │ │
│ │ │ 004 │ Wilson  │●Available│ B-1  │ │ │
│ │ └─────┴─────────┴──────────┴──────┘ │ │
│ │                                     │ │
│ │ [Assign] [Update Status] [Radio]    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Right Panel: Timeline (Current Implementation)

```
┌──────────────────────┐
│ Timeline             │
├──────────────────────┤
│                      │
│ ┌─Tab Controls─────┐ │
│ │[Incidents][Comms]│ │
│ └──────────────────┘ │
│                      │
│ ┌─Time Filter──────┐ │
│ │[15m][1h][4h][24h]│ │
│ └──────────────────┘ │
│                      │
│ ┌─Activity Feed────┐ │
│ │                  │ │
│ │ 14:31 ●Critical  │ │
│ │ Tailgating Alert │ │
│ │ Building A East  │ │
│ │ Status: Active   │ │
│ │ Assigned: Garcia │ │
│ │                  │ │
│ │ 14:29 📞Response │ │
│ │ "Responding to   │ │
│ │  alert, ETA 2m"  │ │
│ │ From: Garcia     │ │
│ │ Channel: 1       │ │
│ │                  │ │
│ │ 14:27 ✓Complete  │ │
│ │ Patrol Round B   │ │
│ │ Building B West  │ │
│ │ Completed: Chen  │ │
│ │                  │ │
│ │ 14:25 ⚠High      │ │
│ │ Door Sensor Fault│ │
│ │ Building C South │ │
│ │ Status: Pending  │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ ┌─Communication────┐ │
│ │                  │ │
│ │ [🎤Push to Talk] │ │
│ │ [📻Radio Modal]  │ │
│ │ [💬Full Comms]   │ │
│ │                  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

## Current Issues Identified

### Left Panel Problems:
```
INFORMATION HIDING:
┌────────────────┐
│ [Critical ▼] 3 │ ← Shows count but hides details
│ [High ▼] 4     │
│ [Medium ▶] 8   │ ← Collapsed = invisible
│ [Low ▶] 12     │ ← Collapsed = invisible
└────────────────┘

SCANNING INEFFICIENCY:
Priority groups require:
1. Click to expand section
2. Scroll through items
3. Click individual cards
4. No spatial context
```

### Center Panel Problems:
```
RUSSIAN DOLL NAVIGATION:
Sites → Buildings → Floors → Rooms → Assets
  ↓        ↓         ↓        ↓        ↓
 Click   Click    Click    Click    Click

NO REAL-TIME OVERLAY:
┌─Building Layout─┐
│ [Static zones]  │ ← No activity indicators
│ [No guard pos]  │ ← No personnel tracking
│ [No heat map]   │ ← No usage patterns
└─────────────────┘

RELEGATED GUARD INFO:
┌─Footer Strip────┐
│ Small text      │ ← Hard to see
│ Limited actions │ ← Not contextual
│ No map sync     │ ← Disconnected
└─────────────────┘
```

### Right Panel Problems:
```
TAB SWITCHING:
┌─────────────────┐
│[Incidents][Comm]│ ← Information split
└─────────────────┘
User must switch modes manually

NO CROSS-CORRELATION:
Activity in left panel ≠ Timeline item
No visual connection
No automatic filtering

STATIC DENSITY:
All items same size regardless of:
- Importance
- Recency  
- Relationship to current focus
```

## Information Flow Issues

```
CURRENT DATA FLOW (DISCONNECTED):
┌─LEFT────┐    ┌─CENTER──┐    ┌─RIGHT───┐
│Activity │    │Map      │    │Timeline │
│Stream   │    │View     │    │Events   │
│         │    │         │    │         │
│No sync  │    │No sync  │    │No sync  │
└─────────┘    └─────────┘    └─────────┘
     ↑              ↑              ↑
Independent    Independent    Independent
   State         State         State

PROBLEMS:
- Select activity → Map doesn't highlight location
- Click map zone → Activities don't filter
- Timeline event → No spatial or activity context
- Guard assignment → Manual correlation required
```

## Performance Issues

```
SCALABILITY PROBLEMS:

LEFT PANEL:
- 5000+ activities in memory
- All rendered simultaneously  
- No virtualization
- Collapsible sections help but limited

CENTER PANEL:
- SVG rendering for complex layouts
- No layer management
- Static guard updates
- Manual refresh required

RIGHT PANEL:
- Timeline grows indefinitely 
- No intelligent pruning
- All events same priority in rendering
- Communication threads not optimized

MEMORY USAGE:
┌─Component──┬─Items──┬─Memory─┐
│Activities  │ 5000+  │ High   │
│Guards      │ 15     │ Low    │
│Timeline    │ 1000+  │ Medium │
│Map Assets  │ 500+   │ Medium │
└────────────┴────────┴────────┘
```

This represents the current state that needs transformation into the improved system outlined in the comprehensive analysis.