import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Radio as RadioIcon,
  Mic,
  MicOff,
  Send,
  Users,
  AlertTriangle,
  MessageSquare,
  Volume2,
  VolumeX,
  Settings,
  Headphones,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { PTTButton } from './PTTButton';
import { useRealtimeChatStore, ChatMessage } from '../../stores/realtimeChatStore';
import { voiceService } from '../../services/voice.service';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface RadioChannel {
  id: string;
  name: string;
  type: 'main' | 'emergency' | 'dispatch' | 'tactical';
  color: string;
  clearanceLevel: number;
  participants: number;
  isActive: boolean;
}

const RADIO_CHANNELS: RadioChannel[] = [
  { id: 'main', name: 'Main Channel', type: 'main', color: 'blue', clearanceLevel: 1, participants: 12, isActive: true },
  { id: 'emergency', name: 'Emergency', type: 'emergency', color: 'red', clearanceLevel: 2, participants: 5, isActive: false },
  { id: 'dispatch', name: 'Dispatch', type: 'dispatch', color: 'orange', clearanceLevel: 3, participants: 8, isActive: true },
  { id: 'tactical', name: 'Tactical Alpha', type: 'tactical', color: 'purple', clearanceLevel: 4, participants: 4, isActive: false }
];

interface RadioChatBridgeProps {
  userId: string;
  userName: string;
  userRole: string;
  clearanceLevel: number;
  currentLocation?: string;
  className?: string;
}

export function RadioChatBridge({
  userId,
  userName,
  userRole,
  clearanceLevel,
  currentLocation = "Patrol Zone A",
  className
}: RadioChatBridgeProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('main');
  const [textMessage, setTextMessage] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number>(0);
  const [voiceLevel, setVoiceLevel] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [lastRadioActivity, setLastRadioActivity] = useState<Date | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptionRef = useRef<string>('');

  const {
    messages,
    sendMessage,
    isConnected: chatConnected,
    initializeWebSocket
  } = useRealtimeChatStore();

  const currentChannel = RADIO_CHANNELS.find(c => c.id === selectedChannel);
  const channelMessages = messages[selectedChannel] || [];
  const availableChannels = RADIO_CHANNELS.filter(c => c.clearanceLevel <= clearanceLevel);

  // Initialize connections
  useEffect(() => {
    initializeWebSocket();
    
    // Set up voice service callbacks
    voiceService.setCallbacks({
      onConnectionStateChanged: (state) => {
        setIsConnected(state === 'connected');
      },
      onSpeakersChanged: setActiveSpeakers,
      onError: (error) => {
        console.error('Voice service error:', error);
      }
    });
  }, [initializeWebSocket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  // Simulate transcription process (in real implementation, this would connect to AWS Transcribe)
  const simulateTranscription = (audioData: string) => {
    setIsTranscribing(true);
    
    // Simulate real-time transcription
    const transcriptionTexts = [
      "Security check, Building A is clear",
      "Suspicious activity reported in Zone 7",
      "Requesting backup at main entrance", 
      "All units, proceed to designated positions",
      "Emergency situation, clear the area immediately"
    ];
    
    const randomText = transcriptionTexts[Math.floor(Math.random() * transcriptionTexts.length)];
    const confidence = 0.85 + Math.random() * 0.15; // 85-100% confidence
    
    // Simulate streaming transcription
    let currentText = '';
    const words = randomText.split(' ');
    
    words.forEach((word, index) => {
      setTimeout(() => {
        currentText += (index > 0 ? ' ' : '') + word;
        transcriptionRef.current = currentText;
        
        if (index === words.length - 1) {
          // Final transcription
          setIsTranscribing(false);
          setTranscriptionConfidence(confidence);
          
          // Send as radio message with transcription
          sendRadioMessage(currentText, confidence);
        }
      }, index * 200); // 200ms per word
    });
  };

  const sendRadioMessage = async (transcribedText: string, confidence: number) => {
    if (!selectedChannel) return;

    const radioMessage: ChatMessage = {
      id: `radio-${Date.now()}`,
      conversationId: selectedChannel,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      content: transcribedText,
      type: 'radio',
      timestamp: new Date().toISOString(),
      status: 'sent',
      metadata: {
        transcriptionConfidence: confidence,
        location: currentLocation,
        radioMessageId: `radio-${Date.now()}`
      }
    };

    // Update last radio activity
    setLastRadioActivity(new Date());
    
    // Send to chat store
    await sendMessage(selectedChannel, transcribedText, 'radio');
  };

  const handleTextMessage = async () => {
    if (!textMessage.trim() || !selectedChannel) return;

    await sendMessage(selectedChannel, textMessage.trim(), 'text');
    setTextMessage('');
    
    // Simulate TTS for radio broadcast (in real implementation, would use AWS Polly)
    simulateTextToSpeech(textMessage.trim());
  };

  const simulateTextToSpeech = (text: string) => {
    // In real implementation, this would convert text to speech and broadcast to radio
    console.log(`Broadcasting to radio: "${text}"`);
  };

  const handlePTTActivation = () => {
    // Simulate audio capture and transcription
    simulateTranscription("audio_data_placeholder");
  };

  const getChannelColor = (type: RadioChannel['type']) => {
    const colors = {
      main: 'bg-blue-100 text-blue-800 border-blue-200',
      emergency: 'bg-red-100 text-red-800 border-red-200',
      dispatch: 'bg-orange-100 text-orange-800 border-orange-200',
      tactical: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type];
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  const renderMessage = (message: ChatMessage) => {
    const isRadio = message.type === 'radio';
    const isOwnMessage = message.senderId === userId;
    
    return (
      <div key={message.id} className={cn(
        "flex mb-3 animate-in slide-in-from-bottom-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "max-w-[80%] rounded-lg p-3 shadow-sm",
          isOwnMessage 
            ? "bg-blue-500 text-white" 
            : isRadio 
              ? "bg-orange-50 border border-orange-200" 
              : "bg-gray-100"
        )}>
          {/* Message header for radio messages */}
          {isRadio && (
            <div className="flex items-center gap-2 mb-2 text-sm">
              <RadioIcon className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">Radio Transmission</span>
              {message.metadata?.transcriptionConfidence && (
                <Badge variant="outline" className="text-xs bg-white">
                  {Math.round(message.metadata.transcriptionConfidence * 100)}% confidence
                </Badge>
              )}
            </div>
          )}
          
          {/* Sender info */}
          {!isOwnMessage && (
            <div className="text-sm font-medium mb-1">
              {message.senderName}
              {message.senderRole && (
                <span className="text-xs opacity-75 ml-2">({message.senderRole})</span>
              )}
            </div>
          )}
          
          {/* Message content */}
          <div className={cn(
            "text-sm",
            isRadio && !isOwnMessage ? "text-gray-800" : ""
          )}>
            {message.content}
          </div>
          
          {/* Message footer */}
          <div className={cn(
            "flex items-center justify-between mt-2 text-xs",
            isOwnMessage ? "text-blue-100" : "text-gray-500"
          )}>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{formatMessageTime(message.timestamp)}</span>
              {message.metadata?.location && (
                <span className="opacity-75">• {message.metadata.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Channel Selector & Status Bar */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Radio Communications</span>
              </div>
              
              {lastRadioActivity && (
                <Badge variant="outline" className="text-xs">
                  Last activity: {format(lastRadioActivity, 'HH:mm')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {activeSpeakers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {activeSpeakers.length} speaking
                </Badge>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Channel Tabs */}
          <div className="flex gap-1 mt-3">
            {availableChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "flex items-center gap-2",
                  selectedChannel === channel.id
                    ? getChannelColor(channel.type)
                    : "hover:bg-gray-100"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  channel.isActive ? "bg-green-500" : "bg-gray-400"
                )} />
                {channel.name}
                <Badge variant="outline" className="text-xs">
                  {channel.participants}
                </Badge>
                {channel.type === 'emergency' && (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {currentChannel?.name || 'Select Channel'}
            </h3>
            {isTranscribing && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Transcribing...
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1">
              {channelMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50">
            {/* PTT Section */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-4">
                <PTTButton
                  channelId={selectedChannel}
                  size="lg"
                  disabled={!isConnected}
                  className="relative"
                  onActivate={handlePTTActivation}
                />
                <div className="text-center">
                  <div className="text-sm text-gray-600">Push to Talk</div>
                  <div className="text-xs text-gray-500">
                    Hold button or press Space
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text Input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type message to broadcast..."
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTextMessage();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleTextMessage}
                disabled={!textMessage.trim() || !isConnected}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 text-center">
              Text messages will be converted to voice and broadcast to radio users
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}