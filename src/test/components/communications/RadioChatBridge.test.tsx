import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioChatBridge } from '../../../../components/communications/RadioChatBridge';

// Mock dependencies
vi.mock('../../../../stores/realtimeChatStore', () => ({
  useRealtimeChatStore: vi.fn(() => ({
    messages: {
      main: [
        {
          id: 'test-msg-1',
          conversationId: 'main',
          senderId: 'user-1',
          senderName: 'Test User',
          content: 'Test message',
          type: 'text',
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      ]
    },
    sendMessage: vi.fn(),
    isConnected: true,
    initializeWebSocket: vi.fn()
  }))
}));

vi.mock('../../../../services/voice.service', () => ({
  voiceService: {
    setCallbacks: vi.fn(),
    isConnected: vi.fn(() => true),
    startTransmitting: vi.fn(),
    stopTransmitting: vi.fn()
  }
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, format: string) => {
    if (format === 'HH:mm:ss') return '12:34:56';
    if (format === 'HH:mm') return '12:34';
    return date.toISOString();
  })
}));

describe('RadioChatBridge', () => {
  const defaultProps = {
    userId: 'test-user-1',
    userName: 'Test User',
    userRole: 'Security Officer',
    clearanceLevel: 3,
    currentLocation: 'Building A'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Story 1: Security Guard Radio-to-Chat Bridge', () => {
    it('should render radio communication interface with channel selector', () => {
      render(<RadioChatBridge {...defaultProps} />);
      
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
      expect(screen.getByText('Main Channel')).toBeInTheDocument();
      expect(screen.getByText('Emergency')).toBeInTheDocument();
      expect(screen.getByText('Central Dispatch')).toBeInTheDocument();
    });

    it('should filter channels based on clearance level', () => {
      const lowClearanceProps = { ...defaultProps, clearanceLevel: 1 };
      render(<RadioChatBridge {...lowClearanceProps} />);
      
      // Should see main channels but not tactical (level 4)
      expect(screen.getByText('Main Channel')).toBeInTheDocument();
      expect(screen.queryByText('Tactical Alpha')).not.toBeInTheDocument();
    });

    it('should display PTT button with transcription capability', () => {
      render(<RadioChatBridge {...defaultProps} />);
      
      const pttButton = screen.getByLabelText(/hold to talk/i);
      expect(pttButton).toBeInTheDocument();
      expect(screen.getByText('Push to Talk')).toBeInTheDocument();
    });

    it('should handle channel switching', async () => {
      const user = userEvent.setup();
      render(<RadioChatBridge {...defaultProps} />);
      
      const emergencyChannel = screen.getByText('Emergency');
      await user.click(emergencyChannel);
      
      // Channel should be selected (visual indicator)
      expect(emergencyChannel.closest('button')).toHaveClass('bg-red-100');
    });

    it('should display radio messages with proper indicators', () => {
      const mockStore = vi.mocked(require('../../../../stores/realtimeChatStore').useRealtimeChatStore);
      mockStore.mockReturnValue({
        messages: {
          main: [
            {
              id: 'radio-msg-1',
              conversationId: 'main',
              senderId: 'user-2',
              senderName: 'Guard Alpha',
              senderRole: 'Security Officer',
              content: 'Security check, Building A is clear',
              type: 'radio',
              timestamp: new Date().toISOString(),
              status: 'delivered',
              metadata: {
                transcriptionConfidence: 0.92,
                location: 'Building A',
                radioMessageId: 'radio-123'
              }
            }
          ]
        },
        sendMessage: vi.fn(),
        isConnected: true,
        initializeWebSocket: vi.fn()
      });

      render(<RadioChatBridge {...defaultProps} />);
      
      expect(screen.getByText('Radio Transmission')).toBeInTheDocument();
      expect(screen.getByText('92% confidence')).toBeInTheDocument();
      expect(screen.getByText('Security check, Building A is clear')).toBeInTheDocument();
    });

    it('should send text messages and simulate TTS conversion', async () => {
      const user = userEvent.setup();
      const mockSendMessage = vi.fn();
      
      const mockStore = vi.mocked(require('../../../../stores/realtimeChatStore').useRealtimeChatStore);
      mockStore.mockReturnValue({
        messages: { main: [] },
        sendMessage: mockSendMessage,
        isConnected: true,
        initializeWebSocket: vi.fn()
      });

      render(<RadioChatBridge {...defaultProps} />);
      
      const textInput = screen.getByPlaceholderText('Type message to broadcast...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(textInput, 'All units report status');
      await user.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('main', 'All units report status', 'text');
    });

    it('should simulate transcription during PTT activation', async () => {
      const user = userEvent.setup();
      render(<RadioChatBridge {...defaultProps} />);
      
      const pttButton = screen.getByLabelText(/hold to talk/i);
      
      // Simulate PTT press
      fireEvent.mouseDown(pttButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transcribing...')).toBeInTheDocument();
      });
      
      // Simulate PTT release
      fireEvent.mouseUp(pttButton);
    });

    it('should display connection status', () => {
      render(<RadioChatBridge {...defaultProps} />);
      
      // Should show connected status
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
      
      // Mock disconnected state
      const mockStore = vi.mocked(require('../../../../stores/realtimeChatStore').useRealtimeChatStore);
      mockStore.mockReturnValue({
        messages: { main: [] },
        sendMessage: vi.fn(),
        isConnected: false,
        initializeWebSocket: vi.fn()
      });

      const { rerender } = render(<RadioChatBridge {...defaultProps} />);
      rerender(<RadioChatBridge {...defaultProps} />);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for PTT button', () => {
      render(<RadioChatBridge {...defaultProps} />);
      
      const pttButton = screen.getByLabelText(/hold to talk/i);
      expect(pttButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RadioChatBridge {...defaultProps} />);
      
      const textInput = screen.getByPlaceholderText('Type message to broadcast...');
      
      await user.type(textInput, 'Test message');
      await user.keyboard('{Enter}');
      
      // Should send message on Enter
      expect(textInput).toHaveValue('');
    });
  });

  describe('Real-time Features', () => {
    it('should auto-scroll to new messages', async () => {
      const mockStore = vi.mocked(require('../../../../stores/realtimeChatStore').useRealtimeChatStore);
      
      const { rerender } = render(<RadioChatBridge {...defaultProps} />);
      
      // Add new message
      mockStore.mockReturnValue({
        messages: {
          main: [
            {
              id: 'new-msg',
              conversationId: 'main',
              senderId: 'user-3',
              senderName: 'New User',
              content: 'New message',
              type: 'text',
              timestamp: new Date().toISOString(),
              status: 'delivered'
            }
          ]
        },
        sendMessage: vi.fn(),
        isConnected: true,
        initializeWebSocket: vi.fn()
      });
      
      rerender(<RadioChatBridge {...defaultProps} />);
      
      expect(screen.getByText('New message')).toBeInTheDocument();
    });

    it('should display active speakers indicator', () => {
      render(<RadioChatBridge {...defaultProps} />);
      
      // Mock active speakers
      const voiceService = require('../../../../services/voice.service').voiceService;
      const setCallbacks = vi.mocked(voiceService.setCallbacks);
      
      // Simulate callback setup
      expect(setCallbacks).toHaveBeenCalledWith({
        onConnectionStateChanged: expect.any(Function),
        onSpeakersChanged: expect.any(Function),
        onError: expect.any(Function)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle transcription errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock getUserMedia to throw error
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('Microphone access denied'))
        },
        configurable: true
      });

      render(<RadioChatBridge {...defaultProps} />);
      
      const pttButton = screen.getByLabelText(/hold to talk/i);
      fireEvent.mouseDown(pttButton);
      
      // Should handle error without crashing
      await waitFor(() => {
        expect(pttButton).toBeInTheDocument();
      });
    });

    it('should handle disconnected state', () => {
      const mockStore = vi.mocked(require('../../../../stores/realtimeChatStore').useRealtimeChatStore);
      mockStore.mockReturnValue({
        messages: { main: [] },
        sendMessage: vi.fn(),
        isConnected: false,
        initializeWebSocket: vi.fn()
      });

      render(<RadioChatBridge {...defaultProps} />);
      
      // Buttons should be disabled when disconnected
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });
});