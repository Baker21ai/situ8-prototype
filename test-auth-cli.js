#!/usr/bin/env node

/**
 * CLI script to test AWS Cognito authentication
 * Run with: node test-auth-cli.js
 */

import { Amplify } from '@aws-amplify/core';
import { signIn, getCurrentUser, fetchAuthSession, signOut } from '@aws-amplify/auth';

// Test users
const testUsers = [
  { email: 'yamen@example.com', name: 'Yamen', role: 'Developer', level: 'L3' },
  { email: 'river@example.com', name: 'River', role: 'Admin', level: 'L5' },
  { email: 'celine@example.com', name: 'Celine', role: 'Security Officer', level: 'L4' },
  { email: 'phil@example.com', name: 'Phil', role: 'Viewer', level: 'L1' }
];

// Configure Amplify v6
console.log('🔧 Configuring AWS Amplify...');
const region = 'us-west-2';
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_ECLKvbdSp',
      userPoolClientId: '5ouh548bibh1rrp11neqcvvqf6',
      identityPoolId: 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4',
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: { required: true }
      },
      passwordFormat: {
        minLength: 8,
        requireNumbers: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSpecialCharacters: true
      }
    }
  },
  // Add region for AWS SDK
  region: region
});

async function testUserAuthentication(email, password = 'TempPassword123!') {
  console.log(`\n🧪 Testing ${email}...`);
  
  try {
    // Skip signOut to avoid configuration issues
    // We'll just proceed with sign in
    
    // Try to sign in
    console.log(`  ↳ Attempting sign in with password: ${password}`);
    const signInResult = await signIn({
      username: email,
      password: password
    });
    
    console.log('  ↳ Sign in result:', {
      isSignedIn: signInResult.isSignedIn,
      nextStep: signInResult.nextStep
    });
    
    if (signInResult.isSignedIn) {
      console.log('  ✅ Successfully signed in!');
      
      // Get current user
      const user = await getCurrentUser();
      console.log('  ↳ Current user:', user);
      
      // Get session
      const session = await fetchAuthSession();
      console.log('  ↳ Has valid tokens:', !!session.tokens);
      
      return { success: true, user: email };
    } else if (signInResult.nextStep?.signInStep === 'NEW_PASSWORD_REQUIRED') {
      console.log('  ⚠️  User needs to change password');
      console.log('  ↳ Challenge: NEW_PASSWORD_REQUIRED');
      return { success: false, reason: 'NEW_PASSWORD_REQUIRED', user: email };
    } else {
      console.log('  ❌ Sign in failed - unexpected state');
      return { success: false, reason: 'UNKNOWN', user: email };
    }
    
  } catch (error) {
    console.log('  ❌ Error:', error.name, '-', error.message);
    return { success: false, reason: error.message, user: email };
  }
}

async function runTests() {
  console.log('🚀 Starting AWS Cognito Authentication Tests');
  console.log('=========================================\n');
  
  const results = [];
  
  for (const user of testUsers) {
    const result = await testUserAuthentication(user.email);
    results.push({
      ...user,
      ...result
    });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.table(results.map(r => ({
    User: r.name,
    Email: r.email,
    Role: r.role,
    Level: r.level,
    Status: r.success ? '✅ Success' : '❌ Failed',
    Reason: r.reason || 'N/A'
  })));
  
  // Check which users need password change
  const needPasswordChange = results.filter(r => r.reason === 'NEW_PASSWORD_REQUIRED');
  if (needPasswordChange.length > 0) {
    console.log('\n⚠️  Users needing password change:');
    needPasswordChange.forEach(u => {
      console.log(`  - ${u.name} (${u.email})`);
    });
  }
  
  // Overall status
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✨ Overall: ${successCount}/${testUsers.length} users can sign in successfully`);
}

// Run the tests
runTests().catch(console.error);