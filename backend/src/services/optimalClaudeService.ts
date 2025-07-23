import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface OptimalVoiceContext {
  userId: string;
  conversationHistory?: string[];
  isFollowUp?: boolean;
}

interface OptimalVoiceResult {
  processedData: any;
  assistanceType: string;
  confidenceScore: number;
  estimatedCredit: number;
  needsFollowUp: boolean;
  followUpQuestions?: string[];
  conversationalResponse: string;
  shouldSpeak: boolean;
  tokenUsage?: number;
}

export class OptimalClaudeService {
  
  // Use Claude 3 Haiku for optimal cost/performance ratio
  private static readonly MODEL = 'claude-3-haiku-20240307';
  
  static async processVoiceInput(
    transcriptText: string,
    context: OptimalVoiceContext
  ): Promise<OptimalVoiceResult> {
    try {
      const conversationHistory = context.conversationHistory || [];
      const isFollowUp = context.isFollowUp || false;

      // Optimized system prompt for Haiku (shorter = cheaper)
      const systemPrompt = this.getOptimizedSystemPrompt();
      
      // Craft efficient user message
      const userMessage = this.buildUserMessage(transcriptText, conversationHistory, isFollowUp);

      const startTime = Date.now();
      
      const message = await anthropic.messages.create({
        model: this.MODEL,
        max_tokens: 800, // Reduced for cost efficiency
        temperature: 0.3, // Lower temperature for more consistent responses
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });

      const processingTime = Date.now() - startTime;
      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : 'I had trouble processing that. Could you try again?';

      // Extract structured data efficiently
      const analysis = this.extractStructuredData(responseText, transcriptText);

      const result: OptimalVoiceResult = {
        processedData: {
          originalTranscript: transcriptText,
          claudeResponse: responseText,
          extractedDetails: analysis.details,
          conversationContext: [...conversationHistory, transcriptText, responseText],
          processedAt: new Date().toISOString(),
          processingTimeMs: processingTime,
          model: this.MODEL,
        },
        assistanceType: analysis.assistanceType,
        confidenceScore: analysis.confidence,
        estimatedCredit: analysis.estimatedCredit,
        needsFollowUp: analysis.needsMoreInfo,
        followUpQuestions: analysis.followUpQuestions,
        conversationalResponse: this.optimizeForSpeech(responseText),
        shouldSpeak: true,
        tokenUsage: message.usage.input_tokens + message.usage.output_tokens,
      };

      // Log cost-relevant metrics
      logger.info(`Optimal Claude processing: ${result.tokenUsage} tokens, ${processingTime}ms, $${this.estimateCost(result.tokenUsage)}`);
      
      return result;

    } catch (error) {
      logger.error('Optimal Claude processing error:', error);
      
      // Minimal fallback to save costs
      return this.getFallbackResponse(transcriptText);
    }
  }

  // Optimized system prompt (shorter = cheaper tokens)
  private static getOptimizedSystemPrompt(): string {
    return `You're an AI for The Healing Temple store credit system. Process member sales assistance claims conversationally.

Assistance types & rates:
- recommendation (3%): Basic product suggestion
- assistance (7%): Helped with selection/questions  
- consultation (12%): Detailed education/guidance
- problem_solving (18%): Complex custom solutions

Extract: products, customer info, assistance level, time.
Ask follow-ups if missing key info.
Be warm, natural, brief.`;
  }

  // Build efficient user message
  private static buildUserMessage(text: string, history: string[], isFollowUp: boolean): string {
    if (isFollowUp) {
      return `Follow-up: "${text}"`;
    }
    
    if (history.length > 0) {
      // Include only last 2 exchanges to save tokens
      const recentHistory = history.slice(-4).join(' | ');
      return `Context: ${recentHistory}\nNew input: "${text}"`;
    }
    
    return `Credit claim: "${text}"`;
  }

  // Fast structured data extraction
  private static extractStructuredData(claudeResponse: string, originalText: string) {
    const lower = claudeResponse.toLowerCase();
    
    // Quick pattern matching for assistance type
    let assistanceType = 'recommendation';
    let baseCredit = 2;
    
    if (lower.includes('consultation') || lower.includes('explained') || lower.includes('educated')) {
      assistanceType = 'consultation';
      baseCredit = 8;
    } else if (lower.includes('problem') || lower.includes('solved') || lower.includes('custom')) {
      assistanceType = 'problem_solving';
      baseCredit = 12;
    } else if (lower.includes('helped') || lower.includes('assisted') || lower.includes('guided')) {
      assistanceType = 'assistance';
      baseCredit = 5;
    }

    // Simple confidence scoring
    const hasSpecifics = /\d+|time|customer|product|help/i.test(originalText);
    const confidence = hasSpecifics ? 0.8 : 0.6;
    
    // Check for follow-up needs
    const needsMoreInfo = claudeResponse.includes('?') && lower.includes('tell me');
    
    return {
      assistanceType,
      confidence,
      estimatedCredit: Math.round(baseCredit * confidence * 100) / 100,
      needsMoreInfo,
      followUpQuestions: needsMoreInfo ? [claudeResponse.split('?')[0] + '?'] : [],
      details: {
        products: this.extractProducts(originalText),
        hasTimeframe: /\d+\s*(am|pm|morning|afternoon)/i.test(originalText),
        hasCustomerRef: /(customer|person|they|someone|member)/i.test(originalText),
      }
    };
  }

  // Optimize response for natural speech
  private static optimizeForSpeech(text: string): string {
    return text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\$(\d+\.?\d*)/g, '$1 dollars')
      .trim();
  }

  // Quick product extraction
  private static extractProducts(text: string): string[] {
    const products = ['crystal', 'oil', 'candle', 'incense', 'yoga', 'mat', 'sage', 'tea', 'book'];
    const found = products.filter(p => new RegExp(p, 'i').test(text));
    return found;
  }

  // Calculate approximate API cost
  private static estimateCost(tokens: number): string {
    // Haiku pricing: $0.25/$1.25 per 1M tokens (input/output)
    // Estimate 80% input, 20% output
    const inputCost = (tokens * 0.8) * (0.25 / 1000000);
    const outputCost = (tokens * 0.2) * (1.25 / 1000000);
    return (inputCost + outputCost).toFixed(5);
  }

  // Minimal fallback response
  private static getFallbackResponse(text: string): OptimalVoiceResult {
    return {
      processedData: { error: 'Processing failed', originalText: text },
      assistanceType: 'recommendation',
      confidenceScore: 0.4,
      estimatedCredit: 1,
      needsFollowUp: true,
      followUpQuestions: ['Could you tell me more about how you helped?'],
      conversationalResponse: "I didn't quite catch that. Could you tell me more about how you helped with a sale?",
      shouldSpeak: true,
    };
  }

  // Batch processing for multiple submissions (more efficient)
  static async processBatch(submissions: Array<{
    text: string;
    context: OptimalVoiceContext;
  }>): Promise<OptimalVoiceResult[]> {
    try {
      // Process multiple submissions in parallel for efficiency
      const promises = submissions.map(({ text, context }) => 
        this.processVoiceInput(text, context)
      );
      
      const results = await Promise.all(promises);
      
      const totalTokens = results.reduce((sum, r) => sum + (r.tokenUsage || 0), 0);
      const totalCost = this.estimateCost(totalTokens);
      
      logger.info(`Batch processed ${submissions.length} submissions: ${totalTokens} tokens, $${totalCost}`);
      
      return results;
    } catch (error) {
      logger.error('Batch processing error:', error);
      throw error;
    }
  }

  // Get usage statistics for cost monitoring
  static getUsageStats(): {
    model: string;
    costPer1MTokens: { input: number; output: number };
    averageTokensPerConversation: number;
    estimatedCostPerConversation: string;
  } {
    return {
      model: this.MODEL,
      costPer1MTokens: { input: 0.25, output: 1.25 },
      averageTokensPerConversation: 500, // Estimated
      estimatedCostPerConversation: this.estimateCost(500),
    };
  }
}