// Console Authentication Check Script
// Run this in the browser console at http://localhost:5173

console.log('🔍 Starting Authentication Status Check...');
console.log('=====================================');

// 1. Check Environment Variables
console.log('\n📋 Environment Variables:');
console.log('VITE_USE_AWS_API:', import.meta.env.VITE_USE_AWS_API);
console.log('VITE_AWS_REGION:', import.meta.env.VITE_AWS_REGION);
console.log('VITE_COGNITO_USER_POOL_ID:', import.meta.env.VITE_COGNITO_USER_POOL_ID);
console.log('VITE_COGNITO_CLIENT_ID:', import.meta.env.VITE_COGNITO_CLIENT_ID);

// 2. Check if debugAuth function exists
if (typeof window.debugAuth === 'function') {
    console.log('\n🔧 AWS Debug Information:');
    try {
        const authDebug = window.debugAuth();
        console.log('Auth Debug Result:', authDebug);
        
        if (authDebug.cognitoStatus?.isInitialized) {
            console.log('✅ AWS Cognito is INITIALIZED');
        } else {
            console.log('❌ AWS Cognito is NOT INITIALIZED');
            console.log('Cognito Error:', authDebug.cognitoStatus?.error);
        }
    } catch (error) {
        console.error('❌ Error running debugAuth:', error);
    }
} else {
    console.log('⚠️ debugAuth function not available');
}

// 3. Check User Store
if (typeof window.useUserStore !== 'undefined') {
    console.log('\n👤 User Store Status:');
    try {
        const userState = window.useUserStore.getState();
        console.log('Is Authenticated:', userState.isAuthenticated);
        console.log('Is Demo Mode:', userState.isDemoMode);
        console.log('Current User:', userState.currentUser);
        console.log('Is Loading:', userState.isLoading);
        console.log('Error:', userState.error);
        
        if (userState.isAuthenticated) {
            console.log('✅ USER IS LOGGED IN');
            console.log('User Details:', {
                id: userState.currentUser?.id,
                email: userState.currentUser?.email,
                role: userState.currentUser?.role
            });
        } else {
            console.log('❌ USER IS NOT LOGGED IN');
        }
    } catch (error) {
        console.error('❌ Error checking user store:', error);
    }
} else {
    console.log('⚠️ useUserStore not available');
}

// 4. Check DevTools
if (typeof window.devTools !== 'undefined') {
    console.log('\n🛠️ DevTools Available:');
    try {
        if (window.devTools.debug?.showAuth) {
            console.log('Auth Info from DevTools:');
            window.devTools.debug.showAuth();
        }
        if (window.devTools.debug?.showUser) {
            console.log('User Info from DevTools:');
            window.devTools.debug.showUser();
        }
    } catch (error) {
        console.error('❌ Error using devTools:', error);
    }
} else {
    console.log('⚠️ devTools not available');
}

// 5. Check for Recent Console Errors
console.log('\n🚨 Recent Console Errors:');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
    errorCount++;
    console.log(`Error #${errorCount}:`, ...args);
    originalError.apply(console, args);
};

console.log('\n=====================================');
console.log('✅ Authentication check complete!');
console.log('Copy and paste this script into your browser console at http://localhost:5173');
console.log('=====================================');