import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  AlertTriangle, 
  FileText, 
  Camera, 
  MessageSquare,
  Phone,
  Radio,
  Target,
  Bell,
  Users,
  Navigation,
  X,
  Play,
  Lock,
  Megaphone,
  Shield,
  Eye,
  Clock,
  MapPin,
  FolderPlus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
  notes?: Array<{
    id: number;
    text: string;
    author: string;
    timestamp: Date;
  }>;
  statusHistory?: Array<{
    id: number;
    status: string;
    timestamp: Date;
    author: string;
    note?: string;
  }>;
}

interface ActivityDetailProps {
  activity: Activity | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (activityId: number, updates: Partial<Activity>) => void;
}

const formatTimeAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const formatElapsedTime = (startTime: Date) => {
  const diff = Date.now() - startTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export function ActivityDetail({ activity, isOpen = true, onClose, onUpdate }: ActivityDetailProps) {
  const [showTimeline, setShowTimeline] = useState(false);

  // Focus management for accessibility
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard event handlers for accessibility
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!activity || !isOpen) return null;

  const elapsedTime = formatElapsedTime(activity.time);

  // Mock data for the demonstration
  const mockData = {
    incidentId: `INC-${activity.type.toUpperCase().replace(/\s+/g, '-')}-${String(activity.id).padStart(3, '0')}`,
    confidence: 95,
    cameraId: 'CAM-042',
    detected: 2,
    expected: 1,
    aiReason: "Motion pattern indicates one person following closely behind badge holder without independent badge scan",
    badgeHolder: {
      name: 'Anderson, P.',
      badgeId: 'BDG-4521',
      department: 'IT Department',
      accessLevel: 'Level 2'
    },
    adjacentCameras: ['CAM-041-Exterior', 'CAM-043-Lobby', 'CAM-044-Corridor'],
    guards: [
      { name: 'Garcia', status: 'responding', distance: '1 min away', available: false },
      { name: 'Chen', status: 'responding', distance: '2 min', available: false },
      { name: 'Wilson, R.', status: 'available', distance: '0.2mi', available: true },
      { name: 'Thompson, A.', status: 'available', distance: '0.3mi', available: true },
      { name: 'Kim, J.', status: 'break', distance: 'same building', available: false }
    ]
  };

  const getSeverityStyle = () => {
    switch (activity.priority) {
      case 'critical':
        return 'bg-red-900/20 border-red-800/30';
      case 'high':
        return 'bg-orange-900/20 border-orange-800/30';
      default:
        return 'bg-yellow-900/20 border-yellow-800/30';
    }
  };

  const getThreatSummary = () => {
    switch (activity.type) {
      case 'Security Alert':
        return `1 UNAUTHORIZED PERSON entered via tailgating • BOLO ACTIVE`;
      case 'Medical Emergency':
        return `MEDICAL EMERGENCY in progress • PARAMEDICS EN ROUTE`;
      case 'Access Control':
        return `ACCESS SYSTEM MALFUNCTION • MANUAL VERIFICATION ACTIVE`;
      default:
        return `${activity.type.toUpperCase()} • ${activity.status.toUpperCase()}`;
    }
  };



  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-detail-title"
      aria-describedby="activity-detail-description"
    >
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/70 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content - Dark theme - Compact */}
      <div 
        ref={dialogRef}
        className="relative bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl mx-2 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ width: '92vw', maxWidth: '80rem' }}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header Bar - Compact */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 
                id="activity-detail-title"
                className="text-base font-bold text-white truncate"
              >
                {mockData.incidentId} • {activity.title.toUpperCase()} • {activity.location}
              </h1>
              <Button 
                ref={closeButtonRef}
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700 flex-shrink-0"
                aria-label="Close activity details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Threat Summary Section - Compact */}
          <div className={`px-4 py-2 border-b border-gray-700 ${getSeverityStyle()}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {getThreatSummary()}
                </div>
                <div className="text-gray-300 text-xs">
                  Confidence: {mockData.confidence}% • {mockData.cameraId} • {elapsedTime}
                </div>
              </div>
            </div>
          </div>
          
          {/* Two-Column Content Area - Compact */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column (60% width): Visual Evidence & AI Analysis - Compact */}
            <div className="w-3/5 border-r border-gray-700 p-3 overflow-y-auto">
              <h2 className="text-white font-semibold mb-3 text-base">Visual Evidence & AI Analysis</h2>
              
              <div className="grid grid-cols-3 gap-3">
                {/* GIF/Image Container - Compact */}
                <div className="col-span-2">
                  <div className="aspect-video bg-gray-800 border border-gray-600 rounded flex flex-col justify-center items-center">
                    <Camera className="h-8 w-8 text-gray-500 mb-1" />
                    <div className="text-center text-xs text-gray-400 px-2">
                      <div className="font-medium mb-1">[GIF: Shows 2 people</div>
                      <div>entering, but only</div>
                      <div>1 badge scan visible]</div>
                    </div>
                  </div>
                </div>

                {/* Detection Summary - Compact */}
                <div className="space-y-2">
                  <div className="bg-gray-800 border border-gray-600 rounded p-2">
                    <div className="text-white font-medium mb-1 text-sm">Detection Summary</div>
                    <div className="space-y-1 text-xs">
                      <div className="text-gray-300">
                        <span className="text-gray-400">Detected:</span> <span className="text-red-400 font-medium">{mockData.detected}</span>
                      </div>
                      <div className="text-gray-300">
                        <span className="text-gray-400">Expected:</span> <span className="text-green-400 font-medium">{mockData.expected}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 border border-gray-600 rounded p-2">
                    <div className="text-white font-medium mb-1 text-sm">AI Reason</div>
                    <div className="text-xs text-gray-300 italic">
                      "{mockData.aiReason}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge Holder Section - Compact */}
              <div className="mt-3 bg-gray-800 border border-gray-600 rounded p-2">
                <div className="text-white font-medium mb-1 text-sm">Badge Holder:</div>
                <div className="text-gray-300">
                  <div className="text-sm font-medium">{mockData.badgeHolder.name} ({mockData.badgeHolder.badgeId})</div>
                  <div className="text-xs text-gray-400">{mockData.badgeHolder.department} • {mockData.badgeHolder.accessLevel}</div>
                </div>
              </div>

              {/* Adjacent Cameras - Compact */}
              <div className="mt-3">
                <div className="text-white font-medium mb-2 text-sm">Adjacent Cameras:</div>
                <div className="flex flex-wrap gap-1">
                  {mockData.adjacentCameras.map((camera, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm" 
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-6 px-2 text-xs"
                    >
                      {camera}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 h-6 px-2 text-xs"
                  >
                    more...
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column (40% width): Primary Actions - Compact */}
            <div className="w-2/5 p-3 overflow-y-auto">
              <h2 className="text-white font-semibold mb-3 text-base">Primary Actions</h2>
              
              {/* Critical Action Buttons - Compact */}
              <div className="space-y-2 mb-4">
                <Button 
                  className="w-full h-8 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
                  size="sm"
                >
                  <Shield className="h-3 w-3 mr-2" />
                  DISPATCH GUARDS
                </Button>
                
                <Button 
                  className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm"
                  size="sm"
                >
                  <Megaphone className="h-3 w-3 mr-2" />
                  BROADCAST BOLO
                </Button>
                
                <Button 
                  className="w-full h-8 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm"
                  size="sm"
                >
                  <Lock className="h-3 w-3 mr-2" />
                  LOCKDOWN AREA
                </Button>
                
                <Button 
                  className="w-full h-8 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-sm"
                  size="sm"
                >
                  <Phone className="h-3 w-3 mr-2" />
                  ESCALATE
                </Button>
              </div>

              <Separator className="bg-gray-600 mb-4" />

              {/* Secondary Action Buttons - Compact */}
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Live Feed
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Playback
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  View in Ambient
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 text-xs"
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Timeline ±15min
                </Button>
              </div>

              {/* Guard Response Section - Compact */}
              <div className="bg-gray-800 border border-gray-600 rounded p-2">
                <h3 className="text-white font-medium mb-2 text-sm">Guard Response</h3>
                
                <div className="space-y-2 text-xs">
                  {/* Responding Guards */}
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">
                      <span className="font-medium">Responding:</span> Garcia (1 min away) • Chen (2 min)
                    </span>
                  </div>
                  
                  {/* Available Guards */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">
                        <span className="font-medium">Available:</span>
                      </span>
                    </div>
                    {mockData.guards.filter(g => g.available).map((guard, index) => (
                      <div key={index} className="ml-3 flex items-center justify-between text-gray-300">
                        <span className="text-xs">{guard.name} ({guard.distance})</span>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white h-5 px-1 text-xs"
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* On Break Guards */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-300">
                        <span className="font-medium">On Break:</span> Kim, J. (same building)
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white h-5 px-1 text-xs"
                    >
                      Call Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions Bar - Compact */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-800 border-t border-gray-700">
            <div className="flex justify-between items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white h-7 text-xs"
              >
                <FolderPlus className="h-3 w-3 mr-1" />
                Create Case
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white h-7 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Add to Case
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white h-7 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Add Notes
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="bg-green-700 border-green-600 text-green-100 hover:bg-green-600 hover:text-white h-7 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Resolved
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="bg-yellow-700 border-yellow-600 text-yellow-100 hover:bg-yellow-600 hover:text-white h-7 text-xs"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                False Alarm
              </Button>
            </div>
          </div>

          {/* Timeline Context Overlay (when shown) - Compact */}
          {showTimeline && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-3xl w-full mx-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-base">Timeline Context (±15 minutes)</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTimeline(false)}
                    className="text-gray-400 hover:text-white h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-gray-300 text-center py-4 text-sm">
                  Timeline view showing events 15 minutes before and after this incident would be displayed here.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}