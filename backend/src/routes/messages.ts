import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get user's conversations
router.get('/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            leftAt: null
          }
        },
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
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                readStatus: {
                  none: {
                    userId,
                    readAt: {
                      not: null
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(conversations);
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create new conversation
router.post('/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { participantIds, name, description, conversationType = 'DIRECT' } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    // For direct conversations, limit to 2 participants total (including creator)
    if (conversationType === 'DIRECT' && participantIds.length > 1) {
      return res.status(400).json({ error: 'Direct conversations can only have 2 participants' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        conversationType,
        name,
        description,
        createdBy: userId
      }
    });

    // Add creator as admin
    await prisma.conversationParticipant.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'ADMIN'
      }
    });

    // Add other participants
    await Promise.all(
      participantIds.map((participantId: string) =>
        prisma.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: participantId,
            role: 'MEMBER'
          }
        })
      )
    );

    // Fetch complete conversation data
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
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
          }
        }
      }
    });

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: fullConversation
    });
  } catch (error) {
    logger.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant || participant.leftAt) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        replyToMessage: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        readStatus: {
          where: {
            userId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== userId && msg.readStatus.length === 0
    );

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(msg =>
          prisma.messageReadStatus.upsert({
            where: {
              messageId_userId: {
                messageId: msg.id,
                userId
              }
            },
            update: {
              readAt: new Date()
            },
            create: {
              messageId: msg.id,
              userId
            }
          })
        )
      );
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { content, messageType = 'TEXT', mediaUrl, replyToMessageId } = req.body;

    if ((!content || content.trim().length === 0) && !mediaUrl) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant || participant.leftAt) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        messageType,
        content: content?.trim(),
        mediaUrl,
        replyToMessageId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        replyToMessage: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Join conversation (for group chats)
router.post('/conversations/:conversationId/join', authenticateToken, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Check if conversation exists and is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.conversationType !== 'GROUP') {
      return res.status(404).json({ error: 'Group conversation not found' });
    }

    // Check if already a participant
    const existingParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (existingParticipant && !existingParticipant.leftAt) {
      return res.status(400).json({ error: 'Already a member of this conversation' });
    }

    // Add or re-add participant
    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      },
      update: {
        leftAt: null,
        joinedAt: new Date()
      },
      create: {
        conversationId,
        userId,
        role: 'MEMBER'
      }
    });

    res.json({ message: 'Joined conversation successfully' });
  } catch (error) {
    logger.error('Error joining conversation:', error);
    res.status(500).json({ error: 'Failed to join conversation' });
  }
});

// Leave conversation
router.post('/conversations/:conversationId/leave', authenticateToken, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        leftAt: null
      },
      data: {
        leftAt: new Date()
      }
    });

    res.json({ message: 'Left conversation successfully' });
  } catch (error) {
    logger.error('Error leaving conversation:', error);
    res.status(500).json({ error: 'Failed to leave conversation' });
  }
});

export { router as messageRouter };