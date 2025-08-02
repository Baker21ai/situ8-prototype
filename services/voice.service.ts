import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultActiveSpeakerPolicy,
  LogLevel,
  MeetingSessionConfiguration,
  AudioVideoFacade,
  MeetingSession,
  Device,
  DeviceChangeObserver,
  AudioVideoObserver,
  MeetingSessionStatus,
} from 'amazon-chime-sdk-js';

export interface VoiceSessionConfig {
  meetingId: string;
  externalMeetingId: string;
  mediaRegion: string;
  mediaPlacement: {
    audioHostUrl: string;
    audioFallbackUrl: string;
    signalingUrl: string;
    turnControlUrl: string;
  };
  attendeeId: string;
  externalUserId: string;
  joinToken: string;
}

export interface VoiceDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export interface VoiceServiceCallbacks {
  onSpeakersChanged?: (speakers: string[]) => void;
  onConnectionStateChanged?: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onAudioDevicesChanged?: (devices: VoiceDevice[]) => void;
  onError?: (error: Error) => void;
}

class VoiceService {
  private static instance: VoiceService;
  private meetingSession: DefaultMeetingSession | null = null;
  private audioVideo: AudioVideoFacade | null = null;
  private logger: ConsoleLogger;
  private deviceController: DefaultDeviceController;
  private callbacks: VoiceServiceCallbacks = {};
  private currentSpeakers: Set<string> = new Set();
  private isTransmitting: boolean = false;
  private currentChannelId: string | null = null;

  private constructor() {
    this.logger = new ConsoleLogger('VoiceService', LogLevel.INFO);
    this.deviceController = new DefaultDeviceController(this.logger);
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  setCallbacks(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
  }

  async joinVoiceSession(config: VoiceSessionConfig, channelId: string): Promise<void> {
    try {
      this.currentChannelId = channelId;
      this.callbacks.onConnectionStateChanged?.('connecting');

      // Create meeting configuration
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        {
          MeetingId: config.meetingId,
          ExternalMeetingId: config.externalMeetingId,
          MediaRegion: config.mediaRegion,
          MediaPlacement: config.mediaPlacement,
        },
        {
          AttendeeId: config.attendeeId,
          ExternalUserId: config.externalUserId,
          JoinToken: config.joinToken,
        }
      );

      // Create meeting session
      this.meetingSession = new DefaultMeetingSession(
        meetingSessionConfiguration,
        this.logger,
        this.deviceController
      );

      this.audioVideo = this.meetingSession.audioVideo;

      // Add observers
      this.setupObservers();

      // Start audio
      await this.audioVideo.start();

      // Start with muted state (PTT default)
      await this.audioVideo.realtimeMuteLocalAudio();

      this.callbacks.onConnectionStateChanged?.('connected');
      this.logger.info('Successfully joined voice session');
    } catch (error) {
      this.logger.error('Failed to join voice session:', error);
      this.callbacks.onConnectionStateChanged?.('failed');
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async leaveVoiceSession(): Promise<void> {
    if (this.audioVideo) {
      try {
        this.audioVideo.stop();
        this.callbacks.onConnectionStateChanged?.('disconnected');
      } catch (error) {
        this.logger.error('Error leaving voice session:', error);
      }
    }
    
    this.meetingSession = null;
    this.audioVideo = null;
    this.currentSpeakers.clear();
    this.currentChannelId = null;
    this.isTransmitting = false;
  }

  async startTransmitting(): Promise<void> {
    if (!this.audioVideo) {
      throw new Error('Not connected to voice session');
    }

    try {
      await this.audioVideo.realtimeUnmuteLocalAudio();
      this.isTransmitting = true;
      this.logger.info('Started transmitting');
    } catch (error) {
      this.logger.error('Failed to start transmitting:', error);
      throw error;
    }
  }

  async stopTransmitting(): Promise<void> {
    if (!this.audioVideo) {
      return;
    }

    try {
      await this.audioVideo.realtimeMuteLocalAudio();
      this.isTransmitting = false;
      this.logger.info('Stopped transmitting');
    } catch (error) {
      this.logger.error('Failed to stop transmitting:', error);
    }
  }

  async getAudioDevices(): Promise<VoiceDevice[]> {
    try {
      const devices = await this.deviceController.listAudioInputDevices();
      const outputDevices = await this.deviceController.listAudioOutputDevices();

      const inputDevices: VoiceDevice[] = devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone (${device.deviceId})`,
        kind: 'audioinput' as const,
      }));

      const outputDeviceList: VoiceDevice[] = outputDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Speaker (${device.deviceId})`,
        kind: 'audiooutput' as const,
      }));

      return [...inputDevices, ...outputDeviceList];
    } catch (error) {
      this.logger.error('Failed to list audio devices:', error);
      return [];
    }
  }

  async selectAudioInputDevice(deviceId: string): Promise<void> {
    try {
      await this.deviceController.chooseAudioInputDevice(deviceId);
      this.logger.info(`Selected audio input device: ${deviceId}`);
    } catch (error) {
      this.logger.error('Failed to select audio input device:', error);
      throw error;
    }
  }

  async selectAudioOutputDevice(deviceId: string): Promise<void> {
    try {
      await this.deviceController.chooseAudioOutputDevice(deviceId);
      this.logger.info(`Selected audio output device: ${deviceId}`);
    } catch (error) {
      this.logger.error('Failed to select audio output device:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.audioVideo !== null;
  }

  isCurrentlyTransmitting(): boolean {
    return this.isTransmitting;
  }

  getCurrentChannel(): string | null {
    return this.currentChannelId;
  }

  private setupObservers(): void {
    if (!this.audioVideo) return;

    // Audio/Video observer
    const audioVideoObserver: AudioVideoObserver = {
      audioVideoDidStart: () => {
        this.logger.info('Audio/Video started');
      },
      audioVideoDidStop: (sessionStatus: MeetingSessionStatus) => {
        this.logger.info('Audio/Video stopped:', sessionStatus);
        this.callbacks.onConnectionStateChanged?.('disconnected');
      },
      audioVideoDidStartConnecting: (reconnecting: boolean) => {
        this.logger.info('Audio/Video connecting:', reconnecting);
        this.callbacks.onConnectionStateChanged?.('connecting');
      },
    };

    this.audioVideo.addObserver(audioVideoObserver);

    // Active speaker detector
    this.audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      (activeSpeakers: string[]) => {
        const newSpeakers = new Set(activeSpeakers);
        
        // Check if speakers changed
        if (!this.areSetsEqual(this.currentSpeakers, newSpeakers)) {
          this.currentSpeakers = newSpeakers;
          this.callbacks.onSpeakersChanged?.(Array.from(newSpeakers));
        }
      }
    );

    // Device change observer
    const deviceChangeObserver: DeviceChangeObserver = {
      audioInputsChanged: async () => {
        const devices = await this.getAudioDevices();
        this.callbacks.onAudioDevicesChanged?.(devices);
      },
      audioOutputsChanged: async () => {
        const devices = await this.getAudioDevices();
        this.callbacks.onAudioDevicesChanged?.(devices);
      },
    };

    this.audioVideo.addDeviceChangeObserver(deviceChangeObserver);
  }

  private areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }
}

// DefaultActiveSpeakerPolicy is imported from the main import

export const voiceService = VoiceService.getInstance();