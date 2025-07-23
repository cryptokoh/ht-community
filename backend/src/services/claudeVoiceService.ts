import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface VoiceProcessingContext {
  userId: string;
  conversationHistory?: string[];
  isFollowUp?: boolean;
}

interface ClaudeVoiceResult {
  processedData: any;
  assistanceType: string;
  confidenceScore: number;
  estimatedCredit: number;
  needsFollowUp: boolean;
  followUpQuestions?: string[];
  conversationalResponse: string;
  shouldSpeak: boolean;
}

export class ClaudeVoiceService {
  
  static async processVoiceInput(
    transcriptText: string,
    context: VoiceProcessingContext
  ): Promise<ClaudeVoiceResult> {
    try {
      const conversationHistory = context.conversationHistory || [];
      const isFollowUp = context.isFollowUp || false;

      const systemPrompt = `You are an AI assistant for The Healing Temple store credit system. You're having a natural conversation with a community member about their sales assistance contribution.

Your role is to:
1. Extract details about what they helped sell and how they assisted
2. Ask natural follow-up questions if information is missing
3. Calculate appropriate store credit (3-18% based on assistance level)
4. Respond in a warm, conversational tone that matches The Healing Temple's healing/spiritual community vibe

Assistance Types & Credit Rates:
- Simple recommendation (3%): "I suggested they try the lavender oil"
- Direct assistance (7%): "I helped them choose between different crystals" 
- Detailed consultation (12%): "I explained chakra balancing and recommended specific stones"
- Complex problem-solving (18%): "I created a custom wellness plan with multiple products"

Respond with natural, spoken language that sounds good when read aloud by text-to-speech. Use "you" and "I" naturally.

Previous conversation: ${conversationHistory.join('\n')}`;

      const userMessage = isFollowUp 
        ? `Here's my follow-up response: "${transcriptText}"`
        : `I want to submit a credit claim. Here's what happened: "${transcriptText}"`;

      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      });

      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : 'I had trouble processing that. Could you try again?';

      // Parse Claude's response for structured data
      const analysis = this.extractStructuredData(responseText, transcriptText);

      const result: ClaudeVoiceResult = {
        processedData: {
          originalTranscript: transcriptText,
          claudeAnalysis: responseText,
          extractedDetails: analysis.details,
          conversationContext: [...conversationHistory, transcriptText, responseText],
          processedAt: new Date().toISOString(),
        },
        assistanceType: analysis.assistanceType,
        confidenceScore: analysis.confidence,
        estimatedCredit: analysis.estimatedCredit,
        needsFollowUp: analysis.needsMoreInfo,
        followUpQuestions: analysis.followUpQuestions,
        conversationalResponse: this.makeConversational(responseText),
        shouldSpeak: true, // Always speak responses for voice interaction
      };

      logger.info(`Claude voice processing completed for user ${context.userId}`);
      return result;

    } catch (error) {
      logger.error('Claude voice processing error:', error);
      
      return {
        processedData: { error: 'Processing failed', originalText: transcriptText },
        assistanceType: 'recommendation',
        confidenceScore: 0.3,
        estimatedCredit: 1,
        needsFollowUp: false,
        conversationalResponse: "I'm sorry, I had trouble understanding that. Could you tell me again about how you helped with a sale?",
        shouldSpeak: true,
      };
    }
  }

  private static extractStructuredData(claudeResponse: string, originalText: string) {
    // Simple extraction logic - in production, you might make Claude return JSON
    const lowerResponse = claudeResponse.toLowerCase();
    
    let assistanceType = 'recommendation';
    let confidence = 0.6;
    let estimatedCredit = 2;
    let needsMoreInfo = false;
    let followUpQuestions: string[] = [];

    // Detect assistance level
    if (lowerResponse.includes('consultation') || lowerResponse.includes('explained') || lowerResponse.includes('educated')) {
      assistanceType = 'consultation';
      estimatedCredit = 8;
      confidence = 0.8;
    } else if (lowerResponse.includes('problem') || lowerResponse.includes('solved') || lowerResponse.includes('custom')) {
      assistanceType = 'problem_solving';
      estimatedCredit = 12;
      confidence = 0.9;
    } else if (lowerResponse.includes('helped') || lowerResponse.includes('assisted') || lowerResponse.includes('guided')) {
      assistanceType = 'assistance';
      estimatedCredit = 5;
      confidence = 0.75;
    }

    // Detect if more information is needed
    if (claudeResponse.includes('?') || lowerResponse.includes('tell me more') || lowerResponse.includes('what time') || lowerResponse.includes('which product')) {
      needsMoreInfo = true;
      // Extract questions (simple regex)
      const questionMatches = claudeResponse.match(/[^.!]*\?[^.!]*/g);
      if (questionMatches) {
        followUpQuestions = questionMatches.map(q => q.trim());
      }
    }

    return {
      assistanceType,
      confidence,
      estimatedCredit,
      needsMoreInfo,
      followUpQuestions,
      details: {
        products: this.extractProducts(originalText),
        timeFrame: this.extractTime(originalText),
        customerInfo: this.extractCustomerInfo(originalText),
      }
    };
  }

  private static makeConversational(text: string): string {
    // Ensure the response sounds natural when spoken
    return text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static extractProducts(text: string): string[] {
    const commonProducts = [
      'crystals?', 'oils?', 'candles?', 'incense', 'yoga mat', 'meditation cushion',
      'sage', 'lavender', 'amethyst', 'quartz', 'tarot', 'books?', 'tea'
    ];
    
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    commonProducts.forEach(product => {
      const pattern = new RegExp(product, 'i');
      if (pattern.test(lowerText)) {
        found.push(product.replace('?', ''));
      }
    });
    
    return found;
  }

  private static extractTime(text: string): string | null {
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /(morning|afternoon|evening|noon)/i,
      /(today|yesterday|earlier)/i
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  private static extractCustomerInfo(text: string): string {
    // Extract customer references while being privacy-conscious
    const patterns = [
      /customer/i,
      /person/i,
      /someone/i,
      /they/i,
      /member/i,
      /visitor/i
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return 'customer mentioned';
      }
    }
    
    return 'no customer reference';
  }

  static async generateSpokenResponse(data: any): Promise<string> {
    // Generate a natural spoken response for complex scenarios
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Faster model for quick responses
        max_tokens: 300,
        temperature: 0.8,
        system: `Generate a brief, natural spoken response for a store credit submission. Be warm and conversational, like talking to a friend. Keep it under 2 sentences and make it sound natural when read by text-to-speech.`,
        messages: [
          { role: 'user', content: `Generate a response for: ${JSON.stringify(data)}` }
        ]
      });

      const response = message.content[0].type === 'text' 
        ? message.content[0].text 
        : "Thanks for that information!";

      return this.makeConversational(response);
      
    } catch (error) {
      logger.error('Error generating spoken response:', error);
      return "Thanks for submitting your credit claim!";
    }
  }
}