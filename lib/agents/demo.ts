/**
 * Agentic AI System Demo
 * 
 * This file demonstrates how the agentic AI system works in practice.
 * Think of this as a "test drive" of your intelligent incident management system.
 */

import { AgenticAIService } from './agent-integration.js';
import { BaseActivity } from '../types/activity.js';
import { Status } from '../utils/status.js';

// Create the AI service (this is your "brain" for incident management)
const aiService = new AgenticAIService();

/**
 * Demo Scenario 1: Medical Emergency
 * 
 * Imagine a security guard reports a medical emergency through the Situ8 app.
 * The AI system should automatically:
 * 1. Detect this is a medical situation
 * 2. Route it to the Medical Emergency Agent
 * 3. Follow the medical SOP (Standard Operating Procedure)
 * 4. Create an incident if needed
 * 5. Learn from the outcome to improve future responses
 */
async function demoMedicalEmergency() {
  console.log('🚨 DEMO: Medical Emergency Scenario');
  console.log('=====================================');
  
  // This represents a real activity that would come from your Situ8 platform
  const medicalActivity: BaseActivity = {
    id: 'act_001',
    type: 'medical',
    title: 'Person collapsed in lobby',
    description: 'Security guard reports person collapsed near main entrance, appears unconscious',
    priority: 'critical',
    status: 'detecting' as Status,
    location: 'Main Lobby - Corporate HQ',
    timestamp: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'guard_001',
    updated_by: 'guard_001',
    system_tags: ['medical', 'emergency', 'lobby'],
    user_tags: ['urgent'],
    incident_contexts: [],
    retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    is_archived: false,
    allowed_status_transitions: ['assigned', 'resolved'],
    requires_approval: false
  };

  try {
    // The AI processes this activity automatically
    console.log('🤖 Processing medical emergency...');
    await aiService.processActivity(medicalActivity);
    console.log('✅ AI successfully processed medical emergency');
    
    // Show what the AI learned
    const memory = aiService.getAgentMemory('medical');
    if (memory) {
      console.log('🧠 AI Learning:');
      console.log('   - Total cases handled:', memory.success_metrics.total_incidents_handled);
      console.log('   - Success rate:', Math.round(memory.success_metrics.resolution_rate * 100) + '%');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n');
}

/**
 * Demo Scenario 2: Security Breach
 * 
 * A sensor detects unauthorized access to a restricted area.
 * The AI should:
 * 1. Recognize this as a security threat
 * 2. Route to Security Breach Agent
 * 3. Follow security protocols
 * 4. Escalate if needed
 */
async function demoSecurityBreach() {
  console.log('🔒 DEMO: Security Breach Scenario');
  console.log('==================================');
  
  const securityActivity: BaseActivity = {
    id: 'act_002',
    type: 'security-breach',
    title: 'Unauthorized access detected',
    description: 'Motion sensor triggered in server room after hours, no scheduled maintenance',
    priority: 'high',
    status: 'detecting' as Status,
    location: 'Server Room B - Data Center',
    timestamp: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'sensor_system',
    updated_by: 'sensor_system',
    system_tags: ['security', 'breach', 'unauthorized'],
    user_tags: ['after-hours'],
    incident_contexts: [],
    retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_archived: false,
    allowed_status_transitions: ['assigned', 'resolved'],
    requires_approval: false
  };

  try {
    console.log('🤖 Processing security breach...');
    await aiService.processActivity(securityActivity);
    console.log('✅ AI successfully processed security breach');
    console.log('👮 Response team notified');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n');
}

/**
 * Demo Scenario 3: Low Priority Activity (No Incident)
 * 
 * A routine patrol check-in that doesn't need to become an incident.
 * The AI should recognize this and NOT create an incident.
 */
async function demoRoutineActivity() {
  console.log('✅ DEMO: Routine Activity (Should NOT create incident)');
  console.log('=====================================================');
  
  const routineActivity: BaseActivity = {
    id: 'act_003',
    type: 'patrol',
    title: 'Routine patrol check-in',
    description: 'Security guard completed hourly patrol of parking garage',
    priority: 'low',
    status: 'resolved' as Status,
    location: 'Parking Garage Level 2 - Corporate HQ',
    timestamp: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'guard_003',
    updated_by: 'guard_003',
    system_tags: ['patrol', 'routine', 'parking'],
    user_tags: ['all-clear'],
    incident_contexts: [],
    retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_archived: false,
    allowed_status_transitions: [],
    requires_approval: false
  };

  try {
    console.log('🤖 Processing routine activity...');
    await aiService.processActivity(routineActivity);
    console.log('✅ AI Decision: No incident needed (correct!)');
    console.log('📝 Activity logged for patrol records');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n');
}

/**
 * Run all demos to show the complete system in action
 */
export async function runAgenticAIDemo() {
  console.log('🤖 SITU8 AGENTIC AI SYSTEM DEMONSTRATION');
  console.log('=========================================');
  console.log('This demo shows how AI agents automatically handle different scenarios\n');
  
  await demoMedicalEmergency();
  await demoSecurityBreach();
  await demoRoutineActivity();
  
  // Show overall system metrics
  console.log('📊 SYSTEM METRICS');
  console.log('==================');
  const metrics = aiService.getSystemMetrics();
  console.log('🤖 Active AI Agents:', metrics.agentCount);
  console.log('📈 Total Incidents Processed:', metrics.totalIncidents);
  console.log('⏰ Last Activity:', metrics.lastProcessed.toLocaleTimeString());
  
  console.log('\n🎯 KEY BENEFITS:');
  console.log('- Automatic incident detection and classification');
  console.log('- Consistent SOP (Standard Operating Procedure) following');
  console.log('- Continuous learning and improvement');
  console.log('- 24/7 intelligent monitoring');
  console.log('- Reduced human error and response time');
}

// Export for use in other parts of the system
export { aiService };