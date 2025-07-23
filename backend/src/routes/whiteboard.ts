import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Generate 6-digit invite code
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get all open boards
router.get('/open-boards', authenticateToken, async (req, res) => {
  try {
    const openBoards = await prisma.whiteboardRoom.findMany({
      where: {
        roomType: 'OPEN_BOARD',
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          },
          where: {
            leftAt: null
          }
        },
        _count: {
          select: {
            participants: {
              where: { leftAt: null }
            }
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    res.json(openBoards);
  } catch (error) {
    logger.error('Error fetching open boards:', error);
    res.status(500).json({ error: 'Failed to fetch open boards' });
  }
});

// Create new whiteboard room
router.post('/rooms', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, roomType, isPublic = false, maxParticipants } = req.body;
    const userId = req.user.userId;

    // Generate invite code for private rooms
    let inviteCode = null;
    if (roomType === 'INVITE_ROOM') {
      inviteCode = generateInviteCode();
      
      // Ensure unique invite code
      while (await prisma.whiteboardRoom.findUnique({ where: { inviteCode } })) {
        inviteCode = generateInviteCode();
      }
    }

    const room = await prisma.whiteboardRoom.create({
      data: {
        name,
        description,
        roomType,
        inviteCode,
        isPublic,
        maxParticipants,
        createdBy: userId,
        lastActivity: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        }
      }
    });

    // Auto-join creator as owner
    await prisma.whiteboardParticipant.create({
      data: {
        roomId: room.id,
        userId: userId,
        role: 'OWNER',
        lastActive: new Date()
      }
    });

    res.status(201).json({ ...room, inviteCode });
  } catch (error) {
    logger.error('Error creating whiteboard room:', error);
    res.status(500).json({ error: 'Failed to create whiteboard room' });
  }
});

// Join room by invite code
router.post('/rooms/join/:inviteCode', authenticateToken, async (req: any, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.userId;

    const room = await prisma.whiteboardRoom.findUnique({
      where: { inviteCode },
      include: {
        participants: {
          where: { leftAt: null }
        }
      }
    });

    if (!room || !room.isActive) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Check if room is full
    if (room.maxParticipants && room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if user already in room
    const existingParticipant = await prisma.whiteboardParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: userId
        }
      }
    });

    if (existingParticipant && !existingParticipant.leftAt) {
      return res.status(400).json({ error: 'Already in room' });
    }

    // Join room
    await prisma.whiteboardParticipant.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: userId
        }
      },
      update: {
        leftAt: null,
        lastActive: new Date(),
        joinedAt: new Date()
      },
      create: {
        roomId: room.id,
        userId: userId,
        role: 'PARTICIPANT',
        lastActive: new Date()
      }
    });

    // Update room activity
    await prisma.whiteboardRoom.update({
      where: { id: room.id },
      data: { lastActivity: new Date() }
    });

    res.json({ message: 'Joined room successfully', roomId: room.id });
  } catch (error) {
    logger.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Join open board
router.post('/rooms/:roomId/join', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await prisma.whiteboardRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          where: { leftAt: null }
        }
      }
    });

    if (!room || !room.isActive || !room.isPublic) {
      return res.status(404).json({ error: 'Room not found or not accessible' });
    }

    // Join room logic (same as above)
    await prisma.whiteboardParticipant.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: userId
        }
      },
      update: {
        leftAt: null,
        lastActive: new Date(),
        joinedAt: new Date()
      },
      create: {
        roomId: room.id,
        userId: userId,
        role: 'PARTICIPANT',
        lastActive: new Date()
      }
    });

    await prisma.whiteboardRoom.update({
      where: { id: room.id },
      data: { lastActivity: new Date() }
    });

    res.json({ message: 'Joined room successfully', roomId: room.id });
  } catch (error) {
    logger.error('Error joining open board:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave room
router.post('/rooms/:roomId/leave', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    await prisma.whiteboardParticipant.updateMany({
      where: {
        roomId,
        userId,
        leftAt: null
      },
      data: {
        leftAt: new Date()
      }
    });

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    logger.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Get room details
router.get('/rooms/:roomId', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await prisma.whiteboardRoom.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          },
          where: { leftAt: null }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user has access
    const isParticipant = room.participants.some(p => p.userId === userId);
    const isPublic = room.isPublic;
    const isCreator = room.createdBy === userId;

    if (!isParticipant && !isPublic && !isCreator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    logger.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

// Save whiteboard data
router.put('/rooms/:roomId/data', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const { tldrawData } = req.body;
    const userId = req.user.userId;

    // Verify user is participant
    const participant = await prisma.whiteboardParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (!participant || participant.leftAt) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update room data and activity
    await prisma.whiteboardRoom.update({
      where: { id: roomId },
      data: {
        tldrawData,
        lastActivity: new Date()
      }
    });

    // Update participant activity
    await prisma.whiteboardParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      data: {
        lastActive: new Date()
      }
    });

    res.json({ message: 'Whiteboard data saved successfully' });
  } catch (error) {
    logger.error('Error saving whiteboard data:', error);
    res.status(500).json({ error: 'Failed to save whiteboard data' });
  }
});

// Get user's rooms
router.get('/my-rooms', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await prisma.whiteboardRoom.findMany({
      where: {
        OR: [
          { createdBy: userId },
          {
            participants: {
              some: {
                userId,
                leftAt: null
              }
            }
          }
        ],
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        _count: {
          select: {
            participants: {
              where: { leftAt: null }
            }
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    res.json(rooms);
  } catch (error) {
    logger.error('Error fetching user rooms:', error);
    res.status(500).json({ error: 'Failed to fetch user rooms' });
  }
});

export { router as whiteboardRouter };