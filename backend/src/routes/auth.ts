import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateQRCode } from '../utils/qrCode';
import { logger } from '../utils/logger';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone('any'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { email, password, firstName, lastName, phone } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Generate QR code for check-ins
  const qrCode = generateQRCode();
  const qrCodeExpiresAt = new Date();
  qrCodeExpiresAt.setHours(qrCodeExpiresAt.getHours() + 24); // 24 hour expiry

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      qrCode,
      qrCodeExpiresAt,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      memberTier: true,
      role: true,
      qrCode: true,
      createdAt: true,
    },
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      deviceInfo: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : null,
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    user,
    accessToken,
    refreshToken,
  });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      memberTier: true,
      role: true,
      qrCode: true,
      qrCodeExpiresAt: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update QR code if expired
  let qrCode = user.qrCode;
  let qrCodeExpiresAt = user.qrCodeExpiresAt;
  
  if (!qrCodeExpiresAt || qrCodeExpiresAt < new Date()) {
    qrCode = generateQRCode();
    qrCodeExpiresAt = new Date();
    qrCodeExpiresAt.setHours(qrCodeExpiresAt.getHours() + 24);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode, qrCodeExpiresAt },
    });
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      deviceInfo: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : null,
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  logger.info(`User logged in: ${user.email}`);

  const { passwordHash, ...userResponse } = user;
  res.json({
    user: { ...userResponse, qrCode, qrCodeExpiresAt },
    accessToken,
    refreshToken,
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find valid session
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: decoded.userId,
        expiresAt: { gt: new Date() },
      },
    });

    let validSession = null;
    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
      if (isValid) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}));

// Logout
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { refreshToken } = req.body;

  if (refreshToken && req.user) {
    // Find and delete the session
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user.id },
    });

    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
      if (isValid) {
        await prisma.userSession.delete({
          where: { id: session.id },
        });
        break;
      }
    }
  }

  logger.info(`User logged out: ${req.user?.email}`);
  res.json({ message: 'Logged out successfully' });
}));

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      memberTier: true,
      role: true,
      qrCode: true,
      qrCodeExpiresAt: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
}));

export { router as authRouter };