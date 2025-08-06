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

// ProcessedMessage schema (duplicated here for the script)
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
    console.log(`Processing file: ${filePath}`);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(fileContent);

    // Handle new payload format with metaData.entry
    const entries = payload.metaData?.entry || payload.entry;
    
    if (entries && Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processMessageChange(change.value, payload);
            }
          }
        }
      }
    }

    console.log(`Successfully processed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processMessageChange(value, payload) {
  // Process new messages
  if (value.messages && Array.isArray(value.messages)) {
    for (const message of value.messages) {
      await processIncomingMessage(message, value.contacts?.[0]);
    }
  }

  // Process status updates
  if (value.statuses && Array.isArray(value.statuses)) {
    for (const status of value.statuses) {
      await processStatusUpdate(status);
    }
  }
}

async function processIncomingMessage(message, contact) {
  try {
    const messageData = {
      id: message.id,
      meta_msg_id: message.id, // Store the message ID as meta_msg_id for status updates
      wa_id: message.from,
      from: message.from,
      to: message.to,
      type: message.type,
      timestamp: message.timestamp,
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
        break;
      case 'image':
        messageData.image = {
          id: message.image?.id,
          mime_type: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };
        break;
      case 'document':
        messageData.document = {
          id: message.document?.id,
          filename: message.document?.filename,
          mime_type: message.document?.mime_type,
          sha256: message.document?.sha256,
          caption: message.document?.caption,
        };
        break;
      case 'audio':
        messageData.audio = {
          id: message.audio?.id,
          mime_type: message.audio?.mime_type,
          sha256: message.audio?.sha256,
          voice: message.audio?.voice,
        };
        break;
      case 'video':
        messageData.video = {
          id: message.video?.id,
          mime_type: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };
        break;
      case 'location':
        messageData.location = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        break;
    }

    // Insert or update message
    await ProcessedMessage.findOneAndUpdate(
      { id: message.id },
      messageData,
      { upsert: true, new: true }
    );

    console.log(`Processed message: ${message.id} from ${message.from}`);
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function processStatusUpdate(status) {
  try {
    const update = {
      status: status.status,
      timestamp: status.timestamp,
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
      console.log(`Updated message status: ${status.meta_msg_id || status.id} -> ${status.status}`);
    } else {
      console.log(`Message not found for status update: ${status.meta_msg_id || status.id}`);
      console.log('Status object:', JSON.stringify(status, null, 2));
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Main function to process all JSON files in a directory
async function main() {
  await connectDB();

  const payloadsDir = process.argv[2];
  
  if (!payloadsDir) {
    console.error('Please provide the path to the payloads directory');
    console.log('Usage: node process-payloads.js <payloads_directory_path>');
    process.exit(1);
  }

  if (!fs.existsSync(payloadsDir)) {
    console.error('Payloads directory does not exist:', payloadsDir);
    process.exit(1);
  }

  // Get all JSON files in the directory
  const allFiles = fs.readdirSync(payloadsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(payloadsDir, file));

  if (allFiles.length === 0) {
    console.log('No JSON files found in the directory');
    process.exit(0);
  }

  // Sort files to process messages before status updates
  const messageFiles = allFiles.filter(file => file.includes('message'));
  const statusFiles = allFiles.filter(file => file.includes('status'));
  const otherFiles = allFiles.filter(file => !file.includes('message') && !file.includes('status'));
  
  const files = [...messageFiles, ...statusFiles, ...otherFiles];

  console.log(`Found ${files.length} JSON files to process`);
  console.log(`Message files: ${messageFiles.length}`);
  console.log(`Status files: ${statusFiles.length}`);
  console.log(`Other files: ${otherFiles.length}`);

  // Process each file in order
  for (const file of files) {
    await processPayloadFile(file);
  }

  console.log('All files processed successfully!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('Script execution error:', error);
  process.exit(1);
});
