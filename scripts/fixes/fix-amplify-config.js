// PASTE THIS IN BROWSER CONSOLE TO FIX AMPLIFY CONFIG
// This forces Amplify to stay configured

console.log('🔧 Fixing Amplify configuration...');

// Get the config manually
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_ECLKvbdSp',
      userPoolClientId: '5ouh548bibh1rrp11neqcvvqf6', 
      region: 'us-west-2'
    }
  }
};

console.log('Configuration:', amplifyConfig);

// Force configure Amplify
try {
  const { Amplify } = await import('/node_modules/@aws-amplify/core/dist/esm/index.mjs');
  Amplify.configure(amplifyConfig);
  console.log('✅ Amplify manually configured');
  
  // Store in window for debugging
  window.AMPLIFY_CONFIG = amplifyConfig;
  
  // Test if it worked
  const authModule = await import('/node_modules/@aws-amplify/auth/dist/esm/index.mjs');
  
  // Try a simple auth operation
  try {
    await authModule.getCurrentUser();
    console.log('✅ Amplify config is working (or no user logged in)');
  } catch (error) {
    if (error.name === 'AuthUserPoolException') {
      console.log('❌ Still getting UserPool error');
    } else {
      console.log('✅ Different error (config is probably working):', error.message);
    }
  }
  
} catch (error) {
  console.error('❌ Failed to configure:', error);
}

console.log('Now try logging in with yamen@example.com / SecurePass123!');