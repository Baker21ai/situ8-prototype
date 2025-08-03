import React from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { ServiceProvider } from './services/ServiceProvider';
import { useAuth } from './stores/userStore';

// Simple test component to isolate the issue
const SimpleApp = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  console.log('🔍 SimpleApp: Auth state:', { isAuthenticated, user: user?.email, authLoading });
  
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gray-900">
        <LoginForm 
          onSuccess={() => {
            console.log('✅ Login success!');
            // Force reload to see if it works
            window.location.reload();
          }} 
          showDemoMode={true} 
        />
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Success! 🎉</h1>
        <p className="text-xl">Logged in as: {user?.email}</p>
        <p className="text-lg">Role: {user?.role}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Reload to Test Again
        </button>
      </div>
    </div>
  );
};

// Wrap with ServiceProvider
export default function TestApp() {
  return (
    <ServiceProvider>
      <SimpleApp />
    </ServiceProvider>
  );
}