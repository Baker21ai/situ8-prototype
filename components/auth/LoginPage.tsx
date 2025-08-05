/**
 * Login Page Component
 * Combines auth status display with login form
 */

import React from 'react';
import { LoginForm } from './LoginForm';
import { AuthStatusToggle } from './AuthStatusToggle';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            {/* Left side - Auth Status */}
            <div className="lg:sticky lg:top-8">
              <AuthStatusToggle />
              
              {/* Additional info card */}
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="font-semibold mb-2">Quick Info</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• AWS Mode: Use real credentials, data persists</li>
                  <li>• Demo Mode: Use demo buttons, local data only</li>
                  <li>• Default password: TempPassword123!</li>
                  <li>• You may need to change password on first login</li>
                </ul>
              </div>
            </div>
            
            {/* Right side - Login Form */}
            <div>
              <LoginForm onSuccess={onSuccess} showDemoMode={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};