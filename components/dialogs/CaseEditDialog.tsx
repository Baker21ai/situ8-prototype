/**
 * Case Edit Dialog Component
 * Modal dialog for editing case details with validation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { useCaseStore } from '../../stores/caseStore';
import { useUserStore } from '../../stores/userStore';
import type { CaseStatus, CaseType, InvestigationPhase } from '../../lib/types/case';

interface CaseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string;
  onSuccess?: () => void;
}

// Validation rules
const validateCase = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.title?.trim()) {
    errors.push('Title is required');
  } else if (data.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  } else if (data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (!data.description?.trim()) {
    errors.push('Description is required');
  } else if (data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  
  if (!data.caseType) {
    errors.push('Case type is required');
  }
  
  if (!data.priority) {
    errors.push('Priority is required');
  }
  
  if (!data.status) {
    errors.push('Status is required');
  }
  
  if (data.targetCompletionDate) {
    const targetDate = new Date(data.targetCompletionDate);
    if (targetDate < new Date()) {
      errors.push('Target completion date cannot be in the past');
    }
  }
  
  return errors;
};

export const CaseEditDialog: React.FC<CaseEditDialogProps> = ({
  open,
  onOpenChange,
  caseId,
  onSuccess
}) => {
  const { cases, updateCase } = useCaseStore();
  const { currentUser } = useUserStore();
  const existingCase = caseId ? cases.find(c => c.id === caseId) : null;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseType: 'incident_investigation' as CaseType,
    status: 'draft' as CaseStatus,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    currentPhase: 'initiation' as InvestigationPhase,
    leadInvestigatorId: currentUser?.id || '',
    targetCompletionDate: '',
    tags: [] as string[],
  });
  
  // Initialize form with existing case data
  useEffect(() => {
    if (existingCase) {
      setFormData({
        title: existingCase.title,
        description: existingCase.description,
        caseType: existingCase.caseType,
        status: existingCase.status,
        priority: existingCase.priority,
        currentPhase: existingCase.currentPhase,
        leadInvestigatorId: existingCase.leadInvestigatorId || currentUser?.id || '',
        targetCompletionDate: existingCase.targetCompletionDate || '',
        tags: existingCase.tags || [],
      });
    }
  }, [existingCase, currentUser]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setErrors([]);
      setFormData({
        title: '',
        description: '',
        caseType: 'incident_investigation',
        status: 'draft',
        priority: 'medium',
        currentPhase: 'initiation',
        leadInvestigatorId: currentUser?.id || '',
        targetCompletionDate: '',
        tags: [],
      });
    }
  }, [open, currentUser]);
  
  const handleSubmit = async () => {
    // Validate
    const validationErrors = validateCase(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Update case
      updateCase(caseId!, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id || 'system',
      });
      
      // Close dialog and call success callback
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setErrors(['Failed to update case. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Status options based on current phase
  const getStatusOptions = (): CaseStatus[] => {
    switch (formData.currentPhase) {
      case 'initiation':
        return ['draft', 'open'];
      case 'planning':
        return ['open', 'active'];
      case 'evidence_collection':
      case 'analysis':
      case 'findings':
        return ['active', 'under_review'];
      case 'review':
        return ['under_review', 'pending_approval'];
      case 'report_writing':
        return ['pending_approval', 'closed'];
      case 'closure':
        return ['closed', 'archived'];
      default:
        return ['draft'];
    }
  };
  
  const phaseOptions: InvestigationPhase[] = [
    'initiation',
    'planning',
    'evidence_collection',
    'analysis',
    'findings',
    'review',
    'report_writing',
    'closure'
  ];
  
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        input.value = '';
      }
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {caseId ? 'Edit Case' : 'Create New Case'}
          </DialogTitle>
          <DialogDescription>
            Update case details and investigation parameters. All changes are tracked in the audit log.
          </DialogDescription>
        </DialogHeader>
        
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the case"
              maxLength={200}
            />
          </div>
          
          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the investigation"
              rows={4}
            />
          </div>
          
          {/* Case Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="caseType">Case Type *</Label>
              <Select
                value={formData.caseType}
                onValueChange={(value: CaseType) => setFormData(prev => ({ ...prev, caseType: value }))}
              >
                <SelectTrigger id="caseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security_investigation">Security Investigation</SelectItem>
                  <SelectItem value="incident_investigation">Incident Investigation</SelectItem>
                  <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
                  <SelectItem value="internal_review">Internal Review</SelectItem>
                  <SelectItem value="regulatory_inquiry">Regulatory Inquiry</SelectItem>
                  <SelectItem value="forensic_analysis">Forensic Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Phase and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phase">Investigation Phase *</Label>
              <Select
                value={formData.currentPhase}
                onValueChange={(value: InvestigationPhase) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    currentPhase: value,
                    // Reset status when phase changes
                    status: getStatusOptions()[0]
                  }));
                }}
              >
                <SelectTrigger id="phase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phaseOptions.map(phase => (
                    <SelectItem key={phase} value={phase}>
                      {phase.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: CaseStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatusOptions().map(status => (
                    <SelectItem key={status} value={status}>
                      {status.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Target Completion Date */}
          <div className="grid gap-2">
            <Label htmlFor="targetDate">Target Completion Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetCompletionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetCompletionDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Press Enter to add tags"
              onKeyDown={handleTagInput}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};