import React, { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Star,
  Loader2,
  Volume2,
  Maximize,
  ExternalLink
} from 'lucide-react';

// Atomic Components
interface StatusBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  pulse?: boolean;
}

const StatusBadge = ({ priority, status, pulse = false }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 border-red-500 text-red-300 shadow-red-500/30';
      case 'high':
        return 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-yellow-500/30';
      default:
        return 'bg-green-500/20 border-green-500 text-green-300 shadow-green-500/30';
    }
  };

  return (
    <Badge 
      className={`
        ${getStatusStyles()}
        border shadow-lg font-medium text-xs uppercase tracking-wider
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-200 hover:scale-105
      `}
    >
      {status}
    </Badge>
  );
};

interface ActionButtonProps {
  variant: 'critical' | 'warning' | 'secondary' | 'success';
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const ActionButton = ({ variant, icon, children, onClick, disabled, loading, className = '' }: ActionButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 ring-red-500/50';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 ring-orange-500/50';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 ring-green-500/50';
      default:
        return 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          ${getVariantStyles()}
          h-10 font-semibold transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <span className="mr-2">{icon}</span>
        )}
        {children}
      </Button>
    </motion.div>
  );
};

interface GuardCardProps {
  guard: {
    name: string;
    status: string;
    distance: string;
    available: boolean;
  };
  onAssign?: () => void;
  onContact?: () => void;
}

const GuardCard = ({ guard, onAssign, onContact }: GuardCardProps) => {
  const getStatusColor = () => {
    if (guard.status === 'responding') return 'bg-orange-500';
    if (guard.available) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md border border-gray-700"
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${getStatusColor()} rounded-full ${guard.status === 'responding' ? 'animate-pulse' : ''}`}></div>
        <div>
          <div className="text-sm font-medium text-white">{guard.name}</div>
          <div className="text-xs text-gray-400">{guard.distance}</div>
        </div>
      </div>
      <div className="flex gap-1">
        {guard.available && (
          <Button
            size="sm"
            onClick={onAssign}
            className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
          >
            Assign
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onContact}
          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 h-7 px-2 text-xs"
        >
          <Radio className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
};

// Main Component Interfaces
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

interface ModernActivityDetailProps {
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

export function ModernActivityDetail({ activity, isOpen = true, onClose, onUpdate }: ModernActivityDetailProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [showAdjacentCameras, setShowAdjacentCameras] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedAction, setRecommendedAction] = useState<string | null>(null);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard event handlers
  useEffect(() => {
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

  // Context-aware defaults
  useEffect(() => {
    if (activity && activity.priority === 'critical') {
      setRecommendedAction('dispatch');
      // Auto-expand timeline for high-confidence critical incidents
      if (mockData.confidence >= 90) {
        setShowTimeline(true);
      }
    }
  }, [activity]);

  if (!activity || !isOpen) return null;

  const elapsedTime = formatElapsedTime(activity.time);

  // Enhanced mock data
  const mockData = {
    incidentId: `INC-${activity.type.toUpperCase().replace(/\s+/g, '-')}-${String(activity.id).padStart(3, '0')}`,
    confidence: 95,
    cameraId: 'CAM-042',
    detected: 2,
    expected: 1,
    aiReason: "Motion pattern indicates one person following closely behind badge holder without independent badge scan",
    riskScore: 8.7,
    badgeHolder: {
      name: 'Anderson, P.',
      badgeId: 'BDG-4521',
      department: 'IT Department',
      accessLevel: 'Level 2',
      photo: null,
      lastSeen: '2 min ago',
      clearanceZones: ['Building A', 'Data Center']
    },
    adjacentCameras: ['CAM-041-Exterior', 'CAM-043-Lobby', 'CAM-044-Corridor', 'CAM-045-Elevator', 'CAM-046-Stairwell'],
    guards: [
      { name: 'Garcia, M.', status: 'responding', distance: '45 sec away', available: false, eta: '1 min' },
      { name: 'Chen, L.', status: 'responding', distance: '2 min away', available: false, eta: '2 min' },
      { name: 'Wilson, R.', status: 'available', distance: '0.2mi', available: true, rating: 4.8 },
      { name: 'Thompson, A.', status: 'available', distance: '0.3mi', available: true, rating: 4.6 },
      { name: 'Kim, J.', status: 'break', distance: 'same building', available: false, eta: '5 min' }
    ],
    relatedIncidents: 2,
    weatherImpact: 'none',
    businessImpact: 'medium'
  };

  const getSeverityStyle = () => {
    switch (activity.priority) {
      case 'critical':
        return 'bg-red-900/30 border-red-500/50 shadow-red-500/20';
      case 'high':
        return 'bg-orange-900/30 border-orange-500/50 shadow-orange-500/20';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-500/50 shadow-yellow-500/20';
      default:
        return 'bg-green-900/30 border-green-500/50 shadow-green-500/20';
    }
  };

  const getThreatSummary = () => {
    switch (activity.type) {
      case 'Security Alert':
        return `UNAUTHORIZED ACCESS DETECTED • ${mockData.detected - mockData.expected} PERSON(S) TAILGATING`;
      case 'Medical Emergency':
        return `MEDICAL EMERGENCY IN PROGRESS • PARAMEDICS DISPATCHED`;
      case 'Access Control':
        return `ACCESS SYSTEM ANOMALY • MANUAL VERIFICATION REQUIRED`;
      default:
        return `${activity.type.toUpperCase()} • ${activity.status.toUpperCase()}`;
    }
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // Update activity status based on action
    const statusUpdates = {
      dispatch: { status: 'guards-dispatched', assignedTo: 'Garcia, M.' },
      broadcast: { status: 'bolo-broadcast' },
      lockdown: { status: 'area-lockdown' },
      escalate: { status: 'escalated' }
    };
    
    if (statusUpdates[action as keyof typeof statusUpdates]) {
      onUpdate(activity.id, statusUpdates[action as keyof typeof statusUpdates]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-detail-title"
        >
          {/* Enhanced Dark overlay with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Modern Modal Design */}
          <motion.div 
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[92vh] overflow-hidden border border-gray-700"
            style={{ width: '95vw', maxWidth: '85rem' }}
          >
            {/* Enhanced Header with Contextual Info */}
            <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${activity.priority === 'critical' ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
                    <h1 
                      id="activity-detail-title"
                      className="text-lg font-bold text-white"
                    >
                      {mockData.incidentId}
                    </h1>
                  </div>
                  <StatusBadge priority={activity.priority} status={activity.status} pulse={activity.priority === 'critical'} />
                  <Badge variant="outline" className="bg-blue-500/20 border-blue-500 text-blue-300">
                    Risk Score: {mockData.riskScore}/10
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-700 text-gray-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {elapsedTime}
                  </Badge>
                  <Button 
                    ref={closeButtonRef}
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    aria-label="Close activity details"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Threat Summary with Enhanced Visual Hierarchy */}
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-1">
                  {activity.location} • {mockData.cameraId}
                </div>
                <div className="text-base font-semibold text-white">
                  {getThreatSummary()}
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                  <span>Confidence: <span className="text-green-400 font-medium">{mockData.confidence}%</span></span>
                  <span>Related: <span className="text-blue-400 font-medium">{mockData.relatedIncidents} incidents</span></span>
                  <span>Business Impact: <span className="text-yellow-400 font-medium">{mockData.businessImpact}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Visual Evidence & Context */}
              <div className="w-3/5 border-r border-gray-700 flex flex-col">
                {/* Evidence Viewer */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold">Visual Evidence & AI Analysis</h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-gray-800 border-gray-600 text-gray-300 h-7">
                        <Maximize className="h-3 w-3 mr-1" />
                        Fullscreen
                      </Button>
                      <Button size="sm" variant="outline" className="bg-gray-800 border-gray-600 text-gray-300 h-7">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        New Window
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {/* Main Evidence Display */}
                    <div className="col-span-3">
                      <div className="relative aspect-video bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex flex-col justify-center items-center">
                          <Camera className="h-12 w-12 text-gray-500 mb-2" />
                          <div className="text-center text-sm text-gray-400 px-4">
                            <div className="font-medium mb-2">[LIVE FEED: Tailgating Detection]</div>
                            <div className="text-xs">2 persons detected • 1 badge scan registered</div>
                          </div>
                          <div className="mt-3">
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              <Play className="h-3 w-3 mr-1" />
                              Play Evidence
                            </Button>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                          LIVE
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                          {mockData.cameraId} • {activity.location}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Panel */}
                    <div className="space-y-3">
                      <Card className="bg-gray-800 border-gray-600">
                        <CardContent className="p-3">
                          <div className="text-white font-medium mb-2 text-sm flex items-center gap-1">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            AI Confidence
                          </div>
                          <Progress value={mockData.confidence} className="mb-2" />
                          <div className="text-xs text-gray-300">
                            <div>Detected: <span className="text-red-400 font-medium">{mockData.detected}</span></div>
                            <div>Expected: <span className="text-green-400 font-medium">{mockData.expected}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800 border-gray-600">
                        <CardContent className="p-3">
                          <div className="text-white font-medium mb-2 text-sm flex items-center gap-1">
                            <Activity className="h-3 w-3 text-blue-400" />
                            Risk Analysis
                          </div>
                          <div className="text-xs text-gray-300 italic">
                            "{mockData.aiReason}"
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Contextual Information with Progressive Disclosure */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {/* Badge Holder Information */}
                  <Collapsible open={showBadgeDetails} onOpenChange={setShowBadgeDetails}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-medium">Badge Holder: {mockData.badgeHolder.name}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showBadgeDetails ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Badge ID</div>
                            <div className="text-white font-medium">{mockData.badgeHolder.badgeId}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Department</div>
                            <div className="text-white">{mockData.badgeHolder.department}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Access Level</div>
                            <div className="text-white">{mockData.badgeHolder.accessLevel}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Last Seen</div>
                            <div className="text-white">{mockData.badgeHolder.lastSeen}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-gray-400 text-sm mb-1">Clearance Zones</div>
                          <div className="flex gap-1">
                            {mockData.badgeHolder.clearanceZones.map((zone, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-green-500/20 border-green-500 text-green-300">
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Adjacent Cameras with Smart Suggestions */}
                  <Collapsible open={showAdjacentCameras} onOpenChange={setShowAdjacentCameras}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-green-400" />
                          <span className="text-white font-medium">Adjacent Cameras ({mockData.adjacentCameras.length})</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showAdjacentCameras ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-2 gap-2">
                          {mockData.adjacentCameras.slice(0, 4).map((camera, index) => (
                            <Button 
                              key={index}
                              variant="outline" 
                              size="sm" 
                              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white text-xs justify-start"
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              {camera}
                            </Button>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600 text-xs"
                        >
                          View All ({mockData.adjacentCameras.length}) Cameras
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {/* Right Panel: Actions & Response */}
              <div className="w-2/5 flex flex-col">
                {/* Primary Actions - Enhanced with Context-Aware Recommendations */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">Response Actions</h2>
                    {recommendedAction && (
                      <Badge className="bg-blue-500/20 border-blue-500 text-blue-300 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        AI Recommended
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <ActionButton
                      variant="critical"
                      icon={<Shield className="h-4 w-4" />}
                      onClick={() => handleAction('dispatch')}
                      loading={isLoading}
                      className={`w-full ${recommendedAction === 'dispatch' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''}`}
                    >
                      DISPATCH GUARDS
                      {mockData.guards.filter(g => g.available).length > 0 && (
                        <span className="ml-2 text-xs opacity-75">
                          ({mockData.guards.filter(g => g.available).length} available)
                        </span>
                      )}
                    </ActionButton>
                    
                    <ActionButton
                      variant="warning"
                      icon={<Megaphone className="h-4 w-4" />}
                      onClick={() => handleAction('broadcast')}
                      loading={isLoading}
                      className="w-full"
                    >
                      <div className="flex items-center">
                        BROADCAST BOLO
                        <Volume2 className="h-3 w-3 ml-2" />
                      </div>
                    </ActionButton>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <ActionButton
                        variant="critical"
                        icon={<Lock className="h-4 w-4" />}
                        onClick={() => handleAction('lockdown')}
                        loading={isLoading}
                      >
                        LOCKDOWN
                      </ActionButton>
                      
                      <ActionButton
                        variant="warning"
                        icon={<Phone className="h-4 w-4" />}
                        onClick={() => handleAction('escalate')}
                        loading={isLoading}
                      >
                        ESCALATE
                      </ActionButton>
                    </div>
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="p-4 border-b border-gray-700">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Play className="h-3 w-3 mr-2" />
                      Live Feed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      Playback
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setShowTimeline(!showTimeline)}
                  >
                    <Clock className="h-3 w-3 mr-2" />
                    Timeline Context ±15min
                  </Button>
                </div>

                {/* Enhanced Guard Response */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Guard Response</h3>
                    <Badge variant="outline" className="text-xs">
                      {mockData.guards.filter(g => g.available).length} Available
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Responding Guards */}
                    {mockData.guards.filter(g => !g.available && g.status === 'responding').map((guard, index) => (
                      <GuardCard
                        key={index}
                        guard={guard}
                        onContact={() => console.log('Contact', guard.name)}
                      />
                    ))}
                    
                    {/* Available Guards */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Available Guards
                      </div>
                      {mockData.guards.filter(g => g.available).map((guard, index) => (
                        <GuardCard
                          key={index}
                          guard={guard}
                          onAssign={() => console.log('Assign', guard.name)}
                          onContact={() => console.log('Contact', guard.name)}
                        />
                      ))}
                    </div>
                    
                    {/* On Break Guards */}
                    {mockData.guards.filter(g => !g.available && g.status === 'break').map((guard, index) => (
                      <GuardCard
                        key={index}
                        guard={{ ...guard, status: 'on break' }}
                        onContact={() => console.log('Call back', guard.name)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer with Status Management */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-800 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                  >
                    <FolderPlus className="h-3 w-3 mr-2" />
                    Create Case
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    Add Notes
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <ActionButton
                    variant="success"
                    icon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => handleAction('resolve')}
                    loading={isLoading}
                  >
                    Mark Resolved
                  </ActionButton>
                  
                  <ActionButton
                    variant="secondary"
                    icon={<AlertCircle className="h-4 w-4" />}
                    onClick={() => handleAction('false_alarm')}
                    loading={isLoading}
                  >
                    False Alarm
                  </ActionButton>
                </div>
              </div>
            </div>

            {/* Enhanced Timeline Overlay */}
            <AnimatePresence>
              {showTimeline && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-xl">Timeline Context (±15 minutes)</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowTimeline(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-gray-300 text-center py-12">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg mb-2">Enhanced Timeline View</p>
                      <p className="text-sm text-gray-400">
                        Showing events 15 minutes before and after this incident with AI-powered correlation analysis.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}