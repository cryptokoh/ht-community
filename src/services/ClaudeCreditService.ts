import { api } from './AuthService';

export interface VoiceProcessingContext {
  userId: string;
  conversationHistory?: string[];
  isFollowUp?: boolean;
}

export interface ClaudeVoiceResult {
  processedData: any;
  assistanceType: string;
  confidenceScore: number;
  estimatedCredit: number;
  needsFollowUp: boolean;
  followUpQuestions?: string[];
  conversationalResponse: string;
  shouldSpeak: boolean;
}

export class ClaudeCreditService {
  
  static async processVoiceSubmission(
    transcriptText: string,
    context: VoiceProcessingContext
  ): Promise<ClaudeVoiceResult> {
    try {
      const response = await api.post('/credits/voice-process', {
        transcript: transcriptText,
        context,
      });
      
      return response.data;
    } catch (error) {
      console.error('Voice processing failed:', error);
      
      // Fallback response
      return {
        processedData: { originalText: transcriptText, fallback: true },
        assistanceType: 'recommendation',
        confidenceScore: 0.5,
        estimatedCredit: 2,
        needsFollowUp: true,
        followUpQuestions: ['Could you tell me more details about what you helped with?'],
        conversationalResponse: "I heard what you said, but I need a bit more information. Could you tell me more details about how you helped with the sale?",
        shouldSpeak: true,
      };
    }
  }

  static async submitProcessedClaim(submissionData: any): Promise<any> {
    try {
      const response = await api.post('/credits/submit-processed', {
        processedData: submissionData.processedData,
        assistanceType: submissionData.assistanceType,
        estimatedCredit: submissionData.estimatedCredit,
        confidence: submissionData.confidence,
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to submit processed claim:', error);
      throw error;
    }
  }

  static async getCreditBalance(): Promise<{
    availableBalance: number;
    credits: Array<{
      amount: number;
      description: string;
      createdAt: string;
    }>;
  }> {
    try {
      const response = await api.get('/credits/balance');
      return response.data;
    } catch (error) {
      console.error('Failed to get credit balance:', error);
      throw error;
    }
  }

  static async getCreditHistory(page: number = 1, limit: number = 20): Promise<{
    submissions: Array<{
      id: string;
      assistanceType: string;
      claimedAmount: number;
      status: string;
      submittedAt: string;
    }>;
    pagination: {
      page: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await api.get('/credits/submissions', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get credit history:', error);
      throw error;
    }
  }
}