import React, { useEffect, useRef, useState } from 'react';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator as _Separator } from './ui/separator';
import { useRealtimeChatStore } from '../stores/realtimeChatStore';
import { RadioTestScenarios } from './communications/RadioTestScenarios';
import { 
  Radio, 
  Mic, 
  ChevronDown,
  TestTube2
} from 'lucide-react';

interface RadioMessage {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  location: string;
  channel: 'main' | 'emergency' | 'telegram';
  type: 'voice' | 'text' | 'ai_response';
  content: string;
  transcriptionConfidence?: number;
  activityId?: string;
  activityType?: string;
  threadId?: string;
  isConverted?: boolean;
  originalType?: string;
  status?: 'pending' | 'processed' | 'converted';
  hasAudio?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface Guard {
  id: string;
  name: string;
  status: 'available' | 'responding' | 'investigating' | 'break' | 'offline';
  location: string;
  lastSeen: string;
  channel: string;
}

interface RadioCommunicationsProps {
  className?: string;
}

// Mock data
const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Medical emergency resolved, patient stable',
    transcriptionConfidence: 0.95,
    activityId: 'ACT-0578',
    activityType: 'medical',
    isConverted: true,
    originalType: 'radio_communication',
    status: 'converted',
    hasAudio: true,
    priority: 'high'
  },
  {
    id: 'msg-002',
    timestamp: '14:34',
    guardId: 'ai-assistant',
    guardName: 'AI Assistant → Garcia',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Acknowledged. Incident marked resolved.',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-003',
    timestamp: '14:32',
    guardId: 'chen-l',
    guardName: 'Chen, L.',
    location: 'Building B',
    channel: 'main',
    type: 'voice',
    content: 'Routine patrol complete, sectors 3-5 clear',
    transcriptionConfidence: 0.92,
    activityId: 'ACT-0577',
    activityType: 'patrol',
    status: 'converted',
    hasAudio: true,
    priority: 'low'
  },
  {
    id: 'msg-004',
    timestamp: '14:30',
    guardId: 'wilson-r',
    guardName: 'Wilson, R.',
    location: 'Parking Lot',
    channel: 'main',
    type: 'voice',
    content: 'Suspicious vehicle, license ABC-123',
    transcriptionConfidence: 0.88,
    activityId: 'ACT-0576',
    activityType: 'security',
    isConverted: true,
    originalType: 'radio_communication',
    status: 'converted',
    hasAudio: true,
    priority: 'high',
    threadId: 'thread-001'
  },
  {
    id: 'msg-005',
    timestamp: '14:31',
    guardId: 'ai-assistant',
    guardName: 'AI',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Running plate check...',
    threadId: 'thread-001',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-006',
    timestamp: '14:32',
    guardId: 'ai-assistant',
    guardName: 'AI',
    location: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'No BOL match. Log details?',
    threadId: 'thread-001',
    status: 'processed',
    priority: 'medium'
  },
  {
    id: 'msg-007',
    timestamp: '14:33',
    guardId: 'wilson-r',
    guardName: 'Wilson',
    location: 'Parking Lot',
    channel: 'main',
    type: 'voice',
    content: 'Logging with photos',
    transcriptionConfidence: 0.96,
    threadId: 'thread-001',
    hasAudio: true,
    priority: 'medium'
  }
];

// Presence UI removed here to keep focus on radio/PTT

// Timeline removed from radio panel

export function RadioCommunications({ className = "" }: RadioCommunicationsProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    messages: storeMessages,
    initializeWebSocket,
    sendMessage
  } = useRealtimeChatStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showTestScenarios, setShowTestScenarios] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => { initializeWebSocket(); }, [initializeWebSocket]);


  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'responding': return 'text-blue-600';
      case 'investigating': return 'text-orange-600';
      case 'break': return 'text-yellow-600';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const _getStatusDot = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'responding': return 'bg-blue-500';
      case 'investigating': return 'bg-orange-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      case 'patrol': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const getThreadMessages = (threadId: string) => {
    return messages.filter(msg => msg.threadId === threadId);
  };

  const _formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getIncidentMessages = () => {
    return messages.filter(msg => 
      msg.priority === 'critical' || 
      msg.priority === 'high' || 
      msg.activityType === 'medical' ||
      msg.activityType === 'security'
    );
  };

  const handleActivitySelect = (activity: ActivityData | EnterpriseActivity | ActivityCluster) => {
    setSelectedActivity(selectedActivity === activity.id ? null : activity.id);
  };

  const getIncidentActivities = () => {
    return activities.filter(activity => 
      activity.priority === 'critical' || 
      activity.priority === 'high' ||
      activity.type === 'MEDICAL' ||
      activity.type === 'ARMED_PERSON' ||
      activity.type === 'FIRE'
    );
  };

  const getTimelineActivities = () => {
    return getActivitiesByTime(activities).slice(0, 8); // Show recent 8 activities
  };

  const renderMessage = (message: RadioMessage, isThreadMessage = false) => {
    const isAI = message.type === 'ai_response';
    const threadMessages = message.threadId ? getThreadMessages(message.threadId) : [];
    const hasThread = threadMessages.length > 1 && !isThreadMessage;
    const isThreadExpanded = message.threadId ? expandedThreads.has(message.threadId) : false;

    return (
      <div key={message.id} className={`space-y-2 ${isThreadMessage ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
        <div className={`p-3 rounded-lg border-l-4 ${getPriorityColor(message.priority)}`}>
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{message.timestamp}</span>
              <span className="font-semibold">{message.guardName}</span>
              {!isAI && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{message.location}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {message.hasAudio && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => playAudio(message.id)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              {message.transcriptionConfidence && (
                <Badge variant="secondary" className="text-xs px-1">
                  {Math.round(message.transcriptionConfidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
          
          {/* Message Content */}
          <div className="mb-2">
            <p className="text-sm italic">"{message.content}"</p>
          </div>
          
          {/* Activity Conversion Display */}
          {message.isConverted && message.activityId && (
            <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
              <span className="text-blue-600">→</span>
              <span className="text-blue-700">Converted to</span>
              <Badge className={getActivityTypeColor(message.activityType)}>
                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)} Activity
              </Badge>
              <span className="text-blue-600">({message.activityId})</span>
            </div>
          )}

          {/* Auto-logging display */}
          {message.activityId && !message.isConverted && (
            <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
              <span className="text-gray-600">→</span>
              <span className="text-gray-700">Auto-logged as</span>
              <Badge className={getActivityTypeColor(message.activityType)}>
                {message.activityType?.charAt(0).toUpperCase()}{message.activityType?.slice(1)} Activity
              </Badge>
            </div>
          )}

          {/* AI Response Styling */}
          {isAI && (
            <div className="flex items-center gap-2 text-xs">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 font-medium">AI Assistant Response</span>
            </div>
          )}
          
          {/* Thread Controls */}
          {hasThread && (
            <div className="mt-2 pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleThread(message.threadId!)}
                className="text-xs h-6 px-2 text-blue-600"
              >
                [View Thread ↓]
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isThreadExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </div>
        
        {/* Expanded Thread Messages */}
        {hasThread && isThreadExpanded && (
          <div className="space-y-2 ml-4">
            {threadMessages.slice(1).map(threadMsg => (
              <div key={threadMsg.id} className="border-l-2 border-gray-200 pl-3">
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{threadMsg.timestamp}</span>
                    <span className="text-xs font-semibold">{threadMsg.guardName}:</span>
                  </div>
                  <p className="text-xs italic">"{threadMsg.content}"</p>
                  {threadMsg.type === 'ai_response' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Activity className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">AI Response</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const messages = (storeMessages[activeConversationId || 'main'] || []).filter(m => m.type === 'voice' || m.type === 'radio');

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Radio</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" /> Live
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestScenarios(!showTestScenarios)}
            className="h-7 px-2 text-xs"
          >
            <TestTube2 className="h-3 w-3 mr-1" />
            {showTestScenarios ? 'Live Radio' : 'Test Scenarios'}
          </Button>
          <button className="inline-flex items-center gap-1 px-2 py-1 border rounded">
            #{conversations.find(c => c.id === (activeConversationId || 'main'))?.name || 'main'}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {showTestScenarios ? (
          <RadioTestScenarios />
        ) : (
          <ScrollArea className="h-full p-3">
            <div className="space-y-3">
              {messages.map((m: any) => (
                <div key={m.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      <span className="font-semibold">{m.senderName}</span>
                    </div>
                    {m.attachments?.[0]?.duration && (
                      <Badge variant="outline" className="text-xs">{Math.round(m.attachments[0].duration)}s</Badge>
                    )}
                  </div>
                  {m.type === 'voice' && m.attachments?.[0]?.url ? (
                    <audio controls className="w-full">
                      <source src={m.attachments[0].url} type="audio/webm" />
                    </audio>
                  ) : (
                    <p className="text-sm italic">"{m.content}"</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Tip: Hold V/Space or press and hold mic to talk</div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-10 w-10 p-0 ${isRecording ? 'text-red-600' : ''}`}
              onMouseDown={async () => {
                // @ts-ignore
                await (startRecording as any)();
              }}
              onMouseUp={async () => { await (stopRecording as any)(); }}
              onMouseLeave={async () => { if (isRecording) await (stopRecording as any)(); }}
              onTouchStart={async () => { await (startRecording as any)(); }}
              onTouchEnd={async () => { await (stopRecording as any)(); }}
              title="Hold to talk (V or Space)"
            >
              <Mic className="h-5 w-5" />
            </Button>
            {isRecording && (
              <Badge variant="outline" className="text-xs">REC {recordingDuration}s</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}