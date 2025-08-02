/**
 * Agentic AI System - Main Exports
 * 
 * This file exports all the main components of the agentic AI system
 * for easy importing in other parts of your application.
 */

// Core system components
export { 
  BaseAgent, 
  IncidentOrchestrator,
  type AgentMemory,
  type AgentResponse,
  type SOPStep,
  type ConversationEntry,
  type SuccessMetrics,
  type SOPEffectiveness
} from './agent-system.js';

// Specialized agents
export {
  MedicalEmergencyAgent,
  SecurityBreachAgent
} from './specialized-agents.js';

// Integration layer
export {
  AgenticAIService,
  Situ8AgenticIntegration,
  type Situ8Integration
} from './agent-integration.js';

// Demo and testing
export { runAgenticAIDemo, aiService } from './demo.js';
export { testAgenticAI } from './test-demo.js';

/**
 * Quick Start Guide:
 * 
 * 1. Import the main service:
 *    import { AgenticAIService } from './lib/agents';
 * 
 * 2. Create an instance:
 *    const aiService = new AgenticAIService();
 * 
 * 3. Process activities:
 *    await aiService.processActivity(activity);
 * 
 * 4. Run the demo:
 *    import { runAgenticAIDemo } from './lib/agents';
 *    await runAgenticAIDemo();
 */