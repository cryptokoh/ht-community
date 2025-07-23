# Claude SDK Voice Integration

## Overview

The Healing Temple app now includes **Claude-powered voice credit submission**, allowing members to naturally describe their sales assistance and have Claude AI process it conversationally.

## Architecture

### Voice Processing Flow
```
User Voice → Speech-to-Text → Claude Processing → Text-to-Speech → User Hears Response
     ↓
Natural conversation continues until Claude has enough info
     ↓
Credit automatically calculated and submitted
```

### Tech Stack
- **Frontend**: React Native with Expo Audio & Speech APIs
- **Backend**: Claude SDK (Anthropic) + Node.js
- **Speech Services**: Device native speech recognition & synthesis
- **AI Model**: Claude 3 Sonnet for conversational intelligence

## Features

### 🎤 Natural Voice Interface
- **Tap to Record**: Simple voice recording with visual feedback
- **Real-time Processing**: Immediate transcription and AI analysis
- **Conversational Flow**: Claude asks follow-up questions naturally
- **Text-to-Speech**: AI responses spoken back to user

### 🧠 Claude Intelligence
- **Context Awareness**: Remembers conversation history
- **Natural Language Understanding**: Processes casual descriptions
- **Smart Questions**: Asks relevant follow-ups when info is missing
- **Confidence Scoring**: Rates submission reliability (0-100%)

### 💰 Smart Credit Calculation
- **Assistance Level Detection**: Automatically categorizes help type
- **Dynamic Pricing**: 3-18% based on complexity level
- **Auto-Approval**: High confidence submissions (>80%) approved instantly
- **Staff Review**: Lower confidence submissions flagged for review

## Example Conversation

**User**: *"I helped sell a yoga mat to Sarah around 2pm"*

**Claude**: *"That's great! What kind of help did you provide? Did you just recommend the yoga mat, or did you help her choose between different options?"*

**User**: *"I explained the different materials and helped her pick the eco-friendly one that was best for hot yoga"*

**Claude**: *"Perfect! That sounds like detailed product consultation. I'm calculating $8.50 in store credit for your assistance. Should I submit this claim?"*

**User**: *"Yes, submit it"*

**Claude**: *"Done! Your credit claim has been approved and $8.50 has been added to your account. Thanks for helping our community!"*

## Implementation Details

### Backend Integration

```typescript
// Claude Service
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Natural conversation processing
const message = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1500,
  temperature: 0.7,
  system: `You are an AI assistant for The Healing Temple store credit system...`,
  messages: [
    { role: 'user', content: transcriptText }
  ]
});
```

### Mobile App Voice UI

```typescript
// Voice recording with animated feedback
const VoiceButton = () => (
  <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
    <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
      <Icon name={isRecording ? 'stop' : 'mic'} size={32} color="#fff" />
    </TouchableOpacity>
  </Animated.View>
);

// Text-to-speech for AI responses
await VoiceService.speak(claudeResponse.conversationalResponse, {
  pitch: 1.0,
  rate: 0.85,
});
```

### Speech-to-Text Integration

```typescript
// Native device speech recognition
const transcription = await VoiceService.transcribeAudio(recording.uri);

// In production, integrate with:
// - Google Speech-to-Text API
// - Azure Cognitive Services  
// - AWS Transcribe
// - Apple/Google on-device recognition
```

## Configuration

### Environment Variables
```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Speech Services (optional - uses device by default)
GOOGLE_SPEECH_API_KEY=your-google-key
AZURE_SPEECH_KEY=your-azure-key
AWS_TRANSCRIBE_REGION=us-west-2
```

### Package Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.24.2",
  "expo-av": "~13.4.1",
  "expo-speech": "~11.3.0",
  "react-native-voice": "^3.2.4"
}
```

## Voice UX Design

### Visual Feedback
- **Pulsing Animation**: During recording
- **Processing Indicator**: While Claude thinks
- **Speaking Animation**: During text-to-speech
- **Conversation Bubbles**: Chat-like interface

### Audio Cues
- **Record Start**: Subtle beep
- **Record Stop**: Processing sound
- **AI Speaking**: Natural voice synthesis
- **Success**: Positive confirmation sound

### Accessibility
- **Voice Commands**: "Submit", "Cancel", "Repeat"
- **Visual Text**: All spoken content shown on screen
- **Large Touch Targets**: Easy mic button access
- **Screen Reader Support**: VoiceOver/TalkBack compatible

## Advantages Over OpenAI GPT

### Why Claude for Voice?
1. **Conversational Excellence**: More natural dialogue flow
2. **Context Retention**: Better memory across turns
3. **Safety**: Built-in content filtering
4. **Reliability**: More consistent responses
5. **Reasoning**: Better at complex logic and edge cases

### Claude vs GPT Comparison
```
Claude Advantages:
✅ More natural conversations
✅ Better context awareness  
✅ Safer, more reliable outputs
✅ Better at structured reasoning
✅ More helpful follow-up questions

GPT Advantages:
✅ Faster response times
✅ More plugins/integrations
✅ Lower cost per token
✅ More training data
```

## Production Considerations

### Performance Optimization
- **Streaming Responses**: Real-time Claude output
- **Caching**: Cache common responses
- **Fallbacks**: Graceful degradation when Claude unavailable
- **Rate Limiting**: Prevent API abuse

### Security & Privacy
- **Audio Encryption**: Encrypt voice recordings
- **Data Retention**: Delete audio after processing
- **Access Control**: User authentication required
- **Content Filtering**: Block inappropriate submissions

### Scalability
- **API Limits**: Monitor Claude API usage
- **Concurrent Users**: Queue processing for high load
- **Regional Deployment**: Reduce latency globally
- **Cost Management**: Optimize token usage

## Getting Started

1. **Get Claude API Key**:
   ```bash
   # Sign up at console.anthropic.com
   export ANTHROPIC_API_KEY=sk-ant-api03-your-key
   ```

2. **Install Dependencies**:
   ```bash
   npm install @anthropic-ai/sdk
   expo install expo-av expo-speech
   ```

3. **Enable Voice Features**:
   ```typescript
   // In App.tsx, add voice screen to navigation
   <Stack.Screen name="VoiceCredit" component={VoiceCreditSubmissionScreen} />
   ```

4. **Test Voice Submission**:
   - Open app → Navigate to Credits → Voice Submission
   - Tap microphone → Speak naturally about sales help
   - Listen to Claude's response → Continue conversation
   - Review and submit final credit claim

The voice integration transforms credit submission from a tedious form-filling process into a natural conversation, making it more accessible and enjoyable for Healing Temple community members! 🎙️✨