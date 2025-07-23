import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

interface VoiceRecordingResult {
  uri: string;
  duration: number;
}

interface SpeechToTextResult {
  text: string;
  confidence: number;
}

export class VoiceService {
  private static recording: Audio.Recording | null = null;
  private static isRecording = false;

  // Request permissions for microphone
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  // Start voice recording
  static async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        throw new Error('Recording already in progress');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create and configure recording
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_FORMAT_PCM_16BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      this.recording = recording;
      this.isRecording = true;
      
      console.log('Voice recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  // Stop voice recording and return result
  static async stopRecording(): Promise<VoiceRecordingResult> {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('No active recording to stop');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      
      this.isRecording = false;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      if (!uri) {
        throw new Error('Recording failed to produce audio file');
      }

      const duration = status.isLoaded ? (status.durationMillis || 0) / 1000 : 0;
      
      console.log('Voice recording stopped:', { uri, duration });
      
      return { uri, duration };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      throw error;
    } finally {
      this.recording = null;
    }
  }

  // Convert audio to text using device speech recognition
  static async transcribeAudio(audioUri: string): Promise<SpeechToTextResult> {
    try {
      // For now, we'll use a placeholder since Expo doesn't have built-in speech-to-text
      // In production, you'd integrate with:
      // - Google Speech-to-Text API
      // - Azure Cognitive Services
      // - AWS Transcribe
      // - Or use react-native-voice library
      
      console.log('Transcribing audio file:', audioUri);
      
      // Placeholder implementation
      // In real app, send audio file to transcription service
      const mockTranscription = await this.mockTranscriptionService(audioUri);
      
      return mockTranscription;
    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw error;
    }
  }

  // Mock transcription service (replace with real service)
  private static async mockTranscriptionService(audioUri: string): Promise<SpeechToTextResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock responses for testing
    const mockResponses = [
      { text: "I helped sell a yoga mat to Sarah around 2 PM today", confidence: 0.95 },
      { text: "I recommended the lavender essential oil to a customer this morning", confidence: 0.88 },
      { text: "I assisted someone with choosing crystals for meditation", confidence: 0.92 },
      { text: "I explained the benefits of sage cleansing to a new member", confidence: 0.85 },
    ];
    
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    return mockResponses[randomIndex];
  }

  // Text-to-speech for AI responses
  static async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    try {
      const defaultOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clarity
        voice: Platform.OS === 'ios' ? 'com.apple.ttsbundle.Samantha-compact' : undefined,
        ...options,
      };

      // Stop any current speech
      if (await Speech.isSpeakingAsync()) {
        Speech.stop();
      }

      await Speech.speak(text, defaultOptions);
      console.log('Speaking:', text);
    } catch (error) {
      console.error('Text-to-speech failed:', error);
      throw error;
    }
  }

  // Stop current speech
  static async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  // Check if currently recording
  static isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Check if currently speaking
  static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }

  // Get available voices (iOS only)
  static async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      if (Platform.OS === 'ios') {
        return await Speech.getAvailableVoicesAsync();
      }
      return [];
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  // Cleanup resources
  static async cleanup(): Promise<void> {
    try {
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      
      if (await this.isSpeaking()) {
        await this.stopSpeaking();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}