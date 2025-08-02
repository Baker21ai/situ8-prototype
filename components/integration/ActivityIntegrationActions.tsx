/**
 * Activity Integration Actions Component
 * Provides integration actions for activities (create passdown, etc.)
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
  AlertTriangle,
  Briefcase,
  ExternalLink,
  ChevronDown,
  Plus
} from 'lucide-react';
import { EnterpriseActivity } from '../../lib/types/activity';
import { IntegrationService } from '../../services/integration.service';
import { usePassdownStore } from '../../stores/passdownStore';
import { toast } from 'sonner';

interface ActivityIntegrationActionsProps {
  activity: EnterpriseActivity;
  onNavigateToModule?: (module: 'passdowns' | 'incidents' | 'cases', data?: any) => void;
}

export function ActivityIntegrationActions({ 
  activity, 
  onNavigateToModule 
}: ActivityIntegrationActionsProps) {
  const { createPassdown } = usePassdownStore();
  const [loading, setLoading] = useState(false);

  // Handle creating passdown from activity
  const handleCreatePassdown = async () => {
    setLoading(true);
    try {
      // Generate passdown data from activity
      const passdownData = IntegrationService.createPassdownFromActivity(activity);
      
      // Create the passdown
      const success = await createPassdown(passdownData);
      
      if (success) {
        toast.success('Passdown created successfully from activity');
        // Navigate to passdowns module if callback provided
        onNavigateToModule?.('passdowns', { sourceActivity: activity });
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

  // Handle creating incident from activity (placeholder)
  const handleCreateIncident = () => {
    toast.info('Create incident functionality will be implemented soon');
    onNavigateToModule?.('incidents', { sourceActivity: activity });
  };

  // Handle creating case from activity (placeholder)
  const handleCreateCase = () => {
    toast.info('Create case functionality will be implemented soon');
    onNavigateToModule?.('cases', { sourceActivity: activity });
  };

  // Determine if activity is suitable for different integrations
  const canCreatePassdown = true; // All activities can create passdowns
  const canCreateIncident = ['security-breach', 'medical', 'safety-hazard', 'emergency'].includes(activity.type);
  const canCreateCase = ['security-breach', 'theft', 'vandalism', 'investigation'].includes(activity.type);

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
          Create From Activity
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
              <span>Create Passdown</span>
              <span className="text-xs text-gray-500">
                Pass information to next shift
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        {canCreateIncident && (
          <DropdownMenuItem 
            onClick={handleCreateIncident}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <div className="flex flex-col">
              <span>Create Incident</span>
              <span className="text-xs text-gray-500">
                Escalate to incident response
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
              <span>Create Case</span>
              <span className="text-xs text-gray-500">
                Start investigation case
              </span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
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