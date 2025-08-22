import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import awsConfig from './aws-exports.js'
import App from '../App.tsx'
import '../styles/globals.css'
import { initializeDevTools } from '../utils/devtools'
import '../utils/debug-commands' // Constant auth error logging
// import './test-env.ts' // Temporary env test - commented out for production build

// Configure Amplify with AWS Cognito settings
Amplify.configure(awsConfig)

// Add error boundary and logging
const isDev = import.meta.env.DEV;
if (isDev) console.log('🚀 main.tsx: Starting app initialization');

// Initialize DevTools in development
initializeDevTools();

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  if (isDev) console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="color: red;">Root element not found!</h1>';
} else {
  if (isDev) console.log('✅ Root element found');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    if (isDev) console.log('✅ React root created');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    if (isDev) console.log('✅ App rendered');
  } catch (error) {
    if (isDev) console.error('❌ Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #1a1a1a; color: white; height: 100vh;">
        <h1 style="color: #ff6b6b;">Failed to start app</h1>
        <pre style="background: #000; padding: 20px; border-radius: 5px; overflow: auto;">${error}</pre>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
}