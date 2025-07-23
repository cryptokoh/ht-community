import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { validateQRCode } from '../utils/qrCode';
import { isWithinGeofence, STORE_LOCATION } from '../utils/location';
import { logger } from '../utils/logger';

const router = Router();

// Check-in validation
const checkinValidation = [
  body('method').isIn(['QR_CODE', 'GEOFENCE', 'MANUAL']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('qrCode').optional().custom(validateQRCode),
];

// Member check-in
router.post('/checkin', [
  authenticate,
  ...checkinValidation,
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { method, latitude, longitude, qrCode, notes } = req.body;
  const userId = req.user!.id;

  // Verify user exists and get current QR code
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      qrCode: true,
      qrCodeExpiresAt: true,
      firstName: true,
      lastName: true,
      memberTier: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let locationVerified = false;

  // Validation based on check-in method
  switch (method) {
    case 'QR_CODE':
      if (!qrCode) {
        throw new AppError('QR code required for QR check-in', 400);
      }
      
      // For member QR: verify it matches user's current QR code
      if (qrCode === user.qrCode) {
        if (!user.qrCodeExpiresAt || user.qrCodeExpiresAt < new Date()) {
          throw new AppError('QR code has expired', 400);
        }
        locationVerified = true;
      } 
      // For store QR: verify it's a valid store QR code
      else if (qrCode.startsWith('STORE_')) {
        locationVerified = true;
      } else {
        throw new AppError('Invalid QR code', 400);
      }
      break;

    case 'GEOFENCE':
      if (!latitude || !longitude) {
        throw new AppError('Location coordinates required for geofence check-in', 400);
      }
      
      locationVerified = isWithinGeofence(
        { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        STORE_LOCATION,
        100 // 100 meter radius
      );
      
      if (!locationVerified) {
        throw new AppError('You must be within the store area to check in', 400);
      }
      break;

    case 'MANUAL':
      // Manual check-ins are for staff use only
      if (req.user!.role !== 'STAFF' && req.user!.role !== 'ADMIN') {
        throw new AppError('Manual check-ins require staff privileges', 403);
      }
      locationVerified = true;
      break;
  }

  // Check for recent check-ins (prevent spam)
  const recentCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    },
  });

  if (recentCheckin) {
    throw new AppError('You have already checked in recently', 400);
  }

  // Create check-in record
  const checkin = await prisma.checkin.create({
    data: {
      userId,
      checkinMethod: method,
      locationVerified,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      notes,
    },
  });

  // Get user's current credit balance
  const creditBalance = await prisma.storeCredit.aggregate({
    where: {
      userId,
      isRedeemed: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    _sum: { amount: true },
  });

  logger.info(`User ${userId} checked in using ${method}`);

  res.status(201).json({
    checkin: {
      id: checkin.id,
      method: checkin.checkinMethod,
      timestamp: checkin.createdAt,
      locationVerified: checkin.locationVerified,
    },
    user: {
      name: `${user.firstName} ${user.lastName}`,
      memberTier: user.memberTier,
    },
    creditBalance: creditBalance._sum.amount?.toNumber() || 0,
    message: `Welcome back, ${user.firstName}!`,
  });
}));

// Staff: Check-in user by QR scan
router.post('/staff/checkin/:qrCode', [
  authenticate,
  requireRole(['STAFF', 'ADMIN']),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { qrCode } = req.params;
  const staffId = req.user!.id;

  // Find user by QR code
  const user = await prisma.user.findUnique({
    where: { qrCode },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberTier: true,
      qrCodeExpiresAt: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid QR code or inactive user', 404);
  }

  if (!user.qrCodeExpiresAt || user.qrCodeExpiresAt < new Date()) {
    throw new AppError('QR code has expired', 400);
  }

  // Check for recent check-ins
  const recentCheckin = await prisma.checkin.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    },
  });

  if (recentCheckin) {
    throw new AppError('Member has already checked in recently', 400);
  }

  // Create check-in record
  const checkin = await prisma.checkin.create({
    data: {
      userId: user.id,
      checkinMethod: 'QR_CODE',
      locationVerified: true,
      notes: `Checked in by staff member ${staffId}`,
    },
  });

  // Get member's credit balance and recent activity
  const [creditBalance, recentSubmissions] = await Promise.all([
    prisma.storeCredit.aggregate({
      where: {
        userId: user.id,
        isRedeemed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: { amount: true },
    }),
    prisma.creditSubmission.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
      take: 3,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        assistanceType: true,
        claimedAmount: true,
        submittedAt: true,
      },
    }),
  ]);

  logger.info(`Staff ${staffId} checked in user ${user.id} via QR scan`);

  res.status(201).json({
    checkin: {
      id: checkin.id,
      timestamp: checkin.createdAt,
    },
    member: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      memberTier: user.memberTier,
      creditBalance: creditBalance._sum.amount?.toNumber() || 0,
      pendingSubmissions: recentSubmissions.length,
    },
    message: `${user.firstName} ${user.lastName} checked in successfully`,
  });
}));

// Get check-in history
router.get('/history', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const userId = req.user!.id;

  const [checkins, total] = await Promise.all([
    prisma.checkin.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        checkinMethod: true,
        locationVerified: true,
        createdAt: true,
        notes: true,
      },
    }),
    prisma.checkin.count({ where: { userId } }),
  ]);

  res.json({
    checkins,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Get check-in analytics
router.get('/analytics', [
  authenticate,
  query('days').optional().isInt({ min: 1, max: 365 }),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const userId = req.user!.id;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [checkins, totalCheckins, streak] = await Promise.all([
    prisma.checkin.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        checkinMethod: true,
        createdAt: true,
      },
    }),
    prisma.checkin.count({ where: { userId } }),
    calculateVisitStreak(userId),
  ]);

  // Group by method
  const methodStats = checkins.reduce((acc, checkin) => {
    acc[checkin.checkinMethod] = (acc[checkin.checkinMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by day of week
  const dayStats = checkins.reduce((acc, checkin) => {
    const day = checkin.createdAt.getDay();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  res.json({
    period: `Last ${days} days`,
    stats: {
      totalCheckins,
      recentCheckins: checkins.length,
      visitStreak: streak,
      averageVisitsPerWeek: Math.round((checkins.length / days) * 7 * 10) / 10,
    },
    methodBreakdown: methodStats,
    dayOfWeekBreakdown: dayStats,
  });
}));

// Helper function to calculate visit streak
async function calculateVisitStreak(userId: string): Promise<number> {
  const checkins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (checkins.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const checkin of checkins) {
    const checkinDate = new Date(checkin.createdAt);
    checkinDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

export { router as checkinRouter };