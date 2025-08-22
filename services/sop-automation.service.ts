import { Alert, AlertType, AlertPriority } from '../stores/alertStore';

export interface SOPStep {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number; // in seconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiredClearanceLevel: number;
  autoExecutable: boolean;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  assignedGuard?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  verification?: {
    required: boolean;
    method: 'photo' | 'signature' | 'witness' | 'sensor';
    completed: boolean;
    evidence?: string;
  };
}

export interface SOPProtocol {
  id: string;
  name: string;
  alertType: AlertType;
  priority: AlertPriority;
  description: string;
  estimatedTotalDuration: number;
  steps: SOPStep[];
  isActive: boolean;
  compliance: {
    industry: string[];
    regulations: string[];
    auditRequired: boolean;
  };
}

export interface SOPExecution {
  id: string;
  protocolId: string;
  alertId: string;
  status: 'active' | 'completed' | 'escalated' | 'aborted';
  startedAt: string;
  completedAt?: string;
  steps: SOPStep[];
  assignedPersonnel: string[];
  escalationLevel: number;
  notes: string[];
  completionPercentage: number;
}

class SOPAutomationService {
  private static instance: SOPAutomationService;
  private protocols: SOPProtocol[] = [];
  private activeExecutions: Map<string, SOPExecution> = new Map();

  private constructor() {
    this.initializeProtocols();
  }

  public static getInstance(): SOPAutomationService {
    if (!SOPAutomationService.instance) {
      SOPAutomationService.instance = new SOPAutomationService();
    }
    return SOPAutomationService.instance;
  }

  private initializeProtocols() {
    this.protocols = [
      // Weapon Detection Protocol
      {
        id: 'weapon_detection_protocol',
        name: 'Weapon Detection Response Protocol',
        alertType: 'weapon_detection',
        priority: 'critical',
        description: 'Immediate response protocol for confirmed weapon detection',
        estimatedTotalDuration: 300,
        isActive: true,
        compliance: {
          industry: ['education', 'corporate', 'government'],
          regulations: ['OSHA', 'DHS Guidelines'],
          auditRequired: true
        },
        steps: [
          {
            id: 'wd_001',
            title: 'Immediate Lockdown Assessment',
            description: 'Assess if facility lockdown is required based on threat level',
            estimatedDuration: 30,
            priority: 'critical',
            requiredClearanceLevel: 3,
            autoExecutable: false,
            dependencies: [],
            status: 'pending',
            verification: {
              required: true,
              method: 'signature',
              completed: false
            }
          },
          {
            id: 'wd_002',
            title: 'Alert Law Enforcement',
            description: 'Immediately contact local law enforcement and provide situation details',
            estimatedDuration: 120,
            priority: 'critical',
            requiredClearanceLevel: 2,
            autoExecutable: true,
            dependencies: ['wd_001'],
            status: 'pending',
            verification: {
              required: true,
              method: 'witness',
              completed: false
            }
          },
          {
            id: 'wd_003',
            title: 'Secure Perimeter',
            description: 'Deploy security personnel to establish safe perimeter around threat area',
            estimatedDuration: 180,
            priority: 'high',
            requiredClearanceLevel: 2,
            autoExecutable: false,
            dependencies: ['wd_001'],
            status: 'pending',
            verification: {
              required: true,
              method: 'photo',
              completed: false
            }
          },
          {
            id: 'wd_004',
            title: 'Evacuate Civilians',
            description: 'Coordinate civilian evacuation from threat area if safe to do so',
            estimatedDuration: 300,
            priority: 'high',
            requiredClearanceLevel: 1,
            autoExecutable: false,
            dependencies: ['wd_003'],
            status: 'pending',
            verification: {
              required: true,
              method: 'witness',
              completed: false
            }
          },
          {
            id: 'wd_005',
            title: 'Document Incident',
            description: 'Create detailed incident report with timeline and actions taken',
            estimatedDuration: 900,
            priority: 'medium',
            requiredClearanceLevel: 2,
            autoExecutable: false,
            dependencies: ['wd_002', 'wd_004'],
            status: 'pending',
            verification: {
              required: true,
              method: 'signature',
              completed: false
            }
          }
        ]
      },

      // Perimeter Breach Protocol
      {
        id: 'perimeter_breach_protocol',
        name: 'Perimeter Breach Response Protocol',
        alertType: 'perimeter_breach',
        priority: 'high',
        description: 'Standard response for unauthorized perimeter access',
        estimatedTotalDuration: 600,
        isActive: true,
        compliance: {
          industry: ['corporate', 'industrial', 'government'],
          regulations: ['Security Industry Standards'],
          auditRequired: false
        },
        steps: [
          {
            id: 'pb_001',
            title: 'Verify Breach',
            description: 'Confirm perimeter breach through multiple sensors/cameras',
            estimatedDuration: 60,
            priority: 'high',
            requiredClearanceLevel: 1,
            autoExecutable: true,
            dependencies: [],
            status: 'pending',
            verification: {
              required: true,
              method: 'sensor',
              completed: false
            }
          },
          {
            id: 'pb_002',
            title: 'Dispatch Security',
            description: 'Send nearest available security personnel to breach location',
            estimatedDuration: 180,
            priority: 'high',
            requiredClearanceLevel: 2,
            autoExecutable: false,
            dependencies: ['pb_001'],
            status: 'pending',
            verification: {
              required: true,
              method: 'photo',
              completed: false
            }
          },
          {
            id: 'pb_003',
            title: 'Access Control Review',
            description: 'Check all access points and review recent entry logs',
            estimatedDuration: 300,
            priority: 'medium',
            requiredClearanceLevel: 2,
            autoExecutable: true,
            dependencies: ['pb_001'],
            status: 'pending',
            verification: {
              required: false,
              method: 'signature',
              completed: false
            }
          },
          {
            id: 'pb_004',
            title: 'Secure Area',
            description: 'Ensure breached area is secured and no further access possible',
            estimatedDuration: 240,
            priority: 'high',
            requiredClearanceLevel: 2,
            autoExecutable: false,
            dependencies: ['pb_002'],
            status: 'pending',
            verification: {
              required: true,
              method: 'photo',
              completed: false
            }
          }
        ]
      },

      // Loitering Protocol
      {
        id: 'loitering_protocol',
        name: 'Loitering Response Protocol',
        alertType: 'loitering',
        priority: 'medium',
        description: 'Standard approach for handling loitering situations',
        estimatedTotalDuration: 900,
        isActive: true,
        compliance: {
          industry: ['retail', 'corporate', 'education'],
          regulations: ['Local Ordinances'],
          auditRequired: false
        },
        steps: [
          {
            id: 'lt_001',
            title: 'Monitor Behavior',
            description: 'Continue monitoring subject behavior for escalation signs',
            estimatedDuration: 300,
            priority: 'low',
            requiredClearanceLevel: 1,
            autoExecutable: true,
            dependencies: [],
            status: 'pending',
            verification: {
              required: false,
              method: 'photo',
              completed: false
            }
          },
          {
            id: 'lt_002',
            title: 'Verbal Warning',
            description: 'Approach subject and provide polite verbal warning about loitering policy',
            estimatedDuration: 180,
            priority: 'medium',
            requiredClearanceLevel: 1,
            autoExecutable: false,
            dependencies: ['lt_001'],
            status: 'pending',
            verification: {
              required: true,
              method: 'witness',
              completed: false
            }
          },
          {
            id: 'lt_003',
            title: 'Documentation',
            description: 'Document interaction and subject response for records',
            estimatedDuration: 120,
            priority: 'low',
            requiredClearanceLevel: 1,
            autoExecutable: false,
            dependencies: ['lt_002'],
            status: 'pending',
            verification: {
              required: true,
              method: 'signature',
              completed: false
            }
          }
        ]
      }
    ];
  }

  public getProtocolForAlert(alert: Alert): SOPProtocol | null {
    return this.protocols.find(p => 
      p.alertType === alert.alertType && 
      p.priority === alert.priority && 
      p.isActive
    ) || this.protocols.find(p => 
      p.alertType === alert.alertType && 
      p.isActive
    ) || null;
  }

  public initiateSOPExecution(alert: Alert): SOPExecution | null {
    const protocol = this.getProtocolForAlert(alert);
    if (!protocol) return null;

    const execution: SOPExecution = {
      id: `sop_exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      protocolId: protocol.id,
      alertId: alert.id,
      status: 'active',
      startedAt: new Date().toISOString(),
      steps: protocol.steps.map(step => ({ ...step })),
      assignedPersonnel: [],
      escalationLevel: 1,
      notes: [],
      completionPercentage: 0
    };

    this.activeExecutions.set(execution.id, execution);
    this.autoExecuteAvailableSteps(execution.id);
    
    return execution;
  }

  public updateStepStatus(
    executionId: string, 
    stepId: string, 
    status: SOPStep['status'],
    notes?: string,
    evidence?: string
  ): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) return false;

    step.status = status;
    step.notes = notes;

    if (status === 'in_progress') {
      step.startedAt = new Date().toISOString();
    } else if (status === 'completed') {
      step.completedAt = new Date().toISOString();
      if (step.verification && evidence) {
        step.verification.evidence = evidence;
        step.verification.completed = true;
      }
    }

    this.updateExecutionProgress(executionId);
    this.autoExecuteAvailableSteps(executionId);

    return true;
  }

  public assignStepToGuard(executionId: string, stepId: string, guardId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) return false;

    step.assignedGuard = guardId;
    if (!execution.assignedPersonnel.includes(guardId)) {
      execution.assignedPersonnel.push(guardId);
    }

    return true;
  }

  private autoExecuteAvailableSteps(executionId: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    const availableSteps = execution.steps.filter(step => {
      // Step must be pending and auto-executable
      if (step.status !== 'pending' || !step.autoExecutable) return false;

      // All dependencies must be completed
      return step.dependencies.every(depId => {
        const depStep = execution.steps.find(s => s.id === depId);
        return depStep?.status === 'completed';
      });
    });

    // Auto-execute available steps
    availableSteps.forEach(step => {
      step.status = 'in_progress';
      step.startedAt = new Date().toISOString();

      // Simulate auto-execution
      setTimeout(() => {
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        if (step.verification && !step.verification.required) {
          step.verification.completed = true;
        }
        this.updateExecutionProgress(executionId);
        this.autoExecuteAvailableSteps(executionId);
      }, Math.random() * 3000 + 1000); // 1-4 seconds simulation
    });
  }

  private updateExecutionProgress(executionId: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
    execution.completionPercentage = (completedSteps / execution.steps.length) * 100;

    if (execution.completionPercentage === 100) {
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
    }
  }

  public getActiveExecutions(): SOPExecution[] {
    return Array.from(this.activeExecutions.values()).filter(e => e.status === 'active');
  }

  public getExecutionById(executionId: string): SOPExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  public getNextAvailableSteps(executionId: string): SOPStep[] {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return [];

    return execution.steps.filter(step => {
      // Step must be pending
      if (step.status !== 'pending') return false;

      // All dependencies must be completed
      return step.dependencies.every(depId => {
        const depStep = execution.steps.find(s => s.id === depId);
        return depStep?.status === 'completed';
      });
    });
  }

  public escalateExecution(executionId: string, reason: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.escalationLevel++;
    execution.notes.push(`Escalated to level ${execution.escalationLevel}: ${reason}`);

    if (execution.escalationLevel >= 3) {
      execution.status = 'escalated';
      // In real implementation: notify management, trigger additional protocols
    }

    return true;
  }

  public abortExecution(executionId: string, reason: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    execution.status = 'aborted';
    execution.completedAt = new Date().toISOString();
    execution.notes.push(`Execution aborted: ${reason}`);

    return true;
  }

  public generateComplianceReport(executionId: string): any {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return null;

    const protocol = this.protocols.find(p => p.id === execution.protocolId);
    if (!protocol) return null;

    return {
      executionId: execution.id,
      protocolName: protocol.name,
      alertId: execution.alertId,
      startTime: execution.startedAt,
      endTime: execution.completedAt,
      duration: execution.completedAt 
        ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
        : null,
      completionPercentage: execution.completionPercentage,
      status: execution.status,
      assignedPersonnel: execution.assignedPersonnel,
      escalationLevel: execution.escalationLevel,
      complianceFactors: {
        allStepsCompleted: execution.steps.every(s => s.status === 'completed'),
        verificationComplete: execution.steps
          .filter(s => s.verification?.required)
          .every(s => s.verification?.completed),
        timelyExecution: true, // Could be calculated based on step timing
        properDocumentation: execution.steps
          .filter(s => s.verification?.method === 'signature')
          .every(s => s.verification?.completed)
      },
      steps: execution.steps.map(step => ({
        id: step.id,
        title: step.title,
        status: step.status,
        assignedGuard: step.assignedGuard,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        verificationCompleted: step.verification?.completed || false,
        notes: step.notes
      }))
    };
  }
}

export default SOPAutomationService;