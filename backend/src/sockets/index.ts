import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function initializeSocketHandlers(io: Server) {
  // Socket authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Fetch user details
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.user?.firstName} ${socket.user?.lastName} connected via socket`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        // Verify user is participant in conversation
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!
            }
          }
        });

        if (participant && !participant.leftAt) {
          socket.join(`conversation_${conversationId}`);
          socket.emit('joined_conversation', { conversationId });
          logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', { message: 'Access denied to conversation' });
        }
      } catch (error) {
        logger.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      socket.emit('left_conversation', { conversationId });
      logger.info(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      messageType?: string;
      replyToMessageId?: string;
    }) => {
      try {
        const { conversationId, content, messageType = 'TEXT', replyToMessageId } = data;

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!
            }
          }
        });

        if (!participant || participant.leftAt) {
          socket.emit('error', { message: 'Access denied to conversation' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId!,
            content: content.trim(),
            messageType,
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

        // Broadcast message to all participants in the conversation
        io.to(`conversation_${conversationId}`).emit('new_message', message);
        
        logger.info(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        logger.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        user: socket.user,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    // Handle whiteboard collaboration
    socket.on('join_whiteboard', async (roomId: string) => {
      try {
        // Verify user has access to whiteboard room
        const participant = await prisma.whiteboardParticipant.findUnique({
          where: {
            roomId_userId: {
              roomId,
              userId: socket.userId!
            }
          }
        });

        if (participant && !participant.leftAt) {
          socket.join(`whiteboard_${roomId}`);
          socket.emit('joined_whiteboard', { roomId });
          
          // Update participant activity
          await prisma.whiteboardParticipant.update({
            where: {
              roomId_userId: {
                roomId,
                userId: socket.userId!
              }
            },
            data: {
              lastActive: new Date()
            }
          });

          // Notify others of user joining
          socket.to(`whiteboard_${roomId}`).emit('user_joined_whiteboard', {
            userId: socket.userId,
            user: socket.user
          });

          logger.info(`User ${socket.userId} joined whiteboard ${roomId}`);
        } else {
          socket.emit('error', { message: 'Access denied to whiteboard' });
        }
      } catch (error) {
        logger.error('Error joining whiteboard:', error);
        socket.emit('error', { message: 'Failed to join whiteboard' });
      }
    });

    socket.on('leave_whiteboard', async (roomId: string) => {
      socket.leave(`whiteboard_${roomId}`);
      socket.to(`whiteboard_${roomId}`).emit('user_left_whiteboard', {
        userId: socket.userId
      });
      logger.info(`User ${socket.userId} left whiteboard ${roomId}`);
    });

    // Handle whiteboard drawing updates
    socket.on('whiteboard_update', (data: {
      roomId: string;
      drawingData: any;
    }) => {
      // Broadcast drawing updates to other participants
      socket.to(`whiteboard_${data.roomId}`).emit('whiteboard_updated', {
        userId: socket.userId,
        drawingData: data.drawingData
      });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      logger.info(`User ${socket.user?.firstName} ${socket.user?.lastName} disconnected`);
      
      // Notify all rooms that user has left
      socket.rooms.forEach(room => {
        if (room.startsWith('conversation_')) {
          socket.to(room).emit('user_left_conversation', {
            userId: socket.userId
          });
        } else if (room.startsWith('whiteboard_')) {
          socket.to(room).emit('user_left_whiteboard', {
            userId: socket.userId
          });
        }
      });
    });
  });

  // Utility function to send notification to specific user
  const sendNotificationToUser = (userId: string, notification: any) => {
    io.to(`user_${userId}`).emit('notification', notification);
  };

  // Utility function to broadcast to conversation
  const broadcastToConversation = (conversationId: string, event: string, data: any) => {
    io.to(`conversation_${conversationId}`).emit(event, data);
  };

  // Export utility functions for use in routes
  io.sendNotificationToUser = sendNotificationToUser;
  io.broadcastToConversation = broadcastToConversation;

  logger.info('Socket.io handlers initialized successfully');
}