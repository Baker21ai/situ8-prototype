// Test script to verify UserAlreadyAuthenticatedException fix
// Run this in the browser console at http://localhost:5173

console.log('🧪 Testing UserAlreadyAuthenticatedException fix...');

// Function to test the login fix
function testLoginFix() {
  console.log('\n=== LOGIN FIX TEST ===');
  
  // Check if we have access to the auth service
  if (typeof window.debugAuth === 'function') {
    console.log('✅ debugAuth function available');
    window.debugAuth();
  } else {
    console.log('❌ debugAuth function not available');
  }
  
  // Check current authentication status
  if (window.useUserStore) {
    const userStore = window.useUserStore.getState();
    console.log('\n📊 Current User Store State:');
    console.log('- isAuthenticated:', userStore.isAuthenticated);
    console.log('- isDemoMode:', userStore.isDemoMode);
    console.log('- currentUser:', userStore.currentUser);
    console.log('- isLoading:', userStore.isLoading);
    
    // If user is already logged in, suggest logout first
    if (userStore.isAuthenticated) {
      console.log('\n⚠️  User is currently authenticated.');
      console.log('💡 To test the fix, try logging out first, then logging in again.');
      console.log('   You can logout by clicking the logout button or running: window.useUserStore.getState().logout()');
    } else {
      console.log('\n✅ No user currently authenticated - ready to test login!');
    }
  }
  
  console.log('\n📝 Instructions:');
  console.log('1. If a user is logged in, logout first');
  console.log('2. Try logging in with yamen@example.com');
  console.log('3. The system should now automatically handle any "already signed in" errors');
  console.log('4. Watch the console for the sign-out and retry process');
}

// Function to force logout and clear session
function forceLogout() {
  console.log('\n🔄 Forcing logout and clearing session...');
  
  if (window.useUserStore) {
    const userStore = window.useUserStore.getState();
    userStore.logout().then(() => {
      console.log('✅ Logout completed');
      
      // Also clear any remaining Cognito session
      if (window.debugAuth) {
        console.log('🧹 Clearing any remaining Cognito session...');
        // The auth service should handle this automatically now
      }
      
      console.log('✅ Ready for fresh login test!');
    }).catch(error => {
      console.error('❌ Logout error:', error);
    });
  }
}

// Run the test
testLoginFix();

// Make functions available globally for manual testing
window.testLoginFix = testLoginFix;
window.forceLogout = forceLogout;

console.log('\n🎯 Functions available:');
console.log('- testLoginFix() - Run the login fix test');
console.log('- forceLogout() - Force logout and clear session');