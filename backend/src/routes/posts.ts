import express from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all approved posts (community feed)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: {
        isApproved: true,
        approvalStatus: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            memberTier: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        comments: {
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
            isApproved: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    const total = await prisma.post.count({
      where: {
        isApproved: true,
        approvalStatus: 'APPROVED'
      }
    });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { content, postType = 'TEXT', mediaUrls, metadata } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await prisma.post.create({
      data: {
        userId,
        content: content.trim(),
        postType,
        mediaUrls,
        metadata,
        approvalStatus: 'PENDING' // Posts need approval
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            memberTier: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Post created successfully and is pending approval',
      post
    });
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add reaction to post
router.post('/:postId/reactions', authenticateToken, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { reactionType } = req.body;

    if (!['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY'].includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if post exists and is approved
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isApproved: true
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Upsert reaction (user can change reaction type)
    const reaction = await prisma.postReaction.upsert({
      where: {
        postId_userId_reactionType: {
          postId,
          userId,
          reactionType
        }
      },
      update: {
        reactionType
      },
      create: {
        postId,
        userId,
        reactionType
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      message: 'Reaction added successfully',
      reaction
    });
  } catch (error) {
    logger.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from post
router.delete('/:postId/reactions/:reactionType', authenticateToken, async (req: any, res) => {
  try {
    const { postId, reactionType } = req.params;
    const userId = req.user.userId;

    await prisma.postReaction.deleteMany({
      where: {
        postId,
        userId,
        reactionType
      }
    });

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    logger.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Add comment to post
router.post('/:postId/comments', authenticateToken, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if post exists and is approved
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isApproved: true
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        content: content.trim(),
        parentCommentId,
        isApproved: true // Auto-approve comments for now
      },
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
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get user's own posts
router.get('/my-posts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.post.count({
      where: { userId }
    });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

export { router as postRouter };