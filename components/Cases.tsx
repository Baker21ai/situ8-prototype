import { useState, useEffect } from 'react';
import { useCaseStore } from '../stores/caseStore';
import { useServices } from '../services/ServiceProvider';
import type { CaseType, CaseStatus } from '../lib/types/case';

// Type alias for the case data we get from the store
type CaseData = {
  id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lead_investigator: string;
  created_at: Date;
  description?: string;
  assignedTo?: string;
  type: CaseType;
  investigators?: string[];
  linked_incident_ids?: string[];
  evidence_items?: any[];
  timeline_events?: any[];
  updated_at: Date;
  created_by: string;
  updated_by: string;
  conclusion?: string;
  related_incidents?: string[];
  related_activities?: string[];
};
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Users,
  FileText,
  Camera,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Building,
  Hash,
  Activity,
  FolderOpen,
  Link,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Archive,
  Trash2,
  ClipboardCheck, 
  Scale, 
  Globe, 
  Package, 
  HardDrive, 
  MessageSquare, 
  Microscope,
  Volume2
} from 'lucide-react';
import { Case, EvidenceItem } from '../lib/types/case';
import { Priority } from '../lib/types/common';
import { formatDistanceToNow } from '../lib/utils/time';

// Case status badge colors
const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  evidence_collection: 'bg-purple-100 text-purple-800 border-purple-200',
  analysis: 'bg-orange-100 text-orange-800 border-orange-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

// Priority badge colors
const priorityColors: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

// Case type icons
const typeIcons: Record<string, any> = {
  investigation: Shield,
  compliance: FileText,
  incident_followup: AlertTriangle,
  audit: ClipboardCheck,
  legal: Scale,
  insurance: Shield,
  internal: Building,
  external: Globe
};

export function Cases() {
  // Store hooks
  const { 
    cases, 
    loading, 
    error,
    selectedCase,
    selectCase,
    filters,
    setFilters,
    getCaseStats
  } = useCaseStore();

  const { caseService, isInitialized } = useServices();

  // Local state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get case statistics
  const stats = getCaseStats();

  // Filter cases based on search
  const filteredCases = cases.filter((caseItem: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        caseItem.title.toLowerCase().includes(query) ||
        caseItem.case_number.toLowerCase().includes(query) ||
        caseItem.description?.toLowerCase().includes(query) ||
        caseItem.assignedTo?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Create new case
  const handleCreateCase = async (caseData: Partial<any>) => {
    if (!caseService) return;

    try {
      await caseService?.createCase?.(caseData, {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'officer',
        action: 'create_case'
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  // View case details
  const handleViewCase = (caseItem: any) => {
    selectCase(caseItem);
    setShowDetailDialog(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                Case Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Strategic investigations and evidence tracking
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Cases</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.byStatus.open || 0}</div>
                <div className="text-xs text-muted-foreground">Open</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.byStatus.investigating || 0}</div>
                <div className="text-xs text-muted-foreground">Investigating</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.byStatus.evidence_collection || 0}</div>
                <div className="text-xs text-muted-foreground">Evidence Collection</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.criticalCount}</div>
                <div className="text-xs text-muted-foreground">Critical Priority</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{stats.closedCount}</div>
                <div className="text-xs text-muted-foreground">Closed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex-shrink-0 bg-white border-b p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search cases by title, number, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ status: value === 'all' ? undefined : value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="evidence_collection">Evidence Collection</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority || 'all'} onValueChange={(value) => setFilters({ priority: value === 'all' ? undefined : value as Priority })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.type || 'all'} onValueChange={(value) => setFilters({ type: value === 'all' ? undefined : value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="investigation">Investigation</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="incident_followup">Incident Follow-up</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Cases Display */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cases...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search or filters' : 'Create your first case to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Case
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                case={caseItem}
                onView={handleViewCase}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCases.map((caseItem) => (
              <CaseListItem
                key={caseItem.id}
                case={caseItem}
                onView={handleViewCase}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Case Dialog */}
      <CreateCaseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateCase}
      />

      {/* Case Detail Dialog */}
      {selectedCase && (
        <CaseDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          case={selectedCase}
          caseService={caseService}
        />
      )}
    </div>
  );
}

// Case Card Component
interface CaseCardProps {
  case: CaseData;
  onView: (caseItem: CaseData) => void;
}

function CaseCard({ case: caseItem, onView }: CaseCardProps) {
  const TypeIcon = typeIcons[caseItem.type] || Briefcase;
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(caseItem)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {caseItem.case_number}
            </Badge>
          </div>
          <Badge className={priorityColors[caseItem.priority]}>
            {caseItem.priority}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2 line-clamp-2">{caseItem.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge className={`${statusColors[caseItem.status]} w-fit`}>
            {caseItem.status.replace('_', ' ').toUpperCase()}
          </Badge>
          
          {caseItem.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {caseItem.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(caseItem.created_at)}
              </span>
              {caseItem.assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {caseItem.assignedTo}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {caseItem.linked_incident_ids?.length || 0} incidents
            </span>
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {caseItem.evidence_items?.length || 0} evidence
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Case List Item Component
interface CaseListItemProps {
  case: CaseData;
  onView: (caseItem: CaseData) => void;
}

function CaseListItem({ case: caseItem, onView }: CaseListItemProps) {
  const TypeIcon = typeIcons[caseItem.type] || Briefcase;
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(caseItem)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <TypeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{caseItem.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {caseItem.case_number}
                </Badge>
              </div>
              {caseItem.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {caseItem.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Badge className={statusColors[caseItem.status]}>
                {caseItem.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={priorityColors[caseItem.priority]}>
                {caseItem.priority}
              </Badge>
              <div className="text-muted-foreground">
                {formatDistanceToNow(caseItem.created_at)}
              </div>
              {caseItem.assignedTo && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {caseItem.assignedTo}
                </div>
              )}
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Case Dialog
function CreateCaseDialog({ 
  open, 
  onOpenChange, 
  onCreate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<Case>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    type: 'investigation',
    priority: 'medium',
    status: 'open',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({
      title: '',
      type: 'investigation',
      priority: 'medium',
      status: 'open',
      description: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Open a new investigation case with evidence tracking and team management
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter case title..."
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigation">Investigation</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="incident_followup">Incident Follow-up</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Status })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide case details and initial observations..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Case
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Case Detail Dialog
interface CaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case: Case;
  caseService: any;
}

function CaseDetailDialog({ 
  open, 
  onOpenChange, 
  case: caseItem,
  caseService
}: CaseDetailDialogProps) {
  const TypeIcon = typeIcons[caseItem.type] || Briefcase;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <TypeIcon className="h-6 w-6" />
                {caseItem.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{caseItem.case_number}</Badge>
                <Badge className={statusColors[caseItem.status]}>
                  {caseItem.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={priorityColors[caseItem.priority]}>
                  {caseItem.priority}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({caseItem.evidence_items?.length || 0})</TabsTrigger>
            <TabsTrigger value="incidents">Incidents ({caseItem.linked_incident_ids?.length || 0})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{caseItem.description || 'No description provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="mt-1">{new Date(caseItem.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="mt-1">{new Date(caseItem.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created By</Label>
                    <p className="mt-1">{caseItem.created_by}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Assigned To</Label>
                    <p className="mt-1">{caseItem.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>
                
                {caseItem.conclusion && (
                  <div>
                    <Label className="text-muted-foreground">Conclusion</Label>
                    <p className="mt-1">{caseItem.conclusion}</p>
                  </div>
                )}
                
                {caseItem.recommendations && (
                  <div>
                    <Label className="text-muted-foreground">Recommendations</Label>
                    <p className="mt-1">{caseItem.recommendations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="evidence" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evidence Items</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Evidence
              </Button>
            </div>
            
            {caseItem.evidence_items && caseItem.evidence_items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {caseItem.evidence_items.map((evidence) => (
                  <EvidenceCard key={evidence.id} evidence={evidence} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No evidence items yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="incidents" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Linked Incidents</h3>
              <Button size="sm">
                <Link className="h-4 w-4 mr-2" />
                Link Incident
              </Button>
            </div>
            
            {caseItem.linked_incident_ids && caseItem.linked_incident_ids.length > 0 ? (
              <div className="space-y-2">
                {caseItem.linked_incident_ids.map((incidentId) => (
                  <Card key={incidentId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{incidentId}</p>
                          <p className="text-sm text-muted-foreground">Incident details would appear here</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No linked incidents</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Case Timeline</h3>
            {caseItem.timeline_events && caseItem.timeline_events.length > 0 ? (
              <div className="space-y-4">
                {caseItem.timeline_events.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      {index < caseItem.timeline_events.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(event.timestamp)} • {event.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No timeline events recorded</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="team" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Investigation Team</h3>
            <div className="grid grid-cols-1 gap-4">
              {caseItem.lead_investigator && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{caseItem.lead_investigator}</p>
                        <p className="text-sm text-muted-foreground">Lead Investigator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {caseItem.investigators && caseItem.investigators.map((investigator) => (
                <Card key={investigator}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{investigator}</p>
                        <p className="text-sm text-muted-foreground">Investigator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!caseItem.lead_investigator && (!caseItem.investigators || caseItem.investigators.length === 0) && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No team members assigned</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Evidence Card Component
function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  const typeIcons = {
    photo: Camera,
    video: Camera,
    audio: Volume2,
    document: FileText,
    physical: Package,
    digital: HardDrive,
    witness_statement: MessageSquare,
    expert_analysis: Microscope
  };
  
  const TypeIcon = typeIcons[evidence.type] || FileText;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              <TypeIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{evidence.description}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Collected {formatDistanceToNow(evidence.collected_at)} by {evidence.collected_by}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={evidence.integrity_verified ? 'default' : 'secondary'}>
                  {evidence.integrity_verified ? 'Verified' : 'Pending Verification'}
                </Badge>
                <Badge variant="outline">{evidence.classification}</Badge>
                <span className="text-xs text-muted-foreground">
                  {evidence.chain_of_custody.length} custody entries
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

