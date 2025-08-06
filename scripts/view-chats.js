const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function viewChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // Get messages from chats collection
    const chats = await mongoose.connection.db.collection('chats').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`📊 Latest 10 messages from 'chats' collection:\n`);
    
    chats.forEach((chat, index) => {
      const date = new Date(chat.createdAt).toLocaleString();
      console.log(`${index + 1}. [${date}]`);
      console.log(`   From: ${chat.sender} → To: ${chat.receiver}`);
      console.log(`   Message: "${chat.message}"`);
      console.log(`   Type: ${chat.messageType}, Read: ${chat.isRead}`);
      console.log('');
    });

    // Get total count
    const totalChats = await mongoose.connection.db.collection('chats').countDocuments();
    console.log(`📈 Total messages in 'chats' collection: ${totalChats}`);

    await mongoose.disconnect();
    console.log('\n📱 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

viewChats();
