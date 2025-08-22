#!/usr/bin/env node

/**
 * Get Authentication Token for PTT Testing
 * Helper script to obtain Cognito tokens for testing PTT functionality
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const CONFIG = {
  region: 'us-west-2',
  userPoolId: 'us-west-2_ECLKvbdSp',
  clientId: '2q7vlb8pn6rj1r3n2b3tpnhe31',
  // Test users (from your setup)
  testUsers: {
    dispatcher01: 'TempPass123!',
    officer02: 'TempPass123!',
    supervisor03: 'TempPass123!'
  }
};

class TokenHelper {
  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({ region: CONFIG.region });
  }

  async getToken(username, password) {
    console.log(`🔐 Getting authentication token for user: ${username}`);
    
    try {
      const command = new InitiateAuthCommand({
        ClientId: CONFIG.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        }
      });

      const response = await this.cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
        
        console.log('✅ Authentication successful!');
        console.log('\n📋 Token Information:');
        console.log('='.repeat(60));
        console.log(`ID Token: ${IdToken}`);
        console.log(`Access Token: ${AccessToken}`);
        console.log(`Refresh Token: ${RefreshToken}`);
        console.log('='.repeat(60));
        
        // Decode and display token payload
        this.decodeToken(IdToken);
        
        // Save to file for easy reuse
        this.saveTokenToFile(username, IdToken);
        
        return {
          idToken: IdToken,
          accessToken: AccessToken,
          refreshToken: RefreshToken
        };
      } else {
        throw new Error('No authentication result received');
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      if (error.name === 'NotAuthorizedException') {
        console.log('\n💡 Possible solutions:');
        console.log('- Check username and password');
        console.log('- User might need to change their temporary password');
        console.log('- Run password reset if needed');
      } else if (error.name === 'UserNotConfirmedException') {
        console.log('\n💡 User needs to be confirmed in Cognito');
      }
      
      throw error;
    }
  }

  decodeToken(token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      console.log('\n🔍 Token Payload:');
      console.log(`User ID: ${payload.sub}`);
      console.log(`Username: ${payload['cognito:username']}`);
      console.log(`Email: ${payload.email || 'N/A'}`);
      console.log(`Role: ${payload['custom:role'] || 'N/A'}`);
      console.log(`Clearance Level: ${payload['custom:clearanceLevel'] || 'N/A'}`);
      console.log(`Badge Number: ${payload['custom:badgeNumber'] || 'N/A'}`);
      console.log(`Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
    } catch (error) {
      console.warn('⚠️ Could not decode token payload:', error.message);
    }
  }

  saveTokenToFile(username, token) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const tokenFile = path.join(process.cwd(), '.tokens', `${username}-token.txt`);
      const tokenDir = path.dirname(tokenFile);
      
      // Create .tokens directory if it doesn't exist
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }
      
      fs.writeFileSync(tokenFile, token);
      
      console.log(`\n💾 Token saved to: ${tokenFile}`);
      console.log(`\n🚀 Quick test command:`);
      console.log(`TEST_TOKEN="${token}" node scripts/test-ptt-system.js`);
      
    } catch (error) {
      console.warn('⚠️ Could not save token to file:', error.message);
    }
  }

  async testAllUsers() {
    console.log('🧪 Testing all configured users...\n');
    
    const results = {};
    
    for (const [username, password] of Object.entries(CONFIG.testUsers)) {
      try {
        console.log(`\n${'='.repeat(40)}`);
        const tokens = await this.getToken(username, password);
        results[username] = { success: true, tokens };
      } catch (error) {
        console.error(`❌ Failed for ${username}: ${error.message}`);
        results[username] = { success: false, error: error.message };
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('='.repeat(60));
    for (const [username, result] of Object.entries(results)) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${username}: ${result.success ? 'Success' : result.error}`);
    }
    
    return results;
  }
}

// Main execution
async function main() {
  console.log('🎯 Situ8 Authentication Token Helper\n');
  
  const args = process.argv.slice(2);
  const tokenHelper = new TokenHelper();
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/get-test-token.js <username> [password]');
    console.log('  node scripts/get-test-token.js --test-all');
    console.log('\nAvailable test users:');
    Object.keys(CONFIG.testUsers).forEach(user => {
      console.log(`  - ${user}`);
    });
    return;
  }
  
  if (args[0] === '--test-all') {
    await tokenHelper.testAllUsers();
    return;
  }
  
  const username = args[0];
  const password = args[1] || CONFIG.testUsers[username];
  
  if (!password) {
    console.error('❌ Password required. Either provide it as argument or use a configured test user.');
    return;
  }
  
  try {
    await tokenHelper.getToken(username, password);
  } catch (error) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TokenHelper;