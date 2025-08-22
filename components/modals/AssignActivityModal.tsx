/**
 * Assignment Modal Component
 * Enhanced assignment workflow with personnel dropdown and notifications
 */

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { 
  User, 
  Clock, 
  Radio, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Shield
} from 'lucide-react';
import { EnterpriseActivity } from '../../lib/types/activity';
import { SecurityPersonnel, getAvailablePersonnel, getPersonnelById } from '../../lib/data/personnel';

interface AssignActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: EnterpriseActivity | null;
  onAssign: (activityId: string, assigneeId: string, notes?: string, notifyAssignee?: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function AssignActivityModal({
  isOpen,
  onClose,
  activity,
  onAssign,
  isLoading = false
}: AssignActivityModalProps) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [notifyAssignee, setNotifyAssignee] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePersonnel = useMemo(() => getAvailablePersonnel(), []);
  const selectedPersonnel = useMemo(() => 
    selectedPersonnelId ? getPersonnelById(selectedPersonnelId) : null, 
    [selectedPersonnelId]
  );

  const handleAssign = async () => {
    if (!activity || !selectedPersonnelId) return;

    setIsSubmitting(true);
    try {
      await onAssign(activity.id, selectedPersonnelId, assignmentNotes, notifyAssignee);
      handleClose();
    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPersonnelId('');
    setAssignmentNotes('');
    setNotifyAssignee(true);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Assign Activity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              <Badge className={`${getPriorityColor(activity.priority || 'medium')} capitalize`}>
                {activity.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'No timestamp'}
              </span>
              <span>{activity.location}</span>
            </div>
          </div>

          {/* Personnel Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Assign to Security Personnel
            </Label>
            <Select value={selectedPersonnelId} onValueChange={setSelectedPersonnelId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select security personnel..." />
              </SelectTrigger>
              <SelectContent>
                {availablePersonnel.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {person.role.includes('Supervisor') ? (
                            <Shield className="h-3 w-3 text-blue-600" />
                          ) : (
                            <User className="h-3 w-3 text-gray-600" />
                          )}
                          <span className="font-medium">{person.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">({person.badge})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {person.role}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${
                          person.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Personnel Details */}
          {selectedPersonnel && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {selectedPersonnel.role.includes('Supervisor') ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <User className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="font-semibold">{selectedPersonnel.name}</span>
                  <Badge className="text-xs">{selectedPersonnel.badge}</Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedPersonnel.role}
                </Badge>
              </div>

              {selectedPersonnel.specializations && selectedPersonnel.specializations.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-gray-600 font-medium">Specializations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPersonnel.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-xs">
                {selectedPersonnel.contactInfo?.radio && (
                  <div className="flex items-center gap-1">
                    <Radio className="h-3 w-3 text-blue-600" />
                    <span>{selectedPersonnel.contactInfo.radio}</span>
                  </div>
                )}
                {selectedPersonnel.contactInfo?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-green-600" />
                    <span>{selectedPersonnel.contactInfo.phone}</span>
                  </div>
                )}
                {selectedPersonnel.contactInfo?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-purple-600" />
                    <span className="truncate">{selectedPersonnel.contactInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Assignment Notes (Optional)
            </Label>
            <Textarea
              placeholder="Add any specific instructions or context for this assignment..."
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Notification Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-assignee"
              checked={notifyAssignee}
              onCheckedChange={(checked) => setNotifyAssignee(checked as boolean)}
            />
            <Label htmlFor="notify-assignee" className="text-sm font-medium text-gray-700">
              Notify assignee via radio/phone
            </Label>
          </div>

          {/* Priority Warning for Critical Activities */}
          {activity.priority === 'critical' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                This is a critical priority activity. Ensure immediate response coordination.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedPersonnelId || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign Activity
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}