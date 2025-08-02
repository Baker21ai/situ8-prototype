/**
 * Specialized AI agents for different incident types
 */

import { BaseAgent, type AgentResponse, type SOPStep } from './agent-system.js';
import { BaseActivity } from '../types/activity.js';
import { Incident, IncidentType } from '../types/incident.js';

export class MedicalEmergencyAgent extends BaseAgent {
  constructor() {
    super('medical-emergency', 'Medical Emergency Specialist');
  }

  canHandleActivity(activity: BaseActivity): boolean {
    if (!activity || !activity.type) {
      return false;
    }
    return activity.type === 'medical';
  }

  canHandleIncident(incident: Incident): boolean {
    return incident.type === 'medical_emergency';
  }

  async processActivity(activity: BaseActivity): Promise<AgentResponse> {
    const steps = this.getSOPForType('medical_emergency');
    
    return {
      agentId: this.agentType,
      timestamp: new Date(),
      confidence: 0.95,
      action: 'create_incident',
      reasoning: 'Medical emergency detected - immediate response required',
      sopSteps: steps,
      escalationRequired: true,
      nextAgents: ['emergency-coordinator'],
      metadata: {
        estimatedResponseTime: '2-5 minutes',
        requiredPersonnel: ['EMT', 'Security'],
        criticalActions: ['Call 911', 'Secure area', 'Provide first aid']
      }
    };
  }

  async processIncident(incident: Incident): Promise<AgentResponse> {
    const steps = this.getSOPForType(incident.type);
    
    return {
      agentId: this.agentType,
      timestamp: new Date(),
      confidence: 0.95,
      action: 'create_incident',
      reasoning: 'Medical emergency incident processing',
      sopSteps: steps,
      escalationRequired: incident.severity === 'critical',
      nextAgents: ['emergency-coordinator'],
      metadata: {
        incidentType: incident.type,
        severity: incident.severity
      }
    };
  }

  getSOPForIncident(incident: Incident): SOPStep[] {
    return this.getSOPForType(incident.type);
  }

  getSOPForType(incidentType: IncidentType): SOPStep[] {
    return [
      {
        id: '1',
        title: 'Immediate Assessment',
        description: 'Assess the medical emergency and determine severity',
        estimatedTime: 30,
        required: true,
        dependencies: [],
        assignedRole: 'First Responder'
      },
      {
        id: '2',
        title: 'Emergency Services',
        description: 'Call 911 and request medical assistance',
        estimatedTime: 60,
        required: true,
        dependencies: ['1'],
        assignedRole: 'Security'
      },
      {
        id: '3',
        title: 'Area Security',
        description: 'Secure the area and control access',
        estimatedTime: 120,
        required: true,
        dependencies: ['1'],
        assignedRole: 'Security'
      }
    ];
  }
}

export class SecurityBreachAgent extends BaseAgent {
  constructor() {
    super('security-breach', 'Security Breach Specialist');
  }

  canHandleActivity(activity: BaseActivity): boolean {
    if (!activity || !activity.type) {
      return false;
    }
    return activity.type === 'security-breach';
  }

  canHandleIncident(incident: Incident): boolean {
    return incident.type === 'security_breach';
  }

  async processActivity(activity: BaseActivity): Promise<AgentResponse> {
    const steps = this.getSOPForType('security_breach');
    
    return {
      agentId: this.agentType,
      timestamp: new Date(),
      confidence: 0.88,
      action: 'create_incident',
      reasoning: 'Security breach detected',
      sopSteps: steps,
      escalationRequired: activity.priority === 'high' || activity.priority === 'critical',
      nextAgents: ['security-coordinator', 'compliance-officer'],
      metadata: {
        threatLevel: activity.priority,
        containmentRequired: true,
        investigationNeeded: true
      }
    };
  }

  async processIncident(incident: Incident): Promise<AgentResponse> {
    const steps = this.getSOPForType(incident.type);
    
    return {
      agentId: this.agentType,
      timestamp: new Date(),
      confidence: 0.88,
      action: 'create_incident',
      reasoning: 'Security breach incident processing',
      sopSteps: steps,
      escalationRequired: incident.severity === 'critical',
      nextAgents: ['security-coordinator'],
      metadata: {
        incidentType: incident.type,
        severity: incident.severity
      }
    };
  }

  getSOPForIncident(incident: Incident): SOPStep[] {
    return this.getSOPForType(incident.type);
  }

  getSOPForType(incidentType: IncidentType): SOPStep[] {
    return [
      {
        id: '1',
        title: 'Immediate Containment',
        description: 'Contain the security breach and prevent further access',
        estimatedTime: 120,
        required: true,
        dependencies: [],
        assignedRole: 'Security Team'
      },
      {
        id: '2',
        title: 'Threat Assessment',
        description: 'Assess the scope and impact of the security breach',
        estimatedTime: 300,
        required: true,
        dependencies: ['1'],
        assignedRole: 'Security Analyst'
      },
      {
        id: '3',
        title: 'Evidence Preservation',
        description: 'Preserve digital and physical evidence',
        estimatedTime: 600,
        required: true,
        dependencies: ['1'],
        assignedRole: 'IT Security'
      }
    ];
  }
}