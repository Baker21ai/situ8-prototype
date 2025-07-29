import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Slider } from './ui/slider';
import { 
  Radio,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Volume2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Mic,
  Clock
} from 'lucide-react';

export interface RadioCommunication {
  id: string;
  timestamp: Date;
  from: string;
  channel: string;
  content: string;
  location?: string;
  transcriptionConfidence?: number;
  hasAudio?: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  audioUrl?: string;
  audioDuration?: number; // in seconds
  status: 'active' | 'resolved' | 'archived';
  threadId?: string;
  activityId?: string;
}

interface ExpandableRadioCardProps {
  communication: RadioCommunication;
  onViewInRadioPanel?: (commId: string) => void;
  onPlay?: (commId: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export function ExpandableRadioCard({
  communication,
  onViewInRadioPanel,
  onPlay,
  className = '',
  defaultExpanded = false
}: ExpandableRadioCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(communication.audioDuration || 12); // Default 12 seconds as in image
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toUpperCase();
  };

  // Get priority styling
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      setIsPlaying(true);
      audioRef.current?.play();
      onPlay?.(communication.id);
    }
  };

  // Handle replay
  const handleReplay = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Handle time slider change
  const handleTimeChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-md ${className}`}>
      <CardContent className="p-0">
        {/* Collapsed Header - Always Visible */}
        <div 
          className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(communication.priority)}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Radio Icon */}
              <div className="p-2 bg-blue-100 rounded-lg">
                <Radio className="h-4 w-4 text-blue-600" />
              </div>
              
              {/* Basic Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{formatTimestamp(communication.timestamp)}</span>
                  <Badge variant="outline" className="text-xs">
                    {communication.channel}
                  </Badge>
                </div>
                <div className="font-medium text-sm">{communication.from}</div>
                <div className="text-sm text-gray-600 truncate max-w-[200px]">
                  "{communication.content.length > 50 ? communication.content.substring(0, 50) + '...' : communication.content}"
                </div>
              </div>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex items-center gap-2">
              {communication.hasAudio && !isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3 text-green-600" />
                  ) : (
                    <Play className="h-3 w-3 text-green-600" />
                  )}
                </Button>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t bg-gray-900 text-white">
            {/* Expanded Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8 bg-gray-700">
                  <AvatarFallback className="text-white text-sm">
                    {getInitials(communication.from)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{communication.from}</div>
                  <div className="text-sm text-gray-300">
                    {communication.channel} ({communication.channel === 'Channel 1' ? 'Main' : communication.channel})
                  </div>
                </div>
              </div>

              {/* Full Transcription */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-sm italic leading-relaxed">
                  "{communication.content}"
                </p>
              </div>

              {/* Audio Player */}
              {communication.hasAudio && (
                <div className="space-y-3">
                  {/* Audio Element */}
                  <audio
                    ref={audioRef}
                    src={communication.audioUrl}
                    preload="metadata"
                  />

                  {/* Playback Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePlayPause}
                      className="h-10 w-10 p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Progress Bar */}
                    <div className="flex-1">
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={handleTimeChange}
                        className="w-full"
                      />
                    </div>

                    {/* Time Display */}
                    <div className="text-sm text-gray-300 font-mono min-w-[60px] text-right">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePlayPause}
                  className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Play
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReplay}
                  className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Replay
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewInRadioPanel?.(communication.id)}
                className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                View in Radio Panel
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Additional Info */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {communication.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{communication.location}</span>
                  </div>
                )}
                {communication.transcriptionConfidence && (
                  <div className="flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    <span>{Math.round(communication.transcriptionConfidence)}% accuracy</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(communication.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}