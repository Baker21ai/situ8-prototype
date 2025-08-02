import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap,
  Play,
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  GitBranch,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Info,
  Shield,
  Bell,
  MessageSquare,
  FileText,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'voice_keyword' | 'transcript_pattern' | 'incident_type' | 'time_based' | 'threshold';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'create_incident' | 'send_notification' | 'dispatch_team' | 'trigger_sop' | 'escalate';
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastTriggered?: string;
  triggerCount: number;
  successRate: number;
  requiredClearance?: number;
  tags?: string[];
}

interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'partial';
  trigger: any;
  actions: Array<{
    type: string;
    status: 'success' | 'failed' | 'skipped';
    result?: any;
    error?: string;
  }>;
  duration: number;
}

interface AutomationConsoleProps {
  rules?: AutomationRule[];
  executions?: AutomationExecution[];
  onToggleRule?: (ruleId: string, enabled: boolean) => void;
  onEditRule?: (ruleId: string) => void;
  onDeleteRule?: (ruleId: string) => void;
  onCreateRule?: () => void;
  onTestRule?: (ruleId: string) => void;
}

export function AutomationConsole({
  rules = [],
  executions = [],
  onToggleRule,
  onEditRule,
  onDeleteRule,
  onCreateRule,
  onTestRule
}: AutomationConsoleProps) {
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = rules.filter(rule => {
    if (filterEnabled !== null && rule.enabled !== filterEnabled) return false;
    if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeRules = rules.filter(r => r.enabled).length;
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'success').length;
  const avgSuccessRate = rules.length > 0 
    ? rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length 
    : 0;

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'voice_keyword': return MessageSquare;
      case 'transcript_pattern': return FileText;
      case 'incident_type': return AlertTriangle;
      case 'time_based': return Clock;
      case 'threshold': return Activity;
      default: return Zap;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_incident': return AlertTriangle;
      case 'send_notification': return Bell;
      case 'dispatch_team': return Shield;
      case 'trigger_sop': return FileText;
      case 'escalate': return GitBranch;
      default: return Zap;
    }
  };

  const selectedRuleData = selectedRule ? rules.find(r => r.id === selectedRule) : null;

  return (
    <div className="h-full flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">{activeRules}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Executions Today</p>
                  <p className="text-2xl font-bold">{totalExecutions}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{Math.round(avgSuccessRate * 100)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">1.2s</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Console
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onCreateRule}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Rule
                </Button>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-4">
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="executions">Executions</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rules" className="flex-1 p-0">
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={filterEnabled === true ? 'default' : 'outline'}
                      onClick={() => setFilterEnabled(filterEnabled === true ? null : true)}
                    >
                      Enabled
                    </Button>
                    <Button
                      size="sm"
                      variant={filterEnabled === false ? 'default' : 'outline'}
                      onClick={() => setFilterEnabled(filterEnabled === false ? null : false)}
                    >
                      Disabled
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4 pt-0 space-y-3">
                    {filteredRules.map((rule) => {
                      const TriggerIcon = getTriggerIcon(rule.trigger.type);
                      const isSelected = selectedRule === rule.id;
                      
                      return (
                        <div
                          key={rule.id}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            isSelected && "ring-2 ring-primary",
                            !rule.enabled && "opacity-60"
                          )}
                          onClick={() => setSelectedRule(rule.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3">
                              <TriggerIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{rule.name}</h4>
                                  <Badge variant={
                                    rule.priority === 'critical' ? 'destructive' :
                                    rule.priority === 'high' ? 'warning' :
                                    rule.priority === 'medium' ? 'default' : 'secondary'
                                  }>
                                    {rule.priority}
                                  </Badge>
                                  {rule.requiredClearance && (
                                    <Badge variant="outline" className="text-xs">
                                      L{rule.requiredClearance}+
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rule.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  onToggleRule?.(rule.id, checked);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                            </span>
                            <span>
                              Triggered {rule.triggerCount} times
                            </span>
                            <span>
                              {Math.round(rule.successRate * 100)}% success
                            </span>
                            {rule.lastTriggered && (
                              <span>
                                Last: {new Date(rule.lastTriggered).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          
                          {rule.tags && rule.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {rule.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="executions" className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {executions.map((execution) => (
                      <div
                        key={execution.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          execution.status === 'failed' && "border-red-200 bg-red-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {execution.ruleName}
                            </span>
                            <Badge variant={
                              execution.status === 'success' ? 'success' :
                              execution.status === 'failed' ? 'destructive' : 'warning'
                            }>
                              {execution.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(execution.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {execution.actions.map((action, idx) => {
                            const ActionIcon = getActionIcon(action.type);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <ActionIcon className="h-3 w-3" />
                                <span>{action.type}</span>
                                {action.status === 'success' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : action.status === 'failed' ? (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                ) : (
                                  <Info className="h-3 w-3 text-gray-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Duration: {execution.duration}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="templates" className="flex-1 p-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Rule templates library</p>
                  <p className="text-xs mt-1">
                    Pre-built automation patterns coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Rule Details Panel */}
      {selectedRuleData && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-lg">Rule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rule Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Configuration</h4>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Trigger</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Type: {selectedRuleData.trigger.type}
                  </p>
                  <pre className="text-xs mt-1 overflow-auto">
                    {JSON.stringify(selectedRuleData.trigger.conditions, null, 2)}
                  </pre>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Actions</span>
                  </div>
                  {selectedRuleData.actions.map((action, idx) => (
                    <div key={idx} className="text-sm mb-1">
                      {idx + 1}. {action.type}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h4 className="text-sm font-medium mb-2">Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 border rounded">
                  <p className="text-xs text-muted-foreground">Triggered</p>
                  <p className="font-medium">{selectedRuleData.triggerCount} times</p>
                </div>
                <div className="p-2 border rounded">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="font-medium">{Math.round(selectedRuleData.successRate * 100)}%</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onTestRule?.(selectedRuleData.id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEditRule?.(selectedRuleData.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeleteRule?.(selectedRuleData.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}