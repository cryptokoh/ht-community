import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../../hooks/redux';
import { VoiceService } from '../../services/VoiceService';
import { ClaudeCreditService } from '../../services/ClaudeCreditService';

const { width } = Dimensions.get('window');

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isSpoken?: boolean;
}

const VoiceCreditSubmissionScreen = () => {
  const { user } = useAppSelector(state => state.auth);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeVoiceService();
    addWelcomeMessage();
    
    return () => {
      VoiceService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isRecording]);

  const initializeVoiceService = async () => {
    try {
      const permission = await VoiceService.requestPermissions();
      setHasPermission(permission);
      
      if (!permission) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access to use voice credit submission.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      text: "Hi! I'm here to help you submit your store credit claim. Just tell me about how you helped with a sale today!",
      timestamp: new Date(),
      isSpoken: false,
    };
    
    setConversation([welcomeMessage]);
    
    // Speak welcome message
    setTimeout(() => {
      speakMessage(welcomeMessage.text);
    }, 500);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Error', 'Microphone permission required');
      return;
    }

    try {
      await VoiceService.startRecording();
      setIsRecording(true);
      
      // Animate mic button
      Animated.spring(micButtonScale, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Reset mic button scale
      Animated.spring(micButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      const recording = await VoiceService.stopRecording();
      const transcription = await VoiceService.transcribeAudio(recording.uri);
      
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: transcription.text,
        timestamp: new Date(),
      };
      
      setConversation(prev => [...prev, userMessage]);

      // Process with Claude
      const claudeResponse = await ClaudeCreditService.processVoiceSubmission(
        transcription.text,
        {
          userId: user!.id,
          conversationHistory: conversation.map(m => m.text),
          isFollowUp: conversation.length > 1,
        }
      );

      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: claudeResponse.conversationalResponse,
        timestamp: new Date(),
        isSpoken: claudeResponse.shouldSpeak,
      };

      setConversation(prev => [...prev, aiMessage]);

      // Update submission data
      if (!claudeResponse.needsFollowUp) {
        setCurrentSubmission({
          assistanceType: claudeResponse.assistanceType,
          estimatedCredit: claudeResponse.estimatedCredit,
          confidence: claudeResponse.confidenceScore,
          processedData: claudeResponse.processedData,
        });
      }

      // Speak AI response
      if (claudeResponse.shouldSpeak) {
        await speakMessage(claudeResponse.conversationalResponse);
      }

    } catch (error) {
      console.error('Failed to process voice input:', error);
      Alert.alert('Error', 'Failed to process your voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakMessage = async (text: string) => {
    try {
      setIsSpeaking(true);
      await VoiceService.speak(text, {
        pitch: 1.0,
        rate: 0.85,
      });
      
      // Wait for speech to complete (approximate)
      const speechDuration = text.length * 80; // ~80ms per character
      setTimeout(() => {
        setIsSpeaking(false);
      }, speechDuration);
      
    } catch (error) {
      console.error('Failed to speak message:', error);
      setIsSpeaking(false);
    }
  };

  const submitClaim = async () => {
    if (!currentSubmission) {
      Alert.alert('Error', 'No submission data available');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Submit to backend
      await ClaudeCreditService.submitProcessedClaim(currentSubmission);
      
      Alert.alert(
        'Success!',
        `Your credit claim for $${currentSubmission.estimatedCredit.toFixed(2)} has been submitted successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset for new submission
              setConversation([]);
              setCurrentSubmission(null);
              addWelcomeMessage();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Failed to submit claim:', error);
      Alert.alert('Error', 'Failed to submit your claim. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConversation = () => (
    <ScrollView 
      style={styles.conversationContainer}
      showsVerticalScrollIndicator={false}
    >
      {conversation.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageContainer,
            message.type === 'user' ? styles.userMessage : styles.aiMessage,
          ]}
        >
          <View style={styles.messageHeader}>
            <Icon
              name={message.type === 'user' ? 'person' : 'smart-toy'}
              size={16}
              color={message.type === 'user' ? '#8B5A83' : '#4CAF50'}
            />
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <Text style={[
            styles.messageText,
            message.type === 'user' ? styles.userMessageText : styles.aiMessageText,
          ]}>
            {message.text}
          </Text>
          {message.isSpoken && (
            <TouchableOpacity
              style={styles.replayButton}
              onPress={() => speakMessage(message.text)}
            >
              <Icon name="replay" size={16} color="#666" />
              <Text style={styles.replayText}>Replay</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderMicrophoneButton = () => (
    <View style={styles.micContainer}>
      <Animated.View
        style={[
          styles.micButtonOuter,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isRecording ? 0.3 : 0,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.micButton,
          {
            transform: [{ scale: micButtonScale }],
            backgroundColor: isRecording ? '#e74c3c' : '#8B5A83',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.micButtonInner}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isSpeaking}
        >
          <Icon
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const renderSubmissionSummary = () => {
    if (!currentSubmission) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Ready to Submit</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Assistance Type:</Text>
          <Text style={styles.summaryValue}>{currentSubmission.assistanceType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated Credit:</Text>
          <Text style={styles.summaryValue}>
            ${currentSubmission.estimatedCredit.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Confidence:</Text>
          <Text style={styles.summaryValue}>
            {Math.round(currentSubmission.confidence * 100)}%
          </Text>
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitClaim}
          disabled={isProcessing}
        >
          <Text style={styles.submitButtonText}>
            {isProcessing ? 'Submitting...' : 'Submit Claim'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="mic-off" size={64} color="#ccc" />
        <Text style={styles.permissionText}>
          Microphone access is required for voice credit submission
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={initializeVoiceService}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="record-voice-over" size={32} color="#8B5A83" />
        <Text style={styles.title}>Voice Credit Submission</Text>
        <Text style={styles.subtitle}>
          {isRecording 
            ? 'Listening...' 
            : isProcessing 
            ? 'Processing...' 
            : isSpeaking
            ? 'Speaking...'
            : 'Tap the microphone to start'}
        </Text>
      </View>

      {renderConversation()}
      
      <View style={styles.controlsContainer}>
        {renderMicrophoneButton()}
        
        <Text style={styles.instructionText}>
          {isRecording 
            ? 'Tap to stop recording' 
            : 'Hold and speak naturally about your sales assistance'}
        </Text>
      </View>

      {renderSubmissionSummary()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5A83',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  replayText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  controlsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  micButtonOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8B5A83',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  micButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: width - 40,
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: '#8B5A83',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VoiceCreditSubmissionScreen;