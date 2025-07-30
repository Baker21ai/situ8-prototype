# Passdowns & Reports Implementation Guide

## ⚠️ IMPORTANT INTEGRATION DISCLAIMER

**When implementing these modules into the existing Situ8 platform, the IDE AI must ensure:**

1. **Compatibility with Existing Systems**
   - All new code must integrate seamlessly with the current Activity-first architecture
   - Database schema changes must not break existing tables or relationships
   - API endpoints must follow established naming conventions and authentication patterns
   - Frontend components must use the existing design system and component library

2. **Dependency Verification**
   - Check that all referenced entities (activities, incidents, cases, users) exist in the current codebase
   - Verify that the permission system (RBAC) is properly implemented before adding role-based features
   - Ensure WebSocket infrastructure is in place for real-time updates
   - Confirm AI integration (Orchestr8) is available before implementing AI features

3. **Data Integrity**
   - All foreign key relationships must be properly established
   - Audit trail functionality must be extended to cover new features
   - Existing data must not be corrupted by new migrations
   - Activity linking must respect the established activity → incident → case hierarchy

4. **Testing Requirements**
   - Create unit tests for all new functions
   - Integration tests for API endpoints
   - Frontend component tests
   - End-to-end tests for critical workflows

---

## 📝 PASSDOWNS MODULE IMPLEMENTATION

### Core Purpose
Shift communication and handover documentation with comprehensive activity summaries and cross-site coordination.

### Database Schema

```sql
-- Passdowns table
CREATE TABLE passdowns (
    id VARCHAR(50) PRIMARY KEY, -- Format: PD-YYYY-NNNN-SHIFT-XXX
    author_id UUID NOT NULL REFERENCES users(id),
    from_shift VARCHAR(20) NOT NULL, -- 'day', 'evening', 'night'
    to_shift VARCHAR(20) NOT NULL,
    shift_date DATE NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id),
    notes TEXT,
    ai_summary TEXT,
    activity_summary JSONB, -- Stores activity counts and highlights
    critical_activities UUID[], -- Array of activity IDs requiring handover
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_shifts CHECK (from_shift != to_shift)
);

-- Read receipts table
CREATE TABLE passdown_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passdown_id VARCHAR(50) REFERENCES passdowns(id),
    user_id UUID REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(passdown_id, user_id)
);

-- Passdown activity references (junction table)
CREATE TABLE passdown_activities (
    passdown_id VARCHAR(50) REFERENCES passdowns(id),
    activity_id UUID REFERENCES activities(id),
    highlight_reason VARCHAR(100), -- 'critical', 'unresolved', 'pattern'
    PRIMARY KEY (passdown_id, activity_id)
);

-- Indexes for performance
CREATE INDEX idx_passdowns_shift_date ON passdowns(shift_date, from_shift);
CREATE INDEX idx_passdowns_location ON passdowns(location_id);
CREATE INDEX idx_passdowns_author ON passdowns(author_id);
CREATE INDEX idx_passdown_activities_activity ON passdown_activities(activity_id);
```

### API Endpoints

```typescript
// Passdown endpoints
interface PassdownAPI {
    // List passdowns with filters
    GET: '/api/passdowns' 
    Query: {
        location_id?: string
        shift_date?: string
        from_shift?: 'day' | 'evening' | 'night'
        to_shift?: 'day' | 'evening' | 'night'
        author_id?: string
        limit?: number
        offset?: number
    }
    Response: {
        passdowns: Passdown[]
        total: number
    }

    // Create new passdown
    POST: '/api/passdowns'
    Body: {
        from_shift: string
        to_shift: string
        shift_date: string
        location_id: string
        notes?: string
        critical_activity_ids?: string[]
    }
    Response: {
        passdown: Passdown
        auto_generated_summary: ActivitySummary
    }

    // Get passdown details
    GET: '/api/passdowns/:id'
    Response: {
        passdown: Passdown
        activities: Activity[]
        read_receipts: ReadReceipt[]
    }

    // Update passdown (within 24 hours)
    PUT: '/api/passdowns/:id'
    Body: {
        notes?: string
        critical_activity_ids?: string[]
    }
    Response: {
        passdown: Passdown
    }

    // Get current shift summary
    GET: '/api/passdowns/current-shift-summary'
    Query: {
        location_id: string
        shift: 'day' | 'evening' | 'night'
    }
    Response: {
        activity_counts: {
            patrol: { completed: number, pending: number }
            alert: { processed: number, escalated: number }
            medical: { resolved: number, active: number }
            // ... other types
        }
        critical_activities: Activity[]
        patterns: AIPattern[]
        recommendations: string[]
    }

    // Mark passdown as read
    POST: '/api/passdowns/:id/read'
    Response: {
        read_receipt: ReadReceipt
    }
}
```

### Frontend Components

```typescript
// PassdownDashboard.tsx
interface PassdownDashboardProps {
    currentShift: 'day' | 'evening' | 'night'
    locationId: string
}

const PassdownDashboard: React.FC<PassdownDashboardProps> = ({ currentShift, locationId }) => {
    // Real-time activity tracking
    const { activities, unresolved } = useShiftActivities(currentShift, locationId)
    const { passdowns } = usePassdowns({ location_id: locationId, limit: 10 })
    
    return (
        <div className="passdown-dashboard">
            <ShiftHeader 
                shift={currentShift}
                activityCount={activities.length}
                unresolvedCount={unresolved.length}
            />
            <ActivitySummaryWidget activities={activities} />
            <CriticalActivitiesPanel activities={unresolved.filter(a => a.priority === 'critical')} />
            <RecentPassdownsList passdowns={passdowns} />
        </div>
    )
}

// PassdownCreateForm.tsx
interface PassdownCreateFormProps {
    fromShift: string
    toShift: string
    onSubmit: (passdown: Passdown) => void
}

const PassdownCreateForm: React.FC<PassdownCreateFormProps> = ({ fromShift, toShift, onSubmit }) => {
    const { summary, criticalActivities } = useShiftSummary(fromShift)
    const [notes, setNotes] = useState('')
    const [selectedActivities, setSelectedActivities] = useState<string[]>([])
    
    // AI-generated insights
    const { insights, loading } = useAIInsights(summary)
    
    return (
        <form className="passdown-create-form">
            <ShiftTransitionHeader from={fromShift} to={toShift} />
            <ActivitySummarySection summary={summary} />
            <AIInsightsPanel insights={insights} loading={loading} />
            <CriticalActivitySelector 
                activities={criticalActivities}
                selected={selectedActivities}
                onChange={setSelectedActivities}
            />
            <NotesEditor value={notes} onChange={setNotes} />
            <SubmitButton onClick={() => handleSubmit()} />
        </form>
    )
}
```

### AI Integration

```typescript
// Coordinator AI Analysis for Passdowns
interface CoordinatorAnalysis {
    analyzeShiftActivities(activities: Activity[]): {
        patterns: Pattern[]
        anomalies: Anomaly[]
        recommendations: string[]
        priorities: PriorityItem[]
    }
    
    generatePassdownSummary(data: {
        activities: Activity[]
        incidents: Incident[]
        unresolved: Activity[]
    }): string
    
    crossSiteCorrelation(sites: Site[]): {
        sharedPatterns: Pattern[]
        resourceNeeds: ResourceRequest[]
        alerts: CrossSiteAlert[]
    }
}
```

---

## 📊 REPORTS MODULE - FIRST 3 REPORTS

### Database Queries

```sql
-- 1. DAILY ACTIVITY SUMMARY QUERIES

-- Main activity summary
CREATE OR REPLACE VIEW daily_activity_summary AS
SELECT 
    DATE(a.created_at) as report_date,
    a.type,
    a.trigger,
    a.status,
    a.location_id,
    l.name as location_name,
    COUNT(*) as count,
    AVG(CASE 
        WHEN a.response_started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (a.response_started_at - a.created_at))/60 
        ELSE NULL 
    END) as avg_response_minutes,
    COUNT(CASE WHEN ai.id IS NOT NULL THEN 1 END) as incidents_created
FROM activities a
LEFT JOIN locations l ON a.location_id = l.id
LEFT JOIN activity_incidents ai ON a.id = ai.activity_id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY DATE(a.created_at), a.type, a.trigger, a.status, a.location_id, l.name;

-- Notable events summary
CREATE OR REPLACE VIEW daily_notable_events AS
SELECT 
    a.id,
    a.type,
    a.title,
    a.created_at,
    a.status,
    i.id as incident_id,
    i.priority
FROM activities a
LEFT JOIN activity_incidents ai ON a.id = ai.activity_id
LEFT JOIN incidents i ON ai.incident_id = i.id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '24 hours'
    AND a.type IN ('medical', 'security-breach', 'bol-event')
ORDER BY a.created_at DESC;

-- 2. WEEKLY INCIDENT REPORT QUERIES

-- Incident trends by day
CREATE OR REPLACE VIEW weekly_incident_trends AS
SELECT 
    DATE(i.created_at) as incident_date,
    i.type,
    i.priority,
    i.status,
    COUNT(*) as incident_count,
    AVG(CASE 
        WHEN i.resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/60 
        ELSE NULL 
    END) as avg_resolution_minutes,
    COUNT(CASE WHEN i.auto_created THEN 1 END) as auto_created_count,
    COUNT(CASE WHEN NOT i.auto_created THEN 1 END) as manual_created_count
FROM incidents i
WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(i.created_at), i.type, i.priority, i.status;

-- Response time distribution
CREATE OR REPLACE VIEW weekly_response_distribution AS
SELECT 
    i.type,
    CASE 
        WHEN response_minutes < 2 THEN '<2 min'
        WHEN response_minutes < 5 THEN '2-5 min'
        WHEN response_minutes < 10 THEN '5-10 min'
        ELSE '>10 min'
    END as response_bucket,
    COUNT(*) as count
FROM (
    SELECT 
        i.type,
        EXTRACT(EPOCH FROM (MIN(a.response_started_at) - i.created_at))/60 as response_minutes
    FROM incidents i
    JOIN activity_incidents ai ON i.id = ai.incident_id
    JOIN activities a ON ai.activity_id = a.id
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND a.response_started_at IS NOT NULL
    GROUP BY i.id, i.type
) response_times
GROUP BY type, response_bucket;

-- 3. MONTHLY CASE METRICS QUERIES

-- Case overview
CREATE OR REPLACE VIEW monthly_case_overview AS
SELECT 
    c.status,
    c.type,
    c.priority,
    COUNT(DISTINCT c.id) as case_count,
    COUNT(DISTINCT i.id) as total_incidents,
    COUNT(DISTINCT a.id) as evidence_activities,
    AVG(CASE 
        WHEN c.closed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.closed_at - c.created_at))/86400 
        ELSE NULL 
    END) as avg_duration_days,
    AVG(oracle_confidence_score) as avg_confidence
FROM cases c
LEFT JOIN case_incidents ci ON c.id = ci.case_id
LEFT JOIN incidents i ON ci.incident_id = i.id
LEFT JOIN activities a ON a.case_id = c.id AND a.type = 'evidence'
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.status, c.type, c.priority;

-- Investigator performance
CREATE OR REPLACE VIEW monthly_investigator_performance AS
SELECT 
    u.id as user_id,
    u.name as investigator_name,
    COUNT(DISTINCT c.id) as cases_assigned,
    COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END) as cases_closed,
    AVG(CASE 
        WHEN c.closed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.closed_at - c.created_at))/86400 
        ELSE NULL 
    END) as avg_resolution_days,
    COUNT(DISTINCT a.id) as evidence_collected
FROM users u
JOIN case_assignments ca ON u.id = ca.user_id
JOIN cases c ON ca.case_id = c.id
LEFT JOIN activities a ON a.case_id = c.id AND a.type = 'evidence' AND a.created_by = u.id
WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.name;
```

### Report Generation Service

```typescript
// ReportGenerationService.ts
interface ReportGenerationService {
    generateDailyActivitySummary(params: {
        date: Date
        locationIds?: string[]
        includeResolved?: boolean
    }): Promise<DailyActivityReport>
    
    generateWeeklyIncidentReport(params: {
        startDate: Date
        endDate: Date
        locationIds?: string[]
        incidentTypes?: string[]
    }): Promise<WeeklyIncidentReport>
    
    generateMonthlyCaseMetrics(params: {
        month: number
        year: number
        locationIds?: string[]
        teamIds?: string[]
    }): Promise<MonthlyCaseReport>
    
    scheduleReport(params: {
        reportType: 'daily' | 'weekly' | 'monthly'
        schedule: CronExpression
        recipients: string[]
        format: 'pdf' | 'excel' | 'csv'
    }): Promise<ScheduledReport>
}

// Report interfaces
interface DailyActivityReport {
    executiveSummary: {
        totalActivities: number
        incidentsCreated: number
        casesOpened: number
        casesClosed: number
        criticalEvents: CriticalEvent[]
    }
    activityBreakdown: {
        byType: TypeCount[]
        byLocation: LocationCount[]
        byTrigger: TriggerCount[]
        byStatus: StatusCount[]
    }
    incidentSummary: {
        total: number
        byPriority: PriorityCount[]
        avgResponseTime: number
        resolutionRate: number
    }
    notableEvents: NotableEvent[]
    performanceMetrics: {
        avgResponseTime: number
        activitiesPerGuard: number
        autoIncidentAccuracy: number
    }
}

interface WeeklyIncidentReport {
    weekOverview: {
        totalIncidents: number
        weekOverWeekChange: number
        dailyDistribution: DailyCount[]
    }
    incidentAnalysis: {
        byType: TypeAnalysis[]
        byLocation: LocationAnalysis[]
        byCreationMethod: CreationMethodCount[]
        byPriority: PriorityAnalysis[]
    }
    responseMetrics: {
        avgByType: TypeResponseTime[]
        trends: ResponseTrend[]
        slaCompliance: number
    }
    resolutionAnalysis: {
        resolvedCount: number
        openCount: number
        avgResolutionTime: number
        escalationPatterns: EscalationPattern[]
    }
    topContributors: {
        guards: GuardPerformance[]
        locations: LocationActivity[]
        peakTimes: PeakTime[]
    }
}

interface MonthlyCaseReport {
    caseOverview: {
        newCases: number
        activeCases: number
        closedCases: number
        monthOverMonthChange: number
        distributionByType: TypeDistribution[]
    }
    investigationMetrics: {
        avgCaseDuration: number
        casesByStatus: StatusCount[]
        evidencePerCase: number
        crossSiteCases: number
    }
    teamPerformance: {
        casesPerInvestigator: InvestigatorMetric[]
        avgResolutionByTeam: TeamMetric[]
        evidenceCollectionRates: EvidenceRate[]
    }
    patternAnalysis: {
        commonCaseTypes: CaseTypePattern[]
        repeatLocations: LocationPattern[]
        timePatterns: TimePattern[]
    }
    oracleInsights: {
        patternConfidence: ConfidenceScore[]
        focusAreas: string[]
        similarCases: CaseCorrelation[]
    }
}
```

### Report UI Components

```typescript
// ReportLibrary.tsx
const ReportLibrary: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<string>()
    const [generatingReport, setGeneratingReport] = useState(false)
    const { queue, refresh: refreshQueue } = useReportQueue()
    
    const reports = [
        {
            id: 'daily-activity',
            name: 'Daily Activity Summary',
            description: 'All activities, incidents, and cases from past 24 hours',
            lastRun: '2 hours ago',
            schedule: 'Daily at 08:00',
            icon: '📅'
        },
        {
            id: 'weekly-incident',
            name: 'Weekly Incident Report',
            description: 'Incident trends, response times, resolution rates',
            lastRun: 'Monday 08:00',
            schedule: 'Weekly on Mondays',
            icon: '📈'
        },
        {
            id: 'monthly-case',
            name: 'Monthly Case Metrics',
            description: 'Case closure rates, investigation duration, team performance',
            lastRun: '1st of month',
            schedule: 'Monthly on 1st',
            icon: '📊'
        }
    ]
    
    return (
        <div className="report-library">
            <div className="report-grid">
                {reports.map(report => (
                    <ReportCard
                        key={report.id}
                        report={report}
                        onRun={() => handleRunReport(report.id)}
                        onSchedule={() => handleScheduleReport(report.id)}
                        onView={() => handleViewReport(report.id)}
                    />
                ))}
            </div>
            <ReportQueue queue={queue} onRefresh={refreshQueue} />
        </div>
    )
}

// ReportGenerator.tsx
const ReportGenerator: React.FC<{ reportType: string }> = ({ reportType }) => {
    const [filters, setFilters] = useState<ReportFilters>({
        dateRange: 'last24hours',
        locations: [],
        includeResolved: true
    })
    const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
    const [preview, setPreview] = useState<any>()
    
    const handleGenerate = async () => {
        const report = await generateReport(reportType, filters)
        setPreview(report)
    }
    
    return (
        <div className="report-generator">
            <ReportFilters
                reportType={reportType}
                filters={filters}
                onChange={setFilters}
            />
            <FormatSelector
                format={format}
                onChange={setFormat}
                availableFormats={['pdf', 'excel', 'csv']}
            />
            <div className="actions">
                <Button onClick={handleGenerate}>Preview Report</Button>
                <Button onClick={() => downloadReport(preview, format)}>
                    Download
                </Button>
                <Button onClick={() => scheduleReport(reportType, filters)}>
                    Schedule
                </Button>
            </div>
            {preview && <ReportPreview report={preview} />}
        </div>
    )
}
```

### Performance Optimization

```typescript
// Report caching strategy
interface ReportCache {
    key: string // Generated from report type + filters
    data: any
    generatedAt: Date
    expiresAt: Date
}

class ReportCacheService {
    private cache = new Map<string, ReportCache>()
    private readonly TTL = 3600000 // 1 hour
    
    getCached(reportType: string, filters: any): any | null {
        const key = this.generateKey(reportType, filters)
        const cached = this.cache.get(key)
        
        if (cached && cached.expiresAt > new Date()) {
            return cached.data
        }
        
        return null
    }
    
    setCached(reportType: string, filters: any, data: any): void {
        const key = this.generateKey(reportType, filters)
        this.cache.set(key, {
            key,
            data,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + this.TTL)
        })
    }
    
    private generateKey(reportType: string, filters: any): string {
        return `${reportType}:${JSON.stringify(filters)}`
    }
}

// Background job processing
class ReportQueueProcessor {
    async processQueue() {
        const pendingReports = await this.getPendingReports()
        
        for (const report of pendingReports) {
            try {
                await this.updateStatus(report.id, 'processing')
                const data = await this.generateReportData(report)
                const file = await this.formatReport(data, report.format)
                await this.saveReport(report.id, file)
                await this.updateStatus(report.id, 'completed')
                await this.notifyUser(report.userId, report.id)
            } catch (error) {
                await this.updateStatus(report.id, 'failed', error.message)
            }
        }
    }
}
```

## 🔄 Integration Checklist

Before implementing these modules, verify:

- [ ] **Database**
  - [ ] Activities table exists with required fields
  - [ ] Incidents table has proper relationships
  - [ ] Cases table is implemented
  - [ ] Users table has RBAC fields
  - [ ] Locations table with hierarchy

- [ ] **Backend**
  - [ ] Authentication middleware is configured
  - [ ] Permission checking is implemented
  - [ ] WebSocket server is running
  - [ ] AI integration (Orchestr8) is available
  - [ ] Background job processing is set up

- [ ] **Frontend**
  - [ ] Component library is established
  - [ ] State management is configured
  - [ ] WebSocket client is implemented
  - [ ] Design system tokens are available
  - [ ] Routing is properly configured

- [ ] **Infrastructure**
  - [ ] File storage for report exports
  - [ ] Email service for notifications
  - [ ] Caching layer (Redis/similar)
  - [ ] Job queue system
  - [ ] Monitoring/logging

## 🧪 Testing Strategy

```typescript
// Example test structure
describe('Passdowns Module', () => {
    describe('API', () => {
        test('creates passdown with activity summary', async () => {
            const response = await api.post('/api/passdowns', {
                from_shift: 'day',
                to_shift: 'evening',
                shift_date: '2024-01-15',
                location_id: 'test-location'
            })
            
            expect(response.status).toBe(201)
            expect(response.data.passdown).toHaveProperty('id')
            expect(response.data.auto_generated_summary).toBeDefined()
        })
        
        test('enforces 24-hour edit window', async () => {
            const oldPassdown = await createPassdown({ 
                created_at: new Date(Date.now() - 25 * 60 * 60 * 1000) 
            })
            
            const response = await api.put(`/api/passdowns/${oldPassdown.id}`, {
                notes: 'Updated notes'
            })
            
            expect(response.status).toBe(403)
        })
    })
})

describe('Reports Module', () => {
    describe('Report Generation', () => {
        test('generates daily activity summary', async () => {
            // Seed test data
            await seedActivities(50)
            await seedIncidents(10)
            
            const report = await reportService.generateDailyActivitySummary({
                date: new Date(),
                includeResolved: true
            })
            
            expect(report.executiveSummary.totalActivities).toBe(50)
            expect(report.activityBreakdown.byType).toBeDefined()
            expect(report.performanceMetrics.avgResponseTime).toBeGreaterThan(0)
        })
    })
})
```

## 📝 Notes for Implementers

1. **State Management**: Consider using Redux/Zustand for complex state in reports
2. **Real-time Updates**: Implement WebSocket subscriptions for live dashboards
3. **Error Handling**: Add comprehensive error boundaries and fallbacks
4. **Accessibility**: Ensure all components are keyboard navigable and screen reader friendly
5. **Performance**: Implement virtual scrolling for large data sets
6. **Security**: Validate all inputs and sanitize outputs, especially in reports

This guide provides the complete specification for implementing the Passdowns and Reports modules while ensuring proper integration with the existing Situ8 platform.