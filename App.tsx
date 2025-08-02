import React, { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from 'react';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { LoginForm } from './components/auth/LoginForm';
import { useAuth } from './stores/userStore';

// Lazy load heavy components for code splitting
const CommandCenter = lazy(() => import('./components/CommandCenter').then(m => ({ default: m.CommandCenter })));
const Activities = lazy(() => import('./components/Activities').then(m => ({ default: m.Activities })));
const CommunicationsPage = lazy(() => import('./components/CommunicationsPage').then(m => ({ default: m.CommunicationsPage })));
const VisitorManagementDashboard = lazy(() => import('./components/VisitorManagementDashboard').then(m => ({ default: m.VisitorManagementDashboard })));
const Cases = lazy(() => import('./components/Cases').then(m => ({ default: m.Cases })));
const PerformanceDashboard = lazy(() => import('./components/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })));
const Passdowns = lazy(() => import('./components/Passdowns').then(m => ({ default: m.Passdowns })));

import { ServiceProvider } from './services/ServiceProvider';
// Note: Commenting out for now due to compilation issues
// import { ServiceIntegrationProvider } from './src/infrastructure/ServiceIntegration';
import { initializeStores } from './stores';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { RadioTray } from './components/communications/RadioTray';
import { CommunicationsModal } from './components/communications/CommunicationsModal';
import { VirtualScrollingPerformanceTest } from './components/VirtualScrollingPerformanceTest';
import { AWSStatusIndicator } from './components/AWSStatusIndicator';
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
  Briefcase,
  Zap,
  ClipboardList
} from 'lucide-react';
import { useModuleNavigation, useModuleNavigationListener, setCurrentModule, type ModuleName, type NavigationContext } from './hooks/useModuleNavigation';

type Module = 'command-center' | 'activities' | 'communications' | 'visitors' | 'incidents' | 'cases' | 'bol' | 'passdowns' | 'lost-found' | 'keys' | 'reports' | 'users' | 'settings' | 'performance-test' | 'performance-dashboard';

// Memoize navigation items to prevent recreating on every render
const navigationItems = [
  { id: 'command-center', label: 'Command Center', icon: Shield, implemented: true },
  { id: 'activities', label: 'Activities', icon: Activity, implemented: true },
  { id: 'cases', label: 'Cases', icon: Briefcase, implemented: true },
  { id: 'passdowns', label: 'Passdowns', icon: ClipboardList, implemented: true },
  { id: 'communications', label: 'Communications', icon: MessageSquare, implemented: true },
  { id: 'visitors', label: 'Visitor Management', icon: Users, implemented: true },
  { id: 'performance-test', label: 'Virtual Scrolling Test', icon: Zap, implemented: true },
  { id: 'performance-dashboard', label: 'Performance Dashboard', icon: BarChart3, implemented: true },
  { id: 'guards', label: 'Guard Management', icon: Users, implemented: false },
  { id: 'map', label: 'Interactive Map', icon: MapPin, implemented: false },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, implemented: false },
  { id: 'settings', label: 'Settings', icon: Settings, implemented: false },
];

// Loading component for Suspense fallbacks
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-muted-foreground">Loading...</span>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Clock component
const Clock = memo(() => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-sm text-muted-foreground">
      {time}
    </div>
  );
});
Clock.displayName = 'Clock';

// Memoized Header Logo component
const HeaderLogo = memo(() => (
  <div className="flex items-center gap-3">
    <Shield className="h-8 w-8 text-blue-500" />
    <div>
      <h1 className="text-xl font-semibold">Situ8 Security Platform</h1>
      <p className="text-sm text-muted-foreground">Real-time security management</p>
    </div>
  </div>
));
HeaderLogo.displayName = 'HeaderLogo';

// Memoized User Badge component
const UserBadge = memo<{ userRole: string; user?: any }>(({ userRole, user }) => (
  <div className="flex items-center gap-4">
    <Badge variant="secondary">
      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
    </Badge>
    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
      {user?.profile?.avatar || user?.profile?.firstName?.charAt(0) || 'U'}
    </div>
  </div>
));
UserBadge.displayName = 'UserBadge';

// Memoized Navigation Item component
const NavigationItem = memo<{ 
  item: typeof navigationItems[0], 
  isActive: boolean, 
  isCollapsed: boolean, 
  onClick: () => void 
}>(({ item, isActive, isCollapsed, onClick }) => {
  const Icon = item.icon;
  
  const buttonContent = useMemo(() => (
    <Button
      variant={isActive ? "default" : "ghost"}
      className={`w-full transition-all duration-200 ${
        isCollapsed 
          ? 'justify-center p-2 h-10 w-10' 
          : 'justify-start gap-3 h-10'
      }`}
      onClick={onClick}
      disabled={!item.implemented}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && (
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
  ), [Icon, isActive, isCollapsed, onClick, item.implemented, item.label]);

  if (isCollapsed) {
    return (
      <Tooltip>
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
});
NavigationItem.displayName = 'NavigationItem';

// Memoized Stats component
const QuickStats = memo<{ collapsed: boolean }>(({ collapsed }) => {
  const stats = useMemo(() => [
    { label: 'Active Incidents', value: '3', variant: 'destructive' as const },
    { label: 'Guards on Duty', value: '12', variant: 'secondary' as const },
    { label: 'Today\'s Activities', value: '47', variant: 'outline' as const }
  ], []);

  if (collapsed) {
    return (
      <div className="mt-6 space-y-3">
        <Separator />
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <Tooltip key={stat.label}>
              <TooltipTrigger asChild>
                <div className="flex justify-center cursor-pointer">
                  <Badge 
                    variant={stat.variant} 
                    className={`w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs ${
                      stat.variant === 'destructive' ? 'animate-pulse' : ''
                    }`}
                  >
                    {stat.value}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {stat.label}: {stat.value}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Separator className="my-6" />
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Stats</h3>
        <div className="space-y-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex justify-between text-sm">
              <span>{stat.label}</span>
              <Badge variant={stat.variant} className="text-xs">{stat.value}</Badge>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
QuickStats.displayName = 'QuickStats';

// Main App component with optimizations
const App = memo(() => {
  // Authentication state
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  const [activeModule, setActiveModule] = useState<Module>('command-center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [communicationsModalOpen, setCommunicationsModalOpen] = useState(false);
  
  // If authentication is loading, show loading spinner
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center dark">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Initializing services...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show login form
  if (!isAuthenticated || !user) {
    return (
      <div className="dark">
        <LoginForm 
          onSuccess={() => {
            // Authentication successful, component will re-render with authenticated state
            console.log('Login successful, redirecting to main app');
          }}
          showDemoMode={true}
        />
      </div>
    );
  }
  
  // Extract user role for UI (convert from auth service format)
  const userRole = user.role.toLowerCase().replace('_', '-') as 'admin' | 'supervisor' | 'officer';

  // Enable dark mode for 24/7 operations (memoized)
  const enableDarkMode = useCallback(() => {
    document.documentElement.classList.add('dark');
  }, []);
  
  useEffect(() => {
    enableDarkMode();
  }, [enableDarkMode]);

  // Initialize Zustand stores (memoized)
  const initStores = useCallback(() => {
    initializeStores();
  }, []);
  
  useEffect(() => {
    initStores();
  }, [initStores]);

  // Memoized handlers
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Initialize navigation system
  const navigation = useModuleNavigation({
    onModuleChange: (module: ModuleName, context?: NavigationContext) => {
      setActiveModule(module as Module);
      setCurrentModule(module);
      
      // Handle navigation context if provided
      if (context) {
        console.log('Navigation context:', context);
        // Could handle specific context actions here
        // e.g., pre-fill forms, apply filters, highlight entities
      }
    }
  });

  // Listen for navigation events from other components
  useModuleNavigationListener((module: ModuleName, context?: NavigationContext) => {
    setActiveModule(module as Module);
    setCurrentModule(module);
    
    if (context) {
      console.log('Navigation event received:', module, context);
    }
  });

  const handleModuleChange = useCallback((moduleId: Module) => {
    navigation.navigateToModule(moduleId as ModuleName);
  }, [navigation]);

  // Memoized module content renderer with Suspense
  const renderModuleContent = useCallback(() => {
    const moduleProps = useMemo(() => ({
      communications: { onBackToCommandCenter: () => setActiveModule('command-center') }
    }), []);

    switch (activeModule) {
      case 'command-center':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CommandCenter />
          </Suspense>
        );
      case 'activities':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Activities />
          </Suspense>
        );
      case 'cases':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Cases />
          </Suspense>
        );
      case 'passdowns':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Passdowns />
          </Suspense>
        );
      case 'communications':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CommunicationsPage {...moduleProps.communications} />
          </Suspense>
        );
      case 'visitors':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <VisitorManagementDashboard />
          </Suspense>
        );
      case 'performance-test':
        return <VirtualScrollingPerformanceTest />;
      case 'performance-dashboard':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PerformanceDashboard />
          </Suspense>
        );
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
  }, [activeModule]);

  // Memoized navigation items with callbacks
  const navigationItemsWithCallbacks = useMemo(() => 
    navigationItems.map(item => ({
      ...item,
      onClick: () => handleModuleChange(item.id as Module)
    })), [handleModuleChange]
  );

  return (
    <ServiceProvider>
      <div className="h-screen flex flex-col dark">
        {/* Header */}
        <header className="border-b px-6 py-4 bg-background">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <div className="flex items-center gap-4">
              <AWSStatusIndicator />
              <Clock />
              <UserBadge userRole={userRole} user={user} />
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
                  onClick={toggleSidebar}
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

              {/* Navigation Items - Optimized */}
              <TooltipProvider>
                <div className="space-y-2">
                  {navigationItemsWithCallbacks.map((item) => (
                    <NavigationItem
                      key={item.id}
                      item={item}
                      isActive={activeModule === item.id}
                      isCollapsed={sidebarCollapsed}
                      onClick={item.onClick}
                    />
                  ))}
                </div>
              </TooltipProvider>
              
              <QuickStats collapsed={sidebarCollapsed} />
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
        
        {/* Radio Tray - Docked PTT Interface */}
        <RadioTray
          userId={user.id}
          userName={user.profile?.fullName || user.email}
          userRole={user.role}
          userClearance={user.clearanceLevel}
          token="authenticated-token" // Would be real token from auth service
          onOpenModal={() => setCommunicationsModalOpen(true)}
        />
        
        {/* Communications Modal */}
        <CommunicationsModal
          open={communicationsModalOpen}
          onOpenChange={setCommunicationsModalOpen}
          userId={user.id}
          userName={user.profile?.fullName || user.email}
          userRole={user.role}
          userClearance={user.clearanceLevel}
          token="authenticated-token" // Would be real token from auth service
        />
      </div>
    </ServiceProvider>
  );
});

App.displayName = 'App';

export default App;