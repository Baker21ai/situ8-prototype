// PASTE THIS IN BROWSER CONSOLE TO FIX AUTH ISSUES

console.log('🔧 Fixing authentication issues...\n');

// Step 1: Clear all stored sessions
console.log('1. Clearing stored sessions...');
localStorage.removeItem('situ8_user');
localStorage.removeItem('situ8_session');
localStorage.removeItem('situ8_auth_mode');
sessionStorage.clear();
console.log('   ✅ Sessions cleared\n');

// Step 2: Force logout
console.log('2. Forcing logout...');
const userStore = window.useUserStore?.getState();
if (userStore) {
  userStore.logout();
  console.log('   ✅ Logged out\n');
}

// Step 3: Disable demo mode
console.log('3. Disabling demo mode...');
if (userStore) {
  userStore.disableDemoMode();
  console.log('   ✅ Demo mode disabled\n');
}

// Step 4: Check Cognito status
console.log('4. Checking Cognito status...');
const authStatus = window.debugAuth();
console.log('   Cognito initialized:', authStatus.cognitoStatus.isInitialized);
console.log('   Has config:', authStatus.cognitoStatus.hasCognitoConfig);

// Step 5: Recover Cognito if needed
if (!authStatus.cognitoStatus.isInitialized) {
  console.log('\n5. Attempting to recover Cognito configuration...');
  // Try to reinitialize
  location.reload();
} else {
  console.log('\n✅ READY TO LOGIN!\n');
  console.log('Now try logging in with:');
  console.log('Email: yamen@example.com');
  console.log('Password: SecurePass123!');
  
  // Create helper function
  window.testRealLogin = async function(email, password) {
    console.log(`\nAttempting login with ${email}...`);
    const store = window.useUserStore.getState();
    
    // Ensure we're not in demo mode
    store.disableDemoMode();
    
    try {
      const result = await store.login({ email, password });
      if (result) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User:', store.currentUser);
        
        // Check if we have AWS tokens
        const authService = window.__AUTH_SERVICE__;
        const tokens = authService?.tokens;
        if (tokens?.idToken) {
          console.log('✅ AWS tokens acquired!');
          console.log('WebSocket should now work.');
        }
      } else {
        console.log('❌ Login failed:', store.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };
  
  console.log('\nHelper function created:');
  console.log('testRealLogin("yamen@example.com", "SecurePass123!")');
}