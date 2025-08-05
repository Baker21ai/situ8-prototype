import { Amplify } from '@aws-amplify/core';
import { cognitoUserPoolsTokenProvider } from '@aws-amplify/auth/cognito';

console.log('Testing Amplify v6 configuration...');

// Configure token provider first
cognitoUserPoolsTokenProvider.setKeyValueStorage({
  setItem: async (key, value) => localStorage.setItem(key, value),
  getItem: async (key) => localStorage.getItem(key),
  removeItem: async (key) => localStorage.removeItem(key),
  clear: async () => localStorage.clear()
});

// Configure Amplify
const config = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_ECLKvbdSp',
      userPoolClientId: '5ouh548bibh1rrp11neqcvvqf6',
      region: 'us-west-2'
    }
  }
};

console.log('Configuring with:', JSON.stringify(config, null, 2));

try {
  Amplify.configure(config);
  console.log('✅ Amplify configured');
} catch (error) {
  console.error('❌ Configuration error:', error);
}

// Test with region in user pool id
import { signIn } from '@aws-amplify/auth';

try {
  console.log('\nAttempting sign in...');
  const result = await signIn({
    username: 'yamen@example.com',
    password: 'TempPassword123!'
  });
  console.log('✅ Sign in result:', result);
} catch (error) {
  console.error('❌ Sign in error:', error.name, '-', error.message);
  
  // Try to get more info
  if (error.underlyingError) {
    console.error('Underlying error:', error.underlyingError);
  }
  if (error.recoverySuggestion) {
    console.error('Recovery suggestion:', error.recoverySuggestion);
  }
}