'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  VolumeX,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onTranscriptReady: (transcript: string) => void;
  isProcessing?: boolean;
  className?: string;
}

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  isActive: boolean;
}

function AudioVisualizer({ audioContext, analyser, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !analyser || !audioContext) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Check if component is destroyed to prevent memory leaks
      if (!isActive || isDestroyedRef.current || !analyser || !canvas || !ctx) {
        return;
      }

      try {
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength * 2.5;
        let x = 0;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.3)');

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }

        // Only continue animation if still active and not destroyed
        if (isActive && !isDestroyedRef.current) {
          animationRef.current = requestAnimationFrame(draw);
        }
      } catch (error) {
        console.warn('Audio visualization error:', error);
        // Stop animation on error to prevent cascading issues
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
      }
    };

    draw();

    return () => {
      isDestroyedRef.current = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [isActive, analyser, audioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyedRef.current = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={60}
      className={cn(
        "w-full h-15 rounded border bg-background/50",
        !isActive && "opacity-30"
      )}
    />
  );
}

export function VoiceInput({
  isListening,
  onStartListening,
  onStopListening,
  onTranscriptReady,
  isProcessing = false,
  className
}: VoiceInputProps) {
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isUnmountedRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);

      // Send final transcript
      if (finalTranscript) {
        onTranscriptReady(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Recognition error: ${event.error}`);
      onStopListening();
    };

    recognition.onend = () => {
      // Prevent restarts if component is unmounted
      if (isUnmountedRef.current) return;
      
      if (isListening) {
        // Restart if we're still supposed to be listening
        cleanupTimeoutRef.current = setTimeout(() => {
          // Double-check we're still mounted and listening
          if (!isUnmountedRef.current && isListening) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [isListening, onTranscriptReady, onStopListening]);

  // Initialize audio context for visualization
  const initializeAudioContext = useCallback(async () => {
    try {
      // Check if component is unmounted before proceeding
      if (isUnmountedRef.current) return null;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Check again after async operation
      if (isUnmountedRef.current) {
        // Clean up stream if component unmounted during getUserMedia
        stream.getTracks().forEach(track => track.stop());
        return null;
      }

      // Store stream reference for cleanup
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      // Handle suspend/resume for better resource management
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up audioContext state change listener for cleanup
      audioContext.onstatechange = () => {
        console.log('AudioContext state changed to:', audioContext.state);
        if (audioContext.state === 'closed' && analyserRef.current === analyser) {
          analyserRef.current = null;
        }
      };

      return { audioContext, analyser, stream };
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (!isUnmountedRef.current) {
        setError('Microphone access denied');
      }
      return null;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!isSupported || isListening) return;

    setError(null);
    setTranscript('');

    try {
      // Initialize audio visualization
      await initializeAudioContext();

      // Initialize speech recognition
      const recognition = initializeSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        onStartListening();
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
      setError('Failed to start voice recognition');
    }
  }, [isSupported, isListening, initializeAudioContext, initializeSpeechRecognition, onStartListening]);

  // Enhanced stop listening with better cleanup
  const stopListening = useCallback(() => {
    // Clear any pending timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = undefined;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
      recognitionRef.current = null;
    }

    // Close audio context properly
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      // Disconnect all nodes first to prevent errors
      try {
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
      } catch (error) {
        console.warn('Error disconnecting analyser:', error);
      }

      audioContextRef.current.close().then(() => {
        console.log('AudioContext closed successfully');
      }).catch(err => {
        console.warn('Error closing AudioContext:', err);
      });
      audioContextRef.current = null;
    }

    // Stop all media stream tracks to release microphone
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
      } catch (error) {
        console.warn('Error stopping media tracks:', error);
      }
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    
    // Only update state if component is still mounted
    if (!isUnmountedRef.current) {
      setAudioLevel(0);
      setTranscript('');
      setError(null);
      onStopListening();
    }
  }, [onStopListening]);

  // Handle click
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      
      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      
      // Force cleanup
      stopListening();
    };
  }, [stopListening]);

  // Additional cleanup effect for isListening state changes
  useEffect(() => {
    if (!isListening && !isUnmountedRef.current) {
      // Ensure cleanup when not listening
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(err => {
          console.warn('Error closing AudioContext in cleanup:', err);
        });
      }
    }
  }, [isListening]);

  // Page visibility cleanup - suspend audio context when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(err => {
          console.warn('Error suspending AudioContext:', err);
        });
      } else if (!document.hidden && audioContextRef.current && audioContextRef.current.state === 'suspended' && isListening) {
        audioContextRef.current.resume().catch(err => {
          console.warn('Error resuming AudioContext:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  if (!isSupported) {
    return (
      <Card className={cn("p-4 text-center", className)}>
        <VolumeX className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Voice input not supported in this browser
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Voice Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleToggleListening}
          disabled={isProcessing}
          size="lg"
          variant={isListening ? "default" : "outline"}
          className={cn(
            "w-16 h-16 rounded-full p-0 transition-all duration-200",
            isListening && "animate-pulse bg-primary hover:bg-primary/90",
            !isListening && "hover:scale-105"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Audio Visualizer */}
      {isListening && (
        <div className="space-y-2">
          <AudioVisualizer
            audioContext={audioContextRef.current}
            analyser={analyserRef.current}
            isActive={isListening}
          />
          
          {/* Live Transcript */}
          {transcript && (
            <Card className="p-3 bg-background/50">
              <p className="text-sm text-center">
                "{transcript}"
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        {isListening && (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Volume2 className="w-4 h-4" />
              <span>Listening...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Say "done" or click stop when finished
            </p>
          </div>
        )}
        
        {!isListening && !isProcessing && (
          <p className="text-xs text-muted-foreground">
            Click the microphone to start voice input
          </p>
        )}

        {isProcessing && (
          <p className="text-xs text-muted-foreground">
            Processing your request...
          </p>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-2">
            {error}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      {!isListening && !isProcessing && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onTranscriptReady("Create fire incident Building A")}
          >
            Fire Emergency
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onTranscriptReady("Show today's activities")}
          >
            Daily Report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onTranscriptReady("Search open incidents")}
          >
            Search Records
          </Button>
        </div>
      )}
    </div>
  );
}