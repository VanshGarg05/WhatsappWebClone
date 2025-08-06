const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Chat Schema - make sure this matches your model
const ChatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better performance
ChatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
ChatSchema.index({ receiver: 1, isRead: 1 });

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

async function createTestUnreadMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get some user IDs from the database
    const users = await User.find().limit(5);
    
    if (users.length < 2) {
      console.log('Need at least 2 users in the database');
      return;
    }

    console.log('Found users:', users.map(u => ({ _id: u._id, name: u.name })));

    // Create some test unread messages
    // User1 sends messages to User2 (Vansh Garg)
    const sender = users.find(u => u.name.includes('User1'));
    const receiver = users.find(u => u.name.includes('Vansh') || u.email.includes('vansh'));
    
    if (!sender || !receiver) {
      console.log('Could not find sender or receiver');
      console.log('Available users:', users.map(u => u.name));
      return;
    }

    console.log(`Creating unread messages from ${sender.name} to ${receiver.name}`);

    // Create a few unread messages
    const unreadMessages = [
      {
        sender: sender._id,
        receiver: receiver._id,
        message: "Hey! This is an unread message 1",
        messageType: 'text',
        isRead: false
      },
      {
        sender: sender._id,
        receiver: receiver._id,
        message: "Another unread message 2",
        messageType: 'text',
        isRead: false
      },
      {
        sender: sender._id,
        receiver: receiver._id,
        message: "One more unread message 3",
        messageType: 'text',
        isRead: false
      }
    ];

    const createdMessages = await Chat.insertMany(unreadMessages);
    console.log('Created unread messages:', createdMessages.length);

    // Verify unread count
    const unreadCount = await Chat.countDocuments({
      sender: sender._id,
      receiver: receiver._id,
      isRead: false
    });
    
    console.log(`Total unread messages from ${sender.name}: ${unreadCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUnreadMessages();
