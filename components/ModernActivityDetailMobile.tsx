import React, { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Shield,
  AlertTriangle,
  Camera,
  Users,
  Clock,
  Star,
  Phone,
  Radio,
  Lock,
  Megaphone,
  Eye,
  Play,
  CheckCircle,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  ActionButton, 
  StatusLabel, 
  GuardResponseCard, 
  EvidenceViewer, 
  ProgressIndicator 
} from './ModernActivityDetailAtoms';

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

interface ModernActivityDetailMobileProps {
  activity: Activity | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (activityId: number, updates: Partial<Activity>) => void;
}

const formatElapsedTime = (startTime: Date) => {
  const diff = Date.now() - startTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

export function ModernActivityDetailMobile({ activity, isOpen = true, onClose, onUpdate }: ModernActivityDetailMobileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard handlers
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

  if (!activity || !isOpen) return null;

  const elapsedTime = formatElapsedTime(activity.time);

  const mockData = {
    incidentId: `INC-${activity.type.toUpperCase().replace(/\s+/g, '-')}-${String(activity.id).padStart(3, '0')}`,
    confidence: 95,
    cameraId: 'CAM-042',
    detected: 2,
    expected: 1,
    riskScore: 8.7,
    guards: [
      { name: 'Garcia, M.', status: 'responding', distance: '45 sec', available: false },
      { name: 'Chen, L.', status: 'responding', distance: '2 min', available: false },
      { name: 'Wilson, R.', status: 'available', distance: '0.2mi', available: true },
      { name: 'Thompson, A.', status: 'available', distance: '0.3mi', available: true }
    ]
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    const statusUpdates = {
      dispatch: { status: 'guards-dispatched' },
      broadcast: { status: 'bolo-broadcast' },
      lockdown: { status: 'area-lockdown' },
      escalate: { status: 'escalated' }
    };
    
    if (statusUpdates[action as keyof typeof statusUpdates]) {
      onUpdate(activity.id, statusUpdates[action as keyof typeof statusUpdates]);
    }
  };

  const StatusComponent = activity.priority === 'critical' ? StatusLabel.Critical : 
                        activity.priority === 'high' ? StatusLabel.High :
                        activity.priority === 'medium' ? StatusLabel.Medium : StatusLabel.Low;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Mobile Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80"
            onClick={onClose}
          />
          
          {/* Mobile Bottom Sheet Style Modal */}
          <motion.div 
            ref={dialogRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl shadow-2xl max-h-[95vh] overflow-hidden border-t border-gray-700"
          >
            {/* Mobile Header */}
            <div className="flex-shrink-0 px-4 py-4 bg-gray-800 border-b border-gray-700">
              {/* Handle Bar */}
              <div 
                className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4 cursor-pointer"
                onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`h-4 w-4 ${activity.priority === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                    <StatusComponent pulse={activity.priority === 'critical'}>
                      {activity.status}
                    </StatusComponent>
                  </div>
                  <h1 className="text-base font-bold text-white truncate">
                    {mockData.incidentId}
                  </h1>
                  <p className="text-sm text-gray-400 truncate">
                    {activity.location} • {elapsedTime}
                  </p>
                </div>
                
                <Button 
                  ref={closeButtonRef}
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose} 
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Content with Tabs */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-b border-gray-700 rounded-none">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
                  <TabsTrigger value="guards" className="text-xs">Guards</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="overview" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {/* Threat Summary */}
                        <Card className="bg-red-900/20 border-red-500/30">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-semibold text-white mb-1">
                                  UNAUTHORIZED ACCESS DETECTED
                                </div>
                                <div className="text-xs text-gray-300">
                                  {mockData.detected - mockData.expected} person(s) tailgating detected
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Evidence Preview */}
                        <div>
                          <h3 className="text-white font-medium mb-3 text-sm">Visual Evidence</h3>
                          <EvidenceViewer 
                            cameraId={mockData.cameraId}
                            location={activity.location}
                            isLive={true}
                            compact={true}
                            onPlay={() => console.log('Play evidence')}
                          />
                        </div>

                        {/* AI Analysis */}
                        <Card className="bg-gray-800 border-gray-600">
                          <CardContent className="p-3">
                            <h4 className="text-white font-medium mb-2 text-sm">AI Analysis</h4>
                            <ProgressIndicator.Confidence value={mockData.confidence} />
                            <div className="mt-3 text-xs text-gray-300 space-y-1">
                              <div>Detected: <span className="text-red-400 font-medium">{mockData.detected}</span></div>
                              <div>Expected: <span className="text-green-400 font-medium">{mockData.expected}</span></div>
                              <div>Risk Score: <span className="text-yellow-400 font-medium">{mockData.riskScore}/10</span></div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Badge Holder */}
                        <Card className="bg-gray-800 border-gray-600">
                          <CardContent className="p-3">
                            <h4 className="text-white font-medium mb-2 text-sm flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Badge Holder
                            </h4>
                            <div className="text-sm">
                              <div className="text-white font-medium">Anderson, P. (BDG-4521)</div>
                              <div className="text-xs text-gray-400">IT Department • Level 2</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {/* Primary Actions */}
                        <div>
                          <h3 className="text-white font-medium mb-3 text-sm flex items-center gap-2">
                            Response Actions
                            <Badge className="bg-blue-500/20 border-blue-500 text-blue-300 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              AI Rec.
                            </Badge>
                          </h3>
                          <div className="space-y-3">
                            <ActionButton.Critical
                              icon={<Shield className="h-4 w-4" />}
                              onClick={() => handleAction('dispatch')}
                              loading={isLoading}
                              className="w-full h-12 text-sm"
                            >
                              DISPATCH GUARDS
                            </ActionButton.Critical>
                            
                            <ActionButton.Warning
                              icon={<Megaphone className="h-4 w-4" />}
                              onClick={() => handleAction('broadcast')}
                              loading={isLoading}
                              className="w-full h-12 text-sm"
                            >
                              BROADCAST BOLO
                            </ActionButton.Warning>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <ActionButton.Critical
                                icon={<Lock className="h-4 w-4" />}
                                onClick={() => handleAction('lockdown')}
                                loading={isLoading}
                                className="h-12 text-sm"
                              >
                                LOCKDOWN
                              </ActionButton.Critical>
                              
                              <ActionButton.Warning
                                icon={<Phone className="h-4 w-4" />}
                                onClick={() => handleAction('escalate')}
                                loading={isLoading}
                                className="h-12 text-sm"
                              >
                                ESCALATE
                              </ActionButton.Warning>
                            </div>
                          </div>
                        </div>

                        {/* Secondary Actions */}
                        <div>
                          <h3 className="text-white font-medium mb-3 text-sm">Camera Controls</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <ActionButton.Secondary
                              icon={<Play className="h-4 w-4" />}
                              onClick={() => console.log('Live feed')}
                              className="h-10 text-sm"
                            >
                              Live Feed
                            </ActionButton.Secondary>
                            
                            <ActionButton.Secondary
                              icon={<Eye className="h-4 w-4" />}
                              onClick={() => console.log('Playback')}
                              className="h-10 text-sm"
                            >
                              Playback
                            </ActionButton.Secondary>
                          </div>
                        </div>

                        {/* Case Management */}
                        <div>
                          <h3 className="text-white font-medium mb-3 text-sm">Case Management</h3>
                          <div className="space-y-2">
                            <ActionButton.Secondary
                              icon={<FileText className="h-4 w-4" />}
                              onClick={() => console.log('Add notes')}
                              className="w-full h-10 text-sm"
                            >
                              Add Notes
                            </ActionButton.Secondary>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <ActionButton.Success
                                icon={<CheckCircle className="h-4 w-4" />}
                                onClick={() => handleAction('resolve')}
                                loading={isLoading}
                                className="h-10 text-sm"
                              >
                                Resolve
                              </ActionButton.Success>
                              
                              <ActionButton.Secondary
                                icon={<X className="h-4 w-4" />}
                                onClick={() => handleAction('false_alarm')}
                                loading={isLoading}
                                className="h-10 text-sm"
                              >
                                False Alarm
                              </ActionButton.Secondary>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="guards" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium text-sm">Guard Response</h3>
                          <Badge variant="outline" className="text-xs">
                            {mockData.guards.filter(g => g.available).length} Available
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Responding Guards */}
                          <div>
                            <div className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              Responding
                            </div>
                            {mockData.guards.filter(g => !g.available && g.status === 'responding').map((guard, index) => (
                              <GuardResponseCard
                                key={index}
                                guard={guard}
                                onContact={() => console.log('Contact', guard.name)}
                                compact={true}
                              />
                            ))}
                          </div>
                          
                          {/* Available Guards */}
                          <div>
                            <div className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Available
                            </div>
                            {mockData.guards.filter(g => g.available).map((guard, index) => (
                              <GuardResponseCard
                                key={index}
                                guard={guard}
                                onAssign={() => console.log('Assign', guard.name)}
                                onContact={() => console.log('Contact', guard.name)}
                                compact={true}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}