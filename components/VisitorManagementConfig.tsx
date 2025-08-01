/**
 * Visitor Management Configuration Component
 * Admin interface for configuring visitor management integrations and workflows
 * Integrates with Situ8 design system and supports modular third-party configurations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import type { 
  VisitorManagementConfig as VisitorConfigType, 
  ProviderConfig, 
  WorkflowConfig, 
  IntegrationType,
  AccessControlConfig,
  NotificationConfig,
  UISettings
} from '../lib/types/visitor';
import { VisitorConfigService } from '../services/visitor-config.service';

interface VisitorManagementConfigProps {
  className?: string;
  onConfigurationChange?: (config: VisitorManagementConfig) => void;
}

export const VisitorManagementConfig: React.FC<VisitorManagementConfigProps> = ({
  className,
  onConfigurationChange
}) => {
  const [config, setConfig] = useState<VisitorConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  const configService = new VisitorConfigService();

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (config && onConfigurationChange) {
      onConfigurationChange(config);
    }
  }, [config, onConfigurationChange]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await configService.getConfiguration({
        userId: 'admin',
        userName: 'System Admin',
        userRole: 'admin'
      });

      if (response.success && response.data) {
        setConfig(response.data);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to load configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const validation = await configService.validateConfiguration({
        userId: 'admin',
        userName: 'System Admin',
        userRole: 'admin'
      });

      if (validation.success && validation.data) {
        if (!validation.data.isValid) {
          setValidationErrors(validation.data.errors);
          return;
        }

        const response = await configService.updateConfiguration(config, {
          userId: 'admin',
          userName: 'System Admin',
          userRole: 'admin'
        });

        if (response.success) {
          setConfig(response.data);
          setError(null);
          setValidationErrors([]);
        } else {
          setError(response.error?.message || 'Failed to save configuration');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<VisitorConfigType>) => {
    if (config) {
      setConfig({ ...config, ...updates });
    }
  };

  const addProvider = () => {
    if (!config) return;

    const newProvider: ProviderConfig = {
      id: `provider-${Date.now()}`,
      name: 'New Provider',
      type: 'custom_api',
      enabled: false,
      api_config: {
        base_url: '',
        timeout_ms: 30000,
        retry_count: 3
      },
      features: [],
      priority: config.providers.length + 1
    };

    updateConfig({
      providers: [...config.providers, newProvider]
    });
  };

  const updateProvider = (providerId: string, updates: Partial<ProviderConfig>) => {
    if (!config) return;

    const updatedProviders = config.providers.map(p =>
      p.id === providerId ? { ...p, ...updates } : p
    );

    updateConfig({ providers: updatedProviders });
  };

  const removeProvider = (providerId: string) => {
    if (!config) return;

    const filteredProviders = config.providers.filter(p => p.id !== providerId);
    updateConfig({ providers: filteredProviders });
  };

  const addWorkflow = () => {
    if (!config) return;

    const newWorkflow: WorkflowConfig = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      enabled: false,
      triggers: [],
      actions: [],
      conditions: []
    };

    updateConfig({
      workflows: [...config.workflows, newWorkflow]
    });
  };

  const exportConfiguration = async () => {
    if (!config) return;

    try {
      const response = await configService.exportConfiguration({
        userId: 'admin',
        userName: 'System Admin',
        userRole: 'admin'
      });

      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitor-management-config.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const importConfiguration = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      
      const response = await configService.importConfiguration(text, {
        userId: 'admin',
        userName: 'System Admin',
        userRole: 'admin'
      });

      if (response.success && response.data) {
        setConfig(response.data);
        setError(null);
      } else {
        setError(response.error?.message || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid configuration file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2">Failed to load configuration</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Visitor Management Configuration</h1>
          <p className="text-gray-600">Configure visitor management integrations and workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfiguration}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportConfiguration}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importConfiguration}
          />
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertDescription>Configuration validation failed:</AlertDescription>
            <ul className="mt-2 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="providers">
            <Shield className="h-4 w-4 mr-2" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Users className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Enable visitor management and select integration type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Visitor Management</Label>
                  <p className="text-sm text-gray-600">
                    Turn on visitor management system integration
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="integration_type">Integration Type</Label>
                <Select
                  value={config.integration_type}
                  onValueChange={(value) => updateConfig({ integration_type: value as IntegrationType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lenel_onguard">Lenel OnGuard</SelectItem>
                    <SelectItem value="hid_easylobby">HID EasyLobby</SelectItem>
                    <SelectItem value="custom_api">Custom API</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Multiple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_retention">Data Retention (days)</Label>
                  <Input
                    id="data_retention"
                    type="number"
                    value={config.compliance.data_retention_days}
                    onChange={(e) => updateConfig({
                      compliance: { ...config.compliance, data_retention_days: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="privacy_retention">Privacy Retention (days)</Label>
                  <Input
                    id="privacy_retention"
                    type="number"
                    value={config.compliance.privacy_settings.retention_period_days}
                    onChange={(e) => updateConfig({
                      compliance: {
                        ...config.compliance,
                        privacy_settings: {
                          ...config.compliance.privacy_settings,
                          retention_period_days: parseInt(e.target.value)
                        }
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Integration Providers</h3>
              <Button onClick={addProvider} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>

            {config.providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>
                        Type: {provider.type} | Priority: {provider.priority}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={(checked) => updateProvider(provider.id, { enabled: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProvider(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={provider.name}
                        onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={provider.type}
                        onValueChange={(value) => updateProvider(provider.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lenel_onguard">Lenel OnGuard</SelectItem>
                          <SelectItem value="hid_easylobby">HID EasyLobby</SelectItem>
                          <SelectItem value="custom_api">Custom API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Base URL</Label>
                    <Input
                      value={provider.api_config.base_url}
                      onChange={(e) => updateProvider(provider.id, {
                        api_config: { ...provider.api_config, base_url: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Features</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {provider.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Workflows</h3>
              <Button onClick={addWorkflow} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Workflow
              </Button>
            </div>

            {config.workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription>
                        {workflow.triggers.length} triggers, {workflow.actions.length} actions
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.enabled}
                        onCheckedChange={(checked) => {
                          const updated = config.workflows.map(w =>
                            w.id === workflow.id ? { ...w, enabled: checked } : w
                          );
                          updateConfig({ workflows: updated });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const filtered = config.workflows.filter(w => w.id !== workflow.id);
                          updateConfig({ workflows: filtered });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{workflow.triggers.length} triggers configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <span>{workflow.actions.length} actions configured</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Configure how visitor events are communicated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.notifications.channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between">
                    <div>
                      <Label>{channel.type.toUpperCase()}</Label>
                      <p className="text-sm text-gray-600">{channel.id}</p>
                    </div>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(checked) => {
                        const updated = config.notifications.channels.map(c =>
                          c.id === channel.id ? { ...c, enabled: checked } : c
                        );
                        updateConfig({
                          notifications: { ...config.notifications, channels: updated }
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisitorManagementConfig;