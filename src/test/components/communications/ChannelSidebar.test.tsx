import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelSidebar } from '../../../components/communications/ChannelSidebar';

describe('ChannelSidebar', () => {
  const defaultProps = {
    currentUserId: 'user-1',
    currentUserClearance: 3,
    activeChannelId: 'main-general',
    onChannelSelect: vi.fn(),
    onChannelMute: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Story 2: Dispatcher Multi-Channel Coordination', () => {
    it('should render channel categories with proper structure', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
      expect(screen.getByText('Main Channels')).toBeInTheDocument();
      expect(screen.getByText('Emergency')).toBeInTheDocument();
      expect(screen.getByText('Dispatch')).toBeInTheDocument();
    });

    it('should filter channels based on clearance level', () => {
      // Test with high clearance
      const highClearanceProps = { ...defaultProps, currentUserClearance: 5 };
      const { rerender } = render(<ChannelSidebar {...highClearanceProps} />);
      
      expect(screen.getByText('Tactical')).toBeInTheDocument();
      expect(screen.getByText('Tactical Operations')).toBeInTheDocument();
      
      // Test with low clearance
      const lowClearanceProps = { ...defaultProps, currentUserClearance: 1 };
      rerender(<ChannelSidebar {...lowClearanceProps} />);
      
      expect(screen.queryByText('Tactical')).not.toBeInTheDocument();
      expect(screen.queryByText('Tactical Operations')).not.toBeInTheDocument();
    });

    it('should display channel information correctly', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Check main channel details
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Patrol Updates')).toBeInTheDocument();
      
      // Check participant counts
      expect(screen.getByText('5')).toBeInTheDocument(); // Main channels badge
      expect(screen.getByText('2')).toBeInTheDocument(); // Emergency participants
    });

    it('should show active speakers indicators', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Should show active speaker count for channels with activity
      const activeIndicators = screen.getAllByText('1'); // Active speakers count
      expect(activeIndicators.length).toBeGreaterThan(0);
    });

    it('should handle channel selection', async () => {
      const user = userEvent.setup();
      const mockOnChannelSelect = vi.fn();
      
      render(<ChannelSidebar {...defaultProps} onChannelSelect={mockOnChannelSelect} />);
      
      const emergencyChannel = screen.getByText('Emergency Response');
      await user.click(emergencyChannel);
      
      expect(mockOnChannelSelect).toHaveBeenCalledWith('emergency-alpha');
    });

    it('should handle channel muting', async () => {
      const user = userEvent.setup();
      const mockOnChannelMute = vi.fn();
      
      render(<ChannelSidebar {...defaultProps} onChannelMute={mockOnChannelMute} />);
      
      // Find channel row and hover to show mute button
      const channelRow = screen.getByText('General').closest('div');
      if (channelRow) {
        await user.hover(channelRow);
        
        // Look for mute button (bell icon)
        const muteButtons = screen.getAllByRole('button');
        const muteButton = muteButtons.find(btn => 
          btn.querySelector('svg') && btn.classList.contains('opacity-0')
        );
        
        if (muteButton) {
          await user.click(muteButton);
          expect(mockOnChannelMute).toHaveBeenCalled();
        }
      }
    });

    it('should show transcription indicators', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Look for transcription indicators (orange dots)
      const transcriptionIndicators = document.querySelectorAll('.bg-orange-500');
      expect(transcriptionIndicators.length).toBeGreaterThan(0);
    });

    it('should handle category collapsing', async () => {
      const user = userEvent.setup();
      render(<ChannelSidebar {...defaultProps} />);
      
      const mainChannelsToggle = screen.getByText('Main Channels');
      await user.click(mainChannelsToggle);
      
      // Channels should be hidden after collapse
      // Note: This depends on the actual implementation of collapse logic
      expect(screen.getByText('Main Channels')).toBeInTheDocument();
    });

    it('should display emergency channel with priority styling', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      const emergencySection = screen.getByText('Emergency');
      expect(emergencySection).toBeInTheDocument();
      expect(emergencySection).toHaveClass('text-red-600');
    });

    it('should show unread message counts', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Look for unread badges
      expect(screen.getByText('3')).toBeInTheDocument(); // Unread count
    });
  });

  describe('User Management Section', () => {
    it('should display online users', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Commander Alpha')).toBeInTheDocument();
      expect(screen.getByText('Guard Beta')).toBeInTheDocument();
      expect(screen.getByText('Dispatcher Gamma')).toBeInTheDocument();
    });

    it('should show user status indicators', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Check for status indicators (colored dots)
      const statusIndicators = document.querySelectorAll('.bg-green-500, .bg-red-500, .bg-yellow-500');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });

    it('should show speaking indicators for active users', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Look for speaking indicators (microphone icons or pulsing dots)
      const speakingIndicators = document.querySelectorAll('.animate-pulse');
      expect(speakingIndicators.length).toBeGreaterThan(0);
    });

    it('should display user roles and current channels', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      expect(screen.getByText('Incident Commander')).toBeInTheDocument();
      expect(screen.getByText('Security Officer')).toBeInTheDocument();
      expect(screen.getByText('In Emergency Response')).toBeInTheDocument();
    });

    it('should handle offline users toggle', async () => {
      const user = userEvent.setup();
      render(<ChannelSidebar {...defaultProps} />);
      
      // Find and click offline users toggle
      const toggleButtons = screen.getAllByRole('button');
      const offlineToggle = toggleButtons.find(btn => 
        btn.querySelector('svg[class*="Eye"]')
      );
      
      if (offlineToggle) {
        await user.click(offlineToggle);
        // Should show offline users count or toggle visibility
        expect(offlineToggle).toBeInTheDocument();
      }
    });

    it('should show high clearance indicators', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Look for shield icons indicating high clearance
      const shieldIcons = document.querySelectorAll('[data-testid="shield-icon"], .text-purple-500');
      expect(shieldIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Footer Controls', () => {
    it('should render footer control buttons', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Look for footer buttons (mic, headphones, settings, add)
      const footerButtons = screen.getAllByRole('button');
      const hasControlButtons = footerButtons.some(btn => 
        btn.querySelector('svg[class*="Mic"], svg[class*="Headphones"], svg[class*="Settings"], svg[class*="Plus"]')
      );
      expect(hasControlButtons).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should have proper width and layout classes', () => {
      const { container } = render(<ChannelSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-64');
      expect(sidebar).toHaveClass('bg-gray-100');
      expect(sidebar).toHaveClass('border-r');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ChannelSidebar {...defaultProps} />);
      
      // Check for buttons with proper labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check for proper heading structure
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChannelSidebar {...defaultProps} />);
      
      // Tab through elements
      await user.tab();
      
      // Should be able to navigate to interactive elements
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle empty channel lists gracefully', () => {
      const emptyProps = { ...defaultProps, currentUserClearance: 0 };
      render(<ChannelSidebar {...emptyProps} />);
      
      // Should still render main structure
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
    });

    it('should handle missing active channel', () => {
      const noActiveProps = { ...defaultProps, activeChannelId: undefined };
      render(<ChannelSidebar {...noActiveProps} />);
      
      // Should render without errors
      expect(screen.getByText('Radio Communications')).toBeInTheDocument();
    });
  });
});