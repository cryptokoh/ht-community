import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIProcessingContext {
  userId: string;
  timestamp?: string;
}

interface AIResult {
  processedData: any;
  assistanceType: string;
  confidenceScore: number;
  estimatedCredit: number;
  reasoning: string;
}

const ASSISTANCE_TYPES = {
  recommendation: { rate: 0.03, description: 'Product recommendation' },
  assistance: { rate: 0.07, description: 'Direct customer assistance' },
  consultation: { rate: 0.12, description: 'Detailed consultation' },
  problem_solving: { rate: 0.18, description: 'Complex problem solving' },
};

export async function processWithAI(
  rawInput: string,
  context: AIProcessingContext
): Promise<AIResult> {
  try {
    const prompt = `
You are an AI assistant for The Healing Temple store credit system. A member has submitted information about their sales assistance. Please analyze their input and extract structured information.

Member Input: "${rawInput}"

Please provide a JSON response with the following structure:
{
  "products": ["list of products mentioned"],
  "customerDetails": "any customer information mentioned",
  "timeOfSale": "estimated time if mentioned",
  "assistanceType": "one of: recommendation, assistance, consultation, problem_solving",
  "assistanceDescription": "what the member did to help",
  "confidenceScore": 0.85,
  "estimatedSaleValue": 0,
  "reasoning": "explanation of your analysis"
}

Assistance types:
- recommendation: Simply suggested a product (3% credit rate)
- assistance: Helped with product selection or basic questions (7% credit rate)  
- consultation: Provided detailed education about products (12% credit rate)
- problem_solving: Solved complex customer needs or problems (18% credit rate)

Confidence scoring:
- 0.9-1.0: Very clear, specific details, verifiable information
- 0.7-0.89: Good details, mostly clear assistance description
- 0.5-0.69: Some details missing, assistance type unclear
- 0.3-0.49: Vague description, hard to verify
- 0.1-0.29: Very unclear or suspicious

Focus on being fair but conservative in credit estimates. Look for specific product names, clear assistance descriptions, and reasonable timeframes.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: rawInput }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI service');
    }

    // Parse AI response
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate and calculate credit
    const assistanceType = aiData.assistanceType || 'recommendation';
    const confidenceScore = Math.max(0.1, Math.min(1.0, aiData.confidenceScore || 0.5));
    const estimatedSaleValue = Math.max(0, aiData.estimatedSaleValue || 0);
    
    // Calculate credit based on assistance type and estimated sale value
    const baseRate = ASSISTANCE_TYPES[assistanceType as keyof typeof ASSISTANCE_TYPES]?.rate || 0.03;
    let estimatedCredit = 0;
    
    if (estimatedSaleValue > 0) {
      estimatedCredit = estimatedSaleValue * baseRate;
    } else {
      // Default credit amounts when sale value unknown
      const defaultCredits = {
        recommendation: 2,
        assistance: 5,
        consultation: 10,
        problem_solving: 15,
      };
      estimatedCredit = defaultCredits[assistanceType as keyof typeof defaultCredits] || 2;
    }

    // Apply confidence penalty
    estimatedCredit = estimatedCredit * confidenceScore;

    // Cap credits at reasonable amounts
    estimatedCredit = Math.min(estimatedCredit, 50); // Max $50 credit per submission
    estimatedCredit = Math.round(estimatedCredit * 100) / 100; // Round to cents

    const result: AIResult = {
      processedData: {
        products: aiData.products || [],
        customerDetails: aiData.customerDetails || '',
        timeOfSale: aiData.timeOfSale || context.timestamp,
        assistanceDescription: aiData.assistanceDescription || rawInput,
        estimatedSaleValue: estimatedSaleValue,
        aiAnalysis: {
          rawResponse: aiData,
          modelUsed: process.env.OPENAI_MODEL || 'gpt-4',
          processedAt: new Date().toISOString(),
        },
      },
      assistanceType,
      confidenceScore,
      estimatedCredit,
      reasoning: aiData.reasoning || 'AI analysis completed',
    };

    logger.info(`AI processing completed for user ${context.userId}: ${assistanceType} with confidence ${confidenceScore}`);
    
    return result;
  } catch (error) {
    logger.error('AI processing error:', error);
    
    // Fallback processing when AI fails
    return {
      processedData: {
        rawInput,
        fallbackProcessing: true,
        processedAt: new Date().toISOString(),
      },
      assistanceType: 'recommendation',
      confidenceScore: 0.3,
      estimatedCredit: 1, // Minimal credit for fallback
      reasoning: 'Fallback processing due to AI service error',
    };
  }
}

export async function validateSaleTimestamp(
  timestamp: string,
  tolerance: number = 2 * 60 * 60 * 1000 // 2 hours
): Promise<boolean> {
  try {
    const saleTime = new Date(timestamp);
    const now = new Date();
    const diff = Math.abs(now.getTime() - saleTime.getTime());
    
    // Check if timestamp is within reasonable range (not too far in past/future)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return diff <= maxAge && saleTime <= now;
  } catch {
    return false;
  }
}