import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';
import User from '@/models/User';
import Chat from '@/models/Chat';

// Extend the Socket interface to include custom properties
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userName?: string;
  }
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

const connectedUsers = new Map<string, string>(); // userId -> socketId

export const initSocketIO = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }

      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (error: any) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      await connectToDatabase();
      
      if (!socket.userId || !socket.userName) {
        socket.disconnect();
        return;
      }
      
      console.log(`User connected: ${socket.userName} (${socket.userId})`);
      
      // Store user connection
      connectedUsers.set(socket.userId, socket.id);
      
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date()
      });

      // Join user to their personal room
      socket.join(socket.userId);

      // Broadcast online users
      io.emit('userOnline', {
        userId: socket.userId,
        userName: socket.userName,
        isOnline: true
      });

      // Handle sending messages
      socket.on('sendMessage', async (data) => {
        try {
          const { receiverId, message, messageType = 'text' } = data;

          // Save message to database
          const newMessage = await Chat.create({
            sender: socket.userId,
            receiver: receiverId,
            message,
            messageType
          });

          // Populate sender and receiver info
          await newMessage.populate([
            { path: 'sender', select: 'name email avatar' },
            { path: 'receiver', select: 'name email avatar' }
          ]);

          // Send to receiver if online
          const receiverSocketId = connectedUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', {
              _id: newMessage._id,
              sender: newMessage.sender,
              receiver: newMessage.receiver,
              message: newMessage.message,
              messageType: newMessage.messageType,
              isRead: newMessage.isRead,
              createdAt: newMessage.createdAt
            });
          }

          // Send back to sender (confirmation)
          socket.emit('messageSent', {
            _id: newMessage._id,
            sender: newMessage.sender,
            receiver: newMessage.receiver,
            message: newMessage.message,
            messageType: newMessage.messageType,
            isRead: newMessage.isRead,
            createdAt: newMessage.createdAt
          });

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      });

      // Handle message read status
      socket.on('markAsRead', async (data) => {
        try {
          const { messageId, senderId } = data;

          await Chat.findByIdAndUpdate(messageId, {
            isRead: true,
            readAt: new Date()
          });

          // Notify sender that message was read
          const senderSocketId = connectedUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageRead', {
              messageId,
              readBy: socket.userId,
              readAt: new Date()
            });
          }

        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Handle typing status
      socket.on('typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: true
          });
        }
      });

      socket.on('stopTyping', (data) => {
        const { receiverId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          if (!socket.userId || !socket.userName) return;
          
          console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
          
          // Remove from connected users
          connectedUsers.delete(socket.userId);
          
          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });

          // Broadcast offline status
          io.emit('userOffline', {
            userId: socket.userId,
            userName: socket.userName,
            isOnline: false,
            lastSeen: new Date()
          });

        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  });

  return io;
};

export { connectedUsers };
