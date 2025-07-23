import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        memberTier: true,
        role: true,
        phone: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user's QR code
router.get('/qr-code', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        qrCode: true,
        qrCodeExpiresAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if QR code is expired
    if (user.qrCodeExpiresAt && user.qrCodeExpiresAt < new Date()) {
      // Generate new QR code
      const newQrCode = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          qrCode: newQrCode,
          qrCodeExpiresAt: expiresAt
        },
        select: {
          qrCode: true,
          qrCodeExpiresAt: true
        }
      });

      return res.json(updatedUser);
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// Refresh QR code
router.post('/qr-code/refresh', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const newQrCode = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        qrCode: newQrCode,
        qrCodeExpiresAt: expiresAt
      },
      select: {
        qrCode: true,
        qrCodeExpiresAt: true
      }
    });

    res.json({
      message: 'QR code refreshed successfully',
      ...updatedUser
    });
  } catch (error) {
    logger.error('Error refreshing QR code:', error);
    res.status(500).json({ error: 'Failed to refresh QR code' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const [checkinCount, creditSubmissions, totalCredits] = await Promise.all([
      prisma.checkin.count({
        where: { userId }
      }),
      prisma.creditSubmission.count({
        where: { userId }
      }),
      prisma.storeCredit.aggregate({
        where: { userId, isRedeemed: false },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalCheckins: checkinCount,
      totalCreditSubmissions: creditSubmissions,
      availableCredits: totalCredits._sum.amount || 0
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export { router as userRouter };