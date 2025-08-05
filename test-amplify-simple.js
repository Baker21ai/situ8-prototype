import { Amplify } from '@aws-amplify/core';

console.log('Testing Amplify configuration...');

// Try minimal config
const config = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_ECLKvbdSp',
      userPoolClientId: '5ouh548bibh1rrp11neqcvvqf6'
    }
  }
};

console.log('Config to apply:', JSON.stringify(config, null, 2));

try {
  Amplify.configure(config);
  console.log('✅ Configuration applied');
  
  // Check what was configured
  const appliedConfig = Amplify.getConfig();
  console.log('Applied config:', JSON.stringify(appliedConfig, null, 2));
} catch (error) {
  console.error('❌ Configuration failed:', error);
}

// Now try to import auth
import { signIn } from '@aws-amplify/auth';

// Try to sign in
try {
  console.log('\nTrying to sign in...');
  const result = await signIn({
    username: 'yamen@example.com',
    password: 'TempPassword123!'
  });
  console.log('Sign in result:', result);
} catch (error) {
  console.error('Sign in error:', error.name, '-', error.message);
}