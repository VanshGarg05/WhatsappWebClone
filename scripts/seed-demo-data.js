const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Import models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Demo users data
const demoUsers = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'password123',
    isOnline: true,
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    name: 'Mike Wilson',
    email: 'mike.wilson@example.com',
    password: 'password123',
    isOnline: true,
  },
  {
    name: 'Emma Davis',
    email: 'emma.davis@example.com',
    password: 'password123',
    isOnline: false,
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    name: 'Alex Brown',
    email: 'alex.brown@example.com',
    password: 'password123',
    isOnline: true,
  }
];

// Demo messages
const demoMessages = [
  {
    senderEmail: 'john.smith@example.com',
    receiverEmail: 'sarah.johnson@example.com',
    message: 'Hey Sarah! How are you doing?',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    senderEmail: 'sarah.johnson@example.com',
    receiverEmail: 'john.smith@example.com',
    message: "Hi John! I'm doing great, thanks for asking. How about you?",
    createdAt: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
  },
  {
    senderEmail: 'john.smith@example.com',
    receiverEmail: 'sarah.johnson@example.com',
    message: "I'm good too! Working on an exciting new project.",
    createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
  },
  {
    senderEmail: 'mike.wilson@example.com',
    receiverEmail: 'emma.davis@example.com',
    message: 'Emma, did you see the latest updates on the project?',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    senderEmail: 'emma.davis@example.com',
    receiverEmail: 'mike.wilson@example.com',
    message: 'Yes, I saw them! They look really promising.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 1000), // 2 hours ago + 30 seconds
  },
  {
    senderEmail: 'alex.brown@example.com',
    receiverEmail: 'john.smith@example.com',
    message: 'John, are we still meeting tomorrow at 3 PM?',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    senderEmail: 'john.smith@example.com',
    receiverEmail: 'alex.brown@example.com',
    message: 'Yes, absolutely! Looking forward to it.',
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
  }
];

async function seedUsers() {
  console.log('Seeding demo users...');
  
  // Clear existing users (optional - comment out if you want to keep existing users)
  // await User.deleteMany({});
  
  const createdUsers = {};
  
  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        createdUsers[userData.email] = existingUser;
        continue;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      
      await user.save();
      createdUsers[userData.email] = user;
      console.log(`Created user: ${userData.name} (${userData.email})`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  return createdUsers;
}

async function seedMessages(users) {
  console.log('Seeding demo messages...');
  
  // Clear existing chat messages (optional)
  // await Chat.deleteMany({});
  
  for (const messageData of demoMessages) {
    try {
      const sender = users[messageData.senderEmail];
      const receiver = users[messageData.receiverEmail];
      
      if (!sender || !receiver) {
        console.log(`Skipping message: sender or receiver not found`);
        continue;
      }
      
      // Check if message already exists (to avoid duplicates)
      const existingMessage = await Chat.findOne({
        sender: sender._id,
        receiver: receiver._id,
        message: messageData.message,
        createdAt: messageData.createdAt
      });
      
      if (existingMessage) {
        console.log(`Message already exists, skipping...`);
        continue;
      }
      
      const chat = new Chat({
        sender: sender._id,
        receiver: receiver._id,
        message: messageData.message,
        messageType: 'text',
        isRead: Math.random() > 0.5, // Randomly mark some as read
        createdAt: messageData.createdAt,
        updatedAt: messageData.createdAt,
      });
      
      await chat.save();
      console.log(`Created message from ${sender.name} to ${receiver.name}`);
    } catch (error) {
      console.error('Error creating message:', error);
    }
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('Starting demo data seeding...');
    
    // Seed users
    const users = await seedUsers();
    
    // Seed messages
    await seedMessages(users);
    
    console.log('Demo data seeding completed successfully!');
    console.log('\nDemo login credentials:');
    demoUsers.forEach(user => {
      console.log(`Email: ${user.email}, Password: ${user.password}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

main();
