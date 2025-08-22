import React from 'react';
import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { ChatLayout } from './communications/ChatLayout';

interface CommunicationsPageProps {
  onBackToCommandCenter?: () => void;
}

export function CommunicationsPage({ onBackToCommandCenter }: CommunicationsPageProps = {}) {
  const { currentUser: user } = useUserStore();
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold">Communications</h1>
        </div>
        <div className="text-sm text-gray-600">
          {user?.profile?.fullName || user?.email || 'User'}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ChatLayout />
      </div>
      {onBackToCommandCenter && (
        <div className="border-t p-2 text-right">
          <Button variant="outline" size="sm" onClick={onBackToCommandCenter}>Back</Button>
        </div>
      )}
    </div>
  );
}