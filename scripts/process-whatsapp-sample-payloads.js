const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// MongoDB connection
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

// ProcessedMessage schema
const ProcessedMessageSchema = new mongoose.Schema({
  // WhatsApp fields
  id: { type: String, sparse: true, unique: true },
  meta_msg_id: { type: String, sparse: true, unique: true },
  wa_id: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String },
  
  // Message content
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'status']
  },
  text: { type: String },
  image: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  document: {
    id: String,
    filename: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  audio: {
    id: String,
    mime_type: String,
    sha256: String,
    voice: Boolean,
  },
  video: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String,
  },
  location: {
    latitude: Number,
    longitude: Number,
    name: String,
    address: String,
  },
  
  // Status fields
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  timestamp: { type: Number, required: true },
  
  // Contact info
  contact: {
    profile: {
      name: String,
    },
    wa_id: String,
  },
  
  // Metadata
  messaging_product: { type: String, default: 'whatsapp' },
  recipient_type: { type: String },
  
  // Additional fields for UI
  isFromUser: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Create indexes for better performance
ProcessedMessageSchema.index({ wa_id: 1, timestamp: -1 });
ProcessedMessageSchema.index({ id: 1 });
ProcessedMessageSchema.index({ meta_msg_id: 1 });
ProcessedMessageSchema.index({ status: 1 });

const ProcessedMessage = mongoose.model('ProcessedMessage', ProcessedMessageSchema);

// Process a single payload file
async function processPayloadFile(filePath) {
  try {
    console.log(`\n--- Processing file: ${path.basename(filePath)} ---`);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(fileContent);

    console.log(`Payload ID: ${payload._id}`);
    console.log(`Payload Type: ${payload.payload_type}`);

    // Handle new payload format with metaData.entry
    const entries = payload.metaData?.entry || payload.entry || [];
    
    if (!Array.isArray(entries) || entries.length === 0) {
      console.log('No entries found in payload');
      return;
    }

    for (const entry of entries) {
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processMessageChange(change.value, payload);
          }
        }
      }
    }

    console.log(`✅ Successfully processed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function processMessageChange(value, payload) {
  // Process new messages
  if (value.messages && Array.isArray(value.messages)) {
    console.log(`Found ${value.messages.length} message(s) to process`);
    for (const message of value.messages) {
      await processIncomingMessage(message, value.contacts?.[0]);
    }
  }

  // Process status updates
  if (value.statuses && Array.isArray(value.statuses)) {
    console.log(`Found ${value.statuses.length} status update(s) to process`);
    for (const status of value.statuses) {
      await processStatusUpdate(status);
    }
  }
}

async function processIncomingMessage(message, contact) {
  try {
    console.log(`  📝 Processing message: ${message.id}`);
    
    const messageData = {
      id: message.id,
      meta_msg_id: message.id, // Store the message ID as meta_msg_id for status updates
      wa_id: message.from,
      from: message.from,
      to: message.to,
      type: message.type,
      timestamp: parseInt(message.timestamp),
      messaging_product: 'whatsapp',
      status: 'sent', // Initial status for new messages
      isFromUser: false,
      contact: contact ? {
        profile: {
          name: contact.profile?.name || `User ${message.from.slice(-4)}`,
        },
        wa_id: contact.wa_id,
      } : {
        profile: {
          name: `User ${message.from.slice(-4)}`,
        },
        wa_id: message.from,
      },
    };

    // Add type-specific content
    switch (message.type) {
      case 'text':
        messageData.text = message.text?.body;
        console.log(`  💬 Text message: "${messageData.text}"`);
        break;
      case 'image':
        messageData.image = {
          id: message.image?.id,
          mime_type: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };
        console.log(`  🖼️ Image message with ID: ${messageData.image.id}`);
        break;
      case 'document':
        messageData.document = {
          id: message.document?.id,
          filename: message.document?.filename,
          mime_type: message.document?.mime_type,
          sha256: message.document?.sha256,
          caption: message.document?.caption,
        };
        console.log(`  📄 Document: ${messageData.document.filename}`);
        break;
      case 'audio':
        messageData.audio = {
          id: message.audio?.id,
          mime_type: message.audio?.mime_type,
          sha256: message.audio?.sha256,
          voice: message.audio?.voice,
        };
        console.log(`  🎵 Audio message with ID: ${messageData.audio.id}`);
        break;
      case 'video':
        messageData.video = {
          id: message.video?.id,
          mime_type: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };
        console.log(`  🎥 Video message with ID: ${messageData.video.id}`);
        break;
      case 'location':
        messageData.location = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        console.log(`  📍 Location: ${messageData.location.name}`);
        break;
    }

    // Insert or update message
    const result = await ProcessedMessage.findOneAndUpdate(
      { id: message.id },
      messageData,
      { upsert: true, new: true }
    );

    console.log(`  ✅ Saved message to DB: ${message.id} from ${messageData.contact.profile.name} (${message.from})`);
    return result;
  } catch (error) {
    console.error('  ❌ Error processing incoming message:', error);
  }
}

async function processStatusUpdate(status) {
  try {
    console.log(`  🔄 Processing status update: ${status.meta_msg_id || status.id} -> ${status.status}`);
    
    const update = {
      status: status.status,
      timestamp: parseInt(status.timestamp),
    };

    // Update message status using meta_msg_id (primary) or id as fallback
    const searchCriteria = {
      $or: [
        { meta_msg_id: status.meta_msg_id || status.id },
        { id: status.meta_msg_id || status.id }
      ]
    };

    const result = await ProcessedMessage.findOneAndUpdate(
      searchCriteria,
      update,
      { new: true }
    );

    if (result) {
      console.log(`  ✅ Updated message status: ${status.meta_msg_id || status.id} -> ${status.status}`);
      console.log(`     Message: "${result.text || result.type}" from ${result.contact?.profile?.name}`);
    } else {
      console.log(`  ⚠️ Message not found for status update: ${status.meta_msg_id || status.id}`);
      console.log('     Status object:', JSON.stringify(status, null, 2));
    }
  } catch (error) {
    console.error('  ❌ Error processing status update:', error);
  }
}

// Clear existing messages (optional)
async function clearExistingMessages() {
  try {
    const result = await ProcessedMessage.deleteMany({});
    console.log(`🗑️ Cleared ${result.deletedCount} existing messages from database`);
  } catch (error) {
    console.error('Error clearing existing messages:', error);
  }
}

// Main function to process all JSON files in a directory
async function main() {
  console.log('🚀 Starting WhatsApp Sample Payloads Processing...\n');
  
  await connectDB();

  // Ask user if they want to clear existing data
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  
  if (shouldClear) {
    await clearExistingMessages();
    console.log('');
  }

  const payloadsDir = args.find(arg => !arg.startsWith('--')) || 'C:\\Users\\vansh\\Downloads\\whatsapp sample payloads';
  
  if (!fs.existsSync(payloadsDir)) {
    console.error('❌ Payloads directory does not exist:', payloadsDir);
    process.exit(1);
  }

  // Get all JSON files in the directory
  const allFiles = fs.readdirSync(payloadsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(payloadsDir, file));

  if (allFiles.length === 0) {
    console.log('❌ No JSON files found in the directory');
    process.exit(0);
  }

  // Sort files to process messages before status updates
  const messageFiles = allFiles.filter(file => file.includes('message'));
  const statusFiles = allFiles.filter(file => file.includes('status'));
  const otherFiles = allFiles.filter(file => !file.includes('message') && !file.includes('status'));
  
  const files = [...messageFiles, ...statusFiles, ...otherFiles];

  console.log(`📊 Processing Statistics:`);
  console.log(`   Total files: ${files.length}`);
  console.log(`   Message files: ${messageFiles.length}`);
  console.log(`   Status files: ${statusFiles.length}`);
  console.log(`   Other files: ${otherFiles.length}`);
  console.log(`   Directory: ${payloadsDir}\n`);

  // Process each file in order
  for (const file of files) {
    await processPayloadFile(file);
  }

  // Show final statistics
  const totalMessages = await ProcessedMessage.countDocuments({});
  const messagesByStatus = await ProcessedMessage.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  console.log('\n📈 Final Database Statistics:');
  console.log(`   Total messages in database: ${totalMessages}`);
  console.log('   Messages by status:');
  for (const stat of messagesByStatus) {
    console.log(`     ${stat._id}: ${stat.count}`);
  }

  console.log('\n🎉 All files processed successfully!');
  
  await mongoose.disconnect();
  process.exit(0);
}

// Show usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
WhatsApp Sample Payloads Processor

Usage:
  node process-whatsapp-sample-payloads.js [directory] [options]

Arguments:
  directory     Path to the directory containing JSON payload files
                (default: ../payloads)

Options:
  --clear       Clear existing messages from database before processing
  --help, -h    Show this help message

Examples:
  node process-whatsapp-sample-payloads.js
  node process-whatsapp-sample-payloads.js ./my-payloads
  node process-whatsapp-sample-payloads.js --clear
  node process-whatsapp-sample-payloads.js ./payloads --clear
`);
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('💥 Script execution error:', error);
  process.exit(1);
});
