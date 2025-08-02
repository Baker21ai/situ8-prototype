/**
 * Activities Page - Enterprise-scale activity management with comprehensive error handling
 * Integrates the new compound ActivityList component with production-ready error boundaries
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ActivityList } from '../src/presentation/organisms/lists/ActivityList';
import { ActivityErrorBoundaryWrapper } from '../src/presentation/atoms/errors';
import { ResponsiveActivityDetail } from './ResponsiveActivityDetail';
import { CommunicationsPanel } from './CommunicationsPanel';
import { RadioModal } from './RadioModal';
import { CommunicationsPage } from './CommunicationsPage';
import { CreateActivityModal } from './CreateActivityModal';
import { useActivityStore } from '../stores';
import { useCaseStore } from '../stores/caseStore';
import { useServices, useApiClient } from '../services/ServiceProvider';
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
  Headphones,
  Plus,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { ActivityType } from '../lib/utils/security';
import { Priority, Status } from '../lib/utils/status';
import { EnterpriseActivity } from '../lib/types/activity';

export function Activities() {
  // Get AWS API client if configured
  const apiClient = useApiClient();
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true' && apiClient;
  
  // Use Zustand store for activities and stats with service integration
  const { 
    getActivityStats, 
    filteredActivities, 
    loading: activitiesLoading,
    error: activitiesError,
    createActivity
  } = useActivityStore();
  
  // Case management hooks
  const { createCase } = useCaseStore();
  
  // Use services for business logic operations
  const { isInitialized } = useServices();
  
  // Add state for AWS API loading and error handling
  const [awsLoading, setAwsLoading] = useState(false);
  const [awsError, setAwsError] = useState<string | null>(null);
  
  const storeStats = getActivityStats();
  
  // AWS API data state
  const [awsActivities, setAwsActivities] = useState<EnterpriseActivity[]>([]);
  const [awsStats, setAwsStats] = useState<any>(null);
  
  // Calculate current stats (moved before usage)
  const currentStats = useAwsApi ? (awsStats || { total: 0, todayCount: 0, criticalCount: 0 }) : storeStats;
  
  // Map current stats to expected facility stats format
  const facilityStats = useMemo(() => ({
    totalCameras: 847,
    activeCameras: 839,
    totalActivities: currentStats.total,
    recentActivities: currentStats.todayCount,
    criticalToday: currentStats.criticalCount,
    averageResponseTime: '4.2 minutes',
    falsePositiveRate: '12.8%',
    systemUptime: '99.97%',
    buildingsMonitored: 32,
    zonesMonitored: 256,
    employeesOnSite: 2847,
    securityPersonnel: 23
  }), [currentStats]);
  
  const [selectedActivity, setSelectedActivity] = useState<EnterpriseActivity | null>(null);
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showCommunicationsPage, setShowCommunicationsPage] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch activities from AWS API when configured
  const fetchAwsActivities = useCallback(async () => {
    if (!useAwsApi) return;
    
    setAwsLoading(true);
    setAwsError(null);
    
    try {
      const response = await apiClient.getActivities();
      if (response.success && response.data) {
        setAwsActivities(response.data);
        // Calculate basic stats from AWS data
        const total = response.data.length;
        const todayCount = response.data.filter((a: any) => {
          const today = new Date().toDateString();
          return new Date(a.timestamp).toDateString() === today;
        }).length;
        const criticalCount = response.data.filter((a: any) => a.priority === 'critical').length;
        
        setAwsStats({
          total,
          todayCount,
          criticalCount
        });
      } else {
        setAwsError(response.error || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching AWS activities:', error);
      setAwsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAwsLoading(false);
    }
  }, [useAwsApi, apiClient]);

  // Fetch data on component mount and when refresh key changes
  useEffect(() => {
    if (useAwsApi) {
      fetchAwsActivities();
    }
  }, [fetchAwsActivities, refreshKey]);

  // Choose data source based on configuration
  const currentActivities = useAwsApi ? awsActivities : filteredActivities;
  const currentLoading = useAwsApi ? awsLoading : activitiesLoading;
  const currentError = useAwsApi ? awsError : activitiesError;

  // Handle case creation from activity
  const handleCreateCaseFromActivity = useCallback(async (activity: EnterpriseActivity) => {
    try {
      const caseData = {
        title: `Investigation: ${activity.title}`,
        description: `Investigation case created from activity: ${activity.description}`,
        caseType: 'incident_investigation' as const,
        priority: activity.priority,
        status: 'draft' as const,
        currentPhase: 'initiation' as const,
        relatedActivities: [activity.id],
        tags: ['activity-created', activity.type || 'general'],
        initialFindings: `Related to activity: ${activity.title} (${activity.id})`,
        investigationPlan: 'Initial investigation plan to be developed'
      };

      createCase(caseData);
      console.log('Case created from activity:', activity.id);
      
      // You could add a success notification here
      // toast.success('Investigation case created successfully');
    } catch (error) {
      console.error('Failed to create case from activity:', error);
      // toast.error('Failed to create case');
    }
  }, [createCase]);

  // Handle incident creation from activity (placeholder for future implementation)
  const handleCreateIncidentFromActivity = useCallback(async (activity: EnterpriseActivity) => {
    try {
      console.log('Creating incident from activity:', activity.id);
      // TODO: Implement incident creation when incident store is available
      // const incidentData = {
      //   title: `Incident: ${activity.title}`,
      //   description: activity.description,
      //   priority: activity.priority,
      //   relatedActivities: [activity.id]
      // };
      // createIncident(incidentData);
    } catch (error) {
      console.error('Failed to create incident from activity:', error);
    }
  }, []);

  // Handle activity selection with error boundary protection
  const handleActivitySelect = useCallback((activity: EnterpriseActivity) => {
    try {
      setSelectedActivity(activity);
    } catch (error) {
      console.error('Error selecting activity:', error);
    }
  }, []);

  // Handle closing activity detail modal
  const handleCloseActivityDetail = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  // Handle activity actions with error boundary protection
  const handleActivityAction = useCallback((action: string, activity: EnterpriseActivity) => {
    try {
      console.log(`Activity action: ${action}`, activity);
      
      if (action === 'create_case') {
        handleCreateCaseFromActivity(activity);
      } else if (action === 'create_incident') {
        handleCreateIncidentFromActivity(activity);
      }
      // Additional action handling can be added here
    } catch (error) {
      console.error('Error handling activity action:', error);
    }
  }, []);

  // Handle bulk actions with error boundary protection
  const handleBulkAction = useCallback((action: string, activities: EnterpriseActivity[]) => {
    try {
      console.log(`Bulk action: ${action} on ${activities.length} activities`);
      // Additional bulk action handling can be added here
    } catch (error) {
      console.error('Error handling bulk action:', error);
    }
  }, []);

  // Handle creating new activity
  const handleActivityCreated = useCallback(async (activityData?: any) => {
    if (useAwsApi && activityData) {
      // Create activity via AWS API
      try {
        setAwsLoading(true);
        const response = await apiClient.createActivity(activityData);
        if (response.success) {
          console.log('Activity created via AWS API successfully');
          await fetchAwsActivities(); // Refresh the list
        } else {
          setAwsError(response.error || 'Failed to create activity');
        }
      } catch (error) {
        console.error('Error creating activity via AWS API:', error);
        setAwsError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setAwsLoading(false);
      }
    } else {
      console.log('Activity created via Zustand successfully');
      // Force refresh of activities list
      setRefreshKey(prev => prev + 1);
    }
  }, [useAwsApi, apiClient, fetchAwsActivities]);

  // Handle system refresh
  const handleSystemRefresh = useCallback(async () => {
    try {
      if (useAwsApi) {
        // Refresh AWS data
        fetchAwsActivities();
      } else {
        // Refresh Zustand store - using direct fetch method
        await fetchAwsActivities();
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing system:', error);
    }
  }, [useAwsApi, fetchAwsActivities]);

  return (
    <ActivityErrorBoundaryWrapper context="Activities Page Root">
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Enhanced Header with Facility Overview - Compact */}
        <ActivityErrorBoundaryWrapper context="Activities Header">
          <div className="flex-shrink-0 bg-white border-b shadow-sm">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-semibold">Enterprise Activities Center</h1>
                  <p className="text-sm text-muted-foreground">Amazon-scale security operations</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Service Status Indicators */}
                  {currentLoading && (
                    <Alert className="border-blue-600/20 bg-blue-600/10 px-2 py-1">
                      <AlertDescription className="text-blue-400 font-medium text-xs">
                        {useAwsApi ? 'Loading from AWS...' : 'Loading...'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {currentError && (
                    <Alert className="border-red-600/20 bg-red-600/10 px-2 py-1">
                      <AlertDescription className="text-red-400 font-medium text-xs">
                        {currentError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {currentError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSystemRefresh}
                      className="flex items-center gap-1 h-8 px-3 text-sm border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
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
                    {/* Create Activity Button */}
                    <ActivityErrorBoundaryWrapper context="Create Activity Modal">
                      <CreateActivityModal
                        onActivityCreated={handleActivityCreated}
                        trigger={
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1 h-8 px-3 text-sm bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-3 w-3" />
                            Create Activity
                          </Button>
                        }
                      />
                    </ActivityErrorBoundaryWrapper>

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
              <ActivityErrorBoundaryWrapper context="Facility Stats Dashboard">
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
              </ActivityErrorBoundaryWrapper>
            </div>
          </div>
        </ActivityErrorBoundaryWrapper>

        {/* Main Content Area - Optimized for Content Density */}
        <div className="flex-1 min-h-0 flex gap-3 p-3 overflow-hidden">
          {/* Left Panel - New Compound Activity List (80% on desktop, responsive) */}
          <div className="flex-[4] lg:flex-[5] min-w-0">
            <Card className="h-full shadow-lg border-0 bg-white max-w-full">
              <CardContent className="p-0 h-full max-w-full">
                <ActivityErrorBoundaryWrapper context="Activity List Component">
                  <ActivityList
                    key={refreshKey}
                    activities={currentActivities}
                    onActivitySelect={handleActivitySelect}
                    onActivityAction={handleActivityAction}
                    onBulkAction={handleBulkAction}
                    realTimeMode={true}
                    height={600}
                    className="h-full max-w-full"
                  >
                    {/* Header with Search and Controls */}
                    <ActivityErrorBoundaryWrapper context="Activity List Header">
                      <ActivityList.Header>
                        <div className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              Activity Stream
                            </h2>
                            <ActivityList.Stats />
                          </div>
                          <div className="flex items-center gap-2">
                            <ActivityList.Search />
                            <ActivityList.ViewToggle />
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </ActivityList.Header>
                    </ActivityErrorBoundaryWrapper>

                    {/* Filters Section */}
                    <ActivityErrorBoundaryWrapper context="Activity List Filters">
                      <ActivityList.Filters />
                    </ActivityErrorBoundaryWrapper>

                    {/* Main Content - Virtual Scrolling List */}
                    <ActivityErrorBoundaryWrapper context="Activity List Content">
                      <ActivityList.Content />
                    </ActivityErrorBoundaryWrapper>

                    {/* Footer with Pagination and Actions */}
                    <ActivityErrorBoundaryWrapper context="Activity List Footer">
                      <ActivityList.Footer />
                    </ActivityErrorBoundaryWrapper>
                  </ActivityList>
                </ActivityErrorBoundaryWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Communications Hub (20% on desktop, responsive) */}
          <div className="flex-[1] lg:flex-[1] xl:flex-[1] min-w-[300px] max-w-full">
            <Card className="h-full shadow-lg border-0 bg-white max-w-full">
              <CardContent className="p-0 h-full max-w-full">
                <ActivityErrorBoundaryWrapper context="Communications Panel">
                  <CommunicationsPanel 
                    onOpenModal={() => setShowRadioModal(true)}
                    onOpenFullPage={() => setShowCommunicationsPage(true)}
                    activities={currentActivities}
                    showAllTab={true}
                    defaultTab="all"
                    className="h-full"
                  />
                </ActivityErrorBoundaryWrapper>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal Components with Error Boundaries */}
        
        {/* Responsive Modern Activity Detail Modal */}
        {selectedActivity && (
          <ActivityErrorBoundaryWrapper context="Activity Detail Modal">
            <ResponsiveActivityDetail
              activity={{
                id: parseInt(selectedActivity.id.toString()),
                type: selectedActivity.type,
                title: selectedActivity.title,
                description: selectedActivity.description || '',
                location: selectedActivity.location,
                time: selectedActivity.timestamp,
                priority: selectedActivity.priority,
                status: selectedActivity.status,
                assignedTo: selectedActivity.assignedTo || '',
                evidence: [],
                tags: []
              }}
              isOpen={!!selectedActivity}
              onClose={handleCloseActivityDetail}
              onUpdate={(activityId, updates) => {
                try {
                  console.log('Activity update:', activityId, updates);
                  setSelectedActivity((prev) => 
                    prev ? { ...prev, ...updates } as EnterpriseActivity : null
                  );
                } catch (error) {
                  console.error('Error updating activity:', error);
                }
              }}
            />
          </ActivityErrorBoundaryWrapper>
        )}

        {/* Radio Modal */}
        <ActivityErrorBoundaryWrapper context="Radio Modal">
          <RadioModal
            isOpen={showRadioModal}
            onClose={() => setShowRadioModal(false)}
            onOpenFullPage={() => {
              setShowRadioModal(false);
              setShowCommunicationsPage(true);
            }}
          />
        </ActivityErrorBoundaryWrapper>

        {/* Communications Page */}
        {showCommunicationsPage && (
          <ActivityErrorBoundaryWrapper context="Communications Page">
            <div className="fixed inset-0 bg-white z-50">
              <CommunicationsPage
                onBackToCommandCenter={() => setShowCommunicationsPage(false)}
              />
            </div>
          </ActivityErrorBoundaryWrapper>
        )}
      </div>
    </ActivityErrorBoundaryWrapper>
  );
}