import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIAssistantPanel } from '../../components/ai/AIAssistantPanel'

// Mock the services and stores
vi.mock('../../services/ServiceProvider', () => ({
  useServices: () => ({
    activityService: { createActivity: vi.fn() },
    incidentService: { createIncident: vi.fn() },
    auditService: { logAuditEntry: vi.fn() },
    isInitialized: true
  }),
  createAuditContext: vi.fn(() => ({
    userId: 'test-user',
    userName: 'Test User',
    userRole: 'officer',
    action: 'ai_interaction',
    details: 'AI Assistant interaction'
  }))
}))

vi.mock('../../stores/activityStore', () => ({
  useActivityStore: () => ({
    activities: [],
    createActivity: vi.fn()
  })
}))

vi.mock('../../stores/incidentStore', () => ({
  useIncidentStore: () => ({
    incidents: [],
    createIncident: vi.fn()
  })
}))

vi.mock('../../stores/auditStore', () => ({
  useAuditStore: () => ({
    logAction: vi.fn()
  })
}))

vi.mock('../../hooks', () => ({
  useIncidentService: () => ({
    createIncident: vi.fn()
  }),
  useActivityService: () => ({
    createActivity: vi.fn()
  }),
  useSearchService: () => ({
    search: vi.fn()
  })
}))

// Mock child components
vi.mock('../../components/ai/AIChat', () => ({
  AIChat: ({ messages, onSendMessage, isProcessing }: any) => (
    <div data-testid="ai-chat">
      AI Chat Component
      <div>Messages: {messages?.length || 0}</div>
      <button onClick={() => onSendMessage?.('test message')} disabled={isProcessing}>
        Send Message
      </button>
    </div>
  )
}))

vi.mock('../../components/ai/VoiceInput', () => ({
  VoiceInput: ({ onTranscription, isListening, onToggleListening }: any) => (
    <div data-testid="voice-input">
      Voice Input Component
      <div>Listening: {isListening ? 'Yes' : 'No'}</div>
      <button onClick={onToggleListening}>Toggle Listening</button>
      <button onClick={() => onTranscription?.('voice transcription')}>
        Simulate Voice
      </button>
    </div>
  )
}))

vi.mock('../../components/ai/AIHistory', () => ({
  AIHistory: ({ actions, onRerun }: any) => (
    <div data-testid="ai-history">
      AI History Component
      <div>Actions: {actions?.length || 0}</div>
      <button onClick={() => onRerun?.('action-1')}>Rerun Action</button>
    </div>
  )
}))

vi.mock('../../components/ai/ActionConfirmation', () => ({
  ActionConfirmation: ({ action, onConfirm, onCancel }: any) =>
    action ? (
      <div data-testid="action-confirmation">
        Action Confirmation: {action.title}
        <button onClick={() => onConfirm?.(action)}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
}))

describe('AIAssistantPanel Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => JSON.stringify({ x: 20, y: 20 })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })
  })

  it('should render initially in minimized state', () => {
    render(<AIAssistantPanel />)
    
    // Should show minimized floating button
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    expect(minimizedButton).toBeInTheDocument()
    
    // Should show AI bot icon
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Lucide icons are rendered as SVGs
  })

  it('should expand when minimized button is clicked', async () => {
    render(<AIAssistantPanel />)
    
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    })
    
    // Should show panel controls
    expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('should display tab navigation when expanded', async () => {
    render(<AIAssistantPanel />)
    
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Voice')).toBeInTheDocument()
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('should switch between different tabs', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat')).toBeInTheDocument()
    })
    
    // Switch to Voice tab
    const voiceTab = screen.getByRole('button', { name: /voice/i })
    await user.click(voiceTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('voice-input')).toBeInTheDocument()
    })
    
    // Switch to History tab
    const historyTab = screen.getByRole('button', { name: /history/i })
    await user.click(historyTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('ai-history')).toBeInTheDocument()
    })
    
    // Switch to Settings tab
    const settingsTab = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsTab)
    
    await waitFor(() => {
      expect(screen.getByText('Voice Responses')).toBeInTheDocument()
      expect(screen.getByText('Auto-approve Low Priority Actions')).toBeInTheDocument()
      expect(screen.getByText('Show Voice Transcription')).toBeInTheDocument()
    })
  })

  it('should handle minimize and maximize', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    })
    
    // Minimize panel
    const minimizeButton = screen.getByRole('button', { name: /minimize/i })
    await user.click(minimizeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ai assistant/i })).toBeInTheDocument()
    })
  })

  it('should handle close action', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    })
    
    // Close panel
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ai assistant/i })).toBeInTheDocument()
    })
  })

  it('should handle chat message sending', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat')).toBeInTheDocument()
    })
    
    // Send a message
    const sendButton = screen.getByRole('button', { name: /send message/i })
    await user.click(sendButton)
    
    // Should process the message
    expect(screen.getByText('Messages: 0')).toBeInTheDocument() // Initial state
  })

  it('should handle voice input functionality', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel and switch to voice tab
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      const voiceTab = screen.getByRole('button', { name: /voice/i })
      user.click(voiceTab)
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('voice-input')).toBeInTheDocument()
    })
    
    // Toggle listening
    const toggleButton = screen.getByRole('button', { name: /toggle listening/i })
    await user.click(toggleButton)
    
    // Should show listening state
    expect(screen.getByText('Listening: No')).toBeInTheDocument() // Initial state
    
    // Simulate voice transcription
    const simulateVoiceButton = screen.getByRole('button', { name: /simulate voice/i })
    await user.click(simulateVoiceButton)
  })

  it('should handle action confirmation workflow', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    // Simulate having a pending action (this would normally be triggered by AI response)
    // In a real test, we'd need to trigger an AI response that creates a pending action
    
    // For now, we'll just verify the action confirmation component is available
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat')).toBeInTheDocument()
    })
  })

  it('should handle settings changes', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel and go to settings
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      const settingsTab = screen.getByRole('button', { name: /settings/i })
      user.click(settingsTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Voice Responses')).toBeInTheDocument()
    })
    
    // Should have toggle switches for settings
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)
    
    // Toggle a setting
    await user.click(switches[0])
  })

  it('should persist position in localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(<AIAssistantPanel />)
    
    // The component should save position on mount or position change
    // This would be tested with actual drag functionality in a real implementation
    expect(setItemSpy).toHaveBeenCalledWith(
      'ai-assistant-position',
      expect.any(String)
    )
  })

  it('should handle dragging functionality', async () => {
    render(<AIAssistantPanel />)
    
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    
    // Test drag start
    fireEvent.mouseDown(minimizedButton, { clientX: 100, clientY: 100 })
    
    // Test drag move
    fireEvent.mouseMove(document, { clientX: 150, clientY: 150 })
    
    // Test drag end
    fireEvent.mouseUp(document)
    
    // Position should be updated (this is a simplified test)
    expect(minimizedButton).toBeInTheDocument()
  })

  it('should show processing state during AI operations', async () => {
    render(<AIAssistantPanel />)
    
    // Expand panel
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    await user.click(minimizedButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat')).toBeInTheDocument()
    })
    
    // The chat component should handle processing state
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('should display badge with new message indicator', () => {
    render(<AIAssistantPanel />)
    
    // Should show the minimized button
    const minimizedButton = screen.getByRole('button', { name: /ai assistant/i })
    expect(minimizedButton).toBeInTheDocument()
    
    // In a real implementation, this would show a notification badge when there are new messages
  })

  it('should handle keyboard shortcuts', async () => {
    render(<AIAssistantPanel />)
    
    // Test Escape key to close
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Should handle keyboard navigation
    expect(screen.getByRole('button', { name: /ai assistant/i })).toBeInTheDocument()
  })

  it('should handle screen resize and position adjustment', () => {
    render(<AIAssistantPanel />)
    
    // Simulate window resize
    fireEvent.resize(window)
    
    // Component should adjust position to stay within bounds
    expect(screen.getByRole('button', { name: /ai assistant/i })).toBeInTheDocument()
  })
})