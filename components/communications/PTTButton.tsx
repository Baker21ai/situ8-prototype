import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { voiceService } from '../../services/voice.service';
import { useWebSocket } from '../../hooks/useWebSocket';

interface PTTButtonProps {
  channelId: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onActivate?: () => void;
  enableTranscription?: boolean;
  showConfidenceScore?: boolean;
}

export function PTTButton({ 
  channelId, 
  disabled = false,
  size = 'md',
  className,
  onActivate,
  enableTranscription = false,
  showConfidenceScore = false
}: PTTButtonProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number>(0);
  const { sendMessage } = useWebSocket();
  const pressTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sizeClasses = {
    sm: 'ptt-button--sm',
    md: 'ptt-button--md',
    lg: 'ptt-button--lg'
  };

  const handleStartTransmit = useCallback(async () => {
    if (disabled || !voiceService.isConnected()) return;

    try {
      // Clear any existing timeout
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }

      setIsPressed(true);
      await voiceService.startTransmitting();
      setIsTransmitting(true);

      // Start transcription if enabled
      if (enableTranscription) {
        startTranscription();
      }

      // Call onActivate callback
      onActivate?.();

      // Send PTT state to WebSocket
      sendMessage({
        action: 'updatePTTState',
        channelId,
        isSpeaking: true,
        enableTranscription
      });

      // Safety timeout - max 60 seconds transmission
      pressTimeoutRef.current = setTimeout(() => {
        handleStopTransmit();
      }, 60000);
    } catch (error) {
      console.error('Failed to start transmitting:', error);
      setIsPressed(false);
    }
  }, [channelId, disabled, sendMessage]);

  const handleStopTransmit = useCallback(async () => {
    if (!isPressed) return;

    try {
      // Clear safety timeout
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }

      setIsPressed(false);
      await voiceService.stopTransmitting();
      setIsTransmitting(false);

      // Stop transcription if enabled
      if (enableTranscription) {
        stopTranscription();
      }

      // Send PTT state to WebSocket
      sendMessage({
        action: 'updatePTTState',
        channelId,
        isSpeaking: false,
        enableTranscription
      });
    } catch (error) {
      console.error('Failed to stop transmitting:', error);
    }
  }, [channelId, isPressed, sendMessage, enableTranscription]);

  // Transcription functions
  const startTranscription = useCallback(async () => {
    try {
      setIsTranscribing(true);
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up MediaRecorder for audio capture
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect audio in 100ms chunks
      
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setIsTranscribing(false);
    }
  }, []);

  const stopTranscription = useCallback(async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Stop all tracks
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      setIsTranscribing(false);
      
      // Process audio for transcription (in real implementation, send to AWS Transcribe)
      if (audioChunksRef.current.length > 0) {
        processAudioForTranscription();
      }
      
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }, []);

  const processAudioForTranscription = useCallback(async () => {
    // In real implementation, this would:
    // 1. Create audio blob from chunks
    // 2. Send to AWS Transcribe service
    // 3. Get transcription result with confidence score
    // 4. Send transcription via WebSocket
    
    // Simulate transcription result
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const confidence = 0.85 + Math.random() * 0.15; // 85-100% confidence
    
    setTranscriptionConfidence(confidence);
    
    // Send transcription result
    sendMessage({
      action: 'radioTranscription',
      channelId,
      audioBlob: audioBlob, // In real implementation, would be audio data
      confidence,
      timestamp: new Date().toISOString()
    });
    
    // Clear audio chunks
    audioChunksRef.current = [];
  }, [channelId, sendMessage]);

  // Enhanced keyboard support - both Ctrl+Space and Space only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow both Ctrl+Space and Space (when not in input fields)
      const isSpaceKey = e.code === 'Space';
      const isInInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (isSpaceKey && !e.repeat && (!isInInputField || e.ctrlKey)) {
        e.preventDefault();
        handleStartTransmit();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isSpaceKey = e.code === 'Space';
      const isInInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (isSpaceKey && (!isInInputField || e.ctrlKey)) {
        e.preventDefault();
        handleStopTransmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleStartTransmit, handleStopTransmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
      if (isTransmitting) {
        voiceService.stopTransmitting();
      }
    };
  }, [isTransmitting]);

  const connectionState = !voiceService.isConnected() ? 'disconnected' : isTransmitting ? 'transmitting' : 'connected';

  return (
    <div className="relative inline-block">
      <button
        className={cn(
          'ptt-button',
          sizeClasses[size],
          `ptt-button--${connectionState}`,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onMouseDown={handleStartTransmit}
        onMouseUp={handleStopTransmit}
        onMouseLeave={handleStopTransmit}
        onTouchStart={handleStartTransmit}
        onTouchEnd={handleStopTransmit}
        disabled={disabled || !voiceService.isConnected()}
        aria-label={isTransmitting ? 'Release to stop talking' : 'Hold to talk'}
      >
        {isTransmitting ? (
          <>
            <Mic className="w-8 h-8 text-white" />
            <span className="absolute bottom-2 text-xs font-bold text-white">
              ON AIR
            </span>
            {enableTranscription && isTranscribing && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            )}
          </>
        ) : (
          <>
            <MicOff className="w-8 h-8 text-gray-600" />
            <span className="absolute bottom-2 text-xs font-medium text-gray-600">
              {enableTranscription ? 'PTT+TXT' : 'PTT'}
            </span>
          </>
        )}
      </button>

      {/* Connection Status Indicator */}
      <div className={cn(
        'ptt-button__indicator',
        `ptt-button__indicator--${connectionState}`
      )} />

      {/* Visual feedback rings */}
      {isTransmitting && (
        <>
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30 pointer-events-none" />
          <div className="absolute inset-2 rounded-full animate-pulse bg-red-300 opacity-20 pointer-events-none" />
        </>
      )}

      {/* Transcription confidence indicator */}
      {showConfidenceScore && transcriptionConfidence > 0 && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
          {Math.round(transcriptionConfidence * 100)}% confidence
        </div>
      )}

      {/* Keyboard hint */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap text-center">
        {size !== 'sm' && (
          <>
            <div>Hold or <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">SPACE</kbd></div>
            <div className="mt-1">{connectionState === 'connected' ? '🟢' : connectionState === 'transmitting' ? '🔴' : '⚫'} {connectionState.toUpperCase()}</div>
            {enableTranscription && (
              <div className="mt-1 text-orange-600">🎤→📝 Transcription ON</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}