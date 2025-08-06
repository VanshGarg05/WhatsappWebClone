const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function convertToChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // Get all processed messages
    const processedMessages = await mongoose.connection.db.collection('processedmessages').find({}).sort({ timestamp: 1 }).toArray();
    console.log(`📊 Found ${processedMessages.length} processed messages to convert\n`);

    // Clear existing chats collection
    const deleteResult = await mongoose.connection.db.collection('chats').deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing messages from chats collection\n`);

    // Convert processed messages to chats format
    const chatsData = [];
    
    for (const msg of processedMessages) {
      const chatMessage = {
        sender: msg.contact.wa_id || msg.from,
        receiver: "your_business_number", // You can update this
        message: msg.text || `${msg.type} message`,
        messageType: msg.type || 'text',
        isRead: msg.status === 'read',
        createdAt: new Date(msg.timestamp * 1000),
        updatedAt: new Date(msg.timestamp * 1000),
        __v: 0,
        // Additional fields from WhatsApp payload
        whatsappId: msg.id,
        whatsappStatus: msg.status,
        contactName: msg.contact.profile.name,
        phoneNumber: msg.from
      };
      
      chatsData.push(chatMessage);
      
      console.log(`📝 Converting: "${msg.text}" from ${msg.contact.profile.name} (${msg.from})`);
      console.log(`   Status: ${msg.status} → isRead: ${msg.status === 'read'}`);
      console.log(`   Date: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
      console.log('');
    }

    // Insert converted messages into chats collection
    if (chatsData.length > 0) {
      const insertResult = await mongoose.connection.db.collection('chats').insertMany(chatsData);
      console.log(`✅ Inserted ${insertResult.insertedCount} messages into chats collection\n`);
    }

    // Show final result
    const finalCount = await mongoose.connection.db.collection('chats').countDocuments();
    console.log(`📈 Final count in chats collection: ${finalCount}`);

    // Show latest messages in chats format
    const latestChats = await mongoose.connection.db.collection('chats').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('\n📱 Latest messages in chats collection:');
    latestChats.forEach((chat, index) => {
      const date = new Date(chat.createdAt).toLocaleString();
      console.log(`${index + 1}. [${date}] ${chat.contactName || chat.sender}`);
      console.log(`   Message: "${chat.message}"`);
      console.log(`   Status: ${chat.whatsappStatus}, Read: ${chat.isRead}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('📱 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

convertToChats();
