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
}

export function PTTButton({ 
  channelId, 
  disabled = false,
  size = 'md',
  className 
}: PTTButtonProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { sendMessage } = useWebSocket();
  const pressTimeoutRef = useRef<NodeJS.Timeout>();

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

      // Send PTT state to WebSocket
      sendMessage({
        action: 'updatePTTState',
        channelId,
        isSpeaking: true
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

      // Send PTT state to WebSocket
      sendMessage({
        action: 'updatePTTState',
        channelId,
        isSpeaking: false
      });
    } catch (error) {
      console.error('Failed to stop transmitting:', error);
    }
  }, [channelId, isPressed, sendMessage]);

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
          </>
        ) : (
          <>
            <MicOff className="w-8 h-8 text-gray-600" />
            <span className="absolute bottom-2 text-xs font-medium text-gray-600">
              PTT
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

      {/* Keyboard hint */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap text-center">
        {size !== 'sm' && (
          <>
            <div>Hold or <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">SPACE</kbd></div>
            <div className="mt-1">{connectionState === 'connected' ? '🟢' : connectionState === 'transmitting' ? '🔴' : '⚫'} {connectionState.toUpperCase()}</div>
          </>
        )}
      </div>
    </div>
  );
}