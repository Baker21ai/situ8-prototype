import React, { useState, useEffect } from 'react';
import { PTTButton } from './components/communications/PTTButton';
import { useWebSocket } from './hooks/useWebSocket';
import { voiceService } from './services/voice.service';

interface TestCommunicationsProps {
  onClose: () => void;
}

export function TestCommunications({ onClose }: TestCommunicationsProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [voiceStatus, setVoiceStatus] = useState<string>('disconnected');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);

  const { connect, disconnect, sendMessage, subscribe, isConnected, connectionState } = useWebSocket();

  const addTestResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✅';
    setTestResults(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  };

  // Test WebSocket Connection
  const testWebSocketConnection = async () => {
    addTestResult('Testing WebSocket connection...');
    
    try {
      // Try to connect
      await connect();
      
      // Wait a moment for connection to establish
      setTimeout(() => {
        if (isConnected) {
          addTestResult('WebSocket connected successfully');
          setConnectionStatus('connected');
        } else {
          addTestResult('WebSocket connection failed', true);
          setConnectionStatus('failed');
        }
      }, 2000);
    } catch (error) {
      addTestResult(`WebSocket connection error: ${error}`, true);
      setConnectionStatus('failed');
    }
  };

  // Test Voice Service
  const testVoiceService = async () => {
    addTestResult('Testing Voice Service...');
    
    try {
      // First, we need to create a meeting
      const meetingResponse = await fetch(`${import.meta.env.VITE_CHIME_API_URL || import.meta.env.REACT_APP_CHIME_API_URL}/chime/meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalMeetingId: `test-meeting-${Date.now()}`,
          mediaRegion: 'us-west-2',
        }),
      });

      if (!meetingResponse.ok) {
        throw new Error(`Failed to create meeting: ${meetingResponse.status}`);
      }

      const meetingData = await meetingResponse.json();
      addTestResult('Chime meeting created successfully');

      // Create attendee
      const attendeeResponse = await fetch(`${import.meta.env.VITE_CHIME_API_URL || import.meta.env.REACT_APP_CHIME_API_URL}/chime/attendee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meetingData.Meeting.MeetingId,
          externalUserId: 'test-user-1',
        }),
      });

      if (!attendeeResponse.ok) {
        throw new Error(`Failed to create attendee: ${attendeeResponse.status}`);
      }

      const attendeeData = await attendeeResponse.json();
      addTestResult('Chime attendee created successfully');

      // Set up voice service callbacks
      voiceService.setCallbacks({
        onConnectionStateChanged: (state) => {
          setVoiceStatus(state);
          addTestResult(`Voice connection state: ${state}`);
        },
        onError: (error) => {
          addTestResult(`Voice error: ${error.message}`, true);
        },
      });

      // Join voice session
      const voiceConfig = {
        meetingId: meetingData.Meeting.MeetingId,
        externalMeetingId: meetingData.Meeting.ExternalMeetingId,
        mediaRegion: meetingData.Meeting.MediaRegion,
        mediaPlacement: meetingData.Meeting.MediaPlacement,
        attendeeId: attendeeData.Attendee.AttendeeId,
        externalUserId: attendeeData.Attendee.ExternalUserId,
        joinToken: attendeeData.Attendee.JoinToken,
      };

      await voiceService.joinVoiceSession(voiceConfig, 'test-channel');
      addTestResult('Voice service connected successfully');
      setVoiceStatus('connected');

    } catch (error) {
      addTestResult(`Voice service error: ${error}`, true);
      setVoiceStatus('failed');
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsTestingInProgress(true);
    setTestResults([]);
    
    addTestResult('Starting communication module tests...');
    
    // Test WebSocket first
    await testWebSocketConnection();
    
    // Wait a moment then test voice
    setTimeout(async () => {
      await testVoiceService();
      setIsTestingInProgress(false);
      addTestResult('All tests completed');
    }, 3000);
  };

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = subscribe('*', (data) => {
      addTestResult(`WebSocket message received: ${JSON.stringify(data)}`);
    });

    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Communications Module Test</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">WebSocket Status</h3>
            <div className={`px-3 py-2 rounded ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {connectionState || connectionStatus}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Voice Status</h3>
            <div className={`px-3 py-2 rounded ${
              voiceStatus === 'connected' ? 'bg-green-100 text-green-800' :
              voiceStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {voiceStatus}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isTestingInProgress}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isTestingInProgress ? 'Testing...' : 'Run All Tests'}
          </button>

          <button
            onClick={testWebSocketConnection}
            disabled={isTestingInProgress}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test WebSocket
          </button>

          <button
            onClick={testVoiceService}
            disabled={isTestingInProgress}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Voice
          </button>

          {voiceStatus === 'connected' && (
            <div className="flex items-center">
              <PTTButton channelId="test-channel" size="sm" />
              <span className="ml-2 text-sm text-gray-600">Test PTT</span>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="border rounded-lg">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-semibold">Test Results</h3>
          </div>
          <div className="p-4 h-64 overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm">
            {testResults.length > 0 ? (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No test results yet. Click "Run All Tests" to begin.</div>
            )}
          </div>
        </div>

        {/* Configuration Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Current Configuration:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>WebSocket URL:</strong> {import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.REACT_APP_WEBSOCKET_URL || 'Not configured'}</div>
            <div><strong>Chime API URL:</strong> {import.meta.env.VITE_CHIME_API_URL || import.meta.env.REACT_APP_CHIME_API_URL || 'Not configured'}</div>
            <div><strong>AWS Region:</strong> {import.meta.env.REACT_APP_AWS_REGION || 'us-west-2'}</div>
            <div><strong>Environment:</strong> {import.meta.env.REACT_APP_ENVIRONMENT || 'development'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}