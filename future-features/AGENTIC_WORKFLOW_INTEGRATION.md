# AGENTIC WORKFLOW INTEGRATION FOUNDATION

## 🎯 EXECUTIVE SUMMARY

When Celine arrives with her LangChain-developed agentic workflows for the SOP Manager, we need a complete integration foundation that allows:

1. **Instant Demo Capability**: One-click buttons to trigger workflows and show the entire process
2. **Visual Workflow Representation**: Real-time UI showing workflow execution from start to finish
3. **Seamless Integration**: LangChain outputs automatically become activities in our system
4. **Human-in-the-Loop Validation**: All agentic outputs require supervisor approval before becoming incidents

### Key Demo Scenarios Celine Will Want to Show:
- **Medical Emergency SOP**: Triggers comprehensive medical response workflow
- **Security Breach Investigation**: Multi-step investigation and containment workflow  
- **Tailgate Follow-up**: Complete identity verification and policy enforcement workflow
- **Equipment Failure Response**: Maintenance workflow with resource allocation

## 🏗️ TECHNICAL ARCHITECTURE

### Core Integration Philosophy
- **Activities as Workflow Outputs**: LangChain workflows create activities (not incidents directly)
- **Pending State Management**: All workflow-generated activities start as PENDING for human validation
- **Visual Feedback**: Real-time workflow execution visualization with gentle, non-anxiety-inducing animations
- **Audit Trail**: Complete accountability for all agentic decisions and human validations

### System Integration Points

```
┌─────────────────┐    HTTP/WebSocket    ┌──────────────────┐
│   LangChain     │◄──────────────────►│  Situ8 Platform  │
│   SOP Manager   │                    │                  │
└─────────────────┘                    └──────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────┐                    ┌──────────────────┐
│ Workflow Steps  │                    │ Activity System  │
│ • Medical SOP   │                    │ • Pending Queue  │
│ • Security SOP  │                    │ • Validation UI  │
│ • Maintenance   │                    │ • Human Approval │
└─────────────────┘                    └──────────────────┘
```

## 📋 IMPLEMENTATION COMPONENTS

### 1. Agentic Workflow Service
**File**: `services/agentic-workflow.service.ts`

```typescript
interface AgenticWorkflowService {
  // Core workflow operations
  triggerWorkflow(workflowType: WorkflowType, parameters: WorkflowParams): Promise<WorkflowExecution>
  getWorkflowStatus(executionId: string): Promise<WorkflowStatus>
  getActiveWorkflows(): Promise<WorkflowExecution[]>
  
  // Integration with activity system
  processWorkflowOutput(output: WorkflowOutput): Promise<EnterpriseActivity[]>
  createActivitiesFromWorkflow(execution: WorkflowExecution): Promise<void>
  
  // Real-time monitoring
  subscribeToWorkflowUpdates(callback: (update: WorkflowUpdate) => void): void
  unsubscribeFromWorkflowUpdates(): void
}

interface WorkflowExecution {
  id: string
  workflow_name: string
  workflow_type: WorkflowType
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_input'
  current_step: string
  total_steps: number
  completed_steps: number
  started_at: Date
  updated_at: Date
  parameters: WorkflowParams
  outputs: WorkflowOutput[]
  execution_log: WorkflowLogEntry[]
}
```

### 2. Workflow Trigger System
**Component**: `components/WorkflowTrigger.tsx`

Demo-ready button panel with pre-configured scenarios:

```typescript
interface WorkflowTriggerProps {
  onWorkflowTriggered: (execution: WorkflowExecution) => void
}

// Pre-configured demo scenarios
const DEMO_WORKFLOWS = {
  medical_emergency: {
    name: "Medical Emergency Response",
    description: "Complete SOP for medical incidents",
    icon: Heart,
    color: "bg-red-50 border-red-200 text-red-700",
    parameters: {
      location: "Building A - Cafeteria",
      severity: "high",
      time_of_day: "business_hours"
    }
  },
  security_breach: {
    name: "Security Breach Investigation", 
    description: "Multi-step security incident response",
    icon: Shield,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    parameters: {
      location: "Server Room B",
      breach_type: "unauthorized_access",
      confidence: 85
    }
  },
  tailgate_investigation: {
    name: "Tailgate Follow-up Workflow",
    description: "Identity verification and policy enforcement",
    icon: Users,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    parameters: {
      location: "Main Entrance",
      detection_confidence: 92,
      badge_holder: "John Doe"
    }
  }
}
```

### 3. Visual Workflow UI
**Component**: `components/WorkflowVisualization.tsx`

Real-time workflow step visualization with node-based diagram:

```typescript
interface WorkflowVisualizationProps {
  execution: WorkflowExecution
  onStepClick?: (step: WorkflowStep) => void
}

// Workflow step visualization
interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting'
  step_type: 'sop_step' | 'decision_point' | 'human_input' | 'output_generation'
  inputs: Record<string, any>
  outputs: Record<string, any>
  duration_ms?: number
}
```

**Visual Design Principles**:
- **Node-based diagram** with connected workflow steps
- **Color coding**:
  - Blue: SOP execution steps
  - Purple: AI decision points  
  - Green: Completed steps
  - Orange: Waiting for human input
  - Red: Error states
- **Gentle animations** following our non-anxiety-inducing design
- **Progress indicators** showing completion percentage
- **Expandable step details** with inputs/outputs

### 4. Enhanced Activity Types
**Enhanced**: `lib/types/activity.ts`

```typescript
interface AgenticWorkflowActivity extends BaseActivity {
  // Workflow identification
  workflow_execution_id: string
  workflow_name: string
  workflow_type: WorkflowType
  
  // Workflow context
  generated_by_workflow: boolean
  parent_workflow_step: string
  workflow_confidence_score: number
  
  // SOP reference
  sop_document_id?: string
  sop_section?: string
  sop_version?: string
  
  // AI decision context
  ai_reasoning?: string
  decision_factors?: Record<string, any>
  alternative_actions?: string[]
  
  // Human validation specific
  requires_workflow_validation: boolean
  workflow_validation_type: 'approve_reject' | 'parameter_adjustment' | 'full_review'
  validation_deadline?: Date
}

type WorkflowType = 
  | 'medical_emergency_sop'
  | 'security_breach_investigation' 
  | 'tailgate_follow_up'
  | 'equipment_failure_response'
  | 'fire_emergency_protocol'
  | 'visitor_management_workflow'
  | 'incident_escalation_sop'
```

### 5. Command Center Integration
**Enhanced**: `components/CommandCenter.tsx`

Add fourth panel: **Workflow Demo Panel**

```typescript
// Add to CommandCenter component
const [activeWorkflows, setActiveWorkflows] = useState<WorkflowExecution[]>([])
const [showWorkflowPanel, setShowWorkflowPanel] = useState(false)

// Panel content
<Card className="workflow-demo-panel">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Bot className="w-5 h-5" />
      Agentic Workflows
      {activeWorkflows.length > 0 && (
        <Badge variant="secondary">{activeWorkflows.length} Running</Badge>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <WorkflowTrigger onWorkflowTriggered={handleWorkflowTriggered} />
    <WorkflowMonitor executions={activeWorkflows} />
  </CardContent>
</Card>
```

### 6. Real-time Workflow Monitor
**Component**: `components/WorkflowMonitor.tsx`

Live execution status for all running workflows:

```typescript
interface WorkflowMonitorProps {
  executions: WorkflowExecution[]
  onExecutionClick?: (execution: WorkflowExecution) => void
}

// Features:
// - Live progress bars for each workflow
// - Step-by-step execution status
// - Execution time tracking
// - Success/failure metrics
// - Human intervention indicators
// - Quick actions (pause, cancel, view details)
```

## 🎨 VISUAL DESIGN SPECIFICATIONS

### Workflow Visualization Style Guide

**Node Design**:
```css
.workflow-node {
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.workflow-node.sop-step {
  background: linear-gradient(135deg, #EBF8FF, #BEE3F8);
  border: 2px solid #3182CE;
}

.workflow-node.decision-point {
  background: linear-gradient(135deg, #FAF5FF, #E9D8FD);
  border: 2px solid #805AD5;
}

.workflow-node.completed {
  background: linear-gradient(135deg, #F0FFF4, #C6F6D5);
  border: 2px solid #38A169;
}

.workflow-node.waiting {
  background: linear-gradient(135deg, #FFFBEB, #FED7AA);
  border: 2px solid #DD6B20;
  animation: gentle-pulse 2s ease-in-out infinite;
}
```

**Animation Specifications**:
```css
@keyframes workflow-step-complete {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes workflow-progress {
  0% { width: 0%; }
  100% { width: var(--progress-width); }
}

.workflow-connection {
  stroke: #4299E1;
  stroke-width: 2;
  fill: none;
  animation: workflow-flow 2s ease-in-out infinite;
}
```

### Demo Button Design
```typescript
const DemoButton = ({ workflow, onTrigger }) => (
  <button 
    className={`
      relative w-full p-4 rounded-lg border-2 transition-all duration-300
      ${workflow.color}
      hover:shadow-lg hover:scale-105
      interactive-gentle
    `}
    onClick={() => onTrigger(workflow)}
  >
    <div className="flex items-center gap-3">
      <workflow.icon className="w-6 h-6" />
      <div className="text-left">
        <h3 className="font-semibold">{workflow.name}</h3>
        <p className="text-sm opacity-80">{workflow.description}</p>
      </div>
    </div>
  </button>
)
```

## 🔄 INTEGRATION ARCHITECTURE

### LangChain Backend Integration

**API Endpoints**:
```typescript
// Trigger workflow
POST /api/workflows/trigger
{
  workflow_type: string
  parameters: Record<string, any>
  demo_mode?: boolean
}

// Get workflow status  
GET /api/workflows/{execution_id}/status

// Subscribe to workflow updates
WebSocket /api/workflows/stream
```

**Webhook Integration**:
```typescript
// LangChain sends updates to our system
POST /api/webhooks/workflow-update
{
  execution_id: string
  status: WorkflowStatus
  current_step: string
  outputs?: WorkflowOutput[]
  error?: string
}
```

**Activity Creation from Workflow Outputs**:
```typescript
interface WorkflowOutput {
  output_type: 'activity' | 'notification' | 'report' | 'escalation'
  activity_data?: Partial<AgenticWorkflowActivity>
  confidence_score: number
  reasoning: string
  recommended_actions: string[]
}

// Process workflow output into activities
const processWorkflowOutput = async (output: WorkflowOutput) => {
  if (output.output_type === 'activity') {
    const activity = await activityService.createActivity({
      ...output.activity_data,
      generated_by_workflow: true,
      workflow_confidence_score: output.confidence_score,
      ai_reasoning: output.reasoning,
      status: 'detecting', // Always starts pending for human validation
      system_tags: ['trigger:agentic-workflow', 'source:sop-manager']
    })
    
    // Show in pending validation queue with special styling
    return activity
  }
}
```

## 🚀 DEMO EXECUTION FLOW

### Standard Demo Sequence

**1. Demo Setup (30 seconds)**
```typescript
// User clicks "Medical Emergency Response" button
const triggerMedicalDemo = async () => {
  const execution = await agenticWorkflowService.triggerWorkflow('medical_emergency_sop', {
    location: 'Building A - Cafeteria',
    severity: 'high',
    reported_by: 'security_guard',
    symptoms: ['unconscious', 'breathing_difficulty'],
    demo_mode: true
  })
  
  // Show workflow visualization immediately
  setActiveWorkflow(execution)
  setShowWorkflowPanel(true)
}
```

**2. Visual Workflow Display (2-3 minutes)**
```
Workflow Steps Visualization:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Initial Triage │───►│ Resource Check  │───►│ Response Plan   │
│     [Running]   │    │   [Completed]   │    │    [Pending]    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Activity: Check │    │ Activity: Alert │    │ Activity: Prep  │
│ Vitals [PENDING]│    │ EMS [PENDING]   │    │ Area [PENDING]  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**3. Activity Stream Population (Real-time)**
- Activities appear in Command Center with gentle pop-up animations
- Each activity shows "Agentic Workflow" source badge
- Pending validation queue fills with workflow-generated activities
- Visual connection between workflow steps and created activities

**4. Human Validation Demo (1-2 minutes)**
- Supervisor reviews workflow-generated activities
- Shows approval/rejection interface
- Demonstrates human-in-the-loop decision making
- Activities become incidents only after human approval

### Advanced Demo Scenarios

**Multi-Step Security Investigation**:
```
1. Tailgate Detection (Ambient AI) → Triggers Security SOP
2. Identity Verification Workflow → Creates verification activities
3. Access Log Analysis → Generates audit activities  
4. Policy Violation Assessment → Creates compliance activities
5. Corrective Action Planning → Generates training activities
```

**Cross-System Integration Demo**:
```
1. Equipment Failure Alert → Triggers Maintenance SOP
2. Vendor Notification Workflow → Creates notification activities
3. Resource Allocation → Generates assignment activities
4. Safety Assessment → Creates inspection activities
5. Repair Tracking → Generates progress activities
```

## 📊 IMPLEMENTATION PHASES

### Phase 1: Core Integration Foundation (Ready for Celine)
**Timeline**: 1-2 weeks
**Priority**: HIGH

- [ ] Create `AgenticWorkflowService` with mock LangChain integration
- [ ] Build `WorkflowTrigger` component with demo buttons
- [ ] Implement basic `WorkflowVisualization` with node diagram
- [ ] Add `AgenticWorkflowActivity` interface to type system
- [ ] Create workflow-to-activity conversion logic
- [ ] Integrate with existing pending validation system

**Deliverables**:
- Working demo buttons that trigger mock workflows
- Visual workflow representation with progress tracking
- Activities created from workflow outputs with proper source badges
- Human validation workflow for agentic outputs

### Phase 2: Enhanced Demo Experience (Demo Polish)
**Timeline**: 1-2 weeks  
**Priority**: MEDIUM

- [ ] Advanced workflow visualization with animations
- [ ] Real-time progress monitoring and status updates
- [ ] Multiple concurrent workflow support
- [ ] Comprehensive demo scenarios (medical, security, maintenance)
- [ ] Workflow performance metrics and analytics
- [ ] Enhanced UI with gentle animations and transitions

**Deliverables**:
- Polished demo interface with professional animations
- Multiple workflow scenarios running simultaneously
- Comprehensive metrics and monitoring
- Customer-ready demo experience

### Phase 3: Production Integration (Full LangChain)
**Timeline**: 2-3 weeks
**Priority**: MEDIUM-LOW

- [ ] Full LangChain backend integration (when Celine's ready)
- [ ] WebSocket real-time communication
- [ ] Error handling and recovery mechanisms
- [ ] Workflow retry and rollback capabilities
- [ ] Advanced audit trail and compliance features
- [ ] Performance optimization and scaling

**Deliverables**:
- Production-ready LangChain integration
- Robust error handling and recovery
- Full audit compliance
- Scalable architecture for multiple workflows

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Service Architecture Pattern
```typescript
// services/agentic-workflow.service.ts
export class AgenticWorkflowService extends BaseService {
  private langchainClient: LangChainClient
  private workflowExecutions: Map<string, WorkflowExecution>
  private eventEmitter: EventEmitter
  
  async triggerWorkflow(type: WorkflowType, params: WorkflowParams) {
    const execution = await this.langchainClient.startWorkflow(type, params)
    this.workflowExecutions.set(execution.id, execution)
    this.eventEmitter.emit('workflow-started', execution)
    return execution
  }
  
  async processWorkflowUpdate(update: WorkflowUpdate) {
    const execution = this.workflowExecutions.get(update.execution_id)
    if (!execution) return
    
    // Update execution state
    Object.assign(execution, update)
    
    // Process any new outputs
    if (update.outputs) {
      for (const output of update.outputs) {
        await this.createActivityFromOutput(execution, output)
      }
    }
    
    this.eventEmitter.emit('workflow-updated', execution)
  }
  
  private async createActivityFromOutput(execution: WorkflowExecution, output: WorkflowOutput) {
    const activity = await this.activityService.createActivity({
      ...output.activity_data,
      workflow_execution_id: execution.id,
      workflow_name: execution.workflow_name,
      generated_by_workflow: true,
      workflow_confidence_score: output.confidence_score,
      ai_reasoning: output.reasoning,
      system_tags: ['trigger:agentic-workflow', `workflow:${execution.workflow_type}`],
      requires_workflow_validation: true
    })
    
    return activity
  }
}
```

### Component Integration Pattern
```typescript
// components/CommandCenter.tsx integration
const CommandCenter = () => {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([])
  const agenticService = useAgenticWorkflowService()
  
  useEffect(() => {
    const handleWorkflowUpdate = (execution: WorkflowExecution) => {
      setWorkflows(prev => 
        prev.map(w => w.id === execution.id ? execution : w)
      )
    }
    
    agenticService.on('workflow-updated', handleWorkflowUpdate)
    return () => agenticService.off('workflow-updated', handleWorkflowUpdate)
  }, [])
  
  const handleWorkflowTrigger = async (workflowType: WorkflowType, params: WorkflowParams) => {
    const execution = await agenticService.triggerWorkflow(workflowType, params)
    setWorkflows(prev => [...prev, execution])
  }
  
  return (
    <div className="command-center-grid">
      {/* Existing panels */}
      <ActivitiesPanel />
      <InteractiveMap />
      <Timeline />
      
      {/* New workflow panel */}
      <WorkflowPanel 
        workflows={workflows}
        onTriggerWorkflow={handleWorkflowTrigger}
      />
    </div>
  )
}
```

## 📝 SUCCESS CRITERIA

### Demo Readiness Checklist
- [ ] Single-click workflow triggering works reliably
- [ ] Visual workflow representation shows real-time progress
- [ ] Activities created from workflows appear in activity stream
- [ ] Source badges correctly identify agentic workflow origin
- [ ] Human validation workflow functions for agentic outputs
- [ ] Gentle animations and non-anxiety-inducing UI
- [ ] Multiple demo scenarios available (medical, security, maintenance)
- [ ] Workflow execution monitoring and status tracking
- [ ] Integration with existing pending validation system
- [ ] Complete audit trail for all workflow decisions

### Integration Success Metrics
- **Response Time**: Workflow trigger to visual feedback < 500ms
- **Activity Creation**: Workflow outputs to activity creation < 2s  
- **UI Responsiveness**: No blocking during workflow execution
- **Demo Reliability**: 99%+ success rate for demo scenarios
- **Visual Clarity**: All workflow steps clearly represented
- **Human Validation**: 100% of agentic outputs require approval

## 📚 REFERENCES & RESOURCES

### Existing Codebase Integration Points
- `services/activity.service.ts` - Activity creation and management
- `components/organisms/PendingCard.tsx` - Human validation UI
- `components/atoms/SourceBadge.tsx` - Source identification system
- `stores/activityStore.ts` - Activity state management
- `styles/animations.css` - Gentle animation system

### LangChain Integration Resources
- LangChain Python/TypeScript SDK documentation
- Workflow execution patterns and best practices
- WebSocket integration for real-time updates
- Error handling and retry mechanisms

### Demo Scenario Documentation
- SOP document templates for demo workflows
- Medical emergency response procedures
- Security incident investigation protocols
- Equipment maintenance workflow standards

---

## 🚨 IMPORTANT NOTES FOR IMPLEMENTATION

1. **Start with Mock Integration**: Build the entire UI and workflow system with mock LangChain responses first. This allows immediate demo capability while waiting for Celine's backend.

2. **Prioritize Visual Feedback**: The workflow visualization is the key differentiator. Users should see every step of the SOP execution in real-time.

3. **Maintain Human-in-the-Loop**: ALL agentic outputs must go through human validation. Never auto-create incidents from workflows.

4. **Follow Existing Patterns**: Use the same gentle animations, source badges, and pending validation patterns we've already established.

5. **Plan for Multiple Workflows**: Celine will likely have several SOP workflows. Design for concurrent execution from day one.

6. **Demo-First Approach**: Every component should be built with impressive demos in mind. The goal is to wow customers with the agentic workflow capabilities.

When Claude Code opens this file, they should have everything needed to immediately begin implementation without additional research or planning.