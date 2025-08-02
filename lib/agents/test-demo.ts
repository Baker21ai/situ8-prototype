/**
 * Test Demo for Agentic AI System
 * 
 * This file shows how to run the AI system demo.
 * You can run this to see the AI in action!
 */

import { runAgenticAIDemo } from './demo.js';

/**
 * Simple test function to run the demo
 * This is like a "test drive" of your AI system
 */
async function testAgenticAI() {
  console.log('🚀 Starting Agentic AI System Test...\n');
  
  try {
    // Run the full demo
    await runAgenticAIDemo();
    
    console.log('\n✅ Test completed successfully!');
    console.log('🎉 Your Agentic AI system is working properly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('🔧 Check the error above and fix any issues.');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAgenticAI();
}

export { testAgenticAI };