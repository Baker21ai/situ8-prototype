import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Users, Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { voiceService, VoiceSessionConfig, VoiceDevice } from '../../services/voice.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PTTButton } from './PTTButton';

interface VoiceChannel {
  id: string;
  name: string;
  type: 'main' | 'emergency' | 'dispatch' | 'private';
  requiredClearance?: number;
}

const VOICE_CHANNELS: VoiceChannel[] = [
  { id: 'main', name: 'Main Channel', type: 'main' },
  { id: 'emergency', name: 'Emergency', type: 'emergency', requiredClearance: 2 },
  { id: 'dispatch', name: 'Dispatch', type: 'dispatch', requiredClearance: 3 },
];

interface VoiceChannelManagerProps {
  userId: string;
  userName: string;
  userClearance?: number;
  token: string;
  className?: string;
}

export function VoiceChannelManager({
  userId,
  userName,
  userClearance = 1,
  token,
  className
}: VoiceChannelManagerProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('main');
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [audioDevices, setAudioDevices] = useState<VoiceDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { sendMessage, subscribe } = useWebSocket({ token });

  useEffect(() => {
    // Set up voice service callbacks
    voiceService.setCallbacks({
      onSpeakersChanged: setActiveSpeakers,
      onConnectionStateChanged: setConnectionState,
      onAudioDevicesChanged: setAudioDevices,
      onError: (err) => setError(err.message),
    });

    // Load audio devices
    loadAudioDevices();

    // Subscribe to PTT state updates from other users
    const unsubscribe = subscribe('pttStateUpdate', (data) => {
      if (data.isSpeaking) {
        setActiveSpeakers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setActiveSpeakers(prev => prev.filter(id => id !== data.userId));
      }
    });

    return () => {
      unsubscribe();
      handleDisconnect();
    };
  }, [subscribe]);

  const loadAudioDevices = async () => {
    const devices = await voiceService.getAudioDevices();
    setAudioDevices(devices);
    
    // Auto-select first devices
    const firstInput = devices.find(d => d.kind === 'audioinput');
    const firstOutput = devices.find(d => d.kind === 'audiooutput');
    
    if (firstInput) setSelectedInput(firstInput.deviceId);
    if (firstOutput) setSelectedOutput(firstOutput.deviceId);
  };

  const handleConnect = async () => {
    try {
      setError(null);
      setConnectionState('connecting');

      // First join the WebSocket channel
      sendMessage({
        action: 'joinChannel',
        channelId: selectedChannel
      });

      // Create or get meeting
      const meetingResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev'}/createMeeting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            channelId: selectedChannel,
            channelType: 'voice'
          })
        }
      );

      if (!meetingResponse.ok) {
        throw new Error('Failed to create meeting');
      }

      const { meeting } = await meetingResponse.json();

      // Create attendee
      const attendeeResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev'}/createAttendee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            meetingId: meeting.meetingId,
            userId,
            userName,
            clearanceLevel: userClearance
          })
        }
      );

      if (!attendeeResponse.ok) {
        throw new Error('Failed to create attendee');
      }

      const { attendee } = await attendeeResponse.json();

      // Configure audio devices
      if (selectedInput) {
        await voiceService.selectAudioInputDevice(selectedInput);
      }
      if (selectedOutput) {
        await voiceService.selectAudioOutputDevice(selectedOutput);
      }

      // Join voice session
      const voiceConfig: VoiceSessionConfig = {
        meetingId: meeting.meetingId,
        externalMeetingId: meeting.externalMeetingId,
        mediaRegion: meeting.mediaRegion,
        mediaPlacement: meeting.mediaPlacement,
        attendeeId: attendee.attendeeId,
        externalUserId: attendee.externalUserId,
        joinToken: attendee.joinToken
      };

      await voiceService.joinVoiceSession(voiceConfig, selectedChannel);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('failed');
    }
  };

  const handleDisconnect = async () => {
    try {
      await voiceService.leaveVoiceSession();
      
      // Leave WebSocket channel
      sendMessage({
        action: 'leaveChannel',
        channelId: selectedChannel
      });
      
      setActiveSpeakers([]);
      setConnectionState('disconnected');
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleChannelChange = async (newChannel: string) => {
    if (connectionState === 'connected') {
      await handleDisconnect();
    }
    setSelectedChannel(newChannel);
  };

  const availableChannels = VOICE_CHANNELS.filter(
    channel => !channel.requiredClearance || userClearance >= channel.requiredClearance
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Channel Selection */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedChannel}
          onValueChange={handleChannelChange}
          disabled={connectionState === 'connecting'}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {availableChannels.map(channel => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center gap-2">
                  {channel.name}
                  {channel.requiredClearance && (
                    <Badge variant="outline" className="text-xs">
                      L{channel.requiredClearance}+
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {connectionState === 'disconnected' && (
          <Button onClick={handleConnect} variant="default">
            <Phone className="w-4 h-4 mr-2" />
            Connect
          </Button>
        )}

        {connectionState === 'connecting' && (
          <Button disabled variant="outline">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </Button>
        )}

        {connectionState === 'connected' && (
          <Button onClick={handleDisconnect} variant="destructive">
            <PhoneOff className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* PTT Button */}
      {connectionState === 'connected' && (
        <div className="flex flex-col items-center space-y-4">
          <PTTButton
            channelId={selectedChannel}
            size="lg"
          />

          {/* Active Speakers */}
          {activeSpeakers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div className="flex flex-wrap gap-1">
                {activeSpeakers.map(speaker => (
                  <Badge key={speaker} variant="secondary" className="animate-pulse">
                    {speaker}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio Device Selection */}
      {connectionState === 'disconnected' && audioDevices.length > 0 && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium">Audio Devices</h4>
          
          <Select value={selectedInput} onValueChange={setSelectedInput}>
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices
                .filter(d => d.kind === 'audioinput')
                .map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={selectedOutput} onValueChange={setSelectedOutput}>
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue placeholder="Select speaker" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices
                .filter(d => d.kind === 'audiooutput')
                .map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}