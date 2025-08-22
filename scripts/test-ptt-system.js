#!/usr/bin/env node

/**
 * Situ8 PTT System Health Check
 * Comprehensive testing script for Push-to-Talk infrastructure
 */

import https from 'https';
import WebSocket from 'ws';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Configuration
const CONFIG = {
  apiBaseUrl: 'https://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev',
  wsUrl: 'wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev',
  testToken: process.env.TEST_TOKEN || '',
  testChannelId: 'health-check-channel',
  testUserId: 'test-user-health-check',
  timeout: 10000, // 10 seconds
};

class PTTHealthChecker {
  constructor() {
    this.results = {
      infrastructure: {},
      lambda: {},
      websocket: {},
      chime: {},
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  log(level, category, message, details = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '✅',
      'WARN': '⚠️',
      'ERROR': '❌',
      'TEST': '🧪'
    }[level] || 'ℹ️';

    console.log(`${prefix} [${timestamp}] [${category}] ${message}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }

    // Track results
    if (level === 'ERROR') {
      this.results.overall.failed++;
    } else if (level === 'WARN') {
      this.results.overall.warnings++;
    } else if (level === 'INFO' && message.includes('✓')) {
      this.results.overall.passed++;
    }
  }

  async runHealthCheck() {
    console.log('🎤 Starting Situ8 PTT System Health Check...\n');

    try {
      await this.checkInfrastructure();
      await this.checkLambdaEndpoints();
      await this.checkWebSocketConnectivity();
      await this.checkChimeIntegration();
      
      this.printSummary();
    } catch (error) {
      this.log('ERROR', 'SYSTEM', 'Health check failed', error);
    }
  }

  async checkInfrastructure() {
    this.log('TEST', 'INFRA', 'Checking infrastructure components...');

    // Check AWS CLI availability
    try {
      const awsVersion = execSync('aws --version', { encoding: 'utf8' });
      this.log('INFO', 'INFRA', '✓ AWS CLI available', awsVersion.trim());
      this.results.infrastructure.awsCli = true;
    } catch (error) {
      this.log('WARN', 'INFRA', 'AWS CLI not available', error.message);
      this.results.infrastructure.awsCli = false;
    }

    // Check Node.js version
    const nodeVersion = process.version;
    this.log('INFO', 'INFRA', `✓ Node.js version: ${nodeVersion}`);
    this.results.infrastructure.nodeVersion = nodeVersion;

    // Check required dependencies
    const requiredDeps = ['ws', 'amazon-chime-sdk-js'];
    for (const dep of requiredDeps) {
      try {
        require.resolve(dep);
        this.log('INFO', 'INFRA', `✓ Dependency available: ${dep}`);
        this.results.infrastructure[dep] = true;
      } catch (error) {
        this.log('ERROR', 'INFRA', `✗ Missing dependency: ${dep}`);
        this.results.infrastructure[dep] = false;
      }
    }
  }

  async checkLambdaEndpoints() {
    this.log('TEST', 'LAMBDA', 'Testing Lambda endpoints...');

    // Test createMeeting endpoint
    await this.testLambdaEndpoint('/createMeeting', {
      channelId: CONFIG.testChannelId,
      channelType: 'test'
    }, 'createMeeting');

    // Test createAttendee endpoint (this will fail without a valid meeting, but we can check the endpoint exists)
    await this.testLambdaEndpoint('/createAttendee', {
      meetingId: 'test-meeting-id',
      userId: CONFIG.testUserId,
      userName: 'Test User'
    }, 'createAttendee');
  }

  async testLambdaEndpoint(path, payload, endpointName) {
    return new Promise((resolve) => {
      const data = JSON.stringify(payload);
      const options = {
        hostname: '8hj9sdifek.execute-api.us-west-2.amazonaws.com',
        port: 443,
        path: `/dev${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(CONFIG.testToken && { 'Authorization': `Bearer ${CONFIG.testToken}` })
        },
        timeout: CONFIG.timeout
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (res.statusCode === 200) {
              this.log('INFO', 'LAMBDA', `✓ ${endpointName} endpoint accessible`);
              this.results.lambda[endpointName] = { status: 'success', statusCode: res.statusCode };
            } else if (res.statusCode === 401 || res.statusCode === 403) {
              this.log('WARN', 'LAMBDA', `${endpointName} endpoint requires authentication (${res.statusCode})`);
              this.results.lambda[endpointName] = { status: 'auth_required', statusCode: res.statusCode };
            } else {
              this.log('WARN', 'LAMBDA', `${endpointName} endpoint returned ${res.statusCode}`, parsed);
              this.results.lambda[endpointName] = { status: 'error', statusCode: res.statusCode, error: parsed };
            }
          } catch (error) {
            this.log('ERROR', 'LAMBDA', `${endpointName} endpoint returned invalid JSON`, responseBody);
            this.results.lambda[endpointName] = { status: 'invalid_response', error: responseBody };
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        this.log('ERROR', 'LAMBDA', `${endpointName} endpoint connection failed`, error.message);
        this.results.lambda[endpointName] = { status: 'connection_failed', error: error.message };
        resolve();
      });

      req.on('timeout', () => {
        this.log('ERROR', 'LAMBDA', `${endpointName} endpoint timeout`);
        this.results.lambda[endpointName] = { status: 'timeout' };
        req.destroy();
        resolve();
      });

      req.write(data);
      req.end();
    });
  }

  async checkWebSocketConnectivity() {
    this.log('TEST', 'WEBSOCKET', 'Testing WebSocket connectivity...');

    return new Promise((resolve) => {
      const wsUrl = CONFIG.testToken 
        ? `${CONFIG.wsUrl}?token=${encodeURIComponent(CONFIG.testToken)}`
        : CONFIG.wsUrl;

      const ws = new WebSocket(wsUrl);
      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          this.log('ERROR', 'WEBSOCKET', 'Connection timeout');
          this.results.websocket.connection = { status: 'timeout' };
          ws.terminate();
          resolve();
        }
      }, CONFIG.timeout);

      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        this.log('INFO', 'WEBSOCKET', '✓ WebSocket connection established');
        this.results.websocket.connection = { status: 'success' };

        // Test message sending
        const testMessage = {
          action: 'ping',
          timestamp: Date.now()
        };

        ws.send(JSON.stringify(testMessage));
        this.log('INFO', 'WEBSOCKET', '✓ Test message sent');

        // Close connection after brief test
        setTimeout(() => {
          ws.close();
        }, 1000);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.log('INFO', 'WEBSOCKET', '✓ Message received', message);
          this.results.websocket.messaging = { status: 'success', received: message };
        } catch (error) {
          this.log('WARN', 'WEBSOCKET', 'Invalid message format received', data.toString());
          this.results.websocket.messaging = { status: 'invalid_format', data: data.toString() };
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        this.log('ERROR', 'WEBSOCKET', 'Connection error', error.message);
        this.results.websocket.connection = { status: 'error', error: error.message };
        resolve();
      });

      ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        if (connected) {
          this.log('INFO', 'WEBSOCKET', `✓ Connection closed gracefully (${code})`);
          this.results.websocket.close = { status: 'success', code };
        } else {
          this.log('ERROR', 'WEBSOCKET', `Connection closed unexpectedly (${code})`, reason.toString());
          this.results.websocket.close = { status: 'unexpected', code, reason: reason.toString() };
        }
        resolve();
      });
    });
  }

  async checkChimeIntegration() {
    this.log('TEST', 'CHIME', 'Checking Chime SDK integration...');

    // Check if we can import Chime SDK (in browser environment, this would be different)
    try {
      // Check if the SDK is available in the project
      const packageJson = require('../package.json');
      if (packageJson.dependencies['amazon-chime-sdk-js']) {
        this.log('INFO', 'CHIME', '✓ Amazon Chime SDK dependency found');
        this.results.chime.dependency = { status: 'available', version: packageJson.dependencies['amazon-chime-sdk-js'] };
      } else {
        this.log('ERROR', 'CHIME', '✗ Amazon Chime SDK dependency missing');
        this.results.chime.dependency = { status: 'missing' };
      }
    } catch (error) {
      this.log('WARN', 'CHIME', 'Could not check Chime SDK dependency', error.message);
      this.results.chime.dependency = { status: 'unknown', error: error.message };
    }

    // Check voice service module
    try {
      const voiceServicePath = '../services/voice.service.ts';
      require.resolve(voiceServicePath);
      this.log('INFO', 'CHIME', '✓ Voice service module found');
      this.results.chime.voiceService = { status: 'available' };
    } catch (error) {
      this.log('ERROR', 'CHIME', '✗ Voice service module not found');
      this.results.chime.voiceService = { status: 'missing' };
    }

    // Check PTT component
    try {
      const pttComponentPath = '../components/communications/PTTButton.tsx';
      require.resolve(pttComponentPath);
      this.log('INFO', 'CHIME', '✓ PTT component found');
      this.results.chime.pttComponent = { status: 'available' };
    } catch (error) {
      this.log('ERROR', 'CHIME', '✗ PTT component not found');
      this.results.chime.pttComponent = { status: 'missing' };
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PTT SYSTEM HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));

    const { passed, failed, warnings } = this.results.overall;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    const overallHealth = failed === 0 ? 'HEALTHY' : failed <= 2 ? 'DEGRADED' : 'CRITICAL';
    const healthEmoji = { 'HEALTHY': '💚', 'DEGRADED': '💛', 'CRITICAL': '❤️' }[overallHealth];
    
    console.log(`\n${healthEmoji} Overall System Health: ${overallHealth}`);

    // Detailed results
    console.log('\n📋 Detailed Results:');
    console.log(JSON.stringify(this.results, null, 2));

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (failed > 0) {
      console.log('- Review failed components and ensure proper configuration');
      console.log('- Check AWS credentials and permissions');
      console.log('- Verify network connectivity to AWS services');
    }
    if (!CONFIG.testToken) {
      console.log('- Set TEST_TOKEN environment variable for authenticated endpoint testing');
    }
    if (overallHealth === 'HEALTHY') {
      console.log('- System appears ready for PTT operations');
      console.log('- Consider running browser-based tests for complete validation');
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new PTTHealthChecker();
  checker.runHealthCheck().catch(console.error);
}

export default PTTHealthChecker;