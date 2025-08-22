/**
 * Login Page Component
 * Minimal, clean login page following modern design principles
 */

import React from 'react';
import { LoginForm } from './LoginForm';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm onSuccess={onSuccess} showDemoMode={false} />
      </div>
    </div>
  );
};