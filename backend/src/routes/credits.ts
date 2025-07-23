import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { processWithAI } from '../services/aiService';
import { ClaudeVoiceService } from '../services/claudeVoiceService';
import { logger } from '../utils/logger';

const router = Router();

// Submit credit claim
router.post('/submit', [
  authenticate,
  body('rawInput').trim().isLength({ min: 10, max: 1000 }),
  body('saleTimestamp').optional().isISO8601(),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { rawInput, saleTimestamp } = req.body;
  const userId = req.user!.id;

  try {
    // Process input with AI
    const aiResult = await processWithAI(rawInput, {
      userId,
      timestamp: saleTimestamp,
    });

    // Create credit submission
    const submission = await prisma.creditSubmission.create({
      data: {
        userId,
        rawInput,
        processedData: aiResult.processedData,
        assistanceType: aiResult.assistanceType,
        confidenceScore: aiResult.confidenceScore,
        claimedAmount: aiResult.estimatedCredit,
        status: aiResult.confidenceScore >= 0.8 ? 'APPROVED' : 'PENDING',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            memberTier: true,
          },
        },
      },
    });

    // If auto-approved, create store credit
    if (submission.status === 'APPROVED') {
      await prisma.storeCredit.create({
        data: {
          userId,
          creditSubmissionId: submission.id,
          amount: submission.claimedAmount!,
          creditType: 'earned',
          description: `Credit for ${submission.assistanceType}`,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    logger.info(`Credit submission created: ${submission.id} by user ${userId}`);

    res.status(201).json({
      submission: {
        id: submission.id,
        assistanceType: submission.assistanceType,
        claimedAmount: submission.claimedAmount,
        status: submission.status,
        confidenceScore: submission.confidenceScore,
        submittedAt: submission.submittedAt,
      },
      autoApproved: submission.status === 'APPROVED',
    });
  } catch (error) {
    logger.error('Error processing credit submission:', error);
    throw new AppError('Failed to process credit submission', 500);
  }
}));

// Get user's credit submissions
router.get('/submissions', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW']),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const userId = req.user!.id;

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const [submissions, total] = await Promise.all([
    prisma.creditSubmission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        assistanceType: true,
        claimedAmount: true,
        approvedAmount: true,
        status: true,
        confidenceScore: true,
        submittedAt: true,
        reviewedAt: true,
        reviewNotes: true,
      },
    }),
    prisma.creditSubmission.count({ where }),
  ]);

  res.json({
    submissions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Get user's store credits and balance
router.get('/balance', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const [credits, totalEarned, totalRedeemed] = await Promise.all([
    prisma.storeCredit.findMany({
      where: {
        userId,
        isRedeemed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        creditType: true,
        description: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.storeCredit.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.storeCredit.aggregate({
      where: { userId, isRedeemed: true },
      _sum: { amount: true },
    }),
  ]);

  const availableBalance = credits.reduce((sum, credit) => sum + credit.amount.toNumber(), 0);

  res.json({
    availableBalance,
    credits,
    stats: {
      totalEarned: totalEarned._sum.amount?.toNumber() || 0,
      totalRedeemed: totalRedeemed._sum.amount?.toNumber() || 0,
    },
  });
}));

// Admin: Get all pending submissions
router.get('/admin/pending', [
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const [submissions, total] = await Promise.all([
    prisma.creditSubmission.findMany({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberTier: true,
          },
        },
        sale: {
          select: {
            id: true,
            totalAmount: true,
            saleTimestamp: true,
          },
        },
      },
    }),
    prisma.creditSubmission.count({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    }),
  ]);

  res.json({
    submissions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Admin: Review credit submission
router.patch('/admin/review/:id', [
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  body('status').isIn(['APPROVED', 'REJECTED']),
  body('approvedAmount').optional().isFloat({ min: 0 }),
  body('reviewNotes').optional().trim().isLength({ max: 500 }),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { id } = req.params;
  const { status, approvedAmount, reviewNotes } = req.body;
  const reviewerId = req.user!.id;

  // Find submission
  const submission = await prisma.creditSubmission.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  if (submission.status !== 'PENDING' && submission.status !== 'UNDER_REVIEW') {
    throw new AppError('Submission already reviewed', 400);
  }

  // Update submission
  const updatedSubmission = await prisma.creditSubmission.update({
    where: { id },
    data: {
      status,
      approvedAmount: approvedAmount || submission.claimedAmount,
      reviewedBy: reviewerId,
      reviewNotes,
      reviewedAt: new Date(),
    },
  });

  // If approved, create store credit
  if (status === 'APPROVED') {
    await prisma.storeCredit.create({
      data: {
        userId: submission.userId,
        creditSubmissionId: submission.id,
        amount: approvedAmount || submission.claimedAmount!,
        creditType: 'earned',
        description: `Credit for ${submission.assistanceType} (reviewed)`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });
  }

  logger.info(`Credit submission ${id} ${status.toLowerCase()} by ${reviewerId}`);

  res.json({
    submission: updatedSubmission,
    message: `Submission ${status.toLowerCase()} successfully`,
  });
}));

// Voice processing with Claude
router.post('/voice-process', [
  authenticate,
  body('transcript').trim().isLength({ min: 5, max: 1000 }),
  body('context.userId').notEmpty(),
  body('context.conversationHistory').optional().isArray(),
  body('context.isFollowUp').optional().isBoolean(),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { transcript, context } = req.body;
  const userId = req.user!.id;

  // Ensure context userId matches authenticated user
  if (context.userId !== userId) {
    throw new AppError('User context mismatch', 403);
  }

  try {
    const result = await ClaudeVoiceService.processVoiceInput(transcript, context);
    
    logger.info(`Voice processing completed for user ${userId}: ${result.assistanceType}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Voice processing error:', error);
    throw new AppError('Failed to process voice input', 500);
  }
}));

// Submit processed credit claim
router.post('/submit-processed', [
  authenticate,
  body('processedData').isObject(),
  body('assistanceType').isIn(['recommendation', 'assistance', 'consultation', 'problem_solving']),
  body('estimatedCredit').isFloat({ min: 0 }),
  body('confidence').isFloat({ min: 0, max: 1 }),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { processedData, assistanceType, estimatedCredit, confidence } = req.body;
  const userId = req.user!.id;

  try {
    // Create credit submission with processed data
    const submission = await prisma.creditSubmission.create({
      data: {
        userId,
        rawInput: processedData.originalTranscript || 'Voice submission',
        processedData,
        assistanceType,
        confidenceScore: confidence,
        claimedAmount: estimatedCredit,
        status: confidence >= 0.8 ? 'APPROVED' : 'PENDING',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            memberTier: true,
          },
        },
      },
    });

    // If auto-approved, create store credit
    if (submission.status === 'APPROVED') {
      await prisma.storeCredit.create({
        data: {
          userId,
          creditSubmissionId: submission.id,
          amount: submission.claimedAmount!,
          creditType: 'earned',
          description: `Voice credit for ${submission.assistanceType}`,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    logger.info(`Voice credit submission created: ${submission.id} by user ${userId}`);

    res.status(201).json({
      submission: {
        id: submission.id,
        assistanceType: submission.assistanceType,
        claimedAmount: submission.claimedAmount,
        status: submission.status,
        confidenceScore: submission.confidenceScore,
        submittedAt: submission.submittedAt,
      },
      autoApproved: submission.status === 'APPROVED',
    });
  } catch (error) {
    logger.error('Error processing voice credit submission:', error);
    throw new AppError('Failed to process voice credit submission', 500);
  }
}));

export { router as creditRouter };