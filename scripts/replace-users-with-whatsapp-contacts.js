const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// User schema
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

const User = mongoose.model('User', userSchema);

async function replaceUsersWithWhatsAppContacts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // STEP 1: Clear existing demo users
    console.log('🗑️ STEP 1: Clearing existing demo users...');
    const deletedUsers = await User.deleteMany({});
    console.log(`   Cleared ${deletedUsers.deletedCount} existing users`);

    // STEP 2: Clear existing chats
    console.log('🗑️ STEP 2: Clearing existing chats...');
    const deletedChats = await mongoose.connection.db.collection('chats').deleteMany({});
    console.log(`   Cleared ${deletedChats.deletedCount} existing chats`);

    // STEP 3: Create WhatsApp contacts as users
    console.log('\n👥 STEP 3: Creating WhatsApp contacts as users...');
    
    const whatsappContacts = [
      {
        name: 'Ravi Kumar',
        email: 'ravi.kumar@whatsapp.com', // Using WhatsApp domain
        phone: '+919937320320',
        password: 'whatsapp123',
        isOnline: true,
        lastSeen: new Date()
      },
      {
        name: 'Neha Joshi', 
        email: 'neha.joshi@whatsapp.com',
        phone: '+929967673820',
        password: 'whatsapp123',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        name: 'Your Business',
        email: 'business@whatsapp.com',
        phone: '+918329446654',
        password: 'business123',
        isOnline: true,
        lastSeen: new Date()
      }
    ];

    const createdUsers = {};
    
    for (const contactData of whatsappContacts) {
      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contactData.password, salt);
        
        // Create user
        const user = new User({
          name: contactData.name,
          email: contactData.email,
          password: hashedPassword,
          isOnline: contactData.isOnline,
          lastSeen: contactData.lastSeen,
        });
        
        await user.save();
        createdUsers[contactData.name] = user;
        createdUsers[contactData.phone] = user; // Also index by phone
        console.log(`   ✅ Created user: ${contactData.name} (${contactData.email})`);
      } catch (error) {
        console.error(`   ❌ Error creating user ${contactData.name}:`, error);
      }
    }

    // STEP 4: Create chats with proper user references
    console.log('\n💬 STEP 4: Creating WhatsApp chats with user references...');
    
    const whatsappChats = [
      {
        senderName: 'Ravi Kumar',
        receiverName: 'Your Business',
        message: "Hi, I'd like to know more about your services.",
        messageType: 'text',
        isRead: false,
        createdAt: new Date('2025-08-05T18:50:00Z'),
      },
      {
        senderName: 'Your Business',
        receiverName: 'Ravi Kumar',
        message: "Hi Ravi! Sure, I'd be happy to help you with that. Could you tell me what you're looking for?",
        messageType: 'text',
        isRead: true,
        createdAt: new Date('2025-08-05T18:50:40Z'),
      },
      {
        senderName: 'Neha Joshi',
        receiverName: 'Your Business',
        message: "Hi, I saw your ad. Can you share more details?",
        messageType: 'text',
        isRead: false,
        createdAt: new Date('2025-08-05T19:06:50Z'),
      },
      {
        senderName: 'Your Business',
        receiverName: 'Neha Joshi',
        message: "Hi Neha! Absolutely. We offer curated home decor pieces—are you looking for nameplates, wall art, or something else?",
        messageType: 'text',
        isRead: false,
        createdAt: new Date('2025-08-05T19:07:25Z'),
      }
    ];

    const chatsData = [];
    
    for (const chatData of whatsappChats) {
      const sender = createdUsers[chatData.senderName];
      const receiver = createdUsers[chatData.receiverName];
      
      if (!sender || !receiver) {
        console.log(`   ⚠️ Skipping chat: ${chatData.senderName} -> ${chatData.receiverName} (user not found)`);
        continue;
      }
      
      const chat = {
        sender: sender._id,
        receiver: receiver._id,
        message: chatData.message,
        messageType: chatData.messageType,
        isRead: chatData.isRead,
        createdAt: chatData.createdAt,
        updatedAt: chatData.createdAt,
        __v: 0
      };
      
      chatsData.push(chat);
      console.log(`   📝 Prepared chat: ${chatData.senderName} -> ${chatData.receiverName}`);
      console.log(`      Message: "${chatData.message.substring(0, 50)}..."`);
    }

    if (chatsData.length > 0) {
      await mongoose.connection.db.collection('chats').insertMany(chatsData);
      console.log(`   ✅ Inserted ${chatsData.length} WhatsApp chats`);
    }

    // STEP 5: Verify final state
    console.log('\n📊 STEP 5: Final verification...');
    
    const totalUsers = await User.countDocuments();
    const users = await User.find({}).select('name email isOnline');
    console.log(`\n✅ Created ${totalUsers} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.isOnline ? 'Online' : 'Offline'}`);
    });

    const totalChats = await mongoose.connection.db.collection('chats').countDocuments();
    const chats = await mongoose.connection.db.collection('chats').find({}).sort({ createdAt: 1 }).toArray();
    console.log(`\n💬 Created ${totalChats} chats:`);
    
    for (const chat of chats) {
      const sender = await User.findById(chat.sender);
      const receiver = await User.findById(chat.receiver);
      const date = new Date(chat.createdAt).toLocaleString();
      console.log(`[${date}] ${sender?.name || 'Unknown'} -> ${receiver?.name || 'Unknown'}`);
      console.log(`   "${chat.message}"`);
      console.log(`   Read: ${chat.isRead}\n`);
    }

    await mongoose.disconnect();
    console.log('🎉 WhatsApp contacts and chats created successfully!');
    console.log('💡 Your web interface should now show Ravi Kumar and Neha Joshi instead of demo users.');
    console.log('\n🔑 Login credentials:');
    console.log('Business Account: business@whatsapp.com / business123');
    console.log('Ravi Kumar: ravi.kumar@whatsapp.com / whatsapp123');
    console.log('Neha Joshi: neha.joshi@whatsapp.com / whatsapp123');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

replaceUsersWithWhatsAppContacts();
