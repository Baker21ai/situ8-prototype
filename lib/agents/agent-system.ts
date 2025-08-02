/**
 * Agentic AI System for Situ8 Incident Management
 * Implements multi-agent orchestration with memory and learning
 */

import { Incident, IncidentType, IncidentStatus } from '../types/incident';
import { BaseActivity } from '../types/activity';
import { Case } from '../types/case';

// Agent Memory Interface
export interface AgentMemory {
  conversations: ConversationEntry[];
  learned_patterns: Record<string, any>;
  success_metrics: SuccessMetrics;
  sop_effectiveness: SOPEffectiveness;
  last_updated: Date;
}

export interface ConversationEntry {
  timestamp: Date;
  incident_id: string;
  agent_type: string;
  action_taken: string;
  outcome: 'success' | 'failure' | 'partial';
  response_time_seconds: number;
  context: Record<string, any>;
}

export interface SuccessMetrics {
  total_incidents_handled: number;
  average_response_time: number;
  resolution_rate: number;
  escalation_rate: number;
  sop_compliance_rate: number;
}

export interface SOPEffectiveness {
  [incidentType: string]: {
    compliance_rate: number;
    average_resolution_time: number;
    success_rate: number;
    common_deviations: string[];
  };
}

// Base Agent Class
export abstract class BaseAgent {
  protected memory: AgentMemory;
  public agentType: string;
  protected agentName: string;

  constructor(agentType: string, agentName: string) {
    this.agentType = agentType;
    this.agentName = agentName;
    this.memory = this.loadMemory();
  }

  abstract canHandleActivity(activity: BaseActivity): boolean;
  abstract canHandleIncident(incident: Incident): boolean;
  abstract processActivity(activity: BaseActivity): Promise<AgentResponse>;
  abstract processIncident(incident: Incident): Promise<AgentResponse>;
  abstract getSOPForIncident(incident: Incident): SOPStep[];
  abstract getSOPForType(incidentType: IncidentType): SOPStep[];

  protected async updateMemory(
    incident: Incident, 
    action: string, 
    outcome: 'success' | 'failure' | 'partial',
    responseTime: number
  ): Promise<void> {
    const entry: ConversationEntry = {
      timestamp: new Date(),
      incident_id: incident.id,
      agent_type: this.agentType,
      action_taken: action,
      outcome,
      response_time_seconds: responseTime,
      context: { 
        incident_type: incident.type,
        severity: incident.severity,
        priority: incident.priority 
      }
    };

    this.memory.conversations.push(entry);
    this.updateSuccessMetrics(outcome, responseTime);
    await this.saveMemory();
  }

  private updateSuccessMetrics(outcome: string, responseTime: number): void {
    this.memory.success_metrics.total_incidents_handled++;
    
    // Update average response time
    const total = this.memory.success_metrics.total_incidents_handled;
    const currentAvg = this.memory.success_metrics.average_response_time;
    this.memory.success_metrics.average_response_time = 
      ((currentAvg * (total - 1)) + responseTime) / total;

    // Update resolution rate
    if (outcome === 'success') {
      const successCount = this.memory.conversations.filter(c => c.outcome === 'success').length;
      this.memory.success_metrics.resolution_rate = successCount / total;
    }
  }

  private loadMemory(): AgentMemory {
    // Load from persistent storage (file system, database, etc.)
    return {
      conversations: [],
      learned_patterns: {},
      success_metrics: {
        total_incidents_handled: 0,
        average_response_time: 0,
        resolution_rate: 0,
        escalation_rate: 0,
        sop_compliance_rate: 0
      },
      sop_effectiveness: {},
      last_updated: new Date()
    };
  }

  private async saveMemory(): Promise<void> {
    this.memory.last_updated = new Date();
    // Save to persistent storage
  }
}

// Agent Response Interface
export interface AgentResponse {
  agentId: string;
  timestamp: Date;
  confidence: number;
  action: 'create_incident' | 'escalate' | 'monitor' | 'resolve' | 'create_work_order';
  reasoning: string;
  sopSteps: SOPStep[];
  escalationRequired: boolean;
  nextAgents: string[];
  metadata: Record<string, any>;
}

export interface NotificationSent {
  recipient: string;
  method: 'email' | 'sms' | 'push' | 'radio';
  timestamp: Date;
  message: string;
}

export interface SOPStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // in seconds
  required: boolean;
  dependencies: string[];
  assignedRole: string;
}

// Incident Orchestrator - Main Coordinator
export class IncidentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private agentMemories: Map<string, AgentMemory> = new Map();
  private memory: AgentMemory;

  constructor() {
    // Specialized agents will be registered via registerAgent method
    // This allows for dynamic agent registration from specialized-agents.ts
  }

  registerAgent(agentType: string, agent: BaseAgent): void {
    this.agents.set(agentType, agent);
  }

  getAgentMemory(agentId: string) {
    return this.agentMemories.get(agentId);
  }

  getSystemMetrics() {
    return {
      totalIncidents: this.agentMemories.size,
      agentCount: this.agents.size,
      lastProcessed: new Date()
    };
  }



  async processActivity(activity: BaseActivity): Promise<Incident | null> {
    // Apply business rules to determine if incident should be created
    const shouldCreateIncident = this.evaluateIncidentCreation(activity);
    
    if (!shouldCreateIncident) {
      return null;
    }

    // Find appropriate agent for this activity
    let agent: BaseAgent | undefined;
    for (const agentInstance of Array.from(this.agents.values())) {
      if (agentInstance.canHandleActivity(activity)) {
        agent = agentInstance;
        break;
      }
    }
    
    if (!agent) {
      console.warn(`No agent found for activity type: ${activity.type}`);
      return null;
    }

    // Process with the agent
    const response = await agent.processActivity(activity);
    
    // Update agent memory with results
    await this.updateAgentMemory(agent.agentType, response);
    
    // Create incident if agent recommends it
    if (response.action === 'create_incident') {
      return this.createIncidentFromActivity(activity, response);
    }
    
    return null;
  }

  async processIncident(incident: Incident): Promise<AgentResponse> {
    // Find appropriate agent for this incident
    let agent: BaseAgent | undefined;
    for (const agentInstance of Array.from(this.agents.values())) {
      if (agentInstance.canHandleIncident(incident)) {
        agent = agentInstance;
        break;
      }
    }
    
    if (!agent) {
      throw new Error(`No agent found for incident type: ${incident.type}`);
    }

    // Process with the agent
    const response = await agent.processIncident(incident);
    
    // Update agent memory with results
    await this.updateAgentMemory(agent.agentType, response);
    
    return response;
  }

  private async updateAgentMemory(agentType: string, response: AgentResponse): Promise<void> {
    // Get or create agent memory
    let memory = this.agentMemories.get(agentType);
    if (!memory) {
      memory = {
        conversations: [],
        learned_patterns: {},
        success_metrics: {
          total_incidents_handled: 0,
          average_response_time: 0,
          resolution_rate: 0,
          escalation_rate: 0,
          sop_compliance_rate: 0
        },
        sop_effectiveness: {},
        last_updated: new Date()
      };
      this.agentMemories.set(agentType, memory);
    }

    // Add conversation entry
    const entry: ConversationEntry = {
      timestamp: response.timestamp,
      incident_id: response.metadata.incident_id || 'unknown',
      agent_type: agentType,
      action_taken: response.action,
      outcome: response.confidence > 0.8 ? 'success' : 'failure',
      response_time_seconds: 0, // Would be calculated in real implementation
      context: response.metadata
    };

    memory.conversations.push(entry);
    memory.last_updated = new Date();
    
    // Update success metrics
    memory.success_metrics.total_incidents_handled++;
    if (response.confidence > 0.8) {
      memory.success_metrics.resolution_rate = 
        (memory.success_metrics.resolution_rate * (memory.success_metrics.total_incidents_handled - 1) + 1) / 
        memory.success_metrics.total_incidents_handled;
    }
  }

  private evaluateIncidentCreation(activity: BaseActivity): boolean {
    // Business logic for auto-incident creation
    const rules = [
      // Medical activities always create incidents
      activity.type === 'medical',
      // High priority security activities
      activity.type === 'security-breach' && activity.priority === 'high',
      // Alert activities with high priority
      activity.type === 'alert' && activity.priority === 'critical',
      // Property damage with critical priority
      activity.type === 'property-damage' && activity.priority === 'critical'
    ];

    return rules.some(rule => rule);
  }

  private async routeToAgents(incident: Incident): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    
    // Find agents that can handle this incident type
    for (const agentType of Array.from(this.agents.keys())) {
      const agent = this.agents.get(agentType)!;
      if (agent.canHandleIncident(incident)) {
        const startTime = Date.now();
        const response = await agent.processIncident(incident);
        const responseTime = (Date.now() - startTime) / 1000;
        
        responses.push(response);
        
        // Update orchestrator memory
        await this.updateOrchestratorMemory(incident, agentType, response, responseTime);
      }
    }

    return responses;
  }

  private async coordinateResponses(incident: Incident, responses: AgentResponse[]): Promise<void> {
    // Handle concurrent agent responses
    const escalationRequired = responses.some(r => r.escalationRequired);
    
    if (escalationRequired) {
      await this.escalateToCase(incident, responses);
    }

    // Update incident status based on agent responses
    await this.updateIncidentStatus(incident, responses);
  }

  private async escalateToCase(incident: Incident, responses: AgentResponse[]): Promise<void> {
    // Create case from incident with investigation requirements
    // This integrates with your existing case management system
  }

  private loadOrchestratorMemory(): AgentMemory {
    // Load orchestrator-specific memory
    return {
      conversations: [],
      learned_patterns: {},
      success_metrics: {
        total_incidents_handled: 0,
        average_response_time: 0,
        resolution_rate: 0,
        escalation_rate: 0,
        sop_compliance_rate: 0
      },
      sop_effectiveness: {},
      last_updated: new Date()
    };
  }

  private async updateOrchestratorMemory(
    incident: Incident, 
    agentType: string, 
    response: AgentResponse, 
    responseTime: number
  ): Promise<void> {
    // Track orchestration effectiveness
    const entry: ConversationEntry = {
      timestamp: new Date(),
      incident_id: incident.id,
      agent_type: 'orchestrator',
      action_taken: `routed_to_${agentType}`,
      outcome: response.confidence > 0.8 ? 'success' : 'failure',
      response_time_seconds: responseTime,
      context: {
        agent_used: agentType,
        escalation_required: response.escalationRequired,
        confidence: response.confidence
      }
    };

    this.memory.conversations.push(entry);
  }

  private async createIncidentFromActivity(activity: BaseActivity, response?: AgentResponse): Promise<Incident> {
    // Create incident based on activity data
    // This integrates with your existing incident creation logic
    throw new Error('Implementation needed - integrate with existing incident service');
  }

  private async updateIncidentStatus(incident: Incident, responses: AgentResponse[]): Promise<void> {
    // Update incident status based on agent responses
    // This integrates with your existing incident management
    throw new Error('Implementation needed - integrate with existing incident service');
  }
}

// Note: Specialized agent implementations are in specialized-agents.ts