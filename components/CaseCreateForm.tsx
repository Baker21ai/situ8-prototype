/**
 * CaseCreateForm Component
 * Multi-step wizard for creating new investigation cases
 */

import React, { useState } from 'react';
import { useCaseStore } from '../stores/caseStore';
import { useServices } from '../services/ServiceProvider';
import { 
  AlertCircle, 
  Calendar,
  Clock,
  FileText,
  Tag,
  Users,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Paperclip,
  AlertTriangle,
  Shield,
  Search,
  Briefcase,
  Building,
  Scale,
  Archive
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CaseType,
  CaseStatus,
  InvestigationPhase
} from '../lib/types/case';

interface CaseCreateFormProps {
  onSuccess?: (caseId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<CaseFormData>;
}

interface CaseFormData {
  title: string;
  description: string;
  caseType: CaseType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: CaseStatus;
  currentPhase: InvestigationPhase;
  leadInvestigatorId: string;
  investigators: string[];
  primarySiteId: string;
  involvedSites: string[];
  targetCompletionDate?: string;
  regulatoryDeadline?: string;
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'classified';
  caseCategory: string[];
  tags: string[];
  initialFindings?: string;
  investigationPlan?: string;
  relatedActivities: string[];
  relatedIncidents: string[];
  requiresApproval: boolean;
}

type FormStep = 'basic' | 'team' | 'scope' | 'planning' | 'review';

const steps: { id: FormStep; title: string; description: string }[] = [
  { id: 'basic', title: 'Basic Information', description: 'Case details and classification' },
  { id: 'team', title: 'Investigation Team', description: 'Assign investigators and reviewers' },
  { id: 'scope', title: 'Scope & Sites', description: 'Define investigation scope and locations' },
  { id: 'planning', title: 'Planning & Timeline', description: 'Set deadlines and initial plan' },
  { id: 'review', title: 'Review & Submit', description: 'Review and create case' }
];

const caseTypes: { value: CaseType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'security_investigation', 
    label: 'Security Investigation', 
    icon: <Shield className="w-4 h-4" />,
    description: 'Security breach or violation investigations' 
  },
  { 
    value: 'incident_investigation', 
    label: 'Incident Investigation', 
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Post-incident analysis and investigation' 
  },
  { 
    value: 'safety_investigation', 
    label: 'Safety Investigation', 
    icon: <Shield className="w-4 h-4" />,
    description: 'Safety incident analysis and prevention' 
  },
  { 
    value: 'fraud_investigation', 
    label: 'Fraud Investigation', 
    icon: <Search className="w-4 h-4" />,
    description: 'Fraud, misconduct, or theft investigations' 
  },
  { 
    value: 'compliance_investigation', 
    label: 'Compliance Investigation', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Regulatory compliance and audit findings' 
  },
  { 
    value: 'property_investigation', 
    label: 'Property Investigation', 
    icon: <Building className="w-4 h-4" />,
    description: 'Property damage, theft, or vandalism' 
  },
  { 
    value: 'personnel_investigation', 
    label: 'Personnel Investigation', 
    icon: <Users className="w-4 h-4" />,
    description: 'Employee conduct and HR matters' 
  },
  { 
    value: 'operational_investigation', 
    label: 'Operational Investigation', 
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Process or system failures' 
  },
  { 
    value: 'legal_investigation', 
    label: 'Legal Investigation', 
    icon: <Scale className="w-4 h-4" />,
    description: 'Legal matters and litigation support' 
  },
  { 
    value: 'other', 
    label: 'Other Investigation', 
    icon: <Archive className="w-4 h-4" />,
    description: 'Other types of investigations' 
  }
];

const priorityLevels: { value: 'low' | 'medium' | 'high' | 'critical'; label: string; description: string; color: string }[] = [
  { value: 'low', label: 'Low', description: 'Routine investigation, no urgency', color: 'text-green-700' },
  { value: 'medium', label: 'Medium', description: 'Standard investigation timeline', color: 'text-yellow-700' },
  { value: 'high', label: 'High', description: 'Urgent investigation requiring priority attention', color: 'text-orange-700' },
  { value: 'critical', label: 'Critical', description: 'Critical investigation requiring immediate action', color: 'text-red-700' }
];

const sensitivityLevels: { value: string; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Information can be shared publicly' },
  { value: 'internal', label: 'Internal', description: 'Internal company information only' },
  { value: 'confidential', label: 'Confidential', description: 'Restricted to need-to-know basis' },
  { value: 'restricted', label: 'Restricted', description: 'Highly sensitive, requires special access' },
  { value: 'classified', label: 'Classified', description: 'Classified information, highest security' }
];

export function CaseCreateForm({ onSuccess, onCancel, initialData }: CaseCreateFormProps) {
  const { createCase } = useCaseStore();
  const { caseService } = useServices();
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CaseFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    caseType: initialData?.caseType || 'incident_investigation',
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'draft',
    currentPhase: initialData?.currentPhase || 'initiation',
    leadInvestigatorId: initialData?.leadInvestigatorId || '',
    investigators: initialData?.investigators || [],
    primarySiteId: initialData?.primarySiteId || '',
    involvedSites: initialData?.involvedSites || [],
    targetCompletionDate: initialData?.targetCompletionDate || '',
    regulatoryDeadline: initialData?.regulatoryDeadline || '',
    sensitivityLevel: initialData?.sensitivityLevel || 'internal',
    caseCategory: initialData?.caseCategory || [],
    tags: initialData?.tags || [],
    initialFindings: initialData?.initialFindings || '',
    investigationPlan: initialData?.investigationPlan || '',
    relatedActivities: initialData?.relatedActivities || [],
    relatedIncidents: initialData?.relatedIncidents || [],
    requiresApproval: initialData?.requiresApproval || false
  });

  // Navigation helpers
  const stepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const goToNextStep = () => {
    if (!isLastStep) {
      const nextStep = steps[stepIndex + 1];
      setCurrentStep(nextStep.id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const previousStep = steps[stepIndex - 1];
      setCurrentStep(previousStep.id);
    }
  };

  // Form validation
  const validateCurrentStep = (): boolean => {
    setError(null);
    
    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) {
          setError('Case title is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Case description is required');
          return false;
        }
        if (!formData.caseType) {
          setError('Case type is required');
          return false;
        }
        break;
      case 'team':
        if (!formData.leadInvestigatorId.trim()) {
          setError('Lead investigator is required');
          return false;
        }
        break;
      case 'scope':
        if (!formData.primarySiteId.trim()) {
          setError('Primary site is required');
          return false;
        }
        break;
      case 'planning':
        // Optional validation for planning step
        break;
      case 'review':
        // Final validation happens in handleSubmit
        break;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Create case data object
      const caseData = {
        title: formData.title,
        description: formData.description,
        type: formData.caseType,
        priority: formData.priority,
        status: formData.status,
        currentPhase: formData.currentPhase,
        leadInvestigatorId: formData.leadInvestigatorId,
        investigators: formData.investigators,
        primarySiteId: formData.primarySiteId,
        involvedSites: formData.involvedSites,
        targetCompletionDate: formData.targetCompletionDate ? new Date(formData.targetCompletionDate) : undefined,
        regulatoryDeadline: formData.regulatoryDeadline ? new Date(formData.regulatoryDeadline) : undefined,
        sensitivityLevel: formData.sensitivityLevel,
        caseCategory: formData.caseCategory,
        tags: formData.tags,
        initialFindings: formData.initialFindings,
        investigationPlan: formData.investigationPlan,
        relatedActivities: formData.relatedActivities,
        relatedIncidents: formData.relatedIncidents,
        requiresApproval: formData.requiresApproval
      };

      if (caseService) {
        // Use the service if available
        const result = await caseService.createCaseUnified(caseData, {
          userId: 'current-user',
          userName: 'Current User',
          userRole: 'investigator',
          action: 'create_case'
        });

        if (result.success) {
          onSuccess?.(result.data?.case?.id || 'new-case');
        } else {
          setError(result.error || 'Failed to create case');
        }
      } else {
        // Fallback to store method
        createCase(caseData);
        onSuccess?.('new-case');
      }
    } catch (err) {
      console.error('Error creating case:', err);
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (isLastStep) {
        handleSubmit();
      } else {
        goToNextStep();
      }
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a descriptive case title..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a detailed description of what needs to be investigated..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>Case Type *</Label>
              <RadioGroup
                value={formData.caseType}
                onValueChange={(value: CaseType) => setFormData({ ...formData, caseType: value })}
                className="space-y-3"
              >
                {caseTypes.map((type) => (
                  <div key={type.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="flex items-center gap-2 font-medium">
                        {type.icon}
                        {type.label}
                      </Label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <span className={level.color}>{level.label}</span>
                          <span className="text-sm text-gray-500">- {level.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensitivity">Sensitivity Level</Label>
                <Select value={formData.sensitivityLevel} onValueChange={(value: string) => setFormData({ ...formData, sensitivityLevel: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sensitivityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-gray-500">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leadInvestigator">Lead Investigator *</Label>
              <Input
                id="leadInvestigator"
                value={formData.leadInvestigatorId}
                onChange={(e) => setFormData({ ...formData, leadInvestigatorId: e.target.value })}
                placeholder="Enter lead investigator ID or name..."
                className="w-full"
              />
              <p className="text-sm text-gray-600">The primary person responsible for this investigation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investigators">Additional Investigators</Label>
              <Textarea
                id="investigators"
                value={formData.investigators.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  investigators: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Enter investigator IDs or names, separated by commas..."
                rows={3}
                className="w-full"
              />
              <p className="text-sm text-gray-600">Team members who will assist with the investigation</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresApproval"
                checked={formData.requiresApproval}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: !!checked })}
              />
              <Label htmlFor="requiresApproval">Requires management approval</Label>
            </div>
          </div>
        );

      case 'scope':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="primarySite">Primary Site *</Label>
              <Input
                id="primarySite"
                value={formData.primarySiteId}
                onChange={(e) => setFormData({ ...formData, primarySiteId: e.target.value })}
                placeholder="Enter primary site ID or location..."
                className="w-full"
              />
              <p className="text-sm text-gray-600">The main location where the investigation will take place</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="involvedSites">Additional Sites</Label>
              <Textarea
                id="involvedSites"
                value={formData.involvedSites.filter(site => site !== formData.primarySiteId).join(', ')}
                onChange={(e) => {
                  const sites = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setFormData({ 
                    ...formData, 
                    involvedSites: [formData.primarySiteId, ...sites].filter(Boolean)
                  });
                }}
                placeholder="Enter additional site IDs or locations, separated by commas..."
                rows={2}
                className="w-full"
              />
              <p className="text-sm text-gray-600">Other locations that are part of this investigation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Case Categories</Label>
              <Textarea
                id="categories"
                value={formData.caseCategory.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  caseCategory: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Enter categories (e.g., workplace safety, data breach, theft)..."
                rows={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Textarea
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Enter tags for easy searching (e.g., urgent, external, regulatory)..."
                rows={2}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Completion Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetCompletionDate}
                  onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regulatoryDate">Regulatory Deadline</Label>
                <Input
                  id="regulatoryDate"
                  type="date"
                  value={formData.regulatoryDeadline}
                  onChange={(e) => setFormData({ ...formData, regulatoryDeadline: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialFindings">Initial Findings</Label>
              <Textarea
                id="initialFindings"
                value={formData.initialFindings}
                onChange={(e) => setFormData({ ...formData, initialFindings: e.target.value })}
                placeholder="Document any initial observations or findings..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investigationPlan">Investigation Plan</Label>
              <Textarea
                id="investigationPlan"
                value={formData.investigationPlan}
                onChange={(e) => setFormData({ ...formData, investigationPlan: e.target.value })}
                placeholder="Outline the investigation approach and key steps..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Please review all the information below before creating the case.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Basic Information</h4>
                  <p className="text-sm text-gray-600">Title: {formData.title}</p>
                  <p className="text-sm text-gray-600">Type: {caseTypes.find(t => t.value === formData.caseType)?.label}</p>
                  <p className="text-sm text-gray-600">Priority: {formData.priority}</p>
                  <p className="text-sm text-gray-600">Sensitivity: {formData.sensitivityLevel}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Investigation Team</h4>
                  <p className="text-sm text-gray-600">Lead: {formData.leadInvestigatorId}</p>
                  <p className="text-sm text-gray-600">Team: {formData.investigators.length} investigators</p>
                  <p className="text-sm text-gray-600">Approval: {formData.requiresApproval ? 'Required' : 'Not required'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Scope & Timeline</h4>
                  <p className="text-sm text-gray-600">Primary Site: {formData.primarySiteId}</p>
                  <p className="text-sm text-gray-600">Sites: {formData.involvedSites.length} total</p>
                  <p className="text-sm text-gray-600">Target Date: {formData.targetCompletionDate || 'Not set'}</p>
                  <p className="text-sm text-gray-600">Regulatory: {formData.regulatoryDeadline || 'Not set'}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Classification</h4>
                  <p className="text-sm text-gray-600">Categories: {formData.caseCategory.length} categories</p>
                  <p className="text-sm text-gray-600">Tags: {formData.tags.length} tags</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Description</h4>
              <p className="text-sm text-gray-600">{formData.description}</p>
            </div>

            {formData.initialFindings && (
              <div className="space-y-2">
                <h4 className="font-semibold">Initial Findings</h4>
                <p className="text-sm text-gray-600">{formData.initialFindings}</p>
              </div>
            )}

            {formData.investigationPlan && (
              <div className="space-y-2">
                <h4 className="font-semibold">Investigation Plan</h4>
                <p className="text-sm text-gray-600">{formData.investigationPlan}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  index <= stepIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {index < stepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-4",
                    index < stepIndex ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold">{steps[stepIndex]?.title}</h2>
          <p className="text-gray-600">{steps[stepIndex]?.description}</p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={isFirstStep ? onCancel : goToPreviousStep}
          disabled={loading}
        >
          {isFirstStep ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </>
          )}
        </Button>

        <Button
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            'Creating...'
          ) : isLastStep ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Case
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}