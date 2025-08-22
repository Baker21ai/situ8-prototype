import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Shield,
  AlertTriangle,
  Activity,
  Users,
  MapPin,
  Clock,
  Mic,
  Send,
  FileText,
  Zap,
  CheckCircle,
  Radio as RadioIcon,
  Command,
  Megaphone,
  Eye,
  Target
} from 'lucide-react';
import { PTTButton } from './PTTButton';
import { RadioChatBridge } from './RadioChatBridge';
import { useRealtimeChatStore } from '../../stores/realtimeChatStore';
import { useActivityStore } from '../../stores/activityStore';
import { Activity as ActivityType } from '../../lib/types/activity';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface CommandDecision {
  id: string;
  timestamp: string;
  command: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'executing' | 'completed';
  assignedTo?: string;
  estimatedCompletion?: string;
}

interface RadioTransmission {
  id: string;
  timestamp: string;
  content: string;
  senderId: string;
  senderName: string;
  channelId: string;
  confidence: number;
  autoCreatedActivity?: string;
  keywords: string[];
  urgencyLevel: 'routine' | 'priority' | 'urgent' | 'emergency';
}

interface IncidentCommandPostProps {
  userId: string;
  userName: string;
  userRole: string;
  clearanceLevel: number;
  className?: string;
}

export function IncidentCommandPost({
  userId,
  userName,
  userRole,
  clearanceLevel,
  className
}: IncidentCommandPostProps) {
  const [activeChannel, setActiveChannel] = useState('emergency');
  const [transmissions, setTransmissions] = useState<RadioTransmission[]>([]);
  const [commandDecisions, setCommandDecisions] = useState<CommandDecision[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(true);
  const [keywordFilters, setKeywordFilters] = useState<string[]>([
    'suspicious', 'backup', 'emergency', 'medical', 'fire', 'evacuation', 
    'lockdown', 'perimeter', 'secure', 'threat', 'incident', 'response'
  ]);

  const { addActivity } = useActivityStore();
  const { sendMessage } = useRealtimeChatStore();

  // Keywords that trigger automatic activity creation
  const ACTIVITY_KEYWORDS = {
    security: ['suspicious', 'threat', 'intrusion', 'unauthorized', 'breach'],
    medical: ['medical', 'injured', 'ambulance', 'first aid', 'unconscious'],
    fire: ['fire', 'smoke', 'evacuation', 'alarm', 'sprinkler'],
    emergency: ['emergency', 'urgent', 'critical', 'immediate', 'help'],
    logistics: ['backup', 'support', 'equipment', 'transport', 'supplies']
  };

  // Simulate incoming radio transmissions
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      // Simulate random transmission
      const mockTransmissions = [
        "Security check, Building A is clear, no suspicious activity observed",
        "Suspicious individual spotted near east entrance, requesting backup",
        "Medical emergency on floor 3, ambulance requested",
        "Fire alarm activated in Zone 7, initiating evacuation procedures",
        "Perimeter secured, all exits monitored and controlled",
        "Requesting additional units for crowd control at main lobby"
      ];

      const mockSenders = [
        { id: 'guard1', name: 'Officer Johnson' },
        { id: 'guard2', name: 'Supervisor Martinez' },
        { id: 'guard3', name: 'Guard Patterson' },
        { id: 'paramedic1', name: 'Medic Rodriguez' }
      ];

      const content = mockTransmissions[Math.floor(Math.random() * mockTransmissions.length)];
      const sender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
      const confidence = 0.85 + Math.random() * 0.15;

      const transmission: RadioTransmission = {
        id: `trans-${Date.now()}`,
        timestamp: new Date().toISOString(),
        content,
        senderId: sender.id,
        senderName: sender.name,
        channelId: activeChannel,
        confidence,
        keywords: extractKeywords(content),
        urgencyLevel: determineUrgency(content)
      };

      // Check if this should auto-create an activity
      if (shouldCreateActivity(transmission)) {
        const activityId = createActivityFromTransmission(transmission);
        transmission.autoCreatedActivity = activityId;
      }

      setTransmissions(prev => [...prev, transmission].slice(-20)); // Keep last 20

    }, 8000 + Math.random() * 12000); // 8-20 seconds

    return () => clearInterval(interval);
  }, [isListening, activeChannel]);

  const extractKeywords = (content: string): string[] => {
    const words = content.toLowerCase().split(/\s+/);
    return keywordFilters.filter(keyword => 
      words.some(word => word.includes(keyword))
    );
  };

  const determineUrgency = (content: string): RadioTransmission['urgencyLevel'] => {
    const urgentWords = ['emergency', 'urgent', 'critical', 'immediate', 'help'];
    const priorityWords = ['suspicious', 'medical', 'fire', 'backup'];
    
    const lowerContent = content.toLowerCase();
    
    if (urgentWords.some(word => lowerContent.includes(word))) return 'emergency';
    if (priorityWords.some(word => lowerContent.includes(word))) return 'urgent';
    if (lowerContent.includes('request') || lowerContent.includes('check')) return 'priority';
    return 'routine';
  };

  const shouldCreateActivity = (transmission: RadioTransmission): boolean => {
    // Create activity for urgent/emergency transmissions or specific keywords
    return transmission.urgencyLevel === 'emergency' || 
           transmission.urgencyLevel === 'urgent' ||
           transmission.keywords.length > 0;
  };

  const createActivityFromTransmission = (transmission: RadioTransmission): string => {
    const activity: Partial<ActivityType> = {
      title: `Radio Report: ${transmission.keywords.join(', ') || 'Security Update'}`,
      description: transmission.content,
      type: transmission.urgencyLevel === 'emergency' ? 'incident' : 'patrol',
      priority: transmission.urgencyLevel === 'emergency' ? 'high' : 
                transmission.urgencyLevel === 'urgent' ? 'medium' : 'low',
      status: 'pending',
      location: 'Radio Communication',
      assignedTo: userId,
      reportedBy: transmission.senderName,
      metadata: {
        radioTransmissionId: transmission.id,
        transcriptionConfidence: transmission.confidence,
        radioChannel: transmission.channelId,
        autoCreated: true,
        sourceType: 'radio'
      }
    };

    const newActivity = addActivity(activity);
    return newActivity.id;
  };

  const issueCommand = async () => {
    if (!commandInput.trim()) return;

    const command: CommandDecision = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      command: commandInput.trim(),
      reasoning: "Incident Commander Decision",
      priority: 'high',
      status: 'pending',
      assignedTo: 'all-units'
    };

    setCommandDecisions(prev => [command, ...prev]);

    // Send as text-to-speech command via radio
    await sendMessage('emergency', `COMMAND: ${commandInput.trim()}`, 'radio');
    
    // Simulate TTS broadcast
    simulateTextToSpeech(commandInput.trim());
    
    setCommandInput('');
  };

  const simulateTextToSpeech = (text: string) => {
    // In real implementation, this would use AWS Polly
    console.log(`Broadcasting command via TTS: "${text}"`);
  };

  const acknowledgeCommand = (commandId: string) => {
    setCommandDecisions(prev => prev.map(cmd =>
      cmd.id === commandId ? { ...cmd, status: 'acknowledged' } : cmd
    ));
  };

  const getUrgencyColor = (urgency: RadioTransmission['urgencyLevel']) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'priority': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCommandStatusColor = (status: CommandDecision['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'executing': return 'text-blue-600';
      case 'acknowledged': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={cn("h-full flex flex-col gap-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Command className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle>Incident Command Post</CardTitle>
                <p className="text-sm text-gray-600">Automated activity creation and command coordination</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Monitoring" : "Paused"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsListening(!isListening)}
              >
                {isListening ? <Eye className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radio Communications Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <RadioIcon className="h-5 w-5" />
              Live Radio Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 px-4">
              <div className="space-y-3">
                {transmissions.map((transmission) => (
                  <div
                    key={transmission.id}
                    className={cn(
                      "p-3 rounded-lg border animate-in slide-in-from-bottom-2",
                      getUrgencyColor(transmission.urgencyLevel)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transmission.senderName}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(transmission.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant={transmission.urgencyLevel === 'emergency' ? 'destructive' : 'secondary'} className="text-xs">
                          {transmission.urgencyLevel}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(transmission.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{transmission.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {transmission.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      {transmission.autoCreatedActivity && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Activity className="h-3 w-3" />
                          Activity created
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Command Center */}
        <div className="space-y-4">
          {/* Command Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Issue Command
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Enter command for all units..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="min-h-20"
              />
              <Button 
                onClick={issueCommand}
                disabled={!commandInput.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Broadcast Command
              </Button>
              <p className="text-xs text-gray-500">
                Commands will be broadcast via text-to-speech to all radio units
              </p>
            </CardContent>
          </Card>

          {/* Recent Commands */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Command Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64 px-4">
                <div className="space-y-2">
                  {commandDecisions.map((command) => (
                    <div key={command.id} className="p-2 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Command</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", getCommandStatusColor(command.status))}>
                            {command.status}
                          </span>
                          {command.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeCommand(command.id)}
                              className="h-6 text-xs"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{command.command}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(command.timestamp), 'HH:mm:ss')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PTT Control */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <PTTButton
              channelId={activeChannel}
              size="lg"
              enableTranscription={true}
              showConfidenceScore={true}
              className="relative"
            />
            <div className="text-center">
              <div className="text-sm text-gray-600">Incident Commander Radio</div>
              <div className="text-xs text-gray-500">
                Direct communication to {activeChannel} channel
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}