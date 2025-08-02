/**
 * PassdownDetailView Component
 * Displays detailed passdown information with read receipts and acknowledgments
 */

import React, { useEffect, useState } from 'react';
import { usePassdownStore } from '../stores/passdownStore';
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
  Printer
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
import { 
  Passdown,
  PassdownReceipt,
  PassdownAttachment,
  ShiftType,
  UrgencyLevel,
  PassdownStatus,
  PassdownCategory
} from '../lib/types/passdown';
import { FileListComponent } from './passdowns/FileListComponent';
import { formatDistanceToNow, format } from 'date-fns';

interface PassdownDetailViewProps {
  passdownId: string;
  onBack?: () => void;
  onEdit?: (passdown: Passdown) => void;
  onDelete?: (passdownId: string) => void;
}

// Shift type display mapping
const shiftTypeLabels: Record<ShiftType, string> = {
  night: 'Night Shift',
  day: 'Day Shift',
  evening: 'Evening Shift',
  swing: 'Swing Shift',
  custom: 'Custom Shift'
};

// Category config
const categoryConfig: Record<PassdownCategory, { label: string; icon: React.ReactNode; color: string }> = {
  security: { label: 'Security', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' },
  safety: { label: 'Safety', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-600' },
  operations: { label: 'Operations', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' },
  maintenance: { label: 'Maintenance', icon: <FileText className="w-4 h-4" />, color: 'text-yellow-600' },
  visitor: { label: 'Visitor', icon: <Users className="w-4 h-4" />, color: 'text-green-600' },
  emergency: { label: 'Emergency', icon: <Bell className="w-4 h-4" />, color: 'text-red-600' },
  other: { label: 'Other', icon: <Tag className="w-4 h-4" />, color: 'text-gray-600' }
};

// Status config
const statusConfig: Record<PassdownStatus, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
  acknowledged: { color: 'bg-green-100 text-green-800', label: 'Acknowledged' },
  expired: { color: 'bg-gray-100 text-gray-600', label: 'Expired' },
  archived: { color: 'bg-gray-100 text-gray-500', label: 'Archived' }
};

// Urgency config
const urgencyConfig: Record<UrgencyLevel, { color: string; bgColor: string }> = {
  low: { color: 'text-green-600', bgColor: 'bg-green-50' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-50' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-50' }
};

export function PassdownDetailView({ passdownId, onBack, onEdit, onDelete }: PassdownDetailViewProps) {
  const {
    selectedPassdown,
    readReceipts,
    loading,
    error,
    fetchPassdownById,
    acknowledgePassdown,
    updatePassdown,
    clearError
  } = usePassdownStore();

  const [acknowledgmentNotes, setAcknowledgmentNotes] = useState('');
  const [showAcknowledgmentForm, setShowAcknowledgmentForm] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Fetch passdown details on mount
  useEffect(() => {
    fetchPassdownById(passdownId, true);
  }, [passdownId]);

  // Handle acknowledgment
  const handleAcknowledge = async (acknowledged: boolean) => {
    setIsAcknowledging(true);
    try {
      const success = await acknowledgePassdown(
        passdownId,
        acknowledged,
        acknowledgmentNotes || undefined
      );
      
      if (success) {
        setShowAcknowledgmentForm(false);
        setAcknowledgmentNotes('');
        // Refresh the passdown to get updated receipts
        await fetchPassdownById(passdownId, true);
      }
    } finally {
      setIsAcknowledging(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: PassdownStatus) => {
    const success = await updatePassdown(passdownId, { status: newStatus });
    if (success) {
      await fetchPassdownById(passdownId, true);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (selectedPassdown) {
      const text = `
Passdown: ${selectedPassdown.title}
Date: ${selectedPassdown.shiftDate}
From: ${shiftTypeLabels[selectedPassdown.fromShift]}
To: ${shiftTypeLabels[selectedPassdown.toShift]}
Urgency: ${selectedPassdown.urgencyLevel}

${selectedPassdown.notes}

${selectedPassdown.actionItems?.length ? '\nAction Items:\n' + selectedPassdown.actionItems.map(item => `- ${item.description}`).join('\n') : ''}
      `.trim();
      
      navigator.clipboard.writeText(text);
    }
  };

  // Loading state
  if (loading && !selectedPassdown) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onBack}>
              Go Back
            </Button>
            <Button onClick={() => fetchPassdownById(passdownId, true)}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPassdown) {
    return null;
  }

  // Check if current user has acknowledged
  const currentUserReceipt = readReceipts.find(r => r.userId === 'current-user');
  const hasAcknowledged = currentUserReceipt?.acknowledged || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </Button>
          {onEdit && selectedPassdown.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => onEdit(selectedPassdown)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className={cn(
        "border-2",
        selectedPassdown.urgencyLevel === 'critical' && "border-red-200",
        selectedPassdown.urgencyLevel === 'high' && "border-orange-200"
      )}>
        <CardHeader className={cn(
          urgencyConfig[selectedPassdown.urgencyLevel].bgColor
        )}>
          <div className="space-y-4">
            {/* Title and Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{selectedPassdown.title}</CardTitle>
                {selectedPassdown.summary && (
                  <CardDescription className="mt-2 text-base">
                    {selectedPassdown.summary}
                  </CardDescription>
                )}
              </div>
              <Badge className={statusConfig[selectedPassdown.status].color}>
                {statusConfig[selectedPassdown.status].label}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{format(new Date(selectedPassdown.shiftDate), 'MMM dd, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{shiftTypeLabels[selectedPassdown.fromShift]} → {shiftTypeLabels[selectedPassdown.toShift]}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>{selectedPassdown.createdByName}</span>
              </div>
              
              {selectedPassdown.locationName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedPassdown.locationName}</span>
                </div>
              )}
            </div>

            {/* Category and Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={categoryConfig[selectedPassdown.category].color}>
                {categoryConfig[selectedPassdown.category].icon}
                {categoryConfig[selectedPassdown.category].label}
              </Badge>
              
              {selectedPassdown.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Acknowledgment Alert */}
            {selectedPassdown.acknowledgmentRequired && !hasAcknowledged && selectedPassdown.status === 'active' && (
              <Alert className="border-orange-200 bg-orange-50">
                <Bell className="h-4 w-4 text-orange-600" />
                <AlertTitle>Acknowledgment Required</AlertTitle>
                <AlertDescription>
                  Please acknowledge that you have read and understood this passdown.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="receipts">
                Read Receipts ({readReceipts.length})
              </TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Notes Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Detailed Notes
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{selectedPassdown.notes}</p>
                </div>
              </div>

              {/* Action Items */}
              {selectedPassdown.actionItems && selectedPassdown.actionItems.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Action Items
                    </h3>
                    <div className="space-y-2">
                      {selectedPassdown.actionItems.map(item => (
                        <div key={item.id} className="flex items-start gap-2">
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                            item.completed 
                              ? "bg-green-500 border-green-500" 
                              : "border-gray-300"
                          )}>
                            {item.completed && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={cn(
                            "flex-1",
                            item.completed && "line-through text-gray-500"
                          )}>
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Related Entities */}
              {selectedPassdown.relatedEntities && selectedPassdown.relatedEntities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Related Items</h3>
                    <div className="space-y-2">
                      {selectedPassdown.relatedEntities.map(entity => (
                        <Button
                          key={entity.entityId}
                          variant="outline"
                          className="w-full justify-start"
                          disabled
                        >
                          {entity.entityType === 'activity' && <FileText className="w-4 h-4 mr-2" />}
                          {entity.entityType === 'incident' && <AlertTriangle className="w-4 h-4 mr-2" />}
                          {entity.entityType === 'case' && <Users className="w-4 h-4 mr-2" />}
                          {entity.entityType}: {entity.entityId}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Attachments */}
              {selectedPassdown.attachments && selectedPassdown.attachments.length > 0 && (
                <>
                  <Separator />
                  <FileListComponent
                    attachments={selectedPassdown.attachments}
                    onAttachmentDelete={(attachmentId) => {
                      // Handle attachment deletion
                      // This would typically update the passdown store
                      console.log('Delete attachment:', attachmentId);
                    }}
                    showActions={true}
                    compact={false}
                    maxHeight="300px"
                  />
                </>
              )}

              {/* Acknowledgment Section */}
              {selectedPassdown.acknowledgmentRequired && selectedPassdown.status === 'active' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Acknowledgment</h3>
                    
                    {hasAcknowledged ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Acknowledged</AlertTitle>
                        <AlertDescription>
                          You acknowledged this passdown on{' '}
                          {format(new Date(currentUserReceipt!.readAt), 'PPp')}
                          {currentUserReceipt!.notes && (
                            <div className="mt-2">
                              <strong>Notes:</strong> {currentUserReceipt!.notes}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {!showAcknowledgmentForm ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setShowAcknowledgmentForm(true)}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Acknowledge Passdown
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAcknowledge(false)}
                            >
                              Mark as Read Only
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Add optional notes about this passdown..."
                              value={acknowledgmentNotes}
                              onChange={(e) => setAcknowledgmentNotes(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleAcknowledge(true)}
                                disabled={isAcknowledging}
                              >
                                {isAcknowledging ? 'Acknowledging...' : 'Confirm Acknowledgment'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowAcknowledgmentForm(false);
                                  setAcknowledgmentNotes('');
                                }}
                                disabled={isAcknowledging}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="receipts">
              <div className="space-y-4">
                {readReceipts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No one has read this passdown yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {readReceipts.map(receipt => (
                      <Card key={receipt.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {receipt.userName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{receipt.userName}</p>
                                <p className="text-sm text-gray-500">
                                  Read on {format(new Date(receipt.readAt), 'PPp')}
                                </p>
                                {receipt.notes && (
                                  <p className="text-sm mt-1">{receipt.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {receipt.acknowledged ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Acknowledged
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Read
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Activity log will be implemented with audit service integration.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(selectedPassdown.createdAt), { addSuffix: true })}
              {selectedPassdown.updatedAt !== selectedPassdown.createdAt && (
                <span className="ml-2">
                  • Updated {formatDistanceToNow(new Date(selectedPassdown.updatedAt), { addSuffix: true })}
                </span>
              )}
            </div>
            
            {selectedPassdown.status === 'active' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('archived')}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}