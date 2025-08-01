'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useActivityStore } from '../stores';
import { createAuditContext } from '../services/ServiceProvider';
import { Plus, AlertTriangle, Clock, Target, Building, MapPin, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateActivityModalProps {
  trigger?: React.ReactNode;
  onActivityCreated?: () => void;
  className?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'lg' | 'default';
}

interface ActivityFormData {
  title: string;
  description: string;
  location: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  building: string;
  zone: string;
  isIncident: boolean;
}

const initialFormData: ActivityFormData = {
  title: '',
  description: '',
  location: '',
  type: 'patrol',
  priority: 'medium',
  building: 'building-a',
  zone: 'Zone A-1',
  isIncident: false,
};

const activityTypes = [
  { value: 'patrol', label: 'Patrol' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'security-breach', label: 'Security Breach' },
  { value: 'alert', label: 'System Alert' },
  { value: 'evidence', label: 'Evidence Collection' },
  { value: 'property-damage', label: 'Property Damage' },
  { value: 'bol-event', label: 'Be-On-Lookout' },
];

const buildings = [
  { value: 'building-a', label: 'Building A' },
  { value: 'building-b', label: 'Building B' },
  { value: 'building-c', label: 'Building C' },
  { value: 'parking', label: 'Parking Structure' },
  { value: 'perimeter', label: 'Perimeter' },
];

const zones = {
  'building-a': ['Zone A-1', 'Zone A-2', 'Zone A-3'],
  'building-b': ['Zone B-1', 'Zone B-2', 'Zone B-3'],
  'building-c': ['Zone C-1', 'Zone C-2'],
  'parking': ['Sector P-1', 'Sector P-2', 'Sector P-3'],
  'perimeter': ['North Gate', 'South Gate', 'East Gate', 'West Gate'],
};

export function CreateActivityModal({ 
  trigger, 
  onActivityCreated, 
  className,
  variant = 'button',
  size = 'default'
}: CreateActivityModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createActivity } = useActivityStore();

  const handleInputChange = (field: keyof ActivityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const auditContext = createAuditContext(
        'user-001',
        'Officer Davis',
        'officer',
        'create_activity',
        `Creating ${formData.isIncident ? 'incident' : 'activity'}: ${formData.title}`
      );

      await createActivity({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type as any, // Cast to ActivityType
        priority: formData.priority,
        building: formData.building,
        zone: formData.zone,
        metadata: {
          site: 'enterprise-hq',
          siteCode: 'ENT-HQ',
          region: 'North America',
          facilityType: 'Corporate Headquarters',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          securityLevel: 'high' as any,
          operationalHours: '24/7',
          building: formData.building,
          zone: formData.zone,
          ...(formData.isIncident && { incidentType: 'manual' })
        },
      }, auditContext);

      // Reset form and close modal
      setFormData(initialFormData);
      setOpen(false);
      onActivityCreated?.();
    } catch (error) {
      console.error('Failed to create activity:', error);
      setErrors({ submit: 'Failed to create activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Target className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size={size}
      className={cn(
        "shadow-lg backdrop-blur-sm border-2 transition-all duration-200",
        "bg-card/90 border-border hover:bg-card hover:scale-105",
        variant === 'icon' && "h-10 w-10 p-0",
        className
      )}
    >
      {variant === 'icon' ? (
        <Plus className="h-4 w-4" />
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Create Activity
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-2xl max-h-[90vh] overflow-hidden",
        "backdrop-blur-md border-2 shadow-2xl",
        "bg-card/95 border-border/50"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Plus className="h-5 w-5 text-primary" />
            Create New {formData.isIncident ? 'Incident' : 'Activity'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Activity Type Toggle */}
          <Card className="bg-background/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <Label className="text-sm font-medium">Activity Type</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={!formData.isIncident ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange('isIncident', false)}
                    className="h-8"
                  >
                    Regular Activity
                  </Button>
                  <Button
                    type="button"
                    variant={formData.isIncident ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange('isIncident', true)}
                    className="h-8 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                  >
                    Incident
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter activity title"
                className={cn(
                  "mt-1 bg-background/50 backdrop-blur-sm",
                  errors.title && "border-red-500"
                )}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the activity or incident details"
                rows={3}
                className={cn(
                  "mt-1 bg-background/50 backdrop-blur-sm resize-none",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="building" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Building
              </Label>
              <Select value={formData.building} onValueChange={(value) => {
                handleInputChange('building', value);
                // Reset zone when building changes
                const availableZones = zones[value as keyof typeof zones];
                if (availableZones && availableZones.length > 0) {
                  handleInputChange('zone', availableZones[0]);
                }
              }}>
                <SelectTrigger className="mt-1 bg-background/50 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.value} value={building.value}>
                      {building.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zone">Zone</Label>
              <Select value={formData.zone} onValueChange={(value) => handleInputChange('zone', value)}>
                <SelectTrigger className="mt-1 bg-background/50 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones[formData.building as keyof typeof zones]?.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Specific Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Room, area, etc."
                className={cn(
                  "mt-1 bg-background/50 backdrop-blur-sm",
                  errors.location && "border-red-500"
                )}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Activity Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Activity Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="mt-1 bg-background/50 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value as any)}>
                <SelectTrigger className="mt-1 bg-background/50 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Card */}
          <Card className="bg-background/30 backdrop-blur-sm border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Preview</h4>
                <Badge className={cn("border", getPriorityColor(formData.priority))}>
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(formData.priority)}
                    {formData.priority.toUpperCase()}
                  </div>
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Title:</strong> {formData.title || 'Untitled'}</p>
                <p><strong>Type:</strong> {formData.isIncident ? 'Incident' : 'Activity'} - {activityTypes.find(t => t.value === formData.type)?.label}</p>
                <p><strong>Location:</strong> {formData.building} / {formData.zone} / {formData.location || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="bg-background/50 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "shadow-lg backdrop-blur-sm",
                formData.isIncident 
                  ? "bg-red-500/90 hover:bg-red-500 text-white" 
                  : "bg-primary/90 hover:bg-primary"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create {formData.isIncident ? 'Incident' : 'Activity'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}