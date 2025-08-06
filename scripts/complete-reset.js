const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function completeReset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // STEP 1: Clear ALL message-related collections
    console.log('🗑️ STEP 1: Clearing all message collections...');
    
    const chatsResult = await mongoose.connection.db.collection('chats').deleteMany({});
    console.log(`   Cleared ${chatsResult.deletedCount} messages from 'chats' collection`);
    
    const processedResult = await mongoose.connection.db.collection('processedmessages').deleteMany({});
    console.log(`   Cleared ${processedResult.deletedCount} messages from 'processedmessages' collection`);
    
    // Check for any other potential message collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      if (collection.name.toLowerCase().includes('message') || 
          collection.name.toLowerCase().includes('chat') ||
          collection.name.toLowerCase().includes('conversation')) {
        try {
          const count = await mongoose.connection.db.collection(collection.name).countDocuments();
          if (count > 0) {
            const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
            console.log(`   Cleared ${result.deletedCount} documents from '${collection.name}' collection`);
          }
        } catch (error) {
          console.log(`   Could not clear ${collection.name}: ${error.message}`);
        }
      }
    }

    console.log('\n📝 STEP 2: Re-processing payloads...');
    
    // STEP 2: Re-process payloads to processedmessages
    const fs = require('fs');
    const payloadsDir = 'C:\\Users\\vansh\\Downloads\\whatsapp sample payloads';
    
    // Define ProcessedMessage schema
    const ProcessedMessageSchema = new mongoose.Schema({
      id: { type: String, sparse: true, unique: true },
      meta_msg_id: { type: String, sparse: true, unique: true },
      wa_id: { type: String, required: true, index: true },
      from: { type: String, required: true },
      to: { type: String },
      type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'status']
      },
      text: { type: String },
      status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
      },
      timestamp: { type: Number, required: true },
      contact: {
        profile: {
          name: String,
        },
        wa_id: String,
      },
      messaging_product: { type: String, default: 'whatsapp' },
      isFromUser: { type: Boolean, default: false },
    }, {
      timestamps: true,
    });

    const ProcessedMessage = mongoose.model('ProcessedMessage', ProcessedMessageSchema);

    // Process payload files
    const files = fs.readdirSync(payloadsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(payloadsDir, file));

    // Sort files to process messages before status updates
    const messageFiles = files.filter(file => file.includes('message'));
    const statusFiles = files.filter(file => file.includes('status'));
    const sortedFiles = [...messageFiles, ...statusFiles];

    for (const file of sortedFiles) {
      console.log(`   Processing: ${path.basename(file)}`);
      
      const fileContent = fs.readFileSync(file, 'utf8');
      const payload = JSON.parse(fileContent);

      const entries = payload.metaData?.entry || payload.entry || [];
      
      for (const entry of entries) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              // Process messages
              if (change.value.messages && Array.isArray(change.value.messages)) {
                for (const message of change.value.messages) {
                  const messageData = {
                    id: message.id,
                    meta_msg_id: message.id,
                    wa_id: message.from,
                    from: message.from,
                    to: message.to,
                    type: message.type,
                    timestamp: parseInt(message.timestamp),
                    messaging_product: 'whatsapp',
                    status: 'sent',
                    isFromUser: false,
                    contact: change.value.contacts?.[0] ? {
                      profile: {
                        name: change.value.contacts[0].profile?.name || `User ${message.from.slice(-4)}`,
                      },
                      wa_id: change.value.contacts[0].wa_id,
                    } : {
                      profile: {
                        name: `User ${message.from.slice(-4)}`,
                      },
                      wa_id: message.from,
                    },
                  };

                  if (message.type === 'text') {
                    messageData.text = message.text?.body;
                  }

                  await ProcessedMessage.findOneAndUpdate(
                    { id: message.id },
                    messageData,
                    { upsert: true, new: true }
                  );
                  
                  console.log(`     ✅ Processed message: "${messageData.text}" from ${messageData.contact.profile.name}`);
                }
              }

              // Process status updates
              if (change.value.statuses && Array.isArray(change.value.statuses)) {
                for (const status of change.value.statuses) {
                  const result = await ProcessedMessage.findOneAndUpdate(
                    {
                      $or: [
                        { meta_msg_id: status.meta_msg_id || status.id },
                        { id: status.meta_msg_id || status.id }
                      ]
                    },
                    {
                      status: status.status,
                      timestamp: parseInt(status.timestamp),
                    },
                    { new: true }
                  );
                  
                  if (result) {
                    console.log(`     🔄 Updated status: ${status.meta_msg_id || status.id} -> ${status.status}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('\n💬 STEP 3: Converting to chats format...');

    // STEP 3: Convert processed messages to chats format
    const processedMessages = await ProcessedMessage.find({}).sort({ timestamp: 1 });
    const chatsData = [];
    
    for (const msg of processedMessages) {
      const chatMessage = {
        sender: msg.contact.profile.name, // Use actual name instead of phone number
        receiver: "Your Business", 
        message: msg.text || `${msg.type} message`,
        messageType: msg.type || 'text',
        isRead: msg.status === 'read',
        createdAt: new Date(msg.timestamp * 1000),
        updatedAt: new Date(msg.timestamp * 1000),
        __v: 0,
        // Additional WhatsApp fields
        whatsappId: msg.id,
        whatsappStatus: msg.status,
        contactName: msg.contact.profile.name,
        phoneNumber: msg.from
      };
      
      chatsData.push(chatMessage);
      console.log(`   📝 Converting: "${msg.text}" from ${msg.contact.profile.name}`);
    }

    if (chatsData.length > 0) {
      await mongoose.connection.db.collection('chats').insertMany(chatsData);
      console.log(`   ✅ Inserted ${chatsData.length} messages into chats collection`);
    }

    // STEP 4: Verify final state
    console.log('\n📊 STEP 4: Final verification...');
    
    const finalChats = await mongoose.connection.db.collection('chats').find({}).sort({ createdAt: 1 }).toArray();
    console.log(`\n✅ Final chats collection contains ${finalChats.length} messages:`);
    
    finalChats.forEach((chat, index) => {
      const date = new Date(chat.createdAt).toLocaleString();
      console.log(`${index + 1}. [${date}] ${chat.sender || chat.contactName}`);
      console.log(`   Message: "${chat.message}"`);
      console.log(`   Status: ${chat.whatsappStatus}, Read: ${chat.isRead}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('🎉 Complete reset finished! Your web interface should now show ONLY the new payload data.');
    console.log('💡 If you still see old data, try refreshing your browser or restarting your Next.js app.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

completeReset();
