import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  Target,
  Camera,
  Shield,
  PlayCircle,
  PauseCircle,
  XCircle,
  ArrowUp
} from 'lucide-react';
import SOPAutomationService, { SOPExecution, SOPStep } from '../../services/sop-automation.service';

interface SOPExecutionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  execution: SOPExecution | null;
}

export const SOPExecutionPanel: React.FC<SOPExecutionPanelProps> = ({
  open,
  onOpenChange,
  execution
}) => {
  const [localExecution, setLocalExecution] = useState<SOPExecution | null>(execution);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const sopService = SOPAutomationService.getInstance();

  useEffect(() => {
    if (!execution) return;

    const interval = setInterval(() => {
      const updated = sopService.getExecutionById(execution.id);
      if (updated) {
        setLocalExecution(updated);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [execution, sopService]);

  if (!localExecution) return null;

  const getStepStatusColor = (status: SOPStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'skipped': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStepStatusIcon = (status: SOPStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'skipped': return <PauseCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'photo': return <Camera className="h-3 w-3" />;
      case 'signature': return <FileText className="h-3 w-3" />;
      case 'witness': return <User className="h-3 w-3" />;
      case 'sensor': return <Target className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const handleStepAction = (stepId: string, action: 'start' | 'complete' | 'skip') => {
    switch (action) {
      case 'start':
        sopService.updateStepStatus(localExecution.id, stepId, 'in_progress');
        break;
      case 'complete':
        sopService.updateStepStatus(localExecution.id, stepId, 'completed', 'Manually completed');
        break;
      case 'skip':
        sopService.updateStepStatus(localExecution.id, stepId, 'skipped', 'Manually skipped');
        break;
    }
  };

  const handleEscalate = () => {
    sopService.escalateExecution(localExecution.id, 'Manual escalation requested');
  };

  const availableSteps = sopService.getNextAvailableSteps(localExecution.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SOP Execution Dashboard
          </DialogTitle>
          <DialogDescription>
            Monitor and manage Standard Operating Procedure execution for Alert #{localExecution.alertId}
          </DialogDescription>
        </DialogHeader>

        {/* Execution Overview */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Execution Overview</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={
                  localExecution.status === 'completed' ? 'default' :
                  localExecution.status === 'escalated' ? 'destructive' :
                  localExecution.status === 'aborted' ? 'secondary' : 'outline'
                } className="capitalize">
                  {localExecution.status}
                </Badge>
                {localExecution.escalationLevel > 1 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    Level {localExecution.escalationLevel}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(localExecution.completionPercentage)}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {localExecution.steps.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Steps Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {availableSteps.length}
                </div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {localExecution.assignedPersonnel.length}
                </div>
                <div className="text-sm text-gray-500">Personnel</div>
              </div>
            </div>

            <Progress value={localExecution.completionPercentage} className="mb-4" />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscalate}
                className="flex items-center gap-2"
              >
                <ArrowUp className="h-4 w-4" />
                Escalate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => sopService.abortExecution(localExecution.id, 'Manual abort')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Abort
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Actions */}
        {availableSteps.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Available Actions ({availableSteps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge variant={
                          step.priority === 'critical' ? 'destructive' :
                          step.priority === 'high' ? 'default' :
                          step.priority === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs capitalize">
                          {step.priority}
                        </Badge>
                        {step.verification?.required && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            {getVerificationIcon(step.verification.method)}
                            Verification Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Est. {Math.round(step.estimatedDuration / 60)} min</span>
                        <span>Clearance Level {step.requiredClearanceLevel}+</span>
                        {step.autoExecutable && <span className="text-blue-600">Auto-Executable</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStepAction(step.id, 'start')}
                        className="flex items-center gap-1"
                      >
                        <PlayCircle className="h-3 w-3" />
                        Start
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepAction(step.id, 'skip')}
                        className="flex items-center gap-1"
                      >
                        <PauseCircle className="h-3 w-3" />
                        Skip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Steps Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Protocol Steps Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localExecution.steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedStep === step.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.status === 'completed' ? 'bg-green-100 border-green-500' :
                    step.status === 'in_progress' ? 'bg-blue-100 border-blue-500' :
                    step.status === 'failed' ? 'bg-red-100 border-red-500' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{step.title}</h4>
                      <div className={`flex items-center gap-1 ${getStepStatusColor(step.status)}`}>
                        {getStepStatusIcon(step.status)}
                        <span className="text-xs capitalize">{step.status.replace('_', ' ')}</span>
                      </div>
                      {step.assignedGuard && (
                        <Badge variant="outline" className="text-xs">
                          Assigned: {step.assignedGuard}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Est. {Math.round(step.estimatedDuration / 60)} min</span>
                      {step.startedAt && (
                        <span>Started: {new Date(step.startedAt).toLocaleTimeString()}</span>
                      )}
                      {step.completedAt && (
                        <span>Completed: {new Date(step.completedAt).toLocaleTimeString()}</span>
                      )}
                    </div>

                    {step.verification?.required && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          {getVerificationIcon(step.verification.method)}
                          <span className="capitalize">{step.verification.method} verification</span>
                        </div>
                        <Badge variant={step.verification.completed ? 'default' : 'outline'} className="text-xs">
                          {step.verification.completed ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    )}

                    {step.notes && (
                      <div className="mt-2 text-xs text-gray-600 italic">
                        Note: {step.notes}
                      </div>
                    )}

                    {selectedStep === step.id && step.status === 'in_progress' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStepAction(step.id, 'complete')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Mark Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sopService.updateStepStatus(localExecution.id, step.id, 'failed', 'Manual failure')}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Mark Failed
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        {localExecution.notes.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Execution Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {localExecution.notes.map((note, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                    {note}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};