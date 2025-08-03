import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  MessageSquare, 
  Users, 
  Bell, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { useCommunications } from '../hooks/useCommunications';
import { useUserStore } from '../stores/userStore';

interface CommunicationsPageProps {
  onBackToCommandCenter?: () => void;
}

export function CommunicationsPage({ onBackToCommandCenter }: CommunicationsPageProps = {}) {
  const [activeTab, setActiveTab] = useState('channels');
  const { currentUser: user } = useUserStore();
  const { channels, messages, guards } = useCommunications();

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">COMMUNICATIONS CENTER</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">3</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.profile?.fullName || user?.email || 'J.Smith'}</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Channels Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Active Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-sm text-gray-500">
                        {channel.activeCount}/{channel.totalCount} active
                      </div>
                    </div>
                    <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                      {channel.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{message.guardName}</span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {message.channel}
                      </Badge>
                      {message.priority && (
                        <Badge 
                          variant={message.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {message.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guards Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guards Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guards.map((guard) => (
                  <div key={guard.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{guard.name}</div>
                      <div className="text-sm text-gray-500">{guard.location}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        guard.status === 'available' ? 'bg-green-500' :
                        guard.status === 'responding' ? 'bg-blue-500' :
                        guard.status === 'investigating' ? 'bg-orange-500' :
                        guard.status === 'break' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm capitalize">{guard.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button>
                  <Radio className="h-4 w-4 mr-2" />
                  Open Radio
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Emergency Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}