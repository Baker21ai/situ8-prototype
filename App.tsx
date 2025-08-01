import React, { useState, useEffect } from 'react';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { CommandCenter } from './components/CommandCenter';
import { Activities } from './components/Activities';
import { CommunicationsPage } from './components/CommunicationsPage';
import { VisitorManagementDashboard } from './components/VisitorManagementDashboard';
import { Cases } from './components/Cases';
import { ServiceProvider } from './services/ServiceProvider';
import { initializeStores } from './stores';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Briefcase
} from 'lucide-react';

type Module = 'command-center' | 'activities' | 'communications' | 'visitors' | 'incidents' | 'cases' | 'bol' | 'passdowns' | 'lost-found' | 'keys' | 'reports' | 'users' | 'settings';

const navigationItems = [
  { id: 'command-center', label: 'Command Center', icon: Shield, implemented: true },
  { id: 'activities', label: 'Activities', icon: Activity, implemented: true },
  { id: 'cases', label: 'Cases', icon: Briefcase, implemented: true },
  { id: 'communications', label: 'Communications', icon: MessageSquare, implemented: true },
  { id: 'visitors', label: 'Visitor Management', icon: Users, implemented: true },
  { id: 'guards', label: 'Guard Management', icon: Users, implemented: false },
  { id: 'map', label: 'Interactive Map', icon: MapPin, implemented: false },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, implemented: false },
  { id: 'settings', label: 'Settings', icon: Settings, implemented: false },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('command-center');
  const [userRole] = useState<'admin' | 'supervisor' | 'officer'>('admin');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enable dark mode for 24/7 operations
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Initialize Zustand stores
  useEffect(() => {
    initializeStores();
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'command-center':
        return <CommandCenter />;
      case 'activities':
        return <Activities />;
      case 'cases':
        return <Cases />;
      case 'communications':
        return <CommunicationsPage onBackToCommandCenter={() => setActiveModule('command-center')} />;
      case 'visitors':
        return <VisitorManagementDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Module Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This module will be implemented in a future phase of development.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <ServiceProvider>
      <div className="h-screen flex flex-col dark">
        {/* Header */}
        <header className="border-b px-6 py-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold">Situ8 Security Platform</h1>
                <p className="text-sm text-muted-foreground">Real-time security management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <Badge variant="secondary">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                A
              </div>
            </div>
          </div>
        </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r bg-background transition-all duration-300 ease-in-out`}>
          <div className="p-4">
            {/* Toggle Button */}
            <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Navigation Items */}
            <TooltipProvider>
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  
                  const buttonContent = (
                    <Button
                      key={item.id}
                      variant={activeModule === item.id ? "default" : "ghost"}
                      className={`w-full transition-all duration-200 ${
                        sidebarCollapsed 
                          ? 'justify-center p-2 h-10 w-10' 
                          : 'justify-start gap-3 h-10'
                      }`}
                      onClick={() => setActiveModule(item.id as Module)}
                      disabled={!item.implemented}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {!item.implemented && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              Soon
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          {buttonContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.label}
                          {!item.implemented && (
                            <Badge variant="outline" className="text-xs">
                              Soon
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return buttonContent;
                })}
              </div>
            </TooltipProvider>
            
            {!sidebarCollapsed && (
              <>
                <Separator className="my-6" />
                
                {/* Quick Stats */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Incidents</span>
                      <Badge variant="destructive" className="text-xs">3</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Guards on Duty</span>
                      <Badge variant="secondary" className="text-xs">12</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Today's Activities</span>
                      <Badge variant="outline" className="text-xs">47</Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Collapsed Stats - Mini badges */}
            {sidebarCollapsed && (
              <div className="mt-6 space-y-3">
                <Separator />
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center cursor-pointer">
                        <Badge variant="destructive" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse">
                          3
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Active Incidents: 3
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center cursor-pointer">
                        <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                          12
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Guards on Duty: 12
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center cursor-pointer">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                          47
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Today's Activities: 47
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderModuleContent()}
        </main>
      </div>
      
        {/* Toast Notifications */}
        <Toaster />

        {/* AI Assistant - Floating Panel */}
        <AIAssistantPanel />
      </div>
    </ServiceProvider>
  );
}