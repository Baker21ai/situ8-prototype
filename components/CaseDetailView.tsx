/**
 * CaseDetailView Component
 * Displays detailed case information with investigation timeline, evidence, and team management
 */

import React, { useEffect, useState } from 'react';
import { useCaseStore } from '../stores/caseStore';
import { useServices } from '../services/ServiceProvider';
import { 
  AlertCircle, 
  Calendar,
  Clock,
  User,
  MapPin,
  Tag,
  Bell,
  Check,
  X,
  Eye,
  CheckCircle,
  ChevronLeft,
  Edit,
  Archive,
  Trash2,
  FileText,
  AlertTriangle,
  Users,
  Paperclip,
  MessageSquare,
  Copy,
  Share2,
  Printer,
  Shield,
  Search,
  Briefcase,
  Building,
  Scale,
  Camera,
  Upload,
  Download,
  ExternalLink,
  Activity,
  Target,
  Flag,
  UserCheck,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { 
  CaseStatus,
  CaseType,
  InvestigationPhase
} from '../lib/types/case';
import { formatDistanceToNow, format } from 'date-fns';

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
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  investigators?: string[];
  relatedIncidents?: string[];
  relatedActivities?: string[];
  initialFindings?: string;
  investigationPlan?: string;
  sensitivityLevel?: string;
  involvedSites?: string[];
  requiresApproval?: boolean;
}

interface CaseDetailViewProps {
  caseId: string;
  onBack?: () => void;
  onEdit?: (caseItem: SimpleCase) => void;
  onDelete?: (caseId: string) => void;
}

// Case type display mapping with icons
const caseTypeConfig: Record<CaseType, { label: string; icon: React.ReactNode; color: string }> = {
  security_investigation: { 
    label: 'Security Investigation', 
    icon: <Shield className="w-4 h-4" />, 
    color: 'text-red-600' 
  },
  incident_investigation: { 
    label: 'Incident Investigation', 
    icon: <AlertTriangle className="w-4 h-4" />, 
    color: 'text-orange-600' 
  },
  safety_investigation: { 
    label: 'Safety Investigation', 
    icon: <Shield className="w-4 h-4" />, 
    color: 'text-yellow-600' 
  },
  fraud_investigation: { 
    label: 'Fraud Investigation', 
    icon: <Search className="w-4 h-4" />, 
    color: 'text-purple-600' 
  },
  compliance_investigation: { 
    label: 'Compliance Investigation', 
    icon: <FileText className="w-4 h-4" />, 
    color: 'text-blue-600' 
  },
  property_investigation: { 
    label: 'Property Investigation', 
    icon: <Building className="w-4 h-4" />, 
    color: 'text-green-600' 
  },
  personnel_investigation: { 
    label: 'Personnel Investigation', 
    icon: <Users className="w-4 h-4" />, 
    color: 'text-indigo-600' 
  },
  operational_investigation: { 
    label: 'Operational Investigation', 
    icon: <Briefcase className="w-4 h-4" />, 
    color: 'text-gray-600' 
  },
  environmental_investigation: { 
    label: 'Environmental Investigation', 
    icon: <Archive className="w-4 h-4" />, 
    color: 'text-teal-600' 
  },
  quality_investigation: { 
    label: 'Quality Investigation', 
    icon: <CheckCircle className="w-4 h-4" />, 
    color: 'text-cyan-600' 
  }
};

// Status config
const statusConfig: Record<CaseStatus, { color: string; label: string; icon: React.ReactNode }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: <Edit className="w-4 h-4" /> },
  active: { color: 'bg-blue-100 text-blue-800', label: 'Active', icon: <PlayCircle className="w-4 h-4" /> },
  pending_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review', icon: <Eye className="w-4 h-4" /> },
  on_hold: { color: 'bg-orange-100 text-orange-800', label: 'On Hold', icon: <PauseCircle className="w-4 h-4" /> },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated', icon: <AlertTriangle className="w-4 h-4" /> },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
  closed: { color: 'bg-gray-100 text-gray-600', label: 'Closed', icon: <StopCircle className="w-4 h-4" /> },
  archived: { color: 'bg-gray-100 text-gray-500', label: 'Archived', icon: <Archive className="w-4 h-4" /> }
};

// Priority config
const priorityConfig: Record<'low' | 'medium' | 'high' | 'critical', { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  low: { color: 'text-green-600', bgColor: 'bg-green-50', label: 'Low Priority', icon: <Flag className="w-4 h-4 text-green-600" /> },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Medium Priority', icon: <Flag className="w-4 h-4 text-yellow-600" /> },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'High Priority', icon: <Flag className="w-4 h-4 text-orange-600" /> },
  critical: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Critical Priority', icon: <Flag className="w-4 h-4 text-red-600" /> }
};

// Phase config
const phaseConfig: Record<InvestigationPhase, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  initiation: { 
    label: 'Initiation', 
    color: 'bg-blue-100 text-blue-800', 
    icon: <PlayCircle className="w-4 h-4" />,
    description: 'Case setup and initial planning'
  },
  evidence_collection: { 
    label: 'Evidence Collection', 
    color: 'bg-purple-100 text-purple-800', 
    icon: <Camera className="w-4 h-4" />,
    description: 'Gathering and documenting evidence'
  },
  analysis: { 
    label: 'Analysis', 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: <Search className="w-4 h-4" />,
    description: 'Analyzing collected evidence'
  },
  interviews: { 
    label: 'Interviews', 
    color: 'bg-orange-100 text-orange-800', 
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Conducting witness and stakeholder interviews'
  },
  verification: { 
    label: 'Verification', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <UserCheck className="w-4 h-4" />,
    description: 'Fact verification and validation'
  },
  reporting: { 
    label: 'Reporting', 
    color: 'bg-teal-100 text-teal-800', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Preparing investigation report'
  },
  review: { 
    label: 'Review', 
    color: 'bg-green-100 text-green-800', 
    icon: <Eye className="w-4 h-4" />,
    description: 'Management and peer review'
  },
  closure: { 
    label: 'Closure', 
    color: 'bg-gray-100 text-gray-800', 
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Case closure and final documentation'
  }
};

export function CaseDetailView({ caseId, onBack, onEdit, onDelete }: CaseDetailViewProps) {
  const { cases, selectedCase, selectCase } = useCaseStore();
  const { caseService } = useServices();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Find the case
  const caseItem = selectedCase || cases.find(c => c.id === caseId);

  useEffect(() => {
    if (caseId && !caseItem) {
      // Try to load case if not found in store
      setLoading(true);
      // In a real implementation, you would fetch the case from the service
      setLoading(false);
    }
  }, [caseId, caseItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Case Not Found</h3>
        <p className="text-gray-600 mb-4">The requested case could not be found.</p>
        <Button onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  // Calculate progress based on phase
  const allPhases: InvestigationPhase[] = ['initiation', 'evidence_collection', 'analysis', 'interviews', 'verification', 'reporting', 'review', 'closure'];
  const currentPhaseIndex = allPhases.indexOf(caseItem.currentPhase);
  const progress = Math.round(((currentPhaseIndex + 1) / allPhases.length) * 100);

  // Check if overdue
  const isOverdue = (caseItem.targetCompletionDate && new Date(caseItem.targetCompletionDate) < new Date()) ||
                   (caseItem.regulatoryDeadline && new Date(caseItem.regulatoryDeadline) < new Date());

  const typeConfig = caseTypeConfig[caseItem.caseType];
  const statusConf = statusConfig[caseItem.status];
  const priorityConf = priorityConfig[caseItem.priority];
  const phaseConf = phaseConfig[caseItem.currentPhase];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{caseItem.title}</h1>
              {isOverdue && (
                <Badge variant="destructive">
                  <Clock className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="font-mono">{caseItem.caseNumber}</Badge>
              <span>•</span>
              <span>Created {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}</span>
              {caseItem.updatedAt && caseItem.updatedAt !== caseItem.createdAt && (
                <>
                  <span>•</span>
                  <span>Updated {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit?.(caseItem)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {typeConfig.icon}
              <div>
                <p className="text-sm text-gray-600">Case Type</p>
                <p className="font-semibold">{typeConfig.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {statusConf.icon}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={statusConf.color}>{statusConf.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {priorityConf.icon}
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className={`font-semibold ${priorityConf.color}`}>{priorityConf.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {phaseConf.icon}
              <div>
                <p className="text-sm text-gray-600">Current Phase</p>
                <Badge className={phaseConf.color}>{phaseConf.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Investigation Progress</h3>
            <span className="text-sm text-gray-600">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-gray-600">{phaseConf.description}</p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{caseItem.description}</p>
                </div>

                {caseItem.initialFindings && (
                  <div>
                    <h4 className="font-semibold mb-2">Initial Findings</h4>
                    <p className="text-gray-700">{caseItem.initialFindings}</p>
                  </div>
                )}

                {caseItem.investigationPlan && (
                  <div>
                    <h4 className="font-semibold mb-2">Investigation Plan</h4>
                    <p className="text-gray-700">{caseItem.investigationPlan}</p>
                  </div>
                )}

                {caseItem.tags && caseItem.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {caseItem.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline & Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{format(new Date(caseItem.createdAt), 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(new Date(caseItem.createdAt), 'h:mm a')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">
                      {caseItem.updatedAt ? format(new Date(caseItem.updatedAt), 'MMM dd, yyyy') : 'Never'}
                    </p>
                    {caseItem.updatedAt && (
                      <p className="text-xs text-gray-500">{format(new Date(caseItem.updatedAt), 'h:mm a')}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Target Completion</p>
                    <p className={cn(
                      "font-medium",
                      caseItem.targetCompletionDate && new Date(caseItem.targetCompletionDate) < new Date() ? "text-red-600" : ""
                    )}>
                      {caseItem.targetCompletionDate ? format(new Date(caseItem.targetCompletionDate), 'MMM dd, yyyy') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Regulatory Deadline</p>
                    <p className={cn(
                      "font-medium",
                      caseItem.regulatoryDeadline && new Date(caseItem.regulatoryDeadline) < new Date() ? "text-red-600" : ""
                    )}>
                      {caseItem.regulatoryDeadline ? format(new Date(caseItem.regulatoryDeadline), 'MMM dd, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Primary Site</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="font-medium">{caseItem.primarySiteId || 'Not specified'}</p>
                  </div>
                </div>

                {caseItem.involvedSites && caseItem.involvedSites.length > 1 && (
                  <div>
                    <p className="text-sm text-gray-600">Additional Sites</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caseItem.involvedSites.filter(site => site !== caseItem.primarySiteId).map(site => (
                        <Badge key={site} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {site}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          {(caseItem.relatedActivities?.length || caseItem.relatedIncidents?.length || caseItem.sensitivityLevel) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {caseItem.sensitivityLevel && (
                    <div>
                      <p className="text-sm text-gray-600">Sensitivity Level</p>
                      <Badge variant="outline" className="mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        {caseItem.sensitivityLevel}
                      </Badge>
                    </div>
                  )}
                  
                  {caseItem.requiresApproval && (
                    <div>
                      <p className="text-sm text-gray-600">Approval Status</p>
                      <Badge variant="outline" className="mt-1">
                        <Bell className="w-3 h-3 mr-1" />
                        Approval Required
                      </Badge>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Investigation Team</p>
                    <p className="font-medium">{(caseItem.investigators?.length || 0) + 1} members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Investigation Timeline</CardTitle>
              <CardDescription>Track all activities and milestones for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample timeline entries - in real implementation, this would come from the case service */}
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Case Created</p>
                    <p className="text-sm text-gray-600">
                      Case {caseItem.caseNumber} was created by {caseItem.createdBy || 'System'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(caseItem.createdAt), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Phase: {phaseConf.label}</p>
                    <p className="text-sm text-gray-600">{phaseConf.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Current phase</p>
                  </div>
                </div>

                {caseItem.updatedAt && caseItem.updatedAt !== caseItem.createdAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Case Updated</p>
                      <p className="text-sm text-gray-600">
                        Case details were updated by {caseItem.updatedBy || 'System'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(caseItem.updatedAt), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evidence Items</CardTitle>
                  <CardDescription>Manage evidence collection and chain of custody</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Evidence
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Evidence Items</h3>
                <p className="text-gray-600 mb-4">Evidence items will be displayed here once added</p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Evidence Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Investigation Team</CardTitle>
                  <CardDescription>Manage team members and roles</CardDescription>
                </div>
                <Button size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lead Investigator */}
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {caseItem.leadInvestigatorId?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{caseItem.leadInvestigatorId || 'Unassigned'}</p>
                  <p className="text-sm text-gray-600">Lead Investigator</p>
                </div>
                <Badge variant="secondary">Lead</Badge>
              </div>

              {/* Team Members */}
              {caseItem.investigators && caseItem.investigators.length > 0 && (
                <>
                  <Separator />
                  {caseItem.investigators.map((investigator, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {investigator.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{investigator}</p>
                        <p className="text-sm text-gray-600">Investigator</p>
                      </div>
                      <Badge variant="outline">Team Member</Badge>
                    </div>
                  ))}
                </>
              )}

              {(!caseItem.investigators || caseItem.investigators.length === 0) && !caseItem.leadInvestigatorId && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
                  <p className="text-gray-600 mb-4">Add team members to collaborate on this investigation</p>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Add Team Members
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Related Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Related Incidents</CardTitle>
                <CardDescription>Incidents connected to this case</CardDescription>
              </CardHeader>
              <CardContent>
                {caseItem.relatedIncidents && caseItem.relatedIncidents.length > 0 ? (
                  <div className="space-y-2">
                    {caseItem.relatedIncidents.map((incidentId, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="font-mono text-sm">{incidentId}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No related incidents</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Related Activities</CardTitle>
                <CardDescription>Activities connected to this case</CardDescription>
              </CardHeader>
              <CardContent>
                {caseItem.relatedActivities && caseItem.relatedActivities.length > 0 ? (
                  <div className="space-y-2">
                    {caseItem.relatedActivities.map((activityId, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="font-mono text-sm">{activityId}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No related activities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Case Documents</CardTitle>
                  <CardDescription>Reports, attachments, and documentation</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                <p className="text-gray-600 mb-4">Case documents and reports will be displayed here</p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}