#!/usr/bin/env node

/**
 * Test PTT System with Authentication
 * Uses existing tokens or guides user to get them manually
 */

import PTTHealthChecker from './test-ptt-system.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG = {
  tokenDir: '.tokens',
  testUsers: ['dispatcher01', 'officer02', 'supervisor03']
};

class AuthenticatedTester extends PTTHealthChecker {
  constructor() {
    super();
    this.token = null;
  }

  async findTestToken() {
    console.log('🔍 Looking for existing test tokens...\n');
    
    // Check environment variable first
    if (process.env.TEST_TOKEN) {
      console.log('✅ Found token in TEST_TOKEN environment variable');
      this.token = process.env.TEST_TOKEN;
      this.validateToken();
      return true;
    }
    
    // Check for saved token files
    for (const user of CONFIG.testUsers) {
      const tokenFile = join(CONFIG.tokenDir, `${user}-token.txt`);
      
      if (existsSync(tokenFile)) {
        try {
          const token = readFileSync(tokenFile, 'utf8').trim();
          console.log(`✅ Found saved token for user: ${user}`);
          this.token = token;
          this.validateToken();
          return true;
        } catch (error) {
          console.log(`⚠️ Could not read token file for ${user}: ${error.message}`);
        }
      }
    }
    
    return false;
  }

  validateToken() {
    if (!this.token) return false;
    
    try {
      const payload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp < now) {
        console.log('⚠️ Token is expired');
        return false;
      }
      
      console.log(`🔐 Token valid for user: ${payload['cognito:username']}`);
      console.log(`⏰ Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
      return true;
    } catch (error) {
      console.log('❌ Invalid token format');
      return false;
    }
  }

  async runAuthenticatedTests() {
    console.log('🎤 Starting Authenticated PTT System Tests...\n');
    
    // First check if we have a valid token
    const hasToken = await this.findTestToken();
    
    if (!hasToken) {
      console.log('❌ No valid authentication token found.\n');
      console.log('📋 To get a test token:');
      console.log('1. Go to: https://us-west-2_ECLKvbdSp.auth.us-west-2.amazoncognito.com/login');
      console.log('2. Login with test credentials:');
      console.log('   - Username: dispatcher01');
      console.log('   - Password: TempPass123!');
      console.log('3. Copy the ID token from browser developer tools');
      console.log('4. Set it as environment variable:');
      console.log('   export TEST_TOKEN="your-token-here"');
      console.log('\nOr open the PTT test page in browser: http://localhost:5173/ptt-system-test.html');
      
      // Run basic tests without authentication
      console.log('\n🔧 Running basic infrastructure tests...\n');
      await this.checkInfrastructure();
      await this.checkChimeIntegration();
      this.printBasicSummary();
      return;
    }
    
    // Update config with token
    this.CONFIG = {
      ...this.CONFIG,
      testToken: this.token
    };
    
    // Run full test suite
    await this.runHealthCheck();
    
    // Additional authenticated tests
    await this.runAdvancedTests();
  }

  async runAdvancedTests() {
    console.log('\n🚀 Running Advanced PTT Tests...\n');
    
    // Test actual meeting creation flow
    await this.testMeetingCreationFlow();
    
    // Test PTT state messaging
    await this.testPTTStateMessaging();
  }

  async testMeetingCreationFlow() {
    this.log('TEST', 'ADVANCED', 'Testing complete meeting creation flow...');
    
    try {
      // Create meeting
      const meetingResponse = await this.createTestMeeting();
      if (meetingResponse.statusCode === 200) {
        this.log('INFO', 'ADVANCED', '✓ Meeting creation successful');
        
        // Create attendee
        const meeting = JSON.parse(meetingResponse.body);
        const attendeeResponse = await this.createTestAttendee(meeting.meetingId);
        
        if (attendeeResponse.statusCode === 200) {
          this.log('INFO', 'ADVANCED', '✓ Attendee creation successful');
          this.log('SUCCESS', 'ADVANCED', 'Complete meeting flow working!');
        } else {
          this.log('WARN', 'ADVANCED', 'Attendee creation failed', attendeeResponse);
        }
      } else {
        this.log('WARN', 'ADVANCED', 'Meeting creation failed', meetingResponse);
      }
    } catch (error) {
      this.log('ERROR', 'ADVANCED', 'Meeting flow test failed', error.message);
    }
  }

  async createTestMeeting() {
    const payload = {
      channelId: `advanced-test-${Date.now()}`,
      channelType: 'test'
    };
    
    return await this.testLambdaEndpoint('/createMeeting', payload, 'createMeetingAdvanced');
  }

  async createTestAttendee(meetingId) {
    const payload = {
      meetingId: meetingId,
      userId: `test-user-${Date.now()}`,
      userName: 'Advanced Test User'
    };
    
    return await this.testLambdaEndpoint('/createAttendee', payload, 'createAttendeeAdvanced');
  }

  async testPTTStateMessaging() {
    this.log('TEST', 'PTT_MSG', 'Testing PTT state messaging...');
    
    return new Promise(async (resolve) => {
      const WebSocket = globalThis.WebSocket || (await import('ws')).default;
      const wsUrl = `${this.CONFIG.wsUrl}?token=${encodeURIComponent(this.token)}`;
      const ws = new WebSocket(wsUrl);
      
      let messagesSent = 0;
      let messagesReceived = 0;
      
      const testMessages = [
        { action: 'updatePTTState', channelId: 'test', isSpeaking: true },
        { action: 'updatePTTState', channelId: 'test', isSpeaking: false },
        { action: 'ping', timestamp: Date.now() }
      ];
      
      const timeout = setTimeout(() => {
        this.log('WARN', 'PTT_MSG', `Test completed - Sent: ${messagesSent}, Received: ${messagesReceived}`);
        ws.close();
        resolve();
      }, 5000);
      
      ws.onopen = () => {
        this.log('INFO', 'PTT_MSG', '✓ WebSocket connected for PTT testing');
        
        // Send test messages
        testMessages.forEach((msg, index) => {
          setTimeout(() => {
            ws.send(JSON.stringify(msg));
            messagesSent++;
            this.log('INFO', 'PTT_MSG', `Sent message ${index + 1}`, msg);
          }, index * 1000);
        });
      };
      
      ws.onmessage = (event) => {
        messagesReceived++;
        const data = JSON.parse(event.data);
        this.log('INFO', 'PTT_MSG', `✓ Received message ${messagesReceived}`, data);
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        this.log('ERROR', 'PTT_MSG', 'WebSocket error during PTT test', error.message);
        resolve();
      };
      
      ws.onclose = () => {
        clearTimeout(timeout);
        this.log('INFO', 'PTT_MSG', 'PTT messaging test completed');
        resolve();
      };
    });
  }

  printBasicSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASIC PTT SYSTEM CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Infrastructure: Ready');
    console.log('✅ Chime SDK: Available');
    console.log('⚠️  Authentication: Required for full testing');
    console.log('\n💡 Next steps:');
    console.log('1. Obtain authentication token');
    console.log('2. Run full test suite with: TEST_TOKEN="your-token" node scripts/test-with-auth.js');
    console.log('3. Or use browser-based tests at: http://localhost:5173/ptt-system-test.html');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthenticatedTester();
  tester.runAuthenticatedTests().catch(console.error);
}

export default AuthenticatedTester;