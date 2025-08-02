/**
 * PassdownCreateForm Component
 * Multi-step wizard for creating new passdowns
 */

import React, { useState } from 'react';
import { usePassdownStore } from '../stores/passdownStore';
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
  AlertTriangle
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
  CreatePassdownRequest,
  ShiftType,
  UrgencyLevel,
  PassdownCategory,
  RelatedEntityType,
  PassdownAttachment
} from '../lib/types/passdown';
import { FileUploadComponent } from './passdowns/FileUploadComponent';

interface PassdownCreateFormProps {
  onSuccess?: (passdownId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<CreatePassdownRequest>;
}

type FormStep = 'basic' | 'details' | 'related' | 'review';

const steps: { id: FormStep; title: string; description: string }[] = [
  { id: 'basic', title: 'Basic Information', description: 'Title, shift, and urgency' },
  { id: 'details', title: 'Details & Instructions', description: 'Notes and specific instructions' },
  { id: 'related', title: 'Related Items', description: 'Link to activities, incidents, or cases' },
  { id: 'review', title: 'Review & Submit', description: 'Review and create passdown' }
];

const shiftTypes: { value: ShiftType; label: string }[] = [
  { value: 'night', label: 'Night Shift (11 PM - 7 AM)' },
  { value: 'day', label: 'Day Shift (7 AM - 3 PM)' },
  { value: 'evening', label: 'Evening Shift (3 PM - 11 PM)' },
  { value: 'swing', label: 'Swing Shift' },
  { value: 'custom', label: 'Custom Shift' }
];

const urgencyLevels: { value: UrgencyLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'General information, no immediate action required' },
  { value: 'medium', label: 'Medium', description: 'Important information requiring attention' },
  { value: 'high', label: 'High', description: 'Urgent matter requiring prompt action' },
  { value: 'critical', label: 'Critical', description: 'Critical issue requiring immediate action' }
];

const categories: { value: PassdownCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'security', label: 'Security', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'safety', label: 'Safety', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'operations', label: 'Operations', icon: <Clock className="w-4 h-4" /> },
  { value: 'maintenance', label: 'Maintenance', icon: <FileText className="w-4 h-4" /> },
  { value: 'visitor', label: 'Visitor', icon: <Users className="w-4 h-4" /> },
  { value: 'emergency', label: 'Emergency', icon: <Bell className="w-4 h-4" /> },
  { value: 'other', label: 'Other', icon: <Tag className="w-4 h-4" /> }
];

export function PassdownCreateForm({ onSuccess, onCancel, initialData }: PassdownCreateFormProps) {
  const { createPassdown } = usePassdownStore();
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreatePassdownRequest>({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    notes: initialData?.notes || '',
    category: initialData?.category || 'operations',
    urgencyLevel: initialData?.urgencyLevel || 'medium',
    shiftDate: initialData?.shiftDate || new Date().toISOString().split('T')[0],
    fromShift: initialData?.fromShift || getCurrentShift(),
    toShift: initialData?.toShift || getNextShift(getCurrentShift()),
    locationId: initialData?.locationId || '',
    acknowledgmentRequired: initialData?.acknowledgmentRequired ?? true,
    actionItems: initialData?.actionItems || [],
    tags: initialData?.tags || [],
    relatedEntities: initialData?.relatedEntities || [],
    attachments: initialData?.attachments || []
  });

  // Action items state
  const [newActionItem, setNewActionItem] = useState('');
  const [newTag, setNewTag] = useState('');

  // Get current step index
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Validation
  const validateStep = (step: FormStep): boolean => {
    switch (step) {
      case 'basic':
        return (
          formData.title.trim().length > 0 &&
          formData.shiftDate.length > 0 &&
          formData.fromShift !== formData.toShift
        );
      case 'details':
        return formData.notes.trim().length > 0;
      case 'related':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Navigation
  const goToStep = (step: FormStep) => {
    if (validateStep(currentStep)) {
      setCurrentStep(step);
      setError(null);
    } else {
      setError('Please complete all required fields');
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].id);
    }
  };

  const goPrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
      setError(null);
    }
  };

  // Form handlers
  const updateFormData = (updates: Partial<CreatePassdownRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addActionItem = () => {
    if (newActionItem.trim()) {
      updateFormData({
        actionItems: [...(formData.actionItems || []), {
          id: Date.now().toString(),
          description: newActionItem.trim(),
          completed: false
        }]
      });
      setNewActionItem('');
    }
  };

  const removeActionItem = (id: string) => {
    updateFormData({
      actionItems: formData.actionItems?.filter(item => item.id !== id)
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      updateFormData({
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateFormData({
      tags: formData.tags?.filter(t => t !== tag)
    });
  };

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await createPassdown(formData);
      
      if (success) {
        onSuccess?.('new-passdown-id'); // In real app, get ID from response
      } else {
        setError('Failed to create passdown');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentStepIndex;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => isCompleted && goToStep(step.id)}
              disabled={!isCompleted}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors",
                isActive && "bg-blue-600 text-white",
                isCompleted && !isActive && "bg-green-600 text-white cursor-pointer hover:bg-green-700",
                !isActive && !isCompleted && "bg-gray-200 text-gray-600"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
            </button>
            
            <div className="flex-1 ml-3">
              <p className={cn(
                "text-sm font-medium",
                isActive && "text-blue-600",
                isCompleted && "text-green-600",
                !isActive && !isCompleted && "text-gray-500"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4",
                isCompleted ? "bg-green-600" : "bg-gray-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Render form content
  const renderFormContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Brief title for the passdown"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => updateFormData({ summary: e.target.value })}
                placeholder="Optional brief summary (will be auto-generated if empty)"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shiftDate">Shift Date *</Label>
                <Input
                  id="shiftDate"
                  type="date"
                  value={formData.shiftDate}
                  onChange={(e) => updateFormData({ shiftDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PassdownCategory) => updateFormData({ category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          {cat.icon}
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromShift">From Shift *</Label>
                <Select
                  value={formData.fromShift}
                  onValueChange={(value: ShiftType) => updateFormData({ fromShift: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypes.map(shift => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="toShift">To Shift *</Label>
                <Select
                  value={formData.toShift}
                  onValueChange={(value: ShiftType) => updateFormData({ toShift: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypes.map(shift => (
                      <SelectItem 
                        key={shift.value} 
                        value={shift.value}
                        disabled={shift.value === formData.fromShift}
                      >
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Urgency Level *</Label>
              <RadioGroup
                value={formData.urgencyLevel}
                onValueChange={(value: UrgencyLevel) => updateFormData({ urgencyLevel: value })}
                className="mt-2"
              >
                {urgencyLevels.map(level => (
                  <div key={level.value} className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={level.value} className="font-medium cursor-pointer">
                        {level.label}
                      </Label>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledgmentRequired"
                checked={formData.acknowledgmentRequired}
                onCheckedChange={(checked) => 
                  updateFormData({ acknowledgmentRequired: checked as boolean })
                }
              />
              <Label 
                htmlFor="acknowledgmentRequired" 
                className="text-sm font-medium cursor-pointer"
              >
                Require acknowledgment from receiving shift
              </Label>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="notes">Detailed Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Provide detailed information about what the next shift needs to know..."
                rows={8}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-1">
                Be specific and include all relevant details
              </p>
            </div>

            <div>
              <Label>Action Items</Label>
              <div className="mt-2 space-y-2">
                {formData.actionItems?.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{item.description}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeActionItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add an action item..."
                  value={newActionItem}
                  onChange={(e) => setNewActionItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                />
                <Button type="button" onClick={addActionItem}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        );

      case 'related':
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Link this passdown to related activities, incidents, or cases for better context.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Related Items</Label>
              <p className="text-sm text-gray-600 mb-4">
                This feature will be implemented when integration with other modules is complete.
              </p>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Link to Activity
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Link to Incident
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Link to Case
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Attachments</Label>
              <FileUploadComponent
                passdownId="temp-passdown-id" // Will be updated after passdown creation
                onUploadComplete={(attachments) => {
                  updateFormData({ 
                    attachments: [...formData.attachments, ...attachments] 
                  });
                }}
                onUploadError={(error) => {
                  console.error('File upload error:', error);
                }}
                maxFiles={10}
                maxFileSize={50 * 1024 * 1024} // 50MB
              />
              
              {formData.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''} will be attached
                  </p>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{attachment.fileName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAttachments = formData.attachments.filter((_, i) => i !== index);
                            updateFormData({ attachments: newAttachments });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Please review the information below before creating the passdown.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600">Title</h4>
                <p className="mt-1">{formData.title}</p>
              </div>

              {formData.summary && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Summary</h4>
                  <p className="mt-1">{formData.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Shift Date</h4>
                  <p className="mt-1">{formData.shiftDate}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Category</h4>
                  <p className="mt-1">
                    {categories.find(c => c.value === formData.category)?.label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">From → To</h4>
                  <p className="mt-1">
                    {shiftTypes.find(s => s.value === formData.fromShift)?.label.split(' ')[0]} → {' '}
                    {shiftTypes.find(s => s.value === formData.toShift)?.label.split(' ')[0]}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Urgency</h4>
                  <Badge className={cn(
                    "mt-1",
                    formData.urgencyLevel === 'critical' && "bg-red-100 text-red-800",
                    formData.urgencyLevel === 'high' && "bg-orange-100 text-orange-800",
                    formData.urgencyLevel === 'medium' && "bg-yellow-100 text-yellow-800",
                    formData.urgencyLevel === 'low' && "bg-green-100 text-green-800"
                  )}>
                    {formData.urgencyLevel}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-600">Notes</h4>
                <p className="mt-1 whitespace-pre-wrap">{formData.notes}</p>
              </div>

              {formData.actionItems && formData.actionItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Action Items</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {formData.actionItems.map(item => (
                      <li key={item.id} className="text-sm">{item.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.tags && formData.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Tags</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {formData.acknowledgmentRequired && (
                  <Badge variant="outline">
                    <Bell className="w-3 h-3 mr-1" />
                    Acknowledgment Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Passdown</CardTitle>
        <CardDescription>
          Create a passdown to communicate important information to the next shift
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderStepIndicator()}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={(e) => e.preventDefault()}>
          {renderFormContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : goPrevious}
              disabled={loading}
            >
              {currentStepIndex === 0 ? (
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
            
            {currentStep === 'review' ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !validateStep('basic') || !validateStep('details')}
              >
                {loading ? 'Creating...' : 'Create Passdown'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={!validateStep(currentStep)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getCurrentShift(): ShiftType {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) return 'night';
  if (hour >= 7 && hour < 15) return 'day';
  if (hour >= 15 && hour < 23) return 'evening';
  return 'day';
}

function getNextShift(currentShift: ShiftType): ShiftType {
  switch (currentShift) {
    case 'night': return 'day';
    case 'day': return 'evening';
    case 'evening': return 'night';
    default: return 'day';
  }
}