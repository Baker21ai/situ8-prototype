/**
 * Case Integration Actions Component
 * Provides integration actions for cases (create passdown, etc.)
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
  ExternalLink,
  ChevronDown,
  Plus,
  Activity
} from 'lucide-react';
import { Case } from '../../lib/types/case';
import { IntegrationService } from '../../services/integration.service';
import { usePassdownStore } from '../../stores/passdownStore';
import { toast } from 'sonner';

interface CaseIntegrationActionsProps {
  case: Case;
  onNavigateToModule?: (module: 'passdowns' | 'activities' | 'incidents', data?: any) => void;
}

export function CaseIntegrationActions({ 
  case: caseItem, 
  onNavigateToModule 
}: CaseIntegrationActionsProps) {
  const { createPassdown } = usePassdownStore();
  const [loading, setLoading] = useState(false);

  // Handle creating passdown from case
  const handleCreatePassdown = async () => {
    setLoading(true);
    try {
      // Generate passdown data from case
      const passdownData = IntegrationService.createPassdownFromCase(caseItem);
      
      // Create the passdown
      const success = await createPassdown(passdownData);
      
      if (success) {
        toast.success('Passdown created successfully from case');
        // Navigate to passdowns module if callback provided
        onNavigateToModule?.('passdowns', { sourceCase: caseItem });
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

  // Handle creating incident from case (placeholder)
  const handleCreateIncident = () => {
    toast.info('Create incident functionality will be implemented soon');
    onNavigateToModule?.('incidents', { sourceCase: caseItem });
  };

  // Determine if case is suitable for different integrations
  const canCreatePassdown = ['active', 'pending'].includes(caseItem.status); // Active or pending cases can create passdowns
  const canCreateIncident = caseItem.status === 'active' && 
                           ['critical', 'high'].includes(caseItem.priority) &&
                           caseItem.type.includes('security');

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
          Create From Case
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
              <span>Create Monitoring Passdown</span>
              <span className="text-xs text-gray-500">
                Monitor case developments
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
              <span>Create Related Incident</span>
              <span className="text-xs text-gray-500">
                Escalate case to incident
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