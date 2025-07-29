import React, { useState, useEffect } from 'react';
import { ModernActivityDetail } from './ModernActivityDetail';
import { ModernActivityDetailMobile } from './ModernActivityDetailMobile';

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  location: string;
  time: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  assignedTo: string;
  evidence: string[];
  tags: string[];
}

interface ResponsiveActivityDetailProps {
  activity: Activity | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (activityId: number, updates: Partial<Activity>) => void;
}

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkIsMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

export function ResponsiveActivityDetail({ 
  activity, 
  isOpen = true, 
  onClose, 
  onUpdate 
}: ResponsiveActivityDetailProps) {
  const isMobile = useIsMobile();

  // Return the appropriate component based on screen size
  if (isMobile) {
    return (
      <ModernActivityDetailMobile
        activity={activity}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <ModernActivityDetail
      activity={activity}
      isOpen={isOpen}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
}

// Export individual components for direct use if needed
export { ModernActivityDetail, ModernActivityDetailMobile };