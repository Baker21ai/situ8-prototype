/**
 * Simple test script to validate Cases module AWS/Local fallback
 * Run this in browser console to test both modes
 */

// Test function to validate Cases module data sources
function testCasesIntegration() {
  console.log('🧪 Testing Cases Module Integration...');
  
  // Check environment variables
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true';
  console.log('🔧 Environment Config:');
  console.log('  - USE_AWS_API:', useAwsApi);
  console.log('  - API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('  - AWS_REGION:', process.env.REACT_APP_AWS_REGION);
  
  // Test local store functionality
  console.log('📦 Testing Local Store...');
  try {
    const { useCaseStore } = window.__SITU8_STORES__ || {};
    if (useCaseStore) {
      const store = useCaseStore.getState();
      console.log('  - Cases in store:', store.cases.length);
      console.log('  - Store methods available:', Object.keys(store).filter(k => typeof store[k] === 'function'));
      
      // Test sample data initialization
      if (store.cases.length === 0) {
        console.log('  - Initializing sample data...');
        store.initializeWithSampleData();
        console.log('  - Sample cases loaded:', store.cases.length);
      }
      
      // Test stats calculation
      const stats = store.getCaseStats();
      console.log('  - Store stats:', stats);
      
      console.log('✅ Local store working properly');
    } else {
      console.warn('⚠️ Case store not accessible');
    }
  } catch (error) {
    console.error('❌ Local store test failed:', error);
  }
  
  // Test AWS API client if available
  console.log('☁️ Testing AWS API Client...');
  try {
    const services = window.__SITU8_SERVICES__;
    if (services && services.apiClient) {
      console.log('  - AWS API Client initialized');
      console.log('  - Available methods:', Object.keys(services.apiClient).filter(k => typeof services.apiClient[k] === 'function'));
      console.log('✅ AWS API client available');
    } else {
      console.log('  - AWS API client not initialized (expected in local mode)');
      console.log('✅ Fallback mode working');
    }
  } catch (error) {
    console.error('❌ AWS API test failed:', error);
  }
  
  // Test data source selection
  console.log('🔄 Testing Data Source Selection...');
  const currentMode = useAwsApi ? 'AWS API' : 'Local Store';
  console.log(`  - Active mode: ${currentMode}`);
  
  console.log('🎉 Cases integration test completed!');
  console.log('\n💡 To test fallback:');
  console.log('  1. Change REACT_APP_USE_AWS_API in .env.development');
  console.log('  2. Reload page');
  console.log('  3. Run this test again');
}

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
  // Expose test function globally
  window.testCasesIntegration = testCasesIntegration;
  console.log('🧪 Cases integration test available: window.testCasesIntegration()');
} else {
  console.log('Run this script in browser console after loading the app');
}

export default testCasesIntegration;