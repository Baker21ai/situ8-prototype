import React from 'react';
import { ChatLayout } from './communications/ChatLayout';

// Chat page component for Situ8 communications
export function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Situ8 Communications Center</h1>
      </div>
      
      {/* Chat Layout */}
      <ChatLayout className="flex-1" showRadio={true} />
    </div>
  );
}