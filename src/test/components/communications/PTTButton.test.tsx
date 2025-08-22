import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PTTButton } from '../../../components/communications/PTTButton';

// Mock dependencies
vi.mock('../../../services/voice.service', () => ({
  voiceService: {
    isConnected: vi.fn(() => true),
    startTransmitting: vi.fn(),
    stopTransmitting: vi.fn()
  }
}));

vi.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    sendMessage: vi.fn()
  }))
}));

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null,
  stream: {
    getTracks: vi.fn(() => [{ stop: vi.fn() }])
  },
  state: 'inactive'
}));

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  },
  configurable: true
});

describe('PTTButton', () => {
  const defaultProps = {
    channelId: 'main',
    enableTranscription: false,
    showConfidenceScore: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should render PTT button with default state', () => {
      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      expect(button).toBeInTheDocument();
      expect(screen.getByText('PTT')).toBeInTheDocument();
    });

    it('should show transcription mode when enabled', () => {
      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      expect(screen.getByText('PTT+TXT')).toBeInTheDocument();
    });

    it('should handle different sizes', () => {
      const { rerender } = render(<PTTButton {...defaultProps} size="sm" />);
      
      let button = screen.getByLabelText(/hold to talk/i);
      expect(button).toHaveClass('ptt-button--sm');
      
      rerender(<PTTButton {...defaultProps} size="lg" />);
      button = screen.getByLabelText(/hold to talk/i);
      expect(button).toHaveClass('ptt-button--lg');
    });

    it('should be disabled when voice service is disconnected', () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);
      mockVoiceService.isConnected.mockReturnValue(false);

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      expect(button).toBeDisabled();
    });

    it('should be disabled when explicitly disabled', () => {
      render(<PTTButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      expect(button).toBeDisabled();
    });
  });

  describe('PTT Interaction', () => {
    it('should handle mouse down and up for PTT', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);
      const mockWebSocket = vi.mocked(require('../../../hooks/useWebSocket').useWebSocket);
      const mockSendMessage = vi.fn();
      mockWebSocket.mockReturnValue({ sendMessage: mockSendMessage });

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      // Start transmitting
      fireEvent.mouseDown(button);
      
      expect(mockVoiceService.startTransmitting).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'updatePTTState',
        channelId: 'main',
        isSpeaking: true,
        enableTranscription: false
      });
      
      await waitFor(() => {
        expect(screen.getByText('ON AIR')).toBeInTheDocument();
      });
      
      // Stop transmitting
      fireEvent.mouseUp(button);
      
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'updatePTTState',
        channelId: 'main',
        isSpeaking: false,
        enableTranscription: false
      });
    });

    it('should handle touch events for mobile', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      fireEvent.touchStart(button);
      expect(mockVoiceService.startTransmitting).toHaveBeenCalled();
      
      fireEvent.touchEnd(button);
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
    });

    it('should stop transmitting when mouse leaves button', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      fireEvent.mouseDown(button);
      fireEvent.mouseLeave(button);
      
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
    });

    it('should handle safety timeout for long transmissions', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      fireEvent.mouseDown(button);
      
      // Fast forward 60 seconds (safety timeout)
      vi.advanceTimersByTime(60000);
      
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
    });
  });

  describe('Keyboard Support', () => {
    it('should handle spacebar for PTT', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(<PTTButton {...defaultProps} />);
      
      // Simulate spacebar press
      fireEvent.keyDown(window, { code: 'Space' });
      expect(mockVoiceService.startTransmitting).toHaveBeenCalled();
      
      // Simulate spacebar release
      fireEvent.keyUp(window, { code: 'Space' });
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
    });

    it('should handle Ctrl+Space for PTT in input fields', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(
        <div>
          <input type="text" />
          <PTTButton {...defaultProps} />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      // Ctrl+Space should work even in input field
      fireEvent.keyDown(window, { code: 'Space', ctrlKey: true });
      expect(mockVoiceService.startTransmitting).toHaveBeenCalled();
    });

    it('should not trigger PTT with Space in input fields without Ctrl', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(
        <div>
          <input type="text" />
          <PTTButton {...defaultProps} />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      // Space alone should not trigger PTT in input field
      fireEvent.keyDown(window, { code: 'Space' });
      expect(mockVoiceService.startTransmitting).not.toHaveBeenCalled();
    });

    it('should prevent repeated keydown events', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      render(<PTTButton {...defaultProps} />);
      
      // Multiple rapid keydown events (repeat=true)
      fireEvent.keyDown(window, { code: 'Space', repeat: true });
      fireEvent.keyDown(window, { code: 'Space', repeat: true });
      
      expect(mockVoiceService.startTransmitting).toHaveBeenCalledTimes(0);
    });
  });

  describe('Transcription Features', () => {
    it('should start transcription when enabled', async () => {
      const mockGetUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia);
      
      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      });
    });

    it('should show transcription indicator when active', async () => {
      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        const transcriptionIndicator = document.querySelector('.bg-orange-500.animate-pulse');
        expect(transcriptionIndicator).toBeInTheDocument();
      });
    });

    it('should show confidence score when enabled', async () => {
      render(<PTTButton {...defaultProps} enableTranscription={true} showConfidenceScore={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      // Simulate transcription completion with confidence score
      fireEvent.mouseDown(button);
      
      // Simulate transcription result
      vi.advanceTimersByTime(1000);
      fireEvent.mouseUp(button);
      
      await waitFor(() => {
        // Look for confidence score display
        const confidenceScore = screen.queryByText(/\d+% confidence/);
        expect(confidenceScore).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle transcription errors gracefully', async () => {
      const mockGetUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia);
      mockGetUserMedia.mockRejectedValue(new Error('Microphone access denied'));

      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      expect(() => {
        fireEvent.mouseDown(button);
      }).not.toThrow();
    });

    it('should process audio for transcription on PTT release', async () => {
      const mockWebSocket = vi.mocked(require('../../../hooks/useWebSocket').useWebSocket);
      const mockSendMessage = vi.fn();
      mockWebSocket.mockReturnValue({ sendMessage: mockSendMessage });

      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      fireEvent.mouseDown(button);
      vi.advanceTimersByTime(1000);
      fireEvent.mouseUp(button);
      
      await waitFor(() => {
        // Should send transcription result
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'radioTranscription',
            channelId: 'main',
            confidence: expect.any(Number),
            timestamp: expect.any(String)
          })
        );
      });
    });
  });

  describe('Visual States', () => {
    it('should show correct visual state when transmitting', async () => {
      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        expect(screen.getByText('ON AIR')).toBeInTheDocument();
        expect(button).toHaveClass('ptt-button--transmitting');
      });
    });

    it('should show connection state indicator', () => {
      render(<PTTButton {...defaultProps} />);
      
      const indicator = document.querySelector('.ptt-button__indicator--connected');
      expect(indicator).toBeInTheDocument();
    });

    it('should show visual feedback rings when transmitting', async () => {
      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        const rings = document.querySelectorAll('.animate-ping, .animate-pulse');
        expect(rings.length).toBeGreaterThan(0);
      });
    });

    it('should show keyboard hint for non-small sizes', () => {
      render(<PTTButton {...defaultProps} size="md" />);
      
      expect(screen.getByText(/SPACE/)).toBeInTheDocument();
      expect(screen.getByText(/CONNECTED/)).toBeInTheDocument();
    });

    it('should not show keyboard hint for small size', () => {
      render(<PTTButton {...defaultProps} size="sm" />);
      
      expect(screen.queryByText(/SPACE/)).not.toBeInTheDocument();
    });

    it('should show transcription ON indicator when enabled', () => {
      render(<PTTButton {...defaultProps} enableTranscription={true} size="md" />);
      
      expect(screen.getByText('🎤→📝 Transcription ON')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle voice service errors', async () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);
      mockVoiceService.startTransmitting.mockRejectedValue(new Error('Voice service error'));

      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      expect(() => {
        fireEvent.mouseDown(button);
      }).not.toThrow();
    });

    it('should cleanup on unmount', () => {
      const mockVoiceService = vi.mocked(require('../../../services/voice.service').voiceService);

      const { unmount } = render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      unmount();
      
      // Should call stop transmitting on cleanup
      expect(mockVoiceService.stopTransmitting).toHaveBeenCalled();
    });

    it('should handle MediaRecorder errors', async () => {
      const mockMediaRecorder = vi.mocked(global.MediaRecorder);
      mockMediaRecorder.mockImplementation(() => {
        throw new Error('MediaRecorder error');
      });

      render(<PTTButton {...defaultProps} enableTranscription={true} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      
      expect(() => {
        fireEvent.mouseDown(button);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      expect(button).toBeInTheDocument();
    });

    it('should update ARIA label when transmitting', async () => {
      render(<PTTButton {...defaultProps} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Release to stop talking');
      });
    });

    it('should support keyboard interaction', () => {
      render(<PTTButton {...defaultProps} />);
      
      // Button should be focusable
      const button = screen.getByLabelText(/hold to talk/i);
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Callbacks', () => {
    it('should call onActivate callback when PTT is activated', async () => {
      const mockOnActivate = vi.fn();
      
      render(<PTTButton {...defaultProps} onActivate={mockOnActivate} />);
      
      const button = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(button);
      
      await waitFor(() => {
        expect(mockOnActivate).toHaveBeenCalled();
      });
    });
  });
});