const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function showCurrentUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`👥 Current Users in Database (${users.length}):\n`);
    
    users.forEach((user, index) => {
      const date = new Date(user.createdAt).toLocaleString();
      const status = user.isOnline ? '🟢 Online' : '⚫ Offline';
      console.log(`${index + 1}. ${status} ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${date}`);
      console.log(`   Last Seen: ${new Date(user.lastSeen).toLocaleString()}`);
      console.log('');
    });

    // Get all chats
    const chats = await mongoose.connection.db.collection('chats').find({}).sort({ createdAt: 1 }).toArray();
    console.log(`💬 Current Chats (${chats.length}):\n`);
    
    for (const chat of chats) {
      const sender = users.find(u => u._id.toString() === chat.sender.toString());
      const receiver = users.find(u => u._id.toString() === chat.receiver.toString());
      const date = new Date(chat.createdAt).toLocaleString();
      const readStatus = chat.isRead ? '✓' : '○';
      
      console.log(`${readStatus} [${date}] ${sender?.name || 'Unknown'} → ${receiver?.name || 'Unknown'}`);
      console.log(`   "${chat.message}"`);
      console.log('');
    }

    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('===================');
    console.log('Business Account:');
    console.log('  Email: business@whatsapp.com');
    console.log('  Password: business123');
    console.log('');
    console.log('Ravi Kumar:');
    console.log('  Email: ravi.kumar@whatsapp.com');
    console.log('  Password: whatsapp123');
    console.log('');
    console.log('Neha Joshi:');
    console.log('  Email: neha.joshi@whatsapp.com');
    console.log('  Password: whatsapp123');
    console.log('\n💡 LOG OUT and LOG IN with one of these credentials to see the users in your interface!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

showCurrentUsers();
