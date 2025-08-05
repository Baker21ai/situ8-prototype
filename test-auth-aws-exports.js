#!/usr/bin/env node
import { Amplify } from '@aws-amplify/core';
import { signIn } from '@aws-amplify/auth';
import awsConfig from './src/aws-exports.js';

console.log('🔧 Testing with aws-exports format...');

// Configure Amplify
Amplify.configure(awsConfig);
console.log('✅ Amplify configured');

// Test authentication
async function testAuth() {
  try {
    console.log('\n🔑 Testing sign in for yamen@example.com...');
    const result = await signIn({
      username: 'yamen@example.com',
      password: 'TempPassword123!'
    });
    
    console.log('✅ Sign in successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Sign in failed:', error.name, '-', error.message);
  }
}

testAuth();