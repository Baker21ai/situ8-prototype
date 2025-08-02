/**
 * Simple Demo for Agentic AI System
 * 
 * This is a simplified version that shows the concept without TypeScript complexity.
 * Think of this as a "proof of concept" that demonstrates how the AI system works.
 */

console.log('🚀 Situ8 Agentic AI System Demo\n');

// Simulate the AI system components
class SimpleAgent {
  constructor(name, specialty) {
    this.name = name;
    this.specialty = specialty;
    this.memory = [];
  }

  canHandle(activity) {
    // Simple logic: check if activity type matches agent specialty
    return activity.type.includes(this.specialty.toLowerCase()) || 
           activity.description.toLowerCase().includes(this.specialty.toLowerCase());
  }

  processActivity(activity) {
    console.log(`🤖 ${this.name} is analyzing: "${activity.title}"`);
    
    // Simulate AI decision making
    const shouldCreateIncident = this.specialty === 'medical' || this.specialty === 'security';
    
    if (shouldCreateIncident) {
      console.log(`⚠️  ${this.name} Decision: This requires immediate attention!`);
      console.log(`📋 Following ${this.specialty} emergency procedures...`);
      console.log(`🚨 Creating incident automatically...`);
      
      // Simulate learning
      this.memory.push({
        activity: activity.title,
        decision: 'created_incident',
        timestamp: new Date()
      });
      
      return {
        incidentCreated: true,
        priority: 'high',
        procedures: [`Secure area`, `Assess situation`, `Contact emergency services`]
      };
    } else {
      console.log(`✅ ${this.name} Decision: Normal activity, no incident needed`);
      console.log(`📝 Logging for records...`);
      
      this.memory.push({
        activity: activity.title,
        decision: 'no_incident',
        timestamp: new Date()
      });
      
      return {
        incidentCreated: false,
        priority: 'low',
        procedures: [`Log activity`, `Continue monitoring`]
      };
    }
  }

  getMemoryCount() {
    return this.memory.length;
  }
}

// Create AI agents (like having different specialists on call)
const medicalAgent = new SimpleAgent('Dr. AI', 'medical');
const securityAgent = new SimpleAgent('Security AI', 'security');
const generalAgent = new SimpleAgent('General AI', 'general');

const agents = [medicalAgent, securityAgent, generalAgent];

// Simulate the "brain" that decides which agent to use
function processActivity(activity) {
  console.log(`\n🔍 Analyzing activity: "${activity.title}"`);
  console.log(`📍 Location: ${activity.location}`);
  console.log(`⏰ Time: ${activity.timestamp.toLocaleTimeString()}`);
  
  // Find the right agent for this activity
  for (const agent of agents) {
    if (agent.canHandle(activity)) {
      const result = agent.processActivity(activity);
      console.log(`💭 Agent Memory: ${agent.getMemoryCount()} previous decisions\n`);
      return result;
    }
  }
  
  // Fallback to general agent
  console.log('🤖 No specialist found, using General AI...');
  return generalAgent.processActivity(activity);
}

// Demo scenarios (like test cases)
async function runDemo() {
  console.log('='.repeat(60));
  console.log('🎯 SCENARIO 1: Medical Emergency');
  console.log('='.repeat(60));
  
  const medicalActivity = {
    title: 'Person collapsed in lobby',
    type: 'medical_emergency',
    description: 'Visitor reported unconscious person near main entrance',
    location: 'Main Lobby - Corporate HQ',
    timestamp: new Date(),
    priority: 'high'
  };
  
  processActivity(medicalActivity);
  
  console.log('='.repeat(60));
  console.log('🎯 SCENARIO 2: Security Breach');
  console.log('='.repeat(60));
  
  const securityActivity = {
    title: 'Unauthorized access attempt',
    type: 'security_breach',
    description: 'Multiple failed badge swipes at restricted door',
    location: 'Server Room - Building A',
    timestamp: new Date(),
    priority: 'high'
  };
  
  processActivity(securityActivity);
  
  console.log('='.repeat(60));
  console.log('🎯 SCENARIO 3: Routine Activity');
  console.log('='.repeat(60));
  
  const routineActivity = {
    title: 'Routine patrol check-in',
    type: 'patrol',
    description: 'Security guard completed hourly patrol of parking garage',
    location: 'Parking Garage Level 2 - Corporate HQ',
    timestamp: new Date(),
    priority: 'low'
  };
  
  processActivity(routineActivity);
  
  console.log('='.repeat(60));
  console.log('📊 SYSTEM METRICS');
  console.log('='.repeat(60));
  
  agents.forEach(agent => {
    console.log(`${agent.name}: ${agent.getMemoryCount()} decisions made`);
  });
  
  console.log('\n🎉 Demo completed successfully!');
  console.log('💡 Key Benefits Demonstrated:');
  console.log('   ✅ Instant analysis of activities');
  console.log('   ✅ Automatic incident creation for emergencies');
  console.log('   ✅ Appropriate response procedures');
  console.log('   ✅ Learning and memory retention');
  console.log('   ✅ 24/7 availability');
  
  console.log('\n🔮 In the real system:');
  console.log('   • AI agents are much more sophisticated');
  console.log('   • They follow detailed Standard Operating Procedures');
  console.log('   • They integrate with your existing Situ8 platform');
  console.log('   • They learn from every interaction');
  console.log('   • They provide detailed metrics and insights');
}

// Run the demo
runDemo().catch(console.error);