import React, { useState } from 'react';
import { ContactsPanel } from './ContactsPanel';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { RadioCommunications } from '../RadioCommunications';
import { Button } from '../ui/button';
import { 
  Users, 
  MessageCircle, 
  Radio,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface ChatLayoutProps {
  className?: string;
  showRadio?: boolean;
}

export function ChatLayout({ className = '', showRadio = true }: ChatLayoutProps) {
  const [activePanel, setActivePanel] = useState<'contacts' | 'chats' | 'radio'>('chats');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleContactSelect = (contact: any) => {
    // In real implementation, this would create or find a direct conversation
    console.log('Selected contact:', contact);
    // For now, just switch to chat panel
    setActivePanel('chats');
  };

  const handleGroupSelect = (group: any) => {
    console.log('Selected group:', group);
    setActivePanel('chats');
  };

  const handleBuildingSelect = (building: any) => {
    console.log('Selected building:', building);
    setActivePanel('chats');
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleCreateConversation = () => {
    setShowCreateGroup(true);
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <div className={`${
        isSidebarCollapsed ? 'w-16' : 'w-80'
      } border-r bg-white transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className={`font-semibold ${isSidebarCollapsed ? 'hidden' : ''}`}>
              Communications
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Panel Tabs */}
        <div className={`flex ${isSidebarCollapsed ? 'flex-col' : ''} border-b`}>
          <Button
            variant={activePanel === 'chats' ? 'default' : 'ghost'}
            size="sm"
            className={`flex-1 rounded-none ${isSidebarCollapsed ? 'h-12 w-full' : ''}`}
            onClick={() => setActivePanel('chats')}
          >
            <MessageCircle className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
            {!isSidebarCollapsed && 'Chats'}
          </Button>
          <Button
            variant={activePanel === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            className={`flex-1 rounded-none ${isSidebarCollapsed ? 'h-12 w-full' : ''}`}
            onClick={() => setActivePanel('contacts')}
          >
            <Users className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
            {!isSidebarCollapsed && 'Contacts'}
          </Button>
          {showRadio && (
            <Button
              variant={activePanel === 'radio' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 rounded-none ${isSidebarCollapsed ? 'h-12 w-full' : ''}`}
              onClick={() => setActivePanel('radio')}
            >
              <Radio className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
              {!isSidebarCollapsed && 'Radio'}
            </Button>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {!isSidebarCollapsed && (
            <>
              {activePanel === 'contacts' && (
                <ContactsPanel
                  onContactSelect={handleContactSelect}
                  onGroupSelect={handleGroupSelect}
                  onBuildingSelect={handleBuildingSelect}
                  className="h-full"
                />
              )}
              {activePanel === 'chats' && (
                <ChatList
                  onConversationSelect={handleConversationSelect}
                  onCreateConversation={handleCreateConversation}
                  className="h-full"
                />
              )}
              {activePanel === 'radio' && showRadio && (
                <RadioCommunications className="h-full" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatWindow
          conversationId={selectedConversationId || undefined}
          className="h-full"
        />
      </div>
    </div>
  );
}