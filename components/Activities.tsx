import { useState } from 'react';
import { EnterpriseActivityManager } from './EnterpriseActivityManager';
import { ResponsiveActivityDetail } from './ResponsiveActivityDetail';
import { CommunicationsPanel } from './CommunicationsPanel';
import { RadioModal } from './RadioModal';
import { CommunicationsPage } from './CommunicationsPage';
import { useActivityStore } from '../stores';
import { useServices } from '../services/ServiceProvider';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Building, 
  Camera, 
  Activity, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Radio,
  Headphones
} from 'lucide-react';

export function Activities() {
  // Use Zustand store for activities and stats with service integration
  const { 
    getActivityStats, 
    filteredActivities, 
    loading: activitiesLoading,
    error: activitiesError 
  } = useActivityStore();
  
  // Use services for business logic operations
  const { isInitialized } = useServices();
  
  const storeStats = getActivityStats();
  
  // Map store stats to expected facility stats format
  const facilityStats = {
    totalCameras: 847,
    activeCameras: 839,
    totalActivities: storeStats.total,
    recentActivities: storeStats.todayCount,
    criticalToday: storeStats.criticalCount,
    averageResponseTime: '4.2 minutes',
    falsePositiveRate: '12.8%',
    systemUptime: '99.97%',
    buildingsMonitored: 32,
    zonesMonitored: 256,
    employeesOnSite: 2847,
    securityPersonnel: 23
  };
  
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<any>(null);
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showCommunicationsPage, setShowCommunicationsPage] = useState(false);

  // Handle activity selection - open modal
  const handleActivitySelect = (activity: any) => {
    console.log('Selected activity:', activity);
    setSelectedActivityDetail(activity);
  };

  // Handle activity actions
  const handleActivityAction = (action: string, activity: any) => {
    console.log(`Activity action: ${action}`, activity);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string, activities: any[]) => {
    console.log(`Bulk action: ${action} on ${activities.length} activities`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header with Facility Overview - Compact */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold">Enterprise Activities Center</h1>
              <p className="text-sm text-muted-foreground">Amazon-scale security operations</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Service Status Indicators */}
              {activitiesLoading && (
                <Alert className="border-blue-600/20 bg-blue-600/10 px-2 py-1">
                  <AlertDescription className="text-blue-400 font-medium text-xs">
                    Loading...
                  </AlertDescription>
                </Alert>
              )}
              
              {activitiesError && (
                <Alert className="border-red-600/20 bg-red-600/10 px-2 py-1">
                  <AlertDescription className="text-red-400 font-medium text-xs">
                    {activitiesError}
                  </AlertDescription>
                </Alert>
              )}
              
              <Badge className={`border-blue-200 ${isInitialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <Activity className="h-3 w-3 mr-1" />
                {isInitialized ? 'Services Active' : 'Initializing'}
              </Badge>
              
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Camera className="h-3 w-3 mr-1" />
                {facilityStats.totalCameras} cameras
              </Badge>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRadioModal(true)}
                  className="flex items-center gap-1 h-8 px-3 text-sm"
                >
                  <Radio className="h-3 w-3" />
                  Radio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommunicationsPage(true)}
                  className="flex items-center gap-1 h-8 px-3 text-sm"
                >
                  <Headphones className="h-3 w-3" />
                  Comms
                </Button>
              </div>
            </div>
          </div>

          {/* Facility Stats Dashboard - Responsive & Compact */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3 mb-3">
            {[
              { icon: Camera, value: facilityStats.totalCameras, label: 'Cameras', color: 'text-blue-600' },
              { icon: Activity, value: facilityStats.totalActivities, label: 'Activities', color: 'text-green-600' },
              { icon: AlertTriangle, value: facilityStats.criticalToday, label: 'Critical', color: 'text-red-600', critical: true },
              { icon: Building, value: facilityStats.buildingsMonitored, label: 'Buildings', color: 'text-purple-600' },
              { icon: Users, value: facilityStats.employeesOnSite.toLocaleString(), label: 'Employees', color: 'text-orange-600' },
              { icon: TrendingUp, value: facilityStats.systemUptime, label: 'Uptime', color: 'text-teal-600' },
              { icon: Shield, value: facilityStats.securityPersonnel, label: 'Security', color: 'text-indigo-600' },
              { icon: Zap, value: facilityStats.averageResponseTime, label: 'Response', color: 'text-yellow-600' }
            ].map(({ icon: Icon, value, label, color, critical }) => (
              <Card 
                key={label} 
                className={`p-2 transition-all duration-200 hover:shadow-md ${
                  critical ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm md:text-lg font-semibold ${critical ? 'text-red-700' : ''} truncate`}>
                      {value}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {label}
                    </div>
                  </div>
                </div>
                {critical && parseInt(value.toString()) > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Optimized for Content Density */}
      <div className="flex-1 min-h-0 flex gap-3 p-3">
        {/* Left Panel - Enterprise Activity Manager (80% on desktop, responsive) */}
        <div className="flex-[4] lg:flex-[5]">
          <Card className="h-full shadow-lg border-0 bg-white">
            <CardContent className="p-0 h-full">
              <EnterpriseActivityManager
                activities={filteredActivities}
                onActivitySelect={handleActivitySelect}
                onActivityAction={handleActivityAction}
                onBulkAction={handleBulkAction}
                realTimeMode={true}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Communications Hub (20% on desktop, responsive) */}
        <div className="flex-[1] lg:flex-[1] xl:flex-[1] min-w-[300px]">
          <Card className="h-full shadow-lg border-0 bg-white">
            <CardContent className="p-0 h-full">
              <CommunicationsPanel 
                onOpenModal={() => setShowRadioModal(true)}
                onOpenFullPage={() => setShowCommunicationsPage(true)}
                activities={filteredActivities}
                showAllTab={true}
                defaultTab="all"
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Responsive Modern Activity Detail Modal */}
      {selectedActivityDetail && (
        <ResponsiveActivityDetail
          activity={{
            id: parseInt(selectedActivityDetail.id.toString()),
            type: selectedActivityDetail.type,
            title: selectedActivityDetail.title,
            description: selectedActivityDetail.description || '',
            location: selectedActivityDetail.location,
            time: selectedActivityDetail.timestamp,
            priority: selectedActivityDetail.priority,
            status: selectedActivityDetail.status,
            assignedTo: selectedActivityDetail.assignedTo || '',
            evidence: [],
            tags: []
          }}
          isOpen={!!selectedActivityDetail}
          onClose={() => setSelectedActivityDetail(null)}
          onUpdate={(activityId, updates) => {
            // Handle activity updates with real-time state management
            console.log('Activity update:', activityId, updates);
            
            // Update local state to reflect changes immediately
            setSelectedActivityDetail((prev: any) => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}

      {/* Radio Modal */}
      <RadioModal
        isOpen={showRadioModal}
        onClose={() => setShowRadioModal(false)}
        onOpenFullPage={() => {
          setShowRadioModal(false);
          setShowCommunicationsPage(true);
        }}
      />

      {/* Communications Page */}
      {showCommunicationsPage && (
        <div className="fixed inset-0 bg-white z-50">
          <CommunicationsPage
            onBackToCommandCenter={() => setShowCommunicationsPage(false)}
          />
        </div>
      )}
    </div>
  );
}