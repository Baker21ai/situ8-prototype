/**
 * Activities Page - Unified Ambient.AI Alert and Activity Management
 * Kanban-style interface for real-time security operations with Ambient.AI integration
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ActivityList } from '../src/presentation/organisms/lists/ActivityList';
import { ActivityErrorBoundaryWrapper } from '../src/presentation/atoms/errors';
import { ResponsiveActivityDetail } from './ResponsiveActivityDetail';
import { CommunicationsPanel } from './CommunicationsPanel';
import { RadioModal } from './RadioModal';
import { CommunicationsPage } from './CommunicationsPage';
import { CreateActivityModal } from './CreateActivityModal';
import { AssignActivityModal } from './modals/AssignActivityModal';
import { ModularCommandCenter } from './command/ModularCommandCenter';
import { useActivityStore } from '../stores';
import { useCaseStore } from '../stores/caseStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useServices, useApiClient } from '../services/ServiceProvider';
import { useModuleNavigation } from '../hooks/useModuleNavigation';
import { useErrorTracking } from '../hooks/useErrorTracking';
import { BreadcrumbNavigation } from './shared/BreadcrumbNavigation';
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
  // Error tracking
  const { trackAction, trackState, trackError, trackApi } = useErrorTracking('Activities');
  
  // Navigation system integration
  const navigation = useModuleNavigation();
  
  // Get AWS API client if configured
  const apiClient = useApiClient();
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true' && apiClient;
  
  // Use Zustand store for activities and stats with service integration
  const { 
    getActivityStats, 
    filteredActivities, 
    loading: activitiesLoading,
    error: activitiesError,
    createActivity,
    assignActivity,
    enableAmbientMode
  } = useActivityStore();
  
  // Case management hooks
  const { createCase } = useCaseStore();
  
  // Incident management hooks
  const { createIncident } = useIncidentStore();
  
  // Use services for business logic operations
  const { isInitialized, incidentService } = useServices();
  
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
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [commandCenterActivity, setCommandCenterActivity] = useState<EnterpriseActivity | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activityToAssign, setActivityToAssign] = useState<EnterpriseActivity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch activities from AWS API when configured
  const fetchAwsActivities = useCallback(async () => {
    if (!useAwsApi || !apiClient) return;
    
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

  // Initialize Ambient mode once on mount
  useEffect(() => {
    console.log('🔄 Enabling Ambient mode...');
    enableAmbientMode();
  }, []); // Only run once on mount
  
  // Choose data source based on configuration
  const currentActivities = useAwsApi ? awsActivities : filteredActivities;
  const currentLoading = useAwsApi ? awsLoading : activitiesLoading;
  const currentError = useAwsApi ? awsError : activitiesError;
  
  // Debug logging for current activities
  useEffect(() => {
    console.log('📊 Store filteredActivities count:', filteredActivities.length);
    console.log('📊 Store filteredActivities sample:', filteredActivities.slice(0, 3));
    console.log('📊 CurrentActivities (final) count:', currentActivities.length);
    console.log('📊 CurrentActivities (final) sample:', currentActivities.slice(0, 3));
  }, [filteredActivities, currentActivities]);

  // Fetch AWS data when configuration changes
  useEffect(() => {
    if (useAwsApi) {
      fetchAwsActivities();
    }
  }, [refreshKey, useAwsApi]);
  
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

  // Handle incident creation from activity with full service integration
  const handleCreateIncidentFromActivity = useCallback(async (activity: EnterpriseActivity) => {
    try {
      console.log('Creating incident from activity:', activity.id);
      
      // Create audit context from current user
      const auditContext = {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'officer',
        action: 'CREATE_INCIDENT_FROM_ACTIVITY',
        reason: `Auto-escalation from activity ${activity.id}`
      };
      
      // Check if we have the incident service for full business logic
      if (incidentService) {
        console.log('Using IncidentService for business logic compliance');
        const result = await incidentService.createIncidentFromActivity(activity, auditContext);
        
        if (result.success && result.data) {
          console.log('✅ Incident created via service:', result.data.id);
          // The service will handle audit trails and business rules
        } else {
          console.error('❌ Service incident creation failed:', result.error);
          throw new Error(result.error?.message || 'Service creation failed');
        }
      } else {
        // Fallback to store-based creation
        console.log('Using store fallback for incident creation');
        const incidentData = {
          title: `Incident: ${activity.title}`,
          description: `Auto-created from activity: ${activity.description}`,
          type: activity.type === 'medical' ? 'medical' : 
                activity.type === 'security-breach' ? 'security' : 'operational',
          priority: activity.priority,
          status: 'active' as const,
          source_activity_id: activity.id,
          auto_created: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        createIncident(incidentData);
        console.log('✅ Incident created via store fallback');
      }
    } catch (error) {
      console.error('Failed to create incident from activity:', error);
      // You could add a toast notification here
      // toast.error('Failed to create incident');
    }
  }, [incidentService, createIncident]);

  // Handle case creation from incident (manual escalation)
  const handleCreateCaseFromIncident = useCallback(async (incident: any) => {
    try {
      console.log('🔍 Escalating incident to investigation case:', incident.id);
      
      // Create audit context for case creation
      const auditContext = {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'officer',
        action: 'ESCALATE_INCIDENT_TO_CASE',
        reason: `Manual escalation from incident ${incident.id} to investigation case`
      };
      
      const caseData = {
        title: `Investigation: ${incident.title}`,
        description: `Investigation case escalated from incident: ${incident.description}`,
        type: 'incident_investigation' as const,
        priority: incident.priority,
        status: 'open' as const,
        currentPhase: 'initiation' as const,
        relatedIncidents: [incident.id],
        sourceIncidentId: incident.id,
        tags: ['incident-escalation', incident.type || 'general'],
        initialFindings: `Related to incident: ${incident.title} (${incident.id})`,
        investigationPlan: 'Comprehensive investigation plan to be developed based on incident details',
        escalationReason: 'Manual escalation requested for detailed investigation'
      };

      createCase(caseData);
      console.log('✅ Investigation case created from incident:', incident.id);
      
      // You could add a success notification here
      // toast.success('Investigation case created successfully');
    } catch (error) {
      console.error('❌ Failed to create case from incident:', error);
      // toast.error('Failed to create investigation case');
    }
  }, [createCase]);

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

  // Handle activity assignment
  const handleAssignActivity = useCallback(async (activityId: string, assigneeId: string, notes?: string, notifyAssignee?: boolean) => {
    try {
      trackApi('assign_activity_start', { activityId, assigneeId });
      
      // Get personnel name from ID for assignment
      const { getPersonnelById } = await import('../lib/data/personnel');
      const personnel = getPersonnelById(assigneeId);
      const assigneeName = personnel ? personnel.name : assigneeId;
      
      await assignActivity(activityId, assigneeName, {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'admin',
        action: 'assign_activity'
      });
      
      // TODO: Implement notification logic if notifyAssignee is true
      if (notifyAssignee && personnel) {
        console.log(`Would notify ${personnel.name} (${personnel.contactInfo?.radio || personnel.contactInfo?.phone}) about assignment of ${activityId}`);
      }
      
      // TODO: Add assignment notes to activity record
      if (notes) {
        console.log(`Assignment notes: ${notes}`);
      }
      
      trackApi('assign_activity_success', { activityId, assigneeId });
      setRefreshKey(prev => prev + 1); // Refresh the activity list
    } catch (error) {
      console.error('Error assigning activity:', error);
      trackError('assign_activity_error', error);
      throw error;
    }
  }, [assignActivity, trackApi, trackError]);

  // Handle activity actions with error boundary protection
  const handleActivityAction = useCallback((action: string, activity: EnterpriseActivity) => {
    try {
      console.log(`Activity action: ${action}`, activity);
      
      if (action === 'create_case') {
        handleCreateCaseFromActivity(activity);
      } else if (action === 'create_incident') {
        handleCreateIncidentFromActivity(activity);
      } else if (action === 'command-center') {
        setCommandCenterActivity(activity);
        setShowCommandCenter(true);
      } else if (action === 'assign') {
        setActivityToAssign(activity);
        setShowAssignModal(true);
      }
      // Additional action handling can be added here
    } catch (error) {
      console.error('Error handling activity action:', error);
    }
  }, [handleCreateCaseFromActivity, handleCreateIncidentFromActivity]);

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
      <div className="h-full flex flex-col bg-gray-50">
        {/* (Header block hidden) */}

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
                    {/* Header removed to avoid extra white space above first activity */}

                    {/* Filters temporarily hidden to eliminate any top spacing */}

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

        {/* Modular Command Center */}
        {showCommandCenter && commandCenterActivity && (
          <ActivityErrorBoundaryWrapper context="Modular Command Center">
            <ModularCommandCenter
              activity={commandCenterActivity}
              onClose={() => {
                setShowCommandCenter(false);
                setCommandCenterActivity(null);
              }}
            />
          </ActivityErrorBoundaryWrapper>
        )}

        {/* Assignment Modal */}
        <ActivityErrorBoundaryWrapper context="Assignment Modal">
          <AssignActivityModal
            isOpen={showAssignModal}
            activity={activityToAssign}
            onClose={() => {
              setShowAssignModal(false);
              setActivityToAssign(null);
            }}
            onAssign={handleAssignActivity}
            isLoading={activitiesLoading}
          />
        </ActivityErrorBoundaryWrapper>
      </div>
    </ActivityErrorBoundaryWrapper>
  );
}