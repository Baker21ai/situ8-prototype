/**
 * Incident Integration Actions Component
 * Provides integration actions for incidents (create passdown, etc.)
 */

import React, { useState } from 'react';
import { 
  Button 
} from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { 
  ClipboardList,
  Briefcase,
  ExternalLink,
  ChevronDown,
  Plus,
  Activity
} from 'lucide-react';
import { Incident } from '../../lib/types/incident';
import { IntegrationService } from '../../services/integration.service';
import { usePassdownStore } from '../../stores/passdownStore';
import { toast } from 'sonner';

interface IncidentIntegrationActionsProps {
  incident: Incident;
  onNavigateToModule?: (module: 'passdowns' | 'activities' | 'cases', data?: any) => void;
}

export function IncidentIntegrationActions({ 
  incident, 
  onNavigateToModule 
}: IncidentIntegrationActionsProps) {
  const { createPassdown } = usePassdownStore();
  const [loading, setLoading] = useState(false);

  // Handle creating passdown from incident
  const handleCreatePassdown = async () => {
    setLoading(true);
    try {
      // Generate passdown data from incident
      const passdownData = IntegrationService.createPassdownFromIncident(incident);
      
      // Create the passdown
      const success = await createPassdown(passdownData);
      
      if (success) {
        toast.success('Passdown created successfully from incident');
        // Navigate to passdowns module if callback provided
        onNavigateToModule?.('passdowns', { sourceIncident: incident });
      } else {
        toast.error('Failed to create passdown');
      }
    } catch (error) {
      console.error('Error creating passdown:', error);
      toast.error('An error occurred while creating passdown');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating case from incident (placeholder)
  const handleCreateCase = () => {
    toast.info('Create case functionality will be implemented soon');
    onNavigateToModule?.('cases', { sourceIncident: incident });
  };

  // Determine if incident is suitable for different integrations
  const canCreatePassdown = ['active', 'resolved'].includes(incident.status); // Active or resolved incidents can create passdowns
  const canCreateCase = ['active', 'investigating'].includes(incident.status) && 
                       ['critical', 'high'].includes(incident.severity);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create From Incident
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create Related Items</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {canCreatePassdown && (
          <DropdownMenuItem 
            onClick={handleCreatePassdown}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <div className="flex flex-col">
              <span>Create Follow-up Passdown</span>
              <span className="text-xs text-gray-500">
                Pass incident info to next shift
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        {canCreateCase && (
          <DropdownMenuItem 
            onClick={handleCreateCase}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            <div className="flex flex-col">
              <span>Create Investigation Case</span>
              <span className="text-xs text-gray-500">
                Start formal investigation
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onNavigateToModule?.('activities')}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          View Related Activities
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onNavigateToModule?.('passdowns')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View All Passdowns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}