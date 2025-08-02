/**
 * Integration example for the Agentic AI system
 * Shows how to integrate with the existing Situ8 platform
 */

import { IncidentOrchestrator } from './agent-system.js';
import { MedicalEmergencyAgent, SecurityBreachAgent } from './specialized-agents.js';
import { BaseActivity } from '../types/activity.js';
import { Incident } from '../types/incident.js';
import { Status } from '../utils/status.js';

// Initialize the agentic AI system
export class AgenticAIService {
  private orchestrator: IncidentOrchestrator;

  constructor() {
    this.orchestrator = new IncidentOrchestrator();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Register specialized agents
    const medicalAgent = new MedicalEmergencyAgent();
    const securityAgent = new SecurityBreachAgent();
    
    this.orchestrator.registerAgent(medicalAgent.agentType, medicalAgent);
    this.orchestrator.registerAgent(securityAgent.agentType, securityAgent);
  }

  /**
   * Process a new activity through the agentic AI system
   * This would be called when a new activity is detected
   */
  async processActivity(activity: BaseActivity): Promise<void> {
    try {
      console.log(`🤖 Processing activity: ${activity.title}`);
      
      // The orchestrator will:
      // 1. Evaluate if an incident should be created
      // 2. Route to appropriate specialized agents
      // 3. Generate SOP steps
      // 4. Handle escalation if needed
      await this.orchestrator.processActivity(activity);
      
      console.log(`✅ Activity processed successfully`);
    } catch (error) {
      console.error(`❌ Error processing activity:`, error);
    }
  }

  /**
   * Process an existing incident through specialized agents
   */
  async processIncident(incident: Incident): Promise<void> {
    try {
      console.log(`🤖 Processing incident: ${incident.title}`);
      
      await this.orchestrator.processIncident(incident);
      
      console.log(`✅ Incident processed successfully`);
    } catch (error) {
      console.error(`❌ Error processing incident:`, error);
    }
  }

  /**
   * Get agent memory for analysis and improvement
   */
  getAgentMemory(agentId: string) {
    return this.orchestrator.getAgentMemory(agentId);
  }

  /**
   * Get system metrics for monitoring
   */
  getSystemMetrics() {
    return this.orchestrator.getSystemMetrics();
  }
}

// Example usage in your existing platform
export async function integrateWithSitu8Platform() {
  const agenticAI = new AgenticAIService();

  // Example: When a new activity is created
  const exampleActivity: BaseActivity = {
    id: 'act_001',
    timestamp: new Date(),
    type: 'medical',
    title: 'Medical Emergency in Building A',
    location: 'Building A, Floor 2',
    priority: 'critical',
    status: 'detecting',
    description: 'Person collapsed in hallway',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'system',
    updated_by: 'system',
    system_tags: ['medical', 'emergency'],
    user_tags: [],
    incident_contexts: [],
    retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_archived: false,
    allowed_status_transitions: ['assigned', 'resolved'],
    requires_approval: false
  };

  // Process through agentic AI
  await agenticAI.processActivity(exampleActivity);

  // The system will:
  // 1. Detect this is a medical emergency
  // 2. Route to MedicalEmergencyAgent
  // 3. Generate appropriate SOP steps
  // 4. Create an incident automatically
  // 5. Escalate to human responders
  // 6. Learn from the outcome
}

// Integration points with existing Situ8 components
export interface Situ8Integration {
  // Hook into activity creation
  onActivityCreated: (activity: BaseActivity) => Promise<void>;
  
  // Hook into incident creation
  onIncidentCreated: (incident: Incident) => Promise<void>;
  
  // Provide SOP recommendations
  getSOPRecommendations: (incidentType: string) => Promise<any[]>;
  
  // Update incident status based on agent recommendations
  updateIncidentStatus: (incidentId: string, status: string, reasoning: string) => Promise<void>;
  
  // Send notifications based on agent decisions
  sendNotifications: (recipients: string[], message: string, priority: string) => Promise<void>;
}

// Example implementation
export class Situ8AgenticIntegration implements Situ8Integration {
  private agenticAI: AgenticAIService;

  constructor() {
    this.agenticAI = new AgenticAIService();
  }

  async onActivityCreated(activity: BaseActivity): Promise<void> {
    // Automatically process new activities through AI agents
    await this.agenticAI.processActivity(activity);
  }

  async onIncidentCreated(incident: Incident): Promise<void> {
    // Process incidents for SOP generation and escalation
    await this.agenticAI.processIncident(incident);
  }

  async getSOPRecommendations(incidentType: string): Promise<any[]> {
    // Get SOP steps from specialized agents
    // This would integrate with your existing SOP system
    return [];
  }

  async updateIncidentStatus(incidentId: string, status: string, reasoning: string): Promise<void> {
    // Update incident status based on agent recommendations
    console.log(`Updating incident ${incidentId} to ${status}: ${reasoning}`);
  }

  async sendNotifications(recipients: string[], message: string, priority: string): Promise<void> {
    // Send notifications based on agent decisions
    console.log(`Sending ${priority} notification to ${recipients.join(', ')}: ${message}`);
  }
}