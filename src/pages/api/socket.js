import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '../../lib/mongodb.ts'
import User from '../../models/User.ts'
import Chat from '../../models/Chat.ts'

const connectedUsers = new Map() // userId -> socketId

export default async function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running')
  } else {
    console.log('Initializing Socket.IO server...')
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          throw new Error('No token provided')
        }

        await connectToDatabase()

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
        const user = await User.findById(decoded.userId)
        if (!user) {
          throw new Error('User not found')
        }

        socket.userId = user._id.toString()
        socket.userName = user.name
        next()
      } catch (error) {
        console.error('Socket authentication failed:', error.message)
        next(new Error('Authentication failed'))
      }
    })

    io.on('connection', async (socket) => {
      try {
        await connectToDatabase()
        
        console.log(`User connected: ${socket.userName} (${socket.userId})`)
        
        // Store user connection
        connectedUsers.set(socket.userId, socket.id)
        
        // Update user online status
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: true,
          lastSeen: new Date()
        })

        // Join user to their personal room
        socket.join(socket.userId)

        // Broadcast online users
        io.emit('userOnline', {
          userId: socket.userId,
          userName: socket.userName,
          isOnline: true
        })

        // Handle sending messages
        socket.on('sendMessage', async (data) => {
          try {
            const { receiverId, message, messageType = 'text' } = data

            // Save message to database
            const newMessage = await Chat.create({
              sender: socket.userId,
              receiver: receiverId,
              message,
              messageType
            })

            // Populate sender and receiver info
            await newMessage.populate([
              { path: 'sender', select: 'name email avatar' },
              { path: 'receiver', select: 'name email avatar' }
            ])

            const messageData = {
              _id: newMessage._id,
              sender: newMessage.sender,
              receiver: newMessage.receiver,
              message: newMessage.message,
              messageType: newMessage.messageType,
              isRead: newMessage.isRead,
              createdAt: newMessage.createdAt
            }

            // Send to receiver if online
            const receiverSocketId = connectedUsers.get(receiverId)
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('receiveMessage', messageData)
            }

            // Send back to sender (confirmation)
            socket.emit('messageSent', messageData)

          } catch (error) {
            console.error('Error sending message:', error)
            socket.emit('messageError', { error: 'Failed to send message' })
          }
        })

        // Handle message read status
        socket.on('markAsRead', async (data) => {
          try {
            const { messageId, senderId } = data

            await Chat.findByIdAndUpdate(messageId, {
              isRead: true,
              readAt: new Date()
            })

            // Notify sender that message was read
            const senderSocketId = connectedUsers.get(senderId)
            if (senderSocketId) {
              io.to(senderSocketId).emit('messageRead', {
                messageId,
                readBy: socket.userId,
                readAt: new Date()
              })
            }

          } catch (error) {
            console.error('Error marking message as read:', error)
          }
        })

        // Handle typing status
        socket.on('typing', (data) => {
          const { receiverId } = data
          const receiverSocketId = connectedUsers.get(receiverId)
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', {
              userId: socket.userId,
              userName: socket.userName,
              isTyping: true
            })
          }
        })

        socket.on('stopTyping', (data) => {
          const { receiverId } = data
          const receiverSocketId = connectedUsers.get(receiverId)
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', {
              userId: socket.userId,
              userName: socket.userName,
              isTyping: false
            })
          }
        })

        // Handle disconnect
        socket.on('disconnect', async () => {
          try {
            console.log(`User disconnected: ${socket.userName} (${socket.userId})`)
            
            // Remove from connected users
            connectedUsers.delete(socket.userId)
            
            // Update user offline status
            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen: new Date()
            })

            // Broadcast offline status
            io.emit('userOffline', {
              userId: socket.userId,
              userName: socket.userName,
              isOnline: false,
              lastSeen: new Date()
            })

          } catch (error) {
            console.error('Error handling disconnect:', error)
          }
        })

      } catch (error) {
        console.error('Socket connection error:', error)
        socket.disconnect()
      }
    })

    res.socket.server.io = io
  }
  
  res.end()
}
