import Voice, { SpeechRecognizedEvent, SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export class OptimalVoiceService {
  private static isListening = false;
  private static onResultCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private static onErrorCallback: ((error: string) => void) | null = null;

  // Initialize voice recognition (FREE - uses device native)
  static async initialize(): Promise<boolean> {
    try {
      // Check if speech recognition is available
      const available = await Voice.isAvailable();
      if (!available) {
        console.warn('Speech recognition not available on this device');
        return false;
      }

      // Set up event listeners
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;

      return true;
    } catch (error) {
      console.error('Voice initialization failed:', error);
      return false;
    }
  }

  // Start listening (FREE - no API calls)
  static async startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.onResultCallback = onResult;
      this.onErrorCallback = onError;

      const options = {
        // Use device's preferred language
        language: Platform.OS === 'ios' ? 'en-US' : 'en_US',
        // Return partial results for real-time feedback
        partialResults: true,
        // Maximize accuracy
        maxResults: 1,
        // Continuous listening mode
        continuous: false,
      };

      await Voice.start(Platform.OS === 'ios' ? options.language : options.language.replace('-', '_'));
      this.isListening = true;
      
      console.log('Started listening with device native speech recognition');
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.onErrorCallback?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Stop listening
  static async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
      console.log('Stopped listening');
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  // Speak text using device TTS (FREE)
  static async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    language?: string;
  } = {}): Promise<void> {
    try {
      const speechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8, // Slightly slower for clarity
        ...options,
      };

      // Stop any current speech
      if (await Speech.isSpeakingAsync()) {
        Speech.stop();
      }

      await Speech.speak(text, speechOptions);
      console.log('Speaking:', text.substring(0, 50) + '...');
    } catch (error) {
      console.error('TTS failed:', error);
    }
  }

  // Event handlers
  private static onSpeechStart = (e: any) => {
    console.log('Speech started');
  };

  private static onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    console.log('Speech recognized');
  };

  private static onSpeechEnd = (e: any) => {
    console.log('Speech ended');
    this.isListening = false;
  };

  private static onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech error:', e.error);
    this.isListening = false;
    this.onErrorCallback?.(e.error?.message || 'Speech recognition error');
  };

  private static onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const result: VoiceRecognitionResult = {
        text: e.value[0],
        confidence: 0.9, // Native recognition typically high confidence
        isFinal: true,
      };
      
      console.log('Final speech result:', result.text);
      this.onResultCallback?.(result);
    }
  };

  private static onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const result: VoiceRecognitionResult = {
        text: e.value[0],
        confidence: 0.7, // Lower confidence for partial results
        isFinal: false,
      };
      
      console.log('Partial speech result:', result.text);
      this.onResultCallback?.(result);
    }
  };

  // Cleanup
  static async cleanup(): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }
      
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
      
      Voice.destroy().then(Voice.removeAllListeners);
      
      this.onResultCallback = null;
      this.onErrorCallback = null;
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Utility methods
  static isCurrentlyListening(): boolean {
    return this.isListening;
  }

  static async isSpeaking(): Promise<boolean> {
    return await Speech.isSpeakingAsync();
  }

  static async getAvailableLanguages(): Promise<string[]> {
    try {
      return await Voice.getSupportedLocales();
    } catch {
      return ['en-US'];
    }
  }
}