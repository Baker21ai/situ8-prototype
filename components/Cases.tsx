/**
 * Cases Component
 * Main UI for viewing and managing investigation cases
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useCaseStore } from '../stores/caseStore';
import { useServices, useApiClient } from '../services/ServiceProvider';
import { useModuleNavigation, generateBreadcrumbs, type NavigationContext } from '../hooks/useModuleNavigation';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Grid, 
  List, 
  Filter,
  Plus,
  Archive,
  ChevronDown,
  User,
  MapPin,
  Tag,
  CheckCircle,
  Eye,
  Search,
  Briefcase,
  Shield,
  AlertTriangle,
  FileText,
  Users,
  Building,
  Scale
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { 
  CaseStatus, 
  CaseType,
  InvestigationPhase 
} from '../lib/types/case';

// SimpleCase interface from store  
interface SimpleCase {
  id: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  leadInvestigatorId?: string;
  createdAt: string;
  description: string;
  caseType: CaseType;
  currentPhase: InvestigationPhase;
  primarySiteId?: string;
  targetCompletionDate?: string;
  regulatoryDeadline?: string;
  tags?: string[];
}
import { formatDistanceToNow } from 'date-fns';
import { CaseCreateForm } from './CaseCreateForm';
import { CaseDetailView } from './CaseDetailView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

// Case type display mapping with icons
const caseTypeConfig: Record<CaseType, { label: string; icon: React.ReactNode; color: string }> = {
  security_investigation: { 
    label: 'Security Investigation', 
    icon: <Shield className="w-4 h-4" />, 
    color: 'bg-red-100 text-red-800' 
  },
  incident_investigation: { 
    label: 'Incident Investigation', 
    icon: <AlertTriangle className="w-4 h-4" />, 
    color: 'bg-orange-100 text-orange-800' 
  },
  safety_investigation: { 
    label: 'Safety Investigation', 
    icon: <Shield className="w-4 h-4" />, 
    color: 'bg-yellow-100 text-yellow-800' 
  },
  fraud_investigation: { 
    label: 'Fraud Investigation', 
    icon: <Search className="w-4 h-4" />, 
    color: 'bg-purple-100 text-purple-800' 
  },
  compliance_investigation: { 
    label: 'Compliance Investigation', 
    icon: <FileText className="w-4 h-4" />, 
    color: 'bg-blue-100 text-blue-800' 
  },
  property_investigation: { 
    label: 'Property Investigation', 
    icon: <Building className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-800' 
  },
  personnel_investigation: { 
    label: 'Personnel Investigation', 
    icon: <Users className="w-4 h-4" />, 
    color: 'bg-indigo-100 text-indigo-800' 
  },
  operational_investigation: { 
    label: 'Operational Investigation', 
    icon: <Briefcase className="w-4 h-4" />, 
    color: 'bg-gray-100 text-gray-800' 
  },
  environmental_investigation: { 
    label: 'Environmental Investigation', 
    icon: <Archive className="w-4 h-4" />, 
    color: 'bg-teal-100 text-teal-800' 
  },
  quality_investigation: { 
    label: 'Quality Investigation', 
    icon: <CheckCircle className="w-4 h-4" />, 
    color: 'bg-cyan-100 text-cyan-800' 
  },
  audit_investigation: { 
    label: 'Audit Investigation', 
    icon: <FileText className="w-4 h-4" />, 
    color: 'bg-pink-100 text-pink-800' 
  },
  legal_investigation: { 
    label: 'Legal Investigation', 
    icon: <Scale className="w-4 h-4" />, 
    color: 'bg-rose-100 text-rose-800' 
  },
  other: { 
    label: 'Other Investigation', 
    icon: <Archive className="w-4 h-4" />, 
    color: 'bg-gray-100 text-gray-800' 
  }
};

// Priority level colors and icons  
const priorityConfig: Record<'low' | 'medium' | 'high' | 'critical', { color: string; icon: React.ReactNode }> = {
  low: { color: 'bg-green-100 text-green-800', icon: null },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
  high: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-3 h-3" /> },
  critical: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> }
};

// Status colors
const statusConfig: Record<CaseStatus, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
  pending_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
  on_hold: { color: 'bg-orange-100 text-orange-800', label: 'On Hold' },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  closed: { color: 'bg-gray-100 text-gray-600', label: 'Closed' },
  archived: { color: 'bg-gray-100 text-gray-500', label: 'Archived' }
};

// Phase display mapping
const phaseConfig: Record<InvestigationPhase, { label: string; color: string }> = {
  initiation: { label: 'Initiation', color: 'bg-blue-100 text-blue-800' },
  evidence_collection: { label: 'Evidence Collection', color: 'bg-purple-100 text-purple-800' },
  analysis: { label: 'Analysis', color: 'bg-indigo-100 text-indigo-800' },
  interviews: { label: 'Interviews', color: 'bg-orange-100 text-orange-800' },
  verification: { label: 'Verification', color: 'bg-yellow-100 text-yellow-800' },
  reporting: { label: 'Reporting', color: 'bg-teal-100 text-teal-800' },
  review: { label: 'Review', color: 'bg-green-100 text-green-800' },
  closure: { label: 'Closure', color: 'bg-gray-100 text-gray-800' }
};

interface CasesProps {
  onCreateNew?: () => void;
  onSelectCase?: (caseItem: SimpleCase) => void;
}

export function Cases({ onCreateNew, onSelectCase }: CasesProps) {
  // Get AWS API client if configured
  const apiClient = useApiClient();
  const useAwsApi = process.env.REACT_APP_USE_AWS_API === 'true' && apiClient;
  
  const {
    cases,
    loading,
    error,
    fetchCases,
    clearError,
    getCaseStats,
    initializeWithSampleData
  } = useCaseStore();

  // Get stats from the store method
  const stats = getCaseStats();

  // Navigation system integration
  const navigation = useModuleNavigation();
  
  // Check for navigation context on mount
  useEffect(() => {
    const context = navigation.getNavigationContext('cases');
    if (context) {
      // Handle different navigation contexts
      if (context.action === 'create' && context.sourceEntityId) {
        // Show create form with pre-filled data from source entity
        setShowCreateForm(true);
        console.log('Opening case creation from:', context.sourceEntityType, context.sourceEntityId);
      } else if (context.action === 'view' && context.sourceEntityId) {
        // Filter cases related to source entity
        if (context.sourceEntityType === 'activity') {
          setSearchTerm(context.sourceEntityId);
        }
        console.log('Viewing cases related to:', context.sourceEntityType, context.sourceEntityId);
      }
      
      // Clear context after handling
      navigation.clearNavigationContext('cases');
    }
  }, [navigation]);
  
  // AWS API data state
  const [awsCases, setAwsCases] = useState<SimpleCase[]>([]);
  const [awsLoading, setAwsLoading] = useState(false);
  const [awsError, setAwsError] = useState<string | null>(null);
  const [awsStats, setAwsStats] = useState<any>(null);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);

  // Fetch cases from AWS API when configured
  const fetchAwsCases = React.useCallback(async () => {
    if (!useAwsApi) return;
    
    setAwsLoading(true);
    setAwsError(null);
    
    try {
      const response = await apiClient.getCases();
      if (response.success && response.data) {
        setAwsCases(response.data);
        
        // Calculate basic stats from AWS data
        const total = response.data.length;
        const active = response.data.filter((c: any) => c.status === 'active').length;
        const completed = response.data.filter((c: any) => c.status === 'completed' || c.status === 'closed').length;
        const draft = response.data.filter((c: any) => c.status === 'draft').length;
        const criticalCount = response.data.filter((c: any) => c.priority === 'critical').length;
        
        setAwsStats({
          total,
          active,
          completed,
          draft,
          criticalCount,
          closedCount: completed,
          byStatus: {
            open: draft + active,
            investigating: active,
            evidence_collection: 0,
            analysis: 0,
            closed: completed
          }
        });
      } else {
        setAwsError(response.error || 'Failed to fetch cases');
      }
    } catch (error) {
      console.error('Error fetching AWS cases:', error);
      setAwsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAwsLoading(false);
    }
  }, [useAwsApi, apiClient]);

  // Initial fetch
  useEffect(() => {
    if (useAwsApi) {
      fetchAwsCases();
    } else {
      // Initialize with sample data for testing if no cases exist
      if (cases.length === 0) {
        initializeWithSampleData();
      }
      fetchCases();
    }
  }, [useAwsApi, fetchAwsCases, fetchCases, cases.length, initializeWithSampleData]);

  // Choose data source based on configuration
  const currentCases = useAwsApi ? awsCases : cases;
  const currentLoading = useAwsApi ? awsLoading : loading;
  const currentError = useAwsApi ? awsError : error;
  const currentStats = useAwsApi ? (awsStats || { total: 0, active: 0, completed: 0, draft: 0, criticalCount: 0, closedCount: 0, byStatus: {} }) : stats;

  // Filter cases based on search and filters
  const filteredCases = useMemo(() => {
    let filtered = currentCases;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.caseNumber.toLowerCase().includes(term) ||
        c.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.caseType === typeFilter);
    }

    // Phase filter
    if (phaseFilter !== 'all') {
      filtered = filtered.filter(c => c.currentPhase === phaseFilter);
    }

    return filtered;
  }, [currentCases, searchTerm, statusFilter, priorityFilter, typeFilter, phaseFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setPhaseFilter('all');
  };

  // Calculate if case is overdue
  const isOverdue = (caseItem: SimpleCase) => {
    const now = new Date();
    return (caseItem.targetCompletionDate && new Date(caseItem.targetCompletionDate) < now) ||
           (caseItem.regulatoryDeadline && new Date(caseItem.regulatoryDeadline) < now);
  };

  // Handle case selection
  const handleSelectCase = (caseItem: SimpleCase) => {
    setSelectedCaseId(caseItem.id);
    setShowCaseDetail(true);
    onSelectCase?.(caseItem);
  };

  // Render loading state
  if (currentLoading && currentCases.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (currentError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{currentError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={clearError}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  // Render list item
  const renderListItem = (caseItem: SimpleCase) => (
    <Card
      key={caseItem.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleSelectCase(caseItem)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{caseItem.title}</h3>
              <Badge variant="outline" className="text-xs font-mono">
                {caseItem.caseNumber}
              </Badge>
              {isOverdue(caseItem) && (
                <Badge className="bg-red-100 text-red-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2">{caseItem.description}</p>

            <div className="flex flex-wrap gap-2 text-sm">
              <Badge className={caseTypeConfig[caseItem.caseType].color}>
                {caseTypeConfig[caseItem.caseType].icon}
                <span className="ml-1">{caseTypeConfig[caseItem.caseType].label}</span>
              </Badge>
              
              <Badge className={priorityConfig[caseItem.priority].color}>
                {priorityConfig[caseItem.priority].icon}
                <span className="ml-1">{caseItem.priority}</span>
              </Badge>

              <Badge className={statusConfig[caseItem.status].color}>
                {statusConfig[caseItem.status].label}
              </Badge>

              <Badge className={phaseConfig[caseItem.currentPhase].color}>
                {phaseConfig[caseItem.currentPhase].label}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Lead: {caseItem.leadInvestigatorId || 'Unassigned'}
                </span>
                {caseItem.primarySiteId && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {caseItem.primarySiteId}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {caseItem.tags && caseItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {caseItem.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render grid item
  const renderGridItem = (caseItem: SimpleCase) => (
    <Card
      key={caseItem.id}
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={() => handleSelectCase(caseItem)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-2">{caseItem.title}</CardTitle>
          {isOverdue(caseItem) && (
            <Badge className="bg-red-100 text-red-800 flex-shrink-0">
              <Clock className="w-3 h-3" />
            </Badge>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Badge className={priorityConfig[caseItem.priority].color}>
            {priorityConfig[caseItem.priority].icon}
            <span className="ml-1">{caseItem.priority}</span>
          </Badge>
          <Badge className={statusConfig[caseItem.status].color}>
            {statusConfig[caseItem.status].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Badge variant="outline" className="text-xs font-mono">
          {caseItem.caseNumber}
        </Badge>
        
        <p className="text-sm text-gray-600 line-clamp-3">{caseItem.description}</p>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            {caseTypeConfig[caseItem.caseType].icon}
            <span>{caseTypeConfig[caseItem.caseType].label}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-3 h-3" />
            <span>Lead: {caseItem.leadInvestigatorId || 'Unassigned'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            <Badge className={phaseConfig[caseItem.currentPhase].color}>
              {phaseConfig[caseItem.currentPhase].label}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-500">
            {caseItem.primarySiteId && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {caseItem.primarySiteId}
              </span>
            )}
          </div>
          
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // Generate breadcrumbs based on current context
  const breadcrumbs = navigation.generateBreadcrumbs();

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.module ? (
                <button
                  onClick={() => crumb.module && navigation.navigateToModule(crumb.module)}
                  className="hover:text-gray-700 underline"
                >
                  {crumb.label}
                </button>
              ) : crumb.action ? (
                <button
                  onClick={crumb.action}
                  className="hover:text-gray-700 underline"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cases</h2>
          <p className="text-gray-600">Manage investigation cases and evidence</p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Case
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Cases</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Priority</p>
                  <p className="text-2xl font-bold">{stats.criticalCount}</p>
                </div>
                <Clock className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft Cases</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <Eye className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search cases by title, description, or case number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Case Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="security_investigation">Security</SelectItem>
                  <SelectItem value="incident_investigation">Incident</SelectItem>
                  <SelectItem value="safety_investigation">Safety</SelectItem>
                  <SelectItem value="fraud_investigation">Fraud</SelectItem>
                  <SelectItem value="compliance_investigation">Compliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || phaseFilter !== 'all' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {priorityFilter !== 'all' && (
                <Badge variant="secondary">
                  Priority: {priorityFilter}
                  <button
                    onClick={() => setPriorityFilter('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary">
                  Type: {typeFilter}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases List/Grid */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cases found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "No cases have been created yet"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                Create New Case
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        )}>
          {filteredCases.map(caseItem => 
            viewMode === 'list' 
              ? renderListItem(caseItem)
              : renderGridItem(caseItem)
          )}
        </div>
      )}

      {/* Create Case Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
          </DialogHeader>
          <CaseCreateForm
            onSuccess={(caseId) => {
              setShowCreateForm(false);
              // Refresh cases list
              fetchCases();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Case Detail Dialog */}
      <Dialog open={showCaseDetail} onOpenChange={setShowCaseDetail}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          {selectedCaseId && (
            <CaseDetailView
              caseId={selectedCaseId}
              onBack={() => {
                setShowCaseDetail(false);
                setSelectedCaseId(null);
              }}
              onEdit={(caseItem) => {
                setShowCaseDetail(false);
                // TODO: Open edit form
                console.log('Edit case:', caseItem);
              }}
              onDelete={(caseId) => {
                setShowCaseDetail(false);
                // TODO: Handle delete
                console.log('Delete case:', caseId);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}