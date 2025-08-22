import React, { useMemo, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { EnterpriseActivity } from '../../../lib/types/activity';
import { useActivityStore } from '../../../stores/activityStore';
import { getPriorityColor, getStatusColor } from '../../../lib/utils/status';

export interface ApprovalsPanelProps {
  className?: string;
  isVisible?: boolean;
}

export const ApprovalsPanel: React.FC<ApprovalsPanelProps> = ({ className = '', isVisible = true }) => {
  const { filteredActivities, updateActivityStatus } = useActivityStore();

  const pendingApprovals = useMemo(() => {
    const items = filteredActivities as EnterpriseActivity[];
    return items
      .filter((a) => (a.source === 'AMBIENT' || a.requires_approval) && (a.status === 'active' || a.status === 'detecting'))
      .slice(0, 20);
  }, [filteredActivities]);

  const handleApprove = useCallback(async (activity: EnterpriseActivity) => {
    try {
      await updateActivityStatus(activity.id, 'assigned', {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'officer',
        action: 'APPROVE_ACTIVITY'
      }, 'Approved pending actions');
      console.log(`Approved activity ${activity.id}`);
    } catch (e) {
      console.error('Approve failed', e);
    }
  }, [updateActivityStatus]);

  const handleReject = useCallback(async (activity: EnterpriseActivity) => {
    try {
      await updateActivityStatus(activity.id, 'resolved', {
        userId: 'current-user',
        userName: 'Current User',
        userRole: 'officer',
        action: 'REJECT_ACTIVITY'
      }, 'Rejected pending actions');
      console.log(`Rejected activity ${activity.id}`);
    } catch (e) {
      console.error('Reject failed', e);
    }
  }, [updateActivityStatus]);

  if (!isVisible) return null;

  return (
    <Card className={`h-full w-full ${className}`}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Pending Approvals</Badge>
          <Badge variant="outline" className="text-xs">{pendingApprovals.length}</Badge>
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-44px)]">
        <div className="p-3 space-y-2">
          {pendingApprovals.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending approvals.</div>
          )}
          {pendingApprovals.map((a) => {
            const p = getPriorityColor(a.priority);
            const s = getStatusColor(a.status);
            return (
              <div key={a.id} className={`flex items-center gap-3 p-2 rounded border ${p.border} ${p.background}`}>
                {/* Thumbnail */}
                <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {a.thumbnailUrl ? (
                    <img src={a.thumbnailUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>
                  )}
                </div>
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm truncate">{a.title}</div>
                    <Badge variant="outline" className={`text-xs ${s.text}`}>{a.status}</Badge>
                    <Badge className={`text-xs ${p.text} ${p.background} ${p.border}`}>{a.priority}</Badge>
                    {a.source && (
                      <Badge variant="secondary" className="text-xs">{a.source}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{a.location}</div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default" onClick={() => handleApprove(a)} className="h-7 px-3">Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(a)} className="h-7 px-3">Reject</Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ApprovalsPanel;
