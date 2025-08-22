/**
 * Case Delete Confirmation Dialog
 * Two-step deletion confirmation to prevent accidental case deletion
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  FileText,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useCaseStore } from '../../stores/caseStore';
import { useUserStore } from '../../stores/userStore';

interface CaseDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuccess?: () => void;
}

export const CaseDeleteConfirm: React.FC<CaseDeleteConfirmProps> = ({
  open,
  onOpenChange,
  caseId,
  onSuccess
}) => {
  const { cases, deleteCase } = useCaseStore();
  const { currentUser } = useUserStore();
  const caseToDelete = cases.find(c => c.id === caseId);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmText('');
      setIsDeleting(false);
    }
  }, [open]);
  
  if (!caseToDelete) {
    return null;
  }
  
  const handleFirstConfirm = () => {
    setStep(2);
  };
  
  const handleFinalDelete = async () => {
    if (confirmText !== caseToDelete.caseNumber) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Call the deleteCase method from the store
      await deleteCase(caseId);
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete case:', error);
      // Could show an error toast here
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getDeletionImpact = () => {
    const impacts = [];
    
    // Check related data
    if (caseToDelete.relatedIncidents && caseToDelete.relatedIncidents.length > 0) {
      impacts.push({
        icon: AlertCircle,
        label: 'Related Incidents',
        value: caseToDelete.relatedIncidents.length,
        severity: 'medium'
      });
    }
    
    if (caseToDelete.relatedActivities && caseToDelete.relatedActivities.length > 0) {
      impacts.push({
        icon: FileText,
        label: 'Related Activities',
        value: caseToDelete.relatedActivities.length,
        severity: 'low'
      });
    }
    
    if (caseToDelete.evidenceItems && caseToDelete.evidenceItems.length > 0) {
      impacts.push({
        icon: Shield,
        label: 'Evidence Items',
        value: caseToDelete.evidenceItems.length,
        severity: 'high'
      });
    }
    
    if (caseToDelete.investigators && caseToDelete.investigators.length > 0) {
      impacts.push({
        icon: Users,
        label: 'Assigned Investigators',
        value: caseToDelete.investigators.length,
        severity: 'medium'
      });
    }
    
    // Calculate days since creation
    const daysOld = Math.floor(
      (Date.now() - new Date(caseToDelete.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    impacts.push({
      icon: Clock,
      label: 'Case Age',
      value: `${daysOld} days`,
      severity: daysOld > 30 ? 'high' : 'low'
    });
    
    return impacts;
  };
  
  const deletionImpacts = getDeletionImpact();
  const hasHighSeverityImpact = deletionImpacts.some(impact => impact.severity === 'high');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Case Confirmation
              </DialogTitle>
              <DialogDescription>
                You are about to delete case <strong>{caseToDelete.caseNumber}</strong>. 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting this case will permanently remove all associated data including
                  evidence, notes, and investigation history.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Case Details:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{caseToDelete.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={caseToDelete.status === 'closed' ? 'secondary' : 'default'}>
                      {caseToDelete.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge 
                      variant={
                        caseToDelete.priority === 'critical' ? 'destructive' :
                        caseToDelete.priority === 'high' ? 'destructive' :
                        caseToDelete.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {caseToDelete.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {deletionImpacts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Deletion Impact:</h4>
                  <div className="space-y-2">
                    {deletionImpacts.map((impact, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <impact.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{impact.label}</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          impact.severity === 'high' ? 'text-destructive' :
                          impact.severity === 'medium' ? 'text-orange-600' : ''
                        }`}>
                          {impact.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {hasHighSeverityImpact && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This case contains critical data. Please ensure all necessary
                    information has been backed up or transferred before deletion.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFirstConfirm}
              >
                Continue with Deletion
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Final Confirmation Required
              </DialogTitle>
              <DialogDescription>
                To confirm deletion, please type the case number exactly as shown below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Final Warning</AlertTitle>
                <AlertDescription>
                  This is your last chance to cancel. Once confirmed, all case data
                  will be permanently deleted and cannot be recovered.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">
                    Type this case number to confirm:
                  </p>
                  <p className="text-lg font-mono font-semibold">
                    {caseToDelete.caseNumber}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-case-number">
                    Case Number Confirmation
                  </Label>
                  <Input
                    id="confirm-case-number"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type case number here"
                    className={confirmText && confirmText !== caseToDelete.caseNumber ? 
                      'border-destructive' : ''
                    }
                  />
                  {confirmText && confirmText !== caseToDelete.caseNumber && (
                    <p className="text-sm text-destructive">
                      Case number doesn't match
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Audit Notice:</strong> This deletion will be logged with your
                  user ID ({currentUser?.email || 'Unknown'}) and timestamp for compliance purposes.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isDeleting}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinalDelete}
                disabled={confirmText !== caseToDelete.caseNumber || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Case Permanently
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};